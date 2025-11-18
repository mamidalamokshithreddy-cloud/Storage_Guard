import { useRouter, usePathname } from "next/navigation";
import {
	Sprout, Map, TestTube, Droplets, Shield, Tractor, ShoppingCart, Users,
	ChevronLeft, ChevronRight, Beaker, Package, Award, Truck, Star, Building,
	CalendarDays, Settings, Bell, ClipboardCheck
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useState } from "react";

const agriAgents = [
	{
		name: "Land Mapping",
		telugu: "భూమి మ్యాపింగ్",
		icon: Map,
		route: "/farmer/landmapping",
		description: "Precision land boundary mapping",
	},
	{
		name: "SoilSense",
		telugu: "మట్టి విశ్లేషణ",
		icon: TestTube,
		route: "/farmer/soil-sense",
		description: "Advanced soil health analysis",
	},
	{
		name: "SeedPlanner",
		telugu: "విత్తన ప్లానింగ్",
		icon: Sprout,
		route: "/farmer/seed-planner",
		description: "Smart crop and seed selection",
	},
	{
		name: "AquaGuide",
		telugu: "నీటిపారుదల",
		icon: Droplets,
		route: "/farmer/aqua guide",
		description: "Intelligent irrigation scheduling",
		subRoutes: [
			{
				name: "Scheduling",
				route: "/farmer/aqua guide/scheduling",
				icon: CalendarDays,
			},
			{
				name: "Equipment",
				route: "/farmer/aqua guide/equipment",
				icon: Settings,
			},
			{
				name: "Alerts",
				route: "/farmer/aqua guide/alerts",
				icon: Bell,
			},
			{
				name: "Compliance",
				route: "/farmer/aqua guide/compliance",
				icon: ClipboardCheck,
			},
		],
	},
	{
		name: "CropShield",
		telugu: "పంట రక్షణ",
		icon: Shield,
		route: "/farmer/cropshield",
		description: "Pest and disease detection",
	},
	{
		name: "NutriDose",
		telugu: "పోషకాలు",
		icon: Beaker,
		route: "/farmer/nutridose",
		description: "Nutrition management system",
	},
	{
		name: "HarvestBot",
		telugu: "కోత యంత్రం",
		icon: Tractor,
		route: "/farmer/harvestbot",
		description: "Automated harvest planning",
	},
	{
		name: "StorageGuard",
		telugu: "నిల్వ రక్షణ",
		icon: Building,
		route: "/farmer/storageguard",
		description: "Post-harvest storage management",
	},
	{
		name: "MarketConnect",
		telugu: "మార్కెట్ కనెక్ట్",
		icon: ShoppingCart,
		route: "/farmer/marketconnect",
		description: "Connect with buyers",
	},
];

const agriHubExtension = [
	{
		name: "Processing Hub",
		telugu: "ప్రాసెసింగ్ హబ్",
		icon: Package,
		route: "/farmer/processinghub",
		description: "AI-powered food processing",
		services: [
			{
				title: "AI Grading Consultation",
				titleTelugu: "AI గ్రేడింగ్ సలహా",
				description: "Automated quality grading and sorting guidance",
				descriptionTelugu: "ఆటోమేటెడ్ నాణ్యత గ్రేడింగ్ మరియు మార్గదర్శనం",
				duration: "1 hour",
				price: "₹800",
				icon: Package,
				available: true,
			},
			{
				title: "Cold Storage Setup",
				titleTelugu: "కోల్డ్ స్టోరేజ్ సెటప్",
				description: "Professional cold storage planning and setup",
				descriptionTelugu: "వృత్తిపరమైన కోల్డ్ స్టోరేజ్ ప్రణాళిక మరియు సెటప్",
				duration: "2 hours",
				price: "₹1,500",
				icon: Package,
				available: true,
			},
		],
	},
	{
		name: "Quality Assurance",
		telugu: "నాణ్యత హామీ",
		icon: Award,
		route: "/farmer/qualityassurance",
		description: "Blockchain certification",
		services: [
			{
				title: "Blockchain Certification",
				titleTelugu: "బ్లాక్‌చైన్ సర్టిఫికేషన్",
				description: "Secure blockchain-based quality certification",
				descriptionTelugu: "సురక్షిత బ్లాక్‌చైన్ ఆధారిత నాణ్యత ధృవీకరణ",
				duration: "1.5 hours",
				price: "₹1,200",
				icon: Award,
				available: true,
			},
			{
				title: "Lab Testing Coordination",
				titleTelugu: "ల్యాబ్ టెస్టింగ్ కోఆర్డినేషన్",
				description: "Professional lab testing and report analysis",
				descriptionTelugu: "వృత్తిపరమైన ల్యాబ్ టెస్టింగ్ మరియు రిపోర్ట్ విశ్లేషణ",
				duration: "2 hours",
				price: "₹2,000",
				icon: Award,
				available: true,
			},
		],
	},
	{
		name: "Packaging & Branding",
		telugu: "ప్యాకేజింగ్",
		icon: Package,
		route: "/farmer/packagingbranding",
		description: "Eco-friendly packaging",
		services: [
			{
				title: "Custom Branding Design",
				titleTelugu: "కస్టమ్ బ్రాండింగ్ డిజైన్",
				description: "Professional farm logo and packaging design",
				descriptionTelugu: "వృత్తిపరమైన ఫార్మ్ లోగో మరియు ప్యాకేజింగ్ డిజైన్",
				duration: "2 hours",
				price: "₹1,800",
				icon: Package,
				available: true,
			},
			{
				title: "QR Code Generation",
				titleTelugu: "QR కోడ్ జనరేషన్",
				description: "Blockchain QR codes for complete traceability",
				descriptionTelugu: "పూర్తి ట్రేసబిలిటీ కోసం బ్లాక్‌చైన్ QR కోడ్‌లు",
				duration: "30 minutes",
				price: "₹500",
				icon: Package,
				available: true,
			},
		],
	},
	{
		name: "Consumer Delivery",
		telugu: "డెలివరీ",
		icon: Truck,
		route: "/farmer/consumer-delivery",
		description: "Direct farm-to-consumer",
		services: [
			{
				title: "Delivery Route Optimization",
				titleTelugu: "డెలివరీ రూట్ ఆప్టిమైజేషన్",
				description:
					"AI-powered delivery route planning and cost optimization",
				descriptionTelugu:
					"AI ఆధారిత డెలివరీ రూట్ ప్రణాళిక మరియు వ్యయ ఆప్టిమైజేషన్",
				duration: "1 hour",
				price: "₹1,000",
				icon: Truck,
				available: true,
			},
			{
				title: "Cold Chain Setup",
				titleTelugu: "కోల్డ్ చైన్ సెటప్",
				description: "Professional cold chain delivery system setup",
				descriptionTelugu: "వృత్తిపరమైన కోల్డ్ చైన్ డెలివరీ సిస్టమ్ సెటప్",
				duration: "3 hours",
				price: "₹2,500",
				icon: Truck,
				available: true,
			},
		],
	},
	{
		name: "Consumer Feedback",
		telugu: "ప్రతిస్పందన",
		icon: Star,
		route: "/farmer/consumer-feedback",
		description: "AI-powered analytics",
		services: [
			{
				title: "Demand Analytics Consultation",
				titleTelugu: "డిమాండ్ అనలిటిక్స్ సలహా",
				description:
					"AI-powered consumer demand analysis and crop recommendations",
				descriptionTelugu:
					"AI ఆధారిత వినియోగదారుల డిమాండ్ విశ్లేషణ మరియు పంట సిఫార్సులు",
				duration: "1.5 hours",
				price: "₹1,500",
				icon: Star,
				available: true,
			},
			{
				title: "Market Research Setup",
				titleTelugu: "మార్కెట్ రిసెర్చ్ సెటప్",
				description:
					"Consumer feedback collection and analysis system setup",
				descriptionTelugu:
					"వినియోగదారుల ఫీడ్‌బ్యాక్ సేకరణ మరియు విశ్లేషణ సిస్టమ్ సెటప్",
				duration: "2 hours",
				price: "₹2,000",
				icon: Star,
				available: true,
			},
		],
	},
];

interface AgriAgentsSidebarProps {
	onCollapsedChange?: (collapsed: boolean) => void;
	onModuleSelect?: (moduleName: string) => void;
	selectedModule?: string;
}

const AgriAgentsSidebar = ({ onCollapsedChange, onModuleSelect, selectedModule }: AgriAgentsSidebarProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const [collapsed, setCollapsed] = useState(false);

	// Notify parent component when collapsed state changes
	const handleCollapsedChange = (newCollapsed: boolean) => {
		setCollapsed(newCollapsed);
		onCollapsedChange?.(newCollapsed);
	};

	// Handle module selection - prefer module selection over navigation
	const handleNavigation = (path: string, moduleName?: string) => {
		if (onModuleSelect && moduleName) {
			// Use module selection for single-frame navigation
			onModuleSelect(moduleName);
		} else {
			// Fallback to router navigation
			router.push(path);
		}
	};

	// Check if the current path matches or is a sub-route
	const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

	return (
		<div
			className={`${collapsed ? "w-16" : "w-80"
				} transition-all duration-300 h-full bg-card/95 backdrop-blur-sm border-r border-border flex flex-col shadow-lg`}
		>
			{/* Header */}
			<div className="p-4 border-b border-border flex items-center justify-between bg-background/50">
				{!collapsed && (
					<div className="flex items-center gap-2 sm:gap-3">
						<img
							src="https://d31peof2ddba0t.cloudfront.net/kpweb/web/assets/img/kp_logo.png"
							alt="KP Logo"
							className="h-6 w-6 sm:h-8 sm:w-8 object-contain"
						/>
						<h2 className="text-sm sm:text-lg font-bold text-foreground">
							AI Agents | ఏజెంట్లు
						</h2>
					</div>
				)}
				<Button
					variant="ghost"
					size="sm"
					onClick={() => handleCollapsedChange(!collapsed)}
					className="p-2 hover:bg-accent"
				>
					{collapsed ? (
						<ChevronRight className="w-4 h-4" />
					) : (
						<ChevronLeft className="w-4 h-4" />
					)}
				</Button>
			</div>

			{/* Agents List */}
			<div className="flex-1 overflow-y-auto p-2 space-y-4">
				{/* Main AI Agents */}
				<div className="space-y-2">
					{!collapsed && (
						<div className="px-2 py-1">
							<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
								Core Agents
							</h3>
						</div>
					)}
					{agriAgents.map((agent) => {
						const IconComponent = agent.icon;
						const active = isActive(agent.route);

						return (
							<div key={agent.route} className="space-y-1">
								<Card
									className={`cursor-pointer transition-all duration-200 border hover:shadow-md ${active || selectedModule === agent.name
											? "bg-primary/10 border-primary shadow-md ring-1 ring-primary/20"
											: "bg-card hover:bg-accent/50 border-border"
										}`}
									onClick={() => handleNavigation(agent.route, agent.name)}
								>
									<div className={`p-3 ${collapsed ? 'p-2' : ''}`}>
										<div className="flex items-center gap-3">
											<div
												className={`${collapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg flex items-center justify-center transition-all ${active
														? "bg-primary text-primary-foreground"
														: "bg-gradient-to-br from-primary to-accent text-white"
													}`}
											>
												<IconComponent className={`${collapsed ? 'w-4 h-4' : 'w-5 h-5'} transition-all`} />
											</div>

											{!collapsed && (
												<div className="flex-1 min-w-0">
													<h3
														className={`font-semibold text-sm transition-colors ${active
																? "text-primary"
																: "text-foreground"
															}`}
													>
														{agent.name}
													</h3>
													<p className="text-xs text-accent font-medium truncate">
														{agent.telugu}
													</p>
													<p className="text-xs text-muted-foreground mt-1 truncate">
														{agent.description}
													</p>
												</div>
											)}
										</div>
									</div>
								</Card>

								{/* Sub-routes */}
								{!collapsed && agent.subRoutes && active && (
									<div className="pl-4 space-y-1">
										{agent.subRoutes.map((subRoute) => {
											const SubIcon = subRoute.icon;
											const isSubRouteActive = pathname === subRoute.route;

											return (
												<Card
													key={subRoute.route}
													className={`cursor-pointer transition-all duration-200 border hover:shadow-sm ${isSubRouteActive
															? "bg-primary/5 border-primary/30"
															: "bg-card/50 hover:bg-accent/30 border-border/50"
														}`}
													onClick={() => handleNavigation(subRoute.route)}
												>
													<div className="p-2">
														<div className="flex items-center gap-2">
															<div
																className={`w-6 h-6 rounded flex items-center justify-center transition-all ${isSubRouteActive
																		? "text-primary"
																		: "text-muted-foreground"
																	}`}
															>
																<SubIcon className="w-4 h-4" />
															</div>
															<span className={`text-xs ${isSubRouteActive
																	? "font-medium text-primary"
																	: "text-muted-foreground"
																}`}>
																{subRoute.name}
															</span>
														</div>
													</div>
												</Card>
											);
										})}
									</div>
								)}
							</div>
						);
					})}
				</div>

				{/* AgriHub Extension */}
				<div className="space-y-2">
					{!collapsed && (
						<div className="px-2 py-1">
							<div className="flex items-center gap-2">
								<h3 className="text-xs font-semibold text-green-600 uppercase tracking-wider">
									Farm-to-Consumer 🌾
								</h3>
								<span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">
									NEW
								</span>
							</div>
						</div>
					)}
					{agriHubExtension.map((agent) => {
						const IconComponent = agent.icon;
						const active = isActive(agent.route);

						return (
							<Card
								key={agent.route}
								className={`cursor-pointer transition-all duration-200 border hover:shadow-md ${active || selectedModule === agent.name
										? "bg-green-50 border-green-300 shadow-md ring-1 ring-green-300"
										: "bg-card hover:bg-green-50/50 border-green-200 hover:border-green-300"
									} ${collapsed ? 'p-1' : ''}`}
								onClick={() => handleNavigation(agent.route, agent.name)}
							>
								<div className={`${collapsed ? 'p-1' : 'p-3'} transition-all`}>
									<div className="flex items-center gap-3 justify-center">
										<div
											className={`${collapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg flex items-center justify-center transition-all ${active
													? "bg-green-500 text-white"
													: "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
												}`}
										>
											<IconComponent className={`${collapsed ? 'w-4 h-4' : 'w-5 h-5'} transition-all`} />
										</div>

										{!collapsed && (
											<div className="flex-1 min-w-0">
												<h3
													className={`font-semibold text-sm transition-colors ${active
															? "text-green-700"
															: "text-foreground"
														}`}
												>
													{agent.name}
												</h3>
												<p className="text-xs text-green-600 font-medium truncate">
													{agent.telugu}
												</p>
												<p className="text-xs text-muted-foreground mt-1 truncate">
													{agent.description}
												</p>
											</div>
										)}
									</div>
								</div>
							</Card>
						);
					})}
				</div>
			</div>

			{/* Footer */}
			<div className="p-4 border-t border-border bg-background/50">
				<Button
					onClick={() => handleNavigation("/farmer")}
					variant="outline"
					className={`${collapsed ? "p-2" : "w-full"
						} border-border hover:bg-accent`}
				>
					{collapsed ? "🏠" : "🏠 Back to Dashboard"}
				</Button>
			</div>
		</div>
	);
};

export default AgriAgentsSidebar;