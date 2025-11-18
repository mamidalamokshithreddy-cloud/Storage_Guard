import { Button } from "../farmer/ui/button";
import { ArrowLeft, ArrowRight, Users } from "lucide-react";
import { useRouter } from "next/navigation";

// AgriHub Module Navigation Order
const AGRI_MODULES = [
  { name: "Land Mapping", telugu: "భూమి మ్యాపింగ్" },
  { name: "SoilSense", telugu: "మట్టి విశ్లేషణ" },
  { name: "SeedPlanner", telugu: "విత్తన ప్లానింగ్" },
  { name: "AquaGuide", telugu: "నీటిపారుదల" },
  { name: "CropShield", telugu: "పంట రక్షణ" },
  { name: "NutriDose", telugu: "పోషకాలు" },
  { name: "HarvestBot", telugu: "కోత యంత్రం" },
  { name: "StorageGuard", telugu: "నిల్వ రక్షణ" },
  { name: "MarketConnect", telugu: "మార్కెట్ కనెక్ట్" },
  { name: "Processing Hub", telugu: "ప్రాసెసింగ్ హబ్" },
  { name: "Quality Assurance", telugu: "నాణ్యత హామీ" },
  { name: "Packaging & Branding", telugu: "ప్యాకేజింగ్" },
  { name: "Consumer Delivery", telugu: "డెలివరీ" },
  { name: "Consumer Feedback", telugu: "ప్రతిస్పందన" }
];

// Helper function to get navigation info
const getNavigationInfo = (currentTitle: string) => {
  // First try exact match by module name
  let currentIndex = AGRI_MODULES.findIndex(module => 
    currentTitle === module.name || currentTitle === module.telugu
  );
  
  // If no exact match, try partial match
  if (currentIndex === -1) {
    currentIndex = AGRI_MODULES.findIndex(module => 
      currentTitle.includes(module.name) || currentTitle.includes(module.telugu)
    );
  }
  
  const prevModule = currentIndex > 0 ? AGRI_MODULES[currentIndex - 1] : null;
  const nextModule = currentIndex < AGRI_MODULES.length - 1 ? AGRI_MODULES[currentIndex + 1] : null;
  
  return { prevModule, nextModule, currentIndex };
};

interface PageHeaderProps {
  title: string;
  titleTelugu: string;
  icon?: React.ComponentType<{ className?: string }>;
  backButton?: {
    label: string;
    route: string;
  };
  nextButton?: {
    label: string;
    route?: string;
    onClick?: () => void;
  };
  onAgriSaarathiClick?: () => void;
  currentModule?: string; // Add current module prop for intelligent navigation
  onModuleNavigate?: (_moduleName: string) => void; // Add navigation callback
}

const PageHeader = ({ 
  title, 
  titleTelugu, 
  icon: Icon, 
  backButton,
  nextButton, 
  onAgriSaarathiClick,
  currentModule,
  onModuleNavigate
}: PageHeaderProps) => {
  const router = useRouter();
  
  // Get intelligent navigation info
  const { prevModule, nextModule } = getNavigationInfo(currentModule || title);
  
  // Determine back navigation
  const getBackNavigation = () => {
    if (backButton) return { ...backButton, onClick: undefined }; // Use custom back button if provided
    
    if (prevModule) {
      return {
        label: `${prevModule.name}`,
        route: "/farmer",
        onClick: () => onModuleNavigate?.(prevModule.name)
      };
    }
    
    return {
      label: "Dashboard",
      route: "/farmer",
      onClick: undefined
    };
  };
  
  // Determine next navigation
  const getNextNavigation = () => {
    if (nextButton) return nextButton; // Use custom next button if provided
    
    if (nextModule) {
      return {
        label: `${nextModule.name}`,
        route: "/farmer",
        onClick: () => onModuleNavigate?.(nextModule.name)
      };
    }
    
    return null; // No next module available
  };
  
  const backNav = getBackNavigation();
  const nextNav = getNextNavigation();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-0 py-0 flex items-center justify-between gap-4 h-16">
        {/* Left: Intelligent Back Navigation */}
        <Button 
          onClick={backNav.onClick || (() => router.push(backNav.route))}
          size="sm"
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white border-none transition-all duration-200 hover:shadow-md"
          title={prevModule ? `Navigate to ${prevModule.name} (${prevModule.telugu})` : 'Go back to Dashboard'}
        >
          <ArrowLeft className="w-4 h-4" />
          {backNav.label}
        </Button>

        {/* Center: AgriSaarathi with User Icon */}
        <div 
          onClick={onAgriSaarathiClick}
          className="flex items-center gap-2 cursor-pointer border border-green-500 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors"
        >
          <div className="bg-white-500 text-green rounded-full p-1.5">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <span className="text-base font-medium text-green-600">
            AgriSaarathi | కృషి సారథి
          </span>
        </div>

        {/* Right: Title and Next Button */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-primary flex items-center gap-3">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
            )}
            <span>
              {title} | {titleTelugu}
            </span>
          </h1>

          {/* Intelligent Next Navigation */}
          {nextNav && (
            <Button 
              onClick={nextNav.onClick || (() => router.push(nextNav.route!))}
              className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover:shadow-md"
              title={nextModule ? `Navigate to ${nextModule.name} (${nextModule.telugu})` : 'Continue to next module'}
            >
              {nextNav.label}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
