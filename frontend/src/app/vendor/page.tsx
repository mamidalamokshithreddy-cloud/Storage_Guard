'use client';

import { useState } from 'react';
import { FiHome, FiShoppingBag, FiUsers, FiTruck, FiCreditCard, FiBarChart2, FiInbox } from 'react-icons/fi';
import Topbar from '@/app/admin/components/Topbar';
import ProtectedRoute from '@/app/admin/components/ProtectedRoute';
import { clearAuth } from '@/lib/auth';

// Import all dashboard components
import Dashboard from './dashboard';
import Products from './Products';
import Customers from './customers';
import Orders from './orders';
import Payments from './payments';
import PerformanceAnalysis from './performanceanalysis';
import Requests from './requests';

type ActiveView = 'dashboard' | 'products' | 'customers' | 'orders' | 'payments' | 'performance' | 'requests';

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  const handleNavigation = (view: ActiveView) => {
    setActiveView(view);
  };

  // Mock notifications data for Topbar
  const notifications = [
    { id: '1', message: 'New order #1234 has been placed', time: '2 min ago', userType: 'Vendor', type: 'order', read: false },
    { id: '2', message: 'Payment received from John Doe', time: '1 hour ago', userType: 'Vendor', type: 'payment', read: false },
    { id: '3', message: 'Your product has been approved', time: '5 hours ago', userType: 'Vendor', type: 'approval', read: true },
  ];

  const handleLogout = () => {
    // Handle logout logic for Vendor with tab isolation
    console.log('Vendor logout');
    
    // Clear authentication data with tab isolation
    clearAuth();
    
    // Redirect to login page or home
    window.location.href = '/';
  };

  // Render the active component based on the current view
  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <Products />;
      case 'customers':
        return <Customers />;
      case 'orders':
        return <Orders />;
      case 'payments':
        return <Payments />;
      case 'performance':
        return <PerformanceAnalysis />;
      case 'requests':
        return <Requests />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ProtectedRoute requiredRole="vendor">
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <div className="flex items-center">
            <img 
              src="/images.png" 
              alt="Agrihub Logo" 
              className="w-8 h-8 mr-2 rounded-md"
            />
            <h1 className="text-xl font-semibold">Agrihub</h1>
          </div>
          {/* <div className="text-blue-600 text-sm ml-10">అగ్రిహబ్</div> */}
        </div>
        <nav className="mt-4">
          {[
            { id: 'dashboard', label: 'Dashboard', telugu: 'డాష్‌బోర్డ్', icon: <FiHome className="w-5 h-5" /> },
            { id: 'products', label: 'Products', telugu: 'ఉత్పత్తులు', icon: <FiShoppingBag className="w-5 h-5" /> },
            { id: 'customers', label: 'Customers', telugu: 'కస్టమర్లు', icon: <FiUsers className="w-5 h-5" /> },
            { id: 'payments', label: 'Payments', telugu: 'చెల్లింపులు', icon: <FiCreditCard className="w-5 h-5" /> },
            { id: 'orders', label: 'Orders Tracking', telugu: 'ఆర్డర్ల ట్రాకింగ్', icon: <FiTruck className="w-5 h-5" /> },
            { id: 'requests', label: 'Requests', telugu: 'అభ్యర్థనలు', icon: <FiInbox className="w-5 h-5" /> },
            { id: 'performance', label: 'Performance', telugu: 'పనితీరు', icon: <FiBarChart2 className="w-5 h-5" /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id as ActiveView)}
              className={`flex items-center w-full px-4 py-3 text-left ${
                activeView === item.id
                  ? 'bg-green-50 text-green-600 border-r-4 border-green-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-green-600'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span className="flex flex-col">
                <span>{item.label}</span>
                <span className="text-blue-600 text-xs">{item.telugu}</span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Global Topbar */}
        <Topbar
          userName="Vendor User"
          userEmail="vendor@agrihub.com"
          userType="Vendor"
          notifications={notifications}
          onLogout={handleLogout}
        />
        
        {/* Page Title */}
        <div className="bg-white border-b px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-800 capitalize">
            {activeView}
          </h1>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {renderActiveView()}
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}