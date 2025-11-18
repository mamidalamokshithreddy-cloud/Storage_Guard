import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ArrowLeft, Truck, MapPin, Fuel, Wrench, User, Phone, Clock } from "lucide-react";
import { useRouter } from "next/navigation"; 
import { useState } from "react";
// import AgriAgentsSidebar from "../AgriAgentsSidebar";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";

interface FleetManagementProps {
  onNavigateBack?: () => void;
}

const FleetManagement: React.FC<FleetManagementProps> = () => {
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState("VH001");

  const vehicles = [
    {
      id: "VH001",
      type: "Refrigerated Van",
      typeTeugu: "రిఫ్రిజిరేటెడ్ వ్యాన్",
      model: "Tata Ace Gold CX",
      plateNumber: "TS07EA1234",
      driver: "Ramesh Kumar",
      driverPhone: "+91 98765 43210",
      status: "Active",
      location: "Hyderabad Zone A",
      capacity: "1.5 Tons",
      currentLoad: "80%",
      fuelLevel: 75,
      temperature: "4°C",
      mileage: "12.5 km/l",
      lastService: "Dec 10, 2024",
      nextService: "Feb 10, 2025"
    },
    {
      id: "VH002",
      type: "Electric Bike",
      typeTeugu: "ఎలక్ట్రిక్ బైక్",
      model: "Hero Electric Optima",
      plateNumber: "TS09AB5678",
      driver: "Priya Sharma",
      driverPhone: "+91 87654 32109",
      status: "Active",
      location: "Warangal Center",
      capacity: "50 kg",
      currentLoad: "60%",
      fuelLevel: 88, // Battery level for electric
      temperature: "Ambient",
      mileage: "85 km/charge",
      lastService: "Nov 25, 2024",
      nextService: "Jan 25, 2025"
    },
    {
      id: "VH003",
      type: "Cargo Truck",
      typeTeugu: "కార్గో ట్రక్",
      model: "Mahindra Bolero Pickup",
      plateNumber: "TS12CD9012",
      driver: "Suresh Reddy",
      driverPhone: "+91 76543 21098",
      status: "Maintenance",
      location: "Service Center",
      capacity: "2 Tons",
      currentLoad: "0%",
      fuelLevel: 45,
      temperature: "N/A",
      mileage: "14 km/l",
      lastService: "Dec 20, 2024",
      nextService: "In Progress"
    }
  ];

  const fleetStats = [
    { metric: "Active Vehicles", value: 8, total: 12, percentage: 67 },
    { metric: "Average Fuel Efficiency", value: "13.2 km/l", trend: "+0.8" },
    { metric: "On-Time Performance", value: "94%", trend: "+2%" },
    { metric: "Maintenance Cost", value: "₹45,000/month", trend: "-8%" }
  ];

  const maintenanceSchedule = [
    {
      vehicleId: "VH004",
      vehicleName: "Delivery Van #4",
      service: "Regular Service",
      scheduledDate: "Jan 5, 2025",
      estimatedCost: "₹8,500",
      priority: "Medium"
    },
    {
      vehicleId: "VH001",
      vehicleName: "Refrigerated Van #1",
      service: "AC System Check",
      scheduledDate: "Feb 10, 2025",
      estimatedCost: "₹12,000",
      priority: "High"
    }
  ];

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-white-100">
      {/* <AgriAgentsSidebar /> */}
      
      <div className="ml-0">
        <div className="max-w-full mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/consumer-delivery')} variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Consumer Delivery
              </Button>
              <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                🚛 Fleet Management | ఫ్లీట్ మేనేజ్‌మెంట్
              </h1>
            </div>
            <Button className="agri-button-primary flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Add Vehicle
            </Button>
          </div>

          <div className="space-y-6">
            {/* Fleet Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Fleet Overview | ఫ్లీట్ అవలోకనం
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {fleetStats.map((stat, index) => (
                    <div key={index} className="p-4 bg-gradient-field rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">{stat.value}</div>
                      <p className="text-sm font-medium">{stat.metric}</p>
                      {stat.trend && (
                        <div className="flex justify-center items-center mt-2">
                          <span className="text-xs font-semibold text-success">
                            {stat.trend}
                          </span>
                        </div>
                      )}
                      {stat.percentage && (
                        <Progress value={stat.percentage} className="mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-8 gap-6">
              {/* Vehicle List */}
              <div className="col-span-5">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Vehicle Fleet | వాహన సముదాయం
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vehicles.map((vehicle) => (
                        <Card 
                          key={vehicle.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedVehicle === vehicle.id ? 'ring-2 ring-primary border-primary' : 'border-border'
                          }`}
                          onClick={() => setSelectedVehicle(vehicle.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold">{vehicle.type}</h3>
                                <p className="text-primary text-sm">{vehicle.typeTeugu}</p>
                                <p className="text-xs text-muted-foreground">{vehicle.plateNumber}</p>
                              </div>
                              <Badge variant={
                                vehicle.status === 'Active' ? 'default' :
                                vehicle.status === 'Maintenance' ? 'secondary' : 'outline'
                              }>
                                {vehicle.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{vehicle.driver}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{vehicle.location}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Vehicle Details */}
              <div className="col-span-7">
                {selectedVehicleData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Vehicle Details: {selectedVehicleData.type}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-semibold mb-3">Vehicle Information</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Model:</span>
                                <span className="font-medium">{selectedVehicleData.model}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Plate Number:</span>
                                <span className="font-medium">{selectedVehicleData.plateNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Capacity:</span>
                                <span className="font-medium">{selectedVehicleData.capacity}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Mileage:</span>
                                <span className="font-medium">{selectedVehicleData.mileage}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-3">Driver Information</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Name:</span>
                                <span className="font-medium">{selectedVehicleData.driver}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Phone:</span>
                                <span className="font-medium">{selectedVehicleData.driverPhone}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Location:</span>
                                <span className="font-medium">{selectedVehicleData.location}</span>
                              </div>
                              <Button size="sm" variant="outline" className="w-full mt-2">
                                <Phone className="w-4 h-4 mr-1" />
                                Contact Driver
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-gradient-field rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Fuel className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {selectedVehicleData.type.includes('Electric') ? 'Battery' : 'Fuel'} Level
                              </span>
                            </div>
                            <Progress value={selectedVehicleData.fuelLevel} className="mb-1" />
                            <p className="text-xs text-muted-foreground">{selectedVehicleData.fuelLevel}%</p>
                          </div>
                          <div className="p-3 bg-gradient-field rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Truck className="w-4 h-4" />
                              <span className="text-sm font-medium">Load Capacity</span>
                            </div>
                            <Progress value={parseInt(selectedVehicleData.currentLoad)} className="mb-1" />
                            <p className="text-xs text-muted-foreground">{selectedVehicleData.currentLoad}</p>
                          </div>
                          <div className="p-3 bg-gradient-field rounded-lg text-center">
                            <div className="text-lg font-bold text-primary">{selectedVehicleData.temperature}</div>
                            <p className="text-xs text-muted-foreground">Temperature</p>
                          </div>
                        </div>

                        {/* Maintenance Info */}
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Wrench className="w-4 h-4" />
                            Maintenance Schedule
                          </h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 border rounded-lg">
                              <span className="text-muted-foreground">Last Service:</span>
                              <p className="font-medium">{selectedVehicleData.lastService}</p>
                            </div>
                            <div className="p-3 border rounded-lg">
                              <span className="text-muted-foreground">Next Service:</span>
                              <p className="font-medium">{selectedVehicleData.nextService}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Maintenance Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Upcoming Maintenance | రాబోయే మెయింటెనెన్స్
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {maintenanceSchedule.map((maintenance, index) => (
                    <Card key={index} className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{maintenance.vehicleName}</h3>
                            <p className="text-muted-foreground text-sm">{maintenance.service}</p>
                            <p className="text-sm mt-1">Scheduled: {maintenance.scheduledDate}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              maintenance.priority === 'High' ? 'destructive' :
                              maintenance.priority === 'Medium' ? 'secondary' : 'outline'
                            }>
                              {maintenance.priority} Priority
                            </Badge>
                            <p className="text-sm font-medium mt-1">{maintenance.estimatedCost}</p>
                          </div>
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
        agentType="Fleet Expert"
        agentName="Fleet AI Assistant"
        agentNameTelugu="ఫ్లీట్ AI సహాయకుడు"
      />
      
      {/* Chat Agent */}
      <AgriChatAgent />
    </div>
  );
};

export default FleetManagement;