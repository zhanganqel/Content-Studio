import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  deleteCopilotConversation,
  getCopilotHealth,
  getCopilotHistory,
  listCopilotConversations,
  stopCopilotConversation,
  streamCopilotMessage,
} from './client.js';
import {
  copilotReducer,
  createDraftConversation,
  createInitialCopilotState,
  createLocalMessage,
  createRun,
  normalizeServerConversation,
} from './state.js';
import {
  getProjectUiPreferences,
  getProjectUserId,
  saveProjectUiPreferences,
} from './storage.js';

function sortConversations(conversations) {
  return [...conversations].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}

export function useCopilotController({ projectId, untitledLabel = 'New conversation' }) {
  const [state, dispatch] = useReducer(copilotReducer, projectId, createInitialCopilotState);
  const [activeConversationId, setActiveConversationId] = useState('');
  const stateRef = useRef(state);
  const activeControllersRef = useRef(new Map());
  const loadedHistoryRef = useRef(new Set());
  const userId = useMemo(() => getProjectUserId(projectId), [projectId]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const loadHistory = useCallback(async (conversationId, signal) => {
    if (!conversationId || loadedHistoryRef.current.has(conversationId)) return;
    const result = await getCopilotHistory({ conversationId, signal, userId });
    loadedHistoryRef.current.add(conversationId);
    dispatch({
      conversationId,
      messages: Array.isArray(result?.messages) ? result.messages : [],
      type: 'load_history',
    });
  }, [userId]);

  const stopAll = useCallback(() => {
    for (const [conversationId, controller] of activeControllersRef.current.entries()) {
      controller.abort();
      void stopCopilotConversation(conversationId).catch(() => {});
    }
    activeControllersRef.current.clear();
  }, []);

  useEffect(() => {
    stopAll();
    loadedHistoryRef.current = new Set();
    dispatch({ projectId, type: 'reset_project' });
    setActiveConversationId('');
    const controller = new AbortController();

    async function loadProject() {
      const preferences = getProjectUiPreferences(projectId);
      let model = 'EdgeOne';
      let conversations = [];

      try {
        const [health, result] = await Promise.all([
          getCopilotHealth(controller.signal).catch(() => null),
          listCopilotConversations({ projectId, signal: controller.signal, userId }),
        ]);
        model = health?.model || 'EdgeOne';
        conversations = (result?.conversations || [])
          .map((conversation) => normalizeServerConversation(projectId, conversation, preferences))
          .filter((conversation) => conversation.id);
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }

      if (!conversations.length) conversations = [createDraftConversation(projectId, untitledLabel)];
      conversations = sortConversations(conversations);
      const preferredConversation = conversations.find((item) => item.id === preferences.activeConversationId);
      const initialConversation = preferredConversation ?? conversations[0];
      dispatch({ conversations, model, type: 'load_project' });
      setActiveConversationId(initialConversation.id);
      if (initialConversation.persisted) {
        await loadHistory(initialConversation.id, controller.signal).catch(() => {});
      }
    }

    void loadProject();
    return () => controller.abort();
  }, [loadHistory, projectId, stopAll, untitledLabel, userId]);

  useEffect(() => () => stopAll(), [stopAll]);

  const activeConversation = state.conversations.find((item) => item.id === activeConversationId)
    || state.conversations[0]
    || null;

  const selectConversation = useCallback((conversationId) => {
    setActiveConversationId(conversationId);
    const conversation = stateRef.current.conversations.find((item) => item.id === conversationId);
    saveProjectUiPreferences(projectId, {
      activeConversationId: conversationId,
      pinnedIds: stateRef.current.conversations.filter((item) => item.pinned).map((item) => item.id),
      titleOverrides: Object.fromEntries(stateRef.current.conversations.map((item) => [item.id, item.title])),
    });
    if (conversation?.persisted) void loadHistory(conversationId).catch(() => {});
  }, [loadHistory, projectId]);

  const createConversation = useCallback((title = untitledLabel) => {
    const conversation = createDraftConversation(projectId, title);
    dispatch({ conversation, type: 'add_conversation' });
    setActiveConversationId(conversation.id);
    const nextConversations = [conversation, ...stateRef.current.conversations];
    saveProjectUiPreferences(projectId, {
      activeConversationId: conversation.id,
      pinnedIds: nextConversations.filter((item) => item.pinned).map((item) => item.id),
      titleOverrides: Object.fromEntries(nextConversations.map((item) => [item.id, item.title])),
    });
    return conversation.id;
  }, [projectId, untitledLabel]);

  const persistUiPreferences = useCallback((nextConversations, nextActiveConversationId = activeConversationId) => {
    saveProjectUiPreferences(projectId, {
      activeConversationId: nextActiveConversationId,
      pinnedIds: nextConversations.filter((item) => item.pinned).map((item) => item.id),
      titleOverrides: Object.fromEntries(nextConversations.map((item) => [item.id, item.title])),
    });
  }, [activeConversationId, projectId]);

  const renameConversation = useCallback((conversationId, title) => {
    const normalized = String(title || '').trim();
    if (!normalized) return;
    const next = stateRef.current.conversations.map((item) =>
      item.id === conversationId ? { ...item, title: normalized } : item,
    );
    dispatch({ conversationId, title: normalized, type: 'rename_conversation' });
    persistUiPreferences(next);
  }, [persistUiPreferences]);

  const togglePin = useCallback((conversationId) => {
    const next = stateRef.current.conversations.map((item) =>
      item.id === conversationId ? { ...item, pinned: !item.pinned } : item,
    );
    dispatch({ conversationId, type: 'toggle_pin' });
    persistUiPreferences(next);
  }, [persistUiPreferences]);

  const removeConversation = useCallback(async (conversationId) => {
    const conversation = stateRef.current.conversations.find((item) => item.id === conversationId);
    if (!conversation) return;
    if (activeControllersRef.current.has(conversationId)) {
      throw new Error('Stop the active response before deleting this conversation.');
    }
    if (conversation.persisted) {
      await deleteCopilotConversation({ conversationId, userId });
    }
    loadedHistoryRef.current.delete(conversationId);
    dispatch({ conversationId, type: 'delete_conversation' });
    const remaining = stateRef.current.conversations.filter((item) => item.id !== conversationId);
    if (!remaining.length) {
      const replacement = createDraftConversation(projectId, untitledLabel);
      dispatch({ conversation: replacement, type: 'add_conversation' });
      setActiveConversationId(replacement.id);
      persistUiPreferences([replacement], replacement.id);
    } else if (activeConversationId === conversationId) {
      setActiveConversationId(remaining[0].id);
      persistUiPreferences(remaining, remaining[0].id);
    } else {
      persistUiPreferences(remaining, activeConversationId);
    }
  }, [activeConversationId, persistUiPreferences, projectId, untitledLabel, userId]);

  const stopConversation = useCallback(async (conversationId) => {
    const controller = activeControllersRef.current.get(conversationId);
    controller?.abort();
    activeControllersRef.current.delete(conversationId);
    await stopCopilotConversation(conversationId).catch(() => {});
    const runningRun = stateRef.current.runs.find(
      (run) => run.conversationId === conversationId && run.status === 'running',
    );
    const streamingMessage = [...stateRef.current.messages].reverse().find(
      (message) => message.conversationId === conversationId && message.status === 'streaming',
    );
    if (runningRun && streamingMessage) {
      dispatch({
        messageId: streamingMessage.id,
        outcome: 'cancelled',
        runId: runningRun.id,
        type: 'send_finish',
      });
    }
  }, []);

  const sendMessage = useCallback(async ({ attachments = [], content }) => {
    const conversation = stateRef.current.conversations.find((item) => item.id === activeConversationId)
      || stateRef.current.conversations[0];
    const normalizedContent = String(content || '').trim();
    if (!conversation || !normalizedContent || activeControllersRef.current.has(conversation.id)) return;

    const userMessage = createLocalMessage({
      attachments: attachments.map(({ content: _content, ...attachment }) => attachment),
      content: normalizedContent,
      conversationId: conversation.id,
      role: 'user',
      userName: 'Angel',
    });
    const assistantMessage = createLocalMessage({
      agentId: 'copilot',
      content: '',
      conversationId: conversation.id,
      role: 'assistant',
      status: 'streaming',
      statusText: 'Generating',
    });
    const run = createRun(conversation.id);
    dispatch({
      assistantMessage,
      conversationId: conversation.id,
      run,
      type: 'send_start',
      userMessage,
    });

    const controller = new AbortController();
    activeControllersRef.current.set(conversation.id, controller);
    let outcome = 'completed';

    try {
      await streamCopilotMessage({
        attachments,
        conversationId: conversation.id,
        message: normalizedContent,
        onEvent(event) {
          if (event.type === 'process_delta') {
            dispatch({ event, messageId: assistantMessage.id, type: 'process_delta' });
          } else if (event.type === 'message_delta') {
            dispatch({ event, messageId: assistantMessage.id, type: 'message_delta' });
          } else if (event.type === 'source' && event.source) {
            dispatch({
              conversationId: conversation.id,
              messageId: assistantMessage.id,
              source: event.source,
              type: 'source',
            });
          } else if (event.type === 'error_message') {
            const error = new Error(event.content || 'The Copilot request failed.');
            error.code = event.code;
            throw error;
          } else if (event.type === 'done') {
            outcome = event.outcome || 'completed';
          }
        },
        projectId,
        signal: controller.signal,
        userId,
      });
      dispatch({ messageId: assistantMessage.id, outcome, runId: run.id, type: 'send_finish' });
      loadedHistoryRef.current.add(conversation.id);
    } catch (error) {
      if (error?.name === 'AbortError') {
        dispatch({ messageId: assistantMessage.id, outcome: 'cancelled', runId: run.id, type: 'send_finish' });
      } else {
        dispatch({
          conversationId: conversation.id,
          error: error instanceof Error ? error.message : String(error),
          messageId: assistantMessage.id,
          runId: run.id,
          type: 'send_error',
        });
      }
    } finally {
      activeControllersRef.current.delete(conversation.id);
    }
  }, [activeConversationId, projectId, userId]);

  const conversationState = useMemo(() => ({
    artifacts: state.artifacts,
    conversations: sortConversations(state.conversations),
    messages: state.messages,
    runs: state.runs,
    sources: state.sources,
  }), [state]);

  return {
    activeConversation,
    activeConversationId,
    conversationErrors: state.errorByConversation,
    conversationState,
    createConversation,
    currentModel: state.model,
    deleteConversation: removeConversation,
    loading: state.loading,
    renameConversation,
    runningConversationIds: new Set(
      state.runs.filter((run) => run.status === 'running').map((run) => run.conversationId),
    ),
    selectConversation,
    sendMessage,
    stopAll,
    stopConversation,
    togglePin,
  };
}
