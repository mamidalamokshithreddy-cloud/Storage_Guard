import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Download, Filter, FileText, BarChart3, Clock, CheckCircle, AlertTriangle, XCircle, Eye, ArrowLeft } from "lucide-react";
import AgriChatAgent from "../AgriChatAgent";

interface ComplianceLogsProps {
  onBackToAquaGuide?: () => void;
}

const ComplianceLogs = ({ onBackToAquaGuide }: ComplianceLogsProps = {}) => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [selectedField, setSelectedField] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const complianceData = [
    {
      id: 1,
      date: "2024-01-15",
      time: "06:00 AM",
      field: "North Field",
      type: "Irrigation Event",
      description: "Scheduled irrigation completed",
      duration: "45 minutes",
      waterUsed: "1250 L",
      efficiency: "92%",
      operator: "Auto (Soil Moisture)",
      status: "compliant",
      regulations: ["Water Use Permit", "Environmental Guidelines"],
      deviations: []
    },
    {
      id: 2,
      date: "2024-01-15",
      time: "03:30 AM", 
      field: "South Field",
      type: "Alert Response",
      description: "High pressure detected, auto-shutdown triggered",
      duration: "2 minutes",
      waterUsed: "0 L",
      efficiency: "N/A",
      operator: "System Auto",
      status: "compliant",
      regulations: ["Safety Standards", "Equipment Guidelines"],
      deviations: []
    },
    {
      id: 3,
      date: "2024-01-14",
      time: "08:15 PM",
      field: "East Field",
      type: "Manual Override",
      description: "Manual irrigation started outside schedule",
      duration: "25 minutes",
      waterUsed: "820 L",
      efficiency: "78%",
      operator: "Farm Manager",
      status: "deviation",
      regulations: ["Water Use Permit"],
      deviations: ["Outside scheduled hours", "No prior approval"]
    },
    {
      id: 4,
      date: "2024-01-14",
      time: "02:00 PM",
      field: "North Field",
      type: "Maintenance",
      description: "Filter cleaning and system check",
      duration: "120 minutes",
      waterUsed: "0 L",
      efficiency: "N/A",
      operator: "Maintenance Team",
      status: "compliant",
      regulations: ["Equipment Standards", "Safety Guidelines"],
      deviations: []
    },
    {
      id: 5,
      date: "2024-01-13",
      time: "07:30 AM",
      field: "South Field",
      type: "Fertigation",
      description: "Nutrient application with irrigation",
      duration: "60 minutes",
      waterUsed: "1580 L",
      efficiency: "89%",
      operator: "Auto (Crop Stage)",
      status: "non-compliant",
      regulations: ["Fertilizer Regulations", "Environmental Standards"],
      deviations: ["Exceeded permitted nutrient concentration", "No soil test report"]
    }
  ];

  const auditReports = [
    {
      id: 1,
      title: "Weekly Water Usage Report",
      period: "Jan 8-14, 2024",
      type: "Water Compliance",
      generatedOn: "2024-01-15",
      status: "approved",
      findings: "Within permitted limits",
      recommendations: "Continue current practices"
    },
    {
      id: 2,
      title: "Equipment Safety Audit",
      period: "January 2024",
      type: "Safety Compliance",
      generatedOn: "2024-01-10",
      status: "pending",
      findings: "Minor deviations found",
      recommendations: "Update maintenance schedule"
    },
    {
      id: 3,
      title: "Environmental Impact Assessment",
      period: "Q4 2023",
      type: "Environmental",
      generatedOn: "2024-01-05",
      status: "approved",
      findings: "Excellent compliance rating",
      recommendations: "Maintain current standards"
    }
  ];

  const regulations = [
    {
      id: 1,
      title: "Central Ground Water Authority",
      category: "Water Use",
      requirement: "Maximum 2000L/day per acre",
      currentUsage: "1850L/day per acre",
      compliance: "compliant",
      validity: "Valid until Dec 2024"
    },
    {
      id: 2,
      title: "State Pollution Control Board",
      category: "Environmental",
      requirement: "Nutrient runoff < 10mg/L",
      currentUsage: "8.5mg/L",
      compliance: "compliant",
      validity: "Valid until Jun 2024"
    },
    {
      id: 3,
      title: "Agricultural Equipment Safety",
      category: "Safety",
      requirement: "Monthly safety inspections",
      currentUsage: "Last inspection: 5 days ago",
      compliance: "compliant",
      validity: "Ongoing requirement"
    },
    {
      id: 4,
      title: "Organic Certification",
      category: "Quality",
      requirement: "No synthetic pesticides",
      currentUsage: "Only organic inputs used",
      compliance: "compliant",
      validity: "Valid until Mar 2025"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant": return "bg-green-100 text-green-800";
      case "deviation": return "bg-yellow-100 text-yellow-800";
      case "non-compliant": return "bg-red-100 text-red-800";
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "deviation":
      case "pending":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "non-compliant":
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSummaryStats = () => {
    const total = complianceData.length;
    const compliant = complianceData.filter(item => item.status === "compliant").length;
    const deviations = complianceData.filter(item => item.status === "deviation").length;
    const nonCompliant = complianceData.filter(item => item.status === "non-compliant").length;
    
    return {
      total,
      compliant,
      deviations,
      nonCompliant,
      complianceRate: Math.round((compliant / total) * 100)
    };
  };

  const stats = getSummaryStats();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <AgriChatAgent />
      
      <div className="ml-0 min-h-screen">
          {/* Custom Header with Back Button */}
          <div className="bg-background border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {onBackToAquaGuide && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBackToAquaGuide}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to AquaGuide
                  </Button>
                )}
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    Compliance Logs
                  </h1>
                  <p className="text-sm text-muted-foreground">కంప్లైయన్స్ లాగ్స్</p>
                </div>
              </div>
            </div>
          </div>
          
          <main className="flex-1 p-6">
            <div className="max-w-full mx-auto space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Total Events</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Compliant</p>
                        <p className="text-2xl font-bold text-green-600">{stats.compliant}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Deviations</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.deviations}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Non-Compliant</p>
                        <p className="text-2xl font-bold text-red-600">{stats.nonCompliant}</p>
                      </div>
                      <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Compliance Rate</p>
                        <p className="text-2xl font-bold text-primary">{stats.complianceRate}%</p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="logs" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="logs">Activity Logs</TabsTrigger>
                  <TabsTrigger value="reports">Audit Reports</TabsTrigger>
                  <TabsTrigger value="regulations">Regulations</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="logs" className="space-y-6">
                  {/* Filters */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filter Logs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="space-y-2">
                          <Label>From Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !dateFrom && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={dateFrom}
                                onSelect={setDateFrom}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>To Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !dateTo && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={dateTo}
                                onSelect={setDateTo}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Field</Label>
                          <Select value={selectedField} onValueChange={setSelectedField}>
                            <SelectTrigger>
                              <SelectValue placeholder="All fields" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Fields</SelectItem>
                              <SelectItem value="north">North Field</SelectItem>
                              <SelectItem value="south">South Field</SelectItem>
                              <SelectItem value="east">East Field</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Event Type</Label>
                          <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger>
                              <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="irrigation">Irrigation Event</SelectItem>
                              <SelectItem value="alert">Alert Response</SelectItem>
                              <SelectItem value="manual">Manual Override</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="fertigation">Fertigation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>&nbsp;</Label>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1">
                              Apply Filters
                            </Button>
                            <Button variant="outline">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity Log Entries */}
                  <div className="space-y-4">
                    {complianceData.map((log) => (
                      <Card key={log.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(log.status)}
                              <div>
                                <h4 className="font-semibold">{log.description}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {log.date} at {log.time} • {log.field} • {log.operator}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(log.status)}>
                                {log.status}
                              </Badge>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                              <div className="text-lg font-semibold text-blue-800">{log.duration}</div>
                              <div className="text-xs text-blue-600">Duration</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <div className="text-lg font-semibold text-green-800">{log.waterUsed}</div>
                              <div className="text-xs text-green-600">Water Used</div>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                              <div className="text-lg font-semibold text-purple-800">{log.efficiency}</div>
                              <div className="text-xs text-purple-600">Efficiency</div>
                            </div>
                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                              <div className="text-lg font-semibold text-orange-800">{log.type}</div>
                              <div className="text-xs text-orange-600">Event Type</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium">Applicable Regulations: </span>
                              <div className="flex gap-1 mt-1">
                                {log.regulations.map((reg, index) => (
                                  <Badge key={index} variant="outline">{reg}</Badge>
                                ))}
                              </div>
                            </div>

                            {log.deviations.length > 0 && (
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <span className="text-sm font-medium text-yellow-800">Deviations Noted:</span>
                                <ul className="list-disc list-inside text-sm text-yellow-700 mt-1">
                                  {log.deviations.map((deviation, index) => (
                                    <li key={index}>{deviation}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="reports" className="space-y-6">
                  <div className="grid gap-6">
                    {auditReports.map((report) => (
                      <Card key={report.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>{report.title}</CardTitle>
                              <CardDescription>
                                {report.period} • Generated on {report.generatedOn}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(report.status)}>
                                {report.status}
                              </Badge>
                              <Button size="sm" variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm font-medium">Key Findings:</span>
                              <p className="text-sm text-muted-foreground mt-1">{report.findings}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Recommendations:</span>
                              <p className="text-sm text-muted-foreground mt-1">{report.recommendations}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="regulations" className="space-y-6">
                  <div className="grid gap-6">
                    {regulations.map((reg) => (
                      <Card key={reg.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>{reg.title}</CardTitle>
                              <CardDescription>{reg.category}</CardDescription>
                            </div>
                            <Badge className={getStatusColor(reg.compliance)}>
                              {reg.compliance}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm font-medium">Requirement:</span>
                                <p className="text-sm text-muted-foreground">{reg.requirement}</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium">Current Status:</span>
                                <p className="text-sm text-muted-foreground">{reg.currentUsage}</p>
                              </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium">Validity: </span>
                              <span className="text-sm text-muted-foreground">{reg.validity}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Compliance Trends</CardTitle>
                        <CardDescription>Monthly compliance rates over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {["December", "January", "February"].map((month, index) => (
                            <div key={month} className="flex items-center justify-between">
                              <span className="text-sm font-medium">{month} 2024</span>
                              <div className="flex items-center gap-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-600 h-2 rounded-full" 
                                    style={{ width: `${95 - index * 2}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-muted-foreground">{95 - index * 2}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Deviation Categories</CardTitle>
                        <CardDescription>Common types of compliance deviations</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            { category: "Schedule Deviations", count: 5, percentage: 40 },
                            { category: "Water Limit Exceeded", count: 3, percentage: 24 },
                            { category: "Equipment Safety", count: 2, percentage: 16 },
                            { category: "Documentation Issues", count: 2, percentage: 16 },
                            { category: "Other", count: 1, percentage: 8 }
                          ].map((item) => (
                            <div key={item.category} className="flex items-center justify-between">
                              <span className="text-sm font-medium">{item.category}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">{item.count}</span>
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-yellow-600 h-2 rounded-full" 
                                    style={{ width: `${item.percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </main>
      </div>
    </div>
  );
};

export default ComplianceLogs;