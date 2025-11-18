import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useRouter } from "next/navigation"; 
import { 
  ShoppingCart, 
  TrendingUp, 
  Globe, 
  IndianRupee, 
  Users, 
  FileText, 
  Award, 
  Video,
  AlertCircle,
  Package,
  Eye,
  Brain,
  BarChart3,
  Shield,
  Store
} from "lucide-react";
import AgriChatAgent from "../AgriChatAgent";
import AgentVideoSection from "../AgentVideoSection";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import CommodityMarketBoard from "./CommodityMarketBoard";
import ProductGrid from "./ProductGrid";
import ShoppingCartSidebar from "./ShoppingCartSidebar";
import { ShoppingCartProvider } from "./ShoppingCartContext";

const MarketConnect = () => {
  // const router = useRouter();

  const marketConnectServices = [
    {
      title: "AI Price Prediction",
      titleTelugu: "AI ధర అంచనా",
      description: "Machine learning powered price forecasting",
      descriptionTelugu: "మెషిన్ లెర్నింగ్ శక్తితో ధర అంచనా",
      duration: "Real-time",
      price: "₹300/analysis",
      icon: Brain,
      available: true
    },
    {
      title: "Market Trend Analysis",
      titleTelugu: "మార్కెట్ ట్రెండ్ విశ్లేషణ",
      description: "Expert insights on market trends and demand patterns",
      descriptionTelugu: "మార్కెట్ ట్రెండ్లు మరియు డిమాండ్ నమూనాలపై నిపుణుల అంతర్దృష్టి",
      duration: "1.5 hours",
      price: "₹700",
      icon: TrendingUp,
      available: true
    },
    {
      title: "Smart Contract Farming",
      titleTelugu: "స్మార్ట్ కాంట్రాక్ట్ వ్యవసాయం",
      description: "AI-powered contract farming opportunities",
      descriptionTelugu: "AI-శక్తితో కాంట్రాక్ట్ వ్యవసాయ అవకాశాలు",
      duration: "2-3 hours",
      price: "₹1,500",
      icon: FileText,
      available: true
    },
    {
      title: "Buyer Connection Network",
      titleTelugu: "కొనుగోలుదారుల కనెక్షన్ నెట్‌వర్క్",
      description: "AI-matched verified buyers and dealers",
      descriptionTelugu: "AI-మ్యాచ్ చేయబడిన ధృవీకరించబడిన కొనుగోలుదారులు",
      duration: "Instant matching",
      price: "₹1,000",
      icon: Users,
      available: true
    },
    {
      title: "Quality Certification Hub",
      titleTelugu: "నాణ్యత ధృవీకరణ కేంద్రం",
      description: "Complete quality certification and compliance",
      descriptionTelugu: "సంపూర్ణ నాణ్యత ధృవీకరణ మరియు సమ్మతి",
      duration: "1-2 hours",
      price: "₹800",
      icon: Award,
      available: true
    },
    {
      title: "Live Video Consultation",
      titleTelugu: "ప్రత్యక్ష వీడియో సలహా",
      description: "Instant expert guidance on market queries",
      descriptionTelugu: "మార్కెట్ ప్రశ్నలపై తక్షణ నిపుణుల మార్గదర్శనం",
      duration: "30 minutes",
      price: "₹400",
      icon: Video,
      available: true
    }
  ];

  const mandiRates = [
    { market: "Warangal Mandi", crop: "Cotton", rate: "₹6,200/quintal", change: "+2.3%", telugu: "వరంగల్ మండి" },
    { market: "Hyderabad APMC", crop: "Cotton", rate: "₹6,350/quintal", change: "+1.8%", telugu: "హైదరాబాద్ APMC" },
    { market: "Nizamabad Mandi", crop: "Soybean", rate: "₹4,800/quintal", change: "-0.5%", telugu: "నిజామాబాద్ మండి" },
    { market: "Karimnagar Market", crop: "Maize", rate: "₹2,100/quintal", change: "+3.2%", telugu: "కరీంనగర్ మార్కెట్" }
  ];

  const buyerBids = [
    {
      buyer: "AgriCorpIndia Ltd",
      crop: "Cotton",
      quantity: "500 quintals", 
      rate: "₹6,400/quintal",
      quality: "A Grade",
      location: "Hyderabad",
      delivery: "Farm pickup",
      status: "active",
      expires: "5 days"
    },
    {
      buyer: "Textile Mills Union",
      crop: "Cotton",
      quantity: "300 quintals",
      rate: "₹6,250/quintal", 
      quality: "B Grade",
      location: "Mumbai",
      delivery: "Ex-warehouse",
      status: "negotiable",
      expires: "3 days"
    },
    {
      buyer: "Export House Ltd",
      crop: "Cotton",
      quantity: "1000 quintals",
      rate: "₹6,100/quintal",
      quality: "Any Grade", 
      location: "Coimbatore",
      delivery: "Ex-farm",
      status: "bulk_order",
      expires: "7 days"
    }
  ];

  const exportOffers = [
    {
      importer: "Bangladesh Textile Corp",
      crop: "Cotton",
      quantity: "2000 quintals",
      rate: "₹6,800/quintal",
      port: "Kolkata",
      incoterm: "FOB",
      quality: "Middling",
      payment: "LC at sight"
    },
    {
      importer: "Vietnam Mills Ltd",
      crop: "Cotton",
      quantity: "1500 quintals", 
      rate: "₹6,950/quintal",
      port: "Chennai",
      incoterm: "CIF",
      quality: "Strict Middling",
      payment: "CAD"
    }
  ];

  const inventoryDetails = [
    {
      crop: "Cotton",
      variety: "Bt Cotton (BG-II)",
      quantity: "250 quintals",
      grade: "Middling",
      micronaire: "4.2",
      stapleLength: "28.5mm",
      harvestDate: "Dec 15, 2024",
      storageLocation: "Warehouse A - Bay 3", 
      temperature: "25°C",
      humidity: "62%",
      status: "Ready for Sale",
      certifications: ["Organic Certificate", "BCI Certificate"],
      estimatedValue: "₹15,50,000"
    },
    {
      crop: "Soybean",
      variety: "JS 335",
      quantity: "180 quintals",
      grade: "FAQ Grade",
      moisture: "11.5%",
      protein: "42.3%",
      oil: "19.8%",
      harvestDate: "Nov 28, 2024",
      storageLocation: "Silo C - Compartment 2",
      temperature: "20°C", 
      humidity: "58%",
      status: "Ready for Sale",
      certifications: ["Organic Certificate", "Non-GMO Certificate", "Export Quality"],
      estimatedValue: "₹4,56,000"
    }
  ];

  const qualityCertificates = [
    {
      type: "Organic Certification",
      issuer: "APEDA",
      number: "NPOP/NAB/001/2024",
      validUntil: "March 2025",
      crops: ["Cotton", "Soybean"],
      status: "Valid"
    },
    {
      type: "Export Quality Certificate", 
      issuer: "EIC (Export Inspection Council)",
      number: "EIC/AGR/789/2024",
      validUntil: "June 2025",
      crops: ["Cotton", "Soybean"],
      status: "Valid"
    },
    {
      type: "Phytosanitary Certificate",
      issuer: "Plant Quarantine Station",
      number: "PQS/HYD/456/2024", 
      validUntil: "Feb 2025",
      crops: ["Cotton"],
      status: "Valid"
    },
    {
      type: "Non-GMO Certificate",
      issuer: "Biotech Consortium India",
      number: "BCIL/NGO/123/2024",
      validUntil: "April 2025", 
      crops: ["Soybean"],
      status: "Valid"
    }
  ];

  const weatherImpact = {
    currentConditions: "Favorable", 
    temperature: "28°C / 18°C",
    humidity: "72%",
    rainfall: "2mm (last 24hrs)",
    forecast: [
      { day: "Today", condition: "Partly Cloudy", impact: "Neutral" },
      { day: "Tomorrow", condition: "Clear Sky", impact: "Positive" },  
      { day: "Day 3", condition: "Light Rain", impact: "Caution" }
    ],
    marketImpact: "Current weather conditions are favorable for harvesting and transportation. Expected price stability with slight upward trend due to quality crop conditions."
  };

  const aiMarketAnalysis = {
    pricePredicition: {
      cotton: { current: "₹6,200", predicted: "₹6,450", confidence: 87, trend: "upward" },
      soybean: { current: "₹4,800", predicted: "₹4,950", confidence: 82, trend: "upward" },
      maize: { current: "₹2,100", predicted: "₹2,050", confidence: 78, trend: "downward" }
    },
    marketSentiment: "Bullish",
    demandSupply: { demand: "High", supply: "Moderate", ratio: 1.3 },
    recommendation: "Favorable time to sell cotton and soybean. Consider holding maize for better prices."
  };

  const vendorServices = [
    {
      category: "Transportation",
      vendors: [
        { name: "LogiTrans Pro", service: "Farm to Market", rating: 4.8, price: "₹25/quintal", availability: "Available", sla: "Same day" },
        { name: "AgriMove Solutions", service: "Cold Chain", rating: 4.6, price: "₹35/quintal", availability: "Tomorrow", sla: "24 hours" }
      ]
    },
    {
      category: "Quality Testing",
      vendors: [
        { name: "QuickTest Labs", service: "Rapid Testing", rating: 4.9, price: "₹200/sample", availability: "Available", sla: "2 hours" },
        { name: "CertifyAgri", service: "Export Certification", rating: 4.7, price: "₹1,500/certificate", availability: "Available", sla: "48 hours" }
      ]
    },
    {
      category: "Storage Solutions",
      vendors: [
        { name: "StoreSafe", service: "Temporary Storage", rating: 4.5, price: "₹50/quintal/month", availability: "Available", sla: "Immediate" },
        { name: "AgroVault", service: "Climate Controlled", rating: 4.8, price: "₹80/quintal/month", availability: "Limited", sla: "Same day" }
      ]
    }
  ];

  const traceabilityData = [
    {
      product: "Cotton Bales",
      batchId: "CT-2024-001",
      origin: "Farm A-12, Warangal",
      harvest: "Dec 15, 2024",
      processing: "Ginning completed",
      quality: "Grade A, 28.5mm staple",
      blockchain: "0x7d8f3a...9c2e1b",
      certifications: ["Organic", "BCI"]
    }
  ];

  return (
    <ShoppingCartProvider>
        <AgriChatAgent />
        <AgriAIPilotSidePeek
          agentType="MarketConnect"
          agentName="MarketConnect"
          agentNameTelugu="మార్కెట్ కనెక్ట్"
          services={marketConnectServices}
        />

        <div className=" min-h-screen">
          
            <div className="flex-1">
              
            </div>
            <div className="fixed top-4 right-4 z-50">
              <ShoppingCartSidebar />
            </div>
          

          <div className="max-w-full mx-auto px-1 py-2">
            {/* E-Commerce Product Catalog */}
            <Card className="agri-card mb-8">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Store className="w-6 h-6 text-primary" />
                      Agricultural Products Marketplace | వ్యవసాయ ఉత్పాదాల మార్కెట్‌ప్లేస్
                    </h2>
                    <p className="text-muted-foreground mt-2">
                      Direct from farmers • Premium quality • Verified products • Competitive prices
                    </p>
                  </div>
                </div>
                
                <ProductGrid />
              </div>
            </Card>

            {/* Commodity Market Board */}
            <CommodityMarketBoard />
          
          {/* AI Market Intelligence & Analytics */}
          <Card className="agri-card mt-8 mb-8">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                AI Market Intelligence & Analytics | AI మార్కెట్ ఇంటెలిజెన్స్
              </h2>
              
              <Tabs defaultValue="price-prediction" className="w-full">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="price-prediction">Price Prediction</TabsTrigger>
                  <TabsTrigger value="vendor-services">Vendor Services</TabsTrigger>
                  <TabsTrigger value="traceability">Traceability</TabsTrigger>
                  <TabsTrigger value="analytics">Market Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="price-prediction" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(aiMarketAnalysis.pricePredicition).map(([crop, data]) => (
                      <div key={crop} className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20">
                        <h3 className="font-semibold mb-3 capitalize flex items-center gap-2">
                          <TrendingUp className={`w-4 h-4 ${data.trend === 'upward' ? 'text-success' : 'text-destructive'}`} />
                          {crop}
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Current:</span>
                            <span className="font-medium">{data.current}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Predicted:</span>
                            <span className={`font-medium ${data.trend === 'upward' ? 'text-success' : 'text-destructive'}`}>
                              {data.predicted}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Confidence:</span>
                            <span className="font-medium">{data.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 border border-border rounded-lg bg-gradient-field">
                    <h3 className="font-semibold mb-2">AI Recommendation</h3>
                    <p className="text-sm">{aiMarketAnalysis.recommendation}</p>
                    <div className="mt-3 flex gap-4 text-sm">
                      <span>Market Sentiment: <Badge className="bg-success text-success-foreground">{aiMarketAnalysis.marketSentiment}</Badge></span>
                      <span>Demand/Supply Ratio: <span className="font-medium">{aiMarketAnalysis.demandSupply.ratio}</span></span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="vendor-services" className="space-y-4">
                  {vendorServices.map((category, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20">
                      <h3 className="font-semibold mb-3">{category.category}</h3>
                      <div className="space-y-3">
                        {category.vendors.map((vendor, vIndex) => (
                          <div key={vIndex} className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                            <div>
                              <p className="font-medium">{vendor.name}</p>
                              <p className="text-sm text-muted-foreground">{vendor.service}</p>
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

                <TabsContent value="traceability" className="space-y-4">
                  {traceabilityData.map((item, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            {item.product}
                          </h3>
                          <p className="text-sm text-muted-foreground">Batch ID: {item.batchId}</p>
                        </div>
                        <Badge className="bg-success text-success-foreground">Verified</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Origin:</span>
                          <p className="font-medium">{item.origin}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Harvest:</span>
                          <p className="font-medium">{item.harvest}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Processing:</span>
                          <p className="font-medium">{item.processing}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quality:</span>
                          <p className="font-medium">{item.quality}</p>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-2">
                        Blockchain Hash: {item.blockchain}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {item.certifications.map((cert, cIndex) => (
                          <Badge key={cIndex} variant="outline" className="text-xs">{cert}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        Market Performance
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Weekly Growth:</span>
                          <span className="font-medium text-success">+12.3%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Trading Volume:</span>
                          <span className="font-medium">2,450 quintals</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Buyers:</span>
                          <span className="font-medium">156</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <span className="font-medium">94.7%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-border rounded-lg bg-gradient-to-br from-background to-muted/20">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-primary" />
                        Smart Insights
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p>✓ Cotton prices expected to rise 8-10% next week</p>
                        <p>⚠ Soybean supply shortage anticipated</p>
                        <p>✓ Export demand increasing for organic products</p>
                        <p>📈 New buyer registrations up 25%</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Market Rates & Buyer Bids */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="agri-card">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Live Mandi Rates | ప్రత్యక్ష మండి రేట్లు
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mandiRates.map((rate, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg bg-gradient-field">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{rate.market}</h3>
                            <p className="text-sm text-accent font-medium">{rate.telugu}</p>
                            <p className="text-sm text-muted-foreground">{rate.crop}</p>
                          </div>
                          <Badge 
                            variant={rate.change.includes('+') ? 'default' : 'destructive'}
                            className={rate.change.includes('+') ? 'bg-success text-success-foreground' : ''}
                          >
                            {rate.change}
                          </Badge>
                        </div>
                        
                        <div className="text-lg font-bold text-primary">{rate.rate}</div>
                        <p className="text-xs text-muted-foreground">Last updated: 2 hours ago</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="agri-card">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-primary" />
                    Buyer Bids | కొనుగోలుదారుల బిడ్లు
                  </h2>
                  
                  <div className="space-y-4">
                    {buyerBids.map((bid, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{bid.buyer}</h3>
                            <p className="text-sm text-muted-foreground">{bid.location}</p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={
                                bid.status === 'active' ? 'default' :
                                bid.status === 'negotiable' ? 'secondary' : 'outline'
                              }
                              className={bid.status === 'active' ? 'bg-success text-success-foreground' : ''}
                            >
                              {bid.status.replace('_', ' ')}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">Expires: {bid.expires}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-muted-foreground">Crop</p>
                            <p className="font-semibold">{bid.crop}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Quantity</p>
                            <p className="font-semibold">{bid.quantity}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rate</p>
                            <p className="font-semibold text-primary text-lg">{bid.rate}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Quality</p>
                            <p className="font-semibold">{bid.quality}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-sm"><span className="text-muted-foreground">Delivery:</span> {bid.delivery}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" className="agri-button-primary">
                            Accept Bid
                          </Button>
                          <Button size="sm" variant="outline">
                            Negotiate
                          </Button>
                          <Button size="sm" variant="outline">
                            Contact Buyer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Export Opportunities & Enhanced Information */}
            <div className="space-y-6">
              <Card className="agri-card">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Export Offers
                  </h2>
                  
                  <div className="space-y-4">
                    {exportOffers.map((offer, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg bg-gradient-field">
                        <h3 className="font-semibold mb-2">{offer.importer}</h3>
                        
                        <div className="space-y-2 text-sm mb-3">
                          <div className="flex justify-between">
                            <span>Crop:</span>
                            <span className="font-semibold">{offer.crop}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Quantity:</span>
                            <span className="font-semibold">{offer.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rate:</span>
                            <span className="font-semibold text-primary">{offer.rate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Port:</span>
                            <span className="font-semibold">{offer.port}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Terms:</span>
                            <span className="font-semibold">{offer.incoterm}</span>
                          </div>
                        </div>
                        
                        <Button size="sm" className="w-full agri-button-primary">
                          Apply for Export
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="agri-card">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Quality Certificates | నాణ్యత ధృవీకరణలు
                  </h2>
                  
                  <div className="space-y-3">
                    {qualityCertificates.map((cert, index) => (
                      <div key={index} className="p-3 border border-border rounded-lg bg-gradient-subtle">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm">{cert.type}</h4>
                          <Badge variant="default" className="bg-success text-success-foreground">
                            {cert.status}
                          </Badge>
                        </div>
                        
                        <div className="text-xs space-y-1 text-muted-foreground">
                          <p><span className="font-medium">Issuer:</span> {cert.issuer}</p>
                          <p><span className="font-medium">Number:</span> {cert.number}</p>
                          <p><span className="font-medium">Valid Until:</span> {cert.validUntil}</p>
                          <p><span className="font-medium">Crops:</span> {cert.crops.join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="agri-card">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    Weather Impact | వాతావరణ ప్రభావం
                  </h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                      <div>
                        <p className="font-semibold">Current Conditions</p>
                        <p className="text-sm text-muted-foreground">{weatherImpact.temperature}</p>
                      </div>
                      <Badge variant="default" className="bg-success text-success-foreground">
                        {weatherImpact.currentConditions}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {weatherImpact.forecast.map((day, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{day.day}</span>
                          <span className="text-muted-foreground">{day.condition}</span>
                          <Badge 
                            variant={day.impact === 'Positive' ? 'default' : day.impact === 'Neutral' ? 'secondary' : 'destructive'}
                            className={day.impact === 'Positive' ? 'bg-success text-success-foreground' : ''}
                          >
                            {day.impact}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-3 bg-success/10 rounded-lg">
                      <p className="text-sm font-medium">Market Impact:</p>
                      <p className="text-sm text-muted-foreground">{weatherImpact.marketImpact}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="agri-card">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                  
                  <div className="space-y-3">
                    <Button className="w-full agri-button-primary">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Create Sell Order
                    </Button>
                    
                    <Button className="w-full agri-button-secondary">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Price Alerts
                    </Button>
                    
                    <Button className="w-full" variant="outline">
                      <Globe className="w-4 h-4 mr-2" />
                      Export Inquiry
                    </Button>
                    
                    <Button className="w-full" variant="outline">
                      <Award className="w-4 h-4 mr-2" />
                      Quality Analysis
                    </Button>
                    
                    <Button className="w-full" variant="outline">
                      <Package className="w-4 h-4 mr-2" />
                      Storage Report
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          {/* Detailed Inventory Section */}
          <div className="-mt-2 space-y-6">
            <Card className="agri-card">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Package className="w-6 h-6 text-primary" />
                  Detailed Inventory Analysis | వివరణాత్మక జాబితా విశ్లేషణ
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {inventoryDetails.map((item, index) => (
                    <div key={index} className="p-6 border border-border rounded-lg bg-gradient-field">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold">{item.crop}</h3>
                          <p className="text-sm text-accent font-medium">{item.variety}</p>
                          <Badge variant="outline" className="mt-1">{item.grade}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{item.quantity}</p>
                          <p className="text-sm text-muted-foreground">{item.status}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-muted-foreground">Harvest Date</p>
                            <p className="font-semibold">{item.harvestDate}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Storage</p>
                            <p className="font-semibold">{item.storageLocation}</p>
                          </div>
                        </div>
                        
                        {item.micronaire && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-muted-foreground">Micronaire</p>
                              <p className="font-semibold">{item.micronaire}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Staple Length</p>
                              <p className="font-semibold">{item.stapleLength}</p>
                            </div>
                          </div>
                        )}
                        
                        {item.moisture && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-muted-foreground">Moisture</p>
                              <p className="font-semibold">{item.moisture}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Protein</p>
                              <p className="font-semibold">{item.protein}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-muted-foreground">Temperature</p>
                            <p className="font-semibold">{item.temperature}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Humidity</p>
                            <p className="font-semibold">{item.humidity}</p>
                          </div>
                        </div>
                        
                        <div className="pt-3 border-t">
                          <p className="text-muted-foreground mb-2">Certifications</p>
                          <div className="flex flex-wrap gap-1">
                            {item.certifications.map((cert, certIndex) => (
                              <Badge key={certIndex} variant="secondary" className="text-xs">
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="pt-3 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Estimated Value</span>
                            <span className="text-lg font-bold text-primary">{item.estimatedValue}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" className="agri-button-primary">
                          Create Sale Order
                        </Button>
                        <Button size="sm" variant="outline">
                          Quality Report
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>

        <AgentVideoSection
          agentName="Market Intelligence & Price Discovery"
          agentNameTelugu="మార్కెట్ ఇంటెలిజెన్స్ & ధర కనుగొనడం"
          videos={[
            {
              title: "Smart Price Discovery Using AI",
              titleTelugu: "AI ఉపయోగించి స్మార్ట్ ధర కనుగొనడం",
              duration: "12:45",
              type: "tutorial"
            },
            {
              title: "Direct Buyer Connection Success",
              titleTelugu: "ప్రత్యక్ష కొనుగోలుదారు కనెక్షన్ విజయం",
              duration: "8:20",
              type: "case-study"
            },
            {
              title: "Export Market Opportunities",
              titleTelugu: "ఎగుమతి మార్కెట్ అవకాశాలు",
              duration: "15:30",
              type: "tutorial"
            },
            {
              title: "Quality Certification Process",
              titleTelugu: "నాణ్యత ధృవీకరణ ప్రక్రియ",
              duration: "10:15",
              type: "tutorial"
            },
            {
              title: "Price Negotiation Techniques",
              titleTelugu: "ధర కనుగొనడం & చర్చలు",
              duration: "8:40",
              type: "tutorial"
            },
            {
              title: "25% Better Prices for Farmers",
              titleTelugu: "రైతులకు 25% మెరుగైన ధరలు", 
              duration: "9:30",
              type: "case-study"
            }
          ]}
        />
        </div>
      
    </ShoppingCartProvider>
  );
};

export default MarketConnect;