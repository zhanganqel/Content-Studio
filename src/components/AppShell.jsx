import MainContent from './MainContent.jsx';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

// 组合全局侧栏、顶栏和业务内容区，所有页面级状态由 App 传入。
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
      {/* 侧栏负责项目切换、导航展开和当前菜单定位 */}
      <Sidebar
        activeItemId={activeItemId}
        activeProject={activeProject}
        expandedSections={expandedSections}
        navSections={navSections}
        projects={projects}
        sidebarCollapsed={sidebarCollapsed}
        sidebarWidth={sidebarWidth}
        t={t}
        onProjectChange={onProjectChange}
        onSectionToggle={onSectionToggle}
        onSelectItem={onSelectItem}
        onHome={() => onSelectItem(null)}
        onSidebarCollapsedToggle={onSidebarCollapsedToggle}
      />
      {/* 顶栏负责全局搜索、搜索范围选择和 Copilot 入口 */}
      <Topbar
        locale={locale}
        searchQuery={searchQuery}
        searchScope={searchScope}
        searchScopes={searchScopes}
        sidebarWidth={sidebarWidth}
        t={t}
        onLocaleChange={onLocaleChange}
        onOpenCopilot={onOpenCopilot}
        onSearchQueryChange={onSearchQueryChange}
        onSearchScopeChange={onSearchScopeChange}
      />
      {/* 主内容区根据当前导航项分发到具体业务页面 */}
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
        onOpenCopilot={onOpenCopilot}
        onOpenVideoGeneration={onOpenVideoGeneration}
        onSelectItem={onSelectItem}
        sidebarWidth={sidebarWidth}
        t={t}
      />
    </div>
  );
}
