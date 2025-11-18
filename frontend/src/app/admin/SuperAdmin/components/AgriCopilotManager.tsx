"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Users, 
  User, 
  ChevronRight, 
  Search 
} from 'lucide-react';
import AgriCopilotTable from '../../components/AgriCopilotTable';
import { AgriCopilot, ManagerProps, API_BASE_URL } from './types';

interface AgriCopilotManagerProps extends ManagerProps {
  onAddEmployee?: () => void;
  filterStatus?: 'approved' | 'pending' | 'all';
}

const AgriCopilotManager: React.FC<AgriCopilotManagerProps> = ({
  onUpdateStatus,
  onViewDetails,
  loading,
  onAddEmployee,
  filterStatus = 'approved'
}) => {
  const [copilots, setCopilots] = useState<AgriCopilot[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch copilots data
  const fetchCopilots = async () => {
    try {
      setLocalLoading(true);
      setError(null);
      console.log('Fetching AgriCopilots from:', `${API_BASE_URL}/admin/agri-copilots`);
      
      const response = await fetch(`${API_BASE_URL}/admin/agri-copilots`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch copilots: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched copilots data:', data);
      setCopilots(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch copilots';
      setError(errorMessage);
      console.error('Error fetching copilots:', err);
    } finally {
      setLocalLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchCopilots();
  }, []);

  const handleViewDetails = (copilot: AgriCopilot) => {
    console.log('👁️ Viewing AgriCopilot details:', {
      name: copilot.full_name,
      email: copilot.email,
      aadhar_number: copilot.aadhar_number,
      verification_status: copilot.verification_status
    });
    onViewDetails(copilot);
  };

  const currentLoading = loading || localLoading;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">AgriCopilot Management</h2>
        <p className="mt-1 text-sm text-gray-500">Manage AgriCopilot registrations and activities</p>
      </div>

      <div className="p-6">
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchCopilots}
              disabled={currentLoading}
              className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
            >
              {currentLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {currentLoading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>

          <div className="flex gap-4">
            {onAddEmployee && (
              <button
                onClick={onAddEmployee}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {currentLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-600">Loading AgriCopilots...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg">
            <div className="mb-2">⚠️ Error loading data</div>
            <div className="text-sm">{error}</div>
            <button 
              onClick={fetchCopilots} 
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Retry
            </button>
          </div>
        ) : copilots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-lg font-medium">No AgriCopilots found</div>
            <div className="text-sm mt-1">Start by adding your first AgriCopilot employee</div>
            <button 
              onClick={fetchCopilots}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Refresh Data
            </button>
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    NAME
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                      EMAIL
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                      </svg>
                      PHONE
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      LOCATION
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                      </svg>
                      STATUS
                    </div>
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-gray-900">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {copilots
                  .filter(copilot => {
                    if (filterStatus === 'all') return true;
                    const status = copilot.verification_status || 'pending';
                    return status === filterStatus;
                  })
                  .map((copilot) => (
                  <tr key={copilot.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                      <div className="flex items-center">
                        {copilot.photo_url ? (
                          <img 
                            src={`${API_BASE_URL.replace('/admin','')}${copilot.photo_url}`} 
                            alt="" 
                            className="h-10 w-10 rounded-full object-cover" 
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{copilot.full_name}</div>
                          <div className="text-gray-500 text-sm">{copilot.custom_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{copilot.email}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{copilot.phone}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {copilot.location || copilot.city || copilot.state || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        copilot.verification_status === 'approved' ? 'bg-green-100 text-green-800' : 
                        copilot.verification_status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {copilot.verification_status.charAt(0).toUpperCase() + copilot.verification_status.slice(1)}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button 
                        onClick={() => handleViewDetails(copilot)} 
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                      >
                        View
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgriCopilotManager;