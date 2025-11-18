import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { FileText, CheckCircle2, XCircle, Clock, Eye, Download } from 'lucide-react';
import { useToast } from '../ui/use-toast';

export const AdminVerificationPanel: React.FC = () => {
  const { toast } = useToast();
  const [pendingApplications] = useState([
    {
      id: 'APP001',
      plotName: 'East Valley Farm',
      ownerName: 'Suresh Kumar',
      size: '7.5 acres',
      location: 'Village: Kondapur, District: Hyderabad',
      submittedDate: '2024-01-22',
      documents: ['Land Patta', 'Survey Settlement'],
      priority: 'high',
    },
    {
      id: 'APP002',
      plotName: 'River Side Plot',
      ownerName: 'Lakshmi Devi',
      size: '4.2 acres',
      location: 'Village: Shamshabad, District: Hyderabad',
      submittedDate: '2024-01-20',
      documents: ['Land Title', 'Revenue Records'],
      priority: 'medium',
    },
  ]);

  const handleVerifyApplication = (appId: string, action: 'approve' | 'reject') => {
    toast({
      title: action === 'approve' ? 'Application Approved' : 'Application Rejected',
      description: `Application ${appId} has been ${action}d successfully.`,
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Admin Verification Panel
          </CardTitle>
          <CardDescription>
            Review and verify land ownership applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending ({pendingApplications.length})</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <div className="space-y-4">
                {pendingApplications.map((app) => (
                  <Card key={app.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{app.plotName}</CardTitle>
                          <CardDescription>
                            Owner: {app.ownerName} • {app.size} • {app.location}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {getPriorityBadge(app.priority)}
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {app.submittedDate}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Submitted Documents:</h4>
                          <div className="flex gap-2">
                            {app.documents.map((doc, index) => (
                              <Button key={index} variant="outline" size="sm">
                                <Eye className="w-3 h-3 mr-1" />
                                {doc}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Download className="w-3 h-3 mr-1" />
                              Download All
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="w-3 h-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyApplication(app.id, 'reject')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleVerifyApplication(app.id, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="approved">
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium mb-2">No Approved Applications</h3>
                  <p className="text-gray-600">Approved applications will appear here</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rejected">
              <Card>
                <CardContent className="p-6 text-center">
                  <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-medium mb-2">No Rejected Applications</h3>
                  <p className="text-gray-600">Rejected applications will appear here</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};