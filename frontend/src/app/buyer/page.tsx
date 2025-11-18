'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, TrendingDown, Truck, Settings, LogOut, Star, Users } from 'lucide-react';
import ProtectedRoute from '@/app/admin/components/ProtectedRoute';
import Topbar from '@/app/admin/components/Topbar';

export default function BuyerDashboard() {
  const router = useRouter();

  // Mock notifications data for Buyer
  const notifications = [
    { id: '1', message: 'New organic products available from Farm Fresh Co.', time: '10 min ago', userType: 'Buyer', type: 'product', read: false },
    { id: '2', message: 'Your order #5678 has been shipped', time: '2 hours ago', userType: 'Buyer', type: 'shipping', read: false },
    { id: '3', message: 'Price drop alert: Rice prices decreased by 5%', time: '6 hours ago', userType: 'Buyer', type: 'price', read: true },
  ];

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user');
    
    // Redirect to home
    router.push('/');
  };

  return (
    <ProtectedRoute requiredRole="buyer">
    <div className="min-h-screen bg-gray-50">
      {/* Global Topbar */}
      <Topbar
        userName="Buyer User"
        userEmail="buyer@agrihub.com"
        userType="Buyer"
        notifications={notifications}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-xl shadow-md">
              <ShoppingBag className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome, Buyer!</h1>
              <p className="text-gray-600 text-lg mt-1">
                Source quality agricultural products directly from farmers and landowners
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Orders */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-indigo-600">28</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <ShoppingBag className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Trusted Suppliers */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trusted Suppliers</p>
                <p className="text-2xl font-bold text-green-600">45</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Monthly Savings */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Savings</p>
                <p className="text-2xl font-bold text-green-600">₹1,25,000</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingDown className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Avg. Quality Rating */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Quality Rating</p>
                <p className="text-2xl font-bold text-yellow-600">4.7/5</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-100 p-3 rounded-full">
                <Search className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Browse Products</h3>
                <p className="text-sm text-gray-600">Discover quality agricultural products</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Supplier Network</h3>
                <p className="text-sm text-gray-600">Connect with verified farmers</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Track Orders</h3>
                <p className="text-sm text-gray-600">Monitor your shipments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <Settings className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Buyer Portal Platform</h2>
            <p className="text-gray-600">
              Your comprehensive sourcing platform is under development.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Coming Soon Features:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Advanced product search & filters</li>
                <li>• Real-time price comparisons</li>
                <li>• Quality certification tracking</li>
                <li>• Bulk order management</li>
              </ul>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Direct farmer communication</li>
                <li>• Contract farming options</li>
                <li>• Logistics integration</li>
                <li>• Payment escrow services</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}