// Custom hook for plots management (similar to usePlotData but different structure)
import { useState, useEffect } from 'react';

export interface Plot {
  id: string;
  name: string;
  area: number | string;
  coordinates: [number, number][];
  owner: string;
  status: 'available' | 'leased' | 'pending' | 'Verified' | 'Rejected';
  cropType?: string;
  // Additional properties expected by LandOnboarding component
  location: string;
  ownerName: string;
  surveyNo?: string;
  soilType?: string;
  cropHistory?: string[];
}

export function usePlots() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = () => {
      // Mock data for now
      setPlots([
        {
          id: '1',
          name: 'Plot A-001',
          area: '2.5 acres',
          coordinates: [[17.9689, 79.5941], [17.9690, 79.5942], [17.9691, 79.5943]],
          owner: 'Farmer A',
          ownerName: 'Farmer A',
          location: 'Warangal, Telangana',
          surveyNo: 'SY-123-A',
          soilType: 'Clay Loam',
          status: 'Verified',
          cropHistory: ['Rice', 'Cotton']
        },
        {
          id: '2',
          name: 'Plot B-002',
          area: '3.2 acres',
          coordinates: [[17.9692, 79.5944], [17.9693, 79.5945], [17.9694, 79.5946]],
          owner: 'Farmer B',
          ownerName: 'Farmer B',
          location: 'Karimnagar, Telangana',
          surveyNo: 'SY-456-B',
          soilType: 'Sandy Loam',
          status: 'leased',
          cropType: 'Rice',
          cropHistory: ['Rice', 'Maize', 'Cotton']
        }
      ]);
    };

    initializeData();
  }, []);

  const addPlot = (plot: Omit<Plot, 'id'>) => {
    const newPlot = {
      ...plot,
      id: Date.now().toString()
    };
    setPlots(prev => [...prev, newPlot]);
  };

  const updatePlot = (id: string, updates: Partial<Plot>) => {
    setPlots(prev => prev.map(plot => 
      plot.id === id ? { ...plot, ...updates } : plot
    ));
  };

  const refetch = () => {
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setLoading(false);
      // Could refresh data here
    }, 1000);
  };

  return { plots, loading, error, addPlot, updatePlot, refetch };
}