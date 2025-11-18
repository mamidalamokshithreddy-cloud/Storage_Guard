'use client';

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ArrowLeft, Calendar, Clock, Users, Zap, TrendingUp, BarChart3, Target } from "lucide-react";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import AgriChatAgent from "../AgriChatAgent";
interface ProductionPlanningProps {
  onBackToProcessingHub?: () => void;
}

const ProductionPlanning = ({ onBackToProcessingHub }: ProductionPlanningProps = {}) => {
  const productionSchedule = [
    {
      product: "Basmati Rice",
      productTelugu: "బాస్మతీ బియ్యం",
      plannedQty: "2000 kg",
      actualQty: "1850 kg",
      efficiency: 92.5,
      startTime: "06:00 AM",
      endTime: "02:00 PM",
      operator: "Team A",
      status: "In Progress",
      completion: 75
    },
    {
      product: "Wheat Flour",
      productTelugu: "గోధుమ పిండి",
      plannedQty: "1500 kg",
      actualQty: "1600 kg",
      efficiency: 106.7,
      startTime: "02:00 PM",
      endTime: "10:00 PM",
      operator: "Team B",
      status: "Completed",
      completion: 100
    },
    {
      product: "Yellow Maize",
      productTelugu: "పసుపు మొక్కజొన్న",
      plannedQty: "3000 kg",
      actualQty: "0 kg",
      efficiency: 0,
      startTime: "10:00 PM",
      endTime: "06:00 AM",
      operator: "Team C",
      status: "Scheduled",
      completion: 0
    }
  ];

  const productionKPIs = [
    { metric: "Daily Target Achievement", value: "96.5%", trend: "+2.1%", status: "good" },
    { metric: "Overall Equipment Effectiveness", value: "89.2%", trend: "+1.5%", status: "good" },
    { metric: "Production Efficiency", value: "92.8%", trend: "-0.5%", status: "warning" },
    { metric: "Quality First Pass Rate", value: "94.1%", trend: "+3.2%", status: "good" }
  ];

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
              📊 Production Planning & Scheduling | ఉత్పాదన ప్రణాళిక
            </h1>
          </div>
        </header>

        <div className="space-y-6">
          {/* KPI Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Production KPIs | ఉత్పాదన ముఖ్య సూచికలు
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {productionKPIs.map((kpi, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{kpi.value}</div>
                    <p className="text-sm font-medium">{kpi.metric}</p>
                    <div className="flex justify-center items-center mt-2">
                      <span className={`text-xs font-semibold ${
                        kpi.status === 'good' ? 'text-green-600' : kpi.status === 'warning' ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {kpi.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Production Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Today's Production Schedule | నేటి ఉత్పాదన షెడ్యూల్
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productionSchedule.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{item.product}</h3>
                        <p className="text-sm text-blue-600">{item.productTelugu}</p>
                        <p className="text-sm text-gray-600">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {item.startTime} - {item.endTime} | {item.operator}
                        </p>
                      </div>
                      <Badge variant={
                        item.status === 'Completed' ? 'default' :
                        item.status === 'In Progress' ? 'secondary' : 'outline'
                      }>
                        {item.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-600">Planned Qty</p>
                        <p className="font-semibold">{item.plannedQty}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Actual Qty</p>
                        <p className="font-semibold">{item.actualQty}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Efficiency</p>
                        <p className={`font-semibold ${
                          item.efficiency >= 100 ? 'text-green-600' : 
                          item.efficiency >= 90 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {item.efficiency}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Completion</p>
                        <div className="flex items-center gap-2">
                          <Progress value={item.completion} className="flex-1 h-2" />
                          <span className="text-xs font-semibold">{item.completion}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Simplified Charts Section - Removed Recharts for now to avoid build issues */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Capacity Metrics | సామర్థ్య కొలమానలు
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Current Utilization</span>
                    <span className="font-semibold text-green-600">92%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Peak Hour Efficiency</span>
                    <span className="font-semibold text-blue-600">98%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Equipment Uptime</span>
                    <span className="font-semibold text-green-600">96.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Weekly Trends | వారపు ధోరణులు
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>This Week Target</span>
                    <span className="font-semibold">31,000 kg</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Actual Production</span>
                    <span className="font-semibold text-green-600">30,750 kg</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Weekly Efficiency</span>
                    <span className="font-semibold text-blue-600">99.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <AgriAIPilotSidePeek 
        agentType="Production Expert"
        agentName="Production Planning AI"
        agentNameTelugu="ప్రొడక్షన్ ప్లానింగ్ AI"
        services={[
          { title: "Demand Forecasting", titleTelugu: "డిమాండ్ అంచనా", description: "AI-driven demand prediction for products", descriptionTelugu: "ఉత్పత్తుల కోసం AI-ఆధారిత డిమాండ్ అంచనా", duration: "45 min", price: "₹600", icon: BarChart3, available: true },
          { title: "Capacity Optimization", titleTelugu: "సామర్థ్య ఆప్టిమైజేషన్", description: "Optimize production capacity utilization", descriptionTelugu: "ఉత్పాదన సామర్థ్య వినియోగాన్ని ఆప్టిమైజ్ చేయండి", duration: "40 min", price: "₹550", icon: Target, available: true },
          { title: "Resource Allocation", titleTelugu: "వనరుల కేటాయింపు", description: "Smart allocation of materials and workforce", descriptionTelugu: "పదార్థాలు మరియు కార్యశక్తి యొక్క స్మార్ట్ కేటాయింపు", duration: "35 min", price: "₹500", icon: Users, available: true },
          { title: "Production Scheduling", titleTelugu: "ఉత్పాదన షెడ్యూలింగ్", description: "AI-optimized production schedules", descriptionTelugu: "AI-ఆప్టిమైజ్డ్ ఉత్పాదన షెడ్యూల్స్", duration: "50 min", price: "₹700", icon: Calendar, available: true }
        ]}
      />
      
      {/* Chat Agent */}
      <AgriChatAgent />
    </div>
  );
};

export default ProductionPlanning;