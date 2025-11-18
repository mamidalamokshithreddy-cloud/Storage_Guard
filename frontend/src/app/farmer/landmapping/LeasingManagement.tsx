'use client';

import React, { useState } from 'react';
import { useRouter } from "next/navigation"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { FileText, Users, Calendar, Plus, Eye, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { LeaseCreationForm } from './LeaseCreationForm';
import { ActiveLeasesList } from './ActiveLeasesList';
import { DigitalAgreements } from './DigitalAgreements';
// Fallback local implementation of the hook (use this if '../../../hooks/useActiveLeases' is missing).
// Replace with the shared hook import when available:
// import { useActiveLeases } from '../../../hooks/useActiveLeases';
import { useEffect } from 'react';

type Lease = {
  id: string;
  tenantName?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
};

export function useActiveLeases() {
  const [leases, setLeases] = React.useState<Lease[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [totalCount, setTotalCount] = React.useState<number>(0);

  const fetchLeases = async () => {
    setLoading(true);
    setError(null);
    try {
      // Adjust the API endpoint to match your backend
      const res = await fetch('/api/leases/active');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: Lease[] = Array.isArray(data) ? data : data.leases ?? [];
      setLeases(list);
      setTotalCount(Array.isArray(data) ? list.length : data.totalCount ?? list.length);
    } catch (err: any) {
      setError(err?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    leases,
    loading,
    error,
    totalCount,
    refetch: fetchLeases,
  };
}
import PageHeader from '../PageHeader';

import AgriChatAgent from '../AgriChatAgent';

interface LeasingManagementProps {
  onBackToLandMapping?: () => void;
}

const LeasingManagement = ({ onBackToLandMapping }: LeasingManagementProps = {}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('create-lease');

  // Handle back navigation
  const handleBackClick = () => {
    if (onBackToLandMapping) {
      // Use the provided back handler (for when used within farmer dashboard)
      onBackToLandMapping();
    } else {
      try {
        // Try to navigate to the parent land mapping page (for direct route access)
        router.push('/farmer/landmapping');
      } catch (error) {
        // Fallback: use browser back
        window.history.back();
      }
    }
  };

  // Fetch active leases from API
  const { leases: activeLeases, loading: leasesLoading, error: leasesError, totalCount, refetch } = useActiveLeases();



  const getLeaseStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getAgreementStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800">Signed</Badge>;
      case 'draft':
        return <Badge className="bg-blue-100 text-blue-800">Draft</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Signature</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      
      <AgriChatAgent />
      
      <div className="ml-0">
        {/* Header with Back Button */}
        <div className="p-6 pb-0">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBackClick}
              className="flex items-center gap-2 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Land Mapping
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leasing & Role Assignment</h1>
              <p className="text-gray-600">లీజింగ్ మరియు పాత్ర కేటాయింపు</p>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
              <TabsTrigger value="create-lease" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Lease
              </TabsTrigger>
              <TabsTrigger value="active-leases" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active Leases ({leasesLoading ? '...' : totalCount})
              </TabsTrigger>
              <TabsTrigger value="agreements" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Agreements
              </TabsTrigger>
              <TabsTrigger value="role-management" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Role Management
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create-lease">
              <LeaseCreationForm onLeaseCreated={() => {
                refetch(); // Refresh active leases when new lease is created
                setActiveTab('active-leases'); // Switch to active leases tab
              }} />
            </TabsContent>

            <TabsContent value="active-leases">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Active Leases</h2>
                    <p className="text-gray-600">Monitor and manage your land leasing agreements</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => refetch()}
                    disabled={leasesLoading}
                    className="flex items-center gap-2"
                  >
                    {leasesLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    Refresh
                  </Button>
                </div>

                {leasesError ? (
                  <Card className="border-red-200 bg-red-50">
                  <CardContent className="flex items-center gap-2 p-4">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div>
                    <p className="text-red-800 font-medium">Error loading active leases</p>
                    <p className="text-red-600 text-sm">{leasesError}</p>
                    </div>
                  </CardContent>
                  </Card>
                ) : leasesLoading ? (
                  <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">Loading active leases...</span>
                  </div>
                ) : activeLeases.length === 0 ? (
                  <Card className="border-gray-200 bg-gray-50">
                  <CardContent className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Leases</h3>
                    <p className="text-gray-600 mb-4">You don't have any active lease agreements yet.</p>
                    <Button onClick={() => setActiveTab('create-lease')}>
                    Create Your First Lease
                    </Button>
                  </CardContent>
                  </Card>
                ) : (
                  // Map the incoming lease shape to the expected LeaseData shape before passing to ActiveLeasesList.
                  // This prevents the TS error when the remote lease objects don't exactly match LeaseData.
                  (() => {
                  const mapped = activeLeases.map((l) => {
                    const { id, ...rest } = l; // remove id from the spread to avoid duplicate keys
                    return {
                      ...rest, // include other fields first
                      id: id ?? 'unknown-id',
                      plotName: l.plotName ?? l.plot?.name ?? 'Unknown Plot',
                      plotSize: l.plotSize ?? l.plot?.size ?? l.size ?? 'Unknown Size',
                      farmerName: l.tenantName ?? l.farmerName ?? 'Unknown Farmer',
                      leaseType: l.leaseType ?? l.type ?? 'Unknown',
                      startDate: l.startDate ?? l.start ?? undefined,
                      endDate: l.endDate ?? l.end ?? undefined,
                      status: l.status ?? l.state ?? 'unknown',
                    };
                  });
                  return (
                    <ActiveLeasesList
                    leases={mapped as any}
                    getStatusBadge={getLeaseStatusBadge}
                    onLeaseClick={(lease) => router.push(`/land-mapping/lease-details/${lease.id}`)}
                    />
                  );
                  })()
                )}
              </div>
            </TabsContent>

            <TabsContent value="agreements">
              <DigitalAgreements 
                onAgreementClick={(agreement) => router.push(`/land-mapping/agreement/${agreement.id}`)}
              />
            </TabsContent>

            <TabsContent value="role-management">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Role Management & Access Control
                    </CardTitle>
                    <CardDescription>
                      Manage user roles and access permissions for land plots and leasing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Landowners</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Total Active:</span>
                              <Badge>15</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Pending Verification:</span>
                              <Badge variant="outline">3</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Farmers/Lessees</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Active Leases:</span>
                              <Badge>28</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Applications:</span>
                              <Badge variant="outline">7</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">AgriPilot Access</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Shared Access:</span>
                              <Badge>Both Parties</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Active Sessions:</span>
                              <Badge variant="outline">12</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LeasingManagement;