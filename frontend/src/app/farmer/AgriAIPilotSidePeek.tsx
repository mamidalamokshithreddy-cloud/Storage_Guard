import { useState } from "react";
import { Button } from "../farmer/ui/button";
import { ChevronRight, Users, X } from "lucide-react";
import AgriAIPilot from "./AgriAIPilot";
// import { useAppointedPilot } from "@/contexts/AppointedPilotContext";
import AppointedPilotsGrid from "./AppointedPilotsGrid";
const agriAIPilotExpert = "/agri-aipilot-expert.jpg";
const agriHubFieldWorker = "/agrihub-field-worker.jpg";
const agriWomanExpert = "/agri-aipilot-woman-expert.jpg";

interface ServiceItem {
  title: string;
  titleTelugu: string;
  description: string;
  descriptionTelugu: string;
  duration: string;
  price: string;
  icon: any;
  available: boolean;
}

interface AgriAIPilotSidePeekProps {
  agentType: string;
  agentName: string;
  agentNameTelugu: string;
  services?: ServiceItem[];
}

const AgriAIPilotSidePeek = ({ agentType, agentName, agentNameTelugu, services }: AgriAIPilotSidePeekProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasAppointedPilots = false;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Minimal Floating Expert Images Trigger */}
      {!isExpanded && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50">
          <Button
            onClick={toggleExpanded}
            variant="ghost"
            className="p-2 bg-card/90 backdrop-blur-sm border border-border rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group h-auto"
          >
            <div className="flex flex-col gap-1">
              {/* Male Expert */}
              <img 
                src={agriAIPilotExpert} 
                alt="Male Expert"
                className="w-8 h-8 rounded-full object-cover border-2 border-primary/50 shadow-sm transition-transform group-hover:scale-110"
              />
              
              {/* Female Expert */}
              <img 
                src={agriWomanExpert} 
                alt="Female Expert" 
                className="w-8 h-8 rounded-full object-cover border-2 border-secondary/50 shadow-sm transition-transform group-hover:scale-110 -mt-2"
              />
              
              {/* Field Worker */}
              <img 
                src={agriHubFieldWorker} 
                alt="Field Worker"
                className="w-8 h-8 rounded-full object-cover border-2 border-accent/50 shadow-sm transition-transform group-hover:scale-110 -mt-2"
              />
            </div>
          </Button>
        </div>
      )}

      {/* Expanded Full Panel */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={toggleExpanded}
          />
          
          {/* Panel Content */}
          <div className="fixed top-0 right-0 h-full w-[95vw] max-w-[800px] z-50 transform transition-transform duration-500 ease-out">
            <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col">
              {/* Header */}
              <div className="bg-background/98 backdrop-blur-sm border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-primary" />
                    <div>
                      <h2 className="text-lg font-bold">Agri AIPilot Expert Services</h2>
                      <p className="text-sm text-accent">కృషి ఏఐపైలట్ నిపుణుల సేవలు</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={toggleExpanded}
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 hover:bg-destructive/10 group"
                  >
                    <X className="w-5 h-5 text-muted-foreground group-hover:text-destructive transition-colors" />
                  </Button>
                </div>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {/* Context Info */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex -space-x-2">
                        <img src={agriAIPilotExpert} alt="" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                        <img src={agriWomanExpert} alt="" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                        <img src={agriHubFieldWorker} alt="" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Specialized {agentName} Experts</h3>
                        <p className="text-xs text-accent">{agentNameTelugu} నిపుణులు</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get personalized guidance from certified agricultural experts specialized in {agentName.toLowerCase()} solutions.
                    </p>
                  </div>
                  
                  {/* Show both Appointed Pilots (if exists) AND all activities */}
                  {hasAppointedPilots && (
                    <div className="mb-6">
                      <AppointedPilotsGrid 
                        pilots={[]}
                        onRemovePilot={(pilotId) => console.log('Removing pilot:', pilotId)}
                      />
                    </div>
                  )}
                  
                  {/* Always show AgriAIPilot activities */}
                  <AgriAIPilot
                    agentType={agentType}
                    agentName={agentName}
                    agentNameTelugu={agentNameTelugu}
                    services={services}
                    isInSidePanel={true}
                  />
                </div>
              </div>
              
              {/* Footer */}
              <div className="bg-background/98 backdrop-blur-sm border-t border-border p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Available 24/7 for emergency support</span>
                  <Button
                    onClick={toggleExpanded}
                    variant="outline"
                    size="sm"
                    className="h-8"
                  >
                    <ChevronRight className="w-4 h-4 mr-1" />
                    Close Panel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AgriAIPilotSidePeek;