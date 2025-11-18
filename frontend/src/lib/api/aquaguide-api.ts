// AquaGuide API functions and types
export interface WaterMetrics {
  soilMoisture: number;
  waterLevel: number;
  flowRate: number;
  pressure: number;
  temperature: number;
  humidity: number;
  ph: number;
  electricalConductivity: number;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  forecast: string;
}

export interface IrrigationSchedule {
  id: string;
  zoneName: string;
  startTime: string;
  duration: {
    value: number;
    unit: string;
  };
  frequency: string;
  status: 'active' | 'scheduled' | 'completed' | 'in-progress';
  waterAmount: {
    value: number;
    unit: string;
  };
}

export interface AquaGuideService {
  id: string;
  name: string;
  description: string;
  available: boolean;
  cost?: number;
}

export interface Expert {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  available: boolean;
}

export interface Field {
  id: string;
  name: string;
  area: number;
  cropType: string;
  location: string;
}

// Mock API functions
export async function fetchWaterMetrics(_fieldId: string): Promise<WaterMetrics> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    soilMoisture: 65,
    waterLevel: 80,
    flowRate: 15.5,
    pressure: 2.3,
    temperature: 28,
    humidity: 75,
    ph: 6.8,
    electricalConductivity: 1.2
  };
}

export async function fetchWeatherData(_location: string): Promise<WeatherData> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    temperature: 32,
    humidity: 68,
    windSpeed: 12,
    rainfall: 5.2,
    forecast: 'Partly cloudy with chances of rain'
  };
}

export async function fetchIrrigationSchedule(_fieldId: string): Promise<IrrigationSchedule[]> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return [
    {
      id: '1',
      zoneName: 'Zone A',
      startTime: '06:00',
      duration: {
        value: 45,
        unit: 'minutes'
      },
      frequency: 'Daily',
      status: 'active',
      waterAmount: {
        value: 250,
        unit: 'L'
      }
    },
    {
      id: '2',
      zoneName: 'Zone B',
      startTime: '18:00',
      duration: {
        value: 30,
        unit: 'minutes'
      },
      frequency: 'Every 2 days',
      status: 'scheduled',
      waterAmount: {
        value: 180,
        unit: 'L'
      }
    }
  ];
}

export async function fetchAquaGuideServices(): Promise<AquaGuideService[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: '1',
      name: 'Smart Irrigation Control',
      description: 'Automated irrigation scheduling based on soil moisture',
      available: true,
      cost: 2500
    },
    {
      id: '2',
      name: 'Water Quality Analysis',
      description: 'Regular monitoring and analysis of irrigation water',
      available: true,
      cost: 1800
    }
  ];
}

export async function fetchExperts(): Promise<Expert[]> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return [
    {
      id: '1',
      name: 'Dr. Rajesh Kumar',
      specialization: 'Irrigation Systems',
      experience: 15,
      rating: 4.8,
      available: true
    },
    {
      id: '2',
      name: 'Prof. Priya Sharma',
      specialization: 'Water Management',
      experience: 12,
      rating: 4.6,
      available: false
    }
  ];
}

export async function fetchFields(): Promise<Field[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return [
    {
      id: '1',
      name: 'North Field',
      area: 5.2,
      cropType: 'Rice',
      location: 'North Section'
    },
    {
      id: '2',
      name: 'South Field',
      area: 3.8,
      cropType: 'Wheat',
      location: 'South Section'
    }
  ];
}

// Export alias for compatibility
export const getIrrigationSchedule = fetchIrrigationSchedule;

// Type alias for IrrigationScheduleItem
export type IrrigationScheduleItem = IrrigationSchedule;

// API object for compatibility
export const aquaGuideAPI = {
  getFields: fetchFields,
  getIrrigationSchedule: fetchIrrigationSchedule,
  getWaterMetrics: fetchWaterMetrics,
  getWeatherData: fetchWeatherData
};