import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';

interface NutrientData {
  name: string;
  telugu: string;
  current: number;
  required: number;
  deficiency: number;
  application: string;
  cost: string;
  timing: string;
  status: 'urgent' | 'moderate' | 'low';
}

interface AnalysisCardProps {
  data: NutrientData;
  isLoading?: boolean;
  error?: string;
}

export function AnalysisCard({ data, isLoading, error }: AnalysisCardProps) {
  if (isLoading) {
    return (
      <Card className="w-full bg-white/50 backdrop-blur-sm border-muted">
        <CardHeader className="space-y-1 animate-pulse">
          <div className="h-6 w-3/4 bg-muted rounded"></div>
          <div className="h-4 w-1/2 bg-muted rounded"></div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-3/4 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full bg-destructive/10 border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const statusColors = {
    urgent: 'bg-red-100 text-red-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  return (
    <Card className="w-full bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold">{data.name}</CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground">
              {data.telugu}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`${statusColors[data.status]} border-0`}
          >
            {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current Level</span>
            <span className="font-medium">{data.current.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Required Level</span>
            <span className="font-medium">{data.required.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Deficiency</span>
            <span className="font-medium">{data.deficiency.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <p><strong>Recommendation:</strong> {data.application}</p>
          <p><strong>Timing:</strong> {data.timing}</p>
          <p><strong>Estimated Cost:</strong> {data.cost}</p>
        </div>
      </CardContent>
    </Card>
  );
}

