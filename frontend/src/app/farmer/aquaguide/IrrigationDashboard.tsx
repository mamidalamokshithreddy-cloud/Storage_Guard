'use client';

import { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AlertCircle, Calendar, Droplets, Gauge } from 'lucide-react';
import { useAquaGuideData } from '../../../hooks/useAquaGuideData';

// Temporary interfaces until proper API is implemented
interface PlotData {
  plot_id: string;
  soil_moisture: number;
  days_since_planting: number;
  crop_stage: string;
  location: {
    lat: number;
    lon: number;
  };
}

interface IrrigationPrediction {
  recommendations: string[];
}

interface UserPreferences {
  [key: string]: any;
}

const DEMO_PLOT_DATA: PlotData = {
  plot_id: "plot-123",
  soil_moisture: 15,
  days_since_planting: 40,
  crop_stage: "Tillering",
  location: {
    lat: 17.3850,
    lon: 78.4867
  }
};

const DEFAULT_PREFERENCES: UserPreferences = {
  preferred_time: 'early_morning',
  flow_rate_lpm: 2.0
};

interface WaterMetric {
  label: string;
  value: string;
  telugu: string;
  trend: string;
}

interface IrrigationEvent {
  day: string;
  time: string;
  duration: string;
  status: string;
  amount: string;
}

export default function IrrigationDashboard() {
  const { loading, error } = useAquaGuideData();
  // const refetch = ... // Commented - refetch not used yet
  
  // Mock data for now until proper irrigation API is implemented
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prediction: IrrigationPrediction & any = { 
    recommendations: ['నీరు రేపు ఉదయం 6:00 గంటలకు పారండి', 'మట్టి తేమ తనిఖీ చేయండి'],
    water_needed_liters: 45.5,
    confidence: 0.85,
    conditions_used: {
      soil_moisture: 35,
      temperature: 28
    },
    next_check_hours: 24,
    llm_reasoning: 'మట్టి తేమ కమ్మిగా ఉంది, నీరు అవసరం'
  };
  const schedule = { irrigation_events: [] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getPrediction = (_data?: any) => {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createSchedule = (_predictions?: any, _preferences?: any) => {};
  const [waterMetrics, setWaterMetrics] = useState<WaterMetric[]>([]);
  const [irrigationEvents, setIrrigationEvents] = useState<IrrigationEvent[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string>();

  useEffect(() => {
    if (selectedPlotId) {
      // Use the correct plot data with selected plot ID
      getPrediction({
        ...DEMO_PLOT_DATA,
        plot_id: selectedPlotId,
      });
    } else {
      // Get initial prediction on mount with demo data
      getPrediction(DEMO_PLOT_DATA);
    }
  }, [getPrediction, selectedPlotId]);

  useEffect(() => {
    const updateWaterMetrics = () => {
      if (prediction) {
        // Update water metrics based on prediction
        setWaterMetrics([
          {
            label: "Required Water",
            value: `${prediction.water_needed_liters.toFixed(1)} L`,
            telugu: "నీటి అవసరం",
            trend: prediction.confidence > 0.7 ? "optimal" : "+5%"
          },
          {
            label: "Soil Moisture",
            value: `${prediction.conditions_used.soil_moisture}%`,
            telugu: "మట్టి తేమ",
            trend: prediction.conditions_used.soil_moisture > 50 ? "optimal" : "critical"
          },
          {
            label: "Temperature",
            value: `${prediction.conditions_used.temperature}°C`,
            telugu: "ఉష్ణోగ్రత",
            trend: prediction.conditions_used.temperature < 35 ? "optimal" : "high"
          },
          {
            label: "Next Check",
            value: `${prediction.next_check_hours}h`,
            telugu: "తదుపరి తనిఖీ",
            trend: "scheduled"
          }
        ]);
      }
    };
    
    setTimeout(updateWaterMetrics, 0);
  }, [prediction]);

  useEffect(() => {
    const updateIrrigationEvents = () => {
      // Mock irrigation events for now
      setIrrigationEvents([
        {
          day: 'Today',
          time: '06:00 AM',
          duration: '30 min',
          status: 'scheduled',
          amount: '45.5 L'
        }
      ]);
    };
    
    setTimeout(updateIrrigationEvents, 0);
  }, [schedule]);

  const handleCreateSchedule = async () => {
    if (prediction) {
      await createSchedule([prediction], DEFAULT_PREFERENCES);
    }
  };

  if (error) {
    return (
      <div className="p-6 bg-destructive/10 rounded-lg">
        <AlertCircle className="w-6 h-6 text-destructive mb-2" />
        <h3 className="font-bold text-lg">Error Loading Irrigation Data</h3>
        <p className="text-muted-foreground">{typeof error === 'string' ? error : 'సిస్టం లోపం'}</p>
      </div>
    );
  }



  return (
    <div className="p-6 space-y-6">
      {/* Water Metrics */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              Irrigation Dashboard
            </h2>
            <select 
              value={selectedPlotId || ""}
              onChange={(e) => setSelectedPlotId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white min-w-[200px]"
            >
              <option value="">Select a plot</option>
              {/* Add plot options here when plots data is available */}
            </select>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {waterMetrics.map((metric, index) => (
              <div 
                key={index} 
                className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20 text-center"
              >
                <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                <p className="text-xs text-accent font-medium mb-2">{metric.telugu}</p>
                <p className="text-lg font-bold text-primary">{metric.value}</p>
                <Badge 
                  className={
                    metric.trend === 'optimal' 
                      ? 'bg-success/20 text-success' 
                      : metric.trend === 'critical'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-accent/20 text-accent'
                  }
                >
                  {metric.trend}
                </Badge>
              </div>
            ))}
          </div>

          {prediction && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-muted">
              <h3 className="font-semibold mb-2">AI Recommendations</h3>
              <p className="text-sm text-muted-foreground mb-2">{prediction.llm_reasoning || prediction.ml_reasoning}</p>
              {prediction.recommendations && prediction.recommendations.length > 0 && (
                <ul className="list-disc list-inside text-sm space-y-1">
                  {prediction.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-primary">{rec}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Irrigation Schedule */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Irrigation Schedule
            </h2>
            <Button
              onClick={handleCreateSchedule}
              disabled={loading.waterMetrics || !prediction}
              className="agri-button-primary"
            >
              <Droplets className="w-4 h-4 mr-2" />
              {loading ? 'Creating Schedule...' : 'Generate Schedule'}
            </Button>
          </div>
          
          <div className="space-y-3">
            {irrigationEvents.map((event, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border flex items-center justify-between ${
                  event.status === 'completed' 
                    ? 'bg-success/10 border-success/20' 
                    : 'bg-primary/10 border-primary/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    event.status === 'completed' ? 'bg-success' : 'bg-primary'
                  }`} />
                  <div>
                    <p className="font-semibold">{event.day}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.time} • {event.duration}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{event.amount}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {event.status}
                  </p>
                </div>
              </div>
            ))}
            
            {irrigationEvents.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                No irrigation events scheduled. Generate a new schedule.
              </div>
            )}
            
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Loading irrigation schedule...
              </div>
            )}
          </div>
        </div>
      </Card>

      <style jsx>{`
        .agri-button-primary {
          background: linear-gradient(to right, var(--primary), var(--primary-foreground));
          color: white;
          transition: all 0.3s ease;
        }
        .agri-button-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}