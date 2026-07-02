import { useEffect, useMemo, useState } from 'react';
import AppShell from './components/AppShell.jsx';
import BlogArticleAiCreateTaskPage from './components/blog-article/BlogArticleAiCreateTaskPage.jsx';
import BlogArticleAiContentPage from './components/blog-article/BlogArticleAiContentPage.jsx';
import BlogArticleAiOutlinePage from './components/blog-article/BlogArticleAiOutlinePage.jsx';
import BlogArticleAiPlanningPage from './components/blog-article/BlogArticleAiPlanningPage.jsx';
import BlogArticleEditor from './components/blog-article/BlogArticleEditor.jsx';
import KnowledgeFilePreviewPage from './components/knowledge-assets/KnowledgeFilePreviewPage.jsx';
import KnowledgeSourcePreviewPage from './components/knowledge-assets/KnowledgeSourcePreviewPage.jsx';
import { navSections, projects, searchScopes, userMenuItems } from './data/navigation.js';
import { defaultLocale, messages } from './i18n/messages.js';
import { createContentDemoData, getAiCreationTasks } from './services/blogArticleAiStore.js';
import { getBlogArticleDrafts } from './services/blogArticleStore.js';

const localeStorageKey = 'content-studio-locale';
const aiPlanningSessionStorageKey = 'content-studio-active-ai-planning-session';

function getInitialLocale() {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  const storedLocale = window.localStorage.getItem(localeStorageKey);
  return messages[storedLocale] ? storedLocale : defaultLocale;
}

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

function writeAiPlanningSession(session) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(aiPlanningSessionStorageKey, JSON.stringify(session));
}

function clearAiPlanningSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(aiPlanningSessionStorageKey);
}

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

function getInitialProjectId(externalView) {
  if (externalView?.projectId && projects.some((project) => project.id === externalView.projectId)) {
    return externalView.projectId;
  }

  return projects[0].id;
}

export default function App() {
  const [externalView] = useState(readExternalView);
  const [locale, setLocale] = useState(getInitialLocale);
  const [activeProjectId, setActiveProjectId] = useState(() => getInitialProjectId(externalView));
  const [expandedSections, setExpandedSections] = useState([]);
  const [activeItemId, setActiveItemId] = useState(() =>
    externalView?.view === 'knowledge-items' ? 'knowledge-items' : null,
  );
  const [searchScope, setSearchScope] = useState(searchScopes[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [blogAiCreateOpen, setBlogAiCreateOpen] = useState(false);
  const [blogAiPlanningContext, setBlogAiPlanningContext] = useState(null);
  const [blogAiOutlineContext, setBlogAiOutlineContext] = useState(null);
  const [blogAiContentContext, setBlogAiContentContext] = useState(null);
  const [blogArticleNotice, setBlogArticleNotice] = useState(null);
  const [blogEditorArticle, setBlogEditorArticle] = useState(null);
  const t = messages[locale] ?? messages[defaultLocale];

  useEffect(() => {
    window.localStorage.setItem(localeStorageKey, locale);
  }, [locale]);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [activeProjectId],
  );

  useEffect(() => {
    if (externalView?.view) {
      return;
    }

    if (blogAiCreateOpen || blogAiPlanningContext || blogAiOutlineContext || blogAiContentContext || blogEditorArticle) {
      return;
    }

    const session = readAiPlanningSession();
    if (!session || session.projectId !== activeProject.id) {
      return;
    }

    const task = getAiCreationTasks(activeProject.id).find((item) => item.id === session.taskId);
    const article = getBlogArticleDrafts(activeProject).find((item) => item.id === session.articleId);

    if (task && article) {
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

  if (externalView?.view === 'knowledge-source-preview') {
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

  if (blogAiCreateOpen) {
    return (
      <BlogArticleAiCreateTaskPage
        onClose={() => setBlogAiCreateOpen(false)}
        onCreated={({ article, task }) => {
          setBlogAiCreateOpen(false);
          writeAiPlanningSession({
            articleId: article.id,
            projectId: activeProject.id,
            stage: 'planning',
            taskId: task.id,
          });
          setBlogAiPlanningContext({ article, task });
        }}
        project={activeProject}
      />
    );
  }

  if (blogAiPlanningContext) {
    return (
      <BlogArticleAiPlanningPage
        article={blogAiPlanningContext.article}
        onBack={() => {
          clearAiPlanningSession();
          setBlogAiPlanningContext(null);
          setBlogAiCreateOpen(true);
        }}
        onClose={() => {
          setActiveItemId('blog-article');
          clearAiPlanningSession();
          setBlogAiPlanningContext(null);
          setBlogArticleNotice({
            id: Date.now(),
            articleId: blogAiPlanningContext.article.id,
            message: 'AI 创作任务已创建，文章策划已保存',
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
        task={blogAiPlanningContext.task}
      />
    );
  }

  if (blogAiOutlineContext) {
    return (
      <BlogArticleAiOutlinePage
        article={blogAiOutlineContext.article}
        onBack={() => {
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
          setActiveItemId('blog-article');
          clearAiPlanningSession();
          setBlogAiOutlineContext(null);
          setBlogArticleNotice({
            id: Date.now(),
            articleId: blogAiOutlineContext.article.id,
            message: 'AI 创作任务已创建，标题大纲已保存',
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
        task={blogAiOutlineContext.task}
      />
    );
  }

  if (blogAiContentContext) {
    return (
      <BlogArticleAiContentPage
        article={blogAiContentContext.article}
        onBack={() => {
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
        onSaveAndEdit={(savedArticle) => {
          clearAiPlanningSession();
          setBlogAiContentContext(null);
          setBlogEditorArticle(savedArticle);
        }}
        project={activeProject}
        task={blogAiContentContext.task}
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
      t={t}
      userMenuItems={localizedUserMenuItems}
      blogArticleNotice={blogArticleNotice}
      knowledgeItemFocusId={externalView?.view === 'knowledge-items' ? externalView.knowledgeItemId : ''}
      onLocaleChange={setLocale}
      onOpenBlogAiCreate={() => setBlogAiCreateOpen(true)}
      onOpenBlogArticleEditor={setBlogEditorArticle}
      onProjectChange={setActiveProjectId}
      onSearchQueryChange={setSearchQuery}
      onSearchScopeChange={setSearchScope}
      onSectionToggle={toggleSection}
      onSelectItem={setActiveItemId}
    />
  );
}
