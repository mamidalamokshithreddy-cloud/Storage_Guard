import logging
import os
import json
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from fastapi import HTTPException, Depends, APIRouter
from sqlalchemy.orm import Session
from app.connections.postgres_connection import get_db
from app.schemas.postgres_base_models import ScheduleRequest
from app.services.gemini_service import gemini_service, NutrientAnalysisRequest

# The previous implementation referenced helper functions/constants expected in app.core
# They don't exist; we provide lightweight internal defaults with env JSON override support.

SCORING_WEIGHTS = {
    'temp_penalty': 0.25,
    'humidity_penalty': 0.20,
    'wind_penalty': 0.20,
    'precip_penalty': 0.25,
    'cloud_penalty': 0.05,
}

DEFAULT_WEATHER_VALUES = {
    'temperature': 26,
    'humidity': 55,
    'wind_speed': 4,
    'precipitation_probability': 10,
    'cloud_cover': 20,
}

FOLIAR_MAX_CONCENTRATION = 0.02  # 2%
FOLIAR_SPRAY_VOLUME_L_PER_HA = 300
ALTERNATIVE_DATES_LIMIT = 5

def _env_json(name: str):
    raw = os.getenv(name)
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return None

def load_optimal_conditions() -> Dict[str, Any]:
    data = _env_json('OPTIMAL_CONDITIONS_JSON')
    if isinstance(data, dict):
        return data
    # defaults per application type
    return {
        'basal': {
            'temperature_range': (15, 38),
            'humidity_range': (30, 85),
            'wind_speed_max': 12,
            'precipitation_probability_max': 60,
            'cloud_cover_max': 90,
        },
        'top_dress': {
            'temperature_range': (16, 36),
            'humidity_range': (30, 80),
            'wind_speed_max': 15,
            'precipitation_probability_max': 50,
            'cloud_cover_max': 95,
        },
        'foliar': {
            'temperature_range': (18, 32),
            'humidity_range': (40, 85),
            'wind_speed_max': 10,
            'precipitation_probability_max': 40,
            'cloud_cover_max': 80,
        }
    }

def load_crop_stages() -> Dict[str, Any]:
    data = _env_json('CROP_STAGES_JSON')
    if isinstance(data, dict):
        return data
    # minimal generic defaults
    return {
        'rice': {
            'germination': {'days_from_planting': 0, 'duration_days': 7},
            'seedling': {'days_from_planting': 7, 'duration_days': 14},
            'vegetative': {'days_from_planting': 21, 'duration_days': 25},
            'tillering': {'days_from_planting': 46, 'duration_days': 15},
            'flowering': {'days_from_planting': 61, 'duration_days': 12},
            'booting': {'days_from_planting': 73, 'duration_days': 10},
            'heading': {'days_from_planting': 83, 'duration_days': 12},
        }
    }

# Logger
logger = logging.getLogger(__name__)


class ApplicationType(Enum):
    BASAL = "basal"
    TOP_DRESS = "top_dress"
    FOLIAR = "foliar"


@dataclass
class ApplicationWindow:
    application_type: ApplicationType
    optimal_date: datetime
    stage: str
    weather_conditions: Dict[str, Any]
    feasibility_score: float
    alternative_dates: List[datetime]
    products: List[Dict[str, Any]]
    dosage_per_acre: float
    method: str
"""Application scheduling service.

This module provides a lightweight scheduler that uses configuration-driven
defaults and optional database-backed product data. It intentionally avoids
hard imports of models so it can run in environments where those models are
not available.
"""

# Attempt to import DB-backed models if present (optional)
try:
    from app.database.models import FertilizerProduct, ApplicationSchedule  # type: ignore
except Exception:
    FertilizerProduct = None  # type: ignore
    ApplicationSchedule = None  # type: ignore


class ApplicationScheduler:
    """Schedule nutrient applications based on crop phenology and weather.

    Behavior:
      - Loads default crop stage timings and optimal application conditions from
        the central config module (which supports env JSON overrides).
      - Loads fertilizer products from DB when available; otherwise uses an
        empty product list and schedules only when products exist.
    """

    def __init__(self, db_session: Optional[Session] = None):
        self.db_session = db_session
        self.optimal_conditions = load_optimal_conditions()
        self.crop_stages = load_crop_stages()
        self.fertilizer_products = self._load_fertilizer_products()

    def _load_fertilizer_products(self) -> List[Dict[str, Any]]:
        """Load fertilizer products from DB model when available."""
        if not self.db_session or not FertilizerProduct:
            return []
        try:
            db_products = self.db_session.query(FertilizerProduct).all()
            products: List[Dict[str, Any]] = []
            for product in db_products:
                products.append({
                    'id': getattr(product, 'id', None),
                    'name': getattr(product, 'name', ''),
                    'n_percent': getattr(product, 'n_percent', 0.0),
                    'p_percent': getattr(product, 'p_percent', 0.0),
                    'k_percent': getattr(product, 'k_percent', 0.0),
                    'application_type': getattr(product, 'application_type', getattr(product, 'application_method', 'top_dress')),
                    'cost_per_kg': getattr(product, 'cost_per_kg', getattr(product, 'price_per_kg', 0.0)),
                    'availability': getattr(product, 'availability', True)
                })
            return products
        except Exception as e:
            logger.debug(f"Failed to load fertilizer products from DB: {e}")
            return []

    def schedule_applications(self, farm_crop_id: int, crop_species: str,
                              planting_date: datetime, current_stage: str,
                              nutrient_requirements: Dict[str, Any],
                              weather_forecast: List[Dict[str, Any]]) -> List[ApplicationWindow]:
        """Create schedule windows for each stage."""
        if farm_crop_id is None:
            raise ValueError("farm_crop_id is required for scheduling")

        application_windows: List[ApplicationWindow] = []

        # Basic validations
        if not self.crop_stages:
            logger.error("No crop stage data available (defaults not loaded)")
            return application_windows
        if not self.optimal_conditions:
            logger.error("No optimal conditions data available (defaults not loaded)")
            return application_windows
        if not self.fertilizer_products:
            logger.warning("No fertilizer products available from database; scheduling will be limited")

        crop_stages = self.crop_stages.get(crop_species.lower(), {})
        if not crop_stages:
            logger.error(f"No stage information for crop: {crop_species}")
            return application_windows

        for stage, requirements in nutrient_requirements.get('stage_requirements', {}).items():
            if self._should_schedule_stage(stage, current_stage, crop_stages):
                window = self._create_application_window(
                    farm_crop_id, stage, requirements, planting_date,
                    crop_stages, weather_forecast
                )
                if window:
                    application_windows.append(window)

        application_windows.sort(key=lambda x: x.optimal_date)
        return application_windows

    def _should_schedule_stage(self, stage: str, current_stage: str,
                               crop_stages: Dict[str, Any]) -> bool:
        """Decide whether to schedule the given stage based on current stage."""
        if stage == current_stage:
            return True
        current_days = crop_stages.get(current_stage, {}).get('days_from_planting', 0)
        stage_days = crop_stages.get(stage, {}).get('days_from_planting', 0)
        return stage_days >= current_days

    def _create_application_window(self, farm_crop_id: int, stage: str,
                                   requirements: Dict[str, Any], planting_date: datetime,
                                   crop_stages: Dict[str, Any],
                                   weather_forecast: List[Dict[str, Any]]) -> Optional[ApplicationWindow]:
        try:
            stage_info = crop_stages.get(stage, {})
            days_from_planting = stage_info.get('days_from_planting', 0)
            duration_days = stage_info.get('duration_days', 7)

            optimal_date = planting_date + timedelta(days=days_from_planting)
            application_type = self._determine_application_type(stage, requirements)

            best_date, weather_conditions, feasibility_score = self._find_best_weather_window(
                optimal_date, duration_days, application_type, weather_forecast
            )

            alternative_dates = self._get_alternative_dates(
                optimal_date, duration_days, application_type, weather_forecast
            )

            products, dosage = self._select_products_and_dosage(requirements, application_type)

            return ApplicationWindow(
                application_type=application_type,
                optimal_date=best_date,
                stage=stage,
                weather_conditions=weather_conditions,
                feasibility_score=feasibility_score,
                alternative_dates=alternative_dates,
                products=products,
                dosage_per_acre=dosage,
                method=self._get_application_method(application_type)
            )
        except Exception as e:
            logger.error(f"Error creating application window for stage {stage}: {e}")
            return None

    def _determine_application_type(self, stage: str, requirements: Dict[str, Any]) -> ApplicationType:
        try:
            if any(requirements.get('micro_nutrients', {}).values()):
                return ApplicationType.FOLIAR
            if stage.lower() in {"germination", "seedling", "basal"}:
                return ApplicationType.BASAL
            return ApplicationType.TOP_DRESS
        except Exception:
            return ApplicationType.TOP_DRESS

    def _find_best_weather_window(self, optimal_date: datetime, duration_days: int,
                                  application_type: ApplicationType,
                                  weather_forecast: List[Dict[str, Any]]) -> Tuple[datetime, Dict[str, Any], float]:
        best_date = optimal_date
        best_score = 0.0
        best_conditions: Dict[str, Any] = {}

        for i in range(duration_days):
            check_date = optimal_date + timedelta(days=i)
            weather_data = self._get_weather_for_date(check_date, weather_forecast)
            if not weather_data:
                continue
            score = self._calculate_weather_feasibility(weather_data, application_type)
            if score > best_score:
                best_score = score
                best_date = check_date
                best_conditions = weather_data

        return best_date, best_conditions, best_score

    def _get_weather_for_date(self, date: datetime, weather_forecast: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        target_date = date.date()
        for forecast in weather_forecast:
            try:
                forecast_date = datetime.fromisoformat(forecast.get('date')).date()
            except Exception:
                continue
            if forecast_date == target_date:
                return forecast
        return None

    def _calculate_weather_feasibility(self, weather_data: Dict[str, Any],
                                       application_type: ApplicationType) -> float:
        if not self.optimal_conditions:
            logger.error("No optimal conditions available from config")
            return 0.0
        conditions = self.optimal_conditions.get(application_type.value, {})
        if not conditions:
            logger.error(f"No optimal conditions for {application_type.value} in config")
            return 0.0

        score = 1.0
        temp = weather_data.get('temperature', DEFAULT_WEATHER_VALUES.get('temperature', 25))
        temp_min, temp_max = conditions.get('temperature_range', (0, 999))
        if temp < temp_min or temp > temp_max:
            score -= SCORING_WEIGHTS.get('temp_penalty', 0.25)

        humidity = weather_data.get('humidity', DEFAULT_WEATHER_VALUES.get('humidity', 50))
        hum_min, hum_max = conditions.get('humidity_range', (0, 100))
        if humidity < hum_min or humidity > hum_max:
            score -= SCORING_WEIGHTS.get('humidity_penalty', 0.2)

        wind_speed = weather_data.get('wind_speed', DEFAULT_WEATHER_VALUES.get('wind_speed', 5))
        if wind_speed > conditions.get('wind_speed_max', 999):
            score -= SCORING_WEIGHTS.get('wind_penalty', 0.2)

        precip_prob = weather_data.get('precipitation_probability', DEFAULT_WEATHER_VALUES.get('precipitation_probability', 0))
        if precip_prob > conditions.get('precipitation_probability_max', 100):
            score -= SCORING_WEIGHTS.get('precip_penalty', 0.25)

        cloud_cover = weather_data.get('cloud_cover', DEFAULT_WEATHER_VALUES.get('cloud_cover', 0))
        if cloud_cover > conditions.get('cloud_cover_max', 100):
            score -= SCORING_WEIGHTS.get('cloud_penalty', 0.05)

        return max(0.0, score)

    def _get_alternative_dates(self, optimal_date: datetime, duration_days: int,
                               application_type: ApplicationType,
                               weather_forecast: List[Dict[str, Any]]) -> List[datetime]:
        alternatives: List[datetime] = []
        for i in range(duration_days):
            check_date = optimal_date + timedelta(days=i)
            weather_data = self._get_weather_for_date(check_date, weather_forecast)
            if weather_data:
                score = self._calculate_weather_feasibility(weather_data, application_type)
                if score > 0.6:
                    alternatives.append(check_date)
        return alternatives[:ALTERNATIVE_DATES_LIMIT]

    def _select_products_and_dosage(self, requirements: Dict[str, Any],
                                    application_type: ApplicationType) -> Tuple[List[Dict[str, Any]], float]:
        products: List[Dict[str, Any]] = []
        total_dosage = 0.0

        if not self.fertilizer_products:
            logger.error("No fertilizer products available from database")
            return products, total_dosage

        available_products = [
            p for p in self.fertilizer_products
            if p['application_type'] == application_type.value and p['availability']
        ]

        if not available_products:
            logger.error(f"No products available for {application_type.value} application in database")
            return products, total_dosage

        if application_type == ApplicationType.BASAL:
            if requirements.get('n_kg_ha', 0) > 0:
                n_product = self._find_best_product_for_nutrient('n', requirements['n_kg_ha'], available_products)
                if n_product:
                    dosage = self._calculate_dosage(n_product, 'n', requirements['n_kg_ha'])
                    products.append({
                        'name': n_product['name'],
                        'n_percent': n_product['n_percent'],
                        'dosage_kg_ha': dosage,
                        'application_method': 'broadcast',
                        'cost_per_kg': n_product['cost_per_kg']
                    })
                    total_dosage += dosage
            if requirements.get('p_kg_ha', 0) > 0:
                p_product = self._find_best_product_for_nutrient('p', requirements['p_kg_ha'], available_products)
                if p_product:
                    dosage = self._calculate_dosage(p_product, 'p', requirements['p_kg_ha'])
                    products.append({
                        'name': p_product['name'],
                        'p_percent': p_product['p_percent'],
                        'dosage_kg_ha': dosage,
                        'application_method': 'broadcast',
                        'cost_per_kg': p_product['cost_per_kg']
                    })
                    total_dosage += dosage
        elif application_type == ApplicationType.TOP_DRESS:
            if requirements.get('n_kg_ha', 0) > 0:
                n_product = self._find_best_product_for_nutrient('n', requirements['n_kg_ha'], available_products)
                if n_product:
                    dosage = self._calculate_dosage(n_product, 'n', requirements['n_kg_ha'])
                    products.append({
                        'name': n_product['name'],
                        'n_percent': n_product['n_percent'],
                        'dosage_kg_ha': dosage,
                        'application_method': 'side_dress',
                        'cost_per_kg': n_product['cost_per_kg']
                    })
                    total_dosage += dosage
        if application_type == ApplicationType.FOLIAR:
            # If database products include foliar-capable products use them; else construct dynamic entries
            foliar_candidates = [p for p in available_products if p.get('application_type') == 'foliar']
            micronutrients = requirements.get('micro_nutrients', {}) or {}
            for nutrient, amount in micronutrients.items():
                if amount <= 0:
                    continue
                if foliar_candidates:
                    # Pick highest nutrient % foliar product for that micronutrient if present
                    key = f"{nutrient}_percent"
                    ranked = [p for p in foliar_candidates if p.get(key, 0) > 0]
                    ranked.sort(key=lambda x: (-x.get(key,0), x.get('cost_per_kg',0)))
                    if ranked:
                        prod = ranked[0]
                        # dosage kg/ha to deliver amount (kg/ha) = amount / (percent/100)
                        dosage = (amount / (prod.get(key)/100)) if prod.get(key) else 0
                        products.append({
                            'name': prod['name'],
                            'target_nutrient': nutrient,
                            'dosage_kg_ha': round(dosage,2),
                            'application_method': 'foliar_spray',
                            'cost_per_kg': prod.get('cost_per_kg')
                        })
                        total_dosage += dosage
                        continue
                # Construct dynamic foliar spray entry (no fixed mock volume)
                concentration = min(FOLIAR_MAX_CONCENTRATION, max(amount / 100, 0.001))
                # derive spray volume required to deliver amount at concentration (% w/v) assuming kg ~ L approximation for dilute solutions
                # amount (kg/ha) = (concentration * spray_volume)
                spray_volume = amount / concentration if concentration > 0 else 0
                products.append({
                    'name': f"{nutrient.upper()} Foliar Mix",
                    'target_nutrient': nutrient,
                    'concentration_fraction': round(concentration,4),
                    'dosage_l_ha': round(spray_volume,2),
                    'application_method': 'foliar_spray',
                    'nutrient_amount_kg_ha': amount
                })
                total_dosage += spray_volume

        return products, total_dosage

    def _find_best_product_for_nutrient(self, nutrient: str, required_amount: float,
                                        available_products: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        nutrient_key = f"{nutrient}_percent"
        suitable_products = [p for p in available_products if p.get(nutrient_key, 0) > 0]
        if not suitable_products:
            return None
        suitable_products.sort(key=lambda x: (-x.get(nutrient_key, 0), x.get('cost_per_kg', 0)))
        return suitable_products[0]

    def _calculate_dosage(self, product: Dict[str, Any], nutrient: str, required_amount: float) -> float:
        nutrient_key = f"{nutrient}_percent"
        nutrient_percent = product.get(nutrient_key, 0)
        if nutrient_percent == 0:
            return 0.0
        dosage = (required_amount / nutrient_percent) * 100
        return round(dosage, 2)

    def _get_application_method(self, application_type: ApplicationType) -> str:
        mapping = {
            ApplicationType.BASAL: 'broadcast',
            ApplicationType.TOP_DRESS: 'side_dress',
            ApplicationType.FOLIAR: 'foliar_spray'
        }
        return mapping.get(application_type, 'broadcast')

    def reschedule_application(self, application_id: int, new_date: datetime,
                               weather_forecast: List[Dict[str, Any]]) -> Dict[str, Any]:
        try:
            weather_data = self._get_weather_for_date(new_date, weather_forecast)
            if not weather_data:
                return {'success': False, 'message': 'No weather data available for selected date'}
            feasibility_score = self._calculate_weather_feasibility(weather_data, ApplicationType.TOP_DRESS)
            if feasibility_score < 0.5:
                return {'success': False, 'message': 'Weather conditions not suitable for application', 'feasibility_score': feasibility_score}
            return {'success': True, 'new_date': new_date, 'weather_conditions': weather_data, 'feasibility_score': feasibility_score, 'message': 'Application rescheduled successfully'}
        except Exception as e:
            logger.error(f"Error rescheduling application: {e}")
            return {'success': False, 'message': f'Error rescheduling application: {str(e)}'}

    def get_upcoming_applications(self, farm_crop_id: int, days_ahead: int = 14) -> List[Dict[str, Any]]:
        if not self.db_session or not ApplicationSchedule:
            return []
        try:
            end_date = datetime.now() + timedelta(days=days_ahead)
            applications = self.db_session.query(ApplicationSchedule).filter(
                ApplicationSchedule.scheduled_date >= datetime.now(),
                ApplicationSchedule.scheduled_date <= end_date
            ).all()
            results: List[Dict[str, Any]] = []
            for app_row in applications:
                results.append({
                    'id': getattr(app_row, 'id', None),
                    'plan_id': getattr(app_row, 'plan_id', None),
                    'application_type': getattr(app_row, 'application_type', None),
                    'scheduled_date': getattr(app_row, 'scheduled_date', None),
                    'stage': getattr(app_row, 'stage', None),
                    'products': getattr(app_row, 'fertilizer_products_json', None),
                    'dosage_per_acre': getattr(app_row, 'dosage_per_acre', None),
                    'method': getattr(app_row, 'method', None),
                    'status': 'scheduled'
                })
            return results
        except Exception as e:
            logger.error(f"Error fetching upcoming applications: {e}")
            return []

    def validate_application_timing(self, application_date: datetime,
                                    crop_stage: str, application_type: ApplicationType,
                                    crop_species: str = None) -> Dict[str, Any]:
        try:
            if crop_species:
                crop_stages_to_check = {crop_species.lower(): self.crop_stages.get(crop_species.lower(), {})}
            else:
                crop_stages_to_check = self.crop_stages

            stage_info = None
            for species, stages in crop_stages_to_check.items():
                if crop_stage in stages:
                    stage_info = stages[crop_stage]
                    break

            if not stage_info:
                return {'valid': False, 'message': f'No timing information for stage: {crop_stage}', 'available_stages': list(self.crop_stages.keys())}

            appropriate_types = self._get_appropriate_application_types(crop_stage)
            if application_type not in appropriate_types:
                return {'valid': False, 'message': f'{application_type.value} application not recommended for {crop_stage} stage', 'recommended_types': [t.value for t in appropriate_types]}

            return {'valid': True, 'message': 'Application timing is appropriate', 'recommended_types': [t.value for t in appropriate_types], 'stage_info': stage_info}
        except Exception as e:
            logger.error(f"Error validating application timing: {e}")
            return {'valid': False, 'message': f'Error validating timing: {str(e)}'}

    def _get_appropriate_application_types(self, crop_stage: str) -> List[ApplicationType]:
        stage_lower = crop_stage.lower()
        if stage_lower in {"germination", "seedling"}:
            return [ApplicationType.BASAL]
        if stage_lower in {"vegetative", "tillering", "stem_elongation"}:
            return [ApplicationType.TOP_DRESS]
        if stage_lower in {"flowering", "heading", "booting"}:
            return [ApplicationType.TOP_DRESS, ApplicationType.FOLIAR]
        return [ApplicationType.TOP_DRESS]

    def refresh_dynamic_data(self):
        try:
            self.optimal_conditions = load_optimal_conditions()
            self.crop_stages = load_crop_stages()
            self.fertilizer_products = self._load_fertilizer_products()
            logger.info("Dynamic data refreshed successfully")
        except Exception as e:
            logger.error(f"Error refreshing dynamic data: {e}")

    def get_available_crops(self) -> List[str]:
        return list(self.crop_stages.keys())

    def get_available_products(self, application_type: Optional[ApplicationType] = None) -> List[Dict[str, Any]]:
        if application_type:
            return [p for p in self.fertilizer_products if p['application_type'] == application_type.value and p['availability']]
        return [p for p in self.fertilizer_products if p['availability']]

    def get_crop_stages_for_species(self, crop_species: str) -> Dict[str, Any]:
        return self.crop_stages.get(crop_species.lower(), {})

    def get_optimal_conditions_for_type(self, application_type: ApplicationType) -> Dict[str, Any]:
        return self.optimal_conditions.get(application_type.value, {})

    def validate_data_availability(self) -> Dict[str, bool]:
        return {
            'crop_stages_available': bool(self.crop_stages),
            'optimal_conditions_available': bool(self.optimal_conditions),
            'fertilizer_products_available': bool(self.fertilizer_products),
            'database_connected': self.db_session is not None
        }

    def get_data_summary(self) -> Dict[str, Any]:
        return {
            'crop_species_count': len(self.crop_stages),
            'application_types_count': len(self.optimal_conditions),
            'fertilizer_products_count': len(self.fertilizer_products),
            'available_crops': list(self.crop_stages.keys()),
            'available_application_types': list(self.optimal_conditions.keys()),
            'available_products': [p['name'] for p in self.fertilizer_products if p['availability']]
        }


    # FastAPI router and endpoint
    router = APIRouter()


    @router.post("/application-schedule", tags=["Nutrient Management"])
    async def create_application_schedule(
        request: ScheduleRequest,
        farm_id: Optional[int] = None,
        db: Session = Depends(get_db)
    ):
        try:
            logger.info("Creating application schedule...")
            # Initialize scheduler with database session
            scheduler = ApplicationScheduler(db_session=db)

            # Validate that all required data is available
            data_availability = scheduler.validate_data_availability()
            if not data_availability['crop_stages_available']:
                logger.warning("Proceeding without DB crop stages – using defaults")

            # Extract data from request
            crop_info = request.crop_info.__dict__ if hasattr(request.crop_info, '__dict__') else request.crop_info
            fertilizer_plan = request.fertilizer_plan.__dict__ if hasattr(request.fertilizer_plan, '__dict__') else request.fertilizer_plan
            environmental_factors = getattr(request, 'environmental_factors', {})
            if hasattr(environmental_factors, '__dict__'):
                environmental_factors = environmental_factors.__dict__

            base_schedule = scheduler.schedule_applications(
                farm_crop_id=request.farm_crop_id if hasattr(request, 'farm_crop_id') else 1,
                crop_species=crop_info.get("species", "rice"),
                planting_date=datetime.fromisoformat(crop_info.get("planting_date", datetime.now().isoformat())),
                current_stage=crop_info.get("current_stage", "vegetative"),
                nutrient_requirements=fertilizer_plan,
                weather_forecast=environmental_factors.get("weather_forecast", [])
            )

            analysis_request = NutrientAnalysisRequest(
                soil_analysis={},
                crop_info=crop_info,
                current_nutrients={},
                deficiencies=[],
                growth_stage=crop_info.get("current_stage", "vegetative"),
                target_yield=crop_info.get("target_yield", 5.0),
                farm_context={
                    "base_schedule": [window.__dict__ for window in base_schedule],
                    "fertilizer_plan": fertilizer_plan,
                    "environmental_factors": environmental_factors
                },
                user_preferences=getattr(request, 'user_preferences', {}),
                weather_forecast=environmental_factors.get("weather_forecast", [])
            )

            # LLM call
            response = await gemini_service.get_nutrient_recommendations_async(analysis_request)

            if not getattr(response, "success", False):
                raise HTTPException(status_code=500, detail=f"Schedule generation failed: {getattr(response, 'error', 'Unknown error')}")

            enhanced_schedule = {
                "success": True,
                "schedule": {
                    "base_schedule": [
                        {
                            "application_type": window.application_type.value,
                            "stage": window.stage,
                            "optimal_date": window.optimal_date.isoformat(),
                            "weather_conditions": window.weather_conditions,
                            "feasibility_score": window.feasibility_score,
                            "alternative_dates": [d.isoformat() for d in window.alternative_dates],
                            "products": window.products,
                            "dosage_per_acre": window.dosage_per_acre,
                            "method": window.method
                        } for window in base_schedule
                    ],
                    "llm_enhanced_recommendations": getattr(response, "content", None),
                    "confidence": getattr(response, "confidence", 0.0),
                    "provider": "gemini",
                    "model": getattr(response, "model_used", "gemini-2.5-flash"),
                    "response_time": getattr(response, "response_time", 0.0)
                },
                "input_data": {
                    "crop_info": crop_info,
                    "fertilizer_plan": fertilizer_plan,
                    "environmental_factors": environmental_factors
                },
                "metadata": {
                    "analysis_type": "application_scheduling",
                    "scheduler_logic": "rule_based",
                    "llm_enhanced": True,
                    "no_mock_values": True,
                    "timestamp": datetime.now().isoformat()
                }
            }

            return enhanced_schedule
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in application scheduling: {e}")
            raise HTTPException(status_code=500, detail=f"Schedule generation failed: {str(e)}")
            return products, total_dosage
        
        # Select products based on application type and requirements
        if application_type == ApplicationType.BASAL:
            # Use slow-release or granular fertilizers
            if requirements.get('n_kg_ha', 0) > 0:
                n_product = self._find_best_product_for_nutrient('n', requirements['n_kg_ha'], available_products)
                if n_product:
                    dosage = self._calculate_dosage(n_product, 'n', requirements['n_kg_ha'])
                    products.append({
                        'name': n_product['name'],
                        'n_percent': n_product['n_percent'],
                        'dosage_kg_ha': dosage,
                        'application_method': 'broadcast',
                        'cost_per_kg': n_product['cost_per_kg']
                    })
                    total_dosage += dosage
            
            if requirements.get('p_kg_ha', 0) > 0:
                p_product = self._find_best_product_for_nutrient('p', requirements['p_kg_ha'], available_products)
                if p_product:
                    dosage = self._calculate_dosage(p_product, 'p', requirements['p_kg_ha'])
                    products.append({
                        'name': p_product['name'],
                        'p_percent': p_product['p_percent'],
                        'dosage_kg_ha': dosage,
                        'application_method': 'broadcast',
                        'cost_per_kg': p_product['cost_per_kg']
                    })
                    total_dosage += dosage
        
        elif application_type == ApplicationType.TOP_DRESS:
            # Use quick-release fertilizers
            if requirements.get('n_kg_ha', 0) > 0:
                n_product = self._find_best_product_for_nutrient('n', requirements['n_kg_ha'], available_products)
                if n_product:
                    dosage = self._calculate_dosage(n_product, 'n', requirements['n_kg_ha'])
                    products.append({
                        'name': n_product['name'],
                        'n_percent': n_product['n_percent'],
                        'dosage_kg_ha': dosage,
                        'application_method': 'side_dress',
                        'cost_per_kg': n_product['cost_per_kg']
                    })
                    total_dosage += dosage
        
        elif application_type == ApplicationType.FOLIAR:
            # Use soluble fertilizers for foliar application
            for nutrient, amount in requirements.get('micro_nutrients', {}).items():
                if amount > 0:
                    # For foliar applications, use concentration-based approach
                    concentration = min(FOLIAR_MAX_CONCENTRATION, amount / 100)
                    spray_volume = FOLIAR_SPRAY_VOLUME_L_PER_HA
                    products.append({
                        'name': f"{nutrient.upper()} Foliar Solution",
                        'concentration_percent': concentration,
                        'dosage_l_ha': spray_volume,
                        'application_method': 'foliar_spray',
                        'nutrient_amount': amount
                    })
                    total_dosage += spray_volume

        return products, total_dosage
    
    def _find_best_product_for_nutrient(self, nutrient: str, required_amount: float, 
                                       available_products: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Find the best product for a specific nutrient requirement"""
        nutrient_key = f"{nutrient}_percent"
        
        # Filter products that contain the required nutrient
        suitable_products = [
            p for p in available_products 
            if p.get(nutrient_key, 0) > 0
        ]
        
        if not suitable_products:
            return None
        
        # Sort by nutrient content (descending) and cost (ascending)
        suitable_products.sort(key=lambda x: (-x.get(nutrient_key, 0), x.get('cost_per_kg', 0)))
        
        return suitable_products[0]
    
    def _calculate_dosage(self, product: Dict[str, Any], nutrient: str, required_amount: float) -> float:
        """Calculate required dosage of a product for a specific nutrient"""
        nutrient_key = f"{nutrient}_percent"
        nutrient_percent = product.get(nutrient_key, 0)
        
        if nutrient_percent == 0:
            return 0
        
        # Calculate dosage: (required_amount / nutrient_percent) * 100
        dosage = (required_amount / nutrient_percent) * 100
        return round(dosage, 2)
    
    def _get_application_method(self, application_type: ApplicationType) -> str:
        """Get application method for the application type from database"""
        # Simple mapping fallback
        mapping = {
            ApplicationType.BASAL: 'broadcast',
            ApplicationType.TOP_DRESS: 'side_dress',
            ApplicationType.FOLIAR: 'foliar_spray'
        }
        return mapping.get(application_type, 'broadcast')
    
    def reschedule_application(self, application_id: int, new_date: datetime,
                            weather_forecast: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Reschedule an application due to weather or other constraints"""
        try:
            # Get weather data for new date
            weather_data = self._get_weather_for_date(new_date, weather_forecast)
            
            if not weather_data:
                return {
                    'success': False,
                    'message': 'No weather data available for selected date'
                }
            
            # Calculate feasibility score
            feasibility_score = self._calculate_weather_feasibility(
                weather_data, ApplicationType.TOP_DRESS  # Default type
            )
            
            if feasibility_score < 0.5:
                return {
                    'success': False,
                    'message': 'Weather conditions not suitable for application',
                    'feasibility_score': feasibility_score
                }
            
            return {
                'success': True,
                'new_date': new_date,
                'weather_conditions': weather_data,
                'feasibility_score': feasibility_score,
                'message': 'Application rescheduled successfully'
            }
            
        except Exception as e:
            logger.error(f"Error rescheduling application: {e}")
            return {
                'success': False,
                'message': f'Error rescheduling application: {str(e)}'
            }
    
    def get_upcoming_applications(self, farm_crop_id: int, days_ahead: int = 14) -> List[Dict[str, Any]]:
        """Get upcoming applications for the next N days from database"""
        if not self.db_session or not ApplicationSchedule:
            return []
        try:
            end_date = datetime.now() + timedelta(days=days_ahead)
            applications = self.db_session.query(ApplicationSchedule).filter(
                ApplicationSchedule.scheduled_date >= datetime.now(),
                ApplicationSchedule.scheduled_date <= end_date
            ).all()
            results = []
            for app_row in applications:
                results.append({
                    'id': getattr(app_row, 'id', None),
                    'plan_id': getattr(app_row, 'plan_id', None),
                    'application_type': getattr(app_row, 'application_type', None),
                    'scheduled_date': getattr(app_row, 'scheduled_date', None),
                    'stage': getattr(app_row, 'stage', None),
                    'products': getattr(app_row, 'fertilizer_products_json', None),
                    'dosage_per_acre': getattr(app_row, 'dosage_per_acre', None),
                    'method': getattr(app_row, 'method', None),
                    'status': 'scheduled'
                })
            return results
        except Exception as e:  # pragma: no cover
            logger.error(f"Error fetching upcoming applications: {e}")
            return []
    
    def validate_application_timing(self, application_date: datetime, 
                                  crop_stage: str, application_type: ApplicationType,
                                  crop_species: str = None) -> Dict[str, Any]:
        """Validate if application timing is appropriate"""
        try:
            # Use provided crop_species or default to checking all available crops
            if crop_species:
                crop_stages_to_check = {crop_species.lower(): self.crop_stages.get(crop_species.lower(), {})}
            else:
                crop_stages_to_check = self.crop_stages
            
            stage_info = None
            for species, stages in crop_stages_to_check.items():
                if crop_stage in stages:
                    stage_info = stages[crop_stage]
                    break
            
            if not stage_info:
                return {
                    'valid': False,
                    'message': f'No timing information for stage: {crop_stage}',
                    'available_stages': list(self.crop_stages.keys())
                }
            
            # Check application type appropriateness for stage
            appropriate_types = self._get_appropriate_application_types(crop_stage)
            
            if application_type not in appropriate_types:
                return {
                    'valid': False,
                    'message': f'{application_type.value} application not recommended for {crop_stage} stage',
                    'recommended_types': [t.value for t in appropriate_types]
                }
            
            return {
                'valid': True,
                'message': 'Application timing is appropriate',
                'recommended_types': [t.value for t in appropriate_types],
                'stage_info': stage_info
            }
            
        except Exception as e:
            logger.error(f"Error validating application timing: {e}")
            return {
                'valid': False,
                'message': f'Error validating timing: {str(e)}'
            }
    
    def _get_appropriate_application_types(self, crop_stage: str) -> List[ApplicationType]:
        """Get appropriate application types for a crop stage from database"""
        # Simple heuristic mapping without DB models
        stage_lower = crop_stage.lower()
        if stage_lower in {"germination", "seedling"}:
            return [ApplicationType.BASAL]
        if stage_lower in {"vegetative", "tillering", "stem_elongation"}:
            return [ApplicationType.TOP_DRESS]
        if stage_lower in {"flowering", "heading", "booting"}:
            return [ApplicationType.TOP_DRESS, ApplicationType.FOLIAR]
        return [ApplicationType.TOP_DRESS]
    
    def refresh_dynamic_data(self):
        """Refresh all dynamic data from database"""
        try:
            self.optimal_conditions = self._load_optimal_conditions()
            self.crop_stages = self._load_crop_stages()
            self.fertilizer_products = self._load_fertilizer_products()
            logger.info("Dynamic data refreshed successfully")
        except Exception as e:
            logger.error(f"Error refreshing dynamic data: {e}")
    
    def get_available_crops(self) -> List[str]:
        """Get list of available crop species"""
        return list(self.crop_stages.keys())
    
    def get_available_products(self, application_type: Optional[ApplicationType] = None) -> List[Dict[str, Any]]:
        """Get list of available fertilizer products"""
        if application_type:
            return [
                p for p in self.fertilizer_products 
                if p['application_type'] == application_type.value and p['availability']
            ]
        return [p for p in self.fertilizer_products if p['availability']]
    
    def get_crop_stages_for_species(self, crop_species: str) -> Dict[str, Any]:
        """Get crop stages for a specific species"""
        return self.crop_stages.get(crop_species.lower(), {})
    
    def get_optimal_conditions_for_type(self, application_type: ApplicationType) -> Dict[str, Any]:
        """Get optimal conditions for a specific application type"""
        return self.optimal_conditions.get(application_type.value, {})
    
    def validate_data_availability(self) -> Dict[str, bool]:
        """Validate that all required data is available from database"""
        return {
            'crop_stages_available': bool(self.crop_stages),
            'optimal_conditions_available': bool(self.optimal_conditions),
            'fertilizer_products_available': bool(self.fertilizer_products),
            'database_connected': self.db_session is not None
        }
    
    def get_data_summary(self) -> Dict[str, Any]:
        """Get summary of available data"""
        return {
            'crop_species_count': len(self.crop_stages),
            'application_types_count': len(self.optimal_conditions),
            'fertilizer_products_count': len(self.fertilizer_products),
            'available_crops': list(self.crop_stages.keys()),
            'available_application_types': list(self.optimal_conditions.keys()),
            'available_products': [p['name'] for p in self.fertilizer_products if p['availability']]
        }


# ===============================
# FastAPI Endpoint for Application Scheduling
# ===============================

# Create router for application scheduling endpoints
router = APIRouter()

@router.post("/application-schedule", tags=["Nutrient Management"])
async def create_application_schedule(
    request: ScheduleRequest,
    farm_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Create detailed application schedule using LLM analysis
    Returns optimized timing for fertilizer applications
    """
    try:
        # Log incoming request
        logger.info("=== APPLICATION SCHEDULE REQUEST ===")
        logger.info(f"Raw request: {request}")
        logger.info(f"Farm ID: {farm_id}")
        
        logger.info("Creating application schedule...")
        
        # Validate LLM availability
        if not gemini_service.is_available():
            raise HTTPException(
                status_code=503, 
                detail="LLM services are not available"
            )
        
        # Extract data from request - transform ScheduleRequest fields to expected format
        crop_info = {
            "species": request.crop_species,
            "current_stage": request.current_stage,
            "planting_date": request.planting_date.isoformat() if request.planting_date else datetime.now().isoformat(),
            "target_yield": getattr(request, 'target_yield', 5.0)
        }
        fertilizer_plan = request.nutrient_requirements or {}
        environmental_factors = {
            "weather_forecast": request.weather_forecast or []
        }
        
        # Initialize scheduler with database session
        scheduler = ApplicationScheduler(db_session=db)
        
        # Validate that all required data is available
        # Data availability is now soft – proceed even if some sources missing.
        data_availability = scheduler.validate_data_availability()
        if not data_availability['crop_stages_available']:
            logger.warning("Proceeding without DB crop stages – using defaults")
        
        # Generate base schedule using scheduler logic
        base_schedule = scheduler.schedule_applications(
            farm_crop_id=request.farm_crop_id,
            crop_species=request.crop_species,
            planting_date=request.planting_date,
            current_stage=request.current_stage,
            nutrient_requirements=fertilizer_plan,
            weather_forecast=request.weather_forecast or []
        )
        
        # Create enhanced analysis request for LLM
        analysis_request = NutrientAnalysisRequest(
            soil_analysis={},
            crop_info=crop_info,
            current_nutrients={},
            deficiencies=[],
            growth_stage=crop_info.get("current_stage", "vegetative"),
            target_yield=crop_info.get("target_yield", 5.0),
            farm_context={
                "base_schedule": [window.__dict__ for window in base_schedule],
                "fertilizer_plan": fertilizer_plan,
                "environmental_factors": environmental_factors
            },
            user_preferences=getattr(request, 'user_preferences', {}),
            weather_forecast=environmental_factors.get("weather_forecast", [])
        )
        
        # Get LLM-enhanced scheduling recommendations
        response = await gemini_service.get_nutrient_recommendations_async(analysis_request)

        if not getattr(response, "success", False):
            raise HTTPException(
                status_code=500,
                detail=f"Schedule generation failed: {getattr(response, 'error', 'Unknown error')}"
            )

        # Combine scheduler logic with LLM insights
        enhanced_schedule = {
            "success": True,
            "schedule": {
                "base_schedule": [
                    {
                        "application_type": window.application_type.value,
                        "stage": window.stage,
                        "optimal_date": window.optimal_date.isoformat(),
                        "weather_conditions": window.weather_conditions,
                        "feasibility_score": window.feasibility_score,
                        "alternative_dates": [d.isoformat() for d in window.alternative_dates],
                        "products": window.products,
                        "dosage_per_acre": window.dosage_per_acre,
                        "method": window.method
                    } for window in base_schedule
                ],
                "llm_enhanced_recommendations": getattr(response, "content", None),
                "confidence": getattr(response, "confidence", 0.0),
                "provider": "gemini",
                "model": getattr(response, "model_used", "gemini-2.5-flash"),
                "response_time": getattr(response, "response_time", 0.0)
            },
            "input_data": {
                "crop_info": crop_info,
                "fertilizer_plan": fertilizer_plan,
                "environmental_factors": environmental_factors
            },
            "metadata": {
                "analysis_type": "application_scheduling",
                "scheduler_logic": "rule_based",
                "llm_enhanced": True,
                "no_mock_values": True,
                "timestamp": datetime.now().isoformat()
            }
        }

        return enhanced_schedule
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in application scheduling: {e}")
        raise HTTPException(status_code=500, detail=f"Schedule generation failed: {str(e)}")
