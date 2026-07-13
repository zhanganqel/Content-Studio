import {
  ArrowDown,
  ArrowUp,
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
  Settings,
  Sparkles,
  Square,
  Trash2,
  UserRound,
  UsersRound,
  X,
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
import { releaseCopilotThread, streamCopilotChat } from '../../services/copilotChatApi.js';
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
import { createTargetArtifactSnapshot } from '../../services/copilotArtifactPayload.js';
import { getCodexServiceHealth } from '../../services/codexServiceApi.js';
import {
  buildCopilotKnowledgeAttachments,
  copilotAttachmentLimits,
  getKnowledgeSelectionData,
} from '../../services/knowledgeSelectionData.js';
import {
  createKnowledgeSelectionLabels,
  KnowledgeFileSelectionModal,
  KnowledgeItemSelectionModal,
} from '../knowledge-selection/KnowledgeSelectionModals.jsx';
import SquareIconButton from '../ui/SquareIconButton.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { SolidDashboardIcon } from '../ui/SolidIcons.jsx';
import {
  AgentAvatar,
  AgentTaskGroup,
  getAgentPresentation,
  TaskStatusIcon,
} from '../ai-workflow/AiWorkflowComponents.jsx';
import {
  ArticleTaskForm,
  TitleSelector,
} from '../ai-workflow/AiInputComponents.jsx';
import {
  ArtifactCard,
  ArtifactPreview,
} from '../ai-workflow/ArtifactComponents.jsx';

const userMenuIcons = {
  switchAccount: UsersRound,
  accountSettings: Settings,
  notificationPreferences: UserRound,
  logout: LogOut,
};

const emptyComposerDraft = {
  knowledgeFileIds: [],
  knowledgeItemIds: [],
  text: '',
};

function getProjectInitials(name = '') {
  // 项目头像取前两个有效单词首字母。
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

function getUserInitial(name = '') {
  const match = String(name).match(/[a-z]/i);
  return match ? match[0].toUpperCase() : 'U';
}

function formatRelativeTime(value, copy) {
  // 会话列表统一显示分钟、小时或天级相对时间。
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
  // 会话按更新时间倒序展示。
  return [...conversations].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function getLatestConversationRuns(runs = []) {
  // 每个会话只保留最新一次任务运行状态。
  const latestRuns = new Map();

  for (const run of runs) {
    const current = latestRuns.get(run.conversationId);
    if (!current || Date.parse(run.startedAt) > Date.parse(current.startedAt)) {
      latestRuns.set(run.conversationId, run);
    }
  }

  return latestRuns;
}

function getPendingConversationRun(runs = [], conversationId = '') {
  // 查找等待用户补充信息且尚未解决的任务。
  return runs
    .filter(
      (run) =>
        run.conversationId === conversationId &&
        run.status === 'waiting_input' &&
        !run.resolvedAt,
    )
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))[0];
}

function isWaitingTaskCancellation(value = '') {
  // 等待补充时识别用户明确取消任务的表达。
  const normalized = value.trim().toLowerCase().replace(/[。！!.]+$/g, '').trim();
  return /^(取消|停止|不用了|不继续|取消任务|停止任务|cancel|stop|never mind|don't continue)$/.test(
    normalized,
  );
}

function IconTooltip({ children, label, placement = 'right' }) {
  // 折叠侧栏里的图标按钮通过悬浮提示展示含义。
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
  taskRun,
}) {
  // 会话条目同时承载选择、重命名、置顶和删除入口。
  const inputRef = useRef(null);
  const taskStatus = taskRun?.status;
  const taskAcknowledged = Boolean(taskRun?.acknowledgedAt);

  useEffect(() => {
    // 进入重命名状态时自动聚焦并选中标题。
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
          <span
            data-testid={`copilot-conversation-status-${conversation.id}`}
            className="flex items-center justify-end text-xs font-medium text-slate-400 transition-opacity group-hover:opacity-0"
          >
            {taskStatus === 'running' ? (
              <TaskStatusIcon label={copy.taskRunning} status="running" />
            ) : taskStatus === 'waiting_input' && !taskRun?.resolvedAt ? (
              <TaskStatusIcon label={copy.taskWaitingInput} status="waiting_input" />
            ) : taskStatus === 'done' && !taskAcknowledged ? (
              <TaskStatusIcon label={copy.taskCompleted} status="done" />
            ) : (taskStatus === 'error' || taskStatus === 'interrupted') && !taskAcknowledged ? (
              <TaskStatusIcon label={taskStatus === 'error' ? copy.taskFailed : copy.taskInterrupted} status={taskStatus} />
            ) : taskStatus === 'cancelled' && !taskAcknowledged ? (
              <TaskStatusIcon label={copy.taskCancelled || copy.chatStopped} status="cancelled" />
            ) : (
              formatRelativeTime(conversation.updatedAt, copy)
            )}
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
    /* 项目切换菜单在折叠态和展开态共用。 */
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
  locale,
  projects,
  t,
  userMenuItems,
  onClose,
  onProjectChange,
}) {
  const copy = t.copilot;
  const knowledgeSelection = useMemo(() => getKnowledgeSelectionData(activeProject), [activeProject]);
  const knowledgeSelectionLabels = useMemo(
    () => createKnowledgeSelectionLabels(locale, {
      knowledgeFiles: copy.selectKnowledgeFiles,
      knowledgeItems: copy.selectKnowledgeItems,
    }),
    [copy.knowledgeFiles, copy.knowledgeItems, locale],
  );
  // 品牌知识入口复用主应用里的四个业务页面。
  const brandItems = useMemo(
    () => [
      { id: 'brand-profile', icon: FileText, title: t.navItems['brand-profile'] },
      { id: 'audience-persona', icon: UsersRound, title: t.navItems['audience-persona'] },
      { id: 'knowledge-items', icon: Database, title: t.navItems['knowledge-items'] },
      { id: 'knowledge-assets', icon: BookOpenText, title: t.navItems['knowledge-assets'] },
    ],
    [t],
  );
  const initialConversationStateRef = useRef(null);
  if (!initialConversationStateRef.current) {
    // 首次渲染只读取一次当前项目的会话缓存。
    initialConversationStateRef.current = getCopilotConversationState(activeProject.id);
  }
  // 工作台状态分为侧栏、会话、弹层、预览和流式任务五组。
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
  const [editingConversationSurface, setEditingConversationSurface] = useState('');
  const [deleteConversationTarget, setDeleteConversationTarget] = useState(null);
  const [activePopover, setActivePopover] = useState('');
  const [conversationActionMenuOpen, setConversationActionMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [artifactPanelOpen, setArtifactPanelOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewWidthPercent, setPreviewWidthPercent] = useState(50);
  const [composerDrafts, setComposerDrafts] = useState({});
  const [composerMenuOpen, setComposerMenuOpen] = useState(false);
  const [knowledgeModal, setKnowledgeModal] = useState(null);
  const [currentModel, setCurrentModel] = useState('Codex');
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [conversationErrors, setConversationErrors] = useState({});
  const [runningConversationIds, setRunningConversationIds] = useState(() => new Set());
  const [selectedArtifactId, setSelectedArtifactId] = useState('');
  const projectMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const conversationActionMenuRef = useRef(null);
  const headerRenameInputRef = useRef(null);
  const composerMenuRef = useRef(null);
  const chatScrollRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const mainWorkspaceRef = useRef(null);
  const popoverCloseTimerRef = useRef(null);
  const activeChatControllersRef = useRef(new Map());

  const sidebarWidth = sidebarCollapsed ? collapsedSidebarWidth : expandedSidebarWidth;
  const conversations = conversationState.conversations;
  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0];
  const activeComposerDraft = composerDrafts[activeConversation?.id] ?? emptyComposerDraft;
  const chatInput = activeComposerDraft.text;
  const selectedComposerItems = knowledgeSelection.items.filter((item) =>
    activeComposerDraft.knowledgeItemIds.includes(item.id),
  );
  const selectedComposerFiles = knowledgeSelection.files.filter((file) =>
    activeComposerDraft.knowledgeFileIds.includes(file.id),
  );
  const knowledgeModalBlock = getKnowledgeModalBlock();
  const knowledgeModalItemIds =
    knowledgeModal?.target === 'ui-block'
      ? knowledgeModalBlock?.knowledgeItemIds ?? []
      : activeComposerDraft.knowledgeItemIds;
  const knowledgeModalFileIds =
    knowledgeModal?.target === 'ui-block'
      ? knowledgeModalBlock?.knowledgeFileIds ?? []
      : activeComposerDraft.knowledgeFileIds;
  const activeConversationRunning = runningConversationIds.has(activeConversation?.id);
  const chatError = conversationErrors[activeConversation?.id] ?? '';
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
  const latestConversationRuns = useMemo(
    () => getLatestConversationRuns(conversationState.runs),
    [conversationState.runs],
  );
  const activePendingRun = getPendingConversationRun(conversationState.runs, activeConversation?.id);
  const isChatMode = workspaceMode === 'chat';
  const previewVisible = isChatMode && previewOpen;
  const artifactPanelVisible = isChatMode && artifactPanelOpen && !previewOpen;
  const mainGridTemplateColumns = previewVisible
    ? `minmax(480px, 1fr) 10px minmax(360px, ${previewWidthPercent}%)`
    : artifactPanelVisible
      ? 'minmax(0, 1fr) minmax(300px, 340px)'
      : 'minmax(0, 1fr)';

  useEffect(() => {
    // 折叠偏好持久化到本地缓存。
    saveCopilotSidebarCollapsedPreference(sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    // ref 始终指向最新会话状态，供异步流式回调读取。
    conversationStateRef.current = conversationState;
  }, [conversationState]);

  useEffect(() => {
    // 模型名称只读自后端健康检查；读取失败不阻塞用户编辑和后续请求。
    const controller = new AbortController();
    getCodexServiceHealth({ signal: controller.signal })
      .then((health) => setCurrentModel(health?.model || 'Codex'))
      .catch(() => setCurrentModel('Codex'));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    // 切换项目时中断当前流式任务并重载项目会话缓存。
    for (const controller of activeChatControllersRef.current.values()) controller.abort();
    activeChatControllersRef.current.clear();
    const nextConversationState = getCopilotConversationState(activeProject.id);
    conversationStateRef.current = nextConversationState;
    setConversationState(nextConversationState);
    setActiveConversationId(nextConversationState.conversations[0]?.id ?? '');
    setConversationSearchQuery('');
    setActivePopover('');
    setConversationActionMenuOpen(false);
    setEditingConversationId('');
    setEditingConversationTitle('');
    setEditingConversationSurface('');
    setDeleteConversationTarget(null);
    setConversationErrors({});
    setRunningConversationIds(new Set());
    setComposerDrafts({});
    setComposerMenuOpen(false);
    setKnowledgeModal(null);
    setSelectedArtifactId('');
  }, [activeProject.id]);

  useEffect(() => {
    // 顶部重命名输入框出现后自动聚焦并选中现有标题。
    if (editingConversationSurface !== 'header') return;
    headerRenameInputRef.current?.focus();
    headerRenameInputRef.current?.select();
  }, [editingConversationSurface]);

  useEffect(() => {
    // 文本框在 72px 到 160px 之间随内容增高。
    const textarea = chatInputRef.current;
    if (!textarea) return;
    textarea.style.height = '72px';
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 72), 160)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 160 ? 'auto' : 'hidden';
  }, [chatInput, activeConversation?.id]);

  useEffect(() => {
    // 切换会话时定位到最新消息。
    const frame = requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ block: 'end' });
      setShowScrollToLatest(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [activeConversation?.id]);

  useEffect(() => {
    // 用户停留在底部时跟随流式消息，否则只显示“回到最新消息”。
    const container = chatScrollRef.current;
    if (!container) return;
    if (!showScrollToLatest) {
      chatEndRef.current?.scrollIntoView({ block: 'end' });
    } else if (activeMessages.length) {
      setShowScrollToLatest(true);
    }
  }, [activeMessages]);

  useEffect(
    () => () => {
      // 页面卸载时中断所有未完成的流式请求。
      for (const controller of activeChatControllersRef.current.values()) controller.abort();
      activeChatControllersRef.current.clear();
    },
    [],
  );

  useEffect(() => {
    // 当前选中产物不存在时自动回退到第一个产物。
    if (!activeArtifacts.length) {
      if (selectedArtifactId) setSelectedArtifactId('');
      return;
    }

    if (!activeArtifacts.some((artifact) => artifact.id === selectedArtifactId)) {
      setSelectedArtifactId(activeArtifacts[0].id);
    }
  }, [activeArtifacts, selectedArtifactId]);

  useEffect(() => {
    // 点击工作台外部区域时关闭弹层菜单。
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

      if (composerMenuRef.current && !composerMenuRef.current.contains(event.target)) {
        setComposerMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(
    () => () => {
      // 清理延迟关闭弹层的计时器。
      if (popoverCloseTimerRef.current) {
        clearTimeout(popoverCloseTimerRef.current);
      }
    },
    [],
  );

  function persistConversationState(nextState, nextActiveConversationId) {
    // 所有会话状态变更都通过项目维度缓存落盘。
    const savedState = saveCopilotConversationState(activeProject.id, nextState);
    conversationStateRef.current = savedState;
    setConversationState(savedState);
    if (nextActiveConversationId !== undefined) {
      setActiveConversationId(nextActiveConversationId);
    }
  }

  function updateComposerDraft(conversationId, patch) {
    // 未发送文本和附件按会话隔离，切换会话时不会串用。
    if (!conversationId) return;
    setComposerDrafts((current) => ({
      ...current,
      [conversationId]: {
        ...emptyComposerDraft,
        ...(current[conversationId] ?? {}),
        ...patch,
      },
    }));
  }

  function clearComposerDraft(conversationId) {
    if (!conversationId) return;
    setComposerDrafts((current) => ({ ...current, [conversationId]: emptyComposerDraft }));
  }

  function removeComposerDraft(conversationId) {
    setComposerDrafts((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
  }

  function scrollToLatest() {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setShowScrollToLatest(false);
  }

  function handleChatScroll(event) {
    const container = event.currentTarget;
    const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollToLatest(distance >= 120);
  }

  function setConversationRunning(conversationId, running) {
    // runningConversationIds 只保存当前正在流式响应的会话。
    setRunningConversationIds((current) => {
      const next = new Set(current);
      if (running) next.add(conversationId);
      else next.delete(conversationId);
      return next;
    });
  }

  function setConversationError(conversationId, message) {
    // 错误信息按会话隔离，避免切换会话后串台。
    setConversationErrors((current) => ({ ...current, [conversationId]: message }));
  }

  function cancelActiveProjectRuns() {
    // 离开项目或关闭工作台时批量中止当前项目的流式任务。
    const conversationIds = new Set(activeChatControllersRef.current.keys());
    if (!conversationIds.size) return;

    for (const controller of activeChatControllersRef.current.values()) controller.abort();
    activeChatControllersRef.current.clear();
    const endedAt = new Date().toISOString();
    persistConversationState({
      ...conversationStateRef.current,
      messages: conversationStateRef.current.messages.map((message) =>
        conversationIds.has(message.conversationId) && message.status === 'streaming'
          ? { ...message, status: 'cancelled', statusText: '', updatedAt: endedAt }
          : message,
      ),
      runs: conversationStateRef.current.runs.map((run) =>
        conversationIds.has(run.conversationId) && run.status === 'running'
          ? { ...run, acknowledgedAt: '', endedAt, status: 'cancelled' }
          : run,
      ),
    });
    setRunningConversationIds(new Set());
  }

  function cancelConversationRun(conversationId) {
    // 用户点击停止时，只中断当前会话的流式请求。
    const controller = activeChatControllersRef.current.get(conversationId);
    if (!controller) return;

    controller.abort();
    activeChatControllersRef.current.delete(conversationId);
    const endedAt = new Date().toISOString();
    persistConversationState({
      ...conversationStateRef.current,
      messages: conversationStateRef.current.messages.map((message) =>
        message.conversationId === conversationId && message.status === 'streaming'
          ? {
              ...message,
              content: message.content || copy.chatStopped,
              status: 'cancelled',
              statusText: '',
              updatedAt: endedAt,
            }
          : message,
      ),
      runs: conversationStateRef.current.runs.map((run) =>
        run.conversationId === conversationId && run.status === 'running'
          ? { ...run, acknowledgedAt: '', endedAt, status: 'cancelled' }
          : run,
      ),
    });
    setConversationRunning(conversationId, false);
    setConversationError(conversationId, '');
  }

  function closeWorkbench() {
    // 关闭工作台前先释放当前项目的运行中任务。
    cancelActiveProjectRuns();
    onClose();
  }

  function createNewConversation() {
    // 新建会话插入到历史列表顶部并切回聊天模式。
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
    setEditingConversationSurface('');
  }

  function startConversationRename(conversationId, surface = 'sidebar') {
    // 顶部和侧栏共享同一份标题草稿，但只在触发入口显示输入框。
    const target = conversations.find((conversation) => conversation.id === conversationId);
    if (!target) return;

    setWorkspaceMode('chat');
    setActiveConversationId(conversationId);
    setConversationSearchQuery('');
    setActivePopover('');
    setConversationActionMenuOpen(false);
    setEditingConversationId(conversationId);
    setEditingConversationTitle(target.title);
    setEditingConversationSurface(surface);
  }

  function cancelInlineRename() {
    // 退出重命名时清空临时标题。
    setEditingConversationId('');
    setEditingConversationTitle('');
    setEditingConversationSurface('');
  }

  function commitInlineRename(conversationId) {
    // 空标题或未变化标题不写入缓存。
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
    // 置顶状态直接写回会话列表。
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
    // 删除会话会同步清理消息、产物、来源和运行记录。
    activeChatControllersRef.current.get(conversationId)?.abort();
    activeChatControllersRef.current.delete(conversationId);
    setConversationRunning(conversationId, false);
    removeComposerDraft(conversationId);
    setConversationErrors((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
    void releaseCopilotThread(activeProject.id, conversationId).catch(() => {});

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

  function requestConversationDelete(conversationId) {
    // 删除入口只记录目标，会话数据在确认前保持不变。
    const target = conversations.find((conversation) => conversation.id === conversationId);
    if (!target) return;
    setConversationActionMenuOpen(false);
    setDeleteConversationTarget(target);
  }

  function confirmConversationDelete() {
    if (!deleteConversationTarget) return;
    const conversationId = deleteConversationTarget.id;
    setDeleteConversationTarget(null);
    deleteConversation(conversationId);
  }

  function selectProject(projectId) {
    // 切换项目前先中断当前项目的运行任务。
    if (projectId !== activeProject.id) cancelActiveProjectRuns();
    onProjectChange(projectId);
    setActivePopover('');
  }

  function selectConversation(conversationId) {
    // 查看已结束任务时标记最新运行状态为已读。
    const latestRun = getLatestConversationRuns(conversationStateRef.current.runs).get(conversationId);
    const shouldAcknowledge =
      latestRun &&
      !latestRun.acknowledgedAt &&
      ['done', 'error', 'interrupted', 'cancelled'].includes(latestRun.status);

    if (shouldAcknowledge) {
      persistConversationState(
        {
          ...conversationStateRef.current,
          runs: conversationStateRef.current.runs.map((run) =>
            run.id === latestRun.id ? { ...run, acknowledgedAt: new Date().toISOString() } : run,
          ),
        },
        conversationId,
      );
    } else {
      setActiveConversationId(conversationId);
    }
    setWorkspaceMode('chat');
    setActivePopover('');
    setConversationActionMenuOpen(false);
    if (editingConversationId && editingConversationId !== conversationId) cancelInlineRename();
  }

  function selectWorkspaceMode(mode) {
    // 进入业务模块时关闭会话相关浮层。
    setWorkspaceMode(mode);
    setActivePopover('');
    setConversationActionMenuOpen(false);
    setEditingConversationId('');
    setEditingConversationTitle('');
    setEditingConversationSurface('');
  }

  function updateSidebarCollapsed(collapsed) {
    // 侧栏折叠切换会重置正在编辑和打开的浮层。
    setSidebarCollapsed(collapsed);
    setActivePopover('');
    setConversationActionMenuOpen(false);
    setEditingConversationId('');
    setEditingConversationTitle('');
    setEditingConversationSurface('');
  }

  function runConversationAction(action) {
    // 会话菜单动作执行后立即关闭菜单。
    action();
    setConversationActionMenuOpen(false);
  }

  function openPopover(id) {
    // 鼠标重新进入弹层时取消延迟关闭。
    if (popoverCloseTimerRef.current) {
      clearTimeout(popoverCloseTimerRef.current);
    }

    setActivePopover(id);
  }

  function closePopoverLater() {
    // 折叠侧栏弹层延迟关闭，方便鼠标移入弹层本体。
    if (popoverCloseTimerRef.current) {
      clearTimeout(popoverCloseTimerRef.current);
    }

    popoverCloseTimerRef.current = setTimeout(() => setActivePopover(''), 150);
  }

  function togglePopover(id) {
    // 同一个弹层重复点击时收起。
    setActivePopover((current) => (current === id ? '' : id));
  }

  function toggleArtifactPanel() {
    // 产物列表和预览页互斥展示。
    if (artifactPanelVisible) {
      setArtifactPanelOpen(false);
      return;
    }

    setPreviewOpen(false);
    setArtifactPanelOpen(true);
  }

  function togglePreview() {
    // 打开预览页时关闭右侧产物列表。
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
    // 点击产物后直接进入独立预览区。
    setSelectedArtifactId(artifactId);
    setArtifactPanelOpen(false);
    if (!previewOpen) {
      setPreviewWidthPercent(50);
    }
    setPreviewOpen(true);
  }

  function patchConversationState(updater) {
    // 异步回调统一通过函数式补丁更新最新缓存。
    const currentState = conversationStateRef.current;
    const nextState = typeof updater === 'function' ? updater(currentState) : updater;
    persistConversationState(nextState);
    return nextState;
  }

  function updateMessageUiBlock(messageId, blockId, updater) {
    // 演示表单和标题选择状态跟随消息写入项目级会话缓存。
    patchConversationState((currentState) => ({
      ...currentState,
      messages: currentState.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              uiBlocks: (message.uiBlocks ?? []).map((block) =>
                block.id === blockId
                  ? typeof updater === 'function'
                    ? updater(block)
                    : { ...block, ...updater }
                  : block,
              ),
              updatedAt: new Date().toISOString(),
            }
          : message,
      ),
    }));
  }

  function appendToComposer(value) {
    if (!activeConversation?.id || !String(value).trim()) return;
    const nextValue = String(value).trim();
    updateComposerDraft(activeConversation.id, {
      text: chatInput.trim() ? `${chatInput.trimEnd()}\n${nextValue}` : nextValue,
    });
    window.requestAnimationFrame(() => chatInputRef.current?.focus());
  }

  function getKnowledgeModalBlock() {
    if (knowledgeModal?.target !== 'ui-block') return null;
    const message = conversationState.messages.find((item) => item.id === knowledgeModal.messageId);
    return message?.uiBlocks?.find((block) => block.id === knowledgeModal.blockId) ?? null;
  }

  function updateAssistantMessage(messageId, patch) {
    // 流式事件增量合并到同一条助手消息。
    const { artifactId, contentDelta, sourceId, warning, ...messagePatch } = patch;

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
              warnings: warning
                ? [...new Set([...(message.warnings ?? []), warning])]
                : message.warnings,
            }
          : message,
      ),
    }));
  }

  function upsertTaskEventBlock(messageId, eventData) {
    // 后端任务生命周期事件映射为现有多智能体任务组组件。
    const taskId = eventData.taskId || `${messageId}-copilot-process`;
    const blockId = `task-group-${taskId}`;
    patchConversationState((currentState) => ({
      ...currentState,
      messages: currentState.messages.map((message) => {
        if (message.id !== messageId) return message;
        const blocks = [...(message.uiBlocks ?? [])];
        const blockIndex = blocks.findIndex((block) => block.id === blockId);
        const currentBlock = blockIndex >= 0 ? blocks[blockIndex] : null;
        const currentTask = currentBlock?.tasks?.[0] ?? {};
        const nextTask = {
          ...currentTask,
          agentId: eventData.agentId || currentTask.agentId || 'copilot',
          clarification: eventData.prompt ?? currentTask.clarification ?? '',
          id: taskId,
          status: eventData.status || currentTask.status || 'running',
          taskKey: eventData.taskKey || currentTask.taskKey || 'copilot_reply',
          taskName: eventData.taskName || currentTask.taskName,
        };
        const nextBlock = {
          ...currentBlock,
          agentId: eventData.agentId || currentBlock?.agentId || 'copilot',
          id: blockId,
          tasks: [nextTask],
          type: 'task_group',
          workflowId: eventData.workflowId || currentBlock?.workflowId || '',
        };
        if (blockIndex >= 0) blocks[blockIndex] = nextBlock;
        else blocks.push(nextBlock);
        return { ...message, uiBlocks: blocks, updatedAt: new Date().toISOString() };
      }),
    }));
  }

  function appendTaskProcessEvent(messageId, eventData) {
    const taskId = eventData.taskId || `${messageId}-copilot-process`;
    upsertTaskEventBlock(messageId, {
      agentId: eventData.agentId || 'copilot',
      status: 'running',
      taskId,
      taskKey: eventData.taskKey || 'copilot_reply',
      taskName: eventData.taskKey ? undefined : '处理当前请求',
      workflowId: eventData.workflowId,
    });
    patchConversationState((currentState) => ({
      ...currentState,
      messages: currentState.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              uiBlocks: (message.uiBlocks ?? []).map((block) =>
                block.id === `task-group-${taskId}`
                  ? {
                      ...block,
                      tasks: (block.tasks ?? []).map((task) =>
                        task.id === taskId
                          ? {
                              ...task,
                              processItems: [
                                ...(task.processItems ?? []).filter((item) => item.id !== `${taskId}-process-${eventData.sequence}`),
                                {
                                  emphasis: eventData.kind === 'summary',
                                  id: `${taskId}-process-${eventData.sequence}`,
                                  text: eventData.content,
                                },
                              ],
                            }
                          : task,
                      ),
                    }
                  : block,
              ),
              updatedAt: new Date().toISOString(),
            }
          : message,
      ),
    }));
  }

  function attachArtifactToTask(messageId, taskId, artifactId) {
    if (!taskId || !artifactId) return;
    patchConversationState((currentState) => ({
      ...currentState,
      messages: currentState.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              uiBlocks: (message.uiBlocks ?? []).map((block) => ({
                ...block,
                tasks: (block.tasks ?? []).map((task) =>
                  task.id === taskId
                    ? { ...task, artifactIds: [...new Set([...(task.artifactIds ?? []), artifactId])] }
                    : task,
                ),
              })),
            }
          : message,
      ),
    }));
  }

  function upsertConversationArtifact(conversationId, messageId, rawArtifact) {
    // 后端返回的产物写入产物列表，并关联到消息和会话。
    const sourceIds = (rawArtifact.sourceIds ?? []).map((sourceId) =>
      conversationStateRef.current.sources.find(
        (source) => source.conversationId === conversationId && source.originId === sourceId,
      )?.id ?? sourceId,
    );
    const artifact = createCopilotArtifact({
      changedSections: rawArtifact.changedSections ?? [],
      changeSummary: rawArtifact.changeSummary ?? '',
      content: rawArtifact.content,
      contentFormat: rawArtifact.contentFormat ?? 'markdown',
      conversationId,
      evidenceGaps: rawArtifact.evidenceGaps ?? [],
      id: rawArtifact.id,
      metadata: rawArtifact.metadata ?? {},
      parentArtifactId: rawArtifact.parentArtifactId ?? '',
      sourceIds,
      sourceMessageId: messageId,
      status: rawArtifact.status ?? 'ready',
      summary: rawArtifact.summary,
      taskId: rawArtifact.taskId ?? '',
      taskKey: rawArtifact.taskKey ?? rawArtifact.taskType ?? '',
      taskType: rawArtifact.taskType ?? '',
      title: rawArtifact.title,
      type: rawArtifact.type ?? 'reply',
      workflowId: rawArtifact.workflowId ?? '',
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
    return artifact;
  }

  function upsertConversationSource(conversationId, messageId, rawSource) {
    // 后端返回的来源写入来源列表，并关联到助手消息。
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
    // 提交聊天消息后创建用户消息、助手占位消息和运行记录。
    event.preventDefault();

    const content = chatInput.trim();
    if (!content) return;

    const currentConversation =
      conversationStateRef.current.conversations.find((conversation) => conversation.id === activeConversationId) ??
      conversationStateRef.current.conversations[0];
    if (!currentConversation) return;
    if (activeChatControllersRef.current.has(currentConversation.id)) return;

    const pendingRun = getPendingConversationRun(
      conversationStateRef.current.runs,
      currentConversation.id,
    );
    const composerDraft = composerDrafts[currentConversation.id] ?? emptyComposerDraft;
    const cancellingWaitingTask = pendingRun && isWaitingTaskCancellation(content);
    const requestAttachments = cancellingWaitingTask
      ? []
      : buildCopilotKnowledgeAttachments({
          fileIds: composerDraft.knowledgeFileIds,
          files: knowledgeSelection.files,
          itemIds: composerDraft.knowledgeItemIds,
          items: knowledgeSelection.items,
        });

    const userMessage = createCopilotMessage({
      attachments: requestAttachments.map(({ content: _content, ...attachment }) => attachment),
      content,
      conversationId: currentConversation.id,
      role: 'user',
      userName: 'Angel',
    });
    const nextTitle = currentConversation.messageIds?.length
      ? currentConversation.title
      : deriveConversationTitle(content, currentConversation.title);

    if (cancellingWaitingTask) {
      // 等待用户补充时，取消表达直接结束待处理任务。
      const endedAt = new Date().toISOString();
      const cancellationMessage = createCopilotMessage({
        agentId: 'copilot',
        content: copy.chatStopped,
        conversationId: currentConversation.id,
        role: 'assistant',
      });
      persistConversationState(
        {
          ...conversationStateRef.current,
          conversations: conversationStateRef.current.conversations.map((conversation) =>
            conversation.id === currentConversation.id
              ? {
                  ...conversation,
                  messageIds: [
                    ...(conversation.messageIds ?? []),
                    userMessage.id,
                    cancellationMessage.id,
                  ],
                  title: nextTitle,
                  updatedAt: endedAt,
                }
              : conversation,
          ),
          messages: [
            ...conversationStateRef.current.messages,
            userMessage,
            cancellationMessage,
          ],
          runs: conversationStateRef.current.runs.map((run) =>
            run.id === pendingRun.id
              ? {
                  ...run,
                  acknowledgedAt: '',
                  endedAt,
                  resolvedAt: endedAt,
                  status: 'cancelled',
                }
              : run,
          ),
        },
        currentConversation.id,
      );
      clearComposerDraft(currentConversation.id);
      setConversationError(currentConversation.id, '');
      return;
    }

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
      currentTaskIndex: pendingRun?.currentTaskIndex || 0,
      operation: pendingRun?.operation || '',
      originalMessage: pendingRun?.originalMessage || content,
      status: 'running',
      taskKey: pendingRun?.taskKey || pendingRun?.taskType || '',
      taskType: pendingRun?.taskType || '',
      workflowId: pendingRun?.workflowId || '',
      workflowKey: pendingRun?.workflowKey || '',
    });
    const startedAt = new Date().toISOString();
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
      runs: [
        run,
        ...conversationStateRef.current.runs.map((item) =>
          item.id === pendingRun?.id ? { ...item, resolvedAt: startedAt } : item,
        ),
      ],
    };

    persistConversationState(nextState, currentConversation.id);
    clearComposerDraft(currentConversation.id);
    setConversationError(currentConversation.id, '');
    setConversationRunning(currentConversation.id, true);

    const controller = new AbortController();
    activeChatControllersRef.current.set(currentConversation.id, controller);

    const targetCandidate = previewOpen ? selectedArtifact : null;
    // 预览页打开时，把当前产物快照传给后端作为修改目标。
    const targetArtifact = createTargetArtifactSnapshot(targetCandidate);
    const taskContinuation = pendingRun
      ? {
          currentTaskIndex: pendingRun.currentTaskIndex || 0,
          operation: pendingRun.operation || undefined,
          originalMessage: pendingRun.originalMessage,
          requiredField: pendingRun.requiredField,
          response: content,
          taskKey: pendingRun.taskKey || pendingRun.taskType,
          taskType: pendingRun.taskType,
          workflowId: pendingRun.workflowId || undefined,
          workflowKey: pendingRun.workflowKey || undefined,
        }
      : undefined;
    let clarificationEvent = null;
    let latestTaskEvent = null;
    let latestWorkflowEvent = null;
    let streamOutcome = '';
    try {
      await streamCopilotChat({
        body: {
          attachments: requestAttachments,
          conversationId: currentConversation.id,
          message: content,
          projectId: activeProject.id,
          taskContinuation,
          targetArtifact,
          threadId: currentConversation.threadId || undefined,
        },
        conversationId: currentConversation.id,
        signal: controller.signal,
        onEvent: (eventData) => {
          // SSE 事件按类型更新任务状态、消息内容、来源和产物。
          if (eventData.type === 'ping') return;

          if (eventData.type === 'task_status') {
            // 任务状态事件用于刷新助手气泡上的执行标签。
            latestTaskEvent = eventData;
            upsertTaskEventBlock(assistantMessage.id, eventData);
            updateAssistantMessage(assistantMessage.id, {
              agentId: eventData.agentId,
              intent: eventData.intent,
              statusText: eventData.label || eventData.status || copy.taskRunning,
            });
            patchConversationState((currentState) => ({
              ...currentState,
              runs: currentState.runs.map((item) =>
                item.id === run.id
                  ? {
                      ...item,
                      currentTaskIndex: eventData.currentTaskIndex ?? item.currentTaskIndex,
                      operation: eventData.operation || item.operation,
                      taskKey: eventData.taskKey || item.taskKey,
                      taskType: eventData.taskType || eventData.taskKey || eventData.intent || item.taskType,
                      workflowId: eventData.workflowId || item.workflowId,
                    }
                  : item,
              ),
            }));
            if (eventData.status === 'waiting_input') {
              clarificationEvent = {
                content: eventData.prompt || '',
                field: eventData.requiredField || '',
                taskKey: eventData.taskKey || '',
                taskType: eventData.taskType || eventData.taskKey || '',
                workflowId: eventData.workflowId || '',
                workflowKey: latestWorkflowEvent?.workflowKey || '',
                operation: eventData.operation || '',
              };
            }
            return;
          }

          if (eventData.type === 'workflow_status') {
            latestWorkflowEvent = eventData;
            patchConversationState((currentState) => ({
              ...currentState,
              runs: currentState.runs.map((item) =>
                item.id === run.id
                  ? {
                      ...item,
                      currentTaskIndex: eventData.currentTaskIndex ?? item.currentTaskIndex,
                      workflowId: eventData.workflowId || item.workflowId,
                      workflowKey: eventData.workflowKey || item.workflowKey,
                    }
                  : item,
              ),
            }));
            return;
          }

          if (eventData.type === 'process_delta') {
            appendTaskProcessEvent(assistantMessage.id, eventData);
            return;
          }

          if (eventData.type === 'thread_bound') {
            // thread_bound 将后端会话线程 ID 绑定到当前前端会话。
            patchConversationState((currentState) => ({
              ...currentState,
              conversations: currentState.conversations.map((conversation) =>
                conversation.id === currentConversation.id
                  ? { ...conversation, threadId: eventData.threadId }
                  : conversation,
              ),
            }));
            if (eventData.reset) {
              updateAssistantMessage(assistantMessage.id, {
                warning: copy.threadResetWarning,
              });
            }
            return;
          }

          if (eventData.type === 'message_delta') {
            // 文本增量追加到正在流式展示的助手消息。
            updateAssistantMessage(assistantMessage.id, {
              agentId: eventData.agentId,
              contentDelta: eventData.content ?? eventData.delta ?? '',
              intent: eventData.intent,
            });
            return;
          }

          if (eventData.type === 'source' && eventData.source) {
            // 来源事件追加到当前助手消息的引用列表。
            upsertConversationSource(currentConversation.id, assistantMessage.id, eventData.source);
            return;
          }

          if (eventData.type === 'artifact' && eventData.artifact) {
            // 产物事件写入右侧产物面板。
            const artifact = upsertConversationArtifact(currentConversation.id, assistantMessage.id, {
              ...eventData.artifact,
              taskId: eventData.taskId || eventData.artifact.taskId,
              taskKey: eventData.taskKey || eventData.artifact.taskKey,
              workflowId: eventData.workflowId || eventData.artifact.workflowId,
            });
            attachArtifactToTask(assistantMessage.id, eventData.taskId || eventData.artifact.taskId, artifact.id);
            return;
          }

          if (eventData.type === 'clarification_required') {
            // 需要补充信息时，当前运行转为 waiting_input。
            clarificationEvent = eventData;
            updateAssistantMessage(assistantMessage.id, {
              agentId: 'content_operator',
              contentDelta: eventData.content ?? '',
              intent: eventData.taskType ?? 'draft',
              status: 'waiting_input',
              statusText: '',
            });
            return;
          }

          if (eventData.type === 'capability_warning') {
            // 能力缺失或降级提示保留在助手消息里。
            updateAssistantMessage(assistantMessage.id, {
              warning: eventData.content ?? '',
            });
            return;
          }

          if (eventData.type === 'error_message') {
            // 后端主动返回错误事件时抛出到统一 catch 分支。
            const streamError = new Error(eventData.content || copy.chatFallbackError);
            streamError.code = eventData.code;
            throw streamError;
          }

          if (eventData.type === 'done') {
            streamOutcome = eventData.outcome || 'completed';
          }
        },
      });

      const endedAt = new Date().toISOString();
      // 流式完成后根据是否需要澄清写入最终运行状态。
      const finalStatus = clarificationEvent || streamOutcome === 'waiting_input'
        ? 'waiting_input'
        : streamOutcome === 'error'
          ? 'error'
          : 'done';
      updateAssistantMessage(assistantMessage.id, {
        status: finalStatus,
        statusText: '',
      });
      patchConversationState((currentState) => ({
        ...currentState,
        runs: currentState.runs.map((item) =>
          item.id === run.id
            ? finalStatus === 'waiting_input'
              ? {
                  ...item,
                  currentTaskIndex: latestWorkflowEvent?.currentTaskIndex ?? item.currentTaskIndex,
                  endedAt,
                  originalMessage: pendingRun?.originalMessage || content,
                  requiredField: clarificationEvent?.field || '',
                  status: 'waiting_input',
                  operation: clarificationEvent?.operation || latestTaskEvent?.operation || item.operation,
                  taskKey: clarificationEvent?.taskKey || latestTaskEvent?.taskKey || item.taskKey,
                  taskType: clarificationEvent?.taskType || item.taskType,
                  workflowId: clarificationEvent?.workflowId || latestWorkflowEvent?.workflowId || item.workflowId,
                  workflowKey: clarificationEvent?.workflowKey || latestWorkflowEvent?.workflowKey || item.workflowKey,
                }
              : { ...item, endedAt, status: finalStatus }
            : item,
        ),
      }));
    } catch (error) {
      // AbortError 属于主动停止，不展示为失败。
      if (error && typeof error === 'object' && error.name === 'AbortError') return;

      const message = getChatErrorMessage(error);
      setConversationError(currentConversation.id, message);
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
            ? {
                ...item,
                endedAt: new Date().toISOString(),
                error: message,
                errorCode: error?.code || 'chat_error',
                status: 'error',
              }
            : item,
        ),
      }));
    } finally {
      // 无论成功或失败，都清理当前会话的控制器和运行标记。
      if (activeChatControllersRef.current.get(currentConversation.id) === controller) {
        activeChatControllersRef.current.delete(currentConversation.id);
      }
      setConversationRunning(currentConversation.id, false);
    }
  }

  function startPreviewResize(event) {
    // 拖拽分隔线时按容器宽度限制预览面板大小。
    const container = mainWorkspaceRef.current;
    if (!container) return;

    event.preventDefault();

    const rect = container.getBoundingClientRect();
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    function updatePreviewWidth(pointerEvent) {
      // 预览宽度被限制在最小可读宽度和最大比例之间。
      const previewWidth = rect.right - pointerEvent.clientX;
      const maxWidthByRatio = rect.width * 0.7;
      const maxWidthByChat = rect.width - 480;
      const minWidth = Math.min(360, rect.width * 0.5);
      const maxWidth = Math.max(minWidth, Math.min(maxWidthByRatio, maxWidthByChat));
      const clampedWidth = Math.min(Math.max(previewWidth, minWidth), maxWidth);

      setPreviewWidthPercent((clampedWidth / rect.width) * 100);
    }

    function stopPreviewResize() {
      // 拖拽结束后恢复页面光标和选中文本能力。
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener('pointermove', updatePreviewWidth);
      window.removeEventListener('pointerup', stopPreviewResize);
    }

    window.addEventListener('pointermove', updatePreviewWidth);
    window.addEventListener('pointerup', stopPreviewResize, { once: true });
  }

  function renderConversationList(items) {
    // 会话列表统一传入当前编辑态和最新运行态。
    return items.map((conversation) => (
      <ConversationItem
        key={conversation.id}
        active={conversation.id === activeConversationId}
        conversation={conversation}
        copy={copy}
        editingTitle={editingConversationTitle}
        isEditing={conversation.id === editingConversationId && editingConversationSurface === 'sidebar'}
        onDelete={() => requestConversationDelete(conversation.id)}
        onCancelRename={cancelInlineRename}
        onCommitRename={commitInlineRename}
        onEditingTitleChange={setEditingConversationTitle}
        onRenameStart={() => startConversationRename(conversation.id, 'sidebar')}
        onSelect={() => selectConversation(conversation.id)}
        onTogglePin={() => toggleConversationPin(conversation.id)}
        taskRun={latestConversationRuns.get(conversation.id)}
      />
    ));
  }

  function renderConversationGroups({ collapsible = false } = {}) {
    // 会话列表按置顶和普通历史分组展示。
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
    // 非聊天模式复用主应用里的品牌知识页面。
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
    // 折叠态搜索弹层内联复用会话分组列表。
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
    // 折叠态历史弹层只展示会话分组。
    return (
      <div className="absolute left-[calc(100%+10px)] top-0 z-50 w-[320px] rounded-xl border border-slate-200 bg-white p-3 shadow-menu">
        {renderConversationGroups()}
      </div>
    );
  }

  function renderMessageSources(message) {
    // 助手消息下方展示已关联来源。
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
      <div key={artifact.id} className="mt-3">
        <ArtifactCard artifact={artifact} selected={selectedArtifact?.id === artifact.id} onClick={() => openArtifactPreview(artifact.id)} />
      </div>
    );
  }

  function renderMessageArtifacts(message) {
    // 助手消息下方展示已关联产物入口。
    const blockArtifactIds = new Set(
      (message.uiBlocks ?? [])
        .flatMap((block) => block.tasks ?? [])
        .flatMap((task) => task.artifactIds ?? []),
    );
    const artifacts = conversationState.artifacts.filter(
      (artifact) => message.artifactIds?.includes(artifact.id) && !blockArtifactIds.has(artifact.id),
    );
    if (!artifacts.length) return null;

    return <div>{artifacts.map(renderInlineArtifactCard)}</div>;
  }

  function renderMessageUiBlocks(message) {
    if (!message.uiBlocks?.length) return null;

    return (
      <div className="space-y-6">
        {message.uiBlocks.map((block) => {
          if (block.type === 'task_group') {
            return (
              <AgentTaskGroup
                key={block.id}
                block={block}
                locale={locale}
                sources={conversationState.sources}
                renderArtifact={(artifactId) => {
                  const artifact = conversationState.artifacts.find((item) => item.id === artifactId);
                  return artifact ? renderInlineArtifactCard(artifact) : null;
                }}
              />
            );
          }

          const agent = getAgentPresentation(block.agentId || message.agentId || 'copilot', locale);
          return (
            <section key={block.id} className="flex gap-4">
              <AgentAvatar agentId={agent.id} locale={locale} />
              <div className="min-w-0 flex-1 pb-4">
                <div className="text-[15px] font-semibold leading-6 text-slate-900">{agent.name}</div>
                <div className="mt-3">
                  {block.type === 'article_task_form' ? (
                    <ArticleTaskForm
                      block={block}
                      knowledgeFiles={knowledgeSelection.files}
                      knowledgeItems={knowledgeSelection.items}
                      locale={locale}
                      onChange={(values) => updateMessageUiBlock(message.id, block.id, { values })}
                      onOpenKnowledge={(kind) => setKnowledgeModal({ kind, target: 'ui-block', messageId: message.id, blockId: block.id })}
                    />
                  ) : block.type === 'title_selector' ? (
                    <TitleSelector
                      locale={locale}
                      options={block.options}
                      selectedTitleId={block.selectedTitleId}
                      onSelect={(option) => {
                        updateMessageUiBlock(message.id, block.id, { selectedTitleId: option.id });
                        appendToComposer(option.title);
                      }}
                    />
                  ) : null}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  function renderMessageAttachments(message) {
    if (!message.attachments?.length) return null;
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {message.attachments.map((attachment) => {
          const Icon = attachment.kind === 'knowledge_item' ? Database : BookOpenText;
          return (
            <span
              key={`${attachment.kind}:${attachment.id}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white"
            >
              <Icon className="h-3.5 w-3.5 flex-none" />
              <span className="truncate">{attachment.title}</span>
            </span>
          );
        })}
      </div>
    );
  }

  function getChatErrorMessage(error) {
    // 网络和 SSE 异常统一映射为连接错误文案。
    const message = error instanceof Error ? error.message : String(error || '');
    if (
      error instanceof TypeError ||
      /Failed to fetch|No SSE events|Codex service/i.test(
        message,
      )
    ) {
      return copy.chatConnectionError;
    }

    return message || copy.chatFallbackError;
  }

  function renderChatMessage(message) {
    // 聊天气泡根据角色、错误和流式状态切换展示样式。
    const isUser = message.role === 'user';
    const isError = message.status === 'error' || message.status === 'interrupted';
    const isStreaming = message.status === 'streaming';

    if (isUser) {
      const userName = message.userName || 'Angel';
      return (
        <article key={message.id} className="flex w-full justify-end gap-3">
          <div className="max-w-[74%] text-right">
            <div className="mb-1 text-xs font-bold text-slate-400">{userName}</div>
            <div className="rounded-[8px] bg-slate-950 px-4 py-3 text-left text-sm leading-6 text-white shadow-sm">
              <p className="whitespace-pre-wrap">{message.content}</p>
              {renderMessageAttachments(message)}
            </div>
          </div>
          <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-950 text-[15px] font-bold text-white">
            {getUserInitial(userName)}
          </span>
        </article>
      );
    }

    if (message.uiBlocks?.length) {
      return <article key={message.id} className="w-full">{renderMessageUiBlocks(message)}{message.content ? <div className="ml-14 mt-2 whitespace-pre-wrap text-[14px] leading-6 text-slate-600">{message.content}</div> : null}</article>;
    }

    const agent = getAgentPresentation(message.agentId || 'copilot', locale);
    return (
      <article key={message.id} className="flex w-full gap-4">
        <AgentAvatar agentId={agent.id} locale={locale} />
        <div className="min-w-0 flex-1 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold leading-6 text-slate-900">{agent.name}</span>
            {message.statusText ? <span className="text-xs font-semibold text-blue-600">{message.statusText}</span> : null}
          </div>
          <div className={`mt-2 text-[14px] leading-6 ${isError ? 'text-red-600' : 'text-slate-600'}`}>
            {message.content ? <p className="whitespace-pre-wrap">{message.content}</p> : message.status === 'interrupted' ? <span>{copy.taskInterrupted}</span> : message.status === 'cancelled' ? <span>{copy.chatStopped}</span> : isStreaming ? <span className="inline-flex items-center gap-2 text-slate-400"><Loader2 className="h-3.5 w-3.5 animate-spin" />{copy.chatThinking}</span> : <span className="text-slate-400">{copy.chatEmptyResponse}</span>}
            {renderMessageSources(message)}
            {message.warnings?.length ? <div className="mt-3 space-y-2">{message.warnings.map((warning) => <p key={warning} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium leading-5 text-amber-700">{warning}</p>)}</div> : null}
            {renderMessageArtifacts(message)}
          </div>
        </div>
      </article>
    );
  }

  function renderArtifactPreviewBody(artifact) {
    return (
      <ArtifactPreview
        artifact={artifact}
        emptyText={copy.artifactPlaceholderBody}
        onInsertToComposer={appendToComposer}
      />
    );
  }

  function renderArtifactTools() {
    // 产物工具栏负责切换列表面板和独立预览页。
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
          {workspaceMode === 'chat' && editingConversationSurface === 'header' && editingConversationId === activeConversation?.id ? (
            <input
              ref={headerRenameInputRef}
              data-testid="copilot-header-rename-input"
              className="h-9 min-w-0 rounded-md border border-blue-200 bg-white px-3 text-xl font-bold tracking-normal text-slate-900 outline-none ring-2 ring-blue-100 focus:border-blue-400 [width:clamp(240px,32vw,560px)]"
              value={editingConversationTitle}
              onBlur={(event) => {
                if (event.currentTarget.dataset.renameCanceled === 'true') return;
                commitInlineRename(activeConversation.id);
              }}
              onChange={(event) => setEditingConversationTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitInlineRename(activeConversation.id);
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.currentTarget.dataset.renameCanceled = 'true';
                  cancelInlineRename();
                }
              }}
              aria-label={copy.rename}
            />
          ) : (
            <h1 className="truncate text-xl font-bold tracking-normal text-slate-900">{pageTitle}</h1>
          )}
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
                    onClick={() => runConversationAction(() => startConversationRename(activeConversation.id, 'header'))}
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
                    onClick={() => runConversationAction(() => requestConversationDelete(activeConversation.id))}
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
            onClick={closeWorkbench}
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
              <div
                ref={chatScrollRef}
                className="min-h-0 flex-1 overflow-y-auto px-8 py-8"
                onScroll={handleChatScroll}
              >
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
                  <div ref={chatEndRef} aria-hidden="true" />
                </div>
              </div>

              <form className="relative bg-transparent px-8 pb-6 pt-2" onSubmit={submitChat}>
                {showScrollToLatest ? (
                  <button
                    type="button"
                    className="absolute -top-11 left-1/2 z-10 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:bg-slate-50 hover:text-slate-900"
                    onClick={scrollToLatest}
                    aria-label={copy.scrollToLatest}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                ) : null}
                <div className="mx-auto flex min-h-[152px] w-full max-w-4xl flex-col rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50/70">
                  {chatError ? (
                    <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-600">
                      <span className="font-bold">{copy.chatErrorTitle}: </span>{chatError}
                    </p>
                  ) : null}
                  {activePendingRun ? (
                    <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-700">
                      {copy.taskWaitingInput}
                    </p>
                  ) : null}
                  {selectedComposerItems.length || selectedComposerFiles.length ? (
                    <div className="mb-2 flex flex-wrap gap-2" data-testid="copilot-composer-attachments">
                      {[...selectedComposerItems.map((item) => ({ ...item, kind: 'knowledge_item' })), ...selectedComposerFiles.map((file) => ({ ...file, kind: 'knowledge_file' }))].map((attachment) => {
                        const Icon = attachment.kind === 'knowledge_item' ? Database : BookOpenText;
                        return (
                          <span key={`${attachment.kind}:${attachment.id}`} className="inline-flex h-7 max-w-[240px] items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700">
                            <Icon className="h-3.5 w-3.5 flex-none" />
                            <span className="truncate">{attachment.title}</span>
                            <button
                              type="button"
                              className="grid h-4 w-4 flex-none place-items-center rounded-full hover:bg-white"
                              onClick={() => updateComposerDraft(activeConversation.id, attachment.kind === 'knowledge_item'
                                ? { knowledgeItemIds: activeComposerDraft.knowledgeItemIds.filter((id) => id !== attachment.id) }
                                : { knowledgeFileIds: activeComposerDraft.knowledgeFileIds.filter((id) => id !== attachment.id) })}
                              aria-label={`${copy.removeAttachment} ${attachment.title}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                  <textarea
                    ref={chatInputRef}
                    data-testid="copilot-chat-input"
                    className="min-h-[72px] max-h-[160px] w-full resize-none border-none bg-transparent px-1 py-1 text-sm font-medium leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                    value={chatInput}
                    onChange={(event) => updateComposerDraft(activeConversation.id, { text: event.target.value })}
                    placeholder={copy.chatInputPlaceholder}
                  />
                  <div className="mt-auto flex h-10 items-center justify-between gap-3">
                    <div ref={composerMenuRef} className="relative">
                      <button
                        type="button"
                        className={`grid h-9 w-9 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 ${composerMenuOpen ? 'bg-slate-100 text-slate-900' : ''}`}
                        onClick={() => setComposerMenuOpen((open) => !open)}
                        aria-expanded={composerMenuOpen}
                        aria-label={copy.addContent}
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                      {composerMenuOpen ? (
                        <div className="absolute bottom-[calc(100%+10px)] left-0 z-50 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-menu">
                          <button type="button" className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => { setKnowledgeModal({ kind: 'items', target: 'composer' }); setComposerMenuOpen(false); }}><Database className="h-4 w-4 text-blue-600" />{copy.knowledgeItems}</button>
                          <button type="button" className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => { setKnowledgeModal({ kind: 'files', target: 'composer' }); setComposerMenuOpen(false); }}><BookOpenText className="h-4 w-4 text-blue-600" />{copy.knowledgeFiles}</button>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="max-w-[180px] truncate text-xs font-semibold text-slate-500" title={currentModel}>{currentModel}</span>
                      <button
                        data-testid="copilot-chat-submit"
                        type={activeConversationRunning ? 'button' : 'submit'}
                        disabled={!activeConversationRunning && !chatInput.trim()}
                        className={`grid h-10 w-10 flex-none place-items-center rounded-full text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 ${activeConversationRunning ? 'bg-slate-900 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'}`}
                        onClick={activeConversationRunning ? () => cancelConversationRun(activeConversation.id) : undefined}
                        aria-label={activeConversationRunning ? copy.chatStop : copy.chatSend}
                      >
                        {activeConversationRunning ? <Square className="h-3.5 w-3.5 fill-current" /> : <ArrowUp className="h-5 w-5 stroke-[2.5]" />}
                      </button>
                    </div>
                  </div>
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
                        <ArtifactCard
                          key={artifact.id}
                          artifact={artifact}
                          panel
                          selected={selectedArtifact?.id === artifact.id}
                          onClick={() => openArtifactPreview(artifact.id)}
                        />
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

      {deleteConversationTarget ? (
        <ConfirmDialog
          cancelLabel={copy.cancel}
          confirmLabel={copy.confirmDelete}
          danger
          message={copy.deleteConversationBody(deleteConversationTarget.title)}
          onCancel={() => setDeleteConversationTarget(null)}
          onConfirm={confirmConversationDelete}
          testId="copilot-delete-conversation-dialog"
          title={copy.deleteConversationTitle}
        />
      ) : null}

      {knowledgeModal?.kind === 'items' ? (
        <KnowledgeItemSelectionModal
          items={knowledgeSelection.items}
          labels={knowledgeSelectionLabels}
          locale={locale}
          maxSelected={copilotAttachmentLimits.maxAttachments - knowledgeModalFileIds.length}
          onClose={() => setKnowledgeModal(null)}
          onConfirm={(ids) => {
            if (knowledgeModal.target === 'ui-block' && knowledgeModalBlock) {
              updateMessageUiBlock(knowledgeModal.messageId, knowledgeModal.blockId, { knowledgeItemIds: ids });
            } else {
              updateComposerDraft(activeConversation.id, { knowledgeItemIds: ids });
            }
            setKnowledgeModal(null);
          }}
          selectedIds={knowledgeModalItemIds}
          types={knowledgeSelection.types}
        />
      ) : null}
      {knowledgeModal?.kind === 'files' ? (
        <KnowledgeFileSelectionModal
          files={knowledgeSelection.files}
          labels={knowledgeSelectionLabels}
          locale={locale}
          maxSelected={copilotAttachmentLimits.maxAttachments - knowledgeModalItemIds.length}
          onClose={() => setKnowledgeModal(null)}
          onConfirm={(ids) => {
            if (knowledgeModal.target === 'ui-block' && knowledgeModalBlock) {
              updateMessageUiBlock(knowledgeModal.messageId, knowledgeModal.blockId, { knowledgeFileIds: ids });
            } else {
              updateComposerDraft(activeConversation.id, { knowledgeFileIds: ids });
            }
            setKnowledgeModal(null);
          }}
          requireUsableContent
          selectedIds={knowledgeModalFileIds}
        />
      ) : null}
    </div>
  );
}

function CollapsibleSidebarGroup({ children, open, title, onToggle, 'data-testid': dataTestId }) {
  return (
    /* 展开侧栏中的可折叠分组。 */
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
    /* 非折叠弹层里的静态会话分组。 */
    <section className="mb-4">
      <h3 className="mb-2 flex min-h-7 items-center px-3 text-[12px] font-bold text-slate-400">{title}</h3>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function ActionMenuButton({ danger = false, icon: Icon, label, onClick }) {
  return (
    /* 会话动作菜单的单个操作项。 */
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
