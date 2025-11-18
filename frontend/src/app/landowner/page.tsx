'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, TrendingUp, DollarSign, Users, Settings, BarChart3, Smartphone } from 'lucide-react';
import ProtectedRoute from '@/app/admin/components/ProtectedRoute';
import Topbar from '@/app/admin/components/Topbar';
import { clearAuth } from '@/lib/auth';

export default function LandownerDashboard() {
  const router = useRouter();

  // Mock notifications data for Landowner
  const notifications = [
    { id: '1', message: 'New lease agreement proposal received', time: '20 min ago', userType: 'Landowner', type: 'lease', read: false },
    { id: '2', message: 'Property valuation report is ready', time: '2 hours ago', userType: 'Landowner', type: 'valuation', read: false },
    { id: '3', message: 'Monthly rental payment received', time: '1 day ago', userType: 'Landowner', type: 'payment', read: true },
  ];

  const handleLogout = () => {
    // Clear authentication data with tab isolation
    clearAuth();
    
    // Redirect to home
    router.push('/');
  };

  return (
    <ProtectedRoute requiredRole="landowner">
    <div className="min-h-screen bg-gray-50">
      {/* Global Topbar */}
      <Topbar
        notifications={notifications}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-xl shadow-md">
              <MapPin className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome, Landowner!</h1>
              <p className="text-gray-600 text-lg mt-1">
                Remotely manage your agricultural land and maximize returns through technology
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Land Area */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Land Area</p>
                <p className="text-2xl font-bold text-emerald-600">245 Acres</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <MapPin className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Active Farmers */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Farmers</p>
                <p className="text-2xl font-bold text-blue-600">18</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹2,45,000</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* ROI Growth */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ROI Growth</p>
                <p className="text-2xl font-bold text-purple-600">+12.5%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-100 p-3 rounded-full">
                <Smartphone className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Remote Monitoring</h3>
                <p className="text-sm text-gray-600">Track your land activities in real-time</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Analytics Dashboard</h3>
                <p className="text-sm text-gray-600">View detailed performance metrics</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Revenue Management</h3>
                <p className="text-sm text-gray-600">Optimize returns and track income</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-4">
              <Settings className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Landowner Management Portal</h2>
            <p className="text-gray-600">
              Your comprehensive land management platform is under development.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Coming Soon Features:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Remote land monitoring via IoT sensors</li>
                <li>• Automated lease management</li>
                <li>• Real-time crop progress tracking</li>
                <li>• Revenue optimization analytics</li>
              </ul>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Farmer performance dashboards</li>
                <li>• Contract management system</li>
                <li>• Satellite imagery integration</li>
                <li>• Financial reporting tools</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}