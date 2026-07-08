const defaultApiBase = 'https://content-studio-copilot.edgeone.dev';
const conversationIdStorageKey = 'content-studio-backend-conversation-id';

export function getBackendApiBase() {
  const configuredBase = import.meta.env.VITE_API_BASE;
  return String(configuredBase || defaultApiBase).replace(/\/$/, '');
}

export function createBackendUrl(path) {
  const endpointPath = String(path || '').startsWith('/') ? String(path || '') : `/${path || ''}`;
  const base = getBackendApiBase();

  try {
    const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : defaultApiBase;
    const url = new URL(base, fallbackOrigin);
    const basePath = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    url.pathname = `${basePath}${endpointPath}`;
    return url.toString();
  } catch {
    return `${base}${endpointPath}`;
  }
}

export function getBackendConversationId() {
  if (typeof window === 'undefined') {
    return crypto.randomUUID();
  }

  const stored = window.localStorage.getItem(conversationIdStorageKey);
  if (stored) return stored;

  const nextId = crypto.randomUUID();
  window.localStorage.setItem(conversationIdStorageKey, nextId);
  return nextId;
}

async function readResponseBody(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export async function postBackendJson(path, body) {
  const response = await fetch(createBackendUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'makers-conversation-id': getBackendConversationId(),
    },
    body: JSON.stringify(body),
  });

  const data = await readResponseBody(response);

  if (!response.ok) {
    const message =
      typeof data === 'string' ? data : data?.error || data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export async function generateOutline({ topic, keywords = '', style = 'technical', length = 'medium' }) {
  return postBackendJson('/outline', {
    topic,
    keywords,
    style,
    length,
  });
}
