import {
  createConversationHeaders,
  createCopilotServiceUrl,
} from './copilotServiceApi.js';

const maxResponseSampleLength = 800;

// 解析单个 SSE 事件，只处理 data 行并兼容纯文本增量。
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

// 后端未返回 SSE 时保留响应样本，方便页面显示明确错误。
function createStreamingFormatError(response, responseSample) {
  const contentType = response.headers.get('content-type') || 'unknown content type';
  const sample = String(responseSample || '').trim().slice(0, 160);
  const detail = sample ? ` Response: ${sample}` : '';
  return new Error(`No SSE events were received from the Copilot service (${contentType}).${detail}`);
}

// 非 2xx 响应优先读取后端 JSON 错误，其次回退到文本内容。
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

// 兼容不支持 ReadableStream 的环境，一次性文本也按 SSE 分段派发。
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

// 发起 Copilot 对话请求，并将后端 SSE 事件逐个派发给页面状态机。
export async function streamCopilotChat({
  body,
  conversationId,
  onEvent,
  signal,
}) {
  const response = await fetch(createCopilotServiceUrl('/chat'), {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...createConversationHeaders(conversationId),
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
    // SSE 事件以空行分隔，最后一段可能是不完整事件，需要留到下一次读取。
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
    // 流结束后处理残留 buffer，避免最后一个事件没有尾随空行时丢失。
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

// 中止 EdgeOne 运行时中指定会话的当前生成任务。
export async function stopCopilotConversation(conversationId) {
  const response = await fetch(createCopilotServiceUrl('/stop'), {
    body: JSON.stringify({ conversation_id: conversationId }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }
  return response.json();
}

// 删除 EdgeOne 会话存储中的会话记录；前端本地索引由调用页面同步清理。
export async function deleteCopilotConversation(conversationId, userId) {
  const response = await fetch(createCopilotServiceUrl('/delete-conversation'), {
    body: JSON.stringify({ conversation_id: conversationId, user_id: userId }),
    headers: {
      'Content-Type': 'application/json',
      ...createConversationHeaders(conversationId),
    },
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }
  return response.json();
}
