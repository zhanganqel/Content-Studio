export const copilotAttachmentLimits = {
  maxAttachments: 8,
  maxCharactersPerAttachment: 12000,
  maxTotalCharacters: 48000,
};

export const copilotEventTypes = new Set([
  'process_delta',
  'message_delta',
  'source',
  'artifact',
  'task_status',
  'workflow_status',
  'error_message',
  'done',
]);

export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createConversationId(randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto)) {
  if (typeof randomUUID !== 'function') {
    throw new Error('This browser cannot create a secure conversation ID.');
  }
  const value = randomUUID();
  if (!uuidPattern.test(value)) throw new Error('Failed to create a valid conversation ID.');
  return value;
}

export function deriveConversationTitle(content, fallback = 'New conversation') {
  const normalized = String(content || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return fallback;
  return normalized.length > 36 ? `${normalized.slice(0, 36)}...` : normalized;
}

export function parseSseFrame(rawFrame) {
  let eventName = '';
  const dataLines = [];

  for (const line of String(rawFrame || '').split(/\r?\n/)) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim();
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  }

  if (!dataLines.length) return null;
  const rawData = dataLines.join('\n').trim();
  if (!rawData || rawData === '[DONE]') return { type: 'done', outcome: 'completed' };

  let payload;
  try {
    payload = JSON.parse(rawData);
  } catch {
    payload = { content: rawData };
  }

  const type = payload?.type || eventName;
  if (!copilotEventTypes.has(type)) return null;
  return { ...payload, type };
}

export function createSseParser(onEvent) {
  let buffer = '';
  let eventCount = 0;

  const dispatch = (frame) => {
    const event = parseSseFrame(frame);
    if (!event) return;
    eventCount += 1;
    onEvent?.(event);
  };

  return {
    finish() {
      if (buffer.trim()) dispatch(buffer);
      buffer = '';
      return eventCount;
    },
    push(chunk) {
      buffer += chunk;
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() || '';
      frames.forEach(dispatch);
      return eventCount;
    },
  };
}

export function validateAttachments(attachments) {
  if (!Array.isArray(attachments)) throw new Error('Attachments must be an array.');
  if (attachments.length > copilotAttachmentLimits.maxAttachments) {
    throw new Error(`A maximum of ${copilotAttachmentLimits.maxAttachments} attachments is allowed.`);
  }

  let totalCharacters = 0;
  const seen = new Set();
  return attachments.map((attachment, index) => {
    const id = String(attachment?.id || '').trim();
    const kind = attachment?.kind;
    const title = String(attachment?.title || '').trim();
    const content = String(attachment?.content || '').trim();
    if (!id || !title || !content) throw new Error(`Attachment ${index + 1} is incomplete.`);
    if (kind !== 'knowledge_item' && kind !== 'knowledge_file') {
      throw new Error(`Attachment ${index + 1} has an invalid kind.`);
    }
    if (content.length > copilotAttachmentLimits.maxCharactersPerAttachment) {
      throw new Error(`Attachment ${title} is too large.`);
    }
    const key = `${kind}:${id}`;
    if (seen.has(key)) throw new Error(`Duplicate attachment: ${title}.`);
    seen.add(key);
    totalCharacters += content.length;
    if (totalCharacters > copilotAttachmentLimits.maxTotalCharacters) {
      throw new Error('The total attachment content is too large.');
    }
    return {
      content,
      id,
      kind,
      sourceUrl: attachment.sourceUrl ? String(attachment.sourceUrl) : undefined,
      title,
    };
  });
}
