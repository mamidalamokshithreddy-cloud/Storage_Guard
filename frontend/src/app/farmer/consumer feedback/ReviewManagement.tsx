import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ArrowLeft, Star, MessageSquare, ThumbsUp, AlertTriangle, Eye, Reply } from "lucide-react";
import { useRouter } from "next/navigation"; 
import { useState } from "react";
// import AgriAgentsSidebar from "../AgriAgentsSidebar";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ReviewManagementProps {
  _onNavigateBack?: () => void;
}

const ReviewManagement = ({ _onNavigateBack }: ReviewManagementProps) => {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("all");

  const reviews = [
    {
      id: "RV001",
      customer: "Priya Sharma", 
      customerTelugu: "ప్రియా శర్మ",
      rating: 5,
      product: "Organic Tomatoes",
      productTelugu: "ఆర్గానిక్ టమాటాలు",
      comment: "Excellent quality! Fresh and tasty. వాటి రుచి చాలా బాగుంది।",
      date: "Dec 22, 2024",
      status: "Published",
      sentiment: "Positive",
      responded: true
    },
    {
      id: "RV002",
      customer: "Rajesh Kumar",
      customerTelugu: "రాజేష్ కుమార్",
      rating: 4,
      product: "Mixed Vegetables", 
      productTelugu: "మిశ్రమ కూరగాయలు",
      comment: "Good packaging, but delivery was slightly delayed",
      date: "Dec 21, 2024",
      status: "Published",
      sentiment: "Positive",
      responded: false
    },
    {
      id: "RV003",
      customer: "Anitha Reddy",
      customerTelugu: "అనిత రెడ్డి",
      rating: 3,
      product: "Green Leafy Vegetables",
      productTelugu: "ఆకుకూరలు",
      comment: "Quality was okay but some leaves were wilted",
      date: "Dec 20, 2024",
      status: "Pending Review",
      sentiment: "Neutral",
      responded: false
    }
  ];

  const reviewStats = [
    { metric: "Average Rating", value: 4.6, trend: "+0.2" },
    { metric: "Total Reviews", value: 1248, trend: "+45" },
    { metric: "Response Rate", value: 92, trend: "+5%" },
    { metric: "Positive Sentiment", value: 78, trend: "+3%" }
  ];

  const sentimentData = [
    { name: 'Positive', value: 78, color: '#22c55e' },
    { name: 'Neutral', value: 16, color: '#fbbf24' },
    { name: 'Negative', value: 6, color: '#ef4444' }
  ];

  const ratingDistribution = [
    { stars: '5 Star', count: 580, percentage: 46 },
    { stars: '4 Star', count: 425, percentage: 34 },
    { stars: '3 Star', count: 187, percentage: 15 },
    { stars: '2 Star', count: 43, percentage: 3 },
    { stars: '1 Star', count: 13, percentage: 2 }
  ];

  const filteredReviews = reviews.filter(review => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "positive") return review.rating >= 4;
    if (selectedFilter === "neutral") return review.rating === 3;
    if (selectedFilter === "negative") return review.rating <= 2;
    if (selectedFilter === "pending") return !review.responded;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-white-100">
      {/* <AgriAgentsSidebar /> */}
      
      <div className="ml-0">
        <div className="max-w-full mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/consumer-feedback')} variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Consumer Feedback
              </Button>
              <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                ⭐ Review Management | రివ్యూ మేనేజ్‌మెంట్
              </h1>
            </div>
            <Button className="agri-button-primary flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              AI Response Assistant
            </Button>
          </div>

          <div className="space-y-6">
            {/* Review Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Review Analytics Dashboard | రివ్యూ అనలిటిక్స్ డ్యాష్‌బోర్డ్
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {reviewStats.map((stat, index) => (
                    <div key={index} className="p-4 bg-gradient-field rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">{stat.value}</div>
                      <p className="text-sm font-medium">{stat.metric}</p>
                      <div className="flex justify-center items-center mt-2">
                        <span className="text-xs font-semibold text-success">
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Sentiment Distribution */}
                  <div>
                    <h3 className="font-semibold mb-3">Sentiment Distribution</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sentimentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {sentimentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  <div>
                    <h3 className="font-semibold mb-3">Rating Distribution</h3>
                    <div className="space-y-2">
                      {ratingDistribution.map((rating, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-sm w-12">{rating.stars}</span>
                          <Progress value={rating.percentage} className="flex-1" />
                          <span className="text-sm text-muted-foreground w-12">{rating.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Customer Reviews | కస్టమర్ రివ్యూలు
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedFilter("all")}
                    >
                      All ({reviews.length})
                    </Button>
                    <Button
                      variant={selectedFilter === "positive" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedFilter("positive")}
                    >
                      Positive ({reviews.filter(r => r.rating >= 4).length})
                    </Button>
                    <Button
                      variant={selectedFilter === "pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedFilter("pending")}
                    >
                      Pending ({reviews.filter(r => !r.responded).length})
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <Card key={review.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{review.customer}</h3>
                              <span className="text-sm text-primary">({review.customerTelugu})</span>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                />
                              ))}
                              <span className="ml-2 text-sm text-muted-foreground">{review.date}</span>
                            </div>
                            <Badge variant="outline" className="mb-2">
                              {review.product} | {review.productTelugu}
                            </Badge>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge 
                              variant={review.sentiment === 'Positive' ? 'default' : review.sentiment === 'Neutral' ? 'secondary' : 'destructive'}
                            >
                              {review.sentiment}
                            </Badge>
                            {review.responded ? (
                              <Badge variant="outline" className="bg-green-50">
                                <ThumbsUp className="w-3 h-3 mr-1" />
                                Responded
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-muted-foreground italic mb-3">"{review.comment}"</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                          {!review.responded && (
                            <Button size="sm" className="agri-button-primary">
                              <Reply className="w-4 h-4 mr-1" />
                              Respond
                            </Button>
                          )}
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
        agentType="Review Expert"
        agentName="Review AI Assistant"
        agentNameTelugu="రివ్యూ AI సహాయకుడు"
      />
      
      {/* Chat Agent */}
      <AgriChatAgent />
    </div>
  );
};

export default ReviewManagement;