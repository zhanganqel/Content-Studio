export type CopilotOutcome = 'cancelled' | 'completed' | 'error';

export interface CopilotSseEvent extends Record<string, unknown> {
  type: 'process_delta' | 'message_delta' | 'source' | 'artifact' | 'task_status' |
    'workflow_status' | 'error_message' | 'done';
}

const SSE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'Content-Type': 'text/event-stream; charset=utf-8',
  'X-Accel-Buffering': 'no',
};

function encodeEvent(encoder: TextEncoder, event: CopilotSseEvent) {
  return encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

export function createSseResponse(
  generator: () => AsyncGenerator<CopilotSseEvent, void, unknown>,
  options: {
    logger?: { error: (...args: unknown[]) => void; log: (...args: unknown[]) => void };
    signal?: AbortSignal;
  } = {},
) {
  const encoder = new TextEncoder();
  const { logger, signal } = options;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const iterator = generator();
      const enqueue = (event: CopilotSseEvent) => controller.enqueue(encodeEvent(encoder, event));
      let outcome: CopilotOutcome = 'completed';

      try {
        let next = await iterator.next();
        while (!next.done) {
          if (signal?.aborted) {
            outcome = 'cancelled';
            break;
          }
          enqueue(next.value);
          next = await iterator.next();
        }
      } catch (error) {
        const normalized = error instanceof Error ? error : new Error(String(error));
        if (normalized.name === 'AbortError' || signal?.aborted) {
          outcome = 'cancelled';
          logger?.log('[stream] aborted');
        } else {
          outcome = 'error';
          logger?.error('[stream] failed:', normalized.message);
          enqueue({
            code: 'edgeone_agent_error',
            content: normalized.message,
            type: 'error_message',
          });
        }
      } finally {
        try {
          await iterator.return?.(undefined);
        } catch {
          // 上游清理失败不影响客户端收到结束事件。
        }
        enqueue({ outcome, type: 'done' });
        controller.close();
      }
    },
    cancel() {
      logger?.log('[stream] client disconnected');
    },
  });

  return new Response(stream, { headers: SSE_HEADERS, status: 200 });
}
