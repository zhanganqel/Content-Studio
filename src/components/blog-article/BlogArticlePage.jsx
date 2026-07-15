import {
  Bot,
  CalendarClock,
  ChevronDown,
  CircleStop,
  Copy,
  FilePenLine,
  FilePlus2,
  FileSearch,
  FileText,
  History,
  RefreshCw,
  Save,
  Search,
  Settings2,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { adaptivePageLayout } from '../layoutClasses.js';
import Button from '../ui/Button.jsx';
import ListCard from '../ui/ListCard.jsx';
import PageHeader from '../ui/PageHeader.jsx';
import Toast from '../ui/Toast.jsx';
import {
  deleteAiCreationTask,
  getAiCreationTasks,
  updateAiCreationTask,
} from '../../services/blogArticleAiStore.js';
import { saveAiTaskAsBlogArticle } from '../../services/blogArticleAiArticleStore.js';
import {
  articleStatusOptions,
  articleTypeOptions,
  createBlankBlogArticle,
  createBlogArticleId,
  getBlogArticleDrafts,
  getTodayString,
  saveBlogArticleDrafts,
} from '../../services/blogArticleStore.js';

const emptyAdvancedFilters = {
  audiencePersonaId: 'all',
  articleType: 'all',
  updatedFrom: '',
  updatedTo: '',
  updatedBy: 'all',
};

const taskStatusValues = ['generating', 'success', 'stopped', 'failed'];

// 高级筛选默认值统一定义，清空筛选时复用同一结构。
function hasAdvancedFilterValue(filters) {
  return (
    filters.audiencePersonaId !== 'all' ||
    filters.articleType !== 'all' ||
    Boolean(filters.updatedFrom) ||
    Boolean(filters.updatedTo) ||
    filters.updatedBy !== 'all'
  );
}

// AI 任务中的文章类型可能带中文说明，列表筛选只比较标准类型名。
function normalizeArticleType(value) {
  return String(value ?? '').replace(/（.*$/, '').trim();
}

function getTaskInput(task) {
  return task?.taskInput ?? {};
}

function getTaskAudienceId(task) {
  const input = getTaskInput(task);
  return input.targetAudienceId || input.targetAudience?.id || '';
}

function getTaskAudienceName(task) {
  const input = getTaskInput(task);
  return input.targetAudience?.title || input.targetAudience?.name || input.targetAudienceName || getTaskAudienceId(task);
}

function getTaskArticleType(task) {
  return normalizeArticleType(getTaskInput(task).articleType);
}

function getTaskTitle(task) {
  return (
    task?.content?.finalArticle?.headline ||
    task?.outline?.titleDraft ||
    getTaskInput(task).articleTopic ||
    '文章创作任务'
  );
}

function getTaskSavedArticleId(task) {
  return task?.content?.savedArticleId || '';
}

function getTaskUpdatedAt(task) {
  return task?.updatedAt || task?.createdAt || getTodayString();
}

function getTaskUpdatedBy(task) {
  return task?.updatedBy || getTaskInput(task).updatedBy || 'Angel';
}

// 根据任务 stage 推断当前展示阶段，自动流程单独归类。
function getTaskFlowStage(task) {
  const stage = task?.stage ?? '';
  if (task?.mode === 'auto' || stage.startsWith('auto')) return 'auto';
  if (stage.startsWith('content')) return 'content';
  if (stage.startsWith('outline')) return 'outline';
  return 'planning';
}

// 任务状态由 stage 和 errorMessage 共同决定，供历史任务列表展示。
function getTaskGenerationStatus(task) {
  const stage = task?.stage ?? '';
  if (task?.errorMessage || stage === 'failed' || stage.endsWith('-failed')) return 'failed';
  if (stage.endsWith('-stopped')) return 'stopped';
  if (stage === 'content-completed') return 'success';
  return 'generating';
}

// 生成进度按阶段粗略映射，不表示真实模型进度。
function getTaskProgress(task) {
  const stage = task?.stage ?? '';
  if (stage === 'content-completed') return 100;
  if (stage === 'auto-generating') return 62;
  if (stage.startsWith('content')) return 82;
  if (stage === 'outline-completed') return 70;
  if (stage.startsWith('outline')) return 55;
  if (stage === 'planning-completed') return 35;
  if (stage.startsWith('planning')) return 22;
  return 8;
}

function getTaskStageLabel(task, copy) {
  const stage = task?.stage ?? '';
  if (stage.startsWith('auto')) return copy.taskList.stage.auto;
  if (stage.startsWith('content')) return copy.taskList.stage.content;
  if (stage.startsWith('outline')) return copy.taskList.stage.outline;
  if (stage.startsWith('planning')) return copy.taskList.stage.planning;
  return copy.taskList.stage.create;
}

// 文章搜索覆盖标题、受众、类型、更新人和关键词。
function getArticleSearchText(article) {
  return [
    article.title,
    article.targetAudienceName,
    article.articleType,
    article.updatedBy,
    ...(article.keywords ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

// 任务搜索覆盖任务输入、关键词、文章类型、受众和更新人。
function getTaskSearchText(task) {
  const input = getTaskInput(task);
  return [
    getTaskTitle(task),
    input.articleTopic,
    input.primaryKeyword,
    ...(input.secondaryKeywords ?? []),
    getTaskArticleType(task),
    getTaskAudienceName(task),
    getTaskUpdatedBy(task),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function StatusBadge({ copy, status }) {
  const classes = {
    draft: 'bg-slate-100 text-slate-600 ring-slate-200',
    review: 'bg-amber-50 text-amber-600 ring-amber-200',
    pending: 'bg-blue-50 text-blue-600 ring-blue-200',
    published: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  };

  return (
    <span className={`inline-flex flex-none items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ${classes[status]}`}>
      {copy.status[status]}
    </span>
  );
}

function GenerationStatusBadge({ copy, status }) {
  const classes = {
    failed: 'bg-red-50 text-red-600 ring-red-200',
    generating: 'bg-blue-50 text-blue-600 ring-blue-200',
    stopped: 'bg-slate-100 text-slate-600 ring-slate-200',
    success: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  };

  return (
    <span className={`inline-flex flex-none items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ${classes[status]}`}>
      {copy.taskList.status[status]}
    </span>
  );
}

function SelectControl({ label, onChange, options, value }) {
  return (
    <span className="relative block">
      <select
        className="h-11 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-10 text-base text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </span>
  );
}

function ConfirmDialog({
  cancelLabel,
  confirmLabel,
  danger,
  message,
  onCancel,
  onConfirm,
  title,
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-menu">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="neutral" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CreationModeDialog({ copy, onCancel, onSelect }) {
  // 创建模式决定后续进入协作式分阶段流程或自动创作流程。
  const modes = [
    {
      body: copy.creationMode.collaborativeBody,
      icon: FilePenLine,
      id: 'collaborative',
      title: copy.creationMode.collaborativeTitle,
    },
    {
      body: copy.creationMode.autoBody,
      icon: Bot,
      id: 'auto',
      title: copy.creationMode.autoTitle,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4" onMouseDown={onCancel}>
      <div
        className="relative w-full max-w-[660px] rounded-xl bg-white p-8 shadow-[0_18px_48px_rgba(15,23,42,0.18)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
          onClick={onCancel}
          aria-label={copy.creationMode.close}
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="text-2xl font-bold tracking-normal text-slate-900">{copy.creationMode.title}</h3>
        <p className="mt-3 text-base leading-6 text-slate-500">{copy.creationMode.body}</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {modes.map((mode) => {
            const Icon = mode.icon;

            return (
              <button
                key={mode.id}
                type="button"
                className="min-h-[168px] rounded-lg border border-slate-200 bg-white p-5 text-left transition hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-[0_10px_24px_rgba(54,94,255,0.08)] focus:outline-none focus:ring-2 focus:ring-blue-100"
                onClick={() => onSelect(mode.id)}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-4 block text-xl font-bold tracking-normal text-slate-900">{mode.title}</span>
                <span className="mt-3 block text-base leading-7 text-slate-500">{mode.body}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FilterToolbar({
  advancedFilters,
  audienceOptions,
  copy,
  draftAdvancedFilters,
  filterOpen,
  filterRef,
  hasActiveFilters,
  hasAdvancedFilters,
  onApplyAdvancedFilters,
  onClearAdvancedFilters,
  onClearAllFilters,
  onSearchChange,
  onStatusChange,
  onToggleAdvancedFilter,
  onUpdateDraftAdvancedFilter,
  searchPlaceholder,
  searchQuery,
  setFilterOpen,
  statusFilter,
  statusLabel,
  statusOptions,
  typeOptions,
  updatedByOptions,
}) {
  // 筛选工具栏同时服务文章列表和历史任务列表。
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative block w-full sm:w-[360px]">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          type="search"
          value={searchQuery}
        />
      </label>

      <div className="w-[180px]">
        <SelectControl
          label={statusLabel}
          onChange={onStatusChange}
          options={statusOptions}
          value={statusFilter}
        />
      </div>

      <div ref={filterRef} className="relative">
        <button
          type="button"
          className={`relative inline-flex h-11 w-11 items-center justify-center rounded-md border text-sm font-semibold transition ${
            hasAdvancedFilters || filterOpen
              ? 'border-blue-200 bg-blue-50 text-blue-600'
              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
          onClick={onToggleAdvancedFilter}
          aria-expanded={filterOpen}
          aria-label={copy.filters.advancedTitle}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {hasAdvancedFilters ? (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600" />
          ) : null}
        </button>

        {filterOpen ? (
          <form
            className="absolute right-0 top-[calc(100%+8px)] z-40 w-[calc(100vw-64px)] rounded-lg border border-slate-200 bg-white p-4 shadow-menu sm:w-[520px]"
            onSubmit={(event) => {
              event.preventDefault();
              onApplyAdvancedFilters();
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-800">{copy.filters.advancedTitle}</h4>
              <button
                type="button"
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                onClick={() => setFilterOpen(false)}
                aria-label={copy.filters.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-500">
                  {copy.filters.audienceLabel}
                </span>
                <SelectControl
                  label={copy.filters.audienceLabel}
                  onChange={(value) => onUpdateDraftAdvancedFilter('audiencePersonaId', value)}
                  options={audienceOptions}
                  value={draftAdvancedFilters.audiencePersonaId}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-500">
                  {copy.filters.typeLabel}
                </span>
                <SelectControl
                  label={copy.filters.typeLabel}
                  onChange={(value) => onUpdateDraftAdvancedFilter('articleType', value)}
                  options={typeOptions}
                  value={draftAdvancedFilters.articleType}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-500">
                  {copy.filters.updatedFrom}
                </span>
                <input
                  className="h-11 w-full rounded-md border border-slate-200 px-3 text-base text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  onChange={(event) => onUpdateDraftAdvancedFilter('updatedFrom', event.target.value)}
                  type="date"
                  value={draftAdvancedFilters.updatedFrom}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-500">
                  {copy.filters.updatedTo}
                </span>
                <input
                  className="h-11 w-full rounded-md border border-slate-200 px-3 text-base text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  onChange={(event) => onUpdateDraftAdvancedFilter('updatedTo', event.target.value)}
                  type="date"
                  value={draftAdvancedFilters.updatedTo}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-500">
                  {copy.filters.updatedByLabel}
                </span>
                <SelectControl
                  label={copy.filters.updatedByLabel}
                  onChange={(value) => onUpdateDraftAdvancedFilter('updatedBy', value)}
                  options={updatedByOptions}
                  value={draftAdvancedFilters.updatedBy}
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <Button variant="neutral" onClick={onClearAdvancedFilters}>
                {copy.filters.clearAdvanced}
              </Button>
              <Button type="submit">
                {copy.filters.apply}
              </Button>
            </div>
          </form>
        ) : null}
      </div>

      {hasActiveFilters ? (
        <Button variant="neutral" onClick={onClearAllFilters}>
          {copy.filters.clearAll}
        </Button>
      ) : null}
    </div>
  );
}

function ArticleCard({
  article,
  copy,
  highlighted = false,
  onDelete,
  onDuplicate,
  onOpenEditor,
  onPublishSettings,
  setCardRef,
}) {
  return (
    <div ref={setCardRef} data-blog-article-id={article.id}>
      <ListCard
        className={
          highlighted
            ? '!border-blue-500 !bg-blue-50 shadow-[0_18px_34px_rgba(54,94,255,0.14)] ring-2 ring-blue-100'
            : ''
        }
        title={article.title}
        titleAriaLabel={article.title}
        onTitleClick={() => onOpenEditor(article)}
        statusTag={<StatusBadge copy={copy} status={article.status} />}
        metaItems={[
          {
            icon: CalendarClock,
            key: 'updatedAt',
            label: copy.fields.updatedAt,
            value: article.updatedAt,
          },
          {
            icon: UserRound,
            key: 'updatedBy',
            label: copy.fields.updatedBy,
            value: article.updatedBy,
          },
        ]}
        actions={[
          {
            icon: Trash2,
            key: 'delete',
            label: copy.delete,
            onClick: () => onDelete(article),
            tone: 'danger',
          },
          {
            icon: Copy,
            key: 'duplicate',
            label: copy.duplicate,
            onClick: () => onDuplicate(article),
          },
          {
            icon: Settings2,
            key: 'publishSettings',
            label: copy.publishSettings,
            onClick: () => onPublishSettings(article),
          },
        ]}
      />
    </div>
  );
}

function getTaskMeta(task, copy) {
  // 任务摘要根据状态展示完成信息、停止原因、错误节点或当前进度。
  const status = getTaskGenerationStatus(task);
  const date = getTaskUpdatedAt(task);

  if (status === 'success') {
    return `${copy.taskList.completedAt}: ${date}    ${copy.taskList.outputs}: ${copy.taskList.outputNames}`;
  }

  if (status === 'stopped') {
    return `${copy.taskList.stoppedAt}: ${date}    ${copy.taskList.stoppedBody}`;
  }

  if (status === 'failed') {
    return `${copy.taskList.failedNode}: ${getTaskStageLabel(task, copy)}    ${copy.taskList.error}: ${
      task.errorMessage || copy.taskList.unknownError
    }`;
  }

  return `${copy.taskList.progress}: ${getTaskProgress(task)}%    ${getTaskStageLabel(task, copy)}`;
}

function TaskCard({
  copy,
  highlighted = false,
  onDelete,
  onOpenProcess,
  onRecreate,
  onSaveAndEdit,
  onStop,
  onViewArticle,
  setCardRef,
  task,
}) {
  // 历史任务的操作按钮由任务状态和是否已保存为文章共同决定。
  const status = getTaskGenerationStatus(task);
  const savedArticleId = getTaskSavedArticleId(task);

  return (
    <div ref={setCardRef} data-blog-article-task-id={task.id}>
      <ListCard
        className={
          highlighted
            ? '!border-blue-500 !bg-blue-50 shadow-[0_18px_34px_rgba(54,94,255,0.14)] ring-2 ring-blue-100'
            : ''
        }
        title={getTaskTitle(task)}
        titleAriaLabel={getTaskTitle(task)}
        onTitleClick={() => onOpenProcess?.(task)}
        statusTag={<GenerationStatusBadge copy={copy} status={status} />}
        actions={[
          {
            hidden: status === 'generating',
            icon: Trash2,
            key: 'delete',
            label: copy.delete,
            onClick: () => onDelete(task),
            tone: 'danger',
          },
          {
            hidden: status !== 'generating',
            icon: CircleStop,
            key: 'stop',
            label: copy.taskList.actions.stop,
            onClick: () => onStop(task),
          },
          {
            hidden: status !== 'success' || Boolean(savedArticleId),
            icon: Save,
            key: 'saveAndEdit',
            label: copy.taskList.actions.saveAndEdit,
            onClick: () => onSaveAndEdit(task),
          },
          {
            hidden: status !== 'success' || !savedArticleId,
            icon: FileSearch,
            key: 'viewArticle',
            label: copy.taskList.actions.viewArticle,
            onClick: () => onViewArticle(task),
          },
          {
            hidden: status !== 'stopped' && status !== 'failed',
            icon: RefreshCw,
            key: 'recreate',
            label: copy.taskList.actions.recreate,
            onClick: () => onRecreate(task),
          },
          {
            icon: History,
            key: 'viewProcess',
            label: copy.taskList.actions.viewProcess,
            onClick: () => onOpenProcess?.(task),
          },
        ]}
      >
        <p className="text-base font-medium text-slate-500">{getTaskMeta(task, copy)}</p>
      </ListCard>
    </div>
  );
}

function EmptyState({ body, title }) {
  return (
    <div className="grid h-full min-h-[420px] place-items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
      <div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <FileText className="h-5 w-5" />
        </span>
        <h3 className="mt-5 text-xl font-bold text-slate-800">{title}</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{body}</p>
      </div>
    </div>
  );
}

export default function BlogArticlePage({
  creationNotice,
  onCreationNoticeConsumed,
  onOpenAiCreation,
  onOpenAiTask,
  onRecreateAiTask,
  onOpenEditor,
  project,
  t,
}) {
  // 页面同时管理正式文章列表和 AI 历史任务列表。
  const copy = t.blogArticle;
  const [activeTab, setActiveTab] = useState('articles');
  const [articles, setArticles] = useState(() => getBlogArticleDrafts(project));
  const [tasks, setTasks] = useState(() => getAiCreationTasks(project.id));
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [articleStatusFilter, setArticleStatusFilter] = useState('all');
  const [articleAdvancedFilters, setArticleAdvancedFilters] = useState(emptyAdvancedFilters);
  const [draftArticleAdvancedFilters, setDraftArticleAdvancedFilters] = useState(emptyAdvancedFilters);
  const [articleFilterOpen, setArticleFilterOpen] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [taskAdvancedFilters, setTaskAdvancedFilters] = useState(emptyAdvancedFilters);
  const [draftTaskAdvancedFilters, setDraftTaskAdvancedFilters] = useState(emptyAdvancedFilters);
  const [taskFilterOpen, setTaskFilterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [taskDeleteTarget, setTaskDeleteTarget] = useState(null);
  const [creationModeOpen, setCreationModeOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [articleFocus, setArticleFocus] = useState({ id: '', token: 0 });
  const [taskFocus, setTaskFocus] = useState({ id: '', token: 0 });
  const articleFilterRef = useRef(null);
  const taskFilterRef = useRef(null);
  const articleCardRefs = useRef(new Map());
  const taskCardRefs = useRef(new Map());

  useEffect(() => {
    // 切换项目时重新读取文章和任务，并清空所有筛选与弹窗。
    setActiveTab('articles');
    setArticles(getBlogArticleDrafts(project));
    setTasks(getAiCreationTasks(project.id));
    setArticleSearchQuery('');
    setArticleStatusFilter('all');
    setArticleAdvancedFilters(emptyAdvancedFilters);
    setDraftArticleAdvancedFilters(emptyAdvancedFilters);
    setArticleFilterOpen(false);
    setTaskSearchQuery('');
    setTaskStatusFilter('all');
    setTaskAdvancedFilters(emptyAdvancedFilters);
    setDraftTaskAdvancedFilters(emptyAdvancedFilters);
    setTaskFilterOpen(false);
    setDeleteTarget(null);
    setTaskDeleteTarget(null);
    setCreationModeOpen(false);
    setArticleFocus({ id: '', token: 0 });
    setTaskFocus({ id: '', token: 0 });
    articleCardRefs.current.clear();
    taskCardRefs.current.clear();
  }, [project]);

  useEffect(() => {
    // AI 创作页返回的通知会触发列表刷新并展示 toast。
    if (!creationNotice) {
      return;
    }

    setArticles(getBlogArticleDrafts(project));
    setTasks(getAiCreationTasks(project.id));
    setToast({
      id: creationNotice.id,
      message: creationNotice.message,
      type: creationNotice.type ?? 'success',
    });
    if (creationNotice.targetTab === 'tasks' && creationNotice.taskId) {
      setActiveTab('tasks');
      setTaskSearchQuery('');
      setTaskStatusFilter('all');
      setTaskAdvancedFilters({ ...emptyAdvancedFilters });
      setDraftTaskAdvancedFilters({ ...emptyAdvancedFilters });
      setArticleFilterOpen(false);
      setTaskFilterOpen(false);
      setTaskFocus({ id: creationNotice.taskId, token: creationNotice.id });
    }
    onCreationNoticeConsumed?.(creationNotice.id);
  }, [creationNotice, onCreationNoticeConsumed, project]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    // 两个高级筛选弹层共用外部点击关闭逻辑。
    function handleClickOutside(event) {
      if (articleFilterOpen && articleFilterRef.current && !articleFilterRef.current.contains(event.target)) {
        setArticleFilterOpen(false);
      }

      if (taskFilterOpen && taskFilterRef.current && !taskFilterRef.current.contains(event.target)) {
        setTaskFilterOpen(false);
      }
    }

    if (articleFilterOpen || taskFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [articleFilterOpen, taskFilterOpen]);

  const articleAudienceOptions = useMemo(() => {
    // 文章受众筛选合并项目默认画像和文章中已有画像。
    const personas = project?.demoProject?.audiencePersonas ?? [];
    const seen = new Set();
    const options = [{ value: 'all', label: copy.filters.allAudiences }];

    personas.forEach((persona) => {
      if (!seen.has(persona.id)) {
        seen.add(persona.id);
        options.push({ value: persona.id, label: persona.title });
      }
    });

    articles.forEach((article) => {
      if (article.targetAudiencePersonaId && !seen.has(article.targetAudiencePersonaId)) {
        seen.add(article.targetAudiencePersonaId);
        options.push({
          value: article.targetAudiencePersonaId,
          label: article.targetAudienceName || article.targetAudiencePersonaId,
        });
      }
    });

    return options;
  }, [articles, copy.filters.allAudiences, project]);

  const taskAudienceOptions = useMemo(() => {
    // 任务受众筛选合并项目默认画像和历史任务中的画像。
    const personas = project?.demoProject?.audiencePersonas ?? [];
    const seen = new Set();
    const options = [{ value: 'all', label: copy.filters.allAudiences }];

    personas.forEach((persona) => {
      if (!seen.has(persona.id)) {
        seen.add(persona.id);
        options.push({ value: persona.id, label: persona.title });
      }
    });

    tasks.forEach((task) => {
      const audienceId = getTaskAudienceId(task);
      if (audienceId && !seen.has(audienceId)) {
        seen.add(audienceId);
        options.push({ value: audienceId, label: getTaskAudienceName(task) || audienceId });
      }
    });

    return options;
  }, [copy.filters.allAudiences, project, tasks]);

  const articleUpdatedByOptions = useMemo(() => {
    const users = Array.from(new Set(articles.map((article) => article.updatedBy).filter(Boolean)));
    return [
      { value: 'all', label: copy.filters.allUpdatedBy },
      ...users.map((user) => ({ value: user, label: user })),
    ];
  }, [articles, copy.filters.allUpdatedBy]);

  const taskUpdatedByOptions = useMemo(() => {
    const users = Array.from(new Set(tasks.map(getTaskUpdatedBy).filter(Boolean)));
    return [
      { value: 'all', label: copy.filters.allUpdatedBy },
      ...users.map((user) => ({ value: user, label: user })),
    ];
  }, [copy.filters.allUpdatedBy, tasks]);

  const articleStatusOptionsForSelect = [
    { value: 'all', label: copy.filters.allStatuses },
    ...articleStatusOptions.map((status) => ({ value: status, label: copy.status[status] })),
  ];
  const taskStatusOptionsForSelect = [
    { value: 'all', label: copy.taskList.filters.allStatuses },
    ...taskStatusValues.map((status) => ({ value: status, label: copy.taskList.status[status] })),
  ];
  const articleTypeOptionsForSelect = [
    { value: 'all', label: copy.filters.allTypes },
    ...articleTypeOptions.map((type) => ({ value: type, label: type })),
  ];
  const taskTypeOptionsForSelect = useMemo(() => {
    const types = [...articleTypeOptions];
    tasks.forEach((task) => {
      const type = getTaskArticleType(task);
      if (type && !types.includes(type)) {
        types.push(type);
      }
    });

    return [
      { value: 'all', label: copy.filters.allTypes },
      ...types.map((type) => ({ value: type, label: type })),
    ];
  }, [copy.filters.allTypes, tasks]);

  const hasArticleAdvancedFilters = hasAdvancedFilterValue(articleAdvancedFilters);
  const hasTaskAdvancedFilters = hasAdvancedFilterValue(taskAdvancedFilters);
  const hasArticleActiveFilters =
    Boolean(articleSearchQuery.trim()) || articleStatusFilter !== 'all' || hasArticleAdvancedFilters;
  const hasTaskActiveFilters =
    Boolean(taskSearchQuery.trim()) || taskStatusFilter !== 'all' || hasTaskAdvancedFilters;

  const filteredArticles = useMemo(() => {
    // 文章列表同时应用关键词、状态和高级筛选。
    const query = articleSearchQuery.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesQuery = !query || getArticleSearchText(article).includes(query);
      const matchesStatus = articleStatusFilter === 'all' || article.status === articleStatusFilter;
      const matchesAudience =
        articleAdvancedFilters.audiencePersonaId === 'all' ||
        article.targetAudiencePersonaId === articleAdvancedFilters.audiencePersonaId;
      const matchesType =
        articleAdvancedFilters.articleType === 'all' || article.articleType === articleAdvancedFilters.articleType;
      const matchesUpdatedBy =
        articleAdvancedFilters.updatedBy === 'all' || article.updatedBy === articleAdvancedFilters.updatedBy;
      const matchesUpdatedFrom =
        !articleAdvancedFilters.updatedFrom || article.updatedAt >= articleAdvancedFilters.updatedFrom;
      const matchesUpdatedTo =
        !articleAdvancedFilters.updatedTo || article.updatedAt <= articleAdvancedFilters.updatedTo;

      return (
        matchesQuery &&
        matchesStatus &&
        matchesAudience &&
        matchesType &&
        matchesUpdatedBy &&
        matchesUpdatedFrom &&
        matchesUpdatedTo
      );
    });
  }, [articleAdvancedFilters, articleSearchQuery, articleStatusFilter, articles]);

  const filteredTasks = useMemo(() => {
    // 历史任务同时应用关键词、任务状态和高级筛选。
    const query = taskSearchQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      const taskDate = getTaskUpdatedAt(task);
      const matchesQuery = !query || getTaskSearchText(task).includes(query);
      const matchesStatus = taskStatusFilter === 'all' || getTaskGenerationStatus(task) === taskStatusFilter;
      const matchesAudience =
        taskAdvancedFilters.audiencePersonaId === 'all' || getTaskAudienceId(task) === taskAdvancedFilters.audiencePersonaId;
      const matchesType =
        taskAdvancedFilters.articleType === 'all' || getTaskArticleType(task) === taskAdvancedFilters.articleType;
      const matchesUpdatedBy =
        taskAdvancedFilters.updatedBy === 'all' || getTaskUpdatedBy(task) === taskAdvancedFilters.updatedBy;
      const matchesUpdatedFrom = !taskAdvancedFilters.updatedFrom || taskDate >= taskAdvancedFilters.updatedFrom;
      const matchesUpdatedTo = !taskAdvancedFilters.updatedTo || taskDate <= taskAdvancedFilters.updatedTo;

      return (
        matchesQuery &&
        matchesStatus &&
        matchesAudience &&
        matchesType &&
        matchesUpdatedBy &&
        matchesUpdatedFrom &&
        matchesUpdatedTo
      );
    });
  }, [taskAdvancedFilters, taskSearchQuery, taskStatusFilter, tasks]);

  useEffect(() => {
    // 从任务跳转到已保存文章时，滚动并短暂高亮目标卡片。
    if (!articleFocus.id || activeTab !== 'articles') {
      return undefined;
    }

    const target = articleCardRefs.current.get(articleFocus.id);
    if (!target) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    const timer = window.setTimeout(() => {
      setArticleFocus((current) => (current.token === articleFocus.token ? { id: '', token: current.token } : current));
    }, 2600);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [activeTab, articleFocus, filteredArticles]);

  useEffect(() => {
    // 自动完成返回任务列表时，滚动并短暂高亮被转换的任务卡片。
    if (!taskFocus.id || activeTab !== 'tasks') {
      return undefined;
    }

    const target = taskCardRefs.current.get(taskFocus.id);
    if (!target) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    const timer = window.setTimeout(() => {
      setTaskFocus((current) => (current.token === taskFocus.token ? { id: '', token: current.token } : current));
    }, 2600);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [activeTab, filteredTasks, taskFocus]);

  function persist(nextArticles, message, type = 'success') {
    // 文章增删复制都通过 persist 写入当前项目缓存。
    const saved = saveBlogArticleDrafts(project.id, nextArticles);
    setArticles(saved);

    if (message) {
      setToast({ id: Date.now(), message, type });
    }

    return saved;
  }

  function refreshTasks(message, type = 'success') {
    // 任务状态变化后重新读取缓存，避免列表展示旧状态。
    setTasks(getAiCreationTasks(project.id));

    if (message) {
      setToast({ id: Date.now(), message, type });
    }
  }

  function createBlankArticle() {
    const article = createBlankBlogArticle(copy.untitledTitle);
    persist([article, ...articles]);
    onOpenEditor(article);
  }

  function duplicateArticle(article) {
    const duplicatedArticle = {
      ...article,
      id: createBlogArticleId(),
      title: `${article.title} ${copy.copySuffix}`,
      status: 'draft',
      updatedAt: getTodayString(),
      updatedBy: 'Angel',
    };

    persist([duplicatedArticle, ...articles], copy.toast.duplicated);
    onOpenEditor(duplicatedArticle);
  }

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    persist(
      articles.filter((article) => article.id !== deleteTarget.id),
      copy.toast.deleted,
    );
    setDeleteTarget(null);
  }

  function confirmDeleteTask() {
    if (!taskDeleteTarget) {
      return;
    }

    deleteAiCreationTask(project.id, taskDeleteTarget.id);
    refreshTasks(copy.taskList.toast.deleted);
    setTaskDeleteTarget(null);
  }

  function updateDraftArticleAdvancedFilter(field, value) {
    setDraftArticleAdvancedFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateDraftTaskAdvancedFilter(field, value) {
    setDraftTaskAdvancedFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function applyArticleAdvancedFilters() {
    setArticleAdvancedFilters(draftArticleAdvancedFilters);
    setArticleFilterOpen(false);
  }

  function applyTaskAdvancedFilters() {
    setTaskAdvancedFilters(draftTaskAdvancedFilters);
    setTaskFilterOpen(false);
  }

  function clearArticleAdvancedFilters() {
    setArticleAdvancedFilters(emptyAdvancedFilters);
    setDraftArticleAdvancedFilters(emptyAdvancedFilters);
    setArticleFilterOpen(false);
  }

  function clearTaskAdvancedFilters() {
    setTaskAdvancedFilters(emptyAdvancedFilters);
    setDraftTaskAdvancedFilters(emptyAdvancedFilters);
    setTaskFilterOpen(false);
  }

  function clearAllArticleFilters() {
    setArticleSearchQuery('');
    setArticleStatusFilter('all');
    clearArticleAdvancedFilters();
  }

  function clearAllTaskFilters() {
    setTaskSearchQuery('');
    setTaskStatusFilter('all');
    clearTaskAdvancedFilters();
  }

  function openAiCreation() {
    setCreationModeOpen(true);
  }

  function selectCreationMode(mode) {
    setCreationModeOpen(false);
    onOpenAiCreation?.(mode);
  }

  function openPublishSettings() {
    setToast({ id: Date.now(), message: copy.toast.publishSettingsComingSoon, type: 'info' });
  }

  function stopTask(task) {
    // 停止任务按当前流程阶段写入 stopped stage，并保留阶段 payload。
    const flowStage = getTaskFlowStage(task);
    const nextStage = flowStage === 'auto' ? 'auto-stopped' : `${flowStage}-stopped`;
    const payloadStage = flowStage === 'auto' ? 'content' : flowStage;

    updateAiCreationTask(project.id, task.id, {
      stage: nextStage,
      [payloadStage]: {
        ...(task[payloadStage] ?? {}),
        isStopped: true,
        updatedAt: getTodayString(),
      },
    });
    refreshTasks(copy.taskList.toast.stopped, 'warning');
  }

  function recreateTask(task) {
    onRecreateAiTask?.(task);
  }

  function saveTaskAndEdit(task) {
    // 任务保存为文章后进入编辑器，历史任务会记录已保存文章 ID。
    const { article: nextArticle } = saveAiTaskAsBlogArticle(project, task);

    setArticles(getBlogArticleDrafts(project));
    setToast({ id: Date.now(), message: copy.taskList.toast.saved, type: 'success' });
    setTasks(getAiCreationTasks(project.id));
    onOpenEditor(nextArticle);
  }

  function viewSavedArticle(task) {
    // 查看已保存文章会切回文章列表，清空筛选后定位目标文章。
    const savedArticleId = getTaskSavedArticleId(task);
    if (!savedArticleId) {
      return;
    }

    const nextArticles = getBlogArticleDrafts(project);
    const nextTasks = getAiCreationTasks(project.id);
    const targetArticle = nextArticles.find((article) => article.id === savedArticleId);

    setArticles(nextArticles);
    setTasks(nextTasks);

    if (!targetArticle) {
      setToast({ id: Date.now(), message: copy.taskList.toast.articleMissing, type: 'warning' });
      return;
    }

    setActiveTab('articles');
    setArticleSearchQuery('');
    setArticleStatusFilter('all');
    setArticleAdvancedFilters({ ...emptyAdvancedFilters });
    setDraftArticleAdvancedFilters({ ...emptyAdvancedFilters });
    setArticleFilterOpen(false);
    setTaskFilterOpen(false);
    setArticleFocus({ id: savedArticleId, token: Date.now() });
  }

  function switchTab(tab) {
    // 切换标签页时重新读取对应缓存，保证页面展示最新数据。
    if (tab === 'articles') {
      setArticles(getBlogArticleDrafts(project));
    }

    if (tab === 'tasks') {
      setTasks(getAiCreationTasks(project.id));
    }

    setActiveTab(tab);
    setArticleFilterOpen(false);
    setTaskFilterOpen(false);
  }

  // 当前标签页决定筛选工具栏绑定文章状态还是任务状态。
  const activeFilterToolbar =
    activeTab === 'articles' ? (
      <FilterToolbar
        advancedFilters={articleAdvancedFilters}
        audienceOptions={articleAudienceOptions}
        copy={copy}
        draftAdvancedFilters={draftArticleAdvancedFilters}
        filterOpen={articleFilterOpen}
        filterRef={articleFilterRef}
        hasActiveFilters={hasArticleActiveFilters}
        hasAdvancedFilters={hasArticleAdvancedFilters}
        onApplyAdvancedFilters={applyArticleAdvancedFilters}
        onClearAdvancedFilters={clearArticleAdvancedFilters}
        onClearAllFilters={clearAllArticleFilters}
        onSearchChange={setArticleSearchQuery}
        onStatusChange={setArticleStatusFilter}
        onToggleAdvancedFilter={() => {
          setDraftArticleAdvancedFilters(articleAdvancedFilters);
          setArticleFilterOpen((current) => !current);
        }}
        onUpdateDraftAdvancedFilter={updateDraftArticleAdvancedFilter}
        searchPlaceholder={copy.filters.searchPlaceholder}
        searchQuery={articleSearchQuery}
        setFilterOpen={setArticleFilterOpen}
        statusFilter={articleStatusFilter}
        statusLabel={copy.filters.statusLabel}
        statusOptions={articleStatusOptionsForSelect}
        typeOptions={articleTypeOptionsForSelect}
        updatedByOptions={articleUpdatedByOptions}
      />
    ) : (
      <FilterToolbar
        advancedFilters={taskAdvancedFilters}
        audienceOptions={taskAudienceOptions}
        copy={copy}
        draftAdvancedFilters={draftTaskAdvancedFilters}
        filterOpen={taskFilterOpen}
        filterRef={taskFilterRef}
        hasActiveFilters={hasTaskActiveFilters}
        hasAdvancedFilters={hasTaskAdvancedFilters}
        onApplyAdvancedFilters={applyTaskAdvancedFilters}
        onClearAdvancedFilters={clearTaskAdvancedFilters}
        onClearAllFilters={clearAllTaskFilters}
        onSearchChange={setTaskSearchQuery}
        onStatusChange={setTaskStatusFilter}
        onToggleAdvancedFilter={() => {
          setDraftTaskAdvancedFilters(taskAdvancedFilters);
          setTaskFilterOpen((current) => !current);
        }}
        onUpdateDraftAdvancedFilter={updateDraftTaskAdvancedFilter}
        searchPlaceholder={copy.filters.searchPlaceholder}
        searchQuery={taskSearchQuery}
        setFilterOpen={setTaskFilterOpen}
        statusFilter={taskStatusFilter}
        statusLabel={copy.taskList.filters.statusLabel}
        statusOptions={taskStatusOptionsForSelect}
        typeOptions={taskTypeOptionsForSelect}
        updatedByOptions={taskUpdatedByOptions}
      />
    );

  return (
    <div className="mx-auto max-w-[1600px]">
      {toast ? <Toast key={toast.id} message={toast.message} testId="blog-article-toast" type={toast.type} /> : null}

      {deleteTarget ? (
        <ConfirmDialog
          cancelLabel={copy.cancel}
          confirmLabel={copy.confirmDelete}
          danger
          message={copy.deleteBody(deleteTarget.title)}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title={copy.deleteTitle}
        />
      ) : null}

      {taskDeleteTarget ? (
        <ConfirmDialog
          cancelLabel={copy.cancel}
          confirmLabel={copy.confirmDelete}
          danger
          message={copy.taskList.deleteBody(getTaskTitle(taskDeleteTarget))}
          onCancel={() => setTaskDeleteTarget(null)}
          onConfirm={confirmDeleteTask}
          title={copy.taskList.deleteTitle}
        />
      ) : null}

      {creationModeOpen ? (
        <CreationModeDialog
          copy={copy}
          onCancel={() => setCreationModeOpen(false)}
          onSelect={selectCreationMode}
        />
      ) : null}

      <div className={adaptivePageLayout.pageStack}>
        <PageHeader
          actions={
            <>
              <Button icon={FilePlus2} variant="neutral" onClick={createBlankArticle}>
                {copy.createBlank}
              </Button>
              <Button icon={FilePenLine} onClick={openAiCreation}>
                {copy.aiCreate}
              </Button>
            </>
          }
          description={copy.description}
          title={copy.title}
        />

        <div className={adaptivePageLayout.workArea}>
          <section className={`${adaptivePageLayout.scrollPanel} p-7`}>
            <div className="mb-5 flex flex-none flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { id: 'articles', label: copy.listTitle },
                  { id: 'tasks', label: copy.taskList.title },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`rounded-lg px-4 py-2 text-xl font-bold transition ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-slate-800'
                        : 'text-slate-800 hover:bg-slate-50 hover:text-blue-600'
                    }`}
                    onClick={() => switchTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeFilterToolbar}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {activeTab === 'articles' ? (
                filteredArticles.length ? (
                  <div className="space-y-4">
                    {filteredArticles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        copy={copy}
                        highlighted={articleFocus.id === article.id}
                        onDelete={setDeleteTarget}
                        onDuplicate={duplicateArticle}
                        onOpenEditor={onOpenEditor}
                        onPublishSettings={openPublishSettings}
                        setCardRef={(node) => {
                          if (node) {
                            articleCardRefs.current.set(article.id, node);
                          } else {
                            articleCardRefs.current.delete(article.id);
                          }
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title={articles.length ? copy.empty.filteredTitle : copy.empty.title}
                    body={articles.length ? copy.empty.filteredBody : copy.empty.body}
                  />
                )
              ) : filteredTasks.length ? (
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      copy={copy}
                      highlighted={taskFocus.id === task.id}
                      onDelete={setTaskDeleteTarget}
                      onOpenProcess={onOpenAiTask}
                      onRecreate={recreateTask}
                      onSaveAndEdit={saveTaskAndEdit}
                      onStop={stopTask}
                      onViewArticle={viewSavedArticle}
                      setCardRef={(node) => {
                        if (node) {
                          taskCardRefs.current.set(task.id, node);
                        } else {
                          taskCardRefs.current.delete(task.id);
                        }
                      }}
                      task={task}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={tasks.length ? copy.taskList.empty.filteredTitle : copy.taskList.empty.title}
                  body={tasks.length ? copy.taskList.empty.filteredBody : copy.taskList.empty.body}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
