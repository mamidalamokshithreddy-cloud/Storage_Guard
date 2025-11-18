'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { MapPin, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface MapCanvasProps {
  onCoordinatesSet: (lat: number, lng: number) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ onCoordinatesSet }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentMarker, setCurrentMarker] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);

  const mapBounds = {
    minLat: 15.0,
    maxLat: 20.0,
    minLng: 77.0,
    maxLng: 82.0
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Handle click events
    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      setCurrentMarker({ x, y });
      
      // Convert canvas coordinates to GPS coordinates
      const lat = mapBounds.maxLat - ((y / canvas.height) * (mapBounds.maxLat - mapBounds.minLat));
      const lng = mapBounds.minLng + ((x / canvas.width) * (mapBounds.maxLng - mapBounds.minLng));
      
      onCoordinatesSet(lat, lng);
    };

    canvas.addEventListener('click', handleClick);
    
    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [onCoordinatesSet, mapBounds]);

  // Redraw canvas when marker or zoom changes
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background
    ctx.fillStyle = '#f0f9ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    const gridSize = 50 * zoom;
    
    // Vertical lines
    for (let i = 0; i <= canvas.width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= canvas.height; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
    
    // Draw landmarks
    const landmarks = [
      { x: 200, y: 150, label: 'Hyderabad' },
      { x: 400, y: 200, label: 'Warangal' },
      { x: 300, y: 350, label: 'Khammam' },
      { x: 150, y: 300, label: 'Mahbubnagar' },
    ];
    
    landmarks.forEach(landmark => {
      // Draw landmark circle
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(landmark.x * zoom, landmark.y * zoom, 8 * zoom, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw landmark text
      ctx.fillStyle = '#1f2937';
      ctx.font = `${12 * zoom}px Arial`;
      ctx.fillText(landmark.label, (landmark.x + 15) * zoom, (landmark.y - 5) * zoom);
    });
    
    // Draw current marker if exists
    if (currentMarker) {
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(currentMarker.x, currentMarker.y, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }, [currentMarker, zoom]);

  const clearMarker = () => {
    setCurrentMarker(null);
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };



  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={clearMarker}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Clear Marker
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={zoomIn}
          className="gap-2"
        >
          <ZoomIn className="h-4 w-4" />
          Zoom In
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={zoomOut}
          className="gap-2"
        >
          <ZoomOut className="h-4 w-4" />
          Zoom Out
        </Button>
      </div>
      
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="cursor-crosshair bg-blue-50"
          style={{ width: '100%', maxWidth: '800px', height: 'auto' }}
        />
      </div>
      
      {currentMarker && (
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-800">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">
              Marker placed at canvas coordinates: ({Math.round(currentMarker.x)}, {Math.round(currentMarker.y)})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};