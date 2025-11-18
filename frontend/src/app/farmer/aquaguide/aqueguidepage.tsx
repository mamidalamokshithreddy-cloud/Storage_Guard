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
  Waves, 
  Filter,
  Video,
  AlertCircle
} from "lucide-react";

// Import components
import AgentVideoSection from "../AgentVideoSection";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek"; 
import AgriPilotOnboarding from "../../admin/components/AgriPilotOnboarding";

// Minimal inline aquaGuideAPI and type to avoid missing module error while preserving existing behavior.
// This will call the same backend routes used elsewhere; adjust paths if your API endpoints differ.
type IrrigationScheduleItem = {
  id: string;
  startTime: string;
  duration: { value: number; unit: string };
  status: string;
  waterAmount: { value: number; unit: string };
};

const aquaGuideAPI = {
  getFields: async (): Promise<Array<{ id: string; name: string }>> => {
    try {
      const res = await fetch('/api/irrigation/plots');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      console.error('aquaGuideAPI.getFields error', err);
      return [];
    }
  },
  getIrrigationSchedule: async (plotId: string): Promise<IrrigationScheduleItem[]> => {
    try {
      const res = await fetch(`/api/irrigation/plots/${plotId}/schedule`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      console.error('aquaGuideAPI.getIrrigationSchedule error', err);
      return [];
    }
  }
};

// Use the current origin as the API base URL on the client; keep a safe fallback for non-window environments.
const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";

// Define services array
const aquaGuideServices = [
  {
    title: "Irrigation System Design",
    titleTelugu: "నీటిపారుదల వ్యవస్థ రూపకల్పన",
    description: "Custom irrigation system planning and design",
    descriptionTelugu: "అనుకూల నీటిపారుదల వ్యవస్థ ప్రణాళిక మరియు రూపకల్పన",
    duration: "2-3 hours",
    price: "₹1,500",
    icon: Zap,
    available: true
  },
  {
    title: "Water Management Consultation",
    titleTelugu: "నీటి నిర్వహణ సలహా",
    description: "Efficient water usage strategies and planning",
    descriptionTelugu: "సమర్థవంతమైన నీటి వినియోగ వ్యూహాలు మరియు ప్రణాళిక",
    duration: "1-2 hours",
    price: "₹800",
    icon: Droplets,
    available: true
  },
  {
    title: "Drip Irrigation Setup",
    titleTelugu: "డ్రిప్ నీటిపారుదల ఏర్పాటు",
    description: "Professional drip irrigation installation guidance",
    descriptionTelugu: "వృత్తిపరమైన డ్రిప్ నీటిపారుదల వ్యవస్థాపన మార్గదర్శనం",
    duration: "3-4 hours",
    price: "₹2,000",
    icon: Filter,
    available: true
  },
  {
    title: "Water Quality Testing",
    titleTelugu: "నీటి నాణ్యత పరీక్ష",
    description: "Comprehensive water quality analysis and solutions",
    descriptionTelugu: "సమగ్ర నీటి నాణ్యత విశ్లేషణ మరియు పరిష్కారాలు",
    duration: "1 hour",
    price: "₹600",
    icon: Gauge,
    available: true
  },
  {
    title: "Drainage System Planning",
    titleTelugu: "డ్రైనేజ్ వ్యవస్థ ప్రణాళిక",
    description: "Effective drainage solutions for water logging",
    descriptionTelugu: "నీటి జలుపు కోసం ప్రభావవంతమైన డ్రైనేజ్ పరిష్కారాలు",
    duration: "2 hours",
    price: "₹1,000",
    icon: Waves,
    available: true
  },
  {
    title: "Live Video Consultation",
    titleTelugu: "ప్రత్యక్ష వీడియో సలహా",
    description: "Instant expert guidance on irrigation queries",
    descriptionTelugu: "నీటిపారుదల ప్రశ్నలపై తక్షణ నిపుణుల మార్గదర్శనం",
    duration: "30 minutes",
    price: "₹400",
    icon: Video,
    available: true
  }
];

// Remove static schedule data - will use dynamic data from API

const waterMetrics = [
  { label: "Total Water Used", value: "1,250 L", telugu: "మొత్తం నీరు", trend: "+5%" },
  { label: "Efficiency Rate", value: "87%", telugu: "సామర్థ్య రేటు", trend: "+12%" },
  { label: "Cost Savings", value: "₹2,400", telugu: "ఖర్చు ఆదా", trend: "+8%" },
  { label: "Soil Moisture", value: "22%", telugu: "మట్టి తేమ", trend: "optimal" },
];

interface AquaGuidePageProps {
  onSchedulingClick?: () => void;
  onEquipmentClick?: () => void;
  onAlertsClick?: () => void;
  onComplianceClick?: () => void;
}

export default function AquaGuidePage({
  onSchedulingClick,
  onEquipmentClick,
  onAlertsClick,
  onComplianceClick
}: AquaGuidePageProps = {}) {
  // const router = useRouter();
  // const pathname = usePathname();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [irrigationSchedule, setIrrigationSchedule] = useState<Array<{
    day: string;
    time: string;
    duration: string;
    status: string;
    amount: string;
  }>>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);

  // Helper function to format date to day name
  const formatDateToDayName = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Helper function to format time
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  // Fetch irrigation schedule data
  useEffect(() => {
    console.log('🚀 useEffect triggered for irrigation schedule');
    
    // Test if this even runs
    setTimeout(() => {
      alert('🚀 useEffect DEFINITELY running after 1 second!');
    }, 1000);
    
    const fetchScheduleData = async () => {
      try {
        setIsLoadingSchedule(true);
        console.log('🔍 Fetching irrigation schedule...');
        
        // First get the available plots to find a valid plot ID
        console.log('📋 Getting plots from API...');
        const plots = await aquaGuideAPI.getFields();
        console.log('📊 Available plots:', plots);
        
        if (!plots || plots.length === 0) {
          console.log('⚠️ No plots available, using fallback schedule');
          throw new Error('No plots available');
        }
        
        // Use the first available plot
        const currentPlot = plots[0];
        const plotId = currentPlot.id;
        console.log('� Using plot:', currentPlot.name, 'with ID:', plotId);
  console.log('🌐 Making API call to:', `${BASE_URL}/api/irrigation/plots/${plotId}/schedule`);
        const scheduleData = await aquaGuideAPI.getIrrigationSchedule(plotId);
        console.log('✅ Schedule data received:', scheduleData);
        
        // Transform API data to match existing component format
        console.log('🔄 Transforming schedule data, received items:', scheduleData.length);
        const formattedSchedule = scheduleData.map((item: IrrigationScheduleItem, index: number) => {
          console.log(`📊 Processing item ${index}:`, item);
          const result = {
            day: formatDateToDayName(item.startTime),
            time: formatTime(item.startTime),
            duration: `${item.duration.value} ${item.duration.unit}`,
            status: item.status === 'in-progress' ? 'completed' : item.status,
            amount: `${item.waterAmount.value}${item.waterAmount.unit}`
          };
          console.log(`✅ Formatted item ${index}:`, result);
          return result;
        });
        
        console.log('🎯 Final formatted schedule:', formattedSchedule);
        setIrrigationSchedule(formattedSchedule);
      } catch (error) {
        console.error('❌ Failed to fetch irrigation schedule:', error);
        console.log('🔄 Using fallback schedule...');
        
        // Show an alert to make the error visible
        alert(`API Error: ${error instanceof Error ? error.message : String(error)}`);
        
        // Fallback to default schedule if API fails
        setIrrigationSchedule([
          { day: "Monday", time: "6:00 AM", duration: "45 min", status: "completed", amount: "25mm" },
          { day: "Wednesday", time: "6:00 AM", duration: "45 min", status: "completed", amount: "25mm" },
          { day: "Friday", time: "6:00 AM", duration: "45 min", status: "scheduled", amount: "25mm" },
          { day: "Sunday", time: "6:00 AM", duration: "45 min", status: "scheduled", amount: "25mm" },
        ]);
      } finally {
        setIsLoadingSchedule(false);
      }
    };

    fetchScheduleData();
  }, []);

  // Add a global function for testing from browser console
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).testScheduleAPI = async () => {
      console.log('🧪 Testing schedule API from browser console...');
      try {
        const testPlotId = "f79f16fd-1cc6-4ac4-b106-7a87b2abbb3a";
        const scheduleData = await aquaGuideAPI.getIrrigationSchedule(testPlotId);
        console.log('✅ Console test: Schedule data received:', scheduleData);
        
        const formattedSchedule = scheduleData.map((item: IrrigationScheduleItem) => ({
          day: formatDateToDayName(item.startTime),
          time: formatTime(item.startTime),
          duration: `${item.duration.value} ${item.duration.unit}`,
          status: item.status === 'in-progress' ? 'completed' : item.status,
          amount: `${item.waterAmount.value}${item.waterAmount.unit}`
        }));
        
        console.log('🎯 Console test: Formatted schedule:', formattedSchedule);
        setIrrigationSchedule(formattedSchedule);
        alert(`✅ Schedule updated via console! ${formattedSchedule.length} items`);
        return formattedSchedule;
      } catch (error) {
        console.error('❌ Console test failed:', error);
        alert(`❌ Console test failed: ${error}`);
      }
    };
    
    console.log('🔧 Added testScheduleAPI() function to window - call it from browser console');
  }, []);

  return (
    <div className="min-h-screen field-gradient">
      <AgriChatAgent />
      <AgriAIPilotSidePeek 
        agentType="AquaGuide"
        agentName="AquaGuide"
        agentNameTelugu="నీటిపారుదల"
        services={aquaGuideServices}
      />
      <div className="max-w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Irrigation Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="agri-card">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-primary" />
                  Irrigation Dashboard
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {waterMetrics.map((metric, index) => (
                    <div key={index} className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                      <p className="text-xs text-accent font-medium mb-2">{metric.telugu}</p>
                      <p className="text-lg font-bold text-primary">{metric.value}</p>
                      <Badge className={
                        metric.trend === 'optimal' 
                          ? 'bg-success/20 text-success' 
                          : 'bg-accent/20 text-accent'
                      }>
                        {metric.trend}
                      </Badge>
                    </div>
                  ))}
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
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      // Force update with test data to verify the mechanism works
                      console.log('🧪 FORCING TEST UPDATE...');
                      const testSchedule = [
                        { day: "TEST Monday", time: "6:00 AM", duration: "45 min", status: "completed", amount: "25.0mm" },
                        { day: "TEST Wednesday", time: "6:00 AM", duration: "45 min", status: "scheduled", amount: "25.0mm" },
                        { day: "TEST Friday", time: "6:00 AM", duration: "45 min", status: "scheduled", amount: "25.0mm" },
                        { day: "TEST Sunday", time: "6:00 AM", duration: "45 min", status: "scheduled", amount: "25.0mm" },
                      ];
                      setIrrigationSchedule(testSchedule);
                      alert('✅ FORCED UPDATE - If you see "TEST" in schedule, React state is working!');
                    }}
                  >
                    Force Test
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default" 
                    onClick={async () => {
                      try {
                        alert('🔄 Starting API test...');
                        const response = await fetch(`${BASE_URL}/api/irrigation/plots/f79f16fd-1cc6-4ac4-b106-7a87b2abbb3a/schedule`);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        const data = await response.json();
                        
                        const apiSchedule = [
                          { day: "API Monday", time: "6:00 AM", duration: "45 min", status: "completed", amount: "25.0mm" },
                          { day: "API Wednesday", time: "6:00 AM", duration: "45 min", status: "scheduled", amount: "25.0mm" },
                        ];
                        setIrrigationSchedule(apiSchedule);
                        alert(`✅ API SUCCESS! Got ${data.length} items from backend`);
                      } catch (err) {
                        alert(`❌ API FAILED: ${err}`);
                      }
                    }}
                  >
                    API Test
                  </Button>
                </h2>
                
                <div className="space-y-3">
                  {isLoadingSchedule ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-4 rounded-lg border bg-gray-100 animate-pulse">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-3 h-3 rounded-full bg-gray-300" />
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-300 rounded w-20" />
                                <div className="h-3 bg-gray-300 rounded w-32" />
                              </div>
                            </div>
                            <div className="text-right space-y-2">
                              <div className="h-4 bg-gray-300 rounded w-12" />
                              <div className="h-3 bg-gray-300 rounded w-16" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
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
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Today's Forecast</span>
                    <span className="font-semibold">☀️ Sunny, 32°C</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                    <span className="text-sm">Rain Prediction</span>
                    <span className="font-semibold text-primary">20% chance</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                    <span className="text-sm">Auto-Adjustment</span>
                    <span className="font-semibold text-success">✓ Enabled</span>
                  </div>
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
              <div className="p-4 bg-card rounded-lg border">
                <div className="text-2xl font-bold text-primary">22+</div>
                <div className="text-sm text-muted-foreground">Irrigation Experts</div>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <div className="text-2xl font-bold text-success">Smart</div>
                <div className="text-sm text-muted-foreground">IoT Integration</div>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <div className="text-2xl font-bold text-accent">1.5km</div>
                <div className="text-sm text-muted-foreground">Nearest Expert Distance</div>
              </div>
            </div>

            <Button 
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
