'use client';

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ArrowLeft, Printer, Clock, Package, Eye, Settings, Palette, TrendingUp, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
// import AgriAgentsSidebar from "../AgriAgentsSidebar";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";

interface PrintManagementProps {
  onNavigateBack?: () => void;
}

const PrintManagement = ({ onNavigateBack }: PrintManagementProps) => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("active");

  const handleNavigateBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      router.push('/farmer/packagingbranding');
    }
  };

  const printJobs = [
    {
      id: "PJ001",
      product: "Organic Tomato Labels",
      productTelugu: "ఆర్గానిక్ టమోటా లేబుల్స్",
      quantity: 5000,
      status: "Printing",
      progress: 65,
      eta: "2 hours",
      printer: "Digital Press #1",
      quality: "High",
      material: "Waterproof Vinyl"
    },
    {
      id: "PJ002",
      product: "Premium Rice Boxes",
      productTelugu: "ప్రీమియం రైస్ బాక్సులు",
      quantity: 2000,
      status: "Quality Check",
      progress: 90,
      eta: "30 minutes",
      printer: "Offset Press #2",
      quality: "Premium",
      material: "Recycled Cardboard"
    },
    {
      id: "PJ003",
      product: "Vegetable Pouches",
      productTelugu: "కూరగాయల పౌచ్‌లు",
      quantity: 8000,
      status: "Completed",
      progress: 100,
      eta: "Ready",
      printer: "Flexo Press #1",
      quality: "Standard",
      material: "Bio-degradable Plastic"
    }
  ];

  const printerStatus = [
    {
      id: "DP001",
      name: "Digital Press #1",
      type: "Digital",
      status: "Active",
      currentJob: "PJ001",
      capacity: 75,
      maintenance: "Jan 30, 2025"
    },
    {
      id: "OP001",
      name: "Offset Press #2",
      type: "Offset",
      status: "Active",
      currentJob: "PJ002",
      capacity: 60,
      maintenance: "Feb 5, 2025"
    },
    {
      id: "FP001",
      name: "Flexo Press #1",
      type: "Flexographic",
      status: "Idle",
      currentJob: "-",
      capacity: 0,
      maintenance: "Jan 25, 2025"
    }
  ];

  const qualityMetrics = [
    { metric: "Print Quality Score", value: 96, target: 95, trend: "+1%" },
    { metric: "On-Time Delivery", value: 94, target: 95, trend: "-1%" },
    { metric: "Material Efficiency", value: 92, target: 90, trend: "+2%" },
    { metric: "Waste Reduction", value: 88, target: 85, trend: "+3%" }
  ];

  const filteredJobs = printJobs.filter(job => {
    if (selectedTab === "active") return job.status !== "Completed";
    if (selectedTab === "completed") return job.status === "Completed";
    return true;
  });

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
                🖨️ Print Management | ప్రింట్ మేనేజ్‌మెంట్
              </h1>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Package className="w-4 h-4" />
              New Print Job
            </Button>
          </div>

          <div className="space-y-6">
            {/* Quality Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="w-5 h-5" />
                  Print Quality Dashboard | ప్రింట్ నాణ్యత డ్యాష్‌బోర్డ్
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {qualityMetrics.map((metric, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg text-center border border-green-200">
                      <div className="text-2xl font-bold text-blue-600">{metric.value}%</div>
                      <p className="text-sm font-medium text-gray-700">{metric.metric}</p>
                      <div className="flex justify-center items-center mt-2">
                        <span className={`text-xs font-semibold ${
                          metric.value >= metric.target ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {metric.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Print Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Print Jobs Queue | ప్రింట్ జాబ్స్ క్యూ
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedTab === "active" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTab("active")}
                    >
                      Active ({printJobs.filter(j => j.status !== "Completed").length})
                    </Button>
                    <Button
                      variant={selectedTab === "completed" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTab("completed")}
                    >
                      Completed ({printJobs.filter(j => j.status === "Completed").length})
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredJobs.map((job) => (
                    <Card key={job.id} className="border-l-4 border-l-blue-600 bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{job.product}</h3>
                            <p className="text-blue-600 text-sm">{job.productTelugu}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>Qty: {job.quantity.toLocaleString()}</span>
                              <span>Printer: {job.printer}</span>
                              <span>Material: {job.material}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              job.status === 'Completed' ? 'default' :
                              job.status === 'Printing' ? 'secondary' : 'outline'
                            } className={
                              job.status === 'Completed' ? 'bg-green-100 text-green-700' :
                              job.status === 'Printing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }>
                              {job.status}
                            </Badge>
                            <p className="text-sm text-gray-500 mt-1">ETA: {job.eta}</p>
                            <Badge variant="outline" className="mt-1 border-gray-200 text-gray-700">{job.quality}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Progress value={job.progress} className="flex-1" />
                          <span className="text-sm font-medium text-gray-700">{job.progress}%</span>
                          <Button size="sm" variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Printer Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="w-5 h-5" />
                  Printer Fleet Status | ప్రింటర్ స్థితి
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {printerStatus.map((printer) => (
                    <Card key={printer.id} className="hover:shadow-md transition-shadow bg-white border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{printer.name}</h3>
                            <p className="text-sm text-gray-600">{printer.type}</p>
                          </div>
                          <Badge variant={printer.status === 'Active' ? 'default' : 'secondary'} className={
                            printer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }>
                            {printer.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Current Job:</span>
                            <span className="font-medium text-gray-800">{printer.currentJob}</span>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-600">Capacity:</span>
                              <span className="font-medium text-gray-800">{printer.capacity}%</span>
                            </div>
                            <Progress value={printer.capacity} className="h-2" />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Next Maintenance:</span>
                            <span className="text-yellow-600 font-medium">{printer.maintenance}</span>
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
      </div>
      
      {/* Right Sidebar */}
      <AgriAIPilotSidePeek 
        agentType="Print Expert"
        agentName="Print Management AI"
        agentNameTelugu="ప్రింట్ మేనేజ్‌మెంట్ AI"
        services={[
          { title: "Print Quality Optimization", titleTelugu: "ప్రింట్ నాణ్యత ఆప్టిమైజేషన్", description: "Optimize print settings for best quality", descriptionTelugu: "ఉత్తమ నాణ్యత కోసం ప్రింట్ సెట్టింగులను ఆప్టిమైజ్ చేయండి", duration: "25 min", price: "₹350", icon: Settings, available: true },
          { title: "Color Calibration", titleTelugu: "కలర్ కాలిబ్రేషన్", description: "Ensure consistent color reproduction", descriptionTelugu: "స్థిరమైన రంగు పునరుత్పత్తిని నిర్ధారించండి", duration: "30 min", price: "₹400", icon: Palette, available: true },
          { title: "Cost Optimization", titleTelugu: "వ్యయ ఆప్టిమైజేషన్", description: "Minimize printing costs while maintaining quality", descriptionTelugu: "నాణ్యతను కాపాడుతూ ప్రింటింగ్ ఖర్చులను తగ్గించండి", duration: "35 min", price: "₹500", icon: TrendingUp, available: true },
          { title: "Production Scheduling", titleTelugu: "ప్రొడక్షన్ షెడ్యూలింగ్", description: "Schedule print jobs for maximum efficiency", descriptionTelugu: "గరిష్ట సామర్థ్యం కోసం ప్రింట్ జాబ్స్ షెడ్యూల్ చేయండి", duration: "40 min", price: "₹550", icon: Calendar, available: true }
        ]}
      />
      
      {/* Chat Agent */}
      <AgriChatAgent />
    </div>
  );
};

export default PrintManagement;
