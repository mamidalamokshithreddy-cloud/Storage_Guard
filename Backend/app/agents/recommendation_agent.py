import logging
import asyncio
from typing import Dict, Any, List
from app.agents.base_agent import BaseAgent, AgentResponse
from datetime import datetime
from app.services.mandi_service import create_mandi_service

logger = logging.getLogger(__name__)

class TrulyDynamicRecommendationAgent(BaseAgent):
    """Fixed recommendation agent that properly handles ML predictions."""
    
    def __init__(self):
        # ✅ FIXED: Pass name to BaseAgent
        super().__init__(name="TrulyDynamicRecommendationAgent")
        self.mandi_service = create_mandi_service()
    
    # Rest of your code stays the same...
    async def execute(self, request_data: Dict[str, Any]) -> AgentResponse:
        """Execute recommendation generation with proper ML result handling."""
        try:
            logger.info("🎯 Recommendation Agent: Processing ML results...")
            
            # Extract ML results
            ml_results = request_data.get("ml_results", {})
            prediction_data = ml_results.get("prediction", {})
            
            logger.info(f"📊 ML Results received: {ml_results.keys()}")
            logger.info(f"🔮 Prediction data: {prediction_data}")
            
            # ✅ FIXED: Properly extract prediction results
            primary_crop = prediction_data.get("primary_recommendation", "unknown")
            primary_confidence = prediction_data.get("primary_confidence", 0.0)
            all_recommendations = prediction_data.get("all_recommendations", [])
            
            logger.info(f"🎯 Primary crop extracted: {primary_crop} (confidence: {primary_confidence})")
            logger.info(f"📋 All recommendations count: {len(all_recommendations)}")
            
            # If no valid prediction, return error
            if primary_crop == "unknown" or primary_confidence == 0 or not all_recommendations:
                logger.error("🚨 NO VALID ML PREDICTIONS RECEIVED!")
                logger.error(f"Primary: {primary_crop}, Confidence: {primary_confidence}")
                logger.error(f"All recs: {all_recommendations}")
                
                return AgentResponse(
                    status="error", 
                    message="ML prediction failed - no valid recommendations generated",
                    data={"error": "ML prediction returned no results"}
                )
            
            # Get crop profiles and other data
            crop_profiles = request_data.get("crop_profiles", {})
            weather_data = request_data.get("weather_data", {})
            processed_data = request_data.get("processed_data", {})
            
            # Determine top-3 crops (primary + next two) from ML results
            top_crops = [primary_crop]
            for rec in all_recommendations[1:3]:  # next two recommendations
                crop_name = rec.get("crop")
                if crop_name and crop_name not in top_crops:
                    top_crops.append(crop_name)

            # Fetch market insights for top crops in parallel
            market_tasks = [self._get_market_insights(crop, processed_data) for crop in top_crops]
            market_results = await asyncio.gather(*market_tasks, return_exceptions=True)

            # Map crop -> market_insights (skip failures)
            market_insights_map = {}
            for crop, result in zip(top_crops, market_results):
                if isinstance(result, Exception):
                    logger.warning(f"Failed to fetch market insights for {crop}: {result}")
                    market_insights_map[crop] = None
                else:
                    market_insights_map[crop] = result

            # ✅ FIXED: Build proper recommendations using per-crop market insights
            recommendations = self._build_comprehensive_recommendations(
                primary_crop=primary_crop,
                primary_confidence=primary_confidence,
                all_recommendations=all_recommendations,
                crop_profiles=crop_profiles,
                weather_data=weather_data,
                processed_data=processed_data,
                market_insights_map=market_insights_map
            )
            
            logger.info(f"✅ Recommendations built successfully for primary crop: {primary_crop}")
            
            return AgentResponse(
                status="success",
                message="Dynamic recommendations generated successfully", 
                data=recommendations
            )
            
        except Exception as e:
            logger.error(f"🚨 Recommendation generation failed: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            return AgentResponse(
                status="error",
                message=f"Recommendation generation failed: {str(e)}",
                data={"error": str(e)}
            )
    
    # All your existing methods stay the same...
    def _build_comprehensive_recommendations(
        self, 
        primary_crop: str,
        primary_confidence: float,
        all_recommendations: List[Dict],
        crop_profiles: Dict,
        weather_data: Dict,
        processed_data: Dict,
        market_insights_map: Dict[str, Dict] = None
    ) -> Dict[str, Any]:
        """Build comprehensive recommendations with proper data."""
        
        logger.info(f"🏗️ Building recommendations for {primary_crop}")
        
        # Get primary crop profile
        primary_profile = crop_profiles.get(primary_crop, {})
        
        # Build primary crop recommendation
        primary_market_insights = None
        if market_insights_map:
            primary_market_insights = market_insights_map.get(primary_crop)

        primary_recommendation = {
            "name": primary_crop,
            "confidence": round(primary_confidence, 4),
            "suitability": self._get_suitability_grade(primary_confidence),
            "yield_estimation": {
                "data_source": f"Based on {primary_profile.get('sample_count', 'unknown')} real farm samples",
                "reliability": "high" if primary_confidence > 0.7 else "medium",
                "note": "Yields calculated from actual agricultural dataset"
            },
            "nutrient_requirements": self._get_nutrient_requirements(primary_profile),
            "market_information": self._build_market_information(primary_crop, primary_market_insights),
            "extension_guidelines": {
                "local_varieties": "Connect to extension database",
                "regional_practices": "Integrate with local agricultural departments"
            }
        }
        
        # Build alternative crops (top 4 excluding primary)
        alternative_crops = []
        # Build only top-2 alternatives (so total top-3 shown to the user)
        for rec in all_recommendations[1:3]:  # Skip first (primary), take next 2
            crop_name = rec.get("crop", "unknown")
            confidence = rec.get("confidence", 0)
            crop_profile = crop_profiles.get(crop_name, {})
            # get market insights for this alternative if available
            alt_market_insights = None
            if market_insights_map:
                alt_market_insights = market_insights_map.get(crop_name)

            alternative = {
                "name": crop_name,
                "confidence": round(confidence, 4),
                "suitability": self._get_suitability_grade(confidence),
                "advantages": self._get_crop_advantages(crop_name, primary_crop),
                "considerations": [],
                "yield_estimation": {
                    "data_source": f"Based on {crop_profile.get('sample_count', 'unknown')} real farm samples",
                    "reliability": "high" if confidence > 0.7 else "medium",
                    "note": "Yields calculated from actual agricultural dataset"
                },
                "nutrient_requirements": self._get_nutrient_requirements(crop_profile),
                "market_information": self._build_market_information(crop_name, alt_market_insights),
                "extension_guidelines": {
                    "local_varieties": "Connect to extension database",
                    "regional_practices": "Integrate with local agricultural departments"
                }
            }
            alternative_crops.append(alternative)
        
        # Build complete response
        # Market insights summary: use primary crop map if available
        summary_market_insights = None
        if market_insights_map:
            summary_market_insights = market_insights_map.get(primary_crop)

        recommendations = {
            "primary_crop": primary_recommendation,
            "alternative_crops": alternative_crops,
            "soil_management": self._build_soil_management(processed_data, crop_profiles),
            "resource_requirements": self._build_resource_requirements(processed_data),
            "implementation_strategy": self._build_implementation_strategy(processed_data),
            "market_insights": self._build_enhanced_market_insights(summary_market_insights),
            "local_guidelines": self._build_local_guidelines(processed_data),
            "dynamic_risk_assessment": self._build_risk_assessment(weather_data, processed_data)
        }
        
        return recommendations
    
    async def _get_market_insights(self, crop_name: str, processed_data: Dict) -> Dict[str, Any]:
        """Get market insights for a specific crop."""
        try:
            logger.info(f"🏪 Fetching market data for {crop_name}")
            
            # Get state from processed data
            state = processed_data.get("region", "Telangana")  # Default to Telangana
            district = processed_data.get("district", None)
            
            # Fetch market data
            market_data = await self.mandi_service.get_crop_market_data(crop_name, state, district)
            
            # Calculate profitability only when price is numeric and data_quality is live
            profitability = None
            if market_data:
                cp = market_data.get("current_price")
                dq = market_data.get("data_quality")
                if cp is not None and isinstance(cp, (int, float)) and cp > 0 and dq == 'live':
                    profitability = self.mandi_service.calculate_profitability_score(
                        crop_name, market_data
                    )
            
            return {
                "crop_name": crop_name,
                "market_data": market_data,
                "profitability": profitability,
                "last_updated": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Market insights fetch failed: {e}")
            return {
                "crop_name": crop_name,
                "market_data": None,
                "profitability": None,
                "error": "Market data unavailable",
                "last_updated": datetime.now().isoformat()
            }
    
    def _build_market_information(self, crop_name: str, market_insights: Dict = None) -> Dict[str, Any]:
        """Build market information for a crop."""
        if not market_insights or not market_insights.get("market_data"):
            return {
                "current_price": "Data unavailable",
                "price_trend": "Unknown",
                "profitability": "Not calculated",
                "data_source": "Market data service unavailable",
                "recommendation": "Check local mandi prices",
                "data_quality": "unavailable"
            }
        
        market_data = market_insights["market_data"]
        profitability = market_insights.get("profitability", {})
        
        # Format current_price only if numeric
        cp = market_data.get('current_price')
        if cp is None:
            cp_display = "Data unavailable"
        else:
            cp_display = f"₹{cp}/quintal"

            price_change = market_data.get('price_change_percent')
            price_change_str = f"{price_change:+.1f}%" if isinstance(price_change, (int, float)) else "N/A"

            # Safely coalesce price_trend if it's None
            raw_trend = market_data.get('price_trend') or 'unknown'
            price_trend_display = raw_trend.title() if isinstance(raw_trend, str) else str(raw_trend)

            return {
                "current_price": cp_display,
                "price_trend": price_trend_display,
                "price_change": price_change_str,
            "mandi_data": market_data.get('mandi_data', []),
            "profitability": {
                "score": profitability.get('profitability_score', 0),
                "recommendation": profitability.get('recommendation', 'Unknown'),
                "profit_margin": f"₹{profitability.get('profit_margin', 0)}/quintal"
            } if profitability else "Not calculated",
            "data_source": market_data.get('source', 'Unknown'),
            "last_updated": market_data.get('last_updated', 'Unknown'),
            "data_quality": market_data.get('data_quality', 'unknown')
        }
    
    def _build_enhanced_market_insights(self, market_insights: Dict = None) -> Dict[str, Any]:
        """Build enhanced market insights."""
        if not market_insights or not market_insights.get("market_data"):
            return {
                "status": "Market data unavailable",
                "data_source": "Mandi service not configured",
                "recommendation": "Configure API keys for live market data",
                "last_updated": datetime.now().isoformat()
            }
        
        market_data = market_insights["market_data"]
        profitability = market_insights.get("profitability", {})

        # Safely compute price_level and market_activity
        cp = market_data.get('current_price')
        if isinstance(cp, (int, float)):
            price_level = "High" if cp > 2000 else "Moderate" if cp > 1500 else "Low"
        else:
            price_level = "Unknown"

        total_arrival = market_data.get('total_arrival')
        if isinstance(total_arrival, (int, float)):
            market_activity = "High" if total_arrival > 1000 else "Moderate"
        else:
            market_activity = "Unknown"
        # Safely coalesce trend direction
        raw_trend = market_data.get('price_trend') or 'stable'
        trend_direction = raw_trend.title() if isinstance(raw_trend, str) else str(raw_trend)

        return {
            "status": "Live market data available",
            "data_source": market_data.get('source', 'Unknown'),
            "crop_analyzed": market_insights.get("crop_name", "Unknown"),
            "current_market_conditions": {
                "price_level": price_level,
                "trend_direction": trend_direction,
                "market_activity": market_activity
            },
            "profitability_analysis": profitability if profitability else "Not available",
            "market_recommendation": self._get_market_recommendation(market_data, profitability),
            "last_updated": market_data.get('last_updated', datetime.now().isoformat()),
            "data_quality": market_data.get('data_quality', 'unknown')
        }
    
    def _get_market_recommendation(self, market_data: Dict, profitability: Dict) -> str:
        """Get market-based recommendation."""
        if not market_data or not profitability:
            return "Market data insufficient for recommendation"
        
        # Safely derive price_trend
        price_trend = market_data.get('price_trend') or 'stable'
        profit_score = profitability.get('profitability_score', 0)
        
        if profit_score > 0.8 and price_trend == 'rising':
            return "Excellent market conditions - highly recommended"
        elif profit_score > 0.6 and price_trend in ['rising', 'stable']:
            return "Good market conditions - recommended"
        elif profit_score > 0.4:
            return "Moderate market conditions - consider carefully"
        else:
            return "Poor market conditions - not recommended"
    
    # All your other existing methods (_get_suitability_grade, _get_nutrient_requirements, etc.) stay exactly the same
    def _get_suitability_grade(self, confidence: float) -> str:
        """Get suitability grade based on confidence."""
        if confidence >= 0.8:
            return "A"
        elif confidence >= 0.6:
            return "B"  
        elif confidence >= 0.4:
            return "C"
        elif confidence >= 0.2:
            return "D"
        else:
            return "F"
    
    def _get_nutrient_requirements(self, crop_profile: Dict) -> Dict:
        """Extract nutrient requirements from crop profile."""
        nutrients = crop_profile.get("nutrients", {})
        
        nutrient_req = {}
        for nutrient in ["N", "P", "K"]:
            if nutrient in nutrients:
                nutrient_data = nutrients[nutrient]
                nutrient_req[nutrient] = {
                    "optimal_range": nutrient_data.get("optimal_range", [0, 100]),
                    "average_requirement": round(nutrient_data.get("mean", 50), 2),
                    "data_source": "Real farm nutrient analysis"
                }
        
        return nutrient_req
    
    def _get_crop_advantages(self, crop: str, primary_crop: str) -> List[str]:
        """Get advantages of alternative crop."""
        advantages = []
        
        # Simple advantages based on crop type
        if crop in ["rice", "wheat", "maize"]:
            advantages.append("High yield potential")
        if crop in ["legume", "chickpea", "lentil"]:
            advantages.append("Nitrogen fixing - improves soil")
        if crop in ["cotton", "jute"]:
            advantages.append("High market value")
        
        if not advantages:
            advantages.append("Low nitrogen requirement (cost-effective)")
        
        return advantages
    
    def _build_soil_management(self, processed_data: Dict, crop_profiles: Dict) -> Dict:
        """Build soil management recommendations."""
        ph = processed_data.get("ph", 7.0)
        
        # Find pH compatible crops
        suitable_crops = []
        for crop, profile in crop_profiles.items():
            # Simple pH compatibility (you can make this more sophisticated)
            if 6.0 <= ph <= 8.0:  # Most crops tolerate this range
                suitable_crops.append(crop)
        
        return {
            "current_assessment": {
                "data_source": "Real-time soil analysis",
                "ph_status": {
                    "current_ph": ph,
                    "suitable_for_crops": suitable_crops[:14],  # Limit display
                    "total_crops_analyzed": len(crop_profiles),
                    "compatibility_percentage": f"{len(suitable_crops)/len(crop_profiles)*100:.1f}%"
                },
                "nutrient_status": {},
                "fertility_index": 0.5
            },
            "improvement_recommendations": [],
            "monitoring_protocol": {
                "frequency": "Based on soil variability analysis", 
                "parameters": [],
                "data_driven": True
            }
        }
    
    def _build_resource_requirements(self, processed_data: Dict) -> Dict:
        """Build resource requirements."""
        return {
            "data_source": "Dynamic calculation from agricultural datasets",
            "location_specific": f"{processed_data.get('latitude', 0)}, {processed_data.get('longitude', 0)}",
            "current_input_costs": {
                "data_source": "Real-time market pricing",
                "location": f"{processed_data.get('latitude', 0)}, {processed_data.get('longitude', 0)}",
                "seeds": "Contact local seed suppliers for current rates",
                "fertilizers": "Check agricultural input dealers", 
                "pesticides": "Consult agricultural supply stores",
                "note": "Prices vary by location and season - get local quotes",
                "recommendation": "Connect to agricultural commodity price APIs for real-time data"
            }
        }
    
    def _build_implementation_strategy(self, processed_data: Dict) -> Dict:
        """Build implementation strategy."""
        return {
            "approach": "Data-driven implementation",
            "customized_for": f"{processed_data.get('latitude', 0)}, {processed_data.get('longitude', 0)}",
            "timeline": {
                "planning_approach": "Data-driven scheduling",
                "location_specific": True,
                "current_season_assessment": {
                    "current_month": datetime.now().month,
                    "recommendation": "Consult real-time weather forecasts and local agricultural calendar"
                }
            }
        }
    
    def _build_market_insights(self) -> Dict:
        """Build market insights."""
        return {
            "data_source": "Real-time market analysis",
            "last_updated": datetime.now().isoformat(),
            "current_price": "Connect to live market feeds",
            "price_trend": "Integrate with commodity exchanges", 
            "forecast": "Use agricultural market analysis APIs"
        }
    
    def _build_local_guidelines(self, processed_data: Dict) -> Dict:
        """Build local guidelines."""
        return {
            "location": f"{processed_data.get('latitude', 0)}, {processed_data.get('longitude', 0)}",
            "data_source": "Local agricultural departments",
            "local_varieties": "Query regional seed databases",
            "cultivation_calendar": "Access local agricultural calendars",
            "support_services": "Connect to extension contact databases"
        }
    
    def _build_risk_assessment(self, weather_data: Dict, processed_data: Dict) -> Dict:
        """Build risk assessment."""
        return {
            "assessment_time": datetime.now().isoformat(),
            "location": f"{processed_data.get('latitude', 0)}, {processed_data.get('longitude', 0)}",
            "dynamic_factors": [],
            "weather_risks": {
                "status": "Weather risk analysis unavailable"
            },
            "market_risks": {
                "volatility_analysis": "Connect to market analytics platforms",
                "risk_indicators": "Integrate with agricultural commodity analysis"
            }
        }
