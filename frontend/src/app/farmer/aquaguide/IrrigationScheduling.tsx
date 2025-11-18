import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Clock, Droplets, Thermometer, Leaf, MapPin, Settings, Play, Pause, ArrowLeft } from "lucide-react";
import AgriChatAgent from "../AgriChatAgent";
import { usePlotData } from "@/hooks/usePlotData";

interface IrrigationSchedulingProps {
  onBackToAquaGuide?: () => void;
}

const IrrigationScheduling = ({ onBackToAquaGuide }: IrrigationSchedulingProps = {}) => {
  const [autoMode, setAutoMode] = useState(true);

  // Use the plot data hook
  const {
    data: { plots, selectedPlot, measurements, weather, schedule },
    loading,
    error,
    selectPlot,
    updateSchedule,
    createSchedule,
    selectedPlotId,
  } = usePlotData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getParameterColor = (value: number, optimal: number, tolerance: number = 10) => {
    const percentage = (Math.abs(value - optimal) / optimal) * 100;
    if (percentage <= tolerance) return "text-green-600";
    if (percentage <= tolerance * 2) return "text-blue-600";
    if (percentage <= tolerance * 3) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-subtle flex">
        <AgriChatAgent />
        <div className="flex-1 min-h-screen">
          <div className="bg-background">
            {/* Navigation Bar */}
            <div className="bg-white border-b px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {onBackToAquaGuide && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onBackToAquaGuide}
                      className="h-8 w-8"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-primary" />
                    <h1 className="font-semibold text-xl flex items-center gap-1">
                      AquaGuide <span className="text-muted-foreground px-1">|</span> 
                      <span className="text-lg text-muted-foreground">నీటిపారుదల</span>
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-[300px]">
                    <Select value={selectedPlotId} onValueChange={selectPlot}>
                      <SelectTrigger className="h-9 bg-white border-primary/20 hover:bg-primary/5">
                        <MapPin className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        <SelectValue placeholder="Select a plot..." />
                      </SelectTrigger>
                      <SelectContent>
                        {loading.plots ? (
                          <div className="px-2 py-2 text-sm">Loading plots...</div>
                        ) : error.plots ? (
                          <div className="px-2 py-2 text-sm text-red-600">{error.plots}</div>
                        ) : (
                          plots.map((plot) => (
                            <SelectItem key={plot.id} value={plot.id}>
                              <div className="flex flex-col py-0.5">
                                <span className="font-medium">{plot.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {plot.area?.value ?? '—'} {plot.area?.unit ?? ''} • {plot.crop.name}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedPlot && (
                    <Badge variant="outline" className="h-9 px-3 bg-primary/5 text-primary border-primary/20">
                      {selectedPlot.crop.name} • {selectedPlot.crop.stage}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Plot Selection Bar */}
            <div className="border-b px-6 py-4 bg-white">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="w-full md:w-[400px]">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="font-medium">Select Plot for Irrigation</span>
                  </div>
                  {loading.plots ? (
                    <div className="text-sm text-muted-foreground">Loading plots...</div>
                  ) : error.plots ? (
                    <div className="text-sm text-red-600">{error.plots}</div>
                  ) : (
                    <Select value={selectedPlotId} onValueChange={selectPlot}>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select a plot to view irrigation details" />
                      </SelectTrigger>
                      <SelectContent>
                        {plots.map((plot) => (
                          <SelectItem key={plot.id} value={plot.id}>
                            <div className="flex flex-col py-1">
                              <span className="font-medium">{plot.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {plot.area?.value ?? '—'} {plot.area?.unit ?? ''} • {plot.crop.name} ({plot.crop.stage})
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {plot.location.village}, {plot.location.district}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {selectedPlot && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="bg-primary/5 text-primary">
                      Area: {selectedPlot.area.value} {selectedPlot.area.unit}
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Crop: {selectedPlot.crop.name}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Stage: {selectedPlot.crop.stage}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        
        <main className="flex-1 p-6">
          <div className="max-w-full mx-auto space-y-6">
              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-primary" />
                      Water Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Today's Usage</span>
                        <span className="font-medium">
                          {measurements?.waterUsage?.today?.value || 0} {measurements?.waterUsage?.today?.unit || 'L'}
                        </span>
                      </div>
                      <Progress 
                        value={measurements?.waterUsage?.today?.value 
                          ? (measurements.waterUsage.today.value / (measurements.waterUsage.today.value * 1.2)) * 100 
                          : 0} 
                        className="h-2" 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Weekly: {measurements?.waterUsage?.weekly?.value || 0} {measurements?.waterUsage?.weekly?.unit || 'L'}</span>
                        <span className={(measurements?.waterUsage?.weekly?.trend || 0) > 0 ? 'text-red-500' : 'text-green-500'}>
                          {(measurements?.waterUsage?.weekly?.trend || 0) > 0 ? '↑' : '↓'} {Math.abs(measurements?.waterUsage?.weekly?.trend || 0)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="schedules" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="schedules">Today's Schedule</TabsTrigger>
                  <TabsTrigger value="measurements">Measurements</TabsTrigger>
                  <TabsTrigger value="weather">Weather</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="schedules" className="space-y-6">
                  {loading.schedule ? (
                    <div className="text-center">Loading schedules...</div>
                  ) : error.schedule ? (
                    <div className="text-red-600">Error: {error.schedule}</div>
                  ) : schedule && schedule.length > 0 ? (
                    <div className="grid gap-6">
                      {schedule.map((item) => (
                        <Card key={item.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  <Clock className="w-5 h-5 text-primary" />
                                  {new Date(item.startTime).toLocaleTimeString()}
                                </CardTitle>
                                <CardDescription>
                                  Duration: {item.duration.value} {item.duration.unit} • Method: {item.method}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(item.status)}>
                                  {item.status}
                                </Badge>
                                {item.status === "in-progress" && (
                                  <div className="flex gap-1">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => updateSchedule(item.id, { status: 'completed' })}
                                    >
                                      <Pause className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                                {item.status === "scheduled" && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => updateSchedule(item.id, { status: 'in-progress' })}
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
                                <div className="text-lg font-semibold text-blue-800">
                                  {item.waterAmount.value} {item.waterAmount.unit}
                                </div>
                                <div className="text-xs text-blue-600">Water Amount</div>
                              </div>
                              
                              {measurements && (
                                <>
                                  <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <Thermometer className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                    <div className="text-sm font-medium text-green-800">
                                      Soil Moisture: {measurements.soilMoisture.value}%
                                    </div>
                                  </div>
                                  <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <Thermometer className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                    <div className="text-sm font-medium text-green-800">
                                      Temperature: {measurements.temperature.value}°{measurements.temperature.unit}
                                    </div>
                                  </div>
                                  <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <Thermometer className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                    <div className="text-sm font-medium text-green-800">
                                      Humidity: {measurements.humidity.value}%
                                    </div>
                                  </div>
                                </>
                              )}
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

                <TabsContent value="et-calculation" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Evapotranspiration (ET) Calculation</CardTitle>
                      <CardDescription>
                        Real-time ET calculation for precise irrigation scheduling
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading.measurements ? (
                        <div className="text-center">Loading measurements...</div>
                      ) : error.measurements ? (
                        <div className="text-red-600">Error: {error.measurements}</div>
                      ) : measurements && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="font-medium">Reference ET</span>
                              <div className="text-right">
                                <div className={`font-semibold ${getParameterColor(measurements.evapotranspiration.value, 6)}`}>
                                  {measurements.evapotranspiration.value} {measurements.evapotranspiration.unit}
                                </div>
                                <Badge variant="outline" className={getParameterColor(measurements.evapotranspiration.value, 6)}>
                                  {measurements.evapotranspiration.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="font-medium">Crop Coefficient (Kc)</span>
                              <div className="text-right">
                                <div className={`font-semibold ${getParameterColor(selectedPlot?.crop.stage === 'mid' ? 1.15 : 0.85, 1)}`}>
                                  {selectedPlot?.crop.stage === 'mid' ? 1.15 : 0.85}
                                </div>
                                <Badge variant="outline" className={getParameterColor(selectedPlot?.crop.stage === 'mid' ? 1.15 : 0.85, 1)}>
                                  {selectedPlot?.crop.stage || 'Unknown'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="font-medium">Soil Moisture</span>
                              <div className="text-right">
                                <div className={`font-semibold ${getParameterColor(measurements.soilMoisture.value, 50)}`}>
                                  {measurements.soilMoisture.value}%
                                </div>
                                <Badge variant="outline" className={getParameterColor(measurements.soilMoisture.value, 50)}>
                                  {measurements.soilMoisture.status}
                                </Badge>
                              </div>
                            </div>
                            {weather && (
                              <div className="flex items-center justify-between p-3 border rounded-lg">
                                <span className="font-medium">Precipitation</span>
                                <div className="text-right">
                                  <div className="font-semibold text-primary">
                                    {weather.forecast.nextRain.probability}% chance
                                  </div>
                                  <Badge variant="outline">
                                    {weather.forecast.nextRain.expected ? 'Expected' : 'Not Expected'}
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-4">
                            <div className="p-4 bg-primary/5 rounded-lg">
                              <h4 className="font-semibold text-primary mb-2">Recommended Action</h4>
                              <p className="text-sm text-muted-foreground">
                                Based on current ET rate of {measurements.evapotranspiration.value} {measurements.evapotranspiration.unit} 
                                and soil moisture level of {measurements.soilMoisture.value}%, 
                                {measurements.soilMoisture.value < 40 ? 'schedule irrigation within 6-8 hours' : 'no immediate irrigation needed'}.
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <Button variant="outline" className="w-full">
                                View ET Chart
                              </Button>
                              <Button 
                                className="w-full"
                                onClick={() => {
                                  if (selectedPlotId) {
                                    createSchedule({
                                      startTime: new Date().toISOString(),
                                      duration: { value: 45, unit: 'min' },
                                      method: 'Drip Irrigation',
                                      waterAmount: { value: 25, unit: 'mm' },
                                      status: 'scheduled' as const,
                                      adjustedFor: { cropStage: autoMode },
                                    });
                                  }
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

                <TabsContent value="measurements" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Soil Moisture Monitoring</CardTitle>
                      <CardDescription>
                        Real-time soil moisture levels and environmental data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading.measurements ? (
                        <div className="text-center">Loading measurement data...</div>
                      ) : error.measurements ? (
                        <div className="text-red-600">Error loading measurement data: {error.measurements}</div>
                      ) : measurements ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-lg font-semibold mb-2">Soil Moisture</div>
                            <div className={`text-3xl font-bold ${
                              measurements.soilMoisture.status === 'optimal' ? 'text-green-600' :
                              measurements.soilMoisture.status === 'high' ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              {measurements.soilMoisture.value}%
                            </div>
                            <Progress value={measurements.soilMoisture.value} className="mb-2" />
                            <Badge className={`
                              ${measurements.soilMoisture.status === 'optimal' ? 'bg-green-100 text-green-800' :
                                measurements.soilMoisture.status === 'high' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}
                            `}>
                              {measurements.soilMoisture.status}
                            </Badge>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-lg font-semibold mb-2">Temperature</div>
                            <div className="text-3xl font-bold text-red-600">
                              {measurements.temperature.value}°{measurements.temperature.unit}
                            </div>
                            <Progress value={(measurements.temperature.value / 50) * 100} className="mb-2" />
                            <Badge className="bg-red-100 text-red-800">
                              Current
                            </Badge>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-lg font-semibold mb-2">Humidity</div>
                            <div className="text-3xl font-bold text-blue-600">
                              {measurements.humidity.value}%
                            </div>
                            <Progress value={measurements.humidity.value} className="mb-2" />
                            <Badge className="bg-blue-100 text-blue-800">
                              Current
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          No measurement data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="weather" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Weather Forecast</CardTitle>
                      <CardDescription>
                        Current weather conditions and 5-day forecast
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading.weather ? (
                        <div className="text-center">Loading weather data...</div>
                      ) : error.weather ? (
                        <div className="text-red-600">Error loading weather data: {error.weather}</div>
                      ) : weather ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 border rounded-lg">
                              <div className="text-lg font-semibold mb-2">Current Temperature</div>
                              <div className="text-3xl font-bold text-orange-600">
                                {weather.current.temperature.value}°{weather.current.temperature.unit}
                              </div>
                              <div className="text-sm text-muted-foreground">{weather.current.condition}</div>
                            </div>
                            <div className="text-center p-4 border rounded-lg">
                              <div className="text-lg font-semibold mb-2">Humidity</div>
                              <div className="text-3xl font-bold text-blue-600">
                                {weather.current.humidity.value}%
                              </div>
                              <Progress value={weather.current.humidity.value} className="mb-2" />
                            </div>
                            <div className="text-center p-4 border rounded-lg">
                              <div className="text-lg font-semibold mb-2">Wind Speed</div>
                              <div className="text-3xl font-bold text-green-600">
                                {weather.current.windSpeed.value} {weather.current.windSpeed.unit}
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-primary/5 rounded-lg">
                            <h4 className="font-semibold text-primary mb-2">Rain Forecast</h4>
                            <div className="flex items-center justify-between">
                              <span>Next Rain Probability:</span>
                              <span className="font-medium text-primary">
                                {weather.forecast.nextRain.probability}%
                                {weather.forecast.nextRain.expected && weather.forecast.nextRain.expectedTime && (
                                  <span className="text-sm ml-2">
                                    (Expected: {new Date(weather.forecast.nextRain.expectedTime).toLocaleDateString()})
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                          
                          {weather.forecast.daily.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3">5-Day Forecast</h4>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {weather.forecast.daily.map((day, index) => (
                                  <div key={index} className="text-center p-3 border rounded-lg">
                                    <div className="text-sm font-medium">
                                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-1">{day.condition}</div>
                                    <div className="text-sm">
                                      {day.maxTemp}° / {day.minTemp}°
                                    </div>
                                    <div className="text-xs text-blue-600">
                                      {day.rainProbability}% rain
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          No weather data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  {loading.measurements ? (
                    <div className="text-center">Loading analytics...</div>
                  ) : error.measurements ? (
                    <div className="text-red-600">Error: {error.measurements}</div>
                  ) : measurements && selectedPlot && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Crop Stage Analytics</CardTitle>
                        <CardDescription>
                          Water consumption and efficiency metrics based on crop stage
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="p-4 border rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <Leaf className="w-5 h-5 text-green-600" />
                                <span className="font-semibold">Current Stage: {selectedPlot.crop.stage}</span>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Water Requirement:</span>
                                  <span className="font-medium">
                                    {selectedPlot.crop.stage === 'mid' ? 'High' : 'Medium'} ({selectedPlot.crop.stage === 'mid' ? '1.1-1.2' : '0.8-0.9'})
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Critical Period:</span>
                                  <span className={`font-medium ${selectedPlot.crop.stage === 'mid' ? 'text-red-600' : 'text-green-600'}`}>
                                    {selectedPlot.crop.stage === 'mid' ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Growth Phase:</span>
                                  <span className="font-medium">{selectedPlot.crop.stage}</span>
                                </div>
                              </div>
                            </div>
                            {selectedPlot.crop.stage === 'mid' && (
                              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <h4 className="font-semibold text-yellow-800 mb-2">Critical Stage Alert</h4>
                                <p className="text-sm text-yellow-700">
                                  {selectedPlot.crop.name} is in critical growth stage. 
                                  Maintain consistent soil moisture above 50% for optimal yield.
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-card rounded-lg border">
                              <div className="text-2xl font-bold text-primary">
                                {measurements.waterUsage.monthly.value} {measurements.waterUsage.monthly.unit}
                              </div>
                              <div className="text-sm text-muted-foreground">Monthly Usage</div>
                              <div className={`text-xs ${
                                (measurements.waterUsage.monthly.trend || 0) > 0 ? 'text-red-500' : 'text-green-500'
                              }`}>
                                {(measurements.waterUsage.monthly.trend || 0) > 0 ? '↑' : '↓'} {
                                  Math.abs(measurements.waterUsage.monthly.trend || 0)
                                }% vs last month
                              </div>
                            </div>

                            <div className="p-4 bg-card rounded-lg border">
                              <div className="text-2xl font-bold text-success">
                                {measurements.evapotranspiration.value} {measurements.evapotranspiration.unit}
                              </div>
                              <div className="text-sm text-muted-foreground">Evapotranspiration</div>
                              <div className="text-xs text-muted-foreground">
                                Status: {measurements.evapotranspiration.status}
                              </div>
                            </div>

                            <div className="p-4 bg-card rounded-lg border">
                              <div className="text-2xl font-bold text-accent">
                                {measurements.waterUsage.weekly.value} {measurements.waterUsage.weekly.unit}
                              </div>
                              <div className="text-sm text-muted-foreground">Weekly Average</div>
                              <div className={`text-xs ${
                                (measurements.waterUsage.weekly.trend || 0) > 0 ? 'text-red-500' : 'text-green-500'
                              }`}>
                                {(measurements.waterUsage.weekly.trend || 0) > 0 ? '↑' : '↓'} {
                                  Math.abs(measurements.waterUsage.weekly.trend || 0)
                                }% vs last week
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
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