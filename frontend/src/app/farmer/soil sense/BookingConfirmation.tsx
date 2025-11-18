'use client';

import { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Clock,
  FileText,
  Share2,
  Download,
  Star,
  Navigation,
  Loader2,
  TrendingUp
} from "lucide-react";
// SoilHealthCard import removed - navigation handled by parent

interface BookingConfirmationProps {
  bookingData: any;
  onClose: () => void;
  isOpen: boolean;
  onNavigateToReports?: () => void; // New callback for navigation
}

export default function BookingConfirmation({ bookingData, onClose, isOpen, onNavigateToReports }: BookingConfirmationProps) {
  const [countdown, setCountdown] = useState(5);
  const [showBuffering, setShowBuffering] = useState(false);
  const [bufferingProgress, setBufferingProgress] = useState(0);
  // showSoilHealthCard state removed - navigation handled by parent

  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, isOpen]);

  // Buffering effect for loading reports
  useEffect(() => {
    if (showBuffering) {
      const interval = setInterval(() => {
        setBufferingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            console.log('Buffering completed, navigating to SoilHealthCard...');
            setTimeout(() => {
              console.log('Buffering complete, navigating to main content area...');
              setShowBuffering(false);        // ✅ Hide buffering
              onClose(); // Close booking confirmation
              if (onNavigateToReports) {
                onNavigateToReports(); // Navigate to main content area
              }
            }, 500);
            return 100;
          }
          return prev + 5;  // Faster progress for testing  // ✅ Progress increment
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [showBuffering]);

  const handleReportsClick = () => {
    console.log('View Reports button clicked!');
    setShowBuffering(true);
    setBufferingProgress(0);
  };

  // handleBackFromSoilCard removed - navigation handled by parent

  if (!isOpen || !bookingData) return null;

  // Remove the overlay rendering - navigation will be handled by parent

  console.log('Rendering BookingConfirmation...');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow focus:outline-none"
        >
          <span className="sr-only">Close</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z" clipRule="evenodd" />
          </svg>
        </button>
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-green-100">బుకింగ్ నిర్ధారించబడింది!</p>
          <p className="text-sm text-green-100 mt-2">
            Booking ID: <span className="font-bold">{bookingData.bookingId}</span>
          </p>
        </div>

        {/* Booking Details */}
        <div className="p-6 space-y-6">
          {/* Service Summary */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Service Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company</p>
                  <p className="font-semibold">{bookingData.companyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Service Package</p>
                  <p className="font-semibold">{bookingData.selectedPackage?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="font-bold text-lg text-green-600">₹{bookingData.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Details */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Schedule Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="font-semibold">{formatDate(bookingData.selectedSlot?.date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Time</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {bookingData.selectedSlot?.time}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Service Location</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                  <p className="font-medium">{bookingData.selectedLocation?.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agri Pilot Details */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Your Agri Pilot Expert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-700" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{bookingData.selectedPilot?.name}</h4>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{bookingData.selectedPilot?.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-purple-600 mb-2">{bookingData.selectedPilot?.nametelugu}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">{bookingData.selectedPilot?.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">{bookingData.selectedPilot?.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Farm Information */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                Farm Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Farm Name</p>
                  <p className="font-semibold">{bookingData.farmDetails?.farmName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Farm Size</p>
                  <p className="font-semibold">{bookingData.farmDetails?.farmSize}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Crop Type</p>
                  <p className="font-semibold capitalize">{bookingData.farmDetails?.cropType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Soil Type</p>
                  <p className="font-semibold capitalize">{bookingData.farmDetails?.soilType || 'To be determined'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border-slate-200 bg-slate-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Confirmation Call</p>
                    <p className="text-sm text-muted-foreground">Your assigned expert will call you within 2 hours to confirm details</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Service Day</p>
                    <p className="text-sm text-muted-foreground">Expert will arrive at your location at the scheduled time</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-600">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Results & Report</p>
                    <p className="text-sm text-muted-foreground">Get detailed soil analysis report with recommendations</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Receipt
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share Details
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Track Expert
            </Button>
          </div>

          {/* Support Information */}
          <div className="bg-gradient-to-r from-slate-100 to-gray-100 p-4 rounded-lg">
            <h5 className="font-semibold mb-2">Need Help?</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-600" />
                <span>24/7 Support: +91 1800-AGRI-HELP</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-600" />
                <span>support@agrihub.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Booking confirmed at {new Date().toLocaleTimeString()}
            </div>
            
            <Button 
              onClick={handleReportsClick} 
              className="bg-green-600 hover:bg-green-700"
              disabled={showBuffering}
            >
              {showBuffering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading Reports...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Reports
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Buffering Overlay */}
        {showBuffering && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 rounded-lg">
            <div className="bg-white p-8 rounded-lg text-center max-w-sm mx-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white animate-pulse" />
              </div>
              
              <h3 className="text-lg font-semibold mb-2">Loading Soil Health Reports</h3>
              <p className="text-sm text-muted-foreground mb-4">
                मिट्टी स्वास्थ्य रिपोर्ट लोड हो रहा है
              </p>
              
              <div className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${bufferingProgress}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{Math.round(bufferingProgress)}% Complete</span>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {bufferingProgress < 30 && "Analyzing soil composition..."}
                  {bufferingProgress >= 30 && bufferingProgress < 60 && "Processing nutrient levels..."}
                  {bufferingProgress >= 60 && bufferingProgress < 90 && "Generating recommendations..."}
                  {bufferingProgress >= 90 && "Finalizing health report..."}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}