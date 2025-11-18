// Common types used across SuperAdmin components

export type UserType = 'agricopilot' | 'farmer' | 'landowner' | 'vendor' | 'buyer' | 'consumer';
export type TabType = 'dashboard' | 'users' | 'analytics' | 'settings' | 'onboard' | 'activities' | 'addEmployee';

export interface AgriCopilot {
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
  location?: string;
  city?: string;
  state?: string;
}

export interface Farmer {
  id: string;
  custom_id?: string;
  full_name: string;
  email: string;
  phone: string;
  aadhar_number?: string;
  verification_status: string;
  created_at: string;
  photo_url?: string;
  aadhar_front_url?: string;
  aadhar_back_url?: string;
  location?: string;
  city?: string;
  state?: string;
}

export interface Landowner {
  id: string;
  custom_id?: string;
  full_name: string;
  email: string;
  phone: string;
  aadhar_number?: string;
  verification_status: string;
  created_at: string;
  photo_url?: string;
  aadhar_front_url?: string;
  aadhar_back_url?: string;
  location?: string;
  city?: string;
  state?: string;
}

export interface Vendor {
  id: string;
  custom_id?: string;
  full_name: string;
  email: string;
  phone: string;
  aadhar_number?: string;
  verification_status: string;
  created_at: string;
  photo_url?: string;
  aadhar_front_url?: string;
  aadhar_back_url?: string;
  location?: string;
  city?: string;
  state?: string;
}

export interface Buyer {
  id: string;
  custom_id?: string;
  full_name: string;
  email: string;
  phone: string;
  aadhar_number?: string;
  verification_status: string;
  created_at: string;
  photo_url?: string;
  aadhar_front_url?: string;
  aadhar_back_url?: string;
  location?: string;
  city?: string;
  state?: string;
}

export interface Consumer {
  id: string;
  custom_id?: string;
  full_name: string;
  email: string;
  phone: string;
  aadhar_number?: string;
  verification_status: string;
  created_at: string;
  photo_url?: string;
  aadhar_front_url?: string;
  aadhar_back_url?: string;
  location?: string;
  city?: string;
  state?: string;
}

export interface SuperAdminProps {
  onLogout?: () => void;
}

// Union type for all user types
export type AllUserTypes = AgriCopilot | Farmer | Landowner | Vendor | Buyer | Consumer;

// Common props for manager components
export interface ManagerProps {
  onUpdateStatus: (userId: string, status: 'approve' | 'reject', userType: UserType) => Promise<void>;
  onViewDetails: (user: any) => void;
  loading: boolean;
}

// Constants
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
export const BACKEND_MEMBER_TYPES = ['farmer', 'landowner', 'vendor', 'buyer', 'agri_copilot'];