'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/app/admin/components/ProtectedRoute';
import { 
  Home, 
  Sprout, 
  TestTube, 
  Eye, 
  Users, 
  ShoppingCart,
  BarChart3,
  Bell,
  Calendar,
  MapPin,
  Settings,
  User,
  Menu,
  X,
  Activity
} from 'lucide-react';
import Topbar from '@/app/admin/components/Topbar';

// Import all the module components
import Dashboard from './Dashboard';
import FarmPlanningManagement from './Farm Planning Management';

import VendorCoordinationCenter from './Vendor Coordination Center';



const AgriCopilotMain = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock notifications data for AgriCopilot
  const notifications = [
    { id: '1', message: 'New farmer allocation request received', time: '5 min ago', userType: 'AgriCopilot', type: 'allocation', read: false },
    { id: '2', message: 'Vendor coordination meeting scheduled', time: '1 hour ago', userType: 'AgriCopilot', type: 'meeting', read: false },
    { id: '3', message: 'Farm planning report generated', time: '3 hours ago', userType: 'AgriCopilot', type: 'report', read: true },
  ];

  const handleLogout = () => {
    // Handle logout logic for AgriCopilot
    console.log('AgriCopilot logout');
    
    // Clear any stored authentication data
    localStorage.removeItem('userToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Redirect to login page or home
    window.location.href = '/';
  };

  const modules = [
    {
      id: 'dashboard',
      name: 'AgriPilot Dashboard',
      teluguName: 'అగ్రిపైలట్ డ్యాష్‌బోర్డ్',
      icon: Home,
      component: Dashboard,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Real-time farm monitoring and alerts'
    },
    {
      id: 'farm-planning',
      name: 'Farm Planning & Management',
      teluguName: 'వ్యవసాయ ప్రణాళిక మరియు నిర్వహణ',
      icon: Calendar,
      component: FarmPlanningManagement,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Crop season planning and resource management'
    },
    
    
    
    {
      id: 'vendor-coordination',
      name: 'Vendor Coordination Center',
      teluguName: 'విక్రేత సమన్వయ కేంద్రం',
      icon: Users,
      component: VendorCoordinationCenter,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'RFQ management and vendor services'
    },
    
  ];

  const currentModule = modules.find(module => module.id === activeModule);
  const CurrentComponent = currentModule?.component || Dashboard;

  const handleModuleChange = (moduleId: string) => {
    setActiveModule(moduleId);
    setSidebarOpen(false);
  };

  return (
    <ProtectedRoute requiredRole="agricopilot">
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Global Topbar */}
      <Topbar
        userName="AgriSaarathi"
        userEmail="agrisaarathi@agrihub.com"
        userType="AgriCopilot"
        notifications={notifications}
        onLogout={handleLogout}
      />
      
      {/* Sidebar */}
      <div className={`fixed top-16 left-0 bottom-0 z-30 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>
        
        {/* Navigation Menu - Scrollable */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-4 py-6 mt-10">
          <div className="space-y-2">
            {modules.map((module) => {
              const IconComponent = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => handleModuleChange(module.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                    activeModule === module.id
                      ? `${module.bgColor} ${module.color} border-l-4 border-current`
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{module.name}</p>
                    <p className="text-xs text-blue-600 font-medium truncate">{module.teluguName}</p>
                    <p className="text-xs text-gray-500 truncate">{module.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-green-600" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">AgriSaarathi</p>
              <p className="text-xs text-gray-500">कृषि सारथी</p>
            </div>
            <Settings className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0 pt-16 z-20">
        {/* Mobile Menu Button */}
        <div className="lg:hidden bg-white border-b px-4 py-2 z-25">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-green-600 p-2 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentModule?.name}
            </h1>
            <div className="w-10"></div> {/* Spacer for alignment */}
          </div>
        </div>

        {/* Module Content */}
        <main className="flex-1 overflow-auto relative z-10">
            <CurrentComponent />
        </main>
      </div>

      {/* Sidebar Backdrop (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
    </ProtectedRoute>
  );
};

export default AgriCopilotMain;