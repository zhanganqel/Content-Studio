interface StoredMessage {
  content?: unknown;
  createdAt?: number | string;
  messageId?: string;
  metadata?: Record<string, unknown>;
  role?: string;
}

function contentToText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (!item || typeof item !== 'object') return '';
        const value = item as Record<string, unknown>;
        return String(value.text ?? value.output_text ?? '');
      })
      .filter(Boolean)
      .join('\n');
  }
  if (content && typeof content === 'object') {
    const value = content as Record<string, unknown>;
    return contentToText(value.content ?? value.output ?? value.text ?? '');
  }
  return '';
}

function toTimestamp(value: number | string | undefined) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}

function stripAttachmentContext(content: string) {
  return content.split(/\n\n# USER-SELECTED REFERENCE MATERIAL\b/, 1)[0].trim();
}

function pickMetadataList(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : [];
}

export function normalizeStoredMessages(items: StoredMessage[]) {
  const messages = items
    .filter((item) => item?.metadata?.contentStudioIndexOnly !== true)
    .map((item) => {
      if (item.role !== 'user' && item.role !== 'assistant') return null;
      const content = stripAttachmentContext(contentToText(item.content));
      if (!content) return null;
      const createdAt = toTimestamp(item.createdAt);
      return {
        attachments: pickMetadataList(item.metadata, 'contentStudioAttachments'),
        content,
        createdAt: new Date(createdAt).toISOString(),
        id: item.messageId || `${item.role}-${createdAt}`,
        role: item.role,
        sources: pickMetadataList(item.metadata, 'contentStudioSources'),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  return messages.filter((message, index) => {
    const previous = messages[index - 1];
    return !previous || previous.role !== message.role || previous.content !== message.content;
  });
}
