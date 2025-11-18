'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Truck, Shield, Settings, LogOut, Star, MapPin } from 'lucide-react';
import Topbar from '@/app/admin/components/Topbar';
import ProtectedRoute from '@/app/admin/components/ProtectedRoute';

export default function ConsumerDashboard() {
  const router = useRouter();

  // Mock notifications data for Consumer
  const notifications = [
    { id: '1', message: 'Your organic vegetable order is out for delivery', time: '30 min ago', userType: 'Consumer', type: 'delivery', read: false },
    { id: '2', message: 'New seasonal fruits available from Farm Fresh', time: '3 hours ago', userType: 'Consumer', type: 'products', read: false },
    { id: '3', message: 'Thank you for your review! 5-star rating received', time: '1 day ago', userType: 'Consumer', type: 'review', read: true },
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
    <ProtectedRoute requiredRole="consumer">
    <div className="min-h-screen bg-gray-50">
      {/* Global Topbar */}
      <Topbar
        userName="Consumer User"
        userEmail="consumer@agrihub.com"
        userType="Consumer"
        notifications={notifications}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-4 rounded-xl shadow-md">
              <ShoppingCart className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome, Consumer!</h1>
              <p className="text-gray-600 text-lg mt-1">
                Access fresh, quality agricultural products directly from verified sources
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recent Orders</p>
                <p className="text-2xl font-bold text-pink-600">12</p>
              </div>
              <div className="bg-pink-100 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </div>

          {/* Favorite Products */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Favorite Products</p>
                <p className="text-2xl font-bold text-red-600">38</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Monthly Savings */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Savings</p>
                <p className="text-2xl font-bold text-green-600">₹3,200</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Delivery Rating */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivery Rating</p>
                <p className="text-2xl font-bold text-yellow-600">4.9/5</p>
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
              <div className="bg-pink-100 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Shop Fresh Products</h3>
                <p className="text-sm text-gray-600">Browse organic and fresh produce</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Local Farmers</h3>
                <p className="text-sm text-gray-600">Connect with farmers near you</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Track Deliveries</h3>
                <p className="text-sm text-gray-600">Monitor your order status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mb-4">
              <Settings className="w-10 h-10 text-pink-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Consumer Marketplace</h2>
            <p className="text-gray-600">
              Your direct-to-consumer agricultural marketplace is under development.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-6 border border-pink-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Coming Soon Features:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Fresh produce delivery service</li>
                <li>• Farm-to-table traceability</li>
                <li>• Subscription boxes</li>
                <li>• Quality assurance guarantee</li>
              </ul>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Local farmer discovery</li>
                <li>• Recipe suggestions</li>
                <li>• Seasonal product alerts</li>
                <li>• Community reviews & ratings</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}