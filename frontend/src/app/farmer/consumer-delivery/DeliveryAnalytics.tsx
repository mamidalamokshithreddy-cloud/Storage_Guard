import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ArrowLeft, BarChart3, TrendingUp, Clock, DollarSign, Star, Target, Activity } from "lucide-react";
import { useRouter } from "next/navigation"; 
import { useState } from "react";
// import AgriAgentsSidebar from "../AgriAgentsSidebar";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DeliveryAnalyticsProps {
  onNavigateBack?: () => void;
}

const DeliveryAnalytics: React.FC<DeliveryAnalyticsProps> = () => {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  const deliveryKPIs = [
    { 
      metric: "On-Time Delivery Rate", 
      metricTelugu: "సమయానికి డెలివరీ రేటు", 
      value: 94.5, 
      target: 95, 
      trend: "+2.1%", 
      status: "warning",
      icon: <Clock className="w-5 h-5" />
    },
    { 
      metric: "Average Delivery Time", 
      metricTelugu: "సగటు డెలివరీ సమయం", 
      value: 2.3, 
      target: 2.0, 
      trend: "-0.2 hrs", 
      status: "good",
      icon: <TrendingUp className="w-5 h-5" />
    },
    { 
      metric: "Customer Satisfaction", 
      metricTelugu: "కస్టమర్ సంతృప్తి", 
      value: 4.7, 
      target: 4.8, 
      trend: "+0.1", 
      status: "good",
      icon: <Star className="w-5 h-5" />
    },
    { 
      metric: "Delivery Cost per Order", 
      metricTelugu: "ప్రతి ఆర్డర్ డెలివరీ వ్యయం", 
      value: 45, 
      target: 40, 
      trend: "-₹3", 
      status: "warning",
      icon: <DollarSign className="w-5 h-5" />
    }
  ];

  const performanceData = [
    { day: 'Mon', onTime: 92, delayed: 8, cancelled: 0 },
    { day: 'Tue', onTime: 95, delayed: 4, cancelled: 1 },
    { day: 'Wed', onTime: 89, delayed: 10, cancelled: 1 },
    { day: 'Thu', onTime: 97, delayed: 3, cancelled: 0 },
    { day: 'Fri', onTime: 94, delayed: 5, cancelled: 1 },
    { day: 'Sat', onTime: 98, delayed: 2, cancelled: 0 },
    { day: 'Sun', onTime: 96, delayed: 3, cancelled: 1 }
  ];

  const costAnalysis = [
    { month: 'Jan', fuel: 12000, maintenance: 8000, salaries: 25000, insurance: 3000 },
    { month: 'Feb', fuel: 13500, maintenance: 7500, salaries: 25000, insurance: 3000 },
    { month: 'Mar', fuel: 11800, maintenance: 9200, salaries: 26000, insurance: 3000 },
    { month: 'Apr', fuel: 14200, maintenance: 6800, salaries: 26000, insurance: 3000 },
    { month: 'May', fuel: 13900, maintenance: 7200, salaries: 27000, insurance: 3000 },
    { month: 'Jun', fuel: 12600, maintenance: 8800, salaries: 27000, insurance: 3000 }
  ];

  const zonePerformance = [
    { 
      zone: "Hyderabad Central", 
      zoneTelugu: "హైదరాబాద్ సెంట్రల్",
      deliveries: 1250,
      onTimeRate: 96,
      avgTime: 2.1,
      cost: 42,
      rating: 4.8,
      issues: 12
    },
    { 
      zone: "Warangal District", 
      zoneTelugu: "వరంగల్ జిల్లా",
      deliveries: 850,
      onTimeRate: 92,
      avgTime: 2.8,
      cost: 48,
      rating: 4.6,
      issues: 18
    },
    { 
      zone: "Nizamabad Region", 
      zoneTelugu: "నిజామాబాద్ ప్రాంతం",
      deliveries: 680,
      onTimeRate: 94,
      avgTime: 2.5,
      cost: 45,
      rating: 4.7,
      issues: 8
    },
    { 
      zone: "Khammam Area", 
      zoneTelugu: "ఖమ్మం ప్రాంతం",
      deliveries: 420,
      onTimeRate: 89,
      avgTime: 3.2,
      cost: 52,
      rating: 4.4,
      issues: 15
    }
  ];

  const vehicleUtilization = [
    { name: 'Refrigerated Vans', value: 85, color: '#3b82f6' },
    { name: 'Electric Bikes', value: 92, color: '#10b981' },
    { name: 'Cargo Trucks', value: 78, color: '#f59e0b' },
    { name: 'Cold Chain Units', value: 88, color: '#8b5cf6' }
  ];

  // const customerFeedbackTrends = [
  //   { week: 'Week 1', satisfaction: 4.5, complaints: 8, compliments: 45 },
  //   { week: 'Week 2', satisfaction: 4.6, complaints: 6, compliments: 52 },
  //   { week: 'Week 3', satisfaction: 4.4, complaints: 12, compliments: 38 },
  //   { week: 'Week 4', satisfaction: 4.7, complaints: 4, compliments: 58 }
  // ];

  const predictiveInsights = [
    {
      insight: "Peak Demand Forecast",
      insightTelugu: "పీక్ డిమాండ్ అంచనా",
      prediction: "35% increase expected during festival season",
      action: "Scale up fleet by 20 vehicles",
      impact: "Prevent 150+ delivery delays",
      timeline: "Next 2 weeks"
    },
    {
      insight: "Route Optimization Opportunity",
      insightTelugu: "రూట్ ఆప్టిమైజేషన్ అవకాశం",
      prediction: "15% fuel savings possible in Warangal zone",
      action: "Implement AI route planning",
      impact: "Save ₹25,000/month",
      timeline: "Next month"
    },
    {
      insight: "Vehicle Maintenance Alert",
      insightTelugu: "వాహన నిర్వహణ హెచ్చరిక",
      prediction: "3 vehicles due for service",
      action: "Schedule preventive maintenance",
      impact: "Avoid breakdown delays",
      timeline: "This week"
    }
  ];

  // const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-white-100">
      {/* <AgriAgentsSidebar />
       */}
      <div className="ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between max-w-full mx-auto">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/consumer-delivery')} variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Consumer Delivery
              </Button>
              <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Delivery Analytics | డెలివరీ అనలిటిక్స్
              </h1>
            </div>
            <div className="flex gap-2">
              {['day', 'week', 'month'].map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  onClick={() => setSelectedPeriod(period)}
                  size="sm"
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </header>

        <div className="max-w-full mx-auto p-6 space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-4 gap-6">
            {deliveryKPIs.map((kpi, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${
                      kpi.status === 'good' ? 'bg-green-100 text-green-600' : 
                      kpi.status === 'warning' ? 'bg-yellow-100 text-yellow-600' : 
                      'bg-red-100 text-red-600'
                    }`}>
                      {kpi.icon}
                    </div>
                    <Badge variant={kpi.status === 'good' ? 'default' : 'secondary'}>
                      {kpi.trend}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">{kpi.metric}</h3>
                    <p className="text-xs text-primary">{kpi.metricTelugu}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {kpi.metric.includes('Time') ? `${kpi.value} hrs` : 
                         kpi.metric.includes('Cost') ? `₹${kpi.value}` :
                         kpi.metric.includes('Satisfaction') ? kpi.value : `${kpi.value}%`}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {kpi.metric.includes('Time') ? `${kpi.target} hrs` : 
                           kpi.metric.includes('Cost') ? `₹${kpi.target}` :
                           kpi.metric.includes('Satisfaction') ? kpi.target : `${kpi.target}%`}
                      </span>
                    </div>
                    <Progress 
                      value={(kpi.value / kpi.target) * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Weekly Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Delivery Performance | వారంలోని డెలివరీ పనితీరు</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="onTime" stackId="a" fill="#10b981" name="On Time" />
                      <Bar dataKey="delayed" stackId="a" fill="#f59e0b" name="Delayed" />
                      <Bar dataKey="cancelled" stackId="a" fill="#ef4444" name="Cancelled" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Utilization | వాహన వినియోగం</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vehicleUtilization}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {vehicleUtilization.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Zone Performance Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Zone Performance Analysis | జోన్ పనితీరు విశ్లేషణ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Zone | జోన్</th>
                      <th className="text-center p-3">Deliveries | డెలివరీలు</th>
                      <th className="text-center p-3">On-Time Rate | సమయానికి రేటు</th>
                      <th className="text-center p-3">Avg Time | సగటు సమయం</th>
                      <th className="text-center p-3">Cost/Order | వ్యయం/ఆర్డర్</th>
                      <th className="text-center p-3">Rating | రేటింగ్</th>
                      <th className="text-center p-3">Issues | సమస్యలు</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zonePerformance.map((zone, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-semibold">{zone.zone}</div>
                            <div className="text-sm text-primary">{zone.zoneTelugu}</div>
                          </div>
                        </td>
                        <td className="text-center p-3 font-semibold">{zone.deliveries}</td>
                        <td className="text-center p-3">
                          <Badge variant={zone.onTimeRate >= 95 ? "default" : "secondary"}>
                            {zone.onTimeRate}%
                          </Badge>
                        </td>
                        <td className="text-center p-3">{zone.avgTime} hrs</td>
                        <td className="text-center p-3">₹{zone.cost}</td>
                        <td className="text-center p-3">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span>{zone.rating}</span>
                          </div>
                        </td>
                        <td className="text-center p-3">
                          <Badge variant={zone.issues <= 10 ? "default" : "destructive"}>
                            {zone.issues}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Cost Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Cost Analysis | మాసిక వ్యయ విశ్లేషణ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="fuel" stackId="a" fill="#3b82f6" name="Fuel" />
                    <Bar dataKey="maintenance" stackId="a" fill="#10b981" name="Maintenance" />
                    <Bar dataKey="salaries" stackId="a" fill="#f59e0b" name="Salaries" />
                    <Bar dataKey="insurance" stackId="a" fill="#8b5cf6" name="Insurance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Predictive Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                AI Predictive Insights | AI అంచనా అంతర్దృష్టులు
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveInsights.map((insight, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-4 gap-4 items-center">
                        <div>
                          <h3 className="font-semibold text-lg">{insight.insight}</h3>
                          <p className="text-sm text-primary">{insight.insightTelugu}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Prediction:</p>
                          <p className="font-medium">{insight.prediction}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Action:</p>
                          <p className="font-medium text-green-600">{insight.action}</p>
                          <p className="text-xs text-muted-foreground mt-1">Impact: {insight.impact}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{insight.timeline}</Badge>
                          <Button size="sm" className="ml-2 agri-button-primary">
                            Act Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <AgriAIPilotSidePeek 
        agentType="Analytics Expert"
        agentName="Delivery Analytics AI"
        agentNameTelugu="డెలివరీ అనలిటిక్స్ AI"
        services={[
          { title: "Performance Analytics", titleTelugu: "పనితీరు అనలిటిక్స్", description: "Comprehensive delivery performance analysis", descriptionTelugu: "సమగ్ర డెలివరీ పనితీరు విశ్లేషణ", duration: "45 min", price: "₹700", icon: BarChart3, available: true },
          { title: "Cost Analysis", titleTelugu: "వ్యయ విశ్లేషణ", description: "Detailed cost breakdown and optimization", descriptionTelugu: "వివరణాత్మక వ్యయ విభజన మరియు ఆప్టిమైజేషన్", duration: "40 min", price: "₹600", icon: TrendingUp, available: true },
          { title: "Predictive Insights", titleTelugu: "ప్రిడిక్టివ్ ఇన్‌సైట్‌లు", description: "AI-powered future trend predictions", descriptionTelugu: "AI-ఆధారిత భవిష్యత్ ట్రెండ్ అంచనాలు", duration: "50 min", price: "₹800", icon: Activity, available: true },
          { title: "Customer Satisfaction Analysis", titleTelugu: "కస్టమర్ సంతృప్తి విశ్లేషణ", description: "Analyze customer feedback and satisfaction", descriptionTelugu: "కస్టమర్ ఫీడ్‌బ్యాక్ మరియు సంతృప్తిని విశ్లేషించండి", duration: "35 min", price: "₹500", icon: Star, available: true }
        ]}
      />
      <AgriChatAgent />
    </div>
  );
};

export default DeliveryAnalytics;