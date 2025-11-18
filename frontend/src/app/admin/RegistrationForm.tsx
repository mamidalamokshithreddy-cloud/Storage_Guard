




// Removed duplicate RegistrationFormProps and unused export default RegistrationForm





import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";



// EXTERNAL DEPENDENCIES
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronDown, ChevronUp, X, CheckCircle, PartyPopper, Sparkles, Circle, Eye, EyeOff } from "lucide-react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- INLINED UTILITY (from @/lib/utils) ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



// Utility function to hash password with SHA-256
async function hashPassword(password: string): Promise<string> {
  // Encode the password as UTF-8
  const msgBuffer = new TextEncoder().encode(password);

  // Hash the password
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // Convert the hash to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
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
        officer: "bg-earth-blue text-white hover:bg-earth-blue/90 shadow-sm",
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

// --- INLINED COMPONENT: Input (from input.tsx) ---
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-white/10 px-3 py-2 text-base text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// --- INLINED COMPONENT: Label (from label.tsx) ---
const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

// --- INLINED COMPONENT: Textarea (from textarea.tsx) ---
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-white/10 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

// --- INLINED COMPONENT: Select (from select.tsx) ---
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:block [&>span]:truncate",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white text-gray-900 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
        'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

// --- INLINED COMPONENT: Checkbox (from checkbox.tsx) ---
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

// --- INLINED COMPONENT: Toast (from toast.tsx) and HOOK: useToast ---
const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed left-1/2 top-1/2 z-[100] flex w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col items-center space-y-2 p-4",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full max-w-md items-center justify-between space-x-4 overflow-hidden rounded-lg border bg-background p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:fade-in-90 data-[state=open]:zoom-in-90 data-[state=closed]:zoom-out-90 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        success: "border-green-500 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-50",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
      }
    },
    defaultVariants: { variant: "default" },
  }
);
const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />;
});
Toast.displayName = ToastPrimitives.Root.displayName;
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

// This is the standard implementation of the `useToast` hook.
type ToastActionElement = React.ReactElement<typeof ToastAction>; // ToastAction is defined below, but type is hoisted
type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};
const reducer = (state: ToasterToast[], action: { type: 'ADD_TOAST'; toast: ToasterToast } | { type: 'DISMISS_TOAST'; toastId?: string } | { type: 'REMOVE_TOAST'; toastId?: string }) => {
  switch (action.type) {
    case 'ADD_TOAST': return [action.toast, ...state];
    case 'DISMISS_TOAST': return state.map(t => t.id === action.toastId || action.toastId === undefined ? { ...t, open: false } : t);
    case 'REMOVE_TOAST': return action.toastId ? state.filter(t => t.id !== action.toastId) : [];
    default: return state;
  }
};
const listeners: Array<(state: ToasterToast[]) => void> = [];
let memoryState: ToasterToast[] = [];
function dispatch(action: Parameters<typeof reducer>[1]) {
  memoryState = reducer(memoryState, action);
  listeners.forEach(listener => listener(memoryState));
}
function toast(props: Omit<ToasterToast, 'id'>) {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast = { ...props, id };
  dispatch({ type: 'ADD_TOAST', toast: newToast });
  setTimeout(() => dispatch({ type: 'DISMISS_TOAST', toastId: id }), 5000);
  return { id, dismiss: () => dispatch({ type: 'DISMISS_TOAST', toastId: id }), update: (props: ToasterToast) => { } };
}
function useToast() {
  const [state, setState] = React.useState<ToasterToast[]>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => { const index = listeners.indexOf(setState); if (index > -1) listeners.splice(index, 1); };
  }, [state]);
  return { toasts: state, toast, dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }) };
}

// --- MAIN COMPONENT: RegistrationForm ---
type FormData = {
  [key: string]: string | File | null | undefined;
  // Explicitly define file fields for type safety
  photo_file?: File | null;
  aadhar_front_file?: File | null;
};

interface OptionType {
  value: string;
  label: string;
}

type FormField = {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  colSpan?: 'full' | 'default';
  className?: string;
} & (
    | { type: 'select'; options: (string | OptionType)[]; pattern?: string; title?: string; }
    | { type: 'number'; min?: number | string; step?: number | string; pattern?: string; title?: string; }
    | { type: 'email'; pattern?: string; title?: string; }
    | { type: 'password'; pattern?: string; title?: string; }
    | { type: 'tel'; pattern?: string; title?: string; }
    | { type: 'text'; pattern?: string; title?: string; }
    | { type: 'textarea'; pattern?: string; title?: string; }
    | { type: 'file'; title?: string; }
  );

interface UserTypeConfig {
  title: string;
  description: string;
  variant: string;
  fields: FormField[];
}

type UserRole = 'farmer' | 'landowner' | 'vendor' | 'buyer' | 'agri_copilot';

type UserType = UserRole;

interface RegistrationFormProps {
  userType: UserType;
  onBackToSelection: () => void;
  onRegistrationComplete: () => void;
  onGoToLogin: () => void;
  token?: string; // Optional token for invitation-based registration
}
// Common fields for all user types
const inputClasses = "bg-white border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent";

const commonFields: FormField[] = [
  {
    name: "full_name",
    label: "Full Name",
    type: "text" as const,
    required: true,
    className: inputClasses
  },
  {
    name: "email",
    label: "Email",
    type: "email" as const,
    required: true,
    className: inputClasses
  },
  {
    name: "phone",
    label: "Phone Number",
    type: "tel" as const,
    required: true,
    placeholder: "+91 XXXXX XXXXX",
    pattern: "\\+91\\s[6-9]\\d{4}\\s\\d{5}",
    title: "Please enter a valid Indian mobile number starting with 6-9"
  },
  {
    name: "password",
    label: "Password",
    type: "password" as const,
    required: true,
    placeholder: "Must include uppercase, lowercase, and number (e.g. MyPass123)",
    title: "Password must contain at least one uppercase letter, one lowercase letter, and one number. Minimum 8 characters."
  },
  {
    name: "address_line1",
    label: "Address Line 1",
    type: "text" as const,
    required: true
  },
  {
    name: "address_line2",
    label: "Address Line 2",
    type: "text" as const,
    required: false
  },
  {
    name: "country",
    label: "Country",
    type: "select" as const,
    required: true,
    options: [
      { value: "", label: "🌍 Select Country" },
      { value: "India", label: "🇮🇳 India" },
      { value: "United States", label: "🇺🇸 United States" },
      { value: "United Kingdom", label: "🇬🇧 United Kingdom" },
      { value: "Canada", label: "🇨🇦 Canada" },
      { value: "Australia", label: "🇦🇺 Australia" },
      { value: "Germany", label: "🇩🇪 Germany" },
      { value: "France", label: "🇫🇷 France" },
      { value: "Japan", label: "🇯🇵 Japan" },
      { value: "China", label: "🇨🇳 China" },
      { value: "Brazil", label: "🇧🇷 Brazil" }
    ]
  },
  {
    name: "state",
    label: "State / Province",
    type: "select" as const,
    required: true,
    options: [] // Will be populated dynamically based on country selection
  },
  {
    name: "city",
    label: "City / District",
    type: "select" as const,
    required: true,
    options: [] // Will be populated dynamically based on state selection
  },
  {
    name: "mandal",
    label: "Mandal",
    type: "select" as const,
    required: false,
    options: [] // Will be populated dynamically based on district selection
  },
  {
    name: "pincode",
    label: "Pincode",
    type: "text" as const,
    required: true
  },
];

// Enhanced Location Data Structure with Mandals
const locationData = {
  "India": {
    states: {
      "Andhra Pradesh": {
        districts: ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
        mandals: {
          "Anantapur": ["Agali", "Amarapuram", "Anantapur", "Atmakur", "Beluguppa", "Bommanahal", "Brahmasamudram", "Bukkapatnam", "Chippagiri", "Dharmavaram", "Garladinne", "Gooty", "Gudibanda", "Guntakal", "Hindupur", "Kadiri", "Kalyanadurg", "Kalyandurg", "Kambadur", "Kanaganapalle", "Kanekal", "Kotakonda", "Kudligi", "Lepakshi", "Madakasira", "Mudigubba", "Nallamada", "Narpala", "Obuladevaracheruvu", "Pamidi", "Parigi", "Penukonda", "Putlur", "Ramagiri", "Rayadurg", "Rolla", "Settur", "Singanamala", "Somandepalli", "Tadimarri", "Tadpatri", "Talupula", "Tanakal", "Uravakonda", "Vajrakarur", "Vidapanakal", "Yadiki", "Yellanur"],
          "Chittoor": ["B.Kothakota", "Bangarupalem", "Chandragiri", "Chinnagottigallu", "Chittoor", "Dabbakuppam", "Gangadhara Nellore", "Gudupalli", "Gurramkonda", "Irala", "Kadapa", "Kalikiri", "Kambhamvaripalle", "Kuppam", "Madanapalle", "Mulakalacheruvu", "Nagari", "Narayanavanam", "Nindra", "Pakala", "Palamaner", "Palasamudram", "Peddathippasamudram", "Penumuru", "Pichatur", "Pileru", "Punganur", "Puthalapattu", "Puthur", "Rami Reddy Palli", "Rompicherla", "Sadam", "Santhipuram", "Sodam", "Srikalahasti", "Srirangarajapuram", "Thamballapalle", "Thottambedu", "Tirupati (Rural)", "Tirupati (Urban)", "Vayalpad", "Vedurukuppam", "Venkatagirikota", "Vijayapuram", "Yadamari", "Yerpedu", "Yerravaripalem"],
          "East Godavari": ["Addateegala", "Ainavilli", "Alamuru", "Allavaram", "Ambajipeta", "Amalapuram", "Atreyapuram", "Biccavolu", "Devarapalli", "Gangavaram", "Gokavaram", "Gollaprolu", "I.Polavaram", "Jaggampeta", "Kadiam", "Kakinada (Rural)", "Kakinada (Urban)", "Kothapalli", "Kothapeta", "Malikipuram", "Mandapeta", "Mummidivaram", "P.Gannavaram", "Pamarru", "Pedapudi", "Peddapuram", "Pithapuram", "Prathipadu", "Rajam", "Rajanagaram", "Ramachandrapuram", "Rampachodavaram", "Rangampeta", "Razole", "Rowthulapudi", "Sakhinetipalli", "Samalkota", "Sankhavaram", "Thallarevu", "Thondangi", "Tuni", "Uppalaguptam", "Y.Ramavaram"],
          "Guntur": ["Amaravathi", "Amruthalur", "Atchampet", "Bapatla", "Bellamkonda", "Bhattiprolu", "Chebrolu", "Cherukupalle", "Chilakaluripet", "Dachepalli", "Duggirala", "Edlapadu", "Guntur (East)", "Guntur (West)", "Kakumanu", "Karempudi", "Krosuru", "Macherla", "Medikonduru", "Mopidevi", "Muzuluripadu", "Narasaraopet", "Nizampatam", "Palnad", "Pedakakani", "Pedanandipadu", "Phirangipuram", "Piduguralla", "Ponnur", "Prathipadu", "Rajupalem", "Rentachintala", "Repalle", "Rompicherla", "Sattenapalli", "Stenampet", "Tadikonda", "Tenali", "Thullur", "Tsundur", "Vatticherukuru", "Vinukonda"],
          "Krishna": ["Agiripalli", "Avanigadda", "Bantumilli", "Challapalli", "Chandarlapadu", "Chatrai", "Gannavaram", "Ghantasala", "Gudlavalleru", "Guduru", "Ibrahimpatnam", "Jaggayyapet", "Kanchikacherla", "Kalidindi", "Kankipadu", "Kesarapalli", "Koduru", "Kruthivennu", "Machilipatnam", "Mandavalli", "Movva", "Mudinepalli", "Musunuru", "Mylavaram", "Nagayalanka", "Nandigama", "Nuziveedu", "Pamarru", "Pamidimukkala", "Pedana", "Penamaluru", "Reddigudem", "Tiruvuru", "Thotlavalluru", "Unguturu", "Vatsavai", "Veerullapadu", "Vijayawada (Rural)", "Vissannapeta", "Vuyyuru", "G.Konduru"],
          "Kurnool": ["Adoni", "Allagadda", "Alur", "Aspari", "Atmakur", "Banaganapalle", "Bethamcherla", "Chagalamarri", "Dornipadu", "Gonegandla", "Gudur", "Halaharvi", "Holagunda", "Hospet", "Jupadu Bungalow", "Kallur", "Kodumur", "Kothapalle", "Kowthalam", "Krishnagiri", "Kurnool", "Mahanandi", "Maddikera (East)", "Nandikotkur", "Nandyal", "Orvakal", "Owk", "Pagidyala", "Pamulapadu", "Pathikonda", "Peapully", "Pedda Kadabur", "Peddavadugur", "Rudravaram", "Sanjamala", "Sirivella", "Srisailam", "Tuggali", "Uyyalawada", "Velgode", "Veldurthi", "Yemmiganur", "C.Belagal", "Dhone", "Gowripatnam", "Midthur"],
          "Nellore": ["Allur", "Ananthasagaram", "Atmakur", "Balayapalli", "Bogole", "Buchireddipalem", "Chillakur", "Chittamur", "Dagadarthi", "Dakkili", "Dorvaninanka", "Gudur", "Indukurpet", "Jaladanki", "Kaluvoya", "Kanigiri", "Kavalur", "Kodavalur", "Kondapuram", "Kovur", "Kurichedu", "Manubolu", "Marripadu", "Musunuru", "Naidupeta", "Nellore (Rural)", "Nellore City", "Ozili", "Pellakur", "Podalakur", "Rapur", "Sangam", "Seetharamapuram", "Simhadripuram", "Somasila", "Sriharikota", "Sullurpeta", "Thotapalligudur", "Udayagiri", "Varikuntapadu", "Venkatagiri", "Venkatachalam", "Vidavalur", "Vinjamur", "Voletivaripalem"],
          "Prakasam": ["Addanki", "Ardhaveedu", "Bestavaripeta", "Chandrasekharapuram", "Chimakurthy", "Chirala", "Chundur", "Conjeeveram", "Dakkili", "Darsi", "Donakonda", "Giddalur", "Hanumanthunipadu", "Inkollu", "J.Angadi", "Janakavarampanguluru", "Kanigiri", "Karamchedu", "Komarole", "Konakanamitla", "Kondapi", "Kothapatnam", "Kurichedu", "Lingasamudram", "Markapur", "Marturu", "Mundlamuru", "Naguluppala Padu", "Ongole", "Pamur", "Pedacherlopalle", "Peda Araveedu", "Podili", "Pullalacheruvu", "Racherla", "Santhamaguluru", "Santhanuthalapadu", "Singarayakonda", "Sonamallu", "Tangutur", "Thallur", "Tripuranthakam", "Ulavapadu", "Veligandla", "Voletivaripalem", "Yerragondapalem", "Zarugumilli"],
          "Srikakulam": ["Amadalavalasa", "Amudalavalasa", "Bhamini", "Burja", "Etcherla", "Ganguvarisigadam", "Gara", "Gogada", "Hiramandalam", "Ichapuram", "Jalumuru", "Kanchili", "Kaviti", "Kotabommali", "Kothuru", "Laveru", "Mandasa", "Meliaputti", "Narasannapeta", "Nandigam", "Palakonda", "Palasa", "Pathapatnam", "Polaki", "Ponasa", "Puranabazar", "Rajam", "Ranastalam", "Regidi Amadalavalasa", "Saravakota", "Sarubujjili", "Sompeta", "Srikakulam", "Tekkali", "Vajrapukothuru", "Vangara", "Veeraghattam", "Veerampalem"],
          "Visakhapatnam": ["Anakapalle", "Anandapuram", "Araku Valley", "Bheemunipatnam", "Chodavaram", "Chintapalle", "Devarapalle", "Dumbriguda", "G.Madugula", "Gantyada", "Golugonda", "Gudem Kotha Veedhi", "Hukumpeta", "K.Kotapadu", "Kasimkota", "Koyyuru", "Madugula", "Makavarapalem", "Munagapaka", "Narsipatnam", "Nellimaria", "Paderu", "Padmanabham", "Pedagantyada", "Pendurthi", "Ravikamatham", "Rolugunta", "S.Rayavaram", "Sabbavaram", "Srungavarapukota", "Visakhapatnam (Rural)", "Visakhapatnam (Urban)", "Yelamanchili"],
          "Vizianagaram": ["Badangi", "Bhogapuram", "Bobbili", "Bondapalle", "Cheepurupalle", "Dattirajeru", "Denkada", "Garugubilli", "Garividi", "Gurla", "Jami", "Kurupam", "Lakkavarapukota", "Makkuva", "Merakamudidam", "Nellimarla", "Pachipenta", "Parvathipuram", "Pusapatirega", "Salur", "Srungavarapukota", "Therlam", "Vepada", "Vizianagaram"],
          "West Godavari": ["Achanta", "Akividu", "Attili", "Bhimadole", "Bhimavaram", "Buttayagudem", "Chagallu", "Chintalapudi", "Dwarakatirumala", "Eluru", "Ganapavaram", "Gopalapuram", "Iragavaram", "Jangareddygudem", "Jeelugu Milli", "Kalla", "Kamavarapukota", "Koyyalagudem", "Kovvur", "Kruthivennu", "Lingapalem", "Mogalthur", "Nallajerla", "Narasapuram", "Nidadavole", "Nidamarru", "Palacole", "Palakoderu", "Pedapadu", "Pedavegi", "Peravali", "Pentapadu", "Poduru", "Polavaram", "Penumantra", "Rajam", "T.Narasapuram", "Tadepalligudem", "Tallapudi", "Tanuku", "Undrajavaram", "Ungutur", "Unguturu", "Veeravasaram", "Velairpadu", "Yelamanchili"],
          "YSR Kadapa": ["Badvel", "Brahmamgarimattam", "Chakrayapet", "Chennur", "Chitvel", "Duvvur", "Galiveedu", "Gopavaram", "Jammalamadugu", "Kadapa", "Kamalapuram", "Khajipet", "Kondapuram", "Lakkireddipalli", "Muddanur", "Mydukur", "Pendlimarri", "Porumamilla", "Proddatur", "Pullampeta", "Pulivendula", "Rajampet", "Rajupalem", "Ramapuram", "Rayachoti", "S.Mydukur", "Sambepalli", "Sidhout", "Simhadripuram", "T.Sundupalli", "Thondur", "Vallur", "Vemula", "Vempalle", "Yerraguntla", "Yoogandlapalli"]
        }
      },
      "Telangana": {
        districts: ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"],
        mandals: {
          "Adilabad": ["Adilabad", "Bazarhathnoor", "Bela", "Bhainsa", "Boath", "Chinoor", "Dandepalli", "Dilawarpur", "Gadiguda", "Gudihathnoor", "Hasnapur", "Ichoda", "Indervelly", "Jainoor", "Koutala", "Kubeer", "Lasoor", "Lokeshwaram", "Luxettipet", "Mamada", "Mudhole", "Narnoor", "Neradigonda", "Nirmal", "Sarangapur", "Tamsi", "Tandur", "Talamadugu", "Utnoor", "Vemanpalli", "Wankidi"],
          "Bhadradri Kothagudem": ["Aswapuram", "Bhadrachalam", "Burgampahad", "Chandrugonda", "Chunchupalli", "Dammapet", "Dummugudem", "Gundala", "Karakagudem", "Kothagudem", "Kukunoor", "Laxmidevipalli", "Manuguru", "Palvancha", "Pinapaka", "Tekulapalli", "Thirumalayapalem", "Velairpadu", "Yellandu"],
          "Hyderabad": ["Ameerpet", "Asifnagar", "Bahadurpura", "Bandlaguda", "Begumpet", "Charminar", "Circles", "Golkonda", "Hayathnagar", "Himayathnagar", "Jubilee Hills", "Karwan", "Khairatabad", "Kukatpally", "LB Nagar", "Langar Houz", "Malakpet", "Marredpally", "Musheerabad", "Nampally", "Old City", "Rajendranagar", "Sanathnagar", "Secunderabad", "Serilingampally", "Shaikpet", "Tirumalagiri", "Uppal", "Yousufguda"],
          "Jagtial": ["Budan", "Dharmapuri", "Gollapalli", "Ibrahimpur", "Jagtial", "Kathlapur", "Konaraopeta", "Mallapur", "Mallial", "Metpalli", "Pegadapalli", "Raikal", "Sarangapur", "Velgatoor"],
          "Jangaon": ["Bachannapet", "Chityala", "Devaruppula", "Ghanpur (Station)", "Jangaon", "Kodakandla", "Lingalaghanpur", "Nallabelli", "Palakurthi", "Ragunathpally", "Station Ghanpur", "Tharigoppula"],
          "Jayashankar Bhupalpally": ["Bhupalpally", "Chityal", "Eturnagaram", "Ghanpur", "Kataram", "Mahadevpur", "Manthani", "Mulug", "Regonda", "Tadvai", "Venkatapuram", "Wajedu"],
          "Jogulamba Gadwal": ["Alampur", "Aiza", "Dharur", "Gadwal", "Gattu", "Ieeja", "Itikyal", "Maldakal", "Manopad", "Rajoli", "Undavalli"],
          "Kamareddy": ["Banswada", "Bhiknur", "Bibinagar", "Bomraspet", "Domakonda", "Jukkal", "Kamareddy", "Machareddy", "Madnoor", "Nizamsagar", "Pitlam", "Sadashivnagar", "Yellareddy"],
          "Karimnagar": ["Boinpalli", "Choppadandi", "Eligaid", "Gangadhara", "Huzurabad", "Jammikunta", "Karimnagar", "Kathlapur", "Konaraopet", "Korutla", "Lower Manair Dam", "Mallial", "Manakondur", "Odela", "Pegadapalli", "Ramagundam", "Ramadugu", "Shankarampet (A)", "Shankarampet (R)", "Sirsilla", "Sultanabad", "Thimmapur", "Veemulapalli", "Velgatoor"],
          "Khammam": ["Aswaraopeta", "Bonakal", "Chintakani", "Enkoor", "Gangaram", "Julurpad", "Kallur", "Kamepalli", "Khammam (Rural)", "Khammam (Urban)", "Konijerla", "Kusumanchi", "Madhira", "Mudigonda", "Nelakondapalli", "Penuballi", "Raghunadhapalem", "Sathupalli", "Singareni", "Tallada", "Thirumalayapalem", "Tirumalayapalem", "Vemsoor", "Wyra", "Yerrupalem"],
          "Komaram Bheem Asifabad": ["Asifabad", "Bejjur", "Dahegaon", "Jainoor", "Kadem", "Kaghaznagar", "Khagaznagar", "Komaram Bheem", "Kotapalli", "Kumram Bheem", "Penchikalpet", "Rebbena", "Sirpur (T)", "Tiryani", "Wankidi"],
          "Mahabubabad": ["Bayyaram", "Dornakal", "Garla", "Gudur", "Kesamudram", "Kothuru", "Kuravi", "Mahabubabad", "Nellikuduru", "Thorrur"],
          "Mahabubnagar": ["Achampet", "Addakal", "Alampur", "Amangal", "Badepally", "Balanagar", "Balmoor", "Damaragidda", "Devarakadra", "Dharur", "Farooqnagar", "Gadwal", "Hanwada", "Jadcherla", "Jalalpur", "Kalwakurthy", "Kodangal", "Koilkonda", "Kosgi", "Kothur", "Mahabubnagar", "Midjil", "Narayanpet", "Nawabpet", "Pangal", "Peddemul", "Pebbair", "Pulkal", "Shadnagar", "Talakondapally", "Telkapalli", "Thimmajipet", "Utkoor", "Vangoor", "Wanaparthy", "Wyra"],
          "Mancherial": ["Bellampalli", "Bheemini", "Chennur", "Hajipur", "Jaipur", "Jannaram", "Kasipet", "Kotapalli", "Luxettipet", "Mancherial", "Mandamarri", "Naspur", "Nennal", "Tandur"],
          "Medak": ["Alekal", "Andole", "Chegunta", "Daul", "Doultabad", "Dubbak", "Gajwel", "Hatnoora", "Jagdevpur", "Jharasangam", "Kalher", "Kulcharam", "Masaipet", "Medak", "Narayankhed", "Narsapur", "Nyalkal", "Palakurthi", "Papannapet", "Ramayampet", "Regode", "Raikode", "Shankarampet", "Shivampet", "Tekmal", "Toopran", "Yelgandal"],
          "Medchal Malkajgiri": ["Bachupally", "Dundigal", "Gajularamaram", "Keesara", "Kompally", "Kundanpally", "Medchal", "Moinabad", "Quthbullapur", "Shamirpet", "Turkapally"],
          "Mulugu": ["Bhupalpally", "Eturnagaram", "Govindaraopet", "Mangapet", "Mulugu", "Tadvai", "Venkatapuram", "Wazeedu"],
          "Nagarkurnool": ["Achampet", "Bijnapally", "Bijinapally", "Kalwakurthy", "Kollapur", "Nagarkurnool", "Padra", "Peddakothapally", "Pebbair", "Telkapally", "Utkoor", "Wanaparthy"],
          "Nalgonda": ["Alair", "Anumula", "Atmakur (M)", "Atmakur (S)", "Bhongir", "Bibinagar", "Bommalaramaram", "Chandu Patla", "Chandupatla", "Chintapalli", "Chityala", "Choutuppal", "Devarakonda", "Dindi", "Gundala", "Gurrampode", "Haliya", "Huzurnagar", "Kangal", "Kondapak", "Kothagudem", "Marriguda", "Mattampally", "Munagala", "Nakrekal", "Nalgonda", "Nampally", "Narketpally", "Neredcherla", "Nuthankal", "Peddavoora", "Ramannapeta", "Shaligouraram", "Suryapet", "Thipparthi", "Thirumalgiri", "Thungathurthy", "Tripuraram", "Valigonda", "Vemulapally", "Yadagirigutta"],
          "Narayanpet": ["Damaragidda", "Dhanwada", "Kosgi", "Maddur", "Maganoor", "Narayanpet", "Utkoor"],
          "Nirmal": ["Bhainsa", "Dadpur", "Dilawarpur", "Kadem", "Khanapur", "Kuntala", "Laxmanchanda", "Mamada", "Mudhole", "Nirmal", "Sarangapur", "Vemanpalle"],
          "Nizamabad": ["Armoor", "Balmoor", "Banswada", "Dichpally", "Indalwai", "Jakranpally", "Kamareddy", "Kotagiri", "Machareddy", "Mortad", "Mugpal", "Navipet", "Nizamabad (Rural)", "Nizamabad (Urban)", "Pitlam", "Renjal", "Rudrur", "Sirikonda", "Varni", "Velpur", "Yedpally", "Yellareddy"],
          "Peddapalli": ["Anthargange", "Dharmaram", "Gollapalli", "Julapalli", "Kamanpur", "Kathlapur", "Manthani", "Odela", "Peddapalli", "Ramagundam", "Sultanabad"],
          "Rajanna Sircilla": ["Boinpalli", "Chandurthi", "Ellanthakunta", "Gambhiraopet", "Konaraopet", "Mustabad", "Rajanna", "Sirsilla", "Thangallapalli", "Vemulawada", "Yellareddypet"],
          "Rangareddy": ["Abdullahpurmet", "Amangal", "Balanagar", "Chevella", "Ghatkesar", "Hayathnagar", "Ibrahimpatnam", "Kandukur", "Keshampet", "Maheshwaram", "Malkajgiri", "Marpally", "Moinabad", "Muduchinthalapally", "Nandigama", "Pargi", "Peddemul", "Rajendranagar", "Shamshabad", "Tandur", "Turkayamjal", "Upparpally", "Vikarabad", "Yadagirigutta", "Yacharam"],
          "Sangareddy": ["Andole", "Chegunta", "Chodavaram", "Gajwel", "Hatnoora", "Jharasangam", "Jogipet", "Kandi", "Kohir", "Manoor", "Mogudampally", "Mulkanoor", "Munipabad", "Narayankhed", "Patancheru", "Pulkal", "Ramachandrapuram", "Raikode", "Regode", "Sadashivpet", "Sadasivpet", "Sangareddy", "Tupran", "Zaheerabad"],
          "Siddipet": ["Cheriyal", "Doulthabad", "Dubbak", "Gajwel", "Husnabad", "Kohir", "Kommatipalli", "Maddur", "Markook", "Mulkanoor", "Nangunur", "Siddipet", "Thoguta", "Wargal"],
          "Suryapet": ["Ananthagiri", "Atmakur", "Chivemla", "Garidepally", "Huzurnagar", "Kodad", "Mattampally", "Mellachervu", "Mothkur", "Munagala", "Nadigudem", "Neredcherla", "Nuthankal", "Palakeedu", "Penpahad", "Suryapet", "Thirumalagiri", "Thungathurthy", "Zintiriguda"],
          "Vikarabad": ["Bantwaram", "Basheerabad", "Bomraspet", "Chevella", "Dharur", "Doma", "Kodangal", "Kulkacharla", "Marpally", "Mominpet", "Nawabpet", "Peddemul", "Pudur", "Tandur", "Vikarabad", "Yelal"],
          "Wanaparthy": ["Atmakur", "Kothakota", "Pangal", "Pebbair", "Revally", "Srirangapur", "Wanaparthy", "Weepangandla"],
          "Warangal Rural": ["Atmakur", "Bachannapet", "Bhupalpally", "Chennaraopet", "Chityal", "Duggondi", "Eturnagaram", "Geesugonda", "Ghanpur (Station)", "Khanapur", "Mahabubabad", "Mogullapally", "Mulugu", "Nallabelli", "Narsampet", "Nekkonda", "Parvathagiri", "Raghunathpalli", "Rayaparthy", "Regonda", "Sangem", "Tadvai", "Thorrur", "Venkatapur", "Warangal", "Wardhannapet"],
          "Warangal Urban": ["Bheemadevarpally", "Dharmasagar", "Elkathurthy", "Geesugonda", "Hanmakonda", "Hasanparthy", "Inavolu", "Jangaon", "Kazipet", "Mulkanoor", "Narsampet", "Nekkonda", "Palakurthy", "Parkal", "Raiparthy", "Regonda", "Shayampet", "Warangal", "Zaffergadh"],
          "Yadadri Bhuvanagiri": ["Alair", "Anumula", "Atmakur", "Bhongir", "Bhuvanagiri", "Bibinagar", "Bommalaramaram", "Chityala", "Choutuppal", "Mothkur", "Nakrekal", "Pochampally", "Ramannapet", "Thurkapally", "Valigonda", "Yadagirigutta"]
        }
      },
      "Maharashtra": {
        districts: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Thane", "Kolhapur", "Sangli", "Navi Mumbai", "Ahmednagar", "Latur", "Dhule", "Amravati", "Nanded", "Jalgaon", "Akola", "Yavatmal", "Satara", "Raigad"],
        mandals: {
          "Mumbai": ["Colaba", "Fort", "Marine Lines", "Charni Road", "Grant Road", "Mumbai Central", "Mahalaxmi", "Lower Parel", "Prabhadevi", "Dadar", "Matunga", "Mahim", "Bandra", "Khar", "Santacruz", "Vile Parle", "Andheri", "Jogeshwari", "Goregaon", "Malad", "Kandivali", "Borivali", "Dahisar"],
          "Pune": ["Pune City", "Pimpri-Chinchwad", "Maval", "Mulshi", "Haveli", "Bhor", "Purandar", "Baramati", "Daund", "Indapur", "Khed", "Ambegaon", "Junnar", "Shirur"],
          "Nagpur": ["Nagpur Rural", "Kamptee", "Savner", "Parseoni", "Narkhed", "Ramtek", "Umred", "Kuhi", "Mouda", "Bhiwapur"],
          "Nashik": ["Nashik City", "Malegaon", "Manmad", "Nandgaon", "Chandwad", "Dindori", "Peint", "Trimbakeshwar", "Baglan", "Kalwan", "Deola", "Igatpuri", "Surgana", "Niphad", "Sinnar"],
          "Aurangabad": ["Aurangabad", "Paithan", "Gangapur", "Vaijapur", "Sillegaon", "Kannad", "Soegaon", "Phulambri", "Khultabad"]
        }
      },
      "Karnataka": {
        districts: ["Bangalore Urban", "Bangalore Rural", "Mysore", "Hubli-Dharwad", "Mangalore", "Belgaum", "Gulbarga", "Davangere", "Bellary", "Shimoga", "Tumkur", "Mandya", "Hassan", "Chitradurga", "Kolar", "Chikmagalur", "Raichur", "Bidar", "Bagalkot", "Haveri"],
        mandals: {
          "Bangalore Urban": ["Bangalore North", "Bangalore South", "Bangalore East", "Anekal", "Nelamangala", "Devanahalli", "Doddaballapur", "Hosakote"],
          "Mysore": ["Mysore", "Nanjangud", "T.Narasipur", "Hunsur", "Piriyapatna", "K.R.Nagar", "Yelandur"],
          "Hubli-Dharwad": ["Hubli", "Dharwad", "Kalghatgi", "Kundgol", "Navalgund"],
          "Mangalore": ["Mangalore", "Puttur", "Sullia", "Bantwal", "Belthangady"],
          "Belgaum": ["Belgaum", "Athani", "Gokak", "Hukkeri", "Khanapur", "Ramdurg", "Soundatti", "Parasgad", "Bailhongal", "Saundatti"]
        }
      },
      "Tamil Nadu": {
        districts: ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Tirunelveli", "Vellore", "Erode", "Thanjavur", "Thoothukudi", "Tiruppur", "Dindigul", "Cuddalore", "Kanchipuram", "Virudhunagar", "Sivaganga", "Karur", "Namakkal", "Dharmapuri", "Krishnagiri"],
        mandals: {
          "Chennai": ["Chennai North", "Chennai Central", "Chennai South", "Ambattur", "Madhavaram", "Manali", "Poonamallee", "Alandur", "Pallavaram", "Tambaram", "Chengalpattu", "Madurantakam"],
          "Coimbatore": ["Coimbatore North", "Coimbatore South", "Mettupalayam", "Pollachi", "Valparai", "Udumalaipettai", "Anaimalai"],
          "Madurai": ["Madurai North", "Madurai South", "Melur", "Vadipatti", "Thirumangalam", "Usilampatti", "Kalligudi", "Sedapatti"],
          "Salem": ["Salem", "Mettur", "Omalur", "Edappadi", "Sankari", "Vazhapadi", "Yercaud", "Ayothiyapattinam"],
          "Tiruchirappalli": ["Tiruchirappalli", "Srirangam", "Lalgudi", "Thuraiyur", "Uppiliapuram", "Manachanallur", "Manapparai", "Musiri"]
        }
      },
      "Kerala": {
        districts: ["Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"],
        mandals: {
          "Thiruvananthapuram": ["Thiruvananthapuram", "Chirayinkeezhu", "Nedumangad", "Varkala", "Attingal", "Kattakada", "Neyyattinkara"],
          "Ernakulam": ["Kochi", "Aluva", "Kanayannur", "Paravur", "Vypin", "Muvattupuzha", "Kothamangalam", "Kunnathunad"],
          "Thrissur": ["Thrissur", "Chalakudy", "Kodungallur", "Irinjalakuda", "Ollur", "Anthikkad", "Chavakkad"],
          "Kozhikode": ["Kozhikode", "Vadakara", "Koyilandy", "Ramanattukara", "Chelannur", "Kunnamangalam", "Koduvally"],
          "Palakkad": ["Palakkad", "Chittur", "Ottappalam", "Shoranur", "Mannarkkad", "Alathur", "Tarur"]
        }
      },
      "Gujarat": {
        districts: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Anand", "Nadiad", "Morbi", "Junagadh", "Mehsana", "Patan", "Kutch", "Sabarkantha", "Banaskantha", "Kheda", "Panchmahals", "Dahod", "Valsad"],
        mandals: {
          "Ahmedabad": ["Ahmedabad City", "Ahmedabad Rural", "Daskroi", "Detroj-Rampura", "Dhandhuka", "Dholka", "Bavla", "Ranpur", "Viramgam", "Mandal", "Dholera"],
          "Surat": ["Surat City", "Chorasi", "Palsana", "Bardoli", "Mahuva", "Kamrej", "Olpad", "Mangrol", "Umbergaon"],
          "Vadodara": ["Vadodara", "Padra", "Karjan", "Sinor", "Dabhoi", "Savli", "Vaghodia", "Sankheda"],
          "Rajkot": ["Rajkot", "Gondal", "Jetpur", "Dhoraji", "Upleta", "Kotda Sangani", "Jasdan", "Vinchhiya"],
          "Bhavnagar": ["Bhavnagar", "Sihor", "Gariadhar", "Palitana", "Umrala", "Vallabhipur", "Ghogha", "Mahuva"]
        }
      },
      "West Bengal": {
        districts: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Malda", "Bardhaman", "Kharagpur", "Haldia", "North 24 Parganas", "South 24 Parganas", "Nadia", "Murshidabad", "Birbhum", "Bankura", "Purulia", "Paschim Medinipur", "Purba Medinipur", "Jalpaiguri", "Darjeeling"],
        mandals: {
          "Kolkata": ["Kolkata North", "Kolkata South", "Kolkata Central", "Kolkata East", "Kolkata West"],
          "Howrah": ["Howrah", "Bally", "Serampore", "Chandannagar", "Bhadreswar", "Champdani", "Rishra"],
          "North 24 Parganas": ["Barasat", "Basirhat", "Bongaon", "Deganga", "Habra", "Haroa", "Hingalganj", "Minakhan", "Rajarhat", "Sandeshkhali", "Swarupnagar", "Taki"],
          "South 24 Parganas": ["Alipore", "Baruipur", "Budge Budge", "Canning", "Diamond Harbour", "Falta", "Kakdwip", "Kultali", "Magrahat", "Mandirtala", "Mathurapur", "Sonarpur"],
          "Siliguri": ["Siliguri", "Kurseong", "Kalimpong", "Mirik"]
        }
      },
      "Rajasthan": {
        districts: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bharatpur", "Alwar", "Sikar", "Bhilwara", "Pali", "Barmer", "Jhunjhunu", "Churu", "Ganganagar", "Hanumangarh", "Sawai Madhopur", "Dausa", "Tonk", "Bundi"],
        mandals: {
          "Jaipur": ["Jaipur", "Amber", "Bassi", "Chomu", "Dudu", "Jamwa Ramgarh", "Jhotwara", "Kotputli", "Mauzamabad", "Mojmabad", "Phagi", "Sanganer", "Shahpura", "Viratnagar"],
          "Jodhpur": ["Jodhpur", "Balesar", "Bap", "Baori", "Bhopalgarh", "Bilara", "Dechu", "Luni", "Mandor", "Osian", "Phalodi", "Pipar", "Shergarh"],
          "Udaipur": ["Udaipur", "Bhinder", "Girwa", "Gogunda", "Jhadol", "Kherwara", "Kotra", "Lasadiya", "Mavli", "Rishabhdeo", "Salumbar", "Sarada", "Vallabhnagar"],
          "Alwar": ["Alwar", "Bansur", "Behror", "Kathumar", "Kishangarh Bas", "Lachhmangarh", "Mundawar", "Neemrana", "Rajgarh", "Ramgarh", "Thanagazi", "Tijara"],
          "Bikaner": ["Bikaner", "Chhatargarh", "Dungargarh", "Khajuwala", "Kolayat", "Lunkaransar", "Nokha", "Poogal", "Shridungargarh"]
        }
      },
      "Punjab": {
        districts: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Firozpur", "Hoshiarpur", "Gurdaspur", "Kapurthala", "Mansa", "Muktsar", "Pathankot", "Rupnagar", "Sangrur", "Shaheed Bhagat Singh Nagar", "Tarn Taran", "Fatehgarh Sahib", "Faridkot", "Barnala"],
        mandals: {
          "Ludhiana": ["Ludhiana East", "Ludhiana West", "Dehlon", "Doraha", "Khanna", "Machhiwara", "Payal", "Raikot", "Samrala"],
          "Amritsar": ["Amritsar I", "Amritsar II", "Ajnala", "Majitha", "Rayya", "Tarn Taran"],
          "Jalandhar": ["Jalandhar I", "Jalandhar II", "Adampur", "Bhogpur", "Kartarpur", "Mehatpur", "Nakodar", "Phillaur", "Shahkot"],
          "Patiala": ["Patiala", "Ghanaur", "Nabha", "Patran", "Rajpura", "Sanaur", "Shutrana"],
          "Bathinda": ["Bathinda", "Maur", "Nathana", "Phul", "Rampura Phul", "Sangat", "Talwandi Sabo"]
        }
      },
      "Haryana": {
        districts: ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula", "Sirsa", "Jind", "Fatehabad", "Kaithal", "Kurukshetra", "Bhiwani", "Mahendragarh", "Rewari", "Jhajjar", "Palwal", "Nuh", "Charkhi Dadri"],
        mandals: {
          "Gurgaon": ["Gurgaon", "Sohna", "Pataudi", "Farukh Nagar", "Manesar"],
          "Faridabad": ["Faridabad", "Ballabgarh", "Hathin", "Palwal"],
          "Panipat": ["Panipat City", "Panipat Rural", "Bapoli", "Israna", "Madlauda", "Samalkha"],
          "Ambala": ["Ambala City", "Ambala Cantonment", "Barara", "Naraingarh", "Shahzadpur"],
          "Karnal": ["Karnal", "Assandh", "Gharaunda", "Indri", "Nilokheri", "Taraori"]
        }
      },
      "Uttar Pradesh": {
        districts: ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Allahabad", "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Gorakhpur", "Noida", "Firozabad", "Jhansi", "Muzaffarnagar", "Mathura", "Budaun", "Rampur", "Shahjahanpur", "Farrukhabad", "Mau", "Hapur", "Etawah", "Mirzapur"],
        mandals: {
          "Lucknow": ["Lucknow", "Bakshi Ka Talab", "Gosainganj", "Malihabad", "Mohanlalganj", "Sarojini Nagar"],
          "Kanpur": ["Kanpur", "Akbarpur", "Bhitargaon", "Bilhaur", "Chaubepur", "Derapur", "Ghatampur", "Kalyanpur", "Sarsaul", "Shivrajpur"],
          "Agra": ["Agra", "Barauli Ahir", "Bichpuri", "Dayal Bagh", "Etmadpur", "Fatehabad", "Fatehpur Sikri", "Jaitpur", "Khanua", "Kheragarh", "Pinahat", "Shamsabad", "Sojhana"],
          "Varanasi": ["Varanasi", "Cholapur", "Harahua", "Pindra", "Sevapuri"],
          "Meerut": ["Meerut", "Daurala", "Hastinapur", "Jani Khurd", "Kharkhauda", "Parikshitgarh", "Rajpura", "Sardhana", "Sarurpur Kalan"]
        }
      },
      "Madhya Pradesh": {
        districts: ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa", "Khandwa", "Burhanpur", "Khargone", "Dhar", "Jhabua", "Alirajpur", "Barwani", "Rajgarh", "Shajapur", "Agar Malwa", "Neemuch", "Mandsaur", "Chittorgarh", "Bhind", "Morena", "Sheopur", "Datia", "Shivpuri", "Tikamgarh", "Chhatarpur"],
        mandals: {
          "Bhopal": ["Bhopal", "Berasia", "Phanda"],
          "Indore": ["Indore", "Depalpur", "Mhow", "Sanwer"],
          "Gwalior": ["Gwalior", "Bhitarwar", "Dabra", "Morar"],
          "Jabalpur": ["Jabalpur", "Kundam", "Majholi", "Panagar", "Patan", "Shahpura", "Sihora"],
          "Ujjain": ["Ujjain", "Badnagar", "Ghattia", "Khachrod", "Mahidpur", "Tarana"]
        }
      },
      "Bihar": {
        districts: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar", "Munger", "Chhapra", "Sasaram", "Hajipur", "Dehri", "Siwan", "Motihari", "Bagaha", "Kishanganj", "Saharsa", "Madhubani", "Sitamarhi", "Sheohar", "Supaul", "Madhepura", "Khagaria", "Jamui", "Nawada", "Aurangabad", "Jehanabad"],
        mandals: {
          "Patna": ["Patna Sadar", "Danapur", "Barh", "Bikram", "Dulhinbazar", "Fatuha", "Khusrupur", "Maner", "Masaurhi", "Mokama", "Naubatpur", "Paliganj", "Phulwarisharif", "Punpun", "Sampatchak"],
          "Gaya": ["Gaya", "Banke Bazar", "Barachatti", "Belaganj", "Bodhgaya", "Dobhi", "Dumaria", "Fatehpur", "Gurua", "Imamganj", "Konch", "Manpur", "Mohanpur", "Nehzarabad", "Paraiya", "Sherghati", "Tan Kuppa", "Tikari", "Wazirganj"],
          "Muzaffarpur": ["Muzaffarpur", "Aurai", "Bandra", "Bochahan", "Gaighat", "Kanti", "Kurhani", "Marwan", "Minapur", "Mushahari", "Paroo", "Sahebganj", "Sakra", "Saraiya", "Sitamarhi"],
          "Bhagalpur": ["Bhagalpur", "Bihpur", "Gopalpur", "Ismailpur", "Jagdishpur", "Kahalgaon", "Kharik", "Nathnagar", "Narayanpur", "Pirpainti", "Rangra Chowk", "Sabour", "Shahkund", "Sultanganj"],
          "Darbhanga": ["Darbhanga", "Alinagar", "Baheri", "Bahadurpur", "Benipur", "Birol", "Gaura Bauram", "Hanuman Nagar", "Hayaghat", "Jale", "Keoti", "Kiratpur", "Kusheshwar Asthan", "Manigachhi", "Singhwara", "Tardih"]
        }
      },
      "Odisha": {
        districts: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda", "Angul", "Dhenkanal", "Jajpur", "Kendrapara", "Khordha", "Nayagarh", "Ganjam", "Kandhamal", "Rayagada", "Koraput", "Kalahandi", "Nuapada", "Balangir", "Subarnapur", "Bargarh", "Deogarh", "Keonjhar", "Sundargarh", "Nabarangpur", "Malkangiri"],
        mandals: {
          "Bhubaneswar": ["Bhubaneswar", "Balianta", "Balipatna", "Jatni"],
          "Cuttack": ["Cuttack", "Athagarh", "Badamba", "Banki", "Baranga", "Choudwar", "Kantapada", "Kissannagar", "Mahanga", "Narasinghpur", "Niali", "Salepur", "Tangi", "Tigiria"],
          "Rourkela": ["Rourkela", "Bisra", "Brahmani Tarang", "Kuanrmunda", "Lahunipara", "Lathikata", "Nuagaon", "Rajgangpur", "Raghunathpali", "Subdega", "Tangarpali"],
          "Puri": ["Puri", "Astaranga", "Brahmagiri", "Delang", "Gop", "Kakatpur", "Kanas", "Krushnaprasad", "Nimapara", "Pipili", "Sadar", "Satyabadi"],
          "Sambalpur": ["Sambalpur", "Bamra", "Dhankauda", "Jujumura", "Kuchinda", "Maneswar", "Naktideul", "Rairakhol", "Rengali"]
        }
      },
      "Jharkhand": {
        districts: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar", "Dumka", "Pakur", "Sahebganj", "Godda", "Koderma", "Chatra", "Palamu", "Latehar", "Garhwa", "East Singhbhum", "West Singhbhum", "Seraikela Kharsawan", "Khunti", "Gumla", "Simdega", "Lohardaga"],
        mandals: {
          "Ranchi": ["Ranchi", "Angara", "Bero", "Burmu", "Chanho", "Kanke", "Lapung", "Mandar", "Namkum", "Ormanjhi", "Ratu", "Silli", "Sonahatu", "Tamar"],
          "Jamshedpur": ["Jamshedpur", "Baharagora", "Chakulia", "Ghatshila", "Gurabanda", "Musabani", "Patamda", "Potka"],
          "Dhanbad": ["Dhanbad", "Baghmara", "Baliapur", "Govindpur", "Jharia", "Nirsa", "Tundi"],
          "Bokaro": ["Bermo", "Bokaro", "Chandankiyari", "Chas", "Gomia", "Jaridih", "Kasmar", "Petarwar"],
          "Deoghar": ["Deoghar", "Jasidih", "Karon", "Madhupur", "Mohanpur", "Palojori", "Sarwan", "Sonaraikela"]
        }
      },
      "Assam": {
        districts: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Dhubri", "North Lakhimpur", "Karimganj", "Hailakandi", "Cachar", "Golaghat", "Sivasagar", "Morigaon", "Darrang", "Kamrup", "Nalbari", "Barpeta", "Kokrajhar", "Chirang", "Baksa", "Udalguri"],
        mandals: {
          "Guwahati": ["Guwahati", "Chaygaon", "Hajo", "Rangia", "Kamalpur"],
          "Silchar": ["Silchar", "Cachar", "Lakhipur", "Sonai", "Udharband"],
          "Dibrugarh": ["Dibrugarh", "Barbaruah", "Chabua", "Lahowal", "Moran", "Naharkatiya", "Tengakhat"],
          "Jorhat": ["Jorhat", "Majuli", "Teok", "Titabar"],
          "Nagaon": ["Nagaon", "Hojai", "Kaliabor", "Kampur", "Raha", "Samaguri"]
        }
      },
      "Chhattisgarh": {
        districts: ["Raipur", "Bhilai", "Korba", "Bilaspur", "Durg", "Rajnandgaon", "Jagdalpur", "Raigarh", "Ambikapur", "Mahasamund", "Dhamtari", "Kanker", "Bastar", "Kondagaon", "Narayanpur", "Sukma", "Bijapur", "Dantewada", "Kabirdham", "Balod", "Baloda Bazar", "Bemetara", "Gariaband", "Janjgir-Champa", "Koriya", "Surajpur", "Balrampur", "Surguja"],
        mandals: {
          "Raipur": ["Raipur", "Abhanpur", "Arang", "Dharsiwa", "Gariyaband", "Mahasamund", "Tilda"],
          "Bhilai": ["Bhilai", "Durg", "Bemetara", "Berla", "Dhamdha", "Patan", "Saja"],
          "Bilaspur": ["Bilaspur", "Arpa", "Belha", "Kota", "Lormi", "Masturi", "Mungeli", "Takhatpur"],
          "Korba": ["Korba", "Champa", "Janjgir", "Kartala", "Katghora", "Koriya", "Pali", "Podi-Uparwara"],
          "Jagdalpur": ["Jagdalpur", "Antagarh", "Bastar", "Bakawand", "Darbha", "Lohandiguda", "Makdi", "Tokapal"]
        }
      },
      "Delhi": {
        districts: ["New Delhi", "Central Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "North East Delhi", "North West Delhi", "South East Delhi", "South West Delhi", "Shahdara"],
        mandals: {
          "New Delhi": ["Connaught Place", "Parliament Street", "Chanakyapuri", "India Gate"],
          "Central Delhi": ["Karol Bagh", "Paharganj", "Darya Ganj", "Chandni Chowk"],
          "North Delhi": ["Civil Lines", "Kamla Nagar", "Timarpur", "Kashmere Gate"],
          "South Delhi": ["Lajpat Nagar", "Greater Kailash", "Hauz Khas", "Safdarjung", "Vasant Vihar"],
          "East Delhi": ["Preet Vihar", "Laxmi Nagar", "Gandhi Nagar", "Shahdara"]
        }
      },
      "Goa": {
        districts: ["North Goa", "South Goa"],
        mandals: {
          "North Goa": ["Panaji", "Mapusa", "Bicholim", "Pernem", "Bardez", "Tiswadi"],
          "South Goa": ["Margao", "Vasco da Gama", "Ponda", "Quepem", "Canacona", "Sanguem"]
        }
      },
      "Himachal Pradesh": {
        districts: ["Shimla", "Kangra", "Mandi", "Solan", "Sirmaur", "Una", "Chamba", "Hamirpur", "Kullu", "Bilaspur", "Kinnaur", "Lahaul and Spiti"],
        mandals: {
          "Shimla": ["Shimla Rural", "Shimla Urban", "Chopal", "Jubbal", "Kotkhai", "Narkanda", "Rohru", "Theog"],
          "Kangra": ["Dharamshala", "Kangra", "Palampur", "Baijnath", "Baroh", "Dehra", "Fatehpur", "Indora", "Jaswan", "Jawali", "Multhan", "Nurpur", "Rait", "Shahpur", "Sulah"],
          "Mandi": ["Mandi", "Balh", "Bali Chowki", "Chachyot", "Dharampur", "Gopalpur", "Jogindernagar", "Karsog", "Padhar", "Sarkaghat", "Sundernagar", "Thunag"],
          "Solan": ["Solan", "Arki", "Baddi", "Kandaghat", "Kasauli", "Nalagarh", "Ramshehar"]
        }
      },
      "Uttarakhand": {
        districts: ["Dehradun", "Haridwar", "Uttarkashi", "Chamoli", "Rudraprayag", "Tehri Garhwal", "Garhwal", "Pithoragarh", "Bageshwar", "Almora", "Champawat", "Nainital", "Udham Singh Nagar"],
        mandals: {
          "Dehradun": ["Dehradun", "Chakrata", "Kalsi", "Mussoorie", "Rishikesh", "Doiwala", "Sahaspur"],
          "Haridwar": ["Haridwar", "Bhagwanpur", "Laksar", "Roorkee", "Khanpur"],
          "Nainital": ["Nainital", "Haldwani", "Kashipur", "Rudrapur", "Kaladhungi", "Kichha", "Sitarganj"],
          "Almora": ["Almora", "Bageshwar", "Bhikiyasen", "Chaukhutiya", "Dwarahat", "Hawalbagh", "Ranikhet", "Salt", "Syalde"],
          "Pithoragarh": ["Pithoragarh", "Berinag", "Darchula", "Dharchula", "Gangolihat", "Kanalichhina", "Munsiyari"]
        }
      },
      "Chandigarh": {
        districts: ["Chandigarh"],
        mandals: {
          "Chandigarh": ["Sector 1-47", "Mani Majra", "Maloya", "Raipur Khurd", "Raipur Kalan"]
        }
      },
      "Puducherry": {
        districts: ["Puducherry", "Karaikal", "Mahe", "Yanam"],
        mandals: {
          "Puducherry": ["Puducherry", "Oulgaret", "Villianur", "Ariyankuppam", "Mannadipet"],
          "Karaikal": ["Karaikal", "Thirunallar"],
          "Mahe": ["Mahe"],
          "Yanam": ["Yanam"]
        }
      }
    }
  },
  "United States": {
    states: {
      "California": ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "San Jose", "Oakland", "Fresno", "Long Beach", "Santa Ana", "Anaheim"],
      "New York": ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon", "Schenectady", "Utica"],
      "Texas": ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Lubbock"],
      "Florida": ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Tallahassee", "Fort Lauderdale", "Port St. Lucie", "Cape Coral"],
      "Illinois": ["Chicago", "Aurora", "Peoria", "Rockford", "Joliet", "Naperville", "Springfield", "Elgin", "Waukegan", "Cicero"]
    }
  },
  "United Kingdom": {
    states: {
      "England": ["London", "Birmingham", "Manchester", "Liverpool", "Leeds", "Sheffield", "Bristol", "Newcastle", "Nottingham", "Leicester"],
      "Scotland": ["Glasgow", "Edinburgh", "Aberdeen", "Dundee", "Paisley", "East Kilbride", "Livingston", "Hamilton", "Cumbernauld", "Kirkcaldy"],
      "Wales": ["Cardiff", "Swansea", "Newport", "Wrexham", "Barry", "Caerphilly", "Bridgend", "Neath", "Port Talbot", "Cwmbran"],
      "Northern Ireland": ["Belfast", "Derry", "Lisburn", "Newtownabbey", "Bangor", "Craigavon", "Castlereagh", "Ballymena", "Newtownards", "Carrickfergus"]
    }
  }
};

const userTypeConfig = {
  farmer: {
    title: "Farmer Registration",
    description: "Join AgriHub to modernize your farming with AI assistance",
    variant: "farmer" as const,
    className: "bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto my-8",
    fields: [
      ...commonFields.map(field =>
        field.name === 'email'
          ? { ...(field as FormField), required: false }
          : (field as FormField)
      ),
      {
        name: "farm_size",
        label: "Farm Size (acres)",
        type: "number",
        required: true
      } as FormField,
      {
        name: "primary_crop_types",
        label: "Primary Crop Types",
        type: "text",
        required: true,
        placeholder: "Enter crop types separated by commas"
      } as FormField,
      {
        name: "years_of_experience",
        label: "Years of Farming Experience",
        type: "number",
        required: true
      } as FormField,
      {
        name: "farmer_location",
        label: "Farm Location",
        type: "text",
        required: true,
        placeholder: "Enter your farm's location"
      } as FormField,
      { name: "aadhar_number", label: "Aadhar Number", type: "text" as const, required: false, placeholder: "12-digit Aadhar number (optional)" } as FormField,
      // File uploads
      {
        name: "photo_file",
        label: "Upload Your Photo (10MB max - png, jpeg)",
        type: "file",
        required: false
      } as FormField,
      {
        name: "aadhar_front_file",
        label: "Upload Aadhar Front Image (10MB max - png, jpeg)",
        type: "file",
        required: false
      } as FormField
    ]
  },
  landowner: {
    title: "Landowner Registration",
    description: "Manage your agricultural land remotely with AgriHub",
    variant: "landowner" as const,
    fields: [
      ...commonFields,
      { name: "total_land_area", label: "Total Land Area (acres)", type: "number" as const, required: true, min: 0.01, step: 0.01 },
      {
        name: "current_land_use", label: "Current Land Use", type: "select" as const,
        options: [
          { value: "cultivated", label: "Cultivated" },
          { value: "fallow", label: "Fallow" },
          { value: "leased", label: "Leased" },
          { value: "mixed", label: "Mixed Use" }
        ],
        required: true
      },
      {
        name: "managing_remotely", label: "Managing Remotely", type: "select" as const,
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        required: true
      },
      { name: "aadhar_number", label: "Aadhar Number", type: "text" as const, required: false, placeholder: "12-digit Aadhar number (optional)" },
      // File uploads
      {
        name: "photo_file",
        label: "Upload Your Photo(10mB max)",
        type: "file",
        required: false
      } as FormField,
      {
        name: "aadhar_front_file",
        label: "Upload Aadhar Front Image (10MB max - png, jpeg)",
        type: "file",
        required: false
      } as FormField
    ]
  },
  buyer: {
    title: "Buyer Registration",
    description: "Connect directly with farmers and access quality produce",
    variant: "buyer" as const,
    fields: [
      ...commonFields,
      {
        name: "organization_name",
        label: "Organization Name",
        type: "text" as const,
        required: true,
        placeholder: "Your company/organization name"
      },
      {
        name: "buyer_type",
        label: "Buyer Type",
        type: "select" as const,
        options: [
          { value: "retailer", label: "Retailer" },
          { value: "wholesaler", label: "Wholesaler" },
          { value: "processor", label: "Processor" },
          { value: "exporter", label: "Exporter" },
          { value: "distributor", label: "Distributor" },
          { value: "trader", label: "Trader" }
        ],
        required: true
      },
      {
        name: "interested_crop_types",
        label: "Interested Crop Types",
        type: "text" as const,
        required: true,
        placeholder: "e.g., rice, wheat, vegetables, fruits"
      },
      {
        name: "preferred_products",
        label: "Preferred Products",
        type: "text" as const,
        required: true,
        placeholder: "e.g., organic, non-gmo, specific varieties"
      },
      {
        name: "monthly_purchase_volume",
        label: "Monthly Purchase Volume (tons)",
        type: "number" as const,
        min: 0.1,
        step: 0.1,
        required: true
      },
      {
        name: "business_license_number",
        label: "Business License Number",
        type: "text" as const,
        required: true,
        placeholder: "Your business license number"
      },
      {
        name: "gst_number",
        label: "GST Number",
        type: "text" as const,
        required: true,
        placeholder: "22AAAAA0000A1Z5",
        pattern: "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
        title: "Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)"
      },
      { name: "aadhar_number", label: "Aadhar Number", type: "text" as const, required: false, placeholder: "12-digit Aadhar number (optional)" } as FormField,
      // File uploads
      {
        name: "photo_file",
        label: "Upload Your Photo (10MB max - png, jpeg)",
        type: "file",
        required: false
      } as FormField,
      {
        name: "aadhar_front_file",
        label: "Upload Aadhar Front Image (10MB max - png, jpeg)",
        type: "file",
        required: false
      } as FormField
    ]
  },
  agri_copilot: {
    title: "Agri Copilot Registration",
    description: "Register as an Agri Copilot to assist farmers with AI-powered analytics and monitoring tools.",
    variant: "agri_copilot" as const,
    fields: [
      { name: "full_name", label: "Full Name", type: "text", required: true },
      {
        name: "email",
        label: "Email Address",
        type: "email",
        required: true,
        placeholder: "you@example.com"
      },
      {
        name: "phone",
        label: "Phone Number (10 digits)",
        type: "tel",
        required: true,
        placeholder: "+91 XXXXX XXXXX",
        pattern: "\\+91\\s[6-9]\\d{4}\\s\\d{5}",
        title: "Please enter a valid Indian mobile number starting with 6-9"
      },
      {
        name: "aadhar_number",
        label: "Aadhar Number (12 digits)",
        type: "text",
        required: true,
        placeholder: "1234 5678 9012",
        pattern: "^[0-9]{12}$",
        title: "Aadhar number must be a 12-digit numeric value"
      },
      {
        name: "password",
        label: "Password (8+ characters)",
        type: "password",
        required: true,
        placeholder: "Must include uppercase, lowercase, and number (e.g. MyPass123)",
        title: "Password must contain at least one uppercase letter, one lowercase letter, and one number. Minimum 8 characters."
      },
      // Address fields - required by backend
      {
        name: "address_line1",
        label: "Address Line 1",
        type: "text",
        required: true,
        placeholder: "Street address, building name, etc."
      },
      {
        name: "address_line2",
        label: "Address Line 2",
        type: "text",
        required: false,
        placeholder: "Apartment, suite, unit, etc. (optional)"
      },
      {
        name: "country",
        label: "Country",
        type: "select" as const,
        required: true,
        options: [
          { value: "", label: "🌍 Select Country" },
          { value: "India", label: "🇮🇳 India" },
          { value: "United States", label: "🇺🇸 United States" },
          { value: "United Kingdom", label: "🇬🇧 United Kingdom" },
          { value: "Canada", label: "🇨🇦 Canada" },
          { value: "Australia", label: "🇦🇺 Australia" },
          { value: "Germany", label: "🇩🇪 Germany" },
          { value: "France", label: "🇫🇷 France" },
          { value: "Japan", label: "🇯🇵 Japan" },
          { value: "China", label: "🇨🇳 China" },
          { value: "Brazil", label: "🇧🇷 Brazil" }
        ]
      },
      {
        name: "state",
        label: "State / Province",
        type: "select" as const,
        required: true,
        options: [] // Will be populated dynamically based on country selection
      },
      {
        name: "city",
        label: "City / District",
        type: "select" as const,
        required: true,
        options: [] // Will be populated dynamically based on state selection
      },
      {
        name: "mandal",
        label: "Mandal",
        type: "select" as const,
        required: false,
        options: [] // Will be populated dynamically based on district selection
      },
      {
        name: "pincode",
        label: "Pincode",
        type: "text",
        required: true,
        placeholder: "6-digit pincode"
      },
      // File uploads
      {
        name: "photo_file",
        label: "Upload Your Photo (10MB max - png, jpeg)",
        type: "file",
        required: true
      },
      {
        name: "aadhar_front_file",
        label: "Upload Aadhar Front Image (10MB max - png, jpeg)",
        type: "file",
        required: true
      }
    ]
  },


  vendor: {
    title: "Vendor Registration",
    description: "Join AgriHub to supply products and services to the agricultural community",
    variant: "vendor" as const,
    fields: [
      ...commonFields,
      {
        name: "business_name",
        label: "Business Name",
        type: "text" as const,
        required: true
      },
      {
        name: "business_type",
        label: "Business Type",
        type: "select" as const,
        // REPLACE the old options with these correct ones
        options: [
          { value: "seed_supply", label: "Seed Supply" },
          { value: "drone_spraying", label: "Drone Spraying" },
          { value: "soil_testing", label: "Soil Testing" },
          { value: "tractor_rental", label: "Tractor Rental" },
          { value: "logistics", label: "Logistics" },
          { value: "storage", label: "Storage" },
          { value: "input_supply", label: "Input Supply" },
          { value: "other", label: "Other" }
        ],
        required: true
      },
      {
        name: "legal_name",
        label: "Legal Name (as on PAN/GST)",
        type: "text" as const,
        required: true
      },
      {
        name: "product_services",
        label: "Products/Services Description",
        type: "textarea" as const,
        required: true,
        placeholder: "Describe your products or services in detail"
      },
      {
        name: "pan_number",
        label: "PAN Number",
        type: "text" as const,
        required: true,
        placeholder: "AAAAA0000A"
      },
      {
        name: "gst_number",
        label: "GST Number",
        type: "text" as const,
        required: true,
        placeholder: "22AAAAA0000A1Z5"
      },
      {
        name: "years_in_business",
        label: "Years in Business",
        type: "number" as const,
        min: 0,
        required: true
      },
      {
        name: "service_area",
        label: "Service Coverage Area",
        type: "text" as const,
        required: true,
        placeholder: "e.g., Maharashtra, Karnataka, Pan India"
      },
      { name: "aadhar_number", label: "Aadhar Number", type: "text" as const, required: false, placeholder: "12-digit Aadhar number (optional)" } as FormField,
      // File uploads
      {
        name: "photo_file",
        label: "Upload Your Photo (10MB max - png, jpeg)",
        type: "file",
        required: false
      } as FormField,
      {
        name: "aadhar_front_file",
        label: "Upload Aadhar Front Image (10MB max - png, jpeg)",
        type: "file",
        required: false
      } as FormField
    ]
  }
};

// Success Animation Component
const SuccessAnimation = ({ show, onClose }: { show: boolean; onClose: () => void }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in-0 duration-300">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center animate-in zoom-in-95 duration-300">
        <div className="mb-6">
          <div className="relative inline-block">
            <CheckCircle className="w-20 h-20 text-green-500 animate-pulse" />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-bounce" />
            <PartyPopper className="w-6 h-6 text-blue-400 absolute -top-2 -left-2 animate-bounce delay-150" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-green-600 mb-4">
          🎉 Registration Successful! 🎉
        </h3>

        <p className="text-gray-600 mb-6">
          Your application has been submitted successfully and is now pending admin approval.
        </p>

        <div className="space-y-2 text-sm text-gray-500 mb-6">
          <p>✅ Profile information saved</p>
          <p>✅ Documents uploaded</p>
          <p>✅ Notification sent to admin</p>
        </div>

        <button
          onClick={onClose}
          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// Main component with toast provider
export default function RegistrationForm({ userType, onBackToSelection, onRegistrationComplete, onGoToLogin, token }: RegistrationFormProps) {
  const getTitle = () => {
    switch (userType) {
      case 'farmer': return 'Farmer Registration';
      case 'landowner': return 'Landowner Registration';
      case 'vendor': return 'Vendor Registration';
      case 'buyer': return 'Buyer Registration';
      case 'agri_copilot':
      default: return 'Agri Co-pilot Registration';
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-white">
        {/* Header with logo and back button */}
        <header className="border-b border-gray-200">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img
                  src="/title logo.jpg"
                  alt="AgriHub"
                  className="h-10 w-auto"
                />
                <h1 className="ml-4 text-xl font-semibold text-gray-900">{getTitle()}</h1>
              </div>
              <button
                onClick={onBackToSelection}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Back
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RegistrationFormContent
            userType={userType}
            onBackToSelection={onBackToSelection}
            onRegistrationComplete={onRegistrationComplete}
            onGoToLogin={onGoToLogin}
            token={token}
          />
        </main>

        <ToastViewport
          className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
          style={{
            pointerEvents: 'none',
          }}
        />
      </div>
    </ToastProvider>
  );
}

// Main form content component
function RegistrationFormContent({ userType, onBackToSelection, onRegistrationComplete, onGoToLogin, token }: RegistrationFormProps) {
  const inputClasses = "w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200";
  const buttonClasses = "w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500";
  const labelClasses = "block text-sm font-medium text-gray-700 mb-1.5";
  const formGroupClasses = "mb-5";
  const [formData, setFormData] = useState<FormData>({});
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false);

  // Country options for the dropdown
  const countryOptions: OptionType[] = [
    { value: "", label: "🌍 Select Country" },
    { value: "India", label: "🇮🇳 India" },
    { value: "United States", label: "🇺🇸 United States" },
    { value: "United Kingdom", label: "🇬🇧 United Kingdom" },
    { value: "Canada", label: "🇨🇦 Canada" },
    { value: "Australia", label: "🇦🇺 Australia" },
    { value: "Germany", label: "🇩🇪 Germany" },
    { value: "France", label: "🇫🇷 France" },
    { value: "Japan", label: "🇯🇵 Japan" },
    { value: "China", label: "🇨🇳 China" },
    { value: "Brazil", label: "🇧🇷 Brazil" }
  ];

  // Location state management for cascading dropdowns
  const [availableStates, setAvailableStates] = useState<OptionType[]>([
    { value: "", label: "🏛️ First select a country" }
  ]);
  const [availableCities, setAvailableCities] = useState<OptionType[]>([
    { value: "", label: "🏙️ First select a state" }
  ]);
  const [availableMandals, setAvailableMandals] = useState<OptionType[]>([
    { value: "", label: "🏛️ First select a district" }
  ]);

  // Function to get states based on selected country
  const getStatesForCountry = (country: string): OptionType[] => {
    console.log('🗺️ Getting states for country:', country);
    
    if (!country || !locationData[country as keyof typeof locationData]) {
      console.log('❌ No country selected or country not found in locationData');
      return [{ value: "", label: "🏛️ First select a country" }];
    }
    
    const countryData = locationData[country as keyof typeof locationData];
    const states = Object.keys(countryData.states);
    
    console.log('✅ Found states for', country, ':', states);
    
    const stateOptions = [
      { value: "", label: "🏛️ Select State/Province" },
      ...states.map(state => ({ 
        value: state, 
        label: `📍 ${state}` 
      }))
    ];
    
    console.log('📋 State options:', stateOptions);
    return stateOptions;
  };

  // Function to get cities based on selected state and country
  const getCitiesForState = (country: string, state: string): OptionType[] => {
    console.log('🏘️ Getting cities for:', { country, state });
    
    if (!country || !state || !locationData[country as keyof typeof locationData]) {
      console.log('❌ Missing country or state, or country not found');
      return [{ value: "", label: "🏙️ First select a state" }];
    }
    
    const countryData = locationData[country as keyof typeof locationData];
    const stateData = countryData.states[state as keyof typeof countryData.states];
    
    // Handle both old format (array of cities) and new format (object with districts and mandals)
    let cities: string[] = [];
    if (Array.isArray(stateData)) {
      // Old format: array of cities
      cities = stateData;
    } else if (stateData && typeof stateData === 'object' && 'districts' in stateData) {
      // New format: object with districts property
      cities = (stateData as any).districts;
    }
    
    if (!cities || cities.length === 0) {
      console.log('❌ No cities found for state:', state);
      return [{ value: "", label: "🏙️ No cities available" }];
    }
    
    console.log('✅ Found cities for', state, ':', cities);
    
    const cityOptions = [
      { value: "", label: "🏙️ Select City/District" },
      ...cities.map(city => ({ 
        value: city, 
        label: `🏘️ ${city}` 
      })),
      { value: "Other", label: "📝 Other (Specify in Address)" }
    ];
    
    console.log('📋 City options:', cityOptions);
    return cityOptions;
  };

  // Function to get mandals based on selected district and state
  const getMandalsForDistrict = (country: string, state: string, district: string): OptionType[] => {
    console.log('🏛️ Getting mandals for:', { country, state, district });
    
    if (!country || !state || !district || !locationData[country as keyof typeof locationData]) {
      console.log('❌ Missing country, state, or district');
      return [{ value: "", label: "🏛️ First select a district" }];
    }
    
    const countryData = locationData[country as keyof typeof locationData];
    const stateData = countryData.states[state as keyof typeof countryData.states];
    
    // Check if this state has mandal data (new format)
    if (stateData && typeof stateData === 'object' && 'mandals' in stateData) {
      const mandals = (stateData as any).mandals[district];
      
      if (!mandals || !Array.isArray(mandals) || mandals.length === 0) {
        console.log('❌ No mandals found for district:', district);
        return [{ value: "", label: "🏛️ No mandals available" }];
      }
      
      console.log('✅ Found mandals for', district, ':', mandals);
      
      const mandalOptions = [
        { value: "", label: "🏛️ Select Mandal" },
        ...mandals.map(mandal => ({ 
          value: mandal, 
          label: `🏛️ ${mandal}` 
        })),
        { value: "Other", label: "📝 Other (Specify in Address)" }
      ];
      
      console.log('📋 Mandal options:', mandalOptions);
      return mandalOptions;
    }
    
    // If no mandal data available for this state, return empty options
    console.log('ℹ️ No mandal data available for state:', state);
    return [{ value: "", label: "🏛️ Mandal data not available" }];
  };

  // Update available states when country changes
  useEffect(() => {
    const selectedCountry = formData.country as string;
    if (selectedCountry) {
      const states = getStatesForCountry(selectedCountry);
      setAvailableStates(states);
      
      // Clear state, city, and mandal when country changes
      if (formData.state) {
        setFormData(prev => ({ ...prev, state: "", city: "", mandal: "" }));
        setAvailableCities([{ value: "", label: "🏙️ First select a state" }]);
        setAvailableMandals([{ value: "", label: "🏛️ First select a district" }]);
      }
    } else {
      setAvailableStates([]);
      setAvailableCities([]);
      setAvailableMandals([]);
    }
  }, [formData.country]);

  // Update available cities when state changes
  useEffect(() => {
    const selectedCountry = formData.country as string;
    const selectedState = formData.state as string;
    
    if (selectedCountry && selectedState) {
      const cities = getCitiesForState(selectedCountry, selectedState);
      setAvailableCities(cities);
      
      // Clear city and mandal when state changes
      if (formData.city) {
        setFormData(prev => ({ ...prev, city: "", mandal: "" }));
        setAvailableMandals([{ value: "", label: "🏛️ First select a district" }]);
      }
    } else {
      setAvailableCities([{ value: "", label: "🏙️ First select a state" }]);
      setAvailableMandals([{ value: "", label: "🏛️ First select a district" }]);
    }
  }, [formData.state, formData.country]);

  // Update available mandals when district (city) changes
  useEffect(() => {
    const selectedCountry = formData.country as string;
    const selectedState = formData.state as string;
    const selectedCity = formData.city as string;
    
    if (selectedCountry && selectedState && selectedCity && selectedCity !== "Other") {
      const mandals = getMandalsForDistrict(selectedCountry, selectedState, selectedCity);
      setAvailableMandals(mandals);
      
      // Clear mandal when district changes
      if (formData.mandal) {
        setFormData(prev => ({ ...prev, mandal: "" }));
      }
    } else {
      setAvailableMandals([{ value: "", label: "🏛️ First select a district" }]);
    }
  }, [formData.city, formData.state, formData.country]);

  // Styles for form fields
  const inputStyles = "bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 rounded-md transition-all w-full px-3 py-2 text-sm";
  const textShadowStyle = "text-shadow: 0 1px 2px rgba(0,0,0,0.1)";

  // Validate userType
  if (!userType || !(userType in userTypeConfig)) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-4xl mx-auto mt-8">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Invalid User Type</h2>
          <p className="mb-6 text-gray-600">The requested registration type is not valid. Please go back and select a valid user type.</p>
          <Button
            onClick={onBackToSelection}
            variant="default"
            className="px-6 py-2.5 text-sm"
          >
            Back to Selection
          </Button>
        </div>
      </div>
    );
  }

  // Helper function to format phone number for backend submission (10-digit format)
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Convert to 10-digit format that backend expects
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return cleaned.substring(2); // Remove country code: 919876543210 -> 9876543210
    } else if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      return cleaned; // Already in correct format: 9876543210
    }

    return cleaned;
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const config = userTypeConfig[userType as keyof typeof userTypeConfig];

  // Form styling
  const formWrapperClass = "space-y-4";

  // File validation function with enhanced error handling and logging
  const validateFile = (file: File): string | null => {
    const MIN_FILE_SIZE = 5 * 1024; // 5KB in bytes
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    // Log file upload attempt
    console.log(`📤 [${userType.toUpperCase()} REGISTRATION] File upload attempt:`, {
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`,
      fileType: file.type,
      timestamp: new Date().toISOString()
    });

    // Check file type first
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = `❌ Invalid File Type\n\nOnly JPG and PNG images are allowed.\n\nFile: ${file.name}\nType: ${file.type || 'unknown'}`;
      console.error(`❌ [${userType.toUpperCase()} REGISTRATION] Invalid file type:`, {
        fileName: file.name,
        providedType: file.type,
        allowedTypes: allowedTypes,
        timestamp: new Date().toISOString()
      });
      return errorMsg;
    }

    // Check minimum file size (5KB)
    if (file.size < MIN_FILE_SIZE) {
      const errorMsg = `❌ File Too Small\n\nMinimum file size is 5 KB.\n\nFile: ${file.name}\nCurrent size: ${(file.size / 1024).toFixed(2)} KB\n\nPlease upload a larger image file.`;
      console.error(`❌ [${userType.toUpperCase()} REGISTRATION] File too small:`, {
        fileName: file.name,
        fileSize: file.size,
        minRequired: MIN_FILE_SIZE,
        sizeDifference: `${((MIN_FILE_SIZE - file.size) / 1024).toFixed(2)} KB below minimum`,
        timestamp: new Date().toISOString()
      });
      return errorMsg;
    }

    // Check maximum file size (2MB)
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = `❌ File Too Large\n\nMaximum file size is 2 MB.\n\nFile: ${file.name}\nCurrent size: ${(file.size / (1024 * 1024)).toFixed(2)} MB\n\nPlease compress the image or upload a smaller file.`;
      console.error(`❌ [${userType.toUpperCase()} REGISTRATION] File too large:`, {
        fileName: file.name,
        fileSize: file.size,
        maxAllowed: MAX_FILE_SIZE,
        sizeExceeded: `${((file.size - MAX_FILE_SIZE) / (1024 * 1024)).toFixed(2)} MB over limit`,
        timestamp: new Date().toISOString()
      });
      return errorMsg;
    }

    // File is valid
    console.log(`✅ [${userType.toUpperCase()} REGISTRATION] File validation passed:`, {
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`,
      fileType: file.type,
      timestamp: new Date().toISOString()
    });

    return null; // Valid file
  };

  // File change handler with validation and logging
  const handleFileChange = (field: string, file: File | null) => {
    console.log(`📁 [${userType.toUpperCase()} REGISTRATION] File change event:`, {
      field: field,
      hasFile: !!file,
      timestamp: new Date().toISOString()
    });

    if (file) {
      const error = validateFile(file);
      if (error) {
        console.error(`⚠️ [${userType.toUpperCase()} REGISTRATION] File validation failed for field "${field}":`, {
          error: error,
          fileName: file.name,
          timestamp: new Date().toISOString()
        });

        // Set error state for this field
        setFileErrors(prev => ({
          ...prev,
          [field]: error
        }));

        // Show alert popup immediately
        window.alert(error);

        // Also show toast notification
        toast({
          title: "❌ File Upload Failed",
          description: error,
          variant: "destructive",
          duration: 10000, // Show for 10 seconds
        });

        // Clear the file input to prevent invalid file from being retained
        const fileInput = document.querySelector(`input[name="${field}"]`) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }

        return;
      }

      // Clear any previous error for this field
      setFileErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });

      console.log(`✅ [${userType.toUpperCase()} REGISTRATION] File accepted for field "${field}":`, {
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        timestamp: new Date().toISOString()
      });
    } else {
      // Clear error when file is removed
      setFileErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });

      console.log(`🗑️ [${userType.toUpperCase()} REGISTRATION] File cleared for field "${field}"`, {
        timestamp: new Date().toISOString()
      });
    }

    setFormData(prev => ({
      ...prev,
      [field]: file as any // Store the file object directly
    }));
  };
  const handleInputChange = (field: string, value: string | number | boolean) => {
    // Ensure value is always a string
    const stringValue = String(value);

    // Handle phone number formatting (check for 'phone' in field name or common phone field names)
    if (field === 'phone' || field.toLowerCase().includes('phone') || field === 'phone_number') {
      const formatted = formatPhoneNumberInput(stringValue);
      setFormData(prev => ({
        ...prev,
        [field]: formatted
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: stringValue
      }));
    }

    // Clear error when user types
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Format phone number with +91 prefix for display
  const formatPhoneNumberInput = (input: string): string => {
    if (!input) return '';

    // Remove all non-digit characters
    const digits = input.replace(/\D/g, '');

    // If empty, return empty
    if (!digits) return '';

    // If starts with 91, format as +91 XXXXX XXXXX
    if (digits.startsWith('91')) {
      const remaining = digits.slice(2);
      if (remaining.length <= 10) {
        if (remaining.length > 5) {
          return `+91 ${remaining.slice(0, 5)} ${remaining.slice(5)}`;
        } else if (remaining.length > 0) {
          return `+91 ${remaining}`;
        } else {
          return '+91 ';
        }
      }
      // If more than 10 digits after 91, truncate
      return `+91 ${remaining.slice(0, 5)} ${remaining.slice(5, 10)}`;
    }

    // If 10 digits or less, format with +91 prefix
    if (digits.length <= 10) {
      if (digits.length > 5) {
        return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
      } else if (digits.length > 0) {
        return `+91 ${digits}`;
      }
    }

    // If more than 10 digits, truncate to 10 and format
    const truncated = digits.slice(0, 10);
    if (truncated.length > 5) {
      return `+91 ${truncated.slice(0, 5)} ${truncated.slice(5)}`;
    } else {
      return `+91 ${truncated}`;
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    // Clear error for this field when user makes a change
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Enhanced input change handler with error clearing
  const handleInputChangeWithValidation = (field: string, value: string | number | boolean) => {
    // Clear error for this field when user makes a change
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    handleInputChange(field, value);

    // Real-time validation for email
    if (field === 'email' && value) {
      const emailValue = String(value).trim();
      if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        setFieldErrors(prev => ({
          ...prev,
          [field]: 'Invalid email format'
        }));
      }
    }

    // Real-time validation for phone
    if (field === 'phone' && value) {
      const phoneValue = String(value).replace(/\D/g, '');
      if (phoneValue && phoneValue.length > 0) {
        // Remove 91 country code if present
        const cleanPhone = phoneValue.startsWith('91') ? phoneValue.slice(2) : phoneValue;
        if (cleanPhone.length > 0 && cleanPhone.length < 10) {
          setFieldErrors(prev => ({
            ...prev,
            [field]: 'Phone number must be 10 digits'
          }));
        } else if (cleanPhone.length > 0 && !/^[6-9]/.test(cleanPhone)) {
          setFieldErrors(prev => ({
            ...prev,
            [field]: 'Phone number must start with 6, 7, 8, or 9'
          }));
        }
      }
    }
  };

  // Check for duplicate email/phone
  const checkDuplicateEmailOrPhone = async (email: string, phone: string): Promise<{ isDuplicate: boolean; field: string; message: string } | null> => {
    try {
      setIsDuplicateChecking(true);
      console.log(`🔍 [${userType.toUpperCase()} REGISTRATION] Checking for duplicate email/phone...`);

      // Get API base URL
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const cleanPhone = formatPhoneNumber(phone);

      // Check email
      try {
        const emailCheckResponse = await fetch(`${apiUrl}/api/check-duplicate?email=${encodeURIComponent(email)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (emailCheckResponse.ok) {
          const emailData = await emailCheckResponse.json();
          if (emailData.exists) {
            console.log(`❌ [${userType.toUpperCase()} REGISTRATION] Email already exists:`, email);
            return {
              isDuplicate: true,
              field: 'email',
              message: `Email "${email}" is already registered.`
            };
          }
        }
      } catch (err) {
        console.warn('Email duplicate check failed:', err);
      }

      // Check phone
      try {
        const phoneCheckResponse = await fetch(`${apiUrl}/api/check-duplicate?phone=${encodeURIComponent(cleanPhone)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (phoneCheckResponse.ok) {
          const phoneData = await phoneCheckResponse.json();
          if (phoneData.exists) {
            console.log(`❌ [${userType.toUpperCase()} REGISTRATION] Phone already exists:`, cleanPhone);
            return {
              isDuplicate: true,
              field: 'phone',
              message: `Phone number "${cleanPhone}" is already registered. Please use a different number or login.`
            };
          }
        }
      } catch (err) {
        console.warn('Phone duplicate check failed:', err);
      }

      console.log(`✅ [${userType.toUpperCase()} REGISTRATION] No duplicates found`);
      return null;
    } catch (error) {
      console.error('Duplicate check error:', error);
      return null; // Don't block registration if check fails
    } finally {
      setIsDuplicateChecking(false);
    }
  };

  // Scroll to and focus on error field
  const scrollToField = (fieldName: string) => {
    setTimeout(() => {
      const element = document.getElementById(fieldName) ||
        document.querySelector(`[name="${fieldName}"]`) as HTMLElement;

      if (element) {
        console.log(`📍 [${userType.toUpperCase()} REGISTRATION] Scrolling to field:`, fieldName);

        // Scroll to element with smooth behavior
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });

        // Focus the element after scroll
        setTimeout(() => {
          element.focus();

          // Add visual highlight
          element.classList.add('ring-2', 'ring-red-500', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2');
          }, 2000);
        }, 500);
      }
    }, 100);
  };

  // Validate all required fields
  const validateRequiredFields = (): { isValid: boolean; missingField?: string } => {
    const requiredFields = config.fields.filter(f => f.required);
    const errors: Record<string, string> = {};

    for (const field of requiredFields) {
      const value = formData[field.name];

      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[field.name] = `${field.label} is required`;
        console.log(`❌ [${userType.toUpperCase()} REGISTRATION] Missing required field:`, field.name);
      } else if (value instanceof File) {
        // File fields are already validated by handleFileChange
        continue;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorField = Object.keys(errors)[0];

      toast({
        title: "❌ Missing Required Fields",
        description: `Please fill in: ${errors[firstErrorField]}`,
        variant: "destructive",
      });

      scrollToField(firstErrorField);
      return { isValid: false, missingField: firstErrorField };
    }

    return { isValid: true };
  };

  // Password validation function
  const validatePassword = (password: string) => {
    const minLength = typeof password === 'string' && password.length >= 8;
    const hasUpper = /[A-Z]/.test(password || '');
    const hasLower = /[a-z]/.test(password || '');
    const hasNumber = /[0-9]/.test(password || '');
    const hasSpecial = /[!@#$%^&*(),.?"':{}|<>[\]/\\`~\-_+=;:]/.test(password || '');

    // Check byte length for bcrypt compatibility
    const passwordBytes = new TextEncoder().encode(password || '');
    const withinByteLimit = passwordBytes.length <= 72;
    const isRecommendedLength = passwordBytes.length <= 60; // Recommended for optimal compatibility

    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      withinByteLimit,
      isRecommendedLength,
      byteLength: passwordBytes.length
    };
  };

  // Password requirements item component
  const PasswordRequirementItem = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
    <div className="flex items-start gap-2">
      <div className={`w-5 h-5 flex items-center justify-center rounded-full ${ok ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
        {ok ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
      </div>
      <div className={`text-sm ${ok ? 'text-gray-800' : 'text-gray-500'}`}>{children}</div>
    </div>
  );

  // Password requirements tooltip component
  const PasswordRequirements = ({ password, show }: { password: string; show: boolean }) => {
    const rules = validatePassword(password || '');
    if (!show) return null;

    return (
      <div
        className="absolute z-50 mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-lg max-w-xs"
        onMouseEnter={() => setShowPasswordRequirements(true)}
        onMouseLeave={() => setShowPasswordRequirements(false)}
      >
        <div className="mb-2 text-sm font-semibold text-gray-800">Password requirements</div>
        <div className="grid grid-cols-1 gap-2">
          <PasswordRequirementItem ok={rules.minLength}>At least 8 characters</PasswordRequirementItem>
          <PasswordRequirementItem ok={rules.hasUpper}>One uppercase letter (A-Z)</PasswordRequirementItem>
          <PasswordRequirementItem ok={rules.hasLower}>One lowercase letter (a-z)</PasswordRequirementItem>
          <PasswordRequirementItem ok={rules.hasNumber}>One number (0-9)</PasswordRequirementItem>
          <PasswordRequirementItem ok={rules.hasSpecial}>One special character (e.g. !@#$%)</PasswordRequirementItem>

          {/* Password length indicator */}
          {password && (
            <div className={`text-xs mt-1 px-2 py-1 rounded ${rules.withinByteLimit
                ? rules.isRecommendedLength
                  ? 'bg-green-50 text-green-700'
                  : 'bg-yellow-50 text-yellow-700'
                : 'bg-red-50 text-red-700'
              }`}>
              Length: {rules.byteLength} bytes {rules.withinByteLimit ? '✓' : '⚠️ (will be truncated)'}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Handle form field rendering based on type
  const renderFormField = (field: FormField) => {
    const fieldValue = formData[field.name];
    const stringValue = typeof fieldValue === 'string' ? fieldValue : '';
    const hasError = !!fieldErrors[field.name];

    const commonProps = {
      key: field.name,
      id: field.name,
      name: field.name,
      value: stringValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        handleInputChange(field.name, e.target.value),
      className: cn(
        "mt-1 block w-full rounded-md shadow-sm focus:ring-2 transition-all",
        inputStyles,
        hasError
          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
      ),
      required: field.required,
      placeholder: field.placeholder || `Enter ${field.label.toLowerCase()}`,
      disabled: isSubmitting || isDuplicateChecking,
    };

    // Helper to wrap field with error message
    const wrapWithError = (fieldElement: React.ReactNode) => (
      <div key={field.name}>
        {fieldElement}
        {hasError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-300 rounded-md">
            <p className="text-sm text-red-700 font-medium flex items-center gap-2">
              <span className="text-lg">❌</span>
              <span>{fieldErrors[field.name]}</span>
            </p>
          </div>
        )}
      </div>
    );

    switch (field.type) {
      case 'textarea':
        return wrapWithError(<Textarea {...commonProps} rows={4} />);

      case 'select':
        const selectValue = (typeof formData[field.name] === 'string' ? formData[field.name] : '') as string;
        
        // Get dynamic options for location fields
        let optionsToUse = field.options || [];
        
        if (field.name === 'state') {
          optionsToUse = availableStates;
        } else if (field.name === 'city') {
          optionsToUse = availableCities;
        }
        
        return wrapWithError(
          <select
            key={field.name}
            id={field.name}
            name={field.name}
            value={selectValue}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={cn(
              commonProps.className,
              // Enhanced styling for location dropdowns
              field.name === 'country' || field.name === 'state' || field.name === 'city' 
                ? "bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 focus:border-green-400 focus:ring-2 focus:ring-green-100" 
                : ""
            )}
            required={field.required}
            disabled={isSubmitting || isDuplicateChecking || (
              // Disable state if no country selected
              (field.name === 'state' && !formData.country) ||
              // Disable city if no state selected
              (field.name === 'city' && !formData.state)
            )}
          >
            {optionsToUse.length === 0 ? (
              <option value="">Loading...</option>
            ) : (
              optionsToUse.map((option) => {
                const value = typeof option === 'string' ? option : option.value;
                const label = typeof option === 'string' ? option : option.label;
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })
            )}
          </select>
        );

      case 'number':
        return wrapWithError(<Input type="number" min="0" step="any" {...commonProps} />);

      case 'email':
        return wrapWithError(<Input type="email" autoComplete="email" {...commonProps} />);

      case 'file':
        return (
          <div key={field.name}>
            <input
              type="file"
              id={field.name}
              name={field.name}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileChange(field.name, file);
              }}
              className={cn(
                "mt-1 block w-full text-sm text-gray-500",
                "file:mr-4 file:py-2 file:px-4",
                "file:rounded-md file:border-0",
                "file:text-sm file:font-semibold",
                "file:bg-green-50 file:text-green-700",
                "hover:file:bg-green-100",
                "cursor-pointer"
              )}
              accept="image/jpeg,image/jpg,image/png"
              required={field.required}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              📋 Accepted formats: JPG, PNG only | 📏 Size: Min 5 KB, Max 2 MB
            </p>
            {formData[field.name] && formData[field.name] instanceof File && (
              <p className="mt-1 text-xs text-green-600">
                ✓ {(formData[field.name] as File).name} ({((formData[field.name] as File).size / 1024).toFixed(2)} KB) selected
              </p>
            )}
          </div>
        );

      case 'password':
        // show password requirements under the input and use live validation
        return (
          <div key={field.name}>
            <Input type="password" autoComplete="new-password" {...commonProps} />
            {hasError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-300 rounded-md">
                <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                  <span className="text-lg">❌</span>
                  <span>{fieldErrors[field.name]}</span>
                </p>
              </div>
            )}
            <div className="mt-2">
              <PasswordRequirements password={String(commonProps.value || '')} show={true} />
            </div>
          </div>
        );

      default:
        // Special handling for phone field
        if (field.name === 'phone') {
          return (
            <div key={field.name}>
              <Input
                type="tel"
                id={field.name}
                name={field.name}
                value={stringValue}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                className={commonProps.className}
                required={field.required}
                placeholder="+91 XXXXX XXXXX"
                disabled={isSubmitting || isDuplicateChecking}
                {...(field.type === 'tel' && 'pattern' in field && field.pattern ? { pattern: field.pattern } : {})}
                {...(field.type === 'tel' && 'title' in field && field.title ? { title: field.title } : {})}
              />
              {hasError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-300 rounded-md">
                  <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                    <span className="text-lg">❌</span>
                    <span>{fieldErrors[field.name]}</span>
                  </p>
                </div>
              )}
              {!hasError && stringValue && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-green-600 font-medium">
                    📱 Formatted: {stringValue}
                  </div>
                  <div className="text-xs text-blue-600">
                    📤 Will be submitted as: {formatPhoneNumber(stringValue)}
                  </div>
                </div>
              )}
              <div className="mt-1 text-xs text-gray-600">
                💡 Enter 10-digit Indian mobile number (starts with 6-9). Format: +91 XXXXX XXXXX
              </div>
            </div>
          );
        }

        return wrapWithError(<Input {...commonProps} />);
        return <Input type="text" {...commonProps} />;
    }
  };

  // API Configuration - Mobile-friendly URL detection
  const getApiUrl = (): string => {
    // First check environment variable
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      return process.env.NEXT_PUBLIC_API_BASE_URL;
    }
    
    // Detect if we're in mobile browser and return appropriate URL
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // If accessing via IP or domain (mobile/external), use that
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        // If we're on a production domain, use the API subdomain/path
        if (hostname.includes('agrihublife.ai')) {
          return 'https://beta.agrihublife.ai';
        }
        // Otherwise use the same hostname with port 8000
        return `http://${hostname}:8000`;
      }
    }
    
    // Default fallback for local development
    return "http://localhost:8000";
  };

  const API_URL: string = getApiUrl();

  // Register user function
  const registerUser = async (userType: 'farmer' | 'landowner' | 'vendor' | 'buyer' | 'agri_copilot', data: any) => {
    try {
      // The userType from the form directly matches the backend endpoint suffix.
      const endpoint = userType;
      if (!endpoint) {
        throw new Error(`Invalid user type: ${userType}`);
      }

      const registerUrl = `${API_URL}/admin/register/${endpoint}`;
      console.log('🚀 Sending registration request to:', registerUrl);
      console.log('📦 Registration payload (before FormData):', data);
      console.log('🔍 Payload has role field:', 'role' in data, 'Value:', data.role);

      // Convert data to FormData for multipart/form-data submission
      const formDataToSend = new FormData();

      // Add all fields from data object to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          // Handle file objects specially
          if (value instanceof File) {
            formDataToSend.append(key, value);
            console.log(`✅ Added file field: ${key} - ${value.name}`);
          } else if (typeof value === 'boolean') {
            formDataToSend.append(key, value.toString());
            console.log(`✅ Added boolean field: ${key} = ${value}`);
          } else if (typeof value === 'number') {
            formDataToSend.append(key, value.toString());
            console.log(`✅ Added number field: ${key} = ${value}`);
          } else {
            formDataToSend.append(key, String(value));
            console.log(`✅ Added string field: ${key} = ${value}`);
          }
        } else {
          console.log(`⏭️ Skipped field: ${key} (empty/null/undefined)`);
        }
      });

      // Add photo and aadhar files if they exist in formData with logging
      if (formData.photo_file && formData.photo_file instanceof File) {
        console.log(`📤 [${userType.toUpperCase()} REGISTRATION] Adding photo file to submission:`, {
          fileName: formData.photo_file.name,
          fileSize: `${(formData.photo_file.size / 1024).toFixed(2)} KB`,
          fileType: formData.photo_file.type,
          timestamp: new Date().toISOString()
        });
        formDataToSend.append("photo_file", formData.photo_file);
      } else {
        console.log(`⚠️ [${userType.toUpperCase()} REGISTRATION] No photo file attached to submission`);
      }

      if (formData.aadhar_front_file && formData.aadhar_front_file instanceof File) {
        console.log(`📤 [${userType.toUpperCase()} REGISTRATION] Adding Aadhar file to submission:`, {
          fileName: formData.aadhar_front_file.name,
          fileSize: `${(formData.aadhar_front_file.size / 1024).toFixed(2)} KB`,
          fileType: formData.aadhar_front_file.type,
          timestamp: new Date().toISOString()
        });
        formDataToSend.append("aadhar_front_file", formData.aadhar_front_file);
      } else {
        console.log(`⚠️ [${userType.toUpperCase()} REGISTRATION] No Aadhar file attached to submission`);
      }

      if (formData.aadhar_number) {
        formDataToSend.append("aadhar_number", String(formData.aadhar_number));
      }

      const response = await fetch(registerUrl, {
        method: 'POST',
        // Don't set Content-Type header - browser will set it automatically for FormData
        credentials: 'same-origin',
        body: formDataToSend
      });

      let responseData;
      try {
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        if (!responseText) {
          throw new Error('Empty response from server');
        }
        
        try {
          responseData = JSON.parse(responseText);
          console.log('Registration response:', responseData);
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          console.error('Response text that failed to parse:', responseText);
          
          // Check if it's an HTML error page (common in mobile browsers)
          if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
            throw new Error('Server returned HTML instead of JSON. This usually means the server is not running or not reachable from your device.');
          }
          
          throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 100)}...`);
        }
      } catch (e) {
        console.error('Error getting response:', e);
        
        // Handle network errors specifically for mobile
        if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
          throw new Error('Network error: Unable to connect to server. Please check your internet connection and make sure you can access the server from your device.');
        }
        
        if (e instanceof Error && e.message.includes('NetworkError')) {
          throw new Error('Network error: Connection failed. If you\'re on mobile, make sure you\'re connected to the same network as the server or use the correct server URL.');
        }
        
        throw e;
      }

      if (!response.ok) {
        console.log('Registration failed with status:', response.status);
        console.log('Response data:', responseData);

        // Handle specific error cases
        if (response.status === 409) {
          throw new Error('An account with this email or phone number already exists');
        }
        if (response.status === 400) {
          // Handle validation errors
          const errorMessage = responseData.detail || responseData.message ||
            (typeof responseData.errors === 'object' ?
              Object.entries(responseData.errors)
                .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
                .join('. ') :
              'Invalid registration data');
          throw new Error(errorMessage);
        }
        if (response.status === 422) {
          // Handle validation errors from FastAPI
          const errors = responseData.detail || [];
          const errorMessage = Array.isArray(errors)
            ? errors.map(err => {
              const field = err.loc?.slice(-1)[0] || 'field';
              return `${field}: ${err.msg || 'Invalid value'}`;
            }).join('. ')
            : 'Invalid input data';
          throw new Error(errorMessage);
        }

        // Handle 500 errors with more details
        if (response.status === 500) {
          const errorDetails = responseData.detail || responseData.message || 'Internal server error';
          console.error('Server error details:', errorDetails);

          // Check for specific error types to provide better user messages
          if (typeof errorDetails === 'string') {
            if (errorDetails.includes('UUID') || errorDetails.includes('format')) {
              throw new Error('Registration system error detected. Our team has been notified. Please try again in a few minutes.');
            }
            if (errorDetails.includes('password') || errorDetails.includes('bcrypt')) {
              throw new Error('Password processing error. Please try with a shorter password or contact support.');
            }
            if (errorDetails.includes('database') || errorDetails.includes('connection')) {
              throw new Error('Database connection issue. Please try again in a moment.');
            }
          }

          throw new Error('An internal server error occurred. Please try again later.');
        }

        // Generic error with more context
        const errorMessage = responseData.detail || responseData.message ||
          `Failed to register (HTTP ${response.status}). Please try again.`;
        console.error('Registration error:', errorMessage, 'Response data:', responseData);
        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error: any) {
      console.error('Registration error:', {
        error,
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        response: error?.response
      });

      // If it's already an Error object with a message, throw it directly
      if (error instanceof Error) {
        // Check for network errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        throw error;
      }

      // Handle non-Error objects
      const errorMessage = error?.message ||
        error?.toString() ||
        'Unable to complete registration. Please try again.';
      throw new Error(errorMessage);
    }
  };

  // Helper function to safely get string value from form data
  const getStringValue = (value: string | number | File | null | undefined): string => {
    if (value === undefined || value === null) return '';
    if (value instanceof File) return '';
    return String(value).trim();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) {
      console.log(`⏳ [${userType.toUpperCase()} REGISTRATION] Already submitting - please wait...`);
      toast({
        title: "⏳ Please Wait",
        description: "Your registration is being processed. Please do not submit again.",
        variant: "default",
        duration: 3000
      });
      return;
    }

    console.log(`🔍 [${userType.toUpperCase()} REGISTRATION] Form submission started`);
    console.log("📋 Form data:", formData);
    console.log("✅ Terms agreed:", agreeToTerms);

    // Clear previous errors
    setFieldErrors({});

    // Validate terms agreement first with PROMINENT feedback
    if (!agreeToTerms) {
      console.error(`\n${"!".repeat(80)}`);
      console.error("⚠️ TERMS NOT ACCEPTED - REGISTRATION BLOCKED!");
      console.error(`${"!".repeat(80)}\n`);
      
      // Show IMMEDIATE alert popup
      window.alert(
        `⚠️ TERMS AND CONDITIONS REQUIRED!\n\n` +
        `You must agree to the Terms and Conditions and Privacy Policy before registering.\n\n` +
        `Please:\n` +
        `✓ Read the Terms and Conditions\n` +
        `✓ Check the "I agree" checkbox at the bottom of the form\n` +
        `✓ Then click Submit again`
      );
      
      // Also show toast notification
      toast({
        title: "⚠️ Terms and Conditions Required",
        description: (
          <div className="space-y-2">
            <p className="font-semibold">You must agree to the Terms and Conditions to register.</p>
            <div className="p-2 bg-yellow-900/50 border border-yellow-700 rounded-md">
              <p className="text-xs text-yellow-200">
                Please scroll down to the bottom of the form and check the "I agree to the Terms and Conditions and Privacy Policy" checkbox.
              </p>
            </div>
          </div>
        ),
        variant: "destructive",
        duration: 10000,
      });
      
      // Scroll to the terms checkbox to highlight it
      setTimeout(() => {
        const termsCheckbox = document.querySelector('input[type="checkbox"]');
        if (termsCheckbox) {
          termsCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Flash the checkbox area
          const checkboxParent = termsCheckbox.closest('label');
          if (checkboxParent) {
            checkboxParent.classList.add('animate-pulse');
            setTimeout(() => {
              checkboxParent.classList.remove('animate-pulse');
            }, 3000);
          }
        }
      }, 100);
      
      return;
    }

    // Validate all required fields
    const fieldValidation = validateRequiredFields();
    if (!fieldValidation.isValid) {
      return; // Error already shown by validateRequiredFields
    }

    // Validate email format
    const email = getStringValue(formData.email);
    console.log(`📧 [${userType.toUpperCase()} REGISTRATION] Email validation:`, email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log(`❌ [${userType.toUpperCase()} REGISTRATION] Email validation failed:`, email);
      setFieldErrors({ email: 'Invalid email format' });
      toast({
        title: "❌ Invalid Email",
        description: "Please enter a valid email address (e.g., user@example.com).",
        variant: "destructive",
      });
      scrollToField('email');
      return;
    }

    // Validate phone format
    const phone = getStringValue(formData.phone);
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneDigits = cleanPhone.startsWith('91') ? cleanPhone.slice(2) : cleanPhone;

    if (phoneDigits.length !== 10) {
      console.log(`❌ [${userType.toUpperCase()} REGISTRATION] Phone validation failed: wrong length`);
      setFieldErrors({ phone: 'Phone number must be exactly 10 digits' });
      toast({
        title: "❌ Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      scrollToField('phone');
      return;
    }

    if (!/^[6-9]/.test(phoneDigits)) {
      console.log(`❌ [${userType.toUpperCase()} REGISTRATION] Phone validation failed: wrong prefix`);
      setFieldErrors({ phone: 'Phone number must start with 6, 7, 8, or 9' });
      toast({
        title: "❌ Invalid Phone Number",
        description: "Indian phone numbers must start with 6, 7, 8, or 9.",
        variant: "destructive",
      });
      scrollToField('phone');
      return;
    }

    // Check for duplicate email/phone
    console.log(`🔍 [${userType.toUpperCase()} REGISTRATION] Checking for duplicates...`);
    const duplicateCheck = await checkDuplicateEmailOrPhone(email, phone);

    if (duplicateCheck) {
      console.log(`❌ [${userType.toUpperCase()} REGISTRATION] Duplicate found:`, duplicateCheck.field);
      console.log(`❌ Setting field error for ${duplicateCheck.field}:`, duplicateCheck.message);
      console.error(`\n\n⛔⛔⛔ DUPLICATE ${duplicateCheck.field.toUpperCase()} DETECTED ⛔⛔⛔`);
      console.error(`📧 ${duplicateCheck.message}`);
      console.error(`⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔\n\n`);

      // Set field error to highlight the field and show inline error
      setFieldErrors({ [duplicateCheck.field]: duplicateCheck.message });

      // Show BLOCKING alert popup
      window.alert(
        `❌ ${duplicateCheck.field === 'email' ? 'EMAIL ALREADY EXISTS!' : 'PHONE NUMBER ALREADY EXISTS!'}\n\n` +
        `${duplicateCheck.message}\n\n` +
        `⚠️ This ${duplicateCheck.field} is already registered in the system.\n\n` +
        `Please either:\n` +
        `• Use a different ${duplicateCheck.field}\n` +
        `• Login if you already have an account\n` +
        `• Contact support if you need help`
      );

      // Show prominent error toast
      toast({
        title: duplicateCheck.field === 'email' ? "❌ Email Already Exists" : "❌ Phone Already Exists",
        description: duplicateCheck.message,
        variant: "destructive",
        duration: 8000,
      });

      scrollToField(duplicateCheck.field);
      return;
    }

    // Validate password strength
    const password = getStringValue(formData.password);
    console.log(`� [${userType.toUpperCase()} REGISTRATION] Password validation`);
    if (password) {
      const passwordRules = validatePassword(password);

      console.log("🔐 Password checks:", passwordRules);

      if (!passwordRules.minLength) {
        console.log(`❌ [${userType.toUpperCase()} REGISTRATION] Password too short`);
        setFieldErrors({ password: 'Password must be at least 8 characters' });
        toast({
          title: "❌ Invalid Password",
          description: "Password must be at least 8 characters long.",
          variant: "destructive",
        });
        scrollToField('password');
        return;
      }

      if (!passwordRules.hasUpper) {
        console.log(`❌ [${userType.toUpperCase()} REGISTRATION] Password missing uppercase`);
        setFieldErrors({ password: 'Password must contain at least one uppercase letter' });
        toast({
          title: "❌ Invalid Password",
          description: "Password must contain at least one uppercase letter (A-Z).",
          variant: "destructive",
        });
        scrollToField('password');
        return;
      }

      if (!passwordRules.hasLower) {
        console.log(`❌ [${userType.toUpperCase()} REGISTRATION] Password missing lowercase`);
        setFieldErrors({ password: 'Password must contain at least one lowercase letter' });
        toast({
          title: "❌ Invalid Password",
          description: "Password must contain at least one lowercase letter (a-z).",
          variant: "destructive",
        });
        scrollToField('password');
        return;
      }

      if (!passwordRules.hasNumber) {
        console.log(`❌ [${userType.toUpperCase()} REGISTRATION] Password missing number`);
        setFieldErrors({ password: 'Password must contain at least one number' });
        toast({
          title: "❌ Invalid Password",
          description: "Password must contain at least one number (0-9).",
          variant: "destructive",
        });
        scrollToField('password');
        return;
      }

      if (!passwordRules.hasSpecial) {
        console.log(`❌ [${userType.toUpperCase()} REGISTRATION] Password missing special character`);
        setFieldErrors({ password: 'Password must contain at least one special character' });
        toast({
          title: "❌ Invalid Password",
          description: "Password must contain at least one special character (@$!%*?&).",
          variant: "destructive",
        });
        scrollToField('password');
        return;
      }
    }

    // All validations passed, proceed with submission
    console.log(`✅ [${userType.toUpperCase()} REGISTRATION] All validations passed`);
    setIsSubmitting(true);

    try {
      // Ensure userType is of the correct type
      const userTypeValue = userType as UserType;
      console.log("📝 UserType value:", userTypeValue);

      // Get the plaintext password - no hashing here!
      let password = getStringValue(formData.password);

      // Truncate password to 72 bytes for bcrypt compatibility
      // Convert to UTF-8 bytes and check length
      const passwordBytes = new TextEncoder().encode(password);
      if (passwordBytes.length > 72) {
        console.log("⚠️ Password is longer than 72 bytes - will be truncated for security");
        toast({
          title: "⚠️ Password Too Long",
          description: `Your password (${passwordBytes.length} bytes) exceeds the 72-byte security limit and will be automatically shortened. Consider using a shorter password for better compatibility.`,
          variant: "default",
        });

        // Safely truncate password while preserving UTF-8 character boundaries
        let truncatedBytes = passwordBytes.slice(0, 72);
        try {
          password = new TextDecoder('utf-8', { fatal: true }).decode(truncatedBytes);
        } catch (e) {
          // If truncation broke a character, find the last complete character
          for (let i = 72; i > 0; i--) {
            try {
              truncatedBytes = passwordBytes.slice(0, i);
              password = new TextDecoder('utf-8', { fatal: true }).decode(truncatedBytes);
              break;
            } catch (decodeError) {
              continue;
            }
          }
        }
        console.log(`🔐 Password truncated from ${passwordBytes.length} to ${new TextEncoder().encode(password).length} bytes for bcrypt compatibility`);
      }

      // Declare result variable to store API response
      let result: any;

      // Prepare payload based on user type
      let payload;
      switch (userTypeValue) {
        case 'farmer':
          const primaryCropTypes = getStringValue(formData.primary_crop_types)
            .split(',')
            .map((crop: string) => crop.trim().toLowerCase())
            .filter((crop: string) => crop.length > 0)
            .join(', ');

          payload = {
            full_name: getStringValue(formData.full_name),
            email: email.toLowerCase(),
            password: password, // Plaintext password - will be hashed by the backend
            phone: formatPhoneNumber(getStringValue(formData.phone)),
            address_line1: getStringValue(formData.address_line1),
            address_line2: getStringValue(formData.address_line2 || ''),
            city: getStringValue(formData.city),
            state: getStringValue(formData.state),
            mandal: getStringValue(formData.mandal || ''),
            country: getStringValue(formData.country || 'IN'),
            postal_code: getStringValue(formData.pincode),
            // Additional farmer-specific fields
            farm_size: Number(formData.farm_size) || 0,
            primary_crop_types: primaryCropTypes,
            years_of_experience: Number(formData.years_of_experience) || 0,
            farmer_location: getStringValue(formData.farmer_location || '')
          };
          break;
        case 'landowner':
          payload = {
            full_name: getStringValue(formData.full_name),
            email: email.toLowerCase(),
            password: password,
            phone: formatPhoneNumber(getStringValue(formData.phone)),
            address_line1: getStringValue(formData.address_line1),
            address_line2: getStringValue(formData.address_line2 || ''),
            city: getStringValue(formData.city),
            state: getStringValue(formData.state),
            mandal: getStringValue(formData.mandal || ''),
            country: getStringValue(formData.country || 'IN'),
            postal_code: getStringValue(formData.pincode),
            // Additional landowner-specific fields
            total_land_area: Number(formData.total_land_area) || 0,
            current_land_use: getStringValue(formData.current_land_use), // Keep enum value intact
            managing_remotely: formData.managing_remotely === 'true',
            // UserCreate requires role field
            role: 'landowner'
          };
          break;
        case 'buyer':
          const interestedCrops = getStringValue(formData.interested_crop_types || '')
            .split(',')
            .map((crop: string) => crop.trim().toLowerCase())
            .filter((crop: string) => crop.length > 0)
            .join(', ');

          const preferredProducts = getStringValue(formData.preferred_products || '')
            .split(',')
            .map((product: string) => product.trim().toLowerCase())
            .filter((product: string) => product.length > 0)
            .join(', ');

          // Format phone number to ensure it matches the required pattern
          const phoneNumber = getStringValue(formData.phone).replace(/\s+/g, '');
          const formattedPhoneNumber = phoneNumber.startsWith('+91')
            ? phoneNumber
            : phoneNumber.startsWith('91')
              ? `+${phoneNumber}`
              : phoneNumber.startsWith('0')
                ? `+91${phoneNumber.substring(1)}`
                : `+91${phoneNumber}`;

          payload = {
            full_name: getStringValue(formData.full_name),
            email: email.toLowerCase(),
            password: password,
            phone: formattedPhoneNumber, // Use the formatted phone number
            address_line1: getStringValue(formData.address_line1),
            address_line2: getStringValue(formData.address_line2 || ''),
            city: getStringValue(formData.city),
            state: getStringValue(formData.state),
            mandal: getStringValue(formData.mandal || ''),
            country: getStringValue(formData.country || 'IN'),
            postal_code: getStringValue(formData.pincode),
            // Additional buyer-specific fields
            organization_name: getStringValue(formData.organization_name),
            buyer_type: getStringValue(formData.buyer_type),
            interested_crop_types: interestedCrops,
            preferred_products: preferredProducts,
            monthly_purchase_volume: Number(formData.monthly_purchase_volume) || 0,
            business_license_number: getStringValue(formData.business_license_number),
            gst_number: getStringValue(formData.gst_number),
            // Add the role field
            role: 'buyer'
          };
          break;
        case 'agri_copilot': {
          const formDataToSend = new FormData(); // Use FormData for file uploads
          formDataToSend.append("full_name", getStringValue(formData.full_name));
          formDataToSend.append("email", getStringValue(formData.email));
          formDataToSend.append("phone", formatPhoneNumber(getStringValue(formData.phone)));
          formDataToSend.append("aadhar_number", getStringValue(formData.aadhar_number));
          formDataToSend.append("password", getStringValue(formData.password));

          // Add address fields only for token-based registration
          if (token) {
            formDataToSend.append("address_line1", getStringValue(formData.address_line1));
            formDataToSend.append("address_line2", getStringValue(formData.address_line2 || ''));
            formDataToSend.append("city", getStringValue(formData.city));
            formDataToSend.append("state", getStringValue(formData.state));
            formDataToSend.append("mandal", getStringValue(formData.mandal || ''));
            formDataToSend.append("postal_code", getStringValue(formData.pincode));
            formDataToSend.append("country", getStringValue(formData.country || 'IN'));
          }

          // Debug: Log what we're sending
          console.log("📝 FormData being sent:");
          formDataToSend.forEach((value, key) => {
            console.log(`   ${key}:`, value);
          });

          // Include the invitation token if provided
          if (token) {
            formDataToSend.append("registration_token", token);
          }

          // Validate address fields only for token-based registration
          if (token) {
            const addressValidation = {
              address_line1: getStringValue(formData.address_line1),
              city: getStringValue(formData.city),
              state: getStringValue(formData.state),
              postal_code: getStringValue(formData.pincode),
              country: getStringValue(formData.country || 'IN')
            };

            console.log("🏠 Address validation:", addressValidation);

            const missingAddressFields = Object.entries(addressValidation)
              .filter(([key, value]) => !value || value.trim() === '')
              .map(([key]) => key);

            if (missingAddressFields.length > 0) {
              throw new Error(`Missing address fields: ${missingAddressFields.join(', ')}. Please fill all address information.`);
            }
          }

          // File requirements differ between token and admin registration
          if (token) {
            // Token-based registration requires both files (backend has File(...) not File(None))
            if (!formData.photo_file || !(formData.photo_file instanceof File)) {
              throw new Error("Profile photo is required for token-based registration");
            }
            if (!formData.aadhar_front_file || !(formData.aadhar_front_file instanceof File)) {
              throw new Error("Aadhar front image is required for token-based registration");
            }
            console.log(`📄 [${userType.toUpperCase()} REGISTRATION] Token-based registration - both files required and present`);

            // Validate file sizes before submission (min 5KB, max 2MB)
            const MIN_FILE_SIZE = 5 * 1024; // 5KB
            const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

            // Validate photo file
            if (formData.photo_file.size < MIN_FILE_SIZE) {
              const errorMsg = `Photo file is too small (${(formData.photo_file.size / 1024).toFixed(2)} KB). Minimum size is 5 KB.`;
              console.error(`❌ [${userType.toUpperCase()} REGISTRATION] ${errorMsg}`);
              throw new Error(errorMsg);
            }
            if (formData.photo_file.size > MAX_FILE_SIZE) {
              const errorMsg = `Photo file is too large (${(formData.photo_file.size / 1024 / 1024).toFixed(2)} MB). Maximum size is 2 MB.`;
              console.error(`❌ [${userType.toUpperCase()} REGISTRATION] ${errorMsg}`);
              throw new Error(errorMsg);
            }

            // Validate Aadhar file
            if (formData.aadhar_front_file.size < MIN_FILE_SIZE) {
              const errorMsg = `Aadhar file is too small (${(formData.aadhar_front_file.size / 1024).toFixed(2)} KB). Minimum size is 5 KB.`;
              console.error(`❌ [${userType.toUpperCase()} REGISTRATION] ${errorMsg}`);
              throw new Error(errorMsg);
            }
            if (formData.aadhar_front_file.size > MAX_FILE_SIZE) {
              const errorMsg = `Aadhar file is too large (${(formData.aadhar_front_file.size / 1024 / 1024).toFixed(2)} MB). Maximum size is 2 MB.`;
              console.error(`❌ [${userType.toUpperCase()} REGISTRATION] ${errorMsg}`);
              throw new Error(errorMsg);
            }

            console.log(`✅ [${userType.toUpperCase()} REGISTRATION] All files validated successfully:`, {
              photo: `${(formData.photo_file.size / 1024).toFixed(2)} KB`,
              aadhar: `${(formData.aadhar_front_file.size / 1024).toFixed(2)} KB`
            });
          } else {
            // Admin registration: files are optional (File(None) in backend)
            console.log(`📄 [${userType.toUpperCase()} REGISTRATION] Admin registration - files are optional`);
          }

          if (formData.photo_file && formData.photo_file instanceof File) {
            formDataToSend.append("photo_file", formData.photo_file);
          }

          if (formData.aadhar_front_file && formData.aadhar_front_file instanceof File) {
            formDataToSend.append("aadhar_front_file", formData.aadhar_front_file);
          }

          // Use correct endpoint:
          // - Token-based: /admin/register/agri-copilot (requires registration_token)
          // - Admin-created: /admin/admin/register/agri-copilot (no token, optional address fields)
          const endpoint = token ? "/admin/register/agri-copilot" : "/admin/admin/register/agri-copilot";
          const response = await fetch(`${API_URL}${endpoint}`, {
            method: "POST",
            body: formDataToSend, // No 'Content-Type' header needed, browser sets it for FormData
          });

          if (!response.ok) {
            console.error(`\n${"!".repeat(80)}`);
            console.error("❌ REGISTRATION API ERROR");
            console.error(`${"!".repeat(80)}`);
            console.error("Response status:", response.status);
            console.error("Response statusText:", response.statusText);

            let detail = 'Please check your input fields.';

            // Handle specific HTTP status codes
            if (response.status === 413) {
              detail = 'File size too large. Please upload images smaller than 5MB each.';
            } else if (response.status === 400) {
              // Handle 400 Bad Request errors
              try {
                const errorData = await response.json();
                console.error("Server validation error:", errorData);
                console.error("Error detail:", errorData.detail);

                if (errorData.detail) {
                  // Check for specific error messages
                  if (errorData.detail.toLowerCase().includes('email already registered') || 
                      errorData.detail.toLowerCase().includes('already completed')) {
                    detail = errorData.detail;
                    
                    console.error(`\n${"=".repeat(80)}`);
                    console.error("🚨 EMAIL ALREADY REGISTERED - THROWING ERROR NOW!");
                    console.error(`${"=".repeat(80)}`);
                    console.error("Detail:", detail);
                    console.error(`${"=".repeat(80)}\n`);
                  } else if (errorData.detail.toLowerCase().includes('phone already registered')) {
                    detail = `The phone number "${getStringValue(formData.phone)}" is already registered. Please use a different phone number or try logging in if this is your account.`;
                  } else if (Array.isArray(errorData.detail)) {
                    // FastAPI validation errors
                    detail = errorData.detail.map((err: any) => {
                      const field = err.loc?.slice(-1)[0] || 'field';
                      return `${field}: ${err.msg}`;
                    }).join(', ');
                  } else {
                    detail = errorData.detail;
                  }
                } else if (errorData.message) {
                  detail = errorData.message;
                }
              } catch (parseError) {
                // If JSON parsing fails, use the response status text
                detail = `Registration failed (${response.status}): ${response.statusText}`;
              }
            } else {
              // Try to parse JSON, fallback to text if it fails
              try {
                const errorData = await response.json();
                console.error("Server validation error:", errorData);

                if (errorData.detail) {
                  if (Array.isArray(errorData.detail)) {
                    // FastAPI validation errors
                    detail = errorData.detail.map((err: any) => {
                      const field = err.loc?.slice(-1)[0] || 'field';
                      return `${field}: ${err.msg}`;
                    }).join(', ');
                  } else {
                    detail = errorData.detail;
                  }
                } else if (errorData.message) {
                  detail = errorData.message;
                }
              } catch (parseError) {
                // If JSON parsing fails, use the response status text
                detail = `Server error (${response.status}): ${response.statusText}`;
              }
            }

            // Create a custom error with additional context
            const customError = new Error(`Registration failed (${response.status}): ${detail}`);
            (customError as any).status = response.status;
            (customError as any).isEmailConflict = detail.toLowerCase().includes('email') && (detail.toLowerCase().includes('already registered') || detail.toLowerCase().includes('already completed'));
            
            // 🚨 SHOW ALERT IMMEDIATELY - RIGHT HERE BEFORE THROWING!
            console.error(`\n${"!".repeat(80)}`);
            console.error(`🚨 SHOWING ALERT NOW!`);
            console.error(`Error message: ${detail}`);
            console.error(`${"!".repeat(80)}\n`);
            
            window.alert(
              `⛔ REGISTRATION FAILED!\n\n` +
              `${detail}\n\n` +
              `Status Code: ${response.status}\n\n` +
              `${detail.toLowerCase().includes('already') ? 
                'This email is already registered.\n\n' +
                'Please:\n' +
                '✓ Login with existing credentials\n' +
                '✓ Use "Forgot Password" if needed\n' +
                '✓ Use a different email address' 
                : 'Please check your information and try again.'}`
            );
            
            console.error(`✅ Alert was shown!`);
            
            throw customError;
          }

          result = await response.json();
          console.log('Agri Copilot registration successful:', result);
          console.log('🎯 Agri Copilot case completed - proceeding to success handling');

          // Don't return early - let the success handling code execute
          break;
        }
        // Find the 'case 'vendor'' block inside 'handleSubmit' and replace it

        case 'vendor':
          payload = {
            // Common Fields
            full_name: getStringValue(formData.full_name),
            email: email.toLowerCase(),
            password: password,
            phone: formatPhoneNumber(getStringValue(formData.phone)),
            address_line1: getStringValue(formData.address_line1),
            address_line2: getStringValue(formData.address_line2 || ''),
            city: getStringValue(formData.city),
            state: getStringValue(formData.state),
            mandal: getStringValue(formData.mandal || ''),
            country: getStringValue(formData.country || 'IN'),
            postal_code: getStringValue(formData.pincode), // Backend expects postal_code

            // CORRECTED VENDOR-SPECIFIC PAYLOAD
            role: 'vendor', // Add the static role field
            legal_name: getStringValue(formData.legal_name), // Add the new legal_name field
            business_name: getStringValue(formData.business_name),
            gstin: getStringValue(formData.gst_number), // Map gst_number to gstin
            pan: getStringValue(formData.pan_number), // Map pan_number to pan
            business_type: getStringValue(formData.business_type),
            product_services: getStringValue(formData.product_services),
            years_in_business: Number(formData.years_in_business) || 0,
            service_area: getStringValue(formData.service_area || '')
          };
          break;
        default:
          throw new Error('Invalid user type');
      }

        // Show enhanced loading toast with progress and API URL info
        const loadingToast = toast({
          title: "🚀 Creating your account...",
          className: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-700',
          description: (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
                  <div className="absolute inset-0 h-8 w-8 animate-ping rounded-full border border-white/20"></div>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Setting up your {userType} account</p>
                  <p className="text-sm text-blue-100">Processing your information...</p>
                  <p className="text-xs text-blue-200">Server: {API_URL}</p>
                </div>
              </div>            {/* Progress steps */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Validating form data...</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse animation-delay-300"></div>
                <span>Creating user account...</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-500"></div>
                <span>Sending confirmation email...</span>
              </div>
            </div>
          </div>
        ),
        duration: 0, // Don't auto-dismiss
        action: (
          <button
            onClick={() => window.location.reload()}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-white/20 px-3 text-sm font-medium text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
          >
            Cancel
          </button>
        )
      });

      try {
        // AgriCopilot has already handled its own submission in the switch case above
        if (userTypeValue !== 'agri_copilot') {
          console.log('Submitting registration with payload:', payload);

          // Send the payload with plaintext password to the backend
          // The backend will handle the secure hashing
          result = await registerUser(userTypeValue, payload);
          console.log('Registration successful:', result);
        } else {
          console.log('Agri Copilot registration already completed in switch case');
        }

        // Dismiss loading toast
        loadingToast.dismiss();

        console.log('🎊 About to show success toast for userType:', userType);

        // Show success animation for ALL user types (no redirect)
        setShowSuccessAnimation(true);

        // Reset form after successful registration
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          password: '',
          confirm_password: '',
          aadhar_number: '',
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          pincode: '',
          country: 'IN'
        });

        // Show success toast with user type specific message
        toast({
          title: `🎉 ${userType.charAt(0).toUpperCase() + userType.slice(1).replace('_', ' ')} Account Created!`,
          description: `Welcome ${formData.full_name}! Your ${userType.replace('_', ' ')} account has been successfully created.`,
          variant: 'success',
          duration: 5000
        });

        // Don't call onRegistrationComplete() to prevent redirect - just show success animation

        // Custom success messages based on user type with registration ID (kept for reference)
        const successMessages = {
          farmer: {
            title: "🎉 Farmer Account Created!",
            message: `Welcome ${formData.full_name}! Your farmer account is ready. Get started with AI-powered farming insights.`,
            variant: 'success' as const
          },
          landowner: {
            title: "🏡 Landowner Account Created!",
            message: `Welcome ${formData.full_name}! Your land is now ready for optimal agricultural management.`,
            variant: 'success' as const
          },
          vendor: {
            title: "🛍️ Vendor Account Created!",
            message: `Welcome ${formData.full_name}! Your vendor account is ready. Start showcasing your agricultural products and services.`,
            variant: 'success' as const
          },
          buyer: {
            title: "🛒 Buyer Account Created!",
            message: `Welcome ${formData.full_name}! Your buyer account is ready. Connect with farmers and source quality produce.`,
            variant: 'success' as const
          },
          agri_copilot: {
            title: "🤖 Agri Copilot Application Submitted!",
            message: `Thank you ${formData.full_name}! We have received your application. Please wait for admin approval before you can sign in.`,
            variant: 'default' as const
          }
        };

        // Show success message with submission logs and status
        const successToast = toast({
          title: successMessages[userType].title,
          className: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fixed max-w-5xl w-[98%] mx-auto z-50 max-h-[95vh] overflow-y-auto',
          description: (
            <div className="text-center space-y-4 relative overflow-hidden">
              {/* Enhanced Confetti Animation Background */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(50)].map((_, i) => (
                  <div
                    key={`confetti-${i}`}
                    className="absolute animate-bounce"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                      animationDuration: `${1.5 + Math.random() * 3}s`
                    }}
                  >
                    <div className={`${i % 3 === 0
                        ? 'w-3 h-3 rounded-full'
                        : i % 3 === 1
                          ? 'w-2 h-4 rounded-sm rotate-45'
                          : 'w-4 h-2 rounded-sm rotate-12'
                      } ${['bg-gradient-to-r from-green-400 to-green-600',
                        'bg-gradient-to-r from-blue-400 to-blue-600',
                        'bg-gradient-to-r from-yellow-400 to-yellow-600',
                        'bg-gradient-to-r from-pink-400 to-pink-600',
                        'bg-gradient-to-r from-purple-400 to-purple-600',
                        'bg-gradient-to-r from-indigo-400 to-indigo-600',
                        'bg-gradient-to-r from-red-400 to-red-600',
                        'bg-gradient-to-r from-orange-400 to-orange-600'][i % 8]
                      } shadow-lg transform animate-pulse`} />
                  </div>
                ))}

                {/* Floating sparkles */}
                {[...Array(15)].map((_, i) => (
                  <div
                    key={`sparkle-${i}`}
                    className="absolute text-2xl animate-ping"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 4}s`,
                      animationDuration: `${2 + Math.random() * 2}s`
                    }}
                  >
                    ✨
                  </div>
                ))}

                {/* Celebration emojis floating */}
                {['🎉', '🎊', '🥳', '🎈', '🌟', '💫', '⭐', '🎯'].map((emoji, i) => (
                  <div
                    key={`emoji-${i}`}
                    className="absolute text-3xl animate-bounce"
                    style={{
                      left: `${(i * 12.5) % 100}%`,
                      top: `${Math.random() * 80}%`,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: `${2 + Math.random()}s`,
                      transform: `rotate(${Math.random() * 360}deg)`
                    }}
                  >
                    {emoji}
                  </div>
                ))}
              </div>

              <div className="relative p-10 bg-gradient-to-br from-white via-green-50 via-blue-50 to-purple-50 dark:from-gray-800 dark:via-green-900/20 dark:to-blue-900/20 rounded-2xl shadow-2xl border-4 border-transparent bg-clip-padding"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(34,197,94,0.1) 25%, rgba(59,130,246,0.1) 50%, rgba(147,51,234,0.1) 75%, rgba(255,255,255,0.9) 100%)',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(34,197,94,0.3), inset 0 1px 0 rgba(255,255,255,0.5)'
                }}>
                <div className="space-y-8">
                  {/* Enhanced Animated Success Icon with Ripple Effect */}
                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                    {/* Ripple effects */}
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={`ripple-${i}`}
                        className="absolute inset-0 rounded-full bg-green-400 opacity-20 animate-ping"
                        style={{
                          animationDelay: `${i * 0.5}s`,
                          animationDuration: '2s'
                        }}
                      />
                    ))}

                    {/* Main success icon */}
                    <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 shadow-2xl animate-bounce border-4 border-white">
                      <svg className="h-12 w-12 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Enhanced Celebration Text with Gradient Animation */}
                  <div className="space-y-4">
                    <div className="flex justify-center space-x-2 text-5xl">
                      {['🎉', '✨', '🎊', '🥳', '🌟'].map((emoji, i) => (
                        <span
                          key={emoji}
                          className="animate-bounce inline-block"
                          style={{
                            animationDelay: `${i * 0.2}s`,
                            animationDuration: '1.5s'
                          }}
                        >
                          {emoji}
                        </span>
                      ))}
                    </div>

                    <div className="relative">
                      <h3 className="text-4xl font-black bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse text-center leading-tight">
                        🎊 Welcome, {formData.full_name && typeof formData.full_name === 'string' ? formData.full_name : 'User'}! 🎊
                      </h3>

                      {/* Animated underline */}
                      <div className="mt-2 mx-auto w-48 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full animate-pulse"></div>
                    </div>

                    <div className="flex justify-center space-x-3 text-3xl">
                      {['🌾', '🚀', '🌱', '🌟', '💫'].map((emoji, i) => (
                        <span
                          key={emoji}
                          className="animate-bounce inline-block"
                          style={{
                            animationDelay: `${0.3 + i * 0.15}s`,
                            animationDuration: '2s'
                          }}
                        >
                          {emoji}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
                    {successMessages[userType].message}
                  </p>

                  {/* Enhanced Animated Registration ID Card */}
                  <div className="mt-8 relative">
                    {/* Glowing background effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-2xl blur opacity-75 animate-pulse"></div>

                    <div className="relative p-8 bg-gradient-to-br from-white via-green-50 to-blue-50 dark:from-gray-800 dark:via-green-900/30 dark:to-blue-900/30 rounded-2xl border-2 border-green-300 dark:border-green-600 shadow-2xl transform hover:scale-105 transition-all duration-500 backdrop-blur-sm">
                      <div className="text-center space-y-6">
                        {/* Header with animated icons */}
                        <div className="flex items-center justify-center space-x-3">
                          <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping animation-delay-150"></div>
                          <h4 className="text-xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                            🎫 Your Registration ID 🎫
                          </h4>
                          <div className="w-3 h-3 bg-purple-500 rounded-full animate-ping animation-delay-300"></div>
                          <div className="w-4 h-4 bg-yellow-500 rounded-full animate-ping animation-delay-500"></div>
                        </div>

                        {/* ID Display with enhanced styling */}
                        <div className="relative p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl shadow-inner border border-gray-700">
                          {/* Matrix-style background effect */}
                          <div className="absolute inset-0 opacity-10">
                            <div className="text-green-400 text-xs font-mono leading-3 overflow-hidden">
                              {Array.from({ length: 20 }, (_, i) => (
                                <div key={i} className="whitespace-nowrap animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                                  {Array.from({ length: 30 }, () => Math.random().toString(36)[2]).join('')}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="relative z-10 flex items-center justify-center space-x-4">
                            <div className="text-center">
                              <p className="text-5xl font-black font-mono tracking-widest text-transparent bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text animate-pulse leading-tight">
                                {result.user_id || result.custom_id || 'N/A'}
                              </p>
                              <div className="mt-2 h-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-pulse"></div>
                            </div>

                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(result.custom_id || result.user_id);
                                toast({
                                  title: "🎉 Copied Successfully!",
                                  description: "Your registration ID has been copied to clipboard.",
                                  variant: "default",
                                  duration: 3000
                                });
                              }}
                              className="group p-4 rounded-xl bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 text-white shadow-2xl transform hover:scale-110 transition-all duration-300 animate-bounce"
                              title="Copy to clipboard"
                            >
                              <svg className="h-8 w-8 group-hover:animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                              <span className="sr-only">Copy</span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
                            💾 Save this ID for future reference! 💾
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Use this ID to access your account and track your registration status
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email Confirmation Card */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-300 dark:border-blue-700 shadow-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          📧 Confirmation email sent to:
                        </p>
                        <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                          {formData.email && typeof formData.email === 'string' ? formData.email : 'your email'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submission Status & Logs Card */}
                  <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 shadow-lg">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-green-500 to-blue-500 rounded-t-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">📊 Submission Status</h3>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      {/* Status Timeline */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border-l-4 border-green-500">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-green-800 dark:text-green-300">✅ Form Validation Passed</p>
                            <p className="text-sm text-green-600 dark:text-green-400">All required fields validated successfully</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-blue-800 dark:text-blue-300">📤 Data Submitted Successfully</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">Registration data processed by server</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg border-l-4 border-purple-500">
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center animate-bounce">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-purple-800 dark:text-purple-300">🎯 Account Created</p>
                            <p className="text-sm text-purple-600 dark:text-purple-400">User ID: {result.user_id || result.custom_id || 'Generated'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Submitted Data Summary */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
                        <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          📋 Submitted Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">Name:</span>
                              <span className="text-gray-800 dark:text-gray-200">{getStringValue(formData.full_name)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">Email:</span>
                              <span className="text-gray-800 dark:text-gray-200">{getStringValue(formData.email)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">Phone:</span>
                              <span className="text-gray-800 dark:text-gray-200 font-mono">{getStringValue(formData.phone)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">City:</span>
                              <span className="text-gray-800 dark:text-gray-200">{getStringValue(formData.city)}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">State:</span>
                              <span className="text-gray-800 dark:text-gray-200">{getStringValue(formData.state)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">Role:</span>
                              <span className="text-gray-800 dark:text-gray-200 capitalize">{userType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">Timestamp:</span>
                              <span className="text-gray-800 dark:text-gray-200">{new Date().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                              <span className="text-green-600 dark:text-green-400 font-bold">✅ Success</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* System Response Log */}
                      <div className="mt-4 p-4 bg-black/90 rounded-lg border border-gray-600 font-mono text-sm">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-green-400 font-bold">SYSTEM LOG</span>
                          <div className="flex-1 border-t border-gray-600"></div>
                        </div>
                        <div className="space-y-1 text-gray-300 max-h-32 overflow-y-auto">
                          <div className="text-blue-400">[{new Date().toISOString()}] 🚀 Registration initiated...</div>
                          <div className="text-yellow-400">[{new Date().toISOString()}] ✅ Form validation: PASSED</div>
                          <div className="text-cyan-400">[{new Date().toISOString()}] 📤 Submitting to: /admin/register/{userType}</div>
                          <div className="text-green-400">[{new Date().toISOString()}] 🎯 Server response: 200 OK</div>
                          <div className="text-purple-400">[{new Date().toISOString()}] 💾 User created: ID #{result.user_id || result.custom_id}</div>
                          <div className="text-pink-400">[{new Date().toISOString()}] 📧 Email queued for delivery</div>
                          <div className="text-green-500">[{new Date().toISOString()}] ✨ Registration completed successfully!</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex flex-col space-y-4 pt-6">
                {/* Main Continue Button */}
                <div className="relative">
                  {/* Glowing effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-2xl blur opacity-75 animate-pulse"></div>

                  <button
                    onClick={() => {
                      successToast.dismiss();
                      onGoToLogin();
                    }}
                    className="relative group w-full py-5 px-10 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 hover:from-green-700 hover:via-blue-700 hover:to-purple-700 text-white font-black rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 active:scale-95 overflow-hidden"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                    <div className="relative flex items-center justify-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl animate-bounce">🚀</span>
                        <span className="text-xl font-black tracking-wide">Continue to Login</span>
                        <span className="text-2xl animate-bounce animation-delay-150">✨</span>
                      </div>
                      <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </button>
                </div>

                {/* Secondary Button */}
                <div className="text-center space-y-3">
                  <button
                    onClick={() => {
                      // Resend verification email
                      fetch(`${API_URL}/api/auth/resend-verification`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: formData.email })
                      })
                        .then(() => {
                          toast({
                            title: "📨 Email Resent Successfully!",
                            description: "We've sent another verification email to your inbox.",
                            variant: "default",
                            duration: 3000
                          });
                        })
                        .catch(() => {
                          toast({
                            title: "Failed to Resend",
                            description: "Couldn't resend verification email. Please try again later.",
                            variant: "destructive"
                          });
                        });
                    }}
                    className="group inline-flex items-center space-x-2 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-800 hover:to-purple-800 transition-all duration-300 transform hover:scale-110"
                  >
                    <span className="group-hover:animate-bounce">📧</span>
                    <span className="hover:underline">Didn't receive the email? Resend</span>
                    <span className="group-hover:animate-bounce animation-delay-150">✉️</span>
                  </button>

                  {/* Additional help text */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                    🕐 Email delivery may take up to 5 minutes • Check spam folder
                  </p>
                </div>
              </div>
            </div>
          ),
          variant: successMessages[userType].variant,
          duration: 0, // Don't auto-dismiss
        });

        // Show verification notice after a short delay
        setTimeout(() => {
          toast({
            title: "📧 Verify Your Email Address",
            description: (
              <div className="space-y-2">
                <p>We've sent a verification link to <span className="font-semibold">{formData.email && typeof formData.email === 'string' ? formData.email : 'your email'}</span>.</p>
                <div className="p-3 mt-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <span className="font-semibold">Important:</span> Check your spam/junk folder if you don't see the email.
                  </p>
                </div>
              </div>
            ),
            variant: "default",
            duration: 15000,
            className: 'border-l-4 border-blue-500',
            action: (
              <button
                onClick={() => window.open('https://mail.google.com', '_blank')}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Open Email
              </button>
            )
          });
        }, 1000);

      } catch (error: any) {
        // ⚠️ IMMEDIATE ALERT - Show error popup FIRST before any processing
        window.alert(
          `🚨 REGISTRATION ERROR!\n\n` +
          `Error: ${error.message || 'Unknown error occurred'}\n\n` +
          `Status: ${error.status || 'N/A'}\n\n` +
          `Please check the details and try again.`
        );
        
        console.error(`❌ [${userType.toUpperCase()} REGISTRATION] Registration error:`, error);

        // Dismiss loading toast IMMEDIATELY
        loadingToast.dismiss();

        // Handle specific error cases
        let errorTitle = "❌ Registration Failed";
        let errorMessage = "We couldn't create your account. Please try again.";
        let showRetryButton = true;
        let showLoginLink = false;
        let isBlockingError = false;

        // Check for our custom error properties first
        if (error.status === 400 && error.isEmailConflict) {
          errorTitle = "✋ Email Already Registered";
          errorMessage = error.message || "This email address is already registered. Please use a different email.";
          showRetryButton = false;
          showLoginLink = true;
          isBlockingError = true;
        } else if (error.message && error.message.includes('Registration failed')) {
          // Handle our custom errors from agri_copilot case
          if (error.message.includes('already registered') || error.message.includes('already completed')) {
            errorTitle = "⚠️ EMAIL ALREADY REGISTERED!";
            errorMessage = error.message.replace('Registration failed (400): ', '').replace('Registration already completed for this email', 'This email is already registered in the system.');
            showRetryButton = false;
            showLoginLink = true;
            isBlockingError = true;
            
            // Log clear error for user
            console.error(`\n\n${"=".repeat(80)}`);
            console.error(`⛔ REGISTRATION BLOCKED - ACCOUNT ALREADY EXISTS`);
            console.error(`${"=".repeat(80)}`);
            console.error(`📧 Email: ${formData.email}`);
            console.error(`❌ Error: ${errorMessage}`);
            console.error(`💡 Action: User should login instead of registering`);
            console.error(`${"=".repeat(80)}\n\n`);
            
            // SHOW IMMEDIATE ALERT - Don't wait!
            alert(
              `⛔ EMAIL ALREADY REGISTERED!\n\n` +
              `The email "${formData.email}" is already registered in our system.\n\n` +
              `❌ You cannot register again with this email.\n\n` +
              `Please choose one of the following:\n\n` +
              `✓ LOGIN with your existing credentials\n` +
              `✓ Use "Forgot Password" if you don't remember your password\n` +
              `✓ Use a DIFFERENT email address\n` +
              `✓ Contact support for assistance`
            );
          } else if (error.message.includes('Email already registered')) {
            errorTitle = "✋ Email Already Registered";
            errorMessage = error.message;
            showRetryButton = false;
            showLoginLink = true;
            isBlockingError = true;
          } else if (error.message.includes('Phone already registered')) {
            errorTitle = "✋ Phone Already Registered";
            errorMessage = error.message;
            showRetryButton = false;
            showLoginLink = true;
            isBlockingError = true;
          } else {
            errorMessage = error.message;
          }
        } else if (error.response) {
          const { status, data } = error.response;

          switch (status) {
            case 400:
              errorTitle = "❌ Invalid Information";
              errorMessage = data.detail || "Please check your details and try again.";
              if (data.detail && data.detail.toLowerCase().includes('email already registered')) {
                errorTitle = "✋ Email Already Registered";
                showRetryButton = false;
                showLoginLink = true;
              }
              break;
            case 409:
              errorTitle = "✋ Account Exists";
              errorMessage = "This email is already registered.";
              showRetryButton = false;
              showLoginLink = true;
              break;
            case 422:
              errorTitle = "⚠️ Validation Error";
              errorMessage = "Some information is missing or incorrect. Please check the form and try again.";
              break;
            case 500:
              errorTitle = "🔧 Server Error";
              errorMessage = "We're experiencing technical difficulties. Our team has been notified. Please try again in a few minutes.";
              break;
            case 0:
            case 'NETWORK_ERROR':
              errorTitle = "🌐 Connection Error";
              errorMessage = "Unable to connect to our servers. Please check your internet connection and try again.";
              break;
            case 'TIMEOUT_ERROR':
              errorTitle = "⏱️ Timeout Error";
              errorMessage = "The request took too long. Please check your connection and try again.";
              break;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Create error toast with actions - PROMINENT DISPLAY
        const errorToast = toast({
          title: errorTitle,
          description: (
            <div className="space-y-3">
              <p className="text-sm font-medium">{errorMessage}</p>
              {isBlockingError && (
                <div className="p-3 bg-red-900/50 border-2 border-red-600 rounded-md">
                  <p className="text-sm font-bold text-red-100 mb-2">⛔ CRITICAL ERROR:</p>
                  <p className="text-xs text-red-200 mb-2">
                    This email is already registered in our system. You CANNOT register again with the same email.
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-red-100">
                    <p>✓ Try logging in instead</p>
                    <p>✓ Use "Forgot Password" if needed</p>
                    <p>✓ Or use a different email</p>
                  </div>
                </div>
              )}
            </div>
          ),
          variant: "destructive",
          className: isBlockingError 
            ? 'border-l-8 border-red-600 max-w-lg shadow-2xl bg-red-950' 
            : 'border-l-4 border-red-500 max-w-md',
          duration: isBlockingError ? 20000 : 10000, // Show even longer for blocking errors
          action: (
            <div className="flex flex-col space-y-2">
              {showLoginLink && (
                <button
                  onClick={() => {
                    errorToast.dismiss();
                    onGoToLogin();
                  }}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-lg"
                >
                  ✓ Go to Login Page
                </button>
              )}
              {showRetryButton && (
                <button
                  onClick={() => {
                    errorToast.dismiss();
                  }}
                  className="rounded-md bg-white/20 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  Close
                </button>
              )}
            </div>
          )
        });
      }

    } catch (error: any) {
      console.error(`❌ [${userType.toUpperCase()} REGISTRATION] Registration error:`, error);
      let errorMessage = "An unexpected error occurred during registration. Please try again.";
      let errorField: string | null = null;

      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = "Invalid registration data. Please check all fields and try again.";
            // Try to extract field-specific error
            if (error.response.data?.detail) {
              errorMessage = error.response.data.detail;
            }
            break;
          case 409:
            // Duplicate email or phone
            errorMessage = error.response.data?.detail || "An account with this email or phone already exists.";

            // Determine which field is duplicate
            if (errorMessage.toLowerCase().includes('email')) {
              errorField = 'email';
              setFieldErrors({ email: errorMessage });
              errorMessage = "This email is already registered.";
            } else if (errorMessage.toLowerCase().includes('phone')) {
              errorField = 'phone';
              setFieldErrors({ phone: errorMessage });
              errorMessage = "This phone number is already registered. Please use a different number or login.";
            }
            break;
          case 422:
            errorMessage = "Please verify all required fields are filled correctly.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later or contact support.";
            break;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "❌ Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Scroll to error field if identified
      if (errorField) {
        scrollToField(errorField);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    if (field.type === 'select' && 'options' in field) {
      // Special handling for location fields that use dynamic options
      let optionsToUse = field.options;
      let onChangeHandler = (value: string) => handleSelectChange(field.name, value);
      
      if (field.name === 'country') {
        console.log(`🌍 Rendering country dropdown for ${userType} user type - ${countryOptions.length} countries available`);
        optionsToUse = countryOptions;
        onChangeHandler = (value: string) => {
          console.log('🌍 Country selected in renderField:', value);
          handleSelectChange(field.name, value);
          const states = getStatesForCountry(value);
          console.log('📋 Setting available states from renderField:', states);
          setAvailableStates(states);
          setAvailableCities([{ value: "", label: "🏙️ First select a state" }]);
          setAvailableMandals([{ value: "", label: "🏛️ First select a district" }]);
          // Clear state, city, and mandal when country changes
          setFormData(prev => ({ ...prev, state: '', city: '', mandal: '' }));
        };
      } else if (field.name === 'state') {
        console.log(`🗺️ Rendering state dropdown for ${userType} user type - ${availableStates.length} states available`);
        optionsToUse = availableStates;
        onChangeHandler = (value: string) => {
          console.log('🗺️ State selected in renderField:', value);
          handleSelectChange(field.name, value);
          const cities = getCitiesForState(formData.country as string, value);
          console.log('📋 Setting available cities from renderField:', cities);
          setAvailableCities(cities);
          // Clear city and mandal when state changes
          setFormData(prev => ({ ...prev, city: '', mandal: '' }));
          setAvailableMandals([{ value: "", label: "🏛️ First select a district" }]);
        };
      } else if (field.name === 'city') {
        console.log(`🏙️ Rendering city dropdown for ${userType} user type - ${availableCities.length} cities available`);
        optionsToUse = availableCities;
        onChangeHandler = (value: string) => {
          console.log('🏙️ City selected in renderField:', value);
          handleSelectChange(field.name, value);
          const mandals = getMandalsForDistrict(formData.country as string, formData.state as string, value);
          console.log('🏛️ Setting available mandals from renderField:', mandals);
          setAvailableMandals(mandals);
          // Clear mandal when city changes
          setFormData(prev => ({ ...prev, mandal: '' }));
        };
      } else if (field.name === 'mandal') {
        console.log(`🏛️ Rendering mandal dropdown for ${userType} user type - ${availableMandals.length} mandals available`);
        optionsToUse = availableMandals;
      }
      
      return (
        <Select
          name={`select-${field.name}`}
          value={(typeof formData[field.name] === 'string' ? formData[field.name] : '') as string}
          onValueChange={onChangeHandler}
        >
          <SelectTrigger 
            className={`${inputStyles} h-11`}
            id={field.name}
          >
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent 
            className="max-h-[300px] overflow-y-auto z-50 bg-white"
            position="popper"
            sideOffset={5}
          >
            <SelectGroup>
              {(() => {
                console.log(`🔍 Rendering options for ${field.name}:`, optionsToUse);
                return null;
              })()}
              {optionsToUse
                .filter((option) => {
                  const value = typeof option === 'string' ? option : option.value;
                  return value !== '';
                })
                .map((option) => {
                  const value = typeof option === 'string' ? option : option.value;
                  const label = typeof option === 'string' ? option : option.label;
                  return (
                    <SelectItem key={value} value={value} className="cursor-pointer hover:bg-green-50">
                      {label}
                    </SelectItem>
                  );
                })}
            </SelectGroup>
          </SelectContent>
        </Select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <Textarea
          id={field.name}
          value={(typeof formData[field.name] === 'string' ? formData[field.name] : '') as string}
          onChange={(e) => handleInputChange(field.name, e.target.value)}
          required={field.required}
          className={`min-h-[100px] resize-none ${inputStyles} w-full`}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      );
    }

    // Special handling for password fields to show requirements
    if (field.type === 'password') {
      return (
        <div className="relative">
          <Input
            id={field.name}
            type={showPassword ? 'text' : 'password'}
            value={(typeof formData[field.name] === 'string' ? formData[field.name] : '') as string}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            onFocus={() => setShowPasswordRequirements(true)}
            onBlur={(e) => {
              // Only hide if not hovering and not focusing on the tooltip itself
              setTimeout(() => setShowPasswordRequirements(false), 100);
            }}
            onMouseEnter={() => setShowPasswordRequirements(true)}
            onMouseLeave={(e) => {
              // Only hide if the field is not focused
              if (document.activeElement !== e.target) {
                setShowPasswordRequirements(false);
              }
            }}
            required={field.required}
            className={`${inputStyles} h-11 pr-10`}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            autoComplete="new-password"
          />
          {/* Show/Hide Password Toggle Button */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
          {/* Password requirements tooltip */}
          <PasswordRequirements password={String(formData[field.name] || '')} show={showPasswordRequirements} />
        </div>
      );
    }

    // Special handling for phone field (by name or type)
    if (field.name === 'phone' || field.type === 'tel') {
      const stringValue = (typeof formData[field.name] === 'string' ? formData[field.name] : '') as string;
      return (
        <div key={field.name}>
          <Input
            type="tel"
            id={field.name}
            name={field.name}
            value={stringValue}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={`${inputStyles} h-11`}
            required={field.required}
            placeholder="+91 XXXXX XXXXX"
            {...('pattern' in field && field.pattern ? { pattern: field.pattern } : {})}
            {...('title' in field && field.title ? { title: field.title } : {})}
          />
          {stringValue && (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-green-600 font-medium">
                📱 Formatted: {stringValue}
              </div>
              <div className="text-xs text-blue-600">
                📤 Will be submitted as: {formatPhoneNumber(stringValue)}
              </div>
            </div>
          )}
          <div className="mt-1 text-xs text-gray-600">
            💡 Enter 10-digit Indian mobile number (starts with 6-9). Format: +91 XXXXX XXXXX
          </div>
        </div>
      );
    }

    // This is the modified part for all other inputs, including files
    return (
      <div>
        <Input
          id={field.name}
          type={field.type}
          // For file inputs, we don't control the value. For others, we do.
          value={field.type === 'file' ? undefined : (typeof formData[field.name] === 'string' ? formData[field.name] : '') as string}
          // Use the correct handler based on the input type
          onChange={(e) => {
            if (field.type === 'file') {
              handleFileChange(field.name, e.target.files ? e.target.files[0] : null);
            } else {
              handleInputChange(field.name, e.target.value);
            }
          }}
          required={field.required}
          className={`${inputStyles} h-11 ${fileErrors[field.name] ? 'border-red-500 focus:ring-red-500' : ''}`}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          {...(field.type === 'number' ? { min: "0", step: "any" } : {})}
          {...(field.type === 'email' ? { autoComplete: "email" } : {})}
          {...('pattern' in field && field.pattern ? { pattern: field.pattern } : {})}
          {...('title' in field && field.title ? { title: field.title } : {})}
        />
        {field.type === 'file' && fileErrors[field.name] && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800 whitespace-pre-line">
                  {fileErrors[field.name]}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <SuccessAnimation
        show={showSuccessAnimation}
        onClose={() => setShowSuccessAnimation(false)}
      />
      <div className="max-w-full mx-auto">
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className={`transition-all duration-300 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {config.fields.map((field) => (
              <div
                key={field.name}
                className={`space-y-1 ${field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}`}
              >
                <Label
                  htmlFor={field.name}
                  className="block text-sm font-medium text-gray-700"
                >
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </Label>
                {renderField(field as FormField)}
              </div>
            ))}
          </div>

          <div className="flex items-start space-x-3 mt-6 col-span-1 md:col-span-2 lg:col-span-3 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg hover:border-yellow-400 transition-all">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              className="mt-1 h-5 w-5 border-2 border-yellow-600 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=checked]:text-white"
            />
            <Label
              htmlFor="terms"
              className="text-sm text-gray-800 leading-tight cursor-pointer font-medium"
            >
              <span className="text-red-600 font-bold text-base">* </span>
              I agree to the <a href="/terms" target="_blank" className="text-green-600 hover:underline font-semibold">Terms and Conditions</a> and{' '}
              <a href="/privacy" target="_blank" className="text-green-600 hover:underline font-semibold">Privacy Policy</a>
              <span className="block mt-1 text-xs text-gray-600 italic">
                ⚠️ Required: You must accept the terms before submitting the registration form
              </span>
            </Label>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-4">
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-sm font-medium rounded-md transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Submit'}
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={onGoToLogin}
              className="text-green-600 hover:text-green-700 font-medium hover:underline focus:outline-none"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Removed duplicate RegistrationForm export to fix redeclaration error

// NOTE: ToastAction, ToastClose, ToastTitle, ToastDescription were not used in the original code,
// but are included here for completeness of the inlined toast component.
const ToastAction = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Action>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>>(({ className, ...props }, ref) => (<ToastPrimitives.Action ref={ref} className={cn("inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive", className)} {...props} />));
ToastAction.displayName = ToastPrimitives.Action.displayName;
const ToastClose = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Close>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>>(({ className, ...props }, ref) => (<ToastPrimitives.Close ref={ref} className={cn("absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600", className)} toast-close="" {...props}> <X className="h-4 w-4" /> </ToastPrimitives.Close>));
ToastClose.displayName = ToastPrimitives.Close.displayName;
const ToastTitle = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Title>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>>(({ className, ...props }, ref) => (<ToastPrimitives.Title ref={ref} className={cn("text-sm font-semibold", className)} {...props} />));
ToastTitle.displayName = ToastPrimitives.Title.displayName;
const ToastDescription = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Description>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>>(({ className, ...props }, ref) => (<ToastPrimitives.Description ref={ref} className={cn("text-sm opacity-90", className)} {...props} />));
ToastDescription.displayName = ToastPrimitives.Description.displayName;
