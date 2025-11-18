'use client';

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
// import { Progress } from "../ui/progress";
import { ArrowLeft, Plus, FileText, Download, Upload, Edit, Eye, Search, Filter, Clock, User, TrendingUp } from "lucide-react";
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

interface DocumentControlProps {
  onBackToQualityAssurance?: () => void;
}

const DocumentControl = ({ onBackToQualityAssurance }: DocumentControlProps = {}) => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");

  const documents = [
    {
      id: "DOC-QMS-001",
      title: "Quality Management System Manual",
      titleTelugu: "నాణ్యత నిర్వహణ వ్యవస్థ మాన్యువల్",
      type: "Quality Manual",
      category: "QMS",
      version: "3.1",
      status: "Active",
      effectiveDate: "Jan 01, 2025",
      reviewDate: "Dec 01, 2025",
      owner: "Quality Manager",
      approver: "Plant Head",
      lastModified: "Dec 20, 2024",
      downloadCount: 45,
      fileSize: "2.5 MB",
      format: "PDF",
      description: "Comprehensive quality management system documentation"
    },
    {
      id: "DOC-SOP-015",
      title: "Standard Operating Procedure - Rice Milling",
      titleTelugu: "ప్రామాణిక కార్య విధానం - రైస్ మిల్లింగ్",
      type: "SOP",
      category: "Operations",
      version: "2.3",
      status: "Under Review",
      effectiveDate: "Pending",
      reviewDate: "Jan 20, 2025",
      owner: "Production Manager",
      approver: "Quality Manager",
      lastModified: "Jan 10, 2025",
      downloadCount: 28,
      fileSize: "1.8 MB",
      format: "PDF",
      description: "Detailed procedure for rice milling operations"
    }
  ];

  const documentStats = [
    { metric: "Total Documents", value: 125, trend: "+8", status: "good" },
    { metric: "Active Documents", value: 98, trend: "+5", status: "good" },
    { metric: "Due for Review", value: 12, trend: "+3", status: "warning" },
    { metric: "Obsolete Documents", value: 15, trend: "-2", status: "good" }
  ];

  const filteredDocuments = documents.filter(doc => {
    const currentDate = new Date();
    const thirtyDaysFromNow = new Date(currentDate.getTime() + 30*24*60*60*1000);
    const matchesTab = selectedTab === "all" || 
      (selectedTab === "active" && doc.status === "Active") ||
      (selectedTab === "review" && (doc.status === "Under Review" || new Date(doc.reviewDate) <= thirtyDaysFromNow)) ||
      (selectedTab === "obsolete" && doc.status === "Obsolete");
    
    const matchesSearch = searchQuery === "" || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.titleTelugu.includes(searchQuery) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const handleBackToQualityAssurance = () => {
    if (onBackToQualityAssurance) {
      onBackToQualityAssurance();
    } else {
      router.push('/farmer/qualityassurance');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-white-100">
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
              📋 Document Control | పత్రాల నియంత్రణ
            </h1>
            <div className="flex items-center justify-end gap-2 flex-wrap">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Document
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Document
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-8 gap-6">
          {/* Main Content */}
          <div className="col-span-9 space-y-6">

            {/* Document Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Document Control Dashboard | పత్రాల నియంత్రణ డ్యాష్‌బోర్డ్
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {documentStats.map((stat, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">{stat.value}</div>
                      <p className="text-sm font-medium">{stat.metric}</p>
                      <div className="flex justify-center items-center mt-2">
                        <span className={`text-xs font-semibold ${
                          stat.status === 'good' ? 'text-green-600' : 
                          stat.status === 'warning' ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Document Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Document Library | పత్రాల గ్రంథాలయం
                  </span>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search documents..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={selectedTab === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTab("active")}
                  >
                    Active (98)
                  </Button>
                  <Button
                    variant={selectedTab === "review" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTab("review")}
                  >
                    Due for Review (12)
                  </Button>
                  <Button
                    variant={selectedTab === "obsolete" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTab("obsolete")}
                  >
                    Obsolete (15)
                  </Button>
                  <Button
                    variant={selectedTab === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTab("all")}
                  >
                    All Documents
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredDocuments.map((doc) => (
                    <div key={doc.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{doc.title}</h3>
                            <Badge variant={doc.type === "Quality Manual" ? "default" : "outline"}>
                              {doc.type}
                            </Badge>
                            <Badge variant={
                              doc.status === "Active" ? "default" :
                              doc.status === "Under Review" ? "secondary" : "destructive"
                            }>
                              {doc.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-blue-600 mb-2">{doc.titleTelugu}</p>
                          <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                          <div className="grid grid-cols-4 gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>Owner: {doc.owner}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Version: {doc.version}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Effective: {doc.effectiveDate}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Review: {doc.reviewDate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="mb-2">
                            <p className="text-xs text-gray-600">Downloads</p>
                            <p className="font-semibold">{doc.downloadCount}</p>
                          </div>
                          <div className="mb-2">
                            <p className="text-xs text-gray-600">Size</p>
                            <p className="font-semibold">{doc.fileSize}</p>
                          </div>
                          <Badge variant="outline">{doc.format}</Badge>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-gray-600 border-t border-gray-200 pt-3">
                        <div>
                          <span>Last Modified: {doc.lastModified} | Approver: {doc.approver}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
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
              agentType="Document Expert"
              agentName="Document Control AI"
              agentNameTelugu="డాక్యుమెంట్ కంట్రోల్ AI"
              services={[
                {
                  title: "Version Control",
                  titleTelugu: "వెర్షన్ కంట్రోల్",
                  description: "Automated document version management",
                  descriptionTelugu: "స్వయంచాలక డాక్యుమెంట్ వెర్షన్ నిర్వహణ",
                  duration: "20 min",
                  price: "₹250",
                  icon: "FileText",
                  available: true
                },
                {
                  title: "Approval Workflow",
                  titleTelugu: "అప్రూవల్ వర్క్‌ఫ్లో",
                  description: "Streamline document approval processes",
                  descriptionTelugu: "డాక్యుమెంట్ ఆమోద ప్రక్రియలను సులభతరం చేయండి",
                  duration: "30 min",
                  price: "₹400",
                  icon: "CheckCircle",
                  available: true
                },
                {
                  title: "Compliance Checking",
                  titleTelugu: "కంప్లయన్స్ చెకింగ్",
                  description: "Verify regulatory compliance of documents",
                  descriptionTelugu: "డాక్యుమెంట్ల నియంత్రణ కంప్లయన్స్ను ధృవీకరించండి",
                  duration: "35 min",
                  price: "₹500",
                  icon: "Search",
                  available: true
                },
                {
                  title: "Change Impact Analysis",
                  titleTelugu: "మార్పు ప్రభావ విశ్లేషణ",
                  description: "Analyze impact of document changes",
                  descriptionTelugu: "డాక్యుమెంట్ మార్పుల ప్రభావాన్ని విశ్లేషించండి",
                  duration: "40 min",
                  price: "₹550",
                  icon: "Activity",
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

export default DocumentControl;