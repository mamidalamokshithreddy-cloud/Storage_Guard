"""
Pest Detection Workflow - Main workflow orchestrator
Provides a simplified interface to the LangGraph workflow
"""

import logging
from typing import Optional

from app.schemas.postgres_base_models import WorkflowState, AnalysisResponse

logger = logging.getLogger(__name__)

# Try to import the full workflow, fallback to mock if dependencies missing
try:
    from app.graph.graph import PestMonitoringWorkflow
    WORKFLOW_AVAILABLE = True
except (ImportError, RuntimeError, AttributeError) as e:
    logger.warning(f"Full workflow not available: {e}. Using mock workflow.")
    PestMonitoringWorkflow = None
    WORKFLOW_AVAILABLE = False


class PestDetectionWorkflow:
    """
    Simplified interface for pest detection workflow
    """
    
    def __init__(self):
        """Initialize the workflow"""
        if WORKFLOW_AVAILABLE:
            try:
                self.workflow = PestMonitoringWorkflow()
                logger.info("✅ PestDetectionWorkflow initialized successfully")
            except Exception as e:
                logger.error(f"❌ Failed to initialize workflow: {e}")
                self.workflow = None
        else:
            logger.warning("⚠️ Using mock workflow - full dependencies not available")
            self.workflow = None
    
    async def execute(self, state: WorkflowState) -> WorkflowState:
        """
        Execute the pest detection workflow
        
        Args:
            state: Initial workflow state
            
        Returns:
            WorkflowState: Final state with results
        """
        if self.workflow is None:
            logger.error("Workflow not initialized")
            state.errors.append("Workflow not initialized")
            return state
        
        try:
            logger.info(f"🚀 Starting workflow execution for trace_id: {state.trace_id}")
            
            if self.workflow is not None and WORKFLOW_AVAILABLE:
                # Execute actual workflow when available
                logger.info("Using full AI workflow")
                # TODO: Implement actual workflow execution
                # result = await self.workflow.execute(state)
                # For now, use mock response
                mock_response = self._create_mock_response(state)
                state.final_response = mock_response
            else:
                # Use mock workflow
                logger.info("Using mock workflow")
                mock_response = self._create_mock_response(state)
                state.final_response = mock_response
            
            logger.info(f"✅ Workflow completed for trace_id: {state.trace_id}")
            return state
            
        except Exception as e:
            logger.error(f"❌ Workflow execution failed: {e}", exc_info=True)
            state.errors.append(f"Workflow execution failed: {str(e)}")
            return state
    
    def _create_mock_response(self, state: WorkflowState) -> AnalysisResponse:
        """
        Create a mock response for testing purposes
        This should be removed when the actual workflow is implemented
        """
        from app.schemas.postgres_base_models import (
            Diagnosis, Alternative, Severity, SeverityBand, 
            WeatherRisk, WeatherRiskBand, WeatherRiskIndices,
            IPMRecommendations, PreventionMeasure, ProcessingTimings
        )
        from datetime import datetime
        
        # Mock diagnosis
        diagnosis = Diagnosis(
            label="Mock Pest Detection",
            confidence=0.85,
            alternatives=[
                Alternative(label="Alternative 1", confidence=0.75),
                Alternative(label="Alternative 2", confidence=0.65)
            ],
            affected_area_percent=15.0
        )
        
        # Mock severity
        severity = Severity(
            score_0_100=45,
            band=SeverityBand.moderate,
            factors=["Mock factor 1", "Mock factor 2"],
            confidence=0.80
        )
        
        # Mock weather risk
        weather_risk = WeatherRisk(
            indices=WeatherRiskIndices(
                high_humidity_hours=8,
                consecutive_wet_days=2,
                degree_days=150.0,
                wind_risk=False,
                temperature_stress=False
            ),
            risk_band=WeatherRiskBand.medium,
            factors=["High humidity", "Recent rainfall"]
        )
        
        # Mock recommendations
        recommendations = IPMRecommendations(
            prevention=[
                PreventionMeasure(
                    measure="Regular monitoring",
                    description="Monitor crops weekly for early detection",
                    priority=1
                )
            ],
            cultural=["Crop rotation", "Remove infected plant debris"],
            monitoring=["Weekly field inspections", "Use of pheromone traps"]
        )
        
        # Mock timings
        timings = ProcessingTimings(
            total_ms=1500.0,
            validate_input_ms=50.0,
            preprocess_ms=200.0,
            vision_predict_ms=800.0,
            severity_ms=150.0,
            weather_context_ms=100.0,
            threshold_decision_ms=50.0,
            recommend_ipm_ms=100.0,
            format_response_ms=50.0
        )
        
        return AnalysisResponse(
            diagnosis=diagnosis,
            severity=severity,
            alert=severity.score_0_100 > 60,
            weather_risk=weather_risk,
            recommendations=recommendations,
            rationale="This is a mock analysis response for testing purposes. "
                     "The actual AI workflow is not yet fully implemented.",
            trace_id=state.trace_id,
            confidence=0.75,
            uncertain=False,
            timings=timings,
            created_at=datetime.utcnow()
        )


# Singleton instance
_workflow_instance: Optional[PestDetectionWorkflow] = None


def get_pest_detection_workflow() -> PestDetectionWorkflow:
    """Get singleton PestDetectionWorkflow instance"""
    global _workflow_instance
    
    if _workflow_instance is None:
        _workflow_instance = PestDetectionWorkflow()
    
    return _workflow_instance
