import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Sprout,
  AlertTriangle,
  Clock
} from "lucide-react";
// import PageHeader from "../PageHeader";
// import AgriAgentsSidebar from "../AgriAgentsSidebar";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";

// Crop icon mapper based on crop name
const getCropIcon = (cropName: string): string => {
  const name = cropName.toLowerCase();
  const iconMap: Record<string, string> = {
    rice: '🌾', wheat: '🌾', maize: '🌽', corn: '🌽', cotton: '🌱',
    sugarcane: '🎋', chickpea: '🫘', pigeonpea: '🫘', jute: '🌿',
    mungbean: '🫘', soybean: '🫘', groundnut: '🥜', lentil: '🫘',
    coffee: '☕', tea: '🍵', coconut: '🥥', banana: '🍌', mango: '🥭',
    apple: '🍎', grapes: '🍇', pomegranate: '🍎', papaya: '🍈',
    watermelon: '🍉', tomato: '🍅', potato: '🥔', onion: '🧅',
    garlic: '🧄', chili: '🌶️', pepper: '🫑', beans: '🫘', peas: '🫛'
  };
  if (iconMap[name]) return iconMap[name];
  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key) || key.includes(name)) return icon;
  }
  return '🌱';
};

const CropPlanning = () => {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
  const router = useRouter();
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [budgetApproved, setBudgetApproved] = useState(false);
  const [pesticideApproved, setPesticideApproved] = useState(false);
  interface CropRecommendation {
    crop: string;
    icon: string;
    variety: string;
    confidence: number;
    seedRate: string;
    sowingWindow: string;
    expectedYield: string;
    investment: string;
    expectedProfit: string;
    roi: string;
    riskLevel: string;
    durationDays: string;
    inputBOM: Array<{name: string; item: string; quantity: string; cost: string; rate: string | number; amount: string | number}>;
    calendar?: Record<string, unknown>;
  }
  
  const [aiRecommendations, setAiRecommendations] = useState<CropRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load enriched crop planning data from backend
  useEffect(() => {
    const loadCropPlanningData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch from backend API - no localStorage fallback
  const response = await fetch(`${API_BASE}/recommendations/latest/crop-planning`);
        if (response.ok) {
          const data = await response.json();
          if (data.ai_recommendations && Array.isArray(data.ai_recommendations)) {
            const formattedRecs = data.ai_recommendations.map((rec: any) => ({
              crop: rec.crop || 'Unknown',
              icon: getCropIcon(rec.crop || ''),
              variety: rec.variety || '—',
              confidence: typeof rec.confidence === 'number' ? Math.round(rec.confidence * 100) / 100 : 0,
              seedRate: rec.seed_rate || '—',
              sowingWindow: rec.sowing_window || '—',
              expectedYield: rec.expected_yield || '—',
              investment: rec.investment || '—',
              expectedProfit: rec.expected_profit || '—',
              roi: rec.roi || '—',
              riskLevel: rec.risk_level || 'Medium',
              durationDays: rec.duration_days || '—',
              calendar: rec.calendar || {},
              inputBOM: Array.isArray(rec.input_bom) ? rec.input_bom : []
            }));
            setAiRecommendations(formattedRecs);
          }
        } else {
          console.warn('⚠️ No recommendations available from backend');
        }
      } catch (error) {
        console.error('❌ Error loading crop planning data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCropPlanningData();
  }, [API_BASE]);

  // HITL Gates
  const hitlGates = [
    {
      gate: "Budget Exceed Alert",
      status: budgetApproved ? "approved" : "pending",
      message: "Cotton BT investment exceeds your set budget of ₹25,000/acre by ₹3,500",
      action: budgetApproved ? "Approved" : "Requires Approval",
      risk: "medium"
    },
    {
      gate: "Pesticide Class Approval",
      status: pesticideApproved ? "approved" : "pending",
      message: "Cotton requires Class II pesticides for bollworm control",
      action: pesticideApproved ? "Approved" : "Requires Approval",
      risk: "high"
    },
    {
      gate: "Crop Switch Recommendation",
      status: "info",
      message: "Consider switching to Soybean for lower risk and organic certification",
      action: "Optional",
      risk: "low"
    }
  ];

  return (
    <div className="min-h-screen field-gradient">
      {/* <AgriAgentsSidebar /> */}
      <AgriChatAgent />
      <AgriAIPilotSidePeek
        agentType="CropPlanning"
        agentName="AI Crop Planning"
        agentNameTelugu="కృత్రిమ మేధ పంట ప్రణాళిక"
        services={[]}
      />

      <div className="ml-0 min-h-screen">
        {/* <PageHeader
          title="AI Crop Planning"
          titleTelugu="కృత్రిమ మేధ పంట ప్రణాళిక"
          icon={Brain}
          backButton={{ label: "SeedPlanner", route: "/seed-planner" }}
        /> */}

        <div className="max-w-full mx-auto px-1 py-2">
          {/* HITL Gates Alert */}
          <Card className="agri-card mb-6 border-warning bg-warning/5">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-6 h-6 text-warning" />
                <h2 className="text-xl font-bold">Human-in-the-Loop Gates | మానవ అనుమతి అవసరం</h2>
              </div>

              <div className="space-y-3">
                {hitlGates.map((gate, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${gate.status === 'approved' ? 'bg-success/10 border-success/20' :
                      gate.status === 'pending' ? 'bg-warning/10 border-warning/20' :
                        'bg-muted/30 border-border'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{gate.gate}</span>
                          <Badge variant={
                            gate.status === 'approved' ? 'default' :
                              gate.status === 'pending' ? 'destructive' : 'secondary'
                          }>
                            {gate.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{gate.message}</p>
                      </div>

                      {gate.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (gate.gate.includes('Budget')) setBudgetApproved(true);
                              if (gate.gate.includes('Pesticide')) setPesticideApproved(true);
                            }}
                          >
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive">Reject</Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Tabs defaultValue="recommendations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
              <TabsTrigger value="calendar">Crop Calendar</TabsTrigger>
              <TabsTrigger value="bom">Input BOM</TabsTrigger>
            </TabsList>

            {/* AI Recommendations */}
            <TabsContent value="recommendations">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading crop recommendations...</p>
                  </div>
                </div>
              ) : aiRecommendations.length === 0 ? (
                <Card className="agri-card">
                  <div className="p-12 text-center">
                    <Sprout className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Recommendations Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Please submit soil data in the Seed Planner to get AI-powered crop recommendations.
                    </p>
                    <Button onClick={() => router.push('/seed-planner')}>
                      Go to Seed Planner
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {aiRecommendations.map((rec, index) => (
                    <Card key={index} className={`agri-card ${index === 0 ? 'ring-2 ring-primary' : ''} ${selectedCrop === rec.crop ? 'bg-primary/5' : ''}`}>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-4xl">{rec.icon}</span>
                            <div>
                              <h3 className="text-xl font-bold">{rec.crop}</h3>
                              <p className="text-accent font-semibold">{rec.variety}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="mb-2">
                              {rec.confidence}% Confidence
                            </Badge>
                            <p className="text-2xl font-bold text-success">{rec.roi}</p>
                            <p className="text-xs text-muted-foreground">Expected ROI</p>
                          </div>
                        </div>

                      <div className="space-y-3 mb-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Seed Rate</p>
                            <p className="font-semibold">{rec.seedRate}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Sowing Window</p>
                            <p className="font-semibold">{rec.sowingWindow}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Expected Yield</p>
                            <p className="font-semibold">{rec.expectedYield}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Investment</p>
                            <p className="font-semibold">{rec.investment}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                          <p className="text-sm font-semibold text-success">Expected Profit</p>
                          <p className="text-xl font-bold text-success">{rec.expectedProfit}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm">Risk Level:</span>
                          <Badge variant={rec.riskLevel === 'Low' ? 'default' : rec.riskLevel === 'Medium' ? 'secondary' : 'destructive'}>
                            {rec.riskLevel}
                          </Badge>
                        </div>
                      </div>

                        <Button
                          className={selectedCrop === rec.crop ? "agri-button-primary w-full" : "agri-button-secondary w-full"}
                          onClick={() => setSelectedCrop(rec.crop)}
                        >
                          {selectedCrop === rec.crop ? 'Selected' : 'Select This Crop'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Crop Calendar */}
            <TabsContent value="calendar">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading calendar...</p>
                  </div>
                </div>
              ) : selectedCrop ? (
                <Card className="agri-card">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-3xl">{aiRecommendations.find(r => r.crop === selectedCrop)?.icon}</span>
                      <h3 className="text-xl font-bold">Crop Calendar - {selectedCrop}</h3>
                    </div>

                    {Object.keys(aiRecommendations.find(r => r.crop === selectedCrop)?.calendar || {}).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(aiRecommendations.find(r => r.crop === selectedCrop)?.calendar || {}).map(([activity, schedule]) => (
                          <div key={activity} className="p-4 bg-muted/30 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span className="font-semibold capitalize">{activity.replace(/_/g, ' ')}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{String(schedule)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No calendar data available for this crop</p>
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                <Card className="agri-card">
                  <div className="p-6 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Select a crop to view detailed calendar</p>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Input BOM */}
            <TabsContent value="bom">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading BOM...</p>
                  </div>
                </div>
              ) : selectedCrop ? (
                <Card className="agri-card">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-3xl">{aiRecommendations.find(r => r.crop === selectedCrop)?.icon}</span>
                      <h3 className="text-xl font-bold">Input Bill of Materials - {selectedCrop}</h3>
                    </div>

                    {aiRecommendations.find(r => r.crop === selectedCrop)?.inputBOM && 
                     aiRecommendations.find(r => r.crop === selectedCrop)!.inputBOM.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2">Item</th>
                              <th className="text-left py-2">Quantity</th>
                              <th className="text-left py-2">Rate</th>
                              <th className="text-right py-2">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {aiRecommendations.find(r => r.crop === selectedCrop)!.inputBOM.map((item, index: number) => (
                              <tr key={index} className="border-b border-border/50">
                                <td className="py-3 font-semibold">{item.item}</td>
                                <td className="py-3">{item.quantity}</td>
                                <td className="py-3">
                                  {typeof item.rate === 'number' ? `₹${item.rate}` : item.rate}
                                </td>
                                <td className="py-3 text-right font-semibold">
                                  {typeof item.amount === 'number' ? `₹${item.amount.toLocaleString()}` : item.amount}
                                </td>
                              </tr>
                            ))}
                            <tr className="border-t-2 border-primary">
                              <td colSpan={3} className="py-3 font-bold">Total Investment</td>
                              <td className="py-3 text-right font-bold text-primary">
                                {aiRecommendations.find(r => r.crop === selectedCrop)?.investment}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No BOM data available for this crop</p>
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                <Card className="agri-card">
                  <div className="p-6 text-center">
                    <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Select a crop to view detailed BOM</p>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <Button
              className="agri-button-primary"
              disabled={!selectedCrop || !budgetApproved}
              onClick={() => router.push('/seed-planner/procurement')}
            >
              Proceed to Procurement
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/farmer')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Planning
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropPlanning;