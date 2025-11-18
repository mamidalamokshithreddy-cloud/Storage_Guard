'use client';

import { useState } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  MapPin, 
  Camera, 
  Satellite, 
  Compass, 
  FileText, 
  Calculator, 
  Video, 
  AlertCircle,
  Plane,
  Zap,
  CheckCircle
} from "lucide-react";

// Import components
import AgentVideoSection from "../AgentVideoSection";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";
import AgriChatAgent from "../AgriChatAgent";
import AgriPilotOnboarding from "../../admin/components/AgriPilotOnboarding";

// Define services array
const landMappingServices = [
  {
    title: "GPS Survey Consultation",
    titleTelugu: "జిపిఎస్ సర్వే సలహా",
    description: "Professional GPS-based land boundary survey",
    descriptionTelugu: "వృత్తిపరమైన జిపిఎస్ ఆధారిత భూమి సరిహద్దు సర్వే",
    duration: "2-3 hours",
    price: "₹1,200",
    icon: Satellite,
    available: true
  },
  {
    title: "Boundary Mapping Guidance",
    titleTelugu: "సరిహద్దు మ్యాపింగ్ మార్గదర్శనం",
    description: "Expert help in accurate land boundary identification",
    descriptionTelugu: "ఖచ్చితమైన భూమి సరిహద్దు గుర్తింపులో నిపుణుల సహాయం",
    duration: "1-2 hours",
    price: "₹800",
    icon: Compass,
    available: true
  },
  {
    title: "Soil Mapping Analysis",
    titleTelugu: "మట్టి మ్యాపింగ్ విశ్లేషణ",
    description: "Detailed soil type mapping for optimal crop planning",
    descriptionTelugu: "సరైన పంట ప్రణాళిక కోసం వివరణాత్మక మట్టి రకం మ్యాపింగ్",
    duration: "3-4 hours",
    price: "₹2,000",
    icon: MapPin,
    available: true
  },
  {
    title: "Legal Documentation Support",
    titleTelugu: "చట్టపరమైన పత్రాల మద్దతు",
    description: "Help with land records and legal documentation",
    descriptionTelugu: "భూమి రికార్డులు మరియు చట్టపరమైన పత్రాలతో సహాయం",
    duration: "1 hour",
    price: "₹600",
    icon: FileText,
    available: true
  },
  {
    title: "Area Calculation Service",
    titleTelugu: "వైశాల్య గణన సేవ",
    description: "Accurate land area measurement and calculation",
    descriptionTelugu: "ఖచ్చితమైన భూమి వైశాల్య కొలత మరియు గణన",
    duration: "1 hour",
    price: "₹500",
    icon: Calculator,
    available: true
  },
  {
    title: "Live Video Consultation",
    titleTelugu: "ప్రత్యక్ష వీడియో సలహా",
    description: "Instant expert guidance on land mapping queries",
    descriptionTelugu: "భూమి మ్యాపింగ్ ప్రశ్నలపై తక్షణ నిపుణుల మార్గదర్శనం",
    duration: "30 minutes",
    price: "₹400",
    icon: Video,
    available: true
  }
];

interface LandMappingPageProps {
  onLandRegistrationClick?: () => void;
  onLeasingManagementClick?: () => void;
}

export default function LandMappingPage({ onLandRegistrationClick, onLeasingManagementClick }: LandMappingPageProps = {}) {
  // const router = useRouter();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  // const [hasAppointedPilots] = useState(false);

  // Add hover effect handlers
  // const handleCardHover = (e: React.MouseEvent<HTMLDivElement>) => {
  //   e.currentTarget.classList.add('transform', 'scale-[1.02]', 'shadow-lg');
  // };

  // const handleCardLeave = (e: React.MouseEvent<HTMLDivElement>) => {
  //   e.currentTarget.classList.remove('transform', 'scale-[1.02]', 'shadow-lg');
  // };

  return (
    <div className="min-h-screen field-gradient">
      <AgriChatAgent />
      <AgriAIPilotSidePeek
        agentType="LandMapping"
        agentName="Land Mapping"
        agentNameTelugu="భూమి మ్యాపింగ్"
        services={landMappingServices}
      />
      <div className="max-w-full mx-auto px-1 py-2">
        {/* Navigation to Land Flows */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={onLandRegistrationClick}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Land Onboarding & Mapping
              </CardTitle>
              <CardDescription>
                Register land plots with GPS mapping and ownership verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full agri-button-primary"
                onClick={onLandRegistrationClick}
              >
                Start Land Registration
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={onLeasingManagementClick}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Leasing & Role Assignment
              </CardTitle>
              <CardDescription>
                Create lease agreements and manage farmer-landowner relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full agri-button-primary"
                onClick={onLeasingManagementClick}
              >
                Manage Leasing
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="agri-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-6 h-6 text-primary" />
                Drone Survey | డ్రోన్ సర్వే
              </CardTitle>
              <CardDescription>High-precision aerial land mapping</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
                <Image
                  src="/drone-soil-lab-testing.jpg"
                  alt="Land mapping with drone technology"
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span>Survey Status</span>
                  <Badge className="bg-success text-success-foreground">Completed</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span>Area Mapped</span>
                  <span className="font-bold">12.5 acres</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span>Accuracy</span>
                  <span className="font-bold text-primary">±15cm</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="agri-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary" />
                Boundary Coordinates | సరిహద్దు కోఆర్డినేట్లు
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg">
                  <h3 className="font-semibold mb-2">GPS Coordinates</h3>
                  <div className="text-sm space-y-1 font-mono">
                    <p>NE: 17.4434°N, 78.3915°E</p>
                    <p>NW: 17.4434°N, 78.3890°E</p>
                    <p>SE: 17.4410°N, 78.3915°E</p>
                    <p>SW: 17.4410°N, 78.3890°E</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Total Area</p>
                    <p className="text-lg font-bold text-primary">12.5 acres</p>
                  </div>
                  <div className="p-3 bg-success/10 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Cultivable</p>
                    <p className="text-lg font-bold text-success">11.2 acres</p>
                  </div>
                </div>

                <Button className="w-full agri-button-primary">
                  <Satellite className="w-4 h-4 mr-2" />
                  View Satellite Map
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expert Services Card */}
        <Card className="agri-card mt-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <AlertCircle className="w-8 h-8 text-primary" />
              Need Expert Land Mapping? | నిపుణుల భూమి మ్యాపింగ్ అవసరమా?
            </CardTitle>
            <CardDescription className="text-lg">
              Connect with certified Agri AI Pilots near your location for professional land survey
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              <Image
                src="/land-mapping-realistic.jpg"
                alt="Professional land mapping service"
                width={800}
                height={400}
                className="w-full rounded-lg"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-card rounded-lg border">
                <div className="text-2xl font-bold text-primary">15+</div>
                <div className="text-sm text-muted-foreground">Certified Pilots Available</div>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <div className="text-2xl font-bold text-success">Expert</div>
                <div className="text-sm text-muted-foreground">Professional Service</div>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <div className="text-2xl font-bold text-accent">2.3km</div>
                <div className="text-sm text-muted-foreground">Nearest Pilot Distance</div>
              </div>
            </div>

            <Button 
              size="lg" 
              className="agri-button-primary px-8 py-4 text-lg"
              onClick={() => setIsOnboardingOpen(true)}
            >
              <Plane className="w-5 h-5 mr-2" />
              Appoint Your Agri AI Pilot | మీ అగ్రి AI పైలట్‌ను నియమించండి
            </Button>
          </CardContent>
        </Card>

        {/* Survey Results */}
        <Card className="agri-card mt-8">
          <CardHeader>
            <CardTitle>Survey Results | సర్వే ఫలితాలు</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border border-border rounded-lg">
                <Zap className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="font-bold mb-2">Elevation Analysis</h3>
                <p className="text-sm text-muted-foreground">Slope: 2-5% (Optimal for drainage)</p>
              </div>
              
              <div className="text-center p-6 border border-border rounded-lg">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                <h3 className="font-bold mb-2">Boundary Verified</h3>
                <p className="text-sm text-muted-foreground">All corners GPS marked</p>
              </div>
              
              <div className="text-center p-6 border border-border rounded-lg">
                <MapPin className="w-12 h-12 text-accent mx-auto mb-3" />
                <h3 className="font-bold mb-2">Water Sources</h3>
                <p className="text-sm text-muted-foreground">2 bore wells identified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Section */}
        {AgentVideoSection && (
          <AgentVideoSection 
            agentName="Land Mapping"
            agentNameTelugu="భూమి మ్యాపింగ్"
            videos={[
              {
                title: "Drone Survey Flight Operations",
                titleTelugu: "డ్రోన్ సర్వే విమాన కార్యకలాపాలు",
                duration: "10:20",
                type: "demo"
              },
              {
                title: "GPS Boundary Marking Process",
                titleTelugu: "GPS సరిహద్దు గుర్తింపు ప్రక్రియ",
                duration: "7:45",
                type: "tutorial"
              },
              {
                title: "Farmer Benefits: Precise Land Records",
                titleTelugu: "రైతు ప్రయోజనాలు: ఖచ్చితమైన భూ రికార్డులు",
                duration: "5:30",
                type: "case-study"
              }
            ]}
          />
        )}
      </div>

      {/* AgriPilotOnboarding Dialog */}
      {AgriPilotOnboarding && (
        <AgriPilotOnboarding
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          landLocation="Warangal District"
        />
      )}

      <style jsx>{`
        .field-gradient {
          background: linear-gradient(to bottom right, var(--background), 95%, var(--muted));
        }
        .agri-card {
          transition: all 0.3s ease;
        }
        .agri-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1);
        }
        .agri-button-primary {
          background: linear-gradient(to right, var(--primary), var(--primary-foreground));
          color: white;
          transition: all 0.3s ease;
        }
        .agri-button-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}