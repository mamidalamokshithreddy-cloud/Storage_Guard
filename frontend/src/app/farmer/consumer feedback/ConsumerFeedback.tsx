'use client';

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Star, TrendingUp, Heart, MessageSquare, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import AgentVideoSection from "../AgentVideoSection";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ConsumerFeedbackProps {
  onCustomerAnalyticsClick?: () => void;
  onReviewManagementClick?: () => void;
  onLoyaltyProgramsClick?: () => void;
  onMarketResearchClick?: () => void;
}

const ConsumerFeedback = ({ 
  onCustomerAnalyticsClick,
  onReviewManagementClick,
  onLoyaltyProgramsClick,
  onMarketResearchClick
}: ConsumerFeedbackProps) => {
  const router = useRouter();
  const [selectedModule, setSelectedModule] = useState<string>("market");

  const recentFeedback = [
    {
      id: "FB001",
      customer: "Priya Sharma",
      location: "Hyderabad",
      rating: 5,
      comment: "Fresh tomatoes, excellent quality! వాటి రుచి చాలా బాగుంది।",
      product: "Organic Tomatoes",
      date: "Dec 20, 2024"
    },
    {
      id: "FB002",
      customer: "Rajesh Kumar", 
      location: "Warangal",
      rating: 4,
      comment: "Good packaging, delivered on time. Keep it up!",
      product: "Mixed Vegetables",
      date: "Dec 19, 2024"
    },
    {
      id: "FB003",
      customer: "Anitha Reddy",
      location: "Nizamabad",
      rating: 5,
      comment: "Love the farm-fresh taste! బాగా తాజాగా ఉంది।",
      product: "Green Leafy Vegetables",
      date: "Dec 18, 2024"
    }
  ];

  const trustMetrics = {
    overallRating: 4.7,
    totalReviews: 1248,
    qualityScore: 94,
    deliveryScore: 91,
    freshnessScore: 96,
    packagingScore: 89
  };

  const demandTrends = [
    { month: 'Jan', tomatoes: 450, leafyVegs: 320, carrots: 280 },
    { month: 'Feb', tomatoes: 520, leafyVegs: 380, carrots: 310 },
    { month: 'Mar', tomatoes: 480, leafyVegs: 420, carrots: 340 },
    { month: 'Apr', tomatoes: 600, leafyVegs: 480, carrots: 380 },
    { month: 'May', tomatoes: 580, leafyVegs: 520, carrots: 420 },
    { month: 'Jun', tomatoes: 650, leafyVegs: 580, carrots: 460 },
  ];

  // const customerSegments = [
  //   { segment: "Health Enthusiasts", segmentTelugu: "ఆరోగ్య ప్రియులు", size: 2150, growth: "+15%", avgOrder: "₹850", preference: "Organic & Superfoods" },
  //   { segment: "Busy Professionals", segmentTelugu: "బిజీ ప్రొఫెషనల్స్", size: 1890, growth: "+22%", avgOrder: "₹650", preference: "Ready-to-cook & Convenience" },
  //   { segment: "Family Households", segmentTelugu: "కుటుంబ గృహాలు", size: 3420, growth: "+8%", avgOrder: "₹1200", preference: "Value packs & Variety" },
  //   { segment: "Senior Citizens", segmentTelugu: "వృద్ధులు", size: 890, growth: "+12%", avgOrder: "₹450", preference: "Traditional & Soft varieties" },
  //   { segment: "Young Couples", segmentTelugu: "యువ జంటలు", size: 1560, growth: "+28%", avgOrder: "₹520", preference: "Premium & Exotic produce" }
  // ]; // Commented - not used yet

  // const sentimentAnalysis = {
  //   overall: 4.7,
  //   positive: 78,
  //   neutral: 16, 
  //   negative: 6,
  //   trending: [
  //     { aspect: "Freshness", sentiment: 92, change: "+5%" },
  //     { aspect: "Packaging", sentiment: 87, change: "+3%" },
  //     { aspect: "Delivery Speed", sentiment: 89, change: "+2%" },
  //     { aspect: "Price Value", sentiment: 81, change: "-1%" },
  //     { aspect: "Customer Service", sentiment: 94, change: "+7%" }
  //   ]
  // }; // Commented - not used yet

  // const marketInsights = [
  //   {
  //     insight: "Organic Demand Surge",
  //     insightTelugu: "సేంద్రిక డిమాండ్ పెరుగుదల",
  //     impact: "High",
  //     description: "35% increase in organic produce demand among urban customers",
  //     action: "Expand organic product line",
  //     timeline: "Next 2 months"
  //   },
  //   {
  //     insight: "Premium Packaging Preference", 
  //     insightTelugu: "ప్రీమియం ప్యాకేజింగ్ ప్రాధాన్యత",
  //     impact: "Medium",
  //     description: "Customers willing to pay 15% more for premium packaging",
  //     action: "Introduce premium packaging options",
  //     timeline: "Next month"
  //   },
  //   {
  //     insight: "Subscription Model Growth",
  //     insightTelugu: "సబ్స్క్రిప్షన్ మోడల్ వృద్ధి",
  //     impact: "High", 
  //     description: "40% of customers prefer subscription over one-time orders",
  //     action: "Enhance subscription features",
  //     timeline: "Immediate"
  //   }
  // ]; // Commented - not used yet

  // const loyaltyProgram = {
  //   totalMembers: 8450,
  //   activeMembers: 6720,
  //   tiers: [
  //     { tier: "Green Starter", tierTelugu: "గ్రీన్ స్టార్టర్", members: 3200, benefits: "5% cashback, Free delivery above ₹300", minSpend: "₹0" },
  //     { tier: "Fresh Lover", tierTelugu: "ఫ్రెష్ లవర్", members: 2800, benefits: "8% cashback, Priority support", minSpend: "₹2000/month" },
  //     { tier: "Organic Champion", tierTelugu: "ఆర్గానిక్ చాంపియన్", members: 1950, benefits: "12% cashback, Exclusive products", minSpend: "₹5000/month" },
  //     { tier: "Farm Friend VIP", tierTelugu: "ఫార్మ్ ఫ్రెండ్ VIP", members: 500, benefits: "15% cashback, Farm visits", minSpend: "₹10000/month" }
  //   ],
  //   rewardsDistributed: "₹2,45,000",
  //   avgRedemptionRate: 67
  // }; // Commented - not used yet

  // const competitiveAnalysis = [
  //   { competitor: "BigBasket", marketShare: 28, strengths: "Wide variety, Quick delivery", weaknesses: "Higher prices", ourAdvantage: "Farm-fresh direct sourcing" },
  //   { competitor: "Grofers/Blinkit", marketShare: 22, strengths: "Ultra-fast delivery", weaknesses: "Limited fresh produce", ourAdvantage: "Specialized in fresh produce" },
  //   { competitor: "Amazon Fresh", marketShare: 18, strengths: "Brand trust, Prime benefits", weaknesses: "Generic sourcing", ourAdvantage: "Farmer partnership & traceability" },
  //   { competitor: "Local Vendors", marketShare: 32, strengths: "Personal relationships", weaknesses: "Inconsistent quality", ourAdvantage: "Quality + Technology + Trust" }
  // ]; // Commented - not used yet

  // const trendPredictions = [
  //   {
  //     trend: "Voice Commerce Growth", 
  //     trendTelugu: "వాయిస్ కామర్స్ వృద్ధి",
  //     probability: 85,
  //     timeline: "6 months",
  //     impact: "Medium",
  //     action: "Develop voice ordering system"
  //   },
  //   {
  //     trend: "Sustainable Packaging Demand",
  //     trendTelugu: "స్థిరమైన ప్యాకేజింగ్ డిమాండ్",
  //     probability: 92,
  //     timeline: "3 months", 
  //     impact: "High",
  //     action: "100% eco-friendly packaging"
  //   },
  //   {
  //     trend: "Hyperlocal Micro-Farms",
  //     trendTelugu: "హైపర్‌లోకల్ మైక్రో-ఫార్మ్స్",
  //     probability: 78,
  //     timeline: "12 months",
  //     impact: "High", 
  //     action: "Partner with urban farms"
  //   }
  // ]; // Commented - not used yet

  const aiRecommendations = [
    {
      crop: "Cherry Tomatoes",
      cropTeugu: "చెర్రీ టమోటాలు",
      demand: "High",
      reason: "85% customer preference for smaller varieties",
      profitIncrease: "+35%"
    },
    {
      crop: "Organic Spinach",
      cropTeugu: "సేంద్రిక పాలకూర",
      demand: "Growing",
      reason: "Health-conscious consumers increasing",
      profitIncrease: "+28%"
    },
    {
      crop: "Baby Carrots",
      cropTeugu: "బేబీ కారెట్లు",
      demand: "Emerging",
      reason: "Premium packaging commands higher price",
      profitIncrease: "+42%"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-white-100">
      
      
      <div className="ml-0">{/* Content area with sidebar spacing */}
        {/* Header
        <header className="sticky top-0 z-50 bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between max-w-full mx-auto">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/consumer-delivery')} variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Delivery
              </Button>
              <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                💝 Consumer Feedback & Loyalty | వినియోగదారు ప్రతిస్పందన
              </h1>
            </div>
            <div className="flex gap-2" />
          </div>
        </header> */}

        {/* Hero Section */}
        <div className="relative h-64 overflow-hidden">
          <img 
            src="/happy-family-fresh-food.jpg" 
            alt="Happy family receiving fresh food at home"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-2">Happy Families, Fresh Food</h2>
              <p className="text-xl">Building trust through quality and transparency</p>
            </div>
          </div>
        </div>

        <div className="max-w-full mx-auto p-6">
          {/* Main Content */}
          <div className="grid grid-cols-8 gap-6">
            <div className="col-span-9 space-y-6">
              {/* Consumer Feedback Navigation */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Review Management Card */}
                <Card 
                  className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 ${selectedModule === "review" ? 'ring-2 ring-primary border-primary' : 'hover:border-primary'}`}
                  onClick={() => {
                    setSelectedModule("review");
                    if (onReviewManagementClick) {
                      onReviewManagementClick();
                    } else {
                      router.push("/consumer-feedback/review-management");
                    }
                  }}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">⭐</div>
                    <h3 className="font-semibold text-lg mb-1">Review Management</h3>
                    <p className="text-primary font-medium text-sm mb-2">రివ్యూ మేనేజ్‌మెంట్</p>
                    <p className="text-xs text-muted-foreground">Customer review analysis & response</p>
                    <Button size="sm" className="w-full mt-3 agri-button-primary">
                      Open Module
                    </Button>
                  </CardContent>
                </Card>

                {/* Customer Analytics Card */}
                <Card 
                  className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 ${selectedModule === "analytics" ? 'ring-2 ring-primary border-primary' : 'hover:border-primary'}`}
                  onClick={() => {
                    setSelectedModule("analytics");
                    if (onCustomerAnalyticsClick) {
                      onCustomerAnalyticsClick();
                    } else {
                      router.push("/consumer-feedback/customer-analytics");
                    }
                  }}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">📈</div>
                    <h3 className="font-semibold text-lg mb-1">Customer Analytics</h3>
                    <p className="text-primary font-medium text-sm mb-2">కస్టమర్ అనలిటిక్స్</p>
                    <p className="text-xs text-muted-foreground">Behavior analysis & insights</p>
                    <Button size="sm" className="w-full mt-3 agri-button-primary">
                      Open Module
                    </Button>
                  </CardContent>
                </Card>

                {/* Loyalty Programs Card */}
                <Card 
                  className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 ${selectedModule === "loyalty" ? 'ring-2 ring-primary border-primary' : 'hover:border-primary'}`}
                  onClick={() => {
                    setSelectedModule("loyalty");
                    if (onLoyaltyProgramsClick) {
                      onLoyaltyProgramsClick();
                    } else {
                      router.push("/consumer-feedback/loyalty-programs");
                    }
                  }}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">💎</div>
                    <h3 className="font-semibold text-lg mb-1">Loyalty Programs</h3>
                    <p className="text-primary font-medium text-sm mb-2">లాయల్టీ ప్రోగ్రామ్స్</p>
                    <p className="text-xs text-muted-foreground">Reward programs & tiers</p>
                    <Button size="sm" className="w-full mt-3 agri-button-primary">
                      Open Module
                    </Button>
                  </CardContent>
                </Card>

                {/* Market Research Card */}
                <Card 
                  className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 ${selectedModule === "market" ? 'ring-2 ring-primary border-primary' : 'hover:border-primary'}`}
                  onClick={() => {
                    setSelectedModule("market");
                    if (onMarketResearchClick) {
                      onMarketResearchClick();
                    } else {
                      router.push("/consumer-feedback/market-research");
                    }
                  }}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">🔍</div>
                    <h3 className="font-semibold text-lg mb-1">Market Research</h3>
                    <p className="text-primary font-medium text-sm mb-2">మార్కెట్ రిసెర్చ్</p>
                    <p className="text-xs text-muted-foreground">Trend analysis & recommendations</p>
                    <Button size="sm" className="w-full mt-3 agri-button-primary">
                      Open Module
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Trust Index Dashboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Consumer Trust Index | వినియోగదారు నమ్మకం సూచిక
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-primary mb-2">{trustMetrics.overallRating}</div>
                      <div className="flex justify-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-6 h-6 ${i < Math.floor(trustMetrics.overallRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <p className="text-lg font-semibold">Overall Rating</p>
                      <p className="text-muted-foreground">{trustMetrics.totalReviews} reviews</p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: "Quality Score", labelTeugu: "నాణ్యత స్కోర్", score: trustMetrics.qualityScore },
                        { label: "Delivery Score", labelTeugu: "డెలివరీ స్కోర్", score: trustMetrics.deliveryScore },
                        { label: "Freshness Score", labelTeugu: "తాజా స్కోర్", score: trustMetrics.freshnessScore },
                        { label: "Packaging Score", labelTeugu: "ప్యాకేజింగ్ స్కోర్", score: trustMetrics.packagingScore },
                      ].map((metric, index) => (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{metric.label}</span>
                            <span className="text-sm text-primary">{metric.labelTeugu}</span>
                            <span className="text-sm font-semibold">{metric.score}%</span>
                          </div>
                          <Progress value={metric.score} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Customer Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Recent Customer Reviews | ఇటీవలి వినియోగదారు సమీక్షలు
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentFeedback.map((feedback) => (
                      <Card key={feedback.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{feedback.customer}</h3>
                              <p className="text-sm text-muted-foreground">{feedback.location} • {feedback.date}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 mb-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-4 h-4 ${i < feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                              <Badge variant="outline">{feedback.product}</Badge>
                            </div>
                          </div>
                          <p className="text-muted-foreground italic">"{feedback.comment}"</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Demand Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Consumer Demand Trends | వినియోగదారు డిమాండ్ ట్రెండ్స్
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={demandTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="tomatoes" stroke="#ef4444" strokeWidth={3} name="Tomatoes" />
                        <Line type="monotone" dataKey="leafyVegs" stroke="#22c55e" strokeWidth={3} name="Leafy Vegetables" />
                        <Line type="monotone" dataKey="carrots" stroke="#f97316" strokeWidth={3} name="Carrots" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* AI Crop Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🤖 AI Crop Planning Recommendations | AI పంట ప్రణాళిక సిఫార్సులు
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {aiRecommendations.map((rec, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{rec.crop}</h3>
                              <p className="text-primary font-medium text-sm">{rec.cropTeugu}</p>
                              <p className="text-muted-foreground text-sm mt-1">{rec.reason}</p>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={rec.demand === 'High' ? 'default' : 'secondary'}
                                className={rec.demand === 'High' ? 'bg-green-500' : rec.demand === 'Growing' ? 'bg-yellow-500' : 'bg-blue-500'}
                              >
                                {rec.demand} Demand
                              </Badge>
                              <p className="text-lg font-bold text-green-600 mt-2">{rec.profitIncrease}</p>
                              <p className="text-xs text-muted-foreground">Profit Increase</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Video Section */}
              <AgentVideoSection
                agentName="AgriPulse"
                agentNameTelugu="అగ్రిపల్స్"
                videos={[
                  {
                    title: "Consumer Feedback Dashboard",
                    titleTelugu: "వినియోగదారు ఫీడ్‌బ్యాక్ డ్యాష్‌బోర్డ్",
                    duration: "5:30",
                    type: "demo"
                  },
                  {
                    title: "AI-Powered Demand Forecasting",
                    titleTelugu: "AI ఆధారిత డిమాండ్ అంచనా",
                    duration: "7:45",
                    type: "tutorial"
                  }
                ]}
              />
            </div>

            {/* Sidebar */}
            <div className="col-span-3">
              <AgriAIPilotSidePeek 
                agentType="Analytics"
                agentName="AgriPulse"
                agentNameTelugu="అగ్రిపల్స్"
                services={[
                  {
                    title: "Demand Analytics Consultation",
                    titleTelugu: "డిమాండ్ అనలిటిక్స్ సలహా",
                    description: "AI-powered consumer demand analysis and crop recommendations",
                    descriptionTelugu: "AI ఆధారిత వినియోగదారుల డిమాండ్ విశ్లేషణ మరియు పంట సిఫార్సులు",
                    duration: "1.5 hours",
                    price: "₹1,500",
                    icon: Star,
                    available: true
                  },
                  {
                    title: "Market Research Setup",
                    titleTelugu: "మార్కెట్ రిసెర్చ్ సెటప్",
                    description: "Consumer feedback collection and analysis system setup",
                    descriptionTelugu: "వినియోగదారుల ఫీడ్‌బ్యాక్ సేకరణ మరియు విశ్లేషణ సిస్టమ్ సెటప్",
                    duration: "2 hours",
                    price: "₹2,000",
                    icon: Users,
                    available: true
                  }
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <AgriChatAgent />
    </div>
  );
};

export default ConsumerFeedback;