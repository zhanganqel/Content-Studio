import MainContent from './MainContent.jsx';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AppShell({
  activeItem,
  activeItemId,
  activeProject,
  expandedSections,
  locale,
  navSections,
  projects,
  searchQuery,
  searchScope,
  searchScopes,
  sidebarCollapsed,
  sidebarWidth,
  t,
  userMenuItems,
  blogArticleNotice,
  knowledgeItemFocusId,
  onBlogArticleNoticeConsumed,
  onLocaleChange,
  onOpenBlogAiCreate,
  onOpenBlogAiTask,
  onOpenBlogAiRecreateTask,
  onOpenBlogArticleEditor,
  onOpenCopilot,
  onOpenVideoGeneration,
  onProjectChange,
  onSearchQueryChange,
  onSearchScopeChange,
  onSectionToggle,
  onSelectItem,
  onSidebarCollapsedToggle,
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Sidebar
        activeItemId={activeItemId}
        activeProject={activeProject}
        expandedSections={expandedSections}
        locale={locale}
        navSections={navSections}
        projects={projects}
        sidebarCollapsed={sidebarCollapsed}
        sidebarWidth={sidebarWidth}
        t={t}
        onLocaleChange={onLocaleChange}
        onProjectChange={onProjectChange}
        onSectionToggle={onSectionToggle}
        onSelectItem={onSelectItem}
        onSidebarCollapsedToggle={onSidebarCollapsedToggle}
      />
      <Topbar
        searchQuery={searchQuery}
        searchScope={searchScope}
        searchScopes={searchScopes}
        sidebarWidth={sidebarWidth}
        t={t}
        userMenuItems={userMenuItems}
        onOpenCopilot={onOpenCopilot}
        onSearchQueryChange={onSearchQueryChange}
        onSearchScopeChange={onSearchScopeChange}
      />
      <MainContent
        activeItem={activeItem}
        activeProject={activeProject}
        blogArticleNotice={blogArticleNotice}
        knowledgeItemFocusId={knowledgeItemFocusId}
        onBlogArticleNoticeConsumed={onBlogArticleNoticeConsumed}
        onOpenBlogAiCreate={onOpenBlogAiCreate}
        onOpenBlogAiTask={onOpenBlogAiTask}
        onOpenBlogAiRecreateTask={onOpenBlogAiRecreateTask}
        onOpenBlogArticleEditor={onOpenBlogArticleEditor}
        onOpenVideoGeneration={onOpenVideoGeneration}
        sidebarWidth={sidebarWidth}
        t={t}
      />
    </div>
  );
}
