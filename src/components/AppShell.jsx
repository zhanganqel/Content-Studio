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
  t,
  userMenuItems,
  blogArticleNotice,
  knowledgeItemFocusId,
  onBlogArticleNoticeConsumed,
  onLocaleChange,
  onOpenBlogAiCreate,
  onOpenBlogArticleEditor,
  onProjectChange,
  onSearchQueryChange,
  onSearchScopeChange,
  onSectionToggle,
  onSelectItem,
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
        t={t}
        onLocaleChange={onLocaleChange}
        onProjectChange={onProjectChange}
        onSectionToggle={onSectionToggle}
        onSelectItem={onSelectItem}
      />
      <Topbar
        searchQuery={searchQuery}
        searchScope={searchScope}
        searchScopes={searchScopes}
        t={t}
        userMenuItems={userMenuItems}
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
        onOpenBlogArticleEditor={onOpenBlogArticleEditor}
        t={t}
      />
    </div>
  );
}
