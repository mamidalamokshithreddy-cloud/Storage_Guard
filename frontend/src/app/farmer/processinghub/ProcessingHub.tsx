import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Upload, Snowflake, Package, Beaker, Scale, Thermometer, Clock, Zap, Droplets, Wheat, Factory, Microscope, Shield, BarChart3, Award } from "lucide-react";

import { useState } from "react";

import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import AgentVideoSection from "../AgentVideoSection";
import ProductCatalog from "../processinghub/ProductCatalog";
import ShoppingCartComponent from "../processinghub/ShoppingCart";
import { useShoppingCart } from "../marketconnect/ShoppingCartContext";
import AgriChatAgent from "../AgriChatAgent";


// Icon mapping for sidebar agent services
const iconMap = {
  Microscope,
  Snowflake,
  Zap,
  Factory,
  Award,
};

interface ProcessingHubProps {
  onBackToDashboard?: () => void;
  onBatchTrackingClick?: () => void;
  onProductionPlanningClick?: () => void;
  onEquipmentManagementClick?: () => void;
}

const ProcessingHub = ({
  // onBackToDashboard,
  onBatchTrackingClick,
  onProductionPlanningClick,
  onEquipmentManagementClick
}: ProcessingHubProps = {}) => {
  const [activeTab, setActiveTab] = useState("processing");

  // Use the shopping cart hook
  const { cartItems, cartItemsMap, addToCart, updateQuantity, removeFromCart, clearCart } = useShoppingCart();

  const gradingStatus = [
    { lot: "LOT001", grade: "A", percentage: 85, status: "Completed" },
    { lot: "LOT002", grade: "B", percentage: 70, status: "In Progress" },
    { lot: "LOT003", grade: "A", percentage: 90, status: "Completed" },
  ];

  const processingOptions = [
    { name: "Cleaning & Washing", nameTelugu: "శుభ్రపరచడం", icon: <Droplets className="w-6 h-6" />, status: "Available", description: "Advanced cleaning and washing systems", price: "₹50/quintal" },
    { name: "Drying & Dehydration", nameTelugu: "ఎండబెట్టడం", icon: <Thermometer className="w-6 h-6" />, status: "Available", description: "Temperature controlled drying", price: "₹80/quintal" },
    { name: "Cold Storage", nameTelugu: "చల్లని నిల్వ", icon: <Snowflake className="w-6 h-6" />, status: "Available", description: "Multi-temperature cold storage", price: "₹120/month/quintal" },
    { name: "Packaging & Labeling", nameTelugu: "ప్యాకేజింగ్", icon: <Package className="w-6 h-6" />, status: "Available", description: "Custom packaging solutions", price: "₹25/unit" },
    { name: "Milling & Grinding", nameTelugu: "మిల్లింగ్", icon: <Wheat className="w-6 h-6" />, status: "Available", description: "Rice milling, flour grinding", price: "₹40/quintal" },
    { name: "Oil Extraction", nameTelugu: "నూనె వెలికితీత", icon: <Factory className="w-6 h-6" />, status: "Available", description: "Cold-pressed oil extraction", price: "₹200/quintal" },
    { name: "Sorting & Grading", nameTelugu: "క్రమబద్ధీకరణ", icon: <Scale className="w-6 h-6" />, status: "Available", description: "AI-powered sorting systems", price: "₹30/quintal" },
    { name: "Fermentation", nameTelugu: "కిణ్వన ప్రక్రియ", icon: <Clock className="w-6 h-6" />, status: "Available", description: "Controlled fermentation processes", price: "₹150/batch" }
  ];

  const qualityTestingServices = [
    { name: "Moisture Content", nameTelugu: "తేమ కంటెంట్", icon: <Beaker className="w-5 h-5" />, duration: "30 mins", price: "₹100" },
    { name: "Protein Analysis", nameTelugu: "ప్రోటీన్ విశ్లేషణ", icon: <Microscope className="w-5 h-5" />, duration: "2 hours", price: "₹300" },
    { name: "Pesticide Residue", nameTelugu: "క్రిమిసంహారక అవశేషాలు", icon: <Shield className="w-5 h-5" />, duration: "24 hours", price: "₹500" },
    { name: "Nutritional Profile", nameTelugu: "పోషక విశ్లేషణ", icon: <BarChart3 className="w-5 h-5" />, duration: "4 hours", price: "₹800" },
    { name: "Microbial Testing", nameTelugu: "సూక్ష్మజీవుల పరీక్ష", icon: <Microscope className="w-5 h-5" />, duration: "48 hours", price: "₹600" },
    { name: "Heavy Metals", nameTelugu: "భారీ లోహాలు", icon: <Beaker className="w-5 h-5" />, duration: "6 hours", price: "₹700" }
  ];

  const valueAddedServices = [
    { name: "Custom Blending", nameTelugu: "కస్టమ్ మిశ్రమం", description: "Specialized crop blending services", price: "₹60/quintal", available: true },
    { name: "Freeze Drying", nameTelugu: "ఫ్రీజ్ ఎండబెట్టడం", description: "Premium preservation method", price: "₹400/quintal", available: true },
    { name: "Powder Making", nameTelugu: "పొడిచేయడం", description: "Spice and grain powder production", price: "₹120/quintal", available: true },
    { name: "Organic Certification", nameTelugu: "సేంద్రీయ ధృవీకరణ", description: "Complete organic certification support", price: "₹5,000/batch", available: true },
    { name: "Export Packaging", nameTelugu: "ఎగుమతి ప్యాకేజింగ్", description: "International export standards", price: "₹80/unit", available: true },
    { name: "Traceability System", nameTelugu: "గుర్తింపు వ్యవస్థ", description: "Blockchain-based tracking", price: "₹20/quintal", available: true }
  ];

  const processingStats = [
    { label: "Daily Capacity", labelTelugu: "రోజువారీ సామర్థ్యం", value: "500 Quintals", trend: "+12%" },
    { label: "Processing Accuracy", labelTelugu: "ప్రాసెసింగ్ ఖచ్చితత్వం", value: "99.2%", trend: "+0.8%" },
    { label: "Quality Grade A", labelTelugu: "నాణ్యత గ్రేడ్ A", value: "85%", trend: "+5%" },
    { label: "Energy Efficiency", labelTelugu: "శక్తి సామర్థ్యం", value: "92%", trend: "+3%" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      {/* Custom Header */}
      {/* <header className="bg-white shadow-sm border-b p-4 mb-6">
        <div className="flex items-center justify-between max-w-full mx-auto">
          <div className="flex items-center gap-4">
            <Button onClick={onBackToDashboard} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              🏭 Processing & Grading Hub | ప్రాసెసింగ్ హబ్
            </h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={activeTab === "processing" ? "default" : "outline"}
              onClick={() => setActiveTab("processing")}
            >
              Processing Hub
            </Button>
            <Button 
              variant={activeTab === "products" ? "default" : "outline"}
              onClick={() => setActiveTab("products")}
              className="flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Farm Store ({getTotalItems()})
            </Button>
            <Button 
              variant={activeTab === "cart" ? "default" : "outline"}
              onClick={() => setActiveTab("cart")}
            >
              Cart ({getTotalItems()})
            </Button>
          </div>
        </div>
      </header> */}
      {/* Hero Section */}
      <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
        <img src="../public/processing-hub.jpg" alt="Food processing unit with farmers unloading produce" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center px-4 text-center">
          <div className="text-center text-white">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Farm Fresh Processing</h2>
            <p className="text-sm sm:text-base lg:text-xl">Quality grading and preparation for market</p>
          </div>
        </div>
      </div>
      <div className="max-w-full mx-auto p-6 grid grid-cols-8 gap-6">
        {/* Main Content */}
        <div className="col-span-9 space-y-6">
          {activeTab === "processing" && (
            <>
              {/* Quick Navigation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Processing Hub Navigation | ప్రాసెసింగ్ హబ్ నేవిగేషన్
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      onClick={onBatchTrackingClick}
                      variant="outline"
                      className="h-20 flex flex-col items-center gap-2 hover:bg-primary/5"
                    >
                      <Package className="w-8 h-8" />
                      <span className="text-center">
                        <div className="font-semibold">Batch Tracking</div>
                        <div className="text-xs text-muted-foreground">బ్యాచ్ ట్రాకింగ్</div>
                      </span>
                    </Button>
                    <Button
                      onClick={onProductionPlanningClick}
                      variant="outline"
                      className="h-20 flex flex-col items-center gap-2 hover:bg-primary/5"
                    >
                      <BarChart3 className="w-8 h-8" />
                      <span className="text-center">
                        <div className="font-semibold">Production Planning</div>
                        <div className="text-xs text-muted-foreground">ఉత్పాదన ప్రణాళిక</div>
                      </span>
                    </Button>
                    <Button
                      onClick={onEquipmentManagementClick}
                      variant="outline"
                      className="h-20 flex flex-col items-center gap-2 hover:bg-primary/5"
                    >
                      <Zap className="w-8 h-8" />
                      <span className="text-center">
                        <div className="font-semibold">Equipment Management</div>
                        <div className="text-xs text-muted-foreground">పరికరాల నిర్వహణ</div>
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Harvest Lot | హార్వెస్ట్ లాట్ అప్లోడ్
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto text-primary mb-4" />
                    <p className="text-lg mb-2">Drop harvest photos here or click to upload</p>
                    <p className="text-sm text-muted-foreground">JPG, PNG up to 10MB | హార్వెస్ట్ ఫోటోలు అప్లోడ్ చేయండి</p>
                    <Button className="mt-4 agri-button-primary">Choose Files</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Grading Status */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Grading Status | గ్రేడింగ్ స్థితి</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {gradingStatus.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Badge variant={item.grade === 'A' ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                            Grade {item.grade}
                          </Badge>
                          <div>
                            <p className="font-medium">{item.lot}</p>
                            <p className="text-sm text-muted-foreground">Quality Score: {item.percentage}%</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Progress value={item.percentage} className="w-32 mb-2" />
                          <p className="text-sm font-medium">{item.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Processing Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Processing Statistics | ప్రాసెసింగ్ గణాంకాలు
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {processingStats.map((stat, index) => (
                      <div key={index} className="p-4 bg-gradient-field rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary">{stat.value}</div>
                        <p className="text-sm font-medium">{stat.label}</p>
                        <p className="text-xs text-accent">{stat.labelTelugu}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {stat.trend}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Processing Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Processing Services | ప్రాసెసింగ్ సేవలు</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {processingOptions.map((option, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/30">
                        <CardContent className="p-4 text-center">
                          <div className="text-primary mb-3 flex justify-center">{option.icon}</div>
                          <h3 className="font-semibold text-lg mb-1">{option.name}</h3>
                          <p className="text-accent font-medium text-sm mb-2">{option.nameTelugu}</p>
                          <p className="text-xs text-muted-foreground mb-2">{option.description}</p>
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">{option.status}</Badge>
                            <span className="text-sm font-semibold text-primary">{option.price}</span>
                          </div>
                          <Button size="sm" className="w-full mt-3 agri-button-primary">
                            Book Service
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quality Testing Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Microscope className="w-5 h-5" />
                    Quality Testing Lab | నాణ్యత పరీక్ష ప్రయోగశాల
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {qualityTestingServices.map((test, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg bg-gradient-subtle hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-primary">{test.icon}</div>
                          <div>
                            <h4 className="font-semibold">{test.name}</h4>
                            <p className="text-sm text-accent">{test.nameTelugu}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm mb-3">
                          <span className="text-muted-foreground">Duration: {test.duration}</span>
                          <span className="font-semibold text-primary">{test.price}</span>
                        </div>
                        <Button size="sm" variant="outline" className="w-full">
                          Schedule Test
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Value Added Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Value Addition Services | విలువ సంవర్ధన సేవలు
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {valueAddedServices.map((service, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg bg-gradient-field">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{service.name}</h4>
                            <p className="text-sm text-accent font-medium">{service.nameTelugu}</p>
                            <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                          </div>
                          <Badge variant={service.available ? "default" : "secondary"} className="bg-success text-success-foreground">
                            Available
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-primary">{service.price}</span>
                          <Button size="sm" className="agri-button-primary">
                            Request Quote
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Processing Equipment Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="w-5 h-5" />
                    Equipment Status | పరికరాల స్థితి
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { equipment: "Sorting Machine #1", status: "Operational", efficiency: 98, nextMaintenance: "Jan 15, 2025" },
                      { equipment: "Cold Storage Unit A", status: "Operational", efficiency: 95, nextMaintenance: "Feb 2, 2025" },
                      { equipment: "Milling Unit", status: "Maintenance", efficiency: 0, nextMaintenance: "Ongoing" },
                      { equipment: "Packaging Line", status: "Operational", efficiency: 92, nextMaintenance: "Jan 28, 2025" }
                    ].map((equipment, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${equipment.status === 'Operational' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <div>
                            <p className="font-semibold">{equipment.equipment}</p>
                            <p className="text-sm text-muted-foreground">Next Maintenance: {equipment.nextMaintenance}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={equipment.status === 'Operational' ? 'default' : 'secondary'} className={equipment.status === 'Operational' ? 'bg-success text-success-foreground' : ''}>
                            {equipment.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            Efficiency: {equipment.efficiency}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Video Section */}
              <AgentVideoSection
                agentName="ProcessBot"
                agentNameTelugu="ప్రాసెస్‌బాట్"
                videos={[
                  {
                    title: "Sorting & Grading Machine Demo",
                    titleTelugu: "సార్టింగ్ & గ్రేడింగ్ మెషిన్ డెమో",
                    duration: "3:45",
                    type: "demo"
                  },
                  {
                    title: "Cold Storage Best Practices",
                    titleTelugu: "కోల్డ్ స్టోరేజ్ ఉత్తమ పద్ధతులు",
                    duration: "5:20",
                    type: "tutorial"
                  }
                ]}
              />
            </>
          )}

          {activeTab === "products" && (
            <ProductCatalog
              onAddToCart={addToCart}
              cartItems={cartItemsMap}
            />
          )}

          {activeTab === "cart" && (
            <ShoppingCartComponent
              cartItems={cartItems}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onCheckout={() => {
                clearCart();
                setActiveTab("processing");
                // Show success message
              }}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-3">
          
          <AgriAIPilotSidePeek
            agentType="Processing"
            agentName="ProcessBot"
            agentNameTelugu="ప్రాసెస్‌బాట్"
            services={[
              {
                title: "AI Quality Grading",
                titleTelugu: "AI నాణ్యత గ్రేడింగ్",
                description: "Advanced AI-powered quality assessment and grading",
                descriptionTelugu: "అధునాతన AI శక్తితో నాణ్యత మూల్యాంకనం",
                duration: "1 hour",
                price: "₹800",
                icon: iconMap["Microscope"],
                available: true
              },
              {
                title: "Cold Chain Setup",
                titleTelugu: "కోల్డ్ చైన్ సెటప్",
                description: "Complete cold storage and logistics planning",
                descriptionTelugu: "పూర్తి కోల్డ్ స్టోరేజ్ మరియు లాజిస్టిక్స్ ప్లానింగ్",
                duration: "2 hours",
                price: "₹1,500",
                icon: iconMap["Snowflake"],
                available: true
              },
              {
                title: "Value Addition Consulting",
                titleTelugu: "విలువ సంవర్ధన సలహా",
                description: "Strategic guidance for crop value enhancement",
                descriptionTelugu: "పంట విలువ పెంచడానికి వ్యూహాత్మక మార్గదర్శనం",
                duration: "1.5 hours",
                price: "₹1,200",
                icon: iconMap["Zap"],
                available: true
              },
              {
                title: "Processing Equipment Selection",
                titleTelugu: "ప్రాసెసింగ్ పరికరాల ఎంపిక",
                description: "Expert guidance for machinery selection and setup",
                descriptionTelugu: "యంత్రాల ఎంపిక మరియు సెటప్‌కు నిపుణుల మార్గదర్శనం",
                duration: "2 hours",
                price: "₹2,000",
                icon: iconMap["Factory"],
                available: true
              },
              {
                title: "Certification Support",
                titleTelugu: "ధృవీకరణ మద్దతు",
                description: "Complete support for organic and export certifications",
                descriptionTelugu: "సేంద్రీయ మరియు ఎగుమతి ధృవీకరణలకు పూర్తి మద్దతు",
                duration: "3 hours",
                price: "₹2,500",
                icon: iconMap["Award"],
                available: true
              }
            ]}
          />
        </div>
      </div>
      <AgriChatAgent/>
    </div>
    // </div>
  );
};

export default ProcessingHub;