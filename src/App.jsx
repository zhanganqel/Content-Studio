import { useCallback, useEffect, useMemo, useState } from 'react';
import AppShell from './components/AppShell.jsx';
import BlogArticleAiAutoCreationPage from './components/blog-article/BlogArticleAiAutoCreationPage.jsx';
import BlogArticleAiCreateTaskPage from './components/blog-article/BlogArticleAiCreateTaskPage.jsx';
import BlogArticleAiContentPage from './components/blog-article/BlogArticleAiContentPage.jsx';
import BlogArticleAiOutlinePage from './components/blog-article/BlogArticleAiOutlinePage.jsx';
import BlogArticleAiPlanningPage from './components/blog-article/BlogArticleAiPlanningPage.jsx';
import BlogArticleEditor from './components/blog-article/BlogArticleEditor.jsx';
import CopilotWorkbenchPage from './components/copilot/CopilotWorkbenchPage.jsx';
import KnowledgeFilePreviewPage from './components/knowledge-assets/KnowledgeFilePreviewPage.jsx';
import KnowledgeSourcePreviewPage from './components/knowledge-assets/KnowledgeSourcePreviewPage.jsx';
import ConfirmDialog from './components/ui/ConfirmDialog.jsx';
import VideoGenerationPage from './components/video-ad/VideoGenerationPage.jsx';
import { navSections, projects, searchScopes, userMenuItems } from './data/navigation.js';
import { defaultLocale, messages } from './i18n/messages.js';
import {
  convertCollaborativeTaskToAuto,
  createContentDemoData,
  getAiCreationTasks,
} from './services/blogArticleAiStore.js';
import {
  getAiTaskArticleContext,
  migrateAiTaskArticleRuleStorage,
} from './services/blogArticleAiArticleStore.js';
import {
  collapsedSidebarWidth,
  expandedSidebarWidth,
  getSidebarCollapsedPreference,
  saveSidebarCollapsedPreference,
} from './services/sidebarPreferenceStore.js';

const localeStorageKey = 'content-studio-locale';
const aiPlanningSessionStorageKey = 'content-studio-active-ai-planning-session';

// 初始化界面语言，未知语言回退到默认语言包。
function getInitialLocale() {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  const storedLocale = window.localStorage.getItem(localeStorageKey);
  return messages[storedLocale] ? storedLocale : defaultLocale;
}

// 读取文章 AI 创作当前会话，用于刷新后恢复到对应阶段页面。
function readAiPlanningSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(aiPlanningSessionStorageKey);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch {
    return null;
  }
}

// 保存文章 AI 创作会话，记录当前项目、任务和阶段。
function writeAiPlanningSession(session) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(aiPlanningSessionStorageKey, JSON.stringify(session));
}

// 清除文章 AI 创作会话，避免关闭后再次进入旧阶段。
function clearAiPlanningSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(aiPlanningSessionStorageKey);
}

// 解析外部预览链接参数，支持资料来源和文件预览独立打开。
function readExternalView() {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  if (!view) return null;

  return {
    fileId: params.get('fileId') || '',
    knowledgeItemId: params.get('knowledgeItemId') || '',
    projectId: params.get('projectId') || '',
    sourceId: params.get('sourceId') || '',
    taskId: params.get('taskId') || '',
    view,
  };
}

// 外部预览优先使用 URL 中的项目，否则进入默认项目。
function getInitialProjectId(externalView) {
  if (externalView?.projectId && projects.some((project) => project.id === externalView.projectId)) {
    return externalView.projectId;
  }

  return projects[0].id;
}

// 自动创作任务使用自动流程，其余任务进入协作式创作流程。
function getTaskCreateMode(task) {
  const stage = task?.stage ?? '';
  return task?.mode === 'auto' || stage.startsWith('auto') ? 'auto' : 'collaborative';
}

// 未保存协同任务以 savedArticleId 判断，避免创建任务后误写入文章列表。
function isUnsavedCollaborativeTask(task) {
  return Boolean(task && getTaskCreateMode(task) === 'collaborative' && !task?.content?.savedArticleId);
}

export default function App() {
  // 顶层状态负责当前项目、导航、浮层页面和文章 AI 创作阶段分发。
  const [externalView] = useState(readExternalView);
  const [locale, setLocale] = useState(getInitialLocale);
  const [activeProjectId, setActiveProjectId] = useState(() => getInitialProjectId(externalView));
  const [expandedSections, setExpandedSections] = useState([]);
  const [activeItemId, setActiveItemId] = useState(() =>
    externalView?.view === 'knowledge-items' ? 'knowledge-items' : null,
  );
  const [searchScope, setSearchScope] = useState(searchScopes[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getSidebarCollapsedPreference);
  const [blogAiCreateOpen, setBlogAiCreateOpen] = useState(false);
  const [blogAiCreateMode, setBlogAiCreateMode] = useState('collaborative');
  const [blogAiRecreateContext, setBlogAiRecreateContext] = useState(null);
  const [blogAiAutoContext, setBlogAiAutoContext] = useState(null);
  const [blogAiPlanningContext, setBlogAiPlanningContext] = useState(null);
  const [blogAiOutlineContext, setBlogAiOutlineContext] = useState(null);
  const [blogAiContentContext, setBlogAiContentContext] = useState(null);
  const [blogArticleNotice, setBlogArticleNotice] = useState(null);
  const [blogAiExitPrompt, setBlogAiExitPrompt] = useState(null);
  const [blogEditorArticle, setBlogEditorArticle] = useState(null);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [videoGenerationOpen, setVideoGenerationOpen] = useState(false);
  const t = messages[locale] ?? messages[defaultLocale];

  useEffect(() => {
    window.localStorage.setItem(localeStorageKey, locale);
  }, [locale]);

  useEffect(() => {
    saveSidebarCollapsedPreference(sidebarCollapsed);
  }, [sidebarCollapsed]);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [activeProjectId],
  );
  const sidebarWidth = sidebarCollapsed ? collapsedSidebarWidth : expandedSidebarWidth;

  // 文章草稿规则迁移需要跟随当前项目执行，保证旧缓存可以被新页面读取。
  migrateAiTaskArticleRuleStorage(activeProject);

  useEffect(() => {
    if (externalView?.view) {
      return;
    }

    if (
      blogAiCreateOpen ||
      blogAiAutoContext ||
      blogAiPlanningContext ||
      blogAiOutlineContext ||
      blogAiContentContext ||
      blogEditorArticle
    ) {
      return;
    }

    // 刷新页面后根据缓存任务恢复到策划、大纲、正文或自动创作页面。
    const session = readAiPlanningSession();
    if (!session || session.projectId !== activeProject.id) {
      return;
    }

    const task = getAiCreationTasks(activeProject.id).find((item) => item.id === session.taskId);
    const article = task ? getAiTaskArticleContext(activeProject, task) : null;

    if (task && article) {
      if (session.view === 'auto') {
        setBlogAiAutoContext({ article, task });
        return;
      }

      const stage =
        session.stage ??
        (task.stage?.startsWith('content') ? 'content' : task.stage?.startsWith('outline') ? 'outline' : 'planning');
      if (stage === 'content') {
        setBlogAiContentContext({ article, task });
      } else if (stage === 'outline') {
        setBlogAiOutlineContext({ article, task });
      } else {
        setBlogAiPlanningContext({ article, task });
      }
      return;
    }

    clearAiPlanningSession();
  }, [
    activeProject,
    blogAiAutoContext,
    blogAiContentContext,
    blogAiCreateOpen,
    blogAiOutlineContext,
    blogAiPlanningContext,
    blogEditorArticle,
    externalView?.view,
  ]);

  const localizedNavSections = useMemo(
    () =>
      navSections.map((section) => ({
        ...section,
        title: t.navSections[section.id].title,
        description: t.navSections[section.id].description,
        items: section.items.map((item) => ({
          ...item,
          title: t.navItems[item.id],
        })),
      })),
    [t],
  );

  const localizedSearchScopes = useMemo(
    () => searchScopes.map((scope) => ({ id: scope, label: t.searchScopes[scope] })),
    [t],
  );

  const localizedUserMenuItems = useMemo(
    () => userMenuItems.map((item) => ({ id: item, label: t.userMenu[item] })),
    [t],
  );

  const activeItem = useMemo(() => {
    for (const section of localizedNavSections) {
      const item = section.items.find((child) => child.id === activeItemId);
      if (item) {
        return { ...item, sectionTitle: section.title };
      }
    }

    return null;
  }, [activeItemId, localizedNavSections]);

  function toggleSection(sectionId) {
    setExpandedSections((current) =>
      current.includes(sectionId)
        ? current.filter((id) => id !== sectionId)
        : [...current, sectionId],
    );
  }

  const clearBlogArticleNotice = useCallback((noticeId) => {
    setBlogArticleNotice((current) => (current?.id === noticeId ? null : current));
  }, []);

  const openVideoGeneration = useCallback(() => {
    setActiveItemId('video-ad');
    setVideoGenerationOpen(true);
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((collapsed) => !collapsed);
  }, []);

  const openCopilot = useCallback(() => {
    setCopilotOpen(true);
  }, []);

  const openBlogAiCreate = useCallback((mode = 'collaborative') => {
    // 新建任务会重置其他文章创作阶段，避免多个阶段页面同时持有上下文。
    setActiveItemId('blog-article');
    setBlogAiExitPrompt(null);
    setBlogAiCreateMode(mode);
    setBlogAiRecreateContext(null);
    setBlogAiCreateOpen(true);
    setBlogAiAutoContext(null);
    setBlogAiPlanningContext(null);
    setBlogAiOutlineContext(null);
    setBlogAiContentContext(null);
  }, []);

  const openBlogAiRecreateTask = useCallback(
    (task) => {
      if (!task) return;

      // 重新创作使用最新任务快照，避免从列表传入的旧对象覆盖缓存中的更新。
      const latestTask = getAiCreationTasks(activeProject.id).find((item) => item.id === task.id) ?? task;
      const mode = getTaskCreateMode(latestTask);

      setActiveItemId('blog-article');
      setBlogAiExitPrompt(null);
      setBlogAiCreateMode(mode);
      setBlogAiRecreateContext({
        mode,
        model: latestTask.model,
        searchAnalyses: latestTask.searchAnalyses ?? [],
        sourceTaskId: latestTask.id,
        taskInput: latestTask.taskInput ?? {},
      });
      setBlogAiCreateOpen(true);
      setBlogAiAutoContext(null);
      setBlogAiPlanningContext(null);
      setBlogAiOutlineContext(null);
      setBlogAiContentContext(null);
      clearAiPlanningSession();
    },
    [activeProject.id],
  );

  const openBlogAiTask = useCallback(
    (task) => {
      if (!task) return;

      // 打开历史任务时重新取最新任务，保证阶段、产物和文章上下文一致。
      const latestTask = getAiCreationTasks(activeProject.id).find((item) => item.id === task.id) ?? task;
      const article = getAiTaskArticleContext(activeProject, latestTask);

      if (!article) {
        return;
      }

      const stage = latestTask.stage?.startsWith('content')
        ? 'content'
        : latestTask.stage?.startsWith('outline')
          ? 'outline'
          : 'planning';

      setActiveItemId('blog-article');
      setBlogAiExitPrompt(null);
      setBlogAiCreateOpen(false);
      setBlogAiAutoContext({ article, task: latestTask });
      setBlogAiPlanningContext(null);
      setBlogAiOutlineContext(null);
      setBlogAiContentContext(null);
      writeAiPlanningSession({
        articleId: article.id,
        projectId: activeProject.id,
        stage,
        taskId: latestTask.id,
        view: 'auto',
      });
    },
    [activeProject],
  );

  function exitArticleCreationFlow() {
    // 退出流程只回到博客文章页，不删除任务，也不创建文章。
    setActiveItemId('blog-article');
    clearAiPlanningSession();
    setBlogAiCreateOpen(false);
    setBlogAiAutoContext(null);
    setBlogAiPlanningContext(null);
    setBlogAiOutlineContext(null);
    setBlogAiContentContext(null);
    setBlogAiRecreateContext(null);
  }

  function getLatestAiTask(task) {
    return getAiCreationTasks(activeProject.id).find((item) => item.id === task?.id) ?? task;
  }

  function requestCollaborativeExitPrompt({ article, task }) {
    const latestTask = getLatestAiTask(task);

    if (!isUnsavedCollaborativeTask(latestTask)) {
      return false;
    }

    setBlogAiExitPrompt({
      article,
      id: Date.now(),
      task: latestTask,
    });
    return true;
  }

  function handleAutoFinishCollaborativeTask() {
    const prompt = blogAiExitPrompt;
    if (!prompt?.task) return;

    const latestTask = getLatestAiTask(prompt.task);
    const nextTask = convertCollaborativeTaskToAuto(activeProject.id, latestTask.id) ?? {
      ...latestTask,
      errorMessage: '',
      mode: 'auto',
      stage: 'auto-generating',
    };
    setBlogAiExitPrompt(null);
    setBlogArticleNotice({
      id: Date.now(),
      message: t.blogArticle.aiCreation.toast.convertedToAuto,
      targetTab: 'tasks',
      taskId: nextTask.id,
      type: 'success',
    });
    exitArticleCreationFlow();
  }

  function renderCollaborativeExitPromptDialog() {
    return blogAiExitPrompt ? (
      <ConfirmDialog
        key={blogAiExitPrompt.id}
        actions={[
          {
            key: 'auto-finish',
            label: t.blogArticle.aiCreation.actions.autoFinish,
            onClick: handleAutoFinishCollaborativeTask,
            variant: 'neutral',
          },
          {
            key: 'exit',
            label: t.blogArticle.aiCreation.actions.exit,
            onClick: () => {
              setBlogAiExitPrompt(null);
              exitArticleCreationFlow();
            },
            variant: 'danger',
          },
          {
            key: 'continue',
            label: t.blogArticle.aiCreation.actions.continueTask,
            onClick: () => setBlogAiExitPrompt(null),
            variant: 'primary',
          },
        ]}
        message={t.blogArticle.aiCreation.toast.unsavedExitPrompt}
        onCancel={() => setBlogAiExitPrompt(null)}
        testId="blog-article-collaborative-exit-dialog"
        title={t.blogArticle.aiCreation.dialog.exitTitle}
      />
    ) : null;
  }

  if (externalView?.view === 'knowledge-source-preview') {
    // 外部来源预览不渲染主应用框架，只展示独立预览页。
    const task = getAiCreationTasks(activeProject.id).find((item) => item.id === externalView.taskId);
    const sourceBlock = task
      ? createContentDemoData(task, activeProject).referenceBlocks.find(
          (block) => (block.sourceId || block.id) === externalView.sourceId,
        )
      : null;

    return <KnowledgeSourcePreviewPage block={sourceBlock} project={activeProject} />;
  }

  if (externalView?.view === 'knowledge-file-preview') {
    return <KnowledgeFilePreviewPage fileId={externalView.fileId} project={activeProject} t={t} />;
  }

  if (blogEditorArticle) {
    return (
      <BlogArticleEditor
        article={blogEditorArticle}
        onClose={() => setBlogEditorArticle(null)}
        project={activeProject}
        t={t}
      />
    );
  }

  if (videoGenerationOpen) {
    return (
      <VideoGenerationPage
        onBack={() => {
          setActiveItemId('video-ad');
          setVideoGenerationOpen(false);
        }}
        t={t}
      />
    );
  }

  if (blogAiCreateOpen) {
    return (
      <BlogArticleAiCreateTaskPage
        locale={locale}
        onClose={() => {
          setBlogAiCreateOpen(false);
          setBlogAiRecreateContext(null);
        }}
        onCreated={({ article, mode, task }) => {
          setBlogAiCreateOpen(false);
          setBlogAiRecreateContext(null);
          // 自动创作直接进入自动流程，协作式创作进入策划阶段。
          if (mode === 'auto') {
            setBlogAiPlanningContext(null);
            setBlogAiOutlineContext(null);
            setBlogAiContentContext(null);
            writeAiPlanningSession({
              articleId: article.id,
              projectId: activeProject.id,
              stage: 'auto',
              taskId: task.id,
              view: 'auto',
            });
            setBlogAiAutoContext({ article, task });
            return;
          }

          setBlogAiAutoContext(null);
          writeAiPlanningSession({
            articleId: article.id,
            projectId: activeProject.id,
            stage: 'planning',
            taskId: task.id,
          });
          setBlogAiPlanningContext({ article, task });
        }}
        mode={blogAiCreateMode}
        project={activeProject}
        recreateContext={blogAiRecreateContext}
        t={t}
      />
    );
  }

  if (blogAiAutoContext) {
    return (
      <BlogArticleAiAutoCreationPage
        article={blogAiAutoContext.article}
        locale={locale}
        onBack={() => {
          setActiveItemId('blog-article');
          clearAiPlanningSession();
          setBlogAiAutoContext(null);
        }}
        onSaveAndEdit={(savedArticle) => {
          clearAiPlanningSession();
          setBlogAiAutoContext(null);
          setBlogEditorArticle(savedArticle);
        }}
        onRecreateTask={openBlogAiRecreateTask}
        project={activeProject}
        t={t}
        task={blogAiAutoContext.task}
      />
    );
  }

  if (blogAiPlanningContext) {
    return (
      <>
        <BlogArticleAiPlanningPage
          article={blogAiPlanningContext.article}
          locale={locale}
          onBack={() => {
            clearAiPlanningSession();
            setBlogAiPlanningContext(null);
            setBlogAiCreateMode('collaborative');
            setBlogAiRecreateContext(null);
            setBlogAiCreateOpen(true);
          }}
          onClose={() => {
            if (
              requestCollaborativeExitPrompt({
                article: blogAiPlanningContext.article,
                task: blogAiPlanningContext.task,
              })
            ) {
              return;
            }

            setActiveItemId('blog-article');
            clearAiPlanningSession();
            setBlogAiPlanningContext(null);
            setBlogArticleNotice({
              id: Date.now(),
              articleId: blogAiPlanningContext.article.id,
              message: '文章创作任务已创建，文章策划已保存',
              type: 'success',
            });
          }}
          onGenerateOutline={({ article, task }) => {
            writeAiPlanningSession({
              articleId: article.id,
              projectId: activeProject.id,
              stage: 'outline',
              taskId: task.id,
            });
            setBlogAiPlanningContext(null);
            setBlogAiOutlineContext({ article, task });
          }}
          project={activeProject}
          t={t}
          task={blogAiPlanningContext.task}
        />
        {renderCollaborativeExitPromptDialog()}
      </>
    );
  }

  if (blogAiOutlineContext) {
    return (
      <>
        <BlogArticleAiOutlinePage
          article={blogAiOutlineContext.article}
          locale={locale}
          onBack={() => {
            // 从大纲返回策划时重新读取任务，保留大纲页已保存的最新状态。
            const latestTask =
              getAiCreationTasks(activeProject.id).find((item) => item.id === blogAiOutlineContext.task.id) ??
              blogAiOutlineContext.task;
            writeAiPlanningSession({
              articleId: blogAiOutlineContext.article.id,
              projectId: activeProject.id,
              stage: 'planning',
              taskId: latestTask.id,
            });
            setBlogAiOutlineContext(null);
            setBlogAiPlanningContext({ article: blogAiOutlineContext.article, task: latestTask });
          }}
          onClose={() => {
            if (
              requestCollaborativeExitPrompt({
                article: blogAiOutlineContext.article,
                task: blogAiOutlineContext.task,
              })
            ) {
              return;
            }

            setActiveItemId('blog-article');
            clearAiPlanningSession();
            setBlogAiOutlineContext(null);
            setBlogArticleNotice({
              id: Date.now(),
              articleId: blogAiOutlineContext.article.id,
              message: '文章创作任务已创建，标题大纲已保存',
              type: 'success',
            });
          }}
          onGenerateContent={({ article, task }) => {
            writeAiPlanningSession({
              articleId: article.id,
              projectId: activeProject.id,
              stage: 'content',
              taskId: task.id,
            });
            setBlogAiOutlineContext(null);
            setBlogAiContentContext({ article, task });
          }}
          project={activeProject}
          t={t}
          task={blogAiOutlineContext.task}
        />
        {renderCollaborativeExitPromptDialog()}
      </>
    );
  }

  if (blogAiContentContext) {
    return (
      <>
        <BlogArticleAiContentPage
          article={blogAiContentContext.article}
          locale={locale}
          onBack={() => {
            // 从正文返回大纲时重新读取任务，保留正文页已保存的最新状态。
            const latestTask =
              getAiCreationTasks(activeProject.id).find((item) => item.id === blogAiContentContext.task.id) ??
              blogAiContentContext.task;
            writeAiPlanningSession({
              articleId: blogAiContentContext.article.id,
              projectId: activeProject.id,
              stage: 'outline',
              taskId: latestTask.id,
            });
            setBlogAiContentContext(null);
            setBlogAiOutlineContext({ article: blogAiContentContext.article, task: latestTask });
          }}
          onClose={() => {
            if (
              requestCollaborativeExitPrompt({
                article: blogAiContentContext.article,
                task: blogAiContentContext.task,
              })
            ) {
              return;
            }

            exitArticleCreationFlow();
          }}
          onSaveAndEdit={(savedArticle) => {
            clearAiPlanningSession();
            setBlogAiContentContext(null);
            setBlogEditorArticle(savedArticle);
          }}
          project={activeProject}
          t={t}
          task={blogAiContentContext.task}
        />
        {renderCollaborativeExitPromptDialog()}
      </>
    );
  }

  if (copilotOpen) {
    return (
      <CopilotWorkbenchPage
        activeProject={activeProject}
        locale={locale}
        projects={projects}
        t={t}
        userMenuItems={localizedUserMenuItems}
        onClose={() => setCopilotOpen(false)}
        onProjectChange={setActiveProjectId}
      />
    );
  }

  return (
    <AppShell
      activeItem={activeItem}
      activeItemId={activeItemId}
      activeProject={activeProject}
      expandedSections={expandedSections}
      locale={locale}
      navSections={localizedNavSections}
      projects={projects}
      searchQuery={searchQuery}
      searchScope={searchScope}
      searchScopes={localizedSearchScopes}
      sidebarCollapsed={sidebarCollapsed}
      sidebarWidth={sidebarWidth}
      t={t}
      userMenuItems={localizedUserMenuItems}
      blogArticleNotice={blogArticleNotice}
      knowledgeItemFocusId={externalView?.view === 'knowledge-items' ? externalView.knowledgeItemId : ''}
      onBlogArticleNoticeConsumed={clearBlogArticleNotice}
      onLocaleChange={setLocale}
      onOpenBlogAiCreate={openBlogAiCreate}
      onOpenBlogAiTask={openBlogAiTask}
      onOpenBlogAiRecreateTask={openBlogAiRecreateTask}
      onOpenBlogArticleEditor={setBlogEditorArticle}
      onOpenCopilot={openCopilot}
      onOpenVideoGeneration={openVideoGeneration}
      onProjectChange={setActiveProjectId}
      onSearchQueryChange={setSearchQuery}
      onSearchScopeChange={setSearchScope}
      onSectionToggle={toggleSection}
      onSelectItem={setActiveItemId}
      onSidebarCollapsedToggle={toggleSidebarCollapsed}
    />
  );
}
