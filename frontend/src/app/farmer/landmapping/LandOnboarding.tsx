'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, CheckCircle, Clock, FileText, MapPin, User, AlertTriangle, Loader2 } from 'lucide-react';
import { LandRegistrationForm } from './LandRegistrationForm';
import { usePlots } from '../../../hooks/usePlots';
import AgriChatAgent from '../AgriChatAgent';
// This will be replaced with API data

const pendingVerifications = [
  {
    id: 'VER001',
    plotName: 'East Field',
    farmerName: 'Suresh Kumar',
    area: '15.2 acres',
    submittedDate: '2024-01-15',
    documents: ['Land Title', 'Survey Settlement', 'Revenue Records']
  },
  {
    id: 'VER002',
    plotName: 'West Field', 
    farmerName: 'Priya Sharma',
    area: '22.1 acres',
    submittedDate: '2024-01-18',
    documents: ['Land Title', 'Pahani Copy']
  }
];

interface LandOnboardingProps {
  onBackToMapping?: () => void;
}

const LandOnboarding: React.FC<LandOnboardingProps> = ({ onBackToMapping }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'plots' | 'admin'>('register');
  
  // Fetch plots data from API
  const plotsHook = usePlots();
  const { plots: myPlots, loading: plotsLoading, error: plotsError } = plotsHook;
  const refetchPlots: () => void = (plotsHook as any).refetch ?? (() => {});

  const handlePlotRegistered = () => {
    // Handle successful plot registration
    refetchPlots(); // Refresh the plots data
    setActiveTab('plots');
  };

  return (
    <div className="min-h-screen field-gradient">
      <div className="max-w-full mx-auto px-4 py-4">
        <AgriChatAgent />
        {/* Header with Back Button - Reduced padding */}
        <div className="mb-4">
          <div className="flex items-center gap-4 mb-3">
            {onBackToMapping && (
              <Button 
                variant="outline" 
                onClick={onBackToMapping}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Land Mapping
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">Land Onboarding & Registration</h1>
              <p className="text-muted-foreground text-sm">భూమి రిజిస్ట్రేషన్ మరియు ధృవీకరణ</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Reduced margin */}
        <div className="flex flex-wrap gap-2 mb-4 border-b">
          <Button
            variant={activeTab === 'register' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('register')}
            className="rounded-t-lg rounded-b-none"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Register New Plot
          </Button>
          <Button
            variant={activeTab === 'plots' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('plots')}
            className="rounded-t-lg rounded-b-none"
          >
            <User className="w-4 h-4 mr-2" />
            My Plots ({plotsLoading ? '...' : myPlots.length})
          </Button>
          <Button
            variant={activeTab === 'admin' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('admin')}
            className="rounded-t-lg rounded-b-none"
          >
            <FileText className="w-4 h-4 mr-2" />
            Admin Verification ({pendingVerifications.length})
          </Button>
        </div>

        {/* Tab Content - Reduced spacing */}
        <div className="space-y-4">
          
          {/* Register New Plot Tab */}
          {activeTab === 'register' && (
            <div>
              <LandRegistrationForm onPlotRegistered={handlePlotRegistered} />
            </div>
          )}

          {/* My Plots Tab */}
          {activeTab === 'plots' && (
            <div className="grid gap-4">
              {/* Header with refresh button */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">My Registered Plots</h2>
                  <p className="text-muted-foreground text-sm">Manage your land plots and their verification status</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => refetchPlots()}
                  disabled={plotsLoading}
                  className="flex items-center gap-2"
                >
                  {plotsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  Refresh
                </Button>
              </div>

              {/* Error State */}
              {plotsError && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="flex items-center gap-2 p-4">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-red-800 font-medium">Error loading plots</p>
                      <p className="text-red-600 text-sm">{plotsError}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Loading State */}
              {plotsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">Loading your plots...</span>
                </div>
              ) : (
                <>
                  {/* Plots Grid */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {myPlots.map((plot) => (
                      <Card key={plot.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{plot.name}</CardTitle>
                              <CardDescription>{plot.id}</CardDescription>
                            </div>
                            {
                              (() => {
                                const statusLabel = String(plot.status);
                                let badgeVariant: 'default' | 'secondary' | 'destructive' = 'secondary';
                                let bgClass = 'bg-yellow-500';
                                const StatusIcon: any = Clock;

                                if (statusLabel === 'Verified' || statusLabel.toLowerCase() === 'available') {
                                  badgeVariant = 'default';
                                  bgClass = 'bg-green-500';
                                } else if (statusLabel === 'Rejected' || statusLabel.toLowerCase() === 'leased') {
                                  badgeVariant = 'destructive';
                                  bgClass = 'bg-red-500';
                                } else {
                                  badgeVariant = 'secondary';
                                  bgClass = 'bg-yellow-500';
                                }

                                const IconComponent: any =
                                  statusLabel === 'Verified' || statusLabel.toLowerCase() === 'available'
                                    ? CheckCircle
                                    : statusLabel === 'Rejected' || statusLabel.toLowerCase() === 'leased'
                                    ? AlertTriangle
                                    : Clock;

                                return (
                                  <Badge variant={badgeVariant} className={bgClass}>
                                    <IconComponent className="w-3 h-3 mr-1" />
                                    {statusLabel}
                                  </Badge>
                                );
                              })()
                            }
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Area:</span>
                              <span className="font-medium">{plot.area}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Location:</span>
                              <span className="font-medium">{plot.location}</span>
                            </div>
                            {plot.ownerName && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Owner:</span>
                                <span className="font-medium">{plot.ownerName}</span>
                              </div>
                            )}
                            {plot.surveyNo && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Survey No:</span>
                                <span className="font-mono text-xs">{plot.surveyNo}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm" className="flex-1">
                              View Details
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              Edit Plot
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Empty State */}
                  {myPlots.length === 0 && !plotsLoading && (
                    <Card className="text-center py-12">
                      <CardContent>
                        <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Plots Registered</h3>
                        <p className="text-muted-foreground mb-4">Start by registering your first land plot</p>
                        <Button onClick={() => setActiveTab('register')}>
                          Register New Plot
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {/* Admin Verification Tab */}
          {activeTab === 'admin' && (
            <div className="grid gap-4">
              {pendingVerifications.map((verification) => (
                <Card key={verification.id} className="border-l-4 border-l-yellow-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{verification.plotName}</CardTitle>
                        <CardDescription>
                          Submitted by: {verification.farmerName} • {verification.submittedDate}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Pending Review
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Plot Information</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Area:</span>
                            <span>{verification.area}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Verification ID:</span>
                            <span className="font-mono">{verification.id}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Submitted Documents</h4>
                        <div className="space-y-1">
                          {verification.documents.map((doc, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span>{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                        Approve & Verify
                      </Button>
                      <Button variant="outline" size="sm">
                        Request More Info
                      </Button>
                      <Button variant="destructive" size="sm">
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {pendingVerifications.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Pending Verifications</h3>
                    <p className="text-muted-foreground">All land registrations have been processed</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        .field-gradient {
          background: linear-gradient(to bottom right, var(--background) 0%, var(--muted) 100%);
        }
      `}</style>
    </div>
  );
};

export default LandOnboarding;