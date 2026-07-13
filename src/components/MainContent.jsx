import BrandProfilePage from './brand-profile/BrandProfilePage.jsx';
import AudiencePersonaPage from './audience-persona/AudiencePersonaPage.jsx';
import BlogArticlePage from './blog-article/BlogArticlePage.jsx';
import KnowledgeAssetsPage from './knowledge-assets/KnowledgeAssetsPage.jsx';
import KnowledgeItemsPage from './knowledge-items/KnowledgeItemsPage.jsx';
import VideoAdPage from './video-ad/VideoAdPage.jsx';

// 根据当前导航项选择页面，并统一处理侧栏宽度带来的内容区偏移。
export default function MainContent({
  activeItem,
  activeProject,
  blogArticleNotice,
  knowledgeItemFocusId,
  onBlogArticleNoticeConsumed,
  onOpenBlogAiCreate,
  onOpenBlogAiTask,
  onOpenBlogAiRecreateTask,
  onOpenBlogArticleEditor,
  onOpenVideoGeneration,
  sidebarWidth,
  t,
}) {
  const mainOffsetStyle = { marginLeft: sidebarWidth };

  // 品牌档案使用内部滚动，避免固定操作区随页面滚动丢失。
  if (activeItem?.id === 'brand-profile') {
    return (
      <main className="h-screen overflow-hidden bg-white pt-[72px] transition-[margin-left] duration-200" style={mainOffsetStyle}>
        <div className="h-[calc(100vh-72px)] min-h-0 p-8">
          <BrandProfilePage project={activeProject} t={t} />
        </div>
      </main>
    );
  }

  if (activeItem?.id === 'audience-persona') {
    return (
      <main className="h-screen overflow-y-auto bg-white pt-[72px] transition-[margin-left] duration-200" style={mainOffsetStyle}>
        <div className="min-h-[calc(100vh-72px)] p-8">
          <AudiencePersonaPage project={activeProject} sidebarWidth={sidebarWidth} t={t} />
        </div>
      </main>
    );
  }

  if (activeItem?.id === 'knowledge-items') {
    return (
      <main className="h-screen overflow-y-auto bg-white pt-[72px] transition-[margin-left] duration-200" style={mainOffsetStyle}>
        <div className="min-h-[calc(100vh-72px)] p-8">
          <KnowledgeItemsPage
            focusItemId={knowledgeItemFocusId}
            project={activeProject}
            sidebarWidth={sidebarWidth}
            t={t}
          />
        </div>
      </main>
    );
  }

  if (activeItem?.id === 'knowledge-assets') {
    // 知识资料使用内部滚动，保持资料列表和操作区在同一视口中。
    return (
      <main className="h-screen overflow-hidden bg-white pt-[72px] transition-[margin-left] duration-200" style={mainOffsetStyle}>
        <div className="h-[calc(100vh-72px)] min-h-0 p-8">
          <KnowledgeAssetsPage project={activeProject} t={t} />
        </div>
      </main>
    );
  }

  if (activeItem?.id === 'blog-article') {
    // 文章列表接收创作完成提示和历史任务入口，由页面内部消费。
    return (
      <main className="h-screen overflow-y-auto bg-white pt-[72px] transition-[margin-left] duration-200" style={mainOffsetStyle}>
        <div className="min-h-[calc(100vh-72px)] p-8">
          <BlogArticlePage
            creationNotice={blogArticleNotice}
            onCreationNoticeConsumed={onBlogArticleNoticeConsumed}
            onOpenAiCreation={onOpenBlogAiCreate}
            onOpenAiTask={onOpenBlogAiTask}
            onRecreateAiTask={onOpenBlogAiRecreateTask}
            onOpenEditor={onOpenBlogArticleEditor}
            project={activeProject}
            t={t}
          />
        </div>
      </main>
    );
  }

  if (activeItem?.id === 'video-ad') {
    return (
      <main className="h-screen overflow-y-auto bg-white pt-[72px] transition-[margin-left] duration-200" style={mainOffsetStyle}>
        <div className="min-h-[calc(100vh-72px)] p-8">
          <VideoAdPage onOpenVideoGeneration={onOpenVideoGeneration} t={t} />
        </div>
      </main>
    );
  }

  return (
    // 未实现的导航项进入占位内容，保留项目和菜单上下文。
    <main className="h-screen overflow-y-auto pt-[72px] transition-[margin-left] duration-200" style={mainOffsetStyle}>
      <div className="min-h-[calc(100vh-72px)] bg-white p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-slate-400">{activeProject.name}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-normal text-slate-900">
            {activeItem ? activeItem.title : t.mainContent.welcomeTitle}
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-500">
            {activeItem
              ? t.mainContent.itemPlaceholder({
                  sectionTitle: activeItem.sectionTitle,
                  itemTitle: activeItem.title,
                })
              : t.mainContent.welcomeBody}
          </p>
        </div>
      </div>
    </main>
  );
}
