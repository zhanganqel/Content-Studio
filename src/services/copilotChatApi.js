import { createBackendUrl, getBackendConversationId } from './backendApi.js';

const maxResponseSampleLength = 800;

function isEdgeOneAccessRestricted(text) {
  return /eo_time missing|Access Restricted|Authentication Expired|UNAUTHORIZED/i.test(String(text ?? ''));
}

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
  if (isEdgeOneAccessRestricted(responseSample)) {
    return new Error('EdgeOne backend access is restricted or the preview link has expired.');
  }

  const contentType = response.headers.get('content-type') || 'unknown content type';
  return new Error(`No SSE events were received from the backend (${contentType}).`);
}

async function readErrorResponse(response) {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return data?.error || data?.message || `Request failed (${response.status})`;
    }

    const text = (await response.text()) || `Request failed (${response.status})`;
    if (response.status === 401 && isEdgeOneAccessRestricted(text)) {
      return 'EdgeOne backend access is restricted or the preview link has expired.';
    }

    return text;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export async function streamCopilotChat({
  body,
  conversationId,
  onEvent,
  signal,
}) {
  const response = await fetch(createBackendUrl('/chat'), {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'makers-conversation-id': conversationId || getBackendConversationId(),
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
