// Enhanced irrigation data management hook
import { useState, useEffect } from 'react';

export interface EnhancedIrrigationData {
  plots: Array<{
    id: string;
    name: string;
    area: number;
    cropType: string;
    waterRequirement: number;
    lastWatered: string;
    status: 'healthy' | 'needs_water' | 'overwatered';
  }>;
  scheduleData: {
    timing: Array<{
      time: string;
      zone: string;
      duration: number;
      status: 'active' | 'scheduled' | 'completed';
    }>;
    dailyRequirement: string;
    sessions: number;
  };
  analysis: {
    plot_data: {
      efficiency_metrics: {
        efficiency_rate: {
          percentage: number;
        };
      };
    };
    ai_recommendations: {
      summary: string;
      confidence_score: number;
      priority_actions: Array<{
        action: string;
        priority: 'high' | 'medium' | 'low';
        description: string;
      }>;
    };
    analysis_timestamp: string;
  };
  waterMetrics: {
    soilMoisture: number;
    waterLevel: number;
    flowRate: number;
    pressure: number;
    temperature: number;
    humidity: number;
    totalWaterUsed: string;
    weeklyChange: string;
    efficiency: string;
    costSavings: string;
    ph: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  soilMetrics: {
    moisture: string;
    ph: string;
    nitrogen: string;
    phosphorus: string;
    potassium: string;
  };
  weatherData: {
    temperature: number;
    humidity: number;
    rainfall: number;
    forecast: string;
    rainChance: number;
    current: string;
    recommendation?: string;
  };
}

export function useEnhancedIrrigation() {
  const [data, setData] = useState<EnhancedIrrigationData>({
    plots: [],
    scheduleData: { 
      timing: [],
      dailyRequirement: '0',
      sessions: 0
    },
    analysis: {
      plot_data: {
        efficiency_metrics: {
          efficiency_rate: { percentage: 0 }
        }
      },
      ai_recommendations: {
        summary: '',
        confidence_score: 0,
        priority_actions: []
      },
      analysis_timestamp: new Date().toISOString()
    },
    waterMetrics: {
      soilMoisture: 0,
      waterLevel: 0,
      flowRate: 0,
      pressure: 0,
      temperature: 0,
      humidity: 0,
      totalWaterUsed: '0L',
      weeklyChange: '+0%',
      efficiency: '0%',
      costSavings: '₹0',
      ph: 0,
      nitrogen: 0,
      phosphorus: 0,
      potassium: 0
    },
    soilMetrics: {
      moisture: '0%',
      ph: '0.0',
      nitrogen: '0',
      phosphorus: '0',
      potassium: '0'
    },
    weatherData: {
      temperature: 0,
      humidity: 0,
      rainfall: 0,
      forecast: '',
      rainChance: 0,
      current: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);

  useEffect(() => {
    // Mock data initialization
    const initializeData = () => {
      setData({
        plots: [
          {
            id: '1',
            name: 'North Field',
            area: 5.2,
            cropType: 'Rice',
            waterRequirement: 450,
            lastWatered: '2 hours ago',
            status: 'healthy'
          },
          {
            id: '2',
            name: 'South Field',
            area: 3.8,
            cropType: 'Wheat',
            waterRequirement: 320,
            lastWatered: '4 hours ago',
            status: 'needs_water'
          }
        ],
        scheduleData: {
          timing: [
            {
              time: '06:00',
              zone: 'Zone A',
              duration: 45,
              status: 'active'
            },
            {
              time: '18:00',
              zone: 'Zone B',
              duration: 30,
              status: 'scheduled'
            }
          ],
          dailyRequirement: '850',
          sessions: 2
        },
        analysis: {
          plot_data: {
            efficiency_metrics: {
              efficiency_rate: { percentage: 75 }
            }
          },
          ai_recommendations: {
            summary: 'Overall irrigation efficiency is good with some areas for improvement',
            confidence_score: 0.85,
            priority_actions: [
              {
                action: 'Increase watering frequency for South Field',
                priority: 'high',
                description: 'Soil moisture levels are below optimal range'
              },
              {
                action: 'Monitor water pressure in Zone A',
                priority: 'medium',
                description: 'Slight pressure drop detected'
              }
            ]
          },
          analysis_timestamp: new Date().toISOString()
        },
        waterMetrics: {
          soilMoisture: 65,
          waterLevel: 80,
          flowRate: 15.5,
          pressure: 2.3,
          temperature: 32,
          humidity: 68,
          totalWaterUsed: '1,250L',
          weeklyChange: '-5%',
          efficiency: '85%',
          costSavings: '₹2,500',
          ph: 6.8,
          nitrogen: 45,
          phosphorus: 22,
          potassium: 180
        },
        soilMetrics: {
          moisture: '45%',
          ph: '6.8',
          nitrogen: '45',
          phosphorus: '22',
          potassium: '180'
        },
        weatherData: {
          temperature: 32,
          humidity: 68,
          rainfall: 5.2,
          forecast: 'Partly cloudy with chance of rain',
          rainChance: 65,
          current: 'Partly Cloudy',
          recommendation: 'Reduce irrigation by 20% due of expected rainfall'
        }
      });
    };
    
    initializeData();
  }, []);

  return {
    ...data,
    loading,
    error,
    selectedPlotId,
    selectPlot: (plotId: string) => setSelectedPlotId(plotId),
    refreshAnalysis: () => {
      setLoading(true);
      setTimeout(() => setLoading(false), 1000);
    },
    refetch: () => {
      setLoading(true);
      setTimeout(() => setLoading(false), 1000);
    }
  };
}