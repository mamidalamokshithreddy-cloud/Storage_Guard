import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Progress } from "../ui/progress";
import { Tractor, Calendar, Users, Phone, PlayCircle, Settings, Package, Warehouse, Camera, Cpu, Cloud, Activity, FileCheck, Eye, Brain, Scan, Smartphone } from "lucide-react";

import AgriChatAgent from "../AgriChatAgent";
import AgentVideoSection from "../AgentVideoSection";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";

const HarvestBot = () => {
  // const router = useRouter(); // Commented - not used yet

  const harvestBotServices = [
    {
      title: "AI Harvest Analysis",
      titleTelugu: "AI పంట కోత విశ్లేషణ",
      description: "Computer vision analysis of crop readiness",
      descriptionTelugu: "పంట సిద్ధత యొక్క కంప్యూటర్ విజన్ విశ్లేషణ",
      duration: "Real-time",
      price: "₹200/scan",
      icon: Cpu,
      available: true
    },
    {
      title: "Smart Harvest Timing",
      titleTelugu: "స్మార్ట్ కోత సమయం",
      description: "Weather-aligned optimal harvest recommendations",
      descriptionTelugu: "వాతావరణంతో అనుసంధానించబడిన అనుకూల కోత సిఫార్సులు",
      duration: "24/7 monitoring",
      price: "₹1,500/month",
      icon: Brain,
      available: true
    },
    {
      title: "Quality Prediction AI",
      titleTelugu: "నాణ్యత అంచనా AI",
      description: "AI-powered crop quality and yield prediction",
      descriptionTelugu: "AI-శక్తితో పంట నాణ్యత మరియు దిగుబడి అంచనా",
      duration: "Instant",
      price: "₹500/analysis",
      icon: Eye,
      available: true
    },
    {
      title: "Equipment Selection Guide",
      titleTelugu: "పరికరాల ఎంపిక గైడ్",
      description: "Best harvesting equipment selection for your crop",
      descriptionTelugu: "మీ పంటకు అత్యుత్తమ పంటకోత పరికరాల ఎంపిక",
      duration: "1.5 hours",
      price: "₹800",
      icon: Settings,
      available: true
    },
    {
      title: "Post-Harvest Management",
      titleTelugu: "పంట కోత తర్వాత నిర్వహణ",
      description: "Complete post-harvest handling and processing",
      descriptionTelugu: "సంపూర్ణ పంట కోత తర్వాత నిర్వహణ మరియు ప్రాసెసింగ్",
      duration: "2 hours",
      price: "₹1,000",
      icon: Package,
      available: true
    },
    {
      title: "Storage Solutions",
      titleTelugu: "నిల్వ పరిష్కారాలు",
      description: "Effective crop storage and facility planning",
      descriptionTelugu: "ప్రభావవంతమైన పంట నిల్వ మరియు సౌకర్య ప్రణాళిక",
      duration: "2-3 hours",
      price: "₹1,200",
      icon: Warehouse,
      available: true
    }
  ];

  const harvestCalendar = [
    { 
      crop: "Cotton", 
      area: "12.5 acres", 
      expectedDate: "April 15-25", 
      status: "ready", 
      yield: "18-22 quintals",
      telugu: "పత్తి"
    },
    { 
      crop: "Soybean", 
      area: "8.2 acres", 
      expectedDate: "April 20-30", 
      status: "monitoring", 
      yield: "12-15 quintals",
      telugu: "సోయాబీన్"
    }
  ];

  const machinery = [
    {
      type: "Cotton Picker",
      telugu: "పత్తి పిక్కర్",
      operator: "Ravi Kumar",
      phone: "+91 98765 43210",
      rate: "₹2,500/acre",
      availability: "Available",
      distance: "3.2 km",
      rating: 4.8
    },
    {
      type: "Combine Harvester", 
      telugu: "కంబైన్ హార్వెస్టర్",
      operator: "Suresh Agri Services",
      phone: "+91 87654 32109", 
      rate: "₹2,000/acre",
      availability: "Booked till Apr 18",
      distance: "5.8 km",
      rating: 4.6
    },
    {
      type: "Tractor + Trailer",
      telugu: "ట్రాక్టర్ + ట్రైలర్",
      operator: "Mahesh Transport",
      phone: "+91 76543 21098",
      rate: "₹800/trip",
      availability: "Available",
      distance: "2.1 km", 
      rating: 4.7
    }
  ];

  const laborTeams = [
    {
      leader: "Lakshmi Team",
      telugu: "లక్ష్మి బృందం",
      workers: 15,
      experience: "8+ years",
      rate: "₹400/person/day",
      specialty: "Cotton picking",
      phone: "+91 65432 10987",
      rating: 4.9,
      insurance: "Yes",
      certifications: ["Organic Handling", "Safety Training"]
    },
    {
      leader: "Ramesh Labor Group",
      telugu: "రమేష్ కార్మిక బృందం", 
      workers: 12,
      experience: "5+ years",
      rate: "₹350/person/day",
      specialty: "General harvest",
      phone: "+91 54321 09876",
      rating: 4.6,
      insurance: "Yes",
      certifications: ["Basic Training"]
    }
  ];

  const cvDetectionData = {
    pestDetection: [
      { pest: "Bollworm", confidence: 87, severity: "Medium", location: "Field A-3", recommendation: "Apply Bt spray within 24hrs" },
      { pest: "Aphids", confidence: 94, severity: "High", location: "Field B-1", recommendation: "Neem oil treatment recommended" }
    ],
    diseaseDetection: [
      { disease: "Leaf Curl", confidence: 91, severity: "High", location: "Field A-2", recommendation: "Immediate fungicide application" },
      { disease: "Root Rot", confidence: 76, severity: "Medium", location: "Field C-1", recommendation: "Improve drainage, reduce watering" }
    ],
    qualityAnalysis: {
      ripeness: "85% ready",
      moisture: "12.3%",
      color: "Optimal",
      size: "Grade A",
      defects: "2% (acceptable)"
    }
  };

  const weatherData = {
    current: { temp: "28°C", humidity: "65%", wind: "8 km/h" },
    forecast: [
      { day: "Today", condition: "Sunny", harvestScore: 95 },
      { day: "Tomorrow", condition: "Partly Cloudy", harvestScore: 88 },
      { day: "Day 3", condition: "Light Rain", harvestScore: 45 }
    ]
  };

  const vendorMarketplace = [
    {
      category: "Drone Spraying",
      vendors: [
        { name: "SkyAgri Drones", rating: 4.8, price: "₹800/acre", availability: "Available", sla: "Same day", distance: "12 km" },
        { name: "AeroFarm Solutions", rating: 4.6, price: "₹750/acre", availability: "Tomorrow", sla: "24 hours", distance: "8 km" }
      ]
    },
    {
      category: "Tractor Services",
      vendors: [
        { name: "Mahindra Rental", rating: 4.9, price: "₹1,500/day", availability: "Available", sla: "2 hours", distance: "5 km" },
        { name: "Agri Equipment Hub", rating: 4.7, price: "₹1,200/day", availability: "Booked", sla: "Next day", distance: "15 km" }
      ]
    },
    {
      category: "Storage Solutions",
      vendors: [
        { name: "ColdChain Pro", rating: 4.9, price: "₹5,000/MT", availability: "Available", sla: "Immediate", distance: "25 km" },
        { name: "AgroStore Solutions", rating: 4.5, price: "₹3,500/MT", availability: "Available", sla: "Same day", distance: "18 km" }
      ]
    }
  ];

  const proofOfDelivery = [
    {
      service: "Combine Harvester",
      vendor: "Suresh Agri Services",
      timestamp: "2024-01-15 14:30",
      location: "12.9716°N, 77.5946°E",
      photos: ["Before", "During", "After"],
      receipt: "INV-2024-001",
      rating: 4.8,
      status: "Completed"
    }
  ];

  return (
    <div className="min-h-screen field-gradient">
      <AgriChatAgent />
      <AgriAIPilotSidePeek
        agentType="HarvestBot"
        agentName="HarvestBot"
        agentNameTelugu="హార్వెస్ట్‌బాట్"
        services={harvestBotServices}
      />

      <div className="max-w-full mx-auto px-1 py-2">
        {/* AI Computer Vision Detection Section */}
        <Card className="agri-card mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Camera className="w-6 h-6 text-primary" />
              AI Computer Vision Detection | AI కంప్యూటర్ విజన్ గుర్తింపు
            </h2>
            
            <Tabs defaultValue="pest-disease" className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="pest-disease">Pest & Disease</TabsTrigger>
                <TabsTrigger value="quality">Quality Analysis</TabsTrigger>
                <TabsTrigger value="weather">Weather Impact</TabsTrigger>
                <TabsTrigger value="marketplace">Vendor Services</TabsTrigger>
              </TabsList>

              <TabsContent value="pest-disease" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg bg-gradient-field">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Scan className="w-4 h-4 text-destructive" />
                      Pest Detection
                    </h3>
                    {cvDetectionData.pestDetection.map((pest, index) => (
                      <div key={index} className="mb-3 p-3 bg-destructive/10 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{pest.pest}</span>
                          <Badge variant="destructive">{pest.confidence}% confidence</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">Location: {pest.location}</p>
                        <p className="text-sm font-medium text-destructive">{pest.recommendation}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 border border-border rounded-lg bg-gradient-field">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-warning" />
                      Disease Detection
                    </h3>
                    {cvDetectionData.diseaseDetection.map((disease, index) => (
                      <div key={index} className="mb-3 p-3 bg-warning/10 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{disease.disease}</span>
                          <Badge variant="secondary">{disease.confidence}% confidence</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">Location: {disease.location}</p>
                        <p className="text-sm font-medium text-warning">{disease.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button className="agri-button-primary">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Upload Phone Image
                  </Button>
                  <Button variant="outline">
                    <Camera className="w-4 h-4 mr-2" />
                    Schedule Drone Scan
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="quality" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-border rounded-lg bg-gradient-field">
                    <h3 className="font-semibold mb-4">Quality Metrics</h3>
                    <div className="space-y-3">
                      {Object.entries(cvDetectionData.qualityAnalysis).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 border border-border rounded-lg bg-gradient-field">
                    <h3 className="font-semibold mb-4">AI Recommendations</h3>
                    <div className="space-y-2">
                      <p className="text-sm">✓ Optimal harvest window: Next 5-7 days</p>
                      <p className="text-sm">✓ Expected yield: 18-22 quintals/acre</p>
                      <p className="text-sm">⚠ Monitor moisture levels daily</p>
                      <p className="text-sm">✓ Grade A quality achievable</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="weather" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg bg-gradient-field">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-primary" />
                      Current Conditions
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Temperature:</span>
                        <span className="font-medium">{weatherData.current.temp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Humidity:</span>
                        <span className="font-medium">{weatherData.current.humidity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wind Speed:</span>
                        <span className="font-medium">{weatherData.current.wind}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-border rounded-lg bg-gradient-field">
                    <h3 className="font-semibold mb-3">Harvest Score Forecast</h3>
                    {weatherData.forecast.map((day, index) => (
                      <div key={index} className="flex justify-between items-center mb-2">
                        <span className="text-sm">{day.day}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{day.condition}</span>
                          <Progress value={day.harvestScore} className="w-20 h-2" />
                          <span className="text-xs font-medium">{day.harvestScore}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="marketplace" className="space-y-4">
                {vendorMarketplace.map((category, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg bg-gradient-field">
                    <h3 className="font-semibold mb-3">{category.category}</h3>
                    <div className="space-y-3">
                      {category.vendors.map((vendor, vIndex) => (
                        <div key={vIndex} className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                          <div>
                            <p className="font-medium">{vendor.name}</p>
                            <p className="text-sm text-muted-foreground">{vendor.distance} away</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{vendor.price}</p>
                            <p className="text-xs text-muted-foreground">{vendor.rating} ⭐ | SLA: {vendor.sla}</p>
                            <Badge variant={vendor.availability === "Available" ? "default" : "secondary"} className="mt-1">
                              {vendor.availability}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Harvest Calendar & Planning */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="agri-card">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Harvest Calendar | కోత క్యాలెండర్
                </h2>
                
                <div className="space-y-4">
                  {harvestCalendar.map((item, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${
                      item.status === 'ready' 
                        ? 'bg-success/10 border-success/20' 
                        : 'bg-warning/10 border-warning/20'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{item.crop}</h3>
                          <p className="text-accent font-medium">{item.telugu}</p>
                          <p className="text-sm text-muted-foreground">{item.area}</p>
                        </div>
                        <Badge 
                          variant={item.status === 'ready' ? 'default' : 'secondary'}
                          className={item.status === 'ready' ? 'bg-success text-success-foreground' : ''}
                        >
                          {item.status === 'ready' ? '✓ Ready to Harvest' : '⏱ Monitoring'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Expected Date</p>
                          <p className="font-semibold">{item.expectedDate}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expected Yield</p>
                          <p className="font-semibold">{item.yield}</p>
                        </div>
                      </div>
                      
                      {item.status === 'ready' && (
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" className="agri-button-primary">
                            Book Machinery
                          </Button>
                          <Button size="sm" variant="outline">
                            Schedule Labor
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="agri-card">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Tractor className="w-5 h-5 text-primary" />
                  Harvest Machinery Booking
                </h2>
                
                <div className="mb-6">
                  <div className="relative">
                    <img 
                      src="/harvesting-realistic.jpg" 
                      alt="Large harvesting combine machine in wheat field"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                      <Button 
                        size="lg" 
                        className="bg-white/90 hover:bg-white text-black"
                      >
                        <PlayCircle className="w-6 h-6 mr-2" />
                        Watch Live Demo
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {machinery.map((machine, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{machine.type}</h3>
                          <p className="text-sm text-accent font-medium">{machine.telugu}</p>
                          <p className="text-sm text-muted-foreground">{machine.operator}</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={machine.availability === 'Available' ? 'default' : 'secondary'}
                            className={machine.availability === 'Available' ? 'bg-success text-success-foreground' : ''}
                          >
                            {machine.availability}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{machine.rating} ⭐</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Rate</p>
                          <p className="font-semibold">{machine.rate}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Distance</p>
                          <p className="font-semibold">{machine.distance}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className={machine.availability === 'Available' ? 'agri-button-primary' : 'agri-button-secondary'} 
                          disabled={machine.availability !== 'Available'}
                        >
                          {machine.availability === 'Available' ? 'Book Now' : 'Join Waitlist'}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Phone className="w-3 h-3 mr-1" />
                          Call
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Labor Booking & Status */}
          <div className="space-y-6">
            <Card className="agri-card">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Labor Teams
                </h2>
                
                <div className="space-y-4">
                  {laborTeams.map((team, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{team.leader}</h3>
                          <p className="text-sm text-accent font-medium">{team.telugu}</p>
                          <p className="text-xs text-muted-foreground">{team.specialty}</p>
                        </div>
                        <Badge className="bg-success text-success-foreground">Available</Badge>
                      </div>
                      
                         <div className="space-y-2 text-sm mb-3">
                         <div className="flex justify-between">
                           <span>Workers:</span>
                           <span className="font-semibold">{team.workers}</span>
                         </div>
                         <div className="flex justify-between">
                           <span>Experience:</span>
                           <span className="font-semibold">{team.experience}</span>
                         </div>
                         <div className="flex justify-between">
                           <span>Rate:</span>
                           <span className="font-semibold">{team.rate}</span>
                         </div>
                         <div className="flex justify-between">
                           <span>Rating:</span>
                           <span className="font-semibold">{team.rating} ⭐</span>
                         </div>
                         <div className="flex justify-between">
                           <span>Insurance:</span>
                           <Badge variant="default" className="bg-success text-success-foreground">{team.insurance}</Badge>
                         </div>
                       </div>
                       
                       <div className="mb-3">
                         <p className="text-xs text-muted-foreground mb-1">Certifications:</p>
                         <div className="flex flex-wrap gap-1">
                           {team.certifications.map((cert, cIndex) => (
                             <Badge key={cIndex} variant="outline" className="text-xs">{cert}</Badge>
                           ))}
                         </div>
                       </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" className="agri-button-primary">
                          Book Team
                        </Button>
                        <Button size="sm" variant="outline">
                          <Phone className="w-3 h-3 mr-1" />
                          Call
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="agri-card">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Harvest Summary</h2>
                
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gradient-field rounded-lg border border-primary/20">
                    <div className="text-2xl font-bold text-primary">20.7 Acres</div>
                    <p className="text-sm font-semibold">Total Area Ready</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-success/10 rounded-lg">
                      <p className="text-lg font-bold text-success">₹45,000</p>
                      <p className="text-xs">Estimated Revenue</p>
                    </div>
                    <div className="text-center p-3 bg-warning/10 rounded-lg">
                      <p className="text-lg font-bold text-warning">₹8,500</p>
                      <p className="text-xs">Harvest Costs</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="agri-card">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                
                <div className="space-y-3">
                  <Button className="w-full agri-button-primary">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Full Harvest
                  </Button>
                  
                  <Button className="w-full agri-button-secondary">
                    <Tractor className="w-4 h-4 mr-2" />
                    Emergency Machinery
                  </Button>
                  
                  <Button className="w-full" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Labor Coordinator
                  </Button>
                  
                  <Button className="w-full" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    AI Quality Scan
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="agri-card">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-primary" />
                  Proof of Delivery
                </h2>
                
                {proofOfDelivery.map((pod, index) => (
                  <div key={index} className="p-3 border border-border rounded-lg bg-gradient-field">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">{pod.service}</p>
                        <p className="text-xs text-muted-foreground">{pod.vendor}</p>
                      </div>
                      <Badge className="bg-success text-success-foreground">{pod.status}</Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Time: {pod.timestamp}</p>
                      <p>Location: {pod.location}</p>
                      <p>Photos: {pod.photos.join(", ")}</p>
                      <p>Receipt: {pod.receipt}</p>
                      <p>Rating: {pod.rating} ⭐</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
        
        <AgentVideoSection
          agentName="HarvestBot"
          agentNameTelugu="కోత యంత్రం"
          videos={[
            {
              title: "Automated Harvesting Operations",
              titleTelugu: "స్వయంచాలిత కోత కార్యకలాపాలు", 
              duration: "12:50",
              type: "demo"
            },
            {
              title: "Harvest Planning & Coordination",
              titleTelugu: "కోత ప్రణాళిక & సమన్వయం",
              duration: "10:35",
              type: "tutorial"
            },
            {
              title: "50% Time Reduction in Harvesting",
              titleTelugu: "కోతలో 50% సమయం ఆదా",
              duration: "8:10",
              type: "case-study"
            }
          ]}
        />
      </div>
      
    </div>
  );
};

export default HarvestBot;