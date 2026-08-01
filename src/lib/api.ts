export const getApiBaseUrl = (): string => {
  const env = (import.meta as any).env || {};
  const envUrl = env.VITE_API_URL || env.VITE_SERVER_URL || '';
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  return '';
};

export const getApiUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!baseUrl) {
    return cleanPath;
  }
  return `${baseUrl}${cleanPath}`;
};
