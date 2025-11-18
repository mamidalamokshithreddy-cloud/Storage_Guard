"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { MapPin, Satellite } from "lucide-react";

export default function SatelliteView() {
	const params = useSearchParams();
	const area = params.get("area") || "-";
	const cultivable = params.get("cultivable") || "-";
	const ne = params.get("ne") || "-";
	const nw = params.get("nw") || "-";
	const se = params.get("se") || "-";
	const sw = params.get("sw") || "-";

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-6">
			<Card className="max-w-xl w-full shadow-lg">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Satellite className="w-6 h-6 text-primary" />
						Satellite View - Land Details
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="mb-4">
						<h3 className="font-semibold mb-2">GPS Coordinates</h3>
						<div className="text-sm space-y-1 font-mono">
							<p>NE: {ne}</p>
							<p>NW: {nw}</p>
							<p>SE: {se}</p>
							<p>SW: {sw}</p>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4 mb-4">
						<div className="p-3 bg-primary/10 rounded-lg text-center">
							<p className="text-sm text-muted-foreground">Total Area</p>
							<p className="text-lg font-bold text-primary">{area} acres</p>
						</div>
						<div className="p-3 bg-success/10 rounded-lg text-center">
							<p className="text-sm text-muted-foreground">Cultivable</p>
							<p className="text-lg font-bold text-success">{cultivable} acres</p>
						</div>
					</div>
					<div className="mt-6 text-center">
						<MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
						<p className="text-md font-medium">Satellite imagery and mapping features coming soon!</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}