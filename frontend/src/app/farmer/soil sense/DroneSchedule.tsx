import React, { useState } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
// import { useRouter } from "next/navigation"; 
import { 
  Plane, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Thermometer,
  Wind,
  Satellite,
  CheckCircle,
  AlertTriangle
} from "lucide-react";


import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import { useToast } from "../ui/use-toast";

interface DroneScheduleProps {
  onBackToSoilSense?: () => void;
}

const DroneSchedule = ({ onBackToSoilSense }: DroneScheduleProps = {}) => {
  const { toast } = useToast();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const soilSenseServices = [
    {
      title: "Drone Schedule",
      titleTelugu: "డ్రోన్ షెడ్యూల్",
      description: "Schedule precision drone scanning and sample collection",
      descriptionTelugu: "ప్రెసిషన్ డ్రోన్ స్కానింగ్ మరియు నమూనా సేకరణ షెడ్యూల్",
      duration: "2-3 hours",
      price: "Included",
      icon: Plane,
      available: true
    }
  ];

  const timeSlots = [
    { id: '08:00', time: '8:00 AM - 10:00 AM', availability: 'available', weather: 'optimal' },
    { id: '10:00', time: '10:00 AM - 12:00 PM', availability: 'available', weather: 'good' },
    { id: '14:00', time: '2:00 PM - 4:00 PM', availability: 'limited', weather: 'windy' },
    { id: '16:00', time: '4:00 PM - 6:00 PM', availability: 'available', weather: 'optimal' },
  ];

  const weatherConditions = {
    temperature: '28°C',
    humidity: '65%',
    windSpeed: '12 km/h',
    visibility: 'Excellent',
    forecast: 'Clear skies, ideal for drone operations'
  };

  const droneCapabilities = [
    {
      title: 'Multi-Spectral Imaging',
      titleTelugu: 'మల్టి-స్పెక్ట్రల్ ఇమేజింగ్',
      description: 'Advanced sensors for soil composition analysis',
      icon: Satellite
    },
    {
      title: 'Precision GPS Sampling',
      titleTelugu: 'ప్రెసిషన్ GPS నమూనా',
      description: 'Accurate soil sample collection with GPS coordinates',
      icon: MapPin
    },
    {
      title: 'Real-time Moisture Detection',
      titleTelugu: 'రియల్-టైమ్ తేమ గుర్తింపు',
      description: 'Instant soil moisture content measurement',
      icon: Thermometer
    },
    {
      title: 'Weather Adaptive Flight',
      titleTelugu: 'వాతావరణ అనుకూల విమానం',
      description: 'Automatic adjustment based on wind conditions',
      icon: Wind
    }
  ];

  const handleScheduleConfirm = () => {
    if (!selectedDate || !selectedTimeSlot) {
      toast({
        title: "Please select date and time",
        description: "Select both date and time slot to schedule the drone scan",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Drone scan scheduled",
      description: "Your drone scanning session has been scheduled successfully. You'll receive a confirmation SMS.",
    });

    // Navigate back to SoilSense main page after scheduling
    if (onBackToSoilSense) {
      setTimeout(() => {
        onBackToSoilSense();
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen field-gradient">
      
      <AgriChatAgent />
      <AgriAIPilotSidePeek
        agentType="SoilSense"
        agentName="Drone Schedule"
        agentNameTelugu="డ్రోన్ షెడ్యూల్"
        services={soilSenseServices}
      />
      
      <div className="ml-0 min-h-screen">
        {/* <PageHeader
          title="Drone Scan & Sample Pickup"
          titleTelugu="డ్రోన్ స్కాన్ మరియు నమూనా పికప్"
          icon={Plane}
          backButton={{ label: "Back to Test Request", route: "/soil-sense/test-request" }}
          nextButton={{ label: "Monitoring", route: "/soil-sense/scan-monitoring" }}
        /> */}

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Scheduling Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Weather Conditions */}
              <Card className="agri-card border-success/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-5 h-5" />
                    Weather Conditions - Favorable | వాతావరణ పరిస్థితులు - అనుకూలమైనవి
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-success/10 rounded-lg">
                      <Thermometer className="w-6 h-6 text-success mx-auto mb-2" />
                      <p className="text-sm font-semibold">{weatherConditions.temperature}</p>
                      <p className="text-xs text-muted-foreground">Temperature</p>
                    </div>
                    <div className="text-center p-3 bg-primary/10 rounded-lg">
                      <Wind className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-sm font-semibold">{weatherConditions.windSpeed}</p>
                      <p className="text-xs text-muted-foreground">Wind Speed</p>
                    </div>
                    <div className="text-center p-3 bg-accent/10 rounded-lg">
                      <Satellite className="w-6 h-6 text-accent mx-auto mb-2" />
                      <p className="text-sm font-semibold">{weatherConditions.humidity}</p>
                      <p className="text-xs text-muted-foreground">Humidity</p>
                    </div>
                    <div className="text-center p-3 bg-secondary/10 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-secondary mx-auto mb-2" />
                      <p className="text-sm font-semibold">{weatherConditions.visibility}</p>
                      <p className="text-xs text-muted-foreground">Visibility</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-success/5 rounded-lg border border-success/20">
                    <p className="text-sm text-success font-medium">✓ {weatherConditions.forecast}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Date Selection */}
              <Card className="agri-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Select Date | తేదీ ఎంచుకోండి
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Today', 'Tomorrow', 'Day After', 'This Weekend'].map((date, index) => {
                      const dateValue = `2024-03-${15 + index}`;
                      const isSelected = selectedDate === dateValue;
                      
                      return (
                        <div
                          key={dateValue}
                          className={`p-4 border-2 rounded-lg cursor-pointer text-center transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedDate(dateValue)}
                        >
                          <p className="font-semibold text-sm">{date}</p>
                          <p className="text-xs text-muted-foreground">Mar {15 + index}</p>
                          {index === 0 && (
                            <Badge variant="secondary" className="mt-1 text-xs">Recommended</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Time Slot Selection */}
              <Card className="agri-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Available Time Slots | అందుబాటులో ఉన్న సమయ స్లాట్లు
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {timeSlots.map((slot) => {
                      const isSelected = selectedTimeSlot === slot.id;
                      const isAvailable = slot.availability === 'available';
                      
                      return (
                        <div
                          key={slot.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : isAvailable 
                                ? 'border-border hover:border-primary/50' 
                                : 'border-muted bg-muted/20 cursor-not-allowed'
                          }`}
                          onClick={() => isAvailable && setSelectedTimeSlot(slot.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-sm">{slot.time}</p>
                            <Badge 
                              variant={isAvailable ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {slot.availability}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {slot.weather === 'optimal' && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-success" />
                                <span className="text-xs text-success">Optimal</span>
                              </div>
                            )}
                            {slot.weather === 'good' && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-primary" />
                                <span className="text-xs text-primary">Good</span>
                              </div>
                            )}
                            {slot.weather === 'windy' && (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-warning" />
                                <span className="text-xs text-warning">Windy</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Drone Capabilities & Info */}
            <div className="space-y-6">
              <Card className="agri-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="w-5 h-5 text-primary" />
                    Drone Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {droneCapabilities.map((capability, index) => {
                      const Icon = capability.icon;
                      return (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{capability.title}</h4>
                            <p className="text-xs text-accent font-medium mb-1">{capability.titleTelugu}</p>
                            <p className="text-xs text-muted-foreground">{capability.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="agri-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary">Mission Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Coverage Area:</span>
                      <span className="font-semibold">15.5 acres</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flight Duration:</span>
                      <span className="font-semibold">45-60 minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sample Points:</span>
                      <span className="font-semibold">25 locations</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Collection:</span>
                      <span className="font-semibold">Real-time</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                    <p className="text-xs text-primary font-medium">
                      ✓ GPS coordinates will be recorded for each sample point
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button 
                  onClick={handleScheduleConfirm}
                  className="w-full"
                  disabled={!selectedDate || !selectedTimeSlot}
                >
                  Confirm Schedule
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onBackToSoilSense}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Test Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DroneSchedule;