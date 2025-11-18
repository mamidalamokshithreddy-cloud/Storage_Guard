'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import Image from "next/image";
import { 
  ArrowRight, 
  TestTube, 
  Beaker, 
  TrendingUp, 
  AlertCircle,
  Droplets, 
  FileCheck,
  Video
} from "lucide-react";

// Import components
import AgentVideoSection from "../AgentVideoSection";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import AgriChatAgent from "../AgriChatAgent";
import AgriPilotOnboarding from "../../admin/components/AgriPilotOnboarding";
import CompanyListingPage from "./CompanyListingPage";

// Define services array
const soilSenseServices = [
  {
    title: "Soil Testing Consultation",
    titleTelugu: "మట్టి పరీక్ష సలహా",
    description: "Professional soil sample collection and analysis",
    descriptionTelugu: "వృత్తిపరమైన మట్టి నమూనా సేకరణ మరియు విశ్లేషణ",
    duration: "2-3 hours",
    price: "₹1,000",
    icon: TestTube,
    available: true
  },
  {
    title: "pH Level Analysis",
    titleTelugu: "పిహెచ్ స్థాయి విశ్లేషణ",
    description: "Detailed pH testing and correction guidance",
    descriptionTelugu: "వివరణాత్మక పిహెచ్ పరీక్ష మరియు దిద్దుబాటు మార్గదర్శనం",
    duration: "1 hour",
    price: "₹600",
    icon: Beaker,
    available: true
  },
  {
    title: "Nutrient Deficiency Assessment",
    titleTelugu: "పోషకాహార లోపం అంచనా",
    description: "Identify missing nutrients and supplementation plan",
    descriptionTelugu: "తప్పిపోయిన పోషకాలను గుర్తించి అనుపూరక ప్రణాళిక",
    duration: "1-2 hours",
    price: "₹800",
    icon: TrendingUp,
    available: true
  },
  {
    title: "Soil Health Improvement Guide",
    titleTelugu: "మట్టి ఆరోగ్య మెరుగుదల గైడ్",
    description: "Complete soil health enhancement strategies",
    descriptionTelugu: "పూర్తి మట్టి ఆరోగ్య మెరుగుదల వ్యూహాలు",
    duration: "2 hours",
    price: "₹1,200",
    icon: FileCheck,
    available: true
  },
  {
    title: "Organic Matter Management",
    titleTelugu: "సేంద్రీయ పదార్థాల నిర్వహణ",
    description: "Expert guidance on organic matter enhancement",
    descriptionTelugu: "సేంద్రీయ పదార్థాల మెరుగుదలపై నిపుణుల మార్గదర్శనం",
    duration: "1.5 hours",
    price: "₹700",
    icon: Droplets,
    available: true
  },
  {
    title: "Live Video Consultation",
    titleTelugu: "ప్రత్యక్ష వీడియో సలహా",
    description: "Instant expert guidance on soil health queries",
    descriptionTelugu: "మట్టి ఆరోగ్య ప్రశ్నలపై తక్షణ నిపుణుల మార్గదర్శనం",
    duration: "30 minutes",
    price: "₹400",
    icon: Video,
    available: true
  }
];

const soilData = [
  { parameter: "pH Level", value: 6.8, ideal: "6.0-7.5", status: "good", telugu: "pH స్థాయి" },
  { parameter: "Nitrogen (N)", value: 65, ideal: "60-80", status: "good", telugu: "నత్రజని" },
  { parameter: "Phosphorus (P)", value: 45, ideal: "40-60", status: "good", telugu: "భాస్వరం" },
  { parameter: "Potassium (K)", value: 280, ideal: "250-400", status: "good", telugu: "పొటాష్" },
  { parameter: "Organic Matter", value: 2.1, ideal: "2.0-4.0", status: "good", telugu: "సేంద్రీయ పదార్థం" },
  { parameter: "Moisture", value: 18, ideal: "15-25", status: "good", telugu: "తేమ" },
];

interface SoilSensePageProps {
  onTestRequestClick?: () => void;
  onDroneScheduleClick?: () => void;
  onHealthCardClick?: () => void;
  onLabIntegrationClick?: () => void;
}

export default function SoilSensePage({ 
  onTestRequestClick,
  onDroneScheduleClick,
  onHealthCardClick,
  onLabIntegrationClick 
}: SoilSensePageProps = {}) {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'satellite' | 'field' | 'drone-lab'>('main');
  
  // API Integration states
  const [plots, setPlots] = useState<Array<{ id: string; plot_name?: string | null }>>([]);
  const [loadingPlots, setLoadingPlots] = useState<boolean>(false);
  const [plotsError, setPlotsError] = useState<string | null>(null);
  const [selectedPlotId, setSelectedPlotId] = useState<string | undefined>(undefined);
  const [recommendations, setRecommendations] = useState<Array<{ priority?: string; title: string; description?: string; message?: string; type?: string; action?: string; impact?: string }>>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const hasInitializedSelection = useRef(false);

  // Fetch available plots for dropdown
  const fetchPlots = async (signal?: AbortSignal) => {
    try {
      setLoadingPlots(true);
      setPlotsError(null);
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
      const url = `${base}/plots`;
      console.debug("SoilSensePage: fetching plots from", url);
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`Failed to load plots (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setPlots(list);
      // Auto-select first available plot if none selected
      if (list.length > 0 && !selectedPlotId && !hasInitializedSelection.current) {
        setSelectedPlotId(list[0].id);
        hasInitializedSelection.current = true;
      }
    } catch (e: any) {
      // Don't log or set error for abort signals (normal in React StrictMode)
      if (e?.name !== "AbortError") {
        console.error("SoilSensePage: failed to fetch plots", e);
        setPlots([]);
        setPlotsError(e?.message || "Failed to load plots");
      }
    } finally {
      setLoadingPlots(false);
    }
  };
  
  // Fetch recommendations for selected plot
  const fetchRecommendations = async (plotId: string, signal?: AbortSignal) => {
    try {
      setLoadingRecommendations(true);
      setRecommendationsError(null);
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
      const url = `${base}/recommendations?plot_id=${encodeURIComponent(plotId)}`;
      console.debug("SoilSensePage: fetching recommendations from", url);
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`Failed to load recommendations (${res.status})`);
      const data = await res.json();
      setRecommendations(Array.isArray(data?.recommendations) ? data.recommendations : []);
    } catch (e: any) {
      console.error("SoilSensePage: recommendations fetch error", e);
      if (e?.name !== "AbortError") {
        setRecommendationsError(e?.message || "Failed to load recommendations");
        setRecommendations([]);
      }
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Load plots on component mount
  useEffect(() => {
    const controller = new AbortController();
    fetchPlots(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch recommendations when plot is selected
  useEffect(() => {
    if (!selectedPlotId) return;
    const controller = new AbortController();
    fetchRecommendations(selectedPlotId, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlotId]);

  // Handle navigation to company listings
  const handleCompanyListingNavigation = (testingType: 'satellite' | 'field' | 'drone-lab') => {
    setCurrentView(testingType);
  };

  // Handle booking service
  const handleBookService = (companyId: string, packageId?: string) => {
    console.log('Booking service:', companyId, packageId);
    // Here you would implement the booking logic
    alert(`Booking service for company: ${companyId}`);
  };

  // Handle back navigation
  const handleBackToMain = () => {
    setCurrentView('main');
  };

  // If showing company listing, render that component
  if (currentView !== 'main') {
    return (
      <CompanyListingPage
        testingType={currentView}
        onBack={handleBackToMain}
        onBookService={handleBookService}
        onNavigateToHealthCard={onHealthCardClick}
      />
    );
  }

  return (
    <div className="h-full w-full">
      <AgriChatAgent />
      <AgriAIPilotSidePeek
        agentType="SoilSense"
        agentName="Soil Testing"
        agentNameTelugu="మట్టి పరీక్ష"
        services={soilSenseServices}
      />
      <div className="p-6 space-y-8">
        {/* Three-Stage Soil Testing Process */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Comprehensive Soil Testing Process</h2>
            <p className="text-lg text-muted-foreground mb-2">పూర్తి మట్టి పరీక్ష ప్రక్రియ</p>
            <p className="text-base text-accent">Advanced three-stage soil analysis for optimal crop cultivation</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stage 1: Satellite Analysis */}
            <Card 
              className="agri-card cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={() => handleCompanyListingNavigation('satellite')}
            >
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-primary">Satellite Analysis</h3>
                  <p className="text-sm text-accent font-medium">ఉపగ్రహ విశ్లేషణ</p>
                </div>
                
                <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
                  <Image 
                    src="/satellite-soil-analysis.jpg"
                    alt="Satellite soil analysis"
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-sm">Remote Soil Mapping</h4>
                      <p className="text-xs text-muted-foreground">High-resolution satellite imagery for soil health assessment</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-sm">Moisture & Nutrient Zones</h4>
                      <p className="text-xs text-muted-foreground">Identify different soil zones and moisture levels</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-sm">Area Coverage Analysis</h4>
                      <p className="text-xs text-muted-foreground">Complete farm area soil condition overview</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-semibold text-primary">✓ Completed: March 12, 2024</p>
                  <p className="text-xs text-muted-foreground">Coverage: 15.5 acres analyzed</p>
                </div>
              </CardContent>
            </Card>

            {/* Stage 2: Portable Testing */}
            <Card 
              className="agri-card cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={() => handleCompanyListingNavigation('field')}
            >
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-primary">Field Testing</h3>
                  <p className="text-sm text-primary font-medium">క్షేత్ర పరీక్ష</p>
                </div>
                
                <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
                  <Image 
                    src="/portable-soil-testing.jpg"
                    alt="Portable soil testing equipment"
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-sm">Portable pH Meters</h4>
                      <p className="text-xs text-muted-foreground">Real-time soil pH measurement at field level</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-sm">Nutrient Analyzers</h4>
                      <p className="text-xs text-muted-foreground">NPK levels and micronutrient detection</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-sm">Moisture Detection</h4>
                      <p className="text-xs text-muted-foreground">Instant soil moisture content analysis</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-secondary/10 rounded-lg">
                  <p className="text-sm font-semibold text-secondary">⏳ In Progress</p>
                  <p className="text-xs text-muted-foreground">Testing: 25 field locations</p>
                </div>
              </CardContent>
            </Card>

            {/* Stage 3: Drone + Lab Analysis */}
            <Card 
              className="agri-card cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={() => handleCompanyListingNavigation('drone-lab')}
            >
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-accent">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-accent">Drone + Lab Analysis</h3>
                  <p className="text-sm text-accent font-medium">డ్రోన్ + ల్యాబ్ విశ్లేషణ</p>
                </div>
                
                <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
                  <Image 
                    src="/drone-soil-lab-testing.jpg"
                    alt="Drone soil testing and lab analysis"
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-sm">Precision Soil Spots</h4>
                      <p className="text-xs text-muted-foreground">Drone-guided precise soil sampling locations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-sm">Professional Lab Testing</h4>
                      <p className="text-xs text-muted-foreground">Comprehensive soil analysis at certified labs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-sm">Detailed Report</h4>
                      <p className="text-xs text-muted-foreground">Complete soil health analysis and recommendations</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                  <p className="text-sm font-semibold text-accent">📋 Scheduled</p>
                  <p className="text-xs text-muted-foreground">Lab testing: March 18, 2024</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Navigation to SoilSense Features */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Access SoilSense Features</h2>
            <p className="text-lg text-muted-foreground">సాయిల్‌సెన్స్ ఫీచర్లను యాక్సెస్ చేయండి</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              className="agri-card hover:shadow-lg transition-shadow cursor-pointer border-primary/20"
              onClick={onTestRequestClick}
            >
              <CardContent className="p-6 text-center">
                <TestTube className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold mb-2">Request Test</h3>
                <p className="text-sm text-accent font-medium mb-2">పరీక్ష అభ్యర్థన</p>
                <p className="text-xs text-muted-foreground">Schedule comprehensive soil & water testing</p>
              </CardContent>
            </Card>
            
            <Card 
              className="agri-card hover:shadow-lg transition-shadow cursor-pointer border-secondary/20"
              onClick={onDroneScheduleClick}
            >
              <CardContent className="p-6 text-center">
                <ArrowRight className="w-8 h-8 text-secondary mx-auto mb-3" />
                <h3 className="font-bold mb-2">Drone Schedule</h3>
                <p className="text-sm text-accent font-medium mb-2">డ్రోన్ షెడ్యూల్</p>
                <p className="text-xs text-muted-foreground">Book precision scanning & sample pickup</p>
              </CardContent>
            </Card>
            
            <Card 
              className="agri-card hover:shadow-lg transition-shadow cursor-pointer border-accent/20"
              onClick={onHealthCardClick}
            >
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-bold mb-2">Health Card</h3>
                <p className="text-sm text-accent font-medium mb-2">ఆరోగ్య కార్డ్</p>
                <p className="text-xs text-muted-foreground">View historical trends & AI analysis</p>
              </CardContent>
            </Card>
            
            <Card 
              className="agri-card hover:shadow-lg transition-shadow cursor-pointer border-success/20"
              onClick={onLabIntegrationClick}
            >
              <CardContent className="p-6 text-center">
                <Beaker className="w-8 h-8 text-success mx-auto mb-3" />
                <h3 className="font-bold mb-2">Lab Reports</h3>
                <p className="text-sm text-accent font-medium mb-2">ల్యాబ్ రిపోర్ట్లు</p>
                <p className="text-xs text-muted-foreground">Access certified lab results & reports</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Soil Health Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="agri-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Beaker className="w-6 h-6 text-primary" />
                    Soil Health Report
                  </h2>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-semibold">March 15, 2024</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {soilData.map((item, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg bg-muted/30">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-sm">{item.parameter}</h3>
                        <Badge className={
                          item.status === 'good' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                        }>
                          {item.status === 'good' ? '✓ Good' : '⚠ Alert'}
                        </Badge>
                      </div>
                      <p className="text-xs text-accent font-medium mb-2">{item.telugu}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Current: {item.value}</span>
                          <span className="text-muted-foreground">Ideal: {item.ideal}</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="agri-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Recommendations | సిఫార్సులు
                  </h2>
                  
                  {/* Plot Selection */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Plot:</label>
                    <select
                      className="px-3 py-1 rounded border bg-background text-sm min-w-[200px]"
                      value={selectedPlotId ?? ""}
                      onChange={(e) => setSelectedPlotId(e.target.value || undefined)}
                      disabled={loadingPlots}
                    >
                      {loadingPlots ? (
                        <option value="" disabled>
                          Loading plots...
                        </option>
                      ) : (
                        <>
                          <option value="" disabled={plots.length > 0}>
                            {plots.length > 0 ? "Select a plot" : "No plots available"}
                          </option>
                          {plots.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.plot_name || p.id}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {plotsError && (
                      <div className="text-xs text-destructive">
                        Error loading plots
                        <button className="underline ml-1" onClick={() => fetchPlots()}>
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Recommendations Content */}
                {!selectedPlotId ? (
                  <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
                    Please select a plot to view recommendations
                  </div>
                ) : loadingRecommendations ? (
                  <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
                    Loading recommendations...
                  </div>
                ) : recommendationsError ? (
                  <div className="p-4 text-center text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                    Failed to load recommendations: {recommendationsError}
                    <button className="block mx-auto mt-2 underline" onClick={() => selectedPlotId && fetchRecommendations(selectedPlotId)}>
                      Try Again
                    </button>
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
                    No recommendations available for this plot
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec, index) => {
                      // Map backend type to UI styling
                      const getTypeColor = (type?: string) => {
                        switch (type) {
                          case "success": return "bg-success/10 border-success/20 text-success";
                          case "primary": return "bg-primary/10 border-primary/20 text-primary";
                          case "accent": return "bg-accent/10 border-accent/20 text-accent";
                          case "warning": return "bg-warning/10 border-warning/20 text-warning";
                          case "muted": return "bg-muted/10 border-muted/20 text-muted-foreground";
                          default: return "bg-primary/10 border-primary/20 text-primary";
                        }
                      };

                      const getPriorityColor = (priority?: string) => {
                        switch (priority) {
                          case 'high': return 'bg-destructive/10 border-destructive/20 text-destructive';
                          case 'medium': return 'bg-warning/10 border-warning/20 text-warning';
                          case 'low': return 'bg-success/10 border-success/20 text-success';
                          default: return getTypeColor(rec.type);
                        }
                      };

                      return (
                        <div 
                          key={index} 
                          className={`p-4 rounded-lg border ${rec.priority ? getPriorityColor(rec.priority) : getTypeColor(rec.type)}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-sm">{rec.title}</h3>
                            {rec.priority && (
                              <Badge className="text-xs">
                                {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)} Priority
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">
                            {rec.message || rec.description || "No description available"}
                          </p>
                          {(rec.action || rec.impact) && (
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                              {rec.action && (
                                <div className="text-xs">
                                  <span className="font-semibold">Action: </span>
                                  <span className="text-muted-foreground">{rec.action}</span>
                                </div>
                              )}
                              {rec.impact && (
                                <div className="text-xs">
                                  <span className="font-semibold">Impact: </span>
                                  <span className="text-muted-foreground">{rec.impact}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lab Integration & Partners */}
          <div className="space-y-6">
            <Card className="agri-card">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Beaker className="w-5 h-5 text-primary" />
                  Lab Analysis
                </h2>
                
                <div className="space-y-4">
                  <div className="aspect-video relative rounded-lg overflow-hidden">
                    <Image 
                      src="/soil-analysis.jpg"
                      alt="Soil analysis laboratory"
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="font-semibold">Lab Test Results</p>
                    <p className="text-sm text-muted-foreground">Professional analysis completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="agri-card">
              <CardHeader>
                <CardTitle>Lab Partners</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border border-border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">AgriLab Solutions</p>
                    <p className="text-xs text-muted-foreground">Certified Lab</p>
                  </div>
                  <Button size="sm" variant="outline">Contact</Button>
                </div>
                
                <div className="p-3 border border-border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Soil Health Institute</p>
                    <p className="text-xs text-muted-foreground">Government Certified</p>
                  </div>
                  <Button size="sm" variant="outline">Contact</Button>
                </div>
                
                <div className="p-3 border border-border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Krishi Vigyan Kendra</p>
                    <p className="text-xs text-muted-foreground">Extension Center</p>
                  </div>
                  <Button size="sm" variant="outline">Contact</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Expert Services Card */}
        <Card className="agri-card mt-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <TestTube className="w-8 h-8 text-primary" />
              Need Expert Soil Analysis? | నిపుణుల మట్టి విశ్లేషణ అవసరమా?
            </CardTitle>
            <CardDescription className="text-lg">
              Connect with certified Agri AI Pilots for professional soil testing and analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              <Image
                src="/soil-testing-realistic.jpg"
                alt="Professional soil testing service"
                width={800}
                height={400}
                className="w-full rounded-lg"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-card rounded-lg border">
                <div className="text-2xl font-bold text-primary">12+</div>
                <div className="text-sm text-muted-foreground">Certified Soil Experts</div>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <div className="text-2xl font-bold text-success">Lab</div>
                <div className="text-sm text-muted-foreground">Certified Testing</div>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <div className="text-2xl font-bold text-accent">1.8km</div>
                <div className="text-sm text-muted-foreground">Nearest Expert Distance</div>
              </div>
            </div>

            <Button 
              size="lg" 
              className="agri-button-primary px-8 py-4 text-lg"
              onClick={() => setIsOnboardingOpen(true)}
            >
              <TestTube className="w-5 h-5 mr-2" />
              Appoint Your Soil Expert | మీ మట్టి నిపుణుడిని నియమించండి
            </Button>
          </CardContent>
        </Card>
        
        {/* Video Section */}
        {AgentVideoSection && (
          <AgentVideoSection
            agentName="SoilSense"
            agentNameTelugu="మట్టి విశ్లేషణ"
            videos={[
              {
                title: "Soil Sampling Techniques",
                titleTelugu: "మట్టి నమూనా సేకరణ పద్ధతులు",
                duration: "8:30",
                type: "demo"
              },
              {
                title: "Lab Testing Process",
                titleTelugu: "ప్రయోగశాల పరీక్ష ప్రక్రియ", 
                duration: "12:15",
                type: "tutorial"
              },
              {
                title: "Success Story: 40% Yield Increase",
                titleTelugu: "విజయ కథ: 40% దిగుబడి పెరుగుదల",
                duration: "6:45",
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
