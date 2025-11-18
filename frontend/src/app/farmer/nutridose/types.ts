export interface AnalysisPayload {
  soil_analysis?: Record<string, any>;
  crop_info?: {
    species?: string;
    variety?: string;
    current_stage?: string;
    target_yield?: number;
    planting_date?: string;
    area_hectares?: number;
    irrigation_method?: string;
    previous_crop?: string;
  };
  current_nutrients?: Record<string, number>;
  deficiencies?: string[];
  growth_stage?: string;
  target_yield?: number;
  farm_context?: Record<string, any>;
  user_preferences?: Record<string, any>;
  weather_forecast?: Array<Record<string, any>>;
};

import { LucideIcon } from 'lucide-react';
import { ButtonProps } from '../ui/button';

export interface NutrientRecommendation {
  name: string;
  telugu?: string;
  current: number;
  required: number;
  deficiency: number;
  application: string;
  cost?: string;
  timing?: string;
  status: 'urgent' | 'moderate' | 'low' | string;
  plan?: string;
  window?: string;
  stage_window?: string;
  nutrient?: string;
  label?: string;
  current_level?: number;
  target_level?: number;
  product?: string;
  recommendation?: string;
  price?: string;
}

export interface RecommendationsSectionProps {
  data?: {
    recommendations: NutrientRecommendation[];
    fertilizer_plan?: FertilizerPlan[];
    success?: boolean;
  };
  loading?: boolean;
}

export interface QuickActionButtonProps extends ButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => Promise<void>;
  loading?: boolean;
}

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export interface NutrientLevelIndicatorProps {
  current: number;
  required: number;
  label: string;
}

export interface FertilizerPlan {
  type: 'basal' | 'foliar' | 'top-dressing';
  application_type?: string;
  product_name?: string;
  fertilizer?: string;
  application_rate?: string;
  rate?: string;
  timing?: string;
  application_timing?: string;
  method?: string;
  application_method?: string;
  stage?: string;
  status?: string;
  weather_conditions?: string;
  recommendations?: string[];
}

export interface LoadingState {
  analysis: boolean;
  recommendations: boolean;
  schedule: boolean;
  cost: boolean;
}

export interface WeatherImpact {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  uv: string;
  forecast: string;
}

export interface ApplicationSchedule {
  week: number;
  action: string;
  status: 'completed' | 'scheduled' | 'pending';
  date: string;
  type: string;
  stage: string;
  weather?: string;
  notes?: string;
}

export interface NutriDoseService {
  title: string;
  titleTelugu: string;
  description: string;
  descriptionTelugu: string;
  duration: string;
  price: string;
  icon: React.ComponentType;
  available: boolean;
}

export interface VendorInfo {
  name: string;
  distance: string;
  rating: number;
  speciality: string;
  phone: string;
  services: string[];
  price: string;
  availability: 'In Stock' | 'Available' | 'Out of Stock';
  sla: string;
  certifications: string[];
  experience: string;
  location_distance?: string;
  supplier_name?: string;
  category?: string;
  contact?: string;
  offerings?: string[];
  stock_status?: string;
  delivery_time?: string;
  licenses?: string[];
  years_in_business?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
  code?: string;
  timestamp?: string;
}

export interface NutrientAnalysisResponse extends ApiResponse<{
  overall_score?: number;
  score?: number;
  health_score?: number;
  summary?: string;
  assessment?: string;
  crop_stage?: string;
  growth_stage?: string;
  recommended_action?: string;
  primary_recommendation?: string;
  safety_guidelines?: string[];
  nutrient_levels?: {
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
  };
  levels?: {
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
  };
}> {}

export interface FertilizerRecommendationsResponse extends ApiResponse<{
  recommendations: NutrientRecommendation[];
  fertilizer_plan: FertilizerPlan[];
  safety_recommendations?: string[];
  primary_recommendation?: string;
  summary?: string;
  total_cost?: number;
}> {}

export interface ApplicationScheduleResponse extends ApiResponse<{
  schedule?: ApplicationSchedule[];
  windows?: ApplicationSchedule[];
  application_windows?: ApplicationSchedule[];
  application_schedule?: ApplicationSchedule[];
}> {}

export interface CostAnalysisResponse extends ApiResponse<{
  total_cost?: number;
  cost_estimate?: number;
  breakdown?: Record<string, number>;
  roi_estimate?: number;
  payment_options?: string[];
  analysis?: {
    [key: string]: any;
  };
}> {}
