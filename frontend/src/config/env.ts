// Environment configuration
export const env = {
  apiUrl: import.meta.env.VITE_API_URL?.trim() || 'http://localhost:5000',
  appEnv: import.meta.env.VITE_APP_ENV?.trim() || 'development',
  appName: import.meta.env.VITE_APP_NAME?.trim() || 'Pairfect',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// API endpoint helper
export const getApiUrl = (path: string) => {
  return `${env.apiUrl}${path}`;
};
