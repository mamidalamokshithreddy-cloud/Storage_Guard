'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { MapPin, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface MapCanvasProps {
  onCoordinatesSet: (lat: number, lng: number) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ onCoordinatesSet }) => {
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Simple coordinate simulation (replace with actual GPS integration)
    const lat = 40.7128 + (y / 1000);
    const lng = -74.0060 + (x / 1000);
    
    setCoordinates({ lat, lng });
    onCoordinatesSet(lat, lng);
  };

  const resetCanvas = () => {
    setCoordinates({ lat: 0, lng: 0 });
    onCoordinatesSet(0, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">GPS Mapping Canvas</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetCanvas}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Simplified Canvas */}
      <div 
        className="w-full h-64 bg-green-50 border-2 border-green-200 rounded-lg cursor-crosshair relative"
        onClick={handleCanvasClick}
      >
        <div className="absolute inset-4 border border-green-300 rounded opacity-50"></div>
        <div className="absolute top-2 left-2 text-sm text-green-600">
          Click to set GPS coordinates
        </div>
        
        {coordinates.lat !== 0 && coordinates.lng !== 0 && (
          <div 
            className="absolute w-4 h-4 bg-red-500 rounded-full transform -translate-x-2 -translate-y-2"
            style={{
              left: `${(coordinates.lng + 74.0060) * 1000}px`,
              top: `${(coordinates.lat - 40.7128) * 1000}px`
            }}
          >
            <MapPin className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>

      {/* Coordinates Display */}
      {coordinates.lat !== 0 && coordinates.lng !== 0 && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium">Selected Coordinates:</p>
          <p className="text-xs text-gray-600">
            Latitude: {coordinates.lat.toFixed(6)}, Longitude: {coordinates.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};