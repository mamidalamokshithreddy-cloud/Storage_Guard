import React, { useState, useEffect } from 'react';
import { Mail, Info, Bell, UserPlus, Activity } from 'lucide-react';
import { getUser, getUserRole } from '@/lib/auth';

interface Notification {
  id: string;
  message: string;
  time: string;
  userType: string;
  type: string;
  read: boolean;
}

interface TopbarProps {
  userName?: string;
  userEmail?: string;
  userType?: string;
  notifications: Notification[];
  onLogout: () => void;
  onLogoClick?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ notifications, onLogout, onLogoClick }) => {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(notifications);
  
  // State for real user data
  const [userInfo, setUserInfo] = useState({
    userName: 'User',
    userEmail: 'user@agrihub.com',
    userType: 'User'
  });

  // Load real user data from tab-isolated storage
  useEffect(() => {
    const loadUserData = () => {
      try {
        // Use tab-isolated auth functions
        const userData = getUser();
        const userRole = getUserRole();
        
        console.log('🔍 Topbar loading user data:', { userData, userRole, tabId: sessionStorage.getItem('_agri_tab_id') });

        // Extract user information
        const realUserName = userData?.full_name || userData?.name || userData?.email?.split('@')[0] || 'User';
        const realUserEmail = userData?.email || 'user@agrihub.com';
        const realUserType = userData?.role || userRole || 'User';

        // Format user type for display
        const formattedUserType = typeof realUserType === 'string' 
          ? realUserType.charAt(0).toUpperCase() + realUserType.slice(1).toLowerCase()
          : 'User';

        setUserInfo({
          userName: realUserName,
          userEmail: realUserEmail,
          userType: formattedUserType
        });
      } catch (error) {
        console.warn('Error loading user data:', error);
        // Keep default values if there's an error
      }
    };

    loadUserData();
    
    // Listen for auth data changes (custom event from auth library)
    const handleAuthChange = () => {
      console.log('🔄 Auth data changed, refreshing profile...');
      loadUserData();
    };
    
    window.addEventListener('authDataChanged', handleAuthChange);
    
    // Also listen for localStorage changes (for fallback)
    window.addEventListener('storage', loadUserData);
    
    return () => {
      window.removeEventListener('authDataChanged', handleAuthChange);
      window.removeEventListener('storage', loadUserData);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-4">
          <img 
            src="/title logo.jpg" 
            alt="AgriHub Logo" 
            className={`h-10 ${onLogoClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={onLogoClick}
            title={onLogoClick ? "Toggle Sidebar" : undefined}
          />
          <h1 className="text-xl font-bold text-green-700">AgriHub</h1>
        </div>
        <div className="flex items-center space-x-1">
          {/* Contact */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsProfileOpen(false);
                setIsAboutOpen(false);
                setIsContactOpen(!isContactOpen);
              }}
              className="p-2 rounded-full hover:bg-gray-100 relative"
            >
              <Mail className="w-5 h-5 text-gray-600" />
            </button>
            {isContactOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-[60]">
                <div className="px-4 py-3">
                  <h3 className="font-medium text-gray-900">Contact Us</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>Email: support@agrihub.com</p>
                    <p>Phone: +1 (555) 123-4567</p>
                    <p>Address: 123 Farm St, Agri Valley</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* About */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsProfileOpen(false);
                setIsContactOpen(false);
                setIsAboutOpen(!isAboutOpen);
              }}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Info className="w-5 h-5 text-gray-600" />
            </button>
            {isAboutOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-[60]">
                <div className="px-4 py-3">
                  <h3 className="font-medium text-gray-900">About AgriHub</h3>
                  <div className="mt-2 text-sm text-gray-600 space-y-2">
                    <p>AgriHub is a comprehensive agricultural management platform connecting farmers, landowners, vendors, and buyers in one ecosystem.</p>
                    <p>Key features include:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>User management for different agricultural stakeholders</li>
                      <li>Resource sharing and management</li>
                      <li>Marketplace for agricultural products</li>
                      <li>Land management and leasing</li>
                      <li>Agricultural advisory services</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Notification */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsProfileOpen(false);
                setIsAboutOpen(false);
                setIsContactOpen(false);
                setIsNotificationsOpen(!isNotificationsOpen);
              }}
              className="p-2 rounded-full hover:bg-gray-100 relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {localNotifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-[60]">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="font-medium text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {localNotifications.length > 0 ? (
                    localNotifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          setLocalNotifications(localNotifications.map(n => 
                            n.id === notification.id ? {...n, read: true} : n
                          ));
                        }}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            {notification.type === 'onboarding' ? (
                              <UserPlus className="w-4 h-4 text-green-600" />
                            ) : (
                              <Activity className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-500">{notification.time}</span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {notification.userType}
                              </span>
                            </div>
                          </div>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">No new notifications</div>
                  )}
                </div>
                <div className="px-4 py-2 border-t border-gray-100 text-center">
                  <button 
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                    // You can pass a prop for activities navigation if needed
                  >
                    View All Activities
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Profile */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsContactOpen(false);
                setIsAboutOpen(false);
                setIsProfileOpen(!isProfileOpen);
              }}
              className="flex items-center space-x-2 p-1.5 pr-3 rounded-full hover:bg-gray-100"
            >
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                {userInfo.userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{userInfo.userName}</span>
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-[60]">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{userInfo.userType} User</p>
                  <p className="text-xs text-gray-500">{userInfo.userEmail}</p>
                </div>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                <button 
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
