import { useState, useCallback } from 'react';
import axios from 'axios';

interface SoilData {
  plotId?: string;
  location?: string;
  sampleId?: string;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  ph?: number;
  moisture?: number;
  organicMatter?: number;
  cropType?: string;
  previousCrop?: string;
  [key: string]: unknown; // For additional properties
}

interface NutrientAnalysisData {
  nutrientLevels: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    ph: number;
    moisture: number;
  };
  recommendations: {
    fertilizers: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
    schedule: Array<{
      date: string;
      action: string;
    }>;
  };
  analysis: {
    summary: string;
    details: Array<{
      nutrient: string;
      status: string;
      recommendation: string;
    }>;
  };
}

interface UseNutrientAnalysisReturn {
  data: NutrientAnalysisData | null;
  loading: boolean;
  error: Error | null;
  analyzeNutrients: (soilData: SoilData) => Promise<void>;
  resetError: () => void;
}

export function useNutrientAnalysis(): UseNutrientAnalysisReturn {
  const [data, setData] = useState<NutrientAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const analyzeNutrients = useCallback(async (soilData: SoilData) => {
    try {
      setLoading(true);
      setError(null);

      // First get comprehensive analysis
      const analysisResponse = await axios.post(
        '/api/comprehensive-analysis',
        soilData
      );

      if (!analysisResponse.data) {
        throw new Error('No data received from comprehensive analysis');
      }

      // Then get fertilizer recommendations based on analysis
      const recommendationsResponse = await axios.post(
        '/api/fertilizer-recommendations',
        {
          analysisId: analysisResponse.data.id
        }
      );

      if (!recommendationsResponse.data) {
        throw new Error('No data received from recommendations');
      }

      // Combine the data
      const combinedData = {
        nutrientLevels: analysisResponse.data.levels,
        recommendations: recommendationsResponse.data.recommendations,
        analysis: analysisResponse.data.analysis
      };

      setData(combinedData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred during analysis'));
      // Keep the previous data if there was an error
    } finally {
      setLoading(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    analyzeNutrients,
    resetError
  };
}
