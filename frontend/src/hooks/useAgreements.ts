// Custom hook for agreements management
import { useState, useEffect } from 'react';

export interface Agreement {
  id: string;
  title: string;
  type: 'lease' | 'purchase' | 'partnership';
  parties: string[];
  startDate: string;
  endDate?: string;
  status: 'draft' | 'active' | 'completed' | 'terminated';
  terms: string;
  plotId?: string;
}

export function useAgreements() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // Mock data for now - moved to initialization function
    const initializeAgreements = () => {
      setAgreements([
      {
        id: '1',
        title: 'Rice Field Lease Agreement',
        type: 'lease',
        parties: ['Farmer A', 'Landowner B'],
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'active',
        terms: 'Annual lease for rice cultivation with 70-30 profit sharing',
        plotId: '1'
      },
      {
        id: '2',
        title: 'Equipment Partnership',
        type: 'partnership',
        parties: ['Farmer C', 'Equipment Supplier D'],
        startDate: '2024-06-01',
        status: 'active',
        terms: 'Shared equipment usage with maintenance responsibilities'
      }
    ]);
    };
    
    initializeAgreements();
  }, []);

  const addAgreement = (agreement: Omit<Agreement, 'id'>) => {
    const newAgreement = {
      ...agreement,
      id: Date.now().toString()
    };
    setAgreements(prev => [...prev, newAgreement]);
  };

  const updateAgreement = (id: string, updates: Partial<Agreement>) => {
    setAgreements(prev => prev.map(agreement => 
      agreement.id === id ? { ...agreement, ...updates } : agreement
    ));
  };

  const deleteAgreement = (id: string) => {
    setAgreements(prev => prev.filter(agreement => agreement.id !== id));
  };

  return { 
    agreements, 
    loading, 
    error, 
    addAgreement, 
    updateAgreement, 
    deleteAgreement 
  };
}