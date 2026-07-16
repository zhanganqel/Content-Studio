import { createSseParser, validateAttachments } from './contracts.js';

function getBaseUrl() {
  return String(import.meta.env.VITE_COPILOT_SERVER_URL || '').replace(/\/$/, '');
}

function createUrl(path) {
  const normalizedPath = String(path || '').startsWith('/') ? path : `/${path}`;
  const base = getBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
}

async function readError(response) {
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

async function requestJson(path, { body, headers = {}, method = 'POST', signal } = {}) {
  const response = await fetch(createUrl(path), {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    method,
    signal,
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

export function getCopilotHealth(signal) {
  return requestJson('/health', { method: 'GET', signal });
}

export function listCopilotConversations({ projectId, signal, userId }) {
  return requestJson('/conversations', { body: { projectId, userId }, signal });
}

export function getCopilotHistory({ conversationId, signal, userId }) {
  return requestJson('/history', { body: { conversationId, userId }, signal });
}

export function deleteCopilotConversation({ conversationId, signal, userId }) {
  return requestJson('/delete-conversation', { body: { conversationId, userId }, signal });
}

export function stopCopilotConversation(conversationId) {
  return requestJson('/stop', {
    body: { conversationId },
    headers: { 'Makers-Conversation-Id': conversationId },
  });
}

export async function streamCopilotMessage({
  attachments = [],
  conversationId,
  message,
  onEvent,
  projectId,
  signal,
  userId,
}) {
  const normalizedAttachments = validateAttachments(attachments);
  const response = await fetch(createUrl('/chat'), {
    body: JSON.stringify({
      attachments: normalizedAttachments,
      conversationId,
      message,
      projectId,
      userId,
    }),
    headers: {
      'Content-Type': 'application/json',
      'Makers-Conversation-Id': conversationId,
    },
    method: 'POST',
    signal,
  });
  if (!response.ok) throw new Error(await readError(response));
  if (!response.body?.getReader) throw new Error('Streaming response is not available.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser(onEvent);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.push(decoder.decode(value, { stream: true }));
  }
  parser.push(decoder.decode());
  if (!parser.finish()) throw new Error('No SSE events were received from the Copilot service.');
}
