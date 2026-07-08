import {
  createProjectEntityId,
  hasProjectTable,
  readProjectTable,
  writeProjectTable,
} from './projectScopedStore.js';

const tableNames = {
  artifacts: 'copilot-artifacts',
  conversations: 'copilot-conversations',
  messages: 'copilot-messages',
  runs: 'copilot-runs',
  sources: 'copilot-sources',
};

const legacyConversationsStorageKeyPrefix = 'content-studio-copilot-conversations:';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function getLegacyConversations(projectId) {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(`${legacyConversationsStorageKeyPrefix}${projectId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeConversation(projectId, conversation, index = 0) {
  const createdAt = conversation.createdAt ?? conversation.updatedAt ?? nowIso();
  const id = conversation.id || createProjectEntityId('copilot-conversation');

  return {
    artifactIds: Array.isArray(conversation.artifactIds) ? conversation.artifactIds : [],
    archived: Boolean(conversation.archived),
    createdAt,
    id,
    messageIds: Array.isArray(conversation.messageIds) ? conversation.messageIds : [],
    pinned: Boolean(conversation.pinned),
    projectId,
    title: conversation.title || `Conversation ${index + 1}`,
    updatedAt: conversation.updatedAt ?? createdAt,
  };
}

function normalizeMessage(message) {
  return {
    agentId: message.agentId ?? '',
    artifactIds: Array.isArray(message.artifactIds) ? message.artifactIds : [],
    content: message.content ?? '',
    conversationId: message.conversationId,
    createdAt: message.createdAt ?? nowIso(),
    error: message.error ?? '',
    id: message.id || createProjectEntityId('copilot-message'),
    role: message.role ?? 'assistant',
    sourceIds: Array.isArray(message.sourceIds) ? message.sourceIds : [],
    status: message.status ?? 'done',
    statusText: message.statusText ?? '',
    updatedAt: message.updatedAt ?? message.createdAt ?? nowIso(),
  };
}

function normalizeArtifact(artifact) {
  return {
    content: artifact.content ?? '',
    conversationId: artifact.conversationId,
    createdAt: artifact.createdAt ?? nowIso(),
    id: artifact.id || createProjectEntityId('copilot-artifact'),
    sourceIds: Array.isArray(artifact.sourceIds) ? artifact.sourceIds : [],
    sourceMessageId: artifact.sourceMessageId ?? '',
    status: artifact.status ?? 'ready',
    summary: artifact.summary ?? '',
    title: artifact.title ?? 'Untitled artifact',
    type: artifact.type ?? 'reply',
    updatedAt: artifact.updatedAt ?? artifact.createdAt ?? nowIso(),
  };
}

function normalizeSource(source) {
  return {
    conversationId: source.conversationId ?? '',
    id: source.id || createProjectEntityId('copilot-source'),
    metadata: source.metadata ?? {},
    originId: source.originId ?? '',
    snippet: source.snippet ?? '',
    title: source.title ?? 'Source',
    type: source.type ?? 'context',
    url: source.url ?? '',
  };
}

function normalizeRun(run) {
  return {
    conversationId: run.conversationId,
    endedAt: run.endedAt ?? '',
    error: run.error ?? '',
    id: run.id || createProjectEntityId('copilot-run'),
    startedAt: run.startedAt ?? nowIso(),
    status: run.status ?? 'running',
  };
}

function createSeedConversations(projectId, defaultConversations = []) {
  return defaultConversations.map((conversation, index) =>
    normalizeConversation(projectId, conversation, index),
  );
}

function createFallbackConversation(projectId) {
  return normalizeConversation(projectId, {
    id: createProjectEntityId('copilot-conversation'),
    title: 'New conversation',
    updatedAt: nowIso(),
  });
}

export function createCopilotConversation(projectId, title, options = {}) {
  const createdAt = nowIso();

  return normalizeConversation(projectId, {
    ...options,
    createdAt,
    id: createProjectEntityId('copilot-conversation'),
    title,
    updatedAt: createdAt,
  });
}

export function createCopilotMessage(input) {
  return normalizeMessage({
    createdAt: nowIso(),
    id: createProjectEntityId('copilot-message'),
    status: 'done',
    ...input,
  });
}

export function createCopilotArtifact(input) {
  return normalizeArtifact({
    createdAt: nowIso(),
    id: createProjectEntityId('copilot-artifact'),
    updatedAt: nowIso(),
    ...input,
  });
}

export function createCopilotSource(input) {
  return normalizeSource({
    id: createProjectEntityId('copilot-source'),
    ...input,
  });
}

export function createCopilotRun(input) {
  return normalizeRun({
    id: createProjectEntityId('copilot-run'),
    startedAt: nowIso(),
    ...input,
  });
}

export function getCopilotConversationState(projectId, defaultConversations = []) {
  const hasNewConversations = hasProjectTable(projectId, tableNames.conversations);
  const storedConversations = hasNewConversations
    ? readProjectTable(projectId, tableNames.conversations, [])
    : [];
  const legacyConversations = hasNewConversations ? [] : getLegacyConversations(projectId);
  const seedSource = storedConversations.length
    ? storedConversations
    : legacyConversations.length
      ? legacyConversations
      : defaultConversations;
  const conversations = (seedSource.length ? seedSource : [createFallbackConversation(projectId)]).map(
    (conversation, index) => normalizeConversation(projectId, conversation, index),
  );
  const state = {
    artifacts: readProjectTable(projectId, tableNames.artifacts, []).map(normalizeArtifact),
    conversations,
    messages: readProjectTable(projectId, tableNames.messages, []).map(normalizeMessage),
    runs: readProjectTable(projectId, tableNames.runs, []).map(normalizeRun),
    sources: readProjectTable(projectId, tableNames.sources, []).map(normalizeSource),
  };

  if (!hasNewConversations) {
    saveCopilotConversationState(projectId, state);
  }

  return state;
}

export function saveCopilotConversationState(projectId, state) {
  const normalizedState = {
    artifacts: (state.artifacts ?? []).map(normalizeArtifact),
    conversations: (state.conversations ?? []).map((conversation, index) =>
      normalizeConversation(projectId, conversation, index),
    ),
    messages: (state.messages ?? []).map(normalizeMessage),
    runs: (state.runs ?? []).map(normalizeRun),
    sources: (state.sources ?? []).map(normalizeSource),
  };

  writeProjectTable(projectId, tableNames.conversations, normalizedState.conversations);
  writeProjectTable(projectId, tableNames.messages, normalizedState.messages);
  writeProjectTable(projectId, tableNames.artifacts, normalizedState.artifacts);
  writeProjectTable(projectId, tableNames.sources, normalizedState.sources);
  writeProjectTable(projectId, tableNames.runs, normalizedState.runs);

  return normalizedState;
}

export function getConversationMessages(state, conversationId) {
  const messageIdSet = new Set(
    state.conversations.find((conversation) => conversation.id === conversationId)?.messageIds ?? [],
  );

  return clone(
    (state.messages ?? [])
      .filter((message) => message.conversationId === conversationId || messageIdSet.has(message.id))
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
  );
}

export function getConversationArtifacts(state, conversationId) {
  const artifactIdSet = new Set(
    state.conversations.find((conversation) => conversation.id === conversationId)?.artifactIds ?? [],
  );

  return clone(
    (state.artifacts ?? [])
      .filter((artifact) => artifact.conversationId === conversationId || artifactIdSet.has(artifact.id))
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
  );
}

export function deriveConversationTitle(content, fallbackTitle) {
  const normalized = String(content ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return fallbackTitle;

  return normalized.length > 28 ? `${normalized.slice(0, 28)}...` : normalized;
}
