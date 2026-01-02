// Environment configuration
export const env = {
  apiUrl: import.meta.env.VITE_API_URL?.trim() || '',
  appEnv: import.meta.env.VITE_APP_ENV?.trim() || 'development',
  appName: import.meta.env.VITE_APP_NAME?.trim() || 'Pairfect',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// API endpoint helper — safely resolve the API base URL
export const getApiUrl = (path: string) => {
  const raw = env.apiUrl || '';

  // If the configured URL is missing or looks like a path/protocol-relative (starts with // or /),
  // fall back to the current origin so requests resolve to the frontend host.
  let base = raw;
  if (!base || base.startsWith('//') || base.startsWith('/')) {
    base = typeof window !== 'undefined' ? window.location.origin : '';
  }

  // Ensure no trailing slash on base, and ensure path starts with a single slash
  base = base.replace(/\/+$/g, '');
  const safePath = path.startsWith('/') ? path : `/${path}`;

  return `${base}${safePath}`;
};
