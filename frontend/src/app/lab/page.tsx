'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Microscope, TestTube, FileText, Settings, LogOut, TrendingUp } from 'lucide-react';
import ProtectedRoute from '@/app/admin/components/ProtectedRoute';

export default function LabDashboard() {
  const router = useRouter();

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
    <ProtectedRoute requiredRole="lab">
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <header className="fixed top-0 w-full bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AH</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">AgriHub</span>
              </div>
              <div className="hidden md:block h-6 w-px bg-gray-300"></div>
              <span className="hidden md:block text-gray-600">Laboratory Portal</span>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="flex items-center space-x-2">
                <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Microscope className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <TestTube className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <FileText className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="hidden md:block text-sm font-medium">Lab User</span>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <TrendingUp className="w-4 h-4 mr-3" />
                    Profile
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </button>
                  <div className="border-t border-gray-100"></div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-xl shadow-md">
              <Microscope className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome to Lab Portal!</h1>
              <p className="text-gray-600 text-lg mt-1">
                Agricultural testing and analysis platform
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Pending Tests */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Tests</p>
                <p className="text-2xl font-bold text-orange-600">15</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TestTube className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Completed Tests */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Tests</p>
                <p className="text-2xl font-bold text-green-600">142</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Reports Generated */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reports Generated</p>
                <p className="text-2xl font-bold text-blue-600">89</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <Settings className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Laboratory Management System</h2>
            <p className="text-gray-600">
              Your comprehensive laboratory management platform is under development.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Coming Soon Features:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Sample tracking system</li>
                <li>• Test result management</li>
                <li>• Report generation</li>
                <li>• Quality control metrics</li>
              </ul>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Equipment calibration logs</li>
                <li>• Client communication portal</li>
                <li>• Data analytics dashboard</li>
                <li>• Compliance reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}