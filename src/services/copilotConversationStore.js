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

// 复制持久化数据，避免页面层直接修改存储中的引用。
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

// 读取旧版会话缓存，用于迁移到项目级表结构。
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

// 会话归一化保证历史数据、demo seed 和新建会话具有同一字段形态。
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

// 消息归一化保留状态、产物和来源引用，供会话流式更新复用。
function normalizeMessage(message) {
  return {
    agentId: message.agentId ?? '',
    attachments: Array.isArray(message.attachments)
      ? message.attachments.map((attachment) => ({
          id: attachment.id ?? '',
          kind: attachment.kind ?? 'knowledge_file',
          sourceUrl: attachment.sourceUrl ?? '',
          title: attachment.title ?? 'Untitled attachment',
        }))
      : [],
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
    uiBlocks: Array.isArray(message.uiBlocks) ? clone(message.uiBlocks) : [],
    updatedAt: message.updatedAt ?? message.createdAt ?? nowIso(),
    userName: message.userName ?? '',
    warnings: Array.isArray(message.warnings) ? message.warnings : [],
  };
}

// 产物归一化统一内容格式、来源引用和修订关系。
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
    previewData: artifact.previewData && typeof artifact.previewData === 'object' ? clone(artifact.previewData) : {},
    sourceIds: Array.isArray(artifact.sourceIds) ? artifact.sourceIds : [],
    sourceMessageId: artifact.sourceMessageId ?? '',
    status: artifact.status ?? 'ready',
    summary: artifact.summary ?? '',
    taskId: artifact.taskId ?? '',
    taskKey: artifact.taskKey ?? artifact.taskType ?? '',
    taskType: artifact.taskType ?? '',
    title: artifact.title ?? 'Untitled artifact',
    type: artifact.type ?? 'reply',
    updatedAt: artifact.updatedAt ?? artifact.createdAt ?? nowIso(),
    workflowId: artifact.workflowId ?? '',
  };
}

// 来源归一化统一知识库、网页和上下文引用的字段形态。
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

// 运行记录用于标记单次生成任务的开始、结束、失败和等待状态。
function normalizeRun(run) {
  return {
    acknowledgedAt: run.acknowledgedAt ?? '',
    conversationId: run.conversationId,
    endedAt: run.endedAt ?? '',
    error: run.error ?? '',
    errorCode: run.errorCode ?? '',
    id: run.id || createProjectEntityId('copilot-run'),
    operation: run.operation ?? '',
    originalMessage: run.originalMessage ?? '',
    requiredField: run.requiredField ?? '',
    resolvedAt: run.resolvedAt ?? '',
    startedAt: run.startedAt ?? nowIso(),
    status: run.status ?? 'running',
    currentTaskIndex: Number.isFinite(run.currentTaskIndex) ? run.currentTaskIndex : 0,
    taskKey: run.taskKey ?? run.taskType ?? '',
    taskType: run.taskType ?? '',
    workflowId: run.workflowId ?? '',
    workflowKey: run.workflowKey ?? '',
  };
}

// 没有历史会话时创建空会话，保证工作台始终有可选会话。
function createFallbackConversation(projectId) {
  return normalizeConversation(projectId, {
    id: createProjectEntityId('copilot-conversation'),
    title: 'New conversation',
    updatedAt: nowIso(),
  });
}

// 清理旧默认历史时只匹配系统生成的默认会话 ID。
function isDefaultConversationId(projectId, id = '') {
  return id.startsWith('copilot-default-') || id.startsWith(`${projectId}-conv-`);
}

// 默认 seed 产物按项目 ID 前缀识别，避免误删用户创建的数据。
function isDefaultSeedEntityId(projectId, id = '') {
  return (
    id.startsWith(`${projectId}-artifact-`) ||
    id.startsWith(`${projectId}-message-`) ||
    id.startsWith(`${projectId}-run-`) ||
    id.startsWith(`${projectId}-source-`)
  );
}

// 移除旧默认历史，保留用户新建或编辑过的会话数据。
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

// demo seed 只补充缺失实体，不覆盖用户已有实体。
function mergeSeedEntities(currentEntities = [], seedEntities = [], replaceUiDemo = false) {
  const currentById = new Map(currentEntities.map((entity) => [entity.id, entity]));
  const seedIds = new Set(seedEntities.map((entity) => entity.id));
  const mergedSeedEntities = seedEntities.map((entity) =>
    replaceUiDemo && entity.id.includes('-demo-ui-')
      ? entity
      : currentById.get(entity.id) ?? entity,
  );
  return [...mergedSeedEntities, ...currentEntities.filter((entity) => !seedIds.has(entity.id))];
}

// 将新版 demo 会话合并进当前状态，保留本地历史。
function mergeCopilotSeed(state, seed, replaceUiDemo = false) {
  if (!seed) return state;
  return {
    artifacts: mergeSeedEntities(state.artifacts, seed.artifacts, replaceUiDemo),
    conversations: mergeSeedEntities(state.conversations, seed.conversations, replaceUiDemo),
    messages: mergeSeedEntities(state.messages, seed.messages, replaceUiDemo),
    runs: mergeSeedEntities(state.runs, seed.runs, replaceUiDemo),
    sources: mergeSeedEntities(state.sources, seed.sources, replaceUiDemo),
  };
}

// 创建新会话时立即归一化，保证后续写入和读取使用同一结构。
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

// 读取会话状态时同时处理旧缓存迁移、默认历史清理和中断运行恢复。
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
  // 页面刷新后仍处于 running 的任务视为中断，避免界面一直停在生成中。
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
    state = mergeCopilotSeed(state, demoSeed, true);
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

// 保存会话状态时按表拆分，降低单个 localStorage 值过大的风险。
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
