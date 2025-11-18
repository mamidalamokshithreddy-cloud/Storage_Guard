import { UserRole } from './enums';

// Re-export UserRole for convenience
export { UserRole } from './enums';

export interface User {
  id: string;
  custom_id: string;
  email: string;
  phone: string;
  role: UserRole;
  full_name?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterUserResponse {
  user: User;
  message: string;
  success: boolean;
}

export interface UserFormData {
  email: string;
  phone: string;
  password: string;
  full_name: string;
  role: UserRole;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  [key: string]: string | number | boolean | Date | undefined; // For additional fields based on user type
}

export interface RegistrationToastConfig {
  title: string;
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
}