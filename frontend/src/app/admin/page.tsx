'use client';
import React, { useState } from 'react';
import Authentication from './Authentication';
import RegistrationForm from './RegistrationForm';
import UserTypeSelection from './UserTypeSelection';
import HeroSection from './HeroSection';
import SuperAdminLogin from './Authentication'; // Use Authentication as SuperAdminLogin
import SuperAdmin from './SuperAdmin/page';
// Define the possible views your page can display
type View = 'hero' | 'auth' | 'register' | 'selection' | 'super_admin' | 'admin_login' | 'onboarding';
type UserTypeId = 'farmer' | 'landowner' | 'vendor' | 'buyer' | 'agri_copilot';
type UserType = UserTypeId; // Use the same type as UserTypeSelection

export default function Page() {
  // State to manage which component is currently visible
  const [currentView, setCurrentView] = useState<View>('hero');
  
  // State to hold the user type selected for registration
  const [selectedUserType, setSelectedUserType] = useState<UserType>('farmer');
  type UserTypeId = UserType; // Alias for compatibility with UserTypeSelection

  // --- Navigation Handler Functions ---
  const navigateToAuth = () => setCurrentView('auth');
  const navigateToHome = () => setCurrentView('hero');
  const navigateToSelection = () => setCurrentView('selection');
  const navigateToSuperAdmin = () => setCurrentView('admin_login');
  const navigateToSuperAdminDashboard = () => setCurrentView('super_admin');
  
  const handleSelectUserType = (userType: UserType) => {
    setSelectedUserType(userType);
    setCurrentView('register');
  };

  // --- Render Logic ---
  const renderContent = () => {
    switch (currentView) {
      case 'auth':
        return (
          <Authentication
            onBackToHome={navigateToHome}
            onGoToRegister={navigateToSelection}
            onLoginSuccess={() => {
              // Handle successful login by navigating to SuperAdmin dashboard
              console.log('Login successful');
              navigateToSuperAdminDashboard();
            }}
          />
        );
        
      case 'super_admin':
        return (
          <SuperAdmin />
        );
      
      case 'admin_login':
        return (
          <SuperAdminLogin
            onBackToHome={navigateToHome}
            onGoToRegister={navigateToSelection}
            onLoginSuccess={navigateToSuperAdminDashboard}
          />
        );
      
      case 'selection':
        return (
          <UserTypeSelection
            onSelectUserType={handleSelectUserType}
            onBackToHome={navigateToHome}
            onLogin={navigateToAuth}
          />
        );

      case 'register':
        return (
          <RegistrationForm
            token=""
            userType={selectedUserType}
            onBackToSelection={navigateToSelection}
            onRegistrationComplete={navigateToAuth}
            onGoToLogin={navigateToAuth}
          />
        );
      
      case 'hero':
      default:
        return (
          <HeroSection
            onGetStarted={navigateToSelection}
            onLogin={navigateToAuth}
            onNavigateToSuperAdmin={navigateToSuperAdmin}
          />
        );
    }
  };

  return (
    <main>
      {renderContent()}
    </main>
  );
}