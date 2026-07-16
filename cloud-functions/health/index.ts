import { jsonResponse } from '../_shared/http';

const DEFAULT_MODEL = '@makers/deepseek-v4-flash';

export function onRequestGet(context: any) {
  const env = context.env as Record<string, string | undefined>;
  return jsonResponse({
    authConfigured: Boolean(env.AI_GATEWAY_API_KEY && env.AI_GATEWAY_BASE_URL),
    model: env.AI_GATEWAY_MODEL || DEFAULT_MODEL,
    ok: true,
    provider: 'edgeone-openai-agents',
  });
}
