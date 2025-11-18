import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ArrowLeft, Users, TrendingUp, Eye, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";  // Replace react-router-dom with Next.js navigation
import { useState } from "react";
// import AgriAgentsSidebar from "../AgriAgentsSidebar";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

interface CustomerAnalyticsProps {
  _onNavigateBack?: () => void;
}

const CustomerAnalytics = ({ _onNavigateBack }: CustomerAnalyticsProps) => {
  const router = useRouter();  // Replace useNavigate with useRouter
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const customerSegments = [
    {
      segment: "Health Enthusiasts",
      segmentTelugu: "ఆరోగ్య ప్రియులు",
      size: 2150,
      growth: "+15%",
      avgOrder: "₹850",
      frequency: "Weekly",
      preferences: ["Organic produce", "Superfoods", "Seasonal fruits"],
      satisfaction: 4.8
    },
    {
      segment: "Busy Professionals",
      segmentTelugu: "బిజీ ప్రొఫెషనల్స్",
      size: 1890,
      growth: "+22%",
      avgOrder: "₹650",
      frequency: "Bi-weekly",
      preferences: ["Ready-to-cook", "Convenience packs", "Express delivery"],
      satisfaction: 4.6
    },
    {
      segment: "Family Households",
      segmentTelugu: "కుటుంబ గృహాలు",
      size: 3420,
      growth: "+8%",
      avgOrder: "₹1200",
      frequency: "Weekly",
      preferences: ["Bulk orders", "Mixed vegetables", "Rice & grains"],
      satisfaction: 4.7
    }
  ];

  const behaviorData = [
    { month: 'Jan', orders: 1200, revenue: 145000, newCustomers: 120 },
    { month: 'Feb', orders: 1350, revenue: 162000, newCustomers: 135 },
    { month: 'Mar', orders: 1480, revenue: 178000, newCustomers: 158 },
    { month: 'Apr', orders: 1620, revenue: 195000, newCustomers: 142 },
    { month: 'May', orders: 1750, revenue: 210000, newCustomers: 167 },
    { month: 'Jun', orders: 1890, revenue: 227000, newCustomers: 189 }
  ];

  const purchasePatterns = [
    { name: 'Vegetables', value: 35, color: '#22c55e' },
    { name: 'Fruits', value: 28, color: '#f97316' },
    { name: 'Grains', value: 22, color: '#eab308' },
    { name: 'Dairy', value: 10, color: '#3b82f6' },
    { name: 'Others', value: 5, color: '#8b5cf6' }
  ];

  const customerLifecycle = [
    { stage: "New Customers", count: 456, percentage: 18, trend: "+12%" },
    { stage: "Active Customers", count: 1890, percentage: 75, trend: "+8%" },
    { stage: "At Risk", count: 123, percentage: 5, trend: "-15%" },
    { stage: "Churned", count: 45, percentage: 2, trend: "-25%" }
  ];

  const topProducts = [
    { product: "Organic Tomatoes", productTelugu: "సేంద్రీయ టమాటాలు", sales: 1250, revenue: "₹31,250", growth: "+18%" },
    { product: "Fresh Spinach", productTelugu: "తాజా పాలకూర", sales: 980, revenue: "₹19,600", growth: "+15%" },
    { product: "Basmati Rice", productTelugu: "బాస్మతీ బియ్యం", sales: 850, revenue: "₹85,000", growth: "+22%" },
    { product: "Mixed Vegetables", productTelugu: "మిశ్రమ కూరగాయలు", sales: 780, revenue: "₹39,000", growth: "+12%" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-white-100">
      {/* <AgriAgentsSidebar /> */}
      
      <div className="ml-0">
        <div className="max-w-full mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => router.push('/farmer/consumer-feedback')}  // Update navigation
                variant="outline" 
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Consumer Feedback
              </Button>
              <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                📈 Customer Analytics | కస్టమర్ అనలిటిక్స్
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("week")}
              >
                Week
              </Button>
              <Button
                variant={selectedPeriod === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("month")}
              >
                Month
              </Button>
              <Button
                variant={selectedPeriod === "year" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("year")}
              >
                Year
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Customer Lifecycle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Customer Lifecycle Analysis | కస్టమర్ లైఫ్‌సైకిల్ విశ్లేషణ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {customerLifecycle.map((stage, index) => (
                    <div key={index} className="p-4 bg-gradient-field rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">{stage.count}</div>
                      <p className="text-sm font-medium">{stage.stage}</p>
                      <div className="flex justify-center items-center mt-2">
                        <Progress value={stage.percentage} className="w-16 h-2 mr-2" />
                        <span className={`text-xs font-semibold ${
                          stage.trend.startsWith('+') ? 'text-success' : 'text-destructive'
                        }`}>
                          {stage.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Purchase Behavior Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Purchase Behavior Trends | కొనుగోలు ప్రవర్తన ట్రెండ్స్
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Monthly Performance</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={behaviorData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="orders" stroke="#22c55e" strokeWidth={3} name="Orders" />
                          <Line type="monotone" dataKey="newCustomers" stroke="#3b82f6" strokeWidth={3} name="New Customers" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Purchase Categories</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={purchasePatterns}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {purchasePatterns.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {purchasePatterns.map((pattern, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: pattern.color }} />
                          <span>{pattern.name} ({pattern.value}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Segments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Customer Segments | కస్టమర్ విభాగాలు
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerSegments.map((segment, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{segment.segment}</h3>
                            <p className="text-primary text-sm">{segment.segmentTelugu}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="default" className="bg-green-500">
                              {segment.growth} Growth
                            </Badge>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-yellow-400">★</span>
                              <span className="text-sm font-medium">{segment.satisfaction}</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mb-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">{segment.size.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Customers</p>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">{segment.avgOrder}</div>
                            <p className="text-xs text-muted-foreground">Avg Order</p>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">{segment.frequency}</div>
                            <p className="text-xs text-muted-foreground">Frequency</p>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">{segment.satisfaction}★</div>
                            <p className="text-xs text-muted-foreground">Satisfaction</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1">Preferences:</p>
                          <div className="flex flex-wrap gap-1">
                            {segment.preferences.map((pref, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {pref}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Top Performing Products | అధిక అమ్మకాల ఉత్పత్తులు
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow">
                      <div>
                        <h3 className="font-semibold">{product.product}</h3>
                        <p className="text-primary text-sm">{product.productTelugu}</p>
                      </div>
                      <div className="text-right">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="font-medium">{product.sales}</p>
                            <p className="text-xs text-muted-foreground">Units Sold</p>
                          </div>
                          <div>
                            <p className="font-medium">{product.revenue}</p>
                            <p className="text-xs text-muted-foreground">Revenue</p>
                          </div>
                          <div>
                            <Badge variant="default" className="bg-green-500">{product.growth}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Right Sidebar */}
      <AgriAIPilotSidePeek 
        agentType="Analytics Expert"
        agentName="Analytics AI Assistant"
        agentNameTelugu="అనలిటిక్స్ AI సహాయకుడు"
      />
      
      {/* Chat Agent */}
      <AgriChatAgent />
    </div>
  );
};

export default CustomerAnalytics;