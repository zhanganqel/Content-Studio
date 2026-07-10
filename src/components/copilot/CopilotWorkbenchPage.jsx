import {
  BookOpenText,
  Bot,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  History,
  List,
  ListCollapse,
  Loader2,
  LogOut,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AudiencePersonaPage from '../audience-persona/AudiencePersonaPage.jsx';
import BrandProfilePage from '../brand-profile/BrandProfilePage.jsx';
import KnowledgeAssetsPage from '../knowledge-assets/KnowledgeAssetsPage.jsx';
import KnowledgeItemsPage from '../knowledge-items/KnowledgeItemsPage.jsx';
import {
  collapsedSidebarWidth,
  expandedSidebarWidth,
} from '../../services/sidebarPreferenceStore.js';
import {
  getCopilotSidebarCollapsedPreference,
  saveCopilotSidebarCollapsedPreference,
} from '../../services/copilotWorkbenchStore.js';
import { streamCopilotChat } from '../../services/copilotChatApi.js';
import {
  createCopilotArtifact,
  createCopilotConversation,
  createCopilotMessage,
  createCopilotRun,
  createCopilotSource,
  deriveConversationTitle,
  getConversationArtifacts,
  getConversationMessages,
  getCopilotConversationState,
  saveCopilotConversationState,
} from '../../services/copilotConversationStore.js';
import { buildCopilotProjectContext } from '../../services/copilotContextBuilder.js';
import SquareIconButton from '../ui/SquareIconButton.jsx';
import { SolidDashboardIcon } from '../ui/SolidIcons.jsx';

const userMenuIcons = {
  switchAccount: UsersRound,
  accountSettings: Settings,
  notificationPreferences: UserRound,
  logout: LogOut,
};

function getProjectInitials(name = '') {
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  return words.length
    ? words
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase()
    : 'P';
}

function getDefaultConversations(copy) {
  return copy.defaultConversations.map((item) => ({
    ...item,
    updatedAt: item.updatedAt,
  }));
}

function formatRelativeTime(value, copy) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return '';
  }

  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60) {
    return copy.relativeTime.minutes(minutes);
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return copy.relativeTime.hours(hours);
  }

  return copy.relativeTime.days(Math.round(hours / 24));
}

function sortConversations(conversations) {
  return [...conversations].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function IconTooltip({ children, label, placement = 'right' }) {
  const placementClass =
    placement === 'left'
      ? 'right-[calc(100%+10px)] top-1/2 -translate-y-1/2'
      : 'left-[calc(100%+10px)] top-1/2 -translate-y-1/2';

  return (
    <span className="group relative inline-flex">
      {children}
      <span
        className={`pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-menu group-hover:block ${placementClass}`}
      >
        {label}
      </span>
    </span>
  );
}

function ConversationItem({
  active,
  conversation,
  copy,
  editingTitle,
  isEditing,
  onDelete,
  onCancelRename,
  onCommitRename,
  onEditingTitleChange,
  onRenameStart,
  onSelect,
  onTogglePin,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isEditing) return;

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  return (
    <div
      data-testid={`copilot-conversation-${conversation.id}`}
      role={isEditing ? undefined : 'button'}
      tabIndex={isEditing ? -1 : 0}
      className={`group flex min-h-[36px] w-full items-center justify-between gap-3 rounded-lg px-3 text-left transition ${
        active ? 'bg-blue-50 text-slate-900' : 'text-slate-700 hover:bg-white'
      }`}
      onClick={() => {
        if (!isEditing) {
          onSelect();
        }
      }}
      onKeyDown={(event) => {
        if (isEditing) return;

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <span className="min-w-0 flex-1">
        {isEditing ? (
          <input
            ref={inputRef}
            data-testid={`copilot-conversation-rename-input-${conversation.id}`}
            className="h-[28px] w-full min-w-0 rounded-md border border-blue-200 bg-white px-2 text-sm font-bold text-slate-900 outline-none ring-2 ring-blue-100 focus:border-blue-400"
            value={editingTitle}
            onBlur={(event) => {
              if (event.currentTarget.dataset.renameCanceled === 'true') return;

              onCommitRename(conversation.id);
            }}
            onChange={(event) => onEditingTitleChange(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onCommitRename(conversation.id);
              }

              if (event.key === 'Escape') {
                event.preventDefault();
                event.currentTarget.dataset.renameCanceled = 'true';
                onCancelRename();
              }
            }}
            aria-label={copy.rename}
          />
        ) : (
          <span className="block truncate text-sm font-bold">{conversation.title}</span>
        )}
      </span>
      {isEditing ? null : (
        <span className="relative flex h-8 w-[88px] flex-none items-center justify-end">
          <span className="text-xs font-medium text-slate-400 transition-opacity group-hover:opacity-0">
            {formatRelativeTime(conversation.updatedAt, copy)}
          </span>
          <span className="absolute right-0 hidden items-center gap-0.5 group-hover:flex">
            <span
              role="button"
              tabIndex={0}
              className="grid h-7 w-7 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={(event) => {
                event.stopPropagation();
                onRenameStart();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  onRenameStart();
                }
              }}
              aria-label={copy.rename}
            >
              <Pencil className="h-3.5 w-3.5" />
            </span>
            <span
              role="button"
              tabIndex={0}
              className="grid h-7 w-7 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
              onClick={(event) => {
                event.stopPropagation();
                onTogglePin();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  onTogglePin();
                }
              }}
              aria-label={conversation.pinned ? copy.unpin : copy.pin}
            >
              {conversation.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </span>
            <span
              role="button"
              tabIndex={0}
              className="grid h-7 w-7 place-items-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-500"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  onDelete();
                }
              }}
              aria-label={copy.delete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </span>
          </span>
        </span>
      )}
    </div>
  );
}

function ProjectMenu({ activeProject, onSelect, placement = 'side', projects }) {
  return (
    <div
      className={`absolute z-50 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-menu ${
        placement === 'bottom'
          ? 'left-0 right-0 top-[80px]'
          : 'left-[calc(100%+10px)] top-0 w-[292px]'
      }`}
    >
      {projects.map((project) => (
        <button
          key={project.id}
          data-testid={`copilot-project-option-${project.id}`}
          type="button"
          className={`w-full px-4 py-3 text-left transition ${
            project.id === activeProject.id
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
          onClick={() => onSelect(project.id)}
        >
          <span className="block truncate text-sm font-bold">{project.name}</span>
          <span className="mt-1 block truncate text-xs font-medium text-slate-400">
            {project.description}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function CopilotWorkbenchPage({
  activeProject,
  projects,
  t,
  userMenuItems,
  onClose,
  onProjectChange,
}) {
  const copy = t.copilot;
  const brandItems = useMemo(
    () => [
      { id: 'brand-profile', icon: FileText, title: t.navItems['brand-profile'] },
      { id: 'audience-persona', icon: UsersRound, title: t.navItems['audience-persona'] },
      { id: 'knowledge-items', icon: Database, title: t.navItems['knowledge-items'] },
      { id: 'knowledge-assets', icon: BookOpenText, title: t.navItems['knowledge-assets'] },
    ],
    [t],
  );
  const defaultConversations = useMemo(() => getDefaultConversations(copy), [copy]);
  const initialConversationStateRef = useRef(null);
  if (!initialConversationStateRef.current) {
    initialConversationStateRef.current = getCopilotConversationState(activeProject.id, defaultConversations);
  }
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getCopilotSidebarCollapsedPreference);
  const [brandSectionOpen, setBrandSectionOpen] = useState(true);
  const [pinnedSectionOpen, setPinnedSectionOpen] = useState(true);
  const [historySectionOpen, setHistorySectionOpen] = useState(true);
  const [workspaceMode, setWorkspaceMode] = useState('chat');
  const [conversationSearchQuery, setConversationSearchQuery] = useState('');
  const [conversationState, setConversationState] = useState(initialConversationStateRef.current);
  const conversationStateRef = useRef(conversationState);
  const [activeConversationId, setActiveConversationId] = useState(
    () => conversationState.conversations[0]?.id ?? '',
  );
  const [editingConversationId, setEditingConversationId] = useState('');
  const [editingConversationTitle, setEditingConversationTitle] = useState('');
  const [activePopover, setActivePopover] = useState('');
  const [conversationActionMenuOpen, setConversationActionMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [artifactPanelOpen, setArtifactPanelOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewWidthPercent, setPreviewWidthPercent] = useState(50);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedArtifactId, setSelectedArtifactId] = useState('');
  const projectMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const conversationActionMenuRef = useRef(null);
  const mainWorkspaceRef = useRef(null);
  const popoverCloseTimerRef = useRef(null);
  const activeChatAbortRef = useRef(null);

  const sidebarWidth = sidebarCollapsed ? collapsedSidebarWidth : expandedSidebarWidth;
  const conversations = conversationState.conversations;
  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0];
  const activeMessages = useMemo(
    () => getConversationMessages(conversationState, activeConversation?.id),
    [activeConversation?.id, conversationState],
  );
  const activeArtifacts = useMemo(
    () => getConversationArtifacts(conversationState, activeConversation?.id),
    [activeConversation?.id, conversationState],
  );
  const selectedArtifact =
    activeArtifacts.find((artifact) => artifact.id === selectedArtifactId) ?? activeArtifacts[0] ?? null;
  const activeBrandItem = brandItems.find((item) => item.id === workspaceMode);
  const pageTitle = workspaceMode === 'chat' ? activeConversation?.title ?? copy.untitled : activeBrandItem?.title;
  const query = conversationSearchQuery.trim().toLowerCase();
  const filteredConversations = sortConversations(
    conversations.filter((conversation) => !query || conversation.title.toLowerCase().includes(query)),
  );
  const pinnedConversations = filteredConversations.filter((conversation) => conversation.pinned);
  const normalConversations = filteredConversations.filter((conversation) => !conversation.pinned);
  const isChatMode = workspaceMode === 'chat';
  const previewVisible = isChatMode && previewOpen;
  const artifactPanelVisible = isChatMode && artifactPanelOpen && !previewOpen;
  const mainGridTemplateColumns = previewVisible
    ? `minmax(480px, 1fr) 10px minmax(360px, ${previewWidthPercent}%)`
    : artifactPanelVisible
      ? 'minmax(0, 1fr) minmax(300px, 340px)'
      : 'minmax(0, 1fr)';

  useEffect(() => {
    saveCopilotSidebarCollapsedPreference(sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    conversationStateRef.current = conversationState;
  }, [conversationState]);

  useEffect(() => {
    const nextConversationState = getCopilotConversationState(activeProject.id, defaultConversations);
    conversationStateRef.current = nextConversationState;
    setConversationState(nextConversationState);
    setActiveConversationId(nextConversationState.conversations[0]?.id ?? '');
    setConversationSearchQuery('');
    setActivePopover('');
    setConversationActionMenuOpen(false);
    setEditingConversationId('');
    setEditingConversationTitle('');
    setChatError('');
    setChatInput('');
    setSelectedArtifactId('');
  }, [activeProject.id, defaultConversations]);

  useEffect(
    () => () => {
      activeChatAbortRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (!activeArtifacts.length) {
      if (selectedArtifactId) setSelectedArtifactId('');
      return;
    }

    if (!activeArtifacts.some((artifact) => artifact.id === selectedArtifactId)) {
      setSelectedArtifactId(activeArtifacts[0].id);
    }
  }, [activeArtifacts, selectedArtifactId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target)) {
        setActivePopover((current) => (current === 'project' ? '' : current));
      }

      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }

      if (
        conversationActionMenuRef.current &&
        !conversationActionMenuRef.current.contains(event.target)
      ) {
        setConversationActionMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(
    () => () => {
      if (popoverCloseTimerRef.current) {
        clearTimeout(popoverCloseTimerRef.current);
      }
    },
    [],
  );

  function persistConversationState(nextState, nextActiveConversationId) {
    const savedState = saveCopilotConversationState(activeProject.id, nextState);
    conversationStateRef.current = savedState;
    setConversationState(savedState);
    if (nextActiveConversationId !== undefined) {
      setActiveConversationId(nextActiveConversationId);
    }
  }

  function createNewConversation() {
    const conversation = createCopilotConversation(
      activeProject.id,
      copy.newConversationTitle(conversations.length + 1),
    );
    persistConversationState(
      {
        ...conversationStateRef.current,
        conversations: [conversation, ...conversationStateRef.current.conversations],
      },
      conversation.id,
    );
    setWorkspaceMode('chat');
    setActivePopover('');
    setConversationSearchQuery('');
    setConversationActionMenuOpen(false);
    setEditingConversationId('');
    setEditingConversationTitle('');
  }

  function startInlineRename(conversationId) {
    const target = conversations.find((conversation) => conversation.id === conversationId);
    if (!target) return;

    setWorkspaceMode('chat');
    setActiveConversationId(conversationId);
    setConversationSearchQuery('');
    setActivePopover('');
    setConversationActionMenuOpen(false);
    setEditingConversationId(conversationId);
    setEditingConversationTitle(target.title);
  }

  function cancelInlineRename() {
    setEditingConversationId('');
    setEditingConversationTitle('');
  }

  function commitInlineRename(conversationId) {
    if (editingConversationId !== conversationId) return;

    const target = conversations.find((conversation) => conversation.id === conversationId);
    const nextTitle = editingConversationTitle.trim();

    if (!target || !nextTitle || nextTitle === target.title) {
      cancelInlineRename();
      return;
    }

    persistConversationState(
      {
        ...conversationStateRef.current,
        conversations: conversationStateRef.current.conversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, title: nextTitle, updatedAt: new Date().toISOString() }
            : conversation,
        ),
      },
    );
    cancelInlineRename();
  }

  function toggleConversationPin(conversationId) {
    persistConversationState(
      {
        ...conversationStateRef.current,
        conversations: conversationStateRef.current.conversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, pinned: !conversation.pinned, updatedAt: new Date().toISOString() }
            : conversation,
        ),
      },
    );
  }

  function deleteConversation(conversationId) {
    const currentState = conversationStateRef.current;
    const nextConversations = currentState.conversations.filter((conversation) => conversation.id !== conversationId);
    const nextState = {
      ...currentState,
      artifacts: currentState.artifacts.filter((artifact) => artifact.conversationId !== conversationId),
      conversations: nextConversations,
      messages: currentState.messages.filter((message) => message.conversationId !== conversationId),
      runs: currentState.runs.filter((run) => run.conversationId !== conversationId),
      sources: currentState.sources.filter((source) => source.conversationId !== conversationId),
    };

    if (editingConversationId === conversationId) {
      cancelInlineRename();
    }

    if (nextConversations.length) {
      persistConversationState(nextState, nextConversations[0].id);
      return;
    }

    const replacement = createCopilotConversation(activeProject.id, copy.newConversationTitle(1));
    persistConversationState(
      {
        ...nextState,
        conversations: [replacement],
      },
      replacement.id,
    );
  }

  function selectProject(projectId) {
    onProjectChange(projectId);
    setActivePopover('');
  }

  function selectConversation(conversationId) {
    setActiveConversationId(conversationId);
    setWorkspaceMode('chat');
    setActivePopover('');
    setConversationActionMenuOpen(false);
  }

  function selectWorkspaceMode(mode) {
    setWorkspaceMode(mode);
    setActivePopover('');
    setConversationActionMenuOpen(false);
    setEditingConversationId('');
    setEditingConversationTitle('');
  }

  function updateSidebarCollapsed(collapsed) {
    setSidebarCollapsed(collapsed);
    setActivePopover('');
    setConversationActionMenuOpen(false);
    setEditingConversationId('');
    setEditingConversationTitle('');
  }

  function runConversationAction(action) {
    action();
    setConversationActionMenuOpen(false);
  }

  function openPopover(id) {
    if (popoverCloseTimerRef.current) {
      clearTimeout(popoverCloseTimerRef.current);
    }

    setActivePopover(id);
  }

  function closePopoverLater() {
    if (popoverCloseTimerRef.current) {
      clearTimeout(popoverCloseTimerRef.current);
    }

    popoverCloseTimerRef.current = setTimeout(() => setActivePopover(''), 150);
  }

  function togglePopover(id) {
    setActivePopover((current) => (current === id ? '' : id));
  }

  function toggleArtifactPanel() {
    if (artifactPanelVisible) {
      setArtifactPanelOpen(false);
      return;
    }

    setPreviewOpen(false);
    setArtifactPanelOpen(true);
  }

  function togglePreview() {
    if (previewOpen) {
      setPreviewOpen(false);
      setArtifactPanelOpen(true);
      return;
    }

    setPreviewOpen(true);
    setArtifactPanelOpen(false);
    setPreviewWidthPercent(50);
  }

  function openArtifactPreview(artifactId) {
    setSelectedArtifactId(artifactId);
    setArtifactPanelOpen(false);
    if (!previewOpen) {
      setPreviewWidthPercent(50);
    }
    setPreviewOpen(true);
  }

  function patchConversationState(updater) {
    const currentState = conversationStateRef.current;
    const nextState = typeof updater === 'function' ? updater(currentState) : updater;
    persistConversationState(nextState);
    return nextState;
  }

  function updateAssistantMessage(messageId, patch) {
    const { artifactId, contentDelta, sourceId, ...messagePatch } = patch;

    patchConversationState((currentState) => ({
      ...currentState,
      messages: currentState.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              ...messagePatch,
              content:
                typeof contentDelta === 'string'
                  ? `${message.content}${contentDelta}`
                  : messagePatch.content ?? message.content,
              sourceIds: sourceId
                ? [...new Set([...(message.sourceIds ?? []), sourceId])]
                : message.sourceIds,
              artifactIds: artifactId
                ? [...new Set([...(message.artifactIds ?? []), artifactId])]
                : message.artifactIds,
              updatedAt: new Date().toISOString(),
            }
          : message,
      ),
    }));
  }

  function upsertConversationArtifact(conversationId, messageId, rawArtifact) {
    const artifact = createCopilotArtifact({
      content: rawArtifact.content,
      conversationId,
      sourceIds: rawArtifact.sourceIds ?? [],
      sourceMessageId: messageId,
      status: rawArtifact.status ?? 'ready',
      summary: rawArtifact.summary,
      title: rawArtifact.title,
      type: rawArtifact.type ?? 'reply',
    });

    patchConversationState((currentState) => ({
      ...currentState,
      artifacts: [artifact, ...currentState.artifacts],
      conversations: currentState.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              artifactIds: [...new Set([artifact.id, ...(conversation.artifactIds ?? [])])],
              updatedAt: new Date().toISOString(),
            }
          : conversation,
      ),
      messages: currentState.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              artifactIds: [...new Set([...(message.artifactIds ?? []), artifact.id])],
              updatedAt: new Date().toISOString(),
            }
          : message,
      ),
    }));
    setSelectedArtifactId(artifact.id);
  }

  function upsertConversationSource(conversationId, messageId, rawSource) {
    const source = createCopilotSource({
      conversationId,
      metadata: rawSource.metadata ?? {},
      originId: rawSource.originId ?? rawSource.id ?? '',
      snippet: rawSource.snippet,
      title: rawSource.title,
      type: rawSource.type,
      url: rawSource.url,
    });

    patchConversationState((currentState) => ({
      ...currentState,
      messages: currentState.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              sourceIds: [...new Set([...(message.sourceIds ?? []), source.id])],
              updatedAt: new Date().toISOString(),
            }
          : message,
      ),
      sources: [source, ...currentState.sources],
    }));
  }

  async function submitChat(event) {
    event.preventDefault();

    const content = chatInput.trim();
    if (!content || chatLoading) return;

    const currentConversation =
      conversationStateRef.current.conversations.find((conversation) => conversation.id === activeConversationId) ??
      conversationStateRef.current.conversations[0];
    if (!currentConversation) return;

    const userMessage = createCopilotMessage({
      content,
      conversationId: currentConversation.id,
      role: 'user',
    });
    const assistantMessage = createCopilotMessage({
      agentId: 'copilot',
      content: '',
      conversationId: currentConversation.id,
      role: 'assistant',
      status: 'streaming',
      statusText: copy.taskRunning,
    });
    const run = createCopilotRun({
      conversationId: currentConversation.id,
      status: 'running',
    });
    const nextTitle = currentConversation.messageIds?.length
      ? currentConversation.title
      : deriveConversationTitle(content, currentConversation.title);
    const nextState = {
      ...conversationStateRef.current,
      conversations: conversationStateRef.current.conversations.map((conversation) =>
        conversation.id === currentConversation.id
          ? {
              ...conversation,
              messageIds: [...(conversation.messageIds ?? []), userMessage.id, assistantMessage.id],
              title: nextTitle,
              updatedAt: new Date().toISOString(),
            }
          : conversation,
      ),
      messages: [...conversationStateRef.current.messages, userMessage, assistantMessage],
      runs: [run, ...conversationStateRef.current.runs],
    };

    persistConversationState(nextState, currentConversation.id);
    setChatInput('');
    setChatError('');
    setChatLoading(true);

    const controller = new AbortController();
    activeChatAbortRef.current?.abort();
    activeChatAbortRef.current = controller;

    const projectContext = buildCopilotProjectContext(activeProject, {
      conversationId: currentConversation.id,
      conversationState: nextState,
    });
    const history = getConversationMessages(nextState, currentConversation.id)
      .filter((message) => message.id !== assistantMessage.id)
      .map((message) => ({
        content: message.content,
        role: message.role,
      }));

    try {
      await streamCopilotChat({
        body: {
          conversationId: currentConversation.id,
          history,
          message: content,
          projectContext,
          projectId: activeProject.id,
        },
        conversationId: currentConversation.id,
        signal: controller.signal,
        onEvent: (eventData) => {
          if (eventData.type === 'ping') return;

          if (eventData.type === 'task_status') {
            updateAssistantMessage(assistantMessage.id, {
              agentId: eventData.agentId,
              intent: eventData.intent,
              statusText: eventData.label || eventData.status || copy.taskRunning,
            });
            return;
          }

          if (eventData.type === 'message_delta') {
            updateAssistantMessage(assistantMessage.id, {
              agentId: eventData.agentId,
              contentDelta: eventData.content ?? eventData.delta ?? '',
              intent: eventData.intent,
            });
            return;
          }

          if (eventData.type === 'source' && eventData.source) {
            upsertConversationSource(currentConversation.id, assistantMessage.id, eventData.source);
            return;
          }

          if (eventData.type === 'artifact' && eventData.artifact) {
            upsertConversationArtifact(currentConversation.id, assistantMessage.id, eventData.artifact);
            return;
          }

          if (eventData.type === 'error_message') {
            throw new Error(eventData.content || copy.chatFallbackError);
          }
        },
      });

      updateAssistantMessage(assistantMessage.id, { status: 'done', statusText: '' });
      patchConversationState((currentState) => ({
        ...currentState,
        runs: currentState.runs.map((item) =>
          item.id === run.id ? { ...item, endedAt: new Date().toISOString(), status: 'done' } : item,
        ),
      }));
    } catch (error) {
      if (error && typeof error === 'object' && error.name === 'AbortError') return;

      const message = getChatErrorMessage(error);
      setChatError(message);
      updateAssistantMessage(assistantMessage.id, {
        content: message,
        error: message,
        status: 'error',
        statusText: '',
      });
      patchConversationState((currentState) => ({
        ...currentState,
        runs: currentState.runs.map((item) =>
          item.id === run.id
            ? { ...item, endedAt: new Date().toISOString(), error: message, status: 'error' }
            : item,
        ),
      }));
    } finally {
      if (activeChatAbortRef.current === controller) {
        activeChatAbortRef.current = null;
      }
      setChatLoading(false);
    }
  }

  function startPreviewResize(event) {
    const container = mainWorkspaceRef.current;
    if (!container) return;

    event.preventDefault();

    const rect = container.getBoundingClientRect();
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    function updatePreviewWidth(pointerEvent) {
      const previewWidth = rect.right - pointerEvent.clientX;
      const maxWidthByRatio = rect.width * 0.7;
      const maxWidthByChat = rect.width - 480;
      const minWidth = Math.min(360, rect.width * 0.5);
      const maxWidth = Math.max(minWidth, Math.min(maxWidthByRatio, maxWidthByChat));
      const clampedWidth = Math.min(Math.max(previewWidth, minWidth), maxWidth);

      setPreviewWidthPercent((clampedWidth / rect.width) * 100);
    }

    function stopPreviewResize() {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener('pointermove', updatePreviewWidth);
      window.removeEventListener('pointerup', stopPreviewResize);
    }

    window.addEventListener('pointermove', updatePreviewWidth);
    window.addEventListener('pointerup', stopPreviewResize, { once: true });
  }

  function renderConversationList(items) {
    return items.map((conversation) => (
      <ConversationItem
        key={conversation.id}
        active={conversation.id === activeConversationId}
        conversation={conversation}
        copy={copy}
        editingTitle={editingConversationTitle}
        isEditing={conversation.id === editingConversationId}
        onDelete={() => deleteConversation(conversation.id)}
        onCancelRename={cancelInlineRename}
        onCommitRename={commitInlineRename}
        onEditingTitleChange={setEditingConversationTitle}
        onRenameStart={() => startInlineRename(conversation.id)}
        onSelect={() => selectConversation(conversation.id)}
        onTogglePin={() => toggleConversationPin(conversation.id)}
      />
    ));
  }

  function renderConversationGroups({ collapsible = false } = {}) {
    if (!filteredConversations.length) {
      return <p className="px-3 py-4 text-sm font-medium text-slate-400">{copy.emptyConversations}</p>;
    }

    if (collapsible) {
      return (
        <>
          {pinnedConversations.length ? (
            <CollapsibleSidebarGroup
              open={pinnedSectionOpen}
              title={copy.pinned}
              onToggle={() => setPinnedSectionOpen((open) => !open)}
            >
              {renderConversationList(pinnedConversations)}
            </CollapsibleSidebarGroup>
          ) : null}
          {normalConversations.length ? (
            <CollapsibleSidebarGroup
              open={historySectionOpen}
              title={copy.history}
              onToggle={() => setHistorySectionOpen((open) => !open)}
            >
              {renderConversationList(normalConversations)}
            </CollapsibleSidebarGroup>
          ) : null}
        </>
      );
    }

    return (
      <>
        {pinnedConversations.length ? (
          <HistoryGroup title={copy.pinned}>{renderConversationList(pinnedConversations)}</HistoryGroup>
        ) : null}
        {normalConversations.length ? (
          <HistoryGroup title={copy.history}>{renderConversationList(normalConversations)}</HistoryGroup>
        ) : null}
      </>
    );
  }

  function renderBrandModule() {
    if (workspaceMode === 'brand-profile') {
      return <BrandProfilePage project={activeProject} t={t} />;
    }

    if (workspaceMode === 'audience-persona') {
      return <AudiencePersonaPage project={activeProject} sidebarWidth={sidebarWidth} t={t} />;
    }

    if (workspaceMode === 'knowledge-items') {
      return <KnowledgeItemsPage project={activeProject} sidebarWidth={sidebarWidth} t={t} />;
    }

    if (workspaceMode === 'knowledge-assets') {
      return <KnowledgeAssetsPage project={activeProject} t={t} />;
    }

    return null;
  }

  function renderSearchPopover() {
    return (
      <div className="absolute left-[calc(100%+10px)] top-0 z-50 w-[320px] rounded-xl border border-slate-200 bg-white p-3 shadow-menu">
        <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            className="min-w-0 flex-1 border-none bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
            value={conversationSearchQuery}
            onChange={(event) => setConversationSearchQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
          />
        </label>
        <div className="mt-3 max-h-[420px] space-y-1 overflow-y-auto">
          {renderConversationGroups()}
        </div>
      </div>
    );
  }

  function renderHistoryPopover() {
    return (
      <div className="absolute left-[calc(100%+10px)] top-0 z-50 w-[320px] rounded-xl border border-slate-200 bg-white p-3 shadow-menu">
        {renderConversationGroups()}
      </div>
    );
  }

  function renderMessageSources(message) {
    const sources = conversationState.sources.filter((source) => message.sourceIds?.includes(source.id));
    if (!sources.length) return null;

    return (
      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
        <p className="text-xs font-bold text-slate-400">{copy.sources}</p>
        <div className="mt-2 space-y-2">
          {sources.map((source) => (
            <div key={source.id} className="text-xs leading-5 text-slate-500">
              <span className="font-bold text-slate-700">{source.title}</span>
              {source.snippet ? <span> - {source.snippet}</span> : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderInlineArtifactCard(artifact) {
    return (
      <button
        key={artifact.id}
        type="button"
        className="mt-3 flex w-full items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
        onClick={() => {
          setSelectedArtifactId(artifact.id);
          setArtifactPanelOpen(true);
          setPreviewOpen(false);
        }}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-white text-blue-600">
            <FileText className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-900">{artifact.title}</span>
            <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
              {artifact.summary || copy.generatedArtifact}
            </span>
          </span>
        </span>
        <ChevronRight className="h-4 w-4 flex-none text-slate-400" />
      </button>
    );
  }

  function renderMessageArtifacts(message) {
    const artifacts = conversationState.artifacts.filter((artifact) => message.artifactIds?.includes(artifact.id));
    if (!artifacts.length) return null;

    return <div>{artifacts.map(renderInlineArtifactCard)}</div>;
  }

  function getChatErrorMessage(error) {
    const message = error instanceof Error ? error.message : String(error || '');
    if (
      error instanceof TypeError ||
      /Failed to fetch|EdgeOne backend access is restricted|eo_time missing|Access Restricted|Authentication Expired|No SSE events/i.test(
        message,
      )
    ) {
      return copy.chatConnectionError;
    }

    return message || copy.chatFallbackError;
  }

  function renderChatMessage(message) {
    const isUser = message.role === 'user';
    const isError = message.status === 'error';
    const isStreaming = message.status === 'streaming';

    return (
      <article
        key={message.id}
        className={`flex w-full gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        {!isUser ? (
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-blue-50 text-blue-600">
            <Bot className="h-4 w-4" />
          </span>
        ) : null}
        <div className={`max-w-[76%] ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`mb-1 flex items-center gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs font-bold text-slate-400">
              {isUser ? copy.userName : copy.assistantName}
            </span>
            {message.statusText ? (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">
                {message.statusText}
              </span>
            ) : null}
          </div>
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
              isUser
                ? 'rounded-tr-md bg-slate-900 text-white'
                : isError
                  ? 'rounded-tl-md border border-red-100 bg-red-50 text-red-600'
                  : 'rounded-tl-md border border-slate-200 bg-white text-slate-700'
            }`}
          >
            {message.content ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : isStreaming ? (
              <span className="inline-flex items-center gap-2 text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {copy.chatThinking}
              </span>
            ) : (
              <span className="text-slate-400">{copy.chatEmptyResponse}</span>
            )}
            {!isUser ? renderMessageSources(message) : null}
            {!isUser ? renderMessageArtifacts(message) : null}
          </div>
        </div>
      </article>
    );
  }

  function renderArtifactPreviewBody(artifact) {
    if (!artifact) {
      return (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <div>
            <FileText className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">{copy.artifactPlaceholderTitle}</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">{copy.artifactPlaceholderBody}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-blue-500">{artifact.type}</p>
        <h3 className="mt-2 text-sm font-bold leading-6 text-slate-900">{artifact.title}</h3>
        {artifact.summary ? <p className="mt-2 text-xs leading-5 text-slate-500">{artifact.summary}</p> : null}
        <pre className="mt-4 whitespace-pre-wrap font-sans text-xs leading-5 text-slate-600">
          {artifact.content || copy.previewPlaceholderBody}
        </pre>
      </div>
    );
  }

  function renderArtifactTools() {
    const artifactPanelLabel = artifactPanelVisible ? copy.collapseArtifactPanel : copy.expandArtifactPanel;
    const previewLabel = previewOpen ? copy.closePreviewPage : copy.openPreviewPage;

    return (
      <div className="flex h-[40px] w-full items-center justify-end gap-1" data-testid="copilot-artifact-toolbar">
        <IconTooltip label={artifactPanelLabel} placement="left">
          <SquareIconButton
            data-testid="copilot-artifact-panel-toggle"
            icon={artifactPanelVisible ? ListCollapse : List}
            size="xs"
            variant="ghost"
            onClick={toggleArtifactPanel}
            aria-label={artifactPanelLabel}
            aria-pressed={artifactPanelVisible}
          />
        </IconTooltip>
        <IconTooltip label={previewLabel} placement="left">
          <SquareIconButton
            data-testid="copilot-preview-toggle"
            icon={previewOpen ? PanelRightClose : PanelRightOpen}
            size="xs"
            variant="ghost"
            onClick={togglePreview}
            aria-label={previewLabel}
            aria-pressed={previewOpen}
          />
        </IconTooltip>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-white text-slate-900">
      <aside
        className="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200 bg-slate-50 transition-[width] duration-200"
        style={{ width: sidebarWidth }}
      >
        {sidebarCollapsed ? (
          <div className="flex h-full flex-col items-center px-3 py-5">
            <IconTooltip label={copy.expand}>
              <SquareIconButton
                data-testid="copilot-sidebar-expand"
                icon={PanelLeftOpen}
                variant="ghost"
                onClick={() => updateSidebarCollapsed(false)}
                aria-label={copy.expand}
              />
            </IconTooltip>

            <div
              ref={projectMenuRef}
              className="relative mt-3"
              onMouseEnter={() => openPopover('project')}
              onMouseLeave={closePopoverLater}
            >
              <button
                data-testid="copilot-collapsed-project"
                type="button"
                className={`grid h-11 w-11 place-items-center rounded-xl border text-sm font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  activePopover === 'project'
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                }`}
                onClick={() => togglePopover('project')}
                aria-expanded={activePopover === 'project'}
                aria-label={copy.switchProject}
              >
                {getProjectInitials(activeProject.name)}
              </button>
              {activePopover === 'project' ? (
                <div onMouseEnter={() => openPopover('project')} onMouseLeave={closePopoverLater}>
                  <ProjectMenu activeProject={activeProject} projects={projects} onSelect={selectProject} />
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col items-center gap-2">
              {brandItems.map((item) => {
                const Icon = item.icon;
                const selected = workspaceMode === item.id;

                return (
                  <IconTooltip key={item.id} label={item.title}>
                    <SquareIconButton
                      data-testid={`copilot-collapsed-brand-${item.id}`}
                      active={selected}
                      icon={Icon}
                      variant="ghost"
                      onClick={() => {
                        selectWorkspaceMode(item.id);
                      }}
                      aria-label={item.title}
                    />
                  </IconTooltip>
                );
              })}
            </div>

            <div className="my-4 h-px w-11 bg-slate-200" />

            <div className="flex flex-col items-center gap-2">
              <IconTooltip label={copy.newConversation}>
                <SquareIconButton
                  data-testid="copilot-collapsed-new"
                  icon={Plus}
                  variant="ghost"
                  onClick={createNewConversation}
                  aria-label={copy.newConversation}
                />
              </IconTooltip>

              <div
                className="relative"
                onMouseEnter={() => openPopover('search')}
                onMouseLeave={closePopoverLater}
              >
                <SquareIconButton
                  data-testid="copilot-collapsed-search"
                  active={activePopover === 'search'}
                  icon={Search}
                  variant="ghost"
                  onClick={() => togglePopover('search')}
                  aria-label={copy.searchConversations}
                />
                {activePopover === 'search' ? (
                  <div onMouseEnter={() => openPopover('search')} onMouseLeave={closePopoverLater}>
                    {renderSearchPopover()}
                  </div>
                ) : null}
              </div>

              <div
                className="relative"
                onMouseEnter={() => openPopover('history')}
                onMouseLeave={closePopoverLater}
              >
                <SquareIconButton
                  data-testid="copilot-collapsed-history"
                  active={activePopover === 'history'}
                  icon={History}
                  variant="ghost"
                  onClick={() => togglePopover('history')}
                  aria-label={copy.historyConversations}
                />
                {activePopover === 'history' ? (
                  <div onMouseEnter={() => openPopover('history')} onMouseLeave={closePopoverLater}>
                    {renderHistoryPopover()}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col px-6 py-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3 text-blue-600">
                <Sparkles className="h-7 w-7 flex-none" />
                <span className="truncate text-2xl font-bold tracking-normal">{copy.title}</span>
              </div>
              <IconTooltip label={copy.collapse}>
                <SquareIconButton
                  data-testid="copilot-sidebar-collapse"
                  className="flex-none"
                  icon={PanelLeftClose}
                  size="sm"
                  variant="ghost"
                  onClick={() => updateSidebarCollapsed(true)}
                  aria-label={copy.collapse}
                />
              </IconTooltip>
            </div>

            <div ref={projectMenuRef} className="relative mb-6">
              <button
                data-testid="copilot-project-switcher"
                type="button"
                className="flex min-h-[72px] w-full items-center justify-between rounded-xl bg-white px-4 text-left ring-1 ring-slate-200 transition hover:ring-blue-200"
                onClick={() => togglePopover('project')}
                aria-expanded={activePopover === 'project'}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-slate-800">{activeProject.name}</span>
                  <span className="mt-1 block truncate text-xs font-medium text-slate-400">
                    {activeProject.description}
                  </span>
                </span>
                <ChevronRight className="ml-3 h-5 w-5 flex-none text-slate-400" />
              </button>
              {activePopover === 'project' ? (
                <ProjectMenu
                  activeProject={activeProject}
                  placement="bottom"
                  projects={projects}
                  onSelect={selectProject}
                />
              ) : null}
            </div>

            <CollapsibleSidebarGroup
              data-testid="copilot-brand-toggle"
              open={brandSectionOpen}
              title={copy.brandKnowledge}
              onToggle={() => setBrandSectionOpen((open) => !open)}
            >
              <div className="space-y-1">
                  {brandItems.map((item) => {
                    const Icon = item.icon;
                    const selected = workspaceMode === item.id;

                    return (
                      <button
                        key={item.id}
                        data-testid={`copilot-brand-${item.id}`}
                        type="button"
                        className={`flex min-h-[38px] w-full items-center gap-3 rounded-lg px-3 text-left text-[14px] font-bold transition ${
                          selected
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-white hover:text-slate-900'
                        }`}
                        onClick={() => selectWorkspaceMode(item.id)}
                      >
                        <Icon className="h-4 w-4 flex-none" />
                        <span className="truncate">{item.title}</span>
                      </button>
                    );
                  })}
              </div>
            </CollapsibleSidebarGroup>

            <section className="flex min-h-0 flex-1 flex-col border-t border-slate-200 pt-5">
              <div className="mb-4 flex items-center gap-2">
                <label className="flex h-[32px] min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
                  <Search className="h-4 w-4 flex-none text-slate-400" />
                  <input
                    data-testid="copilot-history-search"
                    className="min-w-0 flex-1 border-none bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                    value={conversationSearchQuery}
                    onChange={(event) => setConversationSearchQuery(event.target.value)}
                    placeholder={copy.searchPlaceholder}
                  />
                </label>
                <IconTooltip label={copy.newConversation}>
                  <SquareIconButton
                    data-testid="copilot-new-conversation"
                    icon={Plus}
                    size="xs"
                    onClick={createNewConversation}
                    aria-label={copy.newConversation}
                  />
                </IconTooltip>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                {renderConversationGroups({ collapsible: true })}
              </div>
            </section>
          </div>
        )}
      </aside>

      <header
        className="fixed right-0 top-0 z-20 flex h-[64px] items-center justify-between border-b border-slate-100 bg-slate-50 px-7 transition-[left] duration-200"
        style={{ left: sidebarWidth }}
      >
        <div className="flex min-w-0 items-center gap-3">
          {workspaceMode !== 'chat' ? (
            <button
              data-testid="copilot-back-to-chat"
              type="button"
              className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={() => setWorkspaceMode('chat')}
            >
              {copy.backToChat}
            </button>
          ) : null}
          <h1 className="truncate text-xl font-bold tracking-normal text-slate-900">{pageTitle}</h1>
          {workspaceMode === 'chat' ? (
            <div ref={conversationActionMenuRef} className="relative">
              <SquareIconButton
                data-testid="copilot-conversation-actions"
                active={conversationActionMenuOpen}
                icon={MoreHorizontal}
                size="xs"
                variant="ghost"
                onClick={() => setConversationActionMenuOpen((open) => !open)}
                aria-expanded={conversationActionMenuOpen}
                aria-label={copy.conversationActions}
              />
              {conversationActionMenuOpen && activeConversation ? (
                <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-2 shadow-menu">
                  <ActionMenuButton
                    icon={Pencil}
                    label={copy.rename}
                    onClick={() => runConversationAction(() => startInlineRename(activeConversation.id))}
                  />
                  <ActionMenuButton
                    icon={activeConversation.pinned ? PinOff : Pin}
                    label={activeConversation.pinned ? copy.unpin : copy.pin}
                    onClick={() => runConversationAction(() => toggleConversationPin(activeConversation.id))}
                  />
                  <ActionMenuButton
                    danger
                    icon={Trash2}
                    label={copy.delete}
                    onClick={() => runConversationAction(() => deleteConversation(activeConversation.id))}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-4">
          <button
            data-testid="copilot-home-button"
            type="button"
            className="inline-flex h-11 w-[96px] flex-none items-center justify-center gap-2 rounded-full bg-slate-950 pl-3 pr-4 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            onClick={onClose}
            aria-label={copy.backToStudioLabel}
          >
            <SolidDashboardIcon className="h-4 w-4" />
            {copy.studio}
          </button>

          <div ref={userMenuRef} className="relative">
            <button
              data-testid="copilot-user-menu-button"
              type="button"
              className="flex h-11 items-center gap-3 rounded-full pl-1 pr-2 transition hover:bg-white"
              onClick={() => setUserMenuOpen((open) => !open)}
              aria-expanded={userMenuOpen}
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">
                A
              </span>
              <span className="text-[15px] font-bold text-slate-800">Angel</span>
            </button>

            {userMenuOpen ? (
              <div className="absolute right-0 top-[50px] z-40 w-[180px] overflow-hidden rounded-lg border border-slate-200 bg-white py-2 shadow-menu">
                {userMenuItems.map((item) => {
                  const Icon = userMenuIcons[item.id] ?? UserRound;

                  return (
                    <button
                      key={item.id}
                      data-testid={`copilot-user-menu-item-${item.id}`}
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4 text-slate-500" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main
        ref={mainWorkspaceRef}
        className="relative grid h-screen min-w-0 gap-0 overflow-hidden bg-white pt-[64px] transition-[margin-left] duration-200"
        style={{ marginLeft: sidebarWidth, gridTemplateColumns: mainGridTemplateColumns }}
      >
        <section className="min-h-0 min-w-0 overflow-hidden">
          {workspaceMode === 'chat' ? (
            <div className="flex h-full min-h-0 flex-col bg-white">
              <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
                <div
                  className={`mx-auto flex min-h-full w-full max-w-4xl flex-col gap-5 ${
                    activeMessages.length ? '' : 'justify-center'
                  }`}
                >
                  {activeMessages.length ? (
                    <div className="flex flex-col gap-5 py-4">
                      {activeMessages.map(renderChatMessage)}
                    </div>
                  ) : (
                    <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
                        <Bot className="h-5 w-5" />
                      </span>
                      <h2 className="mt-4 text-xl font-bold tracking-normal text-slate-900">
                        {copy.chatPlaceholderTitle}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{copy.chatPlaceholderBody}</p>
                    </div>
                  )}
                </div>
              </div>

              {chatError ? (
                <div className="border-t border-red-100 bg-red-50 px-8 py-3 text-sm font-semibold text-red-600">
                  <div className="mx-auto max-w-4xl">
                    <span className="font-bold">{copy.chatErrorTitle}: </span>
                    {chatError}
                  </div>
                </div>
              ) : null}

              <form className="border-t border-slate-200 bg-white px-8 py-5" onSubmit={submitChat}>
                <div className="mx-auto flex w-full max-w-4xl items-end gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
                  <textarea
                    data-testid="copilot-chat-input"
                    className="max-h-32 min-h-[48px] min-w-0 flex-1 resize-none border-none bg-transparent px-1 py-1 text-sm font-medium leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder={copy.chatInputPlaceholder}
                  />
                  <button
                    data-testid="copilot-chat-submit"
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {chatLoading ? copy.chatSending : copy.chatSend}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="h-full min-h-0 overflow-hidden p-6">{renderBrandModule()}</div>
          )}
        </section>

        {isChatMode && !artifactPanelVisible && !previewVisible ? (
          <div className="absolute right-6 top-[64px] z-10">{renderArtifactTools()}</div>
        ) : null}

        {previewVisible ? (
          <>
            <div
              data-testid="copilot-preview-resizer"
              role="separator"
              aria-orientation="vertical"
              className="group flex cursor-col-resize items-stretch justify-center bg-white transition hover:bg-blue-50"
              onPointerDown={startPreviewResize}
            >
              <span className="my-6 w-px bg-slate-200 transition group-hover:bg-blue-300" />
            </div>
            <aside className="min-h-0 bg-white px-6 pb-6">
              <div className="flex h-full min-h-0 flex-col">
                {renderArtifactTools()}
                <div
                  data-testid="copilot-preview-panel"
                  className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.10)]"
                >
                  <h2 className="text-base font-bold tracking-normal text-slate-900">{copy.previewPage}</h2>
                  <div className="mt-6 flex min-h-0 flex-1">{renderArtifactPreviewBody(selectedArtifact)}</div>
                </div>
              </div>
            </aside>
          </>
        ) : null}

        {artifactPanelVisible ? (
          <aside className="min-h-0 bg-white px-6 pb-6">
            <div className="flex h-full min-h-0 flex-col">
              {renderArtifactTools()}
              <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.10)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold tracking-normal text-slate-900">{copy.artifacts}</h2>
                  <SquareIconButton icon={Plus} size="xs" variant="ghost" aria-label={copy.newArtifact} />
                </div>
                <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
                  {activeArtifacts.length ? (
                    <div className="space-y-3">
                      {activeArtifacts.map((artifact) => (
                        <button
                          key={artifact.id}
                          type="button"
                          className={`w-full rounded-lg border p-3 text-left transition ${
                            selectedArtifact?.id === artifact.id
                              ? 'border-blue-200 bg-blue-50'
                              : 'border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white'
                          }`}
                          onClick={() => openArtifactPreview(artifact.id)}
                        >
                          <span className="block truncate text-sm font-bold text-slate-900">{artifact.title}</span>
                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            {artifact.summary || copy.generatedArtifact}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    renderArtifactPreviewBody(null)
                  )}
                </div>
              </div>
            </div>
          </aside>
        ) : null}
      </main>
    </div>
  );
}

function CollapsibleSidebarGroup({ children, open, title, onToggle, 'data-testid': dataTestId }) {
  return (
    <section className="mb-4">
      <button
        data-testid={dataTestId}
        type="button"
        className="mb-2 flex min-h-7 w-full items-center justify-between px-3 text-left text-[12px] font-bold text-slate-400 transition hover:text-slate-600"
        onClick={onToggle}
        aria-expanded={open}
      >
        {title}
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open ? <div className="space-y-1">{children}</div> : null}
    </section>
  );
}

function HistoryGroup({ children, title }) {
  return (
    <section className="mb-4">
      <h3 className="mb-2 flex min-h-7 items-center px-3 text-[12px] font-bold text-slate-400">{title}</h3>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function ActionMenuButton({ danger = false, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold transition ${
        danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'
      }`}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
