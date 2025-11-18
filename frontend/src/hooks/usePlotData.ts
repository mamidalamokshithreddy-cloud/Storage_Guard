// Custom hook for comprehensive plot data management
import { useState, useEffect } from 'react';

// Define the interfaces to match what IrrigationScheduling expects
export interface Plot {
  id: string;
  name: string;
  area: {
    value: number;
    unit: string;
  };
  location: {
    village: string;
    district: string;
  };
  crop: {
    name: string;
    stage: string;
  };
}

export interface PlotMeasurements {
  soilMoisture: {
    value: number;
    status: string;
  };
  temperature: {
    value: number;
    unit: string;
  };
  humidity: {
    value: number;
  };
  evapotranspiration: {
    value: number;
    unit: string;
    status: string;
  };
  waterUsage: {
    today: {
      value: number;
      unit: string;
    };
    weekly: {
      value: number;
      unit: string;
      trend: number;
    };
    monthly: {
      value: number;
      unit: string;
      trend: number;
    };
  };
}

export interface PlotWeather {
  current: {
    temperature: {
      value: number;
      unit: string;
    };
    humidity: {
      value: number;
    };
    windSpeed: {
      value: number;
      unit: string;
    };
    condition: string;
  };
  forecast: {
    nextRain: {
      probability: number;
      expected: boolean;
      expectedTime?: string;
    };
    daily: Array<{
      date: string;
      condition: string;
      maxTemp: number;
      minTemp: number;
      rainProbability: number;
    }>;
  };
}

export interface IrrigationSchedule {
  id: string;
  startTime: string;
  duration: {
    value: number;
    unit: string;
  };
  method: string;
  waterAmount: {
    value: number;
    unit: string;
  };
  status: 'scheduled' | 'in-progress' | 'completed';
  adjustedFor: {
    cropStage: boolean;
  };
}

export function usePlotData() {
  const [selectedPlotId, setSelectedPlotId] = useState<string>('');
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [measurements, setMeasurements] = useState<PlotMeasurements | null>(null);
  const [weather, setWeather] = useState<PlotWeather | null>(null);
  const [schedule, setSchedule] = useState<IrrigationSchedule[]>([]);
  
  const [loading] = useState({
    plots: false,
    measurements: false,
    weather: false,
    schedule: false,
  });
  
  const [error] = useState({
    plots: null as string | null,
    measurements: null as string | null,
    weather: null as string | null,
    schedule: null as string | null,
  });

  useEffect(() => {
    const initializeData = () => {
      // Mock data for plots
      setPlots([
        {
          id: '1',
          name: 'North Field',
          area: { value: 5.2, unit: 'acres' },
          location: { village: 'Warangal', district: 'Telangana' },
          crop: { name: 'Rice', stage: 'mid' }
        },
        {
          id: '2',
          name: 'South Field', 
          area: { value: 3.8, unit: 'acres' },
          location: { village: 'Karimnagar', district: 'Telangana' },
          crop: { name: 'Wheat', stage: 'initial' }
        }
      ]);

      // Mock measurements data
      setMeasurements({
        soilMoisture: { value: 45, status: 'optimal' },
        temperature: { value: 28, unit: 'C' },
        humidity: { value: 65 },
        evapotranspiration: { value: 6.2, unit: 'mm/day', status: 'normal' },
        waterUsage: {
          today: { value: 250, unit: 'L' },
          weekly: { value: 1750, unit: 'L', trend: -5 },
          monthly: { value: 7500, unit: 'L', trend: 2 }
        }
      });

      // Mock weather data
      setWeather({
        current: {
          temperature: { value: 32, unit: 'C' },
          humidity: { value: 68 },
          windSpeed: { value: 12, unit: 'km/h' },
          condition: 'Partly Cloudy'
        },
        forecast: {
          nextRain: { probability: 65, expected: true, expectedTime: new Date().toISOString() },
          daily: [
            { date: new Date().toISOString(), condition: 'Sunny', maxTemp: 34, minTemp: 22, rainProbability: 10 },
            { date: new Date(Date.now() + 86400000).toISOString(), condition: 'Cloudy', maxTemp: 31, minTemp: 20, rainProbability: 40 }
          ]
        }
      });

      // Mock schedule data
      setSchedule([
        {
          id: '1',
          startTime: new Date().toISOString(),
          duration: { value: 45, unit: 'min' },
          method: 'Drip Irrigation',
          waterAmount: { value: 25, unit: 'mm' },
          status: 'scheduled',
          adjustedFor: { cropStage: true }
        }
      ]);
    };

    initializeData();
  }, []);

  // Update selected plot when selectedPlotId changes
  useEffect(() => {
    const updateSelectedPlot = () => {
      if (selectedPlotId) {
        const plot = plots.find(p => p.id === selectedPlotId);
        setSelectedPlot(plot || null);
      } else {
        setSelectedPlot(null);
      }
    };

    updateSelectedPlot();
  }, [selectedPlotId, plots]);

  const selectPlot = (plotId: string) => {
    setSelectedPlotId(plotId);
  };

  const updateSchedule = (scheduleId: string, updates: Partial<IrrigationSchedule>) => {
    setSchedule(prev => prev.map(item => 
      item.id === scheduleId ? { ...item, ...updates } : item
    ));
  };

  const createSchedule = (newSchedule: Omit<IrrigationSchedule, 'id'>) => {
    const schedule: IrrigationSchedule = {
      ...newSchedule,
      id: Date.now().toString()
    };
    setSchedule(prev => [...prev, schedule]);
  };

  return {
    data: {
      plots,
      selectedPlot,
      measurements,
      weather,
      schedule
    },
    loading,
    error,
    selectPlot,
    updateSchedule,
    createSchedule,
    selectedPlotId
  };
}