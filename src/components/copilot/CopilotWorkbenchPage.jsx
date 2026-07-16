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
  getSidebarCollapsedPreference,
  saveSidebarCollapsedPreference,
} from '../../features/copilot/storage.js';
import { copilotAttachmentLimits } from '../../features/copilot/contracts.js';
import { useCopilotController } from '../../features/copilot/useCopilotController.js';
import {
  buildCopilotKnowledgeAttachments,
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
  getAgentPresentation,
  TaskStatusIcon,
} from '../ai-workflow/AiWorkflowComponents.jsx';
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
  const copilot = useCopilotController({
    projectId: activeProject.id,
    untitledLabel: copy.untitled,
  });
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
  // 页面只保留展示和输入相关状态，会话与网络状态由 controller 管理。
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getSidebarCollapsedPreference);
  const [brandSectionOpen, setBrandSectionOpen] = useState(true);
  const [pinnedSectionOpen, setPinnedSectionOpen] = useState(true);
  const [historySectionOpen, setHistorySectionOpen] = useState(true);
  const [workspaceMode, setWorkspaceMode] = useState('chat');
  const [conversationSearchQuery, setConversationSearchQuery] = useState('');
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
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
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

  const sidebarWidth = sidebarCollapsed ? collapsedSidebarWidth : expandedSidebarWidth;
  const {
    activeConversation,
    activeConversationId,
    conversationErrors,
    conversationState,
    currentModel,
    runningConversationIds,
  } = copilot;
  const conversations = conversationState.conversations;
  const activeComposerDraft = composerDrafts[activeConversation?.id] ?? emptyComposerDraft;
  const chatInput = activeComposerDraft.text;
  const selectedComposerItems = knowledgeSelection.items.filter((item) =>
    activeComposerDraft.knowledgeItemIds.includes(item.id),
  );
  const selectedComposerFiles = knowledgeSelection.files.filter((file) =>
    activeComposerDraft.knowledgeFileIds.includes(file.id),
  );
  const knowledgeModalItemIds = activeComposerDraft.knowledgeItemIds;
  const knowledgeModalFileIds = activeComposerDraft.knowledgeFileIds;
  const activeConversationRunning = runningConversationIds.has(activeConversation?.id);
  const chatError = conversationErrors[activeConversation?.id] ?? '';
  const activeMessages = useMemo(
    () => conversationState.messages
      .filter((message) => message.conversationId === activeConversation?.id)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
    [activeConversation?.id, conversationState],
  );
  const activeArtifacts = useMemo(
    () => conversationState.artifacts
      .filter((artifact) => artifact.conversationId === activeConversation?.id)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
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
    saveSidebarCollapsedPreference(sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    // 切换项目时只重置页面级输入和弹层；controller 负责停止请求和加载服务端会话。
    setConversationSearchQuery('');
    setActivePopover('');
    setConversationActionMenuOpen(false);
    setEditingConversationId('');
    setEditingConversationTitle('');
    setEditingConversationSurface('');
    setDeleteConversationTarget(null);
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

  function cancelActiveProjectRuns() {
    // controller 会同时终止浏览器请求和 EdgeOne Agent 运行。
    copilot.stopAll();
  }

  function cancelConversationRun(conversationId) {
    void copilot.stopConversation(conversationId);
  }

  function closeWorkbench() {
    cancelActiveProjectRuns();
    onClose();
  }

  function createNewConversation() {
    copilot.createConversation(copy.newConversationTitle(conversations.length + 1));
    setWorkspaceMode('chat');
    setActivePopover('');
    setConversationSearchQuery('');
    setConversationActionMenuOpen(false);
    cancelInlineRename();
  }

  function startConversationRename(conversationId, surface = 'sidebar') {
    const target = conversations.find((conversation) => conversation.id === conversationId);
    if (!target) return;

    copilot.selectConversation(conversationId);
    setWorkspaceMode('chat');
    setConversationSearchQuery('');
    setActivePopover('');
    setConversationActionMenuOpen(false);
    setEditingConversationId(conversationId);
    setEditingConversationTitle(target.title);
    setEditingConversationSurface(surface);
  }

  function cancelInlineRename() {
    setEditingConversationId('');
    setEditingConversationTitle('');
    setEditingConversationSurface('');
  }

  function commitInlineRename(conversationId) {
    if (editingConversationId !== conversationId) return;
    const target = conversations.find((conversation) => conversation.id === conversationId);
    const nextTitle = editingConversationTitle.trim();
    if (target && nextTitle && nextTitle !== target.title) {
      copilot.renameConversation(conversationId, nextTitle);
    }
    cancelInlineRename();
  }

  function toggleConversationPin(conversationId) {
    copilot.togglePin(conversationId);
  }

  async function deleteConversation(conversationId) {
    // 服务端删除成功后 controller 才会移除本地会话。
    await copilot.deleteConversation(conversationId);
    removeComposerDraft(conversationId);
    if (editingConversationId === conversationId) cancelInlineRename();
  }

  function requestConversationDelete(conversationId) {
    const target = conversations.find((conversation) => conversation.id === conversationId);
    if (!target) return;
    setConversationActionMenuOpen(false);
    setDeleteConversationTarget(target);
  }

  async function confirmConversationDelete() {
    if (!deleteConversationTarget) return;
    const conversationId = deleteConversationTarget.id;
    try {
      await deleteConversation(conversationId);
      setDeleteConversationTarget(null);
    } catch {
      // 删除失败时保留确认弹窗，避免界面误认为会话已删除。
    }
  }

  function selectProject(projectId) {
    if (projectId !== activeProject.id) cancelActiveProjectRuns();
    onProjectChange(projectId);
    setActivePopover('');
  }

  function selectConversation(conversationId) {
    copilot.selectConversation(conversationId);
    setWorkspaceMode('chat');
    setActivePopover('');
    setConversationActionMenuOpen(false);
    if (editingConversationId && editingConversationId !== conversationId) cancelInlineRename();
  }

  function selectWorkspaceMode(mode) {
    setWorkspaceMode(mode);
    setActivePopover('');
    setConversationActionMenuOpen(false);
    cancelInlineRename();
  }

  function updateSidebarCollapsed(collapsed) {
    setSidebarCollapsed(collapsed);
    setActivePopover('');
    setConversationActionMenuOpen(false);
    cancelInlineRename();
  }

  function runConversationAction(action) {
    action();
    setConversationActionMenuOpen(false);
  }

  function openPopover(id) {
    if (popoverCloseTimerRef.current) clearTimeout(popoverCloseTimerRef.current);
    setActivePopover(id);
  }

  function closePopoverLater() {
    if (popoverCloseTimerRef.current) clearTimeout(popoverCloseTimerRef.current);
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
    if (!previewOpen) setPreviewWidthPercent(50);
    setPreviewOpen(true);
  }

  function appendToComposer(value) {
    if (!activeConversation?.id || !String(value).trim()) return;
    const nextValue = String(value).trim();
    updateComposerDraft(activeConversation.id, {
      text: chatInput.trim() ? `${chatInput.trimEnd()}\n${nextValue}` : nextValue,
    });
    window.requestAnimationFrame(() => chatInputRef.current?.focus());
  }

  async function submitChat(event) {
    event?.preventDefault?.();
    const content = chatInput.trim();
    if (!content || !activeConversation?.id || activeConversationRunning) return;

    const attachments = buildCopilotKnowledgeAttachments({
      fileIds: activeComposerDraft.knowledgeFileIds,
      files: knowledgeSelection.files,
      itemIds: activeComposerDraft.knowledgeItemIds,
      items: knowledgeSelection.items,
    });
    clearComposerDraft(activeConversation.id);
    await copilot.sendMessage({ attachments, content });
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

  function renderMessageUiBlocks() {
    // 第一阶段只保留流程组件，不从普通聊天事件构造文章工作流区块。
    return null;
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
            updateComposerDraft(activeConversation.id, { knowledgeItemIds: ids });
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
            updateComposerDraft(activeConversation.id, { knowledgeFileIds: ids });
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
