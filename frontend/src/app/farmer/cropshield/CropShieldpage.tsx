import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"; 
import { 
  Shield, 
  Camera, 
  AlertTriangle, 
  Upload,
  Bug, 
  Microscope, 
  Zap,
  Calendar,
  Video,
  MapPin,
  Star,
  Clock,
  CheckCircle,
  FileText,
  ShoppingCart,
  Phone,
  Eye,
  Target,
  CloudRain,
  Gauge,
  Loader2,
  X
} from "lucide-react";
// import AgriAgentsSidebar from "../AgriAgentsSidebar";
// import PageHeader from "../PageHeader";
import AgriChatAgent from "../AgriChatAgent";
import AgentVideoSection from "../AgentVideoSection";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";

// Types for API responses
interface DetectionResult {
  type: "pest" | "disease";
  name: string;
  telugu: string;
  severity: "high" | "medium" | "low";
  confidence: number;
  treatment: string;
  cost: string;
  urgency: string;
  affectedArea: string;
  weatherRisk: string;
  bufferZone: string;
  safetyPeriod: string;
}

interface AnalysisResponse {
  status: string;
  timestamp: string;
  processing_time_seconds: number;
  classification: {
    predicted_class: string;
    confidence: number;
    top_predictions: Array<{class: string, confidence: number}>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model_info: any;
  };
  llm_responses: Record<string, {
    response: string;
    provider: string;
    model_name: string;
    confidence: number;
    tokens_used: number;
    response_time: number;
    error?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any;
  }>;
  agent_decision: {
    selected_provider: string;
    selected_response: string;
    confidence: number;
    reasoning: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any;
  };
  response_analysis: Record<string, {final_score: number}>;
  training: {
    enabled: boolean;
    label_used: string;
    user_provided_label: boolean;
    queued_for_training: boolean;
    chaining_mode: boolean;
  };
  flow_mode: string;
}

const CropShield = () => {
  // const router = useRouter();
  
  // State management
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [analysisResponse, setAnalysisResponse] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLLM, setSelectedLLM] = useState<string>("gemini-2.5-flash");
  const [enableTraining] = useState(true);
  const [debugMode] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // helpers
  const hashString = useCallback((str: string): string => {
    // Simple DJB2 hash for localStorage keying
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash | 0; // force 32-bit
    }
    // convert to unsigned hex
    return (hash >>> 0).toString(16);
  }, []);

  const getAnalysisCache = useCallback((dataURL?: string | null) => {
    try {
      if (!dataURL || typeof window === 'undefined') return null;
      const key = `agri_analysis_${hashString(dataURL)}`;
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, [hashString]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setAnalysisCache = useCallback((dataURL: string, analysis: any, detections: DetectionResult[]) => {
    try {
      if (typeof window === 'undefined') return;
      const key = `agri_analysis_${hashString(dataURL)}`;
      const payload = { analysisResponse: analysis, detectionResults: detections, ts: Date.now() };
      window.localStorage.setItem(key, JSON.stringify(payload));
      // also stamp the last_upload with the key for convenience
      const lastRaw = window.localStorage.getItem('agri_last_upload');
      if (lastRaw) {
        const parsed = JSON.parse(lastRaw);
        parsed.analysisKey = key;
        window.localStorage.setItem('agri_last_upload', JSON.stringify(parsed));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [hashString]);

  const dataURLToFile = useCallback((dataUrl: string, fileName: string, mimeType: string): File => {
    const arr = dataUrl.split(',');
    const mime = mimeType || arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  }, []);

  // Rehydrate last uploaded image on mount (for session persistence across navigation)
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const cached = window.localStorage.getItem('agri_last_upload');
      if (!cached) return;
      const parsed = JSON.parse(cached);
      if (parsed?.dataURL && parsed?.name && parsed?.type) {
        setImagePreview(parsed.dataURL as string);
        // reconstruct File so user can re-run analyze without re-upload
        const file = dataURLToFile(parsed.dataURL, parsed.name, parsed.type);
        setUploadedImage(file);
        // rehydrate analysis/detections if cached for this image
        const cachedAnalysis = getAnalysisCache(parsed.dataURL);
        if (cachedAnalysis?.analysisResponse && cachedAnalysis?.detectionResults) {
          setAnalysisResponse(cachedAnalysis.analysisResponse);
          setDetectionResults(cachedAnalysis.detectionResults);
        }
      }
    } catch (e) {
      console.warn('Failed to rehydrate last upload from localStorage', e);
    }
  }, [dataURLToFile, getAnalysisCache]);

  // Auto-resume analysis if user navigated away mid-request; ensure no duplicate calls
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const analyzingRaw = window.localStorage.getItem('agri_analyzing');
      const lastDetectionRaw = window.localStorage.getItem('agri_last_detection');
      const analyzing = analyzingRaw ? JSON.parse(analyzingRaw) : null;
      const hasDetection = Boolean(lastDetectionRaw);
      if (analyzing?.inProgress) {
        if (hasDetection) {
          // Completed while away; clear flag
          window.localStorage.removeItem('agri_analyzing');
          setIsAnalyzing(false);
        } else if (uploadedImage) {
          // Resume analysis once per mount
          setIsAnalyzing(true);
          // Small microtask to ensure state is set before calling
          setTimeout(() => {
            analyzeImage();
          }, 0);
        }
      }
    } catch {
      // Ignore rehydration errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedImage]);

  // API Configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

  // Helper function to parse LLM response and extract treatment information
  const parseLLMResponseToDetectionResult = (response: AnalysisResponse): DetectionResult[] => {
    const results: DetectionResult[] = [];
    
    // Extract main classification
    const classification = response.classification;
    // Use agent decision confidence instead of classification confidence for better accuracy
    const confidence = Math.round(response.agent_decision.confidence * 100);
    
    // Determine if it's a pest or disease based on the class name
    const isPest = classification.predicted_class.toLowerCase().includes('pest') || 
                   classification.predicted_class.toLowerCase().includes('worm') ||
                   classification.predicted_class.toLowerCase().includes('aphid') ||
                   classification.predicted_class.toLowerCase().includes('beetle');
    
    const isDisease = classification.predicted_class.toLowerCase().includes('disease') ||
                      classification.predicted_class.toLowerCase().includes('blight') ||
                      classification.predicted_class.toLowerCase().includes('virus') ||
                      classification.predicted_class.toLowerCase().includes('fungus');
    
    const type: "pest" | "disease" = isPest ? "pest" : isDisease ? "disease" : "disease";
    
    // Extract treatment information from LLM response
    const llmResponse = response.agent_decision.selected_response;
    
    // Parse treatment recommendations from LLM response
    const treatmentMatch = llmResponse.match(/(?:treatment|spray|apply|use)[:\s]*([^.]+)/i);
    const treatment = treatmentMatch ? treatmentMatch[1].trim() : "Consult agricultural expert for specific treatment";
    
    // Estimate cost based on treatment type
    const costEstimate = treatment.toLowerCase().includes('bt') ? '₹800/acre' :
                        treatment.toLowerCase().includes('neem') ? '₹400/acre' :
                        treatment.toLowerCase().includes('fungicide') ? '₹600/acre' :
                        '₹500/acre';
    
    // Determine severity based on confidence
    const severity = confidence > 80 ? "high" : confidence > 60 ? "medium" : "low";
    
    // Estimate urgency based on severity
    const urgency = severity === "high" ? "3 days" : severity === "medium" ? "5 days" : "7 days";
    
    // Generate Telugu translation for common terms
    const getTeluguName = (englishName: string) => {
      const translations: Record<string, string> = {
        'bollworm': 'పొట్టు పురుగు',
        'aphid': 'చిమ్మటలు',
        'leaf curl': 'ఆకు వంకర',
        'blight': 'అగ్ని',
        'virus': 'వైరస్',
        'fungus': 'పుట్ట',
        'pest': 'కీటకం',
        'disease': 'వ్యాధి'
      };
      
      for (const [eng, tel] of Object.entries(translations)) {
        if (englishName.toLowerCase().includes(eng)) {
          return tel;
        }
      }
      return englishName;
    };

    results.push({
      type,
      name: classification.predicted_class.replace(/_/g, ' ').toUpperCase(),
      telugu: getTeluguName(classification.predicted_class),
      severity,
      confidence,
      treatment,
      cost: costEstimate,
      urgency,
      affectedArea: "Field assessment needed",
      weatherRisk: "Check current weather conditions",
      bufferZone: "5m from water sources",
      safetyPeriod: "7 days pre-harvest"
    });

    // Add top predictions as additional results if confidence is high enough
    if (classification.top_predictions && classification.top_predictions.length > 1) {
      classification.top_predictions.slice(1, 3).forEach((pred) => {
        if (pred.confidence > 0.3) {
          results.push({
            type: pred.class.toLowerCase().includes('pest') ? "pest" : "disease",
            name: pred.class.replace(/_/g, ' ').toUpperCase(),
            telugu: getTeluguName(pred.class),
            severity: "low",
            confidence: Math.round(pred.confidence * 100),
            treatment: "Monitor and assess severity",
            cost: "₹300/acre",
            urgency: "10 days",
            affectedArea: "Monitor affected areas",
            weatherRisk: "Weather dependent",
            bufferZone: "Standard precautions",
            safetyPeriod: "Follow guidelines"
          });
        }
      });
    }

    return results;
  };

  // Handle image upload
  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setUploadedImage(file);
    setError(null);
  setDetectionResults([]);
  setAnalysisResponse(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target?.result as string;
      setImagePreview(dataURL);
      // persist image preview + metadata for session continuity
      try {
        if (typeof window !== 'undefined') {
          const cache = { name: file.name, type: file.type, size: file.size, dataURL, ts: Date.now() };
          window.localStorage.setItem('agri_last_upload', JSON.stringify(cache));
        }
      } catch (err) {
        console.warn('Failed to persist uploaded image to localStorage', err);
      }
      // If this exact image was analyzed before, rehydrate results immediately
      const cachedAnalysis = getAnalysisCache(dataURL);
      if (cachedAnalysis?.analysisResponse && cachedAnalysis?.detectionResults) {
        setAnalysisResponse(cachedAnalysis.analysisResponse);
        setDetectionResults(cachedAnalysis.detectionResults);
      }
    };
    reader.readAsDataURL(file);
  }, [getAnalysisCache]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Handle camera capture
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Analyze image with backend API
  const analyzeImage = async () => {
    if (isAnalyzing) return;
    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }

  setIsAnalyzing(true);
  try { 
    if (typeof window !== 'undefined') 
      window.localStorage.setItem('agri_analyzing', JSON.stringify({ inProgress: true, ts: Date.now(), llm: selectedLLM })); 
  } catch {
    // Ignore localStorage errors
  }
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', uploadedImage);
      formData.append('llm_providers', selectedLLM);
      formData.append('enable_training', enableTraining.toString());
      formData.append('debug', debugMode.toString());
      formData.append('chain_mode', 'true');
      formData.append('run_parallel_tests', 'true');

      const response = await fetch(`${API_BASE_URL}/analyze-plant`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data: AnalysisResponse = await response.json();
      setAnalysisResponse(data);
      
      // Parse the response into detection results
      const results = parseLLMResponseToDetectionResult(data);
      setDetectionResults(results);

      // Cache results keyed by current image preview
      if (imagePreview) {
        setAnalysisCache(imagePreview, data, results);
      }

      // Persist primary detection for downstream modules (e.g., NutriDose)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const primaryDiagnosis = (data as any)?.detection?.diagnosis 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          || (data as any)?.classification?.predicted_class 
          || (results && results[0]?.name) 
          || null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const category = (data as any)?.detection?.category || null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const confidence = (data as any)?.classification?.confidence ?? null;
        const severity = (data as any)?.detection?.severity ?? null;
        const stash = {
          diagnosis: primaryDiagnosis,
          category,
          confidence,
          severity,
          provider: (data as any)?.agent_decision?.selected_provider || null,
          timestamp: new Date().toISOString()
        };
        if (typeof window !== 'undefined' && primaryDiagnosis) {
          window.localStorage.setItem('agri_last_detection', JSON.stringify(stash));
        }
      } catch (e) {
        console.warn('Failed to persist detection for cross-module use', e);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
      try { 
        if (typeof window !== 'undefined') 
          window.localStorage.removeItem('agri_analyzing'); 
      } catch {
        // Ignore localStorage errors
      }
    }
  };

  // Clear uploaded image and results
  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setDetectionResults([]);
    setAnalysisResponse(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  try { if (typeof window !== 'undefined') window.localStorage.removeItem('agri_last_upload'); } catch {}
  };

  const cropShieldServices = [
    {
      title: "Pest Identification Service",
      titleTelugu: "పేస్ట్ గుర్తింపు సేవ",
      description: "Expert identification of pests and insects",
      descriptionTelugu: "కీటకాలు మరియు పురుగుల నిపుణుల గుర్తింపు",
      duration: "1-2 hours",
      price: "₹700",
      icon: Bug,
      available: true
    },
    {
      title: "Disease Diagnosis",
      titleTelugu: "వ్యాధి నిర్ధారణ",
      description: "Professional plant disease identification and treatment",
      descriptionTelugu: "వృత్తిపరమైన మొక్క వ్యాధుల గుర్తింపు మరియు చికిత్స",
      duration: "1.5 hours",
      price: "₹800",
      icon: Microscope,
      available: true
    },
    {
      title: "Pesticide Application Guidance",
      titleTelugu: "పురుగుమందు వినియోగ మార్గదర్శనం",
      description: "Safe and effective pesticide application methods",
      descriptionTelugu: "సురక్షిత మరియు ప్రభావవంతమైన పురుగుమందు వినియోగ పద్ధతులు",
      duration: "2 hours",
      price: "₹1,000",
      icon: Zap,
      available: true
    },
    {
      title: "Preventive Measures Planning",
      titleTelugu: "నివారణ చర్యల ప్రణాళిక",
      description: "Comprehensive pest and disease prevention strategies",
      descriptionTelugu: "సమగ్ర కీటకాలు మరియు వ్యాధుల నివారణ వ్యూహాలు",
      duration: "1.5 hours",
      price: "₹900",
      icon: Shield,
      available: true
    },
    {
      title: "Crop Protection Scheduling",
      titleTelugu: "పంట రక్షణ షెడ్యూలింగ్",
      description: "Timely crop protection schedule and monitoring plan",
      descriptionTelugu: "సకాలంలో పంట రక్షణ షెడ్యూల్ మరియు పర్యవేక్షణ ప్రణాళిక",
      duration: "1 hour",
      price: "₹600",
      icon: Calendar,
      available: true
    },
    {
      title: "Live Video Consultation",
      titleTelugu: "ప్రత్యక్ష వీడియో సలహా",
      description: "Instant expert guidance on crop protection queries",
      descriptionTelugu: "పంట రక్షణ ప్రశ్నలపై తక్షణ నిపుణుల మార్గదర్శనం",
      duration: "30 minutes",
      price: "₹400",
      icon: Video,
      available: true
    }
  ];

  // Dynamic weather data - in a real app, this would come from an API
  // const weatherData = {
  //   temperature: 28,
  //   humidity: 65,
  //   windSpeed: 12,
  //   rainfall: 0,
  //   forecast: "Partly cloudy, ideal for spraying"
  // };

  // const vendors = [
  //   {
  //     name: "PestControl Pro",
  //     distance: "2.5 km",
  //     rating: 4.8,
  //     speciality: "Organic Solutions",
  //     phone: "+91 98765 43210",
  //     services: ["Drone Spray", "Manual Application", "IPM Consultation"],
  //     price: "₹800/acre",
  //     availability: "Available today",
  //     sla: "Same day service",
  //     equipment: "DJI Agras T20 Drone",
  //     experience: "8 years",
  //     completedJobs: 450
  //   },
  //   {
  //     name: "AgroCare Services",
  //     distance: "4.2 km", 
  //     rating: 4.6,
  //     speciality: "Integrated Pest Management",
  //     phone: "+91 87654 32109",
  //     services: ["Tractor Spray", "Ground Equipment", "Pest Monitoring"],
  //     price: "₹600/acre",
  //     availability: "Available tomorrow",
  //     sla: "24 hour service",
  //     equipment: "John Deere Sprayer",
  //     experience: "12 years",
  //     completedJobs: 780
  //   },
  //   {
  //     name: "Green Shield Solutions",
  //     distance: "6.8 km",
  //     rating: 4.7,
  //     speciality: "Bio-pesticides",
  //     phone: "+91 76543 21098",
  //     services: ["Organic Spray", "Labor Supply", "Field Monitoring"],
  //     price: "₹950/acre",
  //     availability: "Available in 2 days",
  //     sla: "48 hour service",
  //     equipment: "Yamaha RMAX Drone",
  //     experience: "6 years",
  //     completedJobs: 320
  //   }
  // ];

  const fieldServices = [
    {
      category: "Drone Services",
      providers: [
        { name: "SkyFarm Drones", rating: 4.9, price: "₹800/acre", time: "2 hours" },
        { name: "AeroAgri Solutions", rating: 4.7, price: "₹750/acre", time: "3 hours" }
      ]
    },
    {
      category: "Tractor Services", 
      providers: [
        { name: "FarmMech Services", rating: 4.8, price: "₹600/acre", time: "4 hours" },
        { name: "Kisan Tractors", rating: 4.5, price: "₹550/acre", time: "5 hours" }
      ]
    },
    {
      category: "Labor Services",
      providers: [
        { name: "AgriLabor Co-op", rating: 4.6, price: "₹400/acre", time: "1 day" },
        { name: "Rural Workers Union", rating: 4.4, price: "₹350/acre", time: "1.5 days" }
      ]
    }
  ];

  return (
    <div className="max-w-full mx-auto px-6 py-8">
      <AgriChatAgent />
      <AgriAIPilotSidePeek 
        agentType="CropShield"
        agentName="CropShield"
        agentNameTelugu="పంట రక్షణ"
        services={cropShieldServices}
      />
        <Tabs defaultValue="detection" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="detection">AI Detection</TabsTrigger>
            <TabsTrigger value="treatment">Treatment Plans</TabsTrigger>
            <TabsTrigger value="vendors">Field Services</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="detection" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="agri-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-primary" />
                      AI Computer Vision Detection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* LLM Model Selection */}
                    <div className="mb-6 flex items-center gap-4">
                      <label className="text-sm font-medium">AI Model:</label>
                      <Select value={selectedLLM} onValueChange={setSelectedLLM}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                          <SelectItem value="gemini-2.0-flash-001">Gemini 2.0 Flash 001</SelectItem>
                          <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    {/* Image Upload Area */}
                    {!imagePreview ? (
                      <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center mb-6 hover:border-primary/50 transition-colors">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
                        <h3 className="text-lg font-semibold mb-2">Upload Crop Image</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          పంట చిత్రాన్ని అప్‌లోడ్ చేయండి | Drag & drop or click to upload
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button 
                            className="agri-button-secondary"
                            onClick={() => cameraInputRef.current?.click()}
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Camera
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Gallery
                          </Button>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                        <input
                          ref={cameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleCameraCapture}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="mb-6">
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Uploaded crop" 
                            className="w-full max-w-md mx-auto rounded-lg border border-border"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={clearImage}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2 justify-center mt-4">
                          <Button 
                            onClick={analyzeImage}
                            disabled={isAnalyzing}
                            className="agri-button-primary"
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Microscope className="w-4 h-4 mr-2" />
                                Analyze Image
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isAnalyzing}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Change Image
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Detection Results */}
                    {detectionResults.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Detection Results | గుర్తింపు ఫలితాలు</h3>
                        
                        {analysisResponse && (
                          <div className="mb-4 p-3 bg-info/10 border border-info/20 rounded-lg">
                            <p className="text-sm text-info">
                              <strong>Analysis Time:</strong> {analysisResponse.processing_time_seconds.toFixed(2)}s | 
                              <strong> Selected Provider:</strong> {analysisResponse.agent_decision.selected_provider} | 
                              <strong> Confidence:</strong> {Math.round(analysisResponse.agent_decision.confidence * 100)}%
                            </p>
                          </div>
                        )}
                        
                        {detectionResults.map((issue, index) => (
                          <div key={index} className="p-4 border rounded-lg bg-muted/30">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <AlertTriangle className={`w-5 h-5 ${
                                    issue.severity === 'high' ? 'text-destructive' : 
                                    issue.severity === 'medium' ? 'text-warning' : 'text-success'
                                  }`} />
                                  <h4 className="font-semibold">{issue.name}</h4>
                                  <Badge 
                                    variant={issue.severity === 'high' ? 'destructive' : 
                                           issue.severity === 'medium' ? 'default' : 'secondary'}
                                  >
                                    {issue.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-accent font-medium">{issue.telugu}</p>
                                <p className="text-xs text-muted-foreground mb-2">Confidence: {issue.confidence}%</p>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full" 
                                    style={{ width: `${issue.confidence}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                              <div>
                                <p className="text-muted-foreground">Treatment</p>
                                <p className="font-semibold">{issue.treatment}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Cost</p>
                                <p className="font-semibold">{issue.cost}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Affected Area</p>
                                <p className="font-semibold">{issue.affectedArea}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Urgency</p>
                                <p className="font-semibold text-destructive">{issue.urgency}</p>
                              </div>
                            </div>

                            {/* Safety & Buffer Zone Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-warning/10 p-3 rounded border border-warning/20">
                              <div>
                                <p className="text-muted-foreground flex items-center gap-1">
                                  <Target className="w-3 h-3" /> Buffer Zone
                                </p>
                                <p className="font-semibold">{issue.bufferZone}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Safety Period
                                </p>
                                <p className="font-semibold">{issue.safetyPeriod}</p>
                              </div>
                            </div>

                            <div className="mt-3 p-2 bg-info/10 rounded border border-info/20">
                              <p className="text-xs text-info flex items-center gap-1">
                                <CloudRain className="w-3 h-3" />
                                Weather Impact: {issue.weatherRisk}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Risk Summary */}
              <div className="space-y-6">
                <Card className="agri-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-primary" />
                      Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {detectionResults.length > 0 ? (
                        <>
                          {(() => {
                            const highRiskCount = detectionResults.filter(r => r.severity === 'high').length;
                            const mediumRiskCount = detectionResults.filter(r => r.severity === 'medium').length;
                            const totalCost = detectionResults.reduce((sum, r) => {
                              const cost = parseInt(r.cost.replace(/[₹,/]/g, '').split('/')[0]);
                              return sum + cost;
                            }, 0);
                            
                            const riskLevel = highRiskCount > 0 ? 'HIGH' : mediumRiskCount > 0 ? 'MEDIUM' : 'LOW';
                            const riskColor = riskLevel === 'HIGH' ? 'text-destructive' : riskLevel === 'MEDIUM' ? 'text-warning' : 'text-success';
                            const riskBg = riskLevel === 'HIGH' ? 'bg-destructive/10 border-destructive/20' : 
                                          riskLevel === 'MEDIUM' ? 'bg-warning/10 border-warning/20' : 'bg-success/10 border-success/20';
                            
                            return (
                              <>
                                <div className={`text-center p-4 rounded-lg border ${riskBg}`}>
                                  <div className={`text-3xl font-bold ${riskColor}`}>{riskLevel}</div>
                                  <p className="text-sm font-semibold">Risk Level</p>
                                  <p className="text-xs text-muted-foreground">
                                    {riskLevel === 'HIGH' ? 'Immediate action required' :
                                     riskLevel === 'MEDIUM' ? 'Action needed within days' : 'Monitor and assess'}
                                  </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="text-center p-3 bg-warning/10 rounded-lg">
                                    <p className="text-lg font-bold text-warning">{detectionResults.length}</p>
                                    <p className="text-xs">Issues Detected</p>
                                  </div>
                                  <div className="text-center p-3 bg-destructive/10 rounded-lg">
                                    <p className="text-lg font-bold text-destructive">₹{totalCost}</p>
                                    <p className="text-xs">Est. Treatment Cost</p>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="text-center p-4 bg-muted/10 rounded-lg border border-muted/20">
                          <div className="text-lg font-semibold text-muted-foreground">No Analysis Yet</div>
                          <p className="text-sm text-muted-foreground">Upload an image to get risk assessment</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="treatment" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="agri-card">
                <CardHeader>
                  <CardTitle>Treatment Protocols | చికిత్స ప్రోటోకాల్స్</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {detectionResults.length > 0 ? (
                      <>
                        {detectionResults.map((issue, index) => (
                          <div 
                            key={index}
                            className={`p-4 rounded-lg border ${
                              issue.severity === 'high' ? 'bg-destructive/10 border-destructive/20' :
                              issue.severity === 'medium' ? 'bg-warning/10 border-warning/20' :
                              'bg-success/10 border-success/20'
                            }`}
                          >
                            <h3 className={`font-semibold mb-2 ${
                              issue.severity === 'high' ? 'text-destructive' :
                              issue.severity === 'medium' ? 'text-warning' :
                              'text-success'
                            }`}>
                              {issue.severity === 'high' ? '🚨' : issue.severity === 'medium' ? '⚠️' : '✅'} 
                              {issue.severity === 'high' ? ' Immediate Action Required' :
                               issue.severity === 'medium' ? ' Action Needed' : ' Monitor'}
                            </h3>
                            <p className="text-sm mb-3">
                              {issue.name} ({issue.telugu}) detected with {issue.confidence}% confidence. 
                              {issue.severity === 'high' ? ' Treatment needed within ' + issue.urgency :
                               issue.severity === 'medium' ? ' Action recommended within ' + issue.urgency :
                               ' Monitor and assess severity.'}
                            </p>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Treatment:</span>
                                <span className="font-semibold">{issue.treatment}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Cost:</span>
                                <span className="font-semibold">{issue.cost}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Urgency:</span>
                                <span className="font-semibold">{issue.urgency}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Buffer Zone:</span>
                                <span className="font-semibold">{issue.bufferZone}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Safety Period:</span>
                                <span className="font-semibold">{issue.safetyPeriod}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                              {issue.severity === 'high' && (
                                <Button size="sm" className="bg-destructive hover:bg-destructive/90">
                                  Emergency Treatment
                                </Button>
                              )}
                              {issue.severity === 'medium' && (
                                <Button size="sm" className="bg-warning hover:bg-warning/90 text-warning-foreground">
                                  Schedule Treatment
                                </Button>
                              )}
                              <Button size="sm" variant="outline">
                                Get Expert Advice
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {analysisResponse && (
                          <div className="p-4 bg-info/10 rounded-lg border border-info/20">
                            <h3 className="font-semibold text-info mb-2">🤖 AI Recommendation</h3>
                            <p className="text-sm mb-3">{analysisResponse.agent_decision.selected_response}</p>
                            <div className="text-xs text-muted-foreground">
                              <p><strong>Provider:</strong> {analysisResponse.agent_decision.selected_provider}</p>
                              <p><strong>Confidence:</strong> {Math.round(analysisResponse.agent_decision.confidence * 100)}%</p>
                              <p><strong>Reasoning:</strong> {analysisResponse.agent_decision.reasoning}</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center p-4 bg-muted/10 rounded-lg border border-muted/20">
                        <div className="text-lg font-semibold text-muted-foreground">No Treatment Plans Yet</div>
                        <p className="text-sm text-muted-foreground">Upload and analyze an image to get treatment recommendations</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="agri-card">
                <CardHeader>
                  <CardTitle>Application Guidelines | అప్లికేషన్ మార్గదర్శకాలు</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-field rounded-lg border border-primary/20">
                      <h4 className="font-semibold mb-3">Spray Conditions</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Wind Speed</p>
                          <p className="font-semibold">&lt; 15 km/h</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Temperature</p>
                          <p className="font-semibold">20-30°C</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Humidity</p>
                          <p className="font-semibold">&gt; 50%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Time</p>
                          <p className="font-semibold">Early morning/Evening</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">Safety Protocols</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span>Wear protective equipment</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span>Check wind direction</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span>Maintain buffer zones</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span>Follow pre-harvest intervals</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-info/10 rounded border border-info/20">
                      <h4 className="font-semibold text-sm mb-2">Application Checklist</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Equipment calibrated</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Weather conditions suitable</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Buffer zones marked</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Safety gear ready</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="agri-card">
                  <CardHeader>
                    <CardTitle>Field Services Marketplace | క్షేత్ర సేవల మార్కెట్‌ప్లేస్</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="drone" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="drone">Drone Services</TabsTrigger>
                        <TabsTrigger value="tractor">Tractor Services</TabsTrigger>
                        <TabsTrigger value="labor">Labor Services</TabsTrigger>
                      </TabsList>

                      {fieldServices.map((service, index) => (
                        <TabsContent key={index} value={service.category.toLowerCase().split(' ')[0]} className="space-y-4 mt-4">
                          <h3 className="text-lg font-semibold">{service.category}</h3>
                          <div className="space-y-4">
                            {service.providers.map((provider, pIndex) => (
                              <div key={pIndex} className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-semibold">{provider.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                      <span className="text-sm">{provider.rating}</span>
                                      <Badge variant="outline">{provider.time}</Badge>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-primary">{provider.price}</p>
                                    <Badge className="bg-success text-success-foreground">Available</Badge>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button size="sm" className="agri-button-primary flex-1">
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Book Service
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Phone className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="agri-card">
                  <CardHeader>
                    <CardTitle>Service Request</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Service Type</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="drone">Drone Spray</SelectItem>
                            <SelectItem value="tractor">Tractor Application</SelectItem>
                            <SelectItem value="manual">Manual Labor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Area (acres)</label>
                        <Input type="number" placeholder="Enter area" />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Urgency</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select urgency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="tomorrow">Tomorrow</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Additional Notes</label>
                        <Textarea placeholder="Special requirements..." rows={3} />
                      </div>
                      
                      <Button className="w-full agri-button-primary">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Send Emergency Alert
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="agri-card">
                  <CardHeader>
                    <CardTitle>Active Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-3 bg-warning/10 rounded">
                        <div>
                          <p className="font-semibold">SkyFarm Drones</p>
                          <p className="text-xs text-muted-foreground">15 acres • Bollworm treatment</p>
                        </div>
                        <Badge className="bg-warning text-warning-foreground">In Progress</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-success/10 rounded">
                        <div>
                          <p className="font-semibold">AgroCare Services</p>
                          <p className="text-xs text-muted-foreground">8 acres • Preventive spray</p>
                        </div>
                        <Badge className="bg-success text-success-foreground">Completed</Badge>
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
                  <CardTitle>Treatment History | చికిత్స చరిత్ర</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-3 bg-success/10 rounded">
                      <div>
                        <p className="font-semibold">March 10 - Bt Spray</p>
                        <p className="text-xs text-muted-foreground">15 acres • Bollworm control</p>
                        <p className="text-xs text-muted-foreground">SkyFarm Drones • ₹12,000</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-success text-success-foreground">Completed</Badge>
                        <p className="text-xs mt-1">95% effective</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-success/10 rounded">
                      <div>
                        <p className="font-semibold">March 5 - Fungicide</p>
                        <p className="text-xs text-muted-foreground">8 acres • Leaf curl prevention</p>
                        <p className="text-xs text-muted-foreground">AgroCare Services • ₹4,800</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-success text-success-foreground">Completed</Badge>
                        <p className="text-xs mt-1">88% effective</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-muted rounded">
                      <div>
                        <p className="font-semibold">Feb 28 - Neem Oil</p>
                        <p className="text-xs text-muted-foreground">25 acres • Preventive spray</p>
                        <p className="text-xs text-muted-foreground">Manual application • ₹2,500</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">Completed</Badge>
                        <p className="text-xs mt-1">Preventive</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="agri-card">
                <CardHeader>
                  <CardTitle>Proof of Delivery | డెలివరీ రుజువు</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">March 10 - Bt Spray</h4>
                          <p className="text-sm text-muted-foreground">SkyFarm Drones</p>
                        </div>
                        <Badge className="bg-success text-success-foreground">Verified</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Start Time</p>
                          <p className="font-semibold">6:30 AM</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">End Time</p>
                          <p className="font-semibold">8:45 AM</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">GPS Location</p>
                          <p className="font-semibold">17.3850°N, 78.4867°E</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Area Covered</p>
                          <p className="font-semibold">15.2 acres</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="w-3 h-3 mr-1" />
                          View Photos
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <FileText className="w-3 h-3 mr-1" />
                          Receipt
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">March 5 - Fungicide</h4>
                          <p className="text-sm text-muted-foreground">AgroCare Services</p>
                        </div>
                        <Badge className="bg-success text-success-foreground">Verified</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Start Time</p>
                          <p className="font-semibold">7:00 AM</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">End Time</p>
                          <p className="font-semibold">11:30 AM</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Equipment</p>
                          <p className="font-semibold">John Deere Sprayer</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Area Covered</p>
                          <p className="font-semibold">8.0 acres</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="w-3 h-3 mr-1" />
                          View Photos
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          GPS Track
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        <AgentVideoSection
          agentName="CropShield"
          agentNameTelugu="పంట రక్షణ"
          videos={[
            {
              title: "AI Pest Detection in Action",
              titleTelugu: "AI పెస్ట్ గుర్తింపు ప్రక్రియ",
              duration: "6:50",
              type: "demo"
            },
            {
              title: "Integrated Pest Management",
              titleTelugu: "సమగ్ర కీట నిర్వహణ",
              duration: "13:30",
              type: "tutorial"
            },
            {
              title: "90% Crop Loss Prevention Success",
              titleTelugu: "90% పంట నష్ట నివారణ విజయం",
              duration: "7:20",
              type: "case-study"
            }
          ]}
        />
      </div>
  );
};

export default CropShield;