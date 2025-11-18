'use client';

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

import { ArrowLeft, QrCode, Download, Eye, Zap, Layers, Type } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
// import AgriAgentsSidebar from "../AgriAgentsSidebar";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";

interface LabelGeneratorProps {
  onNavigateBack?: () => void;
}

const LabelGenerator = ({ onNavigateBack }: LabelGeneratorProps) => {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState("nutritional");

  const handleNavigateBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      router.push('/farmer/packagingbranding');
    }
  };

  const labelTemplates = [
    {
      id: "nutritional",
      name: "Nutritional Facts Label",
      nameTeugu: "పోషకాహార వాస్తవాలు లేబుల్",
      description: "FSSAI compliant nutritional information panel",
      category: "Regulatory",
      fields: ["Calories", "Protein", "Carbs", "Fat", "Fiber", "Sodium"],
      status: "Ready"
    },
    {
      id: "organic",
      name: "Organic Certification Label",
      nameTeugu: "సేంద్రిక ధృవీకరణ లేబుల్",
      description: "NPOP organic certification display",
      category: "Certification",
      fields: ["Cert Number", "Cert Body", "Expiry Date"],
      status: "Ready"
    },
    {
      id: "traceability",
      name: "QR Traceability Code",
      nameTeugu: "QR ట్రేసబిలిటీ కోడ్",
      description: "Blockchain-based product tracking QR",
      category: "Technology",
      fields: ["Batch ID", "Farm Source", "Harvest Date", "Processing Date"],
      status: "Ready"
    },
    {
      id: "allergen",
      name: "Allergen Warning Label",
      nameTeugu: "అలర్జెన్ హెచ్చరిక లేబుల్",
      description: "Food allergen information display",
      category: "Safety",
      fields: ["Contains", "May Contain", "Gluten Free", "Vegan"],
      status: "Ready"
    }
  ];

  const generatedLabels = [
    {
      id: "LBL001",
      product: "Organic Tomatoes 1kg",
      productTelugu: "సేంద్రీయ టమాటాలు 1కేజీ",
      type: "Nutritional + QR",
      batchId: "BT240115001",
      status: "Generated",
      createdDate: "Dec 22, 2024",
      downloadCount: 15
    },
    {
      id: "LBL002",
      product: "Premium Basmati Rice 5kg",
      productTelugu: "ప్రీమియం బాస్మతీ బియ్యం 5కేజీ",
      type: "Full Compliance",
      batchId: "BR240120005",
      status: "Generated",
      createdDate: "Dec 21, 2024",
      downloadCount: 8
    }
  ];

  const qrCodeData = {
    farmSource: "Green Valley Farms, Guntur",
    harvestDate: "2024-12-15",
    processingDate: "2024-12-18",
    batchId: "BT240115001",
    organicCert: "NPOP/NAB/001/2024",
    nutritionalInfo: {
      calories: "18 kcal/100g",
      protein: "0.9g/100g",
      carbs: "3.9g/100g",
      fiber: "1.2g/100g"
    }
  };

  const labelStats = [
    { metric: "Labels Generated", value: 245, trend: "+15" },
    { metric: "QR Codes Active", value: 189, trend: "+22" },
    { metric: "Compliance Rate", value: 98, trend: "+2%" },
    { metric: "Download Success", value: 96, trend: "+1%" }
  ];

  return (
    <div className="grid grid-cols-8 min-h-screen bg-gradient-to-br from-white-50 to-white-100">
      {/* <AgriAgentsSidebar />
       */}
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
                🏷️ Label Generator | లేబుల్ జనరేటర్
              </h1>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Zap className="w-4 h-4" />
              AI Label Creator
            </Button>
          </div>

          <div className="space-y-6">
            {/* Label Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Label Generation Stats | లేబుల్ జనరేషన్ గణాంకాలు
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {labelStats.map((stat, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg text-center border border-green-200">
                      <div className="text-2xl font-bold text-blue-600">
                        {stat.value}{typeof stat.value === 'number' && stat.metric.includes('Rate') ? '%' : ''}
                      </div>
                      <p className="text-sm font-medium text-gray-700">{stat.metric}</p>
                      <div className="flex justify-center items-center mt-2">
                        <span className="text-xs font-semibold text-green-600">
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Label Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Label Templates | లేబుల్ టెంప్లేట్లు
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {labelTemplates.map((template) => (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-lg border-2 bg-white ${
                        selectedTemplate === template.id ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:border-blue-300 border-gray-200'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{template.name}</h3>
                            <p className="text-blue-600 text-sm">{template.nameTeugu}</p>
                            <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="default" className="bg-green-100 text-green-700">{template.status}</Badge>
                            <Badge variant="outline" className="ml-1 border-gray-200 text-gray-700">{template.category}</Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700">Required Fields:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.fields.map((field, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-blue-50 text-blue-600">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className={`w-full mt-3 ${
                            selectedTemplate === template.id 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {selectedTemplate === template.id ? 'Selected' : 'Select Template'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* QR Code Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR Code Data Preview | QR కోడ్ డేటా ప్రివ్యూ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Traceability Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Farm Source:</span>
                        <span className="font-medium text-gray-800">{qrCodeData.farmSource}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Harvest Date:</span>
                        <span className="font-medium text-gray-800">{qrCodeData.harvestDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processing Date:</span>
                        <span className="font-medium text-gray-800">{qrCodeData.processingDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Batch ID:</span>
                        <span className="font-medium text-gray-800">{qrCodeData.batchId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Organic Cert:</span>
                        <span className="font-medium text-gray-800">{qrCodeData.organicCert}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <div className="w-32 h-32 bg-gray-100 mx-auto mb-3 flex items-center justify-center border border-gray-200 rounded">
                      <QrCode className="w-16 h-16 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">QR Code Preview</p>
                    <Button size="sm" variant="outline" className="mt-2 border-gray-200 text-gray-700 hover:bg-gray-50">
                      <Download className="w-4 h-4 mr-1" />
                      Download QR
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generated Labels History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Generated Labels | జనరేట్ చేసిన లేబుల్స్
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generatedLabels.map((label) => (
                    <Card key={label.id} className="border-l-4 border-l-blue-600 bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{label.product}</h3>
                            <p className="text-blue-600 text-sm">{label.productTelugu}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>Batch: {label.batchId}</span>
                              <span>Type: {label.type}</span>
                              <span>Downloads: {label.downloadCount}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="default" className="bg-green-100 text-green-700">{label.status}</Badge>
                            <p className="text-sm text-gray-500 mt-1">{label.createdDate}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50">
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
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
        agentType="Label Generator Expert"
        agentName="Label Generation AI"
        agentNameTelugu="లేబల్ జనరేషన్ AI"
        services={[
          { title: "Smart Label Design", titleTelugu: "స్మార్ట్ లేబల్ డిజైన్", description: "AI-powered automatic label generation", descriptionTelugu: "AI-ఆధారిత స్వయంచాలక లేబల్ జనరేషన్", duration: "30 min", price: "₹450", icon: Type, available: true },
          { title: "Nutritional Analysis", titleTelugu: "పోషకాహార విశ్లేషణ", description: "Analyze and display nutritional information", descriptionTelugu: "పోషకాహార సమాచారాన్ని విశ్లేషించండి మరియు ప్రదర్శించండి", duration: "25 min", price: "₹350", icon: QrCode, available: true },
          { title: "Barcode Generation", titleTelugu: "బార్‌కోడ్ జనరేషన్", description: "Generate compliant product barcodes", descriptionTelugu: "అనుపాలన ఉత్పత్తి బార్‌కోడ్‌లను రూపొందించండి", duration: "15 min", price: "₹200", icon: Layers, available: true },
          { title: "Multi-Format Export", titleTelugu: "మల్టీ-ఫార్మాట్ ఎక్స్‌పోర్ట్", description: "Export labels in various print formats", descriptionTelugu: "వివిధ ప్రింట్ ఫార్మాట్లలో లేబుల్స్ ఎగుమతి చేయండి", duration: "20 min", price: "₹250", icon: Download, available: true }
        ]}
      />
      
      {/* Chat Agent */}
      <AgriChatAgent />
    </div>
  );
};

export default LabelGenerator;
