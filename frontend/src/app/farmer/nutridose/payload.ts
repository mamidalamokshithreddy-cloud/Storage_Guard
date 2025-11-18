import type { AnalysisPayload } from './types';

// Builds a dynamic default payload using last detection (from CropShield) or URL params.
export const getDefaultPayload = (): AnalysisPayload => {
  let lastDetection: any = null;
  try {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('agri_last_detection');
      lastDetection = raw ? JSON.parse(raw) : null;
    }
  } catch {}

  let speciesFromQuery: string | undefined;
  let stageFromQuery: string | undefined;
  try {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      speciesFromQuery = url.searchParams.get('species') || undefined;
      stageFromQuery = url.searchParams.get('stage') || undefined;
    }
  } catch {}

  const species = speciesFromQuery || (lastDetection?.diagnosis ? String(lastDetection.diagnosis) : undefined);
  const stage = stageFromQuery || undefined;

  // Provide minimal, neutral defaults; no hardcoded crop specifics.
  return {
    soil_analysis: {},
    crop_info: {
      ...(species ? { species } : {}),
      ...(stage ? { current_stage: stage } : {}),
    },
    current_nutrients: {},
    deficiencies: [],
    growth_stage: stage || '',
    target_yield: undefined as any,
    farm_context: {
      ...(lastDetection ? {
        diagnosed_issue: lastDetection.diagnosis,
        diagnosed_category: lastDetection.category,
        diagnosed_confidence: lastDetection.confidence,
        diagnosed_severity: lastDetection.severity,
      } : {})
    },
    user_preferences: {
      certification_requirements: []
    },
    weather_forecast: []
  };
};