import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import { Zap, Wifi, Settings, Play, Pause, AlertTriangle, CheckCircle, Gauge, Wrench, Power, ArrowLeft } from "lucide-react";
import AgriChatAgent from "../AgriChatAgent";

interface EquipmentIntegrationProps {
  onBackToAquaGuide?: () => void;
}

const EquipmentIntegration = ({ onBackToAquaGuide }: EquipmentIntegrationProps = {}) => {
  // const [selectedZone, setSelectedZone] = useState("zone-1"); // Commented - not used yet

  const pumpStations = [
    {
      id: "pump-1",
      name: "Main Pump Station",
      type: "Centrifugal",
      power: "15 HP",
      flow: "450 LPM",
      pressure: "3.2 Bar",
      status: "active",
      efficiency: 87,
      runtime: "2h 15m",
      nextMaintenance: "5 days"
    },
    {
      id: "pump-2", 
      name: "Backup Pump",
      type: "Submersible",
      power: "10 HP",
      flow: "320 LPM",
      pressure: "2.8 Bar",
      status: "standby",
      efficiency: 92,
      runtime: "0h 0m",
      nextMaintenance: "12 days"
    },
    {
      id: "pump-3",
      name: "Boost Pump",
      type: "Booster",
      power: "5 HP", 
      flow: "180 LPM",
      pressure: "4.5 Bar",
      status: "maintenance",
      efficiency: 78,
      runtime: "0h 0m",
      nextMaintenance: "Today"
    }
  ];

  const dripSystems = [
    {
      id: "drip-1",
      zone: "North Field",
      laterals: 24,
      emitters: 1440,
      flowRate: "2.0 LPH",
      pressure: "1.5 Bar",
      status: "active",
      efficiency: 95,
      coverage: "100%",
      blockages: 2
    },
    {
      id: "drip-2",
      zone: "South Field", 
      laterals: 18,
      emitters: 1080,
      flowRate: "2.2 LPH",
      pressure: "1.4 Bar",
      status: "scheduled",
      efficiency: 92,
      coverage: "98%",
      blockages: 0
    },
    {
      id: "drip-3",
      zone: "East Field",
      laterals: 20,
      emitters: 1200,
      flowRate: "1.8 LPH",
      pressure: "1.6 Bar", 
      status: "offline",
      efficiency: 88,
      coverage: "85%",
      blockages: 5
    }
  ];

  const valveControls = [
    { id: "valve-1", name: "Main Inlet", type: "Ball Valve", status: "open", position: 100, automation: true },
    { id: "valve-2", name: "Zone 1 Control", type: "Solenoid", status: "open", position: 75, automation: true },
    { id: "valve-3", name: "Zone 2 Control", type: "Solenoid", status: "closed", position: 0, automation: true },
    { id: "valve-4", name: "Drain Valve", type: "Manual", status: "closed", position: 0, automation: false },
    { id: "valve-5", name: "Pressure Relief", type: "Safety", status: "closed", position: 0, automation: false }
  ];

  const sensors = [
    { id: "sensor-1", type: "Flow", location: "Main Line", reading: "425 LPM", status: "normal", battery: 89 },
    { id: "sensor-2", type: "Pressure", location: "Header", reading: "3.1 Bar", status: "normal", battery: 76 },
    { id: "sensor-3", type: "pH", location: "Fertigation", reading: "6.8", status: "optimal", battery: 92 },
    { id: "sensor-4", type: "EC", location: "Fertigation", reading: "1.2 dS/m", status: "normal", battery: 84 },
    { id: "sensor-5", type: "Temperature", location: "Tank", reading: "24°C", status: "normal", battery: 67 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "standby": return "bg-blue-100 text-blue-800";
      case "maintenance": return "bg-orange-100 text-orange-800";
      case "offline": return "bg-red-100 text-red-800";
      case "scheduled": return "bg-purple-100 text-purple-800";
      case "open": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "maintenance": return <Wrench className="w-4 h-4 text-orange-600" />;
      case "offline": return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Power className="w-4 h-4 text-gray-600" />;
    }
  };

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
                    <Zap className="w-6 h-6 text-primary" />
                    Equipment Integration
                  </h1>
                  <p className="text-sm text-muted-foreground">పరికరాల ఇంటిగ్రేషన్</p>
                </div>
              </div>
            </div>
          </div>
          
          <main className="flex-1 p-6">
            <div className="max-w-full mx-auto space-y-6">
              {/* Quick Control Panel */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">System Status</p>
                        <p className="text-2xl font-bold text-green-600">Online</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Active Pumps</p>
                        <p className="text-2xl font-bold text-blue-600">2/3</p>
                      </div>
                      <Gauge className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Total Flow</p>
                        <p className="text-2xl font-bold text-purple-600">770 LPM</p>
                      </div>
                      <Gauge className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Efficiency</p>
                        <p className="text-2xl font-bold text-orange-600">91%</p>
                      </div>
                      <Settings className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="pumps" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="pumps">Pump Stations</TabsTrigger>
                  <TabsTrigger value="drip">Drip Systems</TabsTrigger>
                  <TabsTrigger value="valves">Valve Control</TabsTrigger>
                  <TabsTrigger value="sensors">Sensors</TabsTrigger>
                  <TabsTrigger value="automation">Automation</TabsTrigger>
                </TabsList>

                <TabsContent value="pumps" className="space-y-6">
                  <div className="grid gap-6">
                    {pumpStations.map((pump) => (
                      <Card key={pump.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(pump.status)}
                              <div>
                                <CardTitle>{pump.name}</CardTitle>
                                <CardDescription>
                                  {pump.type} • {pump.power} • {pump.flow}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(pump.status)}>
                                {pump.status}
                              </Badge>
                              {pump.status === "active" && (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline">
                                    <Pause className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                              {pump.status === "standby" && (
                                <Button size="sm" variant="outline">
                                  <Play className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                              <div className="text-lg font-semibold text-blue-800">{pump.pressure}</div>
                              <div className="text-xs text-blue-600">Pressure</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <div className="text-lg font-semibold text-green-800">{pump.efficiency}%</div>
                              <div className="text-xs text-green-600">Efficiency</div>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                              <div className="text-lg font-semibold text-purple-800">{pump.runtime}</div>
                              <div className="text-xs text-purple-600">Runtime Today</div>
                            </div>
                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                              <div className="text-lg font-semibold text-orange-800">{pump.nextMaintenance}</div>
                              <div className="text-xs text-orange-600">Next Service</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="drip" className="space-y-6">
                  <div className="grid gap-6">
                    {dripSystems.map((drip) => (
                      <Card key={drip.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>{drip.zone} Drip System</CardTitle>
                              <CardDescription>
                                {drip.laterals} Laterals • {drip.emitters} Emitters • {drip.flowRate}
                              </CardDescription>
                            </div>
                            <Badge className={getStatusColor(drip.status)}>
                              {drip.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                              <div className="text-lg font-semibold text-blue-800">{drip.pressure}</div>
                              <div className="text-xs text-blue-600">Pressure</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <div className="text-lg font-semibold text-green-800">{drip.efficiency}%</div>
                              <div className="text-xs text-green-600">Efficiency</div>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                              <div className="text-lg font-semibold text-purple-800">{drip.coverage}</div>
                              <div className="text-xs text-purple-600">Coverage</div>
                            </div>
                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                              <div className="text-lg font-semibold text-orange-800">{drip.blockages}</div>
                              <div className="text-xs text-orange-600">Blockages</div>
                            </div>
                          </div>
                          
                          {drip.blockages > 0 && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                <span className="text-sm font-medium text-yellow-800">
                                  {drip.blockages} emitter blockage(s) detected
                                </span>
                              </div>
                              <Button size="sm" variant="outline" className="mt-2">
                                Schedule Cleaning
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="valves" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {valveControls.map((valve) => (
                      <Card key={valve.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{valve.name}</CardTitle>
                              <CardDescription>{valve.type}</CardDescription>
                            </div>
                            <Badge className={getStatusColor(valve.status)}>
                              {valve.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span>Position</span>
                                <span>{valve.position}%</span>
                              </div>
                              <Progress value={valve.position} className="h-2" />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Automation</span>
                              <Switch checked={valve.automation} />
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1"
                                disabled={!valve.automation}
                              >
                                Open
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1"
                                disabled={!valve.automation}
                              >
                                Close
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="sensors" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sensors.map((sensor) => (
                      <Card key={sensor.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{sensor.type} Sensor</CardTitle>
                              <CardDescription>{sensor.location}</CardDescription>
                            </div>
                            <Wifi className={`w-5 h-5 ${sensor.battery > 70 ? 'text-green-600' : sensor.battery > 30 ? 'text-yellow-600' : 'text-red-600'}`} />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="text-center p-4 bg-primary/5 rounded-lg">
                              <div className="text-2xl font-bold text-primary">{sensor.reading}</div>
                              <div className="text-sm text-muted-foreground">Current Reading</div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span>Battery Level</span>
                                <span>{sensor.battery}%</span>
                              </div>
                              <Progress value={sensor.battery} className="h-2" />
                            </div>
                            
                            <Badge className={getStatusColor(sensor.status)}>
                              {sensor.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="automation" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Automation Rules</CardTitle>
                        <CardDescription>Configure automated responses to sensor inputs</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Low Pressure Alert</span>
                            <Switch defaultChecked />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Auto-start backup pump when pressure drops below 2.5 Bar
                          </p>
                        </div>
                        
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">High Flow Protection</span>
                            <Switch defaultChecked />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Close main valve if flow exceeds 500 LPM for 5 minutes
                          </p>
                        </div>
                        
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Fertigation Auto-Mix</span>
                            <Switch />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Automatically adjust EC/pH based on crop requirements
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>System Diagnostics</CardTitle>
                        <CardDescription>Real-time system health monitoring</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="font-medium">Communication</span>
                            </div>
                            <span className="text-green-600 text-sm">Healthy</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="font-medium">Power Supply</span>
                            </div>
                            <span className="text-green-600 text-sm">Stable</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-yellow-600" />
                              <span className="font-medium">Filter Pressure</span>
                            </div>
                            <span className="text-yellow-600 text-sm">High</span>
                          </div>
                          
                          <Button className="w-full agri-button-primary">
                            Run Full Diagnostic
                          </Button>
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

export default EquipmentIntegration;