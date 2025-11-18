import { Badge } from "@/app/farmer/ui/badge";
import { Progress } from "@/app/farmer/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/farmer/ui/card";
import { AlertCircle, Bug } from "lucide-react";
import { Button } from "@/app/farmer/ui/button";

interface PestDetectionProps {
  loading: boolean;
  error: string | null;
  pestData: any;
  onRetry: () => void;
}

const PestDetectionAnalysis = ({ loading, error, pestData, onRetry }: PestDetectionProps) => {
  const getStatusColor = (status: string): "destructive" | "secondary" | "default" | "outline" => {
    switch(status) {
      case 'urgent': return 'destructive';
      case 'moderate': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="agri-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-primary" />
          Pest Detection Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {loading && (
          <div className="p-6 border border-primary/20 rounded-lg bg-primary/5">
            <div className="flex flex-col items-center text-center">
              <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="font-medium text-lg mb-2">Analyzing Pest Images</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Our AI is analyzing your crop images to detect pests and assess damage levels...
              </p>
              <div className="w-full max-w-xs mt-4">
                <Progress value={45} />
                <p className="text-xs text-muted-foreground mt-2">Pest Detection in Progress</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Analysis Failed</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={onRetry}
                >
                  Retry Analysis
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {!loading && !error && pestData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pestData.map((pest: any, index: number) => (
              <div key={index} className="p-4 border border-border rounded-lg bg-muted/30">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-semibold">{pest.name}</h3>
                    <p className="text-sm text-accent font-medium">{pest.telugu}</p>
                  </div>
                  <Badge variant={getStatusColor(pest.status)}>
                    {pest.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Severity Level: {pest.current}%</span>
                    <span>Confidence: {pest.details?.confidence}</span>
                  </div>
                  
                  <Progress 
                    value={pest.current} 
                    className={`h-2 ${
                      pest.status === 'urgent' ? 'bg-destructive' : 
                      pest.status === 'moderate' ? 'bg-warning' : 
                      'bg-success'
                    }`}
                  />
                  
                  <div className="text-xs font-semibold flex justify-between">
                    <span>Location: {pest.details?.location}</span>
                    <span className={
                      pest.status === 'urgent' ? 'text-destructive' :
                      pest.status === 'moderate' ? 'text-warning' :
                      'text-success'
                    }>
                      Impact: {pest.details?.impact}
                    </span>
                  </div>
                  
                  <div className="p-3 bg-gradient-field rounded border border-primary/20">
                    <p className="font-semibold text-sm">{pest.application}</p>
                    <div className="flex justify-between text-xs mt-1">
                      <span>Estimated Cost: {pest.cost || 'Contact for pricing'}</span>
                      <span>Treatment Timing: {pest.timing}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && (!pestData || pestData.length === 0) && (
          <div className="p-6 border border-border rounded-lg bg-muted/5 text-center">
            <Bug className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">No Pest Detection Data</p>
            <p className="text-sm text-muted-foreground mb-3">
              Upload crop images to analyze for pest detection and damage assessment.
            </p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Start New Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PestDetectionAnalysis;