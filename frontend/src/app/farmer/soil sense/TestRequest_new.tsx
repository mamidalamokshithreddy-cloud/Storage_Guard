import React, { useState } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { 
  TestTube, 
  Calendar, 
  MapPin, 
  ArrowLeft,
  Send
} from "lucide-react";
import { useToast } from "../ui/use-toast";

interface TestRequestProps {
  onBackToSoilSense: () => void;
}

// Form state interface
interface FormData {
  farmLocation: string;
  plotSize: string;
  cropType: string;
  urgency: string;
  scheduleDate: string;
  scheduleTime: string;
  notes: string;
}

// Initial form state
const initialFormData: FormData = {
  farmLocation: '',
  plotSize: '',
  cropType: '',
  urgency: '',
  scheduleDate: '',
  scheduleTime: '',
  notes: ''
};

// Available soil tests
const availableTests = [
  { 
    id: 'basic-soil', 
    name: 'Basic Soil Analysis', 
    nameTelugu: 'ప్రాథమిక మట్టి విశ్లేషణ',
    price: '₹800', 
    duration: '2-3 days',
    description: 'pH, EC, Organic Carbon, Available NPK',
    checked: false
  },
  { 
    id: 'advanced-soil', 
    name: 'Advanced Soil Analysis',
    nameTelugu: 'అధునాతన మట్టి విశ్లేషణ', 
    price: '₹1500', 
    duration: '3-5 days',
    description: 'All basic tests + Micronutrients, Soil texture, Water holding capacity',
    checked: false
  },
  { 
    id: 'comprehensive', 
    name: 'Comprehensive Soil Health',
    nameTelugu: 'సమగ్ర మట్టి ఆరోగ్యం', 
    price: '₹2500', 
    duration: '5-7 days',
    description: 'Complete soil analysis + Biological activity + Heavy metals + Recommendations',
    checked: false
  },
  { 
    id: 'water-quality', 
    name: 'Water Quality Test',
    nameTelugu: 'నీటి నాణ్యత పరీక్ష', 
    price: '₹600', 
    duration: '2-3 days',
    description: 'pH, EC, TDS, Heavy metals, Bacterial contamination',
    checked: false
  }
];

const TestRequest: React.FC<TestRequestProps> = ({ onBackToSoilSense }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedTests, setSelectedTests] = useState(availableTests);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Handle form input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle test selection
  const handleTestSelection = (testId: string, checked: boolean) => {
    setSelectedTests(prev => 
      prev.map(test => 
        test.id === testId ? { ...test, checked } : test
      )
    );
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    return selectedTests
      .filter(test => test.checked)
      .reduce((total, test) => total + parseInt(test.price.replace('₹', '').replace(',', '')), 0);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedTestsList = selectedTests.filter(test => test.checked);
    
    if (selectedTestsList.length === 0) {
      toast({
        title: "No tests selected",
        description: "Please select at least one test to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.farmLocation || !formData.plotSize || !formData.scheduleDate) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Test Request Submitted!",
        description: `Your soil test request has been submitted successfully. Total cost: ₹${calculateTotalCost()}`,
      });

      // Reset form
      setFormData(initialFormData);
      setSelectedTests(availableTests);
      
      // Navigate back to SoilSense main page after submission
      setTimeout(() => {
        onBackToSoilSense();
      }, 2000);

    } catch (_err) {
      // Ignore error - toast notification will be shown
      toast({
        title: "Submission failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TestTube className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Soil Test Request</h1>
                  <p className="text-sm text-gray-500">మట్టి పరీక్ష అభ్యర్థన</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Test Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-primary" />
                  Select Tests (పరీక్షలను ఎంచుకోండి)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {selectedTests.map((test) => (
                    <div key={test.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <Checkbox 
                          checked={test.checked}
                          onCheckedChange={(checked) => handleTestSelection(test.id, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">{test.name}</h3>
                              <p className="text-sm text-gray-500">{test.nameTelugu}</p>
                              <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">{test.price}</div>
                              <div className="text-sm text-gray-500">{test.duration}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Cost Display */}
                {selectedTests.some(test => test.checked) && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-green-800 font-semibold">Total Cost:</span>
                      <span className="text-xl font-bold text-green-600">₹{calculateTotalCost()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Farm Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Farm Details (వ్యవసాయ వివరాలు)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Farm Location * <span className="text-gray-500">(వ్యవసాయ స్థలం)</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter farm location"
                      value={formData.farmLocation}
                      onChange={(e) => handleInputChange('farmLocation', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Plot Size * <span className="text-gray-500">(ప్లాట్ పరిమాణం)</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., 2 acres, 1 hectare"
                      value={formData.plotSize}
                      onChange={(e) => handleInputChange('plotSize', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Current/Planned Crop <span className="text-gray-500">(పంట రకం)</span>
                    </label>
                    <Select value={formData.cropType} onValueChange={(value) => handleInputChange('cropType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select crop type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rice">Rice (వరి)</SelectItem>
                        <SelectItem value="wheat">Wheat (గోధుమలు)</SelectItem>
                        <SelectItem value="cotton">Cotton (పత్తి)</SelectItem>
                        <SelectItem value="sugarcane">Sugarcane (చెరుకు)</SelectItem>
                        <SelectItem value="tomato">Tomato (టమాటో)</SelectItem>
                        <SelectItem value="chilli">Chilli (మిర్చి)</SelectItem>
                        <SelectItem value="onion">Onion (ఉల్లిపాయ)</SelectItem>
                        <SelectItem value="other">Other (ఇతర)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Urgency Level <span className="text-gray-500">(అత్యవసరత)</span>
                    </label>
                    <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Within 2 weeks</SelectItem>
                        <SelectItem value="medium">Medium - Within 1 week</SelectItem>
                        <SelectItem value="high">High - Within 3 days</SelectItem>
                        <SelectItem value="urgent">Urgent - Within 24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Schedule Sample Collection (నమూనా సేకరణ షెడ్యూల్)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Preferred Date * <span className="text-gray-500">(తేదీ)</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.scheduleDate}
                      onChange={(e) => handleInputChange('scheduleDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Preferred Time <span className="text-gray-500">(సమయం)</span>
                    </label>
                    <Select value={formData.scheduleTime} onValueChange={(value) => handleInputChange('scheduleTime', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (9:00 AM - 12:00 PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (2:00 PM - 5:00 PM)</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional Notes <span className="text-gray-500">(అదనపు గమనికలు)</span>
                  </label>
                  <Textarea
                    placeholder="Any specific instructions or concerns..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                type="submit"
                disabled={isSubmitting || selectedTests.filter(t => t.checked).length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Test Request (అభ్యర్థన పంపు)
                  </div>
                )}
              </Button>
              
              <Button 
                type="button"
                variant="outline" 
                onClick={onBackToSoilSense}
                className="sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to SoilSense
              </Button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default TestRequest;