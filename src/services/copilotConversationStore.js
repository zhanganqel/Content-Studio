import {
  createProjectEntityId,
  hasProjectTable,
  readProjectTable,
  writeProjectTable,
} from './projectScopedStore.js';
import {
  copilotDemoSeedVersion,
  getCopilotConversationSeed,
} from '../data/demo/copilotConversationSeeds.js';

const tableNames = {
  artifacts: 'copilot-artifacts',
  conversations: 'copilot-conversations',
  messages: 'copilot-messages',
  runs: 'copilot-runs',
  seedMeta: 'copilot-seed-meta',
  sources: 'copilot-sources',
};

const defaultHistoryCleanupVersion = 1;
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
    threadId: conversation.threadId ?? '',
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
    intent: message.intent ?? '',
    role: message.role ?? 'assistant',
    sourceIds: Array.isArray(message.sourceIds) ? message.sourceIds : [],
    status: message.status ?? 'done',
    statusText: message.statusText ?? '',
    updatedAt: message.updatedAt ?? message.createdAt ?? nowIso(),
    warnings: Array.isArray(message.warnings) ? message.warnings : [],
  };
}

function normalizeArtifact(artifact) {
  return {
    changedSections: Array.isArray(artifact.changedSections) ? artifact.changedSections : [],
    changeSummary: artifact.changeSummary ?? '',
    content: artifact.content ?? '',
    contentFormat: artifact.contentFormat ?? 'markdown',
    conversationId: artifact.conversationId,
    createdAt: artifact.createdAt ?? nowIso(),
    evidenceGaps: Array.isArray(artifact.evidenceGaps) ? artifact.evidenceGaps : [],
    id: artifact.id || createProjectEntityId('copilot-artifact'),
    metadata: artifact.metadata ?? {},
    parentArtifactId: artifact.parentArtifactId ?? '',
    sourceIds: Array.isArray(artifact.sourceIds) ? artifact.sourceIds : [],
    sourceMessageId: artifact.sourceMessageId ?? '',
    status: artifact.status ?? 'ready',
    summary: artifact.summary ?? '',
    taskType: artifact.taskType ?? '',
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
    acknowledgedAt: run.acknowledgedAt ?? '',
    conversationId: run.conversationId,
    endedAt: run.endedAt ?? '',
    error: run.error ?? '',
    errorCode: run.errorCode ?? '',
    id: run.id || createProjectEntityId('copilot-run'),
    originalMessage: run.originalMessage ?? '',
    requiredField: run.requiredField ?? '',
    resolvedAt: run.resolvedAt ?? '',
    startedAt: run.startedAt ?? nowIso(),
    status: run.status ?? 'running',
    taskType: run.taskType ?? '',
  };
}

function createFallbackConversation(projectId) {
  return normalizeConversation(projectId, {
    id: createProjectEntityId('copilot-conversation'),
    title: 'New conversation',
    updatedAt: nowIso(),
  });
}

function isDefaultConversationId(projectId, id = '') {
  return id.startsWith('copilot-default-') || id.startsWith(`${projectId}-conv-`);
}

function isDefaultSeedEntityId(projectId, id = '') {
  return (
    id.startsWith(`${projectId}-artifact-`) ||
    id.startsWith(`${projectId}-message-`) ||
    id.startsWith(`${projectId}-run-`) ||
    id.startsWith(`${projectId}-source-`)
  );
}

function removeDefaultHistory(projectId, state) {
  const removedConversationIds = new Set(
    (state.conversations ?? [])
      .filter((conversation) => isDefaultConversationId(projectId, conversation.id))
      .map((conversation) => conversation.id),
  );

  return {
    artifacts: (state.artifacts ?? []).filter(
      (artifact) =>
        !removedConversationIds.has(artifact.conversationId) &&
        !isDefaultSeedEntityId(projectId, artifact.id),
    ),
    conversations: (state.conversations ?? []).filter(
      (conversation) => !removedConversationIds.has(conversation.id),
    ),
    messages: (state.messages ?? []).filter(
      (message) =>
        !removedConversationIds.has(message.conversationId) &&
        !isDefaultSeedEntityId(projectId, message.id),
    ),
    runs: (state.runs ?? []).filter(
      (run) =>
        !removedConversationIds.has(run.conversationId) &&
        !isDefaultSeedEntityId(projectId, run.id),
    ),
    sources: (state.sources ?? []).filter(
      (source) =>
        !removedConversationIds.has(source.conversationId) &&
        !isDefaultSeedEntityId(projectId, source.id),
    ),
  };
}

function mergeSeedEntities(currentEntities = [], seedEntities = []) {
  const currentIds = new Set(currentEntities.map((entity) => entity.id));
  return [...seedEntities.filter((entity) => !currentIds.has(entity.id)), ...currentEntities];
}

function mergeCopilotSeed(state, seed) {
  if (!seed) return state;
  return {
    artifacts: mergeSeedEntities(state.artifacts, seed.artifacts),
    conversations: mergeSeedEntities(state.conversations, seed.conversations),
    messages: mergeSeedEntities(state.messages, seed.messages),
    runs: mergeSeedEntities(state.runs, seed.runs),
    sources: mergeSeedEntities(state.sources, seed.sources),
  };
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

export function getCopilotConversationState(projectId) {
  const hasNewConversations = hasProjectTable(projectId, tableNames.conversations);
  const storedConversations = hasNewConversations
    ? readProjectTable(projectId, tableNames.conversations, [])
    : [];
  const legacyConversations = hasNewConversations ? [] : getLegacyConversations(projectId);
  const seedSource = storedConversations.length
    ? storedConversations
    : legacyConversations.length
      ? legacyConversations
      : [];
  const conversations = (seedSource.length ? seedSource : [createFallbackConversation(projectId)]).map(
    (conversation, index) => normalizeConversation(projectId, conversation, index),
  );
  const storedRuns = readProjectTable(projectId, tableNames.runs, []).map(normalizeRun);
  const shouldRecoverInterruptedRuns = storedRuns.some((run) => run.status === 'running');
  const runs = storedRuns.map((run) =>
    run.status === 'running'
      ? { ...run, endedAt: nowIso(), status: 'interrupted' }
      : run,
  );
  const latestRuns = runs.reduce((result, run) => {
    const current = result.get(run.conversationId);
    if (!current || Date.parse(run.startedAt) > Date.parse(current.startedAt)) {
      result.set(run.conversationId, run);
    }
    return result;
  }, new Map());
  let state = {
    artifacts: readProjectTable(projectId, tableNames.artifacts, []).map(normalizeArtifact),
    conversations,
    messages: readProjectTable(projectId, tableNames.messages, []).map(normalizeMessage).map((message) => {
      if (message.status !== 'streaming') return message;
      const latestRun = latestRuns.get(message.conversationId);
      if (!latestRun || latestRun.status === 'running') return message;
      return { ...message, status: latestRun.status, statusText: '', updatedAt: latestRun.endedAt || nowIso() };
    }),
    runs,
    sources: readProjectTable(projectId, tableNames.sources, []).map(normalizeSource),
  };
  const seedMeta = readProjectTable(projectId, tableNames.seedMeta, {});
  const demoSeed = getCopilotConversationSeed(projectId);
  const shouldCleanupDefaultHistory =
    seedMeta.defaultHistoryCleanupVersion !== defaultHistoryCleanupVersion;
  const shouldInstallDemoSeed =
    Boolean(demoSeed) && seedMeta.copilotDemoSeedVersion !== copilotDemoSeedVersion;

  if (shouldCleanupDefaultHistory) {
    state = removeDefaultHistory(projectId, state);

    if (!state.conversations.length) {
      state = {
        ...state,
        conversations: [createFallbackConversation(projectId)],
      };
    }

  }

  if (shouldInstallDemoSeed) {
    state = mergeCopilotSeed(state, demoSeed);
  }

  if (shouldCleanupDefaultHistory || shouldInstallDemoSeed) {
    writeProjectTable(projectId, tableNames.seedMeta, {
      ...seedMeta,
      copilotDemoSeedVersion: shouldInstallDemoSeed
        ? copilotDemoSeedVersion
        : seedMeta.copilotDemoSeedVersion,
      defaultHistoryCleanupVersion,
    });
  }

  if (
    !hasNewConversations ||
    shouldCleanupDefaultHistory ||
    shouldInstallDemoSeed ||
    shouldRecoverInterruptedRuns
  ) {
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
