import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Shield, Award, QrCode, Beaker, Microscope, AlertTriangle, BarChart3, FileCheck, FileText, Activity } from "lucide-react";
// import { useRouter } from "next/navigation"; 
import { useState } from "react";

import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import AgentVideoSection from "../AgentVideoSection";
import ProductCatalog from "../processinghub/ProductCatalog";
import ShoppingCartComponent from "../processinghub/ShoppingCart";
import { useShoppingCart } from "../marketconnect/ShoppingCartContext";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface QualityAssuranceProps {
  onAuditManagementClick?: () => void;
  onCAPAManagementClick?: () => void;
  onDocumentControlClick?: () => void;
  onSampleManagementClick?: () => void;
}

const QualityAssurance = ({ 
  onAuditManagementClick, 
  onCAPAManagementClick, 
  onDocumentControlClick, 
  onSampleManagementClick 
}: QualityAssuranceProps) => {
  // const router = useRouter();
  const [activeTab, setActiveTab] = useState("quality");
  
  // Use the shopping cart hook
  const { cartItems, cartItemsMap, addToCart, updateQuantity, removeFromCart, clearCart } = useShoppingCart();

  const nutrientData = [
    { name: 'Nitrogen', value: 85, optimal: 80 },
    { name: 'Phosphorus', value: 92, optimal: 90 },
    { name: 'Potassium', value: 78, optimal: 75 },
    { name: 'Calcium', value: 88, optimal: 85 },
  ];

  const pesticideData = [
    { name: 'Organochlorine', value: 0.02, limit: 0.05, status: 'Safe' },
    { name: 'Organophosphate', value: 0.01, limit: 0.03, status: 'Safe' },
    { name: 'Carbamate', value: 0.00, limit: 0.02, status: 'Safe' },
  ];

  const certifications = [
    { name: "Organic Certified", nameTeugu: "సేంద్రిక ధృవీకరణ", status: "Approved", icon: "🌱", validUntil: "Mar 2025", issuer: "APEDA" },
    { name: "FSSAI Grade A", nameTeugu: "FSSAI గ్రేడ్ A", status: "Approved", icon: "🏆", validUntil: "Jun 2025", issuer: "FSSAI" },
    { name: "Export Ready", nameTeugu: "ఎగుమతి సిద్ధం", status: "Pending", icon: "🌍", validUntil: "Processing", issuer: "EIC" },
    { name: "Zero Residue", nameTeugu: "జీరో రెసిడ్యూ", status: "Approved", icon: "✅", validUntil: "Apr 2025", issuer: "NABL" },
    { name: "ISO 22000", nameTeugu: "ISO 22000", status: "Approved", icon: "🎖️", validUntil: "Dec 2025", issuer: "ISO" },
    { name: "Global GAP", nameTeugu: "గ్లోబల్ GAP", status: "Approved", icon: "🌐", validUntil: "Feb 2025", issuer: "GlobalGAP" }
  ];

  const comprehensiveTests = [
    { 
      category: "Chemical Analysis", 
      categoryTelugu: "రసాయన విశ్లేషణ",
      tests: [
        { name: "Heavy Metals (Pb, Cd, Hg)", nameTelugu: "భారీ లోహాలు", duration: "6 hours", price: "₹800", status: "Available" },
        { name: "Aflatoxin Detection", nameTelugu: "అఫ్లాటాక్సిన్ గుర్తింపు", duration: "8 hours", price: "₹1,200", status: "Available" },
        { name: "Pesticide Multi-Residue", nameTelugu: "పురుగుమందుల మల్టీ-రెసిడ్యూ", duration: "24 hours", price: "₹1,500", status: "Available" },
        { name: "Nutritional Profiling", nameTelugu: "పోషకాహార ప్రొఫైలింగ్", duration: "4 hours", price: "₹900", status: "Available" }
      ]
    },
    {
      category: "Microbiological Testing",
      categoryTelugu: "సూక్ష్మజీవ పరీక్ష",
      tests: [
        { name: "Total Plate Count", nameTelugu: "టోటల్ ప్లేట్ కౌంట్", duration: "48 hours", price: "₹600", status: "Available" },
        { name: "E.coli & Salmonella", nameTelugu: "ఇ.కోలై & సాల్మోనెల్లా", duration: "72 hours", price: "₹1,000", status: "Available" },
        { name: "Yeast & Mold Count", nameTelugu: "ఈస్ట్ & మోల్డ్ కౌంట్", duration: "5 days", price: "₹700", status: "Available" },
        { name: "Pathogen Screening", nameTelugu: "రోగకారక స్క్రీనింగ్", duration: "96 hours", price: "₹1,300", status: "Available" }
      ]
    },
    {
      category: "Physical Properties", 
      categoryTelugu: "భౌతిక లక్షణాలు",
      tests: [
        { name: "Moisture Content", nameTelugu: "తేమ శాతం", duration: "2 hours", price: "₹200", status: "Available" },
        { name: "Grain Size Analysis", nameTelugu: "ధాన్యం పరిమాణ విశ్లేషణ", duration: "1 hour", price: "₹150", status: "Available" },
        { name: "Color Measurement", nameTelugu: "రంగు కొలత", duration: "30 mins", price: "₹100", status: "Available" },
        { name: "Texture Analysis", nameTelugu: "ఆకృతి విశ్లేషణ", duration: "1 hour", price: "₹250", status: "Available" }
      ]
    }
  ];

  const qualityMetrics = [
    { metric: "Overall Quality Score", metricTelugu: "మొత్తం నాణ్యత స్కోర్", value: 94.2, target: 95, trend: "+2.1%" },
    { metric: "Test Success Rate", metricTelugu: "పరీక్ష విజయ రేటు", value: 97.8, target: 98, trend: "+1.2%" },
    { metric: "Certification Compliance", metricTelugu: "ధృవీకరణ అనుపాలన", value: 99.1, target: 100, trend: "+0.5%" },
    { metric: "Zero Defect Batches", metricTelugu: "లోపం లేని బ్యాచ్‌లు", value: 89.5, target: 90, trend: "+3.2%" }
  ];

  const riskAssessment = [
    { risk: "Contamination Risk", riskTelugu: "కలుషిత ప్రమాదం", level: "Low", probability: 15, impact: "Medium", mitigation: "Regular sanitization protocols" },
    { risk: "Pesticide Residue", riskTelugu: "పురుగుమందుల అవశేషాలు", level: "Very Low", probability: 5, impact: "High", mitigation: "Mandatory 48hr testing" },
    { risk: "Storage Degradation", riskTelugu: "నిల్వ క్షీణత", level: "Medium", probability: 25, impact: "Medium", mitigation: "Climate controlled storage" },
    { risk: "Cross Contamination", riskTelugu: "క్రాస్ కాంటామినేషన్", level: "Low", probability: 12, impact: "High", mitigation: "Dedicated processing lines" }
  ];

  const equipmentStatus = [
    { equipment: "LC-MS/MS System", status: "Operational", uptime: 98.5, lastCalibration: "Dec 20, 2024", nextMaintenance: "Jan 15, 2025" },
    { equipment: "GC-MS System", status: "Operational", uptime: 96.2, lastCalibration: "Dec 18, 2024", nextMaintenance: "Jan 12, 2025" },
    { equipment: "Microbiology Incubator", status: "Maintenance", uptime: 0, lastCalibration: "Dec 15, 2024", nextMaintenance: "Ongoing" },
    { equipment: "Spectrophotometer", status: "Operational", uptime: 99.1, lastCalibration: "Dec 22, 2024", nextMaintenance: "Jan 20, 2025" },
    { equipment: "Moisture Analyzer", status: "Operational", uptime: 97.8, lastCalibration: "Dec 19, 2024", nextMaintenance: "Jan 18, 2025" }
  ];

  const complianceTracking = [
    { regulation: "FSSAI Food Safety Standards", status: "Compliant", lastAudit: "Nov 2024", nextAudit: "Feb 2025", score: 95 },
    { regulation: "Export Quality Standards", status: "Compliant", lastAudit: "Oct 2024", nextAudit: "Jan 2025", score: 92 },
    { regulation: "Organic Certification Standards", status: "Compliant", lastAudit: "Dec 2024", nextAudit: "Mar 2025", score: 98 },
    { regulation: "ISO 22000 Requirements", status: "Minor Non-Compliance", lastAudit: "Nov 2024", nextAudit: "Jan 2025", score: 87 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-white-100">
      
      
      <div className="ml-0">{/* Content area with sidebar spacing */}
        {/* Header
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between max-w-full mx-auto">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/processing-hub')} variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Processing
              </Button>
              <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                🔬 Quality Assurance & Certification | నాణ్యత హామీ
              </h1>
            </div>
            <div className="flex gap-2">
              <div className="flex gap-2">
                <Button 
                  variant={activeTab === "quality" ? "default" : "outline"}
                  onClick={() => setActiveTab("quality")}
                >
                  Quality Labs
                </Button>
                <Button 
                  variant={activeTab === "products" ? "default" : "outline"}
                  onClick={() => setActiveTab("products")}
                  className="flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Premium Store ({getTotalItems()})
                </Button>
                <Button 
                  variant={activeTab === "cart" ? "default" : "outline"}
                  onClick={() => setActiveTab("cart")}
                >
                  Cart ({getTotalItems()})
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/packaging-branding')} className="agri-button-primary flex items-center gap-2">
                  Next: Packaging <ArrowRight className="w-4 h-4" />
                </Button>
                <Button onClick={() => router.push('/')} variant="outline">
                  <Home className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header> */}

        {/* Hero Section */}
        <div className="relative h-64 overflow-hidden">
          <img 
            src="/quality-lab.jpg" 
            alt="Quality Lab"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-2">Scientific Quality Testing</h2>
              <p className="text-xl">Ensuring premium grade produce for consumers</p>
            </div>
          </div>
        </div>

          <div className="max-w-full mx-auto p-6">
            {/* Main Content */}
            <div className="col-span-9 space-y-6">
              {activeTab === "quality" && (
                <>
                  {/* Quick Navigation */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Quality Assurance Navigation | నాణ్యత హామీ నేవిగేషన్
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4">
                        <Button 
                          onClick={onCAPAManagementClick}
                          variant="outline" 
                          className="h-20 flex flex-col items-center gap-2 hover:bg-primary/5"
                        >
                          <AlertTriangle className="w-8 h-8" />
                          <span className="text-center">
                            <div className="font-semibold">CAPA Management</div>
                            <div className="text-xs text-muted-foreground">CAPA నిర్వహణ</div>
                          </span>
                        </Button>
                        <Button 
                          onClick={onAuditManagementClick}
                          variant="outline" 
                          className="h-20 flex flex-col items-center gap-2 hover:bg-primary/5"
                        >
                          <FileCheck className="w-8 h-8" />
                          <span className="text-center">
                            <div className="font-semibold">Audit Management</div>
                            <div className="text-xs text-muted-foreground">ఆడిట్ నిర్వహణ</div>
                          </span>
                        </Button>
                        <Button 
                          onClick={onSampleManagementClick}
                          variant="outline" 
                          className="h-20 flex flex-col items-center gap-2 hover:bg-primary/5"
                        >
                          <Beaker className="w-8 h-8" />
                          <span className="text-center">
                            <div className="font-semibold">Sample Management</div>
                            <div className="text-xs text-muted-foreground">నమూనా నిర్వహణ</div>
                          </span>
                        </Button>
                        <Button 
                          onClick={onDocumentControlClick}
                          variant="outline" 
                          className="h-20 flex flex-col items-center gap-2 hover:bg-primary/5"
                        >
                          <FileText className="w-8 h-8" />
                          <span className="text-center">
                            <div className="font-semibold">Document Control</div>
                            <div className="text-xs text-muted-foreground">పత్రాల నియంత్రణ</div>
                          </span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quality Metrics Dashboard */}
                  <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Quality Performance Dashboard | నాణ్యత పనితీరు డ్యాష్‌బోర్డ్
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {qualityMetrics.map((metric, index) => (
                        <div key={index} className="p-4 bg-gradient-field rounded-lg text-center">
                          <div className="text-2xl font-bold text-primary">{metric.value}%</div>
                          <p className="text-sm font-medium">{metric.metric}</p>
                          <p className="text-xs text-accent">{metric.metricTelugu}</p>
                          <div className="flex justify-between items-center mt-2">
                            <Badge variant="outline" className="text-xs">Target: {metric.target}%</Badge>
                            <span className="text-xs font-semibold text-success">{metric.trend}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Comprehensive Testing Services */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Microscope className="w-5 h-5" />
                      Advanced Testing Services | అధునాతన పరీక్ష సేవలు
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {comprehensiveTests.map((category, categoryIndex) => (
                        <div key={categoryIndex} className="space-y-4">
                          <h3 className="text-lg font-semibold text-primary border-b pb-2">
                            {category.category} | {category.categoryTelugu}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {category.tests.map((test, testIndex) => (
                              <div key={testIndex} className="p-4 border border-border rounded-lg bg-gradient-subtle hover:shadow-sm transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-semibold">{test.name}</h4>
                                    <p className="text-sm text-accent">{test.nameTelugu}</p>
                                  </div>
                                  <Badge variant="outline">{test.status}</Badge>
                                </div>
                                <div className="flex justify-between items-center text-sm mb-3">
                                  <span className="text-muted-foreground">Duration: {test.duration}</span>
                                  <span className="font-semibold text-primary">{test.price}</span>
                                </div>
                                <Button size="sm" className="w-full agri-button-primary">
                                  Schedule Test
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Assessment Matrix */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Quality Risk Assessment | నాణ్యత ప్రమాద మూల్యాంకనం
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {riskAssessment.map((risk, index) => (
                        <div key={index} className="p-4 border border-border rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{risk.risk}</h4>
                              <p className="text-sm text-accent">{risk.riskTelugu}</p>
                            </div>
                            <Badge 
                              variant={
                                risk.level === 'Low' || risk.level === 'Very Low' ? 'default' : 
                                risk.level === 'Medium' ? 'secondary' : 'destructive'
                              }
                              className={
                                risk.level === 'Low' || risk.level === 'Very Low' ? 'bg-success text-success-foreground' : ''
                              }
                            >
                              {risk.level} Risk
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                            <div>
                              <p className="text-muted-foreground">Probability</p>
                              <p className="font-semibold">{risk.probability}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Impact</p>
                              <p className="font-semibold">{risk.impact}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Mitigation</p>
                              <p className="text-xs">{risk.mitigation}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Nutrient Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Nutrient Analysis Report | పోషకాహార విశ్లేషణ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={nutrientData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#22c55e" name="Current Level" />
                          <Bar dataKey="optimal" fill="#94a3b8" name="Optimal Level" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Tracking */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5" />
                      Regulatory Compliance Status | నియంత్రణ అనుపాలన స్థితి
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {complianceTracking.map((compliance, index) => (
                        <div key={index} className="p-4 border border-border rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{compliance.regulation}</h4>
                              <p className="text-sm text-muted-foreground">Last Audit: {compliance.lastAudit}</p>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={compliance.status === 'Compliant' ? 'default' : 'secondary'}
                                className={compliance.status === 'Compliant' ? 'bg-success text-success-foreground' : ''}
                              >
                                {compliance.status}
                              </Badge>
                              <p className="text-sm text-muted-foreground mt-1">Score: {compliance.score}%</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span>Next Audit: {compliance.nextAudit}</span>
                            <Progress value={compliance.score} className="w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Certification Badges */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Certification Portfolio | ధృవీకరణ పోర్ట్‌ఫోలియో
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {certifications.map((cert, index) => (
                        <Card key={index} className={`hover:shadow-md transition-shadow ${cert.status === 'Approved' ? 'border-green-300' : 'border-yellow-300'}`}>
                          <CardContent className="p-4 text-center">
                            <div className="text-4xl mb-3">{cert.icon}</div>
                            <h3 className="font-semibold text-lg">{cert.name}</h3>
                            <p className="text-primary font-medium text-sm">{cert.nameTeugu}</p>
                            <div className="mt-2 space-y-1">
                              <Badge 
                                variant={cert.status === 'Approved' ? 'default' : 'secondary'} 
                                className={cert.status === 'Approved' ? 'bg-success text-success-foreground' : ''}
                              >
                                {cert.status}
                              </Badge>
                              <p className="text-xs text-muted-foreground">Valid: {cert.validUntil}</p>
                              <p className="text-xs text-muted-foreground">Issuer: {cert.issuer}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Equipment Status Monitor */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Laboratory Equipment Status | ప్రయోగశాల పరికరాల స్థితి
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {equipmentStatus.map((equipment, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${equipment.status === 'Operational' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <div>
                              <p className="font-semibold">{equipment.equipment}</p>
                              <p className="text-sm text-muted-foreground">Last Calibration: {equipment.lastCalibration}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={equipment.status === 'Operational' ? 'default' : 'secondary'} className={equipment.status === 'Operational' ? 'bg-success text-success-foreground' : ''}>
                              {equipment.status}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              Uptime: {equipment.uptime}%
                            </p>
                            <p className="text-xs text-muted-foreground">Next: {equipment.nextMaintenance}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Pesticide Residue Report */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Beaker className="w-5 h-5" />
                      Pesticide Residue Analysis | పురుగుమందుల అవశేషాలు
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pesticideData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Detected: {item.value} ppm</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={item.status === 'Safe' ? 'default' : 'destructive'} className={item.status === 'Safe' ? 'bg-success text-success-foreground' : ''}>
                              {item.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground">Limit: {item.limit} ppm</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Blockchain Traceability */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="w-5 h-5" />
                      Blockchain Traceability | బ్లాక్‌చైన్ ట్రేసబిలిటీ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="w-32 h-32 bg-gradient-to-br from-primary to-green-600 rounded-lg flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">Farm-to-Fork QR Code</h3>
                        <p className="text-muted-foreground mb-4">
                          Complete traceability from seed to consumer plate with blockchain verification
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><strong>Batch ID:</strong> AGH-2024-001</div>
                          <div><strong>Farm Location:</strong> Warangal, Telangana</div>
                          <div><strong>Harvest Date:</strong> Dec 15, 2024</div>
                          <div><strong>Processing Date:</strong> Dec 18, 2024</div>
                          <div><strong>Quality Grade:</strong> Premium A+</div>
                          <div><strong>Blockchain Hash:</strong> 0xab12...cd34</div>
                        </div>
                        <Button className="mt-4 agri-button-primary">
                          Generate Certificate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Video Section */}
                <AgentVideoSection
                  agentName="QualityGuard"
                  agentNameTelugu="క్వాలిటీగార్డ్"
                  videos={[
                    {
                      title: "AI-Powered Quality Grading System",
                      titleTelugu: "AI శక్తితో నాణ్యత గ్రేడింగ్ వ్యవస్థ",
                      duration: "4:15",
                      type: "demo"
                    },
                    {
                      title: "Advanced Laboratory Testing Procedures",
                      titleTelugu: "అధునాతన ప్రయోగశాల పరీక్ష విధానాలు",
                      duration: "6:30",
                      type: "tutorial"
                    },
                    {
                      title: "Blockchain Verification Process",
                      titleTelugu: "బ్లాక్‌చైన్ వెరిఫికేషన్ ప్రక్రియ",
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
                  setActiveTab("quality");
                }}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-3">
            <AgriAIPilotSidePeek 
              agentType="Quality"
              agentName="QualityGuard"
              agentNameTelugu="క్వాలిటీగార్డ్"
              services={[
                {
                  title: "Comprehensive Lab Testing",
                  titleTelugu: "సమగ్ర ల్యాబ్ టెస్టింగ్",
                  description: "Complete chemical, microbiological & physical analysis",
                  descriptionTelugu: "పూర్తి రసాయన, సూక్ష్మజీవ మరియు భౌతిక విశ్లేషణ",
                  duration: "2-5 days",
                  price: "₹2,500",
                  icon: "Microscope",
                  available: true
                },
                {
                  title: "Certification Consulting",
                  titleTelugu: "ధృవీకరణ సలహా",
                  description: "Expert guidance for organic, export & ISO certifications",
                  descriptionTelugu: "సేంద్రిక, ఎగుమతి మరియు ISO ధృవీకరణలకు నిపుణుల మార్గదర్శనం",
                  duration: "3 hours",
                  price: "₹2,000",
                  icon: "Award",
                  available: true
                },
                {
                  title: "Blockchain Traceability Setup",
                  titleTelugu: "బ్లాక్‌చైన్ ట్రేసబిలిటీ సెటప్",
                  description: "Complete farm-to-fork tracking system implementation",
                  descriptionTelugu: "పూర్తి వ్యవసాయ క్షేత్రం నుండి వినియోగదారు వరకు ట్రాకింగ్ వ్యవస్థ",
                  duration: "4 hours",
                  price: "₹3,000",
                  icon: "QrCode",
                  available: true
                },
                {
                  title: "Risk Assessment & Mitigation",
                  titleTelugu: "ప్రమాద మూల్యాంకనం & తగ్గింపు",
                  description: "Comprehensive quality risk analysis and prevention strategies",
                  descriptionTelugu: "సమగ్ర నాణ్యత ప్రమాద విశ్లేషణ మరియు నివారణ వ్యూహాలు",
                  duration: "2.5 hours",
                  price: "₹1,800",
                  icon: "AlertTriangle",
                  available: true
                },
                {
                  title: "Equipment Calibration Support",
                  titleTelugu: "పరికరాల క్యాలిబ్రేషన్ మద్దతు",
                  description: "Professional calibration and maintenance of lab equipment",
                  descriptionTelugu: "ప్రయోగశాల పరికరాల వృత్తిపరమైన క్యాలిబ్రేషన్ మరియు నిర్వహణ",
                  duration: "1.5 hours",
                  price: "₹1,500",
                  icon: "Activity",
                  available: true
                },
                {
                  title: "Compliance Audit Preparation",
                  titleTelugu: "అనుపాలన ఆడిట్ తయారీ",
                  description: "Complete preparation for regulatory audits and inspections",
                  descriptionTelugu: "నియంత్రణ ఆడిట్లు మరియు తనిఖీలకు పూర్తి తయారీ",
                  duration: "3 hours",
                  price: "₹2,200",
                  icon: "FileCheck",
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

export default QualityAssurance;