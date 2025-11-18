"""Unified Nutrient Service Module

Merged & canonical implementation of:
    * nutrient_calculator.py
    * fertilizer_optimizer.py
    * fertilizer_service.py

Responsibilities:
    - DB-first nutrient & fertilizer spec loading with env JSON overrides
    - Scientific requirement calculation + deficiency gaps + interactions
    - Fertilizer optimization (cost-effectiveness, ROI, risk & constraints)
    - LLM-enhanced comprehensive analysis / recs / cost analysis (Gemini)
    - Graceful degradation when DB tables or SDKs are absent
    - Optional persistence hooks (lightweight, guarded)

All legacy source files can be removed after validating this module.
"""

from __future__ import annotations

import os
import json
import asyncio
import hashlib
import time
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from fastapi import HTTPException, Depends, APIRouter
from app.connections.postgres_connection import get_db
from app.schemas.postgres_base_models import (
    ComprehensiveAnalysisRequest,
    SimpleFertilizerRequest,
    CostAnalysisRequest,
    FertilizerRequest,
)
from app.services.gemini_service import gemini_service, NutrientAnalysisRequest
from app.core.config import settings
from app.core.config import settings

logger = logging.getLogger(__name__)

# In-memory request de-duplication for nutrient endpoints (per canonical payload digest)
# Prevents repeated rapid hits (e.g., React StrictMode double-invocation) from re-calling LLMs.
REQUEST_LOCKS: dict[str, asyncio.Lock] = {}
RECENT_RESULTS: dict[str, tuple[float, dict]] = {}
DEDUP_TTL_SECONDS: float = 20.0


def _to_dict(model_or_dict: Any) -> Dict[str, Any]:
    """Safely convert pydantic model (v1 or v2) to dict including extras; otherwise pass through.
    Ensures fields like diagnosed_* on EnvironmentalFactors are preserved.
    """
    try:
        if model_or_dict is None:
            return {}
        if hasattr(model_or_dict, 'dict'):
            return model_or_dict.dict()  # pydantic v1
        if hasattr(model_or_dict, 'model_dump'):
            return model_or_dict.model_dump()  # pydantic v2
        if isinstance(model_or_dict, dict):
            return model_or_dict
        # Fallback: best-effort via vars()
        return dict(vars(model_or_dict))
    except Exception:
        try:
            return dict(model_or_dict)
        except Exception:
            return {}

def _prune_nones(obj: Any) -> Any:
    """Recursively remove keys with None values from dicts and None items from lists."""
    if isinstance(obj, dict):
        return {k: _prune_nones(v) for k, v in obj.items() if v is not None}
    if isinstance(obj, list):
        return [
            _prune_nones(v)
            for v in obj
            if v is not None
        ]
    return obj


# ---------------------------------------------------------------------------
# Data Classes
# ---------------------------------------------------------------------------
@dataclass
class NutrientRequirement:
    stage: str
    n_kg_ha: float
    p_kg_ha: float
    k_kg_ha: float
    s_kg_ha: float
    micro_nutrients: Dict[str, float]
    timing_window_start: int  # days from planting
    timing_window_end: int


@dataclass
class CropNutrientProfile:
    species: str
    variety: str
    total_n_requirement: float
    total_p_requirement: float
    total_k_requirement: float
    stage_requirements: List[NutrientRequirement]
    critical_stages: List[str]


@dataclass
class FertilizerProductData:
    id: Optional[int]
    name: str
    formulation: str
    n_percent: float
    p_percent: float
    k_percent: float
    s_percent: float
    micro_nutrients: Dict[str, float]
    price_per_kg: float
    solubility: str = "medium"
    application_method: str = "mixed"  # basal | top-dress | foliar | mixed
    availability: float = 1000.0
    compatibility: List[str] = field(default_factory=list)


@dataclass
class OptimizationResult:
    selected_products: List[Dict[str, Any]]
    total_cost: float
    total_n: float
    total_p: float
    total_k: float
    total_s: float
    micro_nutrients: Dict[str, float]
    cost_per_acre: float
    roi_estimate: float
    risk_factors: List[str]


# ---------------------------------------------------------------------------
# Nutrient Calculator (merges original nutrient_calculator functionality)
# ---------------------------------------------------------------------------
class NutrientCalculator:
    def __init__(self, db_session: Optional[Session] = None):
        self.db_session = db_session
        self.crop_profiles = self._load_crop_profiles()
        self.nutrient_interactions = self._load_nutrient_interactions()
        self.fertilizer_specs = self._load_fertilizer_specifications()
        self.calculation_parameters = self._load_calculation_parameters()

    # -------- Data Loaders --------
    def _load_crop_profiles(self) -> Dict[str, CropNutrientProfile]:
        if not self.db_session:
            return {}
        try:
            from app.schemas.postgres_base import CropProfile, CropStage, CriticalStage
            if not hasattr(self.db_session, 'query') or not hasattr(CropProfile, 'species'):
                return {}
            profiles: Dict[str, CropNutrientProfile] = {}
            for profile in self.db_session.query(CropProfile).all():
                stages: List[NutrientRequirement] = []
                for st in self.db_session.query(CropStage).filter(CropStage.crop_profile_id == profile.id).all():
                    stages.append(NutrientRequirement(
                        stage=st.stage_name,
                        n_kg_ha=st.n_kg_ha,
                        p_kg_ha=st.p_kg_ha,
                        k_kg_ha=st.k_kg_ha,
                        s_kg_ha=st.s_kg_ha,
                        micro_nutrients=st.micro_nutrients or {},
                        timing_window_start=st.timing_window_start,
                        timing_window_end=st.timing_window_end
                    ))
                critical = [c.stage_name for c in self.db_session.query(CriticalStage).filter(CriticalStage.crop_profile_id == profile.id).all()]
                profiles[profile.species.lower()] = CropNutrientProfile(
                    species=profile.species,
                    variety=profile.variety,
                    total_n_requirement=profile.total_n_requirement,
                    total_p_requirement=profile.total_p_requirement,
                    total_k_requirement=profile.total_k_requirement,
                    stage_requirements=stages,
                    critical_stages=critical
                )
            return profiles
        except Exception as e:  # pragma: no cover
            logger.debug(f"Crop profiles load fallback: {e}")
            return {}

    def _load_nutrient_interactions(self) -> Dict[str, Dict[str, float]]:
        if not self.db_session:
            return {}
        try:
            from app.schemas.postgres_base import NutrientInteraction
            interactions: Dict[str, Dict[str, float]] = {}
            for it in self.db_session.query(NutrientInteraction).all():
                interactions.setdefault(it.interaction_type, {})[it.nutrient_pair] = it.coefficient
            return interactions
        except Exception as e:
            logger.debug(f"Nutrient interactions load fallback: {e}")
            return {}

    def _load_fertilizer_specifications(self) -> Dict[str, Dict[str, Any]]:
        specs: Dict[str, Dict[str, Any]] = {}
        if self.db_session:
            try:
                from app.schemas.postgres_base import FertilizerSpecification
                for spec in self.db_session.query(FertilizerSpecification).all():
                    specs[spec.name.lower()] = {
                        'n_percent': spec.n_percent,
                        'p_percent': spec.p_percent,
                        'k_percent': spec.k_percent,
                        's_percent': spec.s_percent,
                        'zn_percent': spec.zn_percent,
                        'fe_percent': spec.fe_percent,
                        'price_per_kg': spec.price_per_kg
                    }
            except Exception as e:
                logger.debug(f"Fertilizer specs DB load skipped: {e}")
        raw = os.getenv("FERTILIZER_SPECS_JSON") or os.getenv("FERTILIZER_PRODUCTS_JSON")
        if raw:
            try:
                arr = json.loads(raw)
                if isinstance(arr, list):
                    for rec in arr:
                        name = rec.get('name')
                        if not name:
                            continue
                        specs.setdefault(name.lower(), {})
                        for key in ['n_percent','p_percent','k_percent','s_percent','zn_percent','fe_percent','price_per_kg']:
                            if key in rec:
                                specs[name.lower()][key] = rec[key]
            except Exception as e:  # pragma: no cover
                logger.warning(f"Failed parsing fertilizer specs env JSON: {e}")
        return specs

    def _load_calculation_parameters(self) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if self.db_session:
            try:
                from app.schemas.postgres_base import CalculationParameter
                for p in self.db_session.query(CalculationParameter).all():
                    params[p.parameter_name] = p.parameter_value
            except Exception as e:
                logger.debug(f"Calc params DB load skipped: {e}")
        raw = os.getenv("CALCULATION_PARAMETERS_JSON")
        if raw:
            try:
                env_params = json.loads(raw)
                if isinstance(env_params, dict):
                    params.update(env_params)
            except Exception:  # pragma: no cover
                logger.warning("Invalid CALCULATION_PARAMETERS_JSON")
        defaults = {
            'base_yield_t_ha': 4.0,
            'default_s_kg_ha': 5.0,
            'default_zn_kg_ha': 0.2,
            'default_fe_kg_ha': 0.3,
            'high_n_threshold_kg_ha': 50.0,
            'high_ph_threshold': 7.5,
            'high_oc_threshold': 2.0,
            'split_n_threshold_kg_ha': 30.0,
            'season_s_kg_ha': 20.0,
            'season_zn_kg_ha': 1.0,
            'season_fe_kg_ha': 1.5,
            'season_mn_kg_ha': 0.5,
            'season_cu_kg_ha': 0.2,
            'season_b_kg_ha': 0.3,
        }
        for k, v in defaults.items():
            params.setdefault(k, v)
        return params

    # -------- Public Validators / Helpers --------
    def validate_data_availability(self) -> Dict[str, bool]:
        return {
            'crop_profiles_available': bool(self.crop_profiles),
            'nutrient_interactions_available': bool(self.nutrient_interactions),
            'fertilizer_specs_available': bool(self.fertilizer_specs),
            'calculation_parameters_available': bool(self.calculation_parameters),
            'database_connected': self.db_session is not None
        }

    def can_run_analysis(self) -> bool:
        missing = [k for k, v in self.validate_data_availability().items() if k != 'database_connected' and not v]
        if missing:
            logger.warning(f"Running analysis with missing data sets: {missing}")
        return True

    def refresh_dynamic_data(self):  # pragma: no cover
        self.crop_profiles = self._load_crop_profiles()
        self.nutrient_interactions = self._load_nutrient_interactions()
        self.fertilizer_specs = self._load_fertilizer_specifications()
        self.calculation_parameters = self._load_calculation_parameters()

    # -------- Core Calculations --------
    def calculate_nutrient_requirements(self, crop_species: str, variety: str, target_yield: float, current_stage: str, soil_analysis: Dict[str, Any]) -> Dict[str, Any]:
        profile = self.crop_profiles.get(crop_species.lower())
        if not profile:
            raise HTTPException(status_code=422, detail=f"Missing crop profile for species '{crop_species}' (strict mode: no fallback)")
        base_yield = self.calculation_parameters.get('base_yield_t_ha')
        if base_yield in (None, 0):
            raise HTTPException(status_code=422, detail="Missing or invalid base_yield_t_ha parameter (strict mode)")
        yield_factor = target_yield / base_yield
        for req in profile.stage_requirements:
            if req.stage == current_stage:
                return {
                    'n_kg_ha': req.n_kg_ha * yield_factor,
                    'p_kg_ha': req.p_kg_ha * yield_factor,
                    'k_kg_ha': req.k_kg_ha * yield_factor,
                    's_kg_ha': req.s_kg_ha * yield_factor,
                    'micro_nutrients': {k: v * yield_factor for k, v in req.micro_nutrients.items()}
                }
        raise HTTPException(status_code=422, detail=f"Growth stage '{current_stage}' not found in crop profile (strict mode)")

    def _calculate_deficiency_gaps(self, requirements: Dict[str, Any], soil_analysis: Dict[str, Any]) -> Dict[str, float]:
        gaps: Dict[str, float] = {}
        for nutrient in ['n', 'p', 'k', 's']:
            req = requirements.get(f'{nutrient}_kg_ha', 0)
            avail = soil_analysis.get(f'{nutrient}_kg_ha', 0)
            gaps[f'{nutrient}_kg_ha'] = max(0, req - avail)
        for micron in ['zn', 'fe', 'mn', 'cu', 'b']:
            req = requirements.get('micro_nutrients', {}).get(micron, 0)
            avail = soil_analysis.get(f'{micron}_ppm', 0)
            gaps[f'{micron}_ppm'] = max(0, req - avail)
        return gaps

    def _apply_nutrient_interactions(self, gaps: Dict[str, float], soil_analysis: Dict[str, Any]) -> Dict[str, float]:
        adjusted = gaps.copy()
        high_n_threshold = self.calculation_parameters.get('high_n_threshold_kg_ha', 50.0)
        if adjusted.get('n_kg_ha', 0) > high_n_threshold:
            nk_coeff = self.nutrient_interactions.get('n_k', {}).get('n_k', 0.9)
            adjusted['k_kg_ha'] *= nk_coeff
        ph = soil_analysis.get('ph', 7.0)
        if ph > self.calculation_parameters.get('high_ph_threshold', 7.5):
            adjusted['zn_ppm'] = adjusted.get('zn_ppm', 0) * 1.2
            adjusted['fe_ppm'] = adjusted.get('fe_ppm', 0) * 1.2
        return adjusted

    def _find_best_fertilizer_for_nutrient(self, nutrient: str, required_amount: float) -> Optional[Dict[str, Any]]:
        if not self.fertilizer_specs:
            return None
        key = f'{nutrient}_percent'
        candidates = [
            {'name': name, **spec}
            for name, spec in self.fertilizer_specs.items()
            if spec.get(key, 0) > 0
        ]
        if not candidates:
            return None
        candidates.sort(key=lambda x: (-x.get(key, 0), x.get('price_per_kg', 0)))
        return candidates[0]

    def _calculate_fertilizer_quantities(self, requirements: Dict[str, float]) -> Dict[str, Any]:
        if not self.fertilizer_specs:
            return {'fertilizers': {}, 'total_cost_per_ha': 0}
        quantities: Dict[str, Dict[str, float]] = {}
        total_cost = 0.0
        for nutrient, req_key in [('n', 'n_kg_ha'), ('p', 'p_kg_ha'), ('k', 'k_kg_ha')]:
            needed = requirements.get(req_key, 0)
            if needed <= 0:
                continue
            fert = self._find_best_fertilizer_for_nutrient(nutrient, needed)
            if not fert:
                continue
            percent = fert.get(f'{nutrient}_percent', 0)
            if percent <= 0:
                continue
            kg = (needed / percent) * 100
            cost = kg * fert.get('price_per_kg', 0)
            quantities[fert['name']] = {'kg_per_ha': kg, 'cost_per_ha': cost}
            total_cost += cost
        return {'fertilizers': quantities, 'total_cost_per_ha': total_cost}

    # Convenience seasonal estimate
    def calculate_total_season_requirements(self, crop_species: str, target_yield: float) -> Dict[str, float]:
        profile = self.crop_profiles.get(crop_species.lower())
        if not profile:
            raise ValueError(f'Crop profile not found for {crop_species}')
        base_yield = self.calculation_parameters.get('base_yield_t_ha', 4.0)
        yf = target_yield / base_yield
        return {
            'n_kg_ha': profile.total_n_requirement * yf,
            'p_kg_ha': profile.total_p_requirement * yf,
            'k_kg_ha': profile.total_k_requirement * yf,
            's_kg_ha': self.calculation_parameters.get('season_s_kg_ha', 20.0) * yf,
        }


# ---------------------------------------------------------------------------
# Fertilizer Optimizer (merges fertilizer_optimizer)
# ---------------------------------------------------------------------------
class FertilizerOptimizer:
    def __init__(self, db_session: Optional[Session] = None):
        self.db_session = db_session
        self.fertilizer_database: List[FertilizerProductData] = self._load_products()
        self.compatibility_matrix: Dict[str, List[str]] = self._load_compatibility()
        self.nutrient_prices: Dict[str, float] = self._load_nutrient_prices()
        self.yield_response_data: Dict[str, float] = self._load_yield_response_data()
        self.market_prices: Dict[str, float] = self._load_market_prices()

    def _load_products(self) -> List[FertilizerProductData]:
        products: List[FertilizerProductData] = []
        if self.db_session:
            try:
                from app.schemas.postgres_base import FertilizerProduct
                for p in self.db_session.query(FertilizerProduct).all():
                    products.append(FertilizerProductData(
                        id=p.id,
                        name=p.name,
                        formulation=p.formulation or '',
                        n_percent=p.n_percent,
                        p_percent=p.p_percent,
                        k_percent=p.k_percent,
                        s_percent=getattr(p, 's_percent', 0.0),
                        micro_nutrients=getattr(p, 'micro_json', {}) or {},
                        price_per_kg=settings.get_fertilizer_price(p.name, p.price_per_kg),
                        solubility=getattr(p, 'solubility', 'medium'),
                        application_method=getattr(p, 'application_method', 'mixed'),
                        availability=float(getattr(p, 'availability', 1000)),
                        compatibility=list(getattr(p, 'compatibility', []) or [])
                    ))
            except Exception as e:
                logger.debug(f"DB fertilizer products load skipped: {e}")
        if not products:
            # Environment driven (dynamic) – no hardcoded mock defaults
            raw = os.getenv('FERTILIZER_PRODUCTS_JSON')
            if raw:
                try:
                    arr = json.loads(raw)
                    if isinstance(arr, list):
                        for rec in arr:
                            name = rec.get('name')
                            if not name:
                                continue
                            products.append(FertilizerProductData(
                                id=rec.get('id'),
                                name=name,
                                formulation=rec.get('formulation', ''),
                                n_percent=float(rec.get('n_percent', 0.0) or 0.0),
                                p_percent=float(rec.get('p_percent', 0.0) or 0.0),
                                k_percent=float(rec.get('k_percent', 0.0) or 0.0),
                                s_percent=float(rec.get('s_percent', 0.0) or 0.0),
                                micro_nutrients=rec.get('micro_nutrients', {}) or {},
                                price_per_kg=settings.get_fertilizer_price(name, rec.get('price_per_kg', 0.0) or 0.0),
                                solubility=rec.get('solubility','medium'),
                                application_method=rec.get('application_method','mixed'),
                                availability=float(rec.get('availability',1000) or 0.0),
                                compatibility=rec.get('compatibility', []) or []
                            ))
                except Exception as e:  # pragma: no cover
                    logger.warning(f"Failed parsing FERTILIZER_PRODUCTS_JSON: {e}")
        # If still empty, keep empty list (no mock fallback) – upstream logic must handle gracefully
        return products

    def _load_compatibility(self) -> Dict[str, List[str]]:
        raw = os.getenv('FERTILIZER_COMPATIBILITY_JSON')
        if raw:
            try:
                data = json.loads(raw)
                if isinstance(data, dict):
                    return {k: list(v) for k, v in data.items() if isinstance(v, (list, tuple))}
            except Exception:
                logger.warning("Invalid FERTILIZER_COMPATIBILITY_JSON")
        return {}

    def _load_nutrient_prices(self) -> Dict[str, float]:
        raw = os.getenv('NUTRIENT_PRICES_JSON')
        if raw:
            try:
                data = json.loads(raw)
                if isinstance(data, dict):
                    return {k.lower(): float(v) for k, v in data.items() if isinstance(v, (int,float))}
            except Exception:
                logger.warning("Invalid NUTRIENT_PRICES_JSON")
        return {'n': 60.0, 'p': 110.0, 'k': 70.0, 's': 40.0}

    def _load_yield_response_data(self) -> Dict[str, float]:
        raw = os.getenv('YIELD_RESPONSE_JSON')
        if raw:
            try:
                data = json.loads(raw)
                if isinstance(data, dict):
                    return {k.lower(): float(v) for k, v in data.items() if isinstance(v,(int,float))}
            except Exception:
                logger.warning("Invalid YIELD_RESPONSE_JSON")
        return {'n': 0.06, 'p': 0.035, 'k': 0.025}

    def _load_market_prices(self) -> Dict[str, float]:
        raw = os.getenv('MARKET_PRICES_JSON')
        if raw:
            try:
                data = json.loads(raw)
                if isinstance(data, dict):
                    return {k.lower(): float(v) for k, v in data.items() if isinstance(v,(int,float))}
            except Exception:
                logger.warning("Invalid MARKET_PRICES_JSON")
        return {'grain': 18.0}

    # ---- Optimization ----
    def _calculate_cost_effectiveness(self, product: FertilizerProductData, remaining_n: float, remaining_p: float, remaining_k: float) -> float:
        """Coverage-based score: average fraction of remaining N/P/K one kg can cover divided by price.

        fraction_n = ( (product.n_percent/100) / remaining_n ) capped at 1.0, etc.
        score = (sum(fractions)/count_nonzero_remaining) / price_per_kg
        """
        if product.price_per_kg <= 0:
            return 0.0
        fractions = []
        if remaining_n > 0:
            frac_n = (product.n_percent/100) / remaining_n if product.n_percent > 0 else 0.0
            fractions.append(min(frac_n, 1.0))
        if remaining_p > 0:
            frac_p = (product.p_percent/100) / remaining_p if product.p_percent > 0 else 0.0
            fractions.append(min(frac_p, 1.0))
        if remaining_k > 0:
            frac_k = (product.k_percent/100) / remaining_k if product.k_percent > 0 else 0.0
            fractions.append(min(frac_k, 1.0))
        if not fractions:
            return 0.0
        coverage = sum(fractions) / len(fractions)
        return coverage / product.price_per_kg

    def _identify_risk_factors(self, selected: List[Dict[str, Any]], remaining_n: float, remaining_p: float, remaining_k: float, initial_n: float, initial_p: float, initial_k: float) -> List[str]:
        risks: List[str] = []
        def pct(rem, init):
            return (rem / init * 100) if init > 0 else 0
        if initial_n > 0 and remaining_n/initial_n > 0.1:
            risks.append(f"N coverage low ({100-pct(remaining_n,initial_n):.1f}% met)")
        if initial_p > 0 and remaining_p/initial_p > 0.1:
            risks.append(f"P coverage low ({100-pct(remaining_p,initial_p):.1f}% met)")
        if initial_k > 0 and remaining_k/initial_k > 0.1:
            risks.append(f"K coverage low ({100-pct(remaining_k,initial_k):.1f}% met)")
        names = [r['product'].name for r in selected]
        for i, a in enumerate(names):
            for b in names[i+1:]:
                if self.compatibility_matrix and a in self.compatibility_matrix and b not in self.compatibility_matrix.get(a, []):
                    risks.append(f"Potential incompatibility: {a}+{b}")
        if any(r['product'].price_per_kg > (sum(p['product'].price_per_kg for p in selected)/len(selected) * 1.8 if selected else 50) for r in selected):
            risks.append("Outlier high-cost product")
        return risks

    def _calculate_roi_estimate(self, total_cost: float, total_n: float, total_p: float, total_k: float) -> float:
        if total_cost <= 0:
            return 0.0
        n_resp = self.yield_response_data.get('n', 0)
        p_resp = self.yield_response_data.get('p', 0)
        k_resp = self.yield_response_data.get('k', 0)
        grain_price = self.market_prices.get('grain', 0)
        yield_gain = total_n * n_resp + total_p * p_resp + total_k * k_resp
        add_rev = yield_gain * grain_price
        return ((add_rev - total_cost) / total_cost) * 100 if total_cost else 0.0

    def _filter_products_by_method(self, application_method: str) -> List[FertilizerProductData]:
        if application_method == 'mixed':
            return self.fertilizer_database
        return [p for p in self.fertilizer_database if application_method in p.application_method]

    def _apply_availability_constraints(self, products: List[FertilizerProductData], constraints: Optional[Dict[str, Any]]) -> List[FertilizerProductData]:
        if not constraints:
            return products
        excluded = set(constraints.get('excluded_products', []))
        max_price = constraints.get('max_price_per_kg')
        max_quantities = constraints.get('max_quantities', {})
        out: List[FertilizerProductData] = []
        for p in products:
            if p.name in excluded:
                continue
            if max_price is not None and p.price_per_kg > max_price:
                continue
            if p.name in max_quantities:
                p.availability = min(p.availability, float(max_quantities[p.name]))
            out.append(p)
        return out

    def optimize_fertilizer_selection(self, nutrient_requirements: Dict[str, Any], budget_constraint: Optional[float] = None, application_method: str = 'mixed', availability_constraints: Optional[Dict[str, Any]] = None) -> OptimizationResult:
        req_n = nutrient_requirements.get('n_kg_ha', 0)
        req_p = nutrient_requirements.get('p_kg_ha', 0)
        req_k = nutrient_requirements.get('k_kg_ha', 0)
        products = self._filter_products_by_method(application_method)
        products = self._apply_availability_constraints(products, availability_constraints)
        scores = [(p, self._calculate_cost_effectiveness(p, req_n, req_p, req_k)) for p in products]
        scores.sort(key=lambda x: x[1], reverse=True)
        remaining_n, remaining_p, remaining_k = req_n, req_p, req_k
        selected: List[Dict[str, Any]] = []
        total_cost = total_n = total_p = total_k = total_s = 0.0
        for product, _ in scores:
            if remaining_n <= 0 and remaining_p <= 0 and remaining_k <= 0:
                break
            # Determine limiting nutrient for this product
            candidate_quantities = []
            if remaining_n > 0 and product.n_percent > 0:
                candidate_quantities.append((remaining_n / (product.n_percent/100)))
            if remaining_p > 0 and product.p_percent > 0:
                candidate_quantities.append((remaining_p / (product.p_percent/100)))
            if remaining_k > 0 and product.k_percent > 0:
                candidate_quantities.append((remaining_k / (product.k_percent/100)))
            if not candidate_quantities:
                continue
            qty_needed = min(candidate_quantities)  # kg/ha to satisfy the most limiting nutrient
            if qty_needed <= 0:
                continue
            if budget_constraint and (total_cost + qty_needed * product.price_per_kg) > budget_constraint:
                continue
            qty = min(qty_needed, product.availability)
            cost = qty * product.price_per_kg
            selected.append({'product': product, 'quantity_kg_ha': qty, 'cost_per_ha': cost})
            total_cost += cost
            total_n += qty * product.n_percent / 100
            total_p += qty * product.p_percent / 100
            total_k += qty * product.k_percent / 100
            total_s += qty * product.s_percent / 100
            remaining_n -= qty * product.n_percent / 100
            remaining_p -= qty * product.p_percent / 100
            remaining_k -= qty * product.k_percent / 100
        roi = self._calculate_roi_estimate(total_cost, total_n, total_p, total_k)
        risks = self._identify_risk_factors(selected, remaining_n, remaining_p, remaining_k, req_n, req_p, req_k)
        return OptimizationResult(
            selected_products=selected,
            total_cost=total_cost,
            total_n=total_n,
            total_p=total_p,
            total_k=total_k,
            total_s=total_s,
            micro_nutrients={},
            cost_per_acre=total_cost,
            roi_estimate=roi,
            risk_factors=risks
        )

    # Exposed utilities mirroring previous API
    def compare_fertilizer_options(self, nutrient_requirements: Dict[str, Any], options: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        out = []
        for opt in options:
            try:
                res = self.optimize_fertilizer_selection(nutrient_requirements, budget_constraint=opt.get('budget_constraint'), application_method=opt.get('application_method','mixed'))
                out.append({'option_name': opt.get('name','Option'), 'total_cost': res.total_cost, 'roi_estimate': res.roi_estimate})
            except Exception as e:
                out.append({'option_name': opt.get('name','Option'), 'error': str(e)})
        out.sort(key=lambda x: x.get('roi_estimate', 0), reverse=True)
        return out

    def get_product_recommendations(self, nutrient_requirements: Dict[str, Any], application_method: str = 'mixed') -> List[Dict[str, Any]]:
        recs = []
        products = [p for p in self.fertilizer_database if application_method in ('mixed', p.application_method)]
        for p in products:
            score = 0
            factors = []
            if nutrient_requirements.get('n_kg_ha',0) > 0 and p.n_percent>0: score+=1; factors.append('Provides N')
            if nutrient_requirements.get('p_kg_ha',0) > 0 and p.p_percent>0: score+=1; factors.append('Provides P')
            if nutrient_requirements.get('k_kg_ha',0) > 0 and p.k_percent>0: score+=1; factors.append('Provides K')
            if score:
                recs.append({'product': p, 'relevance_score': score, 'relevance_factors': factors, 'cost_effectiveness': self._calculate_cost_effectiveness(p, nutrient_requirements.get('n_kg_ha',0), nutrient_requirements.get('p_kg_ha',0), nutrient_requirements.get('k_kg_ha',0))})
        recs.sort(key=lambda x: (x['relevance_score'], x['cost_effectiveness']), reverse=True)
        return recs[:10]

    def validate_data_availability(self) -> Dict[str, bool]:  # type: ignore[override]
        return {
            'fertilizer_products_available': bool(self.fertilizer_database),
            'nutrient_prices_available': bool(self.nutrient_prices),
            'yield_response_data_available': bool(self.yield_response_data),
            'market_prices_available': bool(self.market_prices)
        }

    def get_data_summary(self) -> Dict[str, Any]:
        return {
            'fertilizer_products_count': len(self.fertilizer_database),
            'nutrient_types_count': len(self.nutrient_prices),
            'compatibility_relationships_count': sum(len(v) for v in self.compatibility_matrix.values()),
            'yield_response_nutrients_count': len(self.yield_response_data),
            'market_commodities_count': len(self.market_prices),
            'available_products': [p.name for p in self.fertilizer_database if p.availability>0]
        }


# ---------------------------------------------------------------------------
# Orchestration & Persistence Layer (merges fertilizer_service)
# ---------------------------------------------------------------------------
class FertilizerService:
    def __init__(self, db: Optional[Session]):
        self.db = db
        self.calculator = NutrientCalculator(db_session=db)
        self.optimizer = FertilizerOptimizer(db_session=db)

    # DB helper methods (each guarded)
    def _safe_query_first(self, model, *filters):  # pragma: no cover
        if not self.db or not model or not hasattr(self.db, 'query'):
            return None
        try:
            q = self.db.query(model)
            for f in filters:
                q = q.filter(f)
            return q.first()
        except Exception as e:
            logger.debug(f"Query failed for {model}: {e}")
            return None

    async def generate_llm_fertilizer_recommendations(self, soil_analysis: Dict[str, Any], crop_info: Dict[str, Any], farm_id: Optional[int]) -> Dict[str, Any]:
        if not gemini_service.is_available():
            raise HTTPException(status_code=503, detail="LLM service unavailable")
        analysis_request = NutrientAnalysisRequest(
            soil_analysis=soil_analysis,
            crop_info=crop_info,
            current_nutrients=soil_analysis,
            deficiencies=[],
            growth_stage=crop_info.get("current_stage"),
            target_yield=crop_info.get("target_yield"),
            farm_context={},
            user_preferences={},
            weather_forecast=[]
        )
        response = await gemini_service.get_nutrient_recommendations_async(analysis_request)
        return {
            'success': getattr(response, 'success', False),
            'content': getattr(response, 'content', None),
            'confidence': getattr(response, 'confidence', None),
            'model': getattr(response, 'model_used', None),
            'response_time': getattr(response, 'response_time', None),
            'provider': 'gemini'
        }

    def optimize_from_simple_request(self, req: SimpleFertilizerRequest, availability_constraints: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        requirements = {
            'n_kg_ha': req.n_kg_ha,
            'p_kg_ha': req.p_kg_ha,
            'k_kg_ha': req.k_kg_ha,
            's_kg_ha': getattr(req, 's_kg_ha', 0),
            'micro_nutrients': getattr(req, 'micro_nutrients', {}) or {}
        }
        opt = self.optimizer.optimize_fertilizer_selection(requirements, availability_constraints=availability_constraints)
        return {
            'recommendations': [
                {
                    'product': r['product'].name,
                    'quantity_kg_ha': r['quantity_kg_ha'],
                    'cost_per_ha': r['cost_per_ha']
                } for r in opt.selected_products
            ],
            'total_cost': opt.total_cost,
            'roi_estimate': opt.roi_estimate
        }

    def save_recommendation(self, farm_id: int, recommendation_data: Any, soil_analysis: Any, crop_info: Any):  # simplified persistence
        try:
            if not self.db:
                return
            from app.schemas.postgres_base import AgentRun, FarmCrop
            farm_crop = self.db.query(FarmCrop).filter(FarmCrop.farm_id == farm_id).first()
            if not farm_crop:
                return
            ar = AgentRun(
                farm_crop_id=farm_crop.id,
                trigger_type='fertilizer_recommendation',
                state_json={'recommendation': recommendation_data, 'soil_analysis': soil_analysis, 'crop_info': crop_info},
                started_at=datetime.now(),
                outcome='success',
                recommendations=recommendation_data if isinstance(recommendation_data, list) else []
            )
            self.db.add(ar)
            self.db.commit()
        except Exception as e:  # pragma: no cover
            try:
                if self.db:
                    self.db.rollback()
            except Exception:
                pass
            logger.debug(f"save_recommendation skipped: {e}")


# ---------------------------------------------------------------------------
# FastAPI Router Endpoints (merged + completed)
# ---------------------------------------------------------------------------
router = APIRouter()


@router.post('/comprehensive-analysis', tags=['Nutrient Management'])
async def comprehensive_nutrient_analysis(request: ComprehensiveAnalysisRequest, db: Session = Depends(get_db)):
    try:
        # Build canonical payload for de-dup and logging
        request_id = getattr(request, 'request_id', None) or os.getenv('REQUEST_ID') or ''
        logger.info("=== COMPREHENSIVE ANALYSIS REQUEST ===")
        logger.info(f"Raw request: {request}")
        soil_analysis = _to_dict(request.soil_analysis)
        crop_info = _to_dict(request.crop_info)
        environmental = _to_dict(request.environmental_factors)
        user_pref = _to_dict(request.user_preferences)

        # Canonical digest for input (order-stable JSON serialization)
        canonical = {
            'soil_analysis': soil_analysis,
            'crop_info': crop_info,
            'environmental_factors': environmental,
            'user_preferences': user_pref,
        }
        try:
            canon_str = json.dumps(canonical, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
        except Exception:
            canon_str = json.dumps({k: str(v) for k, v in canonical.items()}, sort_keys=True, separators=(",", ":"))
        digest = hashlib.sha256(canon_str.encode('utf-8')).hexdigest()
        lock = REQUEST_LOCKS.setdefault(digest, asyncio.Lock())

        # Log processed data
        logger.info(f"Processed soil_analysis: {soil_analysis}")
        logger.info(f"Processed crop_info: {crop_info}")
        logger.info(f"Processed environmental: {environmental}")
        logger.info(f"Processed user_preferences: {user_pref}")
        logger.info(f"Request digest={digest[:10]} request_id={request_id}")

        # Serve from short-lived cache when available
        cached = RECENT_RESULTS.get(digest)
        now_ts = time.time()
        if cached and (now_ts - cached[0] < DEDUP_TTL_SECONDS):
            logger.info(f"comprehensive-analysis cache-hit digest={digest[:10]} age={now_ts - cached[0]:.2f}s")
            return cached[1]

        # Single-flight guard
        if lock.locked():
            logger.info(f"comprehensive-analysis duplicate detected digest={digest[:10]} waiting for in-flight")
        async with lock:
            # Re-check cache after acquiring lock
            cached2 = RECENT_RESULTS.get(digest)
            now_ts2 = time.time()
            if cached2 and (now_ts2 - cached2[0] < DEDUP_TTL_SECONDS):
                logger.info(f"comprehensive-analysis cache-hit(post-lock) digest={digest[:10]} age={now_ts2 - cached2[0]:.2f}s")
                return cached2[1]
        # Enforce strict required fields when STRICT_NO_FALLBACKS
        required_crop_fields = ["species"]
        missing = [f for f in required_crop_fields if not crop_info.get(f)]
        # In strict mode, if essential context is missing, fail fast instead of returning generic placeholders
        if settings.STRICT_NO_FALLBACKS and (missing or soil_analysis is None or soil_analysis == {}):
            raise HTTPException(status_code=422, detail={
                "error": "invalid_input",
                "message": "Missing required fields for analysis",
        "missing": missing + (["soil_analysis"] if not soil_analysis else []),
            })

        if not gemini_service.is_available():
            raise HTTPException(status_code=503, detail="LLM service unavailable (strict mode: no nutrient fallback)")
        # Ensure weather_forecast normalized to list
        wf = environmental.get('weather_forecast') if isinstance(environmental, dict) else None
        if wf is None:
            wf = []
        elif not isinstance(wf, list):
            wf = [wf]

        analysis_request = NutrientAnalysisRequest(
            soil_analysis=soil_analysis,
            crop_info=crop_info,
            current_nutrients=soil_analysis or {},
            deficiencies=[],
            growth_stage=crop_info.get('current_stage') if not settings.STRICT_NO_FALLBACKS else (crop_info.get('current_stage') or None),
            target_yield=crop_info.get('target_yield') if not settings.STRICT_NO_FALLBACKS else (crop_info.get('target_yield') or 0.0),
            farm_context=environmental or {},
            user_preferences=user_pref or {},
            weather_forecast=wf
        )
        
        # Log LLM request
        logger.info(f"Sending to LLM - Analysis Request: {analysis_request}")
        
        resp = await gemini_service.get_nutrient_recommendations_async(analysis_request)
        
        # Log LLM response
        logger.info(f"LLM Response success: {getattr(resp, 'success', False)}")
        # logger.info(f"LLM Response content: {getattr(resp,'content',None)}")
        logger.info(f"LLM Response confidence: {getattr(resp,'confidence',None)}")
        logger.info(f"LLM Response model: {getattr(resp,'model_used',None)}")
        if not getattr(resp, 'success', False):
            raise HTTPException(status_code=502, detail="LLM failed to produce nutrient analysis (strict mode)")
        
        # Prune None values before returning to frontend for clean mapping
        clean_input = {
            'soil_analysis': _prune_nones(soil_analysis or {}),
            'crop_info': _prune_nones(crop_info or {}),
            'environmental_factors': {
                **_prune_nones(environmental or {}),
                'weather_forecast': wf  # ensure list, not null
            },
            'user_preferences': _prune_nones(user_pref or {}),
        }

        final_response = {
            'success': True,
            'analysis': {
                'llm_recommendations': getattr(resp,'content',None),
                'confidence': getattr(resp,'confidence',None),
                'provider': 'gemini',
                'model': getattr(resp,'model_used',None),
                'response_time': getattr(resp,'response_time',None)
            },
            'input_data': clean_input,
            'metadata': {
                'analysis_type': 'comprehensive_nutrient_analysis',
                'llm_enhanced': True,
                'strict_mode': True,
                'timestamp': datetime.now().isoformat()
            }
        }
        
        # Log final response
        logger.info("=== COMPREHENSIVE ANALYSIS RESPONSE ===")
        logger.info(f"Final response being sent to frontend: {final_response}")
        logger.info("=== END COMPREHENSIVE ANALYSIS ===")
        # Cache successful response
        try:
            RECENT_RESULTS[digest] = (time.time(), final_response)
        except Exception:
            pass
        return final_response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Comprehensive analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Comprehensive analysis failed: {e}")


@router.post('/fertilizer-recommendations', tags=['Nutrient Management'])
async def get_fertilizer_recommendations(request: FertilizerRequest, farm_id: Optional[int] = None, db: Session = Depends(get_db)):
    try:
        # Log incoming request
        logger.info("=== FERTILIZER RECOMMENDATIONS REQUEST ===")
        logger.info(f"Raw request: {request}")
        logger.info(f"Farm ID: {farm_id}")
        
        soil_analysis = _to_dict(request.soil_analysis)
        crop_info = _to_dict(request.crop_info)
        
        logger.info(f"Processed soil_analysis: {soil_analysis}")
        logger.info(f"Processed crop_info: {crop_info}")

        # De-dup per canonical payload
        canonical = {
            'soil_analysis': soil_analysis,
            'crop_info': crop_info,
            'farm_id': farm_id,
        }
        try:
            canon_str = json.dumps(canonical, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
        except Exception:
            canon_str = json.dumps({k: str(v) for k, v in canonical.items()}, sort_keys=True, separators=(",", ":"))
        digest = hashlib.sha256(canon_str.encode('utf-8')).hexdigest()
        lock = REQUEST_LOCKS.setdefault(digest, asyncio.Lock())
        cached = RECENT_RESULTS.get(digest)
        now_ts = time.time()
        if cached and (now_ts - cached[0] < DEDUP_TTL_SECONDS):
            logger.info(f"fertilizer-recommendations cache-hit digest={digest[:10]} age={now_ts - cached[0]:.2f}s")
            return cached[1]
        if lock.locked():
            logger.info(f"fertilizer-recommendations duplicate detected digest={digest[:10]} waiting for in-flight")
        async with lock:
            cached2 = RECENT_RESULTS.get(digest)
            now_ts2 = time.time()
            if cached2 and (now_ts2 - cached2[0] < DEDUP_TTL_SECONDS):
                logger.info(f"fertilizer-recommendations cache-hit(post-lock) digest={digest[:10]} age={now_ts2 - cached2[0]:.2f}s")
                return cached2[1]
        
        service = FertilizerService(db)
        if not gemini_service.is_available():
            raise HTTPException(status_code=503, detail="LLM service unavailable (strict mode: no fertilizer fallback)")
        llm_res = await service.generate_llm_fertilizer_recommendations(soil_analysis, crop_info, farm_id)
        if not llm_res.get('success'):
            raise HTTPException(status_code=502, detail="LLM failed to produce fertilizer recommendations (strict mode)")
        if farm_id:
            service.save_recommendation(farm_id, llm_res.get('content'), soil_analysis, crop_info)
        response = {
            'success': True,
            'recommendations': llm_res,
            'input_data': {'soil_analysis': soil_analysis, 'crop_info': crop_info},
            'metadata': {'analysis_type': 'fertilizer_recommendations', 'llm_based': True, 'strict_mode': True, 'timestamp': datetime.now().isoformat()}
        }
        try:
            RECENT_RESULTS[digest] = (time.time(), response)
        except Exception:
            pass
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fertilizer recommendations failed: {e}")
        raise HTTPException(status_code=500, detail=f"Fertilizer recommendations failed: {e}")


@router.post('/cost-analysis', tags=['Nutrient Management'])
async def analyze_fertilizer_costs(request: CostAnalysisRequest, farm_id: Optional[int] = None, db: Session = Depends(get_db)):
    try:
        # Log incoming request
        logger.info("=== COST ANALYSIS REQUEST ===")
        logger.info(f"Raw request: {request}")
        logger.info(f"Farm ID: {farm_id}")

        # Use robust converter to preserve any extra fields present in pydantic models
        plan = _to_dict(getattr(request, 'fertilizer_plan', {}))
        market = _to_dict(getattr(request, 'market_prices', {}))
        farm_details = _to_dict(getattr(request, 'farm_details', {}))

        logger.info(f"Processed plan: {plan}")
        logger.info(f"Processed market: {market}")
        logger.info(f"Processed farm_details: {farm_details}")

        analysis_request = NutrientAnalysisRequest(
            soil_analysis={},
            crop_info=farm_details,
            current_nutrients={},
            deficiencies=[],
            growth_stage='cost_analysis',
            target_yield=farm_details.get('target_yield', 5.0),
            farm_context={'fertilizer_plan': plan, 'market_prices': market},
            user_preferences=_to_dict(getattr(request, 'user_preferences', {})),
            weather_forecast=[]
        )
        if not gemini_service.is_available():
            raise HTTPException(status_code=503, detail="LLM service unavailable (strict mode: no cost analysis fallback)")
        resp = await gemini_service.get_nutrient_recommendations_async(analysis_request)
        if not getattr(resp, 'success', False):
            raise HTTPException(status_code=502, detail="LLM failed to produce cost analysis (strict mode)")
        return {
            'success': True,
            'cost_analysis': {
                'llm_insights': getattr(resp, 'content', None),
                'confidence': getattr(resp, 'confidence', None),
                'provider': 'gemini',
                'model': getattr(resp, 'model_used', 'gemini'),
                'response_time': getattr(resp, 'response_time', 0.0)
            },
            'metadata': {'analysis_type': 'cost_optimization', 'llm_enhanced': True, 'strict_mode': True, 'timestamp': datetime.now().isoformat()}
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cost analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Cost analysis failed: {e}")


## NOTE: Duplicate secondary FertilizerService class & endpoints removed to avoid conflicts.
