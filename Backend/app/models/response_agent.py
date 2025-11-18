"""
Intelligent Agent for Response Selection and Quality Assessment
Compares LLM responses and selects the best one using multiple criteria
"""

import logging
import re
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import json
from app.models.llm_manager import LLMResponse

logger = logging.getLogger(__name__)

@dataclass
class ResponseAnalysis:
    """Analysis of a single LLM response"""
    provider: str
    quality_score: float
    length_score: float
    keyword_score: float
    clarity_score: float
    relevance_score: float
    confidence_penalty: float
    error_penalty: float
    final_score: float
    reasoning: str

@dataclass
class AgentDecision:
    """Final agent decision with reasoning"""
    selected_provider: str
    selected_response: str
    confidence: float
    reasoning: str
    all_analyses: Dict[str, ResponseAnalysis]
    metadata: Dict[str, Any]

class ResponseAgent:
    """Intelligent agent for selecting best LLM response"""
    
    def __init__(self):
        # Agricultural domain keywords
        self.domain_keywords = {
            'disease': ['disease', 'infection', 'pathogen', 'fungal', 'bacterial', 'viral', 'blight', 'rust', 'mildew'],
            'pest': ['pest', 'insect', 'aphid', 'thrips', 'caterpillar', 'beetle', 'mite', 'larvae'],
            'treatment': ['treatment', 'control', 'spray', 'fungicide', 'insecticide', 'IPM', 'management'],
            'symptoms': ['symptoms', 'leaf', 'spot', 'yellowing', 'wilting', 'damage', 'lesion'],
            'recommendation': ['recommend', 'suggest', 'apply', 'use', 'monitor', 'prevent', 'avoid']
        }
        
        # Weight factors for scoring
        self.weights = {
            'length': 0.15,      # Response completeness
            'keywords': 0.25,    # Domain relevance
            'clarity': 0.20,     # Text clarity and structure
            'relevance': 0.25,   # Direct relevance to query
            'confidence': 0.10,  # Provider confidence
            'error_penalty': 0.05 # Error penalty
        }
    
    def analyze_response(self, response: LLMResponse, query_context: str) -> ResponseAnalysis:
        """Analyze a single LLM response"""
        try:
            # Normalize text content and confidence
            text = (response.response or "")
            conf = response.confidence if isinstance(response.confidence, (int, float)) and response.confidence is not None else 0.5

            # Handle error responses or empty content
            if response.error or not text.strip():
                return ResponseAnalysis(
                    provider=response.provider,
                    quality_score=0.0,
                    length_score=0.0,
                    keyword_score=0.0,
                    clarity_score=0.0,
                    relevance_score=0.0,
                    confidence_penalty=0.0,
                    error_penalty=1.0,
                    final_score=0.0,
                    reasoning=f"Response failed: {response.error or 'Empty response'}"
                )
            
            # Calculate individual scores
            length_score = self._calculate_length_score(text)
            keyword_score = self._calculate_keyword_score(text)
            clarity_score = self._calculate_clarity_score(text)
            relevance_score = self._calculate_relevance_score(text, query_context)
            confidence_penalty = max(0.0, 1.0 - float(conf))
            error_penalty = 1.0 if response.error else 0.0
            
            # Calculate weighted final score
            final_score = (
                length_score * self.weights['length'] +
                keyword_score * self.weights['keywords'] +
                clarity_score * self.weights['clarity'] +
                relevance_score * self.weights['relevance'] +
                float(conf) * self.weights['confidence'] -
                confidence_penalty * 0.1 -
                error_penalty * self.weights['error_penalty']
            )
            
            final_score = max(0.0, min(1.0, final_score))  # Clamp to [0, 1]
            
            # Generate reasoning
            reasoning = self._generate_analysis_reasoning(
                response.provider, length_score, keyword_score, 
                clarity_score, relevance_score, float(conf)
            )
            
            return ResponseAnalysis(
                provider=response.provider,
                quality_score=final_score,
                length_score=length_score,
                keyword_score=keyword_score,
                clarity_score=clarity_score,
                relevance_score=relevance_score,
                confidence_penalty=confidence_penalty,
                error_penalty=error_penalty,
                final_score=final_score,
                reasoning=reasoning
            )
            
        except Exception as e:
            logger.error(f"Error analyzing response from {response.provider}: {e}")
            return ResponseAnalysis(
                provider=response.provider,
                quality_score=0.0,
                length_score=0.0,
                keyword_score=0.0,
                clarity_score=0.0,
                relevance_score=0.0,
                confidence_penalty=0.0,
                error_penalty=1.0,
                final_score=0.0,
                reasoning=f"Analysis failed: {str(e)}"
            )
    
    def _calculate_length_score(self, text: str) -> float:
        """Score based on response length (optimal range 100-500 chars)"""
        length = len(text.strip())
        
        if length < 50:
            return 0.2  # Too short
        elif length < 100:
            return 0.6  # Short but acceptable
        elif length < 500:
            return 1.0  # Optimal range
        elif length < 800:
            return 0.8  # Good but lengthy
        else:
            return 0.5  # Too verbose
    
    def _calculate_keyword_score(self, text: str) -> float:
        """Score based on agricultural domain keywords"""
        text_lower = text.lower()
        total_keywords = sum(len(keywords) for keywords in self.domain_keywords.values())
        matched_keywords = 0
        
        for category, keywords in self.domain_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    matched_keywords += 1
        
        return min(1.0, matched_keywords / (total_keywords * 0.2))  # 20% threshold for max score
    
    def _calculate_clarity_score(self, text: str) -> float:
        """Score based on text clarity and structure"""
        score = 0.0
        
        # Sentence structure
        sentences = re.split(r'[.!?]+', text)
        avg_sentence_length = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
        
        if 10 <= avg_sentence_length <= 25:
            score += 0.3  # Good sentence length
        elif 5 <= avg_sentence_length <= 35:
            score += 0.2  # Acceptable
        else:
            score += 0.1  # Too short or too long
        
        # Capitalization and punctuation
        if text and text[0].isupper():
            score += 0.1
        if text.endswith(('.', '!', '?')):
            score += 0.1
        
        # Paragraph structure (multiple sentences)
        if len(sentences) > 1:
            score += 0.2
        
        # Lists or structured content
        if any(marker in text for marker in ['1.', '2.', '•', '-', '*']):
            score += 0.2
        
        # Grammar indicators (simplified)
        if ' and ' in text or ' or ' in text:
            score += 0.1  # Connecting words
        
        return min(1.0, score)
    
    def _calculate_relevance_score(self, text: str, query_context: str) -> float:
        """Score based on relevance to the specific query context"""
        if not query_context:
            return 0.5  # Neutral if no context
        
        text_lower = text.lower()
        context_lower = query_context.lower()
        
        score = 0.0
        
        # Direct mention of detected class
        context_words = context_lower.split()
        for word in context_words:
            if len(word) > 3 and word in text_lower:
                score += 0.2
        
        # Action words for recommendations
        action_words = ['recommend', 'suggest', 'treat', 'apply', 'use', 'spray', 'monitor']
        for word in action_words:
            if word in text_lower:
                score += 0.1
        
        # Specific recommendations (presence of specific advice)
        specific_indicators = ['fungicide', 'insecticide', 'neem oil', 'copper', 'sulfur', 'bordeaux']
        for indicator in specific_indicators:
            if indicator in text_lower:
                score += 0.15
        
        return min(1.0, score)
    
    def _generate_analysis_reasoning(self, provider: str, length_score: float, 
                                   keyword_score: float, clarity_score: float, 
                                   relevance_score: float, confidence: float) -> str:
        """Generate human-readable reasoning for the analysis"""
        reasons = []
        
        # Length assessment
        if length_score > 0.8:
            reasons.append("optimal response length")
        elif length_score > 0.6:
            reasons.append("adequate response length")
        else:
            reasons.append("suboptimal response length")
        
        # Keyword assessment
        if keyword_score > 0.7:
            reasons.append("strong domain relevance")
        elif keyword_score > 0.4:
            reasons.append("moderate domain relevance")
        else:
            reasons.append("limited domain relevance")
        
        # Clarity assessment
        if clarity_score > 0.8:
            reasons.append("excellent clarity and structure")
        elif clarity_score > 0.6:
            reasons.append("good clarity")
        else:
            reasons.append("needs better structure")
        
        # Relevance assessment
        if relevance_score > 0.7:
            reasons.append("highly relevant recommendations")
        elif relevance_score > 0.4:
            reasons.append("relevant content")
        else:
            reasons.append("limited relevance to query")
        
        # Confidence assessment
        if confidence > 0.8:
            reasons.append("high provider confidence")
        elif confidence > 0.6:
            reasons.append("moderate confidence")
        else:
            reasons.append("low confidence")
        
        return f"{provider.title()}: {', '.join(reasons)}"
    
    def select_best_response(self, responses: Dict[str, LLMResponse], 
                           query_context: str = "") -> AgentDecision:
        """Select the best response from multiple LLM providers"""
        try:
            if not responses:
                return AgentDecision(
                    selected_provider="none",
                    selected_response="No responses available",
                    confidence=0.0,
                    reasoning="No LLM responses to evaluate",
                    all_analyses={},
                    metadata={"timestamp": datetime.now().isoformat()}
                )
            
            # Analyze all responses
            analyses = {}
            for provider, response in responses.items():
                analyses[provider] = self.analyze_response(response, query_context)
            
            # Find best response
            best_provider = max(analyses.keys(), key=lambda p: analyses[p].final_score)
            best_analysis = analyses[best_provider]
            best_response = responses[best_provider]
            
            # Calculate decision confidence
            scores = [analysis.final_score for analysis in analyses.values()]
            score_range = max(scores) - min(scores) if len(scores) > 1 else 0.5
            
            # If all providers have very low scores, use fallback response
            if best_analysis.final_score < 0.1:
                fallback_response = "Based on the image analysis, I recommend consulting with an agricultural expert for proper diagnosis and treatment. Common plant diseases and pests require specific treatments that vary by crop type, season, and local conditions. Please contact your local agricultural extension service for personalized recommendations."
                
                return AgentDecision(
                    selected_provider="fallback",
                    selected_response=fallback_response,
                    confidence=0.3,
                    reasoning="Fallback response provided due to low provider scores",
                    all_analyses=analyses,
                    metadata={"fallback": True, "max_score": best_analysis.final_score, "timestamp": datetime.now().isoformat()}
                )
            
            decision_confidence = min(1.0, best_analysis.final_score + (score_range * 0.2))
            
            # Generate decision reasoning
            decision_reasoning = self._generate_decision_reasoning(
                best_provider, best_analysis, analyses
            )
            
            return AgentDecision(
                selected_provider=best_provider,
                selected_response=best_response.response,
                confidence=decision_confidence,
                reasoning=decision_reasoning,
                all_analyses=analyses,
                metadata={
                    "timestamp": datetime.now().isoformat(),
                    "total_responses": len(responses),
                    "score_range": score_range,
                    "best_score": best_analysis.final_score,
                    "query_context": query_context
                }
            )
            
        except Exception as e:
            logger.error(f"Error in response selection: {e}")
            # Provide fallback response when all providers fail
            fallback_response = "Based on the image analysis, I recommend consulting with an agricultural expert for proper diagnosis and treatment. Common plant diseases and pests require specific treatments that vary by crop type, season, and local conditions. Please contact your local agricultural extension service for personalized recommendations."
            
            return AgentDecision(
                selected_provider="fallback",
                selected_response=fallback_response,
                confidence=0.3,  # Low but not zero confidence
                reasoning="Fallback response provided due to provider failures",
                all_analyses={},
                metadata={"error": str(e), "timestamp": datetime.now().isoformat(), "fallback": True}
            )
    
    def _generate_decision_reasoning(self, best_provider: str, best_analysis: ResponseAnalysis,
                                   all_analyses: Dict[str, ResponseAnalysis]) -> str:
        """Generate reasoning for why a specific response was selected"""
        reasons = [f"Selected {best_provider} (score: {best_analysis.final_score:.3f})"]
        
        # Highlight best provider's strengths
        if best_analysis.keyword_score > 0.7:
            reasons.append(f"strong domain expertise")
        if best_analysis.clarity_score > 0.8:
            reasons.append(f"excellent clarity")
        if best_analysis.relevance_score > 0.7:
            reasons.append(f"highly relevant recommendations")
        
        # Compare with others
        other_scores = [a.final_score for p, a in all_analyses.items() if p != best_provider]
        if other_scores:
            avg_other = sum(other_scores) / len(other_scores)
            if best_analysis.final_score > avg_other + 0.1:
                reasons.append(f"significantly outperformed alternatives")
        
        return "; ".join(reasons)

# Global agent instance
_agent_instance = None

def get_response_agent() -> ResponseAgent:
    """Get or create global response agent instance"""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = ResponseAgent()
    return _agent_instance
