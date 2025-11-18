import { Company, SoilTestingType } from './types';

// Enhanced Satellite Analysis Companies
const satelliteCompanies: Company[] = [
  {
    id: 'sat-001',
    name: 'AgriSat Solutions',
    nametelugu: 'అగ్రిసాట్ సొల్యూషన్స్',
    type: 'private',
    location: {
      address: 'Tech Park, Warangal Urban',
      district: 'Warangal',
      distance: '2.3 km',
      coordinates: [17.9689, 79.5941]
    },
    pricing: {
      basePrice: 3500,
      maxPrice: 8000,
      packages: [
        {
          name: 'Basic Satellite Analysis',
          nametelugu: 'ప్రాథమిక ఉపగ్రహ విశ్లేషణ',
          price: 3500,
          description: 'Basic soil mapping with moisture analysis'
        },
        {
          name: 'Premium Multi-Spectral Analysis',
          nametelugu: 'ప్రీమియం మల్టి-స్పెక్ట్రల్ విశ్లేషణ',
          price: 8000,
          description: 'Advanced spectral analysis with nutrient mapping'
        }
      ]
    },
    availableSlots: [
      {
        date: '2025-10-07',
        timeSlots: ['10:00 AM', '2:00 PM', '4:00 PM']
      },
      {
        date: '2025-10-08',
        timeSlots: ['9:00 AM', '11:00 AM', '3:00 PM']
      },
      {
        date: '2025-10-09',
        timeSlots: ['10:00 AM', '1:00 PM']
      }
    ],
    certificates: [
      {
        name: 'ISO 9001:2015',
        issuer: 'International Organization for Standardization',
        validUntil: '2026-12-31'
      },
      {
        name: 'ISRO Certified Remote Sensing',
        issuer: 'Indian Space Research Organisation'
      }
    ],
    rating: 4.8,
    totalReviews: 127,
    contactInfo: {
      phone: '+91 9876543210',
      email: 'info@agrisat.com',
      website: 'www.agrisat.com'
    },
    services: ['Satellite Imagery', 'Soil Mapping', 'Moisture Analysis', 'Nutrient Zones'],
    experience: '8 years',
    equipment: ['High-Resolution Satellites', 'Multi-Spectral Sensors', 'GIS Software'],
    turnaroundTime: '24-48 hours',
    specializations: ['Cotton Soil Analysis', 'Multi-Crop Mapping', 'Precision Agriculture', 'Water Stress Detection'],
    successRate: 96,
    completedProjects: 850,
    workingHours: '6:00 AM - 8:00 PM',
    languages: ['Telugu', 'Hindi', 'English'],
    paymentMethods: ['UPI', 'Bank Transfer', 'Cash', 'AgriCard'],
    insurance: true,
    warranty: '6 months accuracy guarantee',
    additionalServices: ['Free Report Explanation', 'Crop Recommendation', 'Seasonal Analysis', 'Training Sessions']
  },
  {
    id: 'sat-002',
    name: 'Government Remote Sensing Center',
    nametelugu: 'ప్రభుత్వ రిమోట్ సెన్సింగ్ కేంద్రం',
    type: 'government',
    location: {
      address: 'Agriculture University, Rajendranagar',
      district: 'Warangal',
      distance: '5.7 km'
    },
    pricing: {
      basePrice: 1200,
      maxPrice: 2500,
      packages: [
        {
          name: 'Subsidized Satellite Analysis',
          nametelugu: 'రాయితీ ఉపగ్రహ విశ్లేషణ',
          price: 1200,
          description: 'Government subsidized satellite soil analysis'
        }
      ]
    },
    availableSlots: [
      {
        date: '2025-10-10',
        timeSlots: ['9:00 AM', '11:00 AM']
      },
      {
        date: '2025-10-12',
        timeSlots: ['10:00 AM', '2:00 PM']
      }
    ],
    certificates: [
      {
        name: 'Government Certified',
        issuer: 'Ministry of Agriculture',
        validUntil: '2027-03-31'
      },
      {
        name: 'NRSC Approved',
        issuer: 'National Remote Sensing Centre'
      }
    ],
    rating: 4.5,
    totalReviews: 89,
    contactInfo: {
      phone: '+91 8765432109',
      email: 'grsc@gov.in'
    },
    services: ['Satellite Mapping', 'Crop Health Analysis', 'Land Classification'],
    experience: '15 years',
    equipment: ['IRS Satellites', 'Cartosat Data', 'LISS Sensors'],
    turnaroundTime: '3-5 days',
    specializations: ['Government Schemes', 'Subsidized Analysis', 'Farmer Training', 'Research Projects'],
    successRate: 94,
    completedProjects: 2500,
    workingHours: '9:00 AM - 5:00 PM',
    languages: ['Telugu', 'Hindi', 'English'],
    paymentMethods: ['Government Portal', 'DBT', 'Cash'],
    insurance: true,
    warranty: '1 year government backing',
    additionalServices: ['Free Farmer Training', 'Soil Health Cards', 'Government Subsidies', 'Extension Support']
  },
  {
    id: 'sat-003',
    name: 'TechnoAgri Remote Systems',
    nametelugu: 'టెక్నోఅగ్రి రిమోట్ సిస్టమ్స్',
    type: 'certified-private',
    location: {
      address: 'Innovation Park, Warangal',
      district: 'Warangal',
      distance: '2.9 km'
    },
    pricing: {
      basePrice: 4200,
      maxPrice: 12000,
      packages: [
        {
          name: 'Standard Satellite Package',
          nametelugu: 'ప్రామాణిక ఉపగ్రహ ప్యాకేజీ',
          price: 4200,
          description: 'Multi-band satellite analysis with basic reporting'
        },
        {
          name: 'AI-Powered Analysis',
          nametelugu: 'AI ఆధారిత విశ్లేషణ',
          price: 12000,
          description: 'AI-enhanced satellite data with predictive analytics'
        }
      ]
    },
    availableSlots: [
      {
        date: '2025-10-07',
        timeSlots: ['9:30 AM', '1:30 PM']
      },
      {
        date: '2025-10-08',
        timeSlots: ['10:30 AM', '3:30 PM']
      },
      {
        date: '2025-10-11',
        timeSlots: ['11:00 AM', '2:30 PM']
      }
    ],
    certificates: [
      {
        name: 'ISO 27001:2013',
        issuer: 'Information Security Management',
        validUntil: '2025-11-30'
      },
      {
        name: 'Government Certified Partner',
        issuer: 'Department of Agriculture'
      }
    ],
    rating: 4.7,
    totalReviews: 203,
    contactInfo: {
      phone: '+91 7654321098',
      email: 'support@technoagri.in',
      website: 'www.technoagri.in'
    },
    services: ['AI Satellite Analysis', 'Precision Mapping', 'Temporal Analysis', 'Yield Prediction'],
    experience: '12 years',
    equipment: ['WorldView Satellites', 'AI Processing Units', 'Cloud Analytics Platform'],
    turnaroundTime: '12-24 hours',
    specializations: ['AI Agriculture', 'Predictive Analytics', 'Precision Farming', 'Technology Integration'],
    successRate: 98,
    completedProjects: 1200,
    workingHours: '24/7 Operations',
    languages: ['Telugu', 'Hindi', 'English'],
    paymentMethods: ['UPI', 'Bank Transfer', 'Corporate Accounts', 'Installments'],
    insurance: true,
    warranty: '2 years technology support',
    additionalServices: ['AI Training', 'Technology Transfer', 'Custom Solutions', 'Research Collaboration']
  }
];

// Enhanced Field Testing Companies
const fieldTestingCompanies: Company[] = [
  {
    id: 'field-001',
    name: 'Mobile Soil Lab Services',
    nametelugu: 'మొబైల్ సాయిల్ ల్యాబ్ సేవలు',
    type: 'private',
    location: {
      address: 'Main Road, Hanamkonda',
      district: 'Warangal',
      distance: '1.8 km'
    },
    pricing: {
      basePrice: 800,
      maxPrice: 2500,
      packages: [
        {
          name: 'Basic Field Testing',
          nametelugu: 'ప్రాథమిక క్షేత్ర పరీక్ష',
          price: 800,
          description: 'pH, EC, and moisture testing on-site'
        },
        {
          name: 'Complete Field Analysis',
          nametelugu: 'పూర్తి క్షేత్ర విశ్లేషణ',
          price: 2500,
          description: 'NPK, micronutrients, and organic matter testing'
        }
      ]
    },
    availableSlots: [
      {
        date: '2025-10-07',
        timeSlots: ['8:00 AM', '10:00 AM', '2:00 PM', '4:00 PM']
      },
      {
        date: '2025-10-08',
        timeSlots: ['8:30 AM', '11:00 AM', '1:30 PM', '3:30 PM']
      },
      {
        date: '2025-10-09',
        timeSlots: ['9:00 AM', '12:00 PM', '2:30 PM']
      }
    ],
    certificates: [
      {
        name: 'NABL Accredited',
        issuer: 'National Accreditation Board for Testing',
        validUntil: '2026-08-15'
      },
      {
        name: 'BIS Certified Equipment',
        issuer: 'Bureau of Indian Standards'
      }
    ],
    rating: 4.6,
    totalReviews: 156,
    contactInfo: {
      phone: '+91 9123456789',
      email: 'mobile@soillab.in',
      website: 'www.mobilesoillab.in'
    },
    services: ['On-site Testing', 'Instant Results', 'Digital Reports', 'GPS Mapping'],
    experience: '6 years',
    equipment: ['Portable pH Meters', 'EC Sensors', 'NPK Test Kits', 'Moisture Analyzers'],
    turnaroundTime: 'Instant results',
    specializations: ['Mobile Testing', 'Instant Analysis', 'Field Calibration', 'Emergency Testing'],
    successRate: 97,
    completedProjects: 1250,
    workingHours: '7:00 AM - 7:00 PM',
    languages: ['Telugu', 'Hindi', 'English', 'Urdu'],
    paymentMethods: ['UPI', 'Cash', 'Card', 'Bank Transfer'],
    insurance: true,
    warranty: '6 months equipment calibration guarantee',
    additionalServices: ['Same Day Reports', 'SMS Alerts', 'WhatsApp Support', 'Follow-up Consultation']
  },
  {
    id: 'field-002',
    name: 'Krishi Vigyan Kendra - Field Unit',
    nametelugu: 'కృషి విజ్ఞాన కేంద్రం - క్షేత్ర యూనిట్',
    type: 'government',
    location: {
      address: 'KVK Campus, Mulugu Road',
      district: 'Warangal',
      distance: '6.2 km'
    },
    pricing: {
      basePrice: 200,
      maxPrice: 500,
      packages: [
        {
          name: 'Farmer Friendly Testing',
          nametelugu: 'రైతు స్నేహ పరీక్ష',
          price: 200,
          description: 'Subsidized basic soil testing for farmers'
        },
        {
          name: 'Extension Service Package',
          nametelugu: 'విస్తరణ సేవా ప్యాకేజీ',
          price: 500,
          description: 'Comprehensive testing with expert consultation'
        }
      ]
    },
    availableSlots: [
      {
        date: '2025-10-09',
        timeSlots: ['9:00 AM', '11:00 AM']
      },
      {
        date: '2025-10-11',
        timeSlots: ['10:00 AM', '2:00 PM']
      },
      {
        date: '2025-10-14',
        timeSlots: ['9:30 AM', '1:00 PM']
      }
    ],
    certificates: [
      {
        name: 'Government Extension Center',
        issuer: 'ICAR - Indian Council of Agricultural Research'
      },
      {
        name: 'State Agriculture Department Approved',
        issuer: 'Telangana Agriculture Department'
      }
    ],
    rating: 4.3,
    totalReviews: 78,
    contactInfo: {
      phone: '+91 8234567890',
      email: 'kvk.warangal@icar.gov.in'
    },
    services: ['Field Testing', 'Farmer Training', 'Soil Health Cards', 'Advisory Services'],
    experience: '20 years',
    equipment: ['Government Approved Kits', 'Standard Testing Equipment'],
    turnaroundTime: 'Same day',
    specializations: ['Government Programs', 'Farmer Education', 'Extension Services', 'Subsidized Testing'],
    successRate: 92,
    completedProjects: 3200,
    workingHours: '9:00 AM - 5:00 PM',
    languages: ['Telugu', 'Hindi'],
    paymentMethods: ['Government Schemes', 'Subsidized Rates', 'Cash'],
    insurance: true,
    warranty: 'Government backed accuracy',
    additionalServices: ['Farmer Training', 'Soil Health Cards', 'Government Schemes', 'Free Consultation']
  },
  {
    id: 'field-003',
    name: 'AgriTech Field Solutions',
    nametelugu: 'అగ్రిటెక్ ఫీల్డ్ సొల్యూషన్స్',
    type: 'certified-private',
    location: {
      address: 'Technology Hub, Warangal',
      district: 'Warangal',
      distance: '3.5 km'
    },
    pricing: {
      basePrice: 1200,
      maxPrice: 4000,
      packages: [
        {
          name: 'Digital Field Testing',
          nametelugu: 'డిజిటల్ ఫీల్డ్ టెస్టింగ్',
          price: 1200,
          description: 'IoT-enabled field testing with cloud reporting'
        },
        {
          name: 'Premium Tech Package',
          nametelugu: 'పీమియం టెక్ ప్యాకేజీ',
          price: 4000,
          description: 'Advanced sensors with AI-powered recommendations'
        }
      ]
    },
    availableSlots: [
      {
        date: '2025-10-07',
        timeSlots: ['9:00 AM', '11:30 AM', '2:30 PM']
      },
      {
        date: '2025-10-08',
        timeSlots: ['8:30 AM', '1:00 PM', '4:00 PM']
      },
      {
        date: '2025-10-10',
        timeSlots: ['10:00 AM', '3:00 PM']
      }
    ],
    certificates: [
      {
        name: 'ISO 17025:2017',
        issuer: 'International Laboratory Accreditation',
        validUntil: '2026-06-30'
      },
      {
        name: 'IoT Certified Solutions',
        issuer: 'Technology Standards Board'
      }
    ],
    rating: 4.9,
    totalReviews: 234,
    contactInfo: {
      phone: '+91 7345678901',
      email: 'field@agritech.co.in',
      website: 'www.agritechfield.com'
    },
    services: ['IoT Field Testing', 'Real-time Monitoring', 'Precision Agriculture', 'Data Analytics'],
    experience: '5 years',
    equipment: ['IoT Sensors', 'Smart Probes', 'Cloud Platform', 'Mobile Apps'],
    turnaroundTime: 'Real-time',
    specializations: ['IoT Integration', 'Real-time Data', 'Cloud Analytics', 'Mobile Technology'],
    successRate: 99,
    completedProjects: 680,
    workingHours: '24/7 System Monitoring',
    languages: ['Telugu', 'Hindi', 'English'],
    paymentMethods: ['UPI', 'Card', 'Subscription Plans', 'Corporate Accounts'],
    insurance: true,
    warranty: '2 years technology warranty',
    additionalServices: ['Cloud Dashboard', 'Mobile App', 'Real-time Alerts', 'Data Analytics']
  }
];

// Enhanced Drone + Lab Companies
const droneLabCompanies: Company[] = [
  {
    id: 'drone-001',
    name: 'AerialAgri Lab Services',
    nametelugu: 'ఏరియల్అగ్రి ల్యాబ్ సేవలు',
    type: 'private',
    location: {
      address: 'Airport Road, Warangal',
      district: 'Warangal',
      distance: '4.8 km'
    },
    pricing: {
      basePrice: 5000,
      maxPrice: 15000,
      packages: [
        {
          name: 'Drone Sampling + Basic Lab',
          nametelugu: 'డ్రోన్ సాంప్లింగ్ + ప్రాథమిక ల్యాబ్',
          price: 5000,
          description: 'Precision drone sampling with standard lab analysis'
        },
        {
          name: 'Premium Drone + Advanced Lab',
          nametelugu: 'ప్రీమియం డ్రోన్ + అధునాతన ల్యాబ్',
          price: 15000,
          description: 'Multi-spectral drone + comprehensive lab testing'
        }
      ]
    },
    availableSlots: [
      {
        date: '2025-10-08',
        timeSlots: ['7:00 AM', '9:00 AM', '3:00 PM']
      },
      {
        date: '2025-10-10',
        timeSlots: ['7:30 AM', '10:00 AM', '2:30 PM']
      },
      {
        date: '2025-10-12',
        timeSlots: ['8:00 AM', '11:00 AM']
      }
    ],
    certificates: [
      {
        name: 'DGCA Drone License',
        issuer: 'Directorate General of Civil Aviation',
        validUntil: '2026-12-31'
      },
      {
        name: 'NABL Accredited Lab',
        issuer: 'National Accreditation Board',
        validUntil: '2027-03-15'
      }
    ],
    rating: 4.8,
    totalReviews: 92,
    contactInfo: {
      phone: '+91 6456789012',
      email: 'aerial@agrilab.com',
      website: 'www.aerialagri.com'
    },
    services: ['Drone Sampling', 'GPS Mapping', 'Lab Analysis', 'Spectral Imaging'],
    experience: '4 years',
    equipment: ['Agricultural Drones', 'GPS Systems', 'Certified Laboratory', 'Spectral Cameras'],
    turnaroundTime: '3-5 days',
    specializations: ['Precision Sampling', 'Aerial Mapping', 'Multi-Spectral Analysis', 'Research Grade Testing'],
    successRate: 98,
    completedProjects: 450,
    workingHours: '6:00 AM - 8:00 PM',
    languages: ['Telugu', 'Hindi', 'English'],
    paymentMethods: ['UPI', 'Bank Transfer', 'Card', 'Installments'],
    insurance: true,
    warranty: '1 year comprehensive service warranty',
    additionalServices: ['3D Field Mapping', 'Yield Prediction', 'Crop Health Monitoring', 'Seasonal Planning']
  },
  {
    id: 'drone-002',
    name: 'State Agricultural Research Lab',
    nametelugu: 'రాష్ట్ర వ్యవసాయ పరిశోధన ల్యాబ్',
    type: 'government',
    location: {
      address: 'Research Station, PJTSAU',
      district: 'Warangal',
      distance: '7.3 km'
    },
    pricing: {
      basePrice: 2000,
      maxPrice: 4500,
      packages: [
        {
          name: 'Research Grade Testing',
          nametelugu: 'పరిశోధన గ్రేడ్ టెస్టింగ్',
          price: 2000,
          description: 'Government lab testing with research-grade accuracy'
        },
        {
          name: 'Complete Research Package',
          nametelugu: 'పూర్తి పరిశోధన ప్యాకేజీ',
          price: 4500,
          description: 'Comprehensive testing with research recommendations'
        }
      ]
    },
    availableSlots: [
      {
        date: '2025-10-11',
        timeSlots: ['9:00 AM', '2:00 PM']
      },
      {
        date: '2025-10-14',
        timeSlots: ['10:00 AM', '1:00 PM']
      },
      {
        date: '2025-10-16',
        timeSlots: ['9:30 AM', '3:00 PM']
      }
    ],
    certificates: [
      {
        name: 'ICAR Accredited',
        issuer: 'Indian Council of Agricultural Research'
      },
      {
        name: 'Government Research Lab',
        issuer: 'Ministry of Agriculture'
      }
    ],
    rating: 4.4,
    totalReviews: 67,
    contactInfo: {
      phone: '+91 5567890123',
      email: 'research@pjtsau.edu.in'
    },
    services: ['Research Testing', 'Detailed Analysis', 'Scientific Reports', 'Crop Recommendations'],
    experience: '25 years',
    equipment: ['Research Lab Equipment', 'Government Drones', 'Advanced Analyzers'],
    turnaroundTime: '7-10 days',
    specializations: ['Research Analysis', 'Scientific Studies', 'Academic Reports', 'Government Research'],
    successRate: 96,
    completedProjects: 1850,
    workingHours: '9:00 AM - 5:00 PM',
    languages: ['Telugu', 'Hindi', 'English'],
    paymentMethods: ['Government Funding', 'Research Grants', 'University Accounts'],
    insurance: true,
    warranty: 'Research grade accuracy guarantee',
    additionalServices: ['Research Reports', 'Academic Publications', 'Student Training', 'Research Collaboration']
  },
  {
    id: 'drone-003',
    name: 'PrecisionAgri Drone Labs',
    nametelugu: 'ప్రెసిషన్అగ్రి డ్రోన్ ల్యాబ్స్',
    type: 'certified-private',
    location: {
      address: 'Innovation Park, Warangal',
      district: 'Warangal',
      distance: '2.9 km'
    },
    pricing: {
      basePrice: 8000,
      maxPrice: 25000,
      packages: [
        {
          name: 'Precision Drone Package',
          nametelugu: 'ప్రెసిషన్ డ్రోన్ ప్యాకేజీ',
          price: 8000,
          description: 'High-precision drone sampling with fast lab results'
        },
        {
          name: 'AI-Enhanced Analysis',
          nametelugu: 'AI మెరుగుపరచిన విశ్లేషణ',
          price: 25000,
          description: 'AI-powered analysis with predictive modeling'
        }
      ]
    },
    availableSlots: [
      {
        date: '2025-10-07',
        timeSlots: ['6:30 AM', '8:30 AM', '4:30 PM']
      },
      {
        date: '2025-10-09',
        timeSlots: ['7:00 AM', '9:30 AM', '3:30 PM']
      },
      {
        date: '2025-10-11',
        timeSlots: ['8:00 AM', '2:00 PM']
      }
    ],
    certificates: [
      {
        name: 'Advanced Drone Certification',
        issuer: 'International Drone Association',
        validUntil: '2026-09-30'
      },
      {
        name: 'AI Technology Certified',
        issuer: 'Technology Innovation Board'
      }
    ],
    rating: 4.9,
    totalReviews: 178,
    contactInfo: {
      phone: '+91 4678901234',
      email: 'precision@dronelab.in',
      website: 'www.precisionagri.com'
    },
    services: ['AI Drone Analysis', 'Precision Sampling', 'Predictive Analytics', '3D Mapping'],
    experience: '3 years',
    equipment: ['AI-Powered Drones', 'Advanced Lab', 'Machine Learning Platform', 'Precision Instruments'],
    turnaroundTime: '24-48 hours',
    specializations: ['AI Technology', 'Precision Agriculture', 'Predictive Modeling', 'Advanced Analytics'],
    successRate: 99,
    completedProjects: 420,
    workingHours: '6:00 AM - 8:00 PM',
    languages: ['Telugu', 'Hindi', 'English'],
    paymentMethods: ['UPI', 'Bank Transfer', 'Corporate Cards', 'Flexible EMI'],
    insurance: true,
    warranty: '3 years AI technology support',
    additionalServices: ['AI Insights', 'Predictive Reports', 'Technology Training', 'Custom AI Models']
  }
];

// Export all soil testing types with their companies
export const soilTestingTypes: SoilTestingType[] = [
  {
    id: 'satellite',
    name: 'Satellite Analysis',
    nametelugu: 'ఉపగ్రహ విశ్లేషణ',
    description: 'Remote soil mapping and analysis using satellite technology',
    companies: satelliteCompanies
  },
  {
    id: 'field',
    name: 'Field Testing',
    nametelugu: 'క్షేత్ర పరీక్ష',
    description: 'On-site portable soil testing and instant analysis',
    companies: fieldTestingCompanies
  },
  {
    id: 'drone-lab',
    name: 'Drone + Lab Analysis',
    nametelugu: 'డ్రోన్ + ల్యాబ్ విశ్లేషణ',
    description: 'Precision drone sampling with comprehensive lab testing',
    companies: droneLabCompanies
  }
];

// Helper function to get companies by type
export const getCompaniesByType = (type: 'satellite' | 'field' | 'drone-lab'): Company[] => {
  const testingType = soilTestingTypes.find(t => t.id === type);
  return testingType ? testingType.companies : [];
};