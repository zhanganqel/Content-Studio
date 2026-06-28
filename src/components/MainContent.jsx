export default function MainContent({ activeItem, activeProject, t }) {
  return (
    <main className="ml-[300px] min-h-screen pt-[72px]">
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
