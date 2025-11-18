// pages/VendorCoordinationCenter.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { 
  Users, FileText, DollarSign, TrendingUp, Star,
  Calendar, Clock, CheckCircle, AlertCircle,
  Plus, Edit3, Eye, Settings, Activity, X, MapPin, Bell,
  Truck, CreditCard, Package, Award
} from 'lucide-react';

const VendorCoordinationCenter = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNewComplaintModal, setShowNewComplaintModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [availableVendors, setAvailableVendors] = useState<any[]>([]);
  const [showFarmerDetailsModal, setShowFarmerDetailsModal] = useState(false);
  const [selectedFarmerForDetails, setSelectedFarmerForDetails] = useState<any>(null);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedSubField, setSelectedSubField] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Effect to manage body scroll when modals are open
  useEffect(() => {
    if (showNewComplaintModal || showFarmerDetailsModal || showSuccessNotification) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showNewComplaintModal, showFarmerDetailsModal]);
  
  // Sample farmer data with ratings
  const farmersData = [
    { id: 'F001', name: 'Rajesh Kumar', field: 'Field A12', location: 'Punjab, India', phone: '+91-9876543210', rating: 4.5 },
    { id: 'F002', name: 'Suresh Patel', field: 'Field B08', location: 'Gujarat, India', phone: '+91-9876543211', rating: 4.2 },
    { id: 'F003', name: 'Priya Sharma', field: 'Field C15', location: 'Maharashtra, India', phone: '+91-9876543212', rating: 4.8 },
    { id: 'F004', name: 'Amit Singh', field: 'Field D22', location: 'Haryana, India', phone: '+91-9876543213', rating: 4.3 },
    { id: 'F005', name: 'Rajesh Kumar', field: 'Field E35', location: 'Uttar Pradesh, India', phone: '+91-9876543214', rating: 4.6 },
    { id: 'F006', name: 'Priya Sharma', field: 'Field F48', location: 'Karnataka, India', phone: '+91-9876543215', rating: 4.7 }
  ];

  // Sample vendor data based on farmer selection
  const vendorsByFarmer = {
    'F001': [
      { id: 'V001', name: 'AgriMach Solutions', type: 'Machinery', rating: 4.5 },
      { id: 'V002', name: 'GreenShield Corp', type: 'Pesticides', rating: 4.2 },
      { id: 'V003', name: 'TechFarm India', type: 'IoT Devices', rating: 4.7 }
    ],
    'F002': [
      { id: 'V004', name: 'FertilizeCorp', type: 'Fertilizers', rating: 4.3 },
      { id: 'V005', name: 'AgriMach Solutions', type: 'Machinery', rating: 4.5 },
      { id: 'V006', name: 'WaterTech Solutions', type: 'Irrigation', rating: 4.1 }
    ],
    'F003': [
      { id: 'V007', name: 'GreenShield Corp', type: 'Pesticides', rating: 4.2 },
      { id: 'V008', name: 'SugarCane Tech', type: 'Specialized Equipment', rating: 4.6 },
      { id: 'V009', name: 'BioFarm Organic', type: 'Organic Solutions', rating: 4.4 }
    ],
    'F004': [
      { id: 'V010', name: 'CottonCare Ltd', type: 'Cotton Specialists', rating: 4.5 },
      { id: 'V011', name: 'AgriMach Solutions', type: 'Machinery', rating: 4.5 },
      { id: 'V012', name: 'DroughtDefense Corp', type: 'Water Management', rating: 4.3 }
    ],
    'F005': [
      { id: 'V013', name: 'WaterTech Solutions', type: 'Irrigation', rating: 4.4 },
      { id: 'V014', name: 'AgriMach Solutions', type: 'Machinery', rating: 4.5 },
      { id: 'V015', name: 'CropCare India', type: 'Crop Management', rating: 4.3 }
    ],
    'F006': [
      { id: 'V016', name: 'AgriMach Solutions', type: 'Machinery', rating: 4.5 },
      { id: 'V017', name: 'HarvestTech Corp', type: 'Harvesting', rating: 4.6 },
      { id: 'V018', name: 'FarmTech Solutions', type: 'Equipment', rating: 4.2 }
    ]
  };

  const handleFarmerSelection = (farmerId: string) => {
    setSelectedFarmerId(farmerId);
    setAvailableVendors(vendorsByFarmer[farmerId as keyof typeof vendorsByFarmer] || []);
  };
  
  // Vendor-specific notifications
  const vendorNotifications = [
    // RFQ related
    { id: 1, type: 'rfq', message: 'New RFQ response from GreenShield Corp - Pesticide bid ₹8,200', time: '30 minutes ago', category: 'response', read: false },
    { id: 2, type: 'rfq', message: 'RFQ deadline approaching for IoT Devices - 2 days remaining', time: '1 hour ago', category: 'deadline', read: false },
    { id: 3, type: 'rfq', message: 'Fertilizer RFQ evaluation completed - Vendor selected', time: '2 hours ago', category: 'completion', read: true },
    
    // Payment related
    { id: 4, type: 'payment', message: 'Payment processed successfully - AgriMach Solutions ₹15,000', time: '3 hours ago', category: 'success', read: false },
    { id: 5, type: 'payment', message: 'Payment pending for GreenShield Corp - ₹8,000 due tomorrow', time: '4 hours ago', category: 'pending', read: false },
    { id: 6, type: 'payment', message: 'Invoice generated for monthly services - Total ₹45,600', time: '6 hours ago', category: 'invoice', read: true },
    
    // Delivery and scheduling
    { id: 7, type: 'delivery', message: 'Organic fertilizer delivery confirmed for tomorrow 10 AM', time: '8 hours ago', category: 'confirmed', read: false },
    { id: 8, type: 'delivery', message: 'Tractor rental pickup scheduled - Field A12 location', time: '10 hours ago', category: 'scheduled', read: false },
    { id: 9, type: 'service', message: 'Pesticide application service completed at Field C15', time: '12 hours ago', category: 'completed', read: true },
    
    // Vendor performance
    { id: 10, type: 'performance', message: 'TechFarm India rating updated to 4.7/5 - Excellent service', time: '1 day ago', category: 'rating', read: false },
    { id: 11, type: 'performance', message: 'AgriMach Solutions SLA compliance: 98% this month', time: '1 day ago', category: 'sla', read: true },
    { id: 12, type: 'alert', message: 'Vendor capacity alert: High demand for drone services next week', time: '2 days ago', category: 'capacity', read: false }
  ];
  
  const unreadCount = vendorNotifications.filter(n => !n.read).length;
  
  const handleNotificationClick = (notification: any) => {
    console.log('Vendor notification clicked:', notification);
    setShowNotifications(false);
  };
  
  const markAllAsRead = () => {
    console.log('Mark all vendor notifications as read');
  };

  const rfqData = [
    { id: 1, title: 'Tractor Rental', vendor: 'AgriMach Solutions', bid: 15000, status: 'Evaluating' },
    { id: 2, title: 'Organic Pesticides', vendor: 'GreenShield Corp', bid: 8000, status: 'Approved' },
    { id: 3, title: 'IoT Devices', vendor: 'TechFarm India', bid: 25000, status: 'Pending' }
  ];

  const vendorPerformance = [
    { name: 'AgriMach Solutions', rating: 4.5, completion: 95, sla: 98 },
    { name: 'GreenShield Corp', rating: 4.2, completion: 88, sla: 92 },
    { name: 'TechFarm India', rating: 4.7, completion: 97, sla: 96 }
  ];

  const activitiesData = [
    { id: 1, type: 'Order', description: 'Organic Pesticides ordered', status: 'Pending', date: '2024-01-20', amount: '₹8,000', vendor: 'GreenShield Corp' },
    { id: 2, type: 'Payment', description: 'Tractor rental payment', status: 'Completed', date: '2024-01-19', amount: '₹15,000', vendor: 'AgriMach Solutions' },
    { id: 3, type: 'RFQ', description: 'IoT Devices inquiry', status: 'Active', date: '2024-01-18', responses: '3 bids', vendor: 'Multiple Vendors' },
    { id: 4, type: 'Bid', description: 'Fertilizer supplier bid', status: 'Under Review', date: '2024-01-17', amount: '₹12,500', vendor: 'FertilizeCorp' }
  ];

  const recentRFQs = [
    { id: 1, farmerName: 'Rajesh Kumar', farmerId: 'F001', equipment: 'Tractor', vendor: 'AgriMach Solutions', date: '2024-01-25', status: 'Active' },
    { id: 2, farmerName: 'Suresh Patel', farmerId: 'F002', equipment: 'Organic Fertilizers', vendor: 'FertilizeCorp', date: '2024-01-24', status: 'Pending' },
    { id: 3, farmerName: 'Priya Sharma', farmerId: 'F003', equipment: 'Drone Services', vendor: 'TechFarm India', date: '2024-01-23', status: 'Completed' },
    { id: 4, farmerName: 'Amit Singh', farmerId: 'F004', equipment: 'Pesticides', vendor: 'GreenShield Corp', date: '2024-01-22', status: 'Pending' },
    { id: 5, farmerName: 'Rajesh Kumar', farmerId: 'F005', equipment: 'Irrigation System', vendor: 'WaterTech Solutions', date: '2024-01-21', status: 'Completed' },
    { id: 6, farmerName: 'Priya Sharma', farmerId: 'F006', equipment: 'Harvester', vendor: 'AgriMach Solutions', date: '2024-01-20', status: 'Active' }
  ];

  // Sample booked equipment data
  const bookedEquipmentByFarmer = {
    'F001': [
      { id: 1, equipment: 'Tractor JD 5050D', vendor: 'AgriMach Solutions', hoursBooked: 24, bookingDate: '2024-01-25', status: 'Active' },
      { id: 2, equipment: 'Harvester Combine', vendor: 'AgriMach Solutions', hoursBooked: 48, bookingDate: '2024-01-20', status: 'Completed' },
      { id: 3, equipment: 'Irrigation Pump', vendor: 'WaterTech Solutions', hoursBooked: 72, bookingDate: '2024-01-15', status: 'Active' }
    ],
    'F002': [
      { id: 4, equipment: 'Fertilizer Spreader', vendor: 'FertilizeCorp', hoursBooked: 8, bookingDate: '2024-01-24', status: 'Active' },
      { id: 5, equipment: 'Spraying Equipment', vendor: 'GreenShield Corp', hoursBooked: 12, bookingDate: '2024-01-22', status: 'Completed' }
    ],
    'F003': [
      { id: 6, equipment: 'Drone DJI Agras', vendor: 'TechFarm India', hoursBooked: 6, bookingDate: '2024-01-23', status: 'Active' },
      { id: 7, equipment: 'Sugar Cane Harvester', vendor: 'SugarCane Tech', hoursBooked: 36, bookingDate: '2024-01-18', status: 'Completed' },
      { id: 8, equipment: 'Organic Compost Spreader', vendor: 'BioFarm Organic', hoursBooked: 16, bookingDate: '2024-01-16', status: 'Active' }
    ],
    'F004': [
      { id: 9, equipment: 'Cotton Picker', vendor: 'CottonCare Ltd', hoursBooked: 40, bookingDate: '2024-01-22', status: 'Active' },
      { id: 10, equipment: 'Drip Irrigation System', vendor: 'DroughtDefense Corp', hoursBooked: 168, bookingDate: '2024-01-10', status: 'Active' }
    ]
  };

  const paymentData = [
    { id: 1, vendor: 'AgriMach Solutions', amount: '₹15,000', status: 'Completed', date: '2024-01-20', type: 'Tractor Rental' },
    { id: 2, vendor: 'GreenShield Corp', amount: '₹8,000', status: 'Pending', date: '2024-01-22', type: 'Pesticides' },
    { id: 3, vendor: 'TechFarm India', amount: '₹25,000', status: 'Processing', date: '2024-01-25', type: 'IoT Equipment' }
  ];

  // Add Jobs in Progress with SLA Tracking
  const activeJobs = [
    { id: 1, title: 'Tractor Service', vendor: 'AgriMach Solutions', status: 'In Progress', slaHours: 48, timeRemaining: '24 hrs', progressPercent: 50, slaStatus: 'on-track', vendorId: 101 },
    { id: 2, title: 'Pesticide Application', vendor: 'GreenShield Corp', status: 'Delayed', slaHours: 24, timeRemaining: '6 hrs', progressPercent: 75, slaStatus: 'at-risk', vendorId: 102 }
  ];

  const completedJobs = [
    { id: 1, title: 'Drone Field Mapping', vendor: 'TechFarm India', status: 'Completed', deliveryDate: '2024-01-18', proofRequired: true, fieldType: 'Cotton Field A12', subFields: ['North Section', 'South Section', 'Central Zone'] },
    { id: 2, title: 'Tractor Maintenance', vendor: 'AgriMach Solutions', status: 'Completed', deliveryDate: '2024-01-17', proofRequired: false, fieldType: 'Wheat Field B08', subFields: ['East Plot', 'West Plot'] },
    { id: 3, title: 'IoT Sensor Installation', vendor: 'TechFarm India', status: 'Completed', deliveryDate: '2024-01-19', proofRequired: true, fieldType: 'Rice Field C15', subFields: ['Paddy Section 1', 'Paddy Section 2', 'Irrigation Zone'] }
  ];

  const contactVendor = (vendorId: number) => {
    console.log('Contacting vendor with ID:', vendorId);
  };

  const uploadProof = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const jobId = formData.get('jobId');
    const selectedJob = completedJobs.find(job => job.id.toString() === jobId);
    
    // Create notification for proof submission
    const newNotification = {
      id: Date.now(),
      type: 'delivery',
      message: `Proof of delivery submitted for ${selectedJob?.title} - ${selectedJob?.vendor}`,
      time: 'Just now',
      category: 'submitted',
      read: false
    };
    
    console.log('Uploading delivery proof with data:', Object.fromEntries(formData));
    console.log('New notification created:', newNotification);
    
    // Show success notification
    setSuccessMessage(`Proof submitted successfully for ${selectedJob?.title}! Notification sent to vendor.`);
    setShowSuccessNotification(true);
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 3000);
    
    // Reset form
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50">
      {/* Main Content - Gets blurred when modals are open */}
      <div className={`relative z-30 ${
        (showNewComplaintModal || showFarmerDetailsModal) 
          ? 'blur-sm pointer-events-none' 
          : ''
      }`}>
        
        {/* Vendor Notifications Dropdown - Rendered outside header for better z-index control */}
        {showNotifications && (
          <>
            <div 
              className="fixed inset-0 z-[99998]" 
              onClick={() => setShowNotifications(false)}
            ></div>
            <div 
              className="fixed top-20 right-8 w-96 bg-white backdrop-blur-md rounded-lg shadow-2xl border border-gray-200/50 max-h-96 overflow-y-auto modal-scroll-thin z-[99999]" 
              style={{zIndex: 99999}}
            >
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Vendor Notifications</h3>
                <p className="text-sm text-gray-600">{unreadCount} unread notifications</p>
              </div>
              <div className="p-2">
                {vendorNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 rounded-lg mb-2 border transition-all duration-200 cursor-pointer ${
                      notification.read 
                        ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' 
                        : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {/* Role-specific vendor notification icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                          notification.type === 'rfq' ? 'bg-purple-100' :
                          notification.type === 'payment' ? 'bg-green-100' :
                          notification.type === 'delivery' ? 'bg-blue-100' :
                          notification.type === 'service' ? 'bg-indigo-100' :
                          notification.type === 'performance' ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}>
                          {notification.type === 'rfq' && <FileText className="w-4 h-4 text-purple-600" />}
                          {notification.type === 'payment' && <CreditCard className="w-4 h-4 text-green-600" />}
                          {notification.type === 'delivery' && <Truck className="w-4 h-4 text-blue-600" />}
                          {notification.type === 'service' && <Settings className="w-4 h-4 text-indigo-600" />}
                          {notification.type === 'performance' && <Award className="w-4 h-4 text-yellow-600" />}
                          {notification.type === 'alert' && <AlertCircle className="w-4 h-4 text-red-600" />}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              notification.type === 'rfq' ? 'bg-purple-100 text-purple-800' :
                              notification.type === 'payment' ? 'bg-green-100 text-green-800' :
                              notification.type === 'delivery' ? 'bg-blue-100 text-blue-800' :
                              notification.type === 'service' ? 'bg-indigo-100 text-indigo-800' :
                              notification.type === 'performance' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {notification.type}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              notification.category === 'success' || notification.category === 'completed' ? 'bg-green-100 text-green-800' :
                              notification.category === 'pending' || notification.category === 'deadline' ? 'bg-yellow-100 text-yellow-800' :
                              notification.category === 'alert' || notification.category === 'capacity' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {notification.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 mb-1">{notification.message}</p>
                          <p className="text-xs text-gray-500">{notification.time}</p>
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <button 
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Mark all as read
                  </button>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Overview */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Active RFQs</h3>
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-indigo-600 mb-2">12</div>
              <div className="text-sm text-gray-600">3 new this week</div>
            </div>
          </div>

          {/* Active Vendors */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 mb-8">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-center">
                <Activity className="w-5 h-5 mr-2 text-purple-600" />
                Active Vendors
              </h3>
              <p className="text-sm font-medium text-gray-600 mt-1">క్రియాశీల విక్రేతలు</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {vendorPerformance.map((vendor, index) => (
                <div key={index} className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-purple-900">{vendor.name}</h4>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="font-medium text-purple-800">{vendor.rating}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RFQs Overview */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 mb-8">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-center">
                <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                Recent RFQs
              </h3>
              <p className="text-sm font-medium text-gray-600 mt-1">ఇటీవలి RFQ లు</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentRFQs.map((rfq) => (
                <div key={rfq.id} className={`rounded-xl p-6 border transition-all duration-200 hover:shadow-lg ${
                  rfq.status === 'Active' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
                  rfq.status === 'Pending' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' :
                  rfq.status === 'Completed' ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200' :
                  'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      rfq.status === 'Active' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      rfq.status === 'Pending' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                      rfq.status === 'Completed' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                      'bg-gradient-to-r from-gray-400 to-gray-600'
                    }`}>
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      rfq.status === 'Active' ? 'bg-green-100 text-green-800' :
                      rfq.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      rfq.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {rfq.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{rfq.farmerName}</h4>
                      <p className="text-sm text-gray-600">ID: {rfq.farmerId}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Equipment:</span>
                        <span className="text-sm font-medium text-gray-900">{rfq.equipment}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Vendor:</span>
                        <span className="text-sm font-medium text-gray-900">{rfq.vendor}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="text-sm font-medium text-gray-900">{rfq.date}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        const farmer = farmersData.find(f => f.id === rfq.farmerId);
                        setSelectedFarmerForDetails(farmer);
                        setShowFarmerDetailsModal(true);
                      }}
                      className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                        rfq.status === 'Active' ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' :
                        rfq.status === 'Pending' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white' :
                        rfq.status === 'Completed' ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white' :
                        'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white'
                      }`}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>

      {/* Modal Overlays - Outside of blurred content */}
      {/* Farmer Details Modal */}
      {showFarmerDetailsModal && selectedFarmerForDetails && (
        <div className="fixed inset-0 flex items-center justify-end z-50 p-6 backdrop-blur-none pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-2xl border border-gray-300/50 p-8 w-[85%] max-w-full h-[90vh] overflow-hidden relative z-50 mr-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  {selectedFarmerForDetails.name} Details
                </h2>
              </div>
              <button 
                onClick={() => setShowFarmerDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="overflow-y-auto modal-scroll h-full pb-32">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Farmer Information */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">Farmer Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <p className="text-sm font-semibold text-gray-900">{selectedFarmerForDetails.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                          <p className="text-sm font-semibold text-gray-900">{selectedFarmerForDetails.id}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
                          <p className="text-sm text-gray-900">{selectedFarmerForDetails.field}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <p className="text-sm text-gray-900">{selectedFarmerForDetails.location}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                          <p className="text-sm font-semibold text-blue-600">
                            {farmersData.find(f => f.id === selectedFarmerForDetails.id)?.phone || selectedFarmerForDetails.phone || 'N/A'}
                          </p>
                        </div>
                        <div>
                          {/* Empty div to maintain grid layout */}
                        </div>
                      </div>
                      
                      {/* Recent RFQ Information */}
                      <div className="border-t border-green-200 pt-4">
                        <h4 className="text-md font-semibold text-green-800 mb-3">Recent RFQ History</h4>
                        <div className="space-y-2">
                          {recentRFQs
                            .filter(rfq => rfq.farmerId === selectedFarmerForDetails.id)
                            .map((rfq) => (
                            <div key={rfq.id} className="bg-white/70 rounded-lg p-3 border border-green-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm font-medium text-gray-900">{rfq.equipment}</span>
                                  <p className="text-xs text-gray-600">Vendor: {rfq.vendor}</p>
                                  <p className="text-xs text-gray-600">Date: {rfq.date}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  rfq.status === 'Active' ? 'bg-green-100 text-green-800' :
                                  rfq.status === 'Evaluating' ? 'bg-yellow-100 text-yellow-800' :
                                  rfq.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {rfq.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booked Equipment Section */}
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
                    <h3 className="text-lg font-semibold text-orange-800 mb-4">Booked Equipment</h3>
                    <div className="space-y-3">
                      {bookedEquipmentByFarmer[selectedFarmerForDetails.id as keyof typeof bookedEquipmentByFarmer]?.filter(booking => booking.status === 'Active').map((booking) => (
                        <div key={booking.id} className="bg-white/70 rounded-lg p-4 border border-orange-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-orange-900">{booking.equipment}</h4>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {booking.status}
                            </span>
                          </div>
                          <div className="text-sm text-orange-700 space-y-1">
                            <p><span className="font-medium">Vendor:</span> {booking.vendor}</p>
                            <p><span className="font-medium">Hours Booked:</span> {booking.hoursBooked} hrs</p>
                            <p><span className="font-medium">Booking Date:</span> {booking.bookingDate}</p>
                          </div>
                        </div>
                      ))}
                      {(!bookedEquipmentByFarmer[selectedFarmerForDetails.id as keyof typeof bookedEquipmentByFarmer] || 
                        bookedEquipmentByFarmer[selectedFarmerForDetails.id as keyof typeof bookedEquipmentByFarmer].filter(booking => booking.status === 'Active').length === 0) && (
                        <div className="text-center py-4 text-orange-600">
                          <p>No active equipment bookings found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* RFQ History and Vendor Relations */}
                <div className="space-y-6">
                  <div className="bg-white/50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Associated Vendors</h3>
                    <div className="space-y-2">
                      {vendorsByFarmer[selectedFarmerForDetails.id as keyof typeof vendorsByFarmer]?.map((vendor) => (
                        <div key={vendor.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{vendor.name}</span>
                            <p className="text-xs text-gray-600">{vendor.type}</p>
                          </div>
                          <div className="flex items-center">
                            <Star className="w-3 h-3 text-yellow-500 mr-1" />
                            <span className="text-xs font-medium text-gray-700">{vendor.rating}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/*  Proof of Delivery Section */}
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border border-green-200 mb-8">
                    <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                       Proof of Delivery
                    </h3>
                    <form onSubmit={uploadProof} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Job</label>
                        <select 
                          name="jobId" 
                          value={selectedJobId}
                          onChange={(e) => {
                            setSelectedJobId(e.target.value);
                            setDeviceName(''); // Reset device name when job changes
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select a job...</option>
                          {completedJobs.map(job => 
                            <option key={job.id} value={job.id}>{job.title} - {job.vendor}</option>
                          )}
                        </select>
                      </div>
                      
                      {selectedJobId && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Specific Device/Equipment Name
                          </label>
                          <input
                            type="text"
                            name="deviceName"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            placeholder="Enter drone model (e.g., DJI Agras T30) or tractor model (e.g., John Deere 5050D)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Specify the exact drone model, tractor model, or equipment used
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Vendor OTP Code</label>
                        <input 
                          type="text" 
                          name="otpCode"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter OTP sent by vendor"
                          maxLength={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">OTP will be sent by vendor after service completion</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Proof</label>
                        <input 
                          type="file" 
                          name="proof" 
                          onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                          multiple 
                          accept="image/*,video/*" 
                          className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Completion Notes</label>
                        <textarea 
                          name="completionNotes" 
                          value={completionNotes}
                          onChange={(e) => setCompletionNotes(e.target.value)}
                          rows={3} 
                          placeholder="Enter any notes about the delivery..." 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        ></textarea>
                      </div>
                      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                        <button 
                          type="button"
                          onClick={() => {
                            // Reset form
                            setSelectedJobId('');
                            setDeviceName('');
                            setOtpCode('');
                            setProofFile(null);
                            setCompletionNotes('');
                          }}
                          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={!selectedJobId || !deviceName || !otpCode || !proofFile || !completionNotes}
                          className={`px-6 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
                            selectedJobId && deviceName && otpCode && proofFile && completionNotes
                              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Submit Proof
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-md border-t border-gray-200">
              <div className="flex justify-end space-x-4">
                <button 
                  onClick={() => setShowFarmerDetailsModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Complaint Modal */}
      {showNewComplaintModal && (
        <div className="fixed inset-0 flex items-center justify-end z-50 p-6 backdrop-blur-none pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-2xl border border-gray-300/50 p-8 w-[85%] max-w-full h-[90vh] overflow-hidden relative z-50 mr-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                  Submit Review
                </h2>
              </div>
              <button 
                onClick={() => setShowNewComplaintModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="overflow-y-auto modal-scroll h-full pb-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4">Review Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Farmer ID</label>
                      <select 
                        value={selectedFarmerId}
                        onChange={(e) => handleFarmerSelection(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Farmer ID</option>
                        {farmersData.map(farmer => (
                          <option key={farmer.id} value={farmer.id}>{farmer.id} - {farmer.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedFarmerId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Farmer Name</label>
                        <input 
                          type="text"
                          value={farmersData.find(f => f.id === selectedFarmerId)?.name || ''}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Vendor</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="">Choose a vendor</option>
                        <option value="V001">AgriMach Solutions - Machinery (Rating: 4.5/5)</option>
                        <option value="V002">GreenShield Corp - Pesticides (Rating: 4.2/5)</option>
                        <option value="V003">TechFarm India - IoT Devices (Rating: 4.7/5)</option>
                        <option value="V004">FertilizeCorp - Fertilizers (Rating: 4.3/5)</option>
                        <option value="V005">WaterTech Solutions - Irrigation (Rating: 4.1/5)</option>
                        <option value="V006">SugarCane Tech - Specialized Equipment (Rating: 4.6/5)</option>
                        <option value="V007">BioFarm Organic - Organic Solutions (Rating: 4.4/5)</option>
                        <option value="V008">CottonCare Ltd - Cotton Specialists (Rating: 4.5/5)</option>
                        <option value="V009">DroughtDefense Corp - Water Management (Rating: 4.3/5)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Specific Device/Equipment</label>
                      <input 
                        type="text"
                        placeholder="Enter device or equipment name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photo</label>
                      <input 
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Take a photo of the issue</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Complaint Description</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                      <textarea 
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Describe the issue or complaint in detail..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                      <div className="flex items-center space-x-2">
                        <select className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                          <option value="">-</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>
                        <span className="text-sm text-gray-600">⭐ / 5.0</span>
                      </div>
                    </div>
                    
                    {selectedFarmerId && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-2">Farmer Information</h4>
                        <div className="text-sm text-blue-700 space-y-1">
                          <p>ID: {selectedFarmerId}</p>
                          <p>Name: {farmersData.find(f => f.id === selectedFarmerId)?.name}</p>
                          <p>Field: {farmersData.find(f => f.id === selectedFarmerId)?.field}</p>
                          <p>Location: {farmersData.find(f => f.id === selectedFarmerId)?.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-md border-t border-gray-200">
              <div className="flex justify-end space-x-4">
                <button 
                  onClick={() => setShowNewComplaintModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all">
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Notification Modal */}
      {showSuccessNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 transform animate-bounce">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Success!</h3>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              <button
                onClick={() => setShowSuccessNotification(false)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorCoordinationCenter;