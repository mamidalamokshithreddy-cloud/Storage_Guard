import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";
import { Sprout, TrendingUp, Users, Shield, Smartphone, BarChart3, ArrowRight } from "lucide-react";

// --- Utility Function ---
// Merges Tailwind CSS classes without style conflicts.
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Card Component (NEW Light Theme) ---
// Redesigned with a white background, subtle border, and shadow to match the new UI.
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

// --- Button Component (NEW Light Theme) ---
// Button variants are completely overhauled to match the green and white color scheme.
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // The primary green button style from the screenshot
        default: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
        // For secondary actions
        outline: "border border-slate-300 bg-transparent hover:bg-slate-100 text-slate-700",
        // For less prominent actions
        ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

// --- Component Data ---
const stats = [
  { value: "10,000+", label: "Farmers Connected" },
  { value: "5M+", label: "Acres Under Management" },
  { value: "₹500Cr+", label: "Revenue Generated" },
];

const features = [
  { icon: Sprout, title: "AI-Powered Farming", description: "Smart crop recommendations and real-time monitoring." },
  { icon: TrendingUp, title: "Market Integration", description: "Direct access to buyers for fair and transparent pricing." },
  { icon: Users, title: "Remote Management", description: "Oversee your entire farming operation from anywhere." },
  { icon: Shield, title: "Risk Mitigation", description: "Receive weather alerts and crop insurance guidance." },
  { icon: Smartphone, title: "Mobile-First Platform", description: "Full functionality and intuitive design on your smartphone." },
  { icon: BarChart3, title: "Analytics Dashboard", description: "Gain detailed insights with performance metrics and reports." },
];

// --- Main HeroSection Component ---
interface HeroSectionProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onNavigateToSuperAdmin: () => void;
}

export default function HeroSection({ onGetStarted, onLogin, onNavigateToSuperAdmin }: HeroSectionProps) {
  return (
    <div className="w-full bg-white text-slate-800 relative">
      {/* Watermark Background */}
      <div 
        className="fixed inset-0 z-0 opacity-15"
        style={{ 
          backgroundImage: 'url(/title logo.jpg)',
          backgroundSize: '50% auto',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
          opacity: 0.8
        }}
      />
      
      {/* Semi-transparent overlay to make watermark more subtle */}
      <div className="fixed inset-0 bg-white/20 z-0 pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="relative z-10 flex flex-col items-center px-4">
        {/* Navigation */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-lg">
          <nav className="mx-auto flex max-w-full items-center justify-between h-20 px-4">
            <a href="/" className="flex items-center gap-2">
              <img 
                src="/title logo.jpg" 
                alt="AgriHub Logo" 
                className="h-12 w-auto rounded-md"
              />
              <span className="text-2xl font-bold tracking-wider text-green-700">AgriHub</span>
            </a>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={onLogin}>Login<ArrowRight className="ml-2 h-4 w-4" /></Button>
              {/* <Button onClick={onGetStarted}>
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button> */}
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex w-full flex-col items-center justify-center text-center py-24 sm:py-32">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900">
            The Future of Farming is Here.
            <br />
            Welcome to <span className="text-green-600">AgriHub</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg sm:text-xl text-slate-600">
            India's first Agentic AI-enabled agricultural platform. Manage your farm remotely, 
            connect with markets, and maximize your harvest with intelligent automation.
          </p>
          
          {/* <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" onClick={onGetStarted}>Start your agriculture journey</Button>
          </div> */}
        </main>

        {/* Stats Section */}
        <section className="w-full max-w-5xl bg-slate-50 p-8 sm:p-12 rounded-2xl border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-green-600">{stat.value}</div>
                <div className="mt-2 text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 sm:py-32 w-full max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">A Smarter Way to Farm</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
              Our platform provides all the tools you need for efficient and profitable agriculture.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="text-left flex flex-col items-start transition-transform duration-300 hover:-translate-y-2 hover:shadow-lg">
                <div className="mb-4 bg-green-100 p-3 rounded-lg">
                   <feature.icon className="h-6 w-6 text-green-700" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-slate-600 flex-grow">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}