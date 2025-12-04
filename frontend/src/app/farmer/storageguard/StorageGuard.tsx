import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Progress } from "../ui/progress";
import { 
  Wind, Truck, Shield, 
  BarChart3, Clock, CheckCircle, Package2,
  Snowflake, Wheat, MapPin, Users, FileText,
  Camera, Eye, Scan, Gauge,
  Receipt, FileCheck, Smartphone, Phone, Copy
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "../ui/use-toast";


import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import AgentVideoSection from "../AgentVideoSection";
import StorageLocationMap from "../storageguard/StorageLocationMap";

const StorageGuard = () => {
    // Job details modal state
    const [showJobModal, setShowJobModal] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [jobDetails, setJobDetails] = useState<any>(null);
    const [jobDetailsLoading, setJobDetailsLoading] = useState(false);

    // Fetch job details when selectedJobId changes
    useEffect(() => {
      if (selectedJobId) {
        setJobDetailsLoading(true);
        fetch(`${API_BASE}/storage-guard/jobs/${selectedJobId}`)
          .then(res => res.json())
          .then(data => {
            setJobDetails(data.job || null);
            setJobDetailsLoading(false);
          })
          .catch(() => setJobDetailsLoading(false));
      } else {
        setJobDetails(null);
      }
    }, [selectedJobId]);
  const { toast } = useToast();
  
  // State for API data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [storageRFQs, setStorageRFQs] = useState<any[]>([]);
  const [rfqBids, setRfqBids] = useState<{ [key: string]: any[] }>({}); // Store bids for each RFQ
  const [expandedRfqId, setExpandedRfqId] = useState<string | null>(null); // Track which RFQ is expanded
  const [storageJobs, setStorageJobs] = useState<any[]>([]);
  const [storageVendors, setStorageVendors] = useState<any[]>([]);
  const [storageLocations, setStorageLocations] = useState<any[]>([]);
  const [storageMetrics, setStorageMetrics] = useState<any[]>([]);
  const [transportData, setTransportData] = useState<any>(null);
  const [proofOfDeliveryData, setProofOfDeliveryData] = useState<any>(null);
  const [qualityData, setQualityData] = useState<any>(null);
  const [iotSensorData, setIotSensorData] = useState<any>(null);
  const [pestDetectionData, setPestDetectionData] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [justUpdated, setJustUpdated] = useState<boolean>(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState<boolean>(false);
  const [iotPestRefreshInterval, setIotPestRefreshInterval] = useState<number>(5000); // Auto-refresh IoT/Pest every 5s
  const [isIotPestRefreshing, setIsIotPestRefreshing] = useState<boolean>(false);
  const [isDashboardRefreshing, setIsDashboardRefreshing] = useState<boolean>(false);
  const [dashboardRefreshInterval, setDashboardRefreshInterval] = useState<number>(10000); // Auto-refresh dashboard every 10s
  const [isMetricsRefreshing, setIsMetricsRefreshing] = useState<boolean>(false);
  const [metricsRefreshInterval, setMetricsRefreshInterval] = useState<number>(8000); // Auto-refresh metrics every 8s
  const [locationUtilization, setLocationUtilization] = useState<{ [key: string]: number }>({}); // Real utilization per location
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [showInventoryDebug, setShowInventoryDebug] = useState<boolean>(false);
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // New booking system state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [storageSuggestions, setStorageSuggestions] = useState<any[]>([]);
  const [selectedStorage, setSelectedStorage] = useState<any>(null);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [farmerDashboard, setFarmerDashboard] = useState<any>(null);
  const [currentInspectionId, setCurrentInspectionId] = useState<string | null>(null); // ✅ Track AI inspection ID
  const [showTelugu, setShowTelugu] = useState(true); // 🌐 Language toggle (Telugu enabled by default)
  
  // Inspection scheduling state
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [scheduledInspections, setScheduledInspections] = useState<any[]>([]);
  const [inspectionFormData, setInspectionFormData] = useState({
    inspectionType: 'pre_storage',
    bookingId: '',
    cropType: '',
    quantityKg: '',
    locationAddress: '',
    requestedDate: '',
    preferredTimeSlot: 'morning',
    farmerNotes: ''
  });
  
  const [bookingFormData, setBookingFormData] = useState({
    cropType: '',
    quantityKg: '',
    durationDays: '',
    specialRequirements: ''
  });

  // API base URL
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  // 🌐 Bilingual labels (Telugu + English)
  const t = (english: string, telugu: string) => {
    if (!showTelugu) return english;
    return `${telugu} / ${english}`;
  };

  const teluguLabels = {
    crop: 'పంట / Crop',
    quality: 'నాణ్యత / Quality',
    grade: 'గ్రేడ్ / Grade',
    freshness: 'తాజాతనం / Freshness',
    defects: 'లోపాలు / Defects',
    shelfLife: 'షెల్ఫ్ లైఫ్ / Shelf Life',
    days: 'రోజులు / days',
    quantity: 'పరిమాణం / Quantity',
    duration: 'వ్యవధి / Duration',
    startDate: 'ప్రారంభ తేదీ / Start Date',
    totalAmount: 'మొత్తం మొత్తం / Total Amount',
    pending: 'పెండింగ్ / PENDING',
    confirmed: 'నిర్ధారించబడింది / CONFIRMED',
    completed: 'పూర్తయింది / COMPLETED',
    cancelled: 'రద్దు చేయబడింది / CANCELLED',
    certificateEligible: '✅ సర్టిఫికేట్ అర్హత (AI ధృవీకరించబడింది) / Certificate Eligible (AI Verified)',
    noCertificate: '⚠️ సర్టిఫికేట్ లేదు (త్వరిత బుకింగ్) / No Certificate (Quick Booking)',
    waitingVendor: '⏳ విక్రేత ఆమోదం కోసం వేచి ఉంది / Waiting for Vendor Acceptance',
    cancelBooking: 'బుకింగ్ రద్దు చేయండి / Cancel Booking',
    completeBooking: 'పూర్తి & సర్టిఫికేట్ రూపొందించండి / Complete & Generate Certificate',
    noCertificateAvailable: '🔒 సర్టిఫికేట్ అందుబాటులో లేదు (AI లేదు) / Certificate Unavailable (No AI)',
    excellent: 'అత్యుత్తమ / Excellent',
    good: 'మంచి / Good',
    fair: 'సరైన / Fair',
    poor: 'పేద / Poor'
  };

  // Utility function to get user ID using tab-isolated storage
  const getUserId = (): string | null => {
    try {
      // Use tab-isolated storage from auth library
      // This ensures each tab keeps its own session
      const authUserStr = sessionStorage.getItem('user__' + (sessionStorage.getItem('_agri_tab_id') || ''));
      if (authUserStr) {
        const user = JSON.parse(authUserStr);
        return user.id || user.userId || user.user_id;
      }
      // No window.getTabStorage in this context; rely on sessionStorage only for tab isolation
    } catch (e) {
      console.error('Tab-isolated userId fetch error:', e);
    }
    return null;
  };


  // Upload handler for proof images (Loading, Transport, Delivery)
  const handleImageUpload = async (proofType: string) => {
    const userId = getUserId();
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please login to upload proof images",
        variant: "destructive",
      });
      return;
    }

    // Get booking ID (you can modify this to select from active bookings)
    const bookingId = prompt('Enter your Booking ID (from My Bookings tab):');
    if (!bookingId || !bookingId.trim()) {
      toast({
        title: "Booking ID Required",
        description: "Please enter a booking ID to attach proof",
        variant: "destructive",
      });
      return;
    }

    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use camera on mobile
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Show upload progress
      toast({
        title: "Uploading Proof...",
        description: `Uploading ${proofType} photo`,
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('proof_type', proofType);
      formData.append('booking_id', bookingId.trim());
      formData.append('farmer_id', userId);
      formData.append('timestamp', new Date().toISOString());

      try {
        // Upload to backend (you'll need to create this endpoint)
        const response = await fetch(`${API_BASE}/storage-guard/upload-proof`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          toast({
            title: "✅ Proof Uploaded Successfully!",
            description: (
              <div className="space-y-1 mt-2">
                <p><strong>Type:</strong> {proofType}</p>
                <p><strong>Booking:</strong> {bookingId}</p>
                <p><strong>File:</strong> {file.name}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  This proof will be attached to your certificate
                </p>
              </div>
            ),
          });

          // Refresh proof data
          const proofResponse = await fetch(`${API_BASE}/storage-guard/proof-of-delivery?farmer_id=${userId}`);
          if (proofResponse.ok) {
            const proofData = await proofResponse.json();
            setProofOfDeliveryData(proofData);
          }
        } else {
          const errorData = await response.json();
          toast({
            title: "Upload Failed",
            description: errorData.detail || "Failed to upload proof image",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Proof upload error:', error);
        toast({
          title: "Upload Error",
          description: "Network error while uploading proof",
          variant: "destructive",
        });
      }
    };

    input.click();
  };

  // Upload handler for quality analysis images
  const handleQualityImageUpload = async () => {
    // Ask user for crop name
    const cropName = prompt('Enter crop name (e.g., Corn, Tomato, Potato):');
    if (!cropName || !cropName.trim()) {
      toast({
        title: "Crop Name Required",
        description: "Please enter a crop name to continue",
        variant: "destructive",
      });
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const userId = getUserId();
      if (!userId) {
        toast({
          title: "Authentication Required",
          description: "Please login first to upload images",
          variant: "destructive",
        });
        return;
      }

      // Ask for quantity
      const quantityInput = prompt('Enter quantity in kg (default: 500):', '500');
      const quantity = quantityInput ? parseFloat(quantityInput) : 500;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('crop_type', cropName.trim());  // Send crop name to backend
      formData.append('quantity_kg', quantity.toString());  // Send quantity

      try {
        const response = await fetch(`${API_BASE}/storage-guard/analyze?farmer_id=${userId}`, {
          method: 'POST',
          body: formData
        });
        if (response.ok) {
          const data = await response.json();
          toast({
            title: "✅ Quality Analysis Complete!",
            description: (
              <div className="mt-2 space-y-1">
                <p><strong>Crop:</strong> {cropName}</p>
                <p><strong>Grade:</strong> {data.report?.overall_quality}</p>
                <p><strong>Shelf Life:</strong> {data.report?.shelf_life_days} days</p>
                <p><strong>Defects Found:</strong> {data.report?.defects_found || 0}</p>
                <p className="text-green-600 font-medium mt-2">RFQ created for vendor bidding</p>
              </div>
            ),
            duration: 8000,
          });
          
          // Refetch quality analysis data (per farmer)
          const qualityRes = await fetch(`${API_BASE}/storage-guard/quality-analysis?farmer_id=${userId}`);
          if (qualityRes.ok) {
            const qualityDataResponse = await qualityRes.json();
            setQualityData(qualityDataResponse);
          }
          
          // Refetch RFQs to show the newly created one
          fetchMyBookings();
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast({
            title: "Upload Failed",
            description: errorData.detail || "Please try again",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Quality upload error:', error);
        toast({
          title: "Error Uploading Image",
          description: "Please check your connection and try again",
          variant: "destructive",
        });
      }
    };
    input.click();
  };

  // New booking system handlers
  const handleAnalyzeAndSuggest = async (file: File, farmerLat: number, farmerLon: number) => {
    const userId = getUserId();
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please login first to continue",
        variant: "destructive",
      });
      return null;
    }

    // Ask for crop details
    const cropName = prompt('Enter crop name (e.g., Corn, Tomato, Potato):');
    if (!cropName || !cropName.trim()) {
      toast({
        title: "Crop Name Required",
        description: "Please enter a crop name for storage booking",
        variant: "destructive",
      });
      return null;
    }

    const quantityInput = prompt('Enter quantity in kg (default: 500):');
    const quantity = quantityInput ? parseFloat(quantityInput) : 500;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('crop_type', cropName.trim());
    formData.append('quantity_kg', quantity.toString());

    try {
      const response = await fetch(
        `${API_BASE}/storage-guard/analyze-and-suggest?farmer_id=${userId}&farmer_lat=${farmerLat}&farmer_lon=${farmerLon}`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Booking response:', data);
        
        // Show quality results
        const report = data.quality_report || data.report || data.analysis;
        if (report) {
          const freshnessTelugu = report.freshness === 'Excellent' ? 'అత్యుత్తమ' : 
                                  report.freshness === 'Good' ? 'మంచి' : 
                                  report.freshness === 'Fair' ? 'సరైన' : 'పేద';
          
          // Build defect display - show defects array and detailed analysis
          let defectDisplay = null;
          const hasDefects = Array.isArray(report.defects) && report.defects.length > 0;
          
          if (hasDefects || report.detailed_analysis) {
            defectDisplay = (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md space-y-2">
                {hasDefects && (
                  <>
                    <p className="font-semibold text-sm">
                      {showTelugu ? '⚠️ లోపాలు కనుగొనబడ్డాయి / Defects Found:' : '⚠️ Defects Found:'}
                    </p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      {report.defects.map((defect: any, idx: number) => {
                        const defectText = typeof defect === 'string' ? defect : (defect.type || 'Defect detected');
                        return <li key={idx} className="text-red-600 font-medium">{defectText}</li>;
                      })}
                    </ul>
                  </>
                )}
                {report.detailed_analysis && (
                  <div className="mt-2 pt-2 border-t border-yellow-300">
                    <p className="font-semibold text-sm mb-1">
                      {showTelugu ? '📊 వివరణాత్మక విశ్లేషణ / Detailed Analysis:' : '📊 Detailed Analysis:'}
                    </p>
                    <p className="text-sm">{report.detailed_analysis}</p>
                  </div>
                )}
              </div>
            );
          }

          // Build farmer advice display
          let adviceDisplay = null;
          if (report.farmer_advice) {
            adviceDisplay = (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="font-semibold text-sm mb-1">
                  {showTelugu ? '💡 రైతు సలహా / Farmer Advice:' : '💡 Farmer Advice:'}
                </p>
                <p className="text-sm">{report.farmer_advice}</p>
              </div>
            );
          }
          
          toast({
            title: showTelugu ? "✅ నాణ్యత విశ్లేషణ పూర్తయింది! / Quality Analysis Complete!" : "✅ Quality Analysis Complete!",
            description: (
              <div className="mt-2 space-y-1 max-h-[400px] overflow-y-auto">
                <p><strong>{showTelugu ? 'పంట / Crop:' : 'Crop:'}</strong> {cropName}</p>
                <p><strong>{showTelugu ? 'గ్రేడ్ / Grade:' : 'Grade:'}</strong> {report.overall_quality || report.quality_grade}</p>
                <p><strong>{showTelugu ? 'తాజాతనం / Freshness:' : 'Freshness:'}</strong> {showTelugu ? `${freshnessTelugu} / ${report.freshness}` : report.freshness}</p>
                <p><strong>{showTelugu ? 'షెల్ఫ్ లైఫ్ / Shelf Life:' : 'Shelf Life:'}</strong> {report.shelf_life_days} {showTelugu ? 'రోజులు / days' : 'days'}</p>
                {defectDisplay}
                {adviceDisplay}
                {showTelugu && <p className="text-green-600 font-medium mt-2">RFQ సృష్టించబడింది! విక్రేతలు ఇప్పుడు నిల్వ కోసం బిడ్ చేయవచ్చు.</p>}
                <p className="text-green-600 font-medium mt-2">RFQ created! Vendors can now bid for storage.</p>
              </div>
            ),
            duration: 15000,
          });
        }
        
        // ✅ AUTO-FILL booking form with AI analysis results
        const optimalDays = data.optimal_storage_days || report?.optimal_storage_days || 30;
        const quantityKg = data.quantity_kg || quantity;
        const detectedCrop = report?.crop_detected || cropName;
        
        // ✅ SAVE INSPECTION ID for certificate eligibility
        const inspectionId = data.inspection_id || null;
        setCurrentInspectionId(inspectionId);
        console.log(`🔬 AI Inspection ID saved: ${inspectionId}`);
        
        setBookingFormData({
          cropType: detectedCrop,
          quantityKg: quantityKg.toString(),
          durationDays: optimalDays.toString(),
          specialRequirements: ''
        });
        
        console.log(`📝 Form pre-filled: ${detectedCrop}, ${quantityKg}kg, ${optimalDays} days`);
        
        setStorageSuggestions(data.suggestions || data.storage_suggestions || []);
        setShowBookingModal(true);
        return data;
      } else {
        const errorData = await response.json();
        toast({
          title: "Analysis Failed",
          description: errorData.detail || "Please try again",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Connection Error",
        description: "Error analyzing image. Please check your connection.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleBookStorage = async () => {
    if (!selectedStorage) {
      toast({
        title: "Selection Required",
        description: "Please select a storage location to proceed",
        variant: "destructive",
      });
      return;
    }

    try {
      const userId = getUserId();

      if (!userId) {
        toast({
          title: "Authentication Error",
          description: "Unable to identify user. Please login again.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`${API_BASE}/storage-guard/bookings?farmer_id=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location_id: selectedStorage.location_id,
          crop_type: bookingFormData.cropType,
          quantity_kg: parseFloat(bookingFormData.quantityKg),
          duration_days: parseInt(bookingFormData.durationDays),
          start_date: new Date().toISOString(),
          transport_required: false,
          ai_inspection_id: currentInspectionId  // ✅ Use saved inspection ID from AI analysis
        })
      });

      if (response.ok) {
        const booking = await response.json();
        console.log(`✅ Booking created with AI inspection: ${currentInspectionId ? 'YES' : 'NO'}`);
        toast({
          title: "✅ Booking Created!",
          description: currentInspectionId 
            ? "Your storage booking has been created successfully. Certificate eligible!" 
            : "Your storage booking has been created successfully",
          duration: 5000,
        });
        setShowBookingModal(false);
        setCurrentInspectionId(null); // Reset for next booking
        fetchMyBookings();
        fetchFarmerDashboard();
        fetchTransportData(); // 🚚 Refresh transport fleet after new booking
        fetchLocationUtilization(); // 🏢 Update facility utilization in real-time on booking creation
      } else {
        const error = await response.json();
        toast({
          title: "Booking Failed",
          description: error.detail || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Error Creating Booking",
        description: "An error occurred while creating your booking",
        variant: "destructive",
      });
    }
  };

  const fetchMyBookings = async () => {
    try {
      const userId = getUserId();
      console.log('🔍 Fetching bookings for farmer:', userId);
      if (!userId) {
        console.error('❌ No user ID found! Check localStorage/sessionStorage');
        toast({
          title: "Authentication Issue",
          description: "User ID not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }
      
      console.log(`📡 Calling: ${API_BASE}/storage-guard/my-bookings?farmer_id=${userId}`);
      const response = await fetch(`${API_BASE}/storage-guard/my-bookings?farmer_id=${userId}`);
      console.log(`📥 Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Received ${data.total} bookings:`, data.bookings);
        setMyBookings(data.bookings || []);
        
        if (data.bookings && data.bookings.length === 0) {
          console.log('ℹ️ No bookings found for this farmer');
        }
      } else {
        console.error('❌ Bookings fetch failed:', response.status, await response.text());
        toast({
          title: "Failed to Load Bookings",
          description: `Server returned error ${response.status}`,
          variant: "destructive",
        });
      }
      
      // Also fetch farmer's RFQs
      const rfqResponse = await fetch(`${API_BASE}/storage-guard/rfqs?requester_id=${userId}`);
      if (rfqResponse.ok) {
        const rfqData = await rfqResponse.json();
        setStorageRFQs(rfqData.rfqs || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchFarmerDashboard = async () => {
    try {
      setIsDashboardRefreshing(true);
      const userId = getUserId();
      console.log('🔄 [auto] Fetching dashboard for farmer:', userId);
      if (!userId) {
        console.error('❌ No user ID found! Check localStorage/sessionStorage');
        return;
      }
      const response = await fetch(`${API_BASE}/storage-guard/farmer-dashboard?farmer_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [auto] Dashboard data received:', data.summary);
        setFarmerDashboard(data);
      } else {
        console.error('❌ Dashboard fetch failed:', response.status);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setIsDashboardRefreshing(false);
    }
  };

  // Fetch storage metrics for real-time dashboard
  const fetchStorageMetrics = async () => {
    try {
      setIsMetricsRefreshing(true);
      const userId = getUserId();
      if (!userId) return;
      
      const response = await fetch(`${API_BASE}/storage-guard/metrics?farmer_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 [auto] Storage metrics received:', data);
        setStorageMetrics(data.metrics || []);
      }
    } catch (error) {
      console.error('Error fetching storage metrics:', error);
    } finally {
      setIsMetricsRefreshing(false);
    }
  };

  // Fetch real location utilization based on actual bookings (triggered on booking creation)
  const fetchLocationUtilization = async () => {
    try {
      const response = await fetch(`${API_BASE}/storage-guard/location-utilization`);
      if (response.ok) {
        const data = await response.json();
        console.log('🏢 [REAL-TIME] Location utilization updated:', data);
        const utilizationMap: { [key: string]: number } = {};
        if (data.locations) {
          data.locations.forEach((loc: any) => {
            utilizationMap[loc.location_id] = loc.utilization_percent || 0;
          });
        }
        setLocationUtilization(utilizationMap);
      }
    } catch (error) {
      console.error('Error fetching location utilization:', error);
    }
  };

  // Fetch scheduled inspections
  const fetchScheduledInspections = async () => {
    try {
      const userId = getUserId();
      if (!userId) return;
      
      const response = await fetch(`${API_BASE}/storage-guard/my-inspections?farmer_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Inspections data:', data);
        setScheduledInspections(data.inspections || []);
      }
    } catch (error) {
      console.error('Error fetching inspections:', error);
    }
  };

  // Schedule new inspection
  const handleScheduleInspection = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        toast({
          title: "Authentication Required",
          description: "Please log in to schedule an inspection",
          variant: "destructive",
        });
        return;
      }

      // Validate form
      const missingFields = [];
      if (!inspectionFormData.cropType?.trim()) missingFields.push("Crop Type");
      if (!inspectionFormData.quantityKg || parseInt(inspectionFormData.quantityKg) <= 0) missingFields.push("Quantity");
      if (!inspectionFormData.locationAddress?.trim()) missingFields.push("Location Address");
      if (!inspectionFormData.requestedDate?.trim()) missingFields.push("Preferred Date");
      
      if (missingFields.length > 0) {
        toast({
          title: "Missing Information",
          description: `Please fill in: ${missingFields.join(", ")}`,
          variant: "destructive",
        });
        return;
      }

      const requestData = {
        inspection_type: inspectionFormData.inspectionType,
        booking_id: inspectionFormData.bookingId || null,
        crop_type: inspectionFormData.cropType,
        quantity_kg: parseInt(inspectionFormData.quantityKg),
        location_address: inspectionFormData.locationAddress,
        requested_date: new Date(inspectionFormData.requestedDate).toISOString(),
        preferred_time_slot: inspectionFormData.preferredTimeSlot,
        farmer_notes: inspectionFormData.farmerNotes || null
      };

      const response = await fetch(`${API_BASE}/storage-guard/schedule-inspection?farmer_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const inspection = await response.json();
        toast({
          title: "✅ Inspection Scheduled!",
          description: `Your inspection request has been submitted. You'll be notified once a vendor confirms.`,
          duration: 5000,
        });
        setShowInspectionModal(false);
        
        // Reset form
        setInspectionFormData({
          inspectionType: 'pre_storage',
          bookingId: '',
          cropType: '',
          quantityKg: '',
          locationAddress: '',
          requestedDate: '',
          preferredTimeSlot: 'morning',
          farmerNotes: ''
        });
        
        // Refresh inspections list
        fetchScheduledInspections();
      } else {
        const error = await response.json();
        toast({
          title: "Scheduling Failed",
          description: error.detail || "Failed to schedule inspection",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error scheduling inspection:', error);
      toast({
        title: "Error",
        description: "Network error while scheduling inspection",
        variant: "destructive",
      });
    }
  };

  // View certificate details
  const handleViewCertificate = async (certificateId: string) => {
    console.log('📜 Viewing certificate:', certificateId);
    
    if (!certificateId) {
      toast({
        title: "Error",
        description: "Certificate ID is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/storage-guard/certificates/${certificateId}`);
      console.log('Certificate response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Certificate data:', data);
        setSelectedCertificate(data.certificate || data);
        setShowCertificateModal(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Certificate fetch error:', errorData);
        toast({
          title: "Error",
          description: errorData.detail || "Could not load certificate",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching certificate:', error);
      toast({
        title: "Error",
        description: "Failed to load certificate details",
        variant: "destructive",
      });
    }
  };

  // Cancel inspection
  const handleCancelInspection = async (inspectionId: string) => {
    try {
      const userId = getUserId();
      if (!userId) return;

      const reason = prompt('Please provide a reason for cancellation:');
      if (!reason) return;

      const response = await fetch(`${API_BASE}/storage-guard/inspections/${inspectionId}/cancel?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellation_reason: reason })
      });

      if (response.ok) {
        toast({
          title: "Inspection Cancelled",
          description: "The inspection has been cancelled successfully",
        });
        fetchScheduledInspections();
      } else {
        const error = await response.json();
        toast({
          title: "Cancellation Failed",
          description: error.detail || "Failed to cancel inspection",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error cancelling inspection:', error);
    }
  };

  const fetchTransportData = async () => {
    try {
      console.log('🚚 Fetching transport fleet data...');
      const response = await fetch(`${API_BASE}/storage-guard/transport`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Transport data received:', data.transport_fleet);
        setTransportData(data);
      } else {
        console.error('❌ Transport fetch failed:', response.status);
      }
    } catch (error) {
      console.error('Error fetching transport data:', error);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const userId = getUserId();
      const response = await fetch(`${API_BASE}/storage-guard/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          cancellation_reason: 'User requested cancellation'
        })
      });

      if (response.ok) {
        toast({
          title: "Booking Cancelled",
          description: "Your booking has been cancelled successfully",
          duration: 5000,
        });
        fetchMyBookings();
        fetchFarmerDashboard();
        fetchTransportData(); // 🚚 Refresh transport fleet after cancellation
      } else {
        toast({
          title: "Cancellation Failed",
          description: "Failed to cancel booking. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast({
        title: "Error Cancelling Booking",
        description: "An error occurred while cancelling your booking",
        variant: "destructive",
      });
    }
  };

  const handleBookStorageClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Get user location (default to Hyderabad if not available)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleAnalyzeAndSuggest(file, position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Default location: Hyderabad
          handleAnalyzeAndSuggest(file, 17.385, 78.486);
        }
      );
    };
    input.click();
  };

  // Fetch storage data from integrated APIs (shared function)
  const fetchStorageData = async (opts: { background?: boolean } = {}) => {
    try {
      if (opts.background) setIsRefreshing(true);
      else setLoading(true);
      setInventoryLoading(true);
      
      const userId = getUserId();
      console.log('🔍 [fetchStorageData] userId:', userId);
      if (!userId) {
        console.warn('⚠️ [fetchStorageData] userId is null/empty, skipping fetch');
        setLoading(false);
        setInventoryLoading(false);
        return;
      }
      const [dashboardRes, rfqsRes, jobsRes, vendorsRes, locationsRes, metricsRes, transportRes, proofRes, qualityRes, iotRes, pestRes, inventoryRes] = await Promise.all([
        fetch(`${API_BASE}/storage-guard/dashboard`),
        fetch(`${API_BASE}/storage-guard/rfqs`),
        fetch(`${API_BASE}/storage-guard/jobs?farmer_id=${userId}`),
        fetch(`${API_BASE}/storage-guard/vendors`),
        fetch(`${API_BASE}/storage-guard/locations`),
        fetch(`${API_BASE}/storage-guard/metrics`),
        fetch(`${API_BASE}/storage-guard/transport`),
        fetch(`${API_BASE}/storage-guard/proof-of-delivery`),
        fetch(`${API_BASE}/storage-guard/quality-analysis?farmer_id=${userId}`),
        fetch(`${API_BASE}/storage-guard/iot-sensors`),
        fetch(`${API_BASE}/storage-guard/pest-detection`),
        fetch(`${API_BASE}/storage-guard/inventory?farmer_id=${userId}`)
      ]);

      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        setDashboardData(dashboardData);
      }

      if (rfqsRes.ok) {
        const rfqsData = await rfqsRes.json();
        const rfqs = rfqsData.rfqs || [];
        setStorageRFQs(rfqs);
        
        // Fetch bids for each open RFQ
        const bidsMap: { [key: string]: any[] } = {};
        for (const rfq of rfqs) {
          if (rfq.status === 'OPEN') {
            try {
              const bidsResponse = await fetch(`${API_BASE}/storage-guard/rfqs/${rfq.id}/bids`);
              if (bidsResponse.ok) {
                const bidsData = await bidsResponse.json();
                bidsMap[rfq.id] = bidsData.bids || [];
                console.log(`✅ Fetched ${bidsData.bids?.length || 0} bids for RFQ ${rfq.crop} (${rfq.id})`);
                if (bidsData.bids && bidsData.bids.length > 0) {
                  const firstBid = bidsData.bids[0];
                  console.log(`   🔍 First bid structure:`, {
                    hasVendor: !!firstBid.vendor,
                    hasLocation: !!firstBid.location,
                    vendorName: firstBid.vendor?.business_name || firstBid.vendor?.full_name,
                    locationName: firstBid.location?.name,
                    capacity: firstBid.location?.capacity_text
                  });
                }
              }
            } catch (err) {
              console.error(`Error fetching bids for RFQ ${rfq.id}:`, err);
            }
          }
        }
        console.log('📊 Total RFQs with bids:', Object.keys(bidsMap).length);
        setRfqBids(bidsMap);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setStorageJobs(jobsData.jobs || []);
      }

      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json();
        setStorageVendors(vendorsData.vendors || []);
      }

      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        setStorageLocations(locationsData.locations || []);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setStorageMetrics(metricsData.metrics || []);
      }

      if (transportRes.ok) {
        const transportDataResponse = await transportRes.json();
        setTransportData(transportDataResponse);
      }

      if (proofRes.ok) {
        const proofDataResponse = await proofRes.json();
        setProofOfDeliveryData(proofDataResponse);
      }

      if (qualityRes.ok) {
        const qualityDataResponse = await qualityRes.json();
        setQualityData(qualityDataResponse);
      }

      if (iotRes.ok) {
        const iotDataResponse = await iotRes.json();
        console.log('🔍 [API] IoT Sensors Response:', iotDataResponse);
        setIotSensorData(iotDataResponse);
      }

      if (pestRes.ok) {
        const pestDataResponse = await pestRes.json();
        console.log('🔍 [API] Pest Detection Response:', pestDataResponse);
        setPestDetectionData(pestDataResponse.detections || []);
      }

      if (inventoryRes && inventoryRes.ok) {
        const inventoryData = await inventoryRes.json();
        console.log('🔍 [API] Inventory Response (first 3 items):', inventoryData.inventory?.slice(0, 3));
        console.log('🔍 [API] First inventory item full structure:', JSON.stringify(inventoryData.inventory?.[0], null, 2));
        console.log('🔍 [API] Calling setInventory with count:', inventoryData.inventory?.length);
        setInventory(inventoryData.inventory || []);
      }

      // mark last updated time for UI
      setLastUpdated(new Date());
      // briefly mark UI as updated for optimistic highlight
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 900);

    } catch (error) {
      console.error('Error fetching storage data:', error);
    } finally {
      setLoading(false);
      setInventoryLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch only IoT and Pest data (for auto-refresh of sensor values)
  const fetchIotPestOnly = async () => {
    setIsIotPestRefreshing(true);
    try {
      const [iotRes, pestRes] = await Promise.all([
        fetch(`${API_BASE}/storage-guard/iot-sensors`),
        fetch(`${API_BASE}/storage-guard/pest-detection`)
      ]);

      if (iotRes.ok) {
        const iotDataResponse = await iotRes.json();
        console.log('🔄 [auto] /iot-sensors:', iotDataResponse);
        setIotSensorData(iotDataResponse);
        // Merge iot sensors into inventory by location_id so inventory cards update live
        try {
          const sensorsArray = iotDataResponse.sensors || [];
          const byLocation: { [key: string]: any[] } = {};
          sensorsArray.forEach((s: any) => {
            const lid = s.location_id || s.location || null;
            if (!lid) return;
            if (!byLocation[lid]) byLocation[lid] = [];
            byLocation[lid].push({
              sensor_type: s.sensor_type || s.sensorType || s.sensor_type,
              value: s.last_value ?? s.value ?? s.reading ?? null,
              unit: s.unit || s.reading_unit || '',
              reading_time: s.last_reading || s.reading_time || null,
              status: s.status || 'active'
            });
          });

          if (Object.keys(byLocation).length > 0) {
            setInventory((prev: any[]) => prev.map(item => {
              const loc = item.location_id || item.location || null;
              if (loc && byLocation[loc]) {
                return { ...item, iot_latest: byLocation[loc] };
              }
              return item;
            }));
          }
        } catch (err) {
          console.warn('Failed to merge IoT sensors into inventory:', err);
        }
      }

      if (pestRes.ok) {
        const pestDataResponse = await pestRes.json();
        console.log('🔄 [auto] /pest-detection:', pestDataResponse);
        setPestDetectionData(pestDataResponse.pest_detections || pestDataResponse.pest_detections || pestDataResponse.detections || []);
        // Merge pest detection into inventory by location_id (latest per location)
        try {
          const pests = pestDataResponse.pest_detections || pestDataResponse.detections || [];
          const pestByLoc: { [key: string]: any } = {};
          pests.forEach((p: any) => {
            const lid = p.location_id || (p.location_details && p.location_details.id) || null;
            if (!lid) return;
            // keep latest by detected_at
            const existing = pestByLoc[lid];
            const tExisting = existing && existing.detected_at ? new Date(existing.detected_at).getTime() : 0;
            const tNew = p.detected_at ? new Date(p.detected_at).getTime() : 0;
            if (!existing || tNew >= tExisting) {
              pestByLoc[lid] = {
                pest_type: p.pest_type || p.type || null,
                severity: p.severity_level || p.severity || null,
                confidence: p.confidence_score || p.confidence || null,
                detected_at: p.detected_at || null
              };
            }
          });

          if (Object.keys(pestByLoc).length > 0) {
            setInventory((prev: any[]) => prev.map(item => {
              const loc = item.location_id || item.location || null;
              if (loc && pestByLoc[loc]) {
                return { ...item, pest_latest: pestByLoc[loc] };
              }
              return item;
            }));
          }
        } catch (err) {
          console.warn('Failed to merge pest detections into inventory:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching IoT/Pest data:', error);
    } finally {
      setIsIotPestRefreshing(false);
    }
  };

  // Fetch only inventory (manual refresh) without touching IoT/Pest state
  const fetchInventoryOnly = async () => {
    try {
      setIsRefreshing(true);
      setInventoryLoading(true);
      const userId = getUserId();
      const inventoryRes = await fetch(`${API_BASE}/storage-guard/inventory?farmer_id=${userId}`);
      if (inventoryRes && inventoryRes.ok) {
        const inventoryData = await inventoryRes.json();
        console.log('🔍 [API] Manual Inventory Response (first 3 items):', inventoryData.inventory?.slice(0, 3));
        setInventory(inventoryData.inventory || []);
      } else {
        console.warn('Manual inventory fetch failed', inventoryRes && inventoryRes.status);
      }
      setLastUpdated(new Date());
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 900);
    } catch (error) {
      console.error('Error fetching inventory only:', error);
    } finally {
      setInventoryLoading(false);
      setIsRefreshing(false);
    }
  };

  // Debug: log inventory state changes
  useEffect(() => {
    console.log('🔍 [STATE] inventory array changed. Count:', inventory.length);
    if (inventory.length > 0) {
      console.log('🔍 [STATE] First item:', inventory[0]);
      const carrots = inventory.find((item: any) => item.crop_type === 'Carrots');
      console.log('🔍 [STATE] Carrots booking found?', carrots ? 'YES' : 'NO');
      if (carrots) {
        console.log('🔍 [STATE] Carrots details:', carrots);
      }
    }
  }, [inventory]);

  // Re-fetch data when userId becomes available
  useEffect(() => {
    const userId = getUserId();
    console.log('🔍 [useEffect userId watcher] userId changed:', userId);
    if (userId) {
      fetchStorageData();
      fetchMyBookings();
      fetchFarmerDashboard();
      fetchScheduledInspections();
      fetchStorageMetrics();
      fetchLocationUtilization();
    }
  }, []); // Run once on mount; getUserId should be stable after first check

  useEffect(() => {
    // Auto-refresh IoT/Pest data every 5 seconds (only sensors & pest, not entire screen)
    const iotPestInterval = setInterval(() => {
      fetchIotPestOnly();
    }, iotPestRefreshInterval);

    // Auto-refresh farmer dashboard every 10 seconds (metrics, bookings summary)
    const dashboardInterval = setInterval(() => {
      fetchFarmerDashboard();
    }, dashboardRefreshInterval);

    // Auto-refresh storage metrics every 8 seconds (performance dashboard)
    const metricsInterval = setInterval(() => {
      fetchStorageMetrics();
    }, metricsRefreshInterval);

    return () => {
      clearInterval(iotPestInterval);
      clearInterval(dashboardInterval);
      clearInterval(metricsInterval);
    };
  }, [API_BASE, iotPestRefreshInterval, dashboardRefreshInterval, metricsRefreshInterval]);

  const storageServices = [
    {
      title: "Cold Storage Management",
      titleTelugu: "కోల్డ్ స్టోరేజ్ నిర్వహణ",
      description: "Temperature-controlled storage for fresh produce",
      descriptionTelugu: "తాజా ఉత్పత్తుల కోసం ఉష్ణోగ్రత నియంత్రిత నిల్వ",
      duration: "24/7 monitoring",
      price: "₹5,000/MT",
      icon: Snowflake,
      available: true
    },
    {
      title: "Dry Storage Solutions",
      titleTelugu: "ఆరు నిల్వ పరిష్కారాలు",
      description: "Climate-controlled warehouses for grains",
      descriptionTelugu: "ధాన్యాల కోసం వాతావరణ నియంత్రిత గోదాములు",
      duration: "Long-term",
      price: "₹2,500/MT",
      icon: Wheat,
      available: true
    },
    {
      title: "Transport Logistics",
      titleTelugu: "రవాణా లాజిస్టిక్స్",
      description: "Farm-to-storage transportation",
      descriptionTelugu: "వ్యవసాయ క్షేత్రం నుండి నిల్వ వరకు రవాణా",
      duration: "Same day",
      price: "₹15/km",
      icon: Truck,
      available: true
    },
    {
      title: "Quality Control",
      titleTelugu: "నాణ్యత నియంత్రణ",
      description: "Regular quality inspections and monitoring",
      descriptionTelugu: "క్రమమైన నాణ్యత తనిఖీలు మరియు పర్యవేక్షణ",
      duration: "Daily checks",
      price: "₹500/inspection",
      icon: Shield,
      available: true
    }
  ];
  // Note: storageMetrics now comes from API state, no longer hardcoded

  // Note: storageTypes now comes from storageLocations API data
  // Recent activities now come from dashboardData.recent_activities

  // Quality analysis and pest detection data now from API
  const cvDetectionData = {
    qualityAnalysis: qualityData?.quality_tests || [
      { product: "Loading...", quality: "Fetching", freshness: "--", defects: "--", shelfLife: "--" }
    ],
    pestDetection: pestDetectionData.length > 0 ? pestDetectionData.map(detection => ({
      pest: detection.pest_type || "Unknown",
      confidence: detection.confidence_score || 0,
      severity: detection.severity || 'low',
      location: detection.location || "Unknown",
      action: detection.severity === "critical" ? "Immediate action required" : 
             detection.severity === "high" ? "Treatment scheduled" : "Monitoring"
    })) : [
      { pest: "Loading...", confidence: 0, location: "--", action: "Fetching data..." }
    ]
  };

  // IoT sensor data selection: prefer live `iotSensorData` (auto-refreshed), fall back to `inventory` values
  const sensorDisplayData = (() => {
    // Prefer live IoT API data when available
    try {
      const live = iotSensorData;
      if (live) {
        // Common shapes: { sensors: [...] } or an array directly
        if (Array.isArray(live.sensors) && live.sensors.length > 0) {
          console.log('✅ [sensorDisplayData] Using live iotSensorData.sensors (API):', live.sensors);
          return live.sensors;
        }
        if (Array.isArray(live) && live.length > 0) {
          console.log('✅ [sensorDisplayData] Using live iotSensorData (array):', live);
          return live;
        }
        // Sometimes API returns a mapping like { last_value: {...}, sensors: {...} }
        if (live.last_value && typeof live.last_value === 'object') {
          const arr = Object.keys(live.last_value).map(k => ({ sensor_type: k, value: live.last_value[k] }));
          if (arr.length > 0) {
            console.log('✅ [sensorDisplayData] Using live iotSensorData.last_value (mapped):', arr);
            return arr;
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ [sensorDisplayData] Error reading live iotSensorData:', err);
    }

    // If no live data, derive from the first inventory item (booking) as before
    if (Array.isArray(inventory) && inventory.length > 0) {
      const firstItem = inventory[0];

      if (Array.isArray(firstItem.iot_sensors) && firstItem.iot_sensors.length > 0) {
        console.log('✅ [sensorDisplayData] Using inventory[0].iot_sensors (array):', firstItem.iot_sensors);
        return firstItem.iot_sensors;
      }
      if (Array.isArray(firstItem.iot_latest) && firstItem.iot_latest.length > 0) {
        console.log('✅ [sensorDisplayData] Using inventory[0].iot_latest (array):', firstItem.iot_latest);
        return firstItem.iot_latest;
      }
      if (Array.isArray(firstItem.sensor_reading) && firstItem.sensor_reading.length > 0) {
        const result = firstItem.sensor_reading.map((s: any) => ({ ...s, location: firstItem.location_name || firstItem.location || '--' }));
        console.log('✅ [sensorDisplayData] Using inventory[0].sensor_reading (array):', result);
        return result;
      }

      const sensorKeys = ['temperature', 'humidity', 'moisture', 'co2', 'pressure', 'light'];
      const extractedSensors = sensorKeys
        .filter(k => firstItem[k] !== undefined && firstItem[k] !== null)
        .map(k => ({
          sensor_type: k,
          value: firstItem[k],
          unit: firstItem[`${k}_unit`] || '',
          location: firstItem.location_name || firstItem.location || '--'
        }));
      if (extractedSensors.length > 0) {
        console.log('✅ [sensorDisplayData] Using inventory[0] individual sensor fields:', extractedSensors);
        return extractedSensors;
      }
    }

    // Default empty array (no data found)
    console.log('⚠️ [sensorDisplayData] No sensor data found - returning empty array');
    return [];
  })();

  // Vendor services now from API data with proper categorization
  const vendorServices = storageVendors.length > 0 ? [
    {
      category: "Storage Solutions",
      vendors: storageVendors
        .filter(vendor => vendor.product_services?.toLowerCase().includes('storage') || 
                         vendor.product_services?.toLowerCase().includes('cold') ||
                         vendor.product_services?.toLowerCase().includes('warehouse'))
        .map(vendor => ({
          name: vendor.business_name || vendor.full_name,
          service: vendor.product_services?.includes('cold') ? 'Cold Storage' : 'Storage',
          rating: vendor.rating_avg || 4.5,
          price: vendor.product_services?.includes('cold') ? '₹5,000/MT' : '₹2,500/MT',
          availability: vendor.is_verified ? 'Available' : 'Pending verification',
          sla: 'Same day'
        }))
    },
    {
      category: "Transport & Logistics",
      vendors: transportData?.logistics_providers?.map((provider: any) => ({
        name: provider.name,
        service: provider.service_types?.join(', ') || 'Transport',
        rating: provider.rating || 4.5,
        price: provider.price_per_km,
        availability: provider.status === 'verified' ? 'Available' : 'Pending',
        sla: provider.service_types?.includes('express') ? '2 hours' : 'Same day'
      })) || []
    },
    {
      category: "Quality Control",
      vendors: storageVendors
        .filter(vendor => vendor.product_services?.toLowerCase().includes('quality') || 
                         vendor.product_services?.toLowerCase().includes('test') ||
                         vendor.product_services?.toLowerCase().includes('inspection'))
        .map(vendor => ({
          name: vendor.business_name || vendor.full_name,
          service: 'Quality Testing',
          rating: vendor.rating_avg || 4.7,
          price: '₹500/test',
          availability: vendor.is_verified ? 'Available' : 'Pending verification',
          sla: '24 hours'
        }))
    }
  ] : [
    {
      category: "Loading...",
      vendors: [{ name: "Fetching data...", service: "Please wait", rating: 0, price: "--", availability: "--", sla: "--" }]
    }
  ];

  // Removed hardcoded complianceData - now using API data

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AgriChatAgent />
      <AgriAIPilotSidePeek
        agentType="StorageGuard"
        agentName="StorageGuard"
        agentNameTelugu="స్టోరేజ్ గార్డ్"
        services={storageServices}
      />
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="overflow-hidden">
            <div className="h-48 overflow-hidden">
              <img 
                src="./cold-storage-warehouse.jpg"
                alt="Cold Storage Warehouse" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Snowflake className="h-5 w-5 text-blue-600" />
                Cold Storage Solutions
              </CardTitle>
              <CardDescription>
                Temperature-controlled environments for fresh produce preservation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="overflow-hidden">
            <div className="h-48 overflow-hidden">
              <img 
                src="/dry-storage-godown.jpg" 
                alt="Dry Storage Godown" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wheat className="h-5 w-5 text-amber-600" />
                Dry Storage Godowns
              </CardTitle>
              <CardDescription>
                Climate-controlled warehouses for grains and dry commodities
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="overflow-hidden">
            <div className="h-48 overflow-hidden">
              <img 
                src="/transport nd logistics.jpg"
                alt="Agricultural Carriers" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-600" />
                Transport & Logistics
              </CardTitle>
              <CardDescription>
                Seamless farm-to-storage transportation solutions
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* AI Computer Vision & IoT Monitoring */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-6 w-6 text-primary" />
                  {showTelugu ? 'AI కంప్యూటర్ విజన్ & IoT పర్యవేక్షణ / AI Computer Vision & IoT Monitoring' : 'AI Computer Vision & IoT Monitoring'}
                </CardTitle>
                <CardDescription>
                  {showTelugu ? 'నిజ-సమయ నాణ్యత విశ్లేషణ మరియు పర్యావరణ పర్యవేక్షణ / Real-time quality analysis and environmental monitoring' : 'Real-time quality analysis and environmental monitoring'}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTelugu(!showTelugu)}
                className="flex items-center gap-2"
              >
                🌐 {showTelugu ? 'తెలుగు/EN' : 'English'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="quality-analysis" className="w-full">
              <TabsList className="grid grid-cols-8 w-full gap-0">
                <TabsTrigger value="quality-analysis">Quality Analysis</TabsTrigger>
                <TabsTrigger value="pest-detection">Pest Detection</TabsTrigger>
                <TabsTrigger value="iot-sensors">IoT Sensors</TabsTrigger>
                <TabsTrigger value="my-bookings">My Bookings</TabsTrigger>
                <TabsTrigger value="certificates">📜 Certificates</TabsTrigger>
                <TabsTrigger value="vendor-services">Vendor Services</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="rfqs-jobs">RFQs & Jobs</TabsTrigger>
              </TabsList>

              

              <TabsContent value="quality-analysis" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cvDetectionData.qualityAnalysis.map((item: any, index: number) => (
                    <div key={index} className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-primary" />
                        {item.product}
                      </h3>
                      {/* Show image name and thumbnail if available */}
                      {item.image && (
                        <div className="mb-2 flex items-center gap-2">
                          <img 
                            src={typeof item.image === 'string' ? `${API_BASE}/uploads/${item.image}` : ''} 
                            alt={item.image} 
                            style={{width: 40, height: 40, objectFit: 'cover', borderRadius: 4}} 
                            onError={(e) => {
                              // Hide image if it fails to load
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="text-xs text-muted-foreground">{item.image}</span>
                        </div>
                      )}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Quality:</span>
                          <Badge variant="default">{item.quality || 'Ungraded'}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Freshness:</span>
                          <span className="font-medium">{item.freshness || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Defects:</span>
                          <span className="font-medium">
                            {Array.isArray(item.defects) && item.defects.length > 0
                              ? item.defects.map((defect: any, i: number) => {
                                  const defectText = typeof defect === 'string' 
                                    ? defect 
                                    : defect.type 
                                      ? `${defect.type}${defect.confidence ? ` (${Math.round(defect.confidence * 100)}%)` : ''}` 
                                      : 'Defect';
                                  return (
                                    <span key={i}>
                                      {defectText}
                                      {i < item.defects.length - 1 ? ', ' : ''}
                                    </span>
                                  );
                                })
                              : typeof item.defects === 'string'
                                ? item.defects
                                : 'None'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shelf Life:</span>
                          <span className="font-medium">{item.shelfLife && item.shelfLife !== 'N/A' ? item.shelfLife : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button className="agri-button-primary" onClick={handleQualityImageUpload}>
                    <Smartphone className="w-4 h-4 mr-2" />
                    Upload Quality Images
                  </Button>
                  <Button variant="outline" onClick={() => setShowInspectionModal(true)}>
                    <Camera className="w-4 h-4 mr-2" />
                    Schedule Inspection
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="pest-detection" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading ? (
                    <div className="col-span-1 md:col-span-2 text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Fetching pest detections...</p>
                    </div>
                  ) : pestDetectionData.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 p-4 border border-border rounded-lg bg-muted/10 text-center">
                      <p className="font-medium">No pest detections found</p>
                      <p className="text-sm text-muted-foreground">Current sensors are within safe thresholds</p>
                    </div>
                  ) : (
                    pestDetectionData.map((detection: any, index: number) => {
                      const severity = (detection.severity || 'low').toString().toLowerCase();
                      const badgeVariant = severity === 'critical' || severity === 'high' ? 'destructive' : severity === 'medium' ? 'warning' : 'default';
                      const textClass = severity === 'critical' || severity === 'high' ? 'text-destructive' : severity === 'medium' ? 'text-warning' : 'text-success';
                      const pestName = detection.pest_type || detection.pest || 'Unknown';
                      const confidence = detection.confidence_score ?? detection.confidence ?? 0;
                      const location = detection.location || '--';
                      const action = severity === 'critical' ? 'Immediate action required' : severity === 'high' ? 'Treatment scheduled' : 'Monitoring';
                      return (
                        <div key={index} className={`p-4 border border-border rounded-lg ${severity === 'critical' || severity === 'high' ? 'bg-destructive/10' : severity === 'medium' ? 'bg-yellow-50' : 'bg-success/5'} hover:shadow-md transition-shadow`}>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold flex items-center gap-2">
                              <Scan className={`w-4 h-4 ${severity === 'critical' || severity === 'high' ? 'text-destructive' : severity === 'medium' ? 'text-warning' : 'text-success'}`} />
                              {pestName}
                            </h3>
                            <Badge variant={badgeVariant}>{confidence}% confidence</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">Location: {location}</p>
                          <p className={`text-sm font-medium ${textClass}`}>{action}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="iot-sensors" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(() => {
                    console.log('🔍 [IoT Sensors Render] sensorDisplayData:', sensorDisplayData);
                    
                    if (loading) {
                      return (
                        <div className="col-span-1 md:col-span-2 lg:col-span-4 text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-muted-foreground">Fetching IoT sensor data...</p>
                        </div>
                      );
                    }

                    // Handle array data
                    if (Array.isArray(sensorDisplayData)) {
                      if (sensorDisplayData.length === 0) {
                        return (
                          <div className="col-span-1 md:col-span-2 lg:col-span-4 p-4 border border-border rounded-lg bg-muted/10 text-center">
                            <p className="font-medium">No IoT sensor data available</p>
                            <p className="text-sm text-muted-foreground">Sensors may be inactive or not configured</p>
                          </div>
                        );
                      }

                      // Render each sensor in the array
                      return sensorDisplayData.map((s: any, idx: number) => {
                        const name = s.sensor_type || s.name || `sensor-${idx}`;
                        
                        // Extract current value: prioritize 'value', then 'current', then 'reading', then 'last_value'
                        let current = s.value ?? s.current ?? s.reading ?? s.last_value ?? '--';
                        if (typeof current === 'number') current = current.toFixed(2);
                        
                        // Extract range: try range, or min-max, or unit if available
                        const range = s.range ?? (s.min || s.max ? `${s.min ?? '--'} - ${s.max ?? '--'}` : s.unit ?? '--');
                        
                        // Extract status: try status, state, active flag
                        const statusVal = s.status ?? s.state ?? (s.active ? 'active' : 'inactive') ?? 'active';
                        const status = statusVal.toString();
                        const badgeVariant = status.toLowerCase() === 'active' ? 'default' : 'secondary';
                        
                        // Add location if present
                        const location = s.location ? ` (${s.location})` : '';
                        
                        console.log(`📊 [IoT Render ${name}] current=${current}, range=${range}, status=${status}`);
                        
                        return (
                          <div key={idx} className={`p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20 shadow-sm hover:shadow-md transition-shadow ${justUpdated ? 'ring-2 ring-primary/40 animate-pulse' : ''}`}>
                            <h3 className="font-semibold mb-2 capitalize flex items-center gap-2">
                              <Gauge className="w-4 h-4 text-primary" />
                              {name}{location && <span className="text-xs text-muted-foreground normal-case">{location}</span>}
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Current:</span>
                                <span className="font-medium">{current}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Range:</span>
                                <span className="font-medium">{range}</span>
                              </div>
                              <Badge variant={badgeVariant} className={status.toLowerCase() === 'active' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}>
                                {status}
                              </Badge>
                            </div>
                          </div>
                        );
                      });
                    }

                    // Handle object data
                    if (typeof sensorDisplayData === 'object' && sensorDisplayData !== null && !Array.isArray(sensorDisplayData)) {
                      const entries = Object.entries(sensorDisplayData);
                      if (entries.length === 0) {
                        return (
                          <div className="col-span-1 md:col-span-2 lg:col-span-4 p-4 border border-border rounded-lg bg-muted/10 text-center">
                            <p className="font-medium">No IoT sensor data available</p>
                          </div>
                        );
                      }
                      
                      return entries.map(([key, val]: [string, any], idx: number) => {
                        const s = typeof val === 'object' ? val : { value: val };
                        const name = key;
                        let current = s.value ?? s.current ?? s.reading ?? '--';
                        if (typeof current === 'number') current = current.toFixed(2);
                        const range = s.range ?? s.unit ?? '--';
                        const status = s.status ?? 'active';
                        const badgeVariant = status.toLowerCase() === 'active' ? 'default' : 'secondary';
                        
                        return (
                          <div key={idx} className={`p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20 shadow-sm hover:shadow-md transition-shadow ${justUpdated ? 'ring-2 ring-primary/40 animate-pulse' : ''}`}>
                            <h3 className="font-semibold mb-2 capitalize flex items-center gap-2">
                              <Gauge className="w-4 h-4 text-primary" />
                              {name}
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Current:</span>
                                <span className="font-medium">{current}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Range:</span>
                                <span className="font-medium">{range}</span>
                              </div>
                              <Badge variant={badgeVariant} className={status.toLowerCase() === 'active' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}>
                                {status}
                              </Badge>
                            </div>
                          </div>
                        );
                      });
                    }

                    // Fallback: no data
                    return (
                      <div className="col-span-1 md:col-span-2 lg:col-span-4 p-4 border border-border rounded-lg bg-muted/10 text-center">
                        <p className="font-medium">Unable to load IoT sensor data</p>
                        <p className="text-sm text-muted-foreground">Please ensure sensors are connected and auto-refresh is enabled</p>
                      </div>
                    );
                  })()}
                </div>
              </TabsContent>

              <TabsContent value="my-bookings" className="space-y-4">
                {/* Debug Info & Refresh Button */}
                <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Your Farmer ID:</span>
                    <code className="ml-2 px-2 py-1 bg-background rounded text-xs">{getUserId() || 'Not found! Please login again'}</code>
                  </div>
                  <Button 
                    onClick={() => {
                      console.log('🔄 Manual refresh triggered');
                      fetchMyBookings();
                      fetchFarmerDashboard();
                      fetchTransportData(); // 🚚 Also refresh transport data
                    }}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Package2 className="w-4 h-4" />
                    Refresh Data
                  </Button>
                </div>

                {/* Farmer Dashboard Summary */}
                {farmerDashboard?.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-blue-500/10 relative">
                      <p className="text-sm text-muted-foreground mb-1">Total Bookings</p>
                      <p className="text-2xl font-bold">{farmerDashboard.summary.total_bookings || 0}</p>
                      {isDashboardRefreshing && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
                    </div>
                    <div className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-green-500/10 relative">
                      <p className="text-sm text-muted-foreground mb-1">Active Bookings</p>
                      <p className="text-2xl font-bold">{farmerDashboard.summary.active_bookings || 0}</p>
                      {isDashboardRefreshing && <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                    </div>
                    <div className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-purple-500/10 relative">
                      <p className="text-sm text-muted-foreground mb-1">Completed</p>
                      <p className="text-2xl font-bold">{farmerDashboard.summary.completed_bookings || 0}</p>
                      {isDashboardRefreshing && <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>}
                    </div>
                    <div className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-orange-500/10 relative">
                      <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                      <p className="text-2xl font-bold">₹{(farmerDashboard.summary.total_spent || 0).toLocaleString()}</p>
                      {isDashboardRefreshing && <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>}
                    </div>
                  </div>
                )}

                {/* Book New Storage Button */}
                <div className="flex gap-2 mb-4">
                  <Button className="agri-button-primary" onClick={handleBookStorageClick}>
                    <Package2 className="w-4 h-4 mr-2" />
                    Book Storage (with AI Analysis)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-green-600 text-green-600 hover:bg-green-50"
                    onClick={async () => {
                      const userId = getUserId();
                      if (!userId) {
                        toast({
                          title: "Login Required",
                          description: "Please login to create a booking",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Get booking details from farmer - ASK CROP FIRST
                      const cropType = prompt('Enter crop type (e.g., Tomatoes, Rice, Wheat):');
                      if (!cropType) return;

                      const quantity = prompt('Enter quantity in kg (e.g., 1000):');
                      if (!quantity) return;

                      const duration = prompt('Enter storage duration in days (e.g., 30):');
                      if (!duration) return;

                      // Determine storage type based on crop
                      const cropLower = cropType.toLowerCase();
                      let storageType = 'dry_storage'; // Default
                      
                      // Grains, pulses, cash crops → Dry storage
                      if (cropLower.includes('wheat') || cropLower.includes('rice') || cropLower.includes('corn') ||
                          cropLower.includes('maize') || cropLower.includes('barley') || cropLower.includes('millet') ||
                          cropLower.includes('chickpea') || cropLower.includes('lentil') || cropLower.includes('bean') ||
                          cropLower.includes('cotton') || cropLower.includes('jute')) {
                        storageType = 'dry_storage';
                      }
                      // Vegetables, fruits → Cold storage
                      else if (cropLower.includes('tomato') || cropLower.includes('potato') || cropLower.includes('onion') ||
                               cropLower.includes('carrot') || cropLower.includes('cabbage') || cropLower.includes('leafy') ||
                               cropLower.includes('apple') || cropLower.includes('banana') || cropLower.includes('mango') ||
                               cropLower.includes('grape') || cropLower.includes('orange')) {
                        storageType = 'cold_storage';
                      }

                      console.log(`🔍 Quick Booking: ${cropType} → ${storageType}`);

                      // Get storage locations FILTERED BY TYPE
                      try {
                        toast({
                          title: "Finding Storage...",
                          description: `Searching for ${storageType === 'cold_storage' ? 'cold' : 'dry'} storage facilities for ${cropType}`,
                        });

                        const locationsRes = await fetch(`${API_BASE}/storage-guard/locations?limit=10&type=${storageType}`);
                        const locationsData = await locationsRes.json();
                        
                        console.log('Locations API response:', locationsData);
                        
                        if (!locationsData.success || !locationsData.locations || locationsData.locations.length === 0) {
                          console.error('No locations found:', locationsData);
                          toast({
                            title: "No Storage Locations",
                            description: `No ${storageType === 'cold_storage' ? 'cold' : 'dry'} storage available for ${cropType}. Please try AI analysis for more options.`,
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        console.log(`Found ${locationsData.locations.length} storage locations`);

                        const location = locationsData.locations[0];

                        // Calculate dates
                        const startDate = new Date();
                        const endDate = new Date();
                        endDate.setDate(endDate.getDate() + parseInt(duration));

                        // Create booking data matching backend schema exactly
                        const bookingData = {
                          location_id: location.id,
                          crop_type: cropType,
                          quantity_kg: parseInt(quantity),
                          grade: null,
                          duration_days: parseInt(duration),
                          start_date: startDate.toISOString(),
                          transport_required: false,
                          ai_inspection_id: null
                        };

                        // farmer_id is a query parameter, not in body
                        const bookingRes = await fetch(`${API_BASE}/storage-guard/bookings?farmer_id=${userId}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(bookingData)
                        });

                        if (bookingRes.ok) {
                          const result = await bookingRes.json();
                          console.log('Booking result:', result);
                          
                          toast({
                            title: "✅ Booking Created Successfully!",
                            description: (
                              <div className="space-y-2 mt-2">
                                <p><strong>Booking ID:</strong> {result.id?.substring(0, 8)}...</p>
                                <p><strong>Crop:</strong> {cropType} ({quantity} kg)</p>
                                <p><strong>Duration:</strong> {duration} days</p>
                                <p><strong>Location:</strong> {location.name}</p>
                                <p><strong>Vendor ID:</strong> {result.vendor_id ? '✅ Assigned' : '⚠️ Missing'}</p>
                                <p><strong>Total:</strong> ₹{result.total_price?.toLocaleString()}</p>
                                <p className="text-green-600 mt-2 font-semibold">Ready for quality certificate!</p>
                              </div>
                            ),
                            duration: 8000,
                          });
                          
                          // Refresh bookings
                          fetchMyBookings();
                          fetchFarmerDashboard();
                          fetchTransportData(); // 🚚 Refresh transport fleet after quick booking
                        } else {
                          const error = await bookingRes.json();
                          toast({
                            title: "Booking Failed",
                            description: error.detail || "Could not create booking",
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        console.error('Booking error:', error);
                        toast({
                          title: "Error",
                          description: "Failed to create booking. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Quick Book Storage (No AI)
                  </Button>
                </div>

                {/* My Bookings List */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package2 className="w-4 h-4 text-primary" />
                    My Storage Bookings ({myBookings.length})
                  </h3>
                  {myBookings.length > 0 ? (
                    <div className="space-y-3">
                      {myBookings.map((booking: any) => (
                        <div key={booking.id} className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">{booking.crop_type}</h4>
                              <p className="text-sm text-muted-foreground">
                                {showTelugu ? 'పరిమాణం:' : 'Quantity:'} {booking.quantity_kg} kg | {showTelugu ? 'వ్యవధి:' : 'Duration:'} {booking.duration_days} {showTelugu ? 'రోజులు' : 'days'}
                              </p>
                            </div>
                            <Badge variant={
                              booking.booking_status === 'CONFIRMED' ? 'default' :
                              booking.booking_status === 'PENDING' ? 'secondary' :
                              booking.booking_status === 'COMPLETED' ? 'outline' :
                              'destructive'
                            }>
                              {booking.booking_status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Start Date</p>
                              <p className="font-medium">{new Date(booking.start_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Amount</p>
                              <p className="font-medium text-lg">₹{booking.total_price?.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          {/* Certificate Eligibility Badge */}
                          {booking.ai_inspection_id ? (
                            <Badge variant="default" className="bg-green-600 text-xs mb-2">
                              ✅ Certificate Eligible
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-600 text-xs mb-2">
                              ⚠️ No Certificate
                            </Badge>
                          )}

                          {booking.special_requirements && (
                            <p className="text-sm text-muted-foreground mb-2">
                              Requirements: {booking.special_requirements}
                            </p>
                          )}

                          <div className="space-y-2">
                            {/* Vendor Confirmation Status */}
                            {booking.vendor_confirmed ? (
                              <Badge variant="default" className="bg-green-600 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                ✅ Confirmed
                              </Badge>
                            ) : booking.booking_status === 'PENDING' ? (
                              <Badge variant="secondary" className="bg-yellow-600 text-xs">
                                ⏳ Pending
                              </Badge>
                            ) : booking.booking_status === 'CANCELLED' ? (
                              <Badge variant="destructive" className="text-xs">
                                ❌ Cancelled
                              </Badge>
                            ) : null}
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-2">
                              {booking.booking_status === 'PENDING' && !booking.vendor_confirmed && (
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  className="text-xs h-8"
                                  onClick={() => handleCancelBooking(booking.id)}
                                >
                                  Cancel
                                </Button>
                              )}
                              
                              {/* Complete Booking & Generate Certificate Button */}
                              {(booking.booking_status?.toLowerCase() === 'confirmed' || 
                                booking.booking_status?.toLowerCase() === 'active') && (
                                <Button 
                                  className="bg-green-600 hover:bg-green-700 text-xs h-8"
                                  size="sm"
                                  disabled={!booking.ai_inspection_id || !booking.vendor_confirmed}
                                  onClick={async () => {
                                    // Check vendor confirmation first
                                    if (!booking.vendor_confirmed) {
                                      toast({
                                        title: "⏳ Pending Vendor Approval",
                                        description: "Certificate can only be generated after vendor confirms your booking. Please wait for vendor approval.",
                                        variant: "destructive",
                                        duration: 6000,
                                      });
                                      return;
                                    }
                                    
                                    // Check certificate eligibility
                                    if (!booking.ai_inspection_id) {
                                      toast({
                                        title: "❌ Certificate Not Available",
                                        description: "This booking was created without AI quality inspection (Quick Booking). Certificates require AI analysis. Please use 'Analyze & Book' option for future bookings.",
                                        variant: "destructive",
                                        duration: 8000,
                                      });
                                      return;
                                    }
                                    
                                    try {
                                      const response = await fetch(`${API_BASE}/storage-guard/bookings/${booking.id}/complete`, {
                                        method: 'POST'
                                      });
                                      
                                      if (response.ok) {
                                        const result = await response.json();
                                        toast({
                                          title: "🎉 Certificate Generated!",
                                          description: (
                                            <div className="space-y-2 mt-2">
                                              <p><strong>Certificate:</strong> {result.certificate.certificate_number}</p>
                                              <p><strong>Quality Score:</strong> {result.certificate.overall_quality_score}/100</p>
                                              <p><strong>Grade:</strong> {result.certificate.initial_grade} → {result.certificate.final_grade}</p>
                                              <p className="text-green-300 mt-2">✅ Check Certificates tab to view!</p>
                                            </div>
                                          ),
                                        });
                                        
                                        // Refresh bookings and certificates
                                        fetchMyBookings();
                                        
                                        // Also load certificates
                                        const userId = getUserId();
                                        if (userId) {
                                          const certRes = await fetch(`${API_BASE}/storage-guard/farmer/${userId}/certificates`);
                                          const certData = await certRes.json();
                                          if (certData.success) setCertificates(certData.certificates);
                                        }
                                      } else {
                                        const error = await response.json();
                                        toast({
                                          title: "Certificate Generation Failed",
                                          description: error.detail || "Could not generate certificate",
                                          variant: "destructive",
                                        });
                                      }
                                    } catch (error) {
                                      console.error('Complete booking error:', error);
                                      toast({
                                        title: "Error",
                                        description: "Failed to complete booking",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <FileCheck className="w-3 h-3 mr-1" />
                                  {!booking.vendor_confirmed 
                                    ? '⏳ Awaiting Vendor' 
                                    : booking.ai_inspection_id 
                                      ? 'Complete & Certificate' 
                                      : '🔒 No Certificate'}
                                </Button>
                              )}
                              
                              {/* Show message for pending bookings */}
                              {booking.booking_status?.toLowerCase() === 'pending' && !booking.vendor_confirmed && (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs">
                                    ⏳ Pending Vendor Approval
                                  </Badge>
                                  <Button 
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-7"
                                    onClick={() => {
                                      toast({
                                        title: "⏳ Booking Status: Pending",
                                        description: (
                                          <div className="space-y-2 mt-2">
                                            <p><strong>Current Status:</strong> Waiting for vendor confirmation</p>
                                            <p><strong>Next Steps:</strong></p>
                                            <ol className="list-decimal ml-4 space-y-1">
                                              <li>Vendor reviews your booking</li>
                                              <li>Once confirmed → Status becomes "Confirmed"</li>
                                              <li>After storage period → Click "Complete & Certificate"</li>
                                            </ol>
                                            <p className="text-green-300 mt-2">✅ You'll be notified when vendor confirms!</p>
                                          </div>
                                        ),
                                        duration: 10000,
                                      });
                                    }}
                                  >
                                    ℹ️ Learn More
                                  </Button>
                                </div>
                              )}
                              
                              {/* Show active confirmation status */}
                              {booking.vendor_confirmed && booking.booking_status?.toLowerCase() !== 'completed' && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                                  ✅ Vendor Confirmed
                                </Badge>
                              )}
                              
                              {/* Legacy pending status support */}
                              {booking.booking_status?.toLowerCase() === 'pending' && booking.vendor_confirmed && (
                                <Button 
                                  className="bg-yellow-600 hover:bg-yellow-700 text-xs h-8"
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "✅ Booking Confirmed!",
                                      description: "Vendor has not yet accepted. Please wait for confirmation.",
                                      variant: "default",
                                    });
                                  }}
                                >
                                  <Clock className="w-3 h-3 mr-1" />
                                  Complete & Certificate
                                </Button>
                              )}
                              
                              {booking.booking_status?.toLowerCase() === 'completed' && (
                                <Badge variant="default" className="bg-green-600 text-xs">
                                  <FileCheck className="w-3 h-3 mr-1" />
                                  ✅ Completed
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-border rounded-lg">
                      <Package2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground mb-4">No bookings yet</p>
                      <Button className="agri-button-primary" onClick={handleBookStorageClick}>
                        <Package2 className="w-4 h-4 mr-2" />
                        Create Your First Booking
                      </Button>
                    </div>
                  )}
                </div>

                {/* Scheduled Inspections Section */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Scheduled Inspections
                    </h3>
                    <Button size="sm" variant="outline" onClick={() => setShowInspectionModal(true)}>
                      <Camera className="w-4 h-4 mr-2" />
                      Schedule New
                    </Button>
                  </div>

                  {scheduledInspections.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {scheduledInspections.map((inspection) => (
                        <div key={inspection.id} className="p-4 border border-border rounded-lg bg-card hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{inspection.crop_type}</h4>
                              <p className="text-sm text-muted-foreground capitalize">
                                {inspection.inspection_type.replace('_', ' ')}
                              </p>
                            </div>
                            <Badge 
                              variant={
                                inspection.status === 'completed' ? 'default' :
                                inspection.status === 'confirmed' ? 'secondary' :
                                inspection.status === 'cancelled' ? 'destructive' :
                                'outline'
                              }
                              className={
                                inspection.status === 'completed' ? 'bg-green-600' :
                                inspection.status === 'confirmed' ? 'bg-blue-600' :
                                inspection.status === 'cancelled' ? 'bg-red-600' :
                                'bg-yellow-600'
                              }
                            >
                              {inspection.status.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Quantity:</span>
                              <span className="font-medium">{inspection.quantity_kg} kg</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Requested:</span>
                              <span className="font-medium">
                                {new Date(inspection.requested_date).toLocaleDateString()}
                              </span>
                            </div>
                            {inspection.scheduled_date && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Scheduled:</span>
                                <span className="font-medium text-green-600">
                                  {new Date(inspection.scheduled_date).toLocaleString()}
                                </span>
                              </div>
                            )}
                            {inspection.preferred_time_slot && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Time Slot:</span>
                                <span className="font-medium capitalize">{inspection.preferred_time_slot}</span>
                              </div>
                            )}
                            <div className="pt-2 border-t border-border">
                              <p className="text-xs text-muted-foreground">
                                📍 {inspection.location_address.slice(0, 60)}...
                              </p>
                            </div>
                          </div>

                          {inspection.farmer_notes && (
                            <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                              <strong>Notes:</strong> {inspection.farmer_notes}
                            </div>
                          )}

                          {inspection.inspector_notes && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                              <strong>Inspector:</strong> {inspection.inspector_notes}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-3">
                            {inspection.status === 'pending' && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                className="text-xs h-7 w-full"
                                onClick={() => handleCancelInspection(inspection.id)}
                              >
                                Cancel
                              </Button>
                            )}
                            {inspection.status === 'completed' && inspection.inspection_result_id && (
                              <Badge variant="default" className="bg-green-600 text-xs">
                                ✅ Report Available
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-border rounded-lg">
                      <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground mb-3">No inspections scheduled yet</p>
                      <Button size="sm" variant="outline" onClick={() => setShowInspectionModal(true)}>
                        <Camera className="w-4 h-4 mr-2" />
                        Schedule Your First Inspection
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="vendor-services" className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading vendor services...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Storage Vendors */}
                    <div className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Storage Service Providers ({storageVendors.length})
                      </h3>
                      {storageVendors.length > 0 ? (
                        <div className="space-y-3">
                          {storageVendors.map((vendor, index) => (
                            <div key={index} className="flex justify-between items-start p-3 bg-background/50 rounded-lg border hover:shadow-md transition-shadow">
                              <div className="flex-1">
                                <p className="font-medium text-lg">{vendor.business_name || vendor.full_name}</p>
                                <p className="text-sm text-muted-foreground">{vendor.product_services}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  📍 {vendor.address_line1}, {vendor.city}, {vendor.state}
                                </p>
                              </div>
                              <div className="text-right flex flex-col items-end gap-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-lg font-semibold">⭐ {vendor.rating_avg?.toFixed(1) || '0.0'}</span>
                                  <span className="text-xs text-muted-foreground">({vendor.rating_count || 0})</span>
                                </div>
                                <Badge variant={vendor.is_verified ? "default" : "secondary"} className={vendor.is_verified ? "bg-green-600" : ""}>
                                  {vendor.is_verified ? "Verified" : "Unverified"}
                                </Badge>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 w-full"
                                  onClick={() => {
                                    const phoneNumber = vendor.phone?.replace(/\D/g, '');
                                    if (phoneNumber) {
                                      window.location.href = `tel:${phoneNumber}`;
                                      toast({
                                        title: "📞 Calling Vendor",
                                        description: `Calling ${vendor.business_name || vendor.full_name}...`,
                                      });
                                    } else {
                                      toast({
                                        title: "No Phone Number",
                                        description: "Contact information not available",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <Phone className="w-3 h-3 mr-1" />
                                  {vendor.phone || 'No Phone'}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No storage vendors found</p>
                      )}
                    </div>

                    {/* Storage Locations */}
                    <div className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        Storage Locations ({storageLocations.length})
                      </h3>
                      {storageLocations.length > 0 ? (
                        <div className="space-y-3">
                          {storageLocations.map((location, index) => (
                            <div key={index} className="p-3 bg-background/50 rounded-lg border">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">{location.name}</h4>
                                <Badge variant="outline">{location.location_type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                📍 {location.address}, {location.city}, {location.state}
                              </p>
                              <p className="text-sm text-muted-foreground mb-2">
                                🏗️ Capacity: {location.capacity_mt} MT
                              </p>
                              {location.facilities && (
                                <div className="flex flex-wrap gap-1">
                                  {location.facilities.map((facility: string, fIndex: number) => (
                                    <Badge key={fIndex} variant="secondary" className="text-xs">
                                      {facility}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No storage locations found</p>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="inventory" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Package2 className="w-5 h-5 text-green-600" />
                      Inventory Listings
                    </h3>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-muted-foreground">Debug: farmer_id = {getUserId() || 'null'}</div>
                          <div className="text-xs text-muted-foreground">Inventory count = {inventory.length}</div>
                          <Button size="sm" onClick={() => fetchInventoryOnly()}>Refresh Inventory</Button>
                          <Button size="sm" variant="outline" onClick={() => setShowInventoryDebug(s => !s)}>
                            {showInventoryDebug ? 'Hide Debug' : 'Show Debug'}
                          </Button>
                        </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground">{lastUpdated ? `Inventory last updated: ${lastUpdated.toLocaleString()}` : 'Inventory last updated: --'}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {isIotPestRefreshing ? (
                          <span className="inline-flex items-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg> Sensors live</span>
                        ) : (
                          <span className="inline-flex items-center gap-2"><svg className="w-4 h-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" fill="none"></circle></svg> Sensors live</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {inventoryLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading inventory...</p>
                    </div>
                  ) : inventory.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {showInventoryDebug && (
                        <div className="col-span-full">
                          <div className="p-4 bg-gray-50 rounded border border-dashed text-xs">
                            <div className="flex items-center justify-between mb-2">
                              <strong>Inventory Debug (first 5 items)</strong>
                              <span className="text-muted-foreground">Count: {inventory.length}</span>
                            </div>
                            <pre style={{maxHeight: 240, overflow: 'auto'}}>
{JSON.stringify(inventory.slice(0,5), null, 2)}
                            </pre>
                            <hr className="my-3" />
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={async () => {
                                const userId = getUserId();
                                console.log('[DEBUG TEST] farmer_id:', userId);
                                if (!userId) {
                                  alert('farmer_id is null or empty!');
                                  return;
                                }
                                try {
                                  const url = `${API_BASE}/storage-guard/inventory?farmer_id=${userId}`;
                                  console.log('[DEBUG TEST] Calling:', url);
                                  const res = await fetch(url);
                                  const data = await res.json();
                                  console.log('[DEBUG TEST] Response count:', data.count);
                                  console.log('[DEBUG TEST] Full response:', data);
                                  alert(`API returned ${data.count || 0} items. Check console for full response.`);
                                } catch (err) {
                                  console.error('[DEBUG TEST] Error:', err);
                                  alert('Error calling API. Check console.');
                                }
                              }}
                            >
                              Test API Call
                            </Button>
                          </div>
                        </div>
                      )}
                      {inventory.map((item: any, mapIndex: number) => {
                        console.log(`🔍 [RENDER] Rendering card ${mapIndex + 1}/${inventory.length}: ${item.crop_type}`);
                        const isCarrots = item.crop_type === 'Carrots';
                        return (
                        <Card key={item.booking_id} className={`p-6 border rounded-lg ${isCarrots ? 'border-4 border-red-500 bg-red-50' : 'border border-border bg-gradient-field'}`}>
                          {isCarrots && (
                            <div className="mb-4 p-3 bg-red-500 text-white rounded font-bold text-center">
                              🥕 CARROTS BOOKING - 3000 KG
                            </div>
                          )}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-xl">{item.crop_type}</h4>
                              <p className="text-sm text-muted-foreground">{item.grade || 'Grade: N/A'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">{(item.quantity_kg/100).toFixed(0)} quintals</p>
                              <p className="text-sm text-muted-foreground">{item.booking_status}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Harvest / Start</p>
                              <p className="font-medium">{item.start_date ? new Date(item.start_date).toLocaleDateString() : '—'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Storage / End</p>
                              <p className="font-medium">{item.end_date ? new Date(item.end_date).toLocaleDateString() : '—'}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                              <p className="text-muted-foreground">Location</p>
                              <p className="font-medium">
                                {(() => {
                                  const loc = storageLocations.find((l: any) => l.id === item.location_id || l.location_id === item.location_id);
                                  return loc?.name || item.location_id || 'Unknown';
                                })()}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Vendor</p>
                              <p className="font-medium">
                                {(() => {
                                  const v = storageVendors.find((vv: any) => vv.id === item.vendor_id || vv.vendor_id === item.vendor_id);
                                  return v?.business_name || v?.full_name || item.vendor_id || 'Unassigned';
                                })()}
                              </p>
                            </div>
                          </div>

                          <Separator />

                          {/* IoT Sensors Section */}
                          {item.iot_latest && Array.isArray(item.iot_latest) && item.iot_latest.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase">IoT Sensors</p>
                              <div className="grid grid-cols-2 gap-2">
                                {item.iot_latest.map((sensor: any, idx: number) => (
                                  <div key={idx} className="bg-blue-50 dark:bg-blue-950 p-2 rounded text-xs">
                                    <p className="font-medium text-blue-700 dark:text-blue-300 capitalize">{sensor.sensor_type}</p>
                                    <p className="text-sm font-semibold text-foreground">{sensor.value} {sensor.unit}</p>
                                    <p className="text-xs text-muted-foreground">{sensor.reading_time ? new Date(sensor.reading_time).toLocaleTimeString() : '—'}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Pest Detection Section */}
                          {item.pest_latest && (
                            <div className="mt-3 space-y-1 bg-red-50 dark:bg-red-950 p-3 rounded">
                              <p className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase">Pest Detection</p>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <p className="text-muted-foreground">Type</p>
                                  <p className="font-medium capitalize">{item.pest_latest.pest_type}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Severity</p>
                                  <Badge variant={item.pest_latest.severity === 'high' ? 'destructive' : item.pest_latest.severity === 'medium' ? 'secondary' : 'outline'} className="text-xs">
                                    {item.pest_latest.severity}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Confidence</p>
                                  <p className="font-medium">{(item.pest_latest.confidence * 100).toFixed(0)}%</p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex gap-2 items-center">
                              {item.certificate_id ? (
                                <Badge variant="default" className="bg-green-600">✅ Certified</Badge>
                              ) : item.certificate_eligible ? (
                                <Badge variant="secondary" className="bg-yellow-300 text-black">Certificate Eligible (Pending)</Badge>
                              ) : (
                                <Badge variant="secondary">No Certificate</Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {item.certificate_id && (
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    console.log('🔘 View Certificate clicked for:', item.certificate_id);
                                    handleViewCertificate(item.certificate_id);
                                  }}
                                >
                                  <FileCheck className="w-3 h-3 mr-1" />
                                  View Certificate
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  // Quick copy booking id
                                  navigator.clipboard?.writeText(item.booking_id || '');
                                  toast({ title: 'Booking ID copied', description: item.booking_id });
                                }}
                              >
                                Copy ID
                              </Button>
                            </div>
                          </div>
                        </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-border rounded-lg">
                      <p className="text-muted-foreground">No inventory available</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="market" className="space-y-4">
              </TabsContent>

              <TabsContent value="certificates" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-green-600" />
                    My Storage Quality Certificates
                  </h3>
                  <Button 
                    onClick={async () => {
                      const userId = getUserId();
                      if (!userId) {
                        toast({
                          title: "Authentication Required",
                          description: "Please login to view certificates",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      setLoadingCertificates(true);
                      try {
                        const response = await fetch(`${API_BASE}/storage-guard/farmer/${userId}/certificates`);
                        const data = await response.json();
                        if (data.success) {
                          setCertificates(data.certificates);
                          toast({
                            title: "Certificates Loaded",
                            description: `Found ${data.total} certificate(s)`,
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Error Loading Certificates",
                          description: "Failed to fetch certificates",
                          variant: "destructive",
                        });
                      } finally {
                        setLoadingCertificates(false);
                      }
                    }}
                    disabled={loadingCertificates}
                  >
                    {loadingCertificates ? 'Loading...' : 'Refresh Certificates'}
                  </Button>
                </div>

                {loadingCertificates ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading your certificates...</p>
                  </div>
                ) : certificates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certificates.map((cert: any) => (
                      <Card key={cert.id} className="border-2 border-green-200 hover:border-green-400 transition-all">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <FileCheck className="w-5 h-5 text-green-600" />
                                {cert.certificate_number}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                Issued: {new Date(cert.issued_date).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <Badge 
                              variant={cert.status === 'issued' ? 'default' : 'secondary'}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {cert.status.toUpperCase()}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Wheat className="w-4 h-4 text-green-600" />
                              <span className="font-semibold">{cert.crop_type}</span>
                              <Badge variant="outline">{cert.quantity_kg} kg</Badge>
                            </div>
                            
                            <Separator />
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Initial Grade:</span>
                                <p className="font-semibold text-green-600">{cert.initial_grade}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Final Grade:</span>
                                <p className="font-semibold text-green-600">{cert.final_grade}</p>
                              </div>
                            </div>
                            
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Overall Quality Score</span>
                                <span className="text-2xl font-bold text-green-600">
                                  {cert.overall_quality_score}/100
                                </span>
                              </div>
                              <Progress 
                                value={cert.overall_quality_score} 
                                className="h-2 mt-2"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                <span>Grade Maintained: {cert.grade_maintained ? '✅' : '❌'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-600" />
                                <span>{cert.duration_days} days</span>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="text-xs text-muted-foreground">
                              <p>Storage: {new Date(cert.storage_start_date).toLocaleDateString()} - {new Date(cert.storage_end_date).toLocaleDateString()}</p>
                            </div>
                            
                            <Button 
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`${API_BASE}/storage-guard/certificates/${cert.id}`);
                                  const data = await response.json();
                                  if (data.success) {
                                    // Show detailed certificate info
                                    const certDetails = data.certificate;
                                    toast({
                                      title: `Certificate ${certDetails.certificate_number}`,
                                      description: (
                                        <div className="space-y-2 text-sm mt-2">
                                          <p><strong>Crop:</strong> {certDetails.crop_type} ({certDetails.quantity_kg} kg)</p>
                                          <p><strong>Quality Score:</strong> {certDetails.quality_metrics.overall_score}/100</p>
                                          <p><strong>Temperature:</strong> {certDetails.quality_metrics.temperature_compliance}% compliant</p>
                                          <p><strong>Humidity:</strong> {certDetails.quality_metrics.humidity_compliance}% compliant</p>
                                          <p><strong>Pest Free:</strong> {certDetails.quality_metrics.pest_incidents === 0 ? '✅ Yes' : `❌ ${certDetails.quality_metrics.pest_incidents} incidents`}</p>
                                          <p><strong>Vendor:</strong> {certDetails.vendor?.name || 'N/A'}</p>
                                          <p><strong>Location:</strong> {certDetails.location?.name || 'N/A'}</p>
                                        </div>
                                      ),
                                    });
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to load certificate details",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Full Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="pt-12 pb-12 text-center">
                      <FileCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Certificates Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Complete your storage bookings to receive quality certificates
                      </p>
                      <Button 
                        onClick={() => {
                          // Auto-load certificates on mount
                          const userId = getUserId();
                          if (userId) {
                            setLoadingCertificates(true);
                            fetch(`${API_BASE}/storage-guard/farmer/${userId}/certificates`)
                              .then(res => res.json())
                              .then(data => {
                                if (data.success) setCertificates(data.certificates);
                              })
                              .catch(() => {})
                              .finally(() => setLoadingCertificates(false));
                          }
                        }}
                      >
                        Load My Certificates
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="rfqs-jobs" className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading storage data...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Dashboard Summary */}
                    {dashboardData && (
                      <div className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-primary" />
                          Storage Operations Summary
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Total RFQs</p>
                            <p className="text-lg font-bold">{storageRFQs.length}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Jobs</p>
                            <p className="text-lg font-bold">{storageJobs.length}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Current RFQs */}
                    <div className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Active Storage RFQs ({storageRFQs.length})
                      </h3>
                      {storageRFQs.length > 0 ? (
                        <div className="space-y-3">
                          {storageRFQs.slice(0, 10).map((rfq, index) => {
                            const bids = rfqBids[rfq.id] || [];
                            const isExpanded = expandedRfqId === rfq.id;
                            const hasOpenBids = rfq.status === 'OPEN' && bids.length > 0;
                            
                            // Debug logging
                            if (index === 0) {
                              console.log('🔍 RFQ Debug:', {
                                rfqId: rfq.id,
                                crop: rfq.crop,
                                status: rfq.status,
                                bidsCount: bids.length,
                                hasOpenBids,
                                allBidsKeys: Object.keys(rfqBids)
                              });
                            }
                            
                            return (
                              <div key={index} className="p-3 bg-background/50 rounded-lg border">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium">{rfq.crop || rfq.crop_type || 'Unknown Crop'}</h4>
                                  <div className="flex items-center gap-2">
                                    {hasOpenBids && (
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                        {bids.length} Bids
                                      </Badge>
                                    )}
                                    <Badge variant={rfq.status?.toUpperCase() === 'OPEN' ? 'default' : 'secondary'}>
                                      {rfq.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-sm space-y-1">
                                  <p className="text-muted-foreground">
                                    Type: {rfq.storage_type || 'N/A'} | Quantity: {rfq.quantity_kg}kg | Duration: {rfq.duration_days} days
                                  </p>
                                  {rfq.max_budget && (
                                    <p className="font-medium">Budget: ₹{rfq.max_budget?.toLocaleString()}</p>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Created: {new Date(rfq.created_at).toLocaleDateString()}
                                </p>
                                
                                {/* Show/Hide Bids Button */}
                                {hasOpenBids && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full mt-2"
                                      onClick={() => setExpandedRfqId(isExpanded ? null : rfq.id)}
                                    >
                                      {isExpanded ? '▼ Hide Vendor Bids' : '▶ View Vendor Bids'}
                                    </Button>
                                    
                                    {/* Vendor Bids Display */}
                                    {isExpanded && (
                                      <div className="mt-3 space-y-2 border-t pt-3">
                                        <h5 className="text-sm font-semibold text-primary">💰 Vendor Bids ({bids.length})</h5>
                                        {bids.sort((a, b) => {
                                          // Sort by price (extract number from price_text)
                                          const priceA = parseInt(a.price_text.match(/\d+/)?.[0] || '999999');
                                          const priceB = parseInt(b.price_text.match(/\d+/)?.[0] || '999999');
                                          return priceA - priceB;
                                        }).map((bid, bidIndex) => {
                                          const etaDays = Math.ceil(bid.eta_hours / 24);
                                          const isLowest = bidIndex === 0;
                                          
                                          // Debug logging for first bid
                                          if (bidIndex === 0) {
                                            console.log('🎯 Rendering first bid:', {
                                              bidId: bid.id,
                                              vendorObj: bid.vendor,
                                              locationObj: bid.location,
                                              hasVendor: !!bid.vendor,
                                              hasLocation: !!bid.location
                                            });
                                          }
                                          
                                          // Extract vendor and location info with defensive checks
                                          const vendorName = (bid.vendor && (bid.vendor.business_name || bid.vendor.full_name)) || 'Unknown Vendor';
                                          const locationName = (bid.location && bid.location.name) || `Location ${bidIndex + 1}`;
                                          const locationAddress = (bid.location && bid.location.address) || 'Address not available';
                                          const capacity = (bid.location && bid.location.capacity_text) || 'N/A';
                                          const vendorPhone = (bid.vendor && bid.vendor.phone) || 'N/A';
                                          const vendorRating = (bid.vendor && bid.vendor.rating_avg) || 0;
                                          const verified = bid.vendor && bid.vendor.verified;
                                          
                                          // Calculate estimated total cost
                                          // Price format: ₹XXX/quintal/month
                                          const pricePerQuintalPerMonth = parseInt(bid.price_text.match(/\d+/)?.[0] || '0');
                                          const quintals = rfq.quantity_kg / 100; // Convert kg to quintals
                                          const months = Math.ceil(rfq.duration_days / 30); // Convert days to months
                                          const estimatedCost = Math.round(pricePerQuintalPerMonth * quintals * months);
                                          
                                          function fetchAllData() {
                                            throw new Error("Function not implemented.");
                                          }

                                          return (
                                            <div key={bid.id} className={`p-3 rounded-lg border-2 ${
                                              isLowest ? 'border-green-500 bg-green-50/50' : 'border-border bg-background'
                                            }`}>
                                              <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <h6 className="font-medium text-sm">
                                                      {locationName}
                                                    </h6>
                                                    {isLowest && (
                                                      <Badge variant="default" className="text-xs bg-green-600">
                                                        Lowest Price
                                                      </Badge>
                                                    )}
                                                    {verified && (
                                                      <Badge variant="secondary" className="text-xs">
                                                        ✓ Verified
                                                      </Badge>
                                                    )}
                                                  </div>
                                                  
                                                  {/* Vendor Info */}
                                                  <div className="mt-1 text-xs text-muted-foreground">
                                                    <p className="font-medium text-foreground">{vendorName}</p>
                                                    {vendorRating > 0 && (
                                                      <p>⭐ {vendorRating.toFixed(1)} rating</p>
                                                    )}
                                                    <p>📍 {locationAddress}</p>
                                                    <p>📦 Capacity: {capacity}</p>
                                                    <p>📞 {vendorPhone}</p>
                                                  </div>
                                                  
                                                  {/* Pricing */}
                                                  <div className="mt-2 border-t pt-2">
                                                    <p className="text-sm font-medium">Unit Price: <span className="text-primary font-bold">{bid.price_text}</span></p>
                                                    <p className="text-xs text-muted-foreground">
                                                      ({quintals.toFixed(1)} quintals × {months} month{months > 1 ? 's' : ''})
                                                    </p>
                                                    <p className="text-lg font-bold text-green-600 mt-1">
                                                      Estimated Total: ₹{estimatedCost.toLocaleString()}
                                                    </p>
                                                    {rfq.max_budget && estimatedCost > rfq.max_budget && (
                                                      <Badge variant="destructive" className="text-xs mt-1">
                                                        ⚠️ Exceeds Budget (₹{rfq.max_budget.toLocaleString()})
                                                      </Badge>
                                                    )}
                                                    {rfq.max_budget && estimatedCost <= rfq.max_budget && (
                                                      <Badge variant="default" className="text-xs mt-1 bg-green-600">
                                                        ✓ Within Budget
                                                      </Badge>
                                                    )}
                                                  </div>
                                                  <p className="text-xs text-muted-foreground mt-2">⏱️ ETA: {etaDays} days</p>
                                                  
                                                  {/* Additional Notes */}
                                                  {bid.notes && (
                                                    <p className="text-xs text-muted-foreground mt-2 italic border-t pt-2">
                                                      {bid.notes}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                              <Button
                                                size="sm"
                                                className="w-full mt-2"
                                                variant={isLowest ? 'default' : 'outline'}
                                                onClick={async () => {
                                                  try {
                                                    const userId = getUserId();
                                                    if (!userId) {
                                                      toast({
                                                        title: "⚠️ Authentication Required",
                                                        description: "Please log in to accept bids.",
                                                        variant: "destructive"
                                                      });
                                                      return;
                                                    }
                                                    const response = await fetch(
                                                      `${API_BASE}/storage-guard/rfqs/${rfq.id}/accept-bid?bid_id=${bid.id}&farmer_id=${userId}`,
                                                      {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' }
                                                      }
                                                    );
                                                    
                                                    if (response.ok) {
                                                      const result = await response.json();
                                                      
                                                      // Show success message with job details
                                                      toast({
                                                        title: "✅ Bid Accepted Successfully!",
                                                        description: `Job created (${result.job?.status}). Total cost: ₹${result.booking?.total_price?.toLocaleString() || 'N/A'}`,
                                                      });
                                                      
                                                      // Update RFQ status locally to AWARDED
                                                      setStorageRFQs(prev => prev.map(r => 
                                                        r.id === rfq.id ? { ...r, status: 'AWARDED' } : r
                                                      ));
                                                      
                                                      // Add the new job to storage jobs list
                                                      if (result.job) {
                                                        setStorageJobs(prev => [...prev, result.job]);
                                                      }
                                                      
                                                      // Refresh all data in background
                                                      fetchAllData();
                                                    } else {
                                                      const errorData = await response.json().catch(() => ({}));
                                                      throw new Error(errorData.detail || 'Failed to accept bid');
                                                    }
                                                  } catch (error) {
                                                    toast({
                                                      title: "❌ Error",
                                                      description: "Failed to accept bid. Please try again.",
                                                      variant: "destructive"
                                                    });
                                                  }
                                                }}
                                              >
                                                ✓ Accept This Bid
                                              </Button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No active RFQs found</p>
                      )}
                    </div>

                    {/* Current Jobs */}
                    <div className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Storage Jobs ({storageJobs.length})
                      </h3>
                      {storageJobs.length > 0 ? (
                        <div className="space-y-3">
                          {storageJobs.slice(0, 5).map((job, index) => (
                            <div
                              key={index}
                              className="p-3 bg-background/50 rounded-lg border cursor-pointer hover:bg-accent/30 transition"
                              onClick={() => {
                                setSelectedJobId(job.id);
                                setShowJobModal(true);
                              }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">{job.title || 'Storage Job'}</h4>
                                <Badge variant={
                                  job.status === 'completed' ? 'default' : 
                                  job.status === 'in_progress' ? 'secondary' : 'outline'
                                }>
                                  {job.status}
                                </Badge>
                              </div>
                              {job.details && (
                                <p className="text-sm text-muted-foreground mb-2">{job.details}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Started: {job.started_at ? new Date(job.started_at).toLocaleDateString() : 'Not started'}
                              </p>
                              {job.completed_at && (
                                <p className="text-xs text-muted-foreground">
                                  Completed: {new Date(job.completed_at).toLocaleDateString()}
                                </p>
                              )}
                              <Button size="sm" variant="outline" className="mt-2" onClick={e => { e.stopPropagation(); setSelectedJobId(job.id); setShowJobModal(true); }}>View Details</Button>
                            </div>
                          ))}
                              {/* Job Details Modal */}
                              {showJobModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                                  <div className="bg-white dark:bg-background rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
                                    <button
                                      className="absolute top-2 right-2 text-xl text-muted-foreground hover:text-primary"
                                      onClick={() => { setShowJobModal(false); setSelectedJobId(null); }}
                                      aria-label="Close"
                                    >
                                      ×
                                    </button>
                                    {jobDetailsLoading ? (
                                      <div className="py-12 text-center text-muted-foreground">Loading job details...</div>
                                    ) : jobDetails ? (
                                      <div>
                                        <h2 className="text-xl font-bold mb-2">Storage Job Details</h2>
                                        <div className="mb-2 flex flex-wrap gap-4">
                                          <div>
                                            <span className="font-semibold">Status:</span> {jobDetails.status}
                                          </div>
                                          <div>
                                            <span className="font-semibold">Created:</span> {jobDetails.created_at ? new Date(jobDetails.created_at).toLocaleString() : '-'}
                                          </div>
                                          <div>
                                            <span className="font-semibold">DSR Number:</span> {jobDetails.dsr_number || '-'}
                                          </div>
                                        </div>
                                        <Separator className="my-2" />
                                        <div className="mb-2">
                                          <span className="font-semibold">Crop:</span> {jobDetails.rfq?.crop} <span className="ml-4 font-semibold">Quantity:</span> {jobDetails.rfq?.quantity_kg} kg
                                        </div>
                                        <div className="mb-2">
                                          <span className="font-semibold">Duration:</span> {jobDetails.rfq?.duration_days} days
                                          <span className="ml-4 font-semibold">Budget:</span> ₹{jobDetails.rfq?.max_budget}
                                        </div>
                                        <div className="mb-2">
                                          <span className="font-semibold">Farmer:</span> {jobDetails.farmer?.name} <span className="ml-4 font-semibold">Phone:</span> {jobDetails.farmer?.phone}
                                        </div>
                                        <div className="mb-2">
                                          <span className="font-semibold">Vendor:</span> {jobDetails.vendor?.business_name} <span className="ml-4 font-semibold">Rating:</span> {jobDetails.vendor?.rating}
                                        </div>
                                        <div className="mb-2">
                                          <span className="font-semibold">Location:</span> {jobDetails.location?.name} <span className="ml-4 font-semibold">Address:</span> {jobDetails.location?.address}
                                        </div>
                                        <div className="mb-2">
                                          <span className="font-semibold">Bid Price:</span> {jobDetails.bid?.price_text} <span className="ml-4 font-semibold">ETA:</span> {jobDetails.bid?.eta_hours} hours
                                        </div>
                                        {jobDetails.booking && (
                                          <div className="mb-2">
                                            <span className="font-semibold">Booking Status:</span> {jobDetails.booking.booking_status}
                                            <span className="ml-4 font-semibold">Payment:</span> {jobDetails.booking.payment_status}
                                            <span className="ml-4 font-semibold">Total:</span> ₹{jobDetails.booking.total_price}
                                          </div>
                                        )}
                                        <Separator className="my-2" />
                                        <div className="mb-2">
                                          <span className="font-semibold">Timeline:</span>
                                          <ul className="list-disc ml-6 mt-1">
                                            {jobDetails.timeline?.map((item: any, idx: number) => (
                                              <li key={idx} className="text-sm">
                                                <span className="font-semibold">{item.event}:</span> {item.status} <span className="ml-2 text-muted-foreground">{item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="py-12 text-center text-muted-foreground">No job details found.</div>
                                    )}
                                  </div>
                                </div>
                              )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No jobs found</p>
                      )}
                    </div>

                    {/* Available Vendors */}
                    <div className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        Storage Vendors ({storageVendors.length})
                      </h3>
                      {storageVendors.length > 0 ? (
                        <div className="space-y-3">
                          {storageVendors.slice(0, 5).map((vendor, index) => (
                            <div key={index} className="p-3 bg-background/50 rounded-lg border">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="font-medium">{vendor.business_name}</h4>
                                  <p className="text-sm text-muted-foreground">{vendor.services}</p>
                                  {vendor.address && (
                                    <p className="text-xs text-muted-foreground">{vendor.address}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  {vendor.rating_avg && (
                                    <p className="text-sm font-medium">⭐ {vendor.rating_avg.toFixed(1)}</p>
                                  )}
                                  {vendor.phone && (
                                    <p className="text-xs text-muted-foreground">{vendor.phone}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No storage vendors found</p>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Metrics Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Storage Performance Dashboard
              {isMetricsRefreshing && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
            </CardTitle>
            <CardDescription>Real-time monitoring of storage facilities and quality metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {storageMetrics.map((metric, index) => {
                // Handle both metric.label and metric.metric for backwards compatibility
                const label = metric.label || metric.metric || 'N/A';
                const valueStr = String(metric.value || '0').replace(/[^\d.]/g, '');
                const numValue = parseInt(valueStr) || 0;
                
                return (
                  <div key={index} className="space-y-2 relative">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{metric.value}</span>
                    </div>
                    <Progress 
                      value={Math.min(numValue, 100)} 
                      className="h-2"
                    />
                    {isMetricsRefreshing && (
                      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Storage Facilities */}
        <Tabs defaultValue="facilities" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="facilities">Storage Facilities</TabsTrigger>
            <TabsTrigger value="quality">Quality Control</TabsTrigger>
            <TabsTrigger value="logistics">Transport & Logistics</TabsTrigger>
            <TabsTrigger value="proof">Proof of Delivery</TabsTrigger>
            <TabsTrigger value="locations">Nearest Locations</TabsTrigger>
          </TabsList>

          <TabsContent value="facilities" className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading storage facilities...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storageLocations.map((location, index) => {
                  const Icon = location.location_type === "COLD" ? Snowflake : Wheat;
                  const color = location.location_type === "COLD" ? "text-blue-600" : "text-amber-600";
                  const utilization = locationUtilization[location.id] || 0; // Real utilization from bookings
                  
                  return (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon className={`h-5 w-5 ${color}`} />
                          {location.name}
                        </CardTitle>
                        <Badge variant={utilization > 80 ? "default" : "secondary"}>
                          {utilization > 80 ? "Optimal" : "Good"}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <p className="font-medium">{location.type || location.location_type || 'Storage'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Location:</span>
                            <p className="font-medium">{location.address || location.city || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Capacity:</span>
                            <p className="font-medium">{location.capacity_text || location.capacity_mt || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Utilization:</span>
                            <p className="font-medium">{utilization}%</p>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <span className="text-sm text-muted-foreground">Facilities:</span>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {location.facilities && location.facilities.map((facility: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {facility}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Progress value={utilization} className="h-2" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Quality Assurance Protocol
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">HACCP Compliance</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">ISO 22000 Food Safety</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Cold Chain Management</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Pest Control Systems</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Traceability Systems</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Recent Quality Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData?.recent_activities?.rfqs?.length > 0 ? (
                      dashboardData.recent_activities.rfqs.slice(0, 5).map((rfq: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <div className={`h-2 w-2 rounded-full mt-2 ${
                            rfq.status === 'OPEN' ? 'bg-green-500' :
                            rfq.status === 'AWARDED' ? 'bg-blue-500' : 'bg-yellow-500'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm">
                              New {rfq.storage_type.toLowerCase()} storage RFQ for {rfq.crop} ({rfq.quantity_kg}kg)
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(rfq.created_at).toLocaleString()} • Status: {rfq.status}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No recent activities found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logistics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-green-600" />
                    Transport Fleet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {loading ? "..." : (transportData?.transport_fleet?.active_vehicles ?? "0")}
                    </div>
                    <p className="text-sm text-muted-foreground">Active Vehicles</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Refrigerated Trucks</span>
                      <span className="font-medium">
                        {loading ? "..." : (transportData?.transport_fleet?.refrigerated_trucks ?? "0")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Dry Cargo Trucks</span>
                      <span className="font-medium">
                        {loading ? "..." : (transportData?.transport_fleet?.dry_cargo_trucks ?? "0")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Temperature Controlled</span>
                      <span className="font-medium">
                        {loading ? "..." : (transportData?.transport_fleet?.temperature_controlled ?? "0")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    Route Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {loading ? "..." : (transportData?.route_optimization?.active_routes ?? "0")}
                    </div>
                    <p className="text-sm text-muted-foreground">Active Routes</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Avg Distance</span>
                      <span className="font-medium">
                        {transportData?.route_optimization?.avg_distance || "45 km"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Time Efficiency</span>
                      <span className="font-medium">
                        {transportData?.route_optimization?.time_efficiency || "92%"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Fuel Savings</span>
                      <span className="font-medium">
                        {transportData?.route_optimization?.fuel_savings || "18%"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package2 className="h-5 w-5 text-purple-600" />
                    Tracking & Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {loading ? "..." : (transportData?.tracking_monitoring?.delivery_success ?? "No data")}
                    </div>
                    <p className="text-sm text-muted-foreground">Delivery Success</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Real-time Tracking</span>
                      <span className="font-medium">
                        {loading ? "..." : (transportData?.tracking_monitoring?.real_time_tracking === "No vehicles" ? "❌ No vehicles" : `✓ ${transportData?.tracking_monitoring?.real_time_tracking ?? "Inactive"}`)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Temperature Logs</span>
                      <span className="font-medium">
                        {loading ? "..." : (transportData?.tracking_monitoring?.temperature_logs === "No temp vehicles" ? "❌ No temp vehicles" : `✓ ${transportData?.tracking_monitoring?.temperature_logs ?? "Not monitored"}`)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Quality Maintained</span>
                      <span className="font-medium">
                        {loading ? "..." : (transportData?.tracking_monitoring?.quality_maintained ?? "No data")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="proof" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Proof of Delivery & Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {proofOfDeliveryData?.proofs?.length > 0 ? (
                    proofOfDeliveryData.proofs.map((proof: any, index: number) => (
                      <div key={index} className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold">{proof.service_type} Service</p>
                            <p className="text-sm text-muted-foreground">{proof.vendor_name}</p>
                          </div>
                          <Badge className={proof.status === "Completed" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                            {proof.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Time: {proof.timestamp}</p>
                          <p>Location: {proof.location}</p>
                          <p>Crop: {proof.crop}</p>
                          <p>Quantity: {proof.quantity}</p>
                          <p>Temperature: {proof.temperature}</p>
                          <p>Receipt: {proof.receipt}</p>
                          <p>Rating: {proof.rating?.toFixed(1) || "4.8"} ⭐</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No delivery proofs available yet.</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Proofs will appear here once storage services are completed.
                      </p>
                    </div>
                  )}
                  
                  {/* Add Image Upload Section */}
                  <div className="mt-6 p-4 border border-dashed border-border rounded-lg bg-muted/20">
                    <div className="text-center">
                      <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="font-medium mb-2">Upload Proof Images</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Take photos during loading, transport, and unloading
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" size="sm" onClick={() => handleImageUpload('loading')}>
                          <Camera className="w-4 h-4 mr-2" />
                          Loading Photo
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleImageUpload('transport')}>
                          <Truck className="w-4 h-4 mr-2" />
                          Transport Photo
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleImageUpload('delivery')}>
                          <Package2 className="w-4 h-4 mr-2" />
                          Delivery Photo
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    Nearest Storage Locations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                  {storageLocations.length > 0 ? (
                    storageLocations.map((location: any, index: number) => (
                      <div key={index} className="p-3 rounded-lg border">
                        <div className="font-medium">{location.name}</div>
                        <p className="text-sm text-muted-foreground">{location.address}</p>
                        <div className="flex justify-between items-center mt-2">
                          <Badge className="mt-2" variant="default">{location.type}</Badge>
                          <span className="text-sm font-medium">{location.price_text}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Capacity: {location.capacity_text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No storage locations found nearby.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Available Storage Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                  {storageVendors.length > 0 ? (
                    storageVendors.slice(0, 10).map((vendor: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium block truncate">{vendor.name || vendor.business_name || 'Vendor'}</span>
                          <p className="text-xs text-muted-foreground truncate">{vendor.services || 'Storage Services'}</p>
                        </div>
                        <Badge variant="default" className="ml-2 flex-shrink-0">
                          {vendor.verification_status === 'approved' || vendor.verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No vendors available.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Interactive Map */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Interactive Storage Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StorageLocationMap />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AgentVideoSection
          agentName="StorageGuard"
          agentNameTelugu="నిల్వ రక్షణ"
          videos={[
            {
              title: "Cold Storage Best Practices",
              titleTelugu: "కోల్డ్ స్టోరేజ్ ఉత్తమ పద్ధతులు",
              duration: "10:30",
              type: "tutorial"
            },
            {
              title: "Quality Control Systems",
              titleTelugu: "నాణ్యత నియంత్రణ వ్యవస్థలు",
              duration: "8:45",
              type: "demo"
            },
            {
              title: "Success Story: 95% Quality Retention",
              titleTelugu: "విజయ కథ: 95% నాణ్యత నిలుపుదల",
              duration: "7:20",
              type: "case-study"
            }
          ]}
        />
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Book Storage</h2>
                <Button variant="ghost" onClick={() => setShowBookingModal(false)}>✕</Button>
              </div>

              {/* Storage Suggestions */}
              {storageSuggestions.length > 0 ? (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Available Storage Locations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {storageSuggestions.map((suggestion: any) => (
                      <div 
                        key={suggestion.location_id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedStorage?.location_id === suggestion.location_id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedStorage(suggestion)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{suggestion.name}</h4>
                          <Badge variant="outline">{suggestion.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{suggestion.address}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">📍 {suggestion.distance_km} km away</span>
                          <span className="font-bold text-primary">₹{suggestion.estimated_cost?.toLocaleString()}</span>
                        </div>
                        {suggestion.facilities && suggestion.facilities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {suggestion.facilities.map((facility: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{facility}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-8 border-2 border-dashed border-border rounded-lg text-center">
                  <Package2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">No Storage Available Nearby</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We couldn't find storage locations within 50km of your location.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Try uploading the image again or contact support to add storage in your area.
                  </p>
                </div>
              )}

              {/* Booking Form */}
              {selectedStorage && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Booking Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Crop Type</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-border rounded-lg"
                        placeholder="e.g., Tomatoes"
                        value={bookingFormData.cropType}
                        onChange={(e) => setBookingFormData({...bookingFormData, cropType: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Quantity (kg)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-border rounded-lg"
                        placeholder="e.g., 500"
                        value={bookingFormData.quantityKg}
                        onChange={(e) => setBookingFormData({...bookingFormData, quantityKg: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Duration (days)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-border rounded-lg"
                        placeholder="e.g., 30"
                        value={bookingFormData.durationDays}
                        onChange={(e) => setBookingFormData({...bookingFormData, durationDays: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Special Requirements</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-border rounded-lg"
                        placeholder="Optional"
                        value={bookingFormData.specialRequirements}
                        onChange={(e) => setBookingFormData({...bookingFormData, specialRequirements: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end mt-6">
                    <Button variant="outline" onClick={() => setShowBookingModal(false)}>
                      Cancel
                    </Button>
                    <Button 
                      className="agri-button-primary"
                      onClick={handleBookStorage}
                      disabled={!bookingFormData.cropType || !bookingFormData.quantityKg || !bookingFormData.durationDays}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Booking
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Inspection Modal */}
      {showInspectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Camera className="w-6 h-6" />
                  Schedule Quality Inspection
                </h2>
                <button 
                  onClick={() => setShowInspectionModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Inspection Type *</label>
                  <select
                    className="w-full px-3 py-2 border border-border rounded-lg"
                    value={inspectionFormData.inspectionType}
                    onChange={(e) => setInspectionFormData({...inspectionFormData, inspectionType: e.target.value})}
                  >
                    <option value="pre_storage">Pre-Storage (Before Booking)</option>
                    <option value="during_storage">During Storage (Quality Check)</option>
                    <option value="final">Final Inspection (Before Completion)</option>
                    <option value="dispute">Dispute Resolution</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Related Booking (Optional)</label>
                  <select
                    className="w-full px-3 py-2 border border-border rounded-lg"
                    value={inspectionFormData.bookingId}
                    onChange={(e) => setInspectionFormData({...inspectionFormData, bookingId: e.target.value})}
                  >
                    <option value="">-- Select Booking (Optional) --</option>
                    {myBookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {booking.crop_type} - {booking.quantity_kg}kg @ {booking.location_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Crop Type *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      placeholder="e.g., Tomato, Rice, Cotton"
                      value={inspectionFormData.cropType}
                      onChange={(e) => setInspectionFormData({...inspectionFormData, cropType: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity (kg) *</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      placeholder="e.g., 1000"
                      value={inspectionFormData.quantityKg}
                      onChange={(e) => setInspectionFormData({...inspectionFormData, quantityKg: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location Address *</label>
                  <textarea
                    className="w-full px-3 py-2 border border-border rounded-lg"
                    rows={3}
                    placeholder="Full address where inspection should take place"
                    value={inspectionFormData.locationAddress}
                    onChange={(e) => setInspectionFormData({...inspectionFormData, locationAddress: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Preferred Date *</label>
                    <input
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      value={inspectionFormData.requestedDate}
                      onChange={(e) => setInspectionFormData({...inspectionFormData, requestedDate: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Time Slot</label>
                    <select
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      value={inspectionFormData.preferredTimeSlot}
                      onChange={(e) => setInspectionFormData({...inspectionFormData, preferredTimeSlot: e.target.value})}
                    >
                      <option value="morning">Morning (8 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                      <option value="evening">Evening (4 PM - 7 PM)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Additional Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border border-border rounded-lg"
                    rows={3}
                    placeholder="Any special requirements or concerns"
                    value={inspectionFormData.farmerNotes}
                    onChange={(e) => setInspectionFormData({...inspectionFormData, farmerNotes: e.target.value})}
                  />
                </div>

                <div className="flex gap-2 justify-end mt-6">
                  <Button variant="outline" onClick={() => setShowInspectionModal(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="agri-button-primary"
                    onClick={handleScheduleInspection}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Schedule Inspection
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Viewing Modal */}
      {showCertificateModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Storage Quality Certificate</h2>
                <p className="text-sm text-muted-foreground mt-1">Official Certificate of Storage Quality</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCertificateModal(false)}
                className="rounded-full"
              >
                ✕
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Certificate Header */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg border-2 border-green-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <FileCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Certificate #{selectedCertificate.certificate_number}</h3>
                      <p className="text-sm text-muted-foreground">ID: {selectedCertificate.id}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                    {selectedCertificate.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Issue Date</p>
                    <p className="font-semibold">{new Date(selectedCertificate.issue_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valid Until</p>
                    <p className="font-semibold">{new Date(selectedCertificate.valid_until).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Quality Score</p>
                    <p className="font-bold text-2xl text-green-600">{selectedCertificate.quality_score}/100</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Certificate Status</p>
                    <Badge variant={selectedCertificate.status === 'VALID' ? 'default' : 'secondary'}>
                      {selectedCertificate.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Quality Metrics */}
              {selectedCertificate.metrics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="w-5 h-5" />
                      Quality Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Temperature (Avg)</p>
                        <p className="text-xl font-bold">{selectedCertificate.metrics.temperature_avg || 'N/A'}°C</p>
                        <p className="text-xs text-muted-foreground">Range: {selectedCertificate.metrics.temperature_min}°C - {selectedCertificate.metrics.temperature_max}°C</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Humidity (Avg)</p>
                        <p className="text-xl font-bold">{selectedCertificate.metrics.humidity_avg || 'N/A'}%</p>
                        <p className="text-xs text-muted-foreground">Range: {selectedCertificate.metrics.humidity_min}% - {selectedCertificate.metrics.humidity_max}%</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Moisture (Avg)</p>
                        <p className="text-xl font-bold">{selectedCertificate.metrics.moisture_avg || 'N/A'}%</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">CO2 (Avg)</p>
                        <p className="text-xl font-bold">{selectedCertificate.metrics.co2_avg || 'N/A'} ppm</p>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Storage Compliance</p>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedCertificate.metrics.storage_compliance || 0} className="flex-1" />
                          <span className="font-bold">{selectedCertificate.metrics.storage_compliance || 0}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Pest Free Days</p>
                        <p className="text-2xl font-bold text-green-600">{selectedCertificate.metrics.pest_free_days || 0} days</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Verification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">This certificate has been digitally verified and authenticated by the Storage Guard system.</p>
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCertificate.certificate_number);
                        toast({
                          title: "Copied!",
                          description: "Certificate number copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Certificate Number
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCertificateModal(false)}>
                  Close
                </Button>
                <Button className="agri-button-primary">
                  <FileText className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default StorageGuard;