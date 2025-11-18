'use client';

import { useState } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Mail, 
  Globe, 
  Calendar,
  Award,
  CheckCircle,
  Building2,
  Shield,
  Users,
  TrendingUp,
  Zap,
  Target,
  FileText,
  Activity,
  BarChart3,
  Eye,
  Timer,
  IndianRupee,
  Navigation,
  Truck,
  Settings
} from "lucide-react";
import { Company } from './types';
import { soilTestingTypes } from './enhancedCompanyData';
import BookingModal from './BookingModal';
import BookingConfirmation from './BookingConfirmation';

interface CompanyListingPageProps {
  testingType: 'satellite' | 'field' | 'drone-lab';
  onBack: () => void;
  onBookService: (_companyId: string, _packageId?: string) => void;
  onNavigateToHealthCard?: () => void; // New callback for navigating to health card
}

export default function CompanyListingPage({ 
  testingType, 
  onBack, 
  // onBookService,
  onNavigateToHealthCard
}: CompanyListingPageProps) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  // const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [bookingCompany, setBookingCompany] = useState<Company | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingConfirmationData, setBookingConfirmationData] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleBookService = (_companyId: string) => {
    const company = testingData?.companies.find(c => c.id === _companyId);
    if (company) {
      setBookingCompany(company);
      setIsBookingModalOpen(true);
    }
  };

  const handleBookingComplete = (bookingData: any) => {
    console.log('Booking completed:', bookingData);
    // Here you would typically send the booking data to your backend
    setBookingConfirmationData(bookingData);
    setIsBookingModalOpen(false);
    setBookingCompany(null);
    setShowConfirmation(true);
    // onBookService(bookingData.companyId, bookingData);
  };

  // Get the testing type data
  const testingData = soilTestingTypes.find(t => t.id === testingType);
  
  if (!testingData) {
    return <div>Testing type not found</div>;
  }

  const getCompanyTypeColor = (type: Company['type']) => {
    switch (type) {
      case 'government': return 'bg-green-100 text-green-800 border-green-200';
      case 'private': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'certified-private': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCompanyTypeIcon = (type: Company['type']) => {
    switch (type) {
      case 'government': return <Shield className="w-4 h-4" />;
      case 'private': return <Building2 className="w-4 h-4" />;
      case 'certified-private': return <Award className="w-4 h-4" />;
      default: return <Building2 className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="h-full w-full p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Soil Testing
          </Button>
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">{testingData.name} Companies</h1>
          <p className="text-lg text-muted-foreground mb-2">{testingData.nametelugu}</p>
          <p className="text-base text-accent">{testingData.description}</p>
          <div className="mt-4 p-4 bg-primary/10 rounded-lg">
            <p className="font-semibold text-primary">
              Found {testingData.companies.length} certified companies in your area
            </p>
          </div>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {testingData.companies.map((company) => (
          <Card key={company.id} className="agri-card hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl leading-tight flex items-center gap-2">
                    {company.name}
                    {company.rating >= 4.8 && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⭐ Top Rated</Badge>}
                  </CardTitle>
                  <p className="text-sm text-accent font-medium mt-1 mb-2">{company.nametelugu}</p>
                  
                  {/* Company Stats Bar */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{company.experience}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      <span>{company.turnaroundTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{company.totalReviews}+ jobs</span>
                    </div>
                  </div>
                </div>
                <Badge className={`${getCompanyTypeColor(company.type)} flex items-center gap-1 ml-2`}>
                  {getCompanyTypeIcon(company.type)}
                  <span className="text-xs font-semibold">
                    {company.type === 'government' ? 'Government' : 
                     company.type === 'private' ? 'Private' : 'Certified Partner'}
                  </span>
                </Badge>
              </div>

              {/* Enhanced Rating and Trust Score */}
              <div className="flex items-center justify-between mt-3 bg-gradient-to-r from-primary/10 to-secondary/10 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((star) => (
                      <Star 
                        key={star}
                        className={`w-4 h-4 ${star <= Math.floor(company.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                    <span className="font-bold ml-1">{company.rating}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ({company.totalReviews} verified reviews)
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Trust Score</div>
                  <div className="font-bold text-primary text-sm">{Math.round(company.rating * 20)}%</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Enhanced Location & Service Area */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-start gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{company.location.address}</p>
                    <p className="text-xs text-muted-foreground">{company.location.district} District</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{company.location.distance}</div>
                    <div className="text-xs text-muted-foreground">from your farm</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-green-600">
                    <Truck className="w-3 h-3" />
                    <span>On-site service available</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Navigation className="w-3 h-3" />
                    <span>GPS tracking</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Pricing with Packages */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      Service Pricing
                    </p>
                    <p className="text-xs text-muted-foreground">Transparent pricing, no hidden costs</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">₹{company.pricing.basePrice.toLocaleString()}</div>
                    {company.pricing.maxPrice && (
                      <div className="text-xs text-muted-foreground">up to ₹{company.pricing.maxPrice.toLocaleString()}</div>
                    )}
                  </div>
                </div>
                
                {/* Package Preview */}
                {company.pricing.packages && company.pricing.packages.length > 0 && (
                  <div className="grid grid-cols-1 gap-2">
                    {company.pricing.packages.slice(0, 2).map((pkg, index) => (
                      <div key={index} className="bg-white/70 p-2 rounded border border-white/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{pkg.name}</span>
                          <span className="text-sm font-bold text-primary">₹{pkg.price.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{pkg.description}</p>
                      </div>
                    ))}
                    {company.pricing.packages.length > 2 && (
                      <div className="text-xs text-center text-accent">+{company.pricing.packages.length - 2} more packages available</div>
                    )}
                  </div>
                )}
              </div>

              {/* Enhanced Available Slots with Urgency */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-green-600" />
                    Available Slots
                  </p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    {company.availableSlots.reduce((total, slot) => total + slot.timeSlots.length, 0)} slots this week
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {company.availableSlots.slice(0, 3).map((slot, index) => (
                    <div key={index} className="bg-white/70 p-2 rounded border border-white/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{formatDate(slot.date)}</span>
                        <div className="flex gap-1">
                          {slot.timeSlots.slice(0, 3).map((time, timeIndex) => (
                            <Badge key={timeIndex} variant="outline" className="text-xs px-2 py-0.5">
                              {time}
                            </Badge>
                          ))}
                          {slot.timeSlots.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{slot.timeSlots.length - 3}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Next immediate availability */}
                <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Next available: {formatDate(company.availableSlots[0].date)} at {company.availableSlots[0].timeSlots[0]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Services & Equipment */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
                <p className="text-sm font-semibold mb-3 flex items-center gap-1">
                  <Settings className="w-4 h-4 text-purple-600" />
                  Services & Equipment
                </p>
                
                {/* Service Categories */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {company.services.slice(0, 4).map((service, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white/70 p-2 rounded text-xs">
                      <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                      <span className="font-medium">{service}</span>
                    </div>
                  ))}
                </div>
                
                {/* Equipment Preview */}
                {company.equipment && (
                  <div className="bg-white/50 p-2 rounded border border-white/50">
                    <p className="text-xs font-medium mb-1 text-purple-700">Professional Equipment:</p>
                    <div className="flex flex-wrap gap-1">
                      {company.equipment.slice(0, 3).map((eq, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-white/70">
                          {eq}
                        </Badge>
                      ))}
                      {company.equipment.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{company.equipment.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Certificates & Credibility */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold flex items-center gap-1">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Certifications & Trust
                  </p>
                  <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                    {company.certificates.length} verified
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {company.certificates.slice(0, 2).map((cert, index) => (
                    <div key={index} className="bg-white/70 p-2 rounded border border-white/50">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium">{cert.name}</p>
                          <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                        </div>
                        {cert.validUntil && (
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                            Valid
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {company.certificates.length > 2 && (
                    <div className="text-xs text-center text-emerald-600 font-medium">
                      View all {company.certificates.length} certificates →
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-100">
                <p className="text-sm font-semibold mb-3 flex items-center gap-1">
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                  Performance Metrics
                </p>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center bg-white/70 p-2 rounded">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Timer className="w-3 h-3 text-orange-600" />
                    </div>
                    <div className="text-xs font-bold text-orange-700">{company.turnaroundTime}</div>
                    <div className="text-xs text-muted-foreground">Results</div>
                  </div>
                  
                  <div className="text-center bg-white/70 p-2 rounded">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Target className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="text-xs font-bold text-green-700">{Math.round(company.rating * 20)}%</div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                  
                  <div className="text-center bg-white/70 p-2 rounded">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Activity className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="text-xs font-bold text-blue-700">99%</div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                  </div>
                </div>
              </div>

              {/* Enhanced Contact & Support */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold flex items-center gap-1">
                    <Phone className="w-4 h-4 text-slate-600" />
                    Contact & Support
                  </p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    24/7 Support
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-green-600" />
                      <span className="font-medium">{company.contactInfo.phone}</span>
                    </div>
                    <span className="text-muted-foreground">Direct Line</span>
                  </div>
                  
                  {company.contactInfo.email && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-blue-600" />
                        <span className="font-medium">{company.contactInfo.email}</span>
                      </div>
                      <span className="text-muted-foreground">Email</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-purple-600" />
                      <span className="font-medium">{company.experience} Experience</span>
                    </div>
                    <span className="text-muted-foreground">Industry Leader</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Specializations */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100">
                <p className="text-sm font-semibold mb-3 flex items-center gap-1">
                  <Target className="w-4 h-4 text-indigo-600" />
                  Specializations & Expertise
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {company.specializations.slice(0, 4).map((spec, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white/70 p-2 rounded text-xs">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"></div>
                      <span className="font-medium">{spec}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-indigo-600 font-medium text-center">
                  Success Rate: {company.successRate}% | {company.completedProjects}+ Projects Completed
                </div>
              </div>

              {/* Payment & Support Information */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-100">
                <p className="text-sm font-semibold mb-3 flex items-center gap-1">
                  <IndianRupee className="w-4 h-4 text-teal-600" />
                  Payment & Support Options
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* Working Hours */}
                  <div className="bg-white/70 p-2 rounded border border-white/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-teal-600" />
                        <span className="text-xs font-medium">Working Hours</span>
                      </div>
                      <span className="text-xs text-teal-700">{company.workingHours}</span>
                    </div>
                  </div>
                  
                  {/* Languages */}
                  <div className="bg-white/70 p-2 rounded border border-white/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3 text-teal-600" />
                        <span className="text-xs font-medium">Languages</span>
                      </div>
                      <div className="flex gap-1">
                        {company.languages.slice(0, 3).map((lang, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Methods */}
                  <div className="bg-white/70 p-2 rounded border border-white/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-3 h-3 text-teal-600" />
                        <span className="text-xs font-medium">Payment</span>
                      </div>
                      <div className="flex gap-1">
                        {company.paymentMethods.slice(0, 3).map((method, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warranty & Insurance */}
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-lg border border-rose-100">
                <p className="text-sm font-semibold mb-3 flex items-center gap-1">
                  <Shield className="w-4 h-4 text-rose-600" />
                  Warranty & Protection
                </p>
                
                <div className="space-y-2">
                  <div className="bg-white/70 p-2 rounded border border-white/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">Service Warranty</p>
                        <p className="text-xs text-muted-foreground">{company.warranty}</p>
                      </div>
                    </div>
                  </div>
                  
                  {company.insurance && (
                    <div className="bg-white/70 p-2 rounded border border-white/50">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-xs font-medium">Fully Insured Service</p>
                          <p className="text-xs text-muted-foreground">Professional liability coverage</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Action Buttons with More Options */}
              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 hover:bg-primary/10"
                    onClick={() => setSelectedCompany(company)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Full Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 agri-button-primary"
                    onClick={() => handleBookService(company.id)}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Book Service
                  </Button>
                </div>
                
                {/* Quick Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Phone className="w-3 h-3 mr-1" />
                    Call Now
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Get Quote
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Navigation className="w-3 h-3 mr-1" />
                    Directions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Company Details Modal/Sidebar would go here */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{selectedCompany.name}</h2>
                <Button variant="ghost" onClick={() => setSelectedCompany(null)}>×</Button>
              </div>
              
              {/* Comprehensive Company Information */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg">
                  <p className="text-lg text-accent font-medium">{selectedCompany.nametelugu}</p>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">{selectedCompany.successRate}%</div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-secondary">{selectedCompany.completedProjects}+</div>
                      <div className="text-xs text-muted-foreground">Projects</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-accent">{selectedCompany.experience}</div>
                      <div className="text-xs text-muted-foreground">Experience</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Specializations */}
                <div>
                  <h3 className="font-semibold mb-3">Core Specializations</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedCompany.specializations.map((spec, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equipment & Technology */}
                {selectedCompany.equipment && (
                  <div>
                    <h3 className="font-semibold mb-3">Professional Equipment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedCompany.equipment.map((eq, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                          <Settings className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">{eq}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Packages */}
                {selectedCompany.pricing.packages && (
                  <div>
                    <h3 className="font-semibold mb-3">Service Packages</h3>
                    <div className="space-y-3">
                      {selectedCompany.pricing.packages.map((pkg, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:bg-muted/30 cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{pkg.name}</h4>
                            <span className="font-bold text-primary">₹{pkg.price.toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-accent mb-1">{pkg.nametelugu}</p>
                          <p className="text-sm text-muted-foreground">{pkg.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Services */}
                <div>
                  <h3 className="font-semibold mb-3">Additional Services Included</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedCompany.additionalServices.map((service, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Working Schedule */}
                <div>
                  <h3 className="font-semibold mb-3">Working Schedule & Availability</h3>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Working Hours</p>
                        <p className="font-semibold">{selectedCompany.workingHours}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                        <p className="font-semibold">{selectedCompany.turnaroundTime}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h3 className="font-semibold mb-3">Payment & Support</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm font-medium text-blue-800">Languages Supported</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedCompany.languages.map((lang, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-sm font-medium text-green-800">Payment Methods</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedCompany.paymentMethods.map((method, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-sm font-medium text-purple-800">Warranty</p>
                      <p className="text-sm mt-1">{selectedCompany.warranty}</p>
                      {selectedCompany.insurance && (
                        <div className="flex items-center gap-1 mt-1">
                          <Shield className="w-3 h-3 text-purple-600" />
                          <span className="text-xs">Fully Insured</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* All Certificates */}
                <div>
                  <h3 className="font-semibold mb-3">All Certificates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedCompany.certificates.map((cert, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">{cert.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                        {cert.validUntil && (
                          <p className="text-xs text-accent">Valid until: {cert.validUntil}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="font-semibold mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      <span>{selectedCompany.contactInfo.phone}</span>
                    </div>
                    {selectedCompany.contactInfo.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        <span>{selectedCompany.contactInfo.email}</span>
                      </div>
                    )}
                    {selectedCompany.contactInfo.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        <span>{selectedCompany.contactInfo.website}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedCompany(null)}>
                    Close
                  </Button>
                  <Button 
                    className="agri-button-primary"
                    onClick={() => {
                      handleBookService(selectedCompany.id);
                      setSelectedCompany(null);
                    }}
                  >
                    Book Service
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingCompany && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setBookingCompany(null);
          }}
          company={bookingCompany}
          onBookingComplete={handleBookingComplete}
        />
      )}

      {/* Booking Confirmation */}
      <BookingConfirmation
        isOpen={showConfirmation}
        bookingData={bookingConfirmationData}
        onClose={() => {
          setShowConfirmation(false);
          setBookingConfirmationData(null);
        }}
        onNavigateToReports={() => {
          console.log('Navigating to SoilHealthCard in main content area...');
          if (onNavigateToHealthCard) {
            onNavigateToHealthCard();
          }
        }}
      />

      <style jsx>{`
        .agri-card {
          transition: all 0.3s ease;
        }
        .agri-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1);
        }
        .agri-button-primary {
          background: linear-gradient(to right, var(--primary), var(--primary-foreground));
          color: white;
          transition: all 0.3s ease;
        }
        .agri-button-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}