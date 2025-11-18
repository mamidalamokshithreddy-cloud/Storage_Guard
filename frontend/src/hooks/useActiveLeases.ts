// Custom hook for active leases management
import { useState, useEffect } from 'react';

export interface ActiveLease {
  id: string;
  plotId: string;
  plotName: string;
  plotSize: string;
  farmerName: string;
  leaseType: string;
  duration: string;
  startDate: string;
  endDate: string;
  rent: number;
  status: 'active' | 'expired' | 'pending_approval';
  monthlyPayment: string;
  revenueShare: string;
  tenant: string;
  landlord: string;
}

export function useActiveLeases() {
  const [leases, setLeases] = useState<ActiveLease[]>([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // Mock data for now - moved to initialization function
    const initializeLeases = () => {
      setLeases([
      {
        id: '1',
        plotId: '1',
        plotName: 'North Field',
        plotSize: '5.2 acres',
        farmerName: 'Farmer A',
        leaseType: 'Revenue Share',
        duration: '12 months',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        rent: 50000,
        status: 'active',
        monthlyPayment: '₹4,167',
        revenueShare: '30%',
        tenant: 'Farmer A',
        landlord: 'Landowner B'
      },
      {
        id: '2',
        plotId: '2',
        plotName: 'South Field',
        plotSize: '3.8 acres',
        farmerName: 'Farmer C',
        leaseType: 'Fixed Rent',
        duration: '12 months',
        startDate: '2024-06-01',
        endDate: '2025-05-31',
        rent: 40000,
        status: 'active',
        monthlyPayment: '₹3,333',
        revenueShare: '25%',
        tenant: 'Farmer C',
        landlord: 'Landowner D'
      }
    ]);
    };
    
    initializeLeases();
  }, []);

  const addLease = (lease: Omit<ActiveLease, 'id'>) => {
    const newLease = {
      ...lease,
      id: Date.now().toString()
    };
    setLeases(prev => [...prev, newLease]);
  };

  const updateLease = (id: string, updates: Partial<ActiveLease>) => {
    setLeases(prev => prev.map(lease => 
      lease.id === id ? { ...lease, ...updates } : lease
    ));
  };

  const deleteLease = (id: string) => {
    setLeases(prev => prev.filter(lease => lease.id !== id));
  };

  const refetch = () => {
    setLoading(true);
    // Simulate API refetch
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return { 
    leases, 
    loading, 
    error, 
    totalCount: leases.length,
    refetch,
    addLease, 
    updateLease, 
    deleteLease 
  };
}