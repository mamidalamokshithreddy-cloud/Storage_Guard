"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import {
  TrendingUp,
  ArrowLeft,
  Download,
  Share,
  BarChart3,
  Target,
  AlertCircle,
  CheckCircle,
  Activity,
} from "lucide-react";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SoilHealthCardProps {
  onBackToSoilSense?: () => void;
  plotId?: string;
}

interface HealthParameter {
  parameter: string;
  value?: number | null;
  ideal?: string | null;
  status?: string | null;
}

// interface HealthResponse {
//   plot: { id: string; plot_name?: string | null; crop?: string | null; season?: string | null };
//   last_updated?: string | null;
//   parameters: HealthParameter[];
//   overall?: { score?: number | null; status?: string | null; is_overall_excellent?: boolean };
// }

const SoilHealthCard = ({ onBackToSoilSense, plotId }: SoilHealthCardProps = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [parameters, setParameters] = useState<HealthParameter[]>([]);
  const [overall, setOverall] = useState<{ score?: number | null; status?: string | null }>({});
  // const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Array<{ priority?: string; title: string; description?: string; message?: string; type?: string; action?: string; impact?: string }>>([]);
  const [plots, setPlots] = useState<Array<{ id: string; plot_name?: string | null }>>([]);
  const [loadingPlots, setLoadingPlots] = useState<boolean>(false);
  const [plotsError, setPlotsError] = useState<string | null>(null);
  const [selectedPlotId, setSelectedPlotId] = useState<string | undefined>(undefined);
  const hasInitializedSelection = useRef(false);

  // Load available plots for dropdown
  // fetch plots (exposed so we can retry from UI)
  const fetchPlots = async (signal?: AbortSignal) => {
    try {
      setLoadingPlots(true);
      setPlotsError(null);
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
      const url = `${base}/plots`;
      console.debug("SoilHealthCard: fetching plots from", url);
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`Failed to load plots (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setPlots(list);
      // Auto-select plot: use provided plotId prop, or first available plot if none provided
      if (plotId && !hasInitializedSelection.current) {
        setSelectedPlotId(plotId);
        hasInitializedSelection.current = true;
      } else if (list.length > 0 && !selectedPlotId && !hasInitializedSelection.current) {
        setSelectedPlotId(list[0].id);
        hasInitializedSelection.current = true;
      }
    } catch (e: any) {
      // Don't log or set error for abort signals (normal in React StrictMode)
      if (e?.name !== "AbortError") {
        console.error("SoilHealthCard: failed to fetch plots", e);
        setPlots([]);
        setPlotsError(e?.message || "Failed to load plots");
      }
    } finally {
      setLoadingPlots(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchPlots(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotId]);

  // Fetch health-card for selected plot
  // Fetch soil-insights only when the user selects a plot (selectedPlotId)
  useEffect(() => {
    const effectivePlotId = selectedPlotId;
    if (!effectivePlotId) return;
    const controller = new AbortController();
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
        const url = `${base}/plots/${encodeURIComponent(effectivePlotId)}/soil-insights?period=6months`;
        console.debug("SoilHealthCard: fetching soil-insights from", url);
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to load soil insights (${res.status})`);
        const data = await res.json();
        // parse response shape
        const analysis = data?.analysis || {};
        // normalize trends to ensure last 6 months are present (fill missing months with nulls)
        const rawTrends = Array.isArray(data?.trends) ? data.trends : [];
        const normalizeTrends = (raw: any[], months = 6) => {
          const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          // build map by month label
          const map = new Map<string, any>();
          raw.forEach((r) => { if (r && r.month) map.set(r.month, r); });

          const result: any[] = [];
          const now = new Date();
          // generate last `months` month labels ending with current month
          for (let i = months - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            if (map.has(label)) {
              result.push(map.get(label));
            } else {
              result.push({
                month: label,
                ph: null,
                pH: null,
                nitrogen: null,
                phosphorus: null,
                potassium: null,
                organic: null,
                moisture: null,
              });
            }
          }
          return result;
        };

        setTrends(normalizeTrends(rawTrends, 6));
        setParameters(Array.isArray(analysis?.parameters) ? analysis.parameters : []);
        setOverall(analysis?.overall || {});
        setRecommendations(Array.isArray(data?.recommendations) ? data.recommendations : []);
        // setLastUpdated(analysis?.last_updated || null);
      } catch (e: any) {
        console.error("SoilHealthCard: soil-insights fetch error", e);
        if (e?.name !== "AbortError") setError(e?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
    return () => controller.abort();
  }, [selectedPlotId]);

  const getStatusColor = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "excellent":
        return "text-success";
      case "good":
        return "text-primary";
      case "warning":
        return "text-warning";
      case "poor":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "excellent":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "good":
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case "poor":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const labelMap: Record<string, { label: string; telugu: string; icon: string }> = useMemo(
    () => ({
      ph: { label: "pH Level", telugu: "pH స్థాయి", icon: "🧪" },
      nitrogen: { label: "Nitrogen (N)", telugu: "నత్రజని", icon: "🌱" },
      phosphorus: { label: "Phosphorus (P)", telugu: "భాస్వరం", icon: "🧬" },
      potassium: { label: "Potassium (K)", telugu: "పొటాష్", icon: "⚡" },
      organic: { label: "Organic Matter", telugu: "సేంద్రీయ పదార్థం", icon: "🍂" },
      moisture: { label: "Moisture", telugu: "తేమ", icon: "💧" },
    }),
    []
  );

  const metricsForUI = useMemo(() => {
    return parameters.map((p) => {
      const key = (p.parameter || "").toString().trim().toLowerCase();
      const map = labelMap[key] || { label: p.parameter || key, telugu: "", icon: "" };
      return {
        parameter: map.label,
        current: p.value ?? "—",
        target: p.ideal || "",
        status: (p.status || "").toString(),
        trend: "",
        telugu: map.telugu,
        icon: map.icon,
      };
    });
  }, [parameters, labelMap]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg text-muted-foreground">Loading Soil Health Data...</div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-destructive">Error: {error}</div>
    );
  }

  const soilSenseServices = [
    {
      title: "Soil Health Card",
      titleTelugu: "మట్టి ఆరోగ్య కార్డ్",
      description: "Comprehensive historical soil health analysis and trends",
      descriptionTelugu: "సమగ్ర చారిత్రిక మట్టి ఆరోగ్య విశ్లేషణ మరియు ట్రెండ్లు",
      duration: "Always updated",
      price: "Free",
      icon: TrendingUp,
      available: true,
    },
  ];

  return (
    <div className="min-h-screen field-gradient">
      <AgriChatAgent />
      <AgriAIPilotSidePeek agentType="SoilSense" agentName="Soil Health Card" agentNameTelugu="మట్టి ఆరోగ్య కార్డ్" services={soilSenseServices} />

      <div className="ml-0 min-h-screen">
        <div className="max-w-full mx-auto px-1 py-2">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={onBackToSoilSense} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to SoilSense
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Soil Health Card | మట్టి ఆరోగ్య కార్డ్</h1>
            </div>
          </div>
          
          <div className="mb-8">
            <Card className="agri-card border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-6 h-6 text-primary" /> Overall Soil Health Score | మొత్తం మట్టి ఆరోగ్య స్కోర్
                  </CardTitle>

                  <div className="flex gap-2 items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Plot</label>
                        <select
                          className="px-2 py-1 rounded border bg-background text-sm"
                          value={selectedPlotId ?? ""}
                          onChange={(e) => setSelectedPlotId(e.target.value || undefined)}
                        >
                          {loadingPlots ? (
                            <option value="" disabled>
                              Loading...
                            </option>
                          ) : (
                            <>
                              <option value="" disabled={plots.length > 0}>
                                Select Plot
                              </option>
                              {plots.length === 0 ? (
                                <option value="" disabled>
                                  No plots
                                </option>
                              ) : (
                                plots.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.id}
                                  </option>
                                ))
                              )}
                            </>
                          )}
                        </select>
                        {plotsError && (
                          <div className="ml-2 text-xs text-destructive">
                            <div>Error: {plotsError}</div>
                            <button className="underline" onClick={() => fetchPlots()}>
                              Retry
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" /> Download Report
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share className="w-4 h-4 mr-2" /> Share
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="rgb(var(--muted))"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="rgb(var(--primary))"
                          strokeWidth="3"
                          strokeDasharray={`${overall?.score ?? 0}, 100`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">{overall?.score ?? 0}</span>
                      </div>
                    </div>
                    <Badge variant="default" className="text-sm">
                      {(overall?.status || "—") === "excellent" ? "Excellent Health" : overall?.status ? (overall.status as string).charAt(0).toUpperCase() + (overall.status as string).slice(1) : "—"}
                    </Badge>
                    <p className="text-xs text-accent font-medium mt-1">అద్భుతమైన ఆరోగ్యం</p>
                  </div>

                  <div className="md:col-span-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {metricsForUI.map((metric, index) => (
                        <div key={index} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg">{metric.icon}</span>
                            {getStatusIcon(metric.status)}
                          </div>
                          <h4 className="font-semibold text-sm">{metric.parameter}</h4>
                          <p className="text-xs text-accent font-medium mb-1">{metric.telugu}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold">{metric.current}</span>
                            <span className={`text-muted-foreground`}>{/* Trend not computed from API */}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              {/* show a small hint when no plot selected */}
              {!selectedPlotId && (
                <div className="p-4 text-center text-sm text-muted-foreground">Please select a Plot ID from the dropdown above to load soil insights.</div>
              )}
            </Card>
          </div>

          <Tabs defaultValue="trends" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="trends">Historical Trends</TabsTrigger>
              <TabsTrigger value="analysis">Detailed Analysis</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="space-y-6">
              {!selectedPlotId ? (
                <Card className="agri-card">
                  <CardContent>
                    <div className="p-6 text-center text-sm text-muted-foreground">Select a Plot ID to view historical trends for that plot.</div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="agri-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" /> 6-Month Trend Analysis | 6-నెలల ట్రెండ్ విశ్లేషణ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(!trends || trends.length === 0) ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">No trend data available for the selected plot.</div>
                    ) : (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="pH" stroke="rgb(var(--primary))" strokeWidth={2} name="pH Level" />
                            <Line type="monotone" dataKey="nitrogen" stroke="rgb(var(--success))" strokeWidth={2} name="Nitrogen" />
                            <Line type="monotone" dataKey="phosphorus" stroke="rgb(var(--warning))" strokeWidth={2} name="Phosphorus" />
                            <Line type="monotone" dataKey="potassium" stroke="rgb(var(--accent))" strokeWidth={2} name="Potassium" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              {!selectedPlotId ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Select a Plot ID to view detailed analysis.</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {metricsForUI.map((metric, index) => (
                    <Card key={index} className="agri-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <span className="text-lg">{metric.icon}</span>
                          {metric.parameter}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-accent font-medium">{metric.telugu}</span>
                            {getStatusIcon(metric.status)}
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Current: {metric.current}</span>
                              <span className="text-muted-foreground">Target: {metric.target}</span>
                            </div>
                            <Progress value={75} className="h-2" />
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className={getStatusColor(metric.status) + " font-semibold"}>{metric.status ? metric.status.charAt(0).toUpperCase() + metric.status.slice(1) : "—"} Range</span>
                            <span className={`text-muted-foreground`}>{/* Trend not provided by API */}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              {!selectedPlotId ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Select a Plot ID to view recommendations.</div>
              ) : (
                <div className="space-y-4">
                  {recommendations.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No recommendations available for the selected plot.</div>
                  ) : (
                    recommendations.map((rec, index) => (
                      <Card key={index} className="agri-card">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Target className="w-5 h-5 text-primary" />
                              {rec.title}
                            </CardTitle>
                            <Badge className={rec.priority === 'high' ? 'bg-destructive/10 border-destructive/20 text-destructive' : rec.priority === 'medium' ? 'bg-warning/10 border-warning/20 text-warning' : 'bg-success/10 border-success/20 text-success'}>
                              {rec.priority ? rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1) : "—"} Priority
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">{rec.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                              <h5 className="font-semibold text-sm text-primary mb-1">Recommended Action</h5>
                              <p className="text-xs text-muted-foreground">{rec.action}</p>
                            </div>
                            <div className="p-3 bg-success/10 rounded-lg">
                              <h5 className="font-semibold text-sm text-success mb-1">Expected Impact</h5>
                              <p className="text-xs text-muted-foreground">{rec.impact}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-4 justify-center mt-8">
            <Button onClick={onBackToSoilSense}>Request New Test</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoilHealthCard;
                        
