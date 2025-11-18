'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "../ui/card";
import { Badge } from "../ui/badge";
import Image from "next/image";
import {
  Sprout,
  Cloud,
  Thermometer,
  Calendar,
  Star,
  Leaf,
  CloudRain,
  RotateCcw,
  ShieldCheck,
  Video,
  AlertCircle,
  Brain,
  ShoppingCart,
  Droplets,
  Target,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Import components
import AgentVideoSection from "../AgentVideoSection";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import AgriChatAgent from "../AgriChatAgent";
import AgriPilotOnboarding from "../../admin/components/AgriPilotOnboarding";

// Define services array
const seedPlannerServices = [
  {
    title: "Seed Variety Selection",
    titleTelugu: "విత్తన రకాల ఎంపిక",
    description: "Expert guidance on best seed varieties for your land",
    descriptionTelugu: "మీ భూమికి అత్యుత్తమ విత్తన రకాలపై నిపుణుల మార్గదర్శనం",
    duration: "1-2 hours",
    price: "₹800",
    icon: Leaf,
    available: true
  },
  {
    title: "Planting Schedule Planning",
    titleTelugu: "నాట్య షెడ్యూల్ ప్రణాళిక",
    description: "Optimal timing for seed sowing based on weather",
    descriptionTelugu: "వాతావరణం ఆధారంగా విత్తనాల వేయడానికి అనుకూల సమయం",
    duration: "1 hour",
    price: "₹600",
    icon: Calendar,
    available: true
  },
  {
    title: "Weather Pattern Analysis",
    titleTelugu: "వాతావరణ నమూనా విశ్లేషణ",
    description: "Weather-based crop planning and risk assessment",
    descriptionTelugu: "వాతావరణ ఆధారిత పంట ప్రణాళిక మరియు రిస్క్ అంచనా",
    duration: "1.5 hours",
    price: "₹700",
    icon: CloudRain,
    available: true
  },
  {
    title: "Crop Rotation Planning",
    titleTelugu: "పంట భ్రమణ ప్రణాళిక",
    description: "Strategic crop rotation for soil health and yield",
    descriptionTelugu: "మట్టి ఆరోగ్యం మరియు దిగుబడి కోసం వ్యూహాత్మక పంట భ్రమణ",
    duration: "2 hours",
    price: "₹1,000",
    icon: RotateCcw,
    available: true
  },
  {
    title: "Seed Quality Assessment",
    titleTelugu: "విత్తన నాణ్యత అంచనా",
    description: "Testing and verification of seed quality and viability",
    descriptionTelugu: "విత్తన నాణ్యత మరియు జీవనశీలత పరీక్ష మరియు ధృవీకరణ",
    duration: "1 hour",
    price: "₹500",
    icon: ShieldCheck,
    available: true
  },
  {
    title: "Live Video Consultation",
    titleTelugu: "ప్రత్యక్ష వీడియో సలహా",
    description: "Instant expert guidance on seed planning queries",
    descriptionTelugu: "విత్తన ప్రణాళిక ప్రశ్నలపై తక్షణ నిపుణుల మార్గదర్శనం",
    duration: "30 minutes",
    price: "₹400",
    icon: Video,
    available: true
  }
];

// Sample video data
const sampleVideos = [
  {
    title: "SeedPlanner Demo Overview",
    titleTelugu: "విత్తన ప్లానర్ డెమో ప్రదర్శన",
    duration: "3:45",
    type: "demo" as const
  },
  {
    title: "Crop Selection Tutorial",
    titleTelugu: "పంట ఎంపిక ట్యుటోరియల్",
    duration: "8:20",
    type: "tutorial" as const
  },
  {
    title: "Success Story: Cotton Farmer",
    titleTelugu: "విజయ కథ: పత్తి రైతు",
    duration: "5:15",
    type: "case-study" as const
  }
];

interface SeedPlannerPageProps {
  onCropPlanningClick?: () => void;
  onProcurementClick?: () => void;
  onSowingGuideClick?: () => void;
  onAquaGuideClick?: () => void;
}

// Crop icon mapper based on crop name
const getCropIcon = (cropName: string): string => {
  const name = cropName.toLowerCase();
  const iconMap: Record<string, string> = {
    rice: '🌾',
    wheat: '🌾',
    maize: '🌽',
    corn: '🌽',
    cotton: '🌱',
    sugarcane: '🎋',
    chickpea: '🫘',
    pigeonpea: '🫘',
    jute: '🌿',
    mungbean: '🫘',
    soybean: '🫘',
    groundnut: '🥜',
    lentil: '🫘',
    coffee: '☕',
    tea: '🍵',
    coconut: '🥥',
    banana: '🍌',
    mango: '🥭',
    apple: '🍎',
    grapes: '🍇',
    pomegranate: '🍎',
    papaya: '🍈',
    watermelon: '🍉',
    tomato: '🍅',
    potato: '🥔',
    onion: '🧅',
    garlic: '🧄',
    chili: '🌶️',
    pepper: '🫑',
    beans: '🫘',
    peas: '🫛',
    orange: '🍊',
    lemon: '🍋',
    grape: '🍇',
    pineapple: '🍍',
    strawberry: '🍓',
  };
  
  // Try exact match
  if (iconMap[name]) return iconMap[name];
  
  // Try partial match
  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key) || key.includes(name)) return icon;
  }
  
  // Default
  return '🌱';
};

export default function SeedPlannerPage({
  onCropPlanningClick,
  onProcurementClick,
  onSowingGuideClick,
  onAquaGuideClick
}: SeedPlannerPageProps = {}) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

  // Plot selection state (we'll fetch plots from backend and user selects one)
  const [plots, setPlots] = useState<Array<{id:string,name:string,area?:number}>>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  // Removed unused plotSoilSummary state

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [recommendedCrops, setRecommendedCrops] = useState<any[]>([]);
  const [currentConditions, setCurrentConditions] = useState<{ temperature?: number; humidity?: number; description?: string; rainfall?: string } | null>(null);
  
  // Input Analysis Data from backend (soil data from form submission + weather from API)
  const [submittedSoilData, setSubmittedSoilData] = useState<any>(null);

  // Load latest recommendation from backend on mount
  useEffect(() => {
    fetchLatestRecommendation();
    fetchPlots();
  }, []); // Empty dependency array since functions have no external dependencies

  const fetchLatestRecommendation = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/recommendations/latest`);
      if (!res.ok) {
        // No data available yet
        return;
      }
      const data = await res.json();
      
      if (data.status === 'success') {
        hydrateFromBackend(data);
        
        // Set soil data
        if (data.input_data?.soil_health) {
          setSubmittedSoilData(data.input_data.soil_health);
        }
        
        // Set weather conditions
        if (data.weather_insights?.current) {
          setCurrentConditions(data.weather_insights.current);
        }
      }
    } catch (err) {
      console.warn('Could not load latest recommendation:', err);
    }
  }, []);

  const fetchPlots = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/plots`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.plots) setPlots(data.plots);
    } catch (e) { console.warn('Could not load plots', e); }
  }, []);

  const hydrateFromBackend = (data: any) => {
    try {
      const rec = data?.recommendations;

      // Map crops: primary + up to 2 alternatives
      const primary = rec?.primary_crop;
      const alts = Array.isArray(rec?.alternative_crops) ? rec.alternative_crops.slice(0, 2) : [];

      const toCard = (c: any) => {
        const cropName = (c?.name || '').toString();
        // Fix: confidence is already a decimal (0.2617), multiply by 100 and round to 2 decimals
        const confidenceValue = c?.confidence ?? 0;
        const suitabilityPct = Math.round(confidenceValue * 100 ) / 100; // Rounds to 2 decimal places
        const advantages = Array.isArray(c?.advantages) ? c.advantages : [];
        const market = c?.market_information || {};
        
        return {
          name: cropName.toUpperCase(),
          icon: getCropIcon(cropName),
          confidence: isFinite(suitabilityPct) ? suitabilityPct : 0,
          suitabilityGrade: c?.suitability || c?.suitability_grade || '—',
          advantages,
          // Extra details from crop profile
          variety: c?.variety || '—',
          expectedYield: c?.expected_yield || c?.yield_estimation?.expected_yield || '—',
          investment: c?.investment || '—',
          expectedProfit: c?.expected_profit || c?.profit_margin || '—',
          roi: c?.roi || '—',
          seedRate: c?.seed_rate || '—',
          sowingWindow: c?.sowing_window || '—',
          durationDays: c?.duration_days || c?.duration || '—',
          riskLevel: c?.risk_level || '—',
          // Market info
          currentPrice: market?.current_price || '—',
          priceTrend: market?.price_trend || '—'
        };
      };

      const cards: any[] = [];
      if (primary?.name) cards.push(toCard(primary));
      alts.forEach((a: any) => cards.push(toCard(a)));
      if (cards.length) setRecommendedCrops(cards);
    } catch { }
  };

  const handleNavigation = (type: string) => {
    console.log(`🚀 Button clicked: ${type}`);
    switch (type) {
      case 'CropPlanning':
        console.log('✅ Calling onCropPlanningClick');
        onCropPlanningClick?.();
        break;
      case 'Procurement':
        console.log('✅ Calling onProcurementClick');
        onProcurementClick?.();
        break;
      case 'SowingGuide':
        console.log('✅ Calling onSowingGuideClick');
        onSowingGuideClick?.();
        break;
      case 'aqua guide':
        console.log('✅ Calling onAquaGuideClick');
        onAquaGuideClick?.();
        break;
      default:
        console.log(`❌ Navigation to ${type} not implemented`);
    }
  };

  // Fetch recommendations for a selected plot (calls backend that builds payload from DB)
  const fetchRecommendationsForPlot = async (plotId: string) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
  const res = await fetch(`${API_BASE}/recommendations/plot/${encodeURIComponent(plotId)}`, {
        method: 'POST'
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to fetch recommendations for plot');
      }
      const data = await res.json();
      console.log('✅ Plot recommendations received:', data);

      // Hydrate UI with whatever recommendation structure is returned
      hydrateFromBackend(data);

      // Optionally set a plot-level soil summary for Input Analysis UI
      if (data?.input_data?.soil_health) {
        // setPlotSoilSummary removed as it was unused
        setSubmittedSoilData(data.input_data.soil_health);
      }
      
      // Set weather conditions if available
      if (data?.weather_insights?.current) {
        setCurrentConditions(data.weather_insights.current);
      }

    } catch (e: any) {
      console.error('Error fetching plot recommendations', e);
      setSubmissionError(e?.message || 'Failed to fetch recommendations');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCropSelection = (cropName: string) => {
    // In real implementation, this would store the selected crop
    console.log(`🌱 Crop selected: ${cropName}`);
    // Navigate to next step
    handleNavigation('aqua guide');
  };

  // Carousel ref and handlers for recommended crops
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8; // scroll by 80% of visible width
    const target = direction === 'left' ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount;
    el.scrollTo({ left: target, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen field-gradient">
      {/* Soil Data Input Section */}
      <div className="max-w-6xl mx-auto mt-6 mb-6 p-4 bg-white rounded-lg shadow border border-border">
        <h2 className="text-xl font-bold mb-2">Select Plot for Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-0.5">Plot</label>
            <select
              className="w-full border rounded px-2 py-2 text-sm"
              value={selectedPlotId ?? ''}
              onChange={e => setSelectedPlotId(e.target.value || null)}
            >
              <option value="">-- Select a plot --</option>
              {plots.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.area ? ` — ${p.area} acres` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <Button
              className="agri-button-primary w-full md:w-auto px-6"
              onClick={() => selectedPlotId && fetchRecommendationsForPlot(selectedPlotId)}
              disabled={!selectedPlotId || isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Get Recommendation'}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {submissionError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{submissionError}</p>
          </div>
        )}
      </div>
      <AgriChatAgent />
      <AgriAIPilotSidePeek
        agentType="SeedPlanner"
        agentName="Seed Planning"
        agentNameTelugu="విత్తన ప్రణాళిక"
        services={seedPlannerServices}
      />
      <div className="max-w-full mx-auto px-6 py-8">
        {/* Input Analysis Section - Only show after submission */}
        {submittedSoilData && (
          <div className="agri-card mb-8 p-6 bg-white rounded-lg border border-border">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              Input Analysis | ఇన్‌పుట్ విశ్లేషణ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Soil & Water Analysis */}
              <Card className="agri-card">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-primary" />
                    Soil Analysis | మట్టి విశ్లేషణ
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg flex flex-col items-start gap-2">
                        <p className="text-sm text-muted-foreground">pH Level</p>
                        <p className="text-xl font-bold">{submittedSoilData.ph}</p>
                        <Badge variant="default" className="mt-1">
                          {submittedSoilData.ph >= 6.0 && submittedSoilData.ph <= 7.5 ? 'Optimal' : submittedSoilData.ph < 6.0 ? 'Acidic' : 'Alkaline'}
                        </Badge>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg flex flex-col items-start gap-2">
                        <p className="text-sm text-muted-foreground">Region</p>
                        <p className="text-lg font-bold">{submittedSoilData.region}</p>
                        <Badge variant="secondary" className="mt-1">{submittedSoilData.season}</Badge>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 text-sm mt-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Nitrogen (N)</span>
                        <span className="text-muted-foreground">-</span>
                        <span>{submittedSoilData.n} kg/ha</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Phosphorus (P)</span>
                        <span className="text-muted-foreground">-</span>
                        <span>{submittedSoilData.p} kg/ha</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Potassium (K)</span>
                        <span className="text-muted-foreground">-</span>
                        <span>{submittedSoilData.k} kg/ha</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              {/* Weather Forecast (vertical list style) */}
              <Card className="agri-card">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-start gap-2">
                    <CloudRain className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <div>Weather Forecast</div>
                      <div className="text-sm text-muted-foreground">| వాతావరణ అంచనా</div>
                    </div>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Droplets className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-semibold">Rainfall</p>
                        <p className="text-sm text-muted-foreground">{currentConditions?.rainfall || '—'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Thermometer className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="font-semibold">Temperature</p>
                        <p className="text-sm text-muted-foreground">
                          {typeof currentConditions?.temperature === 'number' ? `${currentConditions.temperature}°C` : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Cloud className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold">Humidity</p>
                        <p className="text-sm text-muted-foreground">
                          {typeof currentConditions?.humidity === 'number' ? `${currentConditions.humidity}%` : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold">Weather</p>
                        <p className="text-sm text-muted-foreground">{currentConditions?.description || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Crop Recommendations Summary */}
              <Card className="agri-card">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-primary" />
                    Recommendations | సిఫార్సులు
                  </h3>
                  <div className="space-y-3">
                    {recommendedCrops.length > 0 ? (
                      <>
                        <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                          <p className="font-semibold text-success flex items-center gap-2">
                            <span className="text-xl">{recommendedCrops[0]?.icon}</span>
                            Best Match: {recommendedCrops[0]?.name}
                          </p>
                          <p className="text-sm">Confidence: {recommendedCrops[0]?.confidence}%</p>
                        </div>
                        {recommendedCrops.length > 1 && (
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="font-semibold">Alternatives Available</p>
                            <p className="text-sm">{recommendedCrops.length - 1} other crop{recommendedCrops.length > 2 ? 's' : ''} recommended</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">Submit soil data to see recommendations</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Season & Region Info */}
              <Card className="agri-card">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Season & Region | సీజన్ మరియు ప్రాంతం
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="font-semibold">Season</p>
                      <p className="text-sm">{submittedSoilData.season}</p>
                    </div>
                    <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                      <p className="font-semibold">Region</p>
                      <p className="text-sm">{submittedSoilData.region}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="font-semibold">Data Quality</p>
                      <Badge variant="default" className="mt-1">Live Data</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}


        {/* Dynamic Crop Recommendations (carousel with arrows) */}
        <div className="relative mb-8">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
            <button
              aria-label="Scroll left"
              onClick={() => scrollCarousel('left')}
              className="p-2 bg-white border rounded-full shadow hover:scale-105 transition mr-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div
            ref={carouselRef}
            className="flex justify-center gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-2 px-8"
            style={{ scrollBehavior: 'smooth' }}
          >
            {recommendedCrops.map((crop, index) => (
              <div key={index} className={`min-w-[380px] flex-shrink-0`}>
                <Card className="agri-card hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-6">
                    {index === 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-5 h-5 text-accent fill-accent" />
                        <Badge className="bg-accent text-accent-foreground">Best Match</Badge>
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{crop.icon}</span>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold">{crop.name}</h3>
                          {crop.variety && crop.variety !== '—' && (
                            <p className="text-sm text-muted-foreground">{crop.variety}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className="font-semibold">{crop.confidence}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Suitability:</span>
                          <Badge className="text-xs">{crop.suitabilityGrade}</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Extra Details Grid */}
                    {(crop.expectedYield !== '—' || crop.investment !== '—') && (
                      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                        {crop.expectedYield && crop.expectedYield !== '—' && (
                          <div className="p-2 bg-muted/30 rounded">
                            <p className="text-muted-foreground">Expected Yield</p>
                            <p className="font-semibold">{crop.expectedYield}</p>
                          </div>
                        )}
                        {crop.investment && crop.investment !== '—' && (
                          <div className="p-2 bg-muted/30 rounded">
                            <p className="text-muted-foreground">Investment</p>
                            <p className="font-semibold">{crop.investment}</p>
                          </div>
                        )}
                        {crop.expectedProfit && crop.expectedProfit !== '—' && (
                          <div className="p-2 bg-success/10 rounded">
                            <p className="text-muted-foreground">Expected Profit</p>
                            <p className="font-semibold text-success">{crop.expectedProfit}</p>
                          </div>
                        )}
                        {crop.roi && crop.roi !== '—' && (
                          <div className="p-2 bg-success/10 rounded">
                            <p className="text-muted-foreground">ROI</p>
                            <p className="font-semibold text-success">{crop.roi}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-semibold">Why this crop?</p>
                      {(crop.advantages ?? []).length ? (
                        (crop.advantages as string[]).map((reason: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                            <span>{reason}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground">Market and weather aligned</div>
                      )}
                    </div>

                    <Button className={index === 0 ? "agri-button-primary w-full" : "agri-button-secondary w-full"} onClick={() => handleCropSelection(crop.name)}>
                      Select Crop
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
            <button
              aria-label="Scroll right"
              onClick={() => scrollCarousel('right')}
              className="p-2 bg-white border rounded-full shadow hover:scale-105 transition ml-2"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SeedPlanner Feature Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <Card className="agri-card hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">AI Crop Planning</h3>
                  <p className="text-accent font-semibold">కృత్రిమ మేధ పంట ప్రణాళిక</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Get AI-powered crop recommendations based on soil health, weather patterns, and historical data
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Soil & Weather Analysis</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Crop Calendar & Input BOM</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>HITL Gates for Approvals</span>
                </div>
              </div>

              <Button
                className="agri-button-primary w-full"
                onClick={() => handleNavigation('CropPlanning')}
              >
                Start AI Planning
              </Button>
            </CardContent>
          </Card>

          <Card className="agri-card hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <ShoppingCart className="w-8 h-8 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Seed Procurement</h3>
                  <p className="text-accent font-semibold">విత్తన సేకరణ</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Find suppliers, compare prices, manage RFQs, and track orders with GST compliance
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  <span>Supplier Comparison</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  <span>RFQ & Bidding System</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  <span>Order & Invoice Tracking</span>
                </div>
              </div>

              <Button
                className="agri-button-secondary w-full"
                onClick={() => handleNavigation('Procurement')}
              >
                Manage Procurement
              </Button>
            </CardContent>
          </Card>

          <Card className="agri-card hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Sprout className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Sowing Guide</h3>
                  <p className="text-accent font-semibold">వేయడం మార్గదర్శకం</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Step-by-step guidance for tillage, sowing, and establishment with deviation tracking
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  <span>Guided Task Management</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  <span>Germination Audit</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  <span>Deviation Alerts</span>
                </div>
              </div>

              <Button
                className="agri-button-tertiary w-full"
                onClick={() => handleNavigation('SowingGuide')}
              >
                Start Sowing
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="agri-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-3">Seed Suppliers | విత్తన సరఫరాదారులు</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-semibold">Mahyco Seeds</p>
                    <p className="text-xs text-muted-foreground">Certified Dealer</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => console.log('📞 Contact Mahyco Seeds clicked')}
                  >
                    Contact
                  </Button>
                </div>
                <div className="flex justify-between items-center p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-semibold">Rasi Seeds</p>
                    <p className="text-xs text-muted-foreground">Local Supplier</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => console.log('📞 Contact Rasi Seeds clicked')}
                  >
                    Contact
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="agri-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-3">Government Schemes | ప్రభుత్వ పథకాలు</h3>
              <div className="space-y-3">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="font-semibold text-sm">PM-KISAN Scheme</p>
                  <p className="text-xs">₹6,000 annual support</p>
                </div>
                <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                  <p className="font-semibold text-sm">Crop Insurance</p>
                  <p className="text-xs">Premium support available</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="font-semibold text-sm">Seed Subsidy</p>
                  <p className="text-xs">Up to 50% subsidy on certified seeds</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expert Services Card */}
        <Card className="agri-card mt-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Sprout className="w-8 h-8 text-primary" />
              Need Expert Seed Planning? | నిపుణుల విత్తన ప్రణాళిక అవసరమా?
            </CardTitle>
            <CardDescription className="text-lg">
              Connect with certified Agri AI Pilots for professional seed selection and planning
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              <Image
                src="/seed-planting-realistic.jpg"
                alt="Professional seed planning service"
                width={800}
                height={400}
                className="w-full rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-card rounded-lg border">
                <div className="text-2xl font-bold text-primary">18+</div>
                <div className="text-sm text-muted-foreground">Seed Planning Experts</div>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <div className="text-2xl font-bold text-success">AI</div>
                <div className="text-sm text-muted-foreground">Powered Recommendations</div>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <div className="text-2xl font-bold text-accent">2.1km</div>
                <div className="text-sm text-muted-foreground">Nearest Expert Distance</div>
              </div>
            </div>

            <Button
              size="lg"
              className="agri-button-primary px-8 py-4 text-lg"
              onClick={() => {
                console.log('👨‍🌾 Expert appointment button clicked');
                setIsOnboardingOpen(true);
              }}
            >
              <Sprout className="w-5 h-5 mr-2" />
              Appoint Your Seed Expert | మీ విత్తన నిపుణుడిని నియమించండి
            </Button>
          </CardContent>
        </Card>

        {/* Video Section */}
        {AgentVideoSection && (
          <AgentVideoSection
            agentName="SeedPlanner"
            agentNameTelugu="విత్తన ప్లానింగ్"
            videos={sampleVideos}
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
        .agri-button-secondary {
          background: linear-gradient(to right, var(--secondary), var(--secondary-foreground));
          color: white;
          transition: all 0.3s ease;
        }
        .agri-button-secondary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .agri-button-tertiary {
          background: linear-gradient(to right, var(--accent), var(--accent-foreground));
          color: white;
          transition: all 0.3s ease;
        }
        .agri-button-tertiary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .soil-data-card input {
          border: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
}
