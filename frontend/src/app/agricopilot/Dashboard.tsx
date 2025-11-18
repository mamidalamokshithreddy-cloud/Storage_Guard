// pages/Dashboard.tsx
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Bell, Settings, User, TrendingUp, Activity, 
  AlertTriangle, CheckCircle, Clock, Users, 
  Zap, Target, BarChart3, PieChart as PieChartIcon,
  ArrowUpRight, ArrowDownRight, Calendar, Save, X, ChevronLeft, ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const [notifications, setNotifications] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAvailabilityScheduler, setShowAvailabilityScheduler] = useState(false);
  const [showUnifiedScheduler, setShowUnifiedScheduler] = useState(false);
  
  // AgriCopilot availability state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([
    { id: 1, time: '09:00', available: true, booked: false, farmer: '' },
    { id: 2, time: '10:00', available: true, booked: false, farmer: '' },
    { id: 3, time: '11:00', available: false, booked: false, farmer: '' },
    { id: 4, time: '14:00', available: true, booked: true, farmer: 'Rajesh Kumar' },
    { id: 5, time: '15:00', available: true, booked: false, farmer: '' },
    { id: 6, time: '16:00', available: true, booked: false, farmer: '' },
  ]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Comprehensive dashboard notifications
  const dashboardNotifications = [
    // Critical alerts
    { id: 1, type: 'alert', message: 'Pest alert detected in Field A12 - Immediate action required', time: '15 minutes ago', category: 'critical', read: false },
    { id: 2, type: 'weather', message: 'Heavy rain expected tomorrow - Adjust irrigation schedules', time: '1 hour ago', category: 'weather', read: false },
    { id: 3, type: 'system', message: 'Low soil moisture detected in 3 fields - Irrigation recommended', time: '2 hours ago', category: 'alert', read: false },
    
    // Farmer activities
    { id: 4, type: 'farmer', message: 'Rajesh Kumar completed soil testing for Field A12', time: '3 hours ago', category: 'activity', read: false },
    { id: 5, type: 'farmer', message: 'Priya Sharma achieved 95% crop health score', time: '4 hours ago', category: 'achievement', read: true },
    { id: 6, type: 'farmer', message: 'Suresh Patel uploaded disease images for analysis', time: '5 hours ago', category: 'upload', read: false },
    
    // Vendor activities  
    { id: 7, type: 'vendor', message: 'New RFQ response received - Organic pesticides bid ₹8,200', time: '6 hours ago', category: 'rfq', read: false },
    { id: 8, type: 'vendor', message: 'Payment processed for tractor rental - ₹15,000', time: '8 hours ago', category: 'payment', read: true },
    { id: 9, type: 'vendor', message: 'Fertilizer delivery scheduled for tomorrow', time: '10 hours ago', category: 'delivery', read: false },
    
    // Farm planning
    { id: 10, type: 'planning', message: 'Crop rotation plan approved for Field D22', time: '12 hours ago', category: 'planning', read: true },
    { id: 11, type: 'planning', message: 'Irrigation schedule optimized for 5 fields', time: '1 day ago', category: 'optimization', read: false },
    { id: 12, type: 'planning', message: 'Market analysis shows 15% price increase for wheat', time: '1 day ago', category: 'market', read: false },
    
    // System updates
    { id: 13, type: 'system', message: 'AI model updated - Improved disease detection accuracy', time: '2 days ago', category: 'update', read: true },
    { id: 14, type: 'system', message: 'Monthly report generated - Performance metrics available', time: '2 days ago', category: 'report', read: false }
  ];
  
  const unreadCount = dashboardNotifications.filter(n => !n.read).length;
  
  const handleNotificationClick = (notification: any) => {
    console.log('Notification clicked:', notification);
    setShowNotifications(false);
  };
  
  const markAllAsRead = () => {
    console.log('Mark all as read');
  };
  
  const markDone = (taskId: number) => {
    console.log('Marking task as done:', taskId);
    // TODO: Implement task completion logic
  };
  
  const reassign = (taskId: number) => {
    console.log('Reassigning task:', taskId);
    // TODO: Implement task reassignment logic
  };
  
  const viewFarmDetails = (farm: any) => {
    console.log('Viewing farm details:', farm);
    // TODO: Implement farm details view
  };
  
  const viewFullStatement = () => {
    console.log('Viewing full financial statement');
    // TODO: Implement financial statement view
  };
  
  // Availability scheduler functions
  const toggleSlotAvailability = (slotId: number) => {
    setAvailableSlots(slots => 
      slots.map(slot => 
        slot.id === slotId 
          ? { ...slot, available: !slot.available, booked: slot.available ? false : slot.booked }
          : slot
      )
    );
  };
  
  const saveAvailability = () => {
    console.log('Saving availability for date:', selectedDate, availableSlots);
    alert('Availability schedule saved successfully!');
    setShowAvailabilityScheduler(false);
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };
  
  const statsData = [
    { 
      name: 'Allotted Farmers', 
      value: 1250, 
      color: '#10B981', 
      icon: Users, 
      change: '+12%',
      trend: 'up'
    },
   
    { 
      name: 'Approval Pending', 
      value: 23, 
      color: '#F59E0B', 
      icon: Clock, 
      change: '-5%',
      trend: 'down'
    },
    { 
      name: 'Vendor Requests', 
      value: 45, 
      color: '#EF4444', 
      icon: Activity, 
      change: '+15%',
      trend: 'up'
    }
  ];

  const cropHealthData = [
    { year: '2022', yield: 85, soil: 78, seeds: 82 },
    { year: '2023', yield: 92, soil: 85, seeds: 88 }
  ];

  const marketTrendsData = [
    { location: 'Maharashtra', wheat: 45, rice: 52, cotton: 38 },
    { location: 'Punjab', wheat: 52, rice: 48, cotton: 42 },
    { location: 'Karnataka', wheat: 38, rice: 55, cotton: 45 }
  ];

  // Farm data for summary card
  const farmData = [
    { id: 1, name: 'Farm A12', cropType: 'Wheat', progress: 75, farmerName: 'Rajesh Kumar', activeVendors: 3 },
    { id: 2, name: 'Farm B08', cropType: 'Rice', progress: 60, farmerName: 'Suresh Patel', activeVendors: 2 },
    { id: 3, name: 'Farm C15', cropType: 'Cotton', progress: 90, farmerName: 'Priya Sharma', activeVendors: 4 }
  ];
  
  // Today's tasks data
  const todayTasks = [
    { id: 1, name: 'Irrigation Check - Farm A12', dueDate: '2023-10-05', assignedTo: 'Rajesh Kumar' },
    { id: 2, name: 'Pest Control - Farm B08', dueDate: '2023-10-05', assignedTo: 'Suresh Patel' },
    { id: 3, name: 'Fertilizer Application - Farm C15', dueDate: '2023-10-05', assignedTo: 'Priya Sharma' }
  ];
  
  // Financial data
  const budgetUsedPercent = 65;
  const pendingInvoices = 5;
  const revenueShare = 12000;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50">
      {/* Header */}
       
        {/* Notification Dropdown - Rendered outside header for better z-index control */}
        {showNotifications && (
          <>
            <div 
              className="fixed inset-0 z-[99998]" 
              onClick={() => setShowNotifications(false)}
            ></div>
            <div 
              className="fixed top-20 right-8 w-96 bg-white backdrop-blur-md rounded-lg shadow-2xl border border-gray-200/50 max-h-96 overflow-y-auto z-[99999]" 
              style={{zIndex: 99999}}
            >
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Dashboard Notifications</h3>
                <p className="text-sm text-gray-600">{unreadCount} unread notifications</p>
              </div>
              <div className="p-2">
                {dashboardNotifications.map((notification) => (
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
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            notification.type === 'farmer' ? 'bg-green-100 text-green-800' :
                            notification.type === 'vendor' ? 'bg-blue-100 text-blue-800' :
                            notification.type === 'planning' ? 'bg-purple-100 text-purple-800' :
                            notification.type === 'weather' ? 'bg-yellow-100 text-yellow-800' :
                            notification.type === 'alert' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {notification.type}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            notification.category === 'critical' ? 'bg-red-100 text-red-800' :
                            notification.category === 'alert' ? 'bg-orange-100 text-orange-800' :
                            notification.category === 'achievement' ? 'bg-yellow-100 text-yellow-800' :
                            notification.category === 'activity' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {notification.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-1">{notification.message}</p>
                        <p className="text-xs text-gray-500">{notification.time}</p>
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
        
        {/* Profile Dropdown - Rendered outside header for better z-index control */}
        {showProfile && (
          <>
            <div 
              className="fixed inset-0 z-[99998]" 
              onClick={() => setShowProfile(false)}
            ></div>
            <div 
              className="fixed top-20 right-24 w-64 py-2 bg-white backdrop-blur-md rounded-lg shadow-2xl border border-gray-100 z-[99999]" 
              style={{zIndex: 99999}}
            >
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-800">AgriCopilot Assistant</p>
                <p className="text-xs text-gray-600">Available for consultations</p>
              </div>
              <button 
                onClick={() => {
                  setShowAvailabilityScheduler(true);
                  setShowProfile(false);
                }}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Manage Availability</span>
                </div>
              </button>
              <button 
                onClick={() => {
                  console.log('Open settings');
                  setShowProfile(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </div>
              </button>
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 transition-all">Profile Settings</a>
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 transition-all">Preferences</a>
              <hr className="my-1 border-gray-200" />
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 transition-all">Logout</a>
            </div>
          </>
        )}      <main className="max-w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => {
            const IconComponent = stat.icon;
            const isPositive = stat.trend === 'up';
            return (
              <div key={index} className="group">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${stat.color}20, ${stat.color}40)`
                          }}
                        >
                          <IconComponent className="w-6 h-6" style={{color: stat.color}} />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors">{stat.name}</p>
                        <p className="text-2xl font-bold text-gray-900 group-hover:text-gray-900 transition-colors">{stat.value.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {isPositive ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        <span>{stat.change}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Real-time Monitoring Alerts with Farmer Details */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="text-center">
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Real-time Monitoring Alerts</h3>
                <p className="text-sm font-medium text-gray-600 mt-1">రియల్ టైమ్ మానిటరింగ్ అలర్ట్‌లు</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <div className="space-y-4">
              <div className="group bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 border border-red-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-red-500 rounded-full animate-pulse mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">RK</span>
                        </div>
                        <div>
                          <p className="font-semibold text-red-800">Rajesh Kumar - Field A12</p>
                          <p className="text-xs text-red-600">Pest Alert: Aphid infestation detected</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 ml-10">
                        <p>Location: Punjab, India | Crop: Rice (5.2 acres)</p>
                        <p>Detected: 2 hours ago | Severity: High</p>
                      </div>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-xs font-semibold hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200">
                    Contact Farmer
                  </button>
                </div>
              </div>
              
              <div className="group bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">SP</span>
                        </div>
                        <div>
                          <p className="font-semibold text-yellow-800">Suresh Patel - Field B08</p>
                          <p className="text-xs text-yellow-600">Irrigation Alert: Low soil moisture</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 ml-10">
                        <p>Location: Gujarat, India | Crop: Wheat (3.8 acres)</p>
                        <p>Moisture Level: 28% | Recommended: 45%</p>
                      </div>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg text-xs font-semibold hover:from-yellow-600 hover:to-yellow-700 transform hover:scale-105 transition-all duration-200">
                    Schedule Irrigation
                  </button>
                </div>
              </div>
              
              <div className="group bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">PS</span>
                        </div>
                        <div>
                          <p className="font-semibold text-green-800">Priya Sharma - Field C15</p>
                          <p className="text-xs text-green-600">Achievement: 95% crop health score</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 ml-10">
                        <p>Location: Maharashtra, India | Crop: Sugarcane (7.1 acres)</p>
                        <p>Performance: Excellent | Rating: 4.8/5</p>
                      </div>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-xs font-semibold hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Crop Health Monitoring with Farmer-Specific Data */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="text-center">
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Crop Health Monitoring</h3>
                <p className="text-sm font-medium text-gray-600 mt-1">పంట ఆరోగ్య పర్యవేక్షణ</p>
              </div>
              <BarChart3 className="w-6 h-6 text-green-500" />
            </div>
            
            {/* Individual Farmer Health Cards */}
            <div className="space-y-4 mb-6">
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">RK</span>
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">Rajesh Kumar</p>
                      <p className="text-xs text-green-600">Field A12 - Rice Crop</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">85%</p>
                    <p className="text-xs text-green-500">Health Score</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white/50 rounded-lg p-2">
                    <p className="text-sm font-medium text-gray-800">92%</p>
                    <p className="text-xs text-gray-600">Growth</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-2">
                    <p className="text-sm font-medium text-gray-800">78%</p>
                    <p className="text-xs text-gray-600">Soil</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-2">
                    <p className="text-sm font-medium text-gray-800">88%</p>
                    <p className="text-xs text-gray-600">Nutrition</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">SP</span>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-800">Suresh Patel</p>
                      <p className="text-xs text-blue-600">Field B08 - Wheat Crop</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-600">72%</p>
                    <p className="text-xs text-yellow-500">Health Score</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white/50 rounded-lg p-2">
                    <p className="text-sm font-medium text-gray-800">75%</p>
                    <p className="text-xs text-gray-600">Growth</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-2">
                    <p className="text-sm font-medium text-gray-800">68%</p>
                    <p className="text-xs text-gray-600">Soil</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-2">
                    <p className="text-sm font-medium text-gray-800">73%</p>
                    <p className="text-xs text-gray-600">Nutrition</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">PS</span>
                    </div>
                    <div>
                      <p className="font-semibold text-purple-800">Priya Sharma</p>
                      <p className="text-xs text-purple-600">Field C15 - Sugarcane</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">90%</p>
                    <p className="text-xs text-green-500">Health Score</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white/50 rounded-lg p-2">
                    <p className="text-sm font-medium text-gray-800">95%</p>
                    <p className="text-xs text-gray-600">Growth</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-2">
                    <p className="text-sm font-medium text-gray-800">87%</p>
                    <p className="text-xs text-gray-600">Soil</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-2">
                    <p className="text-sm font-medium text-gray-800">89%</p>
                    <p className="text-xs text-gray-600">Nutrition</p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          {/* Vendors View Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="text-center">
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Vendor Coordination</h3>
                <p className="text-sm font-medium text-gray-600 mt-1">విక్రేత సమన్వయం</p>
              </div>
              <Users className="w-6 h-6 text-purple-500" />
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">Active Vendors</p>
                    <p className="text-sm text-gray-600">Equipment & Services</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold">24 Online</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">12</p>
                  <p className="text-xs text-blue-600">Service Requests</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">8</p>
                  <p className="text-xs text-green-600">Completed Today</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-3 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800">Pending Deliveries</p>
                    <p className="text-xs text-orange-600">Equipment & Supplies</p>
                  </div>
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">5 Items</span>
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
                Manage Vendor Services
              </button>
            </div>
          </div>
        </div>
        
      </main>
      
      {/* Modals */}
      {/* AgriCopilot Availability Scheduler Modal */}
      {showAvailabilityScheduler && (
        <div className="fixed inset-0 flex items-center justify-center z-[10000] p-6">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowAvailabilityScheduler(false)}
          ></div>
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-300/50 w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-[10001] flex flex-col">
            <div className="flex items-center justify-between p-8 pb-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  AgriCopilot Availability Schedule
                </h2>
              </div>
              <button 
                onClick={() => setShowAvailabilityScheduler(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calendar */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-green-800">Select Date</h3>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => navigateMonth('prev')}
                        className="p-2 hover:bg-green-200 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-green-600" />
                      </button>
                      <span className="text-sm font-medium text-green-800 min-w-[120px] text-center">
                        {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </span>
                      <button 
                        onClick={() => navigateMonth('next')}
                        className="p-2 hover:bg-green-200 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-green-600" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-green-600 p-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {getCalendarDays().map((day, index) => {
                      const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                      const isSelected = day.toDateString() === selectedDate.toDateString();
                      const isToday = day.toDateString() === new Date().toDateString();
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedDate(day)}
                          className={`p-2 text-sm rounded-lg transition-all ${
                            !isCurrentMonth ? 'text-gray-400' :
                            isSelected ? 'bg-green-600 text-white font-medium' :
                            isToday ? 'bg-green-200 text-green-800 font-medium' :
                            'hover:bg-green-200 text-green-800'
                          }`}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 p-3 bg-white/70 rounded-lg border border-green-300">
                    <p className="text-sm text-green-800">
                      <strong>Selected:</strong> {formatDate(selectedDate)}
                    </p>
                  </div>
                </div>
                
                {/* Time Slots */}
                <div className="bg-white/50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Time Slots</h3>
                  <div className="space-y-3 mb-6">
                    {availableSlots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-800">{slot.time}</span>
                          {slot.booked && (
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                Booked
                              </span>
                              <span className="text-sm text-gray-600">{slot.farmer}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => toggleSlotAvailability(slot.id)}
                          disabled={slot.booked}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            slot.booked ? 'bg-gray-200 text-gray-500 cursor-not-allowed' :
                            slot.available ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                            'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {slot.booked ? 'Booked' : slot.available ? 'Available' : 'Unavailable'}
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Instructions:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Click "Available" to mark time slots when you can assist farmers</li>
                      <li>• Click "Unavailable" to block time slots</li>
                      <li>• Farmers can book available time slots for consultations</li>
                      <li>• Booked slots cannot be modified</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fixed Bottom Button Bar */}
            <div className="bg-white/95 backdrop-blur-md border-t border-gray-200 p-6">
              <div className="flex justify-end space-x-4">
                <button 
                  onClick={() => setShowAvailabilityScheduler(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveAvailability}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Availability</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Unified Scheduling Modal */}
      {showUnifiedScheduler && (
        <div className="fixed inset-0 flex items-center justify-center z-[10000] p-6">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowUnifiedScheduler(false)}
          ></div>
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-300/50 p-8 w-full max-w-6xl max-h-[90vh] overflow-hidden relative z-[10001]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
                  Unified Farm Service Scheduling
                </h2>
              </div>
              <button 
                onClick={() => setShowUnifiedScheduler(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Drone Services */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-xs">🚁</span>
                    </div>
                    Drone Services
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-2">Service Type</label>
                      <select className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                        <option>Crop Monitoring</option>
                        <option>Pest Surveillance</option>
                        <option>Field Mapping</option>
                        <option>Yield Assessment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-2">Field Location</label>
                      <select className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                        <option>Field A12</option>
                        <option>Field B08</option>
                        <option>Field C15</option>
                        <option>Field D22</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-2">Scheduled Date</label>
                      <input 
                        type="date"
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      />
                    </div>
                    <button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all">
                      Schedule Drone Survey
                    </button>
                  </div>
                </div>
                
                {/* Soil Testing */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-xs">🧪</span>
                    </div>
                    Soil Testing
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">Test Type</label>
                      <select className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                        <option>pH Level Analysis</option>
                        <option>Nutrient Assessment</option>
                        <option>Moisture Content</option>
                        <option>Comprehensive Test</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">Farmer</label>
                      <select className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                        <option>Rajesh Kumar</option>
                        <option>Suresh Patel</option>
                        <option>Priya Sharma</option>
                        <option>Amit Singh</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">Scheduled Date</label>
                      <input 
                        type="date"
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                      />
                    </div>
                    <button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all">
                      Schedule Soil Test
                    </button>
                  </div>
                </div>
                
                {/* Other Services */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-xs">⚙️</span>
                    </div>
                    Other Services
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">Service Type</label>
                      <select className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option>Irrigation Setup</option>
                        <option>Pest Control</option>
                        <option>Fertilizer Application</option>
                        <option>Equipment Maintenance</option>
                        <option>Weather Monitoring</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">Priority</label>
                      <select className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option>Normal</option>
                        <option>High</option>
                        <option>Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">Scheduled Date</label>
                      <input 
                        type="date"
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all">
                      Schedule Service
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Scheduled Services Overview */}
              <div className="mt-8 bg-white/70 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Scheduled Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-purple-900">Drone Survey</h4>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Tomorrow</span>
                    </div>
                    <p className="text-sm text-purple-700">Field A12 - Crop Monitoring</p>
                    <p className="text-xs text-purple-600">9:00 AM</p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-green-900">Soil Test</h4>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Feb 3</span>
                    </div>
                    <p className="text-sm text-green-700">Rajesh Kumar - pH Analysis</p>
                    <p className="text-xs text-green-600">10:30 AM</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-blue-900">Irrigation Setup</h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Feb 5</span>
                    </div>
                    <p className="text-sm text-blue-700">Field C15 - System Installation</p>
                    <p className="text-xs text-blue-600">2:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
              <button 
                onClick={() => setShowUnifiedScheduler(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all">
                View All Schedules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
