import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar, MapPin, User, IndianRupee, TrendingUp } from 'lucide-react';

interface LeaseData {
  id: string;
  plotName: string;
  plotSize: string;
  farmerName: string;
  leaseType: string;
  duration: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'pending_approval' | 'expired';
  monthlyPayment: string;
  revenueShare: string;
}

interface ActiveLeasesListProps {
  leases: LeaseData[];
  getStatusBadge: (_status: string) => React.ReactNode;
  onLeaseClick: (_lease: LeaseData) => void;
}

export const ActiveLeasesList: React.FC<ActiveLeasesListProps> = ({ leases, getStatusBadge, onLeaseClick }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {leases.map((lease) => (
        <Card key={lease.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onLeaseClick(lease)}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{lease.plotName}</CardTitle>
              {getStatusBadge(lease.status)}
            </div>
            <CardDescription className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {lease.farmerName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{lease.plotSize} • {lease.leaseType}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{lease.duration} ({lease.startDate} - {lease.endDate})</span>
              </div>
              
              {lease.leaseType === 'Fixed Rent' && (
                <div className="flex items-center gap-2 text-sm">
                  <IndianRupee className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-600">{lease.monthlyPayment}/month</span>
                </div>
              )}
              
              {lease.leaseType === 'Revenue Sharing' && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-600">{lease.revenueShare}</span>
                </div>
              )}
              
              <div className="pt-2 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Agreement
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Contact Farmer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};