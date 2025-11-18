'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <img 
            src="/title logo.jpg" 
            alt="AgriHub" 
            className="h-16 w-auto"
          />
        </div>

        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="mx-auto w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-6xl font-bold text-gray-800 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        </div>

        {/* Error Message */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <p className="text-gray-600 mb-4">
            Sorry, the page you're looking for doesn't exist or you don't have permission to access it.
          </p>
          <div className="text-sm text-gray-500">
            <p>This could be because:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-left">
              <li>The URL was entered incorrectly</li> 
              <li>The page has been moved or deleted</li>
              <li>You don't have the required permissions</li>
              <li>Your session has expired</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Homepage
          </button>
        </div>

        {/* Support Link */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help? {' '}
            <a 
              href="mailto:support@agrihub.com" 
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}