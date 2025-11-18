"""
Prompt Engineering Module - Centralized prompt templates and builders
All LLM prompts and prompt-building logic for agricultural AI analysis
"""

from dataclasses import dataclass
from typing import Dict, Any, List, Optional, Union
from enum import Enum
import json
from pydantic import BaseModel, Field, validator
import re


class PromptType(str, Enum):
    """Types of prompts supported"""
    PEST_ANALYSIS = "pest_analysis"
    SEVERITY_ASSESSMENT = "severity_assessment"
    TREATMENT_RECOMMENDATION = "treatment_recommendation"
    CROSS_VALIDATION = "cross_validation"
    SUMMARIZATION = "summarization"
    SAFETY_CHECK = "safety_check"
    EXTRACTION = "extraction"


@dataclass
class PromptSpec:
    """Specification for a prompt template"""
    name: str
    template: str
    required_variables: List[str]
    optional_variables: List[str]
    validation_schema: Dict[str, Any]
    output_format: str
    safety_level: int = 1  # 1=low, 5=high


class PromptRequest(BaseModel):
    """Request model for prompt building"""
    prompt_name: str
    variables: Dict[str, Any]
    context: Optional[Dict[str, Any]] = None
    safety_level: int = Field(default=1, ge=1, le=5)
    
    @validator('variables')
    def validate_variables(cls, v):
        """Sanitize variables to prevent prompt injection"""
        if not isinstance(v, dict):
            raise ValueError("Variables must be a dictionary")
        
        # Sanitize string values
        sanitized = {}
        for key, value in v.items():
            if isinstance(value, str):
                # Remove potential prompt injection patterns
                sanitized[key] = re.sub(r'[<>{}]+', '', str(value)[:1000])
            else:
                sanitized[key] = value
        return sanitized


# Prompt Templates
PROMPT_TEMPLATES = {
    PromptType.PEST_ANALYSIS: PromptSpec(
        name="pest_analysis",
        template="""You are an expert agricultural pathologist analyzing crop images for pest and disease identification.

**Context:**
- Crop Type: {crop_type}
- Growth Stage: {growth_stage}
- Location: {location}
- Weather Conditions: {weather_conditions}
- Field Notes: {field_notes}

**Instructions:**
Analyze the provided crop image(s) and provide a comprehensive assessment:

1. **Primary Diagnosis**: Identify the main pest, disease, or health issue
2. **Confidence Level**: Rate your confidence (0.0-1.0)
3. **Severity Assessment**: Score from 0-100 (0=healthy, 100=critical)
4. **Affected Area**: Percentage of crop affected
5. **Supporting Evidence**: Visual indicators you observed
6. **Alternative Diagnoses**: List 2-3 alternative possibilities with confidence scores

**Output Format:**
Respond in valid JSON with this exact structure:
{{
    "primary_diagnosis": {{
        "label": "specific_pest_or_disease_name",
        "confidence": 0.95,
        "category": "pest|disease|deficiency|stress"
    }},
    "severity": {{
        "score": 75,
        "band": "mild|moderate|severe",
        "factors": ["list", "of", "contributing", "factors"]
    }},
    "affected_area_percent": 25.5,
    "visual_evidence": ["evidence1", "evidence2"],
    "alternatives": [
        {{"label": "alternative1", "confidence": 0.75}},
        {{"label": "alternative2", "confidence": 0.60}}
    ],
    "reasoning": "detailed explanation of your analysis"
}}

**Safety Guidelines:**
- Only analyze agricultural/plant health content
- Refuse to analyze inappropriate images
- If uncertain, clearly state limitations""",
        required_variables=["crop_type", "growth_stage"],
        optional_variables=["location", "weather_conditions", "field_notes"],
        validation_schema={
            "crop_type": {"type": "string", "enum": ["rice", "wheat", "corn", "tomato", "potato", "other"]},
            "growth_stage": {"type": "string", "enum": ["seedling", "vegetative", "flowering", "fruiting", "maturity"]}
        },
        output_format="json",
        safety_level=3
    ),

    PromptType.CROSS_VALIDATION: PromptSpec(
        name="cross_validation",
        template="""You are an expert agricultural AI validator performing meta-analysis of pest/disease diagnoses.

**Task:** Compare and validate two AI analysis results for the same crop images.

**SLM (Small Language Model) Analysis:**
- Diagnosis: {slm_diagnosis}
- Confidence: {slm_confidence}
- Severity: {slm_severity}/100
- Reasoning: {slm_reasoning}

**LLM (Large Language Model) Analysis:**
- Diagnosis: {llm_diagnosis}
- Confidence: {llm_confidence}
- Severity: {llm_severity}/100
- Reasoning: {llm_reasoning}

**Agricultural Context:**
- Crop: {crop_type}
- Stage: {growth_stage}
- Weather: {weather_risk}
- Location: {location}

**Validation Instructions:**
1. **Agreement Analysis**: Identify areas of consensus and disagreement
2. **Confidence Assessment**: Evaluate which analysis appears more reliable
3. **Evidence Review**: Consider supporting evidence from both analyses
4. **Final Recommendation**: Provide the most accurate unified diagnosis
5. **Uncertainty Flagging**: Highlight areas needing human expert review

**Output JSON Format:**
{{
    "validation_result": {{
        "consensus_diagnosis": "final_validated_diagnosis",
        "consensus_confidence": 0.85,
        "consensus_severity": 72,
        "agreement_areas": ["area1", "area2"],
        "disagreement_areas": ["area1", "area2"],
        "reliability_assessment": {{
            "slm_reliability": 0.75,
            "llm_reliability": 0.90,
            "reasoning": "explanation of reliability scores"
        }},
        "final_recommendation": {{
            "treatment_priority": "immediate|within_week|monitoring",
            "recommended_actions": ["action1", "action2"],
            "confidence_in_recommendation": 0.88
        }},
        "human_review_needed": false,
        "uncertainty_areas": ["area1", "area2"],
        "meta_reasoning": "detailed explanation of validation process"
    }}
}}""",
        required_variables=["slm_diagnosis", "slm_confidence", "slm_severity", "llm_diagnosis", "llm_confidence", "llm_severity"],
        optional_variables=["slm_reasoning", "llm_reasoning", "crop_type", "growth_stage", "weather_risk", "location"],
        validation_schema={
            "slm_confidence": {"type": "number", "minimum": 0, "maximum": 1},
            "llm_confidence": {"type": "number", "minimum": 0, "maximum": 1}
        },
        output_format="json",
        safety_level=2
    ),

    PromptType.TREATMENT_RECOMMENDATION: PromptSpec(
        name="treatment_recommendation",
        template="""You are an expert agricultural advisor specializing in Integrated Pest Management (IPM).

**Diagnosis:**
- Pest/Disease: {diagnosis}
- Severity: {severity}/100
- Confidence: {confidence}
- Affected Area: {affected_area}%

**Context:**
- Crop: {crop_type}
- Growth Stage: {growth_stage}
- Weather Risk: {weather_risk}
- Previous Treatments: {previous_treatments}
- Organic Preference: {organic_preference}

**IPM Recommendation Guidelines:**
1. **Prevention First**: Cultural and preventive measures
2. **Biological Control**: Bio-pesticides and beneficial organisms
3. **Chemical Control**: Only as last resort with specific guidelines

**Response Format:**
{{
    "ipm_strategy": {{
        "priority_level": "immediate|urgent|moderate|monitoring",
        "treatment_timeline": "immediate|within_24h|within_week|next_season",
        "prevention_measures": [
            {{
                "action": "specific preventive action",
                "timing": "when to implement",
                "effectiveness": "high|medium|low",
                "cost": "low|medium|high"
            }}
        ],
        "biological_treatments": [
            {{
                "treatment": "specific bio-treatment",
                "active_ingredient": "ingredient name",
                "application_rate": "rate and method",
                "timing": "application timing",
                "phi_days": 0,
                "effectiveness": "high|medium|low"
            }}
        ],
        "chemical_treatments": [
            {{
                "treatment": "specific chemical if needed",
                "active_ingredient": "ingredient",
                "mode_of_action": "MOA group",
                "application_rate": "rate and method",
                "phi_days": 14,
                "resistance_risk": "low|medium|high",
                "use_only_if": "conditions for use"
            }}
        ],
        "monitoring_plan": {{
            "frequency": "daily|weekly|bi-weekly",
            "indicators": ["indicator1", "indicator2"],
            "thresholds": "when to re-evaluate"
        }},
        "cost_estimate": "low|medium|high",
        "environmental_impact": "minimal|moderate|significant",
        "safety_precautions": ["precaution1", "precaution2"]
    }}
}}""",
        required_variables=["diagnosis", "severity", "confidence", "crop_type"],
        optional_variables=["affected_area", "growth_stage", "weather_risk", "previous_treatments", "organic_preference"],
        validation_schema={
            "severity": {"type": "integer", "minimum": 0, "maximum": 100},
            "confidence": {"type": "number", "minimum": 0, "maximum": 1}
        },
        output_format="json",
        safety_level=4
    ),

    PromptType.SAFETY_CHECK: PromptSpec(
        name="safety_check",
        template="""You are a content safety validator for agricultural AI systems.

**Content to Validate:**
{content}

**Safety Criteria:**
1. Agricultural/plant health relevance
2. No harmful or inappropriate content
3. No personal information exposure
4. Professional agricultural context

**Response:**
{{
    "is_safe": true,
    "safety_score": 0.95,
    "violations": [],
    "category": "agricultural_analysis|inappropriate|spam|other",
    "recommendation": "approve|review|reject"
}}""",
        required_variables=["content"],
        optional_variables=[],
        validation_schema={},
        output_format="json",
        safety_level=5
    ),

    PromptType.SUMMARIZATION: PromptSpec(
        name="summarization",
        template="""Provide a concise summary of the agricultural analysis:

**Input:** {content}

**Summary Requirements:**
- Maximum 3 sentences
- Focus on actionable insights
- Include severity and treatment priority

**Format:**
{{
    "summary": "concise summary text",
    "key_points": ["point1", "point2", "point3"],
    "action_required": true
}}""",
        required_variables=["content"],
        optional_variables=[],
        validation_schema={},
        output_format="json",
        safety_level=1
    )
}


class PromptBuilder:
    """Builder class for constructing and validating prompts"""
    
    @staticmethod
    def build_prompt(prompt_name: str, **kwargs) -> str:
        """
        Build a prompt from template with variable substitution
        
        Args:
            prompt_name: Name of the prompt template
            **kwargs: Variables for template substitution
            
        Returns:
            Rendered prompt string
            
        Raises:
            ValueError: If prompt not found or required variables missing
        """
        if prompt_name not in PROMPT_TEMPLATES:
            raise ValueError(f"Prompt '{prompt_name}' not found")
        
        spec = PROMPT_TEMPLATES[prompt_name]
        
        # Validate required variables
        missing_vars = set(spec.required_variables) - set(kwargs.keys())
        if missing_vars:
            raise ValueError(f"Missing required variables: {missing_vars}")
        
        # Set defaults for optional variables
        template_vars = kwargs.copy()
        for var in spec.optional_variables:
            if var not in template_vars:
                template_vars[var] = "Not specified"
        
        # Render template
        try:
            return spec.template.format(**template_vars)
        except KeyError as e:
            raise ValueError(f"Template variable error: {e}")
    
    @staticmethod
    def validate_prompt_variables(prompt_name: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        """Validate variables against prompt schema"""
        if prompt_name not in PROMPT_TEMPLATES:
            raise ValueError(f"Prompt '{prompt_name}' not found")
        
        spec = PROMPT_TEMPLATES[prompt_name]
        validated = {}
        
        # Apply validation schema
        for var_name, var_value in variables.items():
            if var_name in spec.validation_schema:
                schema = spec.validation_schema[var_name]
                # Simple validation - extend as needed
                if schema.get("type") == "string" and "enum" in schema:
                    if var_value not in schema["enum"]:
                        raise ValueError(f"Invalid value for {var_name}: {var_value}")
                elif schema.get("type") == "number":
                    if not isinstance(var_value, (int, float)):
                        raise ValueError(f"Invalid type for {var_name}: expected number")
                    if "minimum" in schema and var_value < schema["minimum"]:
                        raise ValueError(f"Value too low for {var_name}: {var_value}")
                    if "maximum" in schema and var_value > schema["maximum"]:
                        raise ValueError(f"Value too high for {var_name}: {var_value}")
            
            validated[var_name] = var_value
        
        return validated
    
    @staticmethod
    def get_prompt_spec(prompt_name: str) -> PromptSpec:
        """Get prompt specification"""
        if prompt_name not in PROMPT_TEMPLATES:
            raise ValueError(f"Prompt '{prompt_name}' not found")
        return PROMPT_TEMPLATES[prompt_name]
    
    @staticmethod
    def list_prompts() -> List[str]:
        """List available prompt names"""
        return list(PROMPT_TEMPLATES.keys())


# Export functions for external use
def build_prompt(name: str, **kwargs) -> str:
    """Build prompt with variables - main external interface"""
    return PromptBuilder.build_prompt(name, **kwargs)


def get_available_prompts() -> List[str]:
    """Get list of available prompt names"""
    return PromptBuilder.list_prompts()


def validate_variables(prompt_name: str, variables: Dict[str, Any]) -> Dict[str, Any]:
    """Validate variables for a prompt"""
    return PromptBuilder.validate_prompt_variables(prompt_name, variables)


def build_slm_prompt_from_structured(structured_output: dict, max_words: int = 400, context: dict | None = None) -> str:
    """Build a concise SLM prompt from structured detection/classification JSON.

    Args:
        structured_output: The JSON/dict output from `PlantClassifier.predict()`
        max_words: Desired maximum words in SLM response
        context: Optional additional context (crop_type, growth_stage, weather, notes)

    Returns:
        A sanitized prompt string ready to send to a local SLM for reasoning.
    """
    try:
        # Compact pretty JSON for prompt
        structured_json = json.dumps(structured_output, indent=2, ensure_ascii=False)
    except Exception:
        structured_json = str(structured_output)

    ctx_parts = []
    if context and isinstance(context, dict):
        for k, v in context.items():
            ctx_parts.append(f"- {k}: {v}")
    ctx_text = "\n".join(ctx_parts) if ctx_parts else "Not specified"

    prompt = (
        "You are a concise agricultural advisor running on an on-device Small Language Model.\n\n"
        "Below is a structured detection and classification result extracted from crop image(s).\n"
        "Use the structured data to produce a focused, actionable analysis for a farmer.\n\n"
        "INSTRUCTIONS:\n"
        "1) Provide a short Primary Diagnosis (label + brief rationale).\n"
        "2) Provide a Confidence score between 0.0 and 1.0.\n"
        "3) Provide a Severity score between 0 and 100 and a short explanation.\n"
        "4) Give 3 practical Immediate Actions (what to do now).\n"
        "5) Give 2 Prevention measures and a short Monitoring plan.\n"
        "6) Return the result as valid JSON only (no extra text) with keys: primary_diagnosis, confidence, severity, immediate_actions, prevention, monitoring, reasoning.\n\n"
        f"CONTEXT:\n{ctx_text}\n\n"
        f"STRUCTURED_DETECTIONS:\n{structured_json}\n\n"
        f"RESPONSE REQUIREMENTS: Keep response under {max_words} words and return valid JSON."
    )
    return prompt
