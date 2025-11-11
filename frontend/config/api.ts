// API Configuration
// Priority: Environment variable > Development default > Production default
const getApiBaseURL = () => {
  // Check environment variable first
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  
  // Development default
  if (import.meta.env?.DEV || import.meta.env?.MODE === 'development') {
    return 'http://localhost:8000';
  }
  
  // Production default
  return 'https://eduinfo.online';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseURL(),
  API_VERSION: (import.meta as any).env?.VITE_API_VERSION || 'v1',
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Ensure BASE_URL doesn't end with slash to prevent double slashes
const cleanBaseURL = API_CONFIG.BASE_URL.endsWith('/') 
  ? API_CONFIG.BASE_URL.slice(0, -1) 
  : API_CONFIG.BASE_URL;

// Export the clean base URL for use in other files
export const API_BASE_URL = cleanBaseURL;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login/',
    LOGOUT: '/api/auth/logout/',
    REFRESH: '/api/auth/token/refresh/',
    REGISTER: '/api/auth/register/',
    PROFILE: '/api/auth/profile/',
  },
  STUDENTS: {
    LIST: '/api/students/',
    DETAIL: (id: string) => `/api/students/${id}/`,
    CREATE: '/api/students/',
    UPDATE: (id: string) => `/api/students/${id}/`,
    DELETE: (id: string) => `/api/students/${id}/`,
  },
  ADVISORS: {
    LIST: '/api/advisors/',
    DETAIL: (id: string) => `/api/advisors/${id}/`,
    CREATE: '/api/advisors/',
    UPDATE: (id: string) => `/api/advisors/${id}/`,
    DELETE: (id: string) => `/api/advisors/${id}/`,
  },
  PROJECTS: {
    LIST: '/api/projects/',
    DETAIL: (id: string) => `/api/projects/${id}/`,
    CREATE: '/api/projects/',
    UPDATE: (id: string) => `/api/projects/${id}/`,
    DELETE: (id: string) => `/api/projects/${id}/`,
    SUBMIT: (id: string) => `/api/projects/${id}/submit/`,
    APPROVE: (id: string) => `/api/projects/${id}/approve/`,
    REJECT: (id: string) => `/api/projects/${id}/reject/`,
  },
  MILESTONES: {
    LIST: '/api/milestones/',
    DETAIL: (id: string) => `/api/milestones/${id}/`,
    CREATE: '/api/milestones/',
    UPDATE: (id: string) => `/api/milestones/${id}/`,
    DELETE: (id: string) => `/api/milestones/${id}/`,
  },
  NOTIFICATIONS: {
    LIST: '/api/notifications/',
    MARK_READ: (id: string) => `/api/notifications/${id}/mark-read/`,
    MARK_ALL_READ: '/api/notifications/mark-all-read/',
  },
  FILES: {
    UPLOAD: '/api/files/upload/',
    DOWNLOAD: (id: string) => `/api/files/${id}/download/`,
    DELETE: (id: string) => `/api/files/${id}/`,
  },
  ANALYTICS: {
    DASHBOARD: '/api/analytics/dashboard/',
    REPORTS: '/api/analytics/reports/',
    STATS: '/api/analytics/stats/',
  },
  ACADEMIC_YEARS: {
    LIST: '/api/settings/academic-years/',
    CURRENT: '/api/settings/academic-years/current/',
    AVAILABLE: '/api/settings/academic-years/available/',
    CREATE: '/api/settings/academic-years/',
    DETAIL: (id: number) => `/api/settings/academic-years/${id}/`,
    UPDATE: (id: number) => `/api/settings/academic-years/${id}/`,
    DELETE: (id: number) => `/api/settings/academic-years/${id}/`,
    ACTIVATE: (id: number) => `/api/settings/academic-years/${id}/activate/`,
    CREATE_NEXT: '/api/settings/academic-years/create_next_year/',
  },
};

// WebSocket Configuration
export const WS_CONFIG = {
  URL: (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:8000/ws/',
  RECONNECT_INTERVAL: 5000,
  MAX_RECONNECT_ATTEMPTS: 5,
};

// File Upload Configuration
export const FILE_CONFIG = {
  MAX_SIZE: parseInt((import.meta as any).env?.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
  ALLOWED_TYPES: ((import.meta as any).env?.VITE_ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt,md,jpg,jpeg,png,gif').split(','),
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks
};

// Feature Flags
export const FEATURE_FLAGS = {
  AI_FEATURES: (import.meta as any).env?.VITE_ENABLE_AI_FEATURES === 'true',
  ANALYTICS: (import.meta as any).env?.VITE_ENABLE_ANALYTICS === 'true',
  NOTIFICATIONS: (import.meta as any).env?.VITE_ENABLE_NOTIFICATIONS === 'true',
  FILE_UPLOAD: (import.meta as any).env?.VITE_ENABLE_FILE_UPLOAD === 'true',
};

// Development Settings
export const DEV_CONFIG = {
  DEBUG: (import.meta as any).env?.VITE_DEBUG === 'true',
  LOG_LEVEL: (import.meta as any).env?.VITE_LOG_LEVEL || 'info',
  MOCK_API: (import.meta as any).env?.VITE_MOCK_API === 'true',
  DEV_TOOLS: (import.meta as any).env?.VITE_USE_DEV_TOOLS === 'true',
};
