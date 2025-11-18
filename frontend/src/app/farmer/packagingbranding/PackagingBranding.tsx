import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

import { BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation"; 
import { useState } from "react";

import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import AgentVideoSection from "../AgentVideoSection";
import ProductCatalog from "../processinghub/ProductCatalog";
import ShoppingCartComponent from "../processinghub/ShoppingCart";
import { useShoppingCart } from "../marketconnect/ShoppingCartContext";

interface PackagingBrandingProps {
  onBrandComplianceClick?: () => void;
  onDesignStudioClick?: () => void;
  onLabelGeneratorClick?: () => void;
  onPrintManagementClick?: () => void;
}

const PackagingBranding: React.FC<PackagingBrandingProps> = ({
  onBrandComplianceClick,
  onDesignStudioClick,
  onLabelGeneratorClick,
  onPrintManagementClick
}) => {
  const router = useRouter();
  const [activeTab] = useState("packaging");
  
  // Use the shopping cart hook
  const { cartItems, cartItemsMap, addToCart, updateQuantity, removeFromCart, clearCart } = useShoppingCart();

  const packagingMetrics = [
    { metric: "Material Cost Efficiency", metricTelugu: "పదార్థ వ్యయ సామర్థ్యం", value: 87, trend: "+5%" },
    { metric: "Sustainability Score", metricTelugu: "స్థిరత్వ స్కోర్", value: 92, trend: "+8%" },
    { metric: "Print Quality Index", metricTelugu: "ప్రింట్ నాణ్యత సూచిక", value: 94, trend: "+2%" },
    { metric: "Customer Satisfaction", metricTelugu: "కస్టమర్ సంతృప్తి", value: 89, trend: "+3%" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-white-100">
      
      <div className="ml-0">{/* Content area with sidebar spacing */}
        {/* Header */}
        {/* <header className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between max-w-full mx-auto">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/farmer/qualityassurance')} variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Quality
              </Button>
              <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                📦 Packaging & Branding | ప్యాకేజింగ్ & బ్రాండింగ్
              </h1>
            </div>
            <div className="flex gap-2">
              <div className="flex gap-2">
                <Button onClick={() => router.push('/farmer/packagingbranding/design-studio')} className="agri-button-primary">
                  🎨 Design Studio
                </Button>
                <Button 
                  variant={activeTab === "products" ? "default" : "outline"}
                  onClick={() => setActiveTab("products")}
                  className="flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Branded Products ({getTotalItems()})
                </Button>
                <Button 
                  variant={activeTab === "cart" ? "default" : "outline"}
                  onClick={() => setActiveTab("cart")}
                >
                  Cart ({getTotalItems()})
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/farmer/consumer-delivery')} className="agri-button-primary flex items-center gap-2">
                  Next: Delivery <ArrowRight className="w-4 h-4" />
                </Button>
                <Button onClick={() => router.push('/farmer')} variant="outline">
                  <Home className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header> */}

        {/* Hero Section */}
        <div className="relative h-64 overflow-hidden">
          <img 
            src="./eco-packaging.jpg"
            alt="Eco-friendly branded boxes of fresh produce"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-2">Premium Packaging Solutions</h2>
              <p className="text-xl">Eco-friendly branding for market-ready produce</p>
            </div>
          </div>
        </div>

        <div className="max-w-full mx-auto p-6">
          <div className="col-span-9 space-y-6">
            {activeTab === "packaging" && (
              <>
                {/* Packaging & Branding Navigation */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary"
                    onClick={() => onDesignStudioClick ? onDesignStudioClick() : router.push("/farmer/packagingbranding/DesignStudio")}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">🎨</div>
                      <h3 className="font-semibold text-lg mb-1">Design Studio</h3>
                      <p className="text-primary font-medium text-sm mb-2">డిజైన్ స్టూడియో</p>
                      <p className="text-xs text-muted-foreground">Create logos, labels & package designs</p>
                      <Button size="sm" className="w-full mt-3 agri-button-secondary">
                        Open Module
                      </Button>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary"
                    onClick={() => onPrintManagementClick ? onPrintManagementClick() : router.push("/farmer/packagingbranding/PrintManagement")}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">🖨️</div>
                      <h3 className="font-semibold text-lg mb-1">Print Management</h3>
                      <p className="text-primary font-medium text-sm mb-2">ప్రింట్ మేనేజ్‌మెంట్</p>
                      <p className="text-xs text-muted-foreground">Track printing jobs & quality</p>
                      <Button size="sm" className="w-full mt-3 agri-button-secondary">
                        Open Module
                      </Button>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary"
                    onClick={() => onBrandComplianceClick ? onBrandComplianceClick() : router.push("/farmer/packagingbranding/BrandCompliance")}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">✅</div>
                      <h3 className="font-semibold text-lg mb-1">Brand Compliance</h3>
                      <p className="text-primary font-medium text-sm mb-2">బ్రాండ్ అనుపాలన</p>
                      <p className="text-xs text-muted-foreground">FSSAI & regulatory compliance</p>
                      <Button size="sm" className="w-full mt-3 agri-button-secondary">
                        Open Module
                      </Button>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary"
                    onClick={() => onLabelGeneratorClick ? onLabelGeneratorClick() : router.push("/farmer/packagingbranding/LabelGenerator")}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">🏷️</div>
                      <h3 className="font-semibold text-lg mb-1">Label Generator</h3>
                      <p className="text-primary font-medium text-sm mb-2">లేబుల్ జనరేటర్</p>
                      <p className="text-xs text-muted-foreground">Generate QR codes & nutritional labels</p>
                      <Button size="sm" className="w-full mt-3 agri-button-secondary">
                        Open Module
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Packaging Metrics Dashboard */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Packaging Performance Dashboard | ప్యాకేజింగ్ పనితీరు డ్యాష్‌బోర్డ్
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {packagingMetrics.map((metric, index) => (
                        <div key={index} className="p-4 bg-gradient-field rounded-lg text-center">
                          <div className="text-2xl font-bold text-primary">{metric.value}%</div>
                          <p className="text-sm font-medium">{metric.metric}</p>
                          <p className="text-xs text-accent">{metric.metricTelugu}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {metric.trend}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Video Section */}
                <AgentVideoSection
                  agentName="BrandBot"
                  agentNameTelugu="బ్రాండ్‌బాట్"
                  videos={[
                    {
                      title: "AI-Powered Package Design",
                      titleTelugu: "AI ఆధారిత ప్యాకేజ్ డిజైన్",
                      duration: "4:30",
                      type: "demo"
                    },
                    {
                      title: "Sustainable Packaging Solutions",
                      titleTelugu: "స్థిరమైన ప్యాకేజింగ్ పరిష్కారాలు",
                      duration: "5:45",
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
                  router.push('/farmer/consumer-delivery');
                }}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-3">
            <AgriAIPilotSidePeek 
              agentType="Packaging"
              agentName="PackBot"
              agentNameTelugu="ప్యాక్‌బాట్"
              services={[
                {
                  title: "Custom Branding Design",
                  titleTelugu: "కస్టమ్ బ్రాండింగ్ డిజైన్",
                  description: "Professional farm logo and packaging design",
                  descriptionTelugu: "వృత్తిపరమైన ఫార్మ్ లోగో మరియు ప్యాకేజింగ్ డిజైన్",
                  duration: "2 hours",
                  price: "₹1,800",
                  icon: "Package",
                  available: true
                },
                {
                  title: "QR Code Generation",
                  titleTelugu: "QR కోడ్ జనరేషన్",
                  description: "Blockchain QR codes for complete traceability",
                  descriptionTelugu: "పూర్తి ట్రేసబిలిటీ కోసం బ్లాక్‌చైన్ QR కోడ్‌లు",
                  duration: "30 minutes",
                  price: "₹500",
                  icon: "Package",
                  available: true
                }
              ]}
            />
          </div>
        </div>
      </div>

      <AgriChatAgent />
    </div>
  );
};

export default PackagingBranding;