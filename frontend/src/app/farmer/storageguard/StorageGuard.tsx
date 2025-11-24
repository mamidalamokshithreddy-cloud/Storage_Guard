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
  Receipt, FileCheck, Smartphone, Phone
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "../ui/use-toast";


import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import AgentVideoSection from "../AgentVideoSection";
import StorageLocationMap from "../storageguard/StorageLocationMap";
import MarketIntegrationTab from "./MarketIntegrationTab";

const StorageGuard = () => {
  const { toast } = useToast();
  
  // State for API data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [storageRFQs, setStorageRFQs] = useState<any[]>([]);
  const [storageJobs, setStorageJobs] = useState<any[]>([]);
  const [storageVendors, setStorageVendors] = useState<any[]>([]);
  const [storageLocations, setStorageLocations] = useState<any[]>([]);
  const [storageMetrics, setStorageMetrics] = useState<any[]>([]);
  const [transportData, setTransportData] = useState<any>(null);
  const [proofOfDeliveryData, setProofOfDeliveryData] = useState<any>(null);
  const [qualityData, setQualityData] = useState<any>(null);
  const [iotSensorData, setIotSensorData] = useState<any>(null);
  const [pestDetectionData, setPestDetectionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);

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

  // Utility function to get user ID from various sources
  const getUserId = (): string | null => {
    // Try multiple possible keys
    let userId = localStorage.getItem('user_id') || 
                 localStorage.getItem('userId') || 
                 sessionStorage.getItem('user_id') ||
                 sessionStorage.getItem('userId');
    
    // If still no user ID, try to decode from token
    if (!userId) {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const payload = JSON.parse(jsonPayload);
          userId = payload.sub || payload.user_id || payload.id;
        } catch (e) {
          console.error('Error decoding token:', e);
        }
      }
    }
    
    return userId;
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
          
          // Refetch quality analysis data
          const qualityRes = await fetch(`${API_BASE}/storage-guard/quality-analysis`);
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
      const userId = getUserId();
      console.log('🔍 Fetching dashboard for farmer:', userId);
      if (!userId) {
        console.error('❌ No user ID found! Check localStorage/sessionStorage');
        return;
      }
      const response = await fetch(`${API_BASE}/storage-guard/farmer-dashboard?farmer_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dashboard data received:', data.summary);
        setFarmerDashboard(data);
      } else {
        console.error('❌ Dashboard fetch failed:', response.status);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
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

  // Fetch storage data from integrated APIs
  useEffect(() => {
    const fetchStorageData = async () => {
      try {
        setLoading(true);
        
        const [dashboardRes, rfqsRes, jobsRes, vendorsRes, locationsRes, metricsRes, transportRes, proofRes, qualityRes, iotRes, pestRes] = await Promise.all([
          fetch(`${API_BASE}/storage-guard/dashboard`),
          fetch(`${API_BASE}/storage-guard/rfqs`),
          fetch(`${API_BASE}/storage-guard/jobs`),
          fetch(`${API_BASE}/storage-guard/vendors`),
          fetch(`${API_BASE}/storage-guard/locations`),
          fetch(`${API_BASE}/storage-guard/metrics`),
          fetch(`${API_BASE}/storage-guard/transport`),
          fetch(`${API_BASE}/storage-guard/proof-of-delivery`),
          fetch(`${API_BASE}/storage-guard/quality-analysis`),
          fetch(`${API_BASE}/storage-guard/iot-sensors`),
          fetch(`${API_BASE}/storage-guard/pest-detection`)
        ]);

        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          setDashboardData(dashboardData);
        }

        if (rfqsRes.ok) {
          const rfqsData = await rfqsRes.json();
          setStorageRFQs(rfqsData.rfqs || []);
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
          setIotSensorData(iotDataResponse);
        }

        if (pestRes.ok) {
          const pestDataResponse = await pestRes.json();
          setPestDetectionData(pestDataResponse.detections || []);
        }

      } catch (error) {
        console.error('Error fetching storage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStorageData();
    fetchMyBookings();
    fetchFarmerDashboard();
    fetchScheduledInspections();
  }, [API_BASE]);

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
      location: detection.location || "Unknown",
      action: detection.severity === "critical" ? "Immediate action required" : 
             detection.severity === "high" ? "Treatment scheduled" : "Monitoring"
    })) : [
      { pest: "Loading...", confidence: 0, location: "--", action: "Fetching data..." }
    ]
  };

  // IoT sensor data from API with fallback
  const sensorDisplayData = iotSensorData?.sensors || {
    temperature: { current: "Loading...", range: "--", status: "fetching" },
    humidity: { current: "Loading...", range: "--", status: "fetching" },
    co2: { current: "Loading...", range: "--", status: "fetching" },
    ethylene: { current: "Loading...", range: "--", status: "fetching" }
  };

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
                src="/carriers.jpg"
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
              <TabsList className="grid grid-cols-8 w-full">
                <TabsTrigger value="quality-analysis">Quality Analysis</TabsTrigger>
                <TabsTrigger value="pest-detection">Pest Detection</TabsTrigger>
                <TabsTrigger value="iot-sensors">IoT Sensors</TabsTrigger>
                <TabsTrigger value="my-bookings">My Bookings</TabsTrigger>
                <TabsTrigger value="market">🛒 Market</TabsTrigger>
                <TabsTrigger value="certificates">📜 Certificates</TabsTrigger>
                <TabsTrigger value="vendor-services">Vendor Services</TabsTrigger>
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
                  {cvDetectionData.pestDetection.map((pest, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg bg-destructive/10">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Scan className="w-4 h-4 text-destructive" />
                          {pest.pest}
                        </h3>
                        <Badge variant="destructive">{pest.confidence}% confidence</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Location: {pest.location}</p>
                      <p className="text-sm font-medium text-destructive">{pest.action}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="iot-sensors" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(sensorDisplayData).map(([sensor, data]: [string, any]) => (
                    <div key={sensor} className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20">
                      <h3 className="font-semibold mb-2 capitalize flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-primary" />
                        {sensor}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Current:</span>
                          <span className="font-medium">{data.current}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Range:</span>
                          <span className="font-medium">{data.range}</span>
                        </div>
                        <Badge variant={data.status === 'optimal' ? 'default' : 'secondary'} 
                               className={data.status === 'optimal' ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>
                          {data.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
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
                    <div className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-blue-500/10">
                      <p className="text-sm text-muted-foreground mb-1">Total Bookings</p>
                      <p className="text-2xl font-bold">{farmerDashboard.summary.total_bookings || 0}</p>
                    </div>
                    <div className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-green-500/10">
                      <p className="text-sm text-muted-foreground mb-1">Active Bookings</p>
                      <p className="text-2xl font-bold">{farmerDashboard.summary.active_bookings || 0}</p>
                    </div>
                    <div className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-purple-500/10">
                      <p className="text-sm text-muted-foreground mb-1">Completed</p>
                      <p className="text-2xl font-bold">{farmerDashboard.summary.completed_bookings || 0}</p>
                    </div>
                    <div className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-orange-500/10">
                      <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                      <p className="text-2xl font-bold">₹{(farmerDashboard.summary.total_spent || 0).toLocaleString()}</p>
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
                                  disabled={!booking.ai_inspection_id}
                                  onClick={async () => {
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
                                  {booking.ai_inspection_id 
                                    ? 'Complete & Certificate' 
                                    : '🔒 No Certificate'}
                                </Button>
                              )}
                              
                              {/* Show message for pending bookings */}
                              {booking.booking_status?.toLowerCase() === 'pending' && !booking.vendor_confirmed && (
                                <Button 
                                  className="bg-yellow-600 hover:bg-yellow-700 text-xs h-8"
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "⏳ Booking Pending",
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

              <TabsContent value="market" className="space-y-4">
                <MarketIntegrationTab 
                  userId={getUserId() || ''} 
                  bookings={myBookings}
                  apiBase={API_BASE}
                  toast={toast}
                />
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
                          {storageRFQs.slice(0, 5).map((rfq, index) => (
                            <div key={index} className="p-3 bg-background/50 rounded-lg border">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">{rfq.crop || rfq.crop_type || 'Unknown Crop'}</h4>
                                <Badge variant={rfq.status?.toUpperCase() === 'OPEN' ? 'default' : 'secondary'}>
                                  {rfq.status}
                                </Badge>
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
                            </div>
                          ))}
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
                            <div key={index} className="p-3 bg-background/50 rounded-lg border">
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
                            </div>
                          ))}
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
            </CardTitle>
            <CardDescription>Real-time monitoring of storage facilities and quality metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {storageMetrics.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{metric.label}</span>
                    <span className="font-medium">{metric.value}</span>
                  </div>
                  <Progress 
                    value={parseInt(metric.value)} 
                    className="h-2"
                  />
                </div>
              ))}
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
                  const utilization = Math.floor(Math.random() * 40) + 60; // Random 60-100%
                  
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
                            <p className="font-medium">{location.location_type} Storage</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Location:</span>
                            <p className="font-medium">{location.city}, {location.state}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Capacity:</span>
                            <p className="font-medium">{location.capacity_mt} MT</p>
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
      
    </div>
  );
};

export default StorageGuard;