"""
Enhanced LangGraph Workflow for Pest & Disease Monitoring with Multi-LLM Analysis
Production-ready workflow with cross-validation and consensus building
"""

import logging
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from app.schemas.postgres_base_models import WorkflowState, AnalysisPayload, AnalysisResponse
from app.graph.nodes.validate_input import validate_input_node
from app.graph.nodes.preprocess import preprocess_node
from app.graph.nodes.vision_predict import vision_predict_node
from app.graph.nodes.severity import severity_node
from app.graph.nodes.weather_context import weather_context_node
from app.graph.nodes.threshold_decision import threshold_decision_node
from app.graph.nodes.recommend_ipm import recommend_ipm_node
from app.graph.nodes.format_response import format_response_node

# New LLM analysis nodes
from app.graph.nodes.slm_analysis import slm_analysis_node
from app.graph.nodes.llm_vision_predict import llm_vision_predict_node
from app.graph.nodes.llm_analysis import llm_analysis_node
from app.graph.nodes.cross_validation import cross_validation_node

from app.core.config import (
    ENABLE_LLM_ANALYSIS, ENABLE_CROSS_VALIDATION,
    LLM_SKIP_ON_HIGH_CONFIDENCE, LLM_CV_CONFIDENCE_THRESHOLD
)

logger = logging.getLogger(__name__)


class PestMonitoringWorkflow:
    """
    Enhanced LangGraph workflow with multi-LLM analysis and cross-validation
    
    Workflow Modes:
    1. Traditional CV-only mode (LLM_ANALYSIS_ENABLED=False)
    2. CV + LLM hybrid mode (LLM_ANALYSIS_ENABLED=True, LLM_CROSS_VALIDATION_ENABLED=False)  
    3. Full multi-LLM with cross-validation (both enabled)
    """
    
    def __init__(self):
        """Initialize the enhanced workflow graph"""
        self.checkpointer = MemorySaver()
        self.graph = self._build_graph()
        
    def _build_graph(self) -> StateGraph:
        """
        Build the enhanced LangGraph workflow with conditional LLM analysis
        
        Returns:
            Configured StateGraph with multi-LLM support
        """
        logger.info("🔧 Building enhanced LangGraph workflow with multi-LLM support")
        
        # Initialize graph with enhanced state schema
        workflow = StateGraph(WorkflowState)
        
        # Add traditional CV pipeline nodes
        workflow.add_node("validate_input", validate_input_node)
        workflow.add_node("preprocess", preprocess_node)
        workflow.add_node("vision_predict", vision_predict_node)
        workflow.add_node("severity", severity_node)
        workflow.add_node("weather_context", weather_context_node)
        workflow.add_node("threshold_decision", threshold_decision_node)
        workflow.add_node("recommend_ipm", recommend_ipm_node)
        workflow.add_node("format_response", format_response_node)
        
        # Add LLM analysis nodes (conditional)
        if ENABLE_LLM_ANALYSIS:
            workflow.add_node("llm_vision_predict", llm_vision_predict_node)
            workflow.add_node("slm_analysis", slm_analysis_node)
            workflow.add_node("llm_analysis", llm_analysis_node)
            
            if ENABLE_CROSS_VALIDATION:
                workflow.add_node("cross_validation", cross_validation_node)
        
        # Define the workflow edges
        workflow.set_entry_point("validate_input")
        
        # Traditional CV pipeline flow with parallel LLM vision
        workflow.add_edge("validate_input", "preprocess")
        workflow.add_edge("preprocess", "vision_predict")
        
        # Add parallel LLM vision processing if enabled
        if ENABLE_LLM_ANALYSIS:
            workflow.add_edge("preprocess", "llm_vision_predict")
            # Both vision_predict and llm_vision_predict run in parallel after preprocess
        
        workflow.add_edge("vision_predict", "severity")
        workflow.add_edge("severity", "weather_context")
        
        # Sequential LLM analysis routing
        if ENABLE_LLM_ANALYSIS:
            # Add sequential LLM analysis branch after weather context
            workflow.add_conditional_edges(
                "weather_context",
                self._should_run_llm_analysis,
                {
                    "run_llm": "slm_analysis",
                    "skip_llm": "threshold_decision"
                }
            )
            
            # Sequential flow: SLM -> Single LLM -> Cross-Validation
            workflow.add_edge("slm_analysis", "llm_analysis")
            
            if ENABLE_CROSS_VALIDATION:
                # LLM -> Sequential validation (validators compare SLM vs LLM responses)
                workflow.add_edge("llm_analysis", "cross_validation")
                workflow.add_edge("cross_validation", "threshold_decision")
            else:
                # LLM -> direct to decision (no validation)
                workflow.add_edge("llm_analysis", "threshold_decision")
        else:
            # Traditional flow without LLM
            workflow.add_edge("weather_context", "threshold_decision")
        
        # Continue with traditional flow
        workflow.add_edge("threshold_decision", "recommend_ipm")
        workflow.add_edge("recommend_ipm", "format_response")
        workflow.add_edge("format_response", END)
        
        # Compile the graph
        compiled_graph = workflow.compile(checkpointer=self.checkpointer)
        
        workflow_mode = self._get_workflow_mode()
        logger.info(f"✅ Enhanced LangGraph workflow built successfully (mode: {workflow_mode})")
        return compiled_graph
    
    def _should_run_llm_analysis(self, state: WorkflowState) -> str:
        """
        Determine whether to run LLM analysis based on state and configuration
        
        Args:
            state: Current workflow state
            
        Returns:
            "run_llm" or "skip_llm"
        """
        try:
            # Skip if LLM analysis is disabled
            if not ENABLE_LLM_ANALYSIS:
                return "skip_llm"
            
            # Skip if explicitly requested
            if state.skip_llm_analysis:
                logger.info("Skipping LLM analysis - explicitly disabled in state")
                return "skip_llm"
            
            # Skip if high confidence and configuration allows
            if LLM_SKIP_ON_HIGH_CONFIDENCE and state.severity_assessment:
                confidence = state.severity_assessment.confidence
                if confidence >= LLM_CV_CONFIDENCE_THRESHOLD:
                    logger.info(f"Skipping LLM analysis - high CV confidence ({confidence:.3f})")
                    return "skip_llm"
            
            # Require at least processed images to attempt LLM analysis
            if not state.processed_images:
                logger.warning("Skipping LLM analysis - no processed images available")
                return "skip_llm"
            
            # Run LLM analysis
            logger.info("Running LLM analysis - conditions met")
            return "run_llm"
            
        except Exception as e:
            logger.error(f"Error in LLM analysis routing decision: {e}")
            # Default to skip on error
            return "skip_llm"
    
    def _get_workflow_mode(self) -> str:
        """Get current workflow mode description"""
        if not ENABLE_LLM_ANALYSIS:
            return "cv_only"
        elif not ENABLE_CROSS_VALIDATION:
            return "cv_llm_hybrid"
        else:
            return "full_multi_llm_cv"
    
    async def analyze_images(self, payload: AnalysisPayload) -> AnalysisResponse:
        """
        Execute the complete analysis workflow
        
        Args:
            payload: Analysis request payload
            
        Returns:
            Complete analysis response
        """
        trace_id = str(uuid.uuid4())
        start_time = datetime.utcnow()
        
        logger.info(
            f"🚀 Starting pest monitoring analysis",
            extra={
                "trace_id": trace_id,
                "image_count": len(payload.images),
                "crop_type": payload.crop.value if payload.crop else "unknown",
                "has_location": payload.location is not None
            }
        )
        
        try:
            # Initialize workflow state
            initial_state = WorkflowState(
                trace_id=trace_id,
                payload=payload,
                start_time=start_time,
                processing_times={},
                errors=[]
            )
            
            # Execute workflow
            config = {"configurable": {"thread_id": trace_id}}
            final_state = await self.graph.ainvoke(
                initial_state.dict(), 
                config=config
            )
            
            # Extract final response
            response = final_state.get("final_response")
            
            if response:
                total_time = (datetime.utcnow() - start_time).total_seconds()
                
                # Safe logging using fields present in AnalysisResponse
                try:
                    logger.info(
                        f"✅ Analysis completed successfully",
                        extra={
                            "trace_id": trace_id,
                            "total_time": total_time,
                            "diagnosis": getattr(response.diagnosis, 'label', 'unknown'),
                            "confidence": getattr(response, 'confidence', 0.0),
                            "alert": getattr(response, 'alert', False)
                        }
                    )
                except Exception:
                    logger.info(
                        f"✅ Analysis completed successfully",
                        extra={"trace_id": trace_id, "total_time": total_time}
                    )
                
                return response
            else:
                raise ValueError("Workflow completed but no response generated")
                
        except Exception as e:
            error_msg = f"Workflow execution failed: {str(e)}"
            logger.error(
                error_msg,
                extra={"trace_id": trace_id},
                exc_info=True
            )
            
            # Return error response that matches AnalysisResponse schema
            from app.schemas.postgres_base_models import (
                AnalysisResponse, Diagnosis, Severity, SeverityBand,
                IPMRecommendations, WeatherRisk, WeatherRiskBand, WeatherRiskIndices
            )
            safe_weather = WeatherRisk(
                indices=WeatherRiskIndices(),
                risk_band=WeatherRiskBand.low,
                factors=[]
            )
            return AnalysisResponse(
                diagnosis=Diagnosis(label="unknown", confidence=0.0, alternatives=[]),
                severity=Severity(score_0_100=0, band=SeverityBand.mild, factors=[], confidence=0.0),
                alert=True,
                weather_risk=safe_weather,
                recommendations=IPMRecommendations(),
                rationale=f"Technical error occurred: {str(e)}",
                trace_id=trace_id,
                confidence=0.0,
                timings=None,
                created_at=datetime.utcnow(),
            )
    
    async def get_workflow_status(self, trace_id: str) -> Dict[str, Any]:
        """
        Get status of a running workflow
        
        Args:
            trace_id: Workflow trace ID
            
        Returns:
            Workflow status information
        """
        try:
            config = {"configurable": {"thread_id": trace_id}}
            state = await self.graph.aget_state(config)
            
            return {
                "trace_id": trace_id,
                "status": "running" if state.next else "completed",
                "current_node": state.next[0] if state.next else "finished",
                "completed_nodes": list(state.values.get("processing_times", {}).keys()),
                "errors": state.values.get("errors", [])
            }
            
        except Exception as e:
            logger.error(f"Failed to get workflow status: {e}")
            return {
                "trace_id": trace_id,
                "status": "error",
                "error": str(e)
            }
    
    def get_workflow_schema(self) -> Dict[str, Any]:
        """
        Get enhanced workflow schema information
        
        Returns:
            Workflow schema details with LLM nodes
        """
        workflow_mode = self._get_workflow_mode()
        
        base_nodes = [
            {
                "name": "validate_input",
                "description": "Validate and sanitize input images",
                "inputs": ["images", "metadata"],
                "outputs": ["validated_images", "sanitized_metadata"],
                "type": "cv_pipeline"
            },
            {
                "name": "preprocess",
                "description": "Preprocess images for analysis",
                "inputs": ["validated_images"],
                "outputs": ["processed_images", "image_tiles"],
                "type": "cv_pipeline"
            },
            {
                "name": "vision_predict",
                "description": "Run computer vision inference",
                "inputs": ["processed_images"],
                "outputs": ["predictions", "confidence_scores"],
                "type": "cv_pipeline"
            },
            {
                "name": "severity",
                "description": "Assess severity of detections",
                "inputs": ["predictions", "crop_metadata"],
                "outputs": ["severity_score", "affected_area"],
                "type": "cv_pipeline"
            },
            {
                "name": "weather_context",
                "description": "Add weather risk context",
                "inputs": ["location", "weather_data"],
                "outputs": ["weather_risk", "risk_factors"],
                "type": "cv_pipeline"
            },
            {
                "name": "threshold_decision",
                "description": "Evaluate against action thresholds",
                "inputs": ["severity", "weather_risk", "llm_results"],
                "outputs": ["action_required", "urgency_level"],
                "type": "decision"
            },
            {
                "name": "recommend_ipm",
                "description": "Generate IPM recommendations",
                "inputs": ["decisions", "context", "llm_insights"],
                "outputs": ["recommendations", "actions"],
                "type": "recommendation"
            },
            {
                "name": "format_response",
                "description": "Format final response with LLM insights",
                "inputs": ["all_analysis_data", "llm_results"],
                "outputs": ["formatted_response"],
                "type": "output"
            }
        ]
        
        # Add LLM nodes if enabled
        llm_nodes = []
        if ENABLE_LLM_ANALYSIS:
            llm_nodes.extend([
                {
                    "name": "slm_analysis",
                    "description": "Small Language Model analysis for quick CV interpretation",
                    "inputs": ["vision_results", "severity", "weather_context"],
                    "outputs": ["slm_insights", "lightweight_recommendations"],
                    "type": "llm_analysis"
                },
                {
                    "name": "llm_analysis",
                    "description": "Multi-provider LLM analysis with agricultural expertise",
                    "inputs": ["vision_results", "slm_analysis", "comprehensive_context"],
                    "outputs": ["llm_insights", "provider_consensus"],
                    "type": "llm_analysis"
                }
            ])
            
            if ENABLE_CROSS_VALIDATION:
                llm_nodes.append({
                    "name": "cross_validation",
                    "description": "Cross-validation and consensus building across all analyses",
                    "inputs": ["cv_results", "slm_analysis", "llm_analyses"],
                    "outputs": ["consensus_result", "confidence_metrics"],
                    "type": "validation"
                })
        
        # Define flow based on workflow mode
        base_flow = [
            "validate_input → preprocess",
            "preprocess → vision_predict", 
            "vision_predict → severity",
            "severity → weather_context"
        ]
        
        if ENABLE_LLM_ANALYSIS:
            base_flow.extend([
                "weather_context → [conditional] → slm_analysis or threshold_decision",
                "slm_analysis → llm_analysis"
            ])
            
            if ENABLE_CROSS_VALIDATION:
                base_flow.extend([
                    "llm_analysis → cross_validation",
                    "cross_validation → threshold_decision"
                ])
            else:
                base_flow.append("llm_analysis → threshold_decision")
        else:
            base_flow.append("weather_context → threshold_decision")
        
        base_flow.extend([
            "threshold_decision → recommend_ipm",
            "recommend_ipm → format_response",
            "format_response → END"
        ])
        
        return {
            "workflow_name": "Enhanced Pest & Disease Monitoring with Multi-LLM",
            "version": "2.0.0",
            "mode": workflow_mode,
            "llm_enabled": ENABLE_LLM_ANALYSIS,
            "cross_validation_enabled": ENABLE_CROSS_VALIDATION,
            "nodes": base_nodes + llm_nodes,
            "flow": base_flow,
            "state_schema": "WorkflowState",
            "checkpoint_enabled": True,
            "conditional_routing": {
                "llm_analysis": {
                    "condition": "_should_run_llm_analysis",
                    "routes": ["run_llm", "skip_llm"]
                }
            } if ENABLE_LLM_ANALYSIS else {},
            "capabilities": {
                "computer_vision": True,
                "weather_integration": True,
                "ipm_recommendations": True,
                "multi_llm_analysis": ENABLE_LLM_ANALYSIS,
                "cross_validation": ENABLE_CROSS_VALIDATION,
                "consensus_building": ENABLE_CROSS_VALIDATION,
                "adaptive_routing": ENABLE_LLM_ANALYSIS
            }
        }


# Global workflow instance
workflow_instance: Optional[PestMonitoringWorkflow] = None


def get_workflow() -> PestMonitoringWorkflow:
    """
    Get or create workflow instance (singleton pattern)
    
    Returns:
        EnhancedPestMonitoringWorkflow instance
    """
    global workflow_instance
    
    if workflow_instance is None:
        workflow_instance = PestMonitoringWorkflow()
        logger.info("🔧 Created new enhanced workflow instance")
    
    return workflow_instance


def initialize_workflow() -> PestMonitoringWorkflow:
    """
    Initialize workflow at application startup
    
    Returns:
        Initialized workflow instance
    """
    logger.info("🚀 Initializing enhanced pest monitoring workflow")
    
    try:
        workflow = PestMonitoringWorkflow()
        
        # Validate workflow
        schema = workflow.get_workflow_schema()
        logger.info(
            f"✅ Workflow initialized successfully",
            extra={
                "workflow_name": schema["workflow_name"],
                "version": schema["version"],
                "nodes": len(schema["nodes"])
            }
        )
        
        return workflow
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize workflow: {e}", exc_info=True)
        raise


async def cleanup_workflow():
    """
    Cleanup workflow resources at application shutdown
    """
    global workflow_instance
    
    if workflow_instance:
        logger.info("🧹 Cleaning up workflow resources")
        # Add any necessary cleanup logic here
        workflow_instance = None
        logger.info("✅ Workflow cleanup completed")


# Workflow utilities
class WorkflowError(Exception):
    """Custom exception for workflow errors"""
    
    def __init__(self, message: str, trace_id: str = None, node: str = None):
        self.trace_id = trace_id
        self.node = node
        super().__init__(message)


class WorkflowTimeout(WorkflowError):
    """Exception for workflow timeouts"""
    pass


class NodeExecutionError(WorkflowError):
    """Exception for node execution failures"""
    pass


def validate_workflow_input(payload: AnalysisPayload) -> List[str]:
    """
    Validate workflow input payload
    
    Args:
        payload: Input payload to validate
        
    Returns:
        List of validation errors (empty if valid)
    """
    errors = []
    
    # Check required fields
    if not payload.images:
        errors.append("At least one image is required")
    
    # Validate images
    for i, image in enumerate(payload.images):
        if not image.data:
            errors.append(f"Image {i+1} has no data")
        
        if not image.format:
            errors.append(f"Image {i+1} format not specified")
        
        # Check file size (100MB limit)
        if len(image.data) > 100 * 1024 * 1024:
            errors.append(f"Image {i+1} exceeds 100MB limit")
    
    # Validate location if provided
    if payload.location:
        if not (-90 <= payload.location.lat <= 90):
            errors.append("Invalid latitude")
        
        if not (-180 <= payload.location.lon <= 180):
            errors.append("Invalid longitude")
    
    return errors


def create_workflow_summary(state: WorkflowState) -> Dict[str, Any]:
    """
    Create summary of workflow execution
    
    Args:
        state: Final workflow state
        
    Returns:
        Workflow execution summary
    """
    return {
        "trace_id": state.trace_id,
        "total_processing_time": sum(state.processing_times.values()),
        "node_times": state.processing_times,
        "nodes_executed": len(state.processing_times),
        "errors_count": len(state.errors),
        "success": len(state.errors) == 0,
        "detections_found": len(state.vision_predictions) if state.vision_predictions else 0,
        "action_required": getattr(state, 'action_required', False),
        "urgency_level": getattr(state, 'urgency_level', 'unknown')
    }
