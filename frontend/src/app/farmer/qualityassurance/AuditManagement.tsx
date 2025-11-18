'use client';

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ArrowLeft, Plus, Calendar, Users, Clock, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";

interface AuditManagementProps {
  onBackToQualityAssurance?: () => void;
}

const AuditManagement = ({ onBackToQualityAssurance }: AuditManagementProps = {}) => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("upcoming");

  const audits = [
    {
      id: "AUD-2025-001",
      title: "FSSAI Food Safety Compliance Audit",
      titleTelugu: "FSSAI ఆహార భద్రత అనుపాలన ఆడిట్",
      type: "External",
      auditor: "FSSAI Certified Auditor",
      scheduledDate: "Jan 25, 2025",
      duration: "2 days",
      status: "Scheduled",
      scope: "Food safety management system, HACCP implementation",
      lastScore: 92,
      areas: ["Production", "Quality Control", "Storage", "Documentation"],
      priority: "High"
    },
    {
      id: "AUD-2025-002",
      title: "ISO 22000 Surveillance Audit",
      titleTelugu: "ISO 22000 నిఘా ఆడిట్",
      type: "External", 
      auditor: "Bureau Veritas",
      scheduledDate: "Feb 10, 2025",
      duration: "1 day",
      status: "Planned",
      scope: "Food safety management system effectiveness",
      lastScore: 95,
      areas: ["Management Review", "Internal Audit", "Risk Assessment"],
      priority: "Medium"
    }
  ];

  const auditStats = [
    { metric: "Upcoming Audits", value: 3, trend: "0", status: "neutral" },
    { metric: "Average Score", value: "92.3%", trend: "+2.1%", status: "good" },
    { metric: "Compliance Rate", value: "98.5%", trend: "+1.2%", status: "good" },
    { metric: "Open Findings", value: 5, trend: "-3", status: "improvement" }
  ];

  const filteredAudits = audits.filter(audit => {
    if (selectedTab === "upcoming") return audit.status === "Scheduled" || audit.status === "Planned";
    if (selectedTab === "inprogress") return audit.status === "In Progress";
    if (selectedTab === "completed") return audit.status === "Completed";
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
              📋 Audit Management | ఆడిట్ నిర్వహణ
            </h1>
            <div className="flex items-center justify-end gap-2 flex-wrap">
              <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Schedule New Audit
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-8 gap-6">
          {/* Main Content */}
          <div className="col-span-9 space-y-6">

            {/* Audit Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Audit Performance Dashboard | ఆడిట్ పనితీరు డ్యాష్‌బోర్డ్
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {auditStats.map((stat, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">{stat.value}</div>
                      <p className="text-sm font-medium">{stat.metric}</p>
                      <div className="flex justify-center items-center mt-2">
                        <span className={`text-xs font-semibold ${
                          stat.status === 'good' || stat.status === 'improvement' ? 'text-green-600' : 
                          stat.status === 'neutral' ? 'text-gray-600' : 'text-red-600'
                        }`}>
                          {stat.trend !== "0" ? (stat.trend.startsWith('+') || stat.trend.startsWith('-') ? stat.trend : `+${stat.trend}`) : 'No Change'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Audit Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Audit Schedule | ఆడిట్ షెడ్యూల్
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedTab === "upcoming" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTab("upcoming")}
                    >
                      Upcoming (2)
                    </Button>
                    <Button
                      variant={selectedTab === "inprogress" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTab("inprogress")}
                    >
                      In Progress (0)
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
                  {filteredAudits.map((audit) => (
                    <div key={audit.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{audit.title}</h3>
                            <Badge variant={audit.type === "External" ? "default" : "secondary"}>
                              {audit.type}
                            </Badge>
                            <Badge variant={
                              audit.priority === "High" ? "destructive" :
                              audit.priority === "Medium" ? "secondary" : "outline"
                            }>
                              {audit.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-blue-600 mb-2">{audit.titleTelugu}</p>
                          <p className="text-sm text-gray-600 mb-2">{audit.scope}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {audit.auditor}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {audit.scheduledDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {audit.duration}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            audit.status === "Completed" ? "default" :
                            audit.status === "In Progress" ? "secondary" : "outline"
                          }>
                            {audit.status}
                          </Badge>
                          {audit.lastScore > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600">Last Score</p>
                              <p className="text-lg font-bold text-primary">{audit.lastScore}%</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Audit Areas */}
                      <div className="flex flex-wrap gap-2">
                        {audit.areas.map((area, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                            {area}
                          </span>
                        ))}
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
              agentType="Audit Expert"
              agentName="Audit Management AI"
              agentNameTelugu="ఆడిట్ మేనేజ్‌మెంట్ AI"
              services={[
                {
                  title: "Audit Planning",
                  titleTelugu: "ఆడిట్ ప్రణాళిక",
                  description: "AI-powered audit schedule optimization",
                  descriptionTelugu: "AI-ఆధారిత ఆడిట్ షెడ్యూల్ ఆప్టిమైజేషన్",
                  duration: "50 min",
                  price: "₹700",
                  icon: "Calendar",
                  available: true
                },
                {
                  title: "Risk-Based Auditing",
                  titleTelugu: "రిస్క్-బేస్డ్ ఆడిటింగ్",
                  description: "Focus audits on high-risk areas",
                  descriptionTelugu: "అధిక ప్రమాద ప్రాంతాలపై ఆడిట్‌లను దృష్టి పెట్టండి",
                  duration: "45 min",
                  price: "₹650",
                  icon: "Target",
                  available: true
                },
                {
                  title: "Compliance Verification",
                  titleTelugu: "కంప్లయన్స్ వెరిఫికేషన్",
                  description: "Automated compliance checking",
                  descriptionTelugu: "స్వయంచాలక కంప్లయన్స్ తనిఖీ",
                  duration: "35 min",
                  price: "₹500",
                  icon: "CheckCircle",
                  available: true
                },
                {
                  title: "Report Generation",
                  titleTelugu: "రిపోర్ట్ జనరేషన్",
                  description: "Auto-generate comprehensive audit reports",
                  descriptionTelugu: "సమగ్రమైన ఆడిట్ నివేదికలను స్వయంచాలకంగా రూపొందించండి",
                  duration: "30 min",
                  price: "₹400",
                  icon: "FileText",
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

export default AuditManagement;