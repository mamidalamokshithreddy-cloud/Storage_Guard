'use client';

import { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { 
  X, 
  MapPin, 
  User, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Star,
  Award,
  CreditCard,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Company } from './types';
import { usePlots } from '../../../hooks/usePlots';

interface AgriPilot {
  id: string;
  name: string;
  nametelugu: string;
  rating: number;
  experience: string;
  specialization: string[];
  profileImage: string;
  phone: string;
  email: string;
  completedJobs: number;
  languages: string[];
  certificates: string[];
  availability: 'available' | 'busy' | 'offline';
  distance: string;
  price: number;
}

interface BookingStep {
  id: number;
  title: string;
  titleTelugu: string;
  completed: boolean;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  onBookingComplete: (bookingData: any) => void;
}

// Sample Agri Pilots data
const availableAgriPilots: AgriPilot[] = [
  {
    id: 'pilot-001',
    name: 'Dr. Rajesh Kumar',
    nametelugu: 'డా. రాజేష్ కుమార్',
    rating: 4.9,
    experience: '12 years',
    specialization: ['Soil Analysis', 'Cotton Farming', 'Organic Methods'],
    profileImage: '/agri-pilot-expert.jpg',
    phone: '+91 9876543210',
    email: 'rajesh@agripilot.in',
    completedJobs: 450,
    languages: ['Telugu', 'Hindi', 'English'],
    certificates: ['Soil Science PhD', 'Organic Certified', 'Government Licensed'],
    availability: 'available',
    distance: '2.1 km',
    price: 500
  },
  {
    id: 'pilot-002',
    name: 'Smt. Priya Sharma',
    nametelugu: 'శ్రీమతి ప్రియా శర్మ',
    rating: 4.8,
    experience: '8 years',
    specialization: ['Field Testing', 'Precision Agriculture', 'Crop Planning'],
    profileImage: '/agri-aipilot-woman-expert.jpg',
    phone: '+91 8765432109',
    email: 'priya@agripilot.in',
    completedJobs: 320,
    languages: ['Telugu', 'English'],
    certificates: ['Agriculture Masters', 'Field Testing Certified'],
    availability: 'available',
    distance: '3.5 km',
    price: 400
  },
  {
    id: 'pilot-003',
    name: 'Sri Venkatesh Reddy',
    nametelugu: 'శ్రీ వెంకటేష్ రెడ్డి',
    rating: 4.7,
    experience: '15 years',
    specialization: ['Soil Health', 'Nutrient Management', 'Crop Disease'],
    profileImage: '/agri-aipilot-expert.jpg',
    phone: '+91 7654321098',
    email: 'venkatesh@agripilot.in',
    completedJobs: 680,
    languages: ['Telugu', 'Hindi'],
    certificates: ['Agricultural Engineering', 'Soil Health Expert'],
    availability: 'available',
    distance: '1.8 km',
    price: 600
  }
];

export default function BookingModal({ isOpen, onClose, company, onBookingComplete }: BookingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Use the plots hook to get real data from API
  const plotsHook = usePlots();
  const { plots, loading: plotsLoading, error: plotsError } = plotsHook;
  const refreshPlots =
    typeof (plotsHook as any).refetch === 'function'
      ? (plotsHook as any).refetch.bind(plotsHook)
      : () => {
          // fallback: hook doesn't expose refetch — no-op (or implement your own refresh)
          console.warn('usePlots.refetch is not available; refreshPlots is a no-op');
        };

  const [selectedLand, setSelectedLand] = useState<any | null>(null);
  
  // Refresh plots data when modal opens
  useEffect(() => {
    if (isOpen && plots.length === 0 && !plotsLoading) {
      refreshPlots();
    }
  }, [isOpen, plots.length, plotsLoading, refreshPlots]);
  const [selectedSlot, setSelectedSlot] = useState<{date: string, time: string} | null>(null);
  // Removed location selection step
  const [selectedPilot, setSelectedPilot] = useState<AgriPilot | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  // Removed farm details step

  const bookingSteps: BookingStep[] = [
    { id: 1, title: 'Select Land/Plot', titleTelugu: 'భూమి/ప్లాట్ ఎంచుకోండి', completed: selectedLand !== null },
    { id: 2, title: 'Select Package & Time', titleTelugu: 'ప్యాకేజీ & సమయం ఎంచుకోండి', completed: selectedSlot !== null && selectedPackage !== null },
    { id: 3, title: 'Select Agri Pilot', titleTelugu: 'అగ్రి పైలట్ ఎంచుకోండి', completed: selectedPilot !== null },
    { id: 4, title: 'Confirm & Pay', titleTelugu: 'నిర్ధారించి చెల్లించండి', completed: false }
  ];

  // Removed locationOptions

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < bookingSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBookingComplete = () => {
    const bookingData = {
      companyId: company.id,
      companyName: company.name,
      selectedLand,
      selectedPackage,
      selectedSlot,
      selectedPilot,
  // Removed farmDetails
      totalAmount: (selectedPackage?.price || 0) + (selectedPilot?.price || 0),
      bookingId: `BOOK-${Date.now()}`,
      status: 'confirmed'
    };
    onBookingComplete(bookingData);
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-full w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Book Service - {company.name}</h2>
            <p className="text-sm text-muted-foreground">{company.nametelugu}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="p-6 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            {bookingSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                  currentStep === step.id ? 'bg-primary text-white' :
                  step.completed ? 'bg-green-600 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {step.completed ? <CheckCircle className="w-4 h-4" /> : step.id}
                </div>
                <div className="ml-2 text-xs">
                  <div className={currentStep === step.id ? 'font-bold' : ''}>{step.title}</div>
                  <div className="text-muted-foreground">{step.titleTelugu}</div>
                </div>
                {index < bookingSteps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {/* Step 1: Land/Plot Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Select Land/Plot for Soil Test</h3>
              <p className="text-sm text-muted-foreground">మీ భూమి/ప్లాట్ ఎంచుకోండి</p>
              
              {plotsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading your registered plots...</span>
                </div>
              )}

              {plotsError && (
                <div className="flex items-center justify-center py-8 text-red-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>Failed to load plots: {plotsError}</span>
                </div>
              )}

              {!plotsLoading && !plotsError && plots.length === 0 && (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-muted-foreground mb-2">No Registered Plots Found</h4>
                  <p className="text-sm text-muted-foreground">You need to register your land plots first before booking soil testing services.</p>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={() => {
                      // You could navigate to land registration here
                      alert('Please register your land plots first in Land Registration section');
                    }}>
                      Register Land Plots
                    </Button>
                    <Button variant="outline" onClick={() => refreshPlots()}>
                      Refresh Plots
                    </Button>
                  </div>
                </div>
              )}

              {!plotsLoading && !plotsError && plots.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plots.map((plot) => (
                    <Card
                      key={plot.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedLand?.id === plot.id ? 'border-primary bg-primary/10' : 'hover:bg-muted/30'
                      }`}
                      onClick={() => setSelectedLand(plot)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-primary" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium">{plot.name || `Plot ID: ${plot.id}`}</h5>
                              <Badge variant={plot.status === 'Verified' ? 'default' : 'secondary'} className="text-xs">
                                {plot.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-accent">{plot.location}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              <span>Area: {plot.area}</span>
                              {plot.soilType && <span>Soil: {plot.soilType}</span>}
                            </div>
                            {plot.cropHistory && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Crop History: {plot.cropHistory}
                              </p>
                            )}
                            {plot.ownerName && (
                              <p className="text-xs text-muted-foreground">
                                Owner: {plot.ownerName}
                              </p>
                            )}
                            {plot.surveyNo && (
                              <p className="text-xs text-muted-foreground">
                                Survey No: {plot.surveyNo}
                              </p>
                            )}
                          </div>
                          {selectedLand?.id === plot.id && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Package & Time Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Select Service Package & Time Slot</h3>
              <p className="text-sm text-muted-foreground">ప్యాకేజీ మరియు సమయం ఎంచుకోండి</p>
              {/* Package Selection */}
              <div>
                <h4 className="font-semibold mb-3">Available Packages</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {company.pricing.packages?.map((pkg, index) => (
                    <Card 
                      key={index} 
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedPackage?.name === pkg.name ? 'border-primary bg-primary/10' : 'hover:bg-muted/30'
                      }`}
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{pkg.name}</h5>
                          <span className="font-bold text-primary">₹{pkg.price.toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-accent mb-1">{pkg.nametelugu}</p>
                        <p className="text-sm text-muted-foreground">{pkg.description}</p>
                        {selectedPackage?.name === pkg.name && (
                          <div className="flex items-center gap-1 mt-2 text-primary">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Selected</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Time Slot Selection */}
              {selectedPackage && (
                <div>
                  <h4 className="font-semibold mb-3">Available Time Slots</h4>
                  <div className="space-y-4">
                    {company.availableSlots.map((slot, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h5 className="font-medium mb-2">{formatDate(slot.date)}</h5>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {slot.timeSlots.map((time, timeIndex) => (
                            <Button
                              key={timeIndex}
                              variant={selectedSlot?.date === slot.date && selectedSlot?.time === time ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedSlot({date: slot.date, time})}
                              className="text-xs"
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Agri Pilot Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Select Your Agri Pilot Expert</h3>
              <p className="text-sm text-muted-foreground">మీ వ్యవసాయ నిపుణుడిని ఎంచుకోండి</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableAgriPilots.map((pilot) => (
                  <Card 
                    key={pilot.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedPilot?.id === pilot.id ? 'border-primary bg-primary/10' : 'hover:bg-muted/30'
                    }`}
                    onClick={() => setSelectedPilot(pilot)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-medium">{pilot.name}</h5>
                            <Badge className={`text-xs ${
                              pilot.availability === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {pilot.availability === 'available' ? 'Available' : 'Busy'}
                            </Badge>
                          </div>
                          <p className="text-sm text-accent mb-2">{pilot.nametelugu}</p>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-semibold">{pilot.rating}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">({pilot.completedJobs} jobs)</span>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <Award className="w-3 h-3 text-blue-600" />
                              <span>{pilot.experience} experience</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <MapPin className="w-3 h-3 text-green-600" />
                              <span>{pilot.distance} away</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <CreditCard className="w-3 h-3 text-purple-600" />
                              <span>₹{pilot.price} consultation fee</span>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {pilot.specialization.slice(0, 2).map((spec, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                              {pilot.specialization.length > 2 && (
                                <span className="text-xs text-muted-foreground">+{pilot.specialization.length - 2}</span>
                              )}
                            </div>
                          </div>
                          
                          {selectedPilot?.id === pilot.id && (
                            <div className="flex items-center gap-1 mt-2 text-primary">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm">Selected Expert</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* // Removed Step 4: Farm Details */}

          {/* Step 4: Confirmation & Payment */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Booking Confirmation</h3>
              <p className="text-sm text-muted-foreground">బుకింగ్ నిర్ధారణ</p>
              
              {/* Booking Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Service Details</h5>
                      <div className="space-y-1 text-sm">
                        <p><strong>Company:</strong> {company.name}</p>
                        <p><strong>Package:</strong> {selectedPackage?.name}</p>
                        <p><strong>Date & Time:</strong> {selectedSlot && formatDate(selectedSlot.date)} at {selectedSlot?.time}</p>
                        {/* Location removed from summary */}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Agri Pilot Expert</h5>
                      <div className="space-y-1 text-sm">
                        <p><strong>Expert:</strong> {selectedPilot?.name}</p>
                        <p><strong>Experience:</strong> {selectedPilot?.experience}</p>
                        <p><strong>Rating:</strong> ⭐ {selectedPilot?.rating}</p>
                        <p><strong>Distance:</strong> {selectedPilot?.distance}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-2">Cost Breakdown</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Service Package:</span>
                        <span>₹{selectedPackage?.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expert Consultation:</span>
                        <span>₹{selectedPilot?.price}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total Amount:</span>
                        <span>₹{((selectedPackage?.price || 0) + (selectedPilot?.price || 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Payment Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['UPI', 'Card', 'Net Banking', 'Cash on Service'].map((method) => (
                      <Button key={method} variant="outline" className="text-sm">
                        <CreditCard className="w-4 h-4 mr-2" />
                        {method}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-6 border-t bg-muted/20">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {bookingSteps.length}
          </div>

          {currentStep < bookingSteps.length ? (
            <Button 
              onClick={handleNext}
              disabled={!bookingSteps[currentStep - 1].completed}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleBookingComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm Booking
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}