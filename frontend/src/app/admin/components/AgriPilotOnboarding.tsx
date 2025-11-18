import React, { useState, useEffect } from 'react';
import { Button } from '../../farmer/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../farmer/ui/card';
import { Dialog, DialogContent } from '../../farmer/ui/dialog';
import { MapPin, Calendar, Star, Shield, CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface CopilotData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  photo_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface AgriPilotOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  landLocation: string;
}

const AgriPilotOnboarding: React.FC<AgriPilotOnboardingProps> = ({
  isOpen,
  onClose,
  landLocation
}) => {
  const [copilots, setCopilots] = useState<CopilotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCopilots();
    }
  }, [isOpen]);

  const fetchCopilots = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/admin/copilots', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch copilots');
      }

      const data = await response.json();
      setCopilots(data.filter((copilot: any) => copilot.status === 'approved'));
    } catch (err) {
      setError('Failed to load copilots data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Connect with Agri AI Pilots</CardTitle>
            <CardDescription>
              Expert land mapping professionals in {landLocation}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Available Pilots */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Available Pilots</h3>
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-red-500 text-center p-4">{error}</div>
                ) : copilots.length === 0 ? (
                  <div className="text-center text-gray-500 p-4">
                    No approved pilots available in your area yet.
                  </div>
                ) : (
                  copilots.map((pilot) => (
                    <Card key={pilot.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden relative">
                          <Image
                            src={pilot.photo_url || '/default-avatar.png'}
                            alt={pilot.full_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{pilot.full_name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>Available in {landLocation}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>Verified Professional</span>
                          </div>
                          <div className="mt-2">
                            <Button variant="outline" className="w-full" onClick={() => window.location.href = `mailto:${pilot.email}`}>
                              Contact Pilot
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {/* Booking Information */}
              <div className="space-y-6">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-4">Verification Status</h3>
                  <div className="space-y-2">
                    {[
                      'Government Licensed',
                      'Background Verified',
                      'Aadhar Verified',
                      'Professional Equipment'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-4">Service Highlights</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Verified Professionals</h4>
                        <p className="text-sm text-muted-foreground">
                          All pilots are thoroughly vetted and verified
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Star className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Quality Assured</h4>
                        <p className="text-sm text-muted-foreground">
                          Professional grade equipment and expertise
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Flexible Scheduling</h4>
                        <p className="text-sm text-muted-foreground">
                          Book appointments at your convenience
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-center text-muted-foreground">
                    Need help? Contact our support team
                  </p>
                  <Button variant="outline" className="w-full mt-3">
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default AgriPilotOnboarding;