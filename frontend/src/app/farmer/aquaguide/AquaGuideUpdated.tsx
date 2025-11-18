'use client';

import { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import Image from "next/image";
import { 
  Droplets, 
  Calendar, 
  Gauge, 
  PlayCircle,
  Zap, 
  AlertCircle
} from "lucide-react";

// Import components
import AgentVideoSection from "../AgentVideoSection";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek"; 
import AgriPilotOnboarding from "../../admin/components/AgriPilotOnboarding";

// Import the custom hook
import { useAquaGuideData } from '../../../hooks/useAquaGuideData';

interface AquaGuideProps {
  onSchedulingClick?: () => void;
  onEquipmentClick?: () => void;
  onAlertsClick?: () => void;
  onComplianceClick?: () => void;
}

export default function AquaGuide({
  onSchedulingClick,
  onEquipmentClick,
  onAlertsClick,
  onComplianceClick
}: AquaGuideProps = {}) {
  // const router = useRouter();
  // const pathname = usePathname();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<string>();

  // Rehydrate previously selected field to persist session across navigation
  useEffect(() => {
    const loadCachedField = () => {
      try {
        if (typeof window === 'undefined') return;
        const cached = window.localStorage.getItem('agri_aquaguide_selected_field');
        if (cached) setSelectedField(JSON.parse(cached));
      } catch {
        // Ignore errors
      }
    };
    
    setTimeout(loadCachedField, 0);
  }, []);
  
  const {
    data: {
      fields,
      waterMetrics,
      weather,
      // services: aquaGuideServices,
      experts,
      schedule: irrigationSchedule
    },
    loading,
    error,
    // refetch,
  } = useAquaGuideData(selectedField, "Warangal District");

  // Handle plot selection
  const handlePlotSelect = (value: string) => {
    setSelectedField(value);
    try { 
      if (typeof window !== 'undefined') 
        window.localStorage.setItem('agri_aquaguide_selected_field', JSON.stringify(value)); 
    } catch {
      // Ignore localStorage errors
    }
    // useEffect will automatically trigger when selectedField changes
  };

  // Irrigation schedule now comes from the useAquaGuideData hook

  return (
    <div className="min-h-screen field-gradient">
      <AgriChatAgent />
      <AgriAIPilotSidePeek 
        agentType="AquaGuide"
        agentName="AquaGuide"
        agentNameTelugu="నీటిపారుదల"
        services={[]}
      />
      <div className="max-w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Irrigation Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="agri-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-primary" />
                    Irrigation Dashboard
                  </h2>
                  <select 
                    value={selectedField || ""}
                    onChange={(e) => handlePlotSelect(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white min-w-[200px]"
                  >
                    <option value="">Select a plot</option>
                    {fields?.map((plot) => (
                      <option key={plot.id} value={plot.id}>
                        {plot.name} {plot.area && `(${plot.area} acres)`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {loading.waterMetrics ? (
                    <div className="col-span-4 text-center py-4">Loading water metrics...</div>
                  ) : error.waterMetrics ? (
                    <div className="col-span-4 text-center text-red-600 py-4">{error.waterMetrics}</div>
                  ) : waterMetrics && (
                    <>
                      <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total Water Used</p>
                        <p className="text-xs text-accent font-medium mb-2">మొత్తం నీరు</p>
                        <p className="text-lg font-bold text-primary">
                          {waterMetrics.totalUsage?.value ?? "--"} {waterMetrics.totalUsage?.unit ?? ""}
                        </p>
                        <Badge className="bg-accent/20 text-accent">
                          {waterMetrics.totalUsage?.trend ?? "--"}
                        </Badge>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Efficiency Rate</p>
                        <p className="text-xs text-accent font-medium mb-2">సామర్థ్య రేటు</p>
                        <p className="text-lg font-bold text-primary">
                          {waterMetrics.efficiencyRate?.value ?? "--"}%
                        </p>
                        <Badge className="bg-accent/20 text-accent">
                          {waterMetrics.efficiencyRate?.trend ?? "--"}
                        </Badge>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Cost Savings</p>
                        <p className="text-xs text-accent font-medium mb-2">ఖర్చు ఆదా</p>
                        <p className="text-lg font-bold text-primary">
                          {waterMetrics.costSavings?.currency ?? ""}{waterMetrics.costSavings?.value ?? "--"}
                        </p>
                        <Badge className="bg-accent/20 text-accent">
                          {waterMetrics.costSavings?.trend ?? "--"}
                        </Badge>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Soil Moisture</p>
                        <p className="text-xs text-accent font-medium mb-2">మట్టి తేమ</p>
                        <p className="text-lg font-bold text-primary">
                          {waterMetrics.soilMoisture?.value ?? "--"}%
                        </p>
                        <Badge className={
                          waterMetrics.soilMoisture?.status === 'optimal' 
                            ? 'bg-success/20 text-success' 
                            : 'bg-accent/20 text-accent'
                        }>
                          {waterMetrics.soilMoisture?.status ?? "--"}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>

                {/* Water Usage Chart Placeholder */}
                <div className="h-64 bg-muted/30 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center mb-6">
                  <div className="text-center">
                    <Droplets className="w-12 h-12 mx-auto mb-2 text-primary" />
                    <p className="font-semibold">Water Usage Analytics</p>
                    <p className="text-sm text-muted-foreground">Weekly consumption chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="agri-card">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Irrigation Schedule | నీటిపారుదల షెడ్యూల్
                </h2>
                
                <div className="space-y-3">
                  {loading.schedule ? (
                    <div className="text-center py-4">Loading irrigation schedule...</div>
                  ) : error.schedule ? (
                    <div className="text-center text-red-600 py-4">{error.schedule}</div>
                  ) : irrigationSchedule.length > 0 ? (
                    irrigationSchedule.map((schedule, index) => (
                      <div key={index} className={`p-4 rounded-lg border flex items-center justify-between ${
                        schedule.status === 'completed' 
                          ? 'bg-success/10 border-success/20' 
                          : 'bg-primary/10 border-primary/20'
                      }`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            schedule.status === 'completed' ? 'bg-success' : 'bg-primary'
                          }`} />
                          <div>
                            <p className="font-semibold">{schedule.day}</p>
                            <p className="text-sm text-muted-foreground">{schedule.time} • {schedule.duration}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{schedule.amount}</p>
                          <p className="text-xs capitalize text-muted-foreground">{schedule.status}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No irrigation scheduled</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Smart Controls & Video */}
          <div className="space-y-6">
            <Card className="agri-card">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Smart Irrigation Video</h2>
                
                <div className="relative">
                  <div className="aspect-video relative rounded-lg overflow-hidden">
                    <Image 
                      src="/irrigation-realistic.jpg"
                      alt="Smart drip irrigation system in action"
                      fill
                      className="object-cover"
                    />
                    
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                      <Button 
                        size="lg" 
                        className="bg-white/90 hover:bg-white text-black"
                      >
                        <PlayCircle className="w-6 h-6 mr-2" />
                        Watch Live Demo
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20">
                  <p className="font-semibold text-sm">Live System Status</p>
                  <p className="text-xs text-muted-foreground">All zones operational</p>
                </div>
              </CardContent>
            </Card>

            <Card className="agri-card">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Water Management</h2>
                
                <div className="space-y-4">
                  <Button 
                    onClick={onSchedulingClick}
                    className="w-full agri-button-primary"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Irrigation Scheduling
                  </Button>
                  
                  <Button 
                    onClick={onEquipmentClick}
                    variant="outline"
                    className="w-full"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Equipment Integration
                  </Button>
                  
                  <Button 
                    onClick={onAlertsClick}
                    variant="outline"
                    className="w-full"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    SMS/IVR Alerts
                  </Button>
                  
                  <Button 
                    onClick={onComplianceClick}
                    variant="outline"
                    className="w-full"
                  >
                    <Gauge className="w-4 h-4 mr-2" />
                    Compliance Logs
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="agri-card">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Weather Integration</h2>
                
                <div className="space-y-3">
                  {loading.weather ? (
                    <div className="text-center py-4">Loading weather data...</div>
                  ) : error.weather ? (
                    <div className="text-center text-red-600 py-4">{error.weather}</div>
                  ) : weather && (
                    <>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Today's Forecast</span>
                        <span className="font-semibold">
                          {weather.current?.rainProbability != null
                            ? weather.current.rainProbability > 70
                              ? '🌧️'
                              : weather.current.rainProbability > 40
                              ? '🌤️'
                              : weather.current.rainProbability > 10
                              ? '☁️'
                              : '☀️'
                            : '☀️'}, {weather.current?.temperature ?? "--"}°C
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                        <span className="text-sm">Rain Prediction</span>
                        <span className="font-semibold text-primary">
                          {weather.current?.rainProbability != null ? `${weather.current.rainProbability}% chance` : "--% chance"}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                        <span className="text-sm">Auto-Adjustment</span>
                        <span className="font-semibold text-success">
                          {weather.current?.rainProbability != null
                            ? weather.current.rainProbability > 50
                              ? '✓ Reduced'
                              : '✓ Enabled'
                            : '✓ Enabled'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation to AquaGuide Features */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Access AquaGuide Features</h2>
            <p className="text-lg text-muted-foreground">ఆక్వాగైడ్ ఫీచర్లను యాక్సెస్ చేయండి</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Scheduling Card - Callback Navigation */}
            <Card className="agri-card hover:shadow-lg transition-shadow cursor-pointer border-primary/20" onClick={onSchedulingClick}>
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold mb-2">Scheduling</h3>
                <p className="text-sm text-accent font-medium mb-2">షెడ్యూలింగ్</p>
                <p className="text-xs text-muted-foreground">Automated irrigation scheduling</p>
              </CardContent>
            </Card>
            
            {/* Equipment Card - Callback Navigation */}
            <Card className="agri-card hover:shadow-lg transition-shadow cursor-pointer border-secondary/20" onClick={onEquipmentClick}>
              <CardContent className="p-6 text-center">
                <Zap className="w-8 h-8 text-secondary mx-auto mb-3" />
                <h3 className="font-bold mb-2">Equipment</h3>
                <p className="text-sm text-accent font-medium mb-2">పరికరాలు</p>
                <p className="text-xs text-muted-foreground">Smart equipment integration</p>
              </CardContent>
            </Card>
            
            {/* Alerts Card - Callback Navigation */}
            <Card className="agri-card hover:shadow-lg transition-shadow cursor-pointer border-accent/20" onClick={onAlertsClick}>
              <CardContent className="p-6 text-center">
                <AlertCircle className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-bold mb-2">Alerts</h3>
                <p className="text-sm text-accent font-medium mb-2">హెచ్చరికలు</p>
                <p className="text-xs text-muted-foreground">SMS & IVR alert system</p>
              </CardContent>
            </Card>
            
            {/* Compliance Card - Callback Navigation */}
            <Card className="agri-card hover:shadow-lg transition-shadow cursor-pointer border-success/20" onClick={onComplianceClick}>
              <CardContent className="p-6 text-center">
                <Gauge className="w-8 h-8 text-success mx-auto mb-3" />
                <h3 className="font-bold mb-2">Compliance</h3>
                <p className="text-sm text-accent font-medium mb-2">కంప్లైయన్స్</p>
                <p className="text-xs text-muted-foreground">Regulatory compliance logs</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Expert Services Card */}
        <Card className="agri-card mt-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Droplets className="w-8 h-8 text-primary" />
              Need Expert Water Management? | నిపుణుల నీటి నిర్వహణ అవసరమా?
            </CardTitle>
            <CardDescription className="text-lg">
              Connect with certified Agri AI Pilots for professional irrigation system design and management
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              <Image
                src="/irrigation.jpg"
                alt="Professional irrigation management service"
                width={800}
                height={400}
                className="w-full rounded-lg"
              />
            </div>
            
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {loading.experts ? (
                  <div className="col-span-3 text-center py-4">Loading expert information...</div>
                ) : error.experts ? (
                  <div className="col-span-3 text-center text-red-600 py-4">{error.experts}</div>
                ) : experts && (
                  <>
                    <div className="p-4 bg-card rounded-lg border">
                      <div className="text-2xl font-bold text-primary">{experts.count}+</div>
                      <div className="text-sm text-muted-foreground">Irrigation Experts</div>
                    </div>
                    <div className="p-4 bg-card rounded-lg border">
                      <div className="text-2xl font-bold text-success">
                        {experts.availability ? 'Available' : 'Busy'}
                      </div>
                      <div className="text-sm text-muted-foreground">Expert Status</div>
                    </div>
                    <div className="p-4 bg-card rounded-lg border">
                      <div className="text-2xl font-bold text-accent">
                        {experts.nearestDistance.value}{experts.nearestDistance.unit}
                      </div>
                      <div className="text-sm text-muted-foreground">Nearest Expert Distance</div>
                    </div>
                  </>
                )}
              </div>            <Button 
              size="lg" 
              className="agri-button-primary px-8 py-4 text-lg"
              onClick={() => setIsOnboardingOpen(true)}
            >
              <Droplets className="w-5 h-5 mr-2" />
              Appoint Your Water Expert | మీ నీటి నిపుణుడిని నియమించండి
            </Button>
          </CardContent>
        </Card>
        
        {/* Video Section */}
        {AgentVideoSection && (
          <AgentVideoSection
            agentName="AquaGuide"
            agentNameTelugu="నీటిపారుదల"
            videos={[
              {
                title: "Smart Drip Irrigation Setup",
                titleTelugu: "స్మార్ట్ డ్రిప్ నీటిపారుదల సెటప్",
                duration: "11:40",
                type: "demo"
              },
              {
                title: "Water Conservation Techniques", 
                titleTelugu: "నీటి సంరక్షణ పద్ధతులు",
                duration: "9:25",
                type: "tutorial"
              },
              {
                title: "70% Water Savings Achievement",
                titleTelugu: "70% నీటి ఆదా సాధన",
                duration: "8:15",
                type: "case-study"
              }
            ]}
          />
        )}
      </div>

      {/* AgriPilotOnboarding Dialog */}
      {AgriPilotOnboarding && (
        <AgriPilotOnboarding
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          landLocation="Warangal District"
        />
      )}

      <style jsx>{`
        .field-gradient {
          background: linear-gradient(to bottom right, var(--background), 95%, var(--muted));
        }
        .agri-card {
          transition: all 0.3s ease;
        }
        .agri-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1);
        }
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