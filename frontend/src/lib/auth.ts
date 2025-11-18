export type UserRole = 'farmer' | 'landowner' | 'buyer' | 'vendor' | 'agri_copilot' | 'agricopilot' | 'admin' | 'super_admin' | 'lab' | 'consumer';

export interface AuthUser {
  email: string;
  role: UserRole;
  id: string;
  name?: string;
  phone?: string;
  full_name?: string;
}

// ============= TAB ISOLATION SYSTEM =============
// Generate unique tab session ID for complete isolation
function getTabId(): string {
  let tabId = sessionStorage.getItem('_agri_tab_id');
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('_agri_tab_id', tabId);
  }
  return tabId;
}

// Storage functions with complete tab isolation
function getTabStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Check logout state first
    const loggedOut = sessionStorage.getItem('_agri_logged_out');
    if (loggedOut === 'true') return null;
    
    const tabId = getTabId();
    const tabKey = `${key}__${tabId}`;
    
    // Try tab-specific key first
    let value = sessionStorage.getItem(tabKey);
    
    // If no tab-specific data and this is a fresh tab, migrate from localStorage
    if (!value && !sessionStorage.getItem('_agri_has_session')) {
      value = localStorage.getItem(key);
      if (value) {
        // Migrate to tab-specific storage
        sessionStorage.setItem(tabKey, value);
        sessionStorage.setItem('_agri_has_session', 'true');
      }
    }
    
    return value;
  } catch (error) {
    console.error(`Error getting tab storage ${key}:`, error);
    return null;
  }
}

function setTabStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const tabId = getTabId();
    const tabKey = `${key}__${tabId}`;
    
    // Store in tab-specific sessionStorage
    sessionStorage.setItem(tabKey, value);
    sessionStorage.setItem('_agri_has_session', 'true');
    
    // Clear logout flag
    sessionStorage.removeItem('_agri_logged_out');
    
    // Store in localStorage only if it's empty (for new browser sessions)
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    console.error(`Error setting tab storage ${key}:`, error);
  }
}

function removeTabStorage(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const tabId = getTabId();
    const tabKey = `${key}__${tabId}`;
    sessionStorage.removeItem(tabKey);
  } catch (error) {
    console.error(`Error removing tab storage ${key}:`, error);
  }
}

/**
 * Get authentication token from tab-isolated storage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try multiple possible token keys with tab isolation
  return (
    getTabStorage('access_token') ||
    getTabStorage('token') ||
    getTabStorage('authToken')
  );
}

/**
 * Get user data from tab-isolated storage
 */
export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = getTabStorage('user') || getTabStorage('userData');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    return {
      email: user.email,
      role: user.role || user.userType || user.user_type,
      id: user.id || user.userId || user.user_id,
      name: user.name || user.full_name,
      phone: user.phone,
      full_name: user.full_name
    };
  } catch (error) {
    console.error('❌ Error parsing user data:', error);
    return null;
  }
}

/**
 * Get user role from tab-isolated storage
 */
export function getUserRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  
  // Try direct role
  const directRole = getTabStorage('userRole') || getTabStorage('userType') || getTabStorage('user_type');
  if (directRole) return directRole as UserRole;
  
  // Try from user object
  const user = getUser();
  return user?.role || null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = getAuthToken();
  const role = getUserRole();
  const isLoggedIn = getTabStorage('isLoggedIn');
  
  console.log('🔐 Auth Check:', {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    role: role,
    isLoggedIn: isLoggedIn,
    tabId: sessionStorage.getItem('_agri_tab_id'),
    isAuthenticated: !!(token && role)
  });
  
  return !!(token && role);
}

/**
 * Check if user has required role for a route
 */
export function hasRequiredRole(requiredRole: UserRole): boolean {
  const userRole = getUserRole();
  if (!userRole) {
    console.log('❌ No user role found');
    return false;
  }
  
  // Admin and super_admin can access all routes
  if (userRole === 'admin' || userRole === 'super_admin') {
    console.log('✅ Admin/SuperAdmin can access all routes');
    return true;
  }
  
  // Normalize role names for comparison (handle agri_copilot vs agricopilot)
  const normalizedUserRole = userRole.toLowerCase().replace(/[-_\s]/g, '');
  const normalizedRequiredRole = requiredRole.toLowerCase().replace(/[-_\s]/g, '');
  
  const hasAccess = normalizedUserRole === normalizedRequiredRole;
  
  console.log('🔐 Role Check:', {
    userRole,
    requiredRole,
    normalizedUserRole,
    normalizedRequiredRole,
    hasAccess
  });
  
  return hasAccess;
}

/**
 * Clear authentication data from current tab only
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  
  console.log('🧹 Clearing authentication data for current tab...');
  
  // Clear tab-specific data
  const authKeys = ['access_token', 'token', 'authToken', 'token_type', 'user', 'userData', 'userType', 'userRole', 'user_type', 'isLoggedIn'];
  authKeys.forEach(key => removeTabStorage(key));
  
  // Mark this tab as logged out
  sessionStorage.setItem('_agri_logged_out', 'true');
  
  // Trigger profile update
  triggerProfileUpdate();
}

/**
 * Clear ALL authentication data from all tabs (complete logout)
 */
export function clearAllAuth(): void {
  if (typeof window === 'undefined') return;
  
  console.log('🧹 Clearing ALL authentication data...');
  
  // Clear localStorage
  const authKeys = ['access_token', 'token', 'authToken', 'token_type', 'user', 'userData', 'userType', 'userRole', 'user_type', 'isLoggedIn'];
  authKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Clear current tab session
  sessionStorage.clear();
}

/**
 * Trigger profile update event for UI components
 */
function triggerProfileUpdate(): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.dispatchEvent(new CustomEvent('authDataChanged', { 
      detail: { tabId: sessionStorage.getItem('_agri_tab_id') } 
    }));
  } catch (error) {
    console.warn('Failed to trigger profile update:', error);
  }
}

/**
 * Set authentication data (for login)
 */
export function setAuthData(authData: { user: AuthUser; token: string; [key: string]: unknown }): void {
  if (typeof window === 'undefined') return;
  
  console.log('🔐 Setting auth data for tab:', sessionStorage.getItem('_agri_tab_id'));
  
  // Store user data
  setTabStorage('user', JSON.stringify(authData.user));
  
  // Store token
  setTabStorage('access_token', authData.token);
  setTabStorage('token', authData.token);
  
  // Store additional fields
  if (authData.user.role) {
    setTabStorage('userRole', authData.user.role);
    setTabStorage('userType', authData.user.role);
  }
  
  // Mark as logged in
  setTabStorage('isLoggedIn', 'true');
  
  // Trigger profile update
  triggerProfileUpdate();
}

/**
 * Redirect to login page
 */
export function redirectToLogin(message?: string): void {
  if (typeof window === 'undefined') return;
  
  const currentPath = window.location.pathname;
  console.log('🔄 Redirecting to login from:', currentPath);
  
  if (message) {
    alert(message);
  }
  
  window.location.href = `/admin?redirect=${encodeURIComponent(currentPath)}`;
}

/**
 * Get redirect URL based on user role
 */
export function getRoleBasedRedirect(role: UserRole): string {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return '/admin/SuperAdmin';
    case 'farmer':
    case 'landowner':  // Landowners now use the same dashboard as farmers
      return '/farmer';
    case 'buyer':
      return '/buyer';
    case 'vendor':
      return '/vendor';
    case 'agri_copilot':
    case 'agricopilot':
      return '/agricopilot';
    case 'lab':
      return '/lab';
    case 'consumer':
      return '/consumer';
    default:
      return '/admin';
  }
}

/**
 * Allow navigation to protected route (call before router.push)
 * This sets a temporary token that allows the ProtectedRoute to accept the navigation
 */
export function allowNavigation(): void {
  if (typeof window === 'undefined') return;
  
  sessionStorage.setItem('navigation_allowed', 'true');
  sessionStorage.setItem('navigation_time', Date.now().toString());
  
  console.log('✅ Navigation allowed - token set');
}
