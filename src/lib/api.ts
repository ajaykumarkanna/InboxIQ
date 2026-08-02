export const getApiBaseUrl = (): string => {
  const env = (import.meta as any).env || {};
  let envUrl = (env.VITE_API_URL || env.VITE_SERVER_URL || '').trim();

  if (envUrl) {
    // Handle markdown pasted link formats like [text](http://...) or http://...](http://...
    if (envUrl.includes('](')) {
      const parts = envUrl.split('](');
      envUrl = parts[1] ? parts[1].replace(/\)$/, '') : parts[0];
    }

    // Strip brackets, parentheses, and leading/trailing whitespace
    envUrl = envUrl.replace(/^[\[\(]+|[\]\)]+$/g, '').trim();

    // Fix protocol if missing colon e.g. "https//" -> "https://"
    if (/^https?\/\//i.test(envUrl) && !/^https?:\/\//i.test(envUrl)) {
      envUrl = envUrl.replace(/^(https?)\/\//i, '$1://');
    }

    // Add protocol if completely missing relative/absolute hostname
    if (!/^https?:\/\//i.test(envUrl) && envUrl.includes('.')) {
      envUrl = `https://${envUrl}`;
    }

    return envUrl.replace(/\/$/, '');
  }

  // Relative API routing for same-origin server deployment
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
