import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ArrowLeft, Search, TrendingUp, Users, Target, Brain, Lightbulb, Globe, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation"; 
import { useState } from "react";
// import AgriAgentsSidebar from "../AgriAgentsSidebar";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface MarketResearchProps {
  _onNavigateBack?: () => void;
}

const MarketResearch = ({ _onNavigateBack }: MarketResearchProps) => {
  const router = useRouter();
  const [selectedInsight, setSelectedInsight] = useState("trends");

  const consumerSegments = [
    {
      segment: "Health Enthusiasts",
      segmentTelugu: "ఆరోగ్య ప్రియులు", 
      size: 2150,
      growth: 15,
      avgOrder: 850,
      keyCharacteristics: ["Organic preferences", "Nutrition conscious", "Premium pricing tolerance"],
      preferredProducts: ["Organic vegetables", "Superfoods", "Pesticide-free grains"],
      marketShare: 28,
      loyaltyScore: 87
    },
    {
      segment: "Busy Professionals",
      segmentTelugu: "బిజీ ప్రొఫెషనల్స్",
      size: 1890,
      growth: 22,
      avgOrder: 650,
      keyCharacteristics: ["Convenience seekers", "Time-constrained", "Tech-savvy"],
      preferredProducts: ["Pre-cut vegetables", "Ready-to-cook packs", "Quick delivery"],
      marketShare: 24,
      loyaltyScore: 72
    },
    {
      segment: "Family Households",
      segmentTelugu: "కుటుంబ గృహాలు",
      size: 3420,
      growth: 8,
      avgOrder: 1200,
      keyCharacteristics: ["Value conscious", "Bulk buyers", "Traditional preferences"],
      preferredProducts: ["Variety packs", "Seasonal vegetables", "Local produce"],
      marketShare: 35,
      loyaltyScore: 91
    },
    {
      segment: "Young Couples",
      segmentTelugu: "యువ జంటలు",
      size: 1560,
      growth: 28,
      avgOrder: 520,
      keyCharacteristics: ["Experience oriented", "Social media active", "Quality focused"],
      preferredProducts: ["Exotic vegetables", "Premium fruits", "Instagram-worthy produce"],
      marketShare: 13,
      loyaltyScore: 68
    }
  ];

  const marketTrends = [
    {
      trend: "Organic Produce Demand",
      trendTelugu: "సేంద్రిక ఉత్పత్తుల డిమాండ్",
      growth: 42,
      impact: "High",
      timeline: "Current",
      description: "Significant shift towards organic and chemical-free produce",
      actionNeeded: "Expand organic farmer network by 40%",
      opportunity: "₹15 Cr additional revenue potential"
    },
    {
      trend: "Subscription Economy",
      trendTelugu: "సబ్స్క్రిప్షన్ ఎకానమీ",
      growth: 35,
      impact: "High", 
      timeline: "Next 6 months",
      description: "Consumers prefer predictable, automated delivery models",
      actionNeeded: "Enhanced subscription platform with AI curation",
      opportunity: "60% higher customer lifetime value"
    },
    {
      trend: "Hyperlocal Sourcing",
      trendTelugu: "హైపర్‌లోకల్ సోర్సింగ్",
      growth: 28,
      impact: "Medium",
      timeline: "Next year",
      description: "Preference for locally grown, same-day harvested produce",
      actionNeeded: "Establish micro-farms within 50km of cities",
      opportunity: "30% reduction in supply chain costs"
    },
    {
      trend: "Sustainable Packaging",
      trendTelugu: "స్థిరమైన ప్యాకేజింగ్", 
      growth: 38,
      impact: "Medium",
      timeline: "Current",
      description: "Environmental consciousness driving packaging choices",
      actionNeeded: "100% biodegradable packaging transition",
      opportunity: "25% premium pricing acceptance"
    },
    {
      trend: "Voice Commerce",
      trendTelugu: "వాయిస్ కామర్స్",
      growth: 55,
      impact: "Emerging",
      timeline: "Next 2 years", 
      description: "Voice-activated ordering through smart devices",
      actionNeeded: "Voice AI integration with regional languages",
      opportunity: "First-mover advantage in rural markets"
    }
  ];

  // const competitorAnalysis = [
  //   {
  //     competitor: "BigBasket",
  //     marketShare: 28,
  //     strengths: ["Wide variety", "Quick delivery", "Brand recognition"],
  //     weaknesses: ["Higher prices", "Generic sourcing", "Limited traceability"],
  //     ourAdvantage: "Direct farmer partnerships with full traceability",
  //     threat: "Medium",
  //     strategy: "Focus on freshness and farmer stories"
  //   },
  //   {
  //     competitor: "Amazon Fresh",
  //     marketShare: 18,
  //     strengths: ["Prime ecosystem", "Technology", "Logistics"],
  //     weaknesses: ["Limited fresh focus", "Impersonal service"],
  //     ourAdvantage: "Specialized fresh produce expertise",
  //     threat: "High",
  //     strategy: "Build stronger community relationships"
  //   },
  //   {
  //     competitor: "Local Vendors",
  //     marketShare: 32,
  //     strengths: ["Personal relationships", "Flexibility", "Credit terms"],
  //     weaknesses: ["Quality inconsistency", "Limited variety", "No technology"],
  //     ourAdvantage: "Quality + technology + farmer support",
  //     threat: "Low",
  //     strategy: "Digitize and modernize traditional relationships"
  //   }
  // ];

  const consumerInsights = [
    {
      insight: "Quality over Convenience",
      insightTelugu: "సౌలభ్యం కంటే నాణ్యత",
      percentage: 78,
      description: "Consumers willing to wait longer for guaranteed freshness",
      implication: "Invest in quality assurance over speed",
      action: "Implement 'Freshness Guarantee' program"
    },
    {
      insight: "Farmer Story Resonance", 
      insightTelugu: "రైతు కథ ప్రతిధ్వని",
      percentage: 65,
      description: "Personal farmer stories increase purchase likelihood by 40%",
      implication: "Storytelling drives emotional connection",
      action: "Create 'Meet Your Farmer' video series"
    },
    {
      insight: "Price Transparency Demand",
      insightTelugu: "ధర పారదర్శకత డిమాండ్",
      percentage: 82,
      description: "Detailed price breakdowns build trust significantly",
      implication: "Full cost transparency is competitive advantage", 
      action: "Show farmer earnings on every product page"
    },
    {
      insight: "Seasonal Variety Preference",
      insightTelugu: "కాలానుగుణ వైవిధ్య ప్రాధాన్యత",
      percentage: 71,
      description: "Customers prefer seasonal recommendations over year-round availability",
      implication: "Seasonal curation beats endless choice",
      action: "AI-powered seasonal recommendation engine"
    }
  ];

  const demographicData = [
    { ageGroup: '18-25', percentage: 22, spending: 450, preference: 'Convenience & Technology' },
    { ageGroup: '26-35', percentage: 35, spending: 680, preference: 'Quality & Value' },
    { ageGroup: '36-45', percentage: 28, spending: 850, preference: 'Health & Family' },
    { ageGroup: '46-60', percentage: 12, spending: 620, preference: 'Traditional & Trust' },
    { ageGroup: '60+', percentage: 3, spending: 380, preference: 'Simplicity & Service' }
  ];

  const seasonalDemand = [
    { season: 'Winter', tomatoes: 85, leafyGreens: 95, fruits: 70, roots: 90 },
    { season: 'Summer', tomatoes: 65, leafyGreens: 60, fruits: 95, roots: 70 },
    { season: 'Monsoon', tomatoes: 45, leafyGreens: 75, fruits: 60, roots: 85 },
    { season: 'Post-Monsoon', tomatoes: 90, leafyGreens: 85, fruits: 80, roots: 95 }
  ];

  const predictiveModels = [
    {
      model: "Demand Forecasting",
      modelTelugu: "డిమాండ్ అంచనా",
      accuracy: 89,
      prediction: "35% surge in organic demand during winter",
      confidence: 94,
      impact: "High",
      recommendation: "Increase organic inventory by 40%"
    },
    {
      model: "Customer Churn Prediction",
      modelTelugu: "కస్టమర్ చర్న్ అంచనా",
      accuracy: 85,
      prediction: "High-value customers showing 15% churn risk",
      confidence: 78,
      impact: "Critical",
      recommendation: "Implement retention campaigns for top 200 customers"
    },
    {
      model: "Price Optimization",
      modelTelugu: "ధర ఆప్టిమైజేషన్",
      accuracy: 92,
      prediction: "8% price increase acceptable for premium produce",
      confidence: 87,
      impact: "Medium",
      recommendation: "Gradual premium product line introduction"
    }
  ];

  // const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-white-100">
      {/* <AgriAgentsSidebar />
       */}
      <div className="ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between max-w-full mx-auto">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/consumer-feedback')} variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Consumer Feedback
              </Button>
              <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Search className="w-6 h-6" />
                Market Research | మార్కెట్ రిసెర్చ్
              </h1>
            </div>
            <div className="flex gap-2">
              {['trends', 'segments', 'insights', 'predictions'].map((tab) => (
                <Button
                  key={tab}
                  variant={selectedInsight === tab ? "default" : "outline"}
                  onClick={() => setSelectedInsight(tab)}
                  size="sm"
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </header>

        <div className="max-w-full mx-auto p-6 space-y-6">
          {/* Market Overview */}
          <div className="grid grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Globe className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                <div className="text-2xl font-bold">₹45 Cr</div>
                <div className="text-sm text-muted-foreground">Market Size</div>
                <div className="text-xs text-green-600">+18% YoY</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-3 text-green-500" />
                <div className="text-2xl font-bold">9,420</div>
                <div className="text-sm text-muted-foreground">Active Customers</div>
                <div className="text-xs text-green-600">+22% growth</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 mx-auto mb-3 text-purple-500" />
                <div className="text-2xl font-bold">15%</div>
                <div className="text-sm text-muted-foreground">Market Share</div>
                <div className="text-xs text-green-600">+3% increase</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-3 text-orange-500" />
                <div className="text-2xl font-bold">₹720</div>
                <div className="text-sm text-muted-foreground">Avg Order Value</div>
                <div className="text-xs text-green-600">+12% uplift</div>
              </CardContent>
            </Card>
          </div>

          {/* Consumer Segments Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Consumer Segments Analysis | వినియోగదారుల విభాగాల విశ్లేషణ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {consumerSegments.map((segment, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3">
                          <h3 className="font-bold text-lg">{segment.segment}</h3>
                          <p className="text-sm text-primary">{segment.segmentTelugu}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span><strong>{segment.size}</strong> customers</span>
                            <Badge variant="default" className="bg-green-500">+{segment.growth}%</Badge>
                          </div>
                        </div>
                        <div className="col-span-3">
                          <p className="text-sm text-muted-foreground mb-1">Key Characteristics:</p>
                          <ul className="text-xs space-y-1">
                            {segment.keyCharacteristics.map((char, i) => (
                              <li key={i} className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                {char}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="col-span-3">
                          <p className="text-sm text-muted-foreground mb-1">Preferred Products:</p>
                          <div className="space-y-1">
                            {segment.preferredProducts.map((product, i) => (
                              <Badge key={i} variant="outline" className="text-xs mr-1">
                                {product}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="col-span-3 text-center">
                          <div className="space-y-2">
                            <div>
                              <p className="text-lg font-bold">₹{segment.avgOrder}</p>
                              <p className="text-xs text-muted-foreground">Avg Order</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold">{segment.marketShare}%</p>
                              <p className="text-xs text-muted-foreground">Market Share</p>
                            </div>
                            <div>
                              <Progress value={segment.loyaltyScore} className="h-2" />
                              <p className="text-xs text-muted-foreground">Loyalty: {segment.loyaltyScore}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Emerging Market Trends | అభివృద్ధి చెందుతున్న మార్కెట్ ట్రెండ్స్
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketTrends.map((trend, index) => (
                  <Card key={index} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3">
                          <h3 className="font-bold text-lg">{trend.trend}</h3>
                          <p className="text-sm text-primary">{trend.trendTelugu}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={trend.growth} className="h-2 flex-1" />
                            <Badge variant="default" className="bg-green-500">+{trend.growth}%</Badge>
                          </div>
                        </div>
                        <div className="col-span-4">
                          <p className="text-sm">{trend.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={trend.impact === 'High' ? 'default' : trend.impact === 'Medium' ? 'secondary' : 'outline'}>
                              {trend.impact} Impact
                            </Badge>
                            <Badge variant="outline">{trend.timeline}</Badge>
                          </div>
                        </div>
                        <div className="col-span-3">
                          <p className="text-sm text-muted-foreground mb-1">Action Required:</p>
                          <p className="text-sm font-medium text-orange-600">{trend.actionNeeded}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground mb-1">Opportunity:</p>
                          <p className="text-sm font-bold text-green-600">{trend.opportunity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Demographics & Seasonal Analysis */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Age Demographics & Spending | వయస్సు జనాభా మరియు వ్యయం</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demographicData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ageGroup" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="percentage" fill="#3b82f6" name="Percentage" />
                      <Bar dataKey="spending" fill="#10b981" name="Avg Spending (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seasonal Demand Patterns | కాలానుగుణ డిమాండ్ నమూనాలు</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={seasonalDemand}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="season" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Tomatoes" dataKey="tomatoes" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                      <Radar name="Leafy Greens" dataKey="leafyGreens" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      <Radar name="Fruits" dataKey="fruits" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                      <Radar name="Root Vegetables" dataKey="roots" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Consumer Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Key Consumer Insights | ముఖ్య వినియోగదారు అంతర్దృష్టులు
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {consumerInsights.map((insight, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{insight.insight}</h3>
                          <p className="text-sm text-primary">{insight.insightTelugu}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{insight.percentage}%</div>
                          <div className="text-xs text-muted-foreground">of consumers</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Implication:</p>
                          <p className="text-sm font-medium">{insight.implication}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Recommended Action:</p>
                          <p className="text-sm font-medium text-green-600">{insight.action}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Predictive Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Predictive Models | AI అంచనా మోడల్స్
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveModels.map((model, index) => (
                  <Card key={index} className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3">
                          <h3 className="font-bold text-lg">{model.model}</h3>
                          <p className="text-sm text-primary">{model.modelTelugu}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm">Accuracy:</span>
                            <Progress value={model.accuracy} className="h-2 flex-1" />
                            <span className="text-sm font-bold">{model.accuracy}%</span>
                          </div>
                        </div>
                        <div className="col-span-4">
                          <p className="text-sm font-medium">{model.prediction}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={model.impact === 'Critical' ? 'destructive' : model.impact === 'High' ? 'default' : 'secondary'}>
                              {model.impact} Impact
                            </Badge>
                            <Badge variant="outline">
                              {model.confidence}% Confidence
                            </Badge>
                          </div>
                        </div>
                        <div className="col-span-4">
                          <p className="text-sm text-muted-foreground mb-1">Recommended Action:</p>
                          <p className="text-sm font-medium text-green-600">{model.recommendation}</p>
                        </div>
                        <div className="col-span-1">
                          <Button size="sm" className="agri-button-primary">
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
        agentType="Market Research Expert"
        agentName="Market Research AI"
        agentNameTelugu="మార్కెట్ రిసెర్చ్ AI"
        services={[
          { title: "Trend Analysis", titleTelugu: "ట్రెండ్ అనాలిసిస్", description: "AI-powered market trend identification", descriptionTelugu: "AI-ఆధారిత మార్కెట్ ట్రెండ్ గుర్తింపు", duration: "60 min", price: "₹900", icon: "📈", available: true },
          { title: "Competitive Intelligence", titleTelugu: "కాంపిటీటివ్ ఇంటెలిజెన్స్", description: "Analyze competitor strategies and positioning", descriptionTelugu: "పోటీదారుల వ్యూహాలు మరియు స్థానాన్ని విశ్లేషించండి", duration: "55 min", price: "₹800", icon: "🔍", available: true },
          { title: "Demand Forecasting", titleTelugu: "డిమాండ్ ఫోర్‌కాస్టింగ్", description: "Predict future market demand patterns", descriptionTelugu: "భవిష్యత్ మార్కెట్ డిమాండ్ నమూనాలను అంచనా వేయండి", duration: "50 min", price: "₹750", icon: "🔮", available: true },
          { title: "Consumer Insights", titleTelugu: "కన్స్యూమర్ ఇన్‌సైట్‌లు", description: "Deep consumer behavior and preference analysis", descriptionTelugu: "లోతైన వినియోగదారుల ప్రవర్తన మరియు ప్రాధాన్యత విశ్లేషణ", duration: "45 min", price: "₹650", icon: "💡", available: true }
        ]}
      />
      <AgriChatAgent />
    </div>
  );
};

export default MarketResearch;