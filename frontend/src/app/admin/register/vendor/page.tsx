"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import RegistrationForm from "@/app/admin/RegistrationForm";

function VendorRegistrationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get the token from the invite link
  const token = searchParams.get("token");

  // Log page access
  useEffect(() => {
    console.log("🏪 [VENDOR REGISTRATION] Page accessed");
    console.log("🔑 [VENDOR REGISTRATION] Token:", token ? `${token.substring(0, 8)}...` : "MISSING");
    console.log("🕐 [VENDOR REGISTRATION] Timestamp:", new Date().toISOString());
  }, [token]);

  // Redirect if token is missing
  if (!token) {
    console.error("❌ [VENDOR REGISTRATION] Access denied - Token missing");
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center">
        <h1 className="text-2xl font-semibold text-red-600 mb-4">⚠️ Invalid Link</h1>
        <p className="text-gray-600 mb-6">
          The invitation link is invalid or expired. Please contact your administrator.
        </p>
        <button
          onClick={() => {
            console.log("🏠 [VENDOR REGISTRATION] User redirected to home");
            router.push("/");
          }}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all"
        >
          Go to Home
        </button>
      </div>
    );
  }

  // Handle registration completion with logging
  const handleRegistrationComplete = () => {
    console.log("✅ [VENDOR REGISTRATION] Registration completed successfully!");
    console.log("🔑 [VENDOR REGISTRATION] Token used:", `${token.substring(0, 8)}...`);
    console.log("🕐 [VENDOR REGISTRATION] Completion time:", new Date().toISOString());
    console.log("➡️ [VENDOR REGISTRATION] Redirecting to login page...");
    router.push("/login");
  };

  // Handle back action with logging
  const handleBackToSelection = () => {
    console.log("⬅️ [VENDOR REGISTRATION] User clicked back to selection");
    router.push("/");
  };

  // Handle go to login with logging
  const handleGoToLogin = () => {
    console.log("➡️ [VENDOR REGISTRATION] User navigated to login");
    router.push("/login");
  };

  console.log("📝 [VENDOR REGISTRATION] Rendering registration form");

  // Render the RegistrationForm component for vendor
  return (
    <div className="min-h-screen bg-white">
      <RegistrationForm
        userType="vendor"
        onBackToSelection={handleBackToSelection}
        onRegistrationComplete={handleRegistrationComplete}
        onGoToLogin={handleGoToLogin}
        token={token}
      />
    </div>
  );
}

export default function VendorRegistrationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading registration form...</p>
        </div>
      </div>
    }>
      <VendorRegistrationContent />
    </Suspense>
  );
}
