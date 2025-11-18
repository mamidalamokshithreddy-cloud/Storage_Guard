// Enhanced User Details Modal Component
// This component displays comprehensive registration form data for all user types

import React from 'react';
import { 
  X, User, Mail, Phone, MapPin, Calendar, Users, Star, 
  UserCheck, Clock, FileText, Home, Briefcase, 
  CreditCard, Building, Truck, ShoppingCart, Activity,
  Badge, Award, Globe, Image, Download, Eye
} from 'lucide-react';

interface UserDetailsModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSendVerificationEmail: (user: any) => void;
  onVerifyUser?: (user: any) => void;
  onRejectUser?: (user: any) => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ 
  user, 
  isOpen, 
  onClose, 
  onSendVerificationEmail,
  onVerifyUser,
  onRejectUser 
}) => {
  if (!isOpen || !user) return null;

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get user type specific icon
  const getUserTypeIcon = (userType: string) => {
    switch (userType?.toLowerCase()) {
      case 'farmer':
        return <Activity className="h-5 w-5" />;
      case 'landowner':
        return <Home className="h-5 w-5" />;
      case 'vendor':
        return <Truck className="h-5 w-5" />;
      case 'buyer':
        return <ShoppingCart className="h-5 w-5" />;
      case 'agricopilot':
      case 'agri_copilot':
        return <Award className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  // Helper function to display field value or fallback
  const displayValue = (value: any, fallback: string = 'Not specified') => {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  // Helper function to get value from multiple possible field names
  const getFieldValue = (user: any, fieldNames: string[], fallback: string = 'Not specified') => {
    for (const fieldName of fieldNames) {
      const value = user[fieldName];
      if (value !== null && value !== undefined && value !== '') {
        return typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
      }
    }
    return fallback;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {getUserTypeIcon(user.type || user.user_type)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {displayValue(user.full_name || user.name)}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 capitalize">
                    {getUserTypeIcon(user.type || user.user_type)}
                    <span className="ml-2">{user.type || user.user_type}</span>
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    user.is_verified || user.verification_status === 'approved' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {user.is_verified || user.verification_status === 'approved' ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 mr-1" />
                        Pending Verification
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-8">
          
          {/* Basic Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center mb-2">
                  <User className="h-4 w-4 text-blue-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Full Name</h4>
                </div>
                <p className="text-gray-900 font-semibold">
                  {getFieldValue(user, ['full_name', 'name', 'username', 'first_name'])}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center mb-2">
                  <Mail className="h-4 w-4 text-green-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Email</h4>
                </div>
                <p className="text-gray-900">{displayValue(user.email)}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center mb-2">
                  <Phone className="h-4 w-4 text-purple-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Phone Number</h4>
                </div>
                <p className="text-gray-900">
                  {getFieldValue(user, ['phone', 'phone_number', 'mobile', 'mobile_number'])}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                <div className="flex items-center mb-2">
                  <CreditCard className="h-4 w-4 text-yellow-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Aadhar Number</h4>
                </div>
                <p className="text-gray-900 font-mono">
                  {getFieldValue(user, ['aadhar_number', 'aadharnumber', 'aadhar', 'adhaar_number'])}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                <div className="flex items-center mb-2">
                  <Calendar className="h-4 w-4 text-red-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Registration Date</h4>
                </div>
                <p className="text-gray-900 text-sm">{formatDate(user.created_at || user.date)}</p>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
                <div className="flex items-center mb-2">
                  <Badge className="h-4 w-4 text-indigo-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Custom ID</h4>
                </div>
                <p className="text-gray-900 font-mono">{displayValue(user.custom_id || user.id)}</p>
              </div>
            </div>
          </div>

          {/* Location Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-600" />
              Location Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
                <div className="flex items-center mb-2">
                  <Globe className="h-4 w-4 text-emerald-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Country</h4>
                </div>
                <p className="text-gray-900">{getFieldValue(user, ['country'], 'India')}</p>
              </div>
              
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl border border-teal-200">
                <div className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 text-teal-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">State</h4>
                </div>
                <p className="text-gray-900">{getFieldValue(user, ['state'])}</p>
              </div>
              
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-xl border border-cyan-200">
                <div className="flex items-center mb-2">
                  <Building className="h-4 w-4 text-cyan-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">City/District</h4>
                </div>
                <p className="text-gray-900">{getFieldValue(user, ['city', 'district'])}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 text-purple-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Mandal</h4>
                </div>
                <p className="text-gray-900">{getFieldValue(user, ['mandal'])}</p>
              </div>
              
              <div className="bg-gradient-to-br from-sky-50 to-sky-100 p-4 rounded-xl border border-sky-200">
                <div className="flex items-center mb-2">
                  <Home className="h-4 w-4 text-sky-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Postal Code</h4>
                </div>
                <p className="text-gray-900">{getFieldValue(user, ['postal_code', 'pincode'])}</p>
              </div>
            </div>

            {/* Address Information */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center mb-2">
                  <Home className="h-4 w-4 text-blue-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Address Line 1</h4>
                </div>
                <p className="text-gray-900">{getFieldValue(user, ['address_line1', 'address'])}</p>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
                <div className="flex items-center mb-2">
                  <Home className="h-4 w-4 text-indigo-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Address Line 2</h4>
                </div>
                <p className="text-gray-900">{getFieldValue(user, ['address_line2'])}</p>
              </div>
            </div>
          </div>

          {/* User Type Specific Information */}
          {user.type === 'farmer' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                Farmer Specific Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Farm Size</h4>
                  <p className="text-gray-900">{displayValue(user.farm_size)}</p>
                </div>
                <div className="bg-gradient-to-br from-lime-50 to-lime-100 p-4 rounded-xl border border-lime-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Primary Crops</h4>
                  <p className="text-gray-900">{displayValue(user.primary_crops)}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Farming Experience</h4>
                  <p className="text-gray-900">{displayValue(user.farming_experience)} years</p>
                </div>
              </div>
            </div>
          )}

          {/* Document Upload Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-purple-600" />
              Document Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Photo */}
              <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-6 rounded-xl border border-violet-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Image className="h-5 w-5 text-violet-600 mr-2" />
                    <h4 className="text-md font-medium text-gray-700">Profile Photo</h4>
                  </div>
                  {getFieldValue(user, ['photo_url', 'profile_picture', 'photo'], '') !== 'Not specified' && (
                    <a 
                      href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}${getFieldValue(user, ['photo_url', 'profile_picture', 'photo'])}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-600 hover:text-violet-800"
                    >
                      <Eye className="h-5 w-5" />
                    </a>
                  )}
                </div>
                {getFieldValue(user, ['photo_url', 'profile_picture', 'photo'], '') !== 'Not specified' ? (
                  <div className="text-center">
                    <img 
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}${getFieldValue(user, ['photo_url', 'profile_picture', 'photo'])}`}
                      alt="Profile Photo"
                      className="w-full max-h-60 object-contain rounded-lg shadow-md bg-white"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) nextElement.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-sm text-gray-500 mt-3 p-4 bg-gray-100 rounded-lg">Image failed to load</div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No photo uploaded</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Aadhar Front */}
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-xl border border-pink-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-pink-600 mr-2" />
                    <h4 className="text-md font-medium text-gray-700">Aadhar Document</h4>
                  </div>
                  {getFieldValue(user, ['aadhar_front_url', 'aadharfront', 'aadhar_front'], '') !== 'Not specified' && (
                    <a 
                      href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}${getFieldValue(user, ['aadhar_front_url', 'aadharfront', 'aadhar_front'])}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-800"
                    >
                      <Eye className="h-5 w-5" />
                    </a>
                  )}
                </div>
                {getFieldValue(user, ['aadhar_front_url', 'aadharfront', 'aadhar_front'], '') !== 'Not specified' ? (
                  <div className="text-center">
                    <img 
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}${getFieldValue(user, ['aadhar_front_url', 'aadharfront', 'aadhar_front'])}`}
                      alt="Aadhar Document"
                      className="w-full max-h-60 object-contain rounded-lg shadow-md bg-white"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) nextElement.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-sm text-gray-500 mt-3 p-4 bg-gray-100 rounded-lg">Image failed to load</div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No document uploaded</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Registration Fields */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-indigo-600" />
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(user).filter(key => 
                !['id', 'custom_id', 'full_name', 'name', 'email', 'phone', 'phone_number', 
                  'aadhar_number', 'aadharnumber', 'aadhar', 'adhaar_number', 'state', 'district', 'mandal', 'village', 'created_at', 
                  'date', 'photo_url', 'profile_picture', 'photo', 'aadhar_front_url', 'aadharfront', 'aadhar_front',
                  'aadhar_back_url', 'aadharback', 'aadhar_back', 'is_verified', 
                  'verification_status', 'type', 'user_type', 'country', 'city', 'address_line1', 'address_line2', 
                  'address', 'postal_code', 'pincode', 'location'].includes(key)
              ).map(key => (
                <div key={key} className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-gray-900 text-sm">{displayValue(user[key])}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-gray-50 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 space-x-0 sm:space-x-4 rounded-b-2xl">
          <div className="text-sm text-gray-600">
            Last updated: {formatDate(user.updated_at || user.created_at || user.date)}
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center"
              onClick={() => onSendVerificationEmail(user)}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </button>
            {(!user.is_verified && user.verification_status !== 'approved') && (onVerifyUser || onRejectUser) && (
              <div className="flex space-x-2">
                {onRejectUser && (
                  <button
                    type="button"
                    className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors flex items-center"
                    onClick={() => {
                      if (confirm('Are you sure you want to reject this user?')) {
                        onRejectUser(user);
                      }
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                )}
                {onVerifyUser && (
                  <button
                    type="button"
                    className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors flex items-center"
                    onClick={() => onVerifyUser(user)}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Verify
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;