'use client';

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ArrowLeft, Shield, CheckCircle, FileText, Clock, Heart, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
// import AgriAgentsSidebar from "../AgriAgentsSidebar";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";

interface BrandComplianceProps {
  onNavigateBack?: () => void;
}

const BrandCompliance = ({ onNavigateBack }: BrandComplianceProps) => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("fssai");

  const handleNavigateBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      router.push('/farmer/packagingbranding');
    }
  };

  const complianceItems = [
    {
      id: "FSSAI001",
      title: "FSSAI Registration Number",
      titleTelugu: "FSSAI రిజిస్ట్రేషన్ నంబర్",
      status: "Completed",
      category: "fssai",
      required: true,
      description: "Food Safety and Standards Authority registration",
      lastUpdated: "Dec 15, 2024",
      validUntil: "Dec 15, 2025"
    },
    {
      id: "NUT001",
      title: "Nutritional Information Panel",
      titleTelugu: "పోషకాహార సమాచార పేనల్",
      status: "Completed",
      category: "labeling",
      required: true,
      description: "Complete nutritional facts display",
      lastUpdated: "Dec 20, 2024",
      validUntil: "Ongoing"
    },
    {
      id: "ORG001",
      title: "Organic Certification Mark",
      titleTelugu: "సేంద్రిక ధృవీకరణ చిహ్నం",
      status: "Active",
      category: "organic",
      required: false,
      description: "NPOP organic certification display",
      lastUpdated: "Nov 30, 2024",
      validUntil: "Nov 30, 2025"
    },
    {
      id: "TRACE001",
      title: "QR Traceability Code",
      titleTelugu: "QR ట్రేసబిలిటీ కోడ్",
      status: "Active",
      category: "traceability",
      required: false,
      description: "Blockchain-based product traceability",
      lastUpdated: "Dec 22, 2024",
      validUntil: "Ongoing"
    }
  ];

  const complianceStats = [
    { metric: "Overall Compliance", value: 96, target: 100, trend: "+2%" },
    { metric: "FSSAI Requirements", value: 100, target: 100, trend: "0%" },
    { metric: "Labeling Standards", value: 94, target: 100, trend: "+3%" },
    { metric: "Organic Compliance", value: 92, target: 95, trend: "+1%" }
  ];

  const upcomingRequirements = [
    {
      requirement: "New Allergen Warning Labels",
      requirementTelugu: "కొత్త అలర్జెన్ హెచ్చరిక లేబుల్స్",
      deadline: "Mar 1, 2025",
      impact: "Medium",
      action: "Update all product labels with new allergen warnings"
    },
    {
      requirement: "Carbon Footprint Declaration",
      requirementTelugu: "కార్బన్ ఫుట్‌ప్రింట్ ప్రకటన",
      deadline: "Jun 15, 2025",
      impact: "Low",
      action: "Calculate and display carbon footprint on packaging"
    }
  ];

  const filteredItems = complianceItems.filter(item => 
    selectedCategory === "all" || item.category === selectedCategory
  );

  return (
    <div className="grid grid-cols-8 min-h-screen bg-gradient-to-br from-white-50 to-white-100">
      {/* <AgriAgentsSidebar /> */}
      
      <div className="col-span-12 lg:col-span-10 xl:col-span-9">
        <div className="max-w-full mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button onClick={handleNavigateBack} variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Packaging & Branding
              </Button>
              <h1 className="text-3xl font-bold text-blue-600 flex items-center gap-2">
                ✅ Brand Compliance | బ్రాండ్ అనుపాలన
              </h1>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Compliance Report
            </Button>
          </div>

          <div className="space-y-6">
            {/* Compliance Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Compliance Dashboard | అనుపాలన డ్యాష్‌బోర్డ్
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {complianceStats.map((stat, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg text-center border border-green-200">
                      <div className="text-2xl font-bold text-blue-600">{stat.value}%</div>
                      <p className="text-sm font-medium text-gray-700">{stat.metric}</p>
                      <div className="flex justify-center items-center mt-2">
                        <Progress value={stat.value} className="w-16 h-2 mr-2" />
                        <span className={`text-xs font-semibold ${
                          stat.value >= stat.target ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compliance Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Compliance Requirements | అనుపాలన అవసరాలు
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedCategory === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={selectedCategory === "fssai" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory("fssai")}
                    >
                      FSSAI
                    </Button>
                    <Button
                      variant={selectedCategory === "organic" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory("organic")}
                    >
                      Organic
                    </Button>
                    <Button
                      variant={selectedCategory === "labeling" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory("labeling")}
                    >
                      Labeling
                    </Button>
                    <Button
                      variant={selectedCategory === "traceability" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory("traceability")}
                    >
                      Traceability
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="border-l-4 border-l-blue-600 bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{item.title}</h3>
                            <p className="text-blue-600 text-sm">{item.titleTelugu}</p>
                            <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              item.status === 'Completed' || item.status === 'Active' ? 'default' : 'secondary'
                            }>
                              {item.status}
                            </Badge>
                            {item.required && (
                              <Badge variant="outline" className="ml-2 bg-red-50 text-red-600 border-red-200">Required</Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Last Updated:</span>
                            <p className="font-medium text-gray-700">{item.lastUpdated}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Valid Until:</span>
                            <p className="font-medium text-gray-700">{item.validUntil}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Category:</span>
                            <Badge variant="outline" className="ml-1 border-gray-200 text-gray-700">{item.category}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Upcoming Regulatory Changes | రాబోయే నియంత్రణ మార్పులు
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingRequirements.map((req, index) => (
                    <Card key={index} className="border-l-4 border-l-yellow-500 bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{req.requirement}</h3>
                            <p className="text-blue-600 text-sm">{req.requirementTelugu}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Due: {req.deadline}
                            </Badge>
                            <Badge 
                              variant={req.impact === 'High' ? 'destructive' : req.impact === 'Medium' ? 'secondary' : 'outline'}
                              className="ml-2"
                            >
                              {req.impact} Impact
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm">{req.action}</p>
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
        agentType="Brand Compliance Expert"
        agentName="Brand Compliance AI"
        agentNameTelugu="బ్రాండ్ కంప్లయన్స్ AI"
        services={[
          { title: "Regulatory Compliance Check", titleTelugu: "రెగ్యులేటరీ కంప్లయన్స్ చెక్", description: "Verify compliance with food labeling regulations", descriptionTelugu: "ఆహార లేబులింగ్ నియమాలతో అనుపాలనను ధృవీకరించండి", duration: "40 min", price: "₹600", icon: CheckCircle, available: true },
          { title: "Brand Guidelines Enforcement", titleTelugu: "బ్రాండ్ గైడ్‌లైన్స్ అమలు", description: "Ensure adherence to brand standards", descriptionTelugu: "బ్రాండ్ ప్రమాణాలకు కట్టుబడి ఉండటాన్ని నిర్ధారించండి", duration: "35 min", price: "₹500", icon: Shield, available: true },
          { title: "Nutritional Information Validation", titleTelugu: "పోషకాహార సమాచార ధృవీకరణ", description: "Validate accuracy of nutritional claims", descriptionTelugu: "పోషక వాదనల ఖచ్చితత్వాన్ని ధృవీకరించండి", duration: "45 min", price: "₹650", icon: Heart, available: true },
          { title: "Multi-Language Compliance", titleTelugu: "బహుభాష కంప్లయన్స్", description: "Ensure compliance across different languages", descriptionTelugu: "వివిధ భాషలలో అనుపాలనను నిర్ధారించండి", duration: "50 min", price: "₹700", icon: Globe, available: true }
        ]}
      />
      
      {/* Chat Agent */}
      <AgriChatAgent />
    </div>
  );
};

export default BrandCompliance;
