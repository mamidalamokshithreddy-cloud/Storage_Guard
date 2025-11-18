'use client';

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Truck, MapPin, DollarSign, Thermometer, Package, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react"; 

import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import AgentVideoSection from "../AgentVideoSection";
import ProductCatalog from "../processinghub/ProductCatalog";
import ShoppingCartComponent from "../processinghub/ShoppingCart";
import { useShoppingCart } from "../marketconnect/ShoppingCartContext";

interface ConsumerDeliveryProps {
  onRouteOptimizationClick?: () => void;
  onFleetManagementClick?: () => void;
  onOrderTrackingClick?: () => void;
  onDeliveryAnalyticsClick?: () => void;
}

const ConsumerDelivery: React.FC<ConsumerDeliveryProps> = ({
  onRouteOptimizationClick,
  onFleetManagementClick,
  onOrderTrackingClick,
  onDeliveryAnalyticsClick
}) => {
  const router = useRouter();
  const [selectedDelivery, setSelectedDelivery] = useState("subscription");
  const [activeTab, setActiveTab] = useState("delivery");
  const [selectedModule, setSelectedModule] = useState<string>("order");
  
  // Safely use the shopping cart hook with error boundary
  let shoppingCartHook;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    shoppingCartHook = useShoppingCart();
  } catch (error) {
    console.error("ShoppingCart context error:", error);
    // Provide fallback values
    shoppingCartHook = {
      cartItems: [],
      cartItemsMap: {},
      addToCart: () => {},
      updateQuantity: () => {},
      removeFromCart: () => {},
      clearCart: () => {},
      getTotalItems: () => 0,
      getTotalAmount: () => 0
    };
  }
  
  const { cartItems, cartItemsMap, addToCart, updateQuantity, removeFromCart, clearCart } = shoppingCartHook;

  const deliveryModes = [
    {
      id: "subscription",
      name: "Smart Subscription Box",
      nameTeugu: "స్మార్ట్ సబ్స్క్రిప్షన్ బాక్స్",
      icon: <Package className="w-6 h-6" />,
      description: "AI-curated weekly/monthly fresh produce delivery",
      price: "₹899/month",
      discount: "15% off + Free Delivery",
      features: ["AI-curated selection", "Flexible scheduling", "Quality guarantee"]
    },
    {
      id: "direct",
      name: "Express Direct Order",
      nameTeugu: "ఎక్స్‌ప్రెస్ డైరెక్ట్ ఆర్డర్",
      icon: <Zap className="w-6 h-6" />,
      description: "On-demand fresh produce with same-day delivery",
      price: "₹50 delivery",
      discount: "Free above ₹500",
      features: ["Same-day delivery", "2-hour slots", "Live tracking"]
    },
    {
      id: "bulk",
      name: "Bulk Order Logistics",
      nameTeugu: "బల్క్ ఆర్డర్ లాజిస్టిక్స్",
      icon: <Truck className="w-6 h-6" />,
      description: "Commercial & restaurant bulk delivery service",
      price: "₹100 delivery",
      discount: "Volume discounts available",
      features: ["Commercial pricing", "Scheduled delivery", "Invoice support"]
    },
    {
      id: "cold-chain",
      name: "Premium Cold Chain",
      nameTeugu: "ప్రీమియం కోల్డ్ చైన్",
      icon: <Thermometer className="w-6 h-6" />,
      description: "Temperature-controlled delivery for premium products",
      price: "₹120 delivery",
      discount: "Extended freshness guarantee",
      features: ["Temperature monitored", "Extended shelf life", "Premium packaging"]
    }
  ];

  // const fleetManagement = [
  //   { vehicle: "Refrigerated Van #001", status: "Active", location: "Hyderabad Zone", temperature: "4°C", capacity: "80%", driver: "Ramesh Kumar", phone: "+91 98765 43210" },
  //   { vehicle: "Electric Bike #025", status: "Active", location: "Warangal Center", temperature: "Ambient", capacity: "60%", driver: "Priya Sharma", phone: "+91 87654 32109" },
  //   { vehicle: "Cargo Truck #008", status: "Maintenance", location: "Service Center", temperature: "-", capacity: "0%", driver: "-", phone: "-" },
  //   { vehicle: "Refrigerated Van #003", status: "Active", location: "Nizamabad Zone", temperature: "2°C", capacity: "95%", driver: "Suresh Reddy", phone: "+91 76543 21098" }
  // ];

  // const deliveryAnalytics = [
  //   { metric: "On-Time Delivery Rate", metricTelugu: "సమయానికి డెలివరీ రేటు", value: 94.5, target: 95, trend: "+1.2%" },
  //   { metric: "Customer Satisfaction", metricTelugu: "కస్టమర్ సంతృప్తి", value: 4.6, target: 4.8, trend: "+0.3" },
  //   { metric: "Cold Chain Compliance", metricTelugu: "కోల్డ్ చైన్ అనుపాలన", value: 98.2, target: 99, trend: "+0.8%" },
  //   { metric: "Delivery Cost Efficiency", metricTelugu: "డెలివరీ వ్యయ సామర్థ్యం", value: 87.3, target: 90, trend: "+2.1%" }
  // ];

  // const routeOptimization = [
  //   { zone: "Hyderabad Central", routes: 15, avgTime: "2.5 hrs", fuelSaved: "18%", deliveries: 45 },
  //   { zone: "Warangal District", routes: 8, avgTime: "3.1 hrs", fuelSaved: "22%", deliveries: 28 },
  //   { zone: "Nizamabad Region", routes: 6, avgTime: "2.8 hrs", fuelSaved: "15%", deliveries: 22 },
  //   { zone: "Khammam Area", routes: 4, avgTime: "3.5 hrs", fuelSaved: "20%", deliveries: 18 }
  // ];

  // const customerCommunication = [
  //   { stage: "Order Confirmation", method: "SMS + App Notification", timing: "Immediate", status: "Active" },
  //   { stage: "Dispatch Notification", method: "WhatsApp + Email", timing: "At Dispatch", status: "Active" },
  //   { stage: "Live Tracking Link", method: "SMS", timing: "En Route", status: "Active" },
  //   { stage: "Delivery Confirmation", method: "App + SMS", timing: "On Delivery", status: "Active" },
  //   { stage: "Feedback Request", method: "App Notification", timing: "1 Hour Post-Delivery", status: "Active" }
  // ];

  // const partnerNetwork = [
  //   { partner: "Fresh Express Logistics", type: "Last Mile", coverage: "Hyderabad Metro", rating: 4.8, orders: 1250 },
  //   { partner: "Cold Chain Solutions", type: "Temperature Control", coverage: "Telangana State", rating: 4.6, orders: 850 },
  //   { partner: "Green Mile Delivery", type: "Eco-Friendly", coverage: "Urban Areas", rating: 4.9, orders: 2100 },
  //   { partner: "Rural Connect", type: "Rural Delivery", coverage: "Remote Villages", rating: 4.4, orders: 650 }
  // ];

  const liveOrders = [
    {
      id: "ORD001",
      customer: "Rajesh Kumar",
      location: "Hyderabad",
      status: "In Transit",
      progress: 75,
      eta: "2 hours"
    },
    {
      id: "ORD002", 
      customer: "Priya Sharma",
      location: "Warangal",
      status: "Packed",
      progress: 50,
      eta: "4 hours"
    },
    {
      id: "ORD003",
      customer: "Arjun Reddy",
      location: "Nizamabad",
      status: "Delivered",
      progress: 100,
      eta: "Completed"
    }
  ];

  const pricingBreakdown = {
    farmerPrice: 250,
    processing: 50,
    packaging: 25,
    delivery: 50,
    platform: 25,
    total: 400
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-white-100">
      
      
      <div className="ml-0 lg:ml-0">{/* Content area with sidebar spacing */}
        {/* Header
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between max-w-full mx-auto">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/packaging-branding')} variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Packaging
              </Button>
              <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                🚛 Consumer Delivery | వినియోగదారు డెలివరీ
              </h1>
            </div>
            <div className="flex gap-2">
              <div className="flex gap-2">
                <Button 
                  variant={activeTab === "products" ? "default" : "outline"}
                  onClick={() => setActiveTab("products")}
                  className="flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Fresh Market ({getTotalItems()})
                </Button>
                <Button 
                  variant={activeTab === "cart" ? "default" : "outline"}
                  onClick={() => setActiveTab("cart")}
                >
                  Cart ({getTotalItems()})
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/consumer-feedback')} className="agri-button-primary flex items-center gap-2">
                  Next: Feedback <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header> */}

        {/* Hero Section */}
        <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
          <img 
            src="/delivery-truck.jpg" 
            alt="Farmer-to-consumer delivery truck"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-2">Fresh Farm-to-Door Delivery</h2>
              <p className="text-xl">Direct connection between farmers and consumers</p>
            </div>
          </div>
        </div>

        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Main Content */}
          <div className="grid grid-cols-8 gap-6">
            <div className="col-span-9 space-y-6">
              {activeTab === "delivery" && (
                <>
                  {/* Delivery Management Navigation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card 
                      className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 ${selectedModule === "route" ? 'ring-2 ring-primary border-primary' : 'hover:border-primary'}`}
                      onClick={() => {
                        setSelectedModule("route");
                        if (onRouteOptimizationClick) {
                          onRouteOptimizationClick();
                        } else {
                          router.push("/consumer-delivery/RouteOptimization");
                        }
                      }}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">🗺️</div>
                        <h3 className="font-semibold text-lg mb-1">Route Planning</h3>
                        <p className="text-primary font-medium text-sm mb-2">రూట్ ప్లానింగ్</p>
                        <p className="text-xs text-muted-foreground">AI-powered delivery optimization</p>
                        <Button size="sm" className="w-full mt-3 agri-button-primary">
                          Open Module
                        </Button>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 ${selectedModule === "fleet" ? 'ring-2 ring-primary border-primary' : 'hover:border-primary'}`}
                      onClick={() => {
                        setSelectedModule("fleet");
                        if (onFleetManagementClick) {
                          onFleetManagementClick();
                        } else {
                          router.push("/consumer-delivery/FleetManagement");
                        }
                      }}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">🚛</div>
                        <h3 className="font-semibold text-lg mb-1">Fleet Management</h3>
                        <p className="text-primary font-medium text-sm mb-2">ఫ్లీట్ మేనేజ్‌మెంట్</p>
                        <p className="text-xs text-muted-foreground">Vehicle tracking & maintenance</p>
                        <Button size="sm" className="w-full mt-3 agri-button-primary">
                          Open Module
                        </Button>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 ${selectedModule === "order" ? 'ring-2 ring-primary border-primary' : 'hover:border-primary'}`}
                      onClick={() => {
                        setSelectedModule("order");
                        if (onOrderTrackingClick) {
                          onOrderTrackingClick();
                        } else {
                          router.push("/consumer-delivery/OrderTracking");
                        }
                      }}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">📦</div>
                        <h3 className="font-semibold text-lg mb-1">Order Tracking</h3>
                        <p className="text-primary font-medium text-sm mb-2">ఆర్డర్ ట్రాకింగ్</p>
                        <p className="text-xs text-muted-foreground">Real-time GPS tracking</p>
                        <Button size="sm" className="w-full mt-3 agri-button-primary">
                          Open Module
                        </Button>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 ${selectedModule === "analytics" ? 'ring-2 ring-primary border-primary' : 'hover:border-primary'}`}
                      onClick={() => {
                        setSelectedModule("analytics");
                        if (onDeliveryAnalyticsClick) {
                          onDeliveryAnalyticsClick();
                        } else {
                          router.push("/consumer-delivery/DeliveryAnalytics");
                        }
                      }}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">📊</div>
                        <h3 className="font-semibold text-lg mb-1">Delivery Analytics</h3>
                        <p className="text-primary font-medium text-sm mb-2">డెలివరీ అనలిటిక్స్</p>
                        <p className="text-xs text-muted-foreground">Performance & cost analytics</p>
                        <Button size="sm" className="w-full mt-3 agri-button-primary">
                          Open Module
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Delivery Modes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Select Delivery Mode | డెలివరీ మోడ్ ఎంచుకోండి
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {deliveryModes.map((mode) => (
                          <Card 
                            key={mode.id}
                            className={`cursor-pointer transition-all hover:shadow-lg ${
                              selectedDelivery === mode.id ? 'ring-2 ring-primary border-primary' : ''
                            }`}
                            onClick={() => setSelectedDelivery(mode.id)}
                          >
                            <CardContent className="p-4 text-center">
                              <div className="text-primary mb-3 flex justify-center">{mode.icon}</div>
                              <h3 className="font-semibold text-lg">{mode.name}</h3>
                              <p className="text-primary font-medium text-sm">{mode.nameTeugu}</p>
                              <p className="text-muted-foreground text-xs mb-3">{mode.description}</p>
                              <div className="space-y-2">
                                <Badge variant="outline" className="text-base">{mode.price}</Badge>
                                <Badge variant="default" className="block bg-green-500">{mode.discount}</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Live GPS Tracking */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Live Order Tracking | లైవ్ ఆర్డర్ ట్రాకింగ్
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {liveOrders.map((order) => (
                          <Card key={order.id} className="border-l-4 border-l-primary">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h3 className="font-semibold text-lg">{order.id}</h3>
                                  <p className="text-muted-foreground">{order.customer} • {order.location}</p>
                                </div>
                                <div className="text-right">
                                  <Badge 
                                    variant={order.status === 'Delivered' ? 'default' : 'secondary'}
                                    className={order.status === 'In Transit' ? 'bg-yellow-500' : ''}
                                  >
                                    {order.status}
                                  </Badge>
                                  <p className="text-sm text-muted-foreground mt-1">ETA: {order.eta}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Progress value={order.progress} className="flex-1" />
                                <span className="text-sm font-medium">{order.progress}%</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transparent Pricing */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Transparent Pricing Breakdown | పారదర్శక ధర వివరణ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg mb-4">Cost Distribution | వ్యయ పంపిణీ</h3>
                          {[
                            { label: "Farmer Price", labelTeugu: "రైతు ధర", amount: pricingBreakdown.farmerPrice, color: "bg-green-500" },
                            { label: "Processing", labelTeugu: "ప్రాసెసింగ్", amount: pricingBreakdown.processing, color: "bg-blue-500" },
                            { label: "Packaging", labelTeugu: "ప్యాకేజింగ్", amount: pricingBreakdown.packaging, color: "bg-yellow-500" },
                            { label: "Delivery", labelTeugu: "డెలివరీ", amount: pricingBreakdown.delivery, color: "bg-purple-500" },
                            { label: "Platform Fee", labelTeugu: "ప్లాట్‌ఫాం రుసుము", amount: pricingBreakdown.platform, color: "bg-gray-500" },
                          ].map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded ${item.color}`}></div>
                                <div>
                                  <p className="font-medium">{item.label}</p>
                                  <p className="text-sm text-primary">{item.labelTeugu}</p>
                                </div>
                              </div>
                              <p className="font-semibold text-lg">₹{item.amount}</p>
                            </div>
                          ))}
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-6 text-center">
                          <h3 className="text-2xl font-bold text-primary mb-2">Total Price</h3>
                          <p className="text-4xl font-bold text-green-600 mb-4">₹{pricingBreakdown.total}</p>
                          <div className="space-y-2 text-sm">
                            <p><strong>Farmer Gets:</strong> ₹{pricingBreakdown.farmerPrice} (62.5%)</p>
                            <p><strong>Processing Costs:</strong> ₹{pricingBreakdown.processing + pricingBreakdown.packaging} (18.75%)</p>
                            <p><strong>Delivery & Platform:</strong> ₹{pricingBreakdown.delivery + pricingBreakdown.platform} (18.75%)</p>
                          </div>
                          <Badge variant="default" className="mt-4 bg-green-500">
                            💚 Fair Trade Certified
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Video Section */}
                  <AgentVideoSection
                    agentName="FreshLink"
                    agentNameTelugu="ఫ్రెష్‌లింక్"
                    videos={[
                      {
                        title: "Live GPS Tracking System",
                        titleTelugu: "లైవ్ GPS ట్రాకింగ్ సిస్టమ్",
                        duration: "4:20",
                        type: "demo"
                      },
                      {
                        title: "Cold Chain Delivery Process",
                        titleTelugu: "కోల్డ్ చైన్ డెలివరీ ప్రక్రియ",
                        duration: "6:15",
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
                    setActiveTab("delivery");
                    // Show success message
                  }}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="col-span-3">
              <AgriAIPilotSidePeek 
                agentType="Delivery"
                agentName="FreshLink"
                agentNameTelugu="ఫ్రెష్‌లింక్"
                services={[
                  {
                    title: "Delivery Route Optimization",
                    titleTelugu: "డెలివరీ రూట్ ఆప్టిమైజేషన్",
                    description: "AI-powered delivery route planning and cost optimization",
                    descriptionTelugu: "AI ఆధారిత డెలివరీ రూట్ ప్రణాళిక మరియు వ్యయ ఆప్టిమైజేషన్",
                    duration: "1 hour",
                    price: "₹1,000",
                    icon: Truck,
                    available: true
                  },
                  {
                    title: "Cold Chain Setup",
                    titleTelugu: "కోల్డ్ చైన్ సెటప్",
                    description: "Professional cold chain delivery system setup",
                    descriptionTelugu: "వృత్తిపరమైన కోల్డ్ చైన్ డెలివరీ సిస్టమ్ సెటప్",
                    duration: "3 hours",
                    price: "₹2,500",
                    icon: Thermometer,
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

export default ConsumerDelivery;