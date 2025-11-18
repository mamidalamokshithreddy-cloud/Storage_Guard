import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { MessageSquare, Phone, Bell, Clock, Send, History, Settings, Users, Volume2, AlertTriangle, CheckCircle, BarChart3, Droplets, Zap, ArrowLeft } from "lucide-react";
import AgriChatAgent from "../AgriChatAgent";

interface AlertsRemindersProps {
  onBackToAquaGuide?: () => void;
}

const AlertsReminders = ({ onBackToAquaGuide }: AlertsRemindersProps = {}) => {
  const [selectedTemplate, setSelectedTemplate] = useState("irrigation");
  // const [phoneNumber, setPhoneNumber] = useState(""); // Commented - not used yet
  const [message, setMessage] = useState("");

  const alertHistory = [
    {
      id: 1,
      type: "SMS",
      recipient: "+91 98765 43210",
      message: "North Field irrigation scheduled for 6:00 AM. Duration: 45 min. Tap 1 to confirm, 2 to delay.",
      timestamp: "2024-01-15 05:45 AM",
      status: "delivered",
      response: "1 - Confirmed"
    },
    {
      id: 2,
      type: "IVR",
      recipient: "+91 98765 43210",
      message: "High pressure alert in Zone 2. Press 1 to stop pump, 2 for more info.",
      timestamp: "2024-01-15 03:30 AM",
      status: "answered",
      response: "1 - Pump stopped"
    },
    {
      id: 3,
      type: "SMS",
      recipient: "+91 87654 32109",
      message: "Soil moisture below 30% in East Field. Immediate irrigation recommended.",
      timestamp: "2024-01-14 08:15 PM",
      status: "delivered",
      response: "No response"
    },
    {
      id: 4,
      type: "Voice",
      recipient: "+91 98765 43210",
      message: "Weekly irrigation summary: 1250L used, 85% efficiency, next service in 3 days.",
      timestamp: "2024-01-14 06:00 PM",
      status: "completed",
      response: "Call completed"
    }
  ];

  const messageTemplates = {
    irrigation: {
      title: "Irrigation Schedule",
      sms: "{field} irrigation scheduled for {time}. Duration: {duration}. Reply STOP to cancel, OK to confirm.",
      ivr: "Hello farmer, this is AquaGuide. Your {field} irrigation is scheduled for {time} with duration {duration}. Press 1 to confirm, 2 to delay by 30 minutes, or 3 to cancel."
    },
    alert: {
      title: "System Alert",
      sms: "ALERT: {alert_type} detected in {location}. Current reading: {value}. Immediate attention required.",
      ivr: "Alert from AquaGuide system. {alert_type} detected in {location}. Current reading is {value}. Press 1 for emergency stop, 2 for more details, or 3 to acknowledge."
    },
    maintenance: {
      title: "Maintenance Reminder", 
      sms: "Maintenance due for {equipment} in {days} days. Schedule service to avoid downtime. Call support for booking.",
      ivr: "Maintenance reminder from AquaGuide. Your {equipment} requires servicing in {days} days. Press 1 to schedule service, 2 to postpone, or 3 for maintenance tips."
    },
    summary: {
      title: "Daily Summary",
      sms: "Daily Report: {total_water}L used across {fields} fields. Efficiency: {efficiency}%. Next irrigation: {next_schedule}.",
      ivr: "Your daily irrigation summary from AquaGuide. Total water used: {total_water} liters across {fields} fields. System efficiency is {efficiency} percent. Next irrigation scheduled for {next_schedule}."
    }
  };

  const contacts = [
    { id: 1, name: "Primary Farmer", phone: "+91 98765 43210", role: "Owner", language: "Telugu", sms: true, voice: true },
    { id: 2, name: "Farm Manager", phone: "+91 87654 32109", role: "Manager", language: "English", sms: true, voice: false },
    { id: 3, name: "Field Supervisor", phone: "+91 76543 21098", role: "Supervisor", language: "Telugu", sms: true, voice: true },
    { id: 4, name: "Maintenance Team", phone: "+91 65432 10987", role: "Technical", language: "English", sms: true, voice: false }
  ];

  const automationRules = [
    { id: 1, name: "Pre-irrigation SMS", trigger: "30 min before irrigation", enabled: true, type: "SMS" },
    { id: 2, name: "High Pressure Alert", trigger: "Pressure > 4.0 Bar", enabled: true, type: "IVR" },
    { id: 3, name: "Low Battery Warning", trigger: "Sensor battery < 20%", enabled: true, type: "SMS" },
    { id: 4, name: "Daily Summary", trigger: "Every day at 8:00 PM", enabled: false, type: "Voice" },
    { id: 5, name: "Pump Failure Alert", trigger: "Pump offline > 5 min", enabled: true, type: "IVR" },
    { id: 6, name: "Weekly Report", trigger: "Every Sunday 9:00 AM", enabled: true, type: "SMS" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800";
      case "answered": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-purple-100 text-purple-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SMS": return <MessageSquare className="w-4 h-4" />;
      case "IVR": return <Phone className="w-4 h-4" />;
      case "Voice": return <Volume2 className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
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
                    <Bell className="w-6 h-6 text-primary" />
                    Alerts & Reminders
                  </h1>
                  <p className="text-sm text-muted-foreground">హెచ్చరికలు మరియు రిమైండర్లు</p>
                </div>
              </div>
            </div>
          </div>
          
          <main className="flex-1 p-6">
            <div className="max-w-full mx-auto space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Messages Today</p>
                        <p className="text-2xl font-bold text-blue-600">12</p>
                      </div>
                      <MessageSquare className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">IVR Calls</p>
                        <p className="text-2xl font-bold text-green-600">4</p>
                      </div>
                      <Phone className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Response Rate</p>
                        <p className="text-2xl font-bold text-purple-600">87%</p>
                      </div>
                      <Bell className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Active Rules</p>
                        <p className="text-2xl font-bold text-orange-600">5</p>
                      </div>
                      <Settings className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="send" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="send">Send Message</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                  <TabsTrigger value="automation">Automation</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="send" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Send Immediate Message</CardTitle>
                        <CardDescription>
                          Send SMS or initiate IVR call to selected contacts
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="message-type">Message Type</Label>
                          <Select defaultValue="sms">
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sms">SMS Message</SelectItem>
                              <SelectItem value="ivr">IVR Call</SelectItem>
                              <SelectItem value="voice">Voice Call</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="recipient">Recipient</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contact" />
                            </SelectTrigger>
                            <SelectContent>
                              {contacts.map((contact) => (
                                <SelectItem key={contact.id} value={contact.phone}>
                                  {contact.name} - {contact.phone}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="template">Use Template</Label>
                          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(messageTemplates).map(([key, template]) => (
                                <SelectItem key={key} value={key}>
                                  {template.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">Message Content</Label>
                          <Textarea 
                            id="message"
                            placeholder="Type your message here..."
                            value={message || messageTemplates[selectedTemplate as keyof typeof messageTemplates]?.sms}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                          />
                          <p className="text-xs text-muted-foreground">
                            {message?.length || 0}/160 characters
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button className="flex-1 agri-button-primary">
                            <Send className="w-4 h-4 mr-2" />
                            Send Now
                          </Button>
                          <Button variant="outline" className="flex-1">
                            <Clock className="w-4 h-4 mr-2" />
                            Schedule
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                          Common irrigation alerts and notifications
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                          <Bell className="w-4 h-4 mr-2" />
                          Send Irrigation Reminder
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Emergency Stop Alert
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Maintenance Reminder
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Daily Summary Report
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Droplets className="w-4 h-4 mr-2" />
                          Water Level Alert
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Zap className="w-4 h-4 mr-2" />
                          Power Failure Notice
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="templates" className="space-y-6">
                  <div className="grid gap-6">
                    {Object.entries(messageTemplates).map(([key, template]) => (
                      <Card key={key}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            {template.title}
                            <Button size="sm" variant="outline">
                              Edit
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">SMS Template</Label>
                              <div className="mt-1 p-3 bg-gray-50 rounded border text-sm">
                                {template.sms}
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">IVR Script</Label>
                              <div className="mt-1 p-3 bg-gray-50 rounded border text-sm">
                                {template.ivr}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="contacts" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Contact Management</CardTitle>
                          <CardDescription>
                            Manage notification recipients and preferences
                          </CardDescription>
                        </div>
                        <Button className="agri-button-primary">
                          <Users className="w-4 h-4 mr-2" />
                          Add Contact
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {contacts.map((contact) => (
                          <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div>
                                  <h4 className="font-medium">{contact.name}</h4>
                                  <p className="text-sm text-muted-foreground">{contact.phone}</p>
                                </div>
                                <Badge variant="outline">{contact.role}</Badge>
                                <Badge variant="outline">{contact.language}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-4 h-4" />
                                  <span>SMS: {contact.sms ? "✓" : "✗"}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  <span>Voice: {contact.voice ? "✓" : "✗"}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                Edit
                              </Button>
                              <Button size="sm" variant="outline">
                                Test
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="automation" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Automation Rules</CardTitle>
                      <CardDescription>
                        Configure automatic alerts based on system events
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {automationRules.map((rule) => (
                          <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {getTypeIcon(rule.type)}
                              <div>
                                <h4 className="font-medium">{rule.name}</h4>
                                <p className="text-sm text-muted-foreground">{rule.trigger}</p>
                              </div>
                              <Badge variant="outline">{rule.type}</Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <Switch checked={rule.enabled} />
                              <Button size="sm" variant="outline">
                                Configure
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Message History
                      </CardTitle>
                      <CardDescription>
                        Recent SMS and IVR communications
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {alertHistory.map((alert) => (
                          <div key={alert.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {getTypeIcon(alert.type)}
                                <div>
                                  <Badge className={getStatusColor(alert.status)}>
                                    {alert.status}
                                  </Badge>
                                  <p className="text-sm text-muted-foreground">{alert.timestamp}</p>
                                </div>
                              </div>
                              <p className="text-sm font-medium">{alert.recipient}</p>
                            </div>
                            <div className="space-y-2">
                              <div className="p-3 bg-gray-50 rounded text-sm">
                                {alert.message}
                              </div>
                              {alert.response && (
                                <div className="p-3 bg-green-50 rounded text-sm">
                                  <strong>Response:</strong> {alert.response}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
      </div>
    </div>
  );
};

export default AlertsReminders;