const browserUserStorageKey = 'content-studio-edgeone-user-id';

function createBrowserUserId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `browser-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// EdgeOne 生产部署使用同源接口，本地联调时可通过公开环境变量覆盖服务地址。
export function getCopilotServiceBaseUrl() {
  return String(import.meta.env.VITE_COPILOT_SERVER_URL || '').replace(/\/$/, '');
}

// 组合 Copilot 接口地址，支持同源路径和独立本地服务地址。
export function createCopilotServiceUrl(path) {
  const endpointPath = String(path || '').startsWith('/') ? String(path || '') : `/${path || ''}`;
  const base = getCopilotServiceBaseUrl();
  if (!base) return endpointPath;

  try {
    const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1';
    const url = new URL(base, fallbackOrigin);
    const basePath = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    url.pathname = `${basePath}${endpointPath}`;
    return url.toString();
  } catch {
    return `${base}${endpointPath}`;
  }
}

// 浏览器标识只用于隔离 EdgeOne 会话索引，不包含真实账号或业务身份。
export function getCopilotProjectUserId(projectId) {
  let browserUserId = '';
  if (typeof window !== 'undefined') {
    browserUserId = window.localStorage.getItem(browserUserStorageKey) || '';
    if (!browserUserId) {
      browserUserId = createBrowserUserId();
      window.localStorage.setItem(browserUserStorageKey, browserUserId);
    }
  }
  return `${projectId}:${browserUserId || 'server'}`;
}

// EdgeOne Agents 运行时使用该请求头把请求绑定到同一个会话。
export function createConversationHeaders(conversationId) {
  return conversationId ? { 'makers-conversation-id': conversationId } : {};
}

export async function getCopilotServiceHealth({ signal } = {}) {
  const response = await fetch(createCopilotServiceUrl('/health'), { signal });
  if (!response.ok) {
    throw new Error(`Copilot health check failed (${response.status})`);
  }
  return response.json();
}
