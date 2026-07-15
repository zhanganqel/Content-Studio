import OpenAI from 'openai';
import { Agent, OpenAIChatCompletionsModel, run, type Session } from '@openai/agents';
import {
  buildKnowledgeAttachmentContext,
  normalizeKnowledgeAttachments,
  toAttachmentSource,
} from '../_attachments';
import { createLogger } from '../_logger';
import { COPILOT_SYSTEM_PROMPT } from '../_prompts';
import { sseResponse, type ContentStudioSseEvent } from '../_sse';

const logger = createLogger('content-studio-chat');
const DEFAULT_MODEL = '@makers/deepseek-v4-flash';

function jsonResponse(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    status,
  });
}

function pickString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function onRequest(context: any) {
  const body = context.request.body && typeof context.request.body === 'object'
    ? context.request.body as Record<string, unknown>
    : {};
  const message = pickString(body.message);
  const projectId = pickString(body.projectId);
  const requestedConversationId = pickString(body.conversationId);
  const conversationId = pickString(context.conversation_id) || requestedConversationId;
  const userId = pickString(body.userId) || undefined;
  const signal: AbortSignal | undefined = context.request.signal;

  if (!message || !projectId || !conversationId) {
    return jsonResponse({ error: 'projectId, conversationId, and message are required.' }, 400);
  }
  if (context.conversation_id && requestedConversationId && context.conversation_id !== requestedConversationId) {
    return jsonResponse({ error: 'Conversation ID does not match makers-conversation-id.' }, 409);
  }

  let attachments;
  try {
    attachments = normalizeKnowledgeAttachments(body.attachments);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 400);
  }

  logger.log(`[request] project=${projectId}, conversation=${conversationId}, attachments=${attachments.length}`);

  if (userId) {
    try {
      await context.store.appendMessage({
        content: message,
        conversationId,
        role: 'user',
        userId,
      });
    } catch (error) {
      logger.error('[request] failed to update conversation index:', error);
    }
  }

  const session: Session | undefined = conversationId
    ? context.store.openaiSession(conversationId)
    : undefined;
  const env = context.env as Record<string, string | undefined>;
  const client = new OpenAI({
    apiKey: env.AI_GATEWAY_API_KEY,
    baseURL: env.AI_GATEWAY_BASE_URL,
  });
  const modelName = env.AI_GATEWAY_MODEL || DEFAULT_MODEL;
  const model = new OpenAIChatCompletionsModel(client, modelName);
  const agent = new Agent({
    instructions: COPILOT_SYSTEM_PROMPT,
    model,
    name: 'Content Studio Copilot',
    tools: [],
  });
  const attachmentContext = buildKnowledgeAttachmentContext(attachments);
  const prompt = attachmentContext ? `${message}\n\n${attachmentContext}` : message;

  return sseResponse(
    async function* (): AsyncGenerator<ContentStudioSseEvent, void, unknown> {
      yield {
        agentId: 'copilot',
        content: '正在分析当前请求和已选择的参考资料。',
        kind: 'analysis',
        sequence: 1,
        type: 'process_delta',
      };

      for (const attachment of attachments) {
        yield {
          agentId: 'copilot',
          intent: 'reply',
          source: toAttachmentSource(attachment),
          type: 'source',
        };
      }

      const result = await run(agent, prompt, { session, signal, stream: true });
      for await (const event of result.toStream()) {
        if (signal?.aborted) break;
        if (event.type === 'raw_model_stream_event' && event.data?.type === 'output_text_delta') {
          yield {
            agentId: 'copilot',
            content: String(event.data.delta || ''),
            intent: 'reply',
            type: 'message_delta',
          };
        }
      }

      yield {
        agentId: 'copilot',
        content: `已由 ${modelName} 完成本轮回复。`,
        kind: 'summary',
        sequence: 2,
        type: 'process_delta',
      };
    },
    { logger, signal },
  );
}
