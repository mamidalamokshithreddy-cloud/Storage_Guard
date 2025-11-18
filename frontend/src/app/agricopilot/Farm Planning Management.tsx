import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  BarChart3, 
  TrendingUp, 
  Target, 
  Activity, 
  Users,
  Sprout,
  CheckCircle,
  X,
  Bell,
  Leaf,
  Package,
  Zap,
  Bug,
  TestTube,
  Droplets,
  FileText
} from 'lucide-react';

const FarmPlanningManagement = () => {
  const [activeTab, setActiveTab] = useState('scheduling');
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  const [showSchedulingCard, setShowSchedulingCard] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showAnalyticsTable, setShowAnalyticsTable] = useState(false);
  const [schedulingTab, setSchedulingTab] = useState('scheduling');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Activity modals from Activity Hub
  const [showPestModal, setShowPestModal] = useState(false);
  const [showIrrigationModal, setShowIrrigationModal] = useState(false);
  const [showNutrientModal, setShowNutrientModal] = useState(false);
  const [showSoilTestModal, setShowSoilTestModal] = useState(false);
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);
  
  // Daily Report form state
  const [dailyReportDescription, setDailyReportDescription] = useState('');
  const [dailyReportFile, setDailyReportFile] = useState<File | null>(null);
  
  // State for detailed activity view
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showActivityDetail, setShowActivityDetail] = useState(false);
  
  // State for farmer requests
  const [showFarmerRequests, setShowFarmerRequests] = useState(false);
  const [farmerRequests, setFarmerRequests] = useState<any[]>([]);

  // Effect to manage body scroll when modals are open
  useEffect(() => {
    const isAnyModalOpen = showTrackingModal || showBillingModal || showPerformanceModal || 
                          showPestModal || showIrrigationModal || showNutrientModal || showSoilTestModal ||
                          showActivityDetail || showDailyReportModal;
    
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showTrackingModal, showBillingModal, showPerformanceModal, 
      showPestModal, showIrrigationModal, showNutrientModal, showSoilTestModal, showActivityDetail, showDailyReportModal]);
  
  // Farm Planning specific notifications
  const planningNotifications = [
    // Seasonal planning alerts
    { id: 1, type: 'planning', message: 'Rabi season planning completed for 15 farmers - Wheat and mustard crops scheduled', time: '30 minutes ago', category: 'seasonal', read: false },
    { id: 2, type: 'planning', message: 'Crop rotation plan approved for Rajesh Kumar - Rice to wheat transition', time: '1 hour ago', category: 'rotation', read: false },
    { id: 3, type: 'planning', message: 'Water management schedule updated for 8 farms - Drip irrigation optimized', time: '2 hours ago', category: 'irrigation', read: false },
    
    // Resource management
    { id: 4, type: 'resource', message: 'Fertilizer inventory low - NPK shortage expected next week for 5 farms', time: '3 hours ago', category: 'inventory', read: false },
    { id: 5, type: 'resource', message: 'Seed procurement completed - High-yield variety seeds delivered', time: '4 hours ago', category: 'procurement', read: true },
    { id: 6, type: 'resource', message: 'Machinery scheduling conflict resolved - Tractor availability updated', time: '5 hours ago', category: 'machinery', read: false },
    
    // Weather and environment
    { id: 7, type: 'weather', message: 'Heavy rainfall alert - Adjust field operations for next 3 days', time: '6 hours ago', category: 'alert', read: false },
    { id: 8, type: 'weather', message: 'Optimal planting conditions detected - Window for sowing opens tomorrow', time: '8 hours ago', category: 'opportunity', read: true },
    { id: 9, type: 'environment', message: 'Soil moisture levels optimal in 12 fields - Ready for transplanting', time: '10 hours ago', category: 'monitoring', read: false },
    
    // Budget and financial planning
    { id: 10, type: 'finance', message: 'Budget allocation approved for Kharif season - ₹2.5L sanctioned', time: '12 hours ago', category: 'budget', read: false },
    { id: 11, type: 'finance', message: 'Cost analysis completed - 15% reduction in input costs achieved', time: '1 day ago', category: 'analysis', read: true },
    { id: 12, type: 'finance', message: 'Subsidy application submitted for 8 farmers - Processing in progress', time: '1 day ago', category: 'subsidy', read: false },
    
    // Performance and analytics
    { id: 13, type: 'performance', message: 'Yield prediction updated - 20% increase expected for wheat crop', time: '1 day ago', category: 'prediction', read: false },
    { id: 14, type: 'performance', message: 'Monthly planning review completed - 92% target achievement', time: '2 days ago', category: 'review', read: true },
    { id: 15, type: 'planning', message: 'Land preparation schedule optimized - 25% time reduction achieved', time: '2 days ago', category: 'optimization', read: false }
  ];
  
  const unreadCount = planningNotifications.filter(n => !n.read).length;
  
  const handleNotificationClick = (notification: any) => {
    console.log('Planning notification clicked:', notification);
    setShowNotifications(false);
  };
  
  const markAllAsRead = () => {
    console.log('Mark all planning notifications as read');
  };

  // Real-time data update function
  const getCurrentDate = () => {
    return new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  // Update data every minute to simulate real-time updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Initialize farmer requests
  React.useEffect(() => {
    setFarmerRequests(initialFarmerRequests);
  }, []);

  const seasonCrops = [
    { 
      id: 1, 
      name: 'Wheat', 
      season: 'Rabi', 
      duration: '120 days', 
      status: 'Active', 
      progress: 65,
      plantingDate: '2024-11-15',
      expectedHarvest: '2025-03-15',
      lastActivity: '2024-12-20',
      nextScheduled: '2024-12-28',
      pastActivities: [
        { date: '2024-11-15', activity: 'Land Preparation', status: 'Completed', scheduledTime: '2024-11-15 06:00', completedTime: '2024-11-15 14:30', details: 'Tractor plowing and soil preparation completed. Used John Deere 5050 tractor for 8 hours. Soil condition was optimal with proper moisture content.' },
        { date: '2024-11-20', activity: 'Seeding', status: 'Completed', scheduledTime: '2024-11-20 07:00', completedTime: '2024-11-20 11:30', details: 'Premium wheat seeds planted using precision seed drill. Seed rate: 125 kg/hectare. Spacing maintained at 20cm rows. Weather conditions were favorable.' },
        { date: '2024-12-01', activity: 'First Fertilization', status: 'Completed', scheduledTime: '2024-12-01 08:00', completedTime: '2024-12-01 12:00', details: 'Applied NPK 20-20-20 fertilizer (100kg) and DAP (75kg). Used fertilizer spreader for uniform distribution. Soil moisture was at optimal level for nutrient absorption.' },
        { date: '2024-12-20', activity: 'Irrigation & Weed Control', status: 'Completed', scheduledTime: '2024-12-20 06:30', completedTime: '2024-12-20 15:45', details: 'Drip irrigation for 3.5 hours followed by manual weed removal. Applied herbicide in problem areas. Crop health assessment showed excellent growth with 95% germination rate.' }
      ],
      upcomingActivities: [
        { date: '2024-12-28', activity: 'Second Fertilization', status: 'Scheduled' },
        { date: '2025-01-10', activity: 'Pest Control Spray', status: 'Planned' },
        { date: '2025-02-15', activity: 'Pre-Harvest Assessment', status: 'Planned' },
        { date: '2025-03-15', activity: 'Harvesting', status: 'Planned' }
      ]
    },
    { 
      id: 2, 
      name: 'Rice', 
      season: 'Kharif', 
      duration: '150 days', 
      status: 'Planned', 
      progress: 0,
      plantingDate: '2025-06-15',
      expectedHarvest: '2025-11-15',
      lastActivity: null,
      nextScheduled: '2025-05-01',
      pastActivities: [],
      upcomingActivities: [
        { date: '2025-05-01', activity: 'Land Preparation', status: 'Planned' },
        { date: '2025-05-15', activity: 'Water Management Setup', status: 'Planned' },
        { date: '2025-06-01', activity: 'Nursery Preparation', status: 'Planned' },
        { date: '2025-06-15', activity: 'Transplanting', status: 'Planned' }
      ]
    },
    { 
      id: 3, 
      name: 'Maize', 
      season: 'Zaid', 
      duration: '90 days', 
      status: 'Harvested', 
      progress: 100,
      plantingDate: '2024-03-01',
      expectedHarvest: '2024-06-01',
      lastActivity: '2024-06-01',
      nextScheduled: null,
      pastActivities: [
        { date: '2024-02-15', activity: 'Land Preparation', status: 'Completed', scheduledTime: '2024-02-15 06:00', completedTime: '2024-02-15 13:00', details: 'Deep plowing and leveling completed. Soil analysis showed good fertility levels. Applied organic compost (2 tons/hectare) for soil enrichment.' },
        { date: '2024-03-01', activity: 'Seeding', status: 'Completed', scheduledTime: '2024-03-01 07:30', completedTime: '2024-03-01 10:15', details: 'Hybrid maize seeds planted with 60cm row spacing. Seed rate: 25 kg/hectare. Used pneumatic planter for precision placement.' },
        { date: '2024-03-20', activity: 'First Fertilization', status: 'Completed', scheduledTime: '2024-03-20 08:00', completedTime: '2024-03-20 11:30', details: 'Applied starter fertilizer NPK 12-32-16 (80kg). Side-dressed with urea (50kg) for nitrogen boost. Soil moisture was adequate.' },
        { date: '2024-04-15', activity: 'Pest Control', status: 'Completed', scheduledTime: '2024-04-15 06:00', completedTime: '2024-04-15 09:00', details: 'Applied insecticide for fall armyworm control. Used Lambda Cyhalothrin (300ml). No significant pest damage observed.' },
        { date: '2024-05-10', activity: 'Second Fertilization', status: 'Completed', scheduledTime: '2024-05-10 07:00', completedTime: '2024-05-10 10:00', details: 'Top-dressed with potash fertilizer (60kg) during tasseling stage. Crop showed excellent vigor with uniform growth.' },
        { date: '2024-06-01', activity: 'Harvesting', status: 'Completed', scheduledTime: '2024-06-01 05:30', completedTime: '2024-06-01 17:00', details: 'Combine harvesting completed. Yield: 8.5 tons/hectare. Grain moisture: 14%. Quality grade: A1. Storage in controlled environment.' }
      ],
      upcomingActivities: []
    },
    { 
      id: 4, 
      name: 'Tomato', 
      season: 'Summer', 
      duration: '80 days', 
      status: 'Active', 
      progress: 45,
      plantingDate: '2024-10-01',
      expectedHarvest: '2024-12-20',
      lastActivity: '2024-11-15',
      nextScheduled: '2024-12-01',
      pastActivities: [
        { date: '2024-09-20', activity: 'Land Preparation & Bed Making', status: 'Completed', scheduledTime: '2024-09-20 06:30', completedTime: '2024-09-20 16:00', details: 'Raised bed preparation with drip irrigation setup. Bed height: 15cm, width: 1.2m. Applied farmyard manure (3 tons/hectare).' },
        { date: '2024-10-01', activity: 'Transplanting', status: 'Completed', scheduledTime: '2024-10-01 07:00', completedTime: '2024-10-01 12:30', details: '30-day old tomato seedlings transplanted. Plant spacing: 60cm x 45cm. Used certified hybrid variety with high disease resistance.' },
        { date: '2024-10-15', activity: 'Support Structure Setup', status: 'Completed', scheduledTime: '2024-10-15 08:00', completedTime: '2024-10-15 14:00', details: 'Bamboo stakes installed for plant support. Height: 1.8m. Training strings attached for vertical growth guidance.' },
        { date: '2024-11-01', activity: 'First Pruning', status: 'Completed', scheduledTime: '2024-11-01 07:30', completedTime: '2024-11-01 11:00', details: 'Removed lower leaves and suckers. Maintained single stem growth. Applied growth promoter for better fruit setting.' },
        { date: '2024-11-15', activity: 'Fungicide Application', status: 'Completed', scheduledTime: '2024-11-15 06:00', completedTime: '2024-11-15 09:30', details: 'Preventive fungicide spray using Copper Oxychloride (2kg). Protected against early and late blight diseases.' }
      ],
      upcomingActivities: [
        { date: '2024-12-01', activity: 'Fruit Harvesting (1st Pick)', status: 'Scheduled' },
        { date: '2024-12-08', activity: 'Fruit Harvesting (2nd Pick)', status: 'Planned' },
        { date: '2024-12-15', activity: 'Final Harvesting', status: 'Planned' },
        { date: '2024-12-20', activity: 'Field Cleanup', status: 'Planned' }
      ]
    },
  ];

  const detailedBills = [
    { 
      id: 1, 
      cropName: 'Wheat', 
      item: 'Seeds & Fertilizers', 
      amount: 15000, 
      date: '2024-01-15', 
      paymentDate: '2024-01-18',
      status: 'Paid',
      vendorBusinessName: 'AgriMart Solutions Pvt Ltd',
      vendorContact: '+91-9876543210',
      // Specialized vendors for different services
      fertilizerVendor: {
        name: 'FertilMax Nutrients Ltd',
        contact: '+91-9876543201'
      },
      machineVendor: {
        name: 'PowerTech Equipment Rentals',
        contact: '+91-9876543202'
      },
      pesticideVendor: {
        name: 'CropGuard Protection Co.',
        contact: '+91-9876543203'
      },
      equipment: ['John Deere 5050 Tractor', 'Lemken Seed Drill', 'Amazone Fertilizer Spreader'],
      process: 'Land preparation → Seeding → Fertilizer application → Initial irrigation',
      details: 'Premium wheat seeds (50kg) + NPK fertilizers for 5 acres',
      fertilizers: [
        { name: 'NPK 20-20-20', quantity: '100kg', purpose: 'Base fertilizer for soil preparation', cost: 4500 },
        { name: 'Urea 46%', quantity: '50kg', purpose: 'Nitrogen boost during growth', cost: 2000 },
        { name: 'DAP (Diammonium Phosphate)', quantity: '75kg', purpose: 'Phosphorus for root development', cost: 3000 }
      ],
      machines: [
        { name: 'Tractor (75HP)', hours: '8 hours', purpose: 'Land plowing and cultivation', rate: 800 },
        { name: 'Seed Drill', hours: '4 hours', purpose: 'Precision seed placement', rate: 600 },
        { name: 'Rotavator', hours: '3 hours', purpose: 'Soil mixing and preparation', rate: 450 }
      ],
      pesticides: [
        { name: 'Chlorpyrifos 20%', quantity: '2L', purpose: 'Termite and soil pest control', cost: 800 },
        { name: 'Mancozeb 75%', quantity: '1kg', purpose: 'Fungal disease prevention', cost: 450 }
      ]
    },
    { 
      id: 2, 
      cropName: 'Rice', 
      item: 'Irrigation Services', 
      amount: 8500, 
      date: '2024-01-20', 
      paymentDate: null,
      status: 'Pending',
      vendorBusinessName: 'HydroFlow Irrigation Systems',
      vendorContact: '+91-8765432109',
      // Specialized vendors for different services
      fertilizerVendor: {
        name: 'GreenGrow Fertilizers Inc',
        contact: '+91-8765432101'
      },
      machineVendor: {
        name: 'AquaTech Machinery Co.',
        contact: '+91-8765432102'
      },
      pesticideVendor: {
        name: 'RiceShield Protection Ltd',
        contact: '+91-8765432103'
      },
      equipment: ['Submersible Pump 5HP', 'Drip Irrigation System', 'Water Flow Meters'],
      process: 'Water source setup → Pump installation → Drip line laying → System testing',
      details: 'Automated drip irrigation system installation for rice field (3 acres)',
      fertilizers: [
        { name: 'Rice Starter NPK 12-32-16', quantity: '80kg', purpose: 'Initial growth support', cost: 3200 }
      ],
      machines: [
        { name: 'Water Pump (5HP)', hours: 'Installation', purpose: 'Water supply system setup', rate: 2500 },
        { name: 'Pipe Laying Equipment', hours: '6 hours', purpose: 'Drip line installation', rate: 1200 }
      ],
      pesticides: [
        { name: 'Cartap Hydrochloride', quantity: '500g', purpose: 'Stem borer control', cost: 650 },
        { name: 'Tricyclazole', quantity: '200g', purpose: 'Blast disease prevention', cost: 580 }
      ]
    },
    { 
      id: 3, 
      cropName: 'Maize', 
      item: 'Equipment Rental', 
      amount: 12000, 
      date: '2024-01-25', 
      paymentDate: null,
      status: 'Due',
      vendorBusinessName: 'MegaHarvest Equipment Rentals',
      vendorContact: '+91-7654321098',
      // Specialized vendors for different services
      fertilizerVendor: {
        name: 'CornMax Nutrition Supplies',
        contact: '+91-7654321091'
      },
      machineVendor: {
        name: 'HarvestKing Machinery Ltd',
        contact: '+91-7654321092'
      },
      pesticideVendor: {
        name: 'MaizeGuard Chemical Co.',
        contact: '+91-7654321093'
      },
      equipment: ['Case Combine Harvester', 'Tata Transport Vehicle', 'Storage Silos'],
      process: 'Crop assessment → Harvesting → Transportation → Storage preparation',
      details: 'Combine harvester rental for 3 days + transportation to storage facility',
      fertilizers: [
        { name: 'Potash (MOP)', quantity: '60kg', purpose: 'Final stage nutrition', cost: 2400 }
      ],
      machines: [
        { name: 'Combine Harvester', hours: '24 hours', purpose: 'Crop harvesting and threshing', rate: 8000 },
        { name: 'Transport Truck', hours: '12 hours', purpose: 'Grain transportation', rate: 1800 }
      ],
      pesticides: [
        { name: 'Atrazine 50%', quantity: '1.5L', purpose: 'Weed control pre-harvest', cost: 420 },
        { name: 'Lambda Cyhalothrin', quantity: '300ml', purpose: 'Fall armyworm control', cost: 680 }
      ]
    },
    { 
      id: 4, 
      cropName: 'Tomato', 
      item: 'Pesticides & Protection', 
      amount: 6500, 
      date: '2024-02-01', 
      paymentDate: '2024-02-01',
      status: 'Paid',
      vendorBusinessName: 'GreenGuard Crop Protection Ltd',
      vendorContact: '+91-6543210987',
      // Specialized vendors for different services
      fertilizerVendor: {
        name: 'TomatoMax Nutrients Co.',
        contact: '+91-6543210981'
      },
      machineVendor: {
        name: 'SprayTech Equipment Ltd',
        contact: '+91-6543210982'
      },
      pesticideVendor: {
        name: 'BioShield Organic Protection',
        contact: '+91-6543210983'
      },
      equipment: ['Honda Power Sprayer', 'Safety Gear Set', 'Chemical Mixing Tank'],
      process: 'Pest identification → Chemical selection → Mixing → Spraying → Monitoring',
      details: 'Organic pesticides and fungicides for tomato crop protection (2 acres)',
      fertilizers: [
        { name: 'Calcium Nitrate', quantity: '25kg', purpose: 'Calcium deficiency prevention', cost: 1500 },
        { name: 'Micronutrient Mix', quantity: '10kg', purpose: 'Trace element supplement', cost: 800 }
      ],
      machines: [
        { name: 'Power Sprayer', hours: '8 hours', purpose: 'Pesticide application', rate: 400 },
        { name: 'Knapsack Sprayer', hours: '4 hours', purpose: 'Targeted spot treatment', rate: 200 }
      ],
      pesticides: [
        { name: 'Imidacloprid 17.8%', quantity: '500ml', purpose: 'Whitefly and aphid control', cost: 850 },
        { name: 'Copper Oxychloride 50%', quantity: '2kg', purpose: 'Bacterial blight prevention', cost: 600 },
        { name: 'Azoxystrobin 23%', quantity: '300ml', purpose: 'Early and late blight control', cost: 950 },
        { name: 'Spinosad 45%', quantity: '200ml', purpose: 'Fruit borer management', cost: 720 }
      ]
    },
  ];

  // Labs data by district, village, and town
  const labsData = {
    "Pune": {
      "Hadapsar": {
        labs: [
          { id: 1, name: "AgriTech Lab Center", type: "Soil Testing", services: ["pH Testing", "Nutrient Analysis", "Pest Detection"], contact: "+91-9876543210" },
          { id: 2, name: "Green Valley Lab", type: "Crop Analysis", services: ["Disease Diagnosis", "Quality Testing", "Seed Testing"], contact: "+91-9876543211" }
        ]
      },
      "Kothrud": {
        labs: [
          { id: 3, name: "Modern Agri Lab", type: "Comprehensive", services: ["Soil Testing", "Water Analysis", "Crop Health"], contact: "+91-9876543212" },
          { id: 4, name: "Precision Agri Center", type: "Advanced Testing", services: ["Drone Imaging", "IoT Monitoring", "AI Analysis"], contact: "+91-9876543213" }
        ]
      }
    },
    "Mumbai": {
      "Andheri": {
        labs: [
          { id: 5, name: "Metro Agri Lab", type: "Urban Farming", services: ["Hydroponic Testing", "Indoor Crop Analysis"], contact: "+91-9876543214" },
          { id: 6, name: "Coastal Agriculture Center", type: "Specialty Testing", services: ["Salinity Testing", "Climate Analysis"], contact: "+91-9876543215" }
        ]
      }
    }
  };

  // Performance history data for farmers - Updated to 4-month crop cycles
  const performanceHistory = [
    { month: 'Jan-Apr 2024', yield: 8.5, efficiency: 88, crops: 'Wheat (Winter Crop)' },
    { month: 'Apr-Jul 2024', yield: 9.0, efficiency: 92, crops: 'Rice (Summer Crop)' },
    { month: 'Jul-Oct 2024', yield: 8.8, efficiency: 90, crops: 'Cotton (Monsoon Crop)' },
  ];

  // 6 months history data for farmers
  const farmerHistory = {
    1: [
      { month: 'Apr 2024', crop: 'Wheat', yield: '8.5T', revenue: '₹1.2L', weather: 'Good' },
      { month: 'May 2024', crop: 'Wheat', yield: '8.2T', revenue: '₹1.1L', weather: 'Dry' },
      { month: 'Jun 2024', crop: 'Rice', yield: '9.0T', revenue: '₹1.4L', weather: 'Monsoon' },
      { month: 'Jul 2024', crop: 'Rice', yield: '8.8T', revenue: '₹1.3L', weather: 'Heavy Rain' },
      { month: 'Aug 2024', crop: 'Rice', yield: '9.2T', revenue: '₹1.5L', weather: 'Moderate' },
      { month: 'Sep 2024', crop: 'Rice', yield: '8.6T', revenue: '₹1.2L', weather: 'Good' }
    ],
    2: [
      { month: 'Apr 2024', crop: 'Cotton', yield: '7.5T', revenue: '₹2.2L', weather: 'Hot' },
      { month: 'May 2024', crop: 'Cotton', yield: '8.0T', revenue: '₹2.4L', weather: 'Very Hot' },
      { month: 'Jun 2024', crop: 'Cotton', yield: '8.5T', revenue: '₹2.6L', weather: 'Humid' },
      { month: 'Jul 2024', crop: 'Sugarcane', yield: '12.0T', revenue: '₹1.8L', weather: 'Wet' },
      { month: 'Aug 2024', crop: 'Sugarcane', yield: '11.5T', revenue: '₹1.7L', weather: 'Moderate' },
      { month: 'Sep 2024', crop: 'Sugarcane', yield: '12.5T', revenue: '₹1.9L', weather: 'Good' }
    ]
  };

  const handleViewDetails = (farmer: any) => {
    setSelectedFarmer(farmer);
    // Load farmer requests when viewing details
    const farmerId = farmer.id;
    const requests = initialFarmerRequests.filter(req => req.farmerId === farmerId);
    setFarmerRequests(requests);
    setShowFarmerRequests(true);
    // Auto-fetch additional details when a farmer is selected
    fetchFarmerDetails(farmer.id);
  };

  // Handle request approval/rejection
  const handleRequestAction = (requestId: number, action: 'accept' | 'reject') => {
    setFarmerRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: action === 'accept' ? 'Accepted' : 'Rejected' }
          : req
      )
    );
    
    // Show confirmation popup
    if (action === 'accept') {
      alert('✓ Request accepted! Task will be scheduled and farmer will be notified.');
    } else {
      alert('✗ Request rejected! Farmer has been notified with feedback.');
    }
  };

  // Auto-fetch farmer details function
  const fetchFarmerDetails = (farmerId: number) => {
    console.log(`Auto-fetching details for farmer ID: ${farmerId}`);
    // Simulate API call to fetch additional farmer details
    setTimeout(() => {
      console.log('Additional farmer details fetched successfully');
      // In a real app, this would update the selectedFarmer state with fresh data
    }, 1000);
  };

  // Handle daily report submission
  const handleDailyReportSubmit = () => {
    if (!dailyReportDescription.trim()) {
      alert('Please enter a description for the daily report.');
      return;
    }
    
    // Simulate report submission
    alert('✓ Daily report submitted successfully! The farmer will receive a notification.');
    
    // Reset form and close modal
    setDailyReportDescription('');
    setDailyReportFile(null);
    setShowDailyReportModal(false);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDailyReportFile(file);
    }
  };

  // Comprehensive farmer analytics data
  const farmersAnalyticsData = [
    { id: 1, name: 'Rajesh Kumar', field: 'Field A12', crops: 'Wheat, Rice', yield: '8.2T/acre', status: 'Active', phone: '+91 98765 43210', area: '5.2 acres', soilType: 'Clay Loam', lastTest: '15 days ago', efficiency: 88, revenue: '₹7.2L', growth: '+12%', totalCrops: 2, activePlans: 3, completedTasks: 12, pendingTasks: 2, lastHarvest: '2024-09-15', nextPlanting: '2024-11-01', location: 'Hadapsar, Pune', lastActivity: '2024-10-26 14:30', nextScheduled: '2024-10-29 08:00' },
    { id: 2, name: 'Suresh Patel', field: 'Field B08', crops: 'Cotton, Sugarcane', yield: '9.1T/acre', status: 'Planning', phone: '+91 87654 32109', area: '7.8 acres', soilType: 'Sandy Loam', lastTest: '8 days ago', efficiency: 92, revenue: '₹14.8L', growth: '+8%', totalCrops: 2, activePlans: 4, completedTasks: 18, pendingTasks: 1, lastHarvest: '2024-08-22', nextPlanting: '2024-11-15', location: 'Kothrud, Pune', lastActivity: '2024-10-25 16:45', nextScheduled: '2024-10-30 07:30' },
    { id: 3, name: 'Amit Singh', field: 'Field C05', crops: 'Rice, Wheat', yield: '7.8T/acre', status: 'Harvesting', phone: '+91 76543 21098', area: '4.5 acres', soilType: 'Alluvial', lastTest: '22 days ago', efficiency: 85, revenue: '₹5.9L', growth: '+15%', totalCrops: 2, activePlans: 2, completedTasks: 9, pendingTasks: 3, lastHarvest: '2024-10-10', nextPlanting: '2024-12-01', location: 'Andheri, Mumbai', lastActivity: '2024-10-24 11:20', nextScheduled: '2024-10-31 09:15' },
    { id: 4, name: 'Vikram Sharma', field: 'Field D15', crops: 'Cotton, Corn', yield: '8.9T/acre', status: 'Active', phone: '+91 65432 10987', area: '6.3 acres', soilType: 'Red Soil', lastTest: '12 days ago', efficiency: 90, revenue: '₹11.3L', growth: '+5%', totalCrops: 2, activePlans: 3, completedTasks: 15, pendingTasks: 1, lastHarvest: '2024-09-05', nextPlanting: '2024-11-20', location: 'Bandra, Mumbai', lastActivity: '2024-10-27 13:10', nextScheduled: '2024-10-29 06:45' },
    { id: 5, name: 'Deepak Verma', field: 'Field E20', crops: 'Wheat, Barley', yield: '8.4T/acre', status: 'Planning', phone: '+91 54321 09876', area: '8.1 acres', soilType: 'Black Soil', lastTest: '5 days ago', efficiency: 87, revenue: '₹8.7L', growth: '+18%', totalCrops: 2, activePlans: 5, completedTasks: 14, pendingTasks: 2, lastHarvest: '2024-09-20', nextPlanting: '2024-10-30', location: 'Nashik, Maharashtra', lastActivity: '2024-10-28 10:00', nextScheduled: '2024-10-30 15:30' },
    { id: 6, name: 'Ravi Gupta', field: 'Field F12', crops: 'Rice, Sugarcane', yield: '9.3T/acre', status: 'Active', phone: '+91 43210 98765', area: '9.7 acres', soilType: 'Laterite', lastTest: '18 days ago', efficiency: 94, revenue: '₹16.2L', growth: '+22%', totalCrops: 2, activePlans: 4, completedTasks: 20, pendingTasks: 1, lastHarvest: '2024-08-30', nextPlanting: '2024-11-10', location: 'Aurangabad, Maharashtra', lastActivity: '2024-10-26 09:30', nextScheduled: '2024-10-31 07:00' }
  ];

  // Sample farmer requests data
  const initialFarmerRequests = [
    {
      id: 1,
      farmerId: 1,
      farmerName: 'Rajesh Kumar',
      field: 'Field A12',
      requestDate: '2024-10-28 09:30',
      requestedDate: '2024-10-29',
      activity: 'Irrigation & Fertilization',
      description: 'Need urgent irrigation for wheat crop and NPK fertilizer application. Soil moisture is low and crop is in critical growth stage.',
      urgency: 'High',
      estimatedDuration: '4 hours',
      status: 'Pending',
      landCondition: 'Dry soil, good crop health',
      weatherCondition: 'Clear sky, 28°C',
      lastIrrigation: '2024-10-24',
      cropStage: 'Tillering Stage'
    },
    {
      id: 2,
      farmerId: 2,
      farmerName: 'Suresh Patel',
      field: 'Field B08',
      requestDate: '2024-10-28 11:15',
      requestedDate: '2024-10-30',
      activity: 'Pest Control Spray',
      description: 'Detected bollworm infestation in cotton crop. Need immediate spraying to prevent crop damage.',
      urgency: 'Critical',
      estimatedDuration: '3 hours',
      status: 'Pending',
      landCondition: 'Good drainage, pest presence',
      weatherCondition: 'Partly cloudy, 26°C',
      lastSpray: '2024-10-20',
      cropStage: 'Flowering Stage'
    },
    {
      id: 3,
      farmerId: 3,
      farmerName: 'Amit Singh',
      field: 'Field C05',
      requestDate: '2024-10-28 14:20',
      requestedDate: '2024-10-31',
      activity: 'Soil Testing',
      description: 'Need comprehensive soil analysis before next crop cycle. pH and nutrient testing required.',
      urgency: 'Medium',
      estimatedDuration: '2 hours',
      status: 'Pending',
      landCondition: 'Recently harvested, fallow',
      weatherCondition: 'Sunny, 30°C',
      lastTest: '2024-09-15',
      cropStage: 'Land Preparation'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 relative">
      {/* Main Content - Gets blurred when modals are open */}
      <div className={`relative z-30 ${
        (showTrackingModal || showBillingModal || showPerformanceModal || showAnalyticsTable ||
         showPestModal || showIrrigationModal || showNutrientModal || showSoilTestModal || showActivityDetail || showDailyReportModal) 
          ? 'blur-sm pointer-events-none' 
          : ''
      }`}>
        
      
      <main className="max-w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Summary Cards - Only show when no farmer is selected */}
        {!selectedFarmer && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Total Farmers</h3>
                  <p className="text-xs text-gray-500 mt-1">మొత్తం రైతులు</p>
                  <p className="text-3xl font-bold text-green-600">28</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Active Plans</h3>
                  <p className="text-xs text-gray-500 mt-1">క్రియాశీల ప్రణాళికలు</p>
                  <p className="text-3xl font-bold text-blue-600">15</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Avg Yield</h3>
                  <p className="text-xs text-gray-500 mt-1">సగటు దిగుబడి</p>
                  <p className="text-3xl font-bold text-orange-600">8.5T</p>
                </div>
                <Target className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {/* Farmers Cards or Farmer Details */}
        {!selectedFarmer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {farmersAnalyticsData.map((farmer) => (
              <div
                key={farmer.id}
                className="group bg-white/70 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center relative">
                      <Users className="w-6 h-6 text-white" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{farmer.name}</h3>
                      <p className="text-sm text-gray-600">{farmer.field}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      farmer.status === 'Active' ? 'bg-green-100 text-green-800' :
                      farmer.status === 'Planning' ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {farmer.status}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="text-sm font-medium text-blue-600">{farmer.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Crops:</span>
                    <span className="text-sm font-medium">{farmer.crops}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current Yield:</span>
                    <span className="text-sm font-bold text-green-600">{farmer.yield}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Activity:</span>
                    <span className="text-xs font-medium text-purple-600">{farmer.lastActivity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Next Scheduled:</span>
                    <span className="text-xs font-medium text-orange-600">{farmer.nextScheduled}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(farmer);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Farmer Details View */
          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">{selectedFarmer.name}</h2>
                  <p className="text-lg text-gray-600">{selectedFarmer.field}</p>
                  
                  {/* Action Buttons near farmer name */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button 
                      onClick={() => setShowTrackingModal(true)}
                      className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 text-sm"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Tracking</span>
                    </button>
                    <button 
                      onClick={() => setShowBillingModal(true)}
                      className="flex items-center space-x-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Services Used</span>
                    </button>
                    <button 
                      onClick={() => setShowPerformanceModal(true)}
                      className="flex items-center space-x-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 text-sm"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Performance</span>
                    </button>
                    
                    {/* Activity Buttons from Activity Hub */}
                    <button 
                      onClick={() => setShowPestModal(true)}
                      className="flex items-center space-x-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-sm"
                    >
                      <Bug className="w-4 h-4" />
                      <span>Pest Detection</span>
                    </button>
                    <button 
                      onClick={() => setShowNutrientModal(true)}
                      className="flex items-center space-x-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm"
                    >
                      <Leaf className="w-4 h-4" />
                      <span>Nutrients</span>
                    </button>
                    <button 
                      onClick={() => setShowSoilTestModal(true)}
                      className="flex items-center space-x-1 bg-gradient-to-r from-teal-500 to-green-600 text-white px-3 py-1 rounded-lg hover:from-teal-600 hover:to-green-700 transition-all duration-200 text-sm"
                    >
                      <TestTube className="w-4 h-4" />
                      <span>Soil Test</span>
                    </button>
                    <button 
                      onClick={() => setShowIrrigationModal(true)}
                      className="flex items-center space-x-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm"
                    >
                      <Droplets className="w-4 h-4" />
                      <span>Irrigation</span>
                    </button>
                    <button 
                      onClick={() => setShowDailyReportModal(true)}
                      className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Daily Report</span>
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedFarmer(null)}
                className="bg-gray-200 hover:bg-gray-300 p-2 rounded-lg transition-all duration-200"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Farmer Profile Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-blue-800">Contact Information</h3>
                    <p className="text-xs text-blue-600 mt-1">సంప్రదింపు వివరాలు</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Auto-synced</span>
                  </div>
                </div>
                <p className="text-sm text-blue-700">Phone: {selectedFarmer.phone}</p>
                <p className="text-sm text-blue-700">Field: {selectedFarmer.field}</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-green-800">Farm Details</h3>
                    <p className="text-xs text-green-600 mt-1">వ్యవసాయ వివరాలు</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Live data</span>
                  </div>
                </div>
                <p className="text-sm text-green-700">Area: {selectedFarmer.area}</p>
                <p className="text-sm text-green-700">Soil Type: {selectedFarmer.soilType}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-purple-800">Current Status</h3>
                    <p className="text-xs text-purple-600 mt-1">ప్రస్తుత స్థితి</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Updated</span>
                  </div>
                </div>
                <p className="text-sm text-purple-700">Crops: {selectedFarmer.crops}</p>
                <p className="text-sm text-purple-700">Last Test: {selectedFarmer.lastTest}</p>
              </div>
            </div>

            {/* Farmer Requests Section */}
            {showFarmerRequests && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-orange-500" />
                    Today's Activity Requests
                  </h3>
                  <span className="text-sm text-gray-600">
                    {farmerRequests.filter(req => req.status === 'Pending').length} pending requests
                  </span>
                </div>
                
                {farmerRequests.filter(request => request.status === 'Pending').length > 0 ? (
                <div className="space-y-4">
                  {farmerRequests.filter(request => request.status === 'Pending').map((request) => (
                    <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-800">{request.activity}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.urgency === 'Critical' ? 'bg-red-100 text-red-800' :
                              request.urgency === 'High' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.urgency} Priority
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === 'Pending' ? 'bg-blue-100 text-blue-800' :
                              request.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-3">{request.description}</p>
                          
                          {/* Request Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-600">Requested Date</p>
                              <p className="font-medium text-gray-800">{request.requestedDate}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-600">Duration</p>
                              <p className="font-medium text-gray-800">{request.estimatedDuration}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-600">Land Condition</p>
                              <p className="font-medium text-gray-800">{request.landCondition}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-600">Weather</p>
                              <p className="font-medium text-gray-800">{request.weatherCondition}</p>
                            </div>
                          </div>
                          
                          {/* Additional Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-600">Crop Stage</p>
                              <p className="font-medium text-gray-800">{request.cropStage}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Request Submitted</p>
                              <p className="font-medium text-gray-800">{request.requestDate}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      {request.status === 'Pending' && (
                        <div className="flex space-x-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleRequestAction(request.id, 'accept')}
                            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleRequestAction(request.id, 'reject')}
                            className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
                          >
                            <X className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                      
                      {/* Status Message */}
                      {request.status !== 'Pending' && (
                        <div className="pt-4 border-t border-gray-200">
                          <p className={`text-sm font-medium ${
                            request.status === 'Accepted' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {request.status === 'Accepted' 
                              ? '✓ Request accepted. Task will be scheduled and farmer will be notified.' 
                              : '✗ Request rejected. Farmer has been notified with feedback.'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-gray-600 mb-2">No Pending Requests</h4>
                    <p className="text-gray-500">All activity requests have been processed for this farmer.</p>
                  </div>
                )}
              </div>
            )}




          </div>
        )}

      </main>
      </div>
      
      {/* Modal Overlays - Transparent over blurred content */}
      {/* Performance Modal */}
      {showPerformanceModal && selectedFarmer && (
        <div className="fixed inset-0 flex items-center justify-end z-50 p-6 backdrop-blur-none pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-2xl border border-gray-300/50 p-8 w-[85%] max-w-full h-[90vh] overflow-hidden relative z-50 mr-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Performance History - {selectedFarmer.name}</h3>
              </div>
              <button 
                onClick={() => setShowPerformanceModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="overflow-y-auto h-[calc(90vh-120px)] pr-2" style={{scrollbarWidth: 'thin', scrollbarColor: '#cbd5e0 #f7fafc'}}>
              <style>{`
                .overflow-y-auto::-webkit-scrollbar {
                  width: 8px;
                }
                .overflow-y-auto::-webkit-scrollbar-track {
                  background: #f7fafc;
                  border-radius: 4px;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb {
                  background: #cbd5e0;
                  border-radius: 4px;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                  background: #a0aec0;
                }
              `}</style>
              
              {/* Performance Metrics Overview - Removed Revenue Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-gray-800">Current Yield</span>
                  <span className="text-3xl font-bold text-green-600">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{width: '85%'}}></div>
                </div>
                <p className="text-xs text-green-700 mt-2">Above seasonal average</p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-gray-800">Efficiency</span>
                  <span className="text-3xl font-bold text-blue-600">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{width: '92%'}}></div>
                </div>
                <p className="text-xs text-blue-700 mt-2">Excellent performance</p>
              </div>
            </div>

            {/* Performance History Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-bold text-gray-800">4-Month Crop Cycle History</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crops</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yield (Tons)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {performanceHistory.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.month}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {record.crops}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.yield}T</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                                style={{width: `${record.efficiency}%`}}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{record.efficiency}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Farmer Analytics Table Modal */}
      {showAnalyticsTable && (
        <div className="fixed inset-0 flex items-center justify-end z-50 p-6 backdrop-blur-none pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-2xl border border-gray-300/50 p-8 w-[85%] max-w-full h-[90vh] overflow-hidden mr-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Comprehensive Farmer Analytics</h3>
              </div>
              <button 
                onClick={() => setShowAnalyticsTable(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Analytics Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-700">Total Farmers</span>
                    <span className="text-2xl font-bold text-green-600">{farmersAnalyticsData.length}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-700">Avg Efficiency</span>
                    <span className="text-2xl font-bold text-blue-600">{Math.round(farmersAnalyticsData.reduce((acc, farmer) => acc + farmer.efficiency, 0) / farmersAnalyticsData.length)}%</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-purple-700">Total Area</span>
                    <span className="text-2xl font-bold text-purple-600">{farmersAnalyticsData.reduce((acc, farmer) => acc + parseFloat(farmer.area), 0).toFixed(1)} acres</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-orange-700">Active Plans</span>
                    <span className="text-2xl font-bold text-orange-600">{farmersAnalyticsData.reduce((acc, farmer) => acc + farmer.activePlans, 0)}</span>
                  </div>
                </div>
              </div>

              {/* Farmers Analytics Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800">All Farmers Performance Analytics</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer Details</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farm Info</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plans & Tasks</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {farmersAnalyticsData.map((farmer, index) => (
                        <tr key={farmer.id} className="hover:bg-gray-50 transition-colors">
                          {/* Farmer Details */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mr-3">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{farmer.name}</div>
                                <div className="text-sm text-gray-500">{farmer.field}</div>
                                <div className="text-xs text-gray-400">{farmer.phone}</div>
                              </div>
                            </div>
                          </td>
                          
                          {/* Farm Info */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="font-medium">{farmer.area}</div>
                              <div className="text-gray-500">{farmer.soilType}</div>
                              <div className="text-xs text-gray-400">Last Test: {farmer.lastTest}</div>
                            </div>
                          </td>
                          
                          {/* Performance */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center mb-1">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                                    style={{width: `${farmer.efficiency}%`}}
                                  ></div>
                                </div>
                                <span className="text-xs font-medium">{farmer.efficiency}%</span>
                              </div>
                              <div className="text-xs text-gray-500">Yield: {farmer.yield}</div>
                            </div>
                          </td>
                          
                          {/* Financial */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="font-semibold text-green-600">{farmer.revenue}</div>
                              <div className="text-xs">
                                <span className={`font-medium ${farmer.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                  {farmer.growth}
                                </span>
                                <span className="text-gray-500 ml-1">growth</span>
                              </div>
                            </div>
                          </td>
                          
                          {/* Plans & Tasks */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex space-x-2 mb-1">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {farmer.activePlans} Plans
                                </span>
                              </div>
                              <div className="flex space-x-1 text-xs">
                                <span className="text-green-600">✓ {farmer.completedTasks}</span>
                                <span className="text-orange-600">⏳ {farmer.pendingTasks}</span>
                              </div>
                            </div>
                          </td>
                          
                          {/* Schedule */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-900">
                              <div className="text-gray-500">Last Harvest:</div>
                              <div className="font-medium">{farmer.lastHarvest}</div>
                              <div className="text-gray-500 mt-1">Next:</div>
                              <div className="font-medium">{farmer.nextPlanting || 'TBD'}</div>
                            </div>
                          </td>
                          
                          {/* Status */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              farmer.status === 'Active' ? 'bg-green-100 text-green-800' :
                              farmer.status === 'Planning' ? 'bg-blue-100 text-blue-800' :
                              farmer.status === 'Harvesting' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {farmer.status}
                            </span>
                            <div className="mt-1">
                              <span className="text-xs text-gray-500">{farmer.crops}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-center mt-6 space-x-4">
              <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg">
                <BarChart3 className="w-4 h-4" />
                <span>Export Analytics</span>
              </button>
              <button className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg">
                <TrendingUp className="w-4 h-4" />
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {showTrackingModal && selectedFarmer && (
        <div className="fixed inset-0 flex items-center justify-end z-50 p-6 backdrop-blur-none pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-2xl border border-gray-300/50 p-8 w-[85%] max-w-full h-[90vh] overflow-hidden relative z-50 mr-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Crop Tracking - {selectedFarmer.name}</h3>
              </div>
              <button 
                onClick={() => setShowTrackingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-6">
                {seasonCrops.map((crop: any) => (
                <div key={crop.id} className="group bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                  {/* Crop Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                          <Sprout className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-2xl">{crop.name}</h4>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">{crop.season}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-sm text-gray-600">{crop.duration}</span>
                          </div>
                          <div className="mt-2 flex items-center space-x-4">
                            <span className="text-xs text-gray-500">Planted: {crop.plantingDate}</span>
                            <span className="text-xs text-gray-500">Expected Harvest: {crop.expectedHarvest}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                          crop.status === 'Planned' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' :
                          crop.status === 'Active' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' :
                          crop.status === 'Harvested' ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800' :
                          'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                        }`}>
                          {crop.status}
                        </span>
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-500">Progress</span>
                            <span className="text-xs font-semibold text-gray-700">{crop.progress}%</span>
                          </div>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000 ease-out"
                              style={{width: `${crop.progress}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Scheduling Information */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Past Activities */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-bold text-gray-700 mb-3 flex items-center">
                          ✅ Past Activities
                        </h5>
                        <div className="space-y-3">
                          {crop.pastActivities.length > 0 ? (
                            crop.pastActivities.map((activity: any, index: number) => (
                              <div key={index} className="bg-white rounded-lg p-3 border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                                   onClick={() => {
                                     setSelectedActivity(activity);
                                     setShowActivityDetail(true);
                                   }}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <p className="font-medium text-gray-800 text-sm">{activity.activity}</p>
                                  </div>
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                    {activity.status}
                                  </span>
                                </div>
                                <div className="ml-5 space-y-1">
                                  <div className="flex justify-between text-xs text-gray-600">
                                    <span>Scheduled:</span>
                                    <span className="font-medium">{new Date(activity.scheduledTime).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-600">
                                    <span>Completed:</span>
                                    <span className="font-medium">{new Date(activity.completedTime).toLocaleString()}</span>
                                  </div>
                                  <div className="mt-2 text-xs text-blue-600 font-medium">
                                    Click for detailed view →
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm italic">No past activities recorded</p>
                          )}
                        </div>
                      </div>

                      {/* Upcoming Activities */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h5 className="font-bold text-blue-700 mb-3 flex items-center">
                          📅 Upcoming Schedule
                        </h5>
                        <div className="space-y-3">
                          {crop.upcomingActivities.length > 0 ? (
                            crop.upcomingActivities.map((activity: any, index: number) => (
                              <div key={index} className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-blue-200">
                                <div className={`w-2 h-2 rounded-full ${
                                  activity.status === 'Scheduled' ? 'bg-orange-500' : 'bg-blue-500'
                                }`}></div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800 text-sm">{activity.activity}</p>
                                  <p className="text-xs text-gray-500">{activity.date}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  activity.status === 'Scheduled' 
                                    ? 'bg-orange-100 text-orange-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {activity.status}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm italic">No upcoming activities scheduled</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Next Action Alert */}
                    {crop.nextScheduled && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                          <p className="font-semibold text-yellow-800">Next Action Required:</p>
                          <p className="text-yellow-700">{crop.nextScheduled}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Modal */}
      {showBillingModal && selectedFarmer && (
        <div className="fixed inset-0 flex items-center justify-end z-50 p-6 backdrop-blur-none pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-2xl border border-gray-300/50 p-8 w-[85%] max-w-full h-[90vh] overflow-hidden relative z-50 mr-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Services Used - {selectedFarmer.name}</h3>
              </div>
              <button 
                onClick={() => setShowBillingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-8">
                {detailedBills.map((bill) => (
                <div key={bill.id} className="bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                  {/* Service Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                        <Sprout className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">{bill.cropName} - {bill.item}</h3>
                            <p className="text-sm text-gray-600">{bill.details}</p>
                            <p className="text-xs text-gray-500 mt-1">Service Date: {bill.date}</p>
                          </div>
                          <div className="text-right">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <h4 className="text-sm font-semibold text-blue-800">Vendor</h4>
                              <p className="text-sm text-blue-700 font-medium">{bill.vendorBusinessName}</p>
                              <p className="text-xs text-blue-600">{bill.vendorContact}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services Used Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Fertilizers Section */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Leaf className="w-5 h-5 text-green-600" />
                            <div>
                              <h4 className="text-lg font-semibold text-green-800">🌱 Fertilizers Used</h4>
                              <p className="text-xs text-green-600">ఉపయోగించిన ఎరువులు</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="bg-green-100 rounded-lg px-2 py-1 border border-green-200">
                              <p className="text-xs text-green-600">Purchased from</p>
                              <p className="text-sm font-medium text-green-800">{bill.fertilizerVendor.name}</p>
                              <p className="text-xs text-green-600">{bill.fertilizerVendor.contact}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {bill.fertilizers.map((fertilizer: any, index: number) => (
                            <div key={index} className="bg-white rounded-lg p-3 border border-green-100">
                              <div className="font-medium text-green-900">{fertilizer.name}</div>
                              <div className="text-sm text-green-700">Quantity: {fertilizer.quantity}</div>
                              <div className="text-xs text-green-600 mt-1">{fertilizer.purpose}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Machines Section */}
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Zap className="w-5 h-5 text-blue-600" />
                            <div>
                              <h4 className="text-lg font-semibold text-blue-800">🚜 Machines Used</h4>
                              <p className="text-xs text-blue-600">ఉపయోగించిన యంత్రాలు</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="bg-blue-100 rounded-lg px-2 py-1 border border-blue-200">
                              <p className="text-xs text-blue-600">Service from</p>
                              <p className="text-sm font-medium text-blue-800">{bill.machineVendor.name}</p>
                              <p className="text-xs text-blue-600">{bill.machineVendor.contact}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {bill.machines.map((machine: any, index: number) => (
                            <div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
                              <div className="font-medium text-blue-900">{machine.name}</div>
                              <div className="text-sm text-blue-700">Duration: {machine.hours}</div>
                              <div className="text-xs text-blue-600 mt-1">{machine.purpose}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pesticides Section */}
                      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Bug className="w-5 h-5 text-red-600" />
                            <div>
                              <h4 className="text-lg font-semibold text-red-800">🛡️ Pesticides Used</h4>
                              <p className="text-xs text-red-600">ఉపయోగించిన క్రిమిసంహారకాలు</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="bg-red-100 rounded-lg px-2 py-1 border border-red-200">
                              <p className="text-xs text-red-600">Supplied by</p>
                              <p className="text-sm font-medium text-red-800">{bill.pesticideVendor.name}</p>
                              <p className="text-xs text-red-600">{bill.pesticideVendor.contact}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {bill.pesticides.map((pesticide: any, index: number) => (
                            <div key={index} className="bg-white rounded-lg p-3 border border-red-100">
                              <div className="font-medium text-red-900">{pesticide.name}</div>
                              <div className="text-sm text-red-700">Quantity: {pesticide.quantity}</div>
                              <div className="text-xs text-red-600 mt-1">{pesticide.purpose}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Pest Control Modal */}
      {showPestModal && (
        <div className="fixed inset-0 flex items-center justify-end z-50 p-6 backdrop-blur-none pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-2xl border border-gray-300/50 p-8 w-[85%] max-w-full h-[90vh] overflow-hidden relative z-50 mr-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Bug className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  Pest Control History & Details
                </h2>
              </div>
              <button 
                onClick={() => setShowPestModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="overflow-y-auto modal-scroll h-[calc(90vh-120px)]">
              <style>{`
                .modal-scroll::-webkit-scrollbar {
                  width: 8px;
                }
                .modal-scroll::-webkit-scrollbar-track {
                  background: #f7fafc;
                  border-radius: 4px;
                }
                .modal-scroll::-webkit-scrollbar-thumb {
                  background: #cbd5e0;
                  border-radius: 4px;
                }
                .modal-scroll::-webkit-scrollbar-thumb:hover {
                  background: #a0aec0;
                }
              `}</style>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
                  <h3 className="text-lg font-semibold text-red-800 mb-4">Recent Pest Control Activities</h3>
                  <div className="space-y-4">
                    <div className="bg-white/70 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-2">Aphid Treatment - Completed</h4>
                      <p className="text-sm text-red-700 mb-2">Field A12 - Applied on Jan 15, 2024</p>
                      <p className="text-xs text-gray-600">Pesticide: Imidacloprid 17.8% - 500ml applied</p>
                      <p className="text-xs text-gray-600">Status: Treatment successful, monitoring ongoing</p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-4">
                      <h4 className="font-medium text-orange-800 mb-2">Bollworm Prevention - Scheduled</h4>
                      <p className="text-sm text-orange-700 mb-2">Field A12 - Next treatment Feb 1, 2024</p>
                      <p className="text-xs text-gray-600">Pesticide: Spinosad 45% - 200ml planned</p>
                      <p className="text-xs text-gray-600">Status: Preventive treatment scheduled</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Pest Control Records</h3>
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-3">
                      <h5 className="font-medium text-gray-800">Last Treatment</h5>
                      <p className="text-sm text-gray-600">Date: January 15, 2024</p>
                      <p className="text-sm text-gray-600">Type: Aphid Control</p>
                      <p className="text-sm text-gray-600">Chemical: Imidacloprid 17.8%</p>
                      <p className="text-sm text-gray-600">Effectiveness: 95% pest reduction</p>
                    </div>
                    
                    <div className="border-b border-gray-200 pb-3">
                      <h5 className="font-medium text-gray-800">Next Scheduled</h5>
                      <p className="text-sm text-gray-600">Date: February 1, 2024</p>
                      <p className="text-sm text-gray-600">Type: Preventive Treatment</p>
                      <p className="text-sm text-gray-600">Target: Bollworm Prevention</p>
                      <p className="text-sm text-gray-600">Status: Auto-scheduled based on crop cycle</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-800">Treatment History</h5>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>• Dec 2023: Whitefly control - Successful</p>
                        <p>• Nov 2023: Fungal prevention - Completed</p>
                        <p>• Oct 2023: Thrips treatment - Effective</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Irrigation Modal */}
      {showIrrigationModal && (
        <div className="fixed inset-0 flex items-center justify-end z-50 p-6 backdrop-blur-none pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-2xl border border-gray-300/50 p-8 w-[85%] max-w-full h-[90vh] overflow-hidden relative z-50 mr-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Irrigation Management
                </h2>
              </div>
              <button 
                onClick={() => setShowIrrigationModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="overflow-y-auto modal-scroll h-[calc(90vh-120px)]">
              <style>{`
                .modal-scroll::-webkit-scrollbar {
                  width: 8px;
                }
                .modal-scroll::-webkit-scrollbar-track {
                  background: #f7fafc;
                  border-radius: 4px;
                }
                .modal-scroll::-webkit-scrollbar-thumb {
                  background: #cbd5e0;
                  border-radius: 4px;
                }
                .modal-scroll::-webkit-scrollbar-thumb:hover {
                  background: #a0aec0;
                }
              `}</style>
              <div className="space-y-6">
                {/* Irrigation History Cards */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">🚿 Irrigation History & Tracking</h3>
                  
                  {/* Recent Irrigation Records */}
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-800">Field A12 - Wheat Irrigation</h4>
                          <p className="text-sm text-gray-600">Drip irrigation system</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Completed</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Scheduled:</span>
                          <span className="ml-2 font-medium">Dec 20, 2024 - 6:00 AM</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Completed:</span>
                          <span className="ml-2 font-medium">Dec 20, 2024 - 9:30 AM</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <span className="ml-2 font-medium">3.5 hours</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Water Used:</span>
                          <span className="ml-2 font-medium">1,200 liters</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-800">Field B08 - Cotton Irrigation</h4>
                          <p className="text-sm text-gray-600">Sprinkler irrigation</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Completed</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Scheduled:</span>
                          <span className="ml-2 font-medium">Dec 18, 2024 - 5:30 AM</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Completed:</span>
                          <span className="ml-2 font-medium">Dec 18, 2024 - 8:00 AM</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <span className="ml-2 font-medium">2.5 hours</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Water Used:</span>
                          <span className="ml-2 font-medium">800 liters</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-yellow-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-800">Field C05 - Rice Irrigation</h4>
                          <p className="text-sm text-gray-600">Flood irrigation</p>
                        </div>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">In Progress</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Scheduled:</span>
                          <span className="ml-2 font-medium">Dec 22, 2024 - 7:00 AM</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Started:</span>
                          <span className="ml-2 font-medium">Dec 22, 2024 - 7:15 AM</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Planned Duration:</span>
                          <span className="ml-2 font-medium">4 hours</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Progress:</span>
                          <span className="ml-2 font-medium">65% Complete</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nutrient Management Modal */}
      {showNutrientModal && (
        <div className="fixed inset-0 flex items-center justify-end z-50 p-6 backdrop-blur-none pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-2xl border border-gray-300/50 p-8 w-[85%] max-w-full h-[90vh] overflow-hidden relative z-50 mr-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  Fertilizer Usage History & Analysis
                </h2>
              </div>
              <button 
                onClick={() => setShowNutrientModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="overflow-y-auto modal-scroll h-[calc(90vh-120px)]">
              <style>{`
                .modal-scroll::-webkit-scrollbar {
                  width: 8px;
                }
                .modal-scroll::-webkit-scrollbar-track {
                  background: #f7fafc;
                  border-radius: 4px;
                }
                .modal-scroll::-webkit-scrollbar-thumb {
                  background: #cbd5e0;
                  border-radius: 4px;
                }
                .modal-scroll::-webkit-scrollbar-thumb:hover {
                  background: #a0aec0;
                }
              `}</style>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Recent Fertilizer Applications</h3>
                  <div className="space-y-4">
                    <div className="bg-white/70 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 mb-2">NPK 10-26-26 - Applied</h4>
                      <p className="text-sm text-green-700 mb-2">Field A12 - Applied on Jan 20, 2024</p>
                      <p className="text-xs text-gray-600">Quantity: 50kg per hectare</p>
                      <p className="text-xs text-gray-600">Cost: ₹3,500 | Status: Active effect period</p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Organic Compost - Scheduled</h4>
                      <p className="text-sm text-blue-700 mb-2">Field A12 - Next application Feb 5, 2024</p>
                      <p className="text-xs text-gray-600">Quantity: 2 tons planned</p>
                      <p className="text-xs text-gray-600">Cost: ₹2,000 | Type: Base preparation</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Nutrient Analysis & Usage</h3>
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-3">
                      <h5 className="font-medium text-gray-800">Current Nutrient Levels</h5>
                      <div className="grid grid-cols-3 gap-4 mt-2">
                        <div className="text-center">
                          <p className="text-sm font-medium text-green-600">Nitrogen</p>
                          <p className="text-lg font-bold text-green-800">85%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-blue-600">Phosphorus</p>
                          <p className="text-lg font-bold text-blue-800">72%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-purple-600">Potassium</p>
                          <p className="text-lg font-bold text-purple-800">78%</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-b border-gray-200 pb-3">
                      <h5 className="font-medium text-gray-800">Monthly Usage Summary</h5>
                      <p className="text-sm text-gray-600">Total fertilizer cost: ₹8,500</p>
                      <p className="text-sm text-gray-600">Applications this month: 3</p>
                      <p className="text-sm text-gray-600">Next scheduled: Feb 5, 2024</p>
                      <p className="text-sm text-gray-600">Efficiency rating: 94%</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-800">Application History</h5>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>• Jan 20, 2024: NPK 10-26-26 (50kg) - ₹3,500</p>
                        <p>• Dec 15, 2023: Urea (30kg) - ₹1,800</p>
                        <p>• Dec 1, 2023: Organic compost (2 tons) - ₹2,000</p>
                        <p>• Nov 20, 2023: DAP (40kg) - ₹2,400</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Soil Test History Modal */}
      {showSoilTestModal && (
        <div className="fixed inset-0 flex items-center justify-end z-50 p-6 backdrop-blur-none pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-2xl border border-gray-300/50 p-8 w-[85%] max-w-full h-[90vh] overflow-hidden relative z-50 mr-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-green-600 rounded-xl flex items-center justify-center">
                  <TestTube className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
                  Soil Test History & Results
                </h2>
              </div>
              <button 
                onClick={() => setShowSoilTestModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="overflow-y-auto modal-scroll h-[calc(90vh-120px)]">
              <style>{`
                .modal-scroll::-webkit-scrollbar {
                  width: 8px;
                }
                .modal-scroll::-webkit-scrollbar-track {
                  background: #f7fafc;
                  border-radius: 4px;
                }
                .modal-scroll::-webkit-scrollbar-thumb {
                  background: #cbd5e0;
                  border-radius: 4px;
                }
                .modal-scroll::-webkit-scrollbar-thumb:hover {
                  background: #a0aec0;
                }
              `}</style>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-lg p-6 border border-teal-200">
                  <h3 className="text-lg font-semibold text-teal-800 mb-4">Recent Soil Test Results</h3>
                  <div className="space-y-4">
                    <div className="bg-white/70 rounded-lg p-4">
                      <h4 className="font-medium text-teal-800 mb-2">Comprehensive Analysis - Completed</h4>
                      <p className="text-sm text-teal-700 mb-2">Field A12 - Tested on Jan 25, 2024</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <p>pH Level: 6.8 (Optimal)</p>
                        <p>Nitrogen: 45 ppm (Good)</p>
                        <p>Phosphorus: 32 ppm (Medium)</p>
                        <p>Potassium: 180 ppm (High)</p>
                      </div>
                      <p className="text-xs text-green-600 mt-2">Status: Suitable for crop growth</p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Quick pH Test - Scheduled</h4>
                      <p className="text-sm text-blue-700 mb-2">Field A12 - Next test Feb 10, 2024</p>
                      <p className="text-xs text-gray-600">Type: Routine monitoring</p>
                      <p className="text-xs text-gray-600">Status: Auto-scheduled monthly check</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Soil Health Analysis</h3>
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-3">
                      <h5 className="font-medium text-gray-800">Current Soil Parameters</h5>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600">pH Level</p>
                          <p className="text-lg font-bold text-green-600">6.8</p>
                          <p className="text-xs text-gray-500">Slightly acidic (Optimal)</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Organic Matter</p>
                          <p className="text-lg font-bold text-green-600">3.2%</p>
                          <p className="text-xs text-gray-500">Good level</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Moisture Content</p>
                          <p className="text-lg font-bold text-blue-600">22%</p>
                          <p className="text-xs text-gray-500">Adequate</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Soil Texture</p>
                          <p className="text-lg font-bold text-brown-600">Loamy</p>
                          <p className="text-xs text-gray-500">Ideal for crops</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-800">Test History</h5>
                      <div className="text-sm text-gray-600 space-y-2">
                        <div className="flex justify-between">
                          <span>Jan 25, 2024: Comprehensive test</span>
                          <span className="text-green-600">✓ Passed</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dec 20, 2023: pH monitoring</span>
                          <span className="text-green-600">✓ Passed</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Nov 15, 2023: Nutrient analysis</span>
                          <span className="text-yellow-600">⚠ Attention needed</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Oct 10, 2023: Moisture test</span>
                          <span className="text-green-600">✓ Passed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Activity Detail Modal */}
      {showActivityDetail && selectedActivity && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-6 backdrop-blur-sm bg-black/20 pointer-events-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-8 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Activity Details</h3>
              </div>
              <button 
                onClick={() => {
                  setShowActivityDetail(false);
                  setSelectedActivity(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-6">
                {/* Activity Header */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <h4 className="text-xl font-bold text-green-800 mb-2">{selectedActivity.activity}</h4>
                  <div className="flex items-center space-x-4">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedActivity.status}
                    </span>
                    <span className="text-green-700 text-sm">Date: {selectedActivity.date}</span>
                  </div>
                </div>

                {/* Timing Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h5 className="font-semibold text-blue-800 mb-2">📅 Scheduled Time</h5>
                    <p className="text-blue-700">{new Date(selectedActivity.scheduledTime).toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h5 className="font-semibold text-green-800 mb-2">✅ Completed Time</h5>
                    <p className="text-green-700">{new Date(selectedActivity.completedTime).toLocaleString()}</p>
                  </div>
                </div>

                {/* Duration Analysis */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h5 className="font-semibold text-gray-800 mb-2">⏱️ Duration Analysis</h5>
                  <div className="text-sm text-gray-700">
                    {(() => {
                      const scheduled = new Date(selectedActivity.scheduledTime);
                      const completed = new Date(selectedActivity.completedTime);
                      const durationMs = completed.getTime() - scheduled.getTime();
                      const hours = Math.floor(durationMs / (1000 * 60 * 60));
                      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                      
                      return (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-gray-600">Total Duration:</span>
                            <span className="ml-2 font-medium">{hours}h {minutes}m</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <span className="ml-2 font-medium text-green-600">On Schedule</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Detailed Description */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h5 className="font-semibold text-gray-800 mb-3">📝 Detailed Description</h5>
                  <p className="text-gray-700 leading-relaxed">{selectedActivity.details}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Daily Report Modal */}
      {showDailyReportModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-6 backdrop-blur-sm bg-black/20 pointer-events-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-8 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Daily Report Request</h3>
              </div>
              <button 
                onClick={() => {
                  setShowDailyReportModal(false);
                  setDailyReportDescription('');
                  setDailyReportFile(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Farmer Info */}
              {selectedFarmer && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="text-lg font-semibold text-purple-800 mb-2">Farmer Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-purple-600 font-medium">Name:</span>
                      <p className="text-gray-800">{selectedFarmer.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-purple-600 font-medium">Field:</span>
                      <p className="text-gray-800">{selectedFarmer.field}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload File (Optional)</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      id="daily-report-file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <label
                      htmlFor="daily-report-file"
                      className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>Choose File</span>
                    </label>
                    {dailyReportFile && (
                      <span className="text-sm text-gray-600">
                        Selected: {dailyReportFile.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={dailyReportDescription}
                    onChange={(e) => setDailyReportDescription(e.target.value)}
                    placeholder="Enter details about the daily report request..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={4}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDailyReportModal(false);
                    setDailyReportDescription('');
                    setDailyReportFile(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDailyReportSubmit}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
                >
                  <FileText className="w-4 h-4" />
                  <span>Submit Request</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default FarmPlanningManagement;