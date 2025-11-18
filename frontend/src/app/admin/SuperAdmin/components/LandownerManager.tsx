"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Users, 
  User, 
  ChevronRight, 
  Search,
  Mail,
  Phone,
  MapPin,
  Star
} from 'lucide-react';
import { Landowner, ManagerProps, API_BASE_URL } from './types';

interface LandownerManagerProps extends ManagerProps {
  onAddEmployee?: () => void;
  filterStatus?: 'approved' | 'pending' | 'all';
}

const LandownerManager: React.FC<LandownerManagerProps> = ({
  onUpdateStatus,
  onViewDetails,
  loading,
  onAddEmployee,
  filterStatus = 'approved'
}) => {
  const [landowners, setLandowners] = useState<Landowner[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch landowners data
  const fetchLandowners = async () => {
    try {
      setLocalLoading(true);
      setError(null);
      console.log('Fetching Landowners from:', `${API_BASE_URL}/admin/landowners`);
      
      const res = await fetch(`${API_BASE_URL}/admin/landowners`);
      if (!res.ok) throw new Error(`Failed to fetch landowners: ${res.status}`);
      
      const data = await res.json();
      setLandowners(data);
      console.log('✅ Fetched landowners:', data.length);
      
      // Debug: Log first landowner's data to check document URLs
      if (data.length > 0) {
        console.log('📊 First landowner data:', {
          name: data[0].full_name || data[0].name,
          email: data[0].email,
          aadhar_number: data[0].aadhar_number,
          photo_url: data[0].photo_url,
          aadhar_front_url: data[0].aadhar_front_url,
          verification_status: data[0].verification_status
        });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch landowners';
      setError(errorMessage);
      console.error('❌ Error fetching landowners:', e);
      setLandowners([]);
    } finally {
      setLocalLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchLandowners();
  }, []);

  const handleViewDetails = (landowner: Landowner) => {
    console.log('👁️ Viewing Landowner details:', {
      name: landowner.full_name,
      email: landowner.email,
      aadhar_number: landowner.aadhar_number,
      verification_status: landowner.verification_status
    });
    onViewDetails(landowner);
  };

  const currentLoading = loading || localLoading;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Landowner Management</h2>
        <p className="mt-1 text-sm text-gray-500">Manage landowner registrations and property verification</p>
      </div>

      <div className="p-6">
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchLandowners}
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
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Landowner
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {currentLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
            <span className="ml-2 text-gray-600">Loading Landowners...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg">
            <div className="mb-2">⚠️ Error loading data</div>
            <div className="text-sm">{error}</div>
            <button 
              onClick={fetchLandowners} 
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Retry
            </button>
          </div>
        ) : landowners.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-lg font-medium">No Landowners found</div>
            <div className="text-sm mt-1">Start by adding your first landowner</div>
            <button 
              onClick={fetchLandowners}
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
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>NAME</span>
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>EMAIL</span>
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>PHONE</span>
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>LOCATION</span>
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4" />
                      <span>STATUS</span>
                    </div>
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-gray-900">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {landowners
                  .filter(landowner => {
                    if (filterStatus === 'all') return true;
                    const status = landowner.verification_status || 'pending';
                    return status === filterStatus;
                  })
                  .map((landowner) => (
                  <tr key={landowner.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                      <div className="flex items-center">
                        {landowner.photo_url ? (
                          <img 
                            src={`${API_BASE_URL.replace('/admin','')}${landowner.photo_url}`} 
                            alt="" 
                            className="h-10 w-10 rounded-full object-cover" 
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{landowner.full_name}</div>
                          <div className="text-gray-500 text-sm">{landowner.custom_id || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{landowner.email}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {landowner.phone || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {landowner.location || `${landowner.city || 'N/A'}, ${landowner.state || 'N/A'}`}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        landowner.verification_status === 'approved' || landowner.verification_status === 'verified' ? 'bg-green-100 text-green-800' : 
                        landowner.verification_status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {landowner.verification_status.charAt(0).toUpperCase() + landowner.verification_status.slice(1)}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button 
                        onClick={() => handleViewDetails(landowner)} 
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

export default LandownerManager;