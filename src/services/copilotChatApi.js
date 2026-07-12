import { createCodexServiceUrl } from './codexServiceApi.js';

const maxResponseSampleLength = 800;

function parseSseEvent(rawEvent) {
  const dataLines = rawEvent
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.replace(/^data:\s?/, ''));

  if (!dataLines.length) return null;

  const payload = dataLines.join('\n').trim();
  if (!payload || payload === '[DONE]') return { type: 'done' };

  try {
    return JSON.parse(payload);
  } catch {
    return { content: payload, type: 'message_delta' };
  }
}

function createStreamingFormatError(response, responseSample) {
  const contentType = response.headers.get('content-type') || 'unknown content type';
  const sample = String(responseSample || '').trim().slice(0, 160);
  const detail = sample ? ` Response: ${sample}` : '';
  return new Error(`No SSE events were received from the Codex service (${contentType}).${detail}`);
}

async function readErrorResponse(response) {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return data?.error || data?.message || `Request failed (${response.status})`;
    }

    return (await response.text()) || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

function dispatchSseText(text, onEvent) {
  let eventCount = 0;
  const rawEvents = String(text ?? '').split(/\r?\n\r?\n/);

  for (const rawEvent of rawEvents) {
    const parsed = parseSseEvent(rawEvent);
    if (parsed) {
      eventCount += 1;
      onEvent?.(parsed);
    }
  }

  return eventCount;
}

export async function streamCopilotChat({
  body,
  conversationId,
  onEvent,
  signal,
}) {
  const response = await fetch(createCodexServiceUrl('/chat'), {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal,
  });

  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }

  if (!response.body) {
    throw new Error('Streaming response is not available');
  }

  if (typeof response.body.getReader !== 'function') {
    const text = await response.text();
    const eventCount = dispatchSseText(text, onEvent);
    if (!eventCount) {
      throw createStreamingFormatError(response, text);
    }
    return;
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = '';
  let responseSample = '';
  let eventCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    responseSample = `${responseSample}${buffer}`.slice(0, maxResponseSampleLength);
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? '';

    for (const rawEvent of events) {
      const parsed = parseSseEvent(rawEvent);
      if (parsed) {
        eventCount += 1;
        onEvent?.(parsed);
      }
    }
  }

  if (buffer.trim()) {
    const parsed = parseSseEvent(buffer);
    if (parsed) {
      eventCount += 1;
      onEvent?.(parsed);
    }
  }

  if (!eventCount) {
    throw createStreamingFormatError(response, responseSample || buffer);
  }
}

export async function releaseCopilotThread(projectId, conversationId) {
  const path = `/threads/${encodeURIComponent(projectId)}/${encodeURIComponent(conversationId)}`;
  const response = await fetch(createCodexServiceUrl(path), { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }
  return response.json();
}
