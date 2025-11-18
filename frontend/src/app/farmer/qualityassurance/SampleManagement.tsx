'use client';

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ArrowLeft, Plus, TestTube, QrCode, Clock, MapPin, User, FileText, TrendingUp, Target, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";

interface SampleManagementProps {
  onNavigateBack?: () => void;
}

const SampleManagement = ({ onNavigateBack }: SampleManagementProps) => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("pending");

  const samples = [
    {
      id: "SMP-2025-001",
      product: "Basmati Rice - Batch B001",
      productTelugu: "బాస్మతీ బియ్యం - బ్యాచ్ B001",
      type: "Routine Quality Check",
      priority: "High",
      status: "Testing in Progress",
      collectedDate: "Jan 15, 2025",
      collectedBy: "QC Inspector - Rajesh",
      location: "Processing Unit A",
      tests: ["Moisture Content", "Protein Analysis", "Pesticide Residue"],
      completedTests: 1,
      totalTests: 3,
      expectedCompletion: "Jan 17, 2025",
      remarks: "Sample from premium grade batch for export certification"
    },
    {
      id: "SMP-2025-002",
      product: "Organic Wheat - Batch W005",
      productTelugu: "సేంద్రీయ గోధుమలు - బ్యాచ్ W005",
      type: "Organic Certification",
      priority: "High",
      status: "Pending Collection",
      collectedDate: "Scheduled for Jan 16, 2025",
      collectedBy: "To be assigned",
      location: "Storage Unit B",
      tests: ["Heavy Metals", "Mycotoxins", "GMO Testing"],
      completedTests: 0,
      totalTests: 3,
      expectedCompletion: "Jan 20, 2025",
      remarks: "Organic certification renewal sample"
    }
  ];

  const sampleStats = [
    { metric: "Pending Samples", value: 8, trend: "+2", status: "neutral" },
    { metric: "Testing in Progress", value: 5, trend: "-1", status: "good" },
    { metric: "Avg TAT (Hours)", value: 48.5, trend: "-4.2", status: "good" },
    { metric: "Sample Pass Rate", value: "94.8%", trend: "+1.2%", status: "good" }
  ];

  const filteredSamples = samples.filter(sample => {
    if (selectedTab === "pending") return sample.status === "Pending Collection";
    if (selectedTab === "testing") return sample.status === "Testing in Progress";
    if (selectedTab === "completed") return sample.status === "Testing Completed" || sample.status === "Report Generated";
    return true;
  });

  const handleNavigateBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      router.push('/farmer/qualityassurance');
    }
  };

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
                Back to Quality Assurance
              </Button>
              <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                🧪 Sample Management | నమూనా నిర్వహణ
              </h1>
            </div>
            <Button className="agri-button-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Register New Sample
            </Button>
          </div>

          <div className="space-y-6">
            {/* Sample Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Sample Management Dashboard | నమూనా నిర్వహణ డ్యాష్‌బోర్డ్
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {sampleStats.map((stat, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg text-center border border-green-200">
                      <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                      <p className="text-sm font-medium text-gray-700">{stat.metric}</p>
                      <div className="flex justify-center items-center mt-2">
                        <span className={`text-xs font-semibold ${
                          stat.status === 'good' ? 'text-green-600' : 
                          stat.status === 'neutral' ? 'text-gray-500' : 'text-red-600'
                        }`}>
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sample List with Tabs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TestTube className="w-5 h-5" />
                    Sample Registry | నమూనా రిజిస్ట్రీ
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedTab === "pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTab("pending")}
                    >
                      Pending (1)
                    </Button>
                    <Button
                      variant={selectedTab === "testing" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTab("testing")}
                    >
                      Testing (1)
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
                  {filteredSamples.map((sample) => (
                    <div key={sample.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900">{sample.id}</h3>
                            <Badge variant={sample.type === "Customer Complaint Investigation" ? "destructive" : "default"}>
                              {sample.type}
                            </Badge>
                            <Badge variant={
                              sample.priority === "Critical" ? "destructive" :
                              sample.priority === "High" ? "secondary" : "outline"
                            }>
                              {sample.priority}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-gray-800">{sample.product}</h4>
                          <p className="text-sm text-blue-600 mb-2">{sample.productTelugu}</p>
                          <p className="text-sm text-gray-600 mb-2">{sample.remarks}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Collected: {sample.collectedDate}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{sample.collectedBy}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{sample.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Due: {sample.expectedCompletion}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            sample.status === "Report Generated" ? "default" :
                            sample.status === "Testing Completed" ? "default" :
                            sample.status === "Testing in Progress" ? "secondary" : "outline"
                          }>
                            {sample.status}
                          </Badge>
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Test Progress</p>
                            <div className="flex items-center gap-2">
                              <Progress value={(sample.completedTests / sample.totalTests) * 100} className="w-20 h-2" />
                              <span className="text-xs font-semibold text-gray-700">{sample.completedTests}/{sample.totalTests}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tests List */}
                      <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-100">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Scheduled Tests:</p>
                        <div className="flex flex-wrap gap-2">
                          {sample.tests.map((test, index) => (
                            <span key={index} className="px-2 py-1 bg-white text-xs rounded border border-gray-200 text-gray-700">
                              {test}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="flex items-center gap-1 border-gray-200 text-gray-700 hover:bg-gray-50">
                          <QrCode className="w-3 h-3" />
                          Track Sample
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center gap-1 border-gray-200 text-gray-700 hover:bg-gray-50">
                          <FileText className="w-3 h-3" />
                          View Report
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1">
                          <TestTube className="w-3 h-3" />
                          Test Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Right Sidebar */}
      <AgriAIPilotSidePeek 
        agentType="Sample Expert"
        agentName="Sample Management AI"
        agentNameTelugu="శాంపిల్ మేనేజ్‌మెంట్ AI"
        services={[
          { title: "Sample Collection Planning", titleTelugu: "శాంపిల్ కలెక్షన్ ప్రణాళిక", description: "Optimize sample collection schedules", descriptionTelugu: "శాంపిల్ సేకరణ షెడ్యూల్‌లను ఆప్టిమైజ్ చేయండి", duration: "25 min", price: "₹350", icon: FileText, available: true },
          { title: "Testing Protocol Selection", titleTelugu: "టెస్టింగ్ ప్రోటోకాల్ సెలెక్షన్", description: "Choose appropriate testing methods", descriptionTelugu: "తగిన పరీక్ష పద్ధతులను ఎంచుకోండి", duration: "30 min", price: "₹400", icon: Target, available: true },
          { title: "Result Analysis", titleTelugu: "రిజల్ట్ అనాలిసిస్", description: "AI-powered test result interpretation", descriptionTelugu: "AI-ఆధారిత పరీక్ష ఫలితాల వివరణ", duration: "35 min", price: "₹500", icon: BarChart3, available: true },
          { title: "Trend Identification", titleTelugu: "ట్రెండ్ గుర్తింపు", description: "Identify quality trends and patterns", descriptionTelugu: "నాణ్యత ట్రెండ్స్ మరియు నమూనాలను గుర్తించండి", duration: "40 min", price: "₹550", icon: TrendingUp, available: true }
        ]}
      />
      
      {/* Chat Agent */}
      <AgriChatAgent />
    </div>
  );
};

export default SampleManagement;