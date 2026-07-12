const defaultCodexServiceUrl = 'http://127.0.0.1:8788';

export function getCodexServiceBaseUrl() {
  const configuredBase = import.meta.env.VITE_CODEX_SERVER_URL;
  return String(configuredBase || defaultCodexServiceUrl).replace(/\/$/, '');
}

export function createCodexServiceUrl(path) {
  const endpointPath = String(path || '').startsWith('/') ? String(path || '') : `/${path || ''}`;
  const base = getCodexServiceBaseUrl();

  try {
    const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : defaultCodexServiceUrl;
    const url = new URL(base, fallbackOrigin);
    const basePath = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    url.pathname = `${basePath}${endpointPath}`;
    return url.toString();
  } catch {
    return `${base}${endpointPath}`;
  }
}
