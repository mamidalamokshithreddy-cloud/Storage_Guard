import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { MapPin, Calendar, Droplets, Mountain } from 'lucide-react';

interface PlotData {
  id: string;
  name: string;
  size: string;
  location: string;
  soilType: string;
  waterSource: string;
  status: 'verified' | 'pending' | 'rejected';
  registrationDate: string;
}

interface LandPlotsListProps {
  plots: PlotData[];
  getStatusBadge: (status: string) => React.ReactNode;
  onPlotClick: (plot: PlotData) => void;
}

export const LandPlotsList: React.FC<LandPlotsListProps> = ({ plots, getStatusBadge, onPlotClick }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {plots.map((plot) => (
        <Card key={plot.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onPlotClick(plot)}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{plot.name}</CardTitle>
              {getStatusBadge(plot.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mountain className="w-4 h-4 text-gray-500" />
                <span>{plot.size}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="truncate">{plot.location}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Droplets className="w-4 h-4 text-gray-500" />
                <span>{plot.waterSource}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Registered: {new Date(plot.registrationDate).toLocaleDateString()}</span>
              </div>
              
              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};