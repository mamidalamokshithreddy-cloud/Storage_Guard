"""
Local SLM Service using Hugging Face Transformers for agricultural text analysis.
Loads a causal language model (e.g., bharatgenai/AgriParam) and generates text for SLM prompts.
"""

import asyncio
import logging
from typing import Optional, Dict, Any

import torch

try:
    from transformers import AutoTokenizer, AutoModelForCausalLM
except Exception:  # transformers may be optional at install time
    AutoTokenizer = None
    AutoModelForCausalLM = None

from app.core.config import (
    ENABLE_SLM_ANALYSIS,
    SLM_LOCAL_ENABLED,
    SLM_MODEL_NAME,
    SLM_MAX_NEW_TOKENS,
    SLM_TEMPERATURE,
    SLM_TOP_K,
    SLM_TOP_P,
)

logger = logging.getLogger(__name__)


class LocalSLMService:
    """Thin wrapper around a local CausalLM for text generation."""

    def __init__(self, model_name: str):
        if AutoTokenizer is None or AutoModelForCausalLM is None:
            raise RuntimeError("transformers library is not available. Please install 'transformers'.")

        self.model_name = model_name
        self._tokenizer = None
        self._model = None
        self._device = torch.device("cuda:0") if torch.cuda.is_available() else torch.device("cpu")
        self._dtype = torch.float32

    def _load_if_needed(self):
        if self._tokenizer is not None and self._model is not None:
            return
        logger.info(f"Loading local SLM model: {self.model_name}")
        self._tokenizer = AutoTokenizer.from_pretrained(self.model_name, trust_remote_code=False)
        # Ensure pad token is set to avoid warnings
        try:
            if getattr(self._tokenizer, "pad_token", None) is None and getattr(self._tokenizer, "eos_token", None) is not None:
                self._tokenizer.pad_token = self._tokenizer.eos_token
        except Exception:
            pass

        # Select device and dtype
        if torch.cuda.is_available():
            self._device = torch.device("cuda:0")
            try:
                major, _ = torch.cuda.get_device_capability(self._device)
                supports_bf16 = major >= 8  # Ampere or newer
            except Exception:
                supports_bf16 = False
            self._dtype = torch.bfloat16 if supports_bf16 else torch.float16
        else:
            self._device = torch.device("cpu")
            self._dtype = torch.float32

        # Try to load fully on GPU first; fall back gracefully
        try:
            self._model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                trust_remote_code=True,
                torch_dtype=self._dtype,
                device_map=None,
                low_cpu_mem_usage=True,
            )
            self._model.to(self._device)
            logger.info(f"Local SLM model loaded on {self._device} with dtype={self._dtype}")
        except Exception as e:
            logger.warning(f"GPU load failed or partial: {e}; falling back to device_map='auto'")
            self._model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                trust_remote_code=True,
                torch_dtype=self._dtype,
                device_map="auto",
                low_cpu_mem_usage=True,
            )
            logger.info("Local SLM model loaded with device_map=auto")

    async def generate(self, prompt: str) -> str:
        """Generate text from the local SLM using sensible defaults."""
        self._load_if_needed()

        def _infer() -> str:
            inputs = self._tokenizer(prompt, return_tensors="pt")
            # Move inputs to preferred device when CUDA is available
            try:
                if self._device.type == "cuda":
                    inputs = inputs.to(self._device)
            except Exception:
                pass
            self._model.eval()
            with torch.no_grad():
                if self._device.type == "cuda":
                    # Autocast to selected dtype on CUDA for performance
                    with torch.autocast(device_type="cuda", dtype=self._dtype, enabled=True):
                        output = self._model.generate(
                            **inputs,
                            max_new_tokens=SLM_MAX_NEW_TOKENS,
                            do_sample=True,
                            top_k=SLM_TOP_K,
                            top_p=SLM_TOP_P,
                            temperature=SLM_TEMPERATURE,
                            eos_token_id=self._tokenizer.eos_token_id,
                            pad_token_id=self._tokenizer.pad_token_id,
                            use_cache=False,
                        )
                else:
                    output = self._model.generate(
                        **inputs,
                        max_new_tokens=SLM_MAX_NEW_TOKENS,
                        do_sample=True,
                        top_k=SLM_TOP_K,
                        top_p=SLM_TOP_P,
                        temperature=SLM_TEMPERATURE,
                        eos_token_id=self._tokenizer.eos_token_id,
                        pad_token_id=self._tokenizer.pad_token_id,
                        use_cache=False,
                    )
            return self._tokenizer.decode(output[0], skip_special_tokens=True)

        # Run blocking generation off the event loop
        return await asyncio.to_thread(_infer)

    async def close(self):
        """Release model to free VRAM/CPU memory."""
        try:
            self._model = None
            self._tokenizer = None
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except Exception:
            pass


_slm_instance: Optional[LocalSLMService] = None


def get_slm_service() -> Optional[LocalSLMService]:
    global _slm_instance
    if not (ENABLE_SLM_ANALYSIS and SLM_LOCAL_ENABLED):
        return None
    if _slm_instance is None:
        try:
            _slm_instance = LocalSLMService(SLM_MODEL_NAME)
            logger.info("✅ Local SLM service initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Local SLM service: {e}")
            _slm_instance = None
    return _slm_instance


async def cleanup_slm_service():
    global _slm_instance
    if _slm_instance is not None:
        try:
            await _slm_instance.close()
        except Exception as e:
            logger.warning(f"Error closing local SLM service: {e}")
        _slm_instance = None
