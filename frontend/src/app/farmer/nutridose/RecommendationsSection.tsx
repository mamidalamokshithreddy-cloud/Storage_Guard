import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

interface RecommendationProps {
  data?: {
    success?: boolean;
    recommendations?: any[];
    fertilizer_plan?: any[];
  };
  loading?: boolean;
}

export function RecommendationsSection({ data, loading }: RecommendationProps) {
  const defaultPlan = [{
    type: 'basal',
    name: 'NPK Complex',
    rate: '150 kg/ha',
    timing: 'Pre-sowing',
    method: 'Broadcasting',
    status: 'recommended'
  }];

  const plans = data?.fertilizer_plan || defaultPlan;

  return (
    <Card className="agri-card">
      <CardHeader>
        <CardTitle>Fertilizer Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading recommendations...
            </div>
          ) : (
            plans.map((plan, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  plan.type === 'basal'
                    ? 'bg-success/10 border-success/20'
                    : 'bg-warning/10 border-warning/20'
                }`}
              >
                <h4
                  className={`font-semibold mb-2 ${
                    plan.type === 'basal' ? 'text-success' : 'text-warning'
                  }`}
                >
                  {plan.name || plan.product_name || `Application ${index + 1}`}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Application Rate:</span>
                    <span className="font-semibold">
                      {plan.rate || plan.application_rate || 'Standard Rate'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timing:</span>
                    <span className="font-semibold">
                      {plan.timing || plan.application_timing || 'As scheduled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span className="font-semibold">
                      {plan.method || plan.application_method || 'Standard'}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <Badge
                    variant={plan.status === 'recommended' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {plan.status || 'Recommended'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}