import { createLogger } from '../_shared/logger';

const logger = createLogger('content-studio-stop');

async function readBody(context: any): Promise<Record<string, unknown>> {
  if (context.request?.body && typeof context.request.body === 'object') {
    return context.request.body as Record<string, unknown>;
  }
  try {
    return await context.request.json();
  } catch {
    return {};
  }
}

export async function onRequest(context: any) {
  const body = await readBody(context);
  const requestedConversationId = typeof body.conversation_id === 'string'
    ? body.conversation_id.trim()
    : typeof body.conversationId === 'string'
      ? body.conversationId.trim()
      : '';
  const conversationId = typeof context.conversation_id === 'string'
    ? context.conversation_id.trim()
    : '';

  if (!conversationId || !requestedConversationId) {
    return new Response(JSON.stringify({
      error: 'Makers-Conversation-Id and conversationId are required.',
    }), {
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      status: 400,
    });
  }
  if (conversationId !== requestedConversationId) {
    return new Response(JSON.stringify({
      error: 'Conversation ID does not match Makers-Conversation-Id.',
    }), {
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      status: 409,
    });
  }

  const result = context.utils.abortActiveRun(conversationId);
  logger.log('abortActiveRun:', conversationId, result);

  return new Response(JSON.stringify({
    conversationId,
    status: result?.aborted ? 'aborting' : 'idle',
    ...result,
  }), {
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    status: 200,
  });
}
