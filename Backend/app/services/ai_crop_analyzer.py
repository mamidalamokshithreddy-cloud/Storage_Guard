"""
AI-Powered Crop Analysis Service
Uses LLMs (Gemini, OpenAI, Anthropic) for intelligent crop detection
Combines computer vision with AI reasoning
"""

import base64
import os
import json
import re
from typing import Tuple, Optional
import requests
from pathlib import Path

class AICropAnalyzer:
    """
    AI-powered crop analyzer using vision LLMs
    Provides intelligent analysis beyond simple computer vision
    """
    
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        
        # Priority order for LLM providers
        self.providers = []
        if self.gemini_key:
            self.providers.append("gemini")
        if self.openai_key:
            self.providers.append("openai")
        if self.anthropic_key:
            self.providers.append("anthropic")
        
        print(f"🤖 AI Crop Analyzer initialized")
        print(f"   Available providers: {', '.join(self.providers) if self.providers else 'None (using fallback)'}")
    
    def _parse_shelf_life(self, shelf_life_str) -> int:
        """
        Parse shelf life from various string formats to integer days
        Examples:
            "7-14 days" -> 10 (average)
            "10" -> 10
            "5 days" -> 5
            "2 weeks" -> 14
        """
        try:
            # If already an int, return it
            if isinstance(shelf_life_str, int):
                return shelf_life_str
            
            # Convert to string and clean
            shelf_life_str = str(shelf_life_str).lower().strip()
            
            # Extract numbers using regex
            numbers = re.findall(r'\d+', shelf_life_str)
            
            if not numbers:
                return 10  # Default fallback
            
            # If range (e.g., "7-14"), return average
            if len(numbers) >= 2:
                return (int(numbers[0]) + int(numbers[1])) // 2
            
            # Single number
            days = int(numbers[0])
            
            # Check for weeks
            if 'week' in shelf_life_str:
                days *= 7
            elif 'month' in shelf_life_str:
                days *= 30
            
            return max(1, min(days, 365))  # Clamp between 1-365 days
            
        except Exception as e:
            print(f"⚠️ Error parsing shelf_life '{shelf_life_str}': {e}")
            return 10  # Default fallback
    
    def analyze_crop_with_ai(self, image_bytes: bytes, user_hint: Optional[str] = None) -> dict:
        """
        Analyze crop using AI vision models
        Returns: {
            'crop_name': str,
            'confidence': float,
            'reasoning': str,
            'freshness': str,
            'quality_grade': str,
            'defects': list,
            'recommendations': str
        }
        """
        
        # Try each provider in order
        for provider in self.providers:
            try:
                if provider == "gemini":
                    return self._analyze_with_gemini(image_bytes, user_hint)
                elif provider == "openai":
                    return self._analyze_with_openai(image_bytes, user_hint)
                elif provider == "anthropic":
                    return self._analyze_with_anthropic(image_bytes, user_hint)
            except Exception as e:
                print(f"⚠️ {provider} failed: {e}")
                continue
        
        # Fallback to rule-based if all AI fails
        return self._fallback_analysis(user_hint)
    
    def _analyze_with_gemini(self, image_bytes: bytes, user_hint: Optional[str]) -> dict:
        """Analyze using Google Gemini Vision"""
        try:
            import google.generativeai as genai
            
            genai.configure(api_key=self.gemini_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # Convert image to base64
            import PIL.Image
            import io
            img = PIL.Image.open(io.BytesIO(image_bytes))
            
            # Create comprehensive analysis prompt
            prompt = f"""You are an expert agricultural AI analyzing crop images for farmers in India.

Analyze this image and provide detailed assessment:

1. **Crop Identification**: What crop is this?
2. **Quality Grade**: A (excellent), B (good), C (poor)
3. **Freshness**: Excellent/Good/Fair/Poor
4. **Defect Analysis**: List ALL visible defects with details
   - Count items: "X out of Y items affected"
   - Types: spots, rot, mold, discoloration, bruising, damage
   - Severity for each defect
5. **Shelf Life**: Days remaining
6. **Storage Recommendation**: Cold/Dry/Immediate sale
7. **Farmer Recommendation**: Clear actionable advice

{f"HINT: Farmer says this is {user_hint}. Validate if correct." if user_hint else ""}

Respond in JSON format with these EXACT keys:
{{
  "crop_name": "Tomato/Wheat/etc",
  "confidence": 0.95,
  "reasoning": "Visual details",
  "quality_grade": "A/B/C",
  "freshness": "Excellent/Good/Fair/Poor",
  "freshness_reasoning": "Explain why",
  "defects": ["Severe rot and mold", "Discoloration on 80%", "Soft spots", "Liquid leakage"],
  "detailed_analysis": "DETAILED explanation of the entire batch condition: Approximately X out of Y items are in poor condition. Majority shows severe spoilage with mold growth. Only Z items might be salvageable. Recommend immediate action to separate good from bad. Estimated loss: high percentage of batch.",
  "shelf_life_days": number,
  "storage_recommendation": "Cold/Dry/Immediate sale",
  "farmer_advice": "Clear step-by-step actions: 1) Separate immediately 2) Sell good items today 3) Discard spoiled items"
}}

IMPORTANT: 
- Make "defects" array VERY SPECIFIC and DETAILED
- Include percentages and counts in "detailed_analysis"
- Make "farmer_advice" ACTIONABLE with clear steps
"""
            
            response = model.generate_content([prompt, img])
            
            # Parse JSON from response
            text = response.text.strip()
            # Remove markdown code blocks if present
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(text)
            
            print(f"✅ Gemini Analysis: {result['crop_name']} ({result['confidence']:.2f})")
            
            return {
                'crop_name': result.get('crop_name', 'Unknown'),
                'confidence': float(result.get('confidence', 0.8)),
                'reasoning': result.get('reasoning', ''),
                'freshness': result.get('freshness', 'Good'),
                'freshness_reasoning': result.get('freshness_reasoning', ''),
                'quality_grade': result.get('quality_grade', 'B'),
                'defects': result.get('defects', []),
                'shelf_life_days': self._parse_shelf_life(result.get('shelf_life_days', 10)),
                'storage_recommendation': result.get('storage_recommendation', 'Dry storage'),
                'detailed_analysis': result.get('detailed_analysis', ''),
                'farmer_advice': result.get('farmer_advice', ''),
                'provider': 'gemini'
            }
            
        except Exception as e:
            print(f"❌ Gemini error: {e}")
            raise
    
    def _analyze_with_openai(self, image_bytes: bytes, user_hint: Optional[str]) -> dict:
        """Analyze using OpenAI GPT-4 Vision"""
        try:
            # Encode image to base64
            image_b64 = base64.b64encode(image_bytes).decode('utf-8')
            
            prompt = f"""You are an expert agricultural AI. Analyze this crop image and provide detailed assessment.

Required analysis:
1. Crop identification (specific name)
2. Quality grade (A/B/C)
3. Freshness level (Excellent/Good/Fair/Poor)
4. Visible defects
5. Estimated shelf life in days
6. Storage recommendation

{f"Farmer's hint: {user_hint}" if user_hint else ""}

Respond in JSON format with these exact keys:
crop_name, confidence, reasoning, quality_grade, freshness, freshness_reasoning, defects (array), shelf_life_days, storage_recommendation, detailed_analysis
"""
            
            headers = {
                "Authorization": f"Bearer {self.openai_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_b64}"
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 1000
            }
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            response.raise_for_status()
            
            content = response.json()['choices'][0]['message']['content']
            
            # Parse JSON
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            result = json.loads(content)
            
            print(f"✅ OpenAI Analysis: {result['crop_name']} ({result.get('confidence', 0.85):.2f})")
            
            return {
                'crop_name': result.get('crop_name', 'Unknown'),
                'confidence': float(result.get('confidence', 0.85)),
                'reasoning': result.get('reasoning', ''),
                'freshness': result.get('freshness', 'Good'),
                'freshness_reasoning': result.get('freshness_reasoning', ''),
                'quality_grade': result.get('quality_grade', 'B'),
                'defects': result.get('defects', []),
                'shelf_life_days': self._parse_shelf_life(result.get('shelf_life_days', 10)),
                'storage_recommendation': result.get('storage_recommendation', 'Dry storage'),
                'detailed_analysis': result.get('detailed_analysis', ''),
                'provider': 'openai'
            }
            
        except Exception as e:
            print(f"❌ OpenAI error: {e}")
            raise
    
    def _analyze_with_anthropic(self, image_bytes: bytes, user_hint: Optional[str]) -> dict:
        """Analyze using Anthropic Claude Vision"""
        try:
            # Encode image to base64
            image_b64 = base64.b64encode(image_bytes).decode('utf-8')
            
            prompt = f"""You are an agricultural expert AI. Analyze this crop image comprehensively.

Provide:
1. Crop name (specific)
2. Quality grade (A/B/C)
3. Freshness assessment
4. Defects list
5. Shelf life estimate
6. Storage advice

{f"Farmer says: {user_hint}" if user_hint else ""}

Return JSON with: crop_name, confidence, reasoning, quality_grade, freshness, freshness_reasoning, defects, shelf_life_days, storage_recommendation, detailed_analysis
"""
            
            headers = {
                "x-api-key": self.anthropic_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            
            payload = {
                "model": "claude-3-haiku-20240307",
                "max_tokens": 1024,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": image_b64
                                }
                            },
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ]
            }
            
            response = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            response.raise_for_status()
            
            content = response.json()['content'][0]['text']
            
            # Parse JSON
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            result = json.loads(content)
            
            print(f"✅ Claude Analysis: {result['crop_name']} ({result.get('confidence', 0.85):.2f})")
            
            return {
                'crop_name': result.get('crop_name', 'Unknown'),
                'confidence': float(result.get('confidence', 0.85)),
                'reasoning': result.get('reasoning', ''),
                'freshness': result.get('freshness', 'Good'),
                'freshness_reasoning': result.get('freshness_reasoning', ''),
                'quality_grade': result.get('quality_grade', 'B'),
                'defects': result.get('defects', []),
                'shelf_life_days': self._parse_shelf_life(result.get('shelf_life_days', 10)),
                'storage_recommendation': result.get('storage_recommendation', 'Dry storage'),
                'detailed_analysis': result.get('detailed_analysis', ''),
                'provider': 'anthropic'
            }
            
        except Exception as e:
            print(f"❌ Anthropic error: {e}")
            raise
    
    def _fallback_analysis(self, user_hint: Optional[str]) -> dict:
        """Fallback if all AI providers fail"""
        crop_name = user_hint.title() if user_hint else "Unknown Crop"
        
        return {
            'crop_name': crop_name,
            'confidence': 0.7 if user_hint else 0.3,
            'reasoning': 'Using user-provided hint' if user_hint else 'AI analysis unavailable',
            'freshness': 'Good',
            'freshness_reasoning': 'Unable to assess without AI',
            'quality_grade': 'B',
            'defects': [],
            'shelf_life_days': 10,
            'storage_recommendation': 'Dry storage',
            'detailed_analysis': 'AI providers unavailable. Using fallback analysis.',
            'provider': 'fallback'
        }


# Singleton instance
_ai_analyzer = None

def get_ai_analyzer() -> AICropAnalyzer:
    """Get or create singleton AI analyzer"""
    global _ai_analyzer
    if _ai_analyzer is None:
        _ai_analyzer = AICropAnalyzer()
    return _ai_analyzer


if __name__ == "__main__":
    analyzer = get_ai_analyzer()
    print("\n" + "="*60)
    print("AI CROP ANALYZER - STATUS")
    print("="*60)
    print(f"Providers available: {len(analyzer.providers)}")
    for provider in analyzer.providers:
        print(f"  ✅ {provider.title()}")
