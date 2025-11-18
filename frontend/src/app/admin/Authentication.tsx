

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as ToastPrimitives from "@radix-ui/react-toast";
import { X, Eye, EyeOff, Check, Circle } from "lucide-react";
import { cva } from "class-variance-authority";
import { getRoleBasedRedirect, allowNavigation, setAuthData } from '@/lib/auth';

// Local implementation of cn utility
const cn = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Toast implementation
const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    style={{
      pointerEvents: 'none',
    }}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full data-[state=open]:sm:slide-in-from-right-full",
  {
    variants: {
      variant: {
        default: "border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200",
        success: "border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200",
        error: "border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200",
        warning: "border-yellow-500 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200",
        info: "border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
    title?: React.ReactNode;
    description?: React.ReactNode;
    variant?: "default" | "success" | "error" | "warning" | "info";
  }
>(({ className, title, description, variant, ...props }, ref) => {
  const icon = {
    default: (
      <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    success: (
      <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }[variant || 'default'];

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 pt-0.5">
          {icon}
        </div>
        <div className="grid gap-1">
          {title && (
            <ToastPrimitives.Title className="text-sm font-semibold">
              {title}
            </ToastPrimitives.Title>
          )}
{description && (
  <div className="text-sm">
    {description}
  </div>
)}

        </div>
      </div>
      <ToastPrimitives.Close className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100">
        <X className="h-4 w-4" />
      </ToastPrimitives.Close>
    </ToastPrimitives.Root>
  );
});

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-slate-950/50 opacity-0 transition-opacity hover:text-slate-950 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

interface ToastProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  className?: string;
  duration?: number;
  id?: string;
  onDismiss?: () => void;
}

interface ToastState {
  id: string;
  props: ToastProps;
  dismiss: () => void;
}

const toastState = {
  toasts: [] as ToastState[],
  listeners: [] as ((toasts: ToastState[]) => void)[],
};

function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>(toastState.toasts);

  useEffect(() => {
    toastState.listeners.push(setToasts);
    return () => {
      const index = toastState.listeners.indexOf(setToasts);
      if (index > -1) toastState.listeners.splice(index, 1);
    };
  }, []);

  const dismiss = (id: string) => {
    const index = toastState.toasts.findIndex((t) => t.id === id);
    if (index > -1) {
      const [toast] = toastState.toasts.splice(index, 1);
      if (toast.props.onDismiss) {
        toast.props.onDismiss();
      }
      toastState.listeners.forEach((listener) => listener([...toastState.toasts]));
    }
  };

  const toast = (props: ToastProps) => {
    const id = props.id || Math.random().toString(36).substring(2, 9);
    
    console.log('🔥 DEBUG: Toast function called with:', { id, title: props.title, description: props.description });
    console.log('🔥 DEBUG: Current toasts in state:', toastState.toasts.length);
    console.log('🔥 DEBUG: Current listeners:', toastState.listeners.length);
    
    // Check if toast with this ID already exists
    const existingIndex = props.id ? toastState.toasts.findIndex(t => t.id === props.id) : -1;
    
    const dismiss = () => {
      const index = toastState.toasts.findIndex((t) => t.id === id);
      if (index > -1) {
        const [toast] = toastState.toasts.splice(index, 1);
        if (toast.props.onDismiss) {
          toast.props.onDismiss();
        }
        toastState.listeners.forEach((listener) => listener([...toastState.toasts]));
      }
    };

    const toastObj = {
      id,
      props: {
        ...props,
        onDismiss: props.onDismiss
      },
      dismiss
    };

    if (existingIndex > -1) {
      // Update existing toast
      toastState.toasts[existingIndex] = toastObj;
      console.log('🔄 DEBUG: Updated existing toast');
    } else {
      // Add new toast
      toastState.toasts.push(toastObj);
      console.log('➕ DEBUG: Added new toast, total:', toastState.toasts.length);
    }

    console.log('📢 DEBUG: Notifying listeners:', toastState.listeners.length);
    toastState.listeners.forEach((listener) => {
      console.log('📣 DEBUG: Calling listener with toasts:', toastState.toasts.length);
      listener([...toastState.toasts]);
    });

    // Auto-dismiss if duration is set
    if (props.duration !== 0) {
      setTimeout(() => {
        dismiss();
      }, props.duration || 5000);
    }

    return {
      id,
      dismiss,
      update: (newProps: Partial<ToastProps>) => {
        const index = toastState.toasts.findIndex(t => t.id === id);
        if (index > -1) {
          toastState.toasts[index] = {
            ...toastState.toasts[index],
            props: {
              ...toastState.toasts[index].props,
              ...newProps
            }
          };
          toastState.listeners.forEach((listener) => listener([...toastState.toasts]));
        }
      }
    };
  };

  return { toast, toasts, dismiss };
}

// Label component implementation
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    required?: boolean;
  }
>(({ className, required, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  >
    {props.children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </LabelPrimitive.Root>
));
Label.displayName = LabelPrimitive.Root.displayName;

type AuthView = 'login' | 'forgot-password' | 'verify-otp' | 'reset-password';

interface AuthProps {
  onBackToHome: () => void;
  onGoToRegister?: () => void; // Made optional since registration is removed
  onLoginSuccess?: () => void;
}

export default function AuthComponent({ onBackToHome, onGoToRegister, onLoginSuccess }: AuthProps) {
  const router = useRouter();
  const { toast, toasts } = useToast();
  
  // State management
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [loginData, setLoginData] = useState({
    email: '',
    phone: '',
    password: '',
    loginMethod: 'email' as 'email' | 'phone'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState(''); // Used for forgot password (can be email or phone)
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  
  // State for cleanup timers
  const [notificationTimer, setNotificationTimer] = useState<NodeJS.Timeout | null>(null);
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);
  const [loginPopMessage, setLoginPopMessage] = useState<string | null>(null);
  const [loginToast, setLoginToast] = useState<{
    open: boolean;
    full_name?: string;
    user_type?: string;
  }>({ open: false });

  // Phone number formatting utility
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Handle different input scenarios
    if (digits.length === 0) return '';
    
    // If digits start with 91, ensure it's properly formatted
    if (digits.startsWith('91')) {
      const phoneDigits = digits.substring(2);
      // Limit to 10 digits after country code
      return phoneDigits.slice(0, 10);
    }
    
    // If it's a 10-digit number, just return it (we'll add +91 prefix in display)
    if (digits.length <= 10) {
      return digits;
    }
    
    // If it's longer than 10 digits and doesn't start with 91, take first 10
    return digits.slice(0, 10);
  };

  // Input change handlers
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // If it's a phone input, format the number
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      
      setLoginData(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else {
      setLoginData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const toggleLoginMethod = () => {
    setLoginData(prev => ({
      ...prev,
      loginMethod: prev.loginMethod === 'email' ? 'phone' : 'email',
      email: prev.loginMethod === 'email' ? '' : prev.email,
      phone: prev.loginMethod === 'phone' ? '' : prev.phone
    }));
    setError('');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  // Password validation function
  const validatePassword = (password: string) => {
    const minLength = typeof password === 'string' && password.length >= 8;
    const hasUpper = /[A-Z]/.test(password || '');
    const hasLower = /[a-z]/.test(password || '');
    const hasNumber = /[0-9]/.test(password || '');
    const hasSpecial = /[!@#$%^&*(),.?"':{}|<>[\]/\\`~\-_+=;:]/.test(password || '');
    return { minLength, hasUpper, hasLower, hasNumber, hasSpecial };
  };

  // Password requirements item component
  const PasswordRequirementItem = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
    <div className="flex items-start gap-2">
      <div className={`w-5 h-5 flex items-center justify-center rounded-full ${ok ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
        {ok ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
      </div>
      <div className={`text-sm ${ok ? 'text-gray-800' : 'text-gray-500'}`}>{children}</div>
    </div>
  );

  // Password requirements tooltip component
  const PasswordRequirements = ({ password, show }: { password: string; show: boolean }) => {
    const rules = validatePassword(password || '');
    if (!show) return null;
    
    return (
      <div 
        className="absolute z-50 mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-lg max-w-xs"
        onMouseEnter={() => setShowPasswordRequirements(true)}
        onMouseLeave={() => setShowPasswordRequirements(false)}
      >
        <div className="mb-2 text-sm font-semibold text-gray-800">Password requirements</div>
        <div className="grid grid-cols-1 gap-2">
          <PasswordRequirementItem ok={rules.minLength}>At least 8 characters</PasswordRequirementItem>
          <PasswordRequirementItem ok={rules.hasUpper}>One uppercase letter (A-Z)</PasswordRequirementItem>
          <PasswordRequirementItem ok={rules.hasLower}>One lowercase letter (a-z)</PasswordRequirementItem>
          <PasswordRequirementItem ok={rules.hasNumber}>One number (0-9)</PasswordRequirementItem>
          <PasswordRequirementItem ok={rules.hasSpecial}>One special character (e.g. !@#$%)</PasswordRequirementItem>
        </div>
      </div>
    );
  };

  // Form submission handlers
const API_URL: string = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Validate input based on login method
      if (loginData.loginMethod === 'email') {
        if (!loginData.email) {
          throw new Error('Please enter your email');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
          throw new Error('Please enter a valid email address');
        }
      } else {
        if (!loginData.phone) {
          throw new Error('Please enter your phone number');
        }
        // Strict phone number validation (exactly 10 digits for India)
        if (loginData.phone.length !== 10 || !/^[6-9][0-9]{9}$/.test(loginData.phone)) {
          throw new Error('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9');
        }
      }
      
      if (!loginData.password) {
        throw new Error('Please enter your password');
      }
      if (loginData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Prepare login payload
      const loginPayload = loginData.loginMethod === 'email'
        ? { 
            email: loginData.email.toLowerCase().trim(), 
            password: loginData.password,
            auth_method: "password"
          }
        : { 
            phone: `+91${loginData.phone}`, // Always add +91 prefix
            password: loginData.password,
            auth_method: "password"
          };

      // Add device info to the payload
      const deviceInfo = {
        user_agent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      const loginDataWithDevice = {
        ...loginPayload,
        device_info: deviceInfo
      };

      // Make API call to login endpoint
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(loginDataWithDevice)
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        toast({
          title: 'Login Error',
          description: 'Invalid response from server. Please try again.',
          variant: 'destructive'
        });
        throw new Error('Invalid response from server. Please try again.');
      }
      
      if (!response.ok) {
        // Debug logging to see what we're getting from server
        console.log('🐛 DEBUG Login Error:', {
          status: response.status,
          statusText: response.statusText,
          responseData: data,
          dataDetail: data?.detail,
          dataMessage: data?.message,
          dataError: data?.error,
          allKeys: Object.keys(data || {}),
          fullResponseBody: JSON.stringify(data, null, 2),
          rawResponse: data
        });
        
        // Also log individual fields to see what's available
        console.log('🔍 Server response fields:');
        console.log('- data.detail:', data?.detail);
        console.log('- data.message:', data?.message);
        console.log('- data.error:', data?.error);
        console.log('- data.msg:', data?.msg);
        console.log('- data.description:', data?.description);
        
        let errorMessage = data?.detail || data?.message || 
          'Login failed. Please check your credentials and try again.';
        
        // FIRST CHECK: If it's specifically about pending approval, override any status code
        if ((data?.detail && data.detail.includes('pending admin approval')) ||
            (data?.message && data.message.includes('pending admin approval'))) {
          console.log('📋 Detected pending approval message');
          errorMessage = `🔒 Account Pending Approval

Your registration was successful, but your account needs admin approval.

Next steps:
• Check your email for confirmation
• Wait for admin approval (usually 24-48 hours)  
• You'll receive an email once approved

If urgent, contact support at support@agrihub.com`;
        }
        // Handle specific error cases
        if (response.status === 401) {
          errorMessage = 'Invalid credentials. Please check your email/phone and password and try again.';
        } else if (response.status === 403) {
          // Check if it's an approval-related message
          if (data?.detail && data.detail.includes('awaiting approval')) {
            errorMessage = 'You can log in, but your account is still awaiting approval';
          } else {
            errorMessage = data?.detail || 'Account not verified. Please check your email for verification link.';
          }
        } else if (response.status === 400) {
          // Handle validation errors
          if (data.errors) {
            errorMessage = Object.entries(data.errors)
              .map(([field, msg]) => 
                `${field.charAt(0).toUpperCase() + field.slice(1)}: ${Array.isArray(msg) ? msg.join('. ') : msg}`
              )
              .join('\n');
          }
        } else if (response.status === 429) {
          errorMessage = 'Too many login attempts. Please try again later.';
        } else if (response.status >= 500) {
          // Check if it's actually a credential error disguised as server error
          if (data?.detail && (
            data.detail.toLowerCase().includes('invalid credentials') ||
            data.detail.toLowerCase().includes('incorrect password') ||
            data.detail.toLowerCase().includes('authentication failed') ||
            data.detail.toLowerCase().includes('wrong password') ||
            data.detail.toLowerCase().includes('login failed')
          )) {
            errorMessage = 'Invalid credentials. Please check your email/phone and password and try again.';
          } else if (data?.detail === 'An unexpected error occurred') {
            // This is likely a credential error being reported as a generic server error
            errorMessage = 'Invalid credentials. Please check your email/phone and password and try again.';
          } else {
            errorMessage = 'Server error occurred. Please try again later.';
          }
        }
        
        // Final fallback check for credential errors regardless of status code
        if (errorMessage && (
          errorMessage.toLowerCase().includes('invalid credentials') ||
          errorMessage.toLowerCase().includes('incorrect password') ||
          errorMessage.toLowerCase().includes('authentication failed') ||
          errorMessage.toLowerCase().includes('wrong password') ||
          errorMessage.toLowerCase().includes('login failed')
        )) {
          errorMessage = 'Invalid credentials. Please check your email/phone and password and try again.';
        }
        
        throw new Error(errorMessage);
      }

      // On successful login
      console.log('🔍 DEBUG: Login response data:', data);
      console.log('🔍 DEBUG: access_token from response:', data.access_token);
      console.log('🔍 DEBUG: Full response structure:', JSON.stringify(data, null, 2));
      
      const { user, access_token, token_type } = data;

      // Check if access_token exists
      if (!access_token) {
        console.error('❌ No access_token in response! Full response:', data);
        // Check if token is nested in the response
        if (data.token || data.accessToken || data.access) {
          console.warn('⚠️ Token found with different key name:', {
            token: data.token,
            accessToken: data.accessToken,
            access: data.access
          });
        }
        throw new Error('Login response missing access_token');
      }

      // Store tokens securely with tab isolation
      console.log('💾 Storing auth data with tab isolation');
      
      // Store auth data using tab-isolated storage
      setAuthData({
        user: user,
        token: access_token,
        token_type: token_type || 'bearer'
      });
      
      console.log('✅ Auth data stored successfully for tab:', sessionStorage.getItem('_agri_tab_id'));

      // Role-based redirect logic
      const userRole = user.role?.toLowerCase();
      
      // Clear any existing timers first
      if (notificationTimer) clearTimeout(notificationTimer);
      if (redirectTimer) clearTimeout(redirectTimer);

      // Get redirect path using helper function
      const redirectPath = getRoleBasedRedirect(user.role);
      
      // Show success toast with appropriate message
      toast({
        title: "Login Successful! 🎉",
        description: `Welcome back, ${user.full_name || user.name || 'User'}! Redirecting to your dashboard...`,
        duration: 3000
      });
      
      // Allow navigation before redirecting
      allowNavigation();
      
      // Simple redirect after short delay
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 1500);
      
      return;

      // This code should not be reached due to role-based redirect above
      console.warn('Unexpected code path reached for user role:', user.role);

      
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      
      toast({
        title: "❌ Login Error",
        description: errorMessage,
        variant: "destructive",
        className: 'w-full max-w-md',
        duration: 5000 // 5 seconds
      });
      
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    // Determine if we're using email or phone for password reset
    let resetPayload = {};
    const isEmail = email.includes('@');
    
    if (!email) {
      toast({
        title: "✋ Input Required",
        description: `Please enter your ${loginData.loginMethod === 'email' ? 'email address' : 'phone number'} to reset your password.`,
        variant: "destructive",
        className: 'w-full max-w-md',
        duration: 5000
      });
      return;
    }
    
    // Validate email or phone format
    if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "✋ Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
        className: 'w-full max-w-md',
        duration: 5000
      });
      return;
    } else if (!isEmail && !/^\+?[0-9]{10,15}$/.test(email)) {
      toast({
        title: "✋ Invalid Phone Number",
        description: "Please enter a valid phone number with country code (e.g., +91XXXXXXXXXX).",
        variant: "destructive",
        className: 'w-full max-w-md',
        duration: 5000
      });
      return;
    }
    
    // Set the appropriate payload based on input type
    resetPayload = isEmail ? { email } : { phone: `+91${email}` };
    
    setIsLoading(true);
    
    try {
      // Show loading toast with a unique ID
      const toastId = `loading-${Date.now()}`;
      const loadingToast = toast({
        id: toastId,
        title: 'Sending OTP...',
        description: 'Please wait while we send a verification code to your email.',
        duration: 0,
        className: 'w-full max-w-md'
      });
      
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(resetPayload),
        credentials: 'same-origin'
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        toast({
          title: 'Error',
          description: 'Failed to process server response.',
          variant: 'destructive'
        });
      }
      
      if (!response.ok) {
        const errorMessage = data?.detail || 'Failed to send OTP. Please try again.';
        
        // Dismiss loading toast and show error
        if (loadingToast && typeof loadingToast.dismiss === 'function') {
          loadingToast.dismiss();
        }
        
        // Show error toast
        toast({
          title: "❌ Reset Failed",
          description: errorMessage,
          variant: "destructive",
          className: 'w-full max-w-md',
          duration: 5000
        });
        
        throw new Error(errorMessage);
      }

      setResendTimer(60);
      // Dismiss loading toast and show success
      if (loadingToast && typeof loadingToast.dismiss === 'function') {
        loadingToast.dismiss();
      }
      
      // Show success toast with simple string description
      const isEmail = email.includes('@');
      console.log('🎉 DEBUG: About to show OTP sent success toast');
      
      toast({
        title: isEmail ? "📧 OTP Sent Successfully!" : "📱 OTP Sent Successfully!",
        description: `A 6-digit verification code has been sent to ${email}. ${isEmail ? 'Please check your email inbox and spam folder.' : 'Please check your phone for the SMS.'}`,
        className: 'w-full max-w-md',
        duration: 8000
      });
      
      console.log('✅ DEBUG: OTP sent toast called');
      
      // Update UI state
      setCurrentView('verify-otp');
      setResendTimer(60);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      toast({
        title: "Failed to Send OTP",
        description: errorMessage,
        variant: "destructive",
        className: 'w-full max-w-md',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!otp) {
      toast({
        title: "OTP Required",
        description: "Please enter the verification code",
        variant: "destructive"
      });
      return;
    }

    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit verification code",
        variant: "destructive"
      });
      return;
    }

    if (!email) {
      toast({
        title: "Email Required",
        description: "Email is required for OTP verification",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp
        }),
        credentials: 'same-origin'  // Ensure consistent CORS handling
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'OTP verification failed');
      }

      setCurrentView('reset-password');
      console.log('✅ DEBUG: About to show OTP verification success toast');
      
      toast({
        title: "OTP Verified Successfully! ✅",
        description: "Your identity has been verified. You can now set your new password.",
        duration: 4000
      });
      
      console.log('✅ DEBUG: OTP verification toast called');
    } catch (error: any) {
      toast({
        title: "OTP Verification Failed",
        description: error.message || "Invalid or expired OTP. Please try again.",
        variant: "destructive",
      });
      if (!otp || otp.length !== 6) {
        setOtp('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "The passwords you entered do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Email is required to complete the password reset",
        variant: "destructive"
      });
      return;
    }
    
    if (!otp || otp.length !== 6) {
      toast({
        title: "OTP Required",
        description: "Please enter the 6-digit OTP sent to your email",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Send reset password request with email and OTP in the body
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: otp,
          new_password: newPassword,
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Try to get the error message from the response
        const errorMessage = data.detail || 
                           (typeof data === 'string' ? data : 'Failed to reset password');
        throw new Error(errorMessage);
      }

      // Reset form and show success message
      setEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentView('login');
      
      console.log('🔒 DEBUG: About to show password reset success toast');
      
      toast({
        title: "Password Reset Successful! 🔒",
        description: "Your password has been updated. Please login with your new password.",
        duration: 4000
      });
      
      console.log('✅ DEBUG: Password reset toast called');
    } catch (error: any) {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Unable to reset your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to resend OTP');
      }

      setResendTimer(60);
      console.log('🔄 DEBUG: About to show resend OTP success toast');
      
      toast({
        title: "New OTP Sent! 📧",
        description: `A new verification code has been sent to ${email}. Please check your email inbox and spam folder.`,
        duration: 4000
      });
      
      console.log('✅ DEBUG: Resend OTP toast called');
    } catch (error: any) {
      toast({
        title: "Failed to Resend OTP",
        description: error.message || "Unable to send a new verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Common classes for consistent styling
  const inputClasses = "w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent";
  const buttonClasses = "w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200";
  const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const cardClasses = "bg-white rounded-md shadow p-8 max-w-md w-full mx-auto my-6 border border-gray-200";
  const linkClasses = "text-green-600 hover:text-green-700 text-sm font-medium";

  // Render the appropriate form based on currentView
  const renderForm = () => {
    switch (currentView) {
      case 'login':
        return (
          <div className="w-full">
            <div className="flex items-center justify-center mb-8">
              <img 
                src="/title logo.jpg" 
                alt="AgriHub" 
                className="h-12 w-auto"
              />
            </div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Login to access your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                  {error}
                </div>
              )}
              
              {/* removed top email/phone toggle per UX request */}
              
              {loginData.loginMethod === 'email' ? (
                <div className="mb-4">
                  <label htmlFor="email" className={labelClasses}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    className={inputClasses}
                    required
                    placeholder="Enter your email"
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <label htmlFor="phone" className={labelClasses}>
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500 text-sm">+91</span>
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={loginData.phone}
                      onChange={handleLoginChange}
                      className={`${inputClasses} pl-12`}
                      required
                      placeholder="0000000000"
                      pattern="[0-9]{10}"
                      maxLength={10}
                    />
                  </div>
                  {loginData.phone && (
                    <p className="mt-1 text-xs text-green-600">Full number: +91{loginData.phone}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Enter your 10-digit mobile number (will be saved as +91{loginData.phone || 'XXXXXXXXXX'})</p>
                </div>
              )}
              
              <div className="mb-1">
                <label htmlFor="password" className={labelClasses}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div className="flex justify-end mt-1">
                      <button
                        type="button"
                        onClick={() => setCurrentView('forgot-password')}
                        className="text-sm text-green-600 hover:text-green-700"
                      >
                        Forgot password?
                      </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-center mb-4">
                  <button
                    type="button"
                    onClick={() => setLoginData(prev => ({
                      ...prev,
                      loginMethod: prev.loginMethod === 'email' ? 'phone' : 'email'
                    }))}
                    className="flex items-center text-sm text-green-600 hover:text-green-700"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 mr-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d={
                          loginData.loginMethod === 'email' 
                            ? "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
                            : "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        } 
                      />
                    </svg>
                    {loginData.loginMethod === 'email' ? 'Use Phone Number' : 'Use Email'}
                  </button>
                </div>

                <button
                  type="submit"
                  className={buttonClasses}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
      );

    case 'forgot-password':
      return (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-white">
                {loginData.loginMethod === 'email' ? 'Email' : 'Phone Number'}
              </label>
              <button
                type="button"
                onClick={() => {
                  setLoginData(prev => ({
                    ...prev,
                    loginMethod: prev.loginMethod === 'email' ? 'phone' : 'email'
                  }));
                  setEmail('');
                }}
                className="text-xs font-medium text-white hover:text-gray-200 transition-colors"
              >
                {loginData.loginMethod === 'email' ? 'Use Phone Number' : 'Use Email'}
              </button>
            </div>
            
            {loginData.loginMethod === 'email' ? (
              <input
                type="email"
                id="forgot-email"
                value={email}
                onChange={handleEmailChange}
                className={`${inputClasses} mt-2`
                }
                placeholder="Enter your email"
                required
              />
            ) : (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500 text-sm">+91</span>
                </div>
                <input
                  type="tel"
                  id="forgot-phone"
                  value={email}
                  onChange={(e) => setEmail(formatPhoneNumber(e.target.value))}
                  className="w-full px-4 py-2 pl-12 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent mt-2"
                  placeholder="0000000000"
                  maxLength={10}
                  required
                />
                {loginData.loginMethod === 'phone' && email && (
                  <p className="mt-1 text-xs text-green-600">Will send OTP to: +91{email}</p>
                )}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || (loginData.loginMethod === 'email' ? !email.includes('@') : email.length < 10)}
            className="w-full flex justify-center py-3 px-6 rounded-xl text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300"
          >
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      );

    case 'verify-otp':
      return (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">Enter OTP</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={handleOtpChange}
              maxLength={6}
              className="mt-2 w-full px-4 py-3 text-center text-lg font-medium border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent tracking-widest"
              required
              placeholder="000000"
            />
            {resendTimer > 0 ? (
              <p className="mt-2 text-sm text-gray-600">Resend OTP in {resendTimer}s</p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                className="mt-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                disabled={isLoading}
              >
                Resend OTP
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      );

    case 'reset-password':
      const pwRules = validatePassword(newPassword || '');
      const isPasswordValid = Object.values(pwRules).every(Boolean);
      return (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New Password</label>
            <div className="relative mt-2">
              <input
                type={showNewPassword ? "text" : "password"}
                id="new-password"
                value={newPassword}
                onChange={handleNewPasswordChange}
                onFocus={() => setShowPasswordRequirements(true)}
                onBlur={(e) => {
                  // Only hide if not hovering and not focusing on the tooltip itself
                  setTimeout(() => setShowPasswordRequirements(false), 100);
                }}
                onMouseEnter={() => setShowPasswordRequirements(true)}
                onMouseLeave={(e) => {
                  // Only hide if the field is not focused
                  if (document.activeElement !== e.target) {
                    setShowPasswordRequirements(false);
                  }
                }}
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                minLength={8}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                tabIndex={-1}
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              {/* Password requirements tooltip */}
              <PasswordRequirements password={newPassword} show={showPasswordRequirements} />
            </div>
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative mt-2">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm-password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                minLength={8}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || newPassword !== confirmPassword || !isPasswordValid}
            className="w-full flex justify-center py-3 px-6 rounded-xl text-base font-medium text-white bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 shadow-lg hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 border border-amber-400/30"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      );

    default:
      return null;
  }
};

return (
  <div className="min-h-screen bg-gray-50">
    <ToastProvider>
      <header className="w-full bg-white border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-md bg-green-600 flex items-center justify-center text-white font-bold">AH</div>
              <div className="flex flex-col leading-tight">
                <div className="flex items-baseline gap-3">
                  <span className="text-lg font-semibold text-gray-900">AgriHub</span>
                  <span className="text-sm text-gray-500">| {currentView === 'login' ? 'Login' : 'Reset Password'}</span>
                </div>
                <p className="text-xs text-gray-400">Secure admin access</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={onBackToHome} className="text-sm font-medium text-green-600 hover:text-green-700">Back to site</button>
                 </div>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="w-full">
            <div className="mb-6">
              <h2 className="text-3xl font-semibold text-gray-900">
                {currentView === 'login' ? 'Login' : currentView === 'forgot-password' ? 'Reset Password' : 'Reset Password'}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {currentView === 'login' ? 'Access your AgriHub admin dashboard' : 'Enter your email to reset your password'}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-4 border-b border-gray-200">
                <button className={cn('py-2 px-4 -mb-px', currentView === 'login' ? 'border-b-2 border-green-600 text-green-700 font-medium' : 'text-gray-600')} onClick={() => { setCurrentView('login'); }}>
                  Login
                </button>
                <button className={cn('py-2 px-4 -mb-px', currentView === 'forgot-password' || currentView === 'reset-password' ? 'border-b-2 border-green-600 text-green-700 font-medium' : 'text-gray-600')} onClick={() => { setCurrentView('forgot-password'); }}>
                  Reset Password
                </button>
              </div>
            </div>

            <div className={`transition-opacity duration-300 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
              {renderForm()}
            </div>

            {loginToast.open && (
              <div className="fixed left-1/2 transform -translate-x-1/2 bottom-12 z-50 w-full max-w-md px-4 pointer-events-none">
                <Toast
                  open={loginToast.open}
                  variant="success"
                  title="🎉 Login Successful"
                  description={<div>Welcome, <span className="font-semibold">{loginToast.full_name}</span>!<br /><span className="text-xs">Logged in as <span className="font-medium">{loginToast.user_type}</span></span></div>}
                  className="w-full pointer-events-auto"
                />
              </div>
            )}
          </div>

          <div className="hidden md:block w-full h-full rounded-md overflow-hidden">
            <div className="w-full h-full bg-cover bg-center rounded-md shadow" style={{ backgroundImage: "url('/hero-agriculture.jpg')", minHeight: 420 }} />
          </div>
        </div>
      </main>

      <ToastViewport />
      
      {/* Render toasts from useToast hook */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.props.title ? String(toast.props.title) : undefined}
          description={toast.props.description ? String(toast.props.description) : undefined}
          variant={toast.props.variant === 'destructive' ? 'error' : 'success'}
          className={toast.props.className}
        />
      ))}
    </ToastProvider>
  </div>
);
}
