
'use client';

import { Map, TestTube, Sprout, Droplets, Shield, Beaker, Tractor, Building, ShoppingCart, Package, Award, Truck, Star, FileText, ArrowRight, TrendingUp, Calendar, Zap, AlertCircle, Gauge, CheckCircle, AlertTriangle, Palette, Printer, Tag, BadgeCheck, MapPin, BarChart3, Route } from "lucide-react";
import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import ProtectedRoute from '@/app/admin/components/ProtectedRoute';
import { getUserRole } from '@/lib/auth';

import PageHeader from './PageHeader';
import AgriAgentsSidebar from './AgriAgentsSidebar';
import { usePathname } from 'next/navigation';
import EquipmentManagement from "./processinghub/EquipmentManagement";
import Topbar from '@/app/admin/components/Topbar';

// Dynamically import all route components following AgriHub pattern
const LandMapping = dynamic(() => import('./landmapping/LandMappingPage'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Land Mapping...</div>
    </div>
  ),
  ssr: false
});

// Add Land Onboarding dynamic import
const LandOnboarding = dynamic(() => import('./landmapping/LandOnboarding'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Land Registration...</div>
    </div>
  ),
  ssr: false
});

// Add Leasing Management dynamic import
const LeasingManagement = dynamic(() => import('./landmapping/LeasingManagement'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Leasing Management...</div>
    </div>
  ),
  ssr: false
});

const SoilSense = dynamic(() => import('./soil sense/soilsensepage'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading SoilSense...</div>
    </div>
  ),
  ssr: false
});

// Add SoilSense submodule dynamic imports
const TestRequest = dynamic(() => import('./soil sense/TestRequest'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Test Request...</div>
    </div>
  ),
  ssr: false
});

const DroneSchedule = dynamic(() => import('./soil sense/DroneSchedule'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Drone Schedule...</div>
    </div>
  ),
  ssr: false
});

const SoilHealthCard = dynamic(() => import('./soil sense/SoilHealthCard'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Soil Health Card...</div>
    </div>
  ),
  ssr: false
});

const LabIntegration = dynamic(() => import('./soil sense/LabIntegration'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Lab Integration...</div>
    </div>
  ),
  ssr: false
});

const SeedPlanner = dynamic(() => import('./seed planner/Seedplannerpage'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading SeedPlanner...</div>
    </div>
  ),
  ssr: false
});

// SeedPlanner sub-modules
const CropPlanning = dynamic(() => import('./seed planner/CropPlanning'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Crop Planning...</div>
    </div>
  ),
  ssr: false
});

const ProcurementManager = dynamic(() => import('./seed planner/ProcurementManager'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Procurement Manager...</div>
    </div>
  ),
  ssr: false
});

const SowingGuide = dynamic(() => import('./seed planner/SowingGuide'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Sowing Guide...</div>
    </div>
  ),
  ssr: false
});

const AquaGuide = dynamic(() => import('./aquaguide/AquaGuideUpdated'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading AquaGuide...</div>
    </div>
  ),
  ssr: false
});

// AquaGuide sub-modules
const IrrigationScheduling = dynamic(() => import('./aquaguide/IrrigationScheduling'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Irrigation Scheduling...</div>
    </div>
  ),
  ssr: false
});

const EquipmentIntegration = dynamic(() => import('./aquaguide/EquipmentIntegration'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Equipment Integration...</div>
    </div>
  ),
  ssr: false
});

const AlertsReminders = dynamic(() => import('./aquaguide/AlertsReminders'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Alerts & Reminders...</div>
    </div>
  ),
  ssr: false
});

const ComplianceLogs = dynamic(() => import('./aquaguide/ComplianceLogs'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Compliance Logs...</div>
    </div>
  ),
  ssr: false
});

const CropShield = dynamic(() => import('./cropshield/CropShieldpage'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading CropShield...</div>
    </div>
  ),
  ssr: false
});

const NutriDose = dynamic(() => import('./nutridose/NutriDosepage'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading NutriDose...</div>
    </div>
  ),
  ssr: false
});

const HarvestBot = dynamic(() => import('./harvestbot/HarvestBot'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading HarvestBot...</div>
    </div>
  ),
  ssr: false
});

const StorageGuard = dynamic(() => import('./storageguard/StorageGuard'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading StorageGuard...</div>
    </div>
  ),
  ssr: false
});

const MarketConnect = dynamic(() => import('./marketconnect/MarketConnect'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading MarketConnect...</div>
    </div>
  ),
  ssr: false
});

const ProcessingHub = dynamic(() => import('./processinghub/ProcessingHub'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Processing Hub...</div>
    </div>
  ),
  ssr: false
});

// ProcessingHub sub-modules
const BatchTracking = dynamic(() => import('./processinghub/BatchTracking'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Batch Tracking...</div>
    </div>
  ),
  ssr: false
});

const ProductionPlanning = dynamic(() => import('./processinghub/ProductionPlanning'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Production Planning...</div>
    </div>
  ),
  ssr: false
});


const QualityAssurance = dynamic(() => import('./qualityassurance/QualityAssurance'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Quality Assurance...</div>
    </div>
  ),
  ssr: false
});

// QualityAssurance sub-modules
const AuditManagement = dynamic(() => import('./qualityassurance/AuditManagement'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Audit Management...</div>
    </div>
  ),
  ssr: false
});

const CAPAManagement = dynamic(() => import('./qualityassurance/CAPAManagement'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading CAPA Management...</div>
    </div>
  ),
  ssr: false
});

const DocumentControl = dynamic(() => import('./qualityassurance/DocumentControl'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Document Control...</div>
    </div>
  ),
  ssr: false
});

const SampleManagement = dynamic(() => import('./qualityassurance/SampleManagement'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Sample Management...</div>
    </div>
  ),
  ssr: false
});

const PackagingBranding = dynamic(() => import('./packagingbranding/PackagingBranding'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Packaging & Branding...</div>
    </div>
  ),
  ssr: false
});

// PackagingBranding sub-modules
const BrandCompliance = dynamic(() => import('./packagingbranding/BrandCompliance'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Brand Compliance...</div>
    </div>
  ),
  ssr: false
});

const DesignStudio = dynamic(() => import('./packagingbranding/DesignStudio'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Design Studio...</div>
    </div>
  ),
  ssr: false
});

const LabelGenerator = dynamic(() => import('./packagingbranding/LabelGenerator'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Label Generator...</div>
    </div>
  ),
  ssr: false
});

const PrintManagement = dynamic(() => import('./packagingbranding/PrintManagement'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Print Management...</div>
    </div>
  ),
  ssr: false
});

const ConsumerDelivery = dynamic(() => import('./consumer-delivery/ConsumerDelivery'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Consumer Delivery...</div>
    </div>
  ),
  ssr: false
});

// ConsumerDelivery sub-modules
const RouteOptimization = dynamic(() => import('./consumer-delivery/RouteOptimization'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Route Optimization...</div>
    </div>
  ),
  ssr: false
});

const FleetManagement = dynamic(() => import('./consumer-delivery/FleetManagement'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Fleet Management...</div>
    </div>
  ),
  ssr: false
});

const OrderTracking = dynamic(() => import('./consumer-delivery/OrderTracking'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Order Tracking...</div>
    </div>
  ),
  ssr: false
});

const DeliveryAnalytics = dynamic(() => import('./consumer-delivery/DeliveryAnalytics'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Delivery Analytics...</div>
    </div>
  ),
  ssr: false
});

const ConsumerFeedback = dynamic(() => import('./consumer feedback/ConsumerFeedback'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Consumer Feedback...</div>
    </div>
  ),
  ssr: false
});

// ConsumerFeedback Submodule Dynamic Imports
const CustomerAnalytics = dynamic(() => import('./consumer feedback/CustomerAnalytics'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Customer Analytics...</div>
    </div>
  ),
  ssr: false
});

const ReviewManagement = dynamic(() => import('./consumer feedback/ReviewManagement'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Review Management...</div>
    </div>
  ),
  ssr: false
});

const LoyaltyPrograms = dynamic(() => import('./consumer feedback/LoyaltyPrograms'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Loyalty Programs...</div>
    </div>
  ),
  ssr: false
});

const MarketResearch = dynamic(() => import('./consumer feedback/MarketResearch'), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-muted-foreground">Loading Market Research...</div>
    </div>
  ),
  ssr: false
});

// Add AgriSaarathi import - Direct import to avoid chunk loading issues
import AgriSaarathi from './AgriSaarathi';

export default function AgriDashboard() {
  const [, setSidebarCollapsed] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>(""); // Track selected module
  const [showAgriSaarathi, setShowAgriSaarathi] = useState(false); // New state for AgriSaarathi
  const [showLandOnboarding, setShowLandOnboarding] = useState(false); // New state for land onboarding
  const [showLeasingManagement, setShowLeasingManagement] = useState(false); // New state for leasing management
  const [showSoilSenseSubmodule, setShowSoilSenseSubmodule] = useState<string>(""); // Track SoilSense submodules
  const [showAquaGuideSubmodule, setShowAquaGuideSubmodule] = useState<string>(""); // Track AquaGuide submodules
  const [showProcessingHubSubmodule, setShowProcessingHubSubmodule] = useState<string>(""); // Track ProcessingHub submodules
  const [showQualityAssuranceSubmodule, setShowQualityAssuranceSubmodule] = useState<string>(""); // Track QualityAssurance submodules
  const [showPackagingBrandingSubmodule, setShowPackagingBrandingSubmodule] = useState<string>(""); // Track PackagingBranding submodules
  const [showConsumerDeliverySubmodule, setShowConsumerDeliverySubmodule] = useState<string>(""); // Track ConsumerDelivery submodules
  const [showConsumerFeedbackSubmodule, setShowConsumerFeedbackSubmodule] = useState<string>(""); // Track ConsumerFeedback submodules
  const pathname = usePathname();
  
  // Get current user role to customize notifications
  const userRole = getUserRole();
  const userType = userRole === 'landowner' ? 'Landowner' : 'Farmer';
  
  // Dynamic notifications based on user role
  const notifications = useMemo(() => {
    if (userRole === 'landowner') {
      return [
        { id: '1', message: 'New lease agreement proposal received', time: '20 min ago', userType: 'Landowner', type: 'lease', read: false },
        { id: '2', message: 'Property valuation report is ready', time: '2 hours ago', userType: 'Landowner', type: 'valuation', read: false },
        { id: '3', message: 'Monthly rental payment received', time: '1 day ago', userType: 'Landowner', type: 'payment', read: true },
      ];
    } else {
      return [
        { id: '1', message: 'Your crop health report is ready for review', time: '15 min ago', userType: 'Farmer', type: 'report', read: false },
        { id: '2', message: 'Weather alert: Heavy rain expected tomorrow', time: '1 hour ago', userType: 'Farmer', type: 'weather', read: false },
        { id: '3', message: 'Seed planner recommendations updated', time: '4 hours ago', userType: 'Farmer', type: 'planning', read: true },
      ];
    }
  }, [userRole]);

  const handleLogout = () => {
    // Handle logout logic for current user
    console.log(`${userType} logout`);
    
    // Clear any stored authentication data
    localStorage.removeItem('userToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    
    // Redirect to login page or home
    window.location.href = '/';
  };
  
  console.log('Current pathname:', pathname);
  console.log('Selected module:', selectedModule);
  console.log('Show AgriSaarathi:', showAgriSaarathi);
  console.log('Show land onboarding:', showLandOnboarding);
  console.log('Show leasing management:', showLeasingManagement);
  console.log('Show soil sense submodule:', showSoilSenseSubmodule);
  console.log('Show aqua guide submodule:', showAquaGuideSubmodule);
  console.log('Show processing hub submodule:', showProcessingHubSubmodule);
  console.log('Show quality assurance submodule:', showQualityAssuranceSubmodule);
  console.log('Show packaging branding submodule:', showPackagingBrandingSubmodule);
  console.log('Show consumer delivery submodule:', showConsumerDeliverySubmodule);
  console.log('Show consumer feedback submodule:', showConsumerFeedbackSubmodule);

  // Handle module selection from sidebar
  const handleModuleSelect = (moduleName: string) => {
    setSelectedModule(moduleName);
    setShowAgriSaarathi(false); // Reset AgriSaarathi when selecting from sidebar
    setShowLandOnboarding(false); // Reset land onboarding when selecting from sidebar
    setShowLeasingManagement(false); // Reset leasing management when selecting from sidebar
    setShowSoilSenseSubmodule(""); // Reset soil sense submodules when selecting from sidebar
    setShowAquaGuideSubmodule(""); // Reset aqua guide submodules when selecting from sidebar
    setShowProcessingHubSubmodule(""); // Reset processing hub submodules when selecting from sidebar
    setShowQualityAssuranceSubmodule(""); // Reset quality assurance submodules when selecting from sidebar
    setShowPackagingBrandingSubmodule(""); // Reset packaging branding submodules when selecting from sidebar
    setShowConsumerDeliverySubmodule(""); // Reset consumer delivery submodules when selecting from sidebar
    setShowConsumerFeedbackSubmodule(""); // Reset consumer feedback submodules when selecting from sidebar
  };

  // Handle AgriSaarathi click from PageHeader
  const handleAgriSaarathiClick = () => {
    setShowAgriSaarathi(true);
    setSelectedModule(""); // Clear selected module
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
    setShowAquaGuideSubmodule("");
    setShowProcessingHubSubmodule("");
    setShowQualityAssuranceSubmodule("");
    setShowPackagingBrandingSubmodule("");
    setShowConsumerDeliverySubmodule("");
    setShowConsumerFeedbackSubmodule("");
  };

  // Handle land registration click from LandMappingPage
  const handleLandRegistrationClick = () => {
    setShowLandOnboarding(true);
    setShowAgriSaarathi(false); // Reset AgriSaarathi
    setShowLeasingManagement(false); // Hide leasing when showing land onboarding
  };

  // Handle leasing management click from LandMappingPage
  const handleLeasingManagementClick = () => {
    setShowLeasingManagement(true);
    setShowAgriSaarathi(false); // Reset AgriSaarathi
    setShowLandOnboarding(false); // Hide land onboarding when showing leasing
  };

  // Handle back to land mapping from land onboarding
  const handleBackToLandMapping = () => {
    setShowLandOnboarding(false);
  };

  // Handle back to dashboard from AgriSaarathi
  // const handleBackFromAgriSaarathi = () => {
  //   setShowAgriSaarathi(false);
  // };

  // Handle back to land mapping from leasing management
  // const handleBackToLandMappingFromLeasing = () => {
  //   setShowLeasingManagement(false);
  // };

  // Handle SoilSense submodule navigation
  const handleTestRequestClick = () => {
    setShowSoilSenseSubmodule("test-request");
    setShowAgriSaarathi(false);
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
  };

  const handleDroneScheduleClick = () => {
    setShowSoilSenseSubmodule("drone-schedule");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
  };

  const handleHealthCardClick = () => {
    setShowSoilSenseSubmodule("health-card");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
  };

  const handleLabIntegrationClick = () => {
    setShowSoilSenseSubmodule("lab-integration");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
  };

  // Handle back to SoilSense from submodules
  const handleBackToSoilSense = () => {
    setShowSoilSenseSubmodule("");
  };

  // Handle AquaGuide submodule navigation
  const handleIrrigationSchedulingClick = () => {
    setShowAquaGuideSubmodule("irrigation-scheduling");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
  };

  const handleEquipmentIntegrationClick = () => {
    setShowAquaGuideSubmodule("equipment-integration");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
  };

  const handleAlertsRemindersClick = () => {
    setShowAquaGuideSubmodule("alerts-reminders");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
  };

  const handleComplianceLogsClick = () => {
    setShowAquaGuideSubmodule("compliance-logs");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
  };

  // Handle back to AquaGuide from submodules
  const handleBackToAquaGuide = () => {
    setShowAquaGuideSubmodule("");
  };

  // Handle ProcessingHub submodule navigation
  const handleBatchTrackingClick = () => {
    setShowProcessingHubSubmodule("batch-tracking");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
    setShowAquaGuideSubmodule("");
  };

  const handleProductionPlanningClick = () => {
    setShowProcessingHubSubmodule("production-planning");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
    setShowAquaGuideSubmodule("");
  };

  const handleEquipmentManagementClick = () => {
    setShowProcessingHubSubmodule("equipment-management");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
    setShowAquaGuideSubmodule("");
  };

  // Handle back to ProcessingHub from submodules
  const handleBackToProcessingHub = () => {
    setShowProcessingHubSubmodule("");
  };

  // Handle QualityAssurance submodule navigation
  const handleAuditManagementClick = () => {
    setShowQualityAssuranceSubmodule("audit-management");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
    setShowAquaGuideSubmodule("");
    setShowProcessingHubSubmodule("");
  };

  const handleCAPAManagementClick = () => {
    setShowQualityAssuranceSubmodule("capa-management");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
    setShowAquaGuideSubmodule("");
    setShowProcessingHubSubmodule("");
  };

  const handleDocumentControlClick = () => {
    setShowQualityAssuranceSubmodule("document-control");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
    setShowAquaGuideSubmodule("");
    setShowProcessingHubSubmodule("");
  };

  const handleSampleManagementClick = () => {
    setShowQualityAssuranceSubmodule("sample-management");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
    setShowAquaGuideSubmodule("");
    setShowProcessingHubSubmodule("");
  };

  // Handle back to QualityAssurance from submodules
  const handleBackToQualityAssurance = () => {
    setShowQualityAssuranceSubmodule("");
  };

  // Handle PackagingBranding submodule navigation
  const handleBrandComplianceClick = () => {
    setShowPackagingBrandingSubmodule("brand-compliance");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
    setShowAquaGuideSubmodule("");
    setShowProcessingHubSubmodule("");
    setShowQualityAssuranceSubmodule("");
  };

  const handleDesignStudioClick = () => {
    setShowPackagingBrandingSubmodule("design-studio");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
    setShowAquaGuideSubmodule("");
    setShowProcessingHubSubmodule("");
    setShowQualityAssuranceSubmodule("");
  };

  const handleLabelGeneratorClick = () => {
    setShowPackagingBrandingSubmodule("label-generator");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
    setShowAquaGuideSubmodule("");
    setShowProcessingHubSubmodule("");
    setShowQualityAssuranceSubmodule("");
  };

  const handlePrintManagementClick = () => {
    setShowPackagingBrandingSubmodule("print-management");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
    setShowAquaGuideSubmodule("");
    setShowProcessingHubSubmodule("");
    setShowQualityAssuranceSubmodule("");
  };

  // Handle back to PackagingBranding from submodules
  const handleBackToPackagingBranding = () => {
    setShowPackagingBrandingSubmodule("");
  };

  // Handle ConsumerDelivery submodule navigation
  const handleRouteOptimizationClick = () => {
    setShowConsumerDeliverySubmodule("route-optimization");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
    setShowAquaGuideSubmodule("");
    setShowProcessingHubSubmodule("");
    setShowQualityAssuranceSubmodule("");
    setShowPackagingBrandingSubmodule("");
  };

  const handleFleetManagementClick = () => {
    setShowConsumerDeliverySubmodule("fleet-management");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
    setShowAquaGuideSubmodule("");
    setShowProcessingHubSubmodule("");
    setShowQualityAssuranceSubmodule("");
    setShowPackagingBrandingSubmodule("");
  };

  const handleOrderTrackingClick = () => {
    setShowConsumerDeliverySubmodule("order-tracking");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
    setShowAquaGuideSubmodule("");
    setShowProcessingHubSubmodule("");
    setShowQualityAssuranceSubmodule("");
    setShowPackagingBrandingSubmodule("");
  };

  const handleDeliveryAnalyticsClick = () => {
    setShowConsumerDeliverySubmodule("delivery-analytics");
    setShowLandOnboarding(false);
    setShowLeasingManagement(false);
    setShowSoilSenseSubmodule("");
    setShowAquaGuideSubmodule("");
    setShowProcessingHubSubmodule("");
    setShowQualityAssuranceSubmodule("");
    setShowPackagingBrandingSubmodule("");
  };

  // Handle back to ConsumerDelivery from submodules
  const handleBackToConsumerDelivery = () => {
    setShowConsumerDeliverySubmodule("");
  };

  // ConsumerFeedback submodule handlers
  const handleCustomerAnalyticsClick = () => {
    setShowConsumerFeedbackSubmodule("customer-analytics");
  };

  const handleReviewManagementClick = () => {
    setShowConsumerFeedbackSubmodule("review-management");
  };

  const handleLoyaltyProgramsClick = () => {
    setShowConsumerFeedbackSubmodule("loyalty-programs");
  };

  const handleMarketResearchClick = () => {
    setShowConsumerFeedbackSubmodule("market-research");
  };

  // Handle back to ConsumerFeedback from submodules
  const handleBackToConsumerFeedback = () => {
    setShowConsumerFeedbackSubmodule("");
  };

  // Function to get the current page info based on selected module or route
  const getCurrentPageInfo = () => {
    // If showing AgriSaarathi, show that info
    if (showAgriSaarathi) {
      return {
        title: "AgriSaarathi Command Center",
        titleTelugu: "కృషి సారథి కమాండ్ సెంటర్",
        icon: Map, // You can import a more appropriate icon
        nextRoute: "",
        nextLabel: "Command Center Active"
      };
    }

    // If showing land onboarding, show that info
    if (showLandOnboarding) {
      return {
        title: "Land Registration",
        titleTelugu: "భూమి రిజిస్ట్రేషన్",
        icon: Map,
        nextRoute: "",
        nextLabel: "Registration Form"
      };
    }

    // If showing leasing management, show that info
    if (showLeasingManagement) {
      return {
        title: "Leasing & Role Assignment",
        titleTelugu: "లీజింగ్ మరియు పాత్ర కేటాయింపు",
        icon: FileText,
        nextRoute: "",
        nextLabel: "Leasing Management"
      };
    }

    // If showing SoilSense submodules, show appropriate info
    if (showSoilSenseSubmodule) {
      switch (showSoilSenseSubmodule) {
        case "test-request":
          return {
            title: "Test Request",
            titleTelugu: "పరీక్ష అభ్యర్థన",
            icon: TestTube,
            nextRoute: "",
            nextLabel: "Soil Testing"
          };
        case "drone-schedule":
          return {
            title: "Drone Schedule",
            titleTelugu: "డ్రోన్ షెడ్యూల్",
            icon: ArrowRight,
            nextRoute: "",
            nextLabel: "Precision Scanning"
          };
        case "health-card":
          return {
            title: "Soil Health Card",
            titleTelugu: "మట్టి ఆరోగ్య కార్డ్",
            icon: TrendingUp,
            nextRoute: "",
            nextLabel: "Health Analysis"
          };
        case "lab-integration":
          return {
            title: "Lab Integration",
            titleTelugu: "ల్యాబ్ ఇంటిగ్రేషన్",
            icon: Beaker,
            nextRoute: "",
            nextLabel: "Lab Reports"
          };
        default:
          return {
            title: "SoilSense",
            titleTelugu: "మట్టి విశ్లేషణ",
            icon: TestTube,
            nextRoute: "",
            nextLabel: "Soil Analysis"
          };
      }
    }

    // If showing AquaGuide submodules, show appropriate info
    if (showAquaGuideSubmodule) {
      switch (showAquaGuideSubmodule) {
        case "irrigation-scheduling":
          return {
            title: "Irrigation Scheduling",
            titleTelugu: "నీటిపారుదల షెడ్యూల్",
            icon: Calendar,
            nextRoute: "",
            nextLabel: "Smart Scheduling"
          };
        case "equipment-integration":
          return {
            title: "Equipment Integration",
            titleTelugu: "పరికరాల ఇంటిగ్రేషన్",
            icon: Zap,
            nextRoute: "",
            nextLabel: "IoT Integration"
          };
        case "alerts-reminders":
          return {
            title: "Alerts & Reminders",
            titleTelugu: "హెచ్చరికలు మరియు రిమైండర్లు",
            icon: AlertCircle,
            nextRoute: "",
            nextLabel: "SMS/IVR Alerts"
          };
        case "compliance-logs":
          return {
            title: "Compliance Logs",
            titleTelugu: "కంప్లైయన్స్ లాగ్స్",
            icon: Gauge,
            nextRoute: "",
            nextLabel: "Regulatory Compliance"
          };
        default:
          return {
            title: "AquaGuide",
            titleTelugu: "నీటిపారుదల",
            icon: Droplets,
            nextRoute: "",
            nextLabel: "Water Management"
          };
      }
    }

    // If showing ProcessingHub submodules, show appropriate info
    if (showProcessingHubSubmodule) {
      switch (showProcessingHubSubmodule) {
        case "batch-tracking":
          return {
            title: "Batch Tracking",
            titleTelugu: "బ్యాచ్ ట్రాకింగ్",
            icon: Package,
            nextRoute: "",
            nextLabel: "Batch Traceability"
          };
        case "production-planning":
          return {
            title: "Production Planning",
            titleTelugu: "ఉత్పాదన ప్రణాళిక",
            icon: TrendingUp,
            nextRoute: "",
            nextLabel: "Production Schedule"
          };
        case "equipment-management":
          return {
            title: "Equipment Management",
            titleTelugu: "పరికరాల నిర్వహణ",
            icon: Zap,
            nextRoute: "",
            nextLabel: "Equipment Monitoring"
          };
        default:
          return {
            title: "Processing Hub",
            titleTelugu: "ప్రాసెసింగ్ హబ్",
            icon: Package,
            nextRoute: "",
            nextLabel: "Processing Services"
          };
      }
    }

    // If showing QualityAssurance submodules, show appropriate info
    if (showQualityAssuranceSubmodule) {
      switch (showQualityAssuranceSubmodule) {
        case "audit-management":
          return {
            title: "Audit Management",
            titleTelugu: "ఆడిట్ మేనేజ్‌మెంట్",
            icon: CheckCircle,
            nextRoute: "",
            nextLabel: "Audit Scheduling & Compliance"
          };
        case "capa-management":
          return {
            title: "CAPA Management",
            titleTelugu: "CAPA మేనేజ్‌మెంట్",
            icon: AlertTriangle,
            nextRoute: "",
            nextLabel: "Corrective & Preventive Actions"
          };
        case "document-control":
          return {
            title: "Document Control",
            titleTelugu: "డాక్యుమెంట్ కంట్రోల్",
            icon: FileText,
            nextRoute: "",
            nextLabel: "Document Lifecycle Management"
          };
        case "sample-management":
          return {
            title: "Sample Management",
            titleTelugu: "నమూనా నిర్వహణ",
            icon: TestTube,
            nextRoute: "",
            nextLabel: "Sample Tracking & Testing"
          };
        default:
          return {
            title: "Quality Assurance",
            titleTelugu: "నాణ్యత హామీ",
            icon: Shield,
            nextRoute: "",
            nextLabel: "Quality Management"
          };
      }
    }

    // If showing PackagingBranding submodules, show appropriate info
    if (showPackagingBrandingSubmodule) {
      switch (showPackagingBrandingSubmodule) {
        case "brand-compliance":
          return {
            title: "Brand Compliance",
            titleTelugu: "బ్రాండ్ అనుపాలన",
            icon: BadgeCheck,
            nextRoute: "",
            nextLabel: "FSSAI & Regulatory Compliance"
          };
        case "design-studio":
          return {
            title: "Design Studio",
            titleTelugu: "డిజైన్ స్టూడియో",
            icon: Palette,
            nextRoute: "",
            nextLabel: "Professional Design Tools"
          };
        case "label-generator":
          return {
            title: "Label Generator",
            titleTelugu: "లేబుల్ జనరేటర్",
            icon: Tag,
            nextRoute: "",
            nextLabel: "QR Codes & Nutritional Labels"
          };
        case "print-management":
          return {
            title: "Print Management",
            titleTelugu: "ప్రింట్ మేనేజ్‌మెంట్",
            icon: Printer,
            nextRoute: "",
            nextLabel: "Print Queue & Quality Monitoring"
          };
        default:
          return {
            title: "Packaging & Branding",
            titleTelugu: "ప్యాకేజింగ్ & బ్రాండింగ్",
            icon: Package,
            nextRoute: "",
            nextLabel: "Packaging Management"
          };
      }
    }

    // If showing ConsumerDelivery submodules, show appropriate info
    if (showConsumerDeliverySubmodule) {
      switch (showConsumerDeliverySubmodule) {
        case "route-optimization":
          return {
            title: "Route Planning",
            titleTelugu: "రూట్ ప్లానింగ్",
            icon: Route,
            nextRoute: "",
            nextLabel: "AI-Powered Route Optimization"
          };
        case "fleet-management":
          return {
            title: "Fleet Management",
            titleTelugu: "ఫ్లీట్ మేనేజ్‌మెంట్",
            icon: Truck,
            nextRoute: "",
            nextLabel: "Vehicle Tracking & Maintenance"
          };
        case "order-tracking":
          return {
            title: "Order Tracking",
            titleTelugu: "ఆర్డర్ ట్రాకింగ్",
            icon: MapPin,
            nextRoute: "",
            nextLabel: "Real-Time GPS Tracking"
          };
        case "delivery-analytics":
          return {
            title: "Delivery Analytics",
            titleTelugu: "డెలివరీ అనలిటిక్స్",
            icon: BarChart3,
            nextRoute: "",
            nextLabel: "Performance & Cost Analytics"
          };
        default:
          return {
            title: "Consumer Delivery",
            titleTelugu: "వినియోగదారు డెలివరీ",
            icon: Truck,
            nextRoute: "",
            nextLabel: "Delivery Management"
          };
      }
    }

    // If showing ConsumerFeedback submodules, show appropriate info
    if (showConsumerFeedbackSubmodule) {
      switch (showConsumerFeedbackSubmodule) {
        case "customer-analytics":
          return {
            title: "Customer Analytics",
            titleTelugu: "కస్టమర్ అనలిటిక్స్",
            icon: BarChart3,
            nextRoute: "",
            nextLabel: "Behavior Analysis & Insights"
          };
        case "review-management":
          return {
            title: "Review Management",
            titleTelugu: "రివ్యూ మేనేజ్‌మెంట్",
            icon: Star,
            nextRoute: "",
            nextLabel: "Customer Review Analysis & Response"
          };
        case "loyalty-programs":
          return {
            title: "Loyalty Programs",
            titleTelugu: "లాయల్టీ ప్రోగ్రామ్స్",
            icon: Award,
            nextRoute: "",
            nextLabel: "Reward Programs & Tiers"
          };
        case "market-research":
          return {
            title: "Market Research",
            titleTelugu: "మార్కెట్ రిసెర్చ్",
            icon: TrendingUp,
            nextRoute: "",
            nextLabel: "Trend Analysis & Recommendations"
          };
        default:
          return {
            title: "Consumer Feedback",
            titleTelugu: "వినియోగదారు ప్రతిస్పందన",
            icon: Star,
            nextRoute: "",
            nextLabel: "Feedback Management"
          };
      }
    }

    // If a module is selected, use that for page info
    if (selectedModule) {
      switch (selectedModule) {
        case "Land Mapping":
          return {
            title: "Land Mapping",
            titleTelugu: "భూమి మ్యాపింగ్",
            icon: Map,
            nextRoute: "",
            nextLabel: "Module Active"
          };
        case "SoilSense":
          return {
            title: "SoilSense",
            titleTelugu: "మట్టి విశ్లేషణ",
            icon: TestTube,
            nextRoute: "",
            nextLabel: "Module Active"
          };
        case "SeedPlanner":
          return {
            title: "SeedPlanner", 
            titleTelugu: "విత్తన ప్లానింగ్",
            icon: Sprout,
            nextRoute: "",
            nextLabel: "Module Active"
          };
        case "AquaGuide":
          return {
            title: "AquaGuide",
            titleTelugu: "నీటిపారుదల",
            icon: Droplets,
            nextRoute: "",
            nextLabel: "Module Active"
          };
        case "CropShield":
          return {
            title: "CropShield",
            titleTelugu: "పంట రక్షణ",
            icon: Shield,
            nextRoute: "",
            nextLabel: "Module Active"
          };
        case "NutriDose":
          return {
            title: "NutriDose",
            titleTelugu: "పోషకాలు",
            icon: Beaker,
            nextRoute: "",
            nextLabel: "Module Active"
          };
        case "HarvestBot":
          return {
            title: "HarvestBot",
            titleTelugu: "కోత యంత్రం",
            icon: Tractor,
            nextRoute: "",
            nextLabel: "Module Active"
          };
        case "StorageGuard":
          return {
            title: "StorageGuard",
            titleTelugu: "నిల్వ రక్షణ",
            icon: Building,
            nextRoute: "",
            nextLabel: "Module Active"
          };
        case "MarketConnect":
          return {
            title: "MarketConnect",
            titleTelugu: "మార్కెట్ కనెక్ట్",
            icon: ShoppingCart,
            nextRoute: "",
            nextLabel: "Module Active"
          };
        case "Processing Hub":
          return {
            title: "Processing Hub",
            titleTelugu: "ప్రాసెసింగ్ హబ్",
            icon: Package,
            nextRoute: "",
            nextLabel: "Module Active"
          };
        case "Quality Assurance":
          return {
            title: "Quality Assurance",
            titleTelugu: "నాణ్యత హామీ",
            icon: Award,
            nextRoute: "",
            nextLabel: "Module Active"
          };
        case "Packaging & Branding":
          return {
            title: "Packaging & Branding",
            titleTelugu: "ప్యాకేజింగ్",
            icon: Package,
            nextRoute: "",
            nextLabel: "Module Active"
          };
        case "Consumer Delivery":
          return {
            title: "Consumer Delivery",
            titleTelugu: "డెలివరీ",
            icon: Truck,
            nextRoute: "",
            nextLabel: "Module Active"
          };
        case "Consumer Feedback":
          return {
            title: "Consumer Feedback",
            titleTelugu: "ప్రతిస్పందన",
            icon: Star,
            nextRoute: "",
            nextLabel: "Module Active"
          };
        default:
          return {
            title: selectedModule,
            titleTelugu: selectedModule,
            icon: Map,
            nextRoute: "",
            nextLabel: "Module Active"
          };
      }
    }
    
    // Fallback to route-based logic
    switch (pathname) {
      case '/farmer/landmapping':
        return {
          title: "Land Mapping",
          titleTelugu: "భూమి మ్యాపింగ్",
          icon: Map,
          nextRoute: "/farmer/soil-sense",
          nextLabel: "Next: SoilSense"
        };
      case '/farmer/landmapping/land-onboarding':
        return {
          title: "Land Registration",
          titleTelugu: "భూమి రిజిస్ట్రేషన్",
          icon: Map,
          nextRoute: "/farmer/landmapping",
          nextLabel: "Back: Land Mapping"
        };
      // Add other routes here
      default:
        return {
          title: "AgriHub Dashboard",
          titleTelugu: "అగ్రిహబ్ డాష్‌బోర్డ్",
          icon: Map,
          nextRoute: "/farmer/landmapping",
          nextLabel: "Start: Land Mapping"
        };
    }
  };

  const pageInfo = getCurrentPageInfo();

  return (
    <ProtectedRoute requiredRole={["farmer", "landowner"]}>
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background/95 to-muted/20">
      {/* Sidebar - Fixed positioning */}
      <AgriAgentsSidebar 
        onCollapsedChange={setSidebarCollapsed} 
        onModuleSelect={handleModuleSelect}
        selectedModule={selectedModule}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Global Topbar */}
        <Topbar
          notifications={notifications}
          onLogout={handleLogout}
        />
        
        {/* Navigation Header */}
        <header className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-10">
          <div className="px-0 py-0">
            <PageHeader 
              title={pageInfo.title}
              titleTelugu={pageInfo.titleTelugu}
              icon={pageInfo.icon}
              currentModule={selectedModule}
              onModuleNavigate={handleModuleSelect}
              onAgriSaarathiClick={handleAgriSaarathiClick}
              nextButton={pageInfo.nextRoute ? {
                label: pageInfo.nextLabel,
                route: pageInfo.nextRoute
              } : undefined}
            />
          </div>
        </header>
        
        {/* Main Content Area - Removed all padding */}
        <main className="flex-1 overflow-auto">
          <div className="h-full w-full">
            
              {/* Dynamic Content Based on Selected Module */}
              {(() => {
                // If showing AgriSaarathi, prioritize that
                if (showAgriSaarathi) {
                  return (
                    <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                      <AgriSaarathi />
                    </div>
                  );
                }

                // If showing land onboarding, prioritize that
                if (showLandOnboarding) {
                  return (
                    <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                      <LandOnboarding onBackToMapping={handleBackToLandMapping} />
                    </div>
                  );
                }

                // If showing leasing management, prioritize that
                if (showLeasingManagement) {
                  return (
                    <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                      <LeasingManagement />
                    </div>
                  );
                }

                // If showing SoilSense submodules, prioritize that
                if (showSoilSenseSubmodule) {
                  switch (showSoilSenseSubmodule) {
                    case "test-request":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <TestRequest onBackToSoilSense={handleBackToSoilSense} />
                        </div>
                      );
                    case "drone-schedule":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <DroneSchedule onBackToSoilSense={handleBackToSoilSense} />
                        </div>
                      );
                    case "health-card":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <SoilHealthCard onBackToSoilSense={handleBackToSoilSense} />
                        </div>
                      );
                    case "lab-integration":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <LabIntegration onBackToSoilSense={handleBackToSoilSense} />
                        </div>
                      );
                    default:
                      return null;
                  }
                }

                // If showing AquaGuide submodules, prioritize that
                if (showAquaGuideSubmodule) {
                  switch (showAquaGuideSubmodule) {
                    case "irrigation-scheduling":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <IrrigationScheduling onBackToAquaGuide={handleBackToAquaGuide} />
                        </div>
                      );
                    case "equipment-integration":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <EquipmentIntegration onBackToAquaGuide={handleBackToAquaGuide} />
                        </div>
                      );
                    case "alerts-reminders":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <AlertsReminders onBackToAquaGuide={handleBackToAquaGuide} />
                        </div>
                      );
                    case "compliance-logs":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <ComplianceLogs onBackToAquaGuide={handleBackToAquaGuide} />
                        </div>
                      );
                    default:
                      return null;
                  }
                }

                // If showing ProcessingHub submodules, prioritize that
                if (showProcessingHubSubmodule) {
                  switch (showProcessingHubSubmodule) {
                    case "batch-tracking":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <BatchTracking onBackToProcessingHub={handleBackToProcessingHub} />
                        </div>
                      );
                    case "production-planning":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <ProductionPlanning onBackToProcessingHub={handleBackToProcessingHub} />
                        </div>
                      );
                    case "equipment-management":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <EquipmentManagement onBackToProcessingHub={handleBackToProcessingHub} />
                        </div>
                      );
                    default:
                      return null;
                  }
                }

                // If showing QualityAssurance submodules, prioritize that
                if (showQualityAssuranceSubmodule) {
                  switch (showQualityAssuranceSubmodule) {
                    case "audit-management":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <AuditManagement onBackToQualityAssurance={handleBackToQualityAssurance} />
                        </div>
                      );
                    case "capa-management":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <CAPAManagement onBackToQualityAssurance={handleBackToQualityAssurance} />
                        </div>
                      );
                    case "document-control":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <DocumentControl onBackToQualityAssurance={handleBackToQualityAssurance} />
                        </div>
                      );
                    case "sample-management":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <SampleManagement onNavigateBack={handleBackToQualityAssurance} />
                        </div>
                      );
                    default:
                      return null;
                  }
                }

                // If showing PackagingBranding submodules, prioritize that
                if (showPackagingBrandingSubmodule) {
                  switch (showPackagingBrandingSubmodule) {
                    case "brand-compliance":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <BrandCompliance onNavigateBack={handleBackToPackagingBranding} />
                        </div>
                      );
                    case "design-studio":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <DesignStudio onNavigateBack={handleBackToPackagingBranding} />
                        </div>
                      );
                    case "label-generator":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <LabelGenerator onNavigateBack={handleBackToPackagingBranding} />
                        </div>
                      );
                    case "print-management":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <PrintManagement onNavigateBack={handleBackToPackagingBranding} />
                        </div>
                      );
                    default:
                      return null;
                  }
                }

                // If showing ConsumerDelivery submodules, prioritize that
                if (showConsumerDeliverySubmodule) {
                  switch (showConsumerDeliverySubmodule) {
                    case "route-optimization":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <RouteOptimization onNavigateBack={handleBackToConsumerDelivery} />
                        </div>
                      );
                    case "fleet-management":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <FleetManagement onNavigateBack={handleBackToConsumerDelivery} />
                        </div>
                      );
                    case "order-tracking":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <OrderTracking onNavigateBack={handleBackToConsumerDelivery} />
                        </div>
                      );
                    case "delivery-analytics":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <DeliveryAnalytics onNavigateBack={handleBackToConsumerDelivery} />
                        </div>
                      );
                    default:
                      return null;
                  }
                }

                // If showing ConsumerFeedback submodules, prioritize that
                if (showConsumerFeedbackSubmodule) {
                  switch (showConsumerFeedbackSubmodule) {
                    case "customer-analytics":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <CustomerAnalytics _onNavigateBack={handleBackToConsumerFeedback} />
                        </div>
                      );
                    case "review-management":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <ReviewManagement _onNavigateBack={handleBackToConsumerFeedback} />
                        </div>
                      );
                    case "loyalty-programs":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <LoyaltyPrograms _onNavigateBack={handleBackToConsumerFeedback} />
                        </div>
                      );
                    case "market-research":
                      return (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                          <MarketResearch _onNavigateBack={handleBackToConsumerFeedback} />
                        </div>
                      );
                    default:
                      return null;
                  }
                }

                // If a module is selected from sidebar, show that content
                if (selectedModule) {
                  switch(selectedModule) {
                    case "Land Mapping":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <LandMapping 
                            onLandRegistrationClick={handleLandRegistrationClick}
                            onLeasingManagementClick={handleLeasingManagementClick}
                          />
                        </div>
                      );
                    case "SoilSense":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <SoilSense 
                            onTestRequestClick={handleTestRequestClick}
                            onDroneScheduleClick={handleDroneScheduleClick}
                            onHealthCardClick={handleHealthCardClick}
                            onLabIntegrationClick={handleLabIntegrationClick}
                          />
                        </div>
                      );
                    case "SeedPlanner":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <SeedPlanner 
                            onCropPlanningClick={() => {
                              console.log('🌾 Navigating to Crop Planning');
                              setSelectedModule("CropPlanning");
                            }}
                            onProcurementClick={() => {
                              console.log('🛒 Navigating to Procurement');
                              setSelectedModule("Procurement");
                            }}
                            onSowingGuideClick={() => {
                              console.log('🌱 Navigating to Sowing Guide');
                              setSelectedModule("SowingGuide");
                            }}
                            onAquaGuideClick={() => {
                              console.log('💧 Navigating to Aqua Guide');
                              setSelectedModule("AquaGuide");
                            }}
                          />
                        </div>
                      );
                    case "AquaGuide":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <AquaGuide 
                            onSchedulingClick={() => {
                              console.log('📅 AquaGuide: Navigating to Irrigation Scheduling');
                              handleIrrigationSchedulingClick();
                            }}
                            onEquipmentClick={() => {
                              console.log('⚙️ AquaGuide: Navigating to Equipment Integration');
                              handleEquipmentIntegrationClick();
                            }}
                            onAlertsClick={() => {
                              console.log('🔔 AquaGuide: Navigating to Alerts & Reminders');
                              handleAlertsRemindersClick();
                            }}
                            onComplianceClick={() => {
                              console.log('📋 AquaGuide: Navigating to Compliance Logs');
                              handleComplianceLogsClick();
                            }}
                          />
                        </div>
                      );
                    case "CropPlanning":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <CropPlanning />
                        </div>
                      );
                    case "Procurement":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <ProcurementManager />
                        </div>
                      );
                    case "SowingGuide":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <SowingGuide />
                        </div>
                      );
                    case "CropShield":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <CropShield />
                        </div>
                      );
                    case "NutriDose":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <NutriDose />
                        </div>
                      );
                    case "HarvestBot":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <HarvestBot />
                        </div>
                      );
                    case "StorageGuard":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <StorageGuard />
                        </div>
                      );
                    case "MarketConnect":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <MarketConnect />
                        </div>
                      );
                    case "Processing Hub":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <ProcessingHub 
                            onBatchTrackingClick={handleBatchTrackingClick}
                            onProductionPlanningClick={handleProductionPlanningClick}
                            onEquipmentManagementClick={handleEquipmentManagementClick}
                          />
                        </div>
                      );
                    case "Quality Assurance":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <QualityAssurance 
                            onAuditManagementClick={handleAuditManagementClick}
                            onCAPAManagementClick={handleCAPAManagementClick}
                            onDocumentControlClick={handleDocumentControlClick}
                            onSampleManagementClick={handleSampleManagementClick}
                          />
                        </div>
                      );
                    case "Packaging & Branding":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <PackagingBranding 
                            onBrandComplianceClick={handleBrandComplianceClick}
                            onDesignStudioClick={handleDesignStudioClick}
                            onLabelGeneratorClick={handleLabelGeneratorClick}
                            onPrintManagementClick={handlePrintManagementClick}
                          />
                        </div>
                      );
                    case "Consumer Delivery":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <ConsumerDelivery 
                            onRouteOptimizationClick={handleRouteOptimizationClick}
                            onFleetManagementClick={handleFleetManagementClick}
                            onOrderTrackingClick={handleOrderTrackingClick}
                            onDeliveryAnalyticsClick={handleDeliveryAnalyticsClick}
                          />
                        </div>
                      );
                    case "Consumer Feedback":
                      return (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                          <ConsumerFeedback 
                            onCustomerAnalyticsClick={handleCustomerAnalyticsClick}
                            onReviewManagementClick={handleReviewManagementClick}
                            onLoyaltyProgramsClick={handleLoyaltyProgramsClick}
                            onMarketResearchClick={handleMarketResearchClick}
                          />
                        </div>
                      );
                    default:
                      return (
                        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300 h-full">
                          <div className="text-center py-20">
                            <h3 className="text-2xl font-semibold mb-4">{selectedModule}</h3>
                            <p className="text-muted-foreground">Module content will be displayed here</p>
                          </div>
                        </div>
                      );
                  }
                }
                
                // Fallback to route-based content display
                switch(pathname) {
                  case '/farmer/landmapping':
                    return (
                      <div className="animate-in slide-in-from-bottom-4 duration-300 h-full">
                        <LandMapping 
                          onLandRegistrationClick={handleLandRegistrationClick}
                          onLeasingManagementClick={handleLeasingManagementClick}
                        />
                      </div>
                    );
                  case '/farmer/landmapping/land-onboarding':
                    return (
                      <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                        <LandOnboarding onBackToMapping={handleBackToLandMapping} />
                      </div>
                    );
                  default:
                    return (
                      <div className="flex items-center justify-center min-h-[400px] animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-6">
                          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 via-emerald-500 to-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse">
                            <Map className="w-10 h-10 text-white" />
                          </div>
                          <div className="space-y-3">
                            <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                              Welcome to AgriHub Dashboard
                            </h3>
                            <p className="text-xl text-muted-foreground font-medium">అగ్రిహబ్ డాష్‌బోర్డ్‌కు స్వాగతం</p>
                            <p className="text-muted-foreground">Select a module from the sidebar to get started</p>
                          </div>
                        </div>
                      </div>
                    );
                }
              })()}
            </div>
          
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}
