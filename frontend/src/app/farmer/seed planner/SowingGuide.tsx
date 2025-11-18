import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Camera,
  FileText,
  Clock
} from "lucide-react";
// import PageHeader from "../PageHeader";
// import AgriAgentsSidebar from "../AgriAgentsSidebar";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";

interface SowingGuideProps {
  onBackToSeedPlanner?: () => void;
  onNavigateToAquaGuide?: () => void;
}

const SowingGuide = ({ onBackToSeedPlanner, onNavigateToAquaGuide }: SowingGuideProps = {}) => {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  interface Deviation {
    id: string;
    type: string;
    description: string;
  }
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [activeTab, setActiveTab] = useState("tasks");

  // Guided Tasks Data
  const guidedTasks = [
    {
      id: "tillage",
      phase: "Land Preparation",
      title: "Primary Tillage",
      titleTelugu: "ప్రాథమిక దున్నుట",
      description: "Deep plowing to break hard pan and improve soil structure",
      duration: "2-3 days",
      equipment: ["Tractor", "MB Plow"],
      depth: "8-10 inches",
      moisture: "Field capacity - 20%",
      weather: "No rain forecast for 3 days",
      status: "pending",
      priority: "high",
      dependencies: [],
      instructions: [
        "Check soil moisture before starting",
        "Maintain consistent depth across field",
        "Overlap furrows by 2-3 inches",
        "Avoid wet patches"
      ]
    },
    {
      id: "leveling",
      phase: "Land Preparation", 
      title: "Land Leveling",
      titleTelugu: "భూమి సమం చేయుట",
      description: "Level the field for uniform water distribution",
      duration: "1-2 days",
      equipment: ["Laser Land Leveler", "Tractor"],
      tolerance: "±3 cm variation",
      moisture: "Optimum working condition",
      weather: "Clear weather required",
      status: "pending",
      priority: "high",
      dependencies: ["tillage"],
      instructions: [
        "Survey field for high and low spots",
        "Set laser level reference",
        "Move soil from high to low areas",
        "Final pass for smoothening"
      ]
    },
    {
      id: "sowing",
      phase: "Sowing",
      title: "Seed Sowing",
      titleTelugu: "విత్తన వేయుట",
      description: "Plant cotton seeds at optimal density and depth",
      duration: "1 day",
      equipment: ["Cotton Planter", "Tractor"],
      seedRate: "1.5 kg/acre",
      rowSpacing: "90 cm",
      plantSpacing: "15 cm",
      depth: "2-3 cm",
      status: "pending",
      priority: "critical",
      dependencies: ["tillage", "leveling"],
      instructions: [
        "Calibrate planter for seed rate",
        "Maintain row spacing accuracy",
        "Cover seeds with fine soil",
        "Light irrigation immediately after sowing"
      ]
    },
    {
      id: "germination",
      phase: "Establishment",
      title: "Germination Audit",
      titleTelugu: "మొలకల తనిఖీ",
      description: "Check germination percentage in sample plots",
      duration: "7-10 days after sowing",
      equipment: ["Measuring tape", "Counter", "Camera"],
      target: ">85% germination",
      method: "10 random 1m² plots",
      frequency: "Daily monitoring",
      status: "pending",
      priority: "medium",
      dependencies: ["sowing"],
      instructions: [
        "Mark 10 random 1m² sample plots",
        "Count emerged seedlings daily",
        "Record germination percentage",
        "Take photos for documentation"
      ]
    }
  ];

  // Sample plot data for germination audit
  const samplePlots = [
    { plotId: "P1", expectedSeeds: 67, germinatedSeeds: 58, percentage: 87 },
    { plotId: "P2", expectedSeeds: 67, germinatedSeeds: 61, percentage: 91 },
    { plotId: "P3", expectedSeeds: 67, germinatedSeeds: 55, percentage: 82 },
    { plotId: "P4", expectedSeeds: 67, germinatedSeeds: 59, percentage: 88 },
    { plotId: "P5", expectedSeeds: 67, germinatedSeeds: 63, percentage: 94 },
    { plotId: "P6", expectedSeeds: 67, germinatedSeeds: 57, percentage: 85 },
    { plotId: "P7", expectedSeeds: 67, germinatedSeeds: 60, percentage: 90 },
    { plotId: "P8", expectedSeeds: 67, germinatedSeeds: 52, percentage: 78 },
    { plotId: "P9", expectedSeeds: 67, germinatedSeeds: 64, percentage: 96 },
    { plotId: "P10", expectedSeeds: 67, germinatedSeeds: 58, percentage: 87 }
  ];

  // Deviation alerts
  const deviationAlerts = [
    {
      id: "D1",
      task: "Land Leveling",
      deviation: "Variation exceeds ±3cm in 15% of field",
      severity: "medium",
      impact: "May affect irrigation uniformity",
      correctiveAction: "Re-level affected areas before sowing",
      status: "action_required",
      reportedBy: "Field Supervisor",
      reportedDate: "2024-03-12"
    },
    {
      id: "D2", 
      task: "Germination Audit",
      deviation: "Plot P3 & P8 showing <85% germination",
      severity: "high",
      impact: "Reduced plant population in 20% area",
      correctiveAction: "Gap filling with extra seeds in affected areas",
      status: "in_progress",
      reportedBy: "AgriPilot Drone",
      reportedDate: "2024-03-20"
    }
  ];

  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const canStartTask = (task: any) => {
    return task.dependencies.every((dep: string) => completedTasks.includes(dep));
  };

  return (
    <div className="min-h-screen field-gradient">
      {/* <AgriAgentsSidebar /> */}
      <AgriChatAgent />
      <AgriAIPilotSidePeek
        agentType="SowingGuide"
        agentName="Sowing & Establishment Guide"
        agentNameTelugu="వేయడం మరియు స్థాపన మార్గదర్శకం"
        services={[]}
      />
      
      <div className="ml-0 min-h-screen">
        {/* <PageHeader
          title="Sowing & Establishment Guide"
          titleTelugu="వేయడం మరియు స్థాపన మార్గదర్శకం"
          icon={Sprout}
          backButton={{ label: "Procurement", route: "/seed-planner/procurement" }}
        /> */}

        <div className="max-w-full mx-auto px-1 py-2">
          {/* Progress Overview */}
          <Card className="agri-card mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Overall Progress | మొత్తం పురోగతి</h2>
                <Badge className="bg-primary text-primary-foreground">
                  {Math.round((completedTasks.length / guidedTasks.length) * 100)}% Complete
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{completedTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Tasks Completed</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-warning">{deviationAlerts.length}</p>
                  <p className="text-sm text-muted-foreground">Deviations</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-success">87%</p>
                  <p className="text-sm text-muted-foreground">Avg Germination</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-accent">5 days</p>
                  <p className="text-sm text-muted-foreground">Time Remaining</p>
                </div>
              </div>
            </div>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tasks">Guided Tasks</TabsTrigger>
              <TabsTrigger value="germination">Germination Audit</TabsTrigger>
              <TabsTrigger value="deviations">Deviations</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            {/* Guided Tasks Tab */}
            <TabsContent value="tasks">
              <div className="space-y-6">
                {guidedTasks.map((task) => {
                  const isCompleted = completedTasks.includes(task.id);
                  const canStart = canStartTask(task);
                  
                  return (
                    <Card key={task.id} className={`agri-card ${isCompleted ? 'bg-success/5 border-success/20' : canStart ? '' : 'opacity-60'}`}>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <div className="mt-1">
                              {isCompleted ? (
                                <CheckCircle2 className="w-6 h-6 text-success" />
                              ) : canStart ? (
                                <Clock className="w-6 h-6 text-warning" />
                              ) : (
                                <Clock className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-bold">{task.title}</h3>
                                <span className="text-accent font-semibold">| {task.titleTelugu}</span>
                                <Badge variant={
                                  task.priority === 'critical' ? 'destructive' :
                                  task.priority === 'high' ? 'default' : 'secondary'
                                }>
                                  {task.priority}
                                </Badge>
                              </div>
                              
                              <p className="text-muted-foreground mb-3">{task.description}</p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                <div>
                                  <p className="text-muted-foreground">Phase</p>
                                  <p className="font-semibold">{task.phase}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Duration</p>
                                  <p className="font-semibold">{task.duration}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Equipment</p>
                                  <p className="font-semibold">{task.equipment.join(", ")}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Status</p>
                                  <Badge variant={isCompleted ? 'default' : canStart ? 'secondary' : 'outline'}>
                                    {isCompleted ? 'Completed' : canStart ? 'Ready' : 'Waiting'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Task-specific details */}
                        <div className="ml-10 space-y-4">
                          {task.id === 'tillage' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Depth Required</p>
                                <p className="font-semibold">{task.depth}</p>
                              </div>
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Soil Moisture</p>
                                <p className="font-semibold">{task.moisture}</p>
                              </div>
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Weather</p>
                                <p className="font-semibold">{task.weather}</p>
                              </div>
                            </div>
                          )}

                          {task.id === 'sowing' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Seed Rate</p>
                                <p className="font-semibold">{task.seedRate}</p>
                              </div>
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Row Spacing</p>
                                <p className="font-semibold">{task.rowSpacing}</p>
                              </div>
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Plant Spacing</p>
                                <p className="font-semibold">{task.plantSpacing}</p>
                              </div>
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Depth</p>
                                <p className="font-semibold">{task.depth}</p>
                              </div>
                            </div>
                          )}

                          {task.id === 'germination' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Target</p>
                                <p className="font-semibold">{task.target}</p>
                              </div>
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Method</p>
                                <p className="font-semibold">{task.method}</p>
                              </div>
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Frequency</p>
                                <p className="font-semibold">{task.frequency}</p>
                              </div>
                            </div>
                          )}

                          {/* Instructions */}
                          <div>
                            <p className="font-semibold mb-2">Instructions:</p>
                            <ul className="space-y-1">
                              {task.instructions.map((instruction, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                                  <span>{instruction}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4">
                            <Button
                              className={isCompleted ? "agri-button-secondary" : "agri-button-primary"}
                              onClick={() => toggleTaskCompletion(task.id)}
                              disabled={!canStart}
                            >
                              {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                            </Button>
                            
                            <Button variant="outline" size="sm">
                              <Camera className="w-4 h-4 mr-1" />
                              Add Photo
                            </Button>
                            
                            <Button variant="outline" size="sm">
                              <FileText className="w-4 h-4 mr-1" />
                              Report Issue
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Germination Audit Tab */}
            <TabsContent value="germination">
              <div className="space-y-6">
                <Card className="agri-card">
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Germination Audit Results | మొలకల ఆడిట్ ఫలితాలు</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="p-4 bg-success/10 rounded-lg border border-success/20 text-center">
                        <p className="text-3xl font-bold text-success">87%</p>
                        <p className="text-sm text-muted-foreground">Average Germination</p>
                      </div>
                      <div className="p-4 bg-warning/10 rounded-lg border border-warning/20 text-center">
                        <p className="text-3xl font-bold text-warning">2</p>
                        <p className="text-sm text-muted-foreground">Plots Below Target</p>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 text-center">
                        <p className="text-3xl font-bold text-primary">8</p>
                        <p className="text-sm text-muted-foreground">Plots Above Target</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2">Plot ID</th>
                            <th className="text-left py-2">Expected Seeds</th>
                            <th className="text-left py-2">Germinated</th>
                            <th className="text-left py-2">Percentage</th>
                            <th className="text-left py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {samplePlots.map((plot) => (
                            <tr key={plot.plotId} className="border-b border-border/50">
                              <td className="py-2 font-semibold">{plot.plotId}</td>
                              <td className="py-2">{plot.expectedSeeds}</td>
                              <td className="py-2">{plot.germinatedSeeds}</td>
                              <td className="py-2">
                                <span className={`font-semibold ${plot.percentage >= 85 ? 'text-success' : 'text-destructive'}`}>
                                  {plot.percentage}%
                                </span>
                              </td>
                              <td className="py-2">
                                <Badge variant={plot.percentage >= 85 ? 'default' : 'destructive'}>
                                  {plot.percentage >= 85 ? 'Pass' : 'Fail'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Deviations Tab */}
            <TabsContent value="deviations">
              <div className="space-y-6">
                {deviationAlerts.map((deviation) => (
                  <Card key={deviation.id} className={`agri-card border-l-4 ${
                    deviation.severity === 'high' ? 'border-l-destructive' :
                    deviation.severity === 'medium' ? 'border-l-warning' : 'border-l-primary'
                  }`}>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className={`w-5 h-5 ${
                              deviation.severity === 'high' ? 'text-destructive' :
                              deviation.severity === 'medium' ? 'text-warning' : 'text-primary'
                            }`} />
                            <h3 className="text-lg font-bold">{deviation.task}</h3>
                            <Badge variant={
                              deviation.severity === 'high' ? 'destructive' :
                              deviation.severity === 'medium' ? 'secondary' : 'default'
                            }>
                              {deviation.severity} severity
                            </Badge>
                          </div>
                          
                          <p className="text-muted-foreground mb-2">{deviation.deviation}</p>
                          <p className="text-sm mb-3"><strong>Impact:</strong> {deviation.impact}</p>
                        </div>
                        
                        <Badge variant={
                          deviation.status === 'action_required' ? 'destructive' :
                          deviation.status === 'in_progress' ? 'secondary' : 'default'
                        }>
                          {deviation.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="p-4 bg-accent/10 rounded-lg border border-accent/20 mb-4">
                        <p className="font-semibold text-accent mb-1">Corrective Action:</p>
                        <p className="text-sm">{deviation.correctiveAction}</p>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Reported by: {deviation.reportedBy}</span>
                        <span>Date: {deviation.reportedDate}</span>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <Button size="sm" className="agri-button-primary">
                          Take Action
                        </Button>
                        <Button size="sm" variant="outline">
                          Mark Resolved
                        </Button>
                        <Button size="sm" variant="outline">
                          Add Notes
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports">
              <Card className="agri-card">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-6">Sowing & Establishment Report | వేయడం మరియు స్థాపన నివేదిక</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-semibold mb-3">Task Completion Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Land Preparation:</span>
                          <Badge variant="default">100%</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Sowing:</span>
                          <Badge variant="secondary">75%</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Establishment:</span>
                          <Badge variant="outline">25%</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-semibold mb-3">Quality Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Germination Rate:</span>
                          <span className="font-semibold text-success">87%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Plant Population:</span>
                          <span className="font-semibold">58,200/acre</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Uniformity:</span>
                          <span className="font-semibold text-warning">Good</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button className="agri-button-primary">
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Full Report
                    </Button>
                    <Button variant="outline">
                      Export Data
                    </Button>
                    <Button variant="outline">
                      Share with AgriPilot
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Navigation Actions */}
          <div className="flex gap-4 mt-8">
            <Button 
              className="agri-button-primary"
              onClick={() => {
                console.log('Proceeding to AquaGuide');
                onNavigateToAquaGuide?.();
              }}
            >
              Proceed to AquaGuide
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                console.log('Going back to SeedPlanner');
                onBackToSeedPlanner?.();
              }}
            >
              Back to SeedPlanner
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SowingGuide;