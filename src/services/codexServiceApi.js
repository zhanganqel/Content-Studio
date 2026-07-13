const defaultCodexServiceUrl = 'http://127.0.0.1:8788';

// 读取后端服务地址，未配置时使用本机 Codex 服务默认端口。
export function getCodexServiceBaseUrl() {
  const configuredBase = import.meta.env.VITE_CODEX_SERVER_URL;
  return String(configuredBase || defaultCodexServiceUrl).replace(/\/$/, '');
}

// 拼接后端接口地址，兼容完整 URL、相对路径和带 base path 的部署方式。
export function createCodexServiceUrl(path) {
  const endpointPath = String(path || '').startsWith('/') ? String(path || '') : `/${path || ''}`;
  const base = getCodexServiceBaseUrl();

  try {
    // URL 构造失败时走字符串拼接兜底，避免前端因配置异常直接崩溃。
    const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : defaultCodexServiceUrl;
    const url = new URL(base, fallbackOrigin);
    const basePath = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    url.pathname = `${basePath}${endpointPath}`;
    return url.toString();
  } catch {
    return `${base}${endpointPath}`;
  }
}

// 读取当前 Codex 服务的模型与连接状态，失败时由调用方决定展示兜底文案。
export async function getCodexServiceHealth({ signal } = {}) {
  const response = await fetch(createCodexServiceUrl('/health'), { signal });
  if (!response.ok) {
    throw new Error(`Codex health check failed (${response.status})`);
  }
  return response.json();
}
