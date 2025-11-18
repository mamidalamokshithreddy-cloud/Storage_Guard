import { AnalysisPayload } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function postComprehensiveAnalysis(payload: AnalysisPayload) {
  const url = `${API_BASE}/comprehensive-analysis`;
  console.log("Calling comprehensive analysis API:", url);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Failed to get analysis (${res.status})`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return {
      success: false,
      analysis: null,
      message: error instanceof Error ? error.message : "Failed to get analysis"
    };
  }
}

export async function postFertilizerRecommendations(payload: Partial<AnalysisPayload>) {
  const url = `${API_BASE}/fertilizer-recommendations`;
  console.log("Calling fertilizer recommendations API:", url);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Failed to get recommendations (${res.status})`);
    }

    const data = await res.json();
    if (!data.success) {
      console.warn("API returned success: false", data);
      return {
        success: false,
        recommendations: [],
        fertilizer_plan: [],
        message: data.error || "Failed to get recommendations"
      };
    }

    return {
      success: true,
      recommendations: data.recommendations || [],
      fertilizer_plan: data.fertilizer_plan || [],
      message: null
    };
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return {
      success: false,
      recommendations: [],
      fertilizer_plan: [],
      message: error instanceof Error ? error.message : "Failed to get recommendations"
    };
  }
}

export async function postApplicationSchedule(payload: {
  crop_info: AnalysisPayload["crop_info"];
  fertilizer_plan?: any;
  environmental_factors?: any;
}) {
  const url = `${API_BASE}/application-schedule`;
  console.log("Calling application schedule API:", url);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Failed to get schedule (${res.status})`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return {
      success: false,
      schedule: [],
      message: error instanceof Error ? error.message : "Failed to get schedule"
    };
  }
}

export async function postCostAnalysis(payload: {
  fertilizer_plan: any;
  market_prices?: Record<string, number>;
  farm_details?: any;
  user_preferences?: any;
}) {
  const url = `${API_BASE}/cost-analysis`;
  console.log("Calling cost analysis API:", url);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Failed to get cost analysis (${res.status})`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching cost analysis:", error);
    return {
      success: false,
      analysis: null,
      message: error instanceof Error ? error.message : "Failed to get cost analysis"
    };
  }
}