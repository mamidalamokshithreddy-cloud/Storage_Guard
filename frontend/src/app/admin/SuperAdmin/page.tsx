"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
// Import modular components - this keeps our code organized
import {
  AgriCopilotManager,
  FarmerManager,
  LandownerManager,
  VendorManager,
  BuyerManager,
  ConsumerManager,
  // Import types
  UserType,
  TabType,
  API_BASE_URL
} from './components';
import * as XLSX from 'xlsx';
import ProtectedRoute from '@/app/admin/components/ProtectedRoute';
import Topbar from '@/app/admin/components/Topbar';
import UserDetailsModal from '../components/UserDetailsModal';
import { 
  Activity,
  Bell,
  Calendar,
  ChevronDown, 
  ChevronRight,
  Clock,
  Download,
  FileText,
  Home, 
  Info,
  List,
  Lock, 
  LogOut, 
  Mail,
  MapPin,
  Menu,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Sprout,
  Star,
  Store,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  X
} from 'lucide-react';

// Additional interfaces needed for full functionality
interface AgriCopilot {
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
  aadhar_front_url?: string;
  aadhar_back_url?: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  joinDate: string;
  status: 'active' | 'inactive';
}

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  status: 'pending' | 'verified';
  location: string;
  type: UserType;
  state?: string;
  district?: string;
  availability?: 'available' | 'unavailable';
}

interface SuperAdminProps {
  onLogout?: () => void;
}

// Backend-accepted member types
const BACKEND_MEMBER_TYPES = ['farmer', 'landowner', 'vendor', 'buyer', 'agri_copilot'];

// Normalize a raw member type string to backend-accepted values.
const normalizeMemberType = (raw?: string | null): string | null => {
  if (!raw) return null;
  let s = String(raw).toLowerCase().trim();
  // common variants
  s = s.replace(/[-\s]/g, '_'); // spaces or dashes -> underscore
  s = s.replace(/__+/g, '_');
  // map UI/CSV "agricopilot" variants to backend "agri_copilot"
  if (s === 'agricopilot' || s === 'agri_copilot' || s === 'agri-copilot' || s === 'agri_copilots' || s === 'agricopilots' || s === 'copilot' || s === 'agri_copilot') {
    return 'agri_copilot';
  }
  // simple passthrough for exact backend types
  if (BACKEND_MEMBER_TYPES.includes(s)) return s;
  // allow plural forms
  if (s.endsWith('s')) {
    const singular = s.slice(0, -1);
    if (BACKEND_MEMBER_TYPES.includes(singular)) return singular;
  }

  return null; // unknown
}

const SuperAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // State for all user types data
  const [copilots, setCopilots] = useState<AgriCopilot[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [landowners, setLandowners] = useState<any[]>([]);
  const [consumers, setConsumers] = useState<any[]>([]);
  
  // Loading and form states
  const [loading, setLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Upload and file handling
  const [uploadType, setUploadType] = useState<'single' | 'bulk'>('single');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  // Modal states
  const [selectedCopilot, setSelectedCopilot] = useState<AgriCopilot | null>(null);
  const [showCopilotDetails, setShowCopilotDetails] = useState(false);
  const [selectedDetailUser, setSelectedDetailUser] = useState<any>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  
  // Additional state for user management
  const [onboardingUsers, setOnboardingUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [renderCounter, setRenderCounter] = useState(0);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // User statistics state
  const [userStats, setUserStats] = useState({
    agricopilot: { total: 0, active: 0, verified: 0, pending: 0 },
    farmer: { total: 0, active: 0, verified: 0, pending: 0 },
    landowner: { total: 0, active: 0, verified: 0, pending: 0 },
    vendor: { total: 0, active: 0, verified: 0, pending: 0 },
    buyer: { total: 0, active: 0, verified: 0, pending: 0 },
    consumer: { total: 0, active: 0, verified: 0, pending: 0 }
  });

  // Indian states and districts data
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  const districtsByState = {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tezpur', 'Bomdila'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
    'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Karnal'],
    'Himachal Pradesh': ['Shimla', 'Mandi', 'Solan', 'Dharamshala', 'Baddi'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
    'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul'],
    'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Baghmara'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Siaha', 'Champhai', 'Serchhip'],
    'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur'],
    'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Udaipur'],
    'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar'],
    'Tripura': ['Agartala', 'Dharmanagar', 'Kailashahar', 'Ambassa', 'Belonia'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Meerut'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Kashipur'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri']
  } as const;

  // Additional state for bulk upload progress
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadDetails, setUploadDetails] = useState<string[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Form data state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });

  // Notifications (can be fetched from backend in future)
  const notifications = [
    { id: '1', type: 'onboarding', message: 'New farmer registration pending', userType: 'Admin', time: '2 mins ago', read: false },
    { id: '2', type: 'activity', message: 'New order placed by vendor Fresh Farms', userType: 'Admin', time: '1 hour ago', read: false },
    { id: '3', type: 'onboarding', message: 'New landowner verification required', userType: 'Admin', time: '3 hours ago', read: true },
  ];

  // Fetch functions for each user type
  const fetchCopilots = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching AgriCopilots from:', `${API_BASE_URL}/admin/agri-copilots`);
      
      const response = await fetch(`${API_BASE_URL}/admin/agri-copilots`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch copilots: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched copilots data:', data);
      setCopilots(data);
      setRenderCounter(prev => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch copilots';
      setError(errorMessage);
      console.error('Error fetching copilots:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/farmers`);
      if (!res.ok) throw new Error(`Failed to fetch farmers: ${res.status}`);
      const data = await res.json();
      setFarmers(data);
      console.log('✅ Fetched farmers:', data.length);
    } catch (e) {
      console.error('❌ Error fetching farmers:', e);
      setFarmers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/vendors`);
      if (!res.ok) throw new Error(`Failed to fetch vendors: ${res.status}`);
      const data = await res.json();
      setVendors(data);
      console.log('✅ Fetched vendors:', data.length);
    } catch (e) {
      console.error('❌ Error fetching vendors:', e);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/buyers`);
      if (!res.ok) throw new Error(`Failed to fetch buyers: ${res.status}`);
      const data = await res.json();
      setBuyers(data);
      console.log('✅ Fetched buyers:', data.length);
    } catch (e) {
      console.error('❌ Error fetching buyers:', e);
      setBuyers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLandowners = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/landowners`);
      if (!res.ok) throw new Error(`Failed to fetch landowners: ${res.status}`);
      const data = await res.json();
      setLandowners(data);
      console.log('✅ Fetched landowners:', data.length);
    } catch (e) {
      console.error('❌ Error fetching landowners:', e);
      setLandowners([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsumers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/consumers`);
      if (!res.ok) throw new Error(`Failed to fetch consumers: ${res.status}`);
      const data = await res.json();
      setConsumers(data);
      console.log('✅ Fetched consumers:', data.length);
    } catch (e) {
      console.error('❌ Error fetching consumers:', e);
      setConsumers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all user counts for dashboard statistics
  const fetchCounts = async () => {
    try {
      // Map user types to backend endpoints
      const endpoints: Partial<Record<UserType, string>> = {
        agricopilot: `${API_BASE_URL}/admin/agri-copilots`,
        farmer: `${API_BASE_URL}/admin/farmers`,
        landowner: `${API_BASE_URL}/admin/landowners`,
        vendor: `${API_BASE_URL}/admin/vendors`,
        buyer: `${API_BASE_URL}/admin/buyers`,
        consumer: `${API_BASE_URL}/admin/consumers`,
      };

      const entries = await Promise.all(Object.entries(endpoints).map(async ([key, url]) => {
        try {
          const res = await fetch(url as string, { method: 'GET' });
          if (!res.ok) {
            console.warn(`Failed to fetch ${key} from ${url}:`, res.statusText);
            return [key, { total: 0, active: 0, verified: 0, pending: 0 }];
          }
          const data = await res.json();
          // data is expected to be an array of records
          const total = Array.isArray(data) ? data.length : 0;
          const verified = Array.isArray(data) ? data.filter((d: any) => d.verification_status === 'approved').length : 0;
          const pending = Array.isArray(data) ? data.filter((d: any) => d.verification_status === 'pending').length : 0;
          const active = total;
          
          return [key, { total, active, verified, pending }];
        } catch (err) {
          console.error(`Error fetching ${key}:`, err);
          return [key, { total: 0, active: 0, verified: 0, pending: 0 }];
        }
      }));

      const newStats = { ...userStats };
      for (const [k, v] of entries as Array<[string, { total: number; active: number; verified: number; pending: number }]>) {
        // Only set keys that exist in our state
        if (k in newStats) {
          (newStats as any)[k] = v;
        }
      }
      setUserStats(newStats);
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  };

  // Handle user status updates (approve/reject)
  const handleUpdateStatus = async (userId: string, status: 'approve' | 'reject', userType: UserType) => {
    try {
      setLoading(true);
      
      // Get token from localStorage
      let token = localStorage.getItem('access_token');
      
      if (!token) {
        token = localStorage.getItem('token') || localStorage.getItem('authToken');
      }
      
      if (!token) {
        alert('You are not logged in. Please login from the Authentication page.');
        setLoading(false);
        return;
      }
      
      let endpoint;
      if (userType === 'agricopilot') {
        endpoint = status === 'approve' 
          ? `${API_BASE_URL}/admin/approve-agri-copilot/${userId}`
          : `${API_BASE_URL}/admin/verify/agri-copilot/${userId}`;
      } else {
        endpoint = `${API_BASE_URL}/admin/verify/${userType}/${userId}`;
      }
      
      console.log('🚀 Making API request to:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: status === 'approve' ? 'approved' : 'rejected'
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Verification error:', errorData);
        
        if (response.status === 401 || response.status === 403 || errorData.includes('expired')) {
          alert('Your session has expired. Please login again.');
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_type');
          localStorage.removeItem('user_email');
          window.location.href = '/';
          return;
        }
        
        throw new Error(`Failed to update status: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Verification success:', result);
      
      // Close modals
      if (userType === 'agricopilot') {
        setShowCopilotDetails(false);
        setSelectedCopilot(null);
      } else {
        setShowUserDetails(false);
        setSelectedDetailUser(null);
      }

      const userTypeDisplay = userType.charAt(0).toUpperCase() + userType.slice(1);
      alert(`✅ ${userTypeDisplay} has been ${status === 'approve' ? 'approved' : 'rejected'} successfully!`);

      // Refresh the relevant user list
      switch (userType) {
        case 'farmer':
          await fetchFarmers();
          break;
        case 'landowner':
          await fetchLandowners();
          break;
        case 'vendor':
          await fetchVendors();
          break;
        case 'buyer':
          await fetchBuyers();
          break;
        case 'agricopilot':
          await fetchCopilots();
          break;
        case 'consumer':
          await fetchConsumers();
          break;
      }

      // Refresh counts
      await fetchCounts();
      
    } catch (err) {
      console.error('Error updating status:', err);
      
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        alert(`Network error: Unable to connect to the server. Please try logging in again.`);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('user_email');
      } else {
        alert(`Failed to ${status} ${userType}. ${err instanceof Error ? err.message : 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Form submission handler for adding new users
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formSubmitting) return;
    
    try {
      // Validate required fields
      if (!formData.fullName || !formData.email || !formData.phone) {
        alert('Please fill in all required fields');
        return;
      }

      // Validate phone number format
      const cleanedPhone = formData.phone.replace(/\D/g, '');
      let isValidPhone = false;
      
      if (cleanedPhone.length === 10 && /^[6-9]/.test(cleanedPhone)) {
        isValidPhone = true;
      } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith('0') && /^0[6-9]/.test(cleanedPhone)) {
        isValidPhone = true;
      } else if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91') && /^91[6-9]/.test(cleanedPhone)) {
        isValidPhone = true;
      }
      
      if (!isValidPhone) {
        alert('Please enter a valid Indian mobile number.');
        return;
      }

      setFormSubmitting(true);
      
      // Format phone number
      const formatPhoneNumber = (phone: string): string => {
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
          return cleaned;
        } else if (cleaned.length === 11 && cleaned.startsWith('0') && /^0[6-9]/.test(cleaned)) {
          return cleaned.substring(1);
        } else if (cleaned.length === 12 && cleaned.startsWith('91') && /^91[6-9]/.test(cleaned)) {
          return cleaned.substring(2);
        }
        
        return cleaned;
      };

      // Prepare invite data
      const inviteData = {
        full_name: formData.fullName,
        email: formData.email,
        phone: formatPhoneNumber(formData.phone)
      };

      // Map user type to endpoint
      const endpointMap: Record<string, string> = {
        agricopilot: '/admin/invite/agri-copilot',
        farmer: '/admin/invite/farmer',
        landowner: '/admin/invite/landowner',
        vendor: '/admin/invite/vendor',
        buyer: '/admin/invite/buyer',
        consumer: '/admin/invite/consumer'
      };

      const endpoint = selectedUserType ? endpointMap[selectedUserType] : null;
      
      if (!endpoint) {
        alert('Please select a valid user type');
        return;
      }

      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(inviteData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Invite error:', errorData);
        
        // Handle specific error cases
        if (response.status === 400) {
          if (errorData.includes('already exists')) {
            alert(`❌ User with email ${formData.email} already exists in the system. Please use a different email address.`);
            return;
          }
        }
        
        throw new Error(`Failed to send invitation: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log('Invitation sent successfully:', result);
      
      alert(`✅ Invitation sent to ${formData.email} successfully!`);
      
      // Reset form
      setFormData({ fullName: '', email: '', phone: '' });
      setShowEmployeeForm(false);
      
      // Refresh user list
      if (selectedUserType === 'agricopilot') await fetchCopilots();
      else if (selectedUserType === 'farmer') await fetchFarmers();
      else if (selectedUserType === 'landowner') await fetchLandowners();
      else if (selectedUserType === 'vendor') await fetchVendors();
      else if (selectedUserType === 'buyer') await fetchBuyers();
      else if (selectedUserType === 'consumer') await fetchConsumers();
      
      await fetchCounts();
      
    } catch (err) {
      console.error('Error sending invitation:', err);
      alert(`Failed to send invitation. ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Form input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // View user details handler
  const handleViewDetails = (user: any) => {
    setSelectedDetailUser(user);
    setShowUserDetails(true);
  };

  // AgriCopilot details handler
  const handleViewCopilotDetails = (copilot: AgriCopilot) => {
    setSelectedCopilot(copilot);
    setShowCopilotDetails(true);
  };

  // Employee management functions
  const handleAddEmployee = () => {
    setIsEditMode(false);
    setSelectedEmployee(null);
    setShowEmployeeForm(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setIsEditMode(true);
    setSelectedEmployee(employee);
    setShowEmployeeForm(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    if (window.confirm(`Are you sure you want to delete ${employee.name}?`)) {
      // Implement delete logic here
      console.log('Deleting employee:', employee);
    }
  };

  // Update districts when state changes
  useEffect(() => {
    if (selectedState === 'all') {
      setAvailableDistricts([]);
      setSelectedDistrict('all');
    } else {
      const districts = districtsByState[selectedState as keyof typeof districtsByState] || [];
      setAvailableDistricts([...districts]);
      setSelectedDistrict('all');
    }
  }, [selectedState]);

  // Helper function to check if file is supported
  const isSupportedFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
  };

  // Helper function to parse file content (CSV or Excel)
  const parseFileContent = async (file: File): Promise<any[]> => {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      const text = await file.text();
      return parseCSV(text);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return parseExcel(file);
    } else {
      throw new Error('Unsupported file format');
    }
  };

  // Parse Excel files
  const parseExcel = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          console.log('📊 Excel data loaded:', jsonData.length, 'rows');
          
          if (jsonData.length < 2) {
            reject(new Error('Excel file must have at least a header row and one data row'));
            return;
          }
          
          const headers = (jsonData[0] as string[]).map(h => h.toLowerCase().trim());
          console.log('📋 Excel headers found:', headers);
          
          const users = [];
          
          // Find column indices
          const nameIndex = headers.findIndex(h => h.includes('name'));
          const emailIndex = headers.findIndex(h => h.includes('email'));
          const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));
          const memberTypeIndex = headers.findIndex(h => h.includes('type') || h.includes('member'));
          
          console.log('📊 Excel column mapping:', {
            nameIndex, emailIndex, phoneIndex, memberTypeIndex
          });
          
          if (nameIndex === -1 || emailIndex === -1 || phoneIndex === -1) {
            reject(new Error('Excel must contain Name, Email, and Phone columns. Found headers: ' + headers.join(', ')));
            return;
          }
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as string[];
            if (row.length === 0) continue;
            
            const name = row[nameIndex]?.toString().trim();
            const email = row[emailIndex]?.toString().trim();
            const phone = row[phoneIndex]?.toString().trim();
            const memberType = memberTypeIndex !== -1 ? row[memberTypeIndex]?.toString().trim() : selectedUserType;
            
            if (name && email && phone) {
              users.push({ 
                name, 
                full_name: name,
                email, 
                phone, 
                member_type: memberType || selectedUserType 
              });
            }
          }
          
          console.log(`📈 Successfully parsed ${users.length} users from Excel`);
          resolve(users);
        } catch (error) {
          console.error('Excel parsing error:', error);
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read Excel file'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Parse CSV content to user objects
  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }
    
    const headers = lines[0].split(',').map(h => {
      return h.trim().toLowerCase().replace(/["\s]/g, '');
    });
    const users = [];
    
    console.log('📋 CSV headers found:', headers);
    
    // Find column indices with flexible matching
    const getColumnIndex = (possibleNames: string[]) => {
      for (const name of possibleNames) {
        const index = headers.findIndex(h => h.includes(name));
        if (index !== -1) return index;
      }
      return -1;
    };

    const nameIndex = getColumnIndex(['name', 'fullname', 'full_name', 'fname']);
    const emailIndex = getColumnIndex(['email', 'mail', 'e_mail']);
    const phoneIndex = getColumnIndex(['phone', 'mobile', 'contact', 'number']);
    const memberTypeIndex = getColumnIndex(['member_type', 'membertype', 'type', 'role']);
    
    console.log('📊 Column mapping:', {
      nameIndex, emailIndex, phoneIndex, memberTypeIndex
    });
    
    // Check if required columns are found
    if (nameIndex === -1 || emailIndex === -1 || phoneIndex === -1) {
      throw new Error('CSV must contain columns for Name, Email, and Phone. Found headers: ' + headers.join(', '));
    }
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length === 0) continue;
      
      const name = values[nameIndex]?.trim();
      const email = values[emailIndex]?.trim();
      const phone = values[phoneIndex]?.trim();
      const memberType = memberTypeIndex !== -1 ? values[memberTypeIndex]?.trim() : selectedUserType;
      
      if (name && email && phone) {
        users.push({
          name,
          full_name: name,
          email,
          phone,
          member_type: memberType || selectedUserType
        });
      }
    }
    
    console.log(`📈 Successfully parsed ${users.length} users from CSV`);
    return users;
  };

  // Enhanced upload function that returns response details
  const uploadUsersWithResponse = async (users: any[], fileName: string) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }

    try {
      // Convert users array to CSV
      const csvHeaders = ['full_name', 'email', 'phone', 'location'].join(',');
      const csvRows = users.map(user => 
        [user.full_name, user.email, user.phone, user.location || ''].join(',')
      );
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      // Create a file blob
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], fileName.endsWith('.csv') ? fileName : `${fileName}.csv`, { type: 'text/csv' });
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Determine the correct endpoint based on selected user type
      const normalizedType = normalizeMemberType(selectedUserType);
      if (!normalizedType) {
        throw new Error(`Invalid user type: ${selectedUserType}`);
      }
      
      const endpoint = `/admin/bulk-upload/${normalizedType}`;
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Bulk upload error:', errorData);
        throw new Error(`Bulk upload failed: ${response.status} - ${errorData}`);
      }
      
      const result = await response.json();
      console.log('✅ Bulk upload success:', result);
      
      return result; // Return the full response for processing
      
    } catch (error) {
      console.error('Error uploading users:', error);
      throw error;
    }
  };

  // Original upload function for single file processing
  const uploadUsers = async (users: any[], fileName: string) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }

    try {
      setUploadStatus(`📊 Preparing ${users.length} users for upload...`);
      setUploadDetails(prev => [...prev, `📁 Processing file: ${fileName}`]);
      setCurrentFileName(fileName);
      setProcessedCount(0);
      setTotalCount(users.length);
      
      // Create a CSV content from users data
      const csvHeaders = ['full_name', 'email', 'phone', 'member_type'];
      const csvRows = [csvHeaders.join(',')];
      
      for (const user of users) {
        const row = [
          user.name || user.full_name || '',
          user.email || '',
          user.phone || '',
          user.member_type || selectedUserType || ''
        ];
        csvRows.push(row.join(','));
      }
      
      const csvContent = csvRows.join('\n');
      
      setUploadStatus('📄 Creating file for upload...');
      setUploadDetails(prev => [...prev, `✅ Generated CSV with ${users.length} user records`]);
      
      // Create a file blob
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], fileName.endsWith('.csv') ? fileName : `${fileName}.csv`, { type: 'text/csv' });
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Determine the correct endpoint based on selected user type
      const normalizedType = normalizeMemberType(selectedUserType);
      if (!normalizedType) {
        throw new Error(`Invalid user type: ${selectedUserType}`);
      }
      
      const endpoint = `/admin/bulk-upload/${normalizedType}`;
      setUploadStatus('🚀 Uploading to server...');
      setUploadDetails(prev => [...prev, `🌐 Endpoint: ${endpoint}`]);
      
      console.log('🚀 Uploading to endpoint:', `${API_BASE_URL}${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Bulk upload error:', errorData);
        setUploadStatus('❌ Upload failed');
        setUploadDetails(prev => [...prev, `❌ Error: ${response.status} - ${errorData}`]);
        throw new Error(`Bulk upload failed: ${response.status} - ${errorData}`);
      }
      
      const result = await response.json();
      console.log('✅ Bulk upload success:', result);
      
      // Display detailed results based on the enhanced backend response
      const totalRows = result.total_rows || users.length;
      const newInvitations = result.new_invitations || result.successful_uploads || 0;
      const existingEmails = result.existing_emails_count || 0;
      const invalidEmails = result.invalid_emails_count || 0;
      
      setUploadStatus('✅ Upload completed successfully!');
      setUploadDetails(prev => [
        ...prev, 
        `✅ Results Summary:`,
        `   • Total records processed: ${totalRows}`,
        `   • New invitations sent: ${newInvitations}`,
        ...(existingEmails > 0 ? [`   • Existing emails skipped: ${existingEmails}`] : []),
        ...(invalidEmails > 0 ? [`   • Invalid emails skipped: ${invalidEmails}`] : [])
      ]);
      setProcessedCount(newInvitations);
      
      // Prepare detailed message for the alert
      let alertMessage = `📊 Bulk Upload Results:\n\n`;
      alertMessage += `Total records: ${totalRows}\n`;
      alertMessage += `✅ New invitations sent: ${newInvitations}\n`;
      
      if (existingEmails > 0) {
        alertMessage += `⚠️ Existing emails skipped: ${existingEmails}\n`;
      }
      if (invalidEmails > 0) {
        alertMessage += `❌ Invalid emails skipped: ${invalidEmails}\n`;
      }
      
      if (newInvitations > 0) {
        alertMessage += `\n📧 New users will receive email invitations to complete registration.`;
      }
      
      if (existingEmails > 0) {
        alertMessage += `\n\n⚠️ Note: Existing emails were automatically detected and skipped to prevent duplicates.`;
        
        // Show first few existing emails if available
        if (result.existing_emails && result.existing_emails.length > 0) {
          alertMessage += `\n\nExisting emails found:`;
          result.existing_emails.slice(0, 5).forEach((email: string) => {
            alertMessage += `\n• ${email}`;
          });
          if (result.existing_emails.length > 5) {
            alertMessage += `\n... and ${result.existing_emails.length - 5} more`;
          }
        }
      }
      
      // Show final detailed message after a delay
      setTimeout(() => {
        alert(alertMessage);
      }, 500);
      
    } catch (error) {
      console.error('Error uploading users:', error);
      setUploadStatus('❌ Upload failed');
      setUploadDetails(prev => [...prev, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      throw error;
    }
  };

  // Process single file (CSV or Excel)
  const processSingleFile = async (file: File) => {
    if (!isSupportedFile(file)) {
      alert('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    try {
      // Reset progress states
      setUploadStatus('🚀 Starting file processing...');
      setUploadDetails([]);
      setCurrentFileName(file.name);
      setProcessedCount(0);
      setTotalCount(0);
      
      setLoading(true);
      console.log('📁 Processing file:', file.name);
      
      setUploadStatus('📖 Reading and parsing file...');
      setUploadDetails(prev => [...prev, `📁 File: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`]);
      
      const users = await parseFileContent(file);
      console.log('📊 Parsed users:', users.length);
      
      if (users.length === 0) {
        setUploadStatus('⚠️ No valid data found');
        setUploadDetails(prev => [...prev, '❌ No valid user data found in the file']);
        alert('No valid user data found in the file. Please check the file format and try again.');
        return;
      }
      
      setUploadDetails(prev => [...prev, `📊 Found ${users.length} valid user records`]);
      
      await uploadUsers(users, file.name);
      
      // Refresh the data after successful upload
      setUploadStatus('🔄 Refreshing data...');
      setUploadDetails(prev => [...prev, '🔄 Refreshing user lists...']);
      
      switch (selectedUserType) {
        case 'farmer': await fetchFarmers(); break;
        case 'vendor': await fetchVendors(); break;
        case 'buyer': await fetchBuyers(); break;
        case 'landowner': await fetchLandowners(); break;
        case 'consumer': await fetchConsumers(); break;
        default: await fetchCopilots();
      }
      await fetchCounts();
      
      setUploadStatus('✅ Process completed successfully!');
      setUploadDetails(prev => [...prev, '✅ Data refresh completed']);
      
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadStatus('❌ Process failed');
      setUploadDetails(prev => [...prev, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      alert(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Process multiple files for bulk upload (CSV and Excel)
  const processBulkFiles = async (files: File[]) => {
    const supportedFiles = files.filter(file => isSupportedFile(file));
    
    if (supportedFiles.length === 0) {
      alert('No supported files found. Please select CSV or Excel files.');
      return;
    }

    if (supportedFiles.length !== files.length) {
      alert(`${files.length - supportedFiles.length} files were skipped (unsupported format)`);
    }

    // Reset progress states
    setUploadStatus('🚀 Starting bulk processing...');
    setUploadDetails([]);
    setCurrentFileName('');
    setProcessedCount(0);
    setTotalCount(supportedFiles.length);

    setIsUploading(true);
    setUploadProgress(0);
    setLoading(true);
    let totalProcessed = 0;
    let totalFailed = 0;

    setUploadDetails(prev => [...prev, `📁 Processing ${supportedFiles.length} files...`]);

    for (let i = 0; i < supportedFiles.length; i++) {
      try {
        setCurrentFileName(supportedFiles[i].name);
        setUploadStatus(`📁 Processing file ${i + 1}/${supportedFiles.length}: ${supportedFiles[i].name}`);
        setUploadDetails(prev => [...prev, `\n📁 File ${i + 1}: ${supportedFiles[i].name}`]);
        
        console.log(`📁 Processing file ${i + 1}/${supportedFiles.length}:`, supportedFiles[i].name);
        
        setUploadDetails(prev => [...prev, `📖 Reading and parsing...`]);
        const users = await parseFileContent(supportedFiles[i]);
        console.log(`📊 Parsed ${users.length} users from ${supportedFiles[i].name}`);
        
        if (users.length > 0) {
          setUploadDetails(prev => [...prev, `📊 Found ${users.length} valid records`]);
          
          // Upload users and capture the detailed response
          const uploadResponse = await uploadUsersWithResponse(users, supportedFiles[i].name);
          
          // Extract details from the enhanced response
          const newInvitations = uploadResponse?.new_invitations || uploadResponse?.successful_uploads || 0;
          const existingEmails = uploadResponse?.existing_emails_count || 0;
          const invalidEmails = uploadResponse?.invalid_emails_count || 0;
          
          totalProcessed += newInvitations;
          
          // Display detailed results for this file
          setUploadDetails(prev => [
            ...prev, 
            `   ✅ New invitations: ${newInvitations}`,
            ...(existingEmails > 0 ? [`   ⚠️ Existing emails: ${existingEmails}`] : []),
            ...(invalidEmails > 0 ? [`   ❌ Invalid emails: ${invalidEmails}`] : [])
          ]);
        } else {
          setUploadDetails(prev => [...prev, `⚠️ No valid data found in file`]);
        }
        
        setProcessedCount(i + 1);
        setUploadProgress(((i + 1) / supportedFiles.length) * 100);
      } catch (error) {
        console.error(`Error processing ${supportedFiles[i].name}:`, error);
        setUploadDetails(prev => [...prev, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
        totalFailed++;
      }
    }

    setIsUploading(false);
    setUploadProgress(100);
    setLoading(false);
    
    // Show final result
    if (totalFailed === 0) {
      setUploadStatus(`✅ All files processed successfully!`);
      setUploadDetails(prev => [...prev, `\n🎉 Final Results: ${totalProcessed} users uploaded from ${supportedFiles.length} files`]);
      alert(`✅ Successfully processed ${totalProcessed} users from ${supportedFiles.length} files.`);
    } else {
      setUploadStatus(`⚠️ Bulk processing completed with some errors`);
      setUploadDetails(prev => [...prev, `\n📊 Final Results: ${totalProcessed} users uploaded, ${totalFailed} files failed`]);
      alert(`⚠️ Processed ${totalProcessed} users from ${supportedFiles.length - totalFailed} files. ${totalFailed} files failed.`);
    }
    
    // Refresh the data after successful upload
    setUploadDetails(prev => [...prev, '🔄 Refreshing data...']);
    switch (selectedUserType) {
      case 'farmer': await fetchFarmers(); break;
      case 'vendor': await fetchVendors(); break;
      case 'buyer': await fetchBuyers(); break;
      case 'landowner': await fetchLandowners(); break;
      case 'consumer': await fetchConsumers(); break;
      default: await fetchCopilots();
    }
    await fetchCounts();
    setUploadDetails(prev => [...prev, '✅ Data refresh completed']);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // File upload handler with full functionality
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadType === 'single' && files.length > 0) {
      const file = files[0];
      await processSingleFile(file);
    } else if (uploadType === 'bulk') {
      await processBulkFiles(Array.from(files));
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download functions for onboarding data
  const handleDownloadExcel = () => {
    try {
      // Get current data based on selected user type
      let data: any[] = [];
      if (selectedUserType === 'farmer') data = farmers;
      else if (selectedUserType === 'vendor') data = vendors;
      else if (selectedUserType === 'buyer') data = buyers;
      else if (selectedUserType === 'landowner') data = landowners;
      else if (selectedUserType === 'consumer') data = consumers;
      else data = copilots;

      if (!data || data.length === 0) {
        alert('No data available to download');
        return;
      }

      // Prepare data for Excel export
      const exportData = data.map(item => ({
        'Name': item.full_name || item.name || item.fullName || item.username || '',
        'Email': item.email || item.user_email || '',
        'Phone': item.phone || '',
        'Location': item.location || `${item.city || 'N/A'}, ${item.state || 'N/A'}`,
        'Status': item.verification_status || item.status || 'pending',
        'Registration Date': item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
        'Custom ID': item.custom_id || item.customId || '',
        'Aadhar Number': item.aadhar_number || ''
      }));

      // Create worksheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      const sheetName = selectedUserType ? selectedUserType.charAt(0).toUpperCase() + selectedUserType.slice(1) : 'Users';
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${selectedUserType || 'users'}_registry_${timestamp}.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, filename);
      
      setShowDownloadMenu(false);
      alert(`Downloaded ${data.length} records as ${filename}`);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Error generating Excel file. Please try again.');
    }
  };

  const handleDownloadPDF = () => {
    try {
      // Get current data based on selected user type
      let data: any[] = [];
      if (selectedUserType === 'farmer') data = farmers;
      else if (selectedUserType === 'vendor') data = vendors;
      else if (selectedUserType === 'buyer') data = buyers;
      else if (selectedUserType === 'landowner') data = landowners;
      else if (selectedUserType === 'consumer') data = consumers;
      else data = copilots;

      if (!data || data.length === 0) {
        alert('No data available to download');
        return;
      }

      // Create HTML content for PDF
      const userTypeName = selectedUserType ? selectedUserType.charAt(0).toUpperCase() + selectedUserType.slice(1) : 'Users';
      const htmlContent = `
        <html>
        <head>
          <title>${userTypeName} Registry Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2d5a27; text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header-info { margin-bottom: 20px; }
            .summary { background: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${userTypeName} Registry Report</h1>
          <div class="header-info">
            <strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br>
            <strong>Total Records:</strong> ${data.length}
          </div>
          <div class="summary">
            <strong>Summary:</strong><br>
            Total: ${data.length} | 
            Approved: ${data.filter(d => d.verification_status === 'approved').length} | 
            Pending: ${data.filter(d => d.verification_status === 'pending').length} | 
            Rejected: ${data.filter(d => d.verification_status === 'rejected').length}
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Status</th>
                <th>Registration Date</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>${item.full_name || item.name || item.fullName || item.username || '-'}</td>
                  <td>${item.email || item.user_email || '-'}</td>
                  <td>${item.phone || '-'}</td>
                  <td>${item.location || `${item.city || 'N/A'}, ${item.state || 'N/A'}`}</td>
                  <td>${item.verification_status || item.status || 'pending'}</td>
                  <td>${item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `${selectedUserType || 'users'}_registry_${timestamp}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setShowDownloadMenu(false);
      alert(`Downloaded ${data.length} records as HTML report (open in browser and print to PDF)`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error generating PDF file. Please try again.');
    }
  };

  // Handle view user details for onboarding table
  const handleViewUserDetails = (user: any) => {
    setSelectedDetailUser(user);
    setShowUserDetails(true);
  };

  // Fetch all data on component mount
  useEffect(() => {
    fetchCounts();
    fetchCopilots();
    fetchFarmers();
    fetchLandowners();
    fetchVendors();
    fetchBuyers();
    fetchConsumers();
  }, []);

  // Define custom SVG components for user types
  const Store = ({ className = '' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );

  const ShoppingBag = ({ className = '' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  // User types configuration with real backend data
  const userTypes = [
    { 
      id: 'agricopilot' as const, 
      label: 'AgriCoPilot', 
      icon: UserCheck, 
      color: 'bg-green-100 text-green-700',
      bgImage: '/agricopilot-bg.jpg',
      iconImage: '/agricopilot-bg.jpg'
    },
    { 
      id: 'farmer' as const, 
      label: 'Farmer', 
      icon: Users, 
      color: 'bg-blue-100 text-blue-700',
      bgImage: '/farmer-bg.jpg',
      iconImage: '/farmer-bg.jpg'
    },
    { 
      id: 'landowner' as const, 
      label: 'Landowner', 
      icon: MapPin, 
      color: 'bg-yellow-100 text-yellow-700',
      bgImage: '/landowner-bg.jpg',
      iconImage: '/landowner-bg.jpg'
    },
    { 
      id: 'vendor' as const, 
      label: 'Vendor', 
      icon: Store, 
      color: 'bg-purple-100 text-purple-700',
      bgImage: '/vendor-bg.jpg',
      iconImage: '/vendor-bg.jpg'
    },
    { 
      id: 'buyer' as const, 
      label: 'Buyer', 
      icon: ShoppingBag, 
      color: 'bg-red-100 text-red-700',
      bgImage: '/buyer-bg.jpg',
      iconImage: '/buyer-bg.jpg'
    },
    { 
      id: 'consumer' as const, 
      label: 'Consumer', 
      icon: Users, 
      color: 'bg-pink-100 text-pink-700',
      bgImage: '/consumer-bg.jpg',
      iconImage: '/consumer-bg.jpg'
    },
  ];

  return (
    <ProtectedRoute requiredRole="super_admin">
      <div className="min-h-screen bg-gray-100">
        <Topbar 
          notifications={notifications} 
          onLogout={() => {
            // Handle logout logic with tab isolation
            import('@/lib/auth').then(({ clearAuth }) => {
              clearAuth();
              window.location.href = '/';
            });
          }}
          onLogoClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        {/* Sidebar */}
        <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-lg transition-all duration-300 z-30 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
          <div className="flex-1 overflow-y-auto py-4">
            <div className={`flex flex-col items-center ${isSidebarOpen ? 'px-6' : 'px-2'} space-y-1`}>
              {/* Dashboard Button with Grid Icon */}
              <button 
                onClick={() => {
                  setActiveTab('dashboard');
                  setSelectedUserType(null);
                }}
                className={`w-full flex items-center ${isSidebarOpen ? 'justify-start px-4' : 'justify-center'} py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'dashboard' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  {isSidebarOpen && <span className="font-medium">Dashboard</span>}
                </div>
              </button>
              
              {/* USER TYPES Section */}
              <div className={`w-full ${isSidebarOpen ? 'mt-6' : 'mt-4'}`}>
                {isSidebarOpen && (
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
                    USER TYPES
                  </h3>
                )}
                <div className={`space-y-2 ${!isSidebarOpen ? 'px-2' : ''}`}>
                  {userTypes.map((type, index) => {
                    const backgroundColors = [
                      'bg-green-100 text-green-700',   // AgriCoPilot
                      'bg-blue-100 text-blue-700',     // Farmer  
                      'bg-yellow-100 text-yellow-700', // Landowner
                      'bg-purple-100 text-purple-700', // Vendor
                      'bg-red-100 text-red-700',       // Buyer
                      'bg-pink-100 text-pink-700',     // Consumer
                    ];
                    
                    return (
                      <div
                        key={type.id}
                        onClick={() => {
                          setSelectedUserType(type.id);
                          setActiveTab('addEmployee');
                          setShowEmployeeForm(false);
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedUserType === type.id && activeTab === 'addEmployee' 
                            ? 'ring-2 ring-blue-500 ' + backgroundColors[index]
                            : backgroundColors[index] + ' hover:opacity-90'
                        }`}
                      >
                        {isSidebarOpen ? (
                          <>
                            <div className="flex items-center space-x-3">
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                                <img 
                                  src={type.iconImage || type.bgImage} 
                                  alt={type.label}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="font-medium">{type.label}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-70" />
                          </>
                        ) : (
                          <div className="relative w-6 h-6 rounded overflow-hidden">
                            <img 
                              src={type.iconImage || type.bgImage} 
                              alt={type.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto pt-16 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'} h-[calc(100vh-4rem)]`}>
          {activeTab === 'dashboard' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
              
              {/* Stats Cards - Using Real Backend Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {userTypes.map((type) => {
                  // Get real-time stats from actual data arrays
                  let userList: any[] = [];
                  if (type.id === 'agricopilot') userList = copilots;
                  else if (type.id === 'farmer') userList = farmers;
                  else if (type.id === 'landowner') userList = landowners;
                  else if (type.id === 'vendor') userList = vendors;
                  else if (type.id === 'buyer') userList = buyers;
                  else if (type.id === 'consumer') userList = consumers;
                  
                  const totalCount = userList.length;
                  const verifiedCount = userList.filter(u => u.verification_status === 'approved').length;
                  const pendingCount = userList.filter(u => u.verification_status === 'pending').length;
                  
                  return (
                    <div 
                      key={type.id}
                      onClick={() => {
                        setSelectedUserType(type.id);
                        setActiveTab('addEmployee');
                        setShowEmployeeForm(false);
                        
                        // Fetch data if not loaded
                        if (type.id === 'agricopilot' && copilots.length === 0) {
                          fetchCopilots();
                        } else if (type.id === 'farmer' && farmers.length === 0) {
                          fetchFarmers();
                        } else if (type.id === 'landowner' && landowners.length === 0) {
                          fetchLandowners();
                        } else if (type.id === 'vendor' && vendors.length === 0) {
                          fetchVendors();
                        } else if (type.id === 'buyer' && buyers.length === 0) {
                          fetchBuyers();
                        } else if (type.id === 'consumer' && consumers.length === 0) {
                          fetchConsumers();
                        }
                      }}
                      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group"
                    >
                      <div className="flex h-full">
                        {/* Left side - Image */}
                        <div className="relative w-2/5 flex-shrink-0 overflow-hidden">
                          <div 
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${type.bgImage})` }}
                          >
                          </div>
                        </div>
                        
                        {/* Right side - Content */}
                        <div className="flex-1 p-4 flex flex-col justify-between bg-gradient-to-br from-white to-gray-50">
                          {/* Total count */}
                          <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                              Total {type.label}s
                            </p>
                            <p className="text-3xl font-bold text-gray-800 mb-3">{totalCount}</p>
                          </div>
                          
                          {/* Stats */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-md">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-gray-700 font-medium">Verified</span>
                              </div>
                              <span className="text-sm font-bold text-green-700">{verifiedCount}</span>
                            </div>
                            <div className="flex items-center justify-between bg-yellow-50 px-3 py-2 rounded-md">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span className="text-sm text-gray-700 font-medium">Pending</span>
                              </div>
                              <span className="text-sm font-bold text-yellow-700">{pendingCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Recent Activities */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Activities</h3>
                  <button className="text-sm text-green-600 hover:text-green-700">View All</button>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="p-2 bg-green-50 rounded-full mr-4">
                        <Activity className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">New {userTypes[item % userTypes.length].label} registered</p>
                        <p className="text-xs text-gray-500 mt-1">{item} hour ago</p>
                      </div>
                      <button className="text-xs text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* User Management - Using Modular Components with Real Data */}
          {activeTab === 'addEmployee' && selectedUserType && (
            <div className="p-6">
              {/* User-specific Header with Real Data */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
                <div className="bg-white px-8 py-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-4 rounded-xl shadow-md ${
                        selectedUserType === 'agricopilot' ? 'bg-gradient-to-r from-green-500 to-blue-600' :
                        selectedUserType === 'farmer' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                        selectedUserType === 'landowner' ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
                        selectedUserType === 'vendor' ? 'bg-gradient-to-r from-purple-500 to-indigo-600' :
                        'bg-gradient-to-r from-blue-500 to-cyan-600'
                      }`}>
                        <Users className="h-10 w-10 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">
                          {selectedUserType.charAt(0).toUpperCase() + selectedUserType.slice(1)} Management
                        </h1>
                        <p className="text-gray-600 text-lg mb-3">
                          {selectedUserType === 'agricopilot' ? 'Manage agricultural consultants and experts' :
                           selectedUserType === 'farmer' ? 'Manage farmer registrations and activities' :
                           selectedUserType === 'landowner' ? 'Manage landowner properties and listings' :
                           selectedUserType === 'vendor' ? 'Manage agricultural supply vendors' :
                           'Manage agricultural product buyers'}
                        </p>
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            <span className="text-gray-600 font-medium">System Active</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-500 mr-2" />
                            <span className="text-gray-500">
                              {new Date().toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setShowEmployeeForm(true)}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-sm font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <UserPlus className="w-5 h-5 mr-2" />
                        {`Add ${selectedUserType === 'agricopilot' ? 'Employee' : selectedUserType.charAt(0).toUpperCase() + selectedUserType.slice(1)}`}
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('onboard');
                          setShowOnboarding(true);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <List className="w-5 h-5 mr-2" />
                        Onboarding
                      </button>
                    </div>
                  </div>
                  
                  {/* Quick Stats Bar with Real Data */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            if (selectedUserType === 'agricopilot') return copilots.filter(c => c.verification_status === 'approved').length;
                            if (selectedUserType === 'farmer') return farmers.filter(f => f.verification_status === 'approved').length;
                            if (selectedUserType === 'landowner') return landowners.filter(l => l.verification_status === 'approved').length;
                            if (selectedUserType === 'vendor') return vendors.filter(v => v.verification_status === 'approved').length;
                            if (selectedUserType === 'buyer') return buyers.filter(b => b.verification_status === 'approved').length;
                            if (selectedUserType === 'consumer') return consumers.filter(c => c.verification_status === 'approved').length;
                            return '0';
                          })()}
                        </div>
                        <div className="text-sm text-gray-500">Verified</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {(() => {
                            if (selectedUserType === 'agricopilot') return copilots.filter(c => c.verification_status === 'pending').length;
                            if (selectedUserType === 'farmer') return farmers.filter(f => f.verification_status === 'pending').length;
                            if (selectedUserType === 'landowner') return landowners.filter(l => l.verification_status === 'pending').length;
                            if (selectedUserType === 'vendor') return vendors.filter(v => v.verification_status === 'pending').length;
                            if (selectedUserType === 'buyer') return buyers.filter(b => b.verification_status === 'pending').length;
                            if (selectedUserType === 'consumer') return consumers.filter(c => c.verification_status === 'pending').length;
                            return '0';
                          })()}
                        </div>
                        <div className="text-sm text-gray-500">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(() => {
                            if (selectedUserType === 'agricopilot') return copilots.length;
                            if (selectedUserType === 'farmer') return farmers.length;
                            if (selectedUserType === 'landowner') return landowners.length;
                            if (selectedUserType === 'vendor') return vendors.length;
                            if (selectedUserType === 'buyer') return buyers.length;
                            if (selectedUserType === 'consumer') return consumers.length;
                            return '0';
                          })()}
                        </div>
                        <div className="text-sm text-gray-500">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(() => {
                            const currentDate = new Date();
                            const currentMonth = currentDate.getMonth();
                            const currentYear = currentDate.getFullYear();
                            
                            let userList: any[] = [];
                            if (selectedUserType === 'agricopilot') userList = copilots;
                            else if (selectedUserType === 'farmer') userList = farmers;
                            else if (selectedUserType === 'landowner') userList = landowners;
                            else if (selectedUserType === 'vendor') userList = vendors;
                            else if (selectedUserType === 'buyer') userList = buyers;
                            else if (selectedUserType === 'consumer') userList = consumers;
                            
                            const thisMonthUsers = userList.filter(user => {
                              if (!user.created_at) return false;
                              const createdDate = new Date(user.created_at);
                              return createdDate.getMonth() === currentMonth && 
                                     createdDate.getFullYear() === currentYear;
                            });
                            
                            return thisMonthUsers.length;
                          })()}
                        </div>
                        <div className="text-sm text-gray-500">This Month</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Render the appropriate modular component */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {selectedUserType === 'agricopilot' && (
                  <AgriCopilotManager 
                    onUpdateStatus={handleUpdateStatus} 
                    onViewDetails={handleViewCopilotDetails}
                    loading={loading}
                    filterStatus="approved"
                  />
                )}
                {selectedUserType === 'farmer' && (
                  <FarmerManager 
                    onUpdateStatus={handleUpdateStatus} 
                    onViewDetails={handleViewDetails}
                    loading={loading}
                    filterStatus="approved"
                  />
                )}
                {selectedUserType === 'landowner' && (
                  <LandownerManager 
                    onUpdateStatus={handleUpdateStatus} 
                    onViewDetails={handleViewDetails}
                    loading={loading}
                    filterStatus="approved"
                  />
                )}
                {selectedUserType === 'vendor' && (
                  <VendorManager 
                    onUpdateStatus={handleUpdateStatus} 
                    onViewDetails={handleViewDetails}
                    loading={loading}
                    filterStatus="approved"
                  />
                )}
                {selectedUserType === 'buyer' && (
                  <BuyerManager 
                    onUpdateStatus={handleUpdateStatus} 
                    onViewDetails={handleViewDetails}
                    loading={loading}
                    filterStatus="approved"
                  />
                )}
                {selectedUserType === 'consumer' && (
                  <ConsumerManager 
                    onUpdateStatus={handleUpdateStatus} 
                    onViewDetails={handleViewDetails}
                    loading={loading}
                    filterStatus="approved"
                  />
                )}
              </div>

              {/* Add User Form Modal */}
              {showEmployeeForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="px-8 py-6 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">
                          Add New {selectedUserType?.charAt(0).toUpperCase() + selectedUserType?.slice(1)}
                        </h3>
                        <button
                          onClick={() => {
                            setShowEmployeeForm(false);
                            // Clear progress states when closing modal
                            setUploadStatus('');
                            setUploadDetails([]);
                            setCurrentFileName('');
                            setProcessedCount(0);
                            setTotalCount(0);
                            setUploadProgress(0);
                            setIsUploading(false);
                          }}
                          className="text-gray-400 hover:text-gray-500 transition-colors"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Choose how you want to add users</p>
                    </div>

                    <div className="p-8">
                      {/* Upload Type Selector - Toggle Style */}
                      <div className="mb-6">
                        <div className="bg-gray-100 rounded-lg p-1 inline-flex">
                          <button
                            onClick={() => setUploadType('single')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                              uploadType === 'single'
                                ? 'bg-green-500 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            <User className="w-4 h-4" />
                            <span>Single Entry</span>
                          </button>
                          <button
                            onClick={() => setUploadType('bulk')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                              uploadType === 'bulk'
                                ? 'bg-gray-500 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            <Upload className="w-4 h-4" />
                            <span>Bulk Upload</span>
                          </button>
                        </div>
                      </div>

                      {uploadType === 'single' ? (
                        /* Single Entry Form */
                        <form onSubmit={handleSubmit} className="space-y-8">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h4>
                            <p className="text-sm text-gray-600 mb-8">Fill in the details below to register a new employee</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                <User className="h-4 w-4 inline mr-2" />
                                Full Name
                              </label>
                              <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                placeholder="Enter full name"
                                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                <Mail className="h-4 w-4 inline mr-2" />
                                Email Address
                              </label>
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter email address"
                                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                <Phone className="h-4 w-4 inline mr-2" />
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="Enter phone number"
                                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                                required
                              />
                            </div>
                          </div>

                          <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={() => {
                                setShowEmployeeForm(false);
                                // Clear progress states when canceling
                                setUploadStatus('');
                                setUploadDetails([]);
                                setCurrentFileName('');
                                setProcessedCount(0);
                                setTotalCount(0);
                                setUploadProgress(0);
                                setIsUploading(false);
                              }}
                              className="px-8 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-base font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={formSubmitting}
                              className={`px-8 py-4 text-white rounded-lg font-medium transition-colors flex items-center text-base ${
                                formSubmitting 
                                  ? 'bg-gray-400 cursor-not-allowed' 
                                  : 'bg-green-600 hover:bg-green-700'
                              }`}
                            >
                              <Mail className="h-5 w-5 mr-2" />
                              {formSubmitting ? 'Sending Invitation...' : 'Submit and Send Mail'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* Bulk Upload Section */
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Bulk Upload Users</h4>
                            <p className="text-sm text-gray-600 mb-6">Upload multiple users using CSV or Excel files with member type classification</p>
                          </div>

                          {/* Progress Display */}
                          {(isUploading || uploadStatus) && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-blue-900">Upload Progress</h5>
                                {isUploading && (
                                  <span className="text-sm text-blue-700">
                                    {processedCount} / {totalCount} {totalCount > 1 ? 'files' : 'users'}
                                  </span>
                                )}
                              </div>
                              
                              {/* Current Status */}
                              <div className="flex items-center mb-3">
                                {isUploading && (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
                                )}
                                <span className="text-sm font-medium text-blue-800">{uploadStatus}</span>
                              </div>
                              
                              {/* Progress Bar */}
                              {isUploading && (
                                <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${uploadProgress}%` }}
                                  ></div>
                                </div>
                              )}
                              
                              {/* Current File */}
                              {currentFileName && (
                                <div className="text-xs text-blue-700 mb-3">
                                  📁 Current: {currentFileName}
                                </div>
                              )}
                              
                              {/* Upload Details Log */}
                              {uploadDetails.length > 0 && (
                                <div className="bg-white rounded border border-blue-200 max-h-32 overflow-y-auto">
                                  <div className="p-3 text-xs space-y-1">
                                    {uploadDetails.map((detail, index) => (
                                      <div key={index} className="text-gray-700 font-mono">
                                        {detail}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Upload User Data</h4>
                            <p className="text-sm text-gray-600 mb-4">Select one or more CSV or Excel files to upload</p>
                            
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              accept=".csv,.xlsx,.xls"
                              onChange={handleFileUpload}
                              className="hidden"
                              disabled={isUploading}
                            />
                            
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                              className={`px-6 py-3 rounded-lg transition-colors ${
                                isUploading 
                                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              <Upload className="h-4 w-4 inline mr-2" />
                              {isUploading ? 'Processing...' : 'Choose Files'}
                            </button>
                            
                            <p className="text-xs text-gray-500 mt-3">
                              Supported formats: CSV and Excel files (.csv, .xlsx, .xls). Multiple files allowed for bulk processing.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h5 className="font-medium text-blue-900 mb-2">Required CSV Columns:</h5>
                              <ul className="text-sm text-blue-800 space-y-1">
                                <li>• <strong>full_name</strong> - User's full name</li>
                                <li>• <strong>email</strong> - User's email address</li>
                                <li>• <strong>phone</strong> - User's phone number</li>
                                <li>• <strong>member_type</strong> - User type (optional)</li>
                              </ul>
                            </div>
                            
                            <div className="bg-green-50 p-4 rounded-lg">
                              <h5 className="font-medium text-green-900 mb-2">Supported Member Types:</h5>
                              <ul className="text-sm text-green-800 space-y-1">
                                <li>• <strong>farmer</strong> - Agricultural producers</li>
                                <li>• <strong>landowner</strong> - Land proprietors</li>
                                <li>• <strong>vendor</strong> - Agricultural vendors</li>
                                <li>• <strong>buyer</strong> - Agricultural buyers</li>
                                <li>• <strong>agricopilot</strong> - Agricultural experts</li>
                                <li>• <strong>consumer</strong> - End consumers</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Onboarding Tab Content */}
          {activeTab === 'onboard' && selectedUserType && (
            <div className="w-full p-6">
              {/* Professional User Management Interface */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Main Header */}
                <div className="bg-white px-8 py-6 border-b border-gray-200">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Title Section */}
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${
                        selectedUserType === 'agricopilot' ? 'bg-gradient-to-r from-green-500 to-blue-600' :
                        selectedUserType === 'farmer' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                        selectedUserType === 'landowner' ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
                        selectedUserType === 'vendor' ? 'bg-gradient-to-r from-purple-500 to-indigo-600' :
                        'bg-gradient-to-r from-blue-500 to-cyan-600'
                      }`}>
                        <Users className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                          {selectedUserType.charAt(0).toUpperCase() + selectedUserType.slice(1)} Management
                        </h1>
                        <p className="text-gray-600 mt-1 text-lg">
                          {showOnboarding ? (
                            `${selectedUserType.charAt(0).toUpperCase() + selectedUserType.slice(1)} Verification and Onboarding - Pending Users`
                          ) : (
                            selectedUserType === 'agricopilot' ? 'Agricultural Consultant Registry - Verified Users' :
                            selectedUserType === 'farmer' ? 'Farmer Registry - Verified Users' :
                            selectedUserType === 'landowner' ? 'Landowner Registry - Verified Users' :
                            selectedUserType === 'vendor' ? 'Agricultural Vendor Registry - Verified Users' :
                            'Agricultural Buyer Registry - Verified Users'
                          )}
                        </p>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            {(() => {
                              if (selectedUserType === 'agricopilot') return `${copilots.filter(c => c.verification_status === 'approved').length} Verified`;
                              if (selectedUserType === 'farmer') return `${farmers.filter(f => f.verification_status === 'approved').length} Verified`;
                              if (selectedUserType === 'landowner') return `${landowners.filter(l => l.verification_status === 'approved').length} Verified`;
                              if (selectedUserType === 'vendor') return `${vendors.filter(v => v.verification_status === 'approved').length} Verified`;
                              if (selectedUserType === 'buyer') return `${buyers.filter(b => b.verification_status === 'approved').length} Verified`;
                              if (selectedUserType === 'consumer') return `${consumers.filter(c => c.verification_status === 'approved').length} Verified`;
                              return '0 Verified';
                            })()}
                          </span>
                          <span className="flex items-center">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                            {(() => {
                              if (selectedUserType === 'agricopilot') return `${copilots.filter(c => c.verification_status === 'pending').length} Pending`;
                              if (selectedUserType === 'farmer') return `${farmers.filter(f => f.verification_status === 'pending').length} Pending`;
                              if (selectedUserType === 'landowner') return `${landowners.filter(l => l.verification_status === 'pending').length} Pending`;
                              if (selectedUserType === 'vendor') return `${vendors.filter(v => v.verification_status === 'pending').length} Pending`;
                              if (selectedUserType === 'buyer') return `${buyers.filter(b => b.verification_status === 'pending').length} Pending`;
                              if (selectedUserType === 'consumer') return `${consumers.filter(c => c.verification_status === 'pending').length} Pending`;
                              return '0 Pending';
                            })()}
                          </span>
                          <span className="flex items-center">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                            {(() => {
                              if (selectedUserType === 'agricopilot') return `${copilots.length} Total`;
                              if (selectedUserType === 'farmer') return `${farmers.length} Total`;
                              if (selectedUserType === 'landowner') return `${landowners.length} Total`;
                              if (selectedUserType === 'vendor') return `${vendors.length} Total`;
                              if (selectedUserType === 'buyer') return `${buyers.length} Total`;
                              if (selectedUserType === 'consumer') return `${consumers.length} Total`;
                              return '0 Total';
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* View Toggle Buttons */}
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => {
                            setShowOnboarding(false);
                            // Show approved users (registry view)
                          }}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
                            !showOnboarding 
                              ? 'bg-white text-blue-600 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          <List className="w-4 h-4 mr-2" />
                          View Registry
                        </button>
                        <button
                          onClick={() => {
                            setShowOnboarding(true);
                            // Show pending users (onboarding view)
                          }}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
                            showOnboarding 
                              ? 'bg-white text-orange-600 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Onboarding
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        {/* Refresh Data Button */}
                        {showOnboarding && (
                          <button
                            onClick={() => {
                              switch (selectedUserType) {
                                case 'farmer':
                                  fetchFarmers();
                                  break;
                                case 'vendor':
                                  fetchVendors();
                                  break;
                                case 'buyer':
                                  fetchBuyers();
                                  break;
                                case 'landowner':
                                  fetchLandowners();
                                  break;
                                case 'consumer':
                                  fetchConsumers();
                                  break;
                                default:
                                  fetchCopilots();
                              }
                            }}
                            disabled={loading}
                            className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
                          >
                            {loading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            ) : (
                              <Search className="w-4 h-4 mr-2" />
                            )}
                            {loading ? 'Loading...' : 'Refresh Data'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-navigation for Registry View */}
                {showOnboarding && (
                  <div className="bg-white px-8 py-4 border-b border-gray-100">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold text-gray-700">
                          {selectedUserType.charAt(0).toUpperCase() + selectedUserType.slice(1)} Registry Overview
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Last updated:</span>
                          <span className="text-sm font-medium text-gray-700">
                            {new Date().toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500">Quick Actions:</span>
                        
                        {/* Download Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                            <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${showDownloadMenu ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {showDownloadMenu && (
                            <>
                              {/* Backdrop to close dropdown */}
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setShowDownloadMenu(false)}
                              ></div>
                              
                              {/* Dropdown content */}
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                                <div className="py-1">
                                  <button
                                    onClick={handleDownloadExcel}
                                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                                  >
                                    <FileText className="w-4 h-4 mr-3 text-green-600" />
                                    <span className="font-medium">Excel Format</span>
                                  </button>
                                  <div className="border-t border-gray-100"></div>
                                  <button
                                    onClick={handleDownloadPDF}
                                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                                  >
                                    <FileText className="w-4 h-4 mr-3 text-red-600" />
                                    <span className="font-medium">PDF Format</span>
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Onboarding Content */}
                {showOnboarding ? (
                  <div className="p-6">
                    {loading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <span className="ml-2 text-gray-600">Loading {selectedUserType}s...</span>
                      </div>
                    ) : error ? (
                      <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg">
                        <div className="mb-2">⚠️ Error loading data</div>
                        <div className="text-sm">{error}</div>
                        <button 
                          onClick={() => {
                            switch (selectedUserType) {
                              case 'farmer': fetchFarmers(); break;
                              case 'vendor': fetchVendors(); break;
                              case 'buyer': fetchBuyers(); break;
                              case 'landowner': fetchLandowners(); break;
                              case 'consumer': fetchConsumers(); break;
                              default: fetchCopilots();
                            }
                          }} 
                          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <>
                        {(() => {
                          // Choose dataset based on selectedUserType
                          let allItems: any[] = [];
                          if (selectedUserType === 'farmer') allItems = farmers;
                          else if (selectedUserType === 'vendor') allItems = vendors;
                          else if (selectedUserType === 'buyer') allItems = buyers;
                          else if (selectedUserType === 'landowner') allItems = landowners;
                          else if (selectedUserType === 'consumer') allItems = consumers;
                          else allItems = copilots;

                          // Filter based on view mode:
                          // showOnboarding = true: Show only PENDING users (for verification)
                          // showOnboarding = false: Show only APPROVED users (in registry)
                          const items = allItems.filter(item => {
                            const status = item.verification_status || item.status || 'pending';
                            return showOnboarding ? status === 'pending' : status === 'approved';
                          });

                          if (!items || items.length === 0) {
                            return (
                              <div className="text-center py-8 text-gray-500">
                                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <div className="text-lg font-medium">
                                  {showOnboarding 
                                    ? `No pending ${selectedUserType}s for verification`
                                    : `No verified ${selectedUserType}s found`
                                  }
                                </div>
                                <div className="text-sm mt-1">
                                  {showOnboarding 
                                    ? `All ${selectedUserType}s have been verified or no registrations yet`
                                    : `No approved ${selectedUserType}s in the system yet`
                                  }
                                </div>
                                <button 
                                  onClick={() => {
                                    switch (selectedUserType) {
                                      case 'farmer': fetchFarmers(); break;
                                      case 'vendor': fetchVendors(); break;
                                      case 'buyer': fetchBuyers(); break;
                                      case 'landowner': fetchLandowners(); break;
                                      case 'consumer': fetchConsumers(); break;
                                      default: fetchCopilots();
                                    }
                                  }}
                                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                >
                                  Refresh Data
                                </button>
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
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-gray-900">
                                      ACTIONS
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                  {items.map((item) => {
                                    // Normalize fields
                                    const id = item.id || item.user_id || item.userId;
                                    const name = item.full_name || item.name || item.fullName || item.username;
                                    const email = item.email || item.user_email || '';
                                    const phone = item.phone || item.phone_number || item.phoneNumber || '';
                                    const status = item.verification_status || item.status || 'pending';
                                    const location = item.location || `${item.city || 'N/A'}, ${item.state || 'N/A'}`;

                                    return (
                                      <tr key={id} className="hover:bg-gray-50">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                                          <div className="flex items-center">
                                            {item.photo_url ? (
                                              <img src={`${API_BASE_URL.replace('/admin','')}${item.photo_url}`} alt="" className="h-10 w-10 rounded-full object-cover" />
                                            ) : (
                                              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                <User className="h-6 w-6 text-gray-400" />
                                              </div>
                                            )}
                                            <div className="ml-4">
                                              <div className="font-medium text-gray-900">{name}</div>
                                              <div className="text-gray-500 text-sm">{item.custom_id || item.customId || ''}</div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{email}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{phone || 'N/A'}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{location}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                            status === 'approved' || status === 'verified' ? 'bg-green-100 text-green-800' : 
                                            status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                            'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {String(status).charAt(0).toUpperCase() + String(status).slice(1)}
                                          </span>
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                          <button 
                                            onClick={() => handleViewUserDetails(item)} 
                                            className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                                          >
                                            View<ChevronRight className="ml-1 h-4 w-4" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="bg-white shadow-lg rounded-lg p-6">
                    <p className="text-gray-600 text-center">Click "View Registry" to see all registered {selectedUserType}s</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* User Details Modal */}
        {showUserDetails && selectedDetailUser && (
          <UserDetailsModal
            user={selectedDetailUser}
            isOpen={showUserDetails}
            onClose={() => {
              setShowUserDetails(false);
              setSelectedDetailUser(null);
            }}
            onSendVerificationEmail={(user) => {
              console.log('Sending verification email to:', user.email);
              alert(`Verification email sent to ${user.email}`);
            }}
            onVerifyUser={(user) => {
              // Use selectedUserType instead of guessing from user properties
              const userType = selectedUserType || 'farmer'; // default to farmer if no type selected
              
              // Call the existing handleUpdateStatus function for approval
              handleUpdateStatus(user.id || user._id, 'approve', userType);
            }}
            onRejectUser={(user) => {
              // Use selectedUserType instead of guessing from user properties
              const userType = selectedUserType || 'farmer'; // default to farmer if no type selected
              
              // Call the existing handleUpdateStatus function for rejection
              handleUpdateStatus(user.id || user._id, 'reject', userType);
            }}
          />
        )}

        {/* AgriCopilot Details Modal */}
        {showCopilotDetails && selectedCopilot && (
          <UserDetailsModal
            user={selectedCopilot}
            isOpen={showCopilotDetails}
            onClose={() => {
              setShowCopilotDetails(false);
              setSelectedCopilot(null);
            }}
            onSendVerificationEmail={(user) => {
              console.log('Sending verification email to:', user.email);
              alert(`Verification email sent to ${user.email}`);
            }}
            onVerifyUser={(user) => {
              // Call the existing handleUpdateStatus function for approval
              handleUpdateStatus(user.id || user._id, 'approve', 'agricopilot');
            }}
            onRejectUser={(user) => {
              // Call the existing handleUpdateStatus function for rejection
              handleUpdateStatus(user.id || user._id, 'reject', 'agricopilot');
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

// Wrapper component for Next.js page routing
const SuperAdminPage: React.FC = () => {
  return (
    <ProtectedRoute requiredRole="super_admin">
      <SuperAdmin />
    </ProtectedRoute>
  );
};

export default SuperAdminPage;