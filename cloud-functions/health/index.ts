const JSON_HEADERS = { 'Content-Type': 'application/json; charset=UTF-8' } as const;

export async function onRequestGet(context: any) {
  const env = context.env as Record<string, string | undefined>;
  return new Response(JSON.stringify({
    authConfigured: Boolean(env.AI_GATEWAY_API_KEY),
    model: env.AI_GATEWAY_MODEL || '@makers/deepseek-v4-flash',
    ok: true,
    provider: 'edgeone-openai-agents',
  }), {
    headers: JSON_HEADERS,
    status: 200,
  });
}
