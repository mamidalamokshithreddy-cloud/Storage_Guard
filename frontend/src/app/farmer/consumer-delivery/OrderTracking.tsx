import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ArrowLeft, MapPin, Package, Truck, Clock, Phone, Navigation } from "lucide-react";
import { useRouter } from "next/navigation"; 
import { useState } from "react";
// import AgriAgentsSidebar from "../AgriAgentsSidebar";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";

interface OrderTrackingProps {
  onNavigateBack?: () => void;
}

const OrderTracking: React.FC<OrderTrackingProps> = () => {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState("ORD001");

  const orders = [
    {
      id: "ORD001",
      customer: "Priya Sharma",
      customerTelugu: "ప్రియా శర్మ",
      phone: "+91 98765 43210",
      address: "Flat 301, Green Valley Apartments, Hyderabad",
      products: ["Organic Tomatoes 2kg", "Fresh Spinach 1kg", "Carrots 1kg"],
      orderValue: "₹450",
      status: "In Transit",
      progress: 75,
      driver: "Ramesh Kumar",
      driverPhone: "+91 87654 32109",
      vehicle: "Refrigerated Van #1",
      estimatedDelivery: "2:30 PM",
      actualDelivery: null,
      trackingSteps: [
        { step: "Order Placed", time: "10:15 AM", status: "completed" },
        { step: "Order Confirmed", time: "10:20 AM", status: "completed" },
        { step: "Packed & Ready", time: "11:45 AM", status: "completed" },
        { step: "Out for Delivery", time: "1:15 PM", status: "current" },
        { step: "Delivered", time: "Expected: 2:30 PM", status: "pending" }
      ]
    },
    {
      id: "ORD002",
      customer: "Rajesh Kumar",
      customerTelugu: "రాజేష్ కుమార్",
      phone: "+91 76543 21098",
      address: "House No. 245, MIG Colony, Warangal",
      products: ["Mixed Vegetables 3kg", "Fresh Coriander 250g"],
      orderValue: "₹320",
      status: "Packed",
      progress: 50,
      driver: "Suresh Reddy",
      driverPhone: "+91 65432 10987",
      vehicle: "Electric Bike #2",
      estimatedDelivery: "4:00 PM",
      actualDelivery: null,
      trackingSteps: [
        { step: "Order Placed", time: "12:30 PM", status: "completed" },
        { step: "Order Confirmed", time: "12:35 PM", status: "completed" },
        { step: "Packed & Ready", time: "1:45 PM", status: "current" },
        { step: "Out for Delivery", time: "Expected: 3:00 PM", status: "pending" },
        { step: "Delivered", time: "Expected: 4:00 PM", status: "pending" }
      ]
    },
    {
      id: "ORD003",
      customer: "Anitha Reddy",
      customerTelugu: "అనిత రెడ్డి",
      phone: "+91 54321 09876",
      address: "Plot No. 67, Nizamabad Road, Nizamabad",
      products: ["Organic Rice 5kg", "Fresh Tomatoes 2kg"],
      orderValue: "₹680",
      status: "Delivered",
      progress: 100,
      driver: "Prakash Singh",
      driverPhone: "+91 43210 98765",
      vehicle: "Cargo Truck #1",
      estimatedDelivery: "11:30 AM",
      actualDelivery: "11:25 AM",
      trackingSteps: [
        { step: "Order Placed", time: "8:15 AM", status: "completed" },
        { step: "Order Confirmed", time: "8:20 AM", status: "completed" },
        { step: "Packed & Ready", time: "9:30 AM", status: "completed" },
        { step: "Out for Delivery", time: "10:15 AM", status: "completed" },
        { step: "Delivered", time: "11:25 AM", status: "completed" }
      ]
    }
  ];

  const trackingStats = [
    { metric: "Orders in Transit", value: 15, trend: "+3" },
    { metric: "Average Delivery Time", value: "2.5 hrs", trend: "-15min" },
    { metric: "On-Time Delivery Rate", value: "94%", trend: "+2%" },
    { metric: "Customer Satisfaction", value: "4.7★", trend: "+0.2" }
  ];

  const selectedOrderData = orders.find(order => order.id === selectedOrder);

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
                📦 Order Tracking | ఆర్డర్ ట్రాకింగ్
              </h1>
            </div>
            <Button className="agri-button-primary flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Live Map View
            </Button>
          </div>

          <div className="space-y-6">
            {/* Tracking Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Live Tracking Dashboard | లైవ్ ట్రాకింగ్ డ్యాష్‌బోర్డ్
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {trackingStats.map((stat, index) => (
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
              </CardContent>
            </Card>

            <div className="grid grid-cols-8 gap-6">
              {/* Orders List */}
              <div className="col-span-5">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Active Orders | చురుకు ఆర్డర్లు
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <Card 
                          key={order.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedOrder === order.id ? 'ring-2 ring-primary border-primary' : 'border-border'
                          }`}
                          onClick={() => setSelectedOrder(order.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold">{order.id}</h3>
                                <p className="text-sm">{order.customer}</p>
                                <p className="text-xs text-primary">{order.customerTelugu}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant={
                                  order.status === 'Delivered' ? 'default' :
                                  order.status === 'In Transit' ? 'secondary' : 'outline'
                                }>
                                  {order.status}
                                </Badge>
                                <p className="text-sm font-medium mt-1">{order.orderValue}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Progress value={order.progress} className="flex-1" />
                              <span className="text-xs font-medium">{order.progress}%</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                ETA: {order.estimatedDelivery}
                              </span>
                              <span className="flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                {order.vehicle}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Details */}
              <div className="col-span-7">
                {selectedOrderData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Order Details: {selectedOrderData.id}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Customer & Delivery Info */}
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-semibold mb-3">Customer Information</h3>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Name:</span>
                                <p className="font-medium">{selectedOrderData.customer}</p>
                                <p className="text-primary text-xs">{selectedOrderData.customerTelugu}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Phone:</span>
                                <p className="font-medium">{selectedOrderData.phone}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Address:</span>
                                <p className="font-medium">{selectedOrderData.address}</p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-3">Delivery Information</h3>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Driver:</span>
                                <p className="font-medium">{selectedOrderData.driver}</p>
                                <p className="text-xs">{selectedOrderData.driverPhone}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Vehicle:</span>
                                <p className="font-medium">{selectedOrderData.vehicle}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1">
                                  <Phone className="w-4 h-4 mr-1" />
                                  Call Customer
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1">
                                  <Phone className="w-4 h-4 mr-1" />
                                  Call Driver
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Products */}
                        <div>
                          <h3 className="font-semibold mb-3">Order Items</h3>
                          <div className="bg-muted/20 p-3 rounded-lg">
                            <ul className="space-y-1 text-sm">
                              {selectedOrderData.products.map((product, index) => (
                                <li key={index} className="flex justify-between">
                                  <span>{product}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="border-t pt-2 mt-2 font-semibold">
                              Total: {selectedOrderData.orderValue}
                            </div>
                          </div>
                        </div>

                        {/* Tracking Timeline */}
                        <div>
                          <h3 className="font-semibold mb-3">Delivery Timeline</h3>
                          <div className="space-y-3">
                            {selectedOrderData.trackingSteps.map((step, index) => (
                              <div key={index} className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  step.status === 'completed' ? 'bg-green-500' :
                                  step.status === 'current' ? 'bg-blue-500' : 'bg-gray-300'
                                }`} />
                                <div className="flex-1">
                                  <div className="flex justify-between">
                                    <span className={`font-medium ${
                                      step.status === 'current' ? 'text-blue-600' : ''
                                    }`}>
                                      {step.step}
                                    </span>
                                    <span className="text-sm text-muted-foreground">{step.time}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Status */}
                        <div className="p-4 bg-gradient-field rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Current Status: {selectedOrderData.status}</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedOrderData.actualDelivery ? 
                                  `Delivered at ${selectedOrderData.actualDelivery}` :
                                  `Expected delivery: ${selectedOrderData.estimatedDelivery}`
                                }
                              </p>
                            </div>
                            <div className="text-right">
                              <Progress value={selectedOrderData.progress} className="w-24 mb-1" />
                              <p className="text-xs font-medium">{selectedOrderData.progress}% Complete</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Sidebar */}
      <AgriAIPilotSidePeek 
        agentType="Tracking Expert"
        agentName="Tracking AI Assistant"
        agentNameTelugu="ట్రాకింగ్ AI సహాయకుడు"
      />
      
      {/* Chat Agent */}
      <AgriChatAgent />
    </div>
  );
};

export default OrderTracking;