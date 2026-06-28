import { Check, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { locales } from '../i18n/messages.js';

export default function Sidebar({
  activeItemId,
  activeProject,
  expandedSections,
  locale,
  navSections,
  projects,
  t,
  onLocaleChange,
  onProjectChange,
  onSectionToggle,
  onSelectItem,
}) {
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const projectMenuRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target)) {
        setProjectMenuOpen(false);
      }

      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectProject(projectId) {
    onProjectChange(projectId);
    setProjectMenuOpen(false);
  }

  function selectLocale(nextLocale) {
    onLocaleChange(nextLocale);
    setSettingsOpen(false);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[300px] flex-col bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mb-7">
        <h1 className="text-[32px] font-bold leading-[1.05] tracking-normal text-white">
          Content
          <span className="block">Studio</span>
        </h1>
      </div>

      <div ref={projectMenuRef} className="relative mb-7">
        <button
          data-testid="project-switcher"
          className="flex min-h-[78px] w-full items-center justify-between rounded-lg bg-slate-800 px-4 text-left transition hover:bg-slate-700"
          type="button"
          onClick={() => setProjectMenuOpen((open) => !open)}
          aria-expanded={projectMenuOpen}
        >
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold text-slate-100">
              {activeProject.name}
            </span>
            <span className="mt-1 block truncate text-xs text-slate-400">
              {activeProject.description}
            </span>
          </span>
          <ChevronRight className="ml-3 h-5 w-5 flex-none text-slate-400" />
        </button>

        {projectMenuOpen ? (
          <div className="absolute left-0 right-0 top-[86px] z-40 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-menu">
            {projects.map((project) => (
              <button
                key={project.id}
                data-testid={`project-option-${project.id}`}
                type="button"
                className={`w-full px-4 py-3 text-left transition ${
                  project.id === activeProject.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-200 hover:bg-slate-800'
                }`}
                onClick={() => selectProject(project.id)}
              >
                <span className="block truncate text-sm font-semibold">{project.name}</span>
                <span
                  className={`mt-1 block truncate text-xs ${
                    project.id === activeProject.id ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {project.description}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-5">
          {navSections.map((section) => {
            const expanded = expandedSections.includes(section.id);

            return (
              <section key={section.id}>
                <button
                  data-testid={`nav-section-${section.id}`}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md py-1 text-left text-[17px] font-bold text-slate-200 transition hover:text-white"
                  onClick={() => onSectionToggle(section.id)}
                  aria-expanded={expanded}
                >
                  {expanded ? (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )}
                  <span>{section.title}</span>
                </button>

                {expanded ? (
                  <div className="mt-3 space-y-1">
                    {section.items.map((item) => {
                      const selected = activeItemId === item.id;

                      return (
                        <button
                          key={item.id}
                          data-testid={`nav-item-${item.id}`}
                          type="button"
                          className={`relative flex min-h-[38px] w-full items-center rounded-lg pl-9 pr-3 text-left text-[15px] transition ${
                            selected
                              ? 'bg-slate-800 text-slate-100'
                              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                          }`}
                          onClick={() => onSelectItem(item.id)}
                        >
                          {selected ? (
                            <span className="absolute left-0 top-1/2 h-[31px] w-1 -translate-y-1/2 rounded-full bg-blue-500" />
                          ) : null}
                          {item.title}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-1 pl-7 text-[13px] leading-5 text-slate-400">
                    {section.description}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </nav>

      <div ref={settingsRef} className="relative mt-7">
        {settingsOpen ? (
          <div className="absolute bottom-[44px] left-0 right-0 z-40 rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-menu">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              {t.settings.interfaceLanguage}
            </div>
            <div className="space-y-1">
              {locales.map((item) => {
                const selected = item.code === locale;

                return (
                  <button
                    key={item.code}
                    data-testid={`locale-option-${item.code}`}
                    type="button"
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition ${
                      selected
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                    onClick={() => selectLocale(item.code)}
                  >
                    {item.label}
                    {selected ? <Check className="h-4 w-4" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <button
          data-testid="settings-button"
          type="button"
          className="flex w-full items-center justify-end gap-2 rounded-md py-2 text-sm font-semibold text-slate-300 transition hover:text-white"
          onClick={() => setSettingsOpen((open) => !open)}
          aria-expanded={settingsOpen}
        >
          <Settings className="h-4 w-4" />
          {t.settings.entry}
        </button>
      </div>
    </aside>
  );
}
