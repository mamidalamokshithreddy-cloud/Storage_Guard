import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ArrowLeft, Crown, Gift, Star, Users, Award, Heart, Sparkles, Target } from "lucide-react";
import { useRouter } from "next/navigation";  // Replace react-router-dom
import { useState } from "react";
// import AgriAgentsSidebar from "../AgriAgentsSidebar";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface LoyaltyProgramsProps {
  _onNavigateBack?: () => void;
}

const LoyaltyPrograms = ({ _onNavigateBack }: LoyaltyProgramsProps) => {
  const router = useRouter();  // Replace useNavigate with useRouter
  const [activeTab, setActiveTab] = useState("overview");

  const loyaltyTiers = [
    {
      tier: "Green Starter",
      tierTelugu: "గ్రీన్ స్టార్టర్",
      icon: "🌱",
      members: 3200,
      minSpend: 0,
      benefits: [
        "5% cashback on all orders",
        "Free delivery above ₹300",
        "Monthly newsletter with farming tips"
      ],
      color: "bg-green-100 border-green-500",
      nextTier: "Spend ₹2000/month to reach Fresh Lover"
    },
    {
      tier: "Fresh Lover",
      tierTelugu: "ఫ్రెష్ లవర్",
      icon: "🥬", 
      members: 2800,
      minSpend: 2000,
      benefits: [
        "8% cashback on all orders",
        "Priority customer support",
        "Early access to seasonal produce",
        "Exclusive recipe recommendations"
      ],
      color: "bg-blue-100 border-blue-500",
      nextTier: "Spend ₹5000/month to reach Organic Champion"
    },
    {
      tier: "Organic Champion",
      tierTelugu: "ఆర్గానిక్ చాంపియన్",
      icon: "🏆",
      members: 1950,
      minSpend: 5000,
      benefits: [
        "12% cashback on all orders",
        "Access to premium organic products",
        "Personal nutrition consultant",
        "Free monthly health checkup voucher"
      ],
      color: "bg-purple-100 border-purple-500",
      nextTier: "Spend ₹10000/month to reach Farm Friend VIP"
    },
    {
      tier: "Farm Friend VIP",
      tierTelugu: "ఫార్మ్ ఫ్రెండ్ VIP",
      icon: "👑",
      members: 500,
      minSpend: 10000,
      benefits: [
        "15% cashback on all orders",
        "Exclusive farm visit opportunities",
        "Personal shopper service",
        "Custom crop growing requests",
        "VIP customer hotline"
      ],
      color: "bg-yellow-100 border-yellow-500",
      nextTier: "Maximum tier reached!"
    }
  ];

  const rewardsPrograms = [
    {
      program: "Referral Rewards",
      programTelugu: "రెఫరల్ రివార్డ్స్",
      icon: <Users className="w-6 h-6" />,
      description: "Earn ₹100 for every successful referral",
      participants: 1250,
      totalEarned: "₹2,45,000",
      avgReward: "₹196"
    },
    {
      program: "Review Rewards", 
      programTelugu: "రివ్యూ రివార్డ్స్",
      icon: <Star className="w-6 h-6" />,
      description: "Get ₹25 cashback for detailed product reviews",
      participants: 890,
      totalEarned: "₹1,22,500",
      avgReward: "₹138"
    },
    {
      program: "Seasonal Challenges",
      programTelugu: "సీజనల్ చాలెంజ్‌లు", 
      icon: <Target className="w-6 h-6" />,
      description: "Complete monthly produce challenges for bonus points",
      participants: 2100,
      totalEarned: "₹3,15,000",
      avgReward: "₹150"
    },
    {
      program: "Birthday Bonuses",
      programTelugu: "పుట్టినరోజు బోనస్‌లు",
      icon: <Gift className="w-6 h-6" />,
      description: "Special discounts and free products on birthdays",
      participants: 1560,
      totalEarned: "₹1,87,200",
      avgReward: "₹120"
    }
  ];

  const engagementMetrics = [
    { metric: "Program Participation Rate", metricTelugu: "ప్రోగ్రామ్ భాగస్వామ్య రేటు", value: 78, target: 80, trend: "+5%" },
    { metric: "Average Points per Member", metricTelugu: "సభ్యునికి సగటు పాయింట్లు", value: 1250, target: 1500, trend: "+12%" },
    { metric: "Redemption Rate", metricTelugu: "రిడంప్షన్ రేటు", value: 67, target: 70, trend: "+3%" },
    { metric: "Member Retention Rate", metricTelugu: "సభ్య నిలుపుదల రేటు", value: 89, target: 90, trend: "+2%" }
  ];

  const monthlyTrends = [
    { month: 'Jan', newMembers: 120, activeMembers: 850, pointsEarned: 45000, pointsRedeemed: 28000 },
    { month: 'Feb', newMembers: 145, activeMembers: 920, pointsEarned: 52000, pointsRedeemed: 31000 },
    { month: 'Mar', newMembers: 132, activeMembers: 980, pointsEarned: 48000, pointsRedeemed: 35000 },
    { month: 'Apr', newMembers: 178, activeMembers: 1120, pointsEarned: 67000, pointsRedeemed: 42000 },
    { month: 'May', newMembers: 165, activeMembers: 1200, pointsEarned: 72000, pointsRedeemed: 48000 },
    { month: 'Jun', newMembers: 198, activeMembers: 1340, pointsEarned: 89000, pointsRedeemed: 58000 }
  ];

  const tierDistribution = [
    { name: 'Green Starter', value: 3200, color: '#10b981' },
    { name: 'Fresh Lover', value: 2800, color: '#3b82f6' },
    { name: 'Organic Champion', value: 1950, color: '#8b5cf6' },
    { name: 'Farm Friend VIP', value: 500, color: '#f59e0b' }
  ];

  const topRewards = [
    { reward: "Free Organic Vegetable Box", rewardTelugu: "ఉచిత ఆర్గానిక్ వెజిటబుల్ బాక్స్", points: 500, claimed: 245, value: "₹800" },
    { reward: "Premium Fruit Basket", rewardTelugu: "ప్రీమియం ఫ్రూట్ బాస్కెట్", points: 300, claimed: 420, value: "₹600" },
    { reward: "Farm Visit Experience", rewardTelugu: "ఫార్మ్ విజిట్ అనుభవం", points: 1000, claimed: 85, value: "₹1500" },
    { reward: "Cooking Class Voucher", rewardTelugu: "కుకింగ్ క్లాస్ వోచర్", points: 200, claimed: 320, value: "₹400" },
    { reward: "Health Consultation", rewardTelugu: "ఆరోగ్య సలహా", points: 150, claimed: 180, value: "₹300" }
  ];

  const memberSpotlight = [
    {
      name: "Priya Sharma",
      location: "Hyderabad",
      tier: "Farm Friend VIP",
      joinDate: "Jan 2023",
      totalSpent: "₹85,000",
      pointsEarned: 12750,
      pointsRedeemed: 8500,
      favoriteProduct: "Organic Tomatoes"
    },
    {
      name: "Rajesh Kumar", 
      location: "Warangal",
      tier: "Organic Champion",
      joinDate: "Mar 2023",
      totalSpent: "₹45,000",
      pointsEarned: 6750,
      pointsRedeemed: 4200,
      favoriteProduct: "Mixed Vegetables"
    },
    {
      name: "Anitha Reddy",
      location: "Nizamabad", 
      tier: "Fresh Lover",
      joinDate: "Jun 2023",
      totalSpent: "₹25,000",
      pointsEarned: 3750,
      pointsRedeemed: 2100,
      favoriteProduct: "Leafy Greens"
    }
  ];

  // const campaignInsights = [
  //   {
  //     campaign: "Summer Hydration Challenge",
  //     campaignTelugu: "వేసవి హైడ్రేషన్ చాలెంజ్",
  //     duration: "May-Jun 2024",
  //     participants: 1850,
  //     completionRate: 73,
  //     avgReward: "₹180",
  //     impact: "25% increase in summer produce sales"
  //   },
  //   {
  //     campaign: "Organic Month Celebration",
  //     campaignTelugu: "ఆర్గానిక్ మాస్ సెలబ్రేషన్",
  //     duration: "Apr 2024",
  //     participants: 2200,
  //     completionRate: 68,
  //     avgReward: "₹150",
  //     impact: "40% boost in organic product adoption"
  //   }
  // ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-white-100">
      {/* <AgriAgentsSidebar />
       */}
      <div className="ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between max-w-full mx-auto">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => router.push('/farmer/consumer-feedback')}
                variant="outline" 
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Consumer Feedback
              </Button>
              <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Crown className="w-6 h-6" />
                Loyalty Programs | లాయల్టీ ప్రోగ్రామ్స్
              </h1>
            </div>
            <div className="flex gap-2">
              {['overview', 'tiers', 'rewards', 'campaigns'].map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "default" : "outline"}
                  onClick={() => setActiveTab(tab)}
                  size="sm"
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </header>

        <div className="max-w-full mx-auto p-6 space-y-6">
          {/* Overview Metrics */}
          <div className="grid grid-cols-4 gap-6">
            {engagementMetrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Heart className="w-5 h-5 text-primary" />
                    </div>
                    <Badge variant="secondary">{metric.trend}</Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">{metric.metric}</h3>
                    <p className="text-xs text-primary">{metric.metricTelugu}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {metric.metric.includes('Points') ? metric.value : `${metric.value}%`}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {metric.metric.includes('Points') ? metric.target : `${metric.target}%`}
                      </span>
                    </div>
                    <Progress value={(metric.value / metric.target) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loyalty Tiers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Loyalty Tiers | లాయల్టీ టైర్స్
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {loyaltyTiers.map((tier, index) => (
                  <Card key={index} className={`border-2 ${tier.color}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-4xl">{tier.icon}</div>
                        <div>
                          <h3 className="text-xl font-bold">{tier.tier}</h3>
                          <p className="text-primary font-medium">{tier.tierTelugu}</p>
                          <p className="text-sm text-muted-foreground">
                            {tier.members} members • Min ₹{tier.minSpend}/month
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        {tier.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm">{benefit}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                        {tier.nextTier}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Member Distribution & Trends */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tier Distribution | టైర్ పంపిణీ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tierDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {tierDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Engagement Trends | మాసిక ఎంగేజ్‌మెంట్ ట్రెండ్స్</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="newMembers" stroke="#3b82f6" strokeWidth={2} name="New Members" />
                      <Line type="monotone" dataKey="activeMembers" stroke="#10b981" strokeWidth={2} name="Active Members" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rewards Programs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Rewards Programs | రివార్డ్స్ ప్రోగ్రామ్స్
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {rewardsPrograms.map((program, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {program.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{program.program}</h3>
                          <p className="text-sm text-primary">{program.programTelugu}</p>
                          <p className="text-sm text-muted-foreground mt-2">{program.description}</p>
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="text-center">
                              <p className="text-lg font-bold">{program.participants}</p>
                              <p className="text-xs text-muted-foreground">Participants</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold">{program.totalEarned}</p>
                              <p className="text-xs text-muted-foreground">Total Earned</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold">{program.avgReward}</p>
                              <p className="text-xs text-muted-foreground">Avg Reward</p>
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

          {/* Top Rewards */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Rewards | ప్రసిద్ధ రివార్డ్స్</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Reward | రివార్డ్</th>
                      <th className="text-center p-3">Points Required | అవసరమైన పాయింట్లు</th>
                      <th className="text-center p-3">Times Claimed | క్లెయిమ్ చేసిన సార్లు</th>
                      <th className="text-center p-3">Value | విలువ</th>
                      <th className="text-center p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRewards.map((reward, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-semibold">{reward.reward}</div>
                            <div className="text-sm text-primary">{reward.rewardTelugu}</div>
                          </div>
                        </td>
                        <td className="text-center p-3 font-semibold">{reward.points}</td>
                        <td className="text-center p-3">{reward.claimed}</td>
                        <td className="text-center p-3">
                          <Badge variant="outline">{reward.value}</Badge>
                        </td>
                        <td className="text-center p-3">
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Member Spotlight */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Top Member Spotlight | టాప్ మెంబర్ స్పాట్‌లైట్
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {memberSpotlight.map((member, index) => (
                  <Card key={index} className="border-2 border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4 text-center">
                      <div className="text-4xl mb-2">👑</div>
                      <h3 className="font-bold text-lg">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.location}</p>
                      <Badge className="my-2">{member.tier}</Badge>
                      <div className="space-y-1 text-sm">
                        <p><strong>Joined:</strong> {member.joinDate}</p>
                        <p><strong>Total Spent:</strong> {member.totalSpent}</p>
                        <p><strong>Points Balance:</strong> {member.pointsEarned - member.pointsRedeemed}</p>
                        <p><strong>Favorite:</strong> {member.favoriteProduct}</p>
                      </div>
                      <Button size="sm" className="mt-3 agri-button-primary">
                        View Profile
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <AgriAIPilotSidePeek 
        agentType="Loyalty Programs Expert"
        agentName="Loyalty Programs AI"
        agentNameTelugu="లాయల్టీ ప్రోగ్రామ్స్ AI"
        services={[
          { title: "Program Optimization", titleTelugu: "ప్రోగ్రామ్ ఆప్టిమైజేషన్", description: "Optimize loyalty program structure and rewards", descriptionTelugu: "లాయల్టీ ప్రోగ్రామ్ నిర్మాణం మరియు రివార్డులను ఆప్టిమైజ్ చేయండి", duration: "45 min", price: "₹700", icon: "🏆", available: true },
          { title: "Tier Management", titleTelugu: "టైర్ మేనేజ్‌మెంట్", description: "AI-powered tier progression analysis", descriptionTelugu: "AI-ఆధారిత టైర్ పురోగతి విశ్లేషణ", duration: "35 min", price: "₹500", icon: "🔝", available: true },
          { title: "Reward Calculation", titleTelugu: "రివార్డ్ లెక్కింపు", description: "Optimize reward point calculations", descriptionTelugu: "రివార్డ్ పాయింట్ లెక్కింపులను ఆప్టిమైజ్ చేయండి", duration: "30 min", price: "₹400", icon: "🎁", available: true },
          { title: "Engagement Analysis", titleTelugu: "ఎంగేజ్‌మెంట్ అనాలిసిస్", description: "Analyze program engagement and effectiveness", descriptionTelugu: "ప్రోగ్రామ్ ఎంగేజ్‌మెంట్ మరియు ప్రభావాన్ని విశ్లేషించండి", duration: "40 min", price: "₹600", icon: "📊", available: true }
        ]}
      />
      <AgriChatAgent />
    </div>
  );
};

export default LoyaltyPrograms;