'use client';

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ArrowLeft, Palette, Eye, Layers, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
// import AgriAgentsSidebar from "../AgriAgentsSidebar";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";

interface DesignStudioProps {
  onNavigateBack?: () => void;
}

const DesignStudio = ({ onNavigateBack }: DesignStudioProps) => {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState("organic");

  const handleNavigateBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      router.push('/farmer/packagingbranding');
    }
  };

  const designTemplates = [
    {
      id: "organic",
      name: "Organic Premium",
      nameTeugu: "ఆర్గానిక్ ప్రీమియం",
      category: "Organic",
      colors: ["#22c55e", "#16a34a", "#ffffff"],
      style: "Modern minimalist with green accents",
      usage: 245
    },
    {
      id: "traditional",
      name: "Traditional Farm",
      nameTeugu: "సాంప్రదాయ వ్యవసాయం",
      category: "Traditional",
      colors: ["#dc2626", "#fbbf24", "#ffffff"],
      style: "Heritage look with warm colors",
      usage: 189
    },
    {
      id: "premium",
      name: "Premium Luxury",
      nameTeugu: "ప్రీమియం లగ్జరీ",
      category: "Premium",
      colors: ["#7c3aed", "#fbbf24", "#000000"],
      style: "Elegant gold and purple theme",
      usage: 156
    }
  ];

  const activeProjects = [
    {
      id: "PR001",
      productName: "Organic Tomato Labels",
      client: "Green Valley Farms",
      status: "Design Review",
      progress: 75,
      designer: "AI Design Assistant",
      deadline: "Jan 25, 2025"
    },
    {
      id: "PR002",
      productName: "Premium Rice Packaging",
      client: "Sunrise Agricultural Co-op",
      status: "Final Approval",
      progress: 90,
      designer: "Creative Team",
      deadline: "Jan 22, 2025"
    }
  ];

  const designTools = [
    { tool: "Logo Generator", icon: "🎯", description: "AI-powered logo creation", status: "Available" },
    { tool: "Label Designer", icon: "🏷️", description: "Custom label templates", status: "Available" },
    { tool: "Color Palette", icon: "🎨", description: "Brand color schemes", status: "Available" },
    { tool: "Typography", icon: "✍️", description: "Font selection & pairing", status: "Available" },
    { tool: "Asset Library", icon: "📁", description: "Stock images & icons", status: "Available" },
    { tool: "Brand Guidelines", icon: "📋", description: "Consistency checker", status: "Available" }
  ];

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
                🎨 Design Studio | డిజైన్ స్టూడియో
              </h1>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Design Assistant
            </Button>
          </div>

          <div className="space-y-6">
            {/* Design Tools Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Professional Design Tools | వృత్తిపరమైన డిజైన్ టూల్స్
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {designTools.map((tool, index) => (
                    <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow bg-white border border-gray-200">
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl mb-2">{tool.icon}</div>
                        <h3 className="font-semibold text-gray-900">{tool.tool}</h3>
                        <p className="text-xs text-gray-600 mb-2">{tool.description}</p>
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">{tool.status}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Template Gallery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Design Templates | డిజైన్ టెంప్లేట్లు
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {designTemplates.map((template) => (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-lg border-2 bg-white ${
                        selectedTemplate === template.id ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:border-blue-300 border-gray-200'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-video bg-gradient-to-br rounded-lg mb-3" 
                             style={{background: `linear-gradient(135deg, ${template.colors[0]}, ${template.colors[1]})`}}>
                          <div className="w-full h-full flex items-center justify-center text-white font-bold">
                            {template.name}
                          </div>
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900">{template.name}</h3>
                        <p className="text-blue-600 text-sm">{template.nameTeugu}</p>
                        <p className="text-xs text-gray-600 mb-2">{template.style}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">{template.category}</Badge>
                          <span className="text-xs text-gray-500">{template.usage} uses</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Active Design Projects | చురుకు డిజైన్ ప్రాజెక్టులు
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeProjects.map((project) => (
                    <Card key={project.id} className="border-l-4 border-l-blue-600 bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{project.productName}</h3>
                            <p className="text-gray-600">{project.client}</p>
                            <p className="text-sm text-blue-600">Designer: {project.designer}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={project.status === 'Final Approval' ? 'default' : 'secondary'} className={
                              project.status === 'Final Approval' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }>
                              {project.status}
                            </Badge>
                            <p className="text-sm text-gray-500 mt-1">Due: {project.deadline}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Progress value={project.progress} className="flex-1" />
                          <span className="text-sm font-medium text-gray-700">{project.progress}%</span>
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
        agentType="Design Expert"
        agentName="Creative AI Assistant"
        agentNameTelugu="క్రియేటివ్ AI సహాయకుడు"
        services={[
          { title: "Brand Design Creation", titleTelugu: "బ్రాండ్ డిజైన్ సృష్టి", description: "AI-powered logo and brand identity design", descriptionTelugu: "AI ఆధారిత లోగో మరియు బ్రాండ్ గుర్తింపు డిజైన్", duration: "30 min", price: "₹500", icon: Palette, available: true },
          { title: "Package Design Optimization", titleTelugu: "ప్యాకేజ్ డిజైన్ ఆప్టిమైజేషన్", description: "Optimize package designs for appeal", descriptionTelugu: "ఆకర్షణ కోసం ప్యాకేజ్ డిజైన్లను ఆప్టిమైజ్ చేయండి", duration: "45 min", price: "₹750", icon: Layers, available: true },
          { title: "Color Palette Generation", titleTelugu: "కలర్ పాలెట్ జనరేషన్", description: "Generate harmonious color schemes", descriptionTelugu: "సామరస్య రంగు పథకాలను రూపొందించండి", duration: "20 min", price: "₹300", icon: Sparkles, available: true },
          { title: "Market Trend Analysis", titleTelugu: "మార్కెట్ ట్రెండ్ అనాలిసిస్", description: "Analyze current design trends", descriptionTelugu: "ప్రస్తుత డిజైన్ ధోరణులను విశ్లేషించండి", duration: "60 min", price: "₹1000", icon: Eye, available: true }
        ]}
      />
      
      {/* Chat Agent */}
      <AgriChatAgent />
    </div>
  );
};

export default DesignStudio;
