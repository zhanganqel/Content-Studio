import BrandProfilePage from './brand-profile/BrandProfilePage.jsx';
import AudiencePersonaPage from './audience-persona/AudiencePersonaPage.jsx';

export default function MainContent({ activeItem, activeProject, t }) {
  if (activeItem?.id === 'brand-profile') {
    return (
      <main className="ml-[300px] h-screen overflow-y-auto bg-white pt-[72px]">
        <div className="min-h-[calc(100vh-72px)] p-8">
          <BrandProfilePage project={activeProject} t={t} />
        </div>
      </main>
    );
  }

  if (activeItem?.id === 'audience-persona') {
    return (
      <main className="ml-[300px] h-screen overflow-y-auto bg-white pt-[72px]">
        <div className="min-h-[calc(100vh-72px)] p-8">
          <AudiencePersonaPage project={activeProject} t={t} />
        </div>
      </main>
    );
  }

  return (
    <main className="ml-[300px] h-screen overflow-y-auto pt-[72px]">
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
