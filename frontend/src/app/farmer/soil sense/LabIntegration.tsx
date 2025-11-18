import React, { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

// import { useRouter } from "next/navigation"; 
import { 
  ArrowLeft, 
  FileText,
  Download
} from "lucide-react";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";

interface LabIntegrationProps {
  onBackToSoilSense?: () => void;
  services?: Array<{
    title: string;
    titleTelugu: string;
    description: string;
    descriptionTelugu: string;
    duration: string;
    price: string;
    icon: React.ElementType;
    available: boolean;
  }>;
  reports?: Array<{
    id: string;
    labName: string;
    testType: string;
    sampleDate: string;
    reportDate: string;
    status: string;
    cost: string;
    plots: string[];
  }>;
}

const LabIntegration = ({ onBackToSoilSense, services = [], reports = [] }: LabIntegrationProps) => {

  // const [soilSenseServices, setSoilSenseServices] = useState(services);
  const [recentReports, setRecentReports] = useState(reports);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // const router = useRouter();

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    let mounted = true;
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch lab reports from the correct soil-sense API endpoint
        const res = await fetch(`${base}/reports`);
        if (!res.ok) {
          throw new Error(`Failed to fetch reports: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        if (!mounted) return;
        
        if (Array.isArray(data)) {
          setRecentReports(data);
        } else {
          setRecentReports([]);
          setError("Invalid reports data format received");
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to fetch reports");
        setRecentReports([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchReports();
    return () => { mounted = false; };
  }, [base]);

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'in-progress': return 'bg-warning/10 text-warning border-warning/20';
      case 'pending': return 'bg-muted/10 text-muted-foreground border-muted/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const handleDownload = (reportId: string) => {
    // direct open to backend download endpoint - backend will return FileResponse or download_url
    const url = `${base}/download/${reportId}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen field-gradient">
      
      <AgriChatAgent />
      <AgriAIPilotSidePeek
        agentType="SoilSense"
        agentName="Lab Integration"
        agentNameTelugu="ల్యాబ్ ఇంటిగ్రేషన్"
        services={services}
      />
      
      <div className="ml-0 min-h-screen">
        <div className="max-w-full mx-auto px-1 py-2">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={onBackToSoilSense} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to SoilSense
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Lab Integration | ల్యాబ్ ఇంటిగ్రేషన్</h1>
            </div>
          </div>
          
          {/* Lab Reports Section */}
          <div className="space-y-6">
              <Card className="agri-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Recent Lab Reports | ఇటీవలి ల్యాబ్ రిపోర్ట్లు
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading && <div className="text-sm text-muted-foreground">Loading reports...</div>}
                    {error && <div className="text-sm text-red-600">{error}</div>}
                    {!loading && !recentReports?.length && !error && (
                      <div className="text-sm text-muted-foreground">No recent reports available.</div>
                    )}
                    {recentReports.map((report) => (
                      <div key={report.id} className="p-4 border border-border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-sm">{report.testType}</h4>
                            <p className="text-xs text-muted-foreground">Report ID: {report.id}</p>
                          </div>
                          <Badge className={getReportStatusColor(report.status)}>
                            {report.status.replace('-', ' ').charAt(0).toUpperCase() + report.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Lab</p>
                            <p className="text-muted-foreground">{report.labName}</p>
                          </div>
                          <div>
                            <p className="font-medium">Sample Date</p>
                            <p className="text-muted-foreground">{report.sampleDate}</p>
                          </div>
                          <div>
                            <p className="font-medium">Report Date</p>
                            <p className="text-muted-foreground">{report.reportDate}</p>
                          </div>
                          <div>
                            <p className="font-medium">Cost</p>
                            <p className="text-muted-foreground">{report.cost}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-sm font-medium">Plots Tested:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {report.plots.map((plot: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {plot}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {report.status === 'completed' && (
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" onClick={() => handleDownload(report.id)}>
                              <Download className="w-3 h-3 mr-1" />
                              Download PDF
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={onBackToSoilSense}
                            >
                              View in Health Card
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center mt-8">
            <Button onClick={onBackToSoilSense}>
              Request New Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabIntegration;