'use client';

import React from 'react';
import { Card } from '../ui/card';
import { Droplets, TrendingDown, TrendingUp, Cloud, Clock, Target, Leaf, AlertTriangle } from 'lucide-react';
// Simple local replacement for the missing hook.
// Provides a lightweight mock implementation so the dashboard can render.
// Replace with your real hook implementation or restore the original import when available.
const useEnhancedIrrigation = () => {
  const [analysis, setAnalysis] = React.useState<any | null>(null);
  const [plots] = React.useState(() => [
    { id: '1', name: 'Plot A', cropType: 'Rice' },
    { id: '2', name: 'Plot B', cropType: 'Wheat' },
  ]);
  const [selectedPlotId, setSelectedPlotId] = React.useState<string | null>(plots[0].id);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const mock = {
    analysis_timestamp: new Date().toISOString(),
    plot_data: {
      efficiency_metrics: {
        efficiency_rate: { percentage: 72 },
      },
    },
    ai_recommendations: {
      summary: 'అందుబాటులో ఉన్న డేటా ఆధారంగా నీటిపారుదల సముచితంగా ఉంది.',
      priority_actions: [{ action: 'శీతలరిచిన సమయంలో నీటిపారుదల పెంచండి' }],
      confidence_score: 0.87,
    },
  };

  const waterMetrics = {
    totalWaterUsed: '1,200 L',
    weeklyChange: '-8%',
    efficiency: '72%',
    costSavings: '₹ 450',
  };

  const soilMetrics = {
    moisture: '35',
    ph: '6.8',
    nitrogen: '25',
    phosphorus: '12',
    potassium: '180',
  };

  const weatherData = {
    temperature: 28,
    humidity: 65,
    rainChance: 20,
    current: 'Partly Cloudy',
    recommendation: 'రేపటికి తక్కువ వర్షం ఉందని, రోజు తనికీ నీటిపారుదల అవసరం ఉంటుంది.',
  };

  const scheduleData = {
    dailyRequirement: 400,
    sessions: 2,
    timing: [
      { time: '06:00', zone: 'Zone 1' },
      { time: '18:00', zone: 'Zone 1' },
    ],
  };

  React.useEffect(() => {
    // simulate fetch
    const t = setTimeout(() => {
      setAnalysis(mock);
      setLoading(false);
    }, 400);

    return () => clearTimeout(t);
  }, [mock]);

  const selectPlot = (id: string) => {
    setSelectedPlotId(id || null);
    // In a real hook you'd refetch analysis for the selected plot
  };

  const refreshAnalysis = () => {
    setLoading(true);
    setError(null);
    // simulate refresh
    setTimeout(() => {
      setAnalysis({ ...mock, analysis_timestamp: new Date().toISOString() });
      setLoading(false);
    }, 400);
  };

  return {
    analysis,
    plots,
    selectedPlotId,
    loading,
    error,
    selectPlot,
    refreshAnalysis,
    waterMetrics,
    soilMetrics,
    weatherData,
    scheduleData,
  };
};

interface WaterMetricProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  status?: 'normal' | 'warning' | 'critical';
}

const WaterMetric: React.FC<WaterMetricProps> = ({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon, 
  status = 'normal' 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  return (
    <Card className={`relative overflow-hidden border ${getStatusColor()}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg ${getStatusColor()}`}>
            {icon}
          </div>
          {status === 'critical' && (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{value}</p>
            {getTrendIcon()}
          </div>
          {change && (
            <p className="text-sm text-gray-500">{change}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

const EnhancedIrrigationDashboard: React.FC = () => {
  const {
    analysis,
    plots,
    selectedPlotId,
    loading,
    error,
    selectPlot,
    refreshAnalysis,
    waterMetrics,
    soilMetrics,
    weatherData,
    scheduleData
  } = useEnhancedIrrigation();

  if (loading && !analysis) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">నీటిపారుదల డేటా లోడ్ చేస్తున్నాం...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-red-200 bg-red-50">
          <div className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">డేటా లోడ్ చేయడంలో సమస్య</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={refreshAnalysis} 
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-100"
              >
                మళ్లీ ప్రయత్నించండి
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const getSoilMoistureStatus = () => {
    if (!soilMetrics) return 'normal';
    const moisture = parseInt(soilMetrics.moisture);
    if (moisture < 20) return 'critical';
    if (moisture < 30) return 'warning';
    return 'normal';
  };

  const getEfficiencyStatus = () => {
    if (!analysis) return 'normal';
    const efficiency = analysis.plot_data.efficiency_metrics.efficiency_rate.percentage;
    if (efficiency < 30) return 'critical';
    if (efficiency < 60) return 'warning';
    return 'normal';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">నీటిపారుదల డాష్‌బోర్డ్</h1>
          <p className="text-gray-600">తెలివైన నీటిపారుదల నిర్వహణ మరియు పర్యవేక్షణ</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={selectedPlotId || ''} 
            onChange={(e) => selectPlot(e.target.value)}
            className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ప్లాట్ ఎంచుకోండి</option>
            {plots.map((plot) => (
              <option key={plot.id} value={plot.id}>
                {plot.name} - {plot.cropType}
              </option>
            ))}
          </select>
          
          <button 
            onClick={refreshAnalysis} 
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            రిఫ్రెష్ చేయండి
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <WaterMetric
            title="మొత్తం నీటి వినియోగం"
            value={waterMetrics?.totalWaterUsed || 'N/A'}
            change={waterMetrics?.weeklyChange || ''}
            trend="down"
            icon={<Droplets className="w-6 h-6" />}
          />
          
          <WaterMetric
            title="సామర్థ్య రేటు"
            value={waterMetrics?.efficiency || 'N/A'}
            icon={<Target className="w-6 h-6" />}
            status={getEfficiencyStatus()}
          />
          
          <WaterMetric
            title="ఖర్చు ఆదా"
            value={waterMetrics?.costSavings || 'N/A'}
            icon={<TrendingUp className="w-6 h-6" />}
          />
          
          <WaterMetric
            title="మట్టి తేమ"
            value={soilMetrics?.moisture || 'N/A'}
            icon={<Leaf className="w-6 h-6" />}
            status={getSoilMoistureStatus()}
          />
        </div>
      )}

      {/* Detailed Analytics */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weather Integration */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                వాతావరణ స్థితి
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">ప్రస్తుత ఉష్ణోగ్రత</p>
                    <p className="text-xl font-semibold">{weatherData?.temperature}°C</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">తేమ</p>
                    <p className="text-xl font-semibold">{weatherData?.humidity}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">వర్షం అవకాశం</p>
                    <p className="text-xl font-semibold">{weatherData?.rainChance}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">పరిస్థితి</p>
                    <p className="text-xl font-semibold">{weatherData?.current}</p>
                  </div>
                </div>
                
                {weatherData?.recommendation && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800">సిఫార్సు:</p>
                    <p className="text-sm text-blue-700">{weatherData.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Soil Analysis */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5" />
                మట్టి విశ్లేషణ
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">pH స్థాయి</p>
                    <p className="text-xl font-semibold">{soilMetrics?.ph}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">తేమ స్థాయి</p>
                    <p className="text-xl font-semibold">{soilMetrics?.moisture}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">నత్రజని (N)</p>
                    <p className="text-xl font-semibold">{soilMetrics?.nitrogen} mg/kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">భాస్వరం (P)</p>
                    <p className="text-xl font-semibold">{soilMetrics?.phosphorus} mg/kg</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">పొటాషియం (K)</p>
                  <p className="text-xl font-semibold">{soilMetrics?.potassium} mg/kg</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Daily Schedule */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                నేటి నీటిపారుదల షెడ్యూల్
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">రోజువారీ అవసరం</p>
                    <p className="text-xl font-semibold">{scheduleData?.dailyRequirement} L</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">సెషన్లు</p>
                    <p className="text-xl font-semibold">{scheduleData?.sessions}</p>
                  </div>
                </div>
                
                {scheduleData?.timing && scheduleData.timing.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">సరైన సమయాలు:</p>
                    <div className="flex flex-wrap gap-2">
                      {scheduleData.timing.map((timeSlot, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                        >
                          {timeSlot.time} - {timeSlot.zone}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* AI Recommendations */}
          {analysis.ai_recommendations && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  AI సిఫార్సులు
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">సారాంశం:</p>
                    <p className="text-sm text-gray-600">{analysis.ai_recommendations.summary}</p>
                  </div>
                  
                  {analysis.ai_recommendations.priority_actions && 
                   analysis.ai_recommendations.priority_actions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">ప్రాధాన్య చర్యలు:</p>
                      <ul className="space-y-1">
                        {analysis.ai_recommendations.priority_actions.map((actionItem: { action: string }, index: number) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            {actionItem.action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600">విశ్వాసం స్కోర్:</p>
                    <span className={`px-2 py-1 rounded text-sm ${
                      analysis.ai_recommendations.confidence_score > 0.8 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {Math.round(analysis.ai_recommendations.confidence_score * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Analysis Timestamp */}
      {analysis && (
        <div className="text-center">
          <p className="text-sm text-gray-500">
            చివరిసారి అప్‌డేట్: {new Date(analysis.analysis_timestamp).toLocaleString('te-IN')}
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedIrrigationDashboard;