// API configuration
export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  auth: '/auth',
  aquaguide: '/aquaguide',
  irrigation: '/irrigation',
  weather: '/weather',
  experts: '/experts',
  plots: '/plots'
};

export const API_CONFIG = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};