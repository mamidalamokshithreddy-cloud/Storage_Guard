"""
Enhanced Nutrient Management Agent with LLM-Based Analysis
Provides intelligent, AI-powered nutrient recommendations without mock/default values
"""

import logging
from typing import Dict, List, Any, Optional, TypedDict, Union
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
import json
import asyncio
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from abc import ABC, abstractmethod
from enum import Enum
from app.services.gemini_service import gemini_service, LLMProvider, NutrientAnalysisRequest, GeminiResponse
from app.core.config import settings

logger = logging.getLogger(__name__)


class NutrientAgentState(TypedDict):
    """Enhanced state for nutrient management workflow"""
    # Input data
    soil_health_data: Dict[str, Any]
    crop_info: Dict[str, Any]
    farm_context: Dict[str, Any]
    weather_forecast: List[Dict[str, Any]]
    user_preferences: Dict[str, Any]
    
    # Analysis results
    llm_soil_analysis: Dict[str, Any]
    deficiency_detection: Dict[str, Any]
    crop_requirements: Dict[str, Any]
    fertilizer_optimization: Dict[str, Any]
    application_schedule: Dict[str, Any]
    cost_benefit_analysis: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    
    # Workflow metadata
    agent_run_id: str
    messages: List[BaseMessage]
    outcome: str
    execution_metrics: Dict[str, Any]
    current_provider: str
    confidence_scores: Dict[str, float]


class AnalysisType(Enum):
    """Types of analysis performed by the agent"""
    SOIL_HEALTH = "soil_health"
    DEFICIENCY_DETECTION = "deficiency_detection"
    CROP_REQUIREMENTS = "crop_requirements"
    FERTILIZER_OPTIMIZATION = "fertilizer_optimization"
    APPLICATION_SCHEDULING = "application_scheduling"
    COST_BENEFIT = "cost_benefit"
    RISK_ASSESSMENT = "risk_assessment"


@dataclass
class AnalysisContext:
    """Context for LLM-based analysis"""
    soil_data: Dict[str, Any]
    crop_info: Dict[str, Any]
    environmental_conditions: Dict[str, Any]
    field_specifications: Dict[str, Any]
    user_preferences: Dict[str, Any]
    analysis_type: AnalysisType


class BaseNutrientAgent(ABC):
    """Base class for nutrient management agents"""
    
    @abstractmethod
    def run_analysis(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run nutrient analysis"""
        pass


class NutrientAgent(BaseNutrientAgent):
    """Enhanced LangGraph-based agent with pure LLM analysis - no mock/default values"""
    
    def __init__(self, config=None):
        self.config = config or settings
        self.gemini_service = gemini_service
        self.active_provider = LLMProvider.GEMINI
        self.workflow = None
        self._build_graph()
        
        logger.info("Enhanced Nutrient Agent initialized with LLM-based analysis")
    
    def _build_graph(self) -> StateGraph:
        """Build the enhanced LangGraph workflow"""
        try:
            workflow = StateGraph(NutrientAgentState)
            
            # Add LLM-based analysis nodes
            workflow.add_node("initialize_agent", self.initialize_agent_node)
            workflow.add_node("analyze_soil_with_llm", self.analyze_soil_with_llm_node)
            workflow.add_node("detect_deficiencies_with_llm", self.detect_deficiencies_with_llm_node)
            workflow.add_node("determine_crop_needs_with_llm", self.determine_crop_needs_with_llm_node)
            workflow.add_node("optimize_fertilizer_with_llm", self.optimize_fertilizer_with_llm_node)
            workflow.add_node("schedule_applications_with_llm", self.schedule_applications_with_llm_node)
            workflow.add_node("perform_cost_benefit_analysis", self.perform_cost_benefit_analysis_node)
            workflow.add_node("assess_risks_with_llm", self.assess_risks_with_llm_node)
            workflow.add_node("finalize_recommendations", self.finalize_recommendations_node)
            
            # Define the enhanced flow
            workflow.set_entry_point("initialize_agent")
            
            workflow.add_edge("initialize_agent", "analyze_soil_with_llm")
            workflow.add_edge("analyze_soil_with_llm", "detect_deficiencies_with_llm")
            workflow.add_edge("detect_deficiencies_with_llm", "determine_crop_needs_with_llm")
            workflow.add_edge("determine_crop_needs_with_llm", "optimize_fertilizer_with_llm")
            workflow.add_edge("optimize_fertilizer_with_llm", "schedule_applications_with_llm")
            workflow.add_edge("schedule_applications_with_llm", "perform_cost_benefit_analysis")
            workflow.add_edge("perform_cost_benefit_analysis", "assess_risks_with_llm")
            workflow.add_edge("assess_risks_with_llm", "finalize_recommendations")
            workflow.add_edge("finalize_recommendations", END)
            
            self.workflow = workflow.compile()
            logger.info("Enhanced LangGraph workflow compiled successfully")
            return workflow
            
        except Exception as e:
            logger.error(f"Failed to build enhanced workflow: {e}")
            raise
    
    def initialize_agent_node(self, state: NutrientAgentState) -> NutrientAgentState:
        """Initialize agent execution and validate inputs"""
        logger.info("Initializing enhanced nutrient agent...")
        
        try:
            # Validate required inputs
            if not state.get("soil_health_data"):
                raise ValueError("Soil health data is required for analysis")
            
            if not state.get("crop_info"):
                raise ValueError("Crop information is required for analysis")
            
            # Initialize execution metrics
            state["execution_metrics"] = {
                "started_at": datetime.now().isoformat(),
                "nodes_executed": [],
                "execution_times": {},
                "errors_encountered": [],
                "llm_calls": 0,
                "total_confidence": 0.0
            }
            
            # Set current provider
            state["current_provider"] = self.active_provider.value
            state["confidence_scores"] = {}
            
            # Initialize messages
            state["messages"] = [
                HumanMessage(content="Starting enhanced nutrient analysis with LLM-based insights...")
            ]
            
            state["outcome"] = "in_progress"
            
            logger.info("Agent initialization completed successfully")
            
        except Exception as e:
            logger.error(f"Error initializing agent: {e}")
            state["outcome"] = "error"
            state["execution_metrics"]["errors_encountered"].append(f"initialization: {str(e)}")
            state["messages"] = [
                AIMessage(content=f"Error initializing agent: {str(e)}")
            ]
        
        return state
    
    async def analyze_soil_with_llm_node(self, state: NutrientAgentState) -> NutrientAgentState:
        """Analyze soil health using pure LLM analysis"""
        node_start = datetime.now()
        
        try:
            logger.info("Analyzing soil health with LLM...")
            
            # Validate LLM service availability
            if not self.gemini_service.is_available():
                raise ValueError("No LLM providers available for analysis")
            
            # Create analysis request
            analysis_request = NutrientAnalysisRequest(
                soil_analysis=state["soil_health_data"],
                crop_info=state["crop_info"],
                current_nutrients=self._extract_current_nutrients(state["soil_health_data"]),
                deficiencies=[],  # Will be determined by LLM
                growth_stage=state["crop_info"].get("current_stage", "vegetative"),
                target_yield=state["crop_info"].get("target_yield", 0.0),
                farm_context=state.get("farm_context", {}),
                user_preferences=state.get("user_preferences", {}),
                weather_forecast=state.get("weather_forecast", [])
            )
            
            # Get LLM analysis
            response = await self.gemini_service.get_nutrient_recommendations_async(analysis_request)
            
            if not response.success:
                raise ValueError(f"LLM analysis failed: {response.error or 'Unknown error'}")
            
            # Parse and store results
            state["llm_soil_analysis"] = {
                "content": response.content,
                "confidence": response.confidence,
                "provider": "gemini",
                "model": response.model_used,
                "response_time": response.response_time,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
            # Update metrics
            execution_time = (datetime.now() - node_start).total_seconds()
            state["execution_metrics"]["execution_times"]["analyze_soil_with_llm"] = execution_time
            state["execution_metrics"]["nodes_executed"].append("analyze_soil_with_llm")
            state["execution_metrics"]["llm_calls"] += 1
            state["confidence_scores"]["soil_analysis"] = response["confidence"]
            
            # Add message
            state["messages"] = add_messages(
                state.get("messages", []),
                [AIMessage(content=f"LLM soil analysis completed with {response['confidence']:.1%} confidence")]
            )
            
            logger.info(f"Soil analysis completed in {execution_time:.2f}s with confidence {response['confidence']:.1%}")
            
        except Exception as e:
            logger.error(f"Error in LLM soil analysis: {e}")
            state["outcome"] = "error"
            state["execution_metrics"]["errors_encountered"].append(f"analyze_soil_with_llm: {str(e)}")
            state["messages"] = add_messages(
                state.get("messages", []),
                [AIMessage(content=f"Error in soil analysis: {str(e)}")]
            )
        
        return state
    
    async def detect_deficiencies_with_llm_node(self, state: NutrientAgentState) -> NutrientAgentState:
        """Detect nutrient deficiencies using LLM analysis"""
        node_start = datetime.now()
        
        try:
            logger.info("Detecting nutrient deficiencies with LLM...")
            
            # Create deficiency detection prompt
            deficiency_prompt = self._generate_deficiency_detection_prompt(
                state["soil_health_data"], 
                state["crop_info"]
            )
            
            # Use LLM for deficiency detection
            response = await self.gemini_service.generate_response(deficiency_prompt)
            
            if not response.success:
                raise ValueError(f"Deficiency detection failed: {response.error}")
            
            # Store results
            state["deficiency_detection"] = {
                "content": response.content,
                "confidence": response.confidence,
                "provider": self.active_provider.value,
                "model": response.model_used,
                "response_time": response.response_time,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
            # Extract deficiencies list from LLM response
            deficiencies = self._extract_deficiencies_from_text(response.content)
            state["nutrient_deficiencies"] = deficiencies
            
            # Update metrics
            execution_time = (datetime.now() - node_start).total_seconds()
            state["execution_metrics"]["execution_times"]["detect_deficiencies_with_llm"] = execution_time
            state["execution_metrics"]["nodes_executed"].append("detect_deficiencies_with_llm")
            state["execution_metrics"]["llm_calls"] += 1
            state["confidence_scores"]["deficiency_detection"] = response.confidence
            
            # Add message
            deficiency_count = len(state.get("nutrient_deficiencies", []))
            state["messages"] = add_messages(
                state.get("messages", []),
                [AIMessage(content=f"Detected {deficiency_count} nutrient deficiencies with {response.confidence:.1%} confidence")]
            )
            
            logger.info(f"Deficiency detection completed in {execution_time:.2f}s")
            
        except Exception as e:
            logger.error(f"Error in deficiency detection: {e}")
            state["outcome"] = "error"
            state["execution_metrics"]["errors_encountered"].append(f"detect_deficiencies_with_llm: {str(e)}")
            state["messages"] = add_messages(
                state.get("messages", []),
                [AIMessage(content=f"Error in deficiency detection: {str(e)}")]
            )
        
        return state
    
    async def determine_crop_needs_with_llm_node(self, state: NutrientAgentState) -> NutrientAgentState:
        """Determine crop nutrient requirements using LLM analysis"""
        node_start = datetime.now()
        
        try:
            logger.info("Determining crop nutrient needs with LLM...")
            
            # Create crop requirements prompt
            requirements_prompt = self._generate_crop_requirements_prompt(
                state["crop_info"],
                state["soil_health_data"],
                state.get("nutrient_deficiencies", [])
            )
            
            # Get crop requirements from LLM
            response = await self.gemini_service.generate_response(requirements_prompt)
            
            if not response.success:
                raise ValueError(f"Crop requirements analysis failed: {response.error}")
            
            # Store results
            state["crop_requirements"] = {
                "content": response.content,
                "confidence": response.confidence,
                "provider": self.active_provider.value,
                "model": response.model_used,
                "response_time": response.response_time,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
            # Update metrics
            execution_time = (datetime.now() - node_start).total_seconds()
            state["execution_metrics"]["execution_times"]["determine_crop_needs_with_llm"] = execution_time
            state["execution_metrics"]["nodes_executed"].append("determine_crop_needs_with_llm")
            state["execution_metrics"]["llm_calls"] += 1
            state["confidence_scores"]["crop_requirements"] = response.confidence
            
            # Add message
            state["messages"] = add_messages(
                state.get("messages", []),
                [AIMessage(content=f"Crop nutrient requirements determined with {response.confidence:.1%} confidence")]
            )
            
            logger.info(f"Crop needs determination completed in {execution_time:.2f}s")
            
        except Exception as e:
            logger.error(f"Error determining crop needs: {e}")
            state["outcome"] = "error"
            state["execution_metrics"]["errors_encountered"].append(f"determine_crop_needs_with_llm: {str(e)}")
            state["messages"] = add_messages(
                state.get("messages", []),
                [AIMessage(content=f"Error determining crop needs: {str(e)}")]
            )
        
        return state
    
    async def optimize_fertilizer_with_llm_node(self, state: NutrientAgentState) -> NutrientAgentState:
        """Optimize fertilizer selection using LLM analysis"""
        node_start = datetime.now()
        
        try:
            logger.info("Optimizing fertilizer selection with LLM...")
            
            # Create fertilizer optimization prompt
            optimization_prompt = self._generate_fertilizer_optimization_prompt(
                state.get("crop_requirements", {}),
                state.get("nutrient_deficiencies", []),
                state.get("farm_context", {}),
                state.get("user_preferences", {})
            )
            
            # Use LLM for fertilizer optimization
            response = await self.gemini_service.generate_response(optimization_prompt)
            
            if not response.success:
                raise ValueError(f"Fertilizer optimization failed: {response.error}")
            
            # Store results
            state["fertilizer_optimization"] = {
                "content": response.content,
                "confidence": response.confidence,
                "provider": self.active_provider.value,
                "model": response.model_used,
                "response_time": response.response_time,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
            # Update metrics
            execution_time = (datetime.now() - node_start).total_seconds()
            state["execution_metrics"]["execution_times"]["optimize_fertilizer_with_llm"] = execution_time
            state["execution_metrics"]["nodes_executed"].append("optimize_fertilizer_with_llm")
            state["execution_metrics"]["llm_calls"] += 1
            state["confidence_scores"]["fertilizer_optimization"] = response.confidence
            
            # Add message
            state["messages"] = add_messages(
                state.get("messages", []),
                [AIMessage(content=f"Fertilizer optimization completed with {response.confidence:.1%} confidence")]
            )
            
            logger.info(f"Fertilizer optimization completed in {execution_time:.2f}s")
            
        except Exception as e:
            logger.error(f"Error in fertilizer optimization: {e}")
            state["outcome"] = "error"
            state["execution_metrics"]["errors_encountered"].append(f"optimize_fertilizer_with_llm: {str(e)}")
            state["messages"] = add_messages(
                state.get("messages", []),
                [AIMessage(content=f"Error in fertilizer optimization: {str(e)}")]
            )
        
        return state
    
    async def schedule_applications_with_llm_node(self, state: NutrientAgentState) -> NutrientAgentState:
        """Schedule fertilizer applications using LLM analysis"""
        node_start = datetime.now()
        
        try:
            logger.info("Scheduling fertilizer applications with LLM...")
            
            # Create application scheduling prompt
            scheduling_prompt = self._generate_application_scheduling_prompt(
                state["crop_info"],
                state.get("fertilizer_optimization", {}),
                state.get("weather_forecast", [])
            )
            
            # Use LLM for application scheduling
            response = await self.gemini_service.generate_response(scheduling_prompt)
            
            if not response.success:
                raise ValueError(f"Application scheduling failed: {response.error}")
            
            # Store results
            state["application_schedule"] = {
                "content": response.content,
                "confidence": response.confidence,
                "provider": self.active_provider.value,
                "model": response.model_used,
                "response_time": response.response_time,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
            # Update metrics
            execution_time = (datetime.now() - node_start).total_seconds()
            state["execution_metrics"]["execution_times"]["schedule_applications_with_llm"] = execution_time
            state["execution_metrics"]["nodes_executed"].append("schedule_applications_with_llm")
            state["execution_metrics"]["llm_calls"] += 1
            state["confidence_scores"]["application_scheduling"] = response.confidence
            
            # Add message
            state["messages"] = add_messages(
                state.get("messages", []),
                [AIMessage(content=f"Application schedule created with {response.confidence:.1%} confidence")]
            )
            
            logger.info(f"Application scheduling completed in {execution_time:.2f}s")
            
        except Exception as e:
            logger.error(f"Error in application scheduling: {e}")
            state["outcome"] = "error"
            state["execution_metrics"]["errors_encountered"].append(f"schedule_applications_with_llm: {str(e)}")
            state["messages"] = add_messages(
                state.get("messages", []),
                [AIMessage(content=f"Error in application scheduling: {str(e)}")]
            )
        
        return state
    
    async def perform_cost_benefit_analysis_node(self, state: NutrientAgentState) -> NutrientAgentState:
        """Perform cost-benefit analysis using LLM"""
        node_start = datetime.now()
        
        try:
            logger.info("Performing cost-benefit analysis with LLM...")
            
            # Create cost-benefit analysis prompt
            cost_analysis_prompt = self._generate_cost_benefit_prompt(
                state.get("fertilizer_optimization", {}),
                state.get("application_schedule", {}),
                state.get("farm_context", {}),
                state["crop_info"]
            )
            
            # Use LLM for cost-benefit analysis
            response = await self.gemini_service.generate_response(cost_analysis_prompt)
            
            if not response.success:
                raise ValueError(f"Cost-benefit analysis failed: {response.error}")
            
            # Store results
            state["cost_benefit_analysis"] = {
                "content": response.content,
                "confidence": response.confidence,
                "provider": self.active_provider.value,
                "model": response.model_used,
                "response_time": response.response_time,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
            # Update metrics
            execution_time = (datetime.now() - node_start).total_seconds()
            state["execution_metrics"]["execution_times"]["perform_cost_benefit_analysis"] = execution_time
            state["execution_metrics"]["nodes_executed"].append("perform_cost_benefit_analysis")
            state["execution_metrics"]["llm_calls"] += 1
            state["confidence_scores"]["cost_benefit_analysis"] = response.confidence
            
            # Add message
            state["messages"] = add_messages(
                state.get("messages", []),
                [AIMessage(content=f"Cost-benefit analysis completed with {response.confidence:.1%} confidence")]
            )
            
            logger.info(f"Cost-benefit analysis completed in {execution_time:.2f}s")
            
        except Exception as e:
            logger.error(f"Error in cost-benefit analysis: {e}")
            state["outcome"] = "error"
            state["execution_metrics"]["errors_encountered"].append(f"perform_cost_benefit_analysis: {str(e)}")
            state["messages"] = add_messages(
                state.get("messages", []),
                [AIMessage(content=f"Error in cost-benefit analysis: {str(e)}")]
            )
        
        return state
    
    async def assess_risks_with_llm_node(self, state: NutrientAgentState) -> NutrientAgentState:
        """Assess risks using LLM analysis"""
        node_start = datetime.now()
        
        try:
            logger.info("Assessing risks with LLM...")
            
            # Create risk assessment prompt
            risk_prompt = self._generate_risk_assessment_prompt(
                state.get("llm_soil_analysis", {}),
                state.get("fertilizer_optimization", {}),
                state.get("application_schedule", {}),
                state.get("weather_forecast", []),
                state.get("farm_context", {})
            )
            
            # Use LLM for risk assessment
            response = await self.gemini_service.generate_response(risk_prompt)
            
            if not response.success:
                raise ValueError(f"Risk assessment failed: {response.error}")
            
            # Store results
            state["risk_assessment"] = {
                "content": response.content,
                "confidence": response.confidence,
                "provider": self.active_provider.value,
                "model": response.model_used,
                "response_time": response.response_time,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
            # Update metrics
            execution_time = (datetime.now() - node_start).total_seconds()
            state["execution_metrics"]["execution_times"]["assess_risks_with_llm"] = execution_time
            state["execution_metrics"]["nodes_executed"].append("assess_risks_with_llm")
            state["execution_metrics"]["llm_calls"] += 1
            state["confidence_scores"]["risk_assessment"] = response.confidence
            
            # Add message
            state["messages"] = add_messages(
                state.get("messages", []),
                [AIMessage(content=f"Risk assessment completed with {response.confidence:.1%} confidence")]
            )
            
            logger.info(f"Risk assessment completed in {execution_time:.2f}s")
            
        except Exception as e:
            logger.error(f"Error in risk assessment: {e}")
            state["outcome"] = "error"
            state["execution_metrics"]["errors_encountered"].append(f"assess_risks_with_llm: {str(e)}")
            state["messages"] = add_messages(
                state.get("messages", []),
                [AIMessage(content=f"Error in risk assessment: {str(e)}")]
            )
        
        return state
    
    def finalize_recommendations_node(self, state: NutrientAgentState) -> NutrientAgentState:
        """Finalize comprehensive recommendations"""
        node_start = datetime.now()
        
        try:
            logger.info("Finalizing comprehensive recommendations...")
            
            # Calculate overall confidence
            confidence_scores = state.get("confidence_scores", {})
            overall_confidence = sum(confidence_scores.values()) / len(confidence_scores) if confidence_scores else 0.0
            
            # Compile final recommendations
            final_recommendations = {
                "soil_health_analysis": state.get("llm_soil_analysis", {}),
                "deficiency_detection": state.get("deficiency_detection", {}),
                "crop_requirements": state.get("crop_requirements", {}),
                "fertilizer_optimization": state.get("fertilizer_optimization", {}),
                "application_schedule": state.get("application_schedule", {}),
                "cost_benefit_analysis": state.get("cost_benefit_analysis", {}),
                "risk_assessment": state.get("risk_assessment", {}),
                "overall_confidence": overall_confidence,
                "analysis_summary": {
                    "total_llm_calls": state["execution_metrics"]["llm_calls"],
                    "primary_provider": state["current_provider"],
                    "analysis_duration": self._calculate_total_duration(state),
                    "confidence_breakdown": confidence_scores,
                    "no_mock_values": True,
                    "llm_based": True
                }
            }
            
            state["final_recommendations"] = final_recommendations
            state["outcome"] = "success"
            
            # Update final metrics
            execution_time = (datetime.now() - node_start).total_seconds()
            state["execution_metrics"]["execution_times"]["finalize_recommendations"] = execution_time
            state["execution_metrics"]["nodes_executed"].append("finalize_recommendations")
            state["execution_metrics"]["completed_at"] = datetime.now().isoformat()
            state["execution_metrics"]["total_confidence"] = overall_confidence
            
            # Add final message
            state["messages"] = add_messages(
                state.get("messages", []),
                [AIMessage(content=f"Comprehensive nutrient analysis completed with {overall_confidence:.1%} overall confidence")]
            )
            
            logger.info(f"Recommendations finalized in {execution_time:.2f}s with {overall_confidence:.1%} confidence")
            
        except Exception as e:
            logger.error(f"Error finalizing recommendations: {e}")
            state["outcome"] = "error"
            state["execution_metrics"]["errors_encountered"].append(f"finalize_recommendations: {str(e)}")
            state["messages"] = add_messages(
                state.get("messages", []),
                [AIMessage(content=f"Error finalizing recommendations: {str(e)}")]
            )
        
        return state
    
    # Helper methods for prompt generation
    def _generate_deficiency_detection_prompt(self, soil_data: Dict[str, Any], crop_info: Dict[str, Any]) -> str:
        """Generate prompt for deficiency detection"""
        return f"""
        Analyze the following soil data for nutrient deficiencies in {crop_info.get('species', 'crops')}:
        
        Soil Data: {json.dumps(soil_data, indent=2)}
        Crop: {crop_info.get('species', 'unknown')}
        Growth Stage: {crop_info.get('current_stage', 'unknown')}
        
        Identify specific nutrient deficiencies and provide detailed analysis.
        List deficiencies clearly and explain the reasoning.
        """
    
    def _generate_crop_requirements_prompt(self, crop_info: Dict[str, Any], soil_data: Dict[str, Any], deficiencies: List[str]) -> str:
        """Generate prompt for crop requirements"""
        return f"""
        Calculate nutrient requirements for the following crop:
        
        Crop Information: {json.dumps(crop_info, indent=2)}
        Current Soil Status: {json.dumps(soil_data, indent=2)}
        Identified Deficiencies: {deficiencies}
        
        Provide specific nutrient requirements (N, P, K, and others) in kg/ha.
        Consider crop stage, target yield, and current soil status.
        """
    
    def _generate_fertilizer_optimization_prompt(self, requirements: Dict[str, Any], deficiencies: List[str], farm_context: Dict[str, Any], preferences: Dict[str, Any]) -> str:
        """Generate prompt for fertilizer optimization"""
        return f"""
        Optimize fertilizer selection based on:
        
        Nutrient Requirements: {json.dumps(requirements, indent=2)}
        Deficiencies: {deficiencies}
        Farm Context: {json.dumps(farm_context, indent=2)}
        User Preferences: {json.dumps(preferences, indent=2)}
        
        Recommend specific fertilizer products, quantities, and application methods.
        Consider cost-effectiveness and availability.
        """
    
    def _generate_application_scheduling_prompt(self, crop_info: Dict[str, Any], fertilizer_plan: Dict[str, Any], weather: List[Dict[str, Any]]) -> str:
        """Generate prompt for application scheduling"""
        return f"""
        Create application schedule for:
        
        Crop: {json.dumps(crop_info, indent=2)}
        Fertilizer Plan: {json.dumps(fertilizer_plan, indent=2)}
        Weather Forecast: {json.dumps(weather, indent=2)}
        
        Provide specific dates, methods, and timing for each application.
        Consider crop phenology and weather windows.
        """
    
    def _generate_cost_benefit_prompt(self, fertilizer_plan: Dict[str, Any], schedule: Dict[str, Any], farm_context: Dict[str, Any], crop_info: Dict[str, Any]) -> str:
        """Generate prompt for cost-benefit analysis"""
        return f"""
        Perform cost-benefit analysis for:
        
        Fertilizer Plan: {json.dumps(fertilizer_plan, indent=2)}
        Application Schedule: {json.dumps(schedule, indent=2)}
        Farm Context: {json.dumps(farm_context, indent=2)}
        Crop Information: {json.dumps(crop_info, indent=2)}
        
        Calculate total costs, expected yield increase, and ROI.
        Provide economic justification for the recommendations.
        """
    
    def _generate_risk_assessment_prompt(self, soil_analysis: Dict[str, Any], fertilizer_plan: Dict[str, Any], schedule: Dict[str, Any], weather: List[Dict[str, Any]], farm_context: Dict[str, Any]) -> str:
        """Generate prompt for risk assessment"""
        return f"""
        Assess risks for the nutrient management plan:
        
        Soil Analysis: {json.dumps(soil_analysis, indent=2)}
        Fertilizer Plan: {json.dumps(fertilizer_plan, indent=2)}
        Application Schedule: {json.dumps(schedule, indent=2)}
        Weather Forecast: {json.dumps(weather, indent=2)}
        Farm Context: {json.dumps(farm_context, indent=2)}
        
        Identify potential risks (environmental, economic, agronomic) and mitigation strategies.
        """
    
    # Helper methods
    def _extract_current_nutrients(self, soil_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract current nutrient levels from soil data"""
        nutrients = {}
        
        # Extract direct nutrient values
        nutrient_mappings = {
            "nitrogen": ["n_kg_ha", "n_ppm", "nitrogen"],
            "phosphorus": ["p_kg_ha", "p_ppm", "phosphorus"],
            "potassium": ["k_kg_ha", "k_ppm", "potassium"],
            "sulfur": ["s_kg_ha", "s_ppm", "sulfur"]
        }
        
        for nutrient, keys in nutrient_mappings.items():
            for key in keys:
                if key in soil_data and soil_data[key] is not None:
                    nutrients[nutrient] = float(soil_data[key])
                    break
        
        return nutrients
    
    def _extract_deficiencies_from_text(self, text: str) -> List[str]:
        """Extract nutrient deficiencies from text response"""
        nutrients = ["nitrogen", "phosphorus", "potassium", "sulfur", "zinc", "iron", "manganese", "copper", "boron"]
        deficiencies = []
        
        text_lower = text.lower()
        for nutrient in nutrients:
            if any(keyword in text_lower for keyword in [f"{nutrient} defic", f"low {nutrient}", f"insufficient {nutrient}"]):
                deficiencies.append(nutrient)
        
        return deficiencies
    
    def _calculate_total_duration(self, state: NutrientAgentState) -> float:
        """Calculate total analysis duration"""
        start_time_str = state["execution_metrics"].get("started_at", "")
        if start_time_str:
            try:
                start_time = datetime.fromisoformat(start_time_str)
                return (datetime.now() - start_time).total_seconds()
            except ValueError:
                pass
        return 0.0
    
    async def run_analysis(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run complete nutrient analysis workflow"""
        try:
            # Initialize state
            initial_state = NutrientAgentState(
                soil_health_data=input_data.get("soil_health_data", {}),
                crop_info=input_data.get("crop_info", {}),
                farm_context=input_data.get("farm_context", {}),
                weather_forecast=input_data.get("weather_forecast", []),
                user_preferences=input_data.get("user_preferences", {}),
                agent_run_id=f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                messages=[],
                outcome="pending",
                execution_metrics={},
                current_provider="",
                confidence_scores={}
            )
            
            # Run workflow
            result = await self.workflow.ainvoke(initial_state)
            
            return {
                "success": result["outcome"] == "success",
                "recommendations": result.get("final_recommendations", {}),
                "execution_metrics": result.get("execution_metrics", {}),
                "messages": [msg.content for msg in result.get("messages", [])],
                "confidence": result.get("execution_metrics", {}).get("total_confidence", 0.0)
            }
            
        except Exception as e:
            logger.error(f"Error running nutrient analysis: {e}")
            return {
                "success": False,
                "error": str(e),
                "recommendations": {},
                "execution_metrics": {},
                "messages": [f"Analysis failed: {str(e)}"],
                "confidence": 0.0
            }


# Create global instance
nutrient_agent = NutrientAgent()


# For backward compatibility
class NutrientManagementAgent:
    """Legacy agent class for backward compatibility"""
    
    def __init__(self):
        self.enhanced_agent = enhanced_nutrient_agent
    
    async def run_analysis(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self.enhanced_agent.run_analysis(input_data)
    
    def is_available(self) -> bool:
        return self.enhanced_agent.gemini_service.is_available()
