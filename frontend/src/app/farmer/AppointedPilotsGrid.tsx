import React, { useState } from "react";
import { Badge } from "./ui/badge";
import PilotChatDialog from "./PilotChatDialog";

// Define types for pilots and pilot specs
interface Pilot {
  id: string;
  name: string;
  contact: string;
  status: string;
  specs: PilotSpec[];
}

interface PilotSpec {
  label: string;
  value: string;
}

// Props for AppointedPilotsGrid
interface AppointedPilotsGridProps {
  pilots: Pilot[];
  onRemovePilot: (_id: string) => void;
}

const AppointedPilotsGrid: React.FC<AppointedPilotsGridProps> = ({ pilots, onRemovePilot }) => {
  const [selectedPilot, setSelectedPilot] = useState<Pilot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div>
      <h2>Appointed Pilots</h2>
      <div className="pilot-grid">
        {pilots.map((pilot: Pilot) => (
          <div key={pilot.id} className="pilot-card">
            <div>
              <span>{pilot.name}</span>
              <Badge>{pilot.status}</Badge>
            </div>
            <div>
              {pilot.specs.map((spec: PilotSpec, index: number) => (
                <span key={index}>{spec.label}: {spec.value}</span>
              ))}
            </div>
            <button onClick={() => onRemovePilot(pilot.id)}>Remove</button>
            <button onClick={() => { setSelectedPilot(pilot); setIsDialogOpen(true); }}>Chat</button>
          </div>
        ))}
      </div>
      {/* Pass correct props to PilotChatDialog */}
      {selectedPilot && isDialogOpen && (
        <PilotChatDialog />
      )}
    </div>
  );
};

export default AppointedPilotsGrid;