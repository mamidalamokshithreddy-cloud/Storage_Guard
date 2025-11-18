import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Sprout, MapPin, ShoppingBasket, ClipboardCheck, Package } from "lucide-react";

// LOCAL ASSETS: Use public paths directly (files should be in /public)

// --- INLINED UTILITY (from @/lib/utils) ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- INLINED COMPONENT: Button (from button.tsx) ---
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:shadow-lg hover:scale-105 transition-all duration-300 shadow-md",
        farmer: "bg-earth-green text-white hover:bg-earth-green/90 shadow-sm",
        landowner: "bg-earth-brown text-white hover:bg-earth-brown/90 shadow-sm",
        buyer: "bg-earth-gold text-white hover:bg-earth-gold/90 shadow-sm",
        agri_copilot: "bg-earth-blue text-white hover:bg-earth-blue/90 shadow-sm",
        vendor: "bg-vendor-purple text-white hover:bg-vendor-purple/90 shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";


// --- INLINED COMPONENT: Card (from card.tsx) ---
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
));
Card.displayName = "Card";
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
));
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";


// --- MAIN COMPONENT: UserTypeSelection ---
type UserTypeId = 'farmer' | 'landowner' | 'vendor' | 'buyer' | 'agri_copilot';

interface UserType {
  id: UserTypeId;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  variant: "farmer" | "landowner" | "buyer" | "agri_copilot" | "vendor";
}
const userTypes: UserType[] = [
  { id: "landowner", title: "Landowner", description: "Remotely manage your agricultural land and maximize returns through technology", icon: MapPin, variant: "landowner" },
  { id: "farmer", title: "Farmer", description: "Cultivate your land with AI-powered assistance and get connected to markets", icon: Sprout, variant: "farmer" },
  { id: "agri_copilot", title: "AgriCopilot", description: "Monitor and support agricultural activities with advanced analytics and insights", icon: ClipboardCheck, variant: "agri_copilot" },
  { id: "vendor", title: "Vendor", description: "Supply agricultural products, equipment, and services to farmers and landowners", icon: Package, variant: "vendor" },
  { id: "buyer", title: "Buyer", description: "Source quality agricultural products directly from farmers and landowners", icon: ShoppingBasket, variant: "buyer" }
];
interface UserTypeSelectionProps {
  onSelectUserType: (userType: UserTypeId) => void;
  onBackToHome: () => void;
  onLogin: () => void;
}
export default function UserTypeSelection({ onSelectUserType, onBackToHome, onLogin }: UserTypeSelectionProps) {
  const textShadowStyle = "[text-shadow:0_1px_4px_rgba(0,0,0,0.8)]";

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-white via-green-50 to-green-100">
      {/* subtle overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/60 z-0 pointer-events-none" />
      <Button variant="link" onClick={onBackToHome} className="absolute top-4 left-4 z-10 text-white hover:text-white/90 hover:no-underline transition-transform active:scale-95 [text-shadow:0_1px_3px_#000a]">
        ← Back to Home
      </Button>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-full mx-auto">
          <div className="text-center mb-8 flex flex-col items-center justify-center">
            <h1 className={`text-3xl font-bold text-gray-900 mb-3`}>Join AgriHub</h1>
            <p className={`text-lg text-gray-700 max-w-2xl mx-auto`}>
              Select your role to get started with India's most advanced agricultural platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {userTypes.map((userType) => {
              const IconComponent = userType.icon;
              const getBackgroundImage = (id: string) => {
                switch (id) {
                  case 'farmer': return '/farmer-bg.jpg';
                  case 'landowner': return '/landowner-bg.jpg';
                  case 'buyer': return '/buyer-bg.jpg';
                  case 'agri_copilot': return '/agricopilot-bg.jpg';
                  case 'vendor': return '/vendor-bg.jpg';
                  default: return '';
                }
              };

              return (
                <Card
                  key={userType.id}
                  className="h-64 hover:shadow-2xl transition-transform duration-300 cursor-pointer group overflow-hidden rounded-lg relative"
                  onClick={() => onSelectUserType(userType.id)}
                  style={{
                    backgroundImage: `url(${getBackgroundImage(userType.id)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* dark overlay to ensure text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-0" />

                  <CardHeader className="text-center pb-2 flex-shrink-0 relative z-10 pt-4">
                    <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-transform duration-200 border border-white/20 bg-white/20 group-hover:scale-105">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-base font-semibold text-white drop-shadow-lg">{userType.title}</CardTitle>
                  </CardHeader>

                  <CardContent className="text-center flex flex-col flex-grow justify-between pt-0 relative z-10 px-4 pb-5">
                    <CardDescription className="text-sm mb-3 flex-grow flex items-center justify-center text-white/90">
                      {userType.description}
                    </CardDescription>

                    <Button
                      variant={userType.variant}
                      className="w-full h-10 text-sm font-semibold bg-white/95 text-green-800 hover:bg-white"
                      onClick={(e) => { e.stopPropagation(); onSelectUserType(userType.id); }}
                    >
                      Register as {userType.title}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}










