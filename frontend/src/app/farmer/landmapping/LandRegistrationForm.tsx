'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { MapCanvas } from './MapCanvasSimple';
import { MapPin, Upload, Save, AlertCircle } from 'lucide-react';
import { useToast } from '../ui/use-toast';

interface LandRegistrationFormProps {
  onPlotRegistered: () => void;
}

export const LandRegistrationForm: React.FC<LandRegistrationFormProps> = ({ onPlotRegistered }) => {
  const { toast } = useToast();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  const [formData, setFormData] = useState({
    plotName: '',
    ownerName: '',
    contactNumber: '',
    email: '',
    size: '',
    sizeUnit: 'acres',
    location: {
      village: '',
      mandal: '',
      district: '',
      state: 'Telangana',
    },
    soilType: '',
    waterSource: [] as string[],
    coordinates: {
      latitude: '',
      longitude: '',
    },
    documents: [] as string[],
    cropHistory: '',
    infrastructure: [] as string[],
  });

  const [isMapping, setIsMapping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleArrayChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field as keyof typeof prev] as string[]), value]
        : (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const handleCoordinatesSet = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      coordinates: {
        latitude: lat.toString(),
        longitude: lng.toString(),
      }
    }));
    setIsMapping(false);
    toast({
      title: "GPS Coordinates Set",
      description: `Location marked at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Validation
    if (!formData.plotName || !formData.ownerName || !formData.size) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Prepare payload matching backend LandRegistrationRequest
    const payload = {
      plotName: formData.plotName,
      ownerName: formData.ownerName,
      contactNumber: formData.contactNumber,
      email: formData.email || `landowner_${formData.contactNumber}@agrihub.local`,
      size: parseFloat(formData.size),
      sizeUnit: formData.sizeUnit,
      location: {
        village: formData.location.village,
        mandal: formData.location.mandal,
        district: formData.location.district,
        state: formData.location.state,
      },
      soilType: formData.soilType || undefined,
      waterSource: formData.waterSource,
      coordinates: (formData.coordinates.latitude && formData.coordinates.longitude)
        ? {
            latitude: formData.coordinates.latitude,
            longitude: formData.coordinates.longitude,
          }
        : undefined,
      cropHistory: formData.cropHistory || undefined,
      infrastructure: formData.infrastructure,
    };

    try {
      console.log("🚀 Sending request to backend...", payload);

  const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("📥 Response received:", res.status, res.statusText);

      if (!res.ok) {
        const error = await res.json();
        toast({
          title: "Registration Failed",
          description: error.detail || "An error occurred while registering the plot.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();
      toast({
        title: "Plot Registered Successfully!",
        description: data.message || "Your land plot has been submitted for verification.",
      });
      setIsSubmitting(false);
      onPlotRegistered();
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Land Plot Registration
          </CardTitle>
          <CardDescription>
            Register your land plot with detailed information and GPS mapping
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="plotName">Plot Name *</Label>
                <Input
                  id="plotName"
                  value={formData.plotName}
                  onChange={(e) => handleInputChange('plotName', e.target.value)}
                  placeholder="e.g., North Field Plot"
                  required
                />
              </div>
              <div>
                <Label htmlFor="ownerName">Landowner Name *</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  placeholder="Full name as per documents"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact">Contact Number *</Label>
                <Input
                  id="contact"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  placeholder="+91 9876543210"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="owner@example.com"
                />
              </div>
            </div>

            {/* Plot Size */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <Label htmlFor="size">Plot Size *</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  placeholder="e.g., 5.2"
                  required
                />
              </div>
              <div>
                <Label htmlFor="sizeUnit">Unit</Label>
                <Select value={formData.sizeUnit} onValueChange={(value) => handleInputChange('sizeUnit', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acres">Acres</SelectItem>
                    <SelectItem value="hectares">Hectares</SelectItem>
                    <SelectItem value="guntas">Guntas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div>
              <Label className="text-base font-medium mb-3 block">Location Details</Label>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="village">Village *</Label>
                  <Input
                    id="village"
                    value={formData.location.village}
                    onChange={(e) => handleInputChange('location.village', e.target.value)}
                    placeholder="Village name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mandal">Mandal</Label>
                  <Input
                    id="mandal"
                    value={formData.location.mandal}
                    onChange={(e) => handleInputChange('location.mandal', e.target.value)}
                    placeholder="Mandal name"
                  />
                </div>
                <div>
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    value={formData.location.district}
                    onChange={(e) => handleInputChange('location.district', e.target.value)}
                    placeholder="District name"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Select value={formData.location.state} onValueChange={(value) => handleInputChange('location.state', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Telangana">Telangana</SelectItem>
                      <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                      <SelectItem value="Karnataka">Karnataka</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* GPS Mapping */}
            <div>
              <Label className="text-base font-medium mb-3 block">GPS Coordinates</Label>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={isMapping ? "secondary" : "outline"}
                    onClick={() => setIsMapping(!isMapping)}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    {isMapping ? "Close Map" : "Open GPS Mapping"}
                  </Button>
                  {formData.coordinates.latitude && formData.coordinates.longitude && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <AlertCircle className="w-4 h-4" />
                      Coordinates: {formData.coordinates.latitude}, {formData.coordinates.longitude}
                    </div>
                  )}
                </div>
                
                {isMapping && (
                  <Card>
                    <CardContent className="p-4">
                      <MapCanvas onCoordinatesSet={handleCoordinatesSet} />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Soil Type */}
            <div>
              <Label htmlFor="soilType">Soil Type</Label>
              <Select value={formData.soilType} onValueChange={(value) => handleInputChange('soilType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select soil type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red-soil">Red Soil</SelectItem>
                  <SelectItem value="black-soil">Black Soil</SelectItem>
                  <SelectItem value="alluvial">Alluvial Soil</SelectItem>
                  <SelectItem value="clay">Clay Soil</SelectItem>
                  <SelectItem value="sandy">Sandy Soil</SelectItem>
                  <SelectItem value="loamy">Loamy Soil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Water Sources */}
            <div>
              <Label className="text-base font-medium mb-3 block">Water Sources (Select all applicable)</Label>
              <div className="grid gap-2 md:grid-cols-3">
                {['Borewell', 'Canal', 'Tank/Pond', 'River', 'Rainwater Harvesting', 'Drip Irrigation'].map((source) => (
                  <div key={source} className="flex items-center space-x-2">
                    <Checkbox
                      id={`water-${source}`}
                      checked={formData.waterSource.includes(source)}
                      onCheckedChange={(checked: boolean) => handleArrayChange('waterSource', source, checked)}
                    />
                    <Label htmlFor={`water-${source}`}>{source}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Infrastructure */}
            <div>
              <Label className="text-base font-medium mb-3 block">Existing Infrastructure</Label>
              <div className="grid gap-2 md:grid-cols-3">
                {['Storage Warehouse', 'Processing Unit', 'Equipment Shed', 'Boundary Fencing', 'Electricity Connection', 'Road Access'].map((infra) => (
                  <div key={infra} className="flex items-center space-x-2">
                    <Checkbox
                      id={`infra-${infra}`}
                      checked={formData.infrastructure.includes(infra)}
                      onCheckedChange={(checked: boolean) => handleArrayChange('infrastructure', infra, checked)}
                    />
                    <Label htmlFor={`infra-${infra}`}>{infra}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Crop History */}
            <div>
              <Label htmlFor="cropHistory">Crop History (Last 3 years)</Label>
              <Textarea
                id="cropHistory"
                value={formData.cropHistory}
                onChange={(e) => handleInputChange('cropHistory', e.target.value)}
                placeholder="Describe the crops grown in the last 3 years, yield patterns, etc."
                rows={3}
              />
            </div>

            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Upload</CardTitle>
                <CardDescription>Upload ownership documents for verification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Land Title/Patta Document</p>
                      <Button variant="outline" size="sm" className="mt-2">Upload Document</Button>
                    </div>
                    {/* <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Survey Settlement Document</p>
                      <Button variant="outline" size="sm" className="mt-2">Upload Document</Button>
                    </div> */}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Save className="w-4 h-4 mr-2 animate-spin" />
                    Registering Plot...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Register Plot
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Save as Draft
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};