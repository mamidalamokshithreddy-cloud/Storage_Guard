'use client';

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { ArrowLeft, Plus, Settings, AlertTriangle, CheckCircle, Clock, Zap, Thermometer, Activity, Wrench, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";

interface EquipmentManagementProps {
  onBackToProcessingHub?: () => void;
}

const EquipmentManagement = ({ onBackToProcessingHub }: EquipmentManagementProps = {}) => {
  // const [selectedTab, setSelectedTab] = useState("overview");

  const equipmentList = [
    {
      id: "EQ001",
      name: "Rice Mill Unit 1",
      nameTelugu: "రైస్ మిల్ యూనిట్ 1",
      status: "Operating",
      health: 85,
      utilization: 92,
      efficiency: 89,
      temperature: 65,
      location: "Processing Unit A"
    },
    {
      id: "EQ002", 
      name: "Wheat Grinder Pro",
      nameTelugu: "గోధుమ గ్రైండర్ ప్రో",
      status: "Operating",
      health: 78,
      utilization: 88,
      efficiency: 85,
      temperature: 58,
      location: "Processing Unit B"
    },
    {
      id: "EQ003",
      name: "Packaging Unit Alpha",
      nameTelugu: "ప్యాకేజింగ్ యూనిట్ ఆల్ఫా",
      status: "Maintenance",
      health: 65,
      utilization: 0,
      efficiency: 0,
      temperature: 25,
      location: "Packaging Area"
    }
  ];

  const equipmentKPIs = [
    { metric: "Overall Equipment Effectiveness", value: "89.2%", trend: "+1.5%", status: "good" },
    { metric: "Average Uptime", value: "96.8%", trend: "-1.2%", status: "warning" },
    { metric: "Maintenance Cost Efficiency", value: "₹85,000", trend: "-8.5%", status: "good" },
    { metric: "Energy Consumption", value: "450 kWh/day", trend: "-3.2%", status: "good" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operating': return 'bg-green-100 text-green-800';
      case 'Maintenance': return 'bg-orange-100 text-orange-800';
      case 'Offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="bg-white shadow-soft border rounded-xl p-3 sm:p-4 mb-6">
          <div className="sm:grid sm:grid-cols-[auto,1fr,auto] sm:items-center gap-3 flex flex-col">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button onClick={onBackToProcessingHub} variant="outline" className="flex items-center gap-2 text-sm sm:text-base">
                <ArrowLeft className="w-4 h-4" />
                Back to Processing Hub
              </Button>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary leading-tight sm:justify-self-center flex items-center gap-2">
              ⚙️ Equipment Management | పరికరాల నిర్వహణ
            </h1>
            <div className="flex items-center justify-end gap-2 flex-wrap">
              <Button variant="outline" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Equipment
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                <Settings className="w-4 h-4" />
                System Settings
              </Button>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {/* Equipment KPIs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Equipment Performance KPIs | పరికరాల పనితీరు KPIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {equipmentKPIs.map((kpi, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{kpi.value}</div>
                    <p className="text-sm font-medium">{kpi.metric}</p>
                    <div className="flex justify-center items-center mt-2">
                      <span className={`text-xs font-semibold ${
                        kpi.status === 'good' ? 'text-green-600' : 
                        kpi.status === 'warning' ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {kpi.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Equipment Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment Overview | పరికరాల సమీక్ష</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {equipmentList.map((equipment) => (
                  <div key={equipment.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{equipment.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(equipment.status)}`}>
                            {equipment.status}
                          </span>
                        </div>
                        <p className="text-sm text-blue-600 mb-2">{equipment.nameTelugu}</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Location</p>
                            <p className="font-semibold">{equipment.location}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Temperature</p>
                            <p className="font-semibold flex items-center gap-1">
                              <Thermometer className="w-3 h-3" />
                              {equipment.temperature}°C
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Status</p>
                            <p className={`font-semibold ${equipment.status === 'Operating' ? 'text-green-600' : equipment.status === 'Maintenance' ? 'text-orange-600' : 'text-red-600'}`}>
                              {equipment.status === 'Operating' ? 'Normal' : equipment.status}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mb-2">
                          <p className="text-xs text-gray-600">Health Score</p>
                          <div className="flex items-center gap-2">
                            <Progress value={equipment.health} className="w-20 h-2" />
                            <span className="text-sm font-semibold">{equipment.health}%</span>
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-xs text-gray-600">Utilization</p>
                          <div className="flex items-center gap-2">
                            <Progress value={equipment.utilization} className="w-20 h-2" />
                            <span className="text-sm font-semibold">{equipment.utilization}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Efficiency</p>
                          <div className="flex items-center gap-2">
                            <Progress value={equipment.efficiency} className="w-20 h-2" />
                            <span className="text-sm font-semibold">{equipment.efficiency}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline">
                        <Settings className="w-3 h-3 mr-1" />
                        Configure
                      </Button>
                      <Button size="sm" variant="outline">
                        <Activity className="w-3 h-3 mr-1" />
                        Monitor
                      </Button>
                      <Button size="sm" variant="outline">
                        <Wrench className="w-3 h-3 mr-1" />
                        Maintenance
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Equipment Alerts & Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Alerts & Notifications | హెచ్చరికలు మరియు నోటిఫికేషన్లు
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-semibold text-orange-800">Scheduled Maintenance Due</p>
                    <p className="text-sm text-orange-600">Packaging Unit Alpha requires maintenance in 2 days</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Maintenance Completed</p>
                    <p className="text-sm text-green-600">Rice Mill Unit 1 maintenance completed successfully</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-800">Performance Optimization</p>
                    <p className="text-sm text-blue-600">Wheat Grinder Pro efficiency improved by 3% after calibration</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <AgriAIPilotSidePeek 
        agentType="Equipment Expert"
        agentName="Equipment Management AI"
        agentNameTelugu="ఎక్విప్‌మెంట్ మేనేజ్‌మెంట్ AI"
        services={[
          { title: "Predictive Maintenance", titleTelugu: "ప్రిడిక్టివ్ మెయింటెనెన్స్", description: "AI-powered equipment failure prediction", descriptionTelugu: "AI-ఆధారిత పరికరాల వైఫల్యం అంచనా", duration: "30 min", price: "₹450", icon: Wrench, available: true },
          { title: "Performance Monitoring", titleTelugu: "పనితీరు మానిటరింగ్", description: "Real-time equipment efficiency tracking", descriptionTelugu: "రియల్ టైమ్ పరికరాల సామర్థ్య ట్రాకింగ్", duration: "25 min", price: "₹350", icon: BarChart3, available: true },
          { title: "Energy Optimization", titleTelugu: "శక్తి ఆప్టిమైజేషన్", description: "Reduce energy consumption across equipment", descriptionTelugu: "పరికరాలలో శక్తి వినియోగాన్ని తగ్గించండి", duration: "40 min", price: "₹500", icon: Zap, available: true },
          { title: "Maintenance Scheduling", titleTelugu: "మెయింటెనెన్స్ షెడ్యూలింగ్", description: "Optimize maintenance schedules", descriptionTelugu: "మెయింటెనెన్స్ షెడ్యూల్‌లను ఆప్టిమైజ్ చేయండి", duration: "35 min", price: "₹400", icon: Calendar, available: true }
        ]}
      />
      
      {/* Chat Agent */}
      <AgriChatAgent />
    </div>
  );
};

export default EquipmentManagement;