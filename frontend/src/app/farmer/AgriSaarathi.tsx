
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../farmer/ui/card';
import { Button } from '../farmer/ui/button';
import { Progress } from '../farmer/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../farmer/ui/tabs';
// import AgriAgentsSidebar from '../farmer/AgriAgentsSidebar';
// import PageHeader from '../farmer/PageHeader';
import AgriAIPilotSidePeek from '../farmer/AgriAIPilotSidePeek';

// AgriSaarathi-specific services
const agriSaarathiServices = [
  {
    title: "Command Center Consultation",
    titleTelugu: "కమాండ్ సెంటర్ సలహా",
    description: "Expert guidance on agricultural workflow management and coordination",
    descriptionTelugu: "వ్యవసాయ వర్క్‌ఫ్లో నిర్వహణ మరియు సమన్వయంపై నిపుణుల మార్గదర్శనం",
    duration: "2-3 hours",
    price: "₹2,000",
    icon: Users,
    available: true
  },
  {
    title: "Workflow Optimization",
    titleTelugu: "వర్క్‌ఫ్లో ఆప్టిమైజేషన్",
    description: "AI-powered analysis and optimization of farming processes",
    descriptionTelugu: "వ్యవసాయ ప్రక్రియల యొక్క AI ఆధారిత విశ్లేషణ మరియు ఆప్టిమైజేషన్",
    duration: "3-4 hours",
    price: "₹2,500",
    icon: BarChart,
    available: true
  },
  {
    title: "Real-time Monitoring Setup",
    titleTelugu: "నిజ సమయ పర్యవేక్షణ సెటప్",
    description: "Configure and optimize real-time farm monitoring systems",
    descriptionTelugu: "నిజ సమయ వ్యవసాయ పర్యవేక్షణ వ్యవస్థలను కాన్ఫిగర్ చేయండి",
    duration: "2-3 hours",
    price: "₹1,800",
    icon: Eye,
    available: true
  },
  {
    title: "Data Analytics Training",
    titleTelugu: "డేటా విశ్లేషణ శిక్షణ",
    description: "Learn to interpret and use agricultural data effectively",
    descriptionTelugu: "వ్యవసాయ డేటాను ప్రభావవంతంగా అర్థం చేసుకోవడం మరియు ఉపయోగించడం",
    duration: "4-5 hours",
    price: "₹3,000",
    icon: LineChart,
    available: true
  },
  {
    title: "System Integration Support",
    titleTelugu: "సిస్టమ్ ఇంటిగ్రేషన్ మద్దతు",
    description: "Integrate all farming modules and ensure seamless operation",
    descriptionTelugu: "అన్ని వ్యవసాయ మాడ్యూల్‌లను ఇంటిగ్రేట్ చేయండి మరియు నిరంతర ఆపరేషన్‌ను నిర్ధారించండి",
    duration: "3-4 hours",
    price: "₹2,200",
    icon: Zap,
    available: true
  },
  {
    title: "Live Command Center Support",
    titleTelugu: "ప్రత్యక్ష కమాండ్ సెంటర్ మద్దతు",
    description: "Real-time assistance with command center operations",
    descriptionTelugu: "కమాండ్ సెంటర్ కార్యకలాపాలతో నిజ సమయ సహాయం",
    duration: "1 hour",
    price: "₹800",
    icon: Phone,
    available: true
  }
];

// Simple AgriAssistant component placeholder
interface AgriAssistantProps {
  agriData: any;
  alerts: any[];
  onExecuteAction: (action: string) => void;
  workflowStages: any[];
  currentStage: number;
  onStageAction: (stageId: string) => void;
  stageResults: any;
}

const AgriAssistant: React.FC<AgriAssistantProps> = ({ 
  agriData, 
  alerts, 
  onExecuteAction, 
  workflowStages, 
  currentStage, 
  onStageAction, 
  stageResults 
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
      <h3 className="text-xl font-bold text-slate-800 mb-4">AI Assistant</h3>
      <p className="text-slate-600 mb-4">Agricultural Intelligence Assistant is ready to help with your farming operations.</p>
      <div className="flex gap-2">
        <Button onClick={() => onExecuteAction('analyzeCropHealth')} className="bg-slate-600 hover:bg-slate-700">
          Analyze Crop Health
        </Button>
        <Button onClick={() => onExecuteAction('optimizeIrrigation')} variant="outline">
          Optimize Irrigation
        </Button>
      </div>
    </div>
  );
};

import { 
  ArrowRight,
  CheckCircle,
  Play,
  Users,
  Star,
  Phone,
  MapPin,
  Clock,
  Cloud,
  Droplets,
  AlertTriangle,
  TrendingUp,
  BarChart,
  Truck,
  Building2,
  LineChart,
  ShieldAlert,
  Sprout,
  Tractor,
  Bell,
  PieChart,
  SunMedium,
  Thermometer,
  CloudRain,
  Wind,
  Leaf,
  Bug,
  Zap,
  Eye,
  TestTube,
} from 'lucide-react';
import { useRouter } from "next/navigation";

// Analytics Panel component for Command Center
const AnalyticsPanel = ({ results, workflowStages }: { results: Record<string, any>; workflowStages: any[] }) => {
  // Calculate overall workflow progress
  const progressPercentage = (results && Object.keys(results).length / workflowStages.length) * 100;

  return (
    <Card className="bg-white border border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <h4 className="text-xl font-bold text-slate-800 mb-4">🎯 Agricultural Workflow Analytics</h4>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">{Math.round(progressPercentage)}%</div>
            <div className="text-xs text-slate-600">Workflow Progress</div>
        </div>
        <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">176%</div>
            <div className="text-xs text-slate-600">ROI Increase</div>
        </div>
        <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">35%</div>
            <div className="text-xs text-slate-600">Resource Optimization</div>
        </div>
        <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">₹12.5K</div>
            <div className="text-xs text-slate-600">Cost Savings</div>
        </div>
      </div>
      <div className="space-y-4">
        {Object.entries(results || {}).map(([stageId, data]) => {
          const stage = workflowStages.find(s => s.id === stageId);
          if (!stage) return null;

          return (
            <div key={stageId} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center">
                    <div className="w-4 h-4 rounded bg-green-600 flex items-center justify-center">
                      <stage.icon className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <h5 className="font-bold text-slate-800">{stage.name}</h5>
                </div>
                <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(data as Record<string, any>).map(([key, value]) => {
                  if (key === 'nextAction') return null;
                  return (
                    <div key={key} className="text-sm">
                      <span className="text-slate-500">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
                      <span className="text-slate-800 font-medium">{String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      </CardContent>
    </Card>
  );
};

// Weather Info Component
const WeatherInfo = ({ weatherData }: { weatherData: any }) => {
  // Calculate weather status and color
  const getWeatherStatus = (temp: number, humidity: number, rainChance: number) => {
    if (temp > 35) return { status: 'Heat Warning', color: 'text-red-600' };
    if (rainChance > 70) return { status: 'Rain Warning', color: 'text-slate-600' };
    if (humidity > 80) return { status: 'High Humidity', color: 'text-yellow-600' };
    return { status: 'Optimal', color: 'text-green-600' };
  };

  const weatherStatus = getWeatherStatus(
    weatherData.temperature,
    weatherData.humidity,
    weatherData.rainChance
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
            <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center mr-2">
              <SunMedium className="w-3 h-3 text-white" />
            </div>
          Current Weather
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-sm text-slate-600">Temperature</div>
            <div className="text-xl font-bold text-slate-800">28°C</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-sm text-slate-600">Humidity</div>
            <div className={`text-xl font-bold ${weatherData.humidity > 80 ? 'text-yellow-600' :
                weatherData.humidity < 40 ? 'text-orange-600' :
                  'text-slate-800'
              }`}>{weatherData.humidity.toFixed(1)}%</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-sm text-slate-600">Wind</div>
            <div className="text-xl font-bold text-slate-800">{weatherData.windSpeed.toFixed(1)} km/h</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-sm text-slate-600">Rain Chance</div>
            <div className={`text-xl font-bold ${weatherData.rainChance > 70 ? 'text-slate-600' :
                weatherData.rainChance > 40 ? 'text-slate-800' :
                  'text-green-600'
              }`}>{weatherData.rainChance.toFixed(0)}%</div>
          </div>
        </div>
        </CardContent>
      </Card>
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
            <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center mr-2">
              <Cloud className="w-3 h-3 text-white" />
            </div>
          5-Day Forecast
        </h4>
        <div className="flex justify-between">
          {[
            { day: 'Wed', temp: '27°C', icon: <SunMedium className="w-4 h-4" /> },
            { day: 'Thu', temp: '26°C', icon: <CloudRain className="w-4 h-4" /> },
            { day: 'Fri', temp: '28°C', icon: <SunMedium className="w-4 h-4" /> },
            { day: 'Sat', temp: '29°C', icon: <SunMedium className="w-4 h-4" /> },
            { day: 'Sun', temp: '27°C', icon: <Wind className="w-4 h-4" /> },
          ].map((day, i) => (
            <div key={i} className="text-center bg-slate-50 px-3 py-2 rounded-lg">
              <div className="text-xs text-slate-600">{day.day}</div>
              <div className="my-1 text-slate-800">{day.icon}</div>
              <div className="text-sm font-semibold text-slate-800">{day.temp}</div>
            </div>
          ))}
        </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Crop Monitoring Component
const CropMonitoring = ({ cropHealth, weatherData }: { cropHealth: any; weatherData: any }) => {
  // Calculate health indicators
  const getHealthStatus = (overall: number) => {
    if (overall > 90) return { text: 'Excellent', color: 'text-emerald-600' };
    if (overall > 70) return { text: 'Good', color: 'text-green-600' };
    if (overall > 50) return { text: 'Fair', color: 'text-yellow-600' };
    return { text: 'Poor', color: 'text-red-600' };
  };

  const healthStatus = getHealthStatus(cropHealth.overall);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
              <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center mr-2">
                <Leaf className="w-3 h-3 text-white" />
              </div>
            Crop Health
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Overall Health</span>
              <span className={`font-semibold ${healthStatus.color}`}>{cropHealth.overall.toFixed(1)}%</span>
            </div>
            <Progress value={cropHealth.overall} className="bg-slate-200" />
            <div className={`text-sm ${healthStatus.color}`}>{healthStatus.text} Condition</div>
          </div>
        </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
              <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center mr-2">
                <Bug className="w-3 h-3 text-white" />
              </div>
            Pest Status
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Risk Level</span>
              <span className={`font-semibold ${cropHealth.pestRisk > 30 ? 'text-red-800' :
                  cropHealth.pestRisk > 20 ? 'text-amber-800' :
                    'text-green-800'
                }`}>{
                  cropHealth.pestRisk > 30 ? 'High' :
                    cropHealth.pestRisk > 20 ? 'Medium' :
                      'Low'
                }</span>
            </div>
            <Progress value={cropHealth.pestRisk} className="bg-slate-200" />
            <div className="text-sm text-slate-600">No immediate threats</div>
          </div>
        </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
              <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center mr-2">
                <Droplets className="w-3 h-3 text-white" />
              </div>
            Soil Moisture
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Current Level</span>
              <span className={`font-semibold ${cropHealth.soilMoisture > 80 ? 'text-red-800' :
                  cropHealth.soilMoisture < 40 ? 'text-yellow-800' :
                    'text-slate-800'
                }`}>{cropHealth.soilMoisture.toFixed(1)}%</span>
            </div>
            <Progress value={cropHealth.soilMoisture} className="bg-slate-200" />
            <div className="text-sm text-slate-600">Optimal Range</div>
          </div>
        </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <h4 className="font-semibold text-slate-800 mb-3">Growth Stage Timeline</h4>
            <div className="space-y-3">
              {[
                { stage: 'Germination', progress: 100, date: 'Completed Jun 15' },
                { stage: 'Vegetative', progress: 100, date: 'Completed Jul 20' },
                { stage: 'Flowering', progress: 75, date: 'In Progress' },
                { stage: 'Maturity', progress: 0, date: 'Expected Sep 15' },
              ].map((stage, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-1/4 text-sm text-slate-600">{stage.stage}</div>
                  <div className="flex-1">
                    <Progress value={stage.progress} className="h-2" />
                  </div>
                  <div className="w-1/3 text-sm text-slate-500">{stage.date}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <h4 className="font-semibold text-slate-800 mb-3">Field Conditions</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Temperature', value: '28°C', icon: <Thermometer className="w-4 h-4" /> },
                { label: 'pH Level', value: '6.8', icon: <Zap className="w-4 h-4" /> },
                { label: 'Nitrogen', value: '45mg/kg', icon: <Eye className="w-4 h-4" /> },
                { label: 'Phosphorus', value: '85mg/kg', icon: <Eye className="w-4 h-4" /> },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-slate-600 text-sm mb-1">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <div className="text-lg font-semibold text-slate-800">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Market Intelligence Component
const MarketIntelligence = ({ marketData }: { marketData: any }) => {
  // Format price with commas
  const formatPrice = (price: number) => {
    return `₹${price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  // Format change percentage
  const formatChange = (change: number) => {
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
              <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center mr-2">
                <TrendingUp className="w-3 h-3 text-white" />
              </div>
              Market Prices
            </h4>
            <div className="space-y-3">
              {[
                { crop: 'Wheat', price: formatPrice(marketData.wheat.price), change: formatChange(marketData.wheat.change) },
                { crop: 'Rice', price: formatPrice(marketData.rice.price), change: formatChange(marketData.rice.change) },
                { crop: 'Pulses', price: formatPrice(marketData.pulses.price), change: formatChange(marketData.pulses.change) },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-800 font-medium">{item.crop}</span>
                  <div className="text-right">
                    <div className="text-slate-800">{item.price}</div>
                    <div className={`text-sm ${item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>{item.change}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
              <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center mr-2">
                <BarChart className="w-3 h-3 text-white" />
              </div>
              Demand Forecast
            </h4>
            <div className="space-y-3">
              {[
                { market: 'Local Market', demand: 'High', trend: '↑' },
                { market: 'State Market', demand: 'Medium', trend: '→' },
                { market: 'Export Market', demand: 'Very High', trend: '↑' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-800 font-medium">{item.market}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-800">{item.demand}</span>
                    <span className={`${item.trend === '↑' ? 'text-green-600' : 'text-yellow-600'
                      }`}>{item.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Resource Management Component
const ResourceManagement = ({ resourceLevels }: { resourceLevels: any }) => {
  // Get status color based on level
  const getStatusColor = (level: number) => {
    if (level < 20) return 'text-red-600';
    if (level < 40) return 'text-yellow-600';
    return 'text-green-600';
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
              <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center mr-2">
                <Droplets className="w-3 h-3 text-white" />
              </div>
            Water Management
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Usage Today</span>
              <span className="text-slate-800 font-medium">2,500 L</span>
            </div>
            <Progress value={65} className="bg-slate-200" />
            <div className="text-xs text-slate-600">65% of daily allocation</div>
          </div>
        </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
              <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center mr-2">
                <Sprout className="w-3 h-3 text-white" />
              </div>
            Fertilizer Stock
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Current Stock</span>
              <span className="text-slate-800 font-medium">850 kg</span>
            </div>
            <Progress value={45} className="bg-slate-200" />
            <div className="text-xs text-slate-600">45% remaining</div>
          </div>
        </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
              <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center mr-2">
                <Tractor className="w-3 h-3 text-white" />
              </div>
            Equipment Status
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Active Machines</span>
              <span className="text-slate-800 font-medium">8/10</span>
            </div>
            <Progress value={80} className="bg-slate-200" />
            <div className="text-xs text-slate-600">80% operational</div>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Risk Assessment Component
const RiskAssessment = ({ alerts = [] }: { alerts?: any[] }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
              <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center mr-2">
                <AlertTriangle className="w-3 h-3 text-white" />
              </div>
              Active Alerts
            </h4>
            <div className="space-y-3">
              {[
                { type: 'Weather', message: 'Heavy rain expected in 48hrs', severity: 'High' },
                { type: 'Pest', message: 'Low-level bollworm activity detected', severity: 'Low' },
                { type: 'Disease', message: 'No active threats', severity: 'None' },
              ].map((alert, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-800">{alert.type}</div>
                    <div className="text-sm text-slate-600">{alert.message}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-sm ${alert.severity === 'High' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                    {alert.severity}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
              <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center mr-2">
                <ShieldAlert className="w-3 h-3 text-white" />
              </div>
              Risk Metrics
            </h4>
            <div className="space-y-3">
              {[
                { category: 'Weather Risk', level: 35 },
                { category: 'Pest Risk', level: 15 },
                { category: 'Disease Risk', level: 8 },
                { category: 'Market Risk', level: 25 },
              ].map((risk, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{risk.category}</span>
                    <span className={`font-medium ${risk.level > 30 ? 'text-red-600' :
                        risk.level > 20 ? 'text-yellow-600' :
                          'text-green-600'
                      }`}>{risk.level}%</span>
                  </div>
                  <Progress
                    value={risk.level}
                    className={`${risk.level > 30 ? 'bg-red-200' :
                        risk.level > 20 ? 'bg-yellow-200' :
                          'bg-green-200'
                      }`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Yield Forecasting Component
const YieldForecasting = ({ cropHealth, marketData }: { cropHealth?: any; marketData?: any }) => {
  return (
    <div className="space-y-4">
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
            <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center mr-2">
              <PieChart className="w-3 h-3 text-white" />
            </div>
            Yield Projections
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-600">Expected Yield</div>
              <div className="text-xl font-bold text-slate-800">21.5 Q/acre</div>
              <div className="text-xs text-green-600">+15% vs last season</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-600">Quality Grade</div>
              <div className="text-xl font-bold text-slate-800">A+</div>
              <div className="text-xs text-green-600">Premium Quality</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-600">Revenue Potential</div>
              <div className="text-xl font-bold text-slate-800">₹1.35L</div>
              <div className="text-xs text-green-600">Per acre</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Shared context for real-time data
const INITIAL_STATE = {
  weatherData: {
    temperature: 28,
    humidity: 65,
    windSpeed: 12,
    rainChance: 20
  },
  cropHealth: {
    overall: 92,
    pestRisk: 15,
    soilMoisture: 65,
    growthStage: 'Flowering',
    nutrientLevels: 85,
    rootHealth: 90,
    leafDensity: 88
  },
  resourceLevels: {
    water: 65,
    fertilizer: 45,
    equipment: 80,
    power: 95,
    connectivity: 98,
    sensorStatus: 100,
    storageCapacity: 75
  },
  systemStatus: {
    iotNetwork: 100,
    dataProcessing: 100,
    aiModels: 100,
    database: 100,
    sensors: {
      soil: 100,
      weather: 100,
      irrigation: 100,
      drone: 100
    }
  }
};

const useAgriData = () => {
  const [weatherData, setWeatherData] = useState(INITIAL_STATE.weatherData);
  const [cropHealth, setCropHealth] = useState(INITIAL_STATE.cropHealth);
  const [resourceLevels, setResourceLevels] = useState(INITIAL_STATE.resourceLevels);
  const [systemStatus, setSystemStatus] = useState(INITIAL_STATE.systemStatus);

  const [marketData, setMarketData] = useState({
    wheat: { price: 6280, change: 2.8 },
    rice: { price: 4150, change: 1.5 },
    pulses: { price: 5420, change: -0.8 }
  });

  // Initialize system status
  useEffect(() => {
    // Set initial system status if not already set
    const initializeSystemStatus = () => {
      setSystemStatus(prev => {
        if (!prev || Object.keys(prev).length === 0) {
          return {
            iotNetwork: 100,
            dataProcessing: 100,
            aiModels: 100,
            database: 100,
            sensors: {
              soil: 100,
              weather: 100,
              irrigation: 100,
              drone: 100
            }
          };
        }
        return prev;
      });
    };
    
    setTimeout(initializeSystemStatus, 0);
  }, []);

  // Simulate real-time updates with system degradation
  useEffect(() => {
    const interval = setInterval(() => {
      // Update weather
      setWeatherData(prev => {
        if (!prev) return INITIAL_STATE.weatherData;
        return {
          ...prev,
          temperature: prev.temperature + (Math.random() - 0.5),
          humidity: Math.max(30, Math.min(90, prev.humidity + (Math.random() - 0.5) * 2)),
          windSpeed: Math.max(0, Math.min(30, prev.windSpeed + (Math.random() - 0.5) * 2)),
          rainChance: Math.max(0, Math.min(100, prev.rainChance + (Math.random() - 0.5) * 5))
        };
      });

      // Simulate system degradation
      setSystemStatus(prev => {
        if (!prev) return INITIAL_STATE.systemStatus;
        const randomDegradation = () => Math.random() * 2;
        return {
          ...prev,
          iotNetwork: Math.max(0, prev.iotNetwork - randomDegradation()),
          dataProcessing: Math.max(0, prev.dataProcessing - randomDegradation()),
          aiModels: Math.max(0, prev.aiModels - randomDegradation()),
          database: Math.max(0, prev.database - randomDegradation()),
          sensors: {
            soil: Math.max(0, prev.sensors.soil - randomDegradation()),
            weather: Math.max(0, prev.sensors.weather - randomDegradation()),
            irrigation: Math.max(0, prev.sensors.irrigation - randomDegradation()),
            drone: Math.max(0, prev.sensors.drone - randomDegradation())
          }
        };
      });

      // Update crop health based on weather and system status
      setCropHealth(prev => {
        const weatherImpact = weatherData.temperature > 35 ? -0.5 :
          weatherData.temperature < 15 ? -0.5 : 0.2;
        const moistureImpact = Math.abs(65 - (prev?.soilMoisture || 65)) > 20 ? -0.3 : 0.1;
        const systemImpact = (systemStatus?.iotNetwork || 100) < 50 ? -1 : 0;

        if (!prev) return INITIAL_STATE.cropHealth;

        return {
          ...prev,
          overall: Math.max(0, Math.min(100, prev.overall + weatherImpact + moistureImpact + systemImpact)),
          soilMoisture: Math.max(0, Math.min(100, prev.soilMoisture + (Math.random() - 0.5) * 2)),
          nutrientLevels: Math.max(0, prev.nutrientLevels - (Math.random() * 0.5)),
          rootHealth: Math.max(0, prev.rootHealth - (Math.random() * 0.3)),
          leafDensity: Math.max(0, prev.leafDensity - (Math.random() * 0.4))
        };
      });

      // Update resource levels
      setResourceLevels(prev => {
        if (!prev) return INITIAL_STATE.resourceLevels;
        return {
          ...prev,
          water: Math.max(0, Math.min(100, prev.water - 0.2)), // Continuous water usage
          fertilizer: Math.max(0, prev.fertilizer - 0.1), // Slow fertilizer depletion
          equipment: Math.max(0, Math.min(100, prev.equipment + (Math.random() - 0.5))) // Equipment availability
        };
      });

      // Update market prices
      setMarketData(prev => {
        if (!prev) return {
          wheat: { price: 6280, change: 2.8 },
          rice: { price: 4150, change: 1.5 },
          pulses: { price: 5420, change: -0.8 }
        };

        const randomChange = () => (Math.random() - 0.5) * 0.5;
        return {
          wheat: {
            price: Math.max(4000, prev.wheat.price * (1 + randomChange() / 100)),
            change: randomChange() * 2
          },
          rice: {
            price: Math.max(3000, prev.rice.price * (1 + randomChange() / 100)),
            change: randomChange() * 2
          },
          pulses: {
            price: Math.max(3500, prev.pulses.price * (1 + randomChange() / 100)),
            change: randomChange() * 2
          }
        };
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []); // No dependencies needed since we're using functional updates

  const safeData = {
    weatherData: weatherData || INITIAL_STATE.weatherData,
    cropHealth: cropHealth || INITIAL_STATE.cropHealth,
    resourceLevels: resourceLevels || INITIAL_STATE.resourceLevels,
    systemStatus: systemStatus || INITIAL_STATE.systemStatus,
    marketData: marketData || { wheat: { price: 0, change: 0 } }
  };

  return safeData;
};

// Main Command Center Component
const AgriSaarathi = () => {
  const router = useRouter();

  const workflowStages = [
    { id: "land-mapping", name: "Land Mapping", nameTelugu: "భూమి మ్యాపింగ్", steps: 5, status: "active", route: "/land-mapping", icon: MapPin, color: "from-slate-500 to-slate-600" },
    { id: "soil-sense", name: "SoilSense", nameTelugu: "మట్టి విశ్లేషణ", steps: 7, status: "active", route: "/soil-sense", icon: Leaf, color: "from-green-500 to-emerald-500" },
    { id: "seed-planner", name: "SeedPlanner", nameTelugu: "విత్తన ప్లానింగ్", steps: 4, status: "active", route: "/seed-planner", icon: Sprout, color: "from-yellow-500 to-amber-500" },
    { id: "aqua-guide", name: "AquaGuide", nameTelugu: "నీటిపారుదల", steps: 4, status: "active", route: "/aqua-guide", icon: Droplets, color: "from-slate-500 to-slate-600" },
    { id: "crop-shield", name: "CropShield", nameTelugu: "పంట రక్షణ", steps: 5, status: "active", route: "/crop-shield", icon: ShieldAlert, color: "from-red-500 to-orange-500" },
    { id: "nutri-dose", name: "NutriDose", nameTelugu: "పోషకాలు", steps: 4, status: "active", route: "/nutri-dose", icon: Zap, color: "from-purple-500 to-indigo-500" },
    { id: "harvest-bot", name: "HarvestBot", nameTelugu: "కోత యంత్రం", steps: 4, status: "active", route: "/harvest-bot", icon: Tractor, color: "from-amber-500 to-yellow-500" },
    { id: "market-connect", name: "MarketConnect", nameTelugu: "మార్కెట్ కనెక్ట్", steps: 4, status: "active", route: "/market-connect", icon: Building2, color: "from-green-500 to-teal-500" }
  ];

  const [activeTab, setActiveTab] = useState('dashboard');
  const agriData = useAgriData();
  const [currentStage, setCurrentStage] = useState(0);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [stageResults, setStageResults] = useState<Record<string, any>>({});

  const onStageAction = (id: string) => {
    const stage = workflowStages.find(s => s.id === id);
    if (!stage) return;

    // Navigate to the route regardless of status
    router.push(stage.route);
    const index = workflowStages.findIndex(s => s.id === id);
    setCurrentStage(index);
    if (!completedStages.includes(index)) {
      setCompletedStages([...completedStages, index]);
    }
  };


  // Track alerts
  const [alerts, setAlerts] = useState<Array<{type: string; message: string; severity: string}>>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Handle dialog state changes to auto-collapse sidebar
  const handleDialogOpen = (isOpen: boolean) => {
    setIsSidebarCollapsed(isOpen);
  };

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) { // sm breakpoint
        setIsSidebarCollapsed(true);
      }
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Monitor conditions and generate alerts with a single update value
  useEffect(() => {
    const alertTimeout = setTimeout(() => {
      if (!agriData) {
        setAlerts([]);
        return;
      }

      const newAlerts: Array<{type: string; message: string; severity: string}> = [];
      
      // Weather alerts
      if (agriData.weatherData?.temperature > 35) {
        newAlerts.push({ type: 'Weather', message: 'High temperature alert', severity: 'High' });
      }
      if (agriData.weatherData?.rainChance > 70) {
        newAlerts.push({ type: 'Weather', message: 'Heavy rain expected', severity: 'High' });
      }

      // Crop health alerts
      if (agriData.cropHealth?.overall < 70) {
        newAlerts.push({ type: 'Crop', message: 'Crop health declining', severity: 'High' });
      }
      if (agriData.cropHealth?.pestRisk > 30) {
        newAlerts.push({ type: 'Pest', message: 'Elevated pest risk detected', severity: 'Medium' });
      }

      // Resource alerts
      if (agriData.resourceLevels?.water < 30) {
        newAlerts.push({ type: 'Resource', message: 'Low water levels', severity: 'High' });
      }
      if (agriData.resourceLevels?.fertilizer < 20) {
        newAlerts.push({ type: 'Resource', message: 'Fertilizer stock low', severity: 'Medium' });
      }

      // System status alerts
      if (agriData.systemStatus?.iotNetwork < 50) {
        newAlerts.push({ type: 'System', message: 'IoT network degradation', severity: 'High' });
      }
      if (agriData.systemStatus?.aiModels < 70) {
        newAlerts.push({ type: 'System', message: 'AI system performance issues', severity: 'Medium' });
      }

      // Only update if alerts have changed
      setAlerts(prevAlerts => {
        const alertsChanged = JSON.stringify(prevAlerts) !== JSON.stringify(newAlerts);
        return alertsChanged ? newAlerts : prevAlerts;
      });
    }, 1000); // Delay alert updates by 1 second

    return () => clearTimeout(alertTimeout);
  }, [agriData]); // Only depend on the main agriData object since we handle null checks


  const handleActionExecution = (actionType: string) => {
    switch (actionType) {
      case 'analyzeCropHealth':
        setActiveTab('crop');
        break;
      case 'optimizeIrrigation':
      case 'adjustOperations':
        setActiveTab('resources');
        break;
      case 'viewMarketAnalysis':
        setActiveTab('market');
        break;
      default:
        break;
    }
  };

  return (
    <div className="h-full w-full bg-white">
      {/* <AgriAgentsSidebar /> */}
      
      {/* Main Content Area */}
      <div className={`${isSidebarCollapsed ? 'ml-16' : 'ml-0 sm:ml-0'} flex flex-col h-full transition-all duration-300`}>
        {/* Page Header */}
        {/* <PageHeader
          title="AgriSaarathi"
          titleTelugu="కృషి సారథి"
          icon={Users}
          backButton={{
            label: "ProcessingHub",
            route: "/processing-hub"
          }}
          nextButton={{
            label: "Next: NutriDose",
            route: "/nutri-dose"
          }}
        /> */}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-full mx-auto space-y-6">
            <div>
              <AgriAssistant
                agriData={agriData}
                alerts={alerts}
                onExecuteAction={handleActionExecution}
                workflowStages={workflowStages}
                currentStage={currentStage}
                onStageAction={onStageAction}
                stageResults={stageResults}
              />
            </div>
            
            {/* Command Center Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Agri Saarathi Command Center</h2>
                    <p className="text-slate-600">Advanced Agricultural Intelligence Hub</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600">System Status</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    <span className="text-lg font-bold text-green-600">All Systems Active</span>
                  </div>
                  <div className="flex -space-x-2 mt-2">
                    <div className="w-8 h-8 bg-slate-300 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-slate-300 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-slate-300 rounded-full border-2 border-white"></div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'IoT Sensors', value: '16/16', icon: <div className="w-6 h-6 rounded bg-green-600 flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>, subtext: 'Online' },
                  { label: 'Data Points', value: '1.2M', icon: <div className="w-6 h-6 rounded bg-green-600 flex items-center justify-center"><LineChart className="w-4 h-4 text-white" /></div>, subtext: 'Analyzed' },
                  { label: 'Field Coverage', value: '12.5 acres', icon: <div className="w-6 h-6 rounded bg-green-600 flex items-center justify-center"><MapPin className="w-4 h-4 text-white" /></div>, subtext: 'Monitored' },
                  { label: 'AI Models', value: '8 Active', icon: <div className="w-6 h-6 rounded bg-green-600 flex items-center justify-center"><Star className="w-4 h-4 text-white" /></div>, subtext: 'Processing' },
                ].map((stat, index) => (
                  <div key={index} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="text-2xl mb-2">{stat.icon}</div>
                    <div className="text-sm text-slate-600">{stat.label}</div>
                    <div className="text-lg font-bold text-slate-800">{stat.value}</div>
                    <div className="text-xs text-slate-500">{stat.subtext}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Command Center Interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-8 bg-white rounded-lg">
                <TabsTrigger value="dashboard" className="text-sm">Dashboard</TabsTrigger>
                <TabsTrigger value="crop" className="text-sm">Crop Monitoring</TabsTrigger>
                <TabsTrigger value="weather" className="text-sm">Weather Analytics</TabsTrigger>
                <TabsTrigger value="resources" className="text-sm">Resource Mgmt</TabsTrigger>
                <TabsTrigger value="risks" className="text-sm">Risk Assessment</TabsTrigger>
                <TabsTrigger value="yield" className="text-sm">Yield Forecast</TabsTrigger>
                <TabsTrigger value="market" className="text-sm">Market Intel</TabsTrigger>
                <TabsTrigger value="analytics" className="text-sm">Analytics</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="dashboard">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <WeatherInfo weatherData={agriData.weatherData} />
                      <RiskAssessment alerts={alerts} />
                    </div>
                    <div className="space-y-6">
                      <CropMonitoring 
                        cropHealth={agriData.cropHealth}
                        weatherData={agriData.weatherData}
                      />
                      <YieldForecasting 
                        cropHealth={agriData.cropHealth}
                        marketData={agriData.marketData}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="crop">
                  <CropMonitoring 
                    cropHealth={agriData.cropHealth}
                    weatherData={agriData.weatherData}
                  />
                </TabsContent>

                <TabsContent value="weather">
                  <WeatherInfo weatherData={agriData.weatherData} />
                </TabsContent>

                <TabsContent value="resources">
                  <ResourceManagement resourceLevels={agriData.resourceLevels} />
                </TabsContent>

                <TabsContent value="risks">
                  <RiskAssessment alerts={alerts} />
                </TabsContent>

                <TabsContent value="yield">
                  <YieldForecasting 
                    cropHealth={agriData.cropHealth}
                    marketData={agriData.marketData}
                  />
                </TabsContent>

                <TabsContent value="market">
                  <MarketIntelligence marketData={agriData.marketData} />
                </TabsContent>

                <TabsContent value="analytics">
                  <AnalyticsPanel 
                    results={stageResults}
                    workflowStages={workflowStages}
                  />
                </TabsContent>
              </div>
            </Tabs>

            {/* Action Center */}
            <Card className="bg-white border border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-800">Quick Actions</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center">
                      <Bell className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-yellow-600">3 Pending Alerts</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Critical Actions Section */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 overflow-y-auto max-h-[500px]">
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center mr-2">
                          <AlertTriangle className="w-3 h-3 text-white" />
                        </div>
                        Critical Actions Required
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">System Health:</span>
                        <div className={`h-2 w-2 rounded-full ${
                          Object.values(agriData?.systemStatus || {}).some(val => 
                            typeof val === 'number' ? val < 50 :
                            typeof val === 'object' && val !== null ? Object.values(val).some(subVal => typeof subVal === 'number' && subVal < 50) : false
                          )
                            ? 'bg-red-500 animate-pulse'
                            : 'bg-emerald-500'
                          }`} />
                      </div>
                    </h4>
                    <div className="space-y-3">
                      {/* Crop Health Alerts */}
                      {agriData.cropHealth.overall < 70 && (
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                          <div>
                            <div className="text-red-800 font-medium">Critical Crop Health</div>
                            <div className="text-sm text-red-600">{agriData.cropHealth.overall.toFixed(1)}% - Immediate action needed</div>
                            <div className="mt-1 text-xs text-red-500">
                              Nutrients: {agriData.cropHealth.nutrientLevels}% | Root: {agriData.cropHealth.rootHealth}%
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => {
                                onStageAction('soil-sense');
                                onStageAction('crop-shield');
                              }}
                              className="bg-red-500 text-white hover:bg-red-600 text-xs"
                            >
                              Full Health Analysis
                            </Button>
                            <Button
                              onClick={() => onStageAction('nutri-dose')}
                              className="bg-red-500/80 text-white hover:bg-red-600 text-xs"
                            >
                              Adjust Nutrients
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* System Critical Alerts */}
                      {agriData?.systemStatus?.iotNetwork < 50 && (
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div>
                            <div className="text-purple-800 font-medium">IoT Network Failure</div>
                            <div className="text-sm text-purple-600">Network Strength: {agriData.systemStatus.iotNetwork}%</div>
                            <div className="mt-1 text-xs text-purple-500">
                              Affected Sensors: Soil, Weather, Irrigation
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                  <Button 
                              onClick={() => {
                                // Assuming diagnostic stages
                                onStageAction('land-mapping');
                                onStageAction('aqua-guide');
                              }}
                              className="bg-purple-500 text-white hover:bg-purple-600 text-xs"
                            >
                              Network Reset
                  </Button>
                          </div>
                        </div>
                      )}

                      {/* Resource Alerts */}
                      {agriData.resourceLevels.water < 50 && (
                        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div>
                            <div className="text-amber-800 font-medium">Low Water Levels</div>
                            <div className="text-sm text-amber-600">{agriData.resourceLevels.water.toFixed(1)}% - Check irrigation</div>
                            <div className="mt-1 text-xs text-amber-500">
                              System Pressure: {agriData.systemStatus.sensors.irrigation}%
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                  <Button 
                              onClick={() => {
                                onStageAction('aqua-guide');
                              }}
                              className="bg-amber-500 text-white hover:bg-amber-600 text-xs"
                            >
                              Water System Check
                  </Button>
                </div>
              </div>
                      )}

                      {/* Storage System Alert */}
                      {agriData?.resourceLevels?.storageCapacity < 30 && (
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div>
                            <div className="text-slate-800 font-medium">Storage System Critical</div>
                            <div className="text-sm text-slate-600">Storage: {agriData.resourceLevels.storageCapacity}% available</div>
                            <div className="mt-1 text-xs text-slate-500">
                              Data Processing: {agriData.systemStatus.dataProcessing}%
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                  <Button 
                              onClick={() => {
                                // Assuming optimization stages
                                onStageAction('harvest-bot');
                              }}
                              className="bg-slate-600 text-white hover:bg-slate-700 text-xs"
                            >
                              Optimize Storage
                  </Button>
                          </div>
                        </div>
                      )}

                      {/* AI System Alert */}
                      {agriData?.systemStatus?.aiModels < 70 && (
                        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                          <div>
                            <div className="text-indigo-800 font-medium">AI System Degradation</div>
                            <div className="text-sm text-indigo-600">Performance: {agriData.systemStatus.aiModels}%</div>
                            <div className="mt-1 text-xs text-indigo-500">
                              Affected: Prediction & Analysis Systems
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                  <Button 
                              onClick={() => {
                                onStageAction('soil-sense');
                              }}
                              className="bg-indigo-500 text-white hover:bg-indigo-600 text-xs"
                            >
                              Recalibrate AI
                  </Button>
                          </div>
                        </div>
                      )}

                      {/* Pest Risk Alert */}
                      {agriData.cropHealth.pestRisk > 30 && (
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div>
                            <div className="text-orange-800 font-medium">High Pest Risk</div>
                            <div className="text-sm text-orange-600">{agriData.cropHealth.pestRisk}% risk detected</div>
                            <div className="mt-1 text-xs text-orange-500">
                              Leaf Health: {agriData.cropHealth.leafDensity}%
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                  <Button 
                              onClick={() => {
                                onStageAction('crop-shield');
                              }}
                              className="bg-orange-500 text-white hover:bg-orange-600 text-xs"
                            >
                              Full Pest Analysis
                  </Button>
                </div>
              </div>
                      )}
                    </div>
                  </div>

                  {/* Manual Step Activation */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                      <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center mr-2">
                        <Play className="w-3 h-3 text-white" />
                      </div>
                      Manual Step Activation
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {workflowStages.map((stage, index) => (
                        <Button
                          key={index}
                          onClick={() => onStageAction(stage.id)}
                          className={`w-full h-auto p-3 ${
                            currentStage === index
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white hover:bg-emerald-50 text-slate-700'
                          } border ${
                            currentStage === index
                              ? 'border-emerald-600'
                              : 'border-slate-200'
                          } rounded-lg transition-all duration-200`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                currentStage === index
                                  ? 'bg-emerald-400'
                                  : 'bg-emerald-100'
                              }`}>
                                <span className="text-xs font-medium">{index + 1}</span>
                              </div>
                              <span className="font-medium text-sm">{stage.name}</span>
                            </div>
                            {currentStage === index && (
                              <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* AgriAIPilot Side Peek Panel */}
      <AgriAIPilotSidePeek
        agentType="agri-saarathi"
        agentName="AgriSaarathi"
        agentNameTelugu="కృషి సారథి"
        services={agriSaarathiServices}
      />
    </div>
  );
};

export default AgriSaarathi;