import { createConversationId, deriveConversationTitle } from './contracts.js';

function nowIso() {
  return new Date().toISOString();
}

function createEntityId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

export function createDraftConversation(projectId, title = 'New conversation') {
  const createdAt = nowIso();
  return {
    artifactIds: [],
    createdAt,
    id: createConversationId(),
    messageCount: 0,
    messageIds: [],
    persisted: false,
    pinned: false,
    projectId,
    title,
    updatedAt: createdAt,
  };
}

export function normalizeServerConversation(projectId, conversation, preferences = {}) {
  const id = String(conversation?.id || '').trim();
  const createdAt = conversation?.createdAt || conversation?.updatedAt || nowIso();
  return {
    artifactIds: [],
    createdAt,
    id,
    messageCount: Number(conversation?.messageCount || 0),
    messageIds: [],
    persisted: true,
    pinned: preferences.pinnedIds?.includes(id) || false,
    preview: conversation?.preview || '',
    projectId,
    title: preferences.titleOverrides?.[id] || conversation?.title || 'New conversation',
    updatedAt: conversation?.updatedAt || createdAt,
  };
}

export function createLocalMessage(input) {
  const createdAt = input.createdAt || nowIso();
  return {
    agentId: input.agentId || '',
    artifactIds: [],
    attachments: Array.isArray(input.attachments) ? input.attachments : [],
    content: input.content || '',
    conversationId: input.conversationId,
    createdAt,
    error: '',
    id: input.id || createEntityId('copilot-message'),
    intent: '',
    role: input.role || 'assistant',
    sourceIds: Array.isArray(input.sourceIds) ? input.sourceIds : [],
    status: input.status || 'done',
    statusText: input.statusText || '',
    uiBlocks: [],
    updatedAt: createdAt,
    userName: input.userName || '',
    warnings: [],
  };
}

export function createInitialCopilotState(projectId = '') {
  return {
    artifacts: [],
    conversations: [],
    errorByConversation: {},
    loading: true,
    messages: [],
    model: 'EdgeOne',
    projectId,
    runs: [],
    sources: [],
  };
}

function updateConversation(state, conversationId, updater) {
  return state.conversations.map((conversation) =>
    conversation.id === conversationId ? updater(conversation) : conversation,
  );
}

function updateMessage(state, messageId, updater) {
  return state.messages.map((message) =>
    message.id === messageId ? updater(message) : message,
  );
}

export function copilotReducer(state, action) {
  switch (action.type) {
    case 'reset_project':
      return createInitialCopilotState(action.projectId);
    case 'load_project':
      return {
        ...state,
        conversations: action.conversations,
        loading: false,
        model: action.model || state.model,
      };
    case 'set_model':
      return { ...state, model: action.model || 'EdgeOne' };
    case 'add_conversation':
      return {
        ...state,
        conversations: [action.conversation, ...state.conversations],
      };
    case 'load_history': {
      const previousIds = new Set(
        state.conversations.find((item) => item.id === action.conversationId)?.messageIds || [],
      );
      const sources = [];
      const messages = action.messages.map((message) => {
        const sourceIds = (message.sources || []).map((source) => {
          const id = `${message.id}:${source.id || createEntityId('history-source')}`;
          sources.push({
            conversationId: action.conversationId,
            id,
            metadata: source.metadata || {},
            originId: source.id || '',
            snippet: source.snippet || '',
            title: source.title || 'Source',
            type: source.type || 'context',
            url: source.url || '',
          });
          return id;
        });
        return createLocalMessage({
          ...message,
          conversationId: action.conversationId,
          sourceIds,
          status: 'done',
        });
      });
      return {
        ...state,
        conversations: updateConversation(state, action.conversationId, (conversation) => ({
          ...conversation,
          messageCount: messages.length,
          messageIds: messages.map((message) => message.id),
          persisted: true,
        })),
        messages: [
          ...state.messages.filter(
            (message) => message.conversationId !== action.conversationId && !previousIds.has(message.id),
          ),
          ...messages,
        ],
        sources: [
          ...state.sources.filter((source) => source.conversationId !== action.conversationId),
          ...sources,
        ],
      };
    }
    case 'send_start': {
      const { assistantMessage, conversationId, run, userMessage } = action;
      return {
        ...state,
        conversations: updateConversation(state, conversationId, (conversation) => ({
          ...conversation,
          messageCount: conversation.messageCount + 2,
          messageIds: [...conversation.messageIds, userMessage.id, assistantMessage.id],
          persisted: true,
          title: deriveConversationTitle(userMessage.content, conversation.title),
          updatedAt: userMessage.createdAt,
        })),
        errorByConversation: { ...state.errorByConversation, [conversationId]: '' },
        messages: [...state.messages, userMessage, assistantMessage],
        runs: [run, ...state.runs.filter((item) => item.conversationId !== conversationId || item.status !== 'running')],
      };
    }
    case 'process_delta':
      return {
        ...state,
        messages: updateMessage(state, action.messageId, (message) => ({
          ...message,
          agentId: action.event.agentId || message.agentId,
          statusText: action.event.content || message.statusText,
          updatedAt: nowIso(),
        })),
      };
    case 'message_delta':
      return {
        ...state,
        messages: updateMessage(state, action.messageId, (message) => ({
          ...message,
          agentId: action.event.agentId || message.agentId,
          content: `${message.content}${action.event.content ?? action.event.delta ?? ''}`,
          updatedAt: nowIso(),
        })),
      };
    case 'source': {
      const source = {
        conversationId: action.conversationId,
        id: createEntityId('copilot-source'),
        metadata: action.source.metadata || {},
        originId: action.source.id || '',
        snippet: action.source.snippet || '',
        title: action.source.title || 'Source',
        type: action.source.type || 'context',
        url: action.source.url || '',
      };
      return {
        ...state,
        messages: updateMessage(state, action.messageId, (message) => ({
          ...message,
          sourceIds: [...new Set([...message.sourceIds, source.id])],
          updatedAt: nowIso(),
        })),
        sources: [source, ...state.sources],
      };
    }
    case 'send_finish': {
      const status = action.outcome === 'error'
        ? 'error'
        : action.outcome === 'cancelled'
          ? 'interrupted'
          : 'done';
      const endedAt = nowIso();
      return {
        ...state,
        messages: updateMessage(state, action.messageId, (message) => ({
          ...message,
          status,
          statusText: '',
          updatedAt: endedAt,
        })),
        runs: state.runs.map((run) =>
          run.id === action.runId ? { ...run, endedAt, status } : run,
        ),
      };
    }
    case 'send_error': {
      const endedAt = nowIso();
      return {
        ...state,
        errorByConversation: {
          ...state.errorByConversation,
          [action.conversationId]: action.error,
        },
        messages: updateMessage(state, action.messageId, (message) => ({
          ...message,
          content: action.error,
          error: action.error,
          status: 'error',
          statusText: '',
          updatedAt: endedAt,
        })),
        runs: state.runs.map((run) =>
          run.id === action.runId ? { ...run, endedAt, status: 'error' } : run,
        ),
      };
    }
    case 'rename_conversation':
      return {
        ...state,
        conversations: updateConversation(state, action.conversationId, (conversation) => ({
          ...conversation,
          title: action.title,
        })),
      };
    case 'toggle_pin':
      return {
        ...state,
        conversations: updateConversation(state, action.conversationId, (conversation) => ({
          ...conversation,
          pinned: !conversation.pinned,
        })),
      };
    case 'delete_conversation':
      return {
        ...state,
        artifacts: state.artifacts.filter((item) => item.conversationId !== action.conversationId),
        conversations: state.conversations.filter((item) => item.id !== action.conversationId),
        messages: state.messages.filter((item) => item.conversationId !== action.conversationId),
        runs: state.runs.filter((item) => item.conversationId !== action.conversationId),
        sources: state.sources.filter((item) => item.conversationId !== action.conversationId),
      };
    default:
      return state;
  }
}

export function createRun(conversationId) {
  const startedAt = nowIso();
  return {
    acknowledgedAt: '',
    conversationId,
    endedAt: '',
    id: createEntityId('copilot-run'),
    startedAt,
    status: 'running',
  };
}
