import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ArrowLeft, Map, Navigation, Fuel, Clock, Truck, Zap, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation"; 
import { useState } from "react";
// import AgriAgentsSidebar from "../AgriAgentsSidebar";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RouteOptimizationProps {
  onNavigateBack?: () => void;
}

const RouteOptimization: React.FC<RouteOptimizationProps> = () => {
  const router = useRouter();
  const [selectedRoute, setSelectedRoute] = useState("route1");

  const optimizedRoutes = [
    {
      id: "route1",
      name: "Hyderabad Central Route",
      nameTeugu: "హైదరాబాద్ సెంట్రల్ రూట్",
      deliveries: 12,
      distance: "45 km",
      estimatedTime: "3.2 hours",
      fuelSaving: "18%",
      status: "Optimized"
    },
    {
      id: "route2",
      name: "Warangal District Route",
      nameTeugu: "వరంగల్ జిల్లా రూట్",
      deliveries: 8,
      distance: "62 km",
      estimatedTime: "4.1 hours",
      fuelSaving: "22%",
      status: "In Progress"
    }
  ];

  const routeAnalytics = [
    { zone: "Hyderabad", planned: 45, optimized: 37, saved: 8 },
    { zone: "Warangal", planned: 62, optimized: 48, saved: 14 },
    { zone: "Nizamabad", planned: 38, optimized: 32, saved: 6 },
    { zone: "Khammam", planned: 54, optimized: 43, saved: 11 }
  ];

  const optimizationMetrics = [
    { metric: "Average Route Efficiency", value: 94, trend: "+3%" },
    { metric: "Fuel Cost Reduction", value: 22, trend: "+5%" },
    { metric: "Delivery Time Saved", value: 35, trend: "+8%" },
    { metric: "Customer Satisfaction", value: 96, trend: "+2%" }
  ];

  const aiInsights = [
    {
      insight: "Traffic Pattern Analysis",
      description: "Morning rush hour causes 25% delay on Route A",
      recommendation: "Shift delivery time to 6:30 AM",
      impact: "15 min saved per route"
    },
    {
      insight: "Weather Impact Prediction", 
      description: "Rain forecast for tomorrow affects 3 routes",
      recommendation: "Pre-position vehicles in covered areas",
      impact: "Avoid 2-hour delays"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-white-100">
      {/* <AgriAgentsSidebar /> */}
      
      <div className="ml-0">
        <div className="max-w-full mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/consumer-delivery')} variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Consumer Delivery
              </Button>
              <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                🗺️ Route Optimization | రూట్ ఆప్టిమైజేషన్
              </h1>
            </div>
            <Button className="agri-button-primary flex items-center gap-2">
              <Zap className="w-4 h-4" />
              AI Route Optimizer
            </Button>
          </div>

          <div className="space-y-6">
            {/* Optimization Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Route Optimization Metrics | రూట్ ఆప్టిమైజేషన్ మెట్రిక్స్
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {optimizationMetrics.map((metric, index) => (
                    <div key={index} className="p-4 bg-gradient-field rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">{metric.value}%</div>
                      <p className="text-sm font-medium">{metric.metric}</p>
                      <div className="flex justify-center items-center mt-2">
                        <span className="text-xs font-semibold text-success">
                          {metric.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Route Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  Route Efficiency Analysis | రూట్ సామర్థ్యం విశ్లేషణ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={routeAnalytics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="zone" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="planned" fill="#ef4444" name="Original Route (km)" />
                      <Bar dataKey="optimized" fill="#22c55e" name="Optimized Route (km)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Active Routes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Optimized Routes | ఆప్టిమైజ్ చేసిన రూట్లు
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {optimizedRoutes.map((route) => (
                    <Card 
                      key={route.id}
                      className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                        selectedRoute === route.id ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/30'
                      }`}
                      onClick={() => setSelectedRoute(route.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{route.name}</h3>
                            <p className="text-primary text-sm">{route.nameTeugu}</p>
                          </div>
                          <Badge variant={route.status === 'Optimized' ? 'default' : 'secondary'}>
                            {route.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <Truck className="w-4 h-4 mr-1" />
                              <span className="font-semibold">{route.deliveries}</span>
                            </div>
                            <p className="text-muted-foreground">Deliveries</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <Map className="w-4 h-4 mr-1" />
                              <span className="font-semibold">{route.distance}</span>
                            </div>
                            <p className="text-muted-foreground">Distance</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <Clock className="w-4 h-4 mr-1" />
                              <span className="font-semibold">{route.estimatedTime}</span>
                            </div>
                            <p className="text-muted-foreground">Est. Time</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <Fuel className="w-4 h-4 mr-1" />
                              <span className="font-semibold text-success">{route.fuelSaving}</span>
                            </div>
                            <p className="text-muted-foreground">Fuel Saved</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🤖 AI Route Insights | AI రూట్ అంతర్దృష్టి
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiInsights.map((insight, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{insight.insight}</h3>
                        <p className="text-muted-foreground mb-2">{insight.description}</p>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="font-medium text-blue-800">Recommendation: {insight.recommendation}</p>
                          <p className="text-sm text-blue-600">Impact: {insight.impact}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Right Sidebar */}
      <AgriAIPilotSidePeek 
        agentType="Route Expert"
        agentName="Route AI Assistant"
        agentNameTelugu="రూట్ AI సహాయకుడు"
      />
      
      {/* Chat Agent */}
      <AgriChatAgent />
    </div>
  );
};

export default RouteOptimization;