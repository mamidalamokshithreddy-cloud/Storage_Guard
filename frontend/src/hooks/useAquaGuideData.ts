// Custom hook for AquaGuide data management
import { useState, useEffect } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AquaGuideData {
  schedules: any[];
  equipment: any[];
  alerts: any[];
  compliance: any[];
  fields: any[];
  waterMetrics: any;
  weather: any;
  services: any[];
  experts: {
    list: any[];
    count: number;
    availability: boolean;
    nearestDistance: { value: number; unit: string };
  };
  schedule: any[];
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function useAquaGuideData(_selectedField?: string, _location?: string) {
  const [data, setData] = useState<AquaGuideData>({
    schedules: [],
    equipment: [],
    alerts: [],
    compliance: [],
    fields: [],
    waterMetrics: null,
    weather: null,
    services: [],
    experts: {
      list: [],
      count: 0,
      availability: false,
      nearestDistance: { value: 0, unit: 'km' }
    },
    schedule: []
  });
  const [loading, setLoading] = useState({
    waterMetrics: false,
    weather: false,
    schedule: false,
    experts: false
  });
  const [error] = useState({
    waterMetrics: null as string | null,
    weather: null as string | null,
    schedule: null as string | null,
    experts: null as string | null
  });

  const refetch = () => {
    // Trigger data refetch
    setLoading({
      waterMetrics: true,
      weather: true,
      schedule: true,
      experts: true
    });
    setTimeout(() => {
      setLoading({
        waterMetrics: false,
        weather: false,
        schedule: false,
        experts: false
      });
    }, 1000);
  };

  useEffect(() => {
    // Mock data initialization
    const initializeData = () => {
      setData({
        schedules: [
          { id: 1, name: 'Morning Irrigation', time: '06:00', zone: 'Zone A' },
          { id: 2, name: 'Evening Irrigation', time: '18:00', zone: 'Zone B' }
        ],
        equipment: [
          { id: 1, name: 'Pump 1', status: 'active', zone: 'Zone A' },
          { id: 2, name: 'Pump 2', status: 'inactive', zone: 'Zone B' }
        ],
        alerts: [
          { id: 1, message: 'Low water pressure in Zone A', type: 'warning' },
          { id: 2, message: 'Irrigation complete in Zone B', type: 'success' }
        ],
        compliance: [
          { id: 1, task: 'Weekly equipment check', status: 'completed' },
          { id: 2, task: 'Monthly water quality test', status: 'pending' }
        ],
        fields: [
          { id: '1', name: 'North Field', area: 5.2, cropType: 'Rice' },
          { id: '2', name: 'South Field', area: 3.8, cropType: 'Wheat' }
        ],
        waterMetrics: {
          soilMoisture: 65,
          waterLevel: 80,
          flowRate: 15.5,
          pressure: 2.3
        },
        weather: {
          temperature: 32,
          humidity: 68,
          rainfall: 5.2
        },
        services: [
          { id: '1', name: 'Smart Irrigation', available: true },
          { id: '2', name: 'Water Quality Analysis', available: false }
        ],
        experts: {
          list: [
            { id: '1', name: 'Dr. Kumar', specialization: 'Irrigation', available: true }
          ],
          count: 5,
          availability: true,
          nearestDistance: { value: 2.5, unit: 'km' }
        },
        schedule: [
          { id: '1', zone: 'Zone A', time: '06:00', duration: 45 }
        ]
      });
    };
    
    initializeData();
  }, []);

  return { data, loading, error, setData, refetch };
}