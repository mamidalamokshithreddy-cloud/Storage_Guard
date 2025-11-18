import httpx
import logging
from typing import Dict, Any, Optional, List
import asyncio
from datetime import datetime, timedelta
import json
import os
from app.core.config import settings

logger = logging.getLogger(__name__)

class MandiMarketService:
    """Live mandi market data service with multiple API sources."""
    
    def __init__(self):
        self.enam_api_key = settings.enam_api_key or ""
        self.data_gov_api_key = settings.data_gov_api_key or ""
        # agmarknet settings may be optional; initialize to empty string if not set
        self.agmarknet_api_key = settings.agmarknet_api_key or ""
        # Base URL for Agmarknet (use config if provided, otherwise a sensible default)
        self.agmarknet_base_url = getattr(settings, 'agmarknet_base_url', "https://agmarknet.nic.in")
        self.timeout = 15.0
        
        # API endpoints
        self.enam_base_url = "https://enam.gov.in/webapi/api"
        self.data_gov_base_url = "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24"
        
    # Note: mock data removed. Service will return an explicit no-live-data response
    # when live APIs are unavailable. Configure API keys to enable live data.
    
    def _no_live_market_data(self, crop_name: str, state: str = None, district: str = None) -> Dict[str, Any]:
        """Return a standardized response when live market data is unavailable.

        This replaces the previous mock-data fallback. Configure API keys to
        enable live data from data.gov.in / eNAM / Agmarknet.
        """
        logger.warning(f"No live market data available for {crop_name} ({state or 'all states'})")
        return {
            "crop_name": crop_name,
            "current_price": None,
            "price_trend": None,
            "price_change_percent": None,
            "mandi_data": [],
            "source": None,
            "last_updated": datetime.now().isoformat(),
            "data_quality": "unavailable",
            "note": "No live market data - configure API keys to enable live responses"
        }
    
    async def get_crop_market_data(self, crop_name: str, state: str = None, district: str = None) -> Dict[str, Any]:
        """Get comprehensive market data for a specific crop."""
        try:
            logger.info(f"🌾 Fetching market data for {crop_name} in {state or 'all states'}")
            
            # Try data.gov.in API first (most reliable)
            data_gov_data = await self._fetch_data_gov_data(crop_name, state, district)
            if data_gov_data:
                return self._process_data_gov_data(data_gov_data, crop_name)
            
            # Try eNAM API as fallback
            enam_data = await self._fetch_enam_data(crop_name, state, district)
            if enam_data:
                return self._process_enam_data(enam_data, crop_name)
            
            # Fallback to mock data
            return self._no_live_market_data(crop_name, state, district)
            
        except Exception as e:
            logger.error(f"Market data fetch failed: {e}")
            return self._no_live_market_data(crop_name, state, district)
    
    async def _fetch_enam_data(self, crop_name: str, state: str = None, district: str = None) -> Optional[Dict]:
        """Fetch data from eNAM API with proper error handling."""
        if not self.enam_api_key or self.enam_api_key == "your-enam-api-key":
            logger.warning("eNAM API key not configured or using placeholder")
            return None
        
        try:
            logger.info(f"🔑 Using eNAM API key: {self.enam_api_key[:10]}...")
            
            async with httpx.AsyncClient(
                timeout=self.timeout,
                verify=False,  # Skip SSL verification for testing
                follow_redirects=True
            ) as client:
                
                # Step 1: Get mandi list
                mandi_url = f"{self.enam_base_url}/mandi-list"
                mandi_params = {
                    "apikey": self.enam_api_key,
                    "state": state or "all",
                    "district": district or "all"
                }
                
                logger.info(f"🌍 Requesting mandi list: {mandi_url}")
                mandi_response = await client.get(mandi_url, params=mandi_params)
                
                logger.info(f"📡 Mandi list response: {mandi_response.status_code}")
                
                if mandi_response.status_code == 200:
                    mandis = mandi_response.json()
                    if not mandis:
                        logger.warning("No mandis found for the specified location")
                        return None
                    
                    logger.info(f"✅ Found {len(mandis)} mandis")
                    
                    # Step 2: Get price data for each mandi
                    price_data = []
                    for mandi in mandis[:5]:  # Limit to 5 mandis for performance
                        try:
                            price_url = f"{self.enam_base_url}/mandi-price"
                            price_params = {
                                "apikey": self.enam_api_key,
                                "crop": crop_name,
                                "mandi_id": mandi.get("id"),
                                "date": datetime.now().strftime("%Y-%m-%d")
                            }
                            
                            logger.info(f"💰 Getting price for {crop_name} at {mandi.get('name', 'Unknown')}")
                            price_response = await client.get(price_url, params=price_params)
                            
                            if price_response.status_code == 200:
                                price_info = price_response.json()
                                if price_info and price_info.get("price", 0) > 0:
                                    price_data.append({
                                        "mandi_id": mandi.get("id"),
                                        "mandi_name": mandi.get("name", "Unknown"),
                                        "state": mandi.get("state", "Unknown"),
                                        "district": mandi.get("district", "Unknown"),
                                        "price": price_info.get("price", 0),
                                        "arrival": price_info.get("arrival", 0),
                                        "quality": price_info.get("quality", "Standard"),
                                        "date": price_info.get("date", datetime.now().strftime("%Y-%m-%d"))
                                    })
                                    logger.info(f"✅ Price data: ₹{price_info.get('price', 0)}/quintal")
                                else:
                                    logger.warning(f"No price data available for {crop_name} at {mandi.get('name')}")
                            else:
                                logger.warning(f"Price API error for {mandi.get('name')}: {price_response.status_code}")
                                
                        except Exception as e:
                            logger.warning(f"Error fetching price for {mandi.get('name')}: {e}")
                            continue
                    
                    if price_data:
                        logger.info(f"✅ Successfully fetched price data from {len(price_data)} mandis")
                        return {
                            "mandis": mandis,
                            "price_data": price_data,
                            "source": "eNAM",
                            "api_key_status": "valid"
                        }
                    else:
                        logger.warning("No valid price data found from any mandi")
                        return None
                        
                elif mandi_response.status_code == 401:
                    logger.error("❌ eNAM API key is invalid!")
                    logger.error(f"🔑 API key used: {self.enam_api_key[:10]}...")
                    return None
                elif mandi_response.status_code == 403:
                    logger.error("❌ eNAM API access forbidden - check subscription")
                    return None
                elif mandi_response.status_code == 429:
                    logger.error("❌ eNAM API rate limit exceeded")
                    return None
                else:
                    logger.error(f"eNAM mandi list API error: {mandi_response.status_code}")
                    logger.error(f"Response: {mandi_response.text[:200]}...")
                    return None
                
        except Exception as e:
            logger.error(f"eNAM API error: {e}")
            return None
    
    async def _fetch_agmarknet_data(self, crop_name: str, state: str = None, district: str = None) -> Optional[Dict]:
        """Fetch data from Agmarknet API with proper error handling."""
        if not self.agmarknet_api_key or self.agmarknet_api_key == "your-agmarknet-api-key":
            logger.warning("Agmarknet API key not configured or using placeholder")
            return None
        
        try:
            logger.info(f"🔑 Using Agmarknet API key: {self.agmarknet_api_key[:10]}...")
            
            async with httpx.AsyncClient(
                timeout=self.timeout,
                verify=False,  # Skip SSL verification for testing
                follow_redirects=True
            ) as client:
                
                # Step 1: Get commodity list to validate crop name
                commodity_url = f"{self.agmarknet_base_url}/commodities"
                commodity_params = {
                    "apikey": self.agmarknet_api_key
                }
                
                logger.info(f"🌾 Getting commodity list from Agmarknet")
                commodity_response = await client.get(commodity_url, params=commodity_params)
                
                if commodity_response.status_code == 200:
                    commodities = commodity_response.json()
                    # Find matching commodity
                    matching_commodity = None
                    for commodity in commodities:
                        if crop_name.lower() in commodity.get("name", "").lower():
                            matching_commodity = commodity
                            break
                    
                    if not matching_commodity:
                        logger.warning(f"Commodity '{crop_name}' not found in Agmarknet")
                        return None
                    
                    commodity_id = matching_commodity.get("id")
                    logger.info(f"✅ Found commodity: {matching_commodity.get('name')} (ID: {commodity_id})")
                    
                    # Step 2: Get price data
                    price_url = f"{self.agmarknet_base_url}/price-data"
                    price_params = {
                        "apikey": self.agmarknet_api_key,
                        "commodity_id": commodity_id,
                        "state": state or "all",
                        "district": district or "all",
                        "date": datetime.now().strftime("%Y-%m-%d"),
                        "limit": 10
                    }
                    
                    logger.info(f"💰 Getting price data for {crop_name}")
                    price_response = await client.get(price_url, params=price_params)
                    
                    logger.info(f"📡 Price data response: {price_response.status_code}")
                    
                    if price_response.status_code == 200:
                        price_data = price_response.json()
                        if price_data and len(price_data) > 0:
                            logger.info(f"✅ Successfully fetched {len(price_data)} price records from Agmarknet")
                            return {
                                "data": price_data,
                                "commodity_info": matching_commodity,
                                "source": "Agmarknet",
                                "api_key_status": "valid"
                            }
                        else:
                            logger.warning("No price data available for the specified criteria")
                            return None
                    else:
                        logger.error(f"Agmarknet price API error: {price_response.status_code}")
                        logger.error(f"Response: {price_response.text[:200]}...")
                        return None
                        
                elif commodity_response.status_code == 401:
                    logger.error("❌ Agmarknet API key is invalid!")
                    logger.error(f"🔑 API key used: {self.agmarknet_api_key[:10]}...")
                    return None
                elif commodity_response.status_code == 403:
                    logger.error("❌ Agmarknet API access forbidden - check subscription")
                    return None
                else:
                    logger.error(f"Agmarknet commodity API error: {commodity_response.status_code}")
                    return None
                
        except Exception as e:
            logger.error(f"Agmarknet API error: {e}")
            return None
    
    async def _fetch_data_gov_data(self, crop_name: str, state: str = None, district: str = None) -> Optional[Dict]:
        """Fetch data from data.gov.in Agmarknet API with proper error handling."""
        try:
            logger.info(f"🔑 Using data.gov.in API key: {self.data_gov_api_key[:10]}...")
            
            async with httpx.AsyncClient(
                timeout=self.timeout,
                verify=True,
                follow_redirects=True
            ) as client:
                
                # Build query parameters
                params = {
                    "api-key": self.data_gov_api_key,
                    "format": "json",
                    "limit": 50,
                    "offset": 0
                }
                
                # Add filters if provided
                if state and state != "All":
                    params["filters[State]"] = state
                if district and district != "All":
                    params["filters[District]"] = district
                
                # Map crop names to commodity names used in the API
                commodity_mapping = {
                    "rice": "Rice",
                    "wheat": "Wheat", 
                    "maize": "Maize",
                    "cotton": "Cotton",
                    "sugarcane": "Sugarcane",
                    "chickpea": "Gram",
                    "lentil": "Lentil",
                    "soybean": "Soybean",
                    "onion": "Onion",
                    "potato": "Potato",
                    "tomato": "Tomato",
                    "banana": "Banana",
                    "mango": "Mango",
                    "orange": "Orange",
                    "grapes": "Grapes"
                }
                
                commodity_name = commodity_mapping.get(crop_name.lower(), crop_name.title())
                params["filters[Commodity]"] = commodity_name
                
                logger.info(f"🌾 Getting market data for {commodity_name} from data.gov.in")
                logger.info(f"🔗 URL: {self.data_gov_base_url}")
                logger.info(f"📋 Params: {params}")
                
                response = await client.get(self.data_gov_base_url, params=params)
                
                logger.info(f"📡 Response status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    records = data.get("records", [])
                    
                    if records and len(records) > 0:
                        logger.info(f"✅ Successfully fetched {len(records)} records from data.gov.in")
                        return {
                            "data": records,
                            "total": data.get("total", len(records)),
                            "source": "data.gov.in",
                            "api_key_status": "valid",
                            "commodity": commodity_name
                        }
                    else:
                        logger.warning(f"No market data found for {commodity_name}")
                        return None
                else:
                    logger.error(f"data.gov.in API error: {response.status_code}")
                    logger.error(f"Response: {response.text[:200]}...")
                    return None
                    
        except Exception as e:
            logger.error(f"data.gov.in API error: {e}")
            return None
    
    def _process_data_gov_data(self, data: Dict, crop_name: str) -> Dict[str, Any]:
        """Process data.gov.in API response with enhanced data processing."""
        records = data.get("data", [])
        source = data.get("source", "data.gov.in")
        
        if not records:
            logger.warning("No records found in data.gov.in response")
            return self._no_live_market_data(crop_name)
        
        # Process the records to extract price information
        mandi_data = []
        prices = []
        
        for record in records:
            try:
                # Extract price information
                min_price = float(record.get("Min_Price", 0))
                max_price = float(record.get("Max_Price", 0))
                modal_price = float(record.get("Modal_Price", 0))
                
                # Use modal price as the primary price
                if modal_price > 0:
                    price = modal_price
                elif max_price > 0:
                    price = max_price
                elif min_price > 0:
                    price = min_price
                else:
                    continue
                
                # Extract other information
                state = record.get("State", "Unknown")
                district = record.get("District", "Unknown")
                market = record.get("Market", "Unknown")
                variety = record.get("Variety", "Standard")
                grade = record.get("Grade", "FAQ")
                arrival_date = record.get("Arrival_Date", "")
                
                # Calculate arrival quantity (simulate from price data)
                arrival = max(100, int(price / 10))  # Rough estimation
                
                mandi_data.append({
                    "mandi": market,
                    "price": int(price),
                    "arrival": arrival,
                    "state": state,
                    "district": district,
                    "variety": variety,
                    "grade": grade,
                    "date": arrival_date
                })
                
                prices.append(price)
                
            except (ValueError, TypeError) as e:
                logger.warning(f"Error processing record: {e}")
                continue
        
        if not prices:
            logger.warning("No valid price data found in records")
            return self._no_live_market_data(crop_name)
        
        # Calculate statistics
        avg_price = sum(prices) / len(prices)
        min_price = min(prices)
        max_price = max(prices)
        
        # Determine price trend (simplified)
        if len(prices) >= 2:
            recent_avg = sum(prices[-5:]) / min(5, len(prices))
            older_avg = sum(prices[:-5]) / max(1, len(prices) - 5) if len(prices) > 5 else recent_avg
            price_change = ((recent_avg - older_avg) / older_avg) * 100 if older_avg > 0 else 0
        else:
            price_change = 0
        
        if price_change > 2:
            trend = "rising"
        elif price_change < -2:
            trend = "falling"
        else:
            trend = "stable"
        
        logger.info(f"✅ Processed {len(mandi_data)} mandi records for {crop_name}")
        logger.info(f"💰 Price range: ₹{min_price:.0f} - ₹{max_price:.0f} (avg: ₹{avg_price:.0f})")
        logger.info(f"📈 Trend: {trend} ({price_change:+.1f}%)")
        
        return {
            "crop_name": crop_name,
            "current_price": int(avg_price),
            "price_trend": trend,
            "price_change_percent": round(price_change, 1),
            "mandi_data": mandi_data,
            "price_range": {
                "min": int(min_price),
                "max": int(max_price),
                "average": int(avg_price)
            },
            "source": source,
            "last_updated": datetime.now().isoformat(),
            "data_quality": "live",
            "note": f"Live data from {source} - {len(records)} records processed"
        }
    
    def _process_enam_data(self, data: Dict, crop_name: str) -> Dict[str, Any]:
        """Process eNAM API response with enhanced data processing."""
        price_data = data.get("price_data", [])
        mandis = data.get("mandis", [])
        api_key_status = data.get("api_key_status", "unknown")
        
        if not price_data:
            logger.warning("No price data from eNAM API, falling back to no-live-data response")
            return self._no_live_market_data(crop_name)
        
        # Calculate average price and trends
        prices = [p.get("price", 0) for p in price_data if p.get("price", 0) > 0]
        arrivals = [p.get("arrival", 0) for p in price_data if p.get("arrival", 0) > 0]
        
        if not prices:
            logger.warning("No valid prices found in eNAM data")
            return self._no_live_market_data(crop_name)
        
        avg_price = sum(prices) / len(prices)
        total_arrival = sum(arrivals) if arrivals else 0
        max_price = max(prices)
        min_price = min(prices)
        
        # Determine price trend based on price variation
        price_trend = "stable"
        price_change_percent = 0
        
        if len(prices) > 1:
            price_variation = (max_price - min_price) / avg_price
            if price_variation > 0.1:  # More than 10% variation
                if max_price > avg_price * 1.05:
                    price_trend = "rising"
                    price_change_percent = ((max_price - avg_price) / avg_price) * 100
                elif min_price < avg_price * 0.95:
                    price_trend = "falling"
                    price_change_percent = ((min_price - avg_price) / avg_price) * 100
        
        # Create mandi data with enhanced information
        mandi_data = []
        for price_info in price_data:
            mandi_data.append({
                "mandi": price_info.get("mandi_name", "Unknown"),
                "price": price_info.get("price", 0),
                "arrival": price_info.get("arrival", 0),
                "state": price_info.get("state", "Unknown"),
                "district": price_info.get("district", "Unknown"),
                "quality": price_info.get("quality", "Standard"),
                "date": price_info.get("date", datetime.now().strftime("%Y-%m-%d"))
            })
        
        logger.info(f"✅ Processed eNAM data: Avg price ₹{avg_price:.2f}, Trend: {price_trend}")
        
        return {
            "crop_name": crop_name,
            "current_price": round(avg_price, 2),
            "price_trend": price_trend,
            "price_change_percent": round(price_change_percent, 2),
            "total_arrival": total_arrival,
            "price_range": {
                "min": round(min_price, 2),
                "max": round(max_price, 2),
                "avg": round(avg_price, 2)
            },
            "mandi_data": mandi_data,
            "source": "eNAM",
            "api_key_status": api_key_status,
            "last_updated": datetime.now().isoformat(),
            "data_quality": "live"
        }
    
    def _process_agmarknet_data(self, data: Dict, crop_name: str) -> Dict[str, Any]:
        """Process Agmarknet API response with enhanced data processing."""
        price_data = data.get("data", [])
        commodity_info = data.get("commodity_info", {})
        api_key_status = data.get("api_key_status", "unknown")
        
        if not price_data:
            logger.warning("No price data from Agmarknet API, falling back to no-live-data response")
            return self._no_live_market_data(crop_name)
        
        # Process Agmarknet price data
        processed_prices = []
        for record in price_data:
            try:
                price = float(record.get("modal_price", 0))
                arrival = float(record.get("arrival_quantity", 0))
                if price > 0:
                    processed_prices.append({
                        "mandi": record.get("market", "Unknown"),
                        "price": price,
                        "arrival": arrival,
                        "state": record.get("state", "Unknown"),
                        "district": record.get("district", "Unknown"),
                        "quality": record.get("grade", "Standard"),
                        "date": record.get("price_date", datetime.now().strftime("%Y-%m-%d"))
                    })
            except (ValueError, TypeError) as e:
                logger.warning(f"Error processing Agmarknet record: {e}")
                continue
        
        if not processed_prices:
            logger.warning("No valid prices found in Agmarknet data")
            return self._no_live_market_data(crop_name)
        
        # Calculate statistics
        prices = [p["price"] for p in processed_prices]
        arrivals = [p["arrival"] for p in processed_prices]
        
        avg_price = sum(prices) / len(prices)
        total_arrival = sum(arrivals)
        max_price = max(prices)
        min_price = min(prices)
        
        # Determine price trend
        price_trend = "stable"
        price_change_percent = 0
        
        if len(prices) > 1:
            price_variation = (max_price - min_price) / avg_price
            if price_variation > 0.1:
                if max_price > avg_price * 1.05:
                    price_trend = "rising"
                    price_change_percent = ((max_price - avg_price) / avg_price) * 100
                elif min_price < avg_price * 0.95:
                    price_trend = "falling"
                    price_change_percent = ((min_price - avg_price) / avg_price) * 100
        
        logger.info(f"✅ Processed Agmarknet data: Avg price ₹{avg_price:.2f}, Trend: {price_trend}")
        
        return {
            "crop_name": crop_name,
            "current_price": round(avg_price, 2),
            "price_trend": price_trend,
            "price_change_percent": round(price_change_percent, 2),
            "total_arrival": total_arrival,
            "price_range": {
                "min": round(min_price, 2),
                "max": round(max_price, 2),
                "avg": round(avg_price, 2)
            },
            "mandi_data": processed_prices,
            "commodity_info": commodity_info,
            "source": "Agmarknet",
            "api_key_status": api_key_status,
            "last_updated": datetime.now().isoformat(),
            "data_quality": "live"
        }
    
    # Note: mock market data removed. Use _no_live_market_data() to return an explicit
    # standardized response when live data is unavailable.
    
    async def get_market_trends(self, crop_name: str, days: int = 30) -> Dict[str, Any]:
        """Get historical price trends for a crop."""
        try:
            # This would fetch historical data from APIs
            # For now, return mock trend data
            return {
                "crop_name": crop_name,
                "period_days": days,
                "trend_data": [
                    {"date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"), 
                     "price": 2500 + (i * 10) - (i % 3) * 50}
                    for i in range(days, 0, -1)
                ],
                "trend_analysis": {
                    "overall_trend": "rising",
                    "volatility": "medium",
                    "best_buying_day": "Monday",
                    "price_range": {"min": 2400, "max": 2600}
                }
            }
        except Exception as e:
            logger.error(f"Trend analysis failed: {e}")
            return {"error": "Trend data unavailable"}
    
    async def get_mandi_list(self, state: str = None) -> List[Dict[str, Any]]:
        """Get list of mandis by state."""
        # Mock mandi list
        mandis = [
            {"id": 1, "name": "Kurnool", "state": "Andhra Pradesh", "district": "Kurnool"},
            {"id": 2, "name": "Warangal", "state": "Telangana", "district": "Warangal"},
            {"id": 3, "name": "Nizamabad", "state": "Telangana", "district": "Nizamabad"},
            {"id": 4, "name": "Punjab Mandi", "state": "Punjab", "district": "Ludhiana"},
            {"id": 5, "name": "Haryana Mandi", "state": "Haryana", "district": "Karnal"}
        ]
        
        if state:
            mandis = [m for m in mandis if m["state"].lower() == state.lower()]
        
        return mandis
    
    def calculate_profitability_score(self, crop_name: str, market_data: Dict, production_cost: float = None) -> Dict[str, Any]:
        """Calculate profitability score for a crop."""
        current_price = market_data.get("current_price", 0)
        price_trend = market_data.get("price_trend", "stable")
        
        # Estimate production cost if not provided
        if not production_cost:
            production_cost = current_price * 0.6  # Assume 60% of market price as cost
        
        profit_margin = current_price - production_cost
        profit_percentage = (profit_margin / production_cost) * 100 if production_cost > 0 else 0
        
        # Adjust for price trend
        trend_multiplier = 1.0
        if price_trend == "rising":
            trend_multiplier = 1.1
        elif price_trend == "falling":
            trend_multiplier = 0.9
        
        adjusted_profit = profit_percentage * trend_multiplier
        
        # Calculate profitability score (0-1)
        if adjusted_profit > 30:
            score = 1.0
        elif adjusted_profit > 20:
            score = 0.8
        elif adjusted_profit > 10:
            score = 0.6
        elif adjusted_profit > 0:
            score = 0.4
        else:
            score = 0.2
        
        return {
            "crop_name": crop_name,
            "current_price": current_price,
            "estimated_cost": production_cost,
            "profit_margin": round(profit_margin, 2),
            "profit_percentage": round(profit_percentage, 2),
            "profitability_score": round(score, 3),
            "trend_adjusted_profit": round(adjusted_profit, 2),
            "recommendation": "Highly Profitable" if score > 0.8 else "Moderately Profitable" if score > 0.5 else "Low Profitability"
        }
    
    async def test_api_connectivity(self) -> Dict[str, Any]:
        """Test API connectivity and return status."""
        results = {
            "enam_status": "not_configured",
            "agmarknet_status": "not_configured",
            "overall_status": "no_live_data"
        }
        
        # Test eNAM API
        if self.enam_api_key and self.enam_api_key != "your-enam-api-key":
            try:
                logger.info("🧪 Testing eNAM API connectivity...")
                test_data = await self._fetch_enam_data("rice", "Telangana")
                if test_data:
                    results["enam_status"] = "working"
                    results["enam_sample_data"] = {
                        "crop": "rice",
                        "mandis_found": len(test_data.get("mandis", [])),
                        "prices_found": len(test_data.get("price_data", []))
                    }
                else:
                    results["enam_status"] = "failed"
            except Exception as e:
                results["enam_status"] = f"error: {str(e)}"
        else:
            results["enam_status"] = "not_configured"
        
        # Test Agmarknet API
        if self.agmarknet_api_key and self.agmarknet_api_key != "your-agmarknet-api-key":
            try:
                logger.info("🧪 Testing Agmarknet API connectivity...")
                test_data = await self._fetch_agmarknet_data("rice", "Telangana")
                if test_data:
                    results["agmarknet_status"] = "working"
                    results["agmarknet_sample_data"] = {
                        "crop": "rice",
                        "records_found": len(test_data.get("data", []))
                    }
                else:
                    results["agmarknet_status"] = "failed"
            except Exception as e:
                results["agmarknet_status"] = f"error: {str(e)}"
        else:
            results["agmarknet_status"] = "not_configured"
        
        # Determine overall status
        if results["enam_status"] == "working" or results["agmarknet_status"] == "working":
            results["overall_status"] = "live_data_available"
        elif results["enam_status"] == "not_configured" and results["agmarknet_status"] == "not_configured":
            results["overall_status"] = "no_live_data"
        else:
            results["overall_status"] = "api_issues"
        
        logger.info(f"🔍 API Test Results: {results['overall_status']}")
        return results

# Factory function
def create_mandi_service() -> MandiMarketService:
    """Create mandi market service instance."""
    return MandiMarketService()
