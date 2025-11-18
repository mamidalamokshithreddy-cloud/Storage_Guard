import React from 'react';
import { format } from 'date-fns';
import { User, ChevronRight, Mail, Phone, MapPin, Star } from 'lucide-react';

interface AgriCopilotTableProps {
  copilots: Array<{
    id: string;
    custom_id: string;
    full_name: string;
    email: string;
    phone: string;
    aadhar_number: string;
    is_verified: boolean;
    verification_status: string;
    created_at: string;
    photo_url?: string;
    location?: string;
    state?: string;
    district?: string;
  }>;
  onViewDetails: (copilot: any) => void;
  loading: boolean;
  error: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const AgriCopilotTable: React.FC<AgriCopilotTableProps> = ({
  copilots,
  onViewDetails,
  loading,
  error
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        {error}
      </div>
    );
  }

  if (copilots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No AgriCoPilots found
      </div>
    );
  }

  return (
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
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {copilots.map((copilot) => (
            <tr key={copilot.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                <div className="flex items-center">
                  {copilot.photo_url ? (
                    <img 
                      src={`${API_BASE_URL}${copilot.photo_url}`}
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
                    <div className="text-gray-500">{copilot.custom_id}</div>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {copilot.email}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {copilot.phone || 'N/A'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {copilot.state && copilot.district 
                  ? `${copilot.district}, ${copilot.state}`
                  : copilot.location || copilot.state || copilot.district || 'N/A'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                  ${copilot.verification_status === 'approved' ? 'bg-green-100 text-green-800' : 
                    copilot.verification_status === 'rejected' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'}`}
                >
                  {copilot.verification_status.charAt(0).toUpperCase() + copilot.verification_status.slice(1)}
                </span>
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button
                  onClick={() => onViewDetails(copilot)}
                  className="text-blue-600 hover:text-blue-900 inline-flex items-center"
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
  );
};

export default AgriCopilotTable;