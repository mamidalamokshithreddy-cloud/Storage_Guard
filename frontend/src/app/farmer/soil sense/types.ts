// Types for soil testing companies
export interface Company {
  id: string;
  name: string;
  nametelugu: string;
  type: 'government' | 'private' | 'certified-private';
  location: {
    address: string;
    district: string;
    distance: string;
    coordinates?: [number, number];
  };
  pricing: {
    basePrice: number;
    maxPrice?: number;
    packages?: Array<{
      name: string;
      nametelugu: string;
      price: number;
      description: string;
    }>;
  };
  availableSlots: Array<{
    date: string;
    timeSlots: string[];
  }>;
  certificates: Array<{
    name: string;
    issuer: string;
    validUntil?: string;
  }>;
  rating: number;
  totalReviews: number;
  contactInfo: {
    phone: string;
    email?: string;
    website?: string;
  };
  services: string[];
  experience: string;
  equipment?: string[];
  turnaroundTime: string;
  specializations: string[];
  successRate: number;
  completedProjects: number;
  workingHours: string;
  languages: string[];
  paymentMethods: string[];
  insurance: boolean;
  warranty: string;
  additionalServices: string[];
}

export interface SoilTestingType {
  id: 'satellite' | 'field' | 'drone-lab';
  name: string;
  nametelugu: string;
  description: string;
  companies: Company[];
}