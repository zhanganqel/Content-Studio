export interface ContentStudioSseEvent extends Record<string, unknown> {
  type: string;
}

export interface SseResponseOptions {
  logger?: { error: (...args: unknown[]) => void; log: (...args: unknown[]) => void };
  signal?: AbortSignal;
}

const SSE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'Content-Type': 'text/event-stream; charset=utf-8',
  'X-Accel-Buffering': 'no',
};

function encodeFrame(encoder: TextEncoder, event: ContentStudioSseEvent) {
  return encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

export function sseResponse(
  generator: () => AsyncGenerator<ContentStudioSseEvent, void, unknown>,
  options: SseResponseOptions = {},
) {
  const { logger, signal } = options;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (event: ContentStudioSseEvent) => controller.enqueue(encodeFrame(encoder, event));
      const iterator = generator();
      let outcome: 'cancelled' | 'completed' | 'error' = 'completed';

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
          logger?.log('[stream] aborted by user');
        } else {
          outcome = 'error';
          logger?.error('[stream] failed:', normalized.message);
          enqueue({ code: 'edgeone_agent_error', content: normalized.message, type: 'error_message' });
        }
      } finally {
        try {
          await iterator.return?.(undefined);
        } catch {
          // 上游流清理失败不影响响应关闭。
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
