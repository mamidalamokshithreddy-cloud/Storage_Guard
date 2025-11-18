import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, FileText, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../ui/use-toast';

interface LeaseCreationFormProps {
  onLeaseCreated?: () => void;
}

export const LeaseCreationForm: React.FC<LeaseCreationFormProps> = ({ onLeaseCreated }) => {
  const { toast } = useToast();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
  const [formData, setFormData] = useState({
    plotId: '',
    farmerName: '',
    farmerContact: '',
    leaseType: '',
    duration: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    rentAmount: '',
    revenueShare: '',
    terms: '',
    specialConditions: '',
  });

  const [availablePlots, setAvailablePlots] = useState<Array<{
    id: string;
    plot_name: string;
    area: number;
    village: string;
    district: string;
    state: string;
    owner_name: string;
  }>>([]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available plots on component mount
  useEffect(() => {
    console.log("🚀 LeaseCreationForm component mounted, fetching plots...");
    const fetchPlots = async () => {
      try {
        console.log("📡 Making request to fetch plots...");
  const res = await fetch(`${API_BASE}/available-plots`);
        if (res.ok) {
          const plots = await res.json();
          console.log("✅ Plots fetched successfully:", plots);
          setAvailablePlots(plots);
        } else {
          console.error("❌ Failed to fetch plots:", res.status);
        }
      } catch (err) {
        console.error("💥 Error fetching plots:", err);
      }
    };
    
    fetchPlots();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("🔥 handleSubmit called - Button clicked!");
    e.preventDefault();
    if (isSubmitting) {
      console.log("⚠️ Already submitting, returning early");
      return;
    }
    console.log("✅ Setting isSubmitting to true");
    setIsSubmitting(true);
    
    // Validation
    console.log("🔍 Validating form data:", formData);
    
    // Check each field individually for better debugging
    const missingFields = [];
    if (!formData.plotId) missingFields.push("Plot ID");
    if (!formData.farmerName) missingFields.push("Farmer Name");
    if (!formData.leaseType) missingFields.push("Lease Type");
    if (!formData.startDate) missingFields.push("Start Date");
    if (!formData.endDate) missingFields.push("End Date");
    
    console.log("❌ Missing fields:", missingFields);
    
    if (missingFields.length > 0) {
      toast({
        title: "Required Fields Missing",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    console.log("✅ Validation passed, proceeding with API call...");

    // Prepare payload matching backend LandLeaseRequest
    const payload = {
      plot_id: formData.plotId,
      lessee_name: formData.farmerName,
      lessee_contact: formData.farmerContact,
      lease_type: formData.leaseType,
      lease_duration: formData.duration,
      start_date: formData.startDate!.toISOString().split('T')[0], // YYYY-MM-DD format
      end_date: formData.endDate!.toISOString().split('T')[0],
      standard_terms: formData.terms || null,
      special_conditions: formData.specialConditions || null,
      rent_amount: formData.leaseType === 'cash_rent' && formData.rentAmount ? parseFloat(formData.rentAmount) : null,
      rent_frequency: formData.leaseType === 'cash_rent' ? 'monthly' : null,
      security_deposit: null // Can be added later if needed
    };

    console.log("🚀 About to prepare payload...");
    
    try {
      console.log("🚀 Sending lease request to backend...", payload);
      console.log("📋 Payload details:", {
        plot_id: payload.plot_id,
        lease_type: payload.lease_type,
        dates: `${payload.start_date} to ${payload.end_date}`
      });
      
  const res = await fetch(`${API_BASE}/create-lease`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("📥 Response received:", res.status, res.statusText);

      if (!res.ok) {
        const error = await res.json();
        console.error("❌ Backend validation error:", error);
        
        let errorMessage = "An error occurred while creating the lease.";
        if (error.detail) {
          if (Array.isArray(error.detail)) {
            // Pydantic validation errors
            errorMessage = error.detail.map((err: any) => 
              `${err.loc?.join('.')} - ${err.msg}`
            ).join('; ');
          } else if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          }
        }
        
        toast({
          title: "Lease Creation Failed",
          description: errorMessage,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();
      console.log("🎉 Lease created successfully:", data);
      
      toast({
        title: "Lease Agreement Created!",
        description: data.message || "Digital lease agreement has been generated successfully.",
      });

      // Reset form on success
      setFormData({
        plotId: '',
        farmerName: '',
        farmerContact: '',
        leaseType: '',
        duration: '',
        startDate: undefined,
        endDate: undefined,
        rentAmount: '',
        revenueShare: '',
        terms: '',
        specialConditions: '',
      });
      setIsSubmitting(false);

      // Call the callback to refresh parent component
      if (onLeaseCreated) {
        onLeaseCreated();
      }

    } catch (err: any) {
      console.error("❌ Network Error:", err);
      toast({
        title: "Network Error",
        description: err.message || "Could not connect to server.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Create New Lease Agreement
        </CardTitle>
        <CardDescription>
          Set up a new leasing agreement for your verified land plots
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plot Selection */}
          <div>
            <Label htmlFor="plotId">Select Plot *</Label>
            <Select value={formData.plotId} onValueChange={(value) => handleInputChange('plotId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a verified plot" />
              </SelectTrigger>
              <SelectContent>
                {availablePlots.length > 0 ? (
                  availablePlots.map((plot) => (
                    <SelectItem key={plot.id} value={plot.id}>
                      {plot.plot_name} ({plot.area} acres) - {plot.village}, {plot.district}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-plots" disabled>
                    No plots available for leasing
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Farmer Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="farmerName">Farmer/Lessee Name *</Label>
              <Input
                id="farmerName"
                value={formData.farmerName}
                onChange={(e) => handleInputChange('farmerName', e.target.value)}
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="farmerContact">Contact Number *</Label>
              <Input
                id="farmerContact"
                value={formData.farmerContact}
                onChange={(e) => handleInputChange('farmerContact', e.target.value)}
                placeholder="+91 9876543210"
                required
              />
            </div>
          </div>

          {/* Lease Type */}
          <div>
            <Label htmlFor="leaseType">Lease Type *</Label>
            <Select value={formData.leaseType} onValueChange={(value) => handleInputChange('leaseType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select lease type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash_rent">Fixed Rent</SelectItem>
                <SelectItem value="sharecropping">Revenue Sharing/Sharecropping</SelectItem>
                <SelectItem value="seasonal">Seasonal Lease</SelectItem>
                <SelectItem value="annual">Annual Lease</SelectItem>
                <SelectItem value="multi_year">Multi-Year Lease</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration and Dates */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="duration">Lease Duration</Label>
              <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-year">1 Year</SelectItem>
                  <SelectItem value="2-years">2 Years</SelectItem>
                  <SelectItem value="3-years">3 Years</SelectItem>
                  <SelectItem value="5-years">5 Years</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => {
                      console.log("📅 Start date selected:", date);
                      handleInputChange('startDate', date);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => {
                      console.log("📅 End date selected:", date);
                      handleInputChange('endDate', date);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Financial Terms */}
          {formData.leaseType === 'cash_rent' && (
            <div>
              <Label htmlFor="rentAmount">Monthly Rent Amount (₹)</Label>
              <Input
                id="rentAmount"
                value={formData.rentAmount}
                onChange={(e) => handleInputChange('rentAmount', e.target.value)}
                placeholder="Enter monthly rent"
                type="number"
              />
            </div>
          )}

          {formData.leaseType === 'sharecropping' && (
            <div>
              <Label htmlFor="revenueShare">Revenue Share (%)</Label>
              <Select value={formData.revenueShare} onValueChange={(value) => handleInputChange('revenueShare', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select revenue sharing model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50-50">50-50 (Equal Share)</SelectItem>
                  <SelectItem value="60-40">60-40 (Farmer-Owner)</SelectItem>
                  <SelectItem value="70-30">70-30 (Farmer-Owner)</SelectItem>
                  <SelectItem value="custom">Custom Agreement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Terms and Conditions */}
          <div>
            <Label htmlFor="terms">Standard Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={formData.terms}
              onChange={(e) => handleInputChange('terms', e.target.value)}
              placeholder="Standard lease terms will be auto-populated. Add any specific conditions here."
              rows={4}
            />
          </div>

          {/* Special Conditions */}
          <div>
            <Label htmlFor="specialConditions">Special Conditions</Label>
            <Textarea
              id="specialConditions"
              value={formData.specialConditions}
              onChange={(e) => handleInputChange('specialConditions', e.target.value)}
              placeholder="Any special conditions or agreements between parties"
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700" 
              disabled={isSubmitting}
              onClick={() => console.log("🎯 Button clicked directly!")}
            >
              {isSubmitting ? (
                <>
                  <FileText className="w-4 h-4 mr-2 animate-spin" />
                  Creating Lease...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Agreement
                </>
              )}
            </Button>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Save as Draft
            </Button>
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => {
                console.log("🧪 Test button clicked!");
                toast({
                  title: "Test Button",
                  description: "Button click is working!",
                });
              }}
            >
              Test Click
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};