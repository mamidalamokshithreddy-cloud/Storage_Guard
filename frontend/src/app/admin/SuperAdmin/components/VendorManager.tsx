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
import { Vendor, ManagerProps, API_BASE_URL } from './types';

interface VendorManagerProps extends ManagerProps {
  onAddEmployee?: () => void;
  filterStatus?: 'approved' | 'pending' | 'all';
}

const VendorManager: React.FC<VendorManagerProps> = ({
  onUpdateStatus,
  onViewDetails,
  loading,
  onAddEmployee,
  filterStatus = 'approved'
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch vendors data
  const fetchVendors = async () => {
    try {
      setLocalLoading(true);
      setError(null);
      console.log('Fetching Vendors from:', `${API_BASE_URL}/admin/vendors`);
      
      const res = await fetch(`${API_BASE_URL}/admin/vendors`);
      if (!res.ok) throw new Error(`Failed to fetch vendors: ${res.status}`);
      
      const data = await res.json();
      setVendors(data);
      console.log('✅ Fetched vendors:', data.length);
      
      // Debug: Log first vendor's data to check document URLs
      if (data.length > 0) {
        console.log('📊 First vendor data:', {
          name: data[0].full_name || data[0].name,
          email: data[0].email,
          aadhar_number: data[0].aadhar_number,
          photo_url: data[0].photo_url,
          aadhar_front_url: data[0].aadhar_front_url,
          verification_status: data[0].verification_status
        });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch vendors';
      setError(errorMessage);
      console.error('❌ Error fetching vendors:', e);
      setVendors([]);
    } finally {
      setLocalLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchVendors();
  }, []);

  const handleViewDetails = (vendor: Vendor) => {
    console.log('👁️ Viewing Vendor details:', {
      name: vendor.full_name,
      email: vendor.email,
      aadhar_number: vendor.aadhar_number,
      verification_status: vendor.verification_status
    });
    onViewDetails(vendor);
  };

  const currentLoading = loading || localLoading;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Vendor Management</h2>
        <p className="mt-1 text-sm text-gray-500">Manage vendor registrations and product verification</p>
      </div>

      <div className="p-6">
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchVendors}
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
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {currentLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Loading Vendors...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg">
            <div className="mb-2">⚠️ Error loading data</div>
            <div className="text-sm">{error}</div>
            <button 
              onClick={fetchVendors} 
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Retry
            </button>
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-lg font-medium">No Vendors found</div>
            <div className="text-sm mt-1">Start by registering your first vendor</div>
            <button 
              onClick={fetchVendors}
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
                {vendors
                  .filter(vendor => {
                    if (filterStatus === 'all') return true;
                    const status = vendor.verification_status || 'pending';
                    return status === filterStatus;
                  })
                  .map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                      <div className="flex items-center">
                        {vendor.photo_url ? (
                          <img 
                            src={`${API_BASE_URL.replace('/admin','')}${vendor.photo_url}`} 
                            alt="" 
                            className="h-10 w-10 rounded-full object-cover" 
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{vendor.full_name}</div>
                          <div className="text-gray-500 text-sm">{vendor.custom_id || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{vendor.email}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {vendor.phone || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {vendor.location || `${vendor.city || 'N/A'}, ${vendor.state || 'N/A'}`}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        vendor.verification_status === 'approved' || vendor.verification_status === 'verified' ? 'bg-green-100 text-green-800' : 
                        vendor.verification_status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {vendor.verification_status.charAt(0).toUpperCase() + vendor.verification_status.slice(1)}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button 
                        onClick={() => handleViewDetails(vendor)} 
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

export default VendorManager;