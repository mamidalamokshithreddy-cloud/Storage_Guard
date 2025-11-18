import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Calendar, Clock, Droplets, Thermometer, Leaf, MapPin, Settings, Play, Pause, RotateCcw, ArrowLeft } from "lucide-react";
import AgriChatAgent from "../AgriChatAgent";
// Provide types for the missing module so `import type ... from "@/hooks/usePlotData"` below resolves,
// and implement a local fallback hook used at runtime.

/* Local types for plot data used by this component (avoids module augmentation and path alias issues) */
type Plot = {
  id: string;
  name: string;
  area?: string;
  crop?: string;
  stage?: string;
};

type PlotMeasurements = {
  soil_moisture?: number;
  temperature?: number;
  humidity?: number;
  water_usage_today?: number;
  target?: number;
  remaining?: number;
};

type PlotWeather = {
  temperature?: number;
  humidity?: number;
  rainfall?: number;
  wind_speed?: number;
};

type IrrigationSchedule = {
  id: string;
  field_id?: string;
  field_name?: string;
  scheduled_time: string;
  duration_minutes: number;
  method?: string;
  status?: "scheduled" | "active" | "completed";
  water_amount?: number;
  sensor_data?: {
    soil_moisture?: number;
    temperature?: number;
    humidity?: number;
  };
};

/* Runtime fallback hook (used when a real "@/hooks/usePlotData" module isn't available).
   The shape matches what the component expects. */
const usePlotData = (): {
  data: {
    plots: Plot[];
    selectedPlot?: Plot | null;
    measurements: PlotMeasurements;
    weather: PlotWeather;
    schedule: IrrigationSchedule[];
  };
  loading: Record<string, boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: Record<string, any>;
  selectPlot: (_id: string) => void;
  updateSchedule: (_id: string, _patch: Partial<IrrigationSchedule>) => void;
  createSchedule: (_payload: Partial<IrrigationSchedule> & { field_id?: string; scheduling_mode?: string }) => void;
  selectedPlotId?: string;
} => {
  const plots: Plot[] = [
    { id: "field-1", name: "North Field - Cotton", area: "5.2 acres", crop: "Cotton", stage: "Flowering" },
    { id: "field-2", name: "South Field - Rice", area: "3.8 acres", crop: "Rice", stage: "Tillering" },
  ];

  const schedules: IrrigationSchedule[] = [
    {
      id: "sched-1",
      field_id: "field-1",
      field_name: "North Field - Cotton",
      scheduled_time: new Date().toISOString(),
      duration_minutes: 30,
      method: "sprinkler",
      status: "scheduled",
      water_amount: 10,
      sensor_data: { soil_moisture: 45, temperature: 28, humidity: 60 },
    },
  ];

  const measurements: PlotMeasurements = {
    soil_moisture: 45,
    temperature: 28,
    humidity: 60,
    water_usage_today: 250,
    target: 350,
    remaining: 100,
  };

  const weather: PlotWeather = {
    temperature: 28,
    humidity: 60,
    rainfall: 0,
    wind_speed: 5,
  };

  const loading = {
    measurements: false,
    schedule: false,
    et: false,
    soilMoisture: false,
    cropStage: false,
  };

  const error = {
    measurements: null,
    schedule: null,
    et: null,
    soilMoisture: null,
    cropStage: null,
  };

  const selectPlot = (id: string) => {
    /* noop fallback */
    console.info("selectPlot (fallback) called with", id);
  };

  const updateSchedule = (id: string, patch: Partial<IrrigationSchedule>) => {
    console.info("updateSchedule (fallback) called", id, patch);
  };

  const createSchedule = (payload: Partial<IrrigationSchedule> & { field_id?: string; scheduling_mode?: string }) => {
    console.info("createSchedule (fallback) called", payload);
  };

  const selectedPlot = plots[0];
  const selectedPlotId = selectedPlot?.id;

  return {
    data: {
      plots,
      selectedPlot,
      measurements,
      weather,
      schedule: schedules,
    },
    loading,
    error,
    selectPlot,
    updateSchedule,
    createSchedule,
    selectedPlotId,
  };
};

interface IrrigationSchedulingProps {
  onBackToAquaGuide?: () => void;
}

const IrrigationScheduling = ({ onBackToAquaGuide }: IrrigationSchedulingProps) => {
  const [selectedField, setSelectedField] = useState<string>("field-1");
  const [autoMode, setAutoMode] = useState(true);

  const {
    data: { schedule: schedules },
    loading,
    error,
    // selectPlot,
    updateSchedule,
    createSchedule,
    // selectedPlotId,
  } = usePlotData();

  // Mock data for compatibility with existing code structure
  const etData = {
    reference_et: 6.2,
    crop_coefficient: 1.15,
    crop_et: 7.1,
    effective_rainfall: 2.5,
    status: 'optimal'
  };
  
  const soilMoisture = [
    { depth: '0-15cm', moisture_percentage: 45, status: 'Optimal' },
    { depth: '15-30cm', moisture_percentage: 52, status: 'Good' },
    { depth: '30-45cm', moisture_percentage: 38, status: 'Low' }
  ];
  
  const cropStage = {
    current_stage: 'Flowering',
    water_requirement: { level: 'High', kc_range: '1.1-1.2' },
    is_critical_period: true,
    days_in_stage: 15,
    expected_duration: '25-30 days'
  };
  
  const waterUsage = {
    today_usage: 250,
    target: 350,
    remaining: 100
  };
  
  const refreshSchedule = () => {};

  const fields = [
    { id: "field-1", name: "North Field - Cotton", area: "5.2 acres", crop: "Cotton", stage: "Flowering" },
    { id: "field-2", name: "South Field - Rice", area: "3.8 acres", crop: "Rice", stage: "Tillering" },
    { id: "field-3", name: "East Field - Wheat", area: "4.5 acres", crop: "Wheat", stage: "Grain Filling" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getParameterColor = (status: string) => {
    switch (status) {
      case "optimal": return "text-green-600";
      case "normal": return "text-blue-600";
      case "low": return "text-orange-600";
      case "high": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-subtle flex">
        <AgriChatAgent />
        <div className="flex-1 min-h-screen">
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
                    <Calendar className="w-6 h-6 text-primary" />
                    Irrigation Scheduling
                  </h1>
                  <p className="text-sm text-muted-foreground">నీటిపారుదల షెడ్యూలింగ్</p>
                </div>
              </div>
            </div>
          </div>

          <main className="flex-1 p-6">
            <div className="max-w-full mx-auto space-y-6">
              {/* Field Selection & Mode Toggle */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Field Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Field Selection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedField} onValueChange={setSelectedField}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{field.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {field.area} • {field.stage}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Scheduling Mode */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      Scheduling Mode
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-mode"
                        checked={autoMode}
                        onCheckedChange={setAutoMode}
                      />
                      <Label htmlFor="auto-mode" className="text-sm">
                        {autoMode ? "Automatic Scheduling" : "Manual Scheduling"}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {autoMode 
                        ? "AI determines optimal irrigation times based on ET, soil moisture & crop stage"
                        : "Manual control over irrigation timing and duration"
                      }
                    </p>
                  </CardContent>
                </Card>

                {/* Water Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-primary" />
                      Water Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading.measurements ? (
                      <div className="text-center">Loading water usage...</div>
                    ) : error.measurements ? (
                      <div className="text-red-600">
                        Error loading water usage: {typeof error.measurements === "string" ? error.measurements : error.measurements?.message ?? "Unknown error"}
                      </div>
                    ) : waterUsage && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Today's Usage</span>
                          <span className="font-medium">{waterUsage.today_usage} L</span>
                        </div>
                        <Progress value={Math.min(100, (waterUsage.today_usage / waterUsage.target) * 100)} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Target: {waterUsage.target} L</span>
                          <span>Remaining: {waterUsage.remaining} L</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Main Tabs */}
              <Tabs defaultValue="schedules" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="schedules">Today's Schedule</TabsTrigger>
                  <TabsTrigger value="et-calculation">ET Calculation</TabsTrigger>
                  <TabsTrigger value="soil-moisture">Soil Moisture</TabsTrigger>
                  <TabsTrigger value="crop-stage">Crop Stage</TabsTrigger>
                </TabsList>

                {/* Schedule Tab */}
                <TabsContent value="schedules" className="space-y-6">
                  {loading.schedule ? (
                    <div className="text-center">Loading schedules...</div>
                  ) : error.schedule ? (
                    <div className="text-red-600">Error loading schedules: {error.schedule.message}</div>
                  ) : schedules && schedules.length > 0 ? (
                    <div className="grid gap-6">
                      {schedules.map((schedule) => (
                        <Card key={schedule.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  <Clock className="w-5 h-5 text-primary" />
                                  {schedule.field_name} - {new Date(schedule.scheduled_time).toLocaleTimeString()}
                                </CardTitle>
                                <CardDescription>
                                  Duration: {schedule.duration_minutes} mins • Method: {schedule.method}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(schedule.status ?? "")}>
                                  {schedule.status ?? "unknown"}
                                </Badge>
                                {schedule.status === "active" && (
                                  <div className="flex gap-1">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => updateSchedule(schedule.id, { status: 'completed' })}
                                    >
                                      <Pause className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => refreshSchedule()}
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                                {schedule.status === "scheduled" && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => updateSchedule(schedule.id, { status: 'active' })}
                                  >
                                    <Play className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <Droplets className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                                <div className="text-lg font-semibold text-blue-800">{schedule.water_amount} mm</div>
                                <div className="text-xs text-blue-600">Water Amount</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <Thermometer className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                <div className="text-sm font-medium text-green-800">
                                  {schedule.sensor_data?.soil_moisture ?? '—'}%
                                </div>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <Thermometer className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                <div className="text-sm font-medium text-green-800">
                                  {schedule.sensor_data?.temperature ?? '—'}°C
                                </div>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <Thermometer className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                <div className="text-sm font-medium text-green-800">
                                  {schedule.sensor_data?.humidity ?? '—'}%
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      No schedules found for this field
                    </div>
                  )}
                </TabsContent>

                {/* ET Calculation Tab */}
                <TabsContent value="et-calculation" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Evapotranspiration (ET) Calculation</CardTitle>
                      <CardDescription>
                        Real-time ET calculation for precise irrigation scheduling
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading.et ? (
                        <div className="text-center">Loading ET data...</div>
                      ) : error.et ? (
                        <div className="text-red-600">Error loading ET data: {error.et.message}</div>
                      ) : etData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="font-medium">Reference ET (ETo)</span>
                              <div className="text-right">
                                <div className={`font-semibold ${getParameterColor(etData.status)}`}>
                                  {etData.reference_et} mm/day
                                </div>
                                <Badge variant="outline" className={getParameterColor(etData.status)}>
                                  {etData.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="font-medium">Crop Coefficient (Kc)</span>
                              <div className="text-right">
                                <div className={`font-semibold ${getParameterColor(etData.status)}`}>
                                  {etData.crop_coefficient}
                                </div>
                                <Badge variant="outline" className={getParameterColor(etData.status)}>
                                  {etData.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="font-medium">Crop ET (ETc)</span>
                              <div className="text-right">
                                <div className={`font-semibold ${getParameterColor(etData.status)}`}>
                                  {etData.crop_et} mm/day
                                </div>
                                <Badge variant="outline" className={getParameterColor(etData.status)}>
                                  {etData.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="font-medium">Effective Rainfall</span>
                              <div className="text-right">
                                <div className={`font-semibold ${getParameterColor(etData.status)}`}>
                                  {etData.effective_rainfall} mm
                                </div>
                                <Badge variant="outline" className={getParameterColor(etData.status)}>
                                  {etData.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="p-4 bg-primary/5 rounded-lg">
                              <h4 className="font-semibold text-primary mb-2">Recommended Action</h4>
                              <p className="text-sm text-muted-foreground">
                                Based on current ET rate of {etData.crop_et} mm/day, schedule irrigation within 6-8 hours.
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <Button variant="outline" className="w-full">
                                View ET Chart
                              </Button>
                              <Button 
                                className="w-full agri-button-primary"
                                onClick={() => {
                                  createSchedule({
                                    field_id: selectedField,
                                    scheduling_mode: autoMode ? 'auto' : 'manual',
                                  });
                                }}
                              >
                                Apply Schedule
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Soil Moisture Tab */}
                <TabsContent value="soil-moisture" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Soil Moisture Monitoring</CardTitle>
                      <CardDescription>
                        Real-time soil moisture levels across different depths
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading.soilMoisture ? (
                        <div className="text-center">Loading soil moisture data...</div>
                      ) : error.soilMoisture ? (
                        <div className="text-red-600">Error loading soil moisture data: {error.soilMoisture.message}</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {soilMoisture.map((layer, index) => (
                            <div key={index} className="text-center p-4 border rounded-lg">
                              <div className="text-lg font-semibold mb-2">{layer.depth}</div>
                              <div className={`text-3xl font-bold ${
                                layer.status === 'Optimal' ? 'text-green-600' :
                                layer.status === 'Good' ? 'text-blue-600' : 'text-orange-600'
                              }`}>
                                {layer.moisture_percentage}%
                              </div>
                              <Progress value={layer.moisture_percentage} className="mb-2" />
                              <Badge className={`
                                ${layer.status === 'Optimal' ? 'bg-green-100 text-green-800' :
                                  layer.status === 'Good' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}
                              `}>
                                {layer.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Crop Stage Tab */}
                <TabsContent value="crop-stage" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Crop Stage-Based Scheduling</CardTitle>
                      <CardDescription>
                        Irrigation requirements based on current crop development stage
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading.cropStage ? (
                        <div className="text-center">Loading crop stage data...</div>
                      ) : error.cropStage ? (
                        <div className="text-red-600">Error loading crop stage data: {error.cropStage.message}</div>
                      ) : cropStage && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="p-4 border rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <Leaf className="w-5 h-5 text-green-600" />
                                <span className="font-semibold">Current Stage: {cropStage.current_stage}</span>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Water Requirement:</span>
                                  <span className="font-medium">{cropStage.water_requirement.level} ({cropStage.water_requirement.kc_range})</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Critical Period:</span>
                                  <span className={`font-medium ${cropStage.is_critical_period ? 'text-red-600' : 'text-green-600'}`}>
                                    {cropStage.is_critical_period ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Days in Stage:</span>
                                  <span className="font-medium">{cropStage.days_in_stage} days</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Expected Duration:</span>
                                  <span className="font-medium">{cropStage.expected_duration}</span>
                                </div>
                              </div>
                            </div>
                            {cropStage.is_critical_period && (
                              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <h4 className="font-semibold text-yellow-800 mb-2">Critical Stage Alert</h4>
                                <p className="text-sm text-yellow-700">
                                  {cropStage.current_stage} stage is critical for yield. 
                                  Maintain consistent soil moisture according to recommendations.
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="space-y-4">
                            <h4 className="font-semibold">Recommended Schedule</h4>
                            <Button
                              className="w-full" 
                              onClick={() => {
                                createSchedule({
                                  field_id: selectedField,
                                  scheduling_mode: 'auto',
                                  // include preferences but cast to any to satisfy the current createSchedule type
                                  ...( { preferences: { preferred_time: 'early_morning', max_duration: cropStage.water_requirement.level === 'High' ? 60 : 45 } } as any )
                                });
                              }}
                            >
                              Create Optimized Schedule
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default IrrigationScheduling;