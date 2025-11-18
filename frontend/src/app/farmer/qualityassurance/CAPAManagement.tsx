'use client';

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ArrowLeft, Plus, Clock, Users, FileText, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
// import dynamic from "next/dynamic";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";

// Dynamic imports for Recharts to avoid SSR issues - commented as not used
// const BarChart = dynamic(() => import('recharts').then(mod => ({ default: mod.BarChart })), { ssr: false });
// const Bar = dynamic(() => import('recharts').then(mod => ({ default: mod.Bar })), { ssr: false });
// const XAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })), { ssr: false });
// const YAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })), { ssr: false });
// const CartesianGrid = dynamic(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })), { ssr: false });
// const Tooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), { ssr: false });
// const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), { ssr: false });

interface CAPAManagementProps {
  onBackToQualityAssurance?: () => void;
}

const CAPAManagement = ({ onBackToQualityAssurance }: CAPAManagementProps = {}) => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("open");

  const capaItems = [
    {
      id: "CAPA-001",
      title: "High Moisture Content in Batch #B2024-001",
      titleTelugu: "బ్యాచ్ లో అధిక తేమశాతం",
      type: "Corrective Action",
      priority: "High",
      status: "In Progress",
      assignedTo: "Quality Team",
      dueDate: "Jan 25, 2025",
      rootCause: "Inadequate drying time due to equipment malfunction",
      description: "Moisture content exceeded 14% limit in rice batch, affecting product quality",
      progress: 65,
      createdDate: "Jan 10, 2025",
      source: "Quality Testing"
    },
    {
      id: "CAPA-002", 
      title: "Packaging Label Misalignment Issue",
      titleTelugu: "ప్యాకేజింగ్ లేబుల్ సమలేఖనం సమస్య",
      type: "Preventive Action",
      priority: "Medium",
      status: "Open",
      assignedTo: "Production Team",
      dueDate: "Jan 30, 2025",
      rootCause: "Machine calibration drift",
      description: "Multiple packages found with misaligned labels affecting brand image",
      progress: 25,
      createdDate: "Jan 12, 2025",
      source: "Customer Complaint"
    }
  ];

  const capaStats = [
    { metric: "Open CAPAs", value: 12, trend: "-3", status: "improvement" },
    { metric: "Overdue CAPAs", value: 2, trend: "-1", status: "improvement" },
    { metric: "Avg Resolution Time", value: "8.5 days", trend: "-2.1", status: "improvement" },
    { metric: "Effectiveness Rate", value: "94.2%", trend: "+1.8%", status: "good" }
  ];

  const filteredCAPAs = capaItems.filter(item => {
    if (selectedTab === "open") return item.status !== "Completed";
    if (selectedTab === "completed") return item.status === "Completed";
    return true;
  });

  const handleBackToQualityAssurance = () => {
    if (onBackToQualityAssurance) {
      onBackToQualityAssurance();
    } else {
      router.push('/farmer/qualityassurance');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="bg-white shadow-soft border rounded-xl p-3 sm:p-4 mb-6">
          <div className="sm:grid sm:grid-cols-[auto,1fr,auto] sm:items-center gap-3 flex flex-col">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button onClick={handleBackToQualityAssurance} variant="outline" className="flex items-center gap-2 text-sm sm:text-base">
                <ArrowLeft className="w-4 h-4" />
                Back to Quality Assurance
              </Button>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary leading-tight sm:justify-self-center flex items-center gap-2">
              🔧 CAPA Management | సరిదిద్దుట చర్యల నిర్వహణ
            </h1>
            <div className="flex items-center justify-end gap-2 flex-wrap">
              <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New CAPA
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-8 gap-6">
          {/* Main Content */}
          <div className="col-span-9 space-y-6">

            {/* CAPA Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  CAPA Performance Metrics | CAPA పనితీరు సూచికలు
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {capaStats.map((stat, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">{stat.value}</div>
                      <p className="text-sm font-medium">{stat.metric}</p>
                      <div className="flex justify-center items-center mt-2">
                        <span className={`text-xs font-semibold ${
                          stat.status === 'good' || stat.status === 'improvement' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CAPA List with Tabs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>CAPA Items | CAPA అంశలు</span>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedTab === "open" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTab("open")}
                    >
                      Open ({capaItems.filter(item => item.status !== "Completed").length})
                    </Button>
                    <Button
                      variant={selectedTab === "completed" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTab("completed")}
                    >
                      Completed (0)
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCAPAs.map((capa) => (
                    <div key={capa.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{capa.title}</h3>
                            <Badge variant={capa.type === "Corrective Action" ? "destructive" : "default"}>
                              {capa.type}
                            </Badge>
                            <Badge variant={
                              capa.priority === "High" ? "destructive" :
                              capa.priority === "Medium" ? "secondary" : "outline"
                            }>
                              {capa.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-blue-600 mb-2">{capa.titleTelugu}</p>
                          <p className="text-sm text-gray-600 mb-2">{capa.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {capa.assignedTo}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Due: {capa.dueDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Source: {capa.source}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            capa.status === "Completed" ? "default" :
                            capa.status === "In Progress" ? "secondary" : "outline"
                          }>
                            {capa.status}
                          </Badge>
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 mb-1">Progress</p>
                            <div className="flex items-center gap-2">
                              <Progress value={capa.progress} className="w-20 h-2" />
                              <span className="text-xs font-semibold">{capa.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Root Cause */}
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Root Cause Analysis:</p>
                        <p className="text-sm">{capa.rootCause}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="col-span-3">
            <AgriAIPilotSidePeek 
              agentType="CAPA Expert"
              agentName="CAPA Management AI"
              agentNameTelugu="CAPA మేనేజ్‌మెంట్ AI"
              services={[
                {
                  title: "Root Cause Analysis",
                  titleTelugu: "మూల కారణ విశ్లేషణ",
                  description: "AI-powered root cause identification",
                  descriptionTelugu: "AI-ఆధారిత మూల కారణ గుర్తింపు",
                  duration: "60 min",
                  price: "₹800",
                  icon: "Search",
                  available: true
                },
                {
                  title: "Corrective Action Planning",
                  titleTelugu: "దిద్దుబాటు చర్య ప్రణాళిక",
                  description: "Generate effective corrective action plans",
                  descriptionTelugu: "ప్రభావవంతమైన దిద్దుబాటు చర్య ప్రణాళికలను రూపొందించండి",
                  duration: "45 min",
                  price: "₹650",
                  icon: "FileText",
                  available: true
                },
                {
                  title: "Risk Assessment",
                  titleTelugu: "రిస్క్ అసెస్‌మెంట్",
                  description: "Assess potential risks and impacts",
                  descriptionTelugu: "సంభావ్య నష్టాలు మరియు ప్రభావాలను అంచనా వేయండి",
                  duration: "40 min",
                  price: "₹600",
                  icon: "AlertCircle",
                  available: true
                },
                {
                  title: "Compliance Tracking",
                  titleTelugu: "కంప్లయన్స్ ట్రాకింగ్",
                  description: "Monitor regulatory compliance status",
                  descriptionTelugu: "నియంత్రణ కంప్లయన్స్ స్థితిని పర్యవేక్షించండి",
                  duration: "30 min",
                  price: "₹400",
                  icon: "CheckCircle",
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

export default CAPAManagement;