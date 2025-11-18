import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ArrowLeft, Package, QrCode, MapPin, Clock, Truck, Eye, Download, Filter, TrendingUp, Search, Microscope } from "lucide-react";
import { useState } from "react";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import AgriChatAgent from "../AgriChatAgent";

interface BatchTrackingProps {
  onBackToProcessingHub?: () => void;
}

const BatchTracking = ({ onBackToProcessingHub }: BatchTrackingProps = {}) => {
  const [selectedBatch, setSelectedBatch] = useState("BATCH001");

  const batches = [
    {
      id: "BATCH001",
      product: "Basmati Rice",
      productTelugu: "బాస్మతీ బియ్యం",
      status: "In Processing",
      stage: "Milling",
      quantity: "500 kg",
      quality: "Grade A",
      farmSource: "Farm #RF001 - Guntur",
      startDate: "Jan 15, 2025",
      expectedCompletion: "Jan 18, 2025",
      progress: 65,
      currentLocation: "Processing Unit B"
    },
    {
      id: "BATCH002", 
      product: "Organic Wheat",
      productTelugu: "సేంద్రీయ గోధుమలు",
      status: "Ready for Packaging",
      stage: "Quality Check",
      quantity: "750 kg",
      quality: "Premium",
      farmSource: "Farm #OF005 - Nizamabad",
      startDate: "Jan 12, 2025",
      expectedCompletion: "Jan 16, 2025",
      progress: 90,
      currentLocation: "QC Lab"
    },
    {
      id: "BATCH003",
      product: "Yellow Maize",
      productTelugu: "పసుపు మొక్కజొన్న",
      status: "Completed",
      stage: "Packaged",
      quantity: "1000 kg",
      quality: "Grade A",
      farmSource: "Farm #YM012 - Warangal",
      startDate: "Jan 10, 2025",
      expectedCompletion: "Jan 14, 2025",
      progress: 100,
      currentLocation: "Warehouse A"
    }
  ];

  const trackingHistory = [
    { timestamp: "Jan 15, 2025 - 08:00 AM", stage: "Received from Farm", location: "Intake Dock", status: "Completed", details: "500kg Basmati rice received, initial quality check passed" },
    { timestamp: "Jan 15, 2025 - 10:30 AM", stage: "Pre-Processing", location: "Cleaning Unit", status: "Completed", details: "Cleaning and sorting completed, foreign matter removed" },
    { timestamp: "Jan 16, 2025 - 02:00 PM", stage: "Primary Processing", location: "Processing Unit B", status: "Completed", details: "Hulling process completed, 95% efficiency achieved" },
    { timestamp: "Jan 17, 2025 - 11:00 AM", stage: "Milling", location: "Processing Unit B", status: "In Progress", details: "Milling in progress, expected completion in 2 hours" },
    { timestamp: "Pending", stage: "Quality Testing", location: "QC Lab", status: "Pending", details: "Moisture content, protein analysis, pesticide residue testing" },
    { timestamp: "Pending", stage: "Packaging", location: "Packaging Unit", status: "Pending", details: "Final packaging with lot number and certification labels" }
  ];

  const qualityMetrics = [
    { parameter: "Moisture Content", value: "12.5%", standard: "≤14%", status: "Pass" },
    { parameter: "Broken Grains", value: "2.1%", standard: "≤5%", status: "Pass" },
    { parameter: "Foreign Matter", value: "0.3%", standard: "≤1%", status: "Pass" },
    { parameter: "Protein Content", value: "7.2%", standard: "≥6%", status: "Pass" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="bg-white shadow-soft border rounded-xl p-3 sm:p-4 mb-6">
          <div className="sm:grid sm:grid-cols-[auto,1fr,auto] sm:items-center gap-3 flex flex-col">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button onClick={onBackToProcessingHub} variant="outline" className="flex items-center gap-2 text-sm sm:text-base">
                <ArrowLeft className="w-4 h-4" />
                Back to Processing Hub
              </Button>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary leading-tight sm:justify-self-center flex items-center gap-2">
              📦 Batch Tracking & Traceability | బ్యాచ్ ట్రాకింగ్
            </h1>
            <div className="flex items-center justify-end gap-2 flex-wrap">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter Batches
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-8 gap-6">
          {/* Batch List */}
          <div className="col-span-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Batches | చురుకు బ్యాచ్‌లు</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {batches.map((batch) => (
                  <div 
                    key={batch.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedBatch === batch.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setSelectedBatch(batch.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{batch.id}</h3>
                        <p className="text-sm text-muted-foreground">{batch.product}</p>
                        <p className="text-xs text-accent">{batch.productTelugu}</p>
                      </div>
                      <Badge variant={
                        batch.status === 'Completed' ? 'default' : 
                        batch.status === 'In Processing' ? 'secondary' : 'outline'
                      }>
                        {batch.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>Quantity: {batch.quantity}</p>
                      <p>Stage: {batch.stage}</p>
                      <Progress value={batch.progress} className="h-1" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Batch Details */}
          <div className="col-span-8 space-y-6">
            {selectedBatch && (
              <>
                {/* Batch Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Batch Details - {selectedBatch}
                      </span>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <QrCode className="w-4 h-4" />
                        Generate QR Code
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const batch = batches.find(b => b.id === selectedBatch);
                      return batch ? (
                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Product</p>
                              <p className="font-semibold">{batch.product}</p>
                              <p className="text-xs text-accent">{batch.productTelugu}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Quantity</p>
                              <p className="font-semibold">{batch.quantity}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Quality Grade</p>
                              <Badge variant="default">{batch.quality}</Badge>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Farm Source</p>
                              <p className="font-semibold">{batch.farmSource}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Current Stage</p>
                              <p className="font-semibold">{batch.stage}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Location</p>
                              <p className="font-semibold flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {batch.currentLocation}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Progress</p>
                              <div className="flex items-center gap-2">
                                <Progress value={batch.progress} className="flex-1" />
                                <span className="text-sm font-semibold">{batch.progress}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Expected Completion</p>
                              <p className="font-semibold flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {batch.expectedCompletion}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Status</p>
                              <Badge variant={
                                batch.status === 'Completed' ? 'default' : 
                                batch.status === 'In Processing' ? 'secondary' : 'outline'
                              }>
                                {batch.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </CardContent>
                </Card>

                {/* Tracking History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Processing Timeline | ప్రాసెసింగ్ కాలక్రమం
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trackingHistory.map((event, index) => (
                        <div key={index} className="flex items-start gap-4 pb-4 border-b border-border last:border-b-0">
                          <div className={`w-3 h-3 rounded-full mt-1 ${
                            event.status === 'Completed' ? 'bg-success' :
                            event.status === 'In Progress' ? 'bg-warning animate-pulse' :
                            'bg-muted'
                          }`} />
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold">{event.stage}</h4>
                                <p className="text-sm text-muted-foreground">{event.timestamp}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant={
                                  event.status === 'Completed' ? 'default' :
                                  event.status === 'In Progress' ? 'secondary' :
                                  'outline'
                                }>
                                  {event.status}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm">{event.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quality Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Quality Parameters | నాణ్యత పరామితులు
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {qualityMetrics.map((metric, index) => (
                        <div key={index} className="p-4 border border-border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">{metric.parameter}</h4>
                            <Badge variant={metric.status === 'Pass' ? 'default' : 'destructive'}>
                              {metric.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Actual: <strong>{metric.value}</strong></span>
                            <span>Standard: <strong>{metric.standard}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
      <AgriAIPilotSidePeek 
        agentType="Batch Expert"
        agentName="Batch Tracking AI"
        agentNameTelugu="బ్యాచ్ ట్రాకింగ్ AI"
        services={[
          { title: "Batch Quality Analysis", titleTelugu: "బ్యాచ్ నాణ్యత విశ్లేషణ", description: "AI-powered quality parameter monitoring", descriptionTelugu: "AI ఆధారిత నాణ్యత పరామితుల పర్యవేక్షణ", duration: "15 min", price: "₹200", icon: Microscope, available: true },
          { title: "Production Timeline Optimization", titleTelugu: "ఉత్పాదన కాలక్రమం ఆప్టిమైజేషన్", description: "Optimize batch processing schedules", descriptionTelugu: "బ్యాచ్ ప్రాసెసింగ్ షెడ్యూల్‌లను ఆప్టిమైజ్ చేయండి", duration: "30 min", price: "₹400", icon: Clock, available: true },
          { title: "Yield Prediction", titleTelugu: "దిగుబడి అంచనా", description: "Predict batch output based on inputs", descriptionTelugu: "ఇన్‌పుట్‌ల ఆధారంగా బ్యాచ్ అవుట్‌పుట్‌ను అంచనా వేయండి", duration: "20 min", price: "₹300", icon: TrendingUp, available: true },
          { title: "Defect Detection", titleTelugu: "లోపం గుర్తింపు", description: "Early detection of quality issues", descriptionTelugu: "నాణ్యత సమస్యల ముందస్తు గుర్తింపు", duration: "25 min", price: "₹350", icon: Search, available: true }
        ]}
      />
      <AgriChatAgent />
    </div>
  );
};

export default BatchTracking;