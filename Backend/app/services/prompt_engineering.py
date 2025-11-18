"""
Prompt Engineering for Agricultural AI Analysis
Comprehensive prompts for multi-LLM pest and disease detection
"""

import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field
from app.schemas.postgres_base_models import CropType, GrowthStage, WeatherRisk, ImageMetadata


class LLMProvider(str, Enum):
    GEMINI = "gemini"
    OPENAI = "openai"
    CLAUDE = "claude"
    LLAMA = "llama"
    COHERE = "cohere"


@dataclass
class PromptTemplate:
    name: str
    version: str
    provider_compatibility: List[LLMProvider]
    system_prompt: str
    user_prompt_template: str
    expected_output_format: str
    max_tokens: int
    temperature: float


@dataclass
class NutrientAnalysisRequest:
    soil_analysis: Dict[str, Any]
    crop_info: Dict[str, Any]
    current_nutrients: Dict[str, Any]
    deficiencies: Optional[List[str]] = field(default_factory=list)
    farm_context: Dict[str, Any] = field(default_factory=dict)
    weather_forecast: Optional[List[Dict[str, Any]]] = field(default_factory=list)
    budget_constraints: Optional[Dict[str, Any]] = field(default_factory=dict)
    organic_preference: bool = False
    sustainability_focus: Optional[str] = None
    user_preferences: Dict[str, Any] = field(default_factory=dict)


class PromptType(str, Enum):
    """Types of prompts for different analysis phases"""
    SLM_VISION_ANALYSIS = "slm_vision_analysis"
    LLM_VISION_ANALYSIS = "llm_vision_analysis"  
    CROSS_VALIDATION = "cross_validation"
    SEVERITY_ASSESSMENT = "severity_assessment"
    IPM_RECOMMENDATION = "ipm_recommendation"


class AgriculturalPromptEngine:
    """
    Dynamic prompt generation for agricultural AI analysis
    Production-ready, reusable prompt engineering system
    """
    
    def __init__(self):
        """Initialize prompt engine with agricultural expertise"""
        self.postgres_base_context = self._load_agricultural_context()
        self.templates = self._initialize_templates()

    def _initialize_templates(self) -> Dict[str, PromptTemplate]:
        """Initialize all prompt templates"""
        return {
            "nutrient_analysis": self._get_nutrient_analysis_template(),
            "deficiency_detection": self._get_deficiency_detection_template(),
            "fertilizer_optimization": self._get_fertilizer_optimization_template(),
            "application_scheduling": self._get_application_scheduling_template(),
            "cost_benefit_analysis": self._get_cost_benefit_template(),
            "risk_assessment": self._get_risk_assessment_template()
        }
    
        
    def _load_agricultural_context(self) -> Dict[str, Any]:
        """Load base agricultural knowledge context"""
        return {
            "pest_categories": [
                "aphids", "whiteflies", "thrips", "spider_mites", "caterpillars",
                "beetles", "borers", "leaf_miners", "scale_insects", "mealybugs"
            ],
            "disease_categories": [
                "fungal_diseases", "bacterial_diseases", "viral_diseases", 
                "nutrient_deficiencies", "environmental_stress", "root_rot"
            ],
            "severity_indicators": [
                "leaf_discoloration", "leaf_spots", "wilting", "defoliation",
                "stunted_growth", "yield_reduction", "pest_population"
            ],
            "growth_stage_impacts": {
                "seedling": "critical_establishment_phase",
                "vegetative": "rapid_growth_vulnerability", 
                "flowering": "reproductive_stress_sensitivity",
                "fruiting": "quality_impact_period",
                "maturity": "harvest_timing_concerns"
            }
        }

    def generate_slm_vision_prompt(
        self,
        crop_type: CropType,
        growth_stage: Optional[GrowthStage] = None,
        weather_context: Optional[WeatherRisk] = None,
        image_metadata: Optional[List[ImageMetadata]] = None,
        field_notes: Optional[str] = None
    ) -> str:
        """
        Generate SLM-optimized vision analysis prompt
        Focused on structured classification with minimal reasoning
        """
        
        prompt = f"""You are an agricultural AI specialist analyzing crop images for pest and disease detection.

CROP CONTEXT:
- Crop Type: {crop_type.value if crop_type else "unknown"}
- Growth Stage: {growth_stage.value if growth_stage else "unknown"}
- Analysis Date: {datetime.now().strftime('%Y-%m-%d')}

ANALYSIS REQUIREMENTS:
Analyze the provided crop images and provide a structured response focusing on:

1. PRIMARY DIAGNOSIS
   - Identify the most likely pest/disease/condition
   - Provide confidence score (0.0-1.0)
   
2. VISUAL INDICATORS
   - List specific symptoms observed
   - Note affected plant parts
   
3. SEVERITY ASSESSMENT  
   - Estimate severity score (0-100)
   - Assess affected area percentage

4. ALTERNATIVE DIAGNOSES
   - List 2-3 alternative possibilities
   - Include confidence scores

RESPONSE FORMAT (JSON):
```json
{{
    "primary_diagnosis": "diagnosis_name",
    "confidence": 0.0,
    "severity_score": 0,
    "affected_area_percent": 0.0,
    "visual_indicators": ["indicator1", "indicator2"],
    "alternatives": [
        {{"diagnosis": "alt1", "confidence": 0.0}},
        {{"diagnosis": "alt2", "confidence": 0.0}}
    ],
    "reasoning": "brief_explanation"
}}
```

AGRICULTURAL CONTEXT:
- Common {crop_type.value if crop_type else "crop"} pests: {self._get_crop_specific_pests(crop_type)}
- {growth_stage.value if growth_stage else "general"} stage vulnerabilities: {self._get_stage_vulnerabilities(growth_stage)}
"""

        if weather_context:
            prompt += f"\n- Weather Risk: {weather_context.risk_band.value if hasattr(weather_context, 'risk_band') else 'unknown'}"
            
        if field_notes:
            prompt += f"\n- Field Notes: {field_notes}"
            
        prompt += "\n\nProvide accurate, evidence-based analysis focused on actionable agricultural insights."
        
        return prompt

    def generate_llm_vision_prompt(
        self,
        crop_type: CropType,
        growth_stage: Optional[GrowthStage] = None,
        weather_context: Optional[WeatherRisk] = None,
        image_metadata: Optional[List[ImageMetadata]] = None,
        field_notes: Optional[str] = None,
        location: Optional[str] = None
    ) -> str:
        """
        Generate comprehensive LLM vision analysis prompt  
        Detailed reasoning and contextual analysis
        """
        
        prompt = f"""You are an expert agricultural pathologist and entomologist with 20+ years of field experience. Analyze the provided crop images with deep agricultural expertise.

COMPREHENSIVE ANALYSIS CONTEXT:
┌─ Crop Information ─┐
│ Type: {crop_type.value if crop_type else "Unknown"}
│ Growth Stage: {growth_stage.value if growth_stage else "Unknown"}  
│ Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}
└────────────────────┘

EXPERT ANALYSIS FRAMEWORK:

🔬 1. DETAILED VISUAL EXAMINATION
   - Systematically examine leaves, stems, fruits, roots (if visible)
   - Identify patterns: spots, discoloration, deformation, pest presence
   - Note distribution: localized vs widespread, progression patterns
   - Assess tissue damage: necrosis, chlorosis, wilting, lesions

🎯 2. DIAGNOSTIC REASONING
   - Apply differential diagnosis methodology
   - Consider multiple causative agents
   - Evaluate environmental vs biological factors
   - Cross-reference symptoms with known {crop_type.value if crop_type else "crop"} conditions

📊 3. SEVERITY & IMPACT ASSESSMENT  
   - Quantify damage extent (0-100 scale)
   - Estimate yield impact potential
   - Assess urgency of intervention
   - Consider {growth_stage.value if growth_stage else "current"} stage sensitivity

🌿 4. CONTEXTUAL FACTORS
   - {crop_type.value if crop_type else "Crop"}-specific pest/disease susceptibility
   - {growth_stage.value if growth_stage else "Growth"} stage vulnerabilities
   - Seasonal timing and regional considerations"""

        if weather_context:
            prompt += f"\n   - Weather influence: {self._format_weather_context(weather_context)}"
            
        if location:
            prompt += f"\n   - Geographic considerations: {location}"

        prompt += f"""

REQUIRED OUTPUT STRUCTURE:
```json
{{
    "primary_diagnosis": {{
        "name": "specific_pest_or_disease_name",
        "confidence": 0.95,
        "category": "pest|disease|nutrient|environmental",
        "scientific_name": "scientific_name_if_applicable"
    }},
    "detailed_analysis": {{
        "visual_symptoms": ["detailed_symptom_1", "detailed_symptom_2"],
        "affected_areas": ["leaf", "stem", "fruit", "root"],
        "damage_patterns": "description_of_damage_progression",
        "severity_indicators": ["specific_indicators"]
    }},
    "severity_assessment": {{
        "score": 85,
        "affected_area_percent": 45.0,
        "damage_level": "moderate|severe|critical",
        "yield_impact_estimate": "10-30% potential loss",
        "urgency": "immediate|within_week|monitor"
    }},
    "differential_diagnosis": [
        {{
            "diagnosis": "alternative_1",
            "confidence": 0.15,
            "distinguishing_factors": "why_this_vs_primary"
        }},
        {{
            "diagnosis": "alternative_2", 
            "confidence": 0.10,
            "distinguishing_factors": "differentiating_characteristics"
        }}
    ],
    "expert_reasoning": {{
        "key_diagnostic_features": ["feature_1", "feature_2"],
        "supporting_evidence": "detailed_reasoning",
        "risk_factors": ["environmental_factor_1", "crop_factor_2"],
        "confidence_rationale": "why_this_confidence_level"
    }},
    "recommended_actions": {{
        "immediate": ["action_1", "action_2"],
        "short_term": ["action_3", "action_4"],
        "monitoring": ["what_to_watch", "follow_up_timing"]
    }}
}}
```

AGRICULTURAL EXPERTISE NOTES:
- {crop_type.value if crop_type else "This crop"} common issues: {self._get_crop_specific_issues(crop_type)}
- {growth_stage.value if growth_stage else "Current"} stage critical factors: {self._get_critical_factors(growth_stage)}
- Diagnostic differentials to consider: {self._get_differential_considerations(crop_type)}

Provide thorough, evidence-based analysis with clear reasoning for all conclusions.
"""
        
        return prompt

    def generate_cross_validation_prompt(
        self,
        vision_results: Optional[Dict[str, Any]] = None,
        severity_assessment: Optional[Dict[str, Any]] = None,
        weather_context: Optional[Dict[str, Any]] = None,
        slm_analysis: Optional[Any] = None,
        llm_analyses: Optional[List[Any]] = None,
        consensus_data: Optional[Dict[str, Any]] = None,
        context_data: Optional[Dict[str, Any]] = None,
        provider_hint: Optional[str] = None
    ) -> str:
        """
        Generate cross-validation prompt for sequential Response A vs Response B comparison
        
        For sequential validation workflow:
        1. Response A (Local SLM) vs Response B (Cloud LLM)
        2. Multiple validators compare and vote for best response
        3. Consensus determines final recommendation
        """
        
        # Check if this is sequential validation mode
        is_sequential = (consensus_data and 
                        consensus_data.get("validation_mode") == "sequential_comparison")
        
        if not is_sequential:
            # Legacy parallel validation prompt (kept for compatibility)
            return self._generate_legacy_cross_validation_prompt(
                slm_analysis, llm_analyses, consensus_data, context_data
            )
        
        # Sequential validation prompt
        response_a_content = slm_analysis.content if slm_analysis else "No SLM analysis available"
        response_b_content = ""
        
        if llm_analyses and len(llm_analyses) > 0:
            response_b_content = llm_analyses[0].content
        
        crop_info = context_data.get("crop_context", {}) if context_data else {}
        crop_type = crop_info.get("crop_type", "unknown")
        growth_stage = crop_info.get("growth_stage", "unknown")
        
        prompt = f"""You are an expert agricultural AI validator conducting a SEQUENTIAL VALIDATION COMPARISON. Your critical task is to compare two AI responses analyzing a crop image and determine which provides superior agricultural guidance.

🎯 VALIDATION MISSION: Compare Response A (Local SLM) vs Response B (Cloud LLM) and select the best analysis for farmers.

CROP CONTEXT:
• Crop Type: {crop_type}
• Growth Stage: {growth_stage}
• Analysis Mode: Sequential Comparison (A vs B)
• Timestamp: {datetime.now().isoformat()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 RESPONSE A (Local SLM Model):
{response_a_content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☁️ RESPONSE B (Cloud LLM Model):
{response_b_content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 SEQUENTIAL VALIDATION CRITERIA:

1. 🌾 AGRICULTURAL EXPERTISE
   - Which response demonstrates deeper agricultural knowledge?
   - More accurate pest/disease identification?
   - Better understanding of crop-specific issues?

2. 🎯 DIAGNOSTIC ACCURACY  
   - More precise problem identification?
   - Better evidence-based reasoning?
   - More reliable confidence assessment?

3. 💡 PRACTICAL RECOMMENDATIONS
   - More actionable treatment suggestions?
   - Better consideration of farmer resources?
   - More comprehensive prevention strategies?

4. 📊 RESPONSE QUALITY
   - Clearer communication for farmers?
   - More structured and organized analysis?
   - Better integration of multiple factors?

5. 🚨 RISK ASSESSMENT
   - More appropriate urgency evaluation?
   - Better consideration of potential consequences?
   - More balanced risk-benefit analysis?

REQUIRED VALIDATOR DECISION:
```json
{{
    "selected_response": "response_a" | "response_b",
    "confidence": 0.85,
    "reasoning": "Detailed explanation of why this response is superior",
    "comparison_analysis": {{
        "response_a_strengths": ["strength1", "strength2"],
        "response_a_weaknesses": ["weakness1", "weakness2"],
        "response_b_strengths": ["strength1", "strength2"], 
        "response_b_weaknesses": ["weakness1", "weakness2"]
    }},
    "decision_factors": {{
        "agricultural_expertise": "a|b|tie",
        "diagnostic_accuracy": "a|b|tie",
        "practical_recommendations": "a|b|tie",
        "response_quality": "a|b|tie",
        "risk_assessment": "a|b|tie"
    }},
    "farmer_impact": {{
        "which_helps_farmers_more": "response_a|response_b",
        "practical_value_assessment": "High|Medium|Low",
        "ease_of_implementation": "Easy|Moderate|Difficult"
    }},
    "final_recommendation": "Use selected response as-is | Needs human expert review | Combine both responses"
}}
```

🎯 VALIDATION FOCUS: Select the response that will best help farmers make informed decisions about their crop health and management."""
        
        return prompt
    
    def _generate_legacy_cross_validation_prompt(
        self,
        slm_analysis: Optional[Any] = None,
        llm_analyses: Optional[List[Any]] = None,
        consensus_data: Optional[Dict[str, Any]] = None,
        context_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Legacy cross-validation prompt for parallel analysis consensus building
        (Kept for compatibility with parallel validation workflow)
        """
        
        prompt = f"""You are a senior agricultural AI validator tasked with cross-validating and synthesizing multiple AI analyses of crop images. Your role is to provide the most accurate, reliable final diagnosis.

VALIDATION CONTEXT:
- Analysis Timestamp: {datetime.now().isoformat()}
- Validation Mode: Parallel Consensus Building

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 SLM ANALYSIS (Specialized Agricultural Model):
{slm_analysis.content if slm_analysis else "No SLM analysis available"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧠 LLM ANALYSES (Expert Reasoning Models):  
{json.dumps([analysis.content for analysis in llm_analyses] if llm_analyses else [], indent=2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CROSS-VALIDATION FRAMEWORK:

1. 🔍 AGREEMENT ANALYSIS
   - Where do models agree? (high confidence areas)
   - What are the key disagreements? (resolution required)
   - Which models show more specific agricultural knowledge?

2. 🎯 CONFIDENCE EVALUATION  
   - Assess reliability of each analysis
   - Consider model-specific strengths and limitations
   - Evaluate evidence quality and reasoning depth

3. 🧬 SYNTHESIS & CONSENSUS
   - Build optimal diagnosis combining best insights
   - Resolve conflicts using agricultural expertise
   - Maintain transparency about uncertainty areas

REQUIRED CONSENSUS OUTPUT:
```json
{{
    "validation_summary": {{
        "agreement_level": "high|moderate|low",
        "primary_agreements": ["area_1", "area_2"],
        "key_disagreements": ["disagreement_1", "disagreement_2"],
        "resolution_rationale": "how_conflicts_were_resolved"
    }},
    "final_diagnosis": {{
        "name": "consensus_diagnosis",
        "confidence": 0.92,
        "evidence_quality": "high|medium|low",
        "source_models": ["slm", "llm", "both"],
        "uncertainty_areas": ["area_if_any"]
    }},
    "recommendation_synthesis": {{
        "immediate_actions": ["validated_action_1", "validated_action_2"],
        "treatment_priority": "high|medium|low",
        "monitoring_requirements": ["what_to_monitor"],
        "human_review_needed": true|false
    }}
}}
```"""
        
        return prompt

    def _get_crop_specific_pests(self, crop_type: Optional[CropType]) -> str:
        """Get crop-specific pest information"""
        crop_pests = {
            CropType.rice: "brown planthopper, rice stem borer, blast disease",
            CropType.wheat: "aphids, wheat rust, powdery mildew",
            CropType.corn: "corn borer, armyworm, gray leaf spot",
            CropType.tomato: "whitefly, late blight, early blight",
            CropType.potato: "Colorado potato beetle, late blight, scab",
            CropType.cotton: "bollworm, aphids, fusarium wilt"
        }
        return crop_pests.get(crop_type, "general agricultural pests") if crop_type else "general agricultural pests"

    def _get_stage_vulnerabilities(self, growth_stage: Optional[GrowthStage]) -> str:
        """Get growth stage specific vulnerabilities"""
        stage_vulnerabilities = {
            GrowthStage.seedling: "damping-off, cutworms, nutrient deficiency",
            GrowthStage.vegetative: "leaf diseases, sucking pests, nitrogen stress",
            GrowthStage.flowering: "pollination issues, flower drop, stress sensitivity",
            GrowthStage.fruiting: "fruit rots, quality defects, nutrient competition", 
            GrowthStage.maturity: "storage pests, harvest timing, quality degradation"
        }
        return stage_vulnerabilities.get(growth_stage, "general growth vulnerabilities") if growth_stage else "general growth vulnerabilities"

    def _get_crop_specific_issues(self, crop_type: Optional[CropType]) -> str:
        """Get comprehensive crop-specific issues"""
        if not crop_type:
            return "general crop health issues"
            
        crop_issues = {
            CropType.rice: "blast, brown spot, bacterial leaf blight, sheath blight",
            CropType.wheat: "rust diseases, powdery mildew, septoria, fusarium head blight",
            CropType.corn: "gray leaf spot, northern corn leaf blight, corn smut",
            CropType.tomato: "early blight, late blight, septoria leaf spot, bacterial speck",
            CropType.potato: "late blight, early blight, blackleg, common scab",
            CropType.cotton: "fusarium wilt, verticillium wilt, bacterial blight"
        }
        return crop_issues.get(crop_type, "general crop diseases")

    def _get_critical_factors(self, growth_stage: Optional[GrowthStage]) -> str:
        """Get critical factors for growth stage"""
        if not growth_stage:
            return "general plant health factors"
            
        critical_factors = {
            GrowthStage.seedling: "root establishment, cotyledon health, early pest pressure",
            GrowthStage.vegetative: "leaf development, stem strength, nutrient uptake efficiency",
            GrowthStage.flowering: "flower formation, pollination success, stress tolerance",
            GrowthStage.fruiting: "fruit set, development quality, resource allocation",
            GrowthStage.maturity: "harvest readiness, storage quality, final yield"
        }
        return critical_factors.get(growth_stage, "general growth factors")

    def _get_differential_considerations(self, crop_type: Optional[CropType]) -> str:
        """Get differential diagnosis considerations"""
        if not crop_type:
            return "biotic vs abiotic stress, pest vs disease, nutrient vs pathogen"
            
        differentials = {
            CropType.rice: "blast vs bacterial blight, nutrient deficiency vs disease",
            CropType.wheat: "rust vs septoria, drought stress vs disease",
            CropType.corn: "northern leaf blight vs gray leaf spot, herbicide damage vs disease",
            CropType.tomato: "early vs late blight, nutrient deficiency vs disease",
            CropType.potato: "early vs late blight, blackleg vs soft rot",
            CropType.cotton: "fusarium vs verticillium wilt, nutrient vs pathogen"
        }
        return differentials.get(crop_type, "common agricultural differentials")

    def _format_weather_context(self, weather_context: WeatherRisk) -> str:
        """Format weather context for prompts"""
        if not weather_context:
            return "no weather data available"
            
        risk_factors = []
        if hasattr(weather_context, 'humidity_risk') and weather_context.humidity_risk:
            risk_factors.append(f"humidity: {weather_context.humidity_risk}")
        if hasattr(weather_context, 'temperature_risk') and weather_context.temperature_risk:
            risk_factors.append(f"temperature: {weather_context.temperature_risk}")
        if hasattr(weather_context, 'rainfall_risk') and weather_context.rainfall_risk:
            risk_factors.append(f"rainfall: {weather_context.rainfall_risk}")
            
        return ", ".join(risk_factors) if risk_factors else "normal weather conditions"

    def get_prompt_by_type(
        self, 
        prompt_type: PromptType,
        **kwargs
    ) -> str:
        """
        Dynamic prompt generation based on type
        
        Args:
            prompt_type: Type of prompt to generate
            **kwargs: Context-specific parameters
            
        Returns:
            Generated prompt string
        """
        prompt_generators = {
            PromptType.SLM_VISION_ANALYSIS: self.generate_slm_vision_prompt,
            PromptType.LLM_VISION_ANALYSIS: self.generate_llm_vision_prompt,
            PromptType.CROSS_VALIDATION: self.generate_cross_validation_prompt
        }
        
        generator = prompt_generators.get(prompt_type)
        if not generator:
            raise ValueError(f"Unsupported prompt type: {prompt_type}")
            
        return generator(**kwargs)

    def validate_prompt_context(self, **kwargs) -> Dict[str, bool]:
        """
        Validate prompt generation context
        
        Returns:
            Validation results for required parameters
        """
        validations = {
            "has_crop_type": kwargs.get("crop_type") is not None,
            "has_growth_stage": kwargs.get("growth_stage") is not None,
            "has_weather_context": kwargs.get("weather_context") is not None,
            "has_field_notes": kwargs.get("field_notes") is not None,
            "has_image_metadata": kwargs.get("image_metadata") is not None
        }
        
        validations["context_complete"] = all([
            validations["has_crop_type"],
            validations["has_growth_stage"]
        ])
        
        return validations

    def get_nutrient_analysis_prompt(
        self, 
        request: NutrientAnalysisRequest,
        provider: LLMProvider = LLMProvider.GEMINI
    ) -> Dict[str, str]:
        """Generate comprehensive nutrient analysis prompt"""
        template = self.templates["nutrient_analysis"]
        
        # Build context-aware prompt
        context = self._build_analysis_context(request)
        
        system_prompt = template.system_prompt.format(
            provider_specific=self._get_provider_instructions(provider),
            output_format=template.expected_output_format
        )
        
        user_prompt = template.user_prompt_template.format(**context)
        
        return {
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "max_tokens": template.max_tokens,
            "temperature": template.temperature
        }
    
    def get_deficiency_detection_prompt(
        self,
        soil_data: Dict[str, Any],
        crop_info: Dict[str, Any],
        provider: LLMProvider = LLMProvider.GEMINI
    ) -> Dict[str, str]:
        """Generate deficiency detection prompt"""
        template = self.templates["deficiency_detection"]
        
        context = {
            "soil_data": json.dumps(soil_data, indent=2),
            "crop_type": crop_info.get("species", "Unknown"),
            "growth_stage": crop_info.get("current_stage", "Unknown"),
            "critical_nutrients": self._get_critical_nutrients_for_crop(crop_info),
            "deficiency_thresholds": self._get_deficiency_thresholds(crop_info)
        }
        
        system_prompt = template.system_prompt.format(
            provider_specific=self._get_provider_instructions(provider)
        )
        
        user_prompt = template.user_prompt_template.format(**context)
        
        return {
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "max_tokens": template.max_tokens,
            "temperature": template.temperature
        }
    
    def get_fertilizer_optimization_prompt(
        self,
        requirements: Dict[str, float],
        available_products: List[Dict[str, Any]],
        constraints: Dict[str, Any],
        provider: LLMProvider = LLMProvider.GEMINI
    ) -> Dict[str, str]:
        """Generate fertilizer optimization prompt"""
        template = self.templates["fertilizer_optimization"]
        
        context = {
            "nutrient_requirements": json.dumps(requirements, indent=2),
            "available_products": json.dumps(available_products, indent=2),
            "budget_constraint": constraints.get("budget", "No limit specified"),
            "organic_preference": "Yes" if constraints.get("organic_preference") else "No",
            "sustainability_focus": "High" if constraints.get("sustainability_focus") else "Standard",
            "application_method_preferences": constraints.get("application_methods", ["All methods acceptable"])
        }
        
        system_prompt = template.system_prompt.format(
            provider_specific=self._get_provider_instructions(provider)
        )
        
        user_prompt = template.user_prompt_template.format(**context)
        
        return {
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "max_tokens": template.max_tokens,
            "temperature": template.temperature
        }
    
    def get_application_scheduling_prompt(
        self,
        crop_info: Dict[str, Any],
        fertilizer_plan: List[Dict[str, Any]],
        weather_forecast: List[Dict[str, Any]],
        provider: LLMProvider = LLMProvider.GEMINI
    ) -> Dict[str, str]:
        """Generate application scheduling prompt"""
        template = self.templates["application_scheduling"]
        
        context = {
            "crop_details": json.dumps(crop_info, indent=2),
            "fertilizer_plan": json.dumps(fertilizer_plan, indent=2),
            "weather_forecast": json.dumps(weather_forecast[:7], indent=2),
            "critical_growth_stages": self._get_critical_growth_stages(crop_info),
            "application_windows": self._get_optimal_application_windows(crop_info)
        }
        
        system_prompt = template.system_prompt.format(
            provider_specific=self._get_provider_instructions(provider)
        )
        
        user_prompt = template.user_prompt_template.format(**context)
        
        return {
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "max_tokens": template.max_tokens,
            "temperature": template.temperature
        }
    
    def get_cost_benefit_analysis_prompt(
        self,
        fertilizer_plan: Dict[str, Any],
        farm_context: Dict[str, Any],
        market_data: Dict[str, Any],
        provider: LLMProvider = LLMProvider.GEMINI
    ) -> Dict[str, str]:
        """Generate cost-benefit analysis prompt"""
        template = self.templates["cost_benefit_analysis"]
        
        context = {
            "fertilizer_plan": json.dumps(fertilizer_plan, indent=2),
            "farm_size": farm_context.get("area_acres", "Not specified"),
            "crop_type": farm_context.get("crop_type", "Unknown"),
            "target_yield": farm_context.get("target_yield", "Not specified"),
            "market_prices": json.dumps(market_data, indent=2),
            "investment_period": "Current growing season"
        }
        
        system_prompt = template.system_prompt.format(
            provider_specific=self._get_provider_instructions(provider)
        )
        
        user_prompt = template.user_prompt_template.format(**context)
        
        return {
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "max_tokens": template.max_tokens,
            "temperature": template.temperature
        }
    
    def get_risk_assessment_prompt(
        self,
        analysis_results: Dict[str, Any],
        environmental_factors: Dict[str, Any],
        provider: LLMProvider = LLMProvider.GEMINI
    ) -> Dict[str, str]:
        """Generate risk assessment prompt"""
        template = self.templates["risk_assessment"]
        
        context = {
            "nutrient_plan": json.dumps(analysis_results, indent=2),
            "environmental_conditions": json.dumps(environmental_factors, indent=2),
            "risk_factors": self._identify_potential_risks(analysis_results, environmental_factors),
            "mitigation_strategies": self._get_standard_mitigation_strategies()
        }
        
        system_prompt = template.system_prompt.format(
            provider_specific=self._get_provider_instructions(provider)
        )
        
        user_prompt = template.user_prompt_template.format(**context)
        
        return {
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "max_tokens": template.max_tokens,
            "temperature": template.temperature
        }
    
    def _get_nutrient_analysis_template(self) -> PromptTemplate:
        """Nutrient analysis prompt template"""
        return PromptTemplate(
            name="nutrient_analysis",
            version="2.0.0",
            provider_compatibility=[
                LLMProvider.GEMINI, LLMProvider.OPENAI, LLMProvider.CLAUDE, 
                LLMProvider.LLAMA, LLMProvider.COHERE
            ],
            system_prompt="""You are an expert agricultural scientist and nutrient management consultant with deep expertise in:
- Soil chemistry and nutrient dynamics
- Crop physiology and nutrient uptake patterns
- Fertilizer chemistry and application strategies
- Sustainable agriculture practices
- Precision agriculture technologies

{provider_specific}

Your role is to analyze soil conditions, crop requirements, and environmental factors to provide scientifically accurate, practical, and economically viable nutrient management recommendations.

CRITICAL REQUIREMENTS:
1. Base all recommendations on scientific principles and agronomic best practices
2. Consider nutrient interactions and synergistic effects
3. Account for soil pH, organic matter, and environmental conditions
4. Prioritize sustainable and economically efficient solutions
5. Provide specific, actionable recommendations with clear justification

{output_format}""",
            
            user_prompt_template="""# COMPREHENSIVE NUTRIENT ANALYSIS REQUEST

## SOIL ANALYSIS DATA
{soil_analysis}

## CROP INFORMATION
{crop_details}

## CURRENT NUTRIENT STATUS
{current_nutrients}

## IDENTIFIED DEFICIENCIES
{deficiencies_list}

## FARM CONTEXT
{farm_context}

## ENVIRONMENTAL CONDITIONS
{weather_conditions}

## USER PREFERENCES & CONSTRAINTS
{user_preferences}

## ANALYSIS REQUIREMENTS

Please provide a comprehensive nutrient management analysis including:

### 1. SOIL HEALTH ASSESSMENT
- Evaluate current soil nutrient status
- Identify critical deficiencies and toxicities
- Assess nutrient availability and uptake potential
- Consider soil pH impact on nutrient availability

### 2. CROP-SPECIFIC NUTRIENT REQUIREMENTS
- Calculate stage-specific nutrient demands
- Consider target yield requirements
- Account for nutrient uptake timing and patterns
- Identify critical growth stage needs

### 3. NUTRIENT DEFICIENCY ANALYSIS
- Rank deficiencies by severity and impact
- Assess immediate vs. long-term correction needs
- Consider nutrient interactions and antagonisms
- Evaluate correction feasibility and timeframes

### 4. FERTILIZER RECOMMENDATIONS
- Recommend specific fertilizer products and formulations
- Provide precise application rates and timing
- Consider application methods and efficiency
- Account for nutrient release patterns

### 5. APPLICATION STRATEGY
- Design optimal application schedule
- Balance immediate vs. season-long nutrition
- Consider environmental conditions and timing
- Minimize nutrient losses and maximize efficiency

### 6. SUSTAINABILITY CONSIDERATIONS
- Evaluate environmental impact
- Consider long-term soil health implications
- Assess carbon footprint and sustainability metrics
- Recommend organic/sustainable alternatives where appropriate

### 7. ECONOMIC ANALYSIS
- Estimate total costs and ROI potential
- Compare alternative strategies
- Identify cost-effective solutions
- Consider budget constraints and priorities

### 8. RISK ASSESSMENT
- Identify potential risks and challenges
- Recommend mitigation strategies
- Consider weather and environmental risks
- Provide contingency planning

PROVIDE DETAILED, SCIENTIFIC, AND ACTIONABLE RECOMMENDATIONS.""",
            
            expected_output_format="""
Expected Output Format (JSON-compatible structure):
{
  "analysis_summary": {
    "overall_soil_health": "score and description",
    "critical_deficiencies": ["list of nutrients"],
    "priority_actions": ["immediate actions needed"],
    "confidence_level": "high/medium/low"
  },
  "nutrient_recommendations": {
    "nitrogen": {
      "current_level": "kg/ha",
      "required_level": "kg/ha", 
      "deficiency_gap": "kg/ha",
      "application_strategy": "detailed strategy",
      "timing": "specific timing recommendations",
      "products": ["recommended products"]
    },
    "phosphorus": { ... },
    "potassium": { ... },
    "sulfur": { ... },
    "micronutrients": { ... }
  },
  "fertilizer_plan": [
    {
      "product_name": "specific product",
      "application_rate": "kg/ha or specific rate",
      "application_timing": "precise timing",
      "application_method": "method description",
      "expected_outcome": "outcome description"
    }
  ],
  "application_schedule": [
    {
      "stage": "growth stage",
      "timing": "specific timing", 
      "nutrients": ["N", "P", "K"],
      "application_type": "basal/top-dress/foliar",
      "priority": "high/medium/low"
    }
  ],
  "economic_analysis": {
    "total_cost_per_hectare": "cost estimate",
    "expected_roi": "percentage",
    "break_even_yield": "yield target",
    "cost_breakdown": "detailed costs"
  },
  "risk_assessment": {
    "risk_level": "high/medium/low",
    "key_risks": ["identified risks"],
    "mitigation_strategies": ["strategies"],
    "monitoring_requirements": ["monitoring needs"]
  },
  "sustainability_metrics": {
    "environmental_impact": "assessment",
    "soil_health_improvement": "expected improvement",
    "carbon_impact": "assessment",
    "sustainable_practices": ["recommended practices"]
  }
}
""",
            max_tokens=4096,
            temperature=0.3
        )
    
    def _get_deficiency_detection_template(self) -> PromptTemplate:
        """Deficiency detection prompt template"""
        return PromptTemplate(
            name="deficiency_detection",
            version="2.0.0",
            provider_compatibility=[
                LLMProvider.GEMINI, LLMProvider.OPENAI, LLMProvider.CLAUDE,
                LLMProvider.LLAMA, LLMProvider.COHERE
            ],
            system_prompt="""You are a plant nutrition diagnostician specializing in nutrient deficiency identification and correction strategies.

{provider_specific}

Your expertise includes:
- Visual and analytical deficiency diagnosis
- Nutrient bioavailability assessment  
- Soil-plant nutrient interactions
- Rapid correction strategies
- Foliar vs soil application decisions

Analyze the provided data to identify, rank, and provide correction strategies for nutrient deficiencies.""",
            
            user_prompt_template="""# NUTRIENT DEFICIENCY DETECTION

## SOIL TEST RESULTS
{soil_data}

## CROP INFORMATION
- Crop Type: {crop_type}
- Growth Stage: {growth_stage}
- Critical Nutrients for this Crop: {critical_nutrients}

## DEFICIENCY THRESHOLDS
{deficiency_thresholds}

## ANALYSIS REQUEST
Analyze the soil data and identify:

1. **PRIMARY DEFICIENCIES**: Nutrients below critical thresholds that require immediate attention
2. **SECONDARY DEFICIENCIES**: Nutrients at suboptimal levels that need monitoring  
3. **HIDDEN DEFICIENCIES**: Nutrients that may become limiting as the crop develops
4. **ANTAGONISTIC EFFECTS**: Nutrients that may be affecting uptake of others

For each identified deficiency, provide:
- Severity level (Critical/Moderate/Mild)
- Urgency for correction (Immediate/Within 2 weeks/Long-term)
- Recommended correction method (Foliar/Soil/Both)
- Specific product recommendations
- Expected timeframe for correction

Output as structured JSON with clear severity rankings and actionable recommendations.""",
            
            expected_output_format="""
{
  "deficiency_analysis": {
    "critical_deficiencies": [
      {
        "nutrient": "N/P/K/S/micronutrient",
        "current_level": "value with units",
        "threshold_level": "critical threshold",
        "severity": "Critical/Moderate/Mild", 
        "urgency": "Immediate/2-weeks/Long-term",
        "symptoms_expected": "description",
        "correction_strategy": "detailed strategy"
      }
    ],
    "secondary_concerns": [...],
    "monitoring_nutrients": [...]
  },
  "correction_recommendations": [
    {
      "nutrient": "specific nutrient",
      "correction_method": "foliar/soil/both",
      "products": ["specific products"],
      "application_rate": "precise rate",
      "timing": "immediate/within days",
      "expected_response_time": "timeframe"
    }
  ]
}
""",
            max_tokens=2048,
            temperature=0.2
        )
    
    def _get_fertilizer_optimization_template(self) -> PromptTemplate:
        """Fertilizer optimization prompt template"""
        return PromptTemplate(
            name="fertilizer_optimization",
            version="2.0.0",
            provider_compatibility=[
                LLMProvider.GEMINI, LLMProvider.OPENAI, LLMProvider.CLAUDE,
                LLMProvider.LLAMA, LLMProvider.COHERE
            ],
            system_prompt="""You are a fertilizer optimization specialist with expertise in:
- Fertilizer chemistry and nutrient content analysis
- Cost-effective nutrient delivery strategies
- Product compatibility and mixing guidelines
- Application efficiency optimization
- Sustainable fertilizer selection

{provider_specific}

Your goal is to recommend the most cost-effective, efficient, and sustainable fertilizer combination that meets the specified nutrient requirements while respecting user constraints.""",
            
            user_prompt_template="""# FERTILIZER OPTIMIZATION REQUEST

## NUTRIENT REQUIREMENTS
{nutrient_requirements}

## AVAILABLE FERTILIZER PRODUCTS
{available_products}

## CONSTRAINTS & PREFERENCES
- Budget Constraint: {budget_constraint}
- Organic Preference: {organic_preference}
- Sustainability Focus: {sustainability_focus}
- Application Method Preferences: {application_method_preferences}

## OPTIMIZATION OBJECTIVES
1. Meet all nutrient requirements efficiently
2. Minimize total cost while maintaining quality
3. Optimize application convenience and timing
4. Consider product compatibility and mixing
5. Respect user preferences and constraints

Please analyze the available products and recommend the optimal fertilizer combination that:
- Provides required nutrients at target rates
- Minimizes cost per unit of nutrient delivered
- Considers application efficiency and convenience
- Respects organic/sustainability preferences
- Identifies any gaps or over-applications

Provide detailed reasoning for product selections and alternative options.""",
            
            expected_output_format="""
{
  "optimization_results": {
    "recommended_combination": [
      {
        "product_name": "specific product",
        "application_rate": "kg/ha or specific rate",
        "nutrients_provided": {"N": "kg/ha", "P": "kg/ha", "K": "kg/ha"},
        "cost_per_hectare": "cost estimate",
        "application_method": "method",
        "timing": "optimal timing"
      }
    ],
    "total_cost_per_hectare": "total cost",
    "cost_per_kg_nutrient": {"N": "cost", "P": "cost", "K": "cost"},
    "nutrient_balance": {
      "requirements_met": "percentage",
      "over_application": "any nutrients",
      "under_application": "any nutrients"
    }
  },
  "alternatives": [
    {
      "option_name": "alternative description",
      "products": ["product list"],
      "cost_difference": "vs primary recommendation",
      "trade_offs": "pros and cons"
    }
  ],
  "application_guidelines": {
    "mixing_compatibility": "compatibility notes",
    "application_sequence": "order of application",
    "storage_requirements": "storage notes",
    "safety_considerations": "safety notes"
  }
}
""",
            max_tokens=3072,
            temperature=0.4
        )
    
    def _get_application_scheduling_template(self) -> PromptTemplate:
        """Application scheduling prompt template"""
        return PromptTemplate(
            name="application_scheduling",
            version="2.0.0",
            provider_compatibility=[
                LLMProvider.GEMINI, LLMProvider.OPENAI, LLMProvider.CLAUDE,
                LLMProvider.LLAMA, LLMProvider.COHERE
            ],
            system_prompt="""You are an application timing specialist with expertise in:
- Crop phenology and nutrient uptake timing
- Weather-dependent application strategies
- Fertilizer application methods and efficiency
- Precision agriculture timing optimization

{provider_specific}

Design optimal application schedules that maximize nutrient efficiency while considering crop needs, weather conditions, and practical constraints.""",
            
            user_prompt_template="""# APPLICATION SCHEDULING REQUEST

## CROP DETAILS
{crop_details}

## FERTILIZER PLAN
{fertilizer_plan}

## WEATHER FORECAST (Next 7 Days)
{weather_forecast}

## CRITICAL GROWTH STAGES
{critical_growth_stages}

## OPTIMAL APPLICATION WINDOWS
{application_windows}

## SCHEDULING REQUIREMENTS
Create a detailed application schedule that:

1. **TIMING OPTIMIZATION**: Aligns applications with peak nutrient demand periods
2. **WEATHER INTEGRATION**: Avoids poor weather conditions and optimizes uptake
3. **METHOD SELECTION**: Chooses optimal application methods for each nutrient/timing
4. **EFFICIENCY MAXIMIZATION**: Minimizes losses and maximizes crop uptake
5. **PRACTICAL CONSIDERATIONS**: Considers labor, equipment, and operational constraints

For each application event, specify:
- Exact timing recommendations
- Weather requirements for application
- Application method and equipment needs
- Expected nutrient uptake efficiency
- Backup timing if weather doesn't cooperate""",
            
            expected_output_format="""
{
  "application_schedule": [
    {
      "application_id": "unique identifier",
      "timing": {
        "target_date": "specific date or crop stage",
        "optimal_window": "date range",
        "backup_window": "alternative timing"
      },
      "fertilizers": [
        {
          "product": "specific product",
          "rate": "application rate",
          "method": "application method"
        }
      ],
      "weather_requirements": {
        "temperature_range": "optimal range",
        "wind_speed_max": "maximum acceptable",
        "precipitation_restrictions": "requirements",
        "humidity_considerations": "if applicable"
      },
      "expected_outcomes": {
        "uptake_efficiency": "percentage",
        "crop_response_timeframe": "days to response",
        "monitoring_indicators": ["what to watch for"]
      }
    }
  ],
  "contingency_plans": [
    {
      "scenario": "weather delay/other issue",
      "alternative_action": "backup plan",
      "modified_rates": "if needed"
    }
  ]
}
""",
            max_tokens=2048,
            temperature=0.3
        )
    
    def _get_cost_benefit_template(self) -> PromptTemplate:
        """Cost-benefit analysis prompt template"""
        return PromptTemplate(
            name="cost_benefit_analysis",
            version="2.0.0",
            provider_compatibility=[
                LLMProvider.GEMINI, LLMProvider.OPENAI, LLMProvider.CLAUDE,
                LLMProvider.LLAMA, LLMProvider.COHERE
            ],
            system_prompt="""You are an agricultural economist specializing in nutrient management ROI analysis.

{provider_specific}

Your expertise includes:
- Fertilizer cost analysis and market trends
- Yield response modeling and profit optimization
- Risk-adjusted return calculations
- Break-even analysis for agricultural inputs

Provide comprehensive economic analysis of the fertilizer plan with realistic ROI projections.""",
            
            user_prompt_template="""# COST-BENEFIT ANALYSIS REQUEST

## FERTILIZER PLAN
{fertilizer_plan}

## FARM CONTEXT
- Farm Size: {farm_size}
- Crop Type: {crop_type}  
- Target Yield: {target_yield}

## MARKET DATA
{market_prices}

## ANALYSIS PERIOD
{investment_period}

## ANALYSIS REQUIREMENTS
Provide comprehensive economic analysis including:

1. **TOTAL INVESTMENT COSTS**: All fertilizer and application costs
2. **YIELD IMPACT PROJECTIONS**: Expected yield increases from nutrient applications
3. **REVENUE PROJECTIONS**: Projected additional revenue from improved yields
4. **ROI CALCULATIONS**: Return on investment with different scenarios
5. **BREAK-EVEN ANALYSIS**: Minimum yield increase needed to justify costs
6. **RISK ASSESSMENT**: Economic risks and sensitivity analysis
7. **PAYBACK PERIOD**: Time to recover investment
8. **ALTERNATIVE SCENARIOS**: Different budget/approach comparisons

Consider both optimistic and conservative yield response scenarios.""",
            
            expected_output_format="""
{
  "economic_analysis": {
    "total_investment": {
      "fertilizer_costs": "cost breakdown",
      "application_costs": "labor/equipment costs", 
      "total_cost_per_hectare": "total cost",
      "total_farm_investment": "total farm cost"
    },
    "yield_projections": {
      "baseline_yield": "current expected yield",
      "projected_yield_increase": "percentage increase",
      "conservative_scenario": "low-end estimate",
      "optimistic_scenario": "high-end estimate"
    },
    "revenue_analysis": {
      "additional_revenue_per_hectare": "revenue increase",
      "total_additional_revenue": "total farm revenue increase",
      "revenue_scenarios": {
        "conservative": "low estimate",
        "expected": "mid estimate", 
        "optimistic": "high estimate"
      }
    },
    "roi_calculations": {
      "expected_roi": "percentage return",
      "roi_range": "conservative to optimistic",
      "payback_period": "months/seasons to break even",
      "net_present_value": "NPV calculation"
    },
    "break_even_analysis": {
      "break_even_yield_increase": "minimum % increase needed",
      "break_even_price": "minimum crop price needed",
      "sensitivity_factors": ["key variables affecting profitability"]
    },
    "risk_assessment": {
      "investment_risk_level": "low/medium/high",
      "key_risk_factors": ["factors that could affect ROI"],
      "mitigation_strategies": ["ways to reduce risk"]
    }
  }
}
""",
            max_tokens=2048,
            temperature=0.3
        )
    
    def _get_risk_assessment_template(self) -> PromptTemplate:
        """Risk assessment prompt template"""
        return PromptTemplate(
            name="risk_assessment",
            version="2.0.0",
            provider_compatibility=[
                LLMProvider.GEMINI, LLMProvider.OPENAI, LLMProvider.CLAUDE,
                LLMProvider.LLAMA, LLMProvider.COHERE
            ],
            system_prompt="""You are a risk assessment specialist for agricultural nutrient management.

{provider_specific}

Your expertise includes:
- Environmental risk evaluation for fertilizer applications
- Economic and operational risk assessment
- Climate and weather risk factors
- Regulatory and compliance considerations
- Risk mitigation strategy development

Evaluate all potential risks associated with the nutrient management plan and provide actionable mitigation strategies.""",
            
            user_prompt_template="""# RISK ASSESSMENT REQUEST

## NUTRIENT PLAN
{nutrient_plan}

## ENVIRONMENTAL CONDITIONS
{environmental_conditions}

## IDENTIFIED RISK FACTORS
{risk_factors}

## STANDARD MITIGATION STRATEGIES
{mitigation_strategies}

## RISK ASSESSMENT REQUIREMENTS
Evaluate and analyze:

1. **ENVIRONMENTAL RISKS**: Nutrient runoff, leaching, volatilization
2. **ECONOMIC RISKS**: Cost overruns, poor ROI, market fluctuations
3. **OPERATIONAL RISKS**: Application timing, equipment failures, labor constraints
4. **WEATHER RISKS**: Precipitation, temperature extremes, application windows
5. **CROP RISKS**: Nutrient burn, deficiency persistence, yield impacts
6. **REGULATORY RISKS**: Compliance issues, environmental regulations

For each risk category, provide:
- Risk probability and impact assessment
- Specific mitigation strategies
- Monitoring requirements
- Contingency planning recommendations""",
            
            expected_output_format="""
{
  "risk_assessment": {
    "overall_risk_level": "low/medium/high",
    "risk_categories": {
      "environmental": {
        "risk_level": "low/medium/high",
        "key_risks": ["specific risks"],
        "mitigation_strategies": ["specific strategies"],
        "monitoring_requirements": ["what to monitor"]
      },
      "economic": {...},
      "operational": {...},
      "weather": {...},
      "crop_health": {...},
      "regulatory": {...}
    },
    "critical_risks": [
      {
        "risk_type": "specific risk",
        "probability": "low/medium/high",
        "impact": "low/medium/high",
        "mitigation": "specific mitigation strategy",
        "contingency": "backup plan"
      }
    ],
    "monitoring_plan": {
      "key_indicators": ["what to watch"],
      "monitoring_frequency": "how often",
      "decision_triggers": ["when to take action"]
    },
    "recommendations": {
      "immediate_actions": ["actions to take now"],
      "ongoing_monitoring": ["continuous monitoring needs"],
      "contingency_preparation": ["preparation for scenarios"]
    }
  }
}
""",
            max_tokens=2048,
            temperature=0.3
        )
    
    def _build_analysis_context(self, request: NutrientAnalysisRequest) -> Dict[str, str]:
        """Build comprehensive context for analysis prompt"""
        return {
            "soil_analysis": json.dumps(request.soil_analysis, indent=2),
            "crop_details": json.dumps(request.crop_info, indent=2), 
            "current_nutrients": json.dumps(request.current_nutrients, indent=2),
            "deficiencies_list": ", ".join(request.deficiencies) if request.deficiencies else "None identified",
            "farm_context": json.dumps(request.farm_context, indent=2),
            "weather_conditions": json.dumps(request.weather_forecast[:7], indent=2) if request.weather_forecast else "No weather data available",
            "user_preferences": json.dumps({
                "budget_constraints": request.budget_constraints,
                "organic_preference": request.organic_preference,
                "sustainability_focus": request.sustainability_focus,
                **request.user_preferences
            }, indent=2)
        }
    
    def _get_provider_instructions(self, provider: LLMProvider) -> str:
        """Get provider-specific instructions"""
        instructions = {
            LLMProvider.GEMINI: "Use Google Gemini's analytical capabilities for detailed scientific analysis. Provide comprehensive, well-structured responses.",
            LLMProvider.OPENAI: "Utilize OpenAI's reasoning capabilities for logical, step-by-step analysis. Focus on clear explanations and practical recommendations.",
            LLMProvider.CLAUDE: "Leverage Claude's thoughtful analysis approach. Provide nuanced recommendations with careful consideration of trade-offs.",
            LLMProvider.LLAMA: "Use systematic analysis and clear logical reasoning. Focus on practical, implementable recommendations.",
            LLMProvider.COHERE: "Provide coherent, well-structured analysis with emphasis on actionable insights."
        }
        return instructions.get(provider, "Provide detailed, scientific, and practical analysis.")
    
    def _get_critical_nutrients_for_crop(self, crop_info: Dict[str, Any]) -> str:
        """Get critical nutrients for specific crop"""
        crop_nutrients = {
            "wheat": "Nitrogen (critical), Phosphorus (important), Potassium (moderate), Sulfur (important)",
            "rice": "Nitrogen (critical), Phosphorus (critical), Potassium (important), Zinc (critical)", 
            "corn": "Nitrogen (critical), Phosphorus (critical), Potassium (critical), Sulfur (moderate)",
            "soybean": "Phosphorus (critical), Potassium (important), Sulfur (moderate), Molybdenum (important)",
            "cotton": "Nitrogen (critical), Phosphorus (important), Potassium (critical), Boron (important)"
        }
        
        crop_type = crop_info.get("species", "general").lower()
        return crop_nutrients.get(crop_type, "Nitrogen, Phosphorus, Potassium (primary macronutrients)")
    
    def _get_deficiency_thresholds(self, crop_info: Dict[str, Any]) -> str:
        """Get deficiency thresholds for crop"""
        # This would typically come from a database or configuration
        return """
        Critical Thresholds (kg/ha):
        - Nitrogen: < 150 (Critical), < 200 (Low)
        - Phosphorus: < 25 (Critical), < 40 (Low)  
        - Potassium: < 150 (Critical), < 200 (Low)
        - Sulfur: < 15 (Critical), < 25 (Low)
        """
    
    def _get_critical_growth_stages(self, crop_info: Dict[str, Any]) -> str:
        """Get critical growth stages for crop"""
        stages = {
            "wheat": "Tillering, Stem elongation, Booting, Grain filling",
            "rice": "Tillering, Panicle initiation, Flowering, Grain filling",
            "corn": "V6 (6-leaf), V12 (12-leaf), Tasseling, Grain filling",
            "soybean": "V3 (3rd trifoliate), R1 (flowering), R3 (pod formation), R5 (seed filling)"
        }
        
        crop_type = crop_info.get("species", "general").lower()
        return stages.get(crop_type, "Vegetative growth, Reproductive initiation, Flowering, Maturity")
    
    def _get_optimal_application_windows(self, crop_info: Dict[str, Any]) -> str:
        """Get optimal application windows for crop"""
        return """
        Optimal Application Windows:
        - Basal: Pre-planting to 2 weeks after planting
        - First Top-dress: Early vegetative stage (4-6 weeks after planting)
        - Second Top-dress: Mid to late vegetative stage (8-10 weeks)
        - Foliar: Any stage, but most effective during active growth periods
        """
    
    def _identify_potential_risks(self, analysis_results: Dict[str, Any], environmental_factors: Dict[str, Any]) -> str:
        """Identify potential risks from analysis"""
        risks = []
        
        # Weather-based risks
        if environmental_factors.get("high_precipitation_forecast"):
            risks.append("Nutrient leaching due to heavy rainfall")
        
        if environmental_factors.get("high_temperature_forecast"):
            risks.append("Volatilization losses in high temperatures")
        
        # Soil-based risks
        soil_ph = analysis_results.get("soil_analysis", {}).get("ph", 7.0)
        if soil_ph < 5.5:
            risks.append("Reduced nutrient availability in acidic soil")
        elif soil_ph > 8.0:
            risks.append("Micronutrient deficiencies in alkaline soil")
        
        # Application-based risks
        if analysis_results.get("high_application_rates"):
            risks.append("Risk of nutrient burn or over-application")
        
        return ", ".join(risks) if risks else "No major risks identified"
    
    def _get_standard_mitigation_strategies(self) -> str:
        """Get standard mitigation strategies"""
        return """
        Standard Mitigation Strategies:
        - Split applications to reduce loss risks
        - Use slow-release fertilizers in high-risk conditions
        - Apply during optimal weather windows
        - Monitor soil and plant tissue for nutrient status
        - Adjust rates based on soil test results
        - Use precision application technology
        - Implement cover crops to prevent nutrient loss
        - Follow 4R nutrient stewardship principles (Right rate, Right time, Right place, Right source)
        """


# Global prompt engine instance
prompt_engine = AgriculturalPromptEngine()


def get_prompt_engine() -> AgriculturalPromptEngine:
    """Get global prompt engine instance"""
    return prompt_engine
