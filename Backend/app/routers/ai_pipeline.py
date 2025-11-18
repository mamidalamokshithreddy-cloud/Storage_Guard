"""
Main FastAPI endpoints for the AI pipeline
Handles image upload, classification, LLM integration, and response selection
"""

import asyncio
import os
import hashlib
import time
import uuid
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from PIL import Image
import io
import json
import logging
from typing import Optional, Dict, Any, List
import base64
from datetime import datetime
from pathlib import Path
from app.models.llm_manager import get_llm_manager, LLMResponse, LLMResponseType
from app.models.response_agent import get_response_agent
from app.services.llm_service import get_llm_service, LLMProvider, analyze_leaf_image_llm
from app.core.config import settings

logger = logging.getLogger(__name__)

from fastapi import APIRouter
router = APIRouter()

# In-memory de-duplication for analyze-plant requests (per image digest)
# Prevents repeated rapid hits from re-calling external providers.
REQUEST_LOCKS: dict[str, asyncio.Lock] = {}
RECENT_RESULTS: dict[str, tuple[float, dict]] = {}
DEDUP_TTL_SECONDS: float = 10.0

class AskRequest(BaseModel):
    prompt: str
    # Local SLM disabled: default to external providers
    providers: str | None = "external"
    max_tokens: int | None = 400

class AskResponse(BaseModel):
    llm_responses: dict
    agent_decision: dict | None = None
    timestamp: str


@router.post("/analyze-image-llm")
async def analyze_image_llm(
    image: UploadFile = File(...),
    providers: Optional[str] = Form("auto"),  # auto|all|comma-separated like "google,openai"
    prompt: Optional[str] = Form("Analyze this leaf image for disease or pest condition. Provide diagnosis, confidence, severity, and brief reasoning."),
    debug: Optional[bool] = Form(False)
):
    """Multi-LLM image analysis using existing MultiLLMService.

    - Accepts an uploaded image, encodes to base64, and dispatches to available vision-enabled providers.
    - Uses a simple text prompt by default (can be overridden).
    - Returns per-provider responses in a normalized structure.
    """
    try:
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        img_bytes = await image.read()
        # Normalize common alias 'gemini' to use Google client under the hood
        norm_providers = providers
        if providers and providers not in ("auto", "all"):
            wanted = [p.strip().lower() for p in providers.split(',') if p.strip()]
            wanted = ["google" if p == "gemini" else p for p in wanted]
            norm_providers = ",".join(wanted)
        result = await analyze_leaf_image_llm(img_bytes, providers=norm_providers, prompt=prompt)
        if result.get("status") != "success":
            raise HTTPException(status_code=503, detail=result.get("error", "LLM analysis unavailable"))
        if debug:
            # expose provider health snapshot
            service = get_llm_service()
            result["debug"] = {"available": [p.value for p in (service.get_healthy_providers() or list(service.clients.keys()))]}
        result["timestamp"] = datetime.utcnow().isoformat()
        return JSONResponse(content=result)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Image LLM analysis failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_simple(file: UploadFile = File(...)):
    """Compatibility endpoint: analyze an uploaded image using external Multi-LLM (auto provider).

    Mirrors the user's working sample (/analyze) but delegates to our MultiLLM service instead of direct Gemini SDK.
    Returns a simple {"result": string} payload, plus provider for traceability.
    """
    try:
        if not file.content_type or not file.content_type.startswith("image/"):
            return JSONResponse(content={"error": "File must be an image"}, status_code=400)

        # Save uploaded file temporarily (to match original behavior)
        upload_dir = os.path.join(os.getcwd(), "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        data = await file.read()
        try:
            with open(file_path, "wb") as f:
                f.write(data)
        except Exception:
            # Saving failure shouldn't block analysis; continue with in-memory bytes
            pass

        # Analyze with Multi-LLM (auto-select provider, default prompt similar to sample)
        prompt = "Analyze this leaf image for disease condition."
        llm_result = await analyze_leaf_image_llm(data, providers="auto", prompt=prompt)
        if llm_result.get("status") != "success":
            return JSONResponse(content={"error": llm_result.get("error", "LLM analysis unavailable")}, status_code=503)

        # Pick first provider response with content and return as simple text
        result_text = None
        used_provider = None
        for prov, resp in (llm_result.get("responses") or {}).items():
            if resp and resp.get("content"):
                result_text = resp["content"]
                used_provider = prov
                break
        if not result_text:
            return JSONResponse(content={"error": "No provider returned content"}, status_code=502)

        return JSONResponse(content={
            "result": result_text,
            "provider": used_provider,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        logger.exception("/analyze compatibility endpoint failed")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.post("/analyze-plant")
async def analyze_plant_image(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    label: Optional[str] = Form(None),
    user_provided_label: bool = Form(False),
    enable_training: bool = Form(False),  # training disabled (classifier removed)
    llm_providers: Optional[str] = Form("all"),
    chain_mode: Optional[bool] = Form(True),
    debug: Optional[bool] = Form(False),
    run_parallel_tests: Optional[bool] = Form(False),  # tests disabled
    save_on_metrics: Optional[bool] = Form(False),     # saving disabled
    min_confidence_for_save: Optional[float] = Form(0.80),
    nutrient_activation: Optional[bool] = Form(True)
):
    try:
        start_time = datetime.now()
        request_id = str(uuid.uuid4())
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        image_data = await image.read()
        # Compute request digest for de-dup
        digest = hashlib.sha256(image_data).hexdigest()
        lock = REQUEST_LOCKS.setdefault(digest, asyncio.Lock())
        if lock.locked():
            logger.info(f"analyze-plant duplicate detected request_id={request_id} digest={digest[:8]} waiting for in-flight")
        async with lock:
            # Serve cached result if available and fresh
            now_ts = time.time()
            cached = RECENT_RESULTS.get(digest)
            if cached and (now_ts - cached[0] < DEDUP_TTL_SECONDS):
                logger.info(f"analyze-plant cache-hit request_id={request_id} digest={digest[:8]}")
                return JSONResponse(content=cached[1])

            logger.info(f"analyze-plant start request_id={request_id} llm_providers={llm_providers} debug={debug} chain_mode={chain_mode} nutrient_activation={nutrient_activation}")
            logger.info(f"analyze-plant request_id={request_id} image_size_bytes={len(image_data)} content_type={image.content_type}")
            pil_image = Image.open(io.BytesIO(image_data)).convert('RGB')
            # Prepare optimized JPEG bytes to reduce provider timeouts
            try:
                max_side = 1280
                w, h = pil_image.size
                if max(w, h) > max_side:
                    pil_image.thumbnail((max_side, max_side))
                buf = io.BytesIO()
                pil_image.save(buf, format='JPEG', quality=85, optimize=True)
                llm_image_data = buf.getvalue()
            except Exception:
                llm_image_data = image_data
        # LLM-only vision analysis
        try:
            # Normalize provider spec (respect incoming form value)
            norm_providers = llm_providers or "auto"
            if norm_providers not in ("auto", "all"):
                mapping = {
                    "gemini": "google", "gemini-2.5-flash": "google", "gemini-1.5": "google",
                    "google": "google",
                    "openai": "openai", "gpt-4o": "openai", "gpt-4": "openai",
                    "anthropic": "anthropic", "claude": "anthropic"
                }
                req = [p.strip().lower() for p in norm_providers.split(',') if p.strip()]
                req = [mapping.get(p, p) for p in req]
                # de-duplicate
                seen = set()
                req_norm = []
                for p in req:
                    if p and p not in seen:
                        seen.add(p)
                        req_norm.append(p)
                norm_providers = ",".join(req_norm) if req_norm else "auto"

            vision_prompt = (
                "Analyze this plant leaf image and return STRICT JSON only with keys: "
                "diagnosis (string), confidence (0-1), severity (0-100), category (string), "
                "alternatives (array of {label, confidence})."
            )
            llm_vision = await analyze_leaf_image_llm(llm_image_data, providers=norm_providers, prompt=vision_prompt)
            logger.info(f"analyze-plant request_id={request_id} llm_vision_status={llm_vision.get('status')} providers={llm_vision.get('providers')} requested={norm_providers}")
            if debug:
                # Log truncated responses for diagnostics
                resp_keys = list((llm_vision.get('responses') or {}).keys())
                logger.debug(f"analyze-plant request_id={request_id} response_keys={resp_keys}")
        except Exception as e:
            logger.exception(f"analyze-plant LLM vision exception request_id={request_id}")
            raise
        if llm_vision.get("status") != "success":
            raise HTTPException(status_code=503, detail=llm_vision.get("error", "LLM vision unavailable"))

        # Pick first provider response with content
        resp = None
        for _prov, r in llm_vision.get("responses", {}).items():
            if r and r.get("content"):
                resp = r
                break
        parsed = None
        if resp and resp.get("content"):
            content = resp.get("content")
            # Try to extract JSON if fenced
            try:
                text = content.strip()
                if "```json" in text:
                    s = text.find("```json") + 7
                    e = text.find("```", s)
                    if e != -1:
                        text = text[s:e].strip()
                elif "```" in text:
                    s = text.find("```") + 3
                    e = text.find("```", s)
                    if e != -1:
                        text = text[s:e].strip()
                parsed = json.loads(text)
            except Exception:
                parsed = None

        # Determine mandatory classification fields without injecting defaults when strict mode is enabled
        if parsed is None or (not parsed.get("diagnosis") and not parsed.get("label")):
            if settings.STRICT_NO_FALLBACKS:
                raise HTTPException(status_code=502, detail="LLM vision returned invalid or unstructured output (missing diagnosis)")
        predicted_class = str((parsed or {}).get("diagnosis") or (parsed or {}).get("label") or "unknown")
        try:
            confidence = float((parsed or {}).get("confidence")) if (parsed or {}).get("confidence") is not None else None
        except Exception:
            confidence = None
        # Optional fields from LLM JSON
        category = (parsed or {}).get("category")
        # normalize severity: prefer integer 0-100
        raw_sev = (parsed or {}).get("severity") or (parsed or {}).get("severity_score")
        try:
            severity = int(round(float(raw_sev))) if raw_sev is not None else None
        except Exception:
            severity = None
        reasoning = (parsed or {}).get("reasoning") or (parsed or {}).get("analysis")
        top_preds = []
        if isinstance((parsed or {}).get("alternatives"), list):
            for alt in (parsed or {}).get("alternatives"):
                try:
                    top_preds.append({"class": alt.get("label") or alt.get("diagnosis"), "confidence": float(alt.get("confidence") or 0)})
                except Exception:
                    pass
        classification_result = {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "top3_predictions": top_preds[:3],
            "model_info": {"vision": "disabled", "mode": "llm_only"}
        }

        detection = {
            "diagnosis": predicted_class,
            "category": category,
            "confidence": confidence,
            "severity": severity,
            "alternatives": top_preds[:3],
            "reasoning": reasoning,
        }

        prompt = build_plant_analysis_prompt(predicted_class, confidence, classification_result.get("top3_predictions", []))

        trace: Dict[str, Any] = {}
        if debug:
            trace = {"request_id": request_id, "classification_result": classification_result, "base_prompt": prompt}

        llm_manager = get_llm_manager()
        chained_used = False
        if chain_mode:
            # Chain requested, but local SLM is disabled. Run external providers directly.
            if llm_providers == "all":
                llm_responses = await llm_manager.get_all_responses(prompt)
            else:
                llm_responses = await get_selective_llm_responses(
                    llm_manager,
                    prompt,
                    "external" if llm_providers == "external" else (llm_providers or "external"),
                )
        elif llm_providers == "all":
            llm_responses = await llm_manager.get_all_responses(prompt)
        else:
            llm_responses = await get_selective_llm_responses(llm_manager, prompt, llm_providers)
        agent = get_response_agent()
        agent_decision = agent.select_best_response(llm_responses, f"Plant disease/pest: {predicted_class}")
        if debug:
            trace["raw_llm_responses"] = {k: {"response": v.response, "confidence": v.confidence, "error": v.error} for k, v in llm_responses.items()}
            trace["agent_scores"] = {p: {"final_score": a.final_score} for p, a in agent_decision.all_analyses.items()}
            trace["selected_provider"] = agent_decision.selected_provider

        # Prepare parallel coroutines (nutrient analysis only when enabled)
        parallel_tasks: List[asyncio.Task] = []

        # 1. Nutrient analysis activation (strict LLM path) if enabled
        #    Skip this auto-call when STRICT_NO_FALLBACKS to avoid placeholder/mock inputs
        if nutrient_activation and not settings.STRICT_NO_FALLBACKS:
            async def _nutrient_call():
                try:
                    # Minimal nutrient context derivation
                    from app.services.gemini_service import gemini_service, NutrientAnalysisRequest
                    if not gemini_service.is_available():
                        return {"error": "nutrient_llm_unavailable"}
                    # Use placeholder mandatory fields (strict upstream will reject insufficient real data)
                    analysis_request = NutrientAnalysisRequest(
                        soil_analysis={},
                        crop_info={"species": "unknown", "current_stage": "unknown", "target_yield": 0},
                        current_nutrients={},
                        deficiencies=[],
                        growth_stage="unknown",
                        target_yield=0,
                        farm_context={
                            "diagnosed_issue": predicted_class,
                            "diagnosed_category": category,
                            "diagnosed_confidence": confidence,
                            "diagnosed_severity": severity,
                        },
                        user_preferences={"treatment_focus": "pesticide_recommendations"},
                        weather_forecast=[]
                    )
                    resp = await gemini_service.get_nutrient_recommendations_async(analysis_request)
                    return {"success": getattr(resp, 'success', False), "confidence": getattr(resp, 'confidence', None)}
                except Exception as e:
                    return {"error": str(e)}
            parallel_tasks.append(asyncio.create_task(_nutrient_call()))

        # Await all parallel tasks
        parallel_results = await asyncio.gather(*parallel_tasks, return_exceptions=True)
        nutrient_meta = None
        if nutrient_activation and parallel_results:
            nutrient_meta = parallel_results[0]
        total_time = (datetime.now() - start_time).total_seconds()
        response = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "processing_time_seconds": total_time,
            "detection": detection,
            "classification": {
                "predicted_class": predicted_class,
                "confidence": confidence,
                "top_predictions": classification_result.get("top3_predictions", []),
                "model_info": classification_result.get("model_info", {})
            },
            "parallel": {
                "nutrients": nutrient_meta
            },
            "llm_responses": {p: {"response": r.response, "provider": r.provider, "model_name": r.model_name, "confidence": r.confidence, "tokens_used": r.tokens_used, "response_time": r.response_time, "error": r.error, "metadata": r.metadata} for p, r in llm_responses.items()},
            "agent_decision": {"selected_provider": agent_decision.selected_provider, "selected_response": agent_decision.selected_response, "confidence": agent_decision.confidence, "reasoning": agent_decision.reasoning, "metadata": agent_decision.metadata},
            "response_analysis": {p: {"final_score": a.final_score} for p, a in agent_decision.all_analyses.items()},
            "training": {"enabled": enable_training, "label_used": label if user_provided_label else predicted_class, "user_provided_label": user_provided_label, "queued_for_training": enable_training, "chaining_mode": chain_mode},
            "flow_mode": "chained" if chained_used else "parallel"
        }
        # Generate IPM/pesticide treatment plan using detected diagnosis
        try:
            ipm_prompt = (
                f"You are an IPM expert. Diagnosis: {predicted_class}. "
                f"Category: {category or 'unknown'}. Severity: {severity if severity is not None else 'unknown'}. "
                f"Confidence: {confidence:.2f}. Provide structured IPM with biological and chemical (if needed) options as JSON."
            )
            ipm_responses = await llm_manager.get_all_responses(ipm_prompt)
            ipm_agent = get_response_agent()
            ipm_choice = ipm_agent.select_best_response(ipm_responses, "ipm_treatment")
            chosen = ipm_responses.get(ipm_choice.selected_provider)
            ipm_json = None
            if chosen and chosen.response:
                try:
                    content = chosen.response
                    if "```json" in content:
                        start = content.find("```json") + 7
                        end = content.find("```", start)
                        content = content[start:end].strip()
                    elif "```" in content:
                        start = content.find("```") + 3
                        end = content.find("```", start)
                        if end != -1:
                            content = content[start:end].strip()
                    ipm_json = json.loads(content)
                except Exception:
                    ipm_json = None
            response["ipm"] = {
                "selected_provider": ipm_choice.selected_provider,
                "confidence": ipm_choice.confidence,
                "raw": chosen.response if chosen else None,
                "parsed": ipm_json,
            }
        except Exception:
            # non-fatal
            response["ipm"] = {"error": "ipm_generation_failed"}
        if debug:
            response["debug_trace"] = trace

        # Local SLM auto fine-tune accumulation disabled
        logger.info(f"analyze-plant done request_id={request_id} total_time={total_time:.2f}s predicted_class={predicted_class} provider={agent_decision.selected_provider}")
        # Cache successful response for short TTL to serve duplicates
        try:
            RECENT_RESULTS[digest] = (time.time(), response)
        except Exception:
            pass
        return JSONResponse(content=response)
    except Exception as e:
        logger.exception("analyze-plant fatal error")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# [Local SLM] Endpoints disabled
# @router.post("/slm/save")
# async def save_slm_checkpoint(note: Optional[str] = Form(None)):
#     try:
#         mgr = get_llm_manager()
#         result = await mgr.save_slm_checkpoint(note)
#         return result
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Save failed: {e}")

# @router.post("/slm/finetune")
# async def finetune_slm(
#     dataset_json: str = Form(..., description="JSON list of {prompt,response}"),
#     note: Optional[str] = Form(None),
#     lr: Optional[float] = Form(5e-5),
#     epochs: Optional[int] = Form(1),
#     max_samples: Optional[int] = Form(None),
#     lora_r: Optional[int] = Form(8),
#     lora_alpha: Optional[int] = Form(16),
#     lora_dropout: Optional[float] = Form(0.05)
# ):
#     """Parameter-efficient fine-tune of local SLM (Agriparam) with small JSON dataset.
#     dataset_json should be a JSON array: [{"prompt":..., "response":...}, ...]
#     Returns new version path if successful."""
#     try:
#         mgr = get_llm_manager()
#         try:
#             data = json.loads(dataset_json)
#             if not isinstance(data, list):
#                 raise ValueError("dataset_json must be a JSON list")
#         except Exception as e:
#             raise HTTPException(status_code=400, detail=f"Invalid dataset_json: {e}")
#         result = await mgr.local_slm.finetune(
#             dataset=data,
#             output_note=note,
#             lr=lr or 5e-5,
#             epochs=epochs or 1,
#             max_samples=max_samples,
#             lora_r=lora_r or 8,
#             lora_alpha=lora_alpha or 16,
#             lora_dropout=lora_dropout or 0.05
#         )
#         if not result.get("success"):
#             raise HTTPException(status_code=500, detail=result.get("error", "Fine-tune failed"))
#         return result
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Fine-tune exception: {e}")

# @router.get("/slm/versions")
# async def list_slm_versions():
#     try:
#         mgr = get_llm_manager()
#         return {"versions": mgr.list_slm_versions()}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"List failed: {e}")

# @router.post("/slm/load")
# async def load_slm_version(version: Optional[int] = Form(None)):
#     try:
#         mgr = get_llm_manager()
#         result = await mgr.load_slm_version(version)
#         return result
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Load failed: {e}")


@router.post("/ask", response_model=AskResponse)
async def ask_ai(req: AskRequest):
    """Directly query the AI (local SLM and/or external LLMs) with a text prompt."""
    try:
        llm_manager = get_llm_manager()
        prompt = req.prompt
        
        # Choose providers
        if req.providers in (None, "all"):
            llm_responses = await llm_manager.get_all_responses(prompt)
        # Local SLM disabled; treat "local" as external-only
        elif req.providers in ("local", "external"):
            llm_responses = {}
            if "openai" in llm_manager.enabled_providers:
                try:
                    llm_responses["openai"] = await llm_manager.external_llm.call_openai(prompt)
                except Exception as e:
                    llm_responses["openai"] = LLMResponse(provider="openai", response_type=LLMResponseType.LLM_ANALYSIS, content="", success=False, error=str(e))
            if "anthropic" in llm_manager.enabled_providers:
                try:
                    llm_responses["anthropic"] = await llm_manager.external_llm.call_anthropic(prompt)
                except Exception as e:
                    llm_responses["anthropic"] = LLMResponse(provider="anthropic", response_type=LLMResponseType.LLM_ANALYSIS, content="", success=False, error=str(e))
            if "grok" in llm_manager.enabled_providers:
                try:
                    llm_responses["grok"] = await llm_manager.external_llm.call_grok(prompt)
                except Exception as e:
                    llm_responses["grok"] = LLMResponse(provider="grok", response_type=LLMResponseType.LLM_ANALYSIS, content="", success=False, error=str(e))
            if "google" in llm_manager.enabled_providers:
                try:
                    llm_responses["google"] = await llm_manager.external_llm.call_google(prompt)
                except Exception as e:
                    llm_responses["google"] = LLMResponse(provider="google", response_type=LLMResponseType.LLM_ANALYSIS, content="", success=False, error=str(e))
        else:
            # Comma-separated list
            selected = [p.strip() for p in (req.providers or "").split(",") if p.strip()]
            all_responses = await llm_manager.get_all_responses(prompt)
            llm_responses = {k: v for k, v in all_responses.items() if k in selected}

        # Optional agent selection
        agent = get_response_agent()
        decision = agent.select_best_response(llm_responses, query_context="direct_query")
        
        return AskResponse(
            llm_responses={
                provider: {
                    "response": resp.response,
                    "provider": resp.provider,
                    "model_name": resp.model_name,
                    "confidence": resp.confidence,
                    "tokens_used": resp.tokens_used,
                    "response_time": resp.response_time,
                    "error": resp.error,
                    "metadata": resp.metadata,
                }
                for provider, resp in llm_responses.items()
            },
            agent_decision={
                "selected_provider": decision.selected_provider,
                "selected_response": decision.selected_response,
                "confidence": decision.confidence,
                "reasoning": decision.reasoning,
                "metadata": decision.metadata,
            },
            timestamp=datetime.now().isoformat(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ask failed: {str(e)}")

async def get_selective_llm_responses(llm_manager, prompt: str, provider_spec: str) -> Dict:
    """Get responses from selective LLM providers"""
    responses = {}
    
    # Local SLM disabled; map "local" requests to external-only providers
    if provider_spec == "local":
        provider_spec = "external"
    elif provider_spec == "external":
        if "openai" in llm_manager.enabled_providers:
            try:
                responses["openai"] = await llm_manager.external_llm.call_openai(prompt)
            except Exception as e:
                responses["openai"] = LLMResponse(provider="openai", response_type=LLMResponseType.LLM_ANALYSIS, content="", success=False, error=str(e))
        if "anthropic" in llm_manager.enabled_providers:
            try:
                responses["anthropic"] = await llm_manager.external_llm.call_anthropic(prompt)
            except Exception as e:
                responses["anthropic"] = LLMResponse(provider="anthropic", response_type=LLMResponseType.LLM_ANALYSIS, content="", success=False, error=str(e))
        if "grok" in llm_manager.enabled_providers:
            try:
                responses["grok"] = await llm_manager.external_llm.call_grok(prompt)
            except Exception as e:
                responses["grok"] = LLMResponse(provider="grok", response_type=LLMResponseType.LLM_ANALYSIS, content="", success=False, error=str(e))
        if "google" in llm_manager.enabled_providers:
            try:
                responses["google"] = await llm_manager.external_llm.call_google(prompt)
            except Exception as e:
                responses["google"] = LLMResponse(provider="google", response_type=LLMResponseType.LLM_ANALYSIS, content="", success=False, error=str(e))
    else:
        # Comma-separated list
        requested_providers = [p.strip() for p in provider_spec.split(",")]
        all_responses = await llm_manager.get_all_responses(prompt)
        
        for provider in requested_providers:
            if provider in all_responses:
                responses[provider] = all_responses[provider]
    
    return responses

def build_plant_analysis_prompt(predicted_class: str, confidence: Optional[float], 
                               top_predictions: List[Dict]) -> str:
    """Build optimized prompt for plant analysis"""
    
    # Format top predictions
    top_pred_text = ""
    if top_predictions:
        lines = []
        for pred in top_predictions[:3]:
            cls = pred.get('class') or pred.get('label') or 'unknown'
            c = pred.get('confidence')
            conf_txt = f"{float(c):.1%}" if isinstance(c, (int, float)) else "unknown"
            lines.append(f"- {cls} (confidence: {conf_txt})")
        top_pred_text = "\n".join(lines)
    conf_text = f"{float(confidence):.1%}" if isinstance(confidence, (int, float)) else "unknown"
    
    prompt = f"""You are an expert agricultural advisor specializing in plant disease and pest management.

ANALYSIS CONTEXT:
- Primary Detection: {predicted_class}
- Detection Confidence: {conf_text}
- Alternative Possibilities:
{top_pred_text}

TASK:
Please provide comprehensive, actionable recommendations for managing this plant health issue. Include:

1. DIAGNOSIS CONFIRMATION: Verify if the detected issue appears accurate
2. IMMEDIATE ACTIONS: What should be done right now?
3. TREATMENT OPTIONS: Specific products, methods, or interventions
4. PREVENTION MEASURES: How to prevent future occurrences
5. MONITORING: What signs to watch for

RESPONSE REQUIREMENTS:
- Be specific and actionable
- Include both organic and conventional treatment options when applicable
- Mention safety precautions if chemicals are involved
- Provide realistic timelines for treatment effectiveness
- Keep response focused and practical (200-400 words)

Please provide your expert agricultural recommendations:"""

    return prompt

async def add_training_sample(classifier, image: Image.Image, label: str, user_provided: bool):
    """Background task to add sample to training pipeline"""
    try:
        await classifier.add_training_sample(image, label, user_provided)
        logger.info(f"Added training sample with label '{label}' (user_provided: {user_provided})")
    except Exception as e:
        logger.error(f"Failed to add training sample: {e}")

@router.get("/model-info")
async def get_model_info():
    """Get information about loaded models (vision disabled, LLM-only)"""
    try:
        llm_manager = get_llm_manager()
        return {
            "vision_model": {"enabled": False, "mode": "llm_only"},
            "llm_providers": {
                "enabled": llm_manager.enabled_providers,
                "local_slm": {"enabled": False}
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")

@router.get("/llm/status")
async def llm_status():
    """Runtime diagnostics for LLM providers (local + external)."""
    try:
        mgr = get_llm_manager()
        return mgr.status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get LLM status: {e}")

@router.post("/llm/refresh")
async def llm_refresh():
    """Refresh enabled provider list (re-check env vars)."""
    try:
        mgr = get_llm_manager()
        await mgr.refresh_providers()
        return {"status": "refreshed", "enabled_providers": mgr.enabled_providers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh providers: {e}")

# @router.post("/llm/toggle-local")
# async def llm_toggle_local(enable: bool = Form(...)):
#     """Enable/disable local SLM at runtime (unloads model on disable)."""
#     try:
#         mgr = get_llm_manager()
#         mgr.set_local_enabled(enable)
#         return {"status": "ok", "local_requested_enabled": enable, "enabled_providers": mgr.enabled_providers}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to toggle local SLM: {e}")

# Vision classifier training endpoints disabled
# @router.post("/trigger-training")
# async def trigger_training():
#     """Manually trigger model training"""
#     try:
#         classifier = get_classifier()
#         await classifier.trigger_training()
#         return {
#             "status": "training_triggered",
#             "queue_size": len(classifier.training_queue),
#             "timestamp": datetime.now().isoformat()
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to trigger training: {str(e)}")

# @router.get("/training-queue")
# async def list_training_queue():
#     try:
#         cls = get_classifier()
#         return {"queue_size": len(cls.training_queue), "samples": cls.training_queue[-20:]}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to list queue: {e}")

# @router.get("/vision/versions")
# async def list_vision_versions():
#     try:
#         cls = get_classifier()
#         versions = []
#         for p in sorted(Path("app/models(ml)/vision").glob("plant_classifier_v*.pt")):
#             versions.append({"file": p.name, "path": str(p), "modified": datetime.fromtimestamp(p.stat().st_mtime).isoformat()})
#         return {"versions": versions, "current_version": cls._get_current_version()}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to list versions: {e}")

# @router.post("/vision/save-current")
# async def save_current_model(note: Optional[str] = Form(None)):
#     try:
#         cls = get_classifier()
#         new_v = cls._get_current_version() + 1
#         cls._save_model(version=new_v)
#         return {"status": "saved", "version": new_v, "note": note}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to save current model: {e}")

# @router.get("/vision/training-config")
# async def get_training_config():
#     try:
#         cls = get_classifier()
#         return cls.get_training_config()
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to get training config: {e}")

# @router.post("/vision/training-config")
# async def update_training_config(
#     min_samples_per_class: Optional[int] = Form(None),
#     learning_rate: Optional[float] = Form(None),
#     batch_size: Optional[int] = Form(None),
#     epochs: Optional[int] = Form(None),
#     early_stopping_patience: Optional[int] = Form(None),
#     shuffle_each_epoch: Optional[bool] = Form(None),
#     weighted_loss: Optional[bool] = Form(None),
#     bias_correction: Optional[bool] = Form(None),
#     save_best_only: Optional[bool] = Form(None)
# ):
#     try:
#         cls = get_classifier()
#         updated = cls.update_training_config(
#             min_samples_per_class=min_samples_per_class,
#             learning_rate=learning_rate,
#             batch_size=batch_size,
#             epochs=epochs,
#             early_stopping_patience=early_stopping_patience,
#             shuffle_each_epoch=shuffle_each_epoch,
#             weighted_loss=weighted_loss,
#             bias_correction=bias_correction,
#             save_best_only=save_best_only
#         )
#         return updated
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to update training config: {e}")

@router.get("/training-history")
async def get_training_history():
    """Get model training history"""
    try:
        log_file = Path("app/models(ml)/logs/training_history.json")
        
        if not log_file.exists():
            return {"history": [], "message": "No training history found"}
        
        with open(log_file, 'r') as f:
            history = json.load(f)
        
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get training history: {str(e)}")

# Health check endpoint
@router.get("/health")
async def health_check():
    """Check system health (LLM-only vision mode)"""
    try:
        llm_manager = get_llm_manager()
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "components": {
                "vision_classifier": {"enabled": False, "mode": "llm_only"},
                "llm_providers": {
                    "enabled_count": len(llm_manager.enabled_providers),
                    "providers": llm_manager.enabled_providers
                }
            }
        }
        if len(llm_manager.enabled_providers) == 0:
            health_status["status"] = "unhealthy"
            health_status["issues"] = ["No LLM providers available"]
        return health_status
    except Exception as e:
        return {"status": "unhealthy", "error": str(e), "timestamp": datetime.now().isoformat()}

@router.post("/camera-analyze")
async def camera_analyze(
    camera_index: int = 0,
    detection_backbone: Optional[str] = Form(None),
    score_threshold: float = Form(0.3),
    providers: Optional[str] = Form("all"),
    chain_mode: Optional[bool] = Form(True),
    debug: Optional[bool] = Form(False)
):
    """Capture a single frame from the system camera and run LLM-based vision analysis only.

    Notes:
    - Requires OpenCV (`cv2`) installed on the server running this endpoint.
    - Detection/classifier backbones are ignored in LLM-only mode.
    """
    try:
        # Try to import OpenCV
        try:
            import cv2
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OpenCV not available: {e}")

        cap = cv2.VideoCapture(camera_index)
        if not cap or not cap.isOpened():
            raise HTTPException(status_code=500, detail=f"Could not open camera index {camera_index}")

        # Warm up camera and grab a single frame
        ret = False
        frame = None
        for _ in range(5):
            ret, frame = cap.read()
            if ret and frame is not None:
                break
        cap.release()
        if not ret or frame is None:
            raise HTTPException(status_code=500, detail="Failed to capture frame from camera")

        # Encode frame to JPEG bytes for LLM vision
        ok, jpeg_bytes = cv2.imencode('.jpg', frame)
        if not ok:
            raise HTTPException(status_code=500, detail="Failed to encode frame to JPEG")
        img_bytes = jpeg_bytes.tobytes()

        # LLM-only vision analysis
        llm_vision = await analyze_leaf_image_llm(img_bytes, providers="auto")
        if llm_vision.get("status") != "success":
            raise HTTPException(status_code=503, detail=llm_vision.get("error", "LLM vision unavailable"))

        # Pick first provider response with content and parse
        resp = None
        for _prov, r in llm_vision.get("responses", {}).items():
            if r and r.get("content"):
                resp = r
                break
        parsed = None
        if resp and resp.get("content"):
            try:
                parsed = json.loads(resp.get("content"))
            except Exception:
                parsed = None
        predicted_class = str((parsed or {}).get("diagnosis") or (parsed or {}).get("label") or "unknown")
        try:
            confidence = float((parsed or {}).get("confidence") or 0.6)
        except Exception:
            confidence = 0.6
        top_preds = []
        if isinstance((parsed or {}).get("alternatives"), list):
            for alt in (parsed or {}).get("alternatives"):
                try:
                    top_preds.append({"class": alt.get("label") or alt.get("diagnosis"), "confidence": float(alt.get("confidence") or 0)})
                except Exception:
                    pass
        classification_result = {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "top3_predictions": top_preds[:3],
            "model_info": {"vision": "disabled", "mode": "llm_only"}
        }

        prompt = build_plant_analysis_prompt(predicted_class, confidence, classification_result.get("top3_predictions", []))

        llm_manager = get_llm_manager()
        chained_used = False
        # Select providers and call
        # Local SLM disabled: chaining path commented out; use external providers only
        # if chain_mode and (providers == "all" or providers == "external"):
        #     local_resp = await llm_manager.local_slm.generate_response(prompt)
        #     draft = local_resp.response or ""
        #     refinement_prompt = ("You are a senior agricultural expert. Draft:\n---\n" + draft + "\n---\nRefine with precise, actionable advice under 400 words.")
        #     external_resps = await get_selective_llm_responses(llm_manager, refinement_prompt, "external")
        #     llm_responses = {"local_slm": local_resp, **external_resps}
        #     chained_used = True
        if chain_mode:
            if providers in (None, "all"):
                llm_responses = await llm_manager.get_all_responses(prompt)
            elif providers == "external":
                llm_responses = await get_selective_llm_responses(llm_manager, prompt, "external")
            else:
                llm_responses = await get_selective_llm_responses(llm_manager, prompt, providers)
        elif providers in (None, "all"):
            llm_responses = await llm_manager.get_all_responses(prompt)
        else:
            llm_responses = await get_selective_llm_responses(llm_manager, prompt, providers)

        # Agent selection
        agent = get_response_agent()
        agent_decision = agent.select_best_response(llm_responses, f"Camera capture analysis: {predicted_class}")

        response = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "processing_source": "camera",
            "classification_result": classification_result,
            "llm_responses": {p: {"response": r.response, "provider": r.provider, "model_name": r.model_name, "confidence": r.confidence, "tokens_used": r.tokens_used, "response_time": r.response_time, "error": r.error, "metadata": r.metadata} for p, r in llm_responses.items()},
            "agent_decision": {"selected_provider": agent_decision.selected_provider, "selected_response": agent_decision.selected_response, "confidence": agent_decision.confidence, "reasoning": agent_decision.reasoning, "metadata": agent_decision.metadata},
            "flow_mode": "chained" if chained_used else "parallel"
        }
        return JSONResponse(content=response)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Camera analyze failed: {e}")
        raise HTTPException(status_code=500, detail=f"Camera analyze failed: {e}")
