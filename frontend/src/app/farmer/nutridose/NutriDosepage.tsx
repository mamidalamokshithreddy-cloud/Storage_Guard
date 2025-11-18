import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  Calculator, 
  Leaf, 
  FlaskConical, 
  Clock,
  Video,
  Droplets,
  Target,
  Zap,
  ShieldCheck,
  MapPin,
  Star,
  Phone,
  Eye,
  FileText,
  ThermometerSun,
  Wind,
  CloudRain,
  Package,
  ShoppingCart
} from "lucide-react";



import AgriChatAgent from "../AgriChatAgent";
import AgentVideoSection from "../AgentVideoSection";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import * as aquaGuideAPI from "../../../lib/api/aquaguide-api";
import { useEffect, useMemo, useRef, useState } from "react";

// Inline API helpers for NutriDose (no separate service file)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type AnalysisPayload = {
  soil_analysis?: Record<string, any>;
  crop_info?: { species?: string; current_stage?: string; target_yield?: number; planting_date?: string };
  current_nutrients?: Record<string, number>;
  deficiencies?: string[];
  growth_stage?: string;
  target_yield?: number;
  farm_context?: Record<string, any>;
  user_preferences?: Record<string, any>;
  weather_forecast?: Array<Record<string, any>>;
};

async function postComprehensiveAnalysis(payload: AnalysisPayload) {
  // Transform to backend schema: ComprehensiveAnalysisRequest
  const requestBody = {
    soil_analysis: payload.soil_analysis || {},
    crop_info: {
      species: payload.crop_info?.species,
      ...(payload.crop_info?.current_stage ? { current_stage: payload.crop_info.current_stage } : {}),
      ...(payload.crop_info?.target_yield !== undefined ? { target_yield: payload.crop_info.target_yield } : {}),
      ...(payload.crop_info?.planting_date ? { planting_date: payload.crop_info.planting_date } : {}),
    },
    environmental_factors: {
      ...(payload.weather_forecast && payload.weather_forecast.length ? { weather_forecast: payload.weather_forecast } : {}),
      ...(payload.farm_context || {}), // pass diagnosed_* etc under environmental_factors (backend maps to farm_context internally)
    },
    user_preferences: payload.user_preferences || {}
  } as any;

  const res = await fetch(`${API_BASE}/comprehensive-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  if (!res.ok) {
    let detail: any = null;
    try { detail = await res.json(); } catch (error) { console.warn('Failed to parse error response:', error); }
    return { success: false, error: { status: res.status, detail } } as any;
  }
  return res.json();
}

async function postApplicationSchedule(payload: {
  crop_info: AnalysisPayload["crop_info"];
  fertilizer_plan?: any;
  environmental_factors?: any;
}) {
  // Transform payload to match backend ScheduleRequest schema
  const transformedPayload = {
    ...(payload.crop_info?.species ? { crop_species: payload.crop_info.species } : {}),
    ...(payload.crop_info?.planting_date ? { planting_date: payload.crop_info.planting_date } : {}),
    ...(payload.crop_info?.current_stage ? { current_stage: payload.crop_info.current_stage } : {}),
    ...(payload.crop_info?.target_yield !== undefined ? { target_yield: payload.crop_info.target_yield } : {}),
    ...(payload.fertilizer_plan ? { nutrient_requirements: payload.fertilizer_plan } : {}),
    ...(payload.environmental_factors?.weather_forecast ? { weather_forecast: payload.environmental_factors.weather_forecast } : {}),
  } as any;
  
  const res = await fetch(`${API_BASE}/application-schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transformedPayload),
  });
  if (!res.ok) throw new Error(`Schedule failed: ${res.status}`);
  return res.json();
}

async function postFertilizerRecommendations(payload: Partial<AnalysisPayload>) {
  const res = await fetch(`${API_BASE}/fertilizer-recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Recommendations failed: ${res.status}`);
  return res.json();
}

async function postCostAnalysis(payload: {
  fertilizer_plan: any;
  market_prices?: Record<string, number>;
  farm_details?: any;
  user_preferences?: any;
}) {
  const res = await fetch(`${API_BASE}/cost-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Cost analysis failed: ${res.status}`);
  return res.json();
}

// Helper functions to safely access nested properties
function safeGet(obj: Record<string, unknown> | null | undefined, path: string): unknown {
  if (!obj) return undefined;
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

const NutriDose = () => {

  const nutriDoseServices = [
    {
      title: "Fertilizer Calculation Service",
      titleTelugu: "ఎరువుల గణన సేవ",
      description: "Precise fertilizer quantity calculation for your crop",
      descriptionTelugu: "మీ పంటకు ఖచ్చితమైన ఎరువుల పరిమాణ గణన",
      duration: "1-2 hours",
      price: "₹600",
      icon: Calculator,
      available: true
    },
    {
      title: "Nutrient Management Planning",
      titleTelugu: "పోషకాహార నిర్వహణ ప్రణాళిక",
      description: "Comprehensive nutrient management strategy",
      descriptionTelugu: "సమగ్ర పోషకాహార నిర్వహణ వ్యూహం",
      duration: "2-3 hours",
      price: "₹1,200",
      icon: Leaf,
      available: true
    },
    {
      title: "Organic Fertilizer Guidance",
      titleTelugu: "సేంద్రీయ ఎరువుల మార్గదర్శనం",
      description: "Expert advice on organic fertilizer preparation and use",
      descriptionTelugu: "సేంద్రీయ ఎరువుల తయారీ మరియు వినియోగంపై నిపుణుల సలహా",
      duration: "1.5 hours",
      price: "₹800",
      icon: FlaskConical,
      available: true
    },
    {
      title: "Application Timing & Methods",
      titleTelugu: "వినియోగ సమయం మరియు పద్ధతులు",
      description: "Optimal timing and methods for fertilizer application",
      descriptionTelugu: "ఎరువుల వినియోగానికి అనుకూల సమయం మరియు పద్ధతులు",
      duration: "1 hour",
      price: "₹500",
      icon: Clock,
      available: true
    },
    {
      title: "Soil Nutrient Monitoring",
      titleTelugu: "మట్టి పోషకాహార పర్యవేక్షణ",
      description: "Regular monitoring of soil nutrient levels and adjustments",
      descriptionTelugu: "మట్టిలోని పోషకాహార స్థాయిల క్రమం పర్యవేక్షణ మరియు దిద్దుబాట్లు",
      duration: "2 hours",
      price: "₹1,000",
      icon: TrendingUp,
      available: true
    },
    {
      title: "Live Video Consultation",
      titleTelugu: "ప్రత్యక్ష వీడియో సలహా",
      description: "Instant expert guidance on nutrient management queries",
      descriptionTelugu: "పోషకాహార నిర్వహణ ప్రశ్నలపై తక్షణ నిపుణుల మార్గదర్శనం",
      duration: "30 minutes",
      price: "₹400",
      icon: Video,
      available: true
    }
  ];

  // Dynamic state from backend
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [missing, setMissing] = useState<string[] | null>(null);
  const [recommendations, setRecommendations] = useState<any | null>(null);
  const [schedule, setSchedule] = useState<any[] | null>(null);
  const [cost, setCost] = useState<any | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);
  const hydratedRef = useRef<boolean>(false);

  // Build payload dynamically from prior detection (localStorage) or URL params; fall back to minimal defaults
  const defaultPayload: AnalysisPayload = useMemo(() => {
    // Attempt to read prior detection saved by CropShield
    let lastDetection: any = null;
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('agri_last_detection');
        lastDetection = raw ? JSON.parse(raw) : null;
      }
    } catch (error) {
      console.warn('Failed to read last detection from localStorage:', error);
    }

    // Optional: read query params for overrides (?species=...&stage=...)
    let speciesFromQuery: string | undefined;
    let stageFromQuery: string | undefined;
    try {  
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        speciesFromQuery = url.searchParams.get('species') || undefined;
        stageFromQuery = url.searchParams.get('stage') || undefined;
      }
    } catch (error) {
      console.warn('Failed to parse URL parameters:', error);
    }

    // Prefer AquaGuide selected field for crop species and stage (do not use disease diagnosis as species)
    let speciesFromAqua: string | undefined;
    let stageFromAqua: string | undefined;
    try {
      if (typeof window !== 'undefined') {
        const selRaw = window.localStorage.getItem('agri_aquaguide_selected_field');
        const selectedFieldId: string | null = selRaw ? JSON.parse(selRaw) : null;
        const fieldsRaw = window.localStorage.getItem('agri_aquaguide_fields');
        const fields = fieldsRaw ? JSON.parse(fieldsRaw) as Array<any> : [];
        if (selectedFieldId && Array.isArray(fields)) {
          const fld = fields.find((f: any) => (f?.id?.toString?.() || f?.id) === selectedFieldId);
          if (fld) {
            speciesFromAqua = fld.crop || undefined;
            stageFromAqua = fld.stage || undefined;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to read AquaGuide field data:', error);
    }

    const species = speciesFromQuery || speciesFromAqua || undefined;
    const stage = stageFromQuery || stageFromAqua || undefined;

    // Construct minimally required payload; other fields can be user-provided in UI (future)
    const payload: AnalysisPayload = {
      soil_analysis: {},
      crop_info: {
        ...(species ? { species } : {}),
        ...(stage ? { current_stage: stage } : {}),
      },
      current_nutrients: {},
      deficiencies: [],
      growth_stage: stage || '',
      target_yield: undefined as any,
  farm_context: (lastDetection ? {
        diagnosed_issue: lastDetection?.diagnosis,
        diagnosed_category: lastDetection?.category,
        diagnosed_confidence: lastDetection?.confidence,
        diagnosed_severity: lastDetection?.severity,
      } : {}),
      user_preferences: {},
      weather_forecast: []
    };
    return payload;
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        // Only run when we have the minimum required fields (species)
        if (!defaultPayload?.crop_info?.species) {
          throw new Error("Missing required crop species; please analyze an image first or specify ?species=");
        }
        // Build stable cache key
        const cacheKey = `nutri_${defaultPayload.crop_info.species}__${defaultPayload.crop_info.current_stage || ''}`;
        const getCache = () => {
          try { if (typeof window==='undefined') return null; const raw = window.localStorage.getItem(cacheKey); return raw? JSON.parse(raw): null; } catch (error) { console.warn('Failed to get cache:', error); return null; }
        };
        const setCache = (val: any) => { try { if (typeof window==='undefined') return; window.localStorage.setItem(cacheKey, JSON.stringify(val)); } catch (error) { console.warn('Failed to set cache:', error); }
        };

        // Hydrate from cache once per mount
        if (!hydratedRef.current) {
          const cached = getCache();
          if (cached) {
            setAnalysis(cached.analysis || null);
            setRecommendations(cached.recommendations || null);
            setSchedule(cached.schedule || null);
            setCost(cached.cost || null);
          }
          hydratedRef.current = true;
        }

        // Prevent duplicate in-flight for same inputs
        if (inFlightKeyRef.current === cacheKey) {
          return;
        }
        inFlightKeyRef.current = cacheKey;
        // Fetch comprehensive analysis
        const a = await postComprehensiveAnalysis(defaultPayload);
        if (!mounted) return;
        if ((a as any)?.success === false) {
          const status = (a as any)?.error?.status;
          const m = (a as any)?.error?.detail?.missing;
          const missingFields = Array.isArray(m) ? m : null;
          setMissing(missingFields);
          const msg = status === 422
            ? `Missing required inputs: ${missingFields?.join(', ') || 'Please provide required fields'}`
            : `Analysis failed (${status || 'error'})`;
          setError(msg);
          // Stop further calls when strict validation fails
          inFlightKeyRef.current = null;
          setLoading(false);
          return;
        }
        setAnalysis(a);

    // Fetch recommendations (uses similar payload)
    const r = await postFertilizerRecommendations({
          soil_analysis: defaultPayload.soil_analysis,
          crop_info: defaultPayload.crop_info,
          user_preferences: defaultPayload.user_preferences,
        } as any);
        if (!mounted) return;
        setRecommendations(r);

        // Build schedule; reuse crop_info and optional fertilizer_plan from recommendations if present
    const fertPlan = (r?.recommendations?.fertilizer_plan || r?.recommendations?.plan || r?.fertilizer_plan || r?.plan || undefined);
        // If we have proper inputs, request backend schedule; otherwise fallback to AquaGuide schedule for selected field
        if (defaultPayload.crop_info?.species && defaultPayload.crop_info?.planting_date) {
          const s = await postApplicationSchedule({ 
            crop_info: defaultPayload.crop_info, 
            fertilizer_plan: fertPlan,
            environmental_factors: { weather_forecast: defaultPayload.weather_forecast }
          });
          if (!mounted) return;
          setSchedule(s?.schedule || s?.windows || s?.application_windows || s?.application_schedule || []);
        } else {
          // Fallback: try AquaGuide cached selection and fetch its irrigation schedule
          try {
            let selectedFieldId: string | null = null;
            if (typeof window !== 'undefined') {
              const selRaw = window.localStorage.getItem('agri_aquaguide_selected_field');
              selectedFieldId = selRaw ? JSON.parse(selRaw) : null;
            }
            if (selectedFieldId) {
              const sched = await aquaGuideAPI.getIrrigationSchedule(selectedFieldId);
              if (!mounted) return;
              // Map to a window-like shape understood by the UI mapper
              const windows = (sched || []).map((it: any) => ({
                title: 'Irrigation',
                action: it.method || 'Irrigation',
                date: it.startTime,
                application_type: 'irrigation',
                status: it.status,
                stage: '',
                weather: '',
                notes: `${it.waterAmount?.value ?? ''}${it.waterAmount?.unit ?? ''} for ${it.duration?.value ?? ''} ${it.duration?.unit ?? ''}`,
              }));
              setSchedule(windows);
            } else {
              setSchedule([]);
            }
          } catch (error) {
            console.warn('Failed to process fertilizer schedule:', error);
            setSchedule([]);
          }
        }

        // Cost analysis if plan present
        if (fertPlan) {
          const c = await postCostAnalysis({ fertilizer_plan: fertPlan });
          if (!mounted) return;
          setCost(c);
        }
  // Persist all
        setCache({ analysis: a, recommendations: r, schedule, cost });
      } catch (e: any) {
        setError(e?.message || "Failed to load nutrient data");
      } finally {
  if (mounted) setLoading(false);
  inFlightKeyRef.current = null;
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [defaultPayload]);

  // Helpers to normalize server data to UI cards
  const nutrientRecommendations = useMemo(() => {
    try {
      const items: any[] = [];
      const data = recommendations || analysis;
      const recs = data?.nutrient_recommendations || data?.recommendations || data?.nutrients || [];
      for (const rec of recs) {
        // Support multiple shapes: {name,current,required,application,cost,timing,status}
        items.push({
          name: rec.name || rec.nutrient || rec.label || "Nutrient",
          telugu: rec.telugu || "",
          current: rec.current ?? rec.current_level ?? 0,
          required: rec.required ?? rec.target_level ?? 1,
          deficiency: typeof rec.deficiency === "number" ? rec.deficiency : Math.max((rec.required ?? 1) - (rec.current ?? 0), 0),
          application: rec.application || rec.product || rec.recommendation || "",
          cost: rec.cost ? `₹${rec.cost}` : (rec.price ? `₹${rec.price}` : ""),
          timing: rec.timing || rec.window || rec.stage_window || "",
          status: rec.status || "moderate",
        });
      }
      return items;
    } catch {
      return [];
    }
  }, [analysis, recommendations]);

  const applicationSchedule = useMemo(() => {
    try {
      const windows = schedule || [];
      return (windows as any[]).map((w, idx) => ({
        week: idx + 1,
        action: w?.title || w?.action || w?.method || "Application",
        status: w?.status || "scheduled",
        date: w?.optimal_date || w?.date || w?.window || "",
        type: (w?.application_type || w?.type || "").toString().toLowerCase(),
        stage: w?.stage || w?.growth_stage || "",
        weather: w?.weather || w?.weather_conditions || "",
        notes: w?.notes || w?.details || "",
      }));
    } catch {
      return [];
    }
  }, [schedule]);

  // Dynamic vendor data extracted from backend recommendations
  const nutrientVendors = useMemo(() => {
    try {
      // Extract vendor recommendations from analysis/recommendations
      const data = recommendations || analysis;
      const vendors = data?.vendors || data?.suppliers || data?.marketplace || [];
      
      if (vendors.length > 0) {
        return vendors.map((vendor: any, index: number) => ({
          name: vendor.name || vendor.supplier_name || `Vendor ${index + 1}`,
          distance: vendor.distance || vendor.location_distance || "Unknown distance",
          rating: vendor.rating || vendor.score || 4.5,
          speciality: vendor.speciality || vendor.expertise || vendor.category || "General Fertilizers",
          phone: vendor.phone || vendor.contact || "+91 98765 43210",
          services: vendor.services || vendor.offerings || ["Fertilizer Supply", "Consultation"],
          price: vendor.price || vendor.rate || "Contact for pricing",
          availability: vendor.availability || vendor.stock_status || "Available",
          sla: vendor.sla || vendor.delivery_time || "Contact for details",
          certifications: vendor.certifications || vendor.licenses || ["Licensed"],
          experience: vendor.experience || vendor.years_in_business || "Established"
        }));
      }
      
      // If no vendors in backend response, return empty array to show "No vendors found"
      return [];
    } catch {
      return [];
    }
  }, [analysis, recommendations]);

  const weatherImpact = useMemo(() => {
    // Prefer backend normalized path: input_data.environmental_factors.weather_forecast[0]
    const wf = analysis?.input_data?.environmental_factors?.weather_forecast;
    const w = (Array.isArray(wf) && wf.length > 0 ? wf[0] : null) ||
              analysis?.weather ||
              analysis?.weather_forecast?.[0] || {};
    return {
      temperature: w?.temperature ?? 0,
      humidity: w?.humidity ?? 0,
      windSpeed: w?.wind_speed ?? w?.windSpeed ?? 0,
      rainfall: w?.rain ?? w?.rainfall ?? 0,
      uv: w?.uv ?? "",
      forecast: w?.summary || w?.forecast || "",
    };
  }, [analysis]);

  const cropStage = useMemo(() => {
    return (
      analysis?.input_data?.crop_info?.current_stage ||
      analysis?.analysis?.growth_stage ||
      analysis?.crop_stage ||
      analysis?.growth_stage ||
      defaultPayload.growth_stage
    );
  }, [analysis, defaultPayload.growth_stage]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'urgent': return 'destructive';
      case 'moderate': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen field-gradient">
      <AgriChatAgent />
      <AgriAIPilotSidePeek
        agentType="NutriDose" 
        agentName="NutriDose"
        agentNameTelugu="పోషకాహార మోతాదు"
        services={nutriDoseServices}
      />
         

      <div className="max-w-full mx-auto px-1 py-2">
        <Tabs defaultValue="nutrition" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="nutrition">Nutrition Analysis</TabsTrigger>
            <TabsTrigger value="plans">Application Plans</TabsTrigger>
            <TabsTrigger value="marketplace">Vendor Marketplace</TabsTrigger>
            <TabsTrigger value="monitoring">Progress Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="nutrition" className="space-y-6 mt-6">
            {loading && (
              <div className="p-3 text-sm rounded border border-primary/20 bg-primary/5">Loading nutrient analysis…</div>
            )}
            {error && (
              <div className="p-3 text-sm rounded border border-destructive/20 bg-destructive/5 text-destructive">
                <div>{error}</div>
                {Array.isArray(missing) && missing.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-xs">
                    {missing.map((f) => (
                      <li key={f}>
                        {f === 'soil_analysis' ? 'Soil Analysis' : f === 'species' ? 'Crop Species' : f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="agri-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Nutrient Requirements Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Weather Impact */}
                    <div className="mb-6 p-4 bg-gradient-field rounded-lg border border-primary/20">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <ThermometerSun className="w-4 h-4" />
                        Weather Impact on Nutrition
                      </h4>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <ThermometerSun className="w-6 h-6 mx-auto mb-1 text-primary" />
                          <p className="font-semibold">{weatherImpact.temperature ?? '—'}°C</p>
                          <p className="text-xs text-muted-foreground">Temperature</p>
                        </div>
                        <div className="text-center">
                          <Droplets className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                          <p className="font-semibold">{weatherImpact.humidity ?? '—'}%</p>
                          <p className="text-xs text-muted-foreground">Humidity</p>
                        </div>
                        <div className="text-center">
                          <Wind className="w-6 h-6 mx-auto mb-1 text-green-500" />
                          <p className="font-semibold">{weatherImpact.windSpeed ?? '—'} km/h</p>
                          <p className="text-xs text-muted-foreground">Wind Speed</p>
                        </div>
                        <div className="text-center">
                          <CloudRain className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                          <p className="font-semibold">{weatherImpact.rainfall ?? '—'}mm</p>
                          <p className="text-xs text-muted-foreground">Recent Rain</p>
                        </div>
                      </div>
                      <p className="text-sm mt-3 font-medium text-center text-success">{weatherImpact.forecast || ''}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {nutrientRecommendations.map((nutrient, index) => (
                        <div key={index} className="p-4 border border-border rounded-lg bg-muted/30">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <h3 className="font-semibold">{nutrient.name}</h3>
                              <p className="text-sm text-accent font-medium">{nutrient.telugu}</p>
                            </div>
                            <Badge variant={getStatusColor(nutrient.status)}>
                              {nutrient.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span>Current: {nutrient.current}</span>
                              <span>Required: {nutrient.required}</span>
                            </div>
                            
                            <Progress 
                              value={(nutrient.current / nutrient.required) * 100} 
                              className="h-2"
                            />
                            
                            <div className="text-xs text-destructive font-semibold">
                              Deficiency: {nutrient.deficiency}
                            </div>
                            
                            <div className="p-3 bg-gradient-field rounded border border-primary/20">
                              <p className="font-semibold text-sm">{nutrient.application}</p>
                              <div className="flex justify-between text-xs mt-1">
                                <span>Cost: {nutrient.cost}</span>
                                <span>Apply: {nutrient.timing}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="agri-card">
                  <CardHeader>
                    <CardTitle>Smart Recommendations | స్మార్ట్ సిఫార్సులు</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Show LLM summary if backend provided (carry-forward analysis) */}
                      {Boolean(safeGet(analysis, 'analysis.llm_recommendations') || safeGet(recommendations, 'recommendations.content')) && (
                        <div className="p-4 bg-muted/30 rounded-lg border border-border">
                          <h4 className="font-semibold mb-2">AI Summary</h4>
                          <div className="text-sm whitespace-pre-wrap">
                            {safeString(safeGet(analysis, 'analysis.llm_recommendations') || safeGet(recommendations, 'recommendations.content'))}
                          </div>
                        </div>
                      )}
                      <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          AI-Powered Nutrition Recipe
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Crop Stage</p>
                            <p className="font-semibold">
                              {safeString(cropStage, 'Unknown')}
                              {(safeGet(analysis, 'input_data.crop_info.planting_date') || defaultPayload.crop_info?.planting_date)
                                ? (() => { const plantingDate = safeString(safeGet(analysis, 'input_data.crop_info.planting_date')) || defaultPayload.crop_info?.planting_date; const ms = Date.now() - new Date(plantingDate!).getTime(); const w = Math.floor(ms / (1000 * 60 * 60 * 24 * 7)); return ` (${w} weeks)`; })()
                                : ''}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Weather Suitability</p>
                            <p className="font-semibold">
                              {typeof weatherImpact.rainfall === 'number' && typeof weatherImpact.windSpeed === 'number'
                                ? ((weatherImpact.rainfall < 5 && weatherImpact.windSpeed < 15) ? 'Excellent' : 'Moderate')
                                : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Recommended Action</p>
                            <p className="font-semibold">
                              {safeString(safeGet(analysis, 'recommended_action') || safeGet(recommendations, 'primary_recommendation'), '—')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic fertilizer applications from backend */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {safeArray(safeGet(recommendations, 'recommendations.fertilizer_plan') || safeGet(recommendations, 'recommendations.plan') || safeGet(recommendations, 'fertilizer_plan') || safeGet(recommendations, 'plan'))
                          .slice(0, 2)
                          .map((planData: unknown, index: number) => {
                            const plan = planData as Record<string, unknown>;
                            return (
                          <div key={index} className={`p-4 rounded-lg border ${
                            plan.type === 'basal' ? 'bg-success/10 border-success/20' : 'bg-warning/10 border-warning/20'
                          }`}>
                            <h4 className={`font-semibold mb-2 ${
                              plan.type === 'basal' ? 'text-success' : 'text-warning'
                            }`}>
                              {safeString(plan.application_type || plan.type, `Application ${index + 1}`)}
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>{safeString(plan.product_name, 'Product')}:</span>
                                <span className="font-semibold">{safeString(plan.application_rate || plan.rate, 'As needed')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Timing:</span>
                                <span className="font-semibold">{safeString(plan.timing || plan.application_timing, 'As scheduled')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Method:</span>
                                <span className="font-semibold">{safeString(plan.application_method || plan.method, 'Standard')}</span>
                              </div>
                            </div>
                          </div>
                          );
                        })}
                        {safeArray(safeGet(recommendations, 'recommendations.fertilizer_plan') || safeGet(recommendations, 'recommendations.plan') || safeGet(recommendations, 'fertilizer_plan') || safeGet(recommendations, 'plan')).length === 0 && (
                          // Fallback if no fertilizer plan available
                          <div className="md:col-span-2 p-4 bg-muted/30 rounded-lg text-center">
                            <p className="text-muted-foreground">Detailed fertilizer plan will appear after analysis</p>
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-info/10 rounded border border-info/20">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" />
                          Safety Guidelines
                        </h4>
                        <div className="space-y-1 text-xs">
                          {safeArray(safeGet(analysis, 'safety_guidelines')).map((guideline: unknown, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-success" />
                              <span>{safeString(guideline)}</span>
                            </div>
                          )).concat(safeArray(safeGet(recommendations, 'safety_recommendations')).map((guideline: unknown, index: number) => (
                            <div key={`rec-${index}`} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-success" />
                              <span>{safeString(guideline)}</span>
                            </div>
                          ))).slice(0, 5).length > 0 ? safeArray(safeGet(analysis, 'safety_guidelines')).concat(safeArray(safeGet(recommendations, 'safety_recommendations'))).slice(0, 5).map((guideline: unknown, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-success" />
                              <span>{safeString(guideline)}</span>
                            </div>
                          )) : (
                            // Default safety guidelines if none provided by backend
                            <>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 text-success" />
                                <span>Apply during suitable weather conditions (wind &lt; {15} km/h)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 text-success" />
                                <span>Follow recommended buffer zones from water sources</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 text-success" />
                                <span>Use protective equipment during application</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 text-success" />
                                <span>Store fertilizers in dry, secure locations</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Nutrition Progress */}
              <div className="space-y-6">
                <Card className="agri-card">
                  <CardHeader>
                    <CardTitle>Nutrition Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-gradient-field rounded-lg border border-primary/20">
                        <div className="text-3xl font-bold text-primary">
                          {(() => { const s = (analysis?.overall_score ?? analysis?.score ?? analysis?.health_score ?? analysis?.analysis?.confidence); return (typeof s === 'number') ? (s * 100) + '%' : '—'; })()}
                        </div>
                        <p className="text-sm font-semibold">Overall Nutrition Score</p>
                        <p className="text-xs text-muted-foreground">
                          {analysis?.summary || analysis?.assessment || "Analysis completed"}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-success/10 rounded-lg">
                          <p className="text-lg font-bold text-success">
                            {applicationSchedule.length > 0 ? `${applicationSchedule.filter(s => s.status === 'completed').length}/${applicationSchedule.length}` : '—'}
                          </p>
                          <p className="text-xs">Applications Done</p>
                        </div>
                        <div className="text-center p-3 bg-warning/10 rounded-lg">
                          <p className="text-lg font-bold text-warning">
                            {cost?.total_cost ? `₹${Math.round(cost.total_cost)}` : 
                             cost?.cost_estimate ? `₹${Math.round(cost.cost_estimate)}` : 
                             recommendations?.total_cost ? `₹${Math.round(recommendations.total_cost)}` : 
                             "Calculating..."}
                          </p>
                          <p className="text-xs">Total Investment</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Nutrient Levels</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Nitrogen</span>
                            <div className="flex items-center gap-2">
                              <Progress value={typeof (analysis?.levels?.nitrogen ?? analysis?.nutrient_levels?.nitrogen) === 'number' ? ((analysis?.levels?.nitrogen ?? analysis?.nutrient_levels?.nitrogen) * 100) : 0} className="w-16 h-2" />
                              <span className="text-xs font-semibold">{typeof (analysis?.levels?.nitrogen ?? analysis?.nutrient_levels?.nitrogen) === 'number' ? (((analysis?.levels?.nitrogen ?? analysis?.nutrient_levels?.nitrogen) * 100) + '%') : '—'}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Phosphorus</span>
                            <div className="flex items-center gap-2">
                              <Progress value={typeof (analysis?.levels?.phosphorus ?? analysis?.nutrient_levels?.phosphorus) === 'number' ? ((analysis?.levels?.phosphorus ?? analysis?.nutrient_levels?.phosphorus) * 100) : 0} className="w-16 h-2" />
                              <span className="text-xs font-semibold">{typeof (analysis?.levels?.phosphorus ?? analysis?.nutrient_levels?.phosphorus) === 'number' ? (((analysis?.levels?.phosphorus ?? analysis?.nutrient_levels?.phosphorus) * 100) + '%') : '—'}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Potassium</span>
                            <div className="flex items-center gap-2">
                              <Progress value={typeof (analysis?.levels?.potassium ?? analysis?.nutrient_levels?.potassium) === 'number' ? ((analysis?.levels?.potassium ?? analysis?.nutrient_levels?.potassium) * 100) : 0} className="w-16 h-2" />
                              <span className="text-xs font-semibold">{typeof (analysis?.levels?.potassium ?? analysis?.nutrient_levels?.potassium) === 'number' ? (((analysis?.levels?.potassium ?? analysis?.nutrient_levels?.potassium) * 100) + '%') : '—'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="agri-card">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button
                        className="w-full agri-button-primary"
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const fertPlan = (recommendations?.recommendations?.fertilizer_plan || recommendations?.recommendations?.plan || recommendations?.fertilizer_plan || recommendations?.plan);
                            const c = await postCostAnalysis({ fertilizer_plan: fertPlan || {} });
                            setCost(c);
                          } catch (e: any) {
                            setError(e?.message || "Order estimation failed");
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Order Fertilizers
                      </Button>
                      
                      <Button
                        className="w-full agri-button-secondary"
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const fertPlan = (recommendations?.recommendations?.fertilizer_plan || recommendations?.recommendations?.plan || recommendations?.fertilizer_plan || recommendations?.plan);
                            const s = await postApplicationSchedule({ 
                              crop_info: defaultPayload.crop_info, 
                              fertilizer_plan: fertPlan,
                              environmental_factors: { weather_forecast: defaultPayload.weather_forecast }
                            });
                            setSchedule(s?.schedule || s?.windows || s?.application_windows || s?.application_schedule || []);
                          } catch (e: any) {
                            setError(e?.message || "Failed to refresh schedule");
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Application
                      </Button>
                      
                      <Button className="w-full" variant="outline">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Get Soil Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="agri-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Application Schedule | అప్లికేషన్ షెడ్యూల్
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {applicationSchedule.map((item, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${
                        item.status === 'completed' 
                          ? 'bg-success/10 border-success/20' 
                          : item.status === 'scheduled'
                          ? 'bg-primary/10 border-primary/20'
                          : 'bg-muted border-border'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-4">
                            {item.status === 'completed' ? (
                              <CheckCircle className="w-5 h-5 text-success" />
                            ) : (
                              <div className={`w-5 h-5 rounded-full border-2 ${
                                item.status === 'scheduled' ? 'border-primary' : 'border-muted-foreground'
                              }`} />
                            )}
                            <div>
                              <p className="font-semibold">Week {item.week} - {item.stage}</p>
                              <p className="text-sm text-muted-foreground">{item.action}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{item.date}</p>
                            <Badge 
                              variant={
                                item.status === 'completed' ? 'default' :
                                item.status === 'scheduled' ? 'secondary' : 'outline'
                              }
                              className="text-xs"
                            >
                              {item.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Application Type</p>
                            <Badge variant="outline" className="text-xs">
                              {item.type}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Weather Status</p>
                            <p className="font-semibold">{item.weather}</p>
                          </div>
                        </div>

                        <div className="mt-3 p-2 bg-info/10 rounded border border-info/20">
                          <p className="text-xs text-info">{item.notes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="agri-card">
                <CardHeader>
                  <CardTitle>Stage-Aligned Nutrition | దశ-సమన్వితమైన పోషణ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-field rounded-lg border border-primary/20">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Leaf className="w-4 h-4" />
                        Current Crop Stage: {analysis?.crop_stage || analysis?.growth_stage || defaultPayload.crop_info?.current_stage || "Unknown"}
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Days After Sowing</p>
                          <p className="font-semibold">
                            {analysis?.days_after_sowing || 
                             (defaultPayload.crop_info?.planting_date ?
                               Math.floor((new Date().getTime() - new Date(defaultPayload.crop_info.planting_date).getTime()) / (1000 * 60 * 60 * 24)) : 
                               "Unknown")} days
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Stage Duration</p>
                          <p className="font-semibold">{analysis?.stage_duration || "Ongoing"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Primary Need</p>
                          <p className="font-semibold">
                            {analysis?.primary_nutrients || 
                             (defaultPayload.deficiencies?.join(" + ") ||
                             "Balanced nutrition")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Next Stage</p>
                          <p className="font-semibold">{analysis?.next_stage || "Development continues"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">Recommended Protocol</h4>
                      
                      {/* Dynamic protocol from backend recommendations */}
                      {(recommendations?.recommendations?.fertilizer_plan || recommendations?.recommendations?.plan || recommendations?.fertilizer_plan || recommendations?.plan || [])
                        .map((plan: any, index: number) => (
                        <div key={index} className={`p-3 rounded-lg border ${
                          plan.type === 'basal' ? 'bg-success/10 border-success/20' : 
                          plan.type === 'foliar' ? 'bg-info/10 border-info/20' : 
                          'bg-warning/10 border-warning/20'
                        }`}>
                          <h5 className={`font-semibold mb-2 ${
                            plan.type === 'basal' ? 'text-success' : 
                            plan.type === 'foliar' ? 'text-info' : 
                            'text-warning'
                          }`}>
                            {plan.application_type || plan.type || 'Application'}
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>{plan.product_name || plan.fertilizer || 'Product'}:</span>
                              <span className="font-semibold">{plan.application_rate || plan.rate || 'As needed'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Application Time:</span>
                              <span className="font-semibold">{plan.timing || plan.application_timing || 'As scheduled'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Method:</span>
                              <span className="font-semibold">{plan.application_method || plan.method || 'Standard application'}</span>
                            </div>
                          </div>
                        </div>
                      )) || (
                        // Fallback if no specific fertilizer plan in response
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <p className="text-sm text-muted-foreground">
                            {analysis?.recommendations_summary || 
                             recommendations?.summary || 
                             "No specific protocol available. Please refresh analysis."}
                          </p>
                        </div>
                      )}

                    </div>

                    <div className="p-3 bg-destructive/10 rounded border border-destructive/20">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Buffer Zone Requirements
                      </h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Water sources:</span>
                          <span className="font-semibold">3m minimum distance</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Neighboring crops:</span>
                          <span className="font-semibold">1m buffer zone</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Residential areas:</span>
                          <span className="font-semibold">10m buffer zone</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="agri-card">
                  <CardHeader>
                    <CardTitle>Fertilizer Marketplace | ఎరువుల మార్కెట్‌ప్లేస్</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {nutrientVendors.length > 0 ? nutrientVendors.map((vendor: any, index: number) => (
                        <div key={index} className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{vendor.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">{vendor.rating}</span>
                                <Badge variant="outline">{vendor.experience}</Badge>
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{vendor.distance}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{vendor.speciality}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">{vendor.price}</p>
                              <Badge className={vendor.availability === 'In Stock' ? 'bg-success text-success-foreground' : 
                                               vendor.availability === 'Available' ? 'bg-primary text-primary-foreground' : 
                                               'bg-warning text-warning-foreground'}>
                                {vendor.availability}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {vendor.services.map((service: any, sIndex: number) => (
                              <Badge key={sIndex} variant="outline" className="text-xs justify-center">
                                {service}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center justify-between mb-3 text-sm">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-muted-foreground">SLA</p>
                                <p className="font-semibold">{vendor.sla}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Certifications</p>
                                <div className="flex gap-1">
                                  {vendor.certifications.map((cert: any, cIndex: number) => (
                                    <Badge key={cIndex} variant="secondary" className="text-xs">
                                      {cert}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" className="agri-button-primary flex-1">
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Order Now
                            </Button>
                            <Button size="sm" variant="outline">
                              <Phone className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )) : (
                        <div className="p-8 text-center bg-muted/30 rounded-lg border border-dashed">
                          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="font-semibold mb-2">No Vendors Available</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Vendor recommendations will appear based on your location and requirements.
                          </p>
                          <Button variant="outline" size="sm">
                            <MapPin className="w-4 h-4 mr-2" />
                            Find Local Suppliers
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="agri-card">
                  <CardHeader>
                    <CardTitle>Order Request</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Fertilizer Type</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fertilizer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="urea">Urea (46% N)</SelectItem>
                            <SelectItem value="dap">DAP (18:46:0)</SelectItem>
                            <SelectItem value="npk">NPK Complex</SelectItem>
                            <SelectItem value="organic">Organic Compost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Quantity (bags)</label>
                        <Input type="number" placeholder="Enter quantity" />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Delivery Date</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select date" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="tomorrow">Tomorrow</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Special Requirements</label>
                        <Textarea placeholder="Purity, brand preferences..." rows={3} />
                      </div>
                      
                      <Button className="w-full agri-button-primary">
                        <Package className="w-4 h-4 mr-2" />
                        Place Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="agri-card">
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-3 bg-success/10 rounded">
                        <div>
                          <p className="font-semibold">Urea - 10 bags</p>
                          <p className="text-xs text-muted-foreground">FertilizerHub Pro • ₹12,000</p>
                        </div>
                        <Badge className="bg-success text-success-foreground">Delivered</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-warning/10 rounded">
                        <div>
                          <p className="font-semibold">DAP - 5 bags</p>
                          <p className="text-xs text-muted-foreground">AgriNutrients Direct • ₹5,500</p>
                        </div>
                        <Badge className="bg-warning text-warning-foreground">In Transit</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="agri-card">
                <CardHeader>
                  <CardTitle>Application History | అప్లికేషన్ చరిత్ర</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {applicationSchedule.length > 0 ? applicationSchedule.map((item, index) => (
                      <div key={index} className={`flex justify-between items-center p-3 rounded ${
                        item.status === 'completed' ? 'bg-success/10' : 
                        item.status === 'scheduled' ? 'bg-warning/10' : 'bg-muted'
                      }`}>
                        <div>
                          <p className="font-semibold">{item.date} - {item.action}</p>
                          <p className="text-xs text-muted-foreground">{item.stage} • {item.type}</p>
                          <p className="text-xs text-muted-foreground">{item.notes}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            item.status === 'completed' ? 'bg-success text-success-foreground' : 
                            item.status === 'scheduled' ? 'bg-warning text-warning-foreground' : 
                            'bg-muted text-muted-foreground'
                          }>
                            {item.status}
                          </Badge>
                          <p className="text-xs mt-1">{item.weather || 'Weather suitable'}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="p-3 bg-muted/50 rounded text-center">
                        <p className="text-muted-foreground">No application history available</p>
                        <p className="text-xs text-muted-foreground">Refresh analysis to load schedule</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="agri-card">
                <CardHeader>
                  <CardTitle>Service Proof | సేవా రుజువు</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applicationSchedule.filter(item => item.status === 'completed').length > 0 ? 
                      applicationSchedule.filter(item => item.status === 'completed').map((item, index) => (
                        <div key={index} className="p-4 border border-border rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{item.date} - {item.action}</h4>
                              <p className="text-sm text-muted-foreground">{item.stage} application</p>
                            </div>
                            <Badge className="bg-success text-success-foreground">Verified</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div>
                              <p className="text-muted-foreground">Application Type</p>
                              <p className="font-semibold">{item.type}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Weather Status</p>
                              <p className="font-semibold">{item.weather || 'Suitable conditions'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Farm Area</p>
                              <p className="font-semibold">{defaultPayload.farm_context?.farm_size_hectares ?? "-"} hectares</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Status</p>
                              <p className="font-semibold">Completed successfully</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              <Eye className="w-3 h-3 mr-1" />
                              View Details
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              <FileText className="w-3 h-3 mr-1" />
                              Documentation
                            </Button>
                          </div>
                        </div>
                      )) : (
                        <div className="p-4 border border-border rounded-lg text-center">
                          <p className="text-muted-foreground">No completed applications to verify</p>
                          <p className="text-xs text-muted-foreground">Service proofs will appear after applications are completed</p>
                        </div>
                      )
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        <AgentVideoSection
          agentName="NutriDose"
          agentNameTelugu="పోషక మోతాదు"
          videos={[
            {
              title: "Precision Fertilizer Application",
              titleTelugu: "ఖచ్చితమైన ఎరువుల అప్లికేషన్",
              duration: "9:15",
              type: "demo"
            },
            {
              title: "Nutrient Management Planning",
              titleTelugu: "పోషక నిర్వహణ ప్రణాళిక",
              duration: "14:20",
              type: "tutorial"
            },
            {
              title: "35% Cost Reduction Success Story",
              titleTelugu: "35% వ్యయ తగ్గింపు విజయ కథ",
              duration: "6:25",
              type: "case-study"
            }
          ]}
        />
      
      </div>
    </div>
  );
};

export default NutriDose;