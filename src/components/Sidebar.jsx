import {
  BookOpenText,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  Factory,
  Globe2,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { locales } from '../i18n/messages.js';

const sectionIcons = {
  'brand-knowledge': BookOpenText,
  'site-builder': Globe2,
  'content-factory': Factory,
  'growth-dashboard': ChartNoAxesCombined,
};

// 根据项目名称生成缩写，供折叠侧栏的项目入口展示。
function getProjectInitials(name = '') {
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return 'P';
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

// 折叠侧栏只显示图标时，用 tooltip 保留入口含义。
function SidebarIconTooltip({ children, label }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-menu group-hover:block">
        {label}
      </span>
    </span>
  );
}

// 侧栏负责项目切换、导航展开、折叠态浮层和语言设置入口。
export default function Sidebar({
  activeItemId,
  activeProject,
  expandedSections,
  locale,
  navSections,
  projects,
  sidebarCollapsed,
  sidebarWidth,
  t,
  onLocaleChange,
  onProjectChange,
  onSectionToggle,
  onSelectItem,
  onSidebarCollapsedToggle,
}) {
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hoveredSectionId, setHoveredSectionId] = useState(null);
  const projectMenuRef = useRef(null);
  const settingsRef = useRef(null);
  const sectionMenuCloseTimerRef = useRef(null);

  useEffect(() => {
    // 项目菜单和设置菜单都通过外部点击关闭，避免浮层残留。
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

  useEffect(() => {
    // 切换折叠状态时关闭所有临时浮层，保证新布局从稳定状态开始。
    setProjectMenuOpen(false);
    setSettingsOpen(false);
    setHoveredSectionId(null);
  }, [sidebarCollapsed]);

  useEffect(
    () => () => {
      if (sectionMenuCloseTimerRef.current) {
        clearTimeout(sectionMenuCloseTimerRef.current);
      }
    },
    [],
  );

  function selectProject(projectId) {
    onProjectChange(projectId);
    setProjectMenuOpen(false);
  }

  function selectLocale(nextLocale) {
    onLocaleChange(nextLocale);
    setSettingsOpen(false);
  }

  function openCollapsedSectionMenu(sectionId) {
    if (!sidebarCollapsed) return;

    if (sectionMenuCloseTimerRef.current) {
      clearTimeout(sectionMenuCloseTimerRef.current);
    }

    setHoveredSectionId(sectionId);
  }

  function closeCollapsedSectionMenu() {
    if (sectionMenuCloseTimerRef.current) {
      clearTimeout(sectionMenuCloseTimerRef.current);
    }

    sectionMenuCloseTimerRef.current = setTimeout(() => {
      setHoveredSectionId(null);
    }, 120);
  }

  const sidebarCopy = t.sidebar ?? {};
  const projectInitials = getProjectInitials(activeProject.name);
  const sidebarToggleLabel = sidebarCollapsed
    ? sidebarCopy.expandNavigation ?? 'Expand Studio navigation'
    : sidebarCopy.collapseNavigation ?? 'Collapse Studio navigation';

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-950 text-slate-100 transition-[width] duration-200 ${
        sidebarCollapsed ? 'px-3 py-5' : 'px-6 py-8'
      }`}
      style={{ width: sidebarWidth }}
    >
      <div
        className={
          sidebarCollapsed
            ? 'mb-3 flex justify-center'
            : 'mb-7 flex items-start justify-between gap-4'
        }
      >
        {!sidebarCollapsed ? (
          <h1 className="min-w-0 tracking-normal">
            <span className="block text-[38px] font-extrabold leading-[0.95] text-blue-500">
              Content
            </span>
            <span className="mt-1 block text-[30px] font-bold leading-none text-white">
              Studio
            </span>
          </h1>
        ) : null}
        <SidebarIconTooltip label={sidebarToggleLabel}>
          <button
            data-testid="sidebar-collapse-toggle"
            type="button"
            className={`grid flex-none place-items-center text-slate-300 transition hover:bg-slate-800 hover:text-white ${
              sidebarCollapsed ? 'h-11 w-11 rounded-xl' : 'h-9 w-9 rounded-lg'
            }`}
            onClick={onSidebarCollapsedToggle}
            aria-label={sidebarToggleLabel}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </SidebarIconTooltip>
      </div>

      <div
        ref={projectMenuRef}
        className={`relative ${sidebarCollapsed ? 'mb-6 flex justify-center' : 'mb-7'}`}
      >
        {/* 项目切换器在展开态展示项目描述，折叠态只展示项目缩写 */}
        <button
          data-testid={sidebarCollapsed ? 'collapsed-project-switcher' : 'project-switcher'}
          className={
            sidebarCollapsed
              ? 'grid h-11 w-11 place-items-center rounded-xl bg-slate-800 text-sm font-bold text-slate-100 ring-1 ring-slate-700 transition hover:bg-slate-700 hover:text-white'
              : 'flex min-h-[78px] w-full items-center justify-between rounded-lg bg-slate-800 px-4 text-left transition hover:bg-slate-700'
          }
          type="button"
          onClick={() => setProjectMenuOpen((open) => !open)}
          aria-expanded={projectMenuOpen}
          aria-label={sidebarCopy.projectSwitcher ?? 'Switch project'}
          title={
            sidebarCollapsed
              ? sidebarCopy.projectTooltip?.(activeProject.name) ?? activeProject.name
              : undefined
          }
        >
          {sidebarCollapsed ? (
            projectInitials
          ) : (
            <>
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold text-slate-100">
                  {activeProject.name}
                </span>
                <span className="mt-1 block truncate text-xs text-slate-400">
                  {activeProject.description}
                </span>
              </span>
              <ChevronRight className="ml-3 h-5 w-5 flex-none text-slate-400" />
            </>
          )}
        </button>

        {projectMenuOpen ? (
          <div
            className={`absolute z-50 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-menu ${
              sidebarCollapsed ? 'top-0 w-[292px]' : 'left-0 right-0 top-[86px]'
            }`}
            style={sidebarCollapsed ? { left: 'calc(100% + 12px)' } : undefined}
          >
            {sidebarCollapsed ? (
              <div className="border-b border-slate-800 px-4 py-3 text-xs font-semibold uppercase tracking-normal text-slate-500">
                {sidebarCopy.projectSwitcher ?? 'Switch project'}
              </div>
            ) : null}
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

      <nav className={`min-h-0 flex-1 ${sidebarCollapsed ? 'overflow-visible' : 'overflow-y-auto pr-1'}`}>
        <div className={sidebarCollapsed ? 'space-y-3' : 'space-y-5'}>
          {navSections.map((section) => {
            const expanded = expandedSections.includes(section.id);
            const activeInSection = section.items.some((item) => item.id === activeItemId);
            const Icon = sectionIcons[section.id] ?? BookOpenText;
            const collapsedPopoverOpen = sidebarCollapsed && hoveredSectionId === section.id;

            if (sidebarCollapsed) {
              return (
                /* 折叠态通过悬浮菜单展示二级导航，避免侧栏宽度变化。 */
                <section
                  key={section.id}
                  className="relative flex justify-center"
                  onMouseEnter={() => openCollapsedSectionMenu(section.id)}
                  onMouseLeave={closeCollapsedSectionMenu}
                >
                  <button
                    data-testid={`collapsed-nav-section-${section.id}`}
                    type="button"
                    className={`grid h-11 w-11 place-items-center rounded-xl transition ${
                      activeInSection
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                    onClick={() =>
                      setHoveredSectionId((current) => (current === section.id ? null : section.id))
                    }
                    aria-haspopup="menu"
                    aria-expanded={collapsedPopoverOpen}
                    aria-label={sidebarCopy.openSectionMenu?.(section.title) ?? section.title}
                    title={section.title}
                  >
                    <Icon className="h-5 w-5" />
                  </button>

                  {collapsedPopoverOpen ? (
                    <div
                      className="absolute top-0 z-50 w-[268px] rounded-xl border border-slate-200 bg-white p-2 text-slate-800 shadow-menu"
                      role="menu"
                      style={{ left: 'calc(100% + 12px)' }}
                    >
                      <div className="border-b border-slate-100 px-3 py-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          <Icon className="h-4 w-4 text-blue-600" />
                          {section.title}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {section.description}
                        </p>
                      </div>
                      <div className="py-1">
                        {section.items.map((item) => {
                          const selected = activeItemId === item.id;

                          return (
                            <button
                              key={item.id}
                              data-testid={`nav-item-${item.id}`}
                              type="button"
                              role="menuitem"
                              className={`flex min-h-[36px] w-full items-center rounded-lg px-3 text-left text-sm font-medium transition ${
                                selected
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                              onClick={() => {
                                onSelectItem(item.id);
                                setHoveredSectionId(null);
                              }}
                            >
                              {item.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </section>
              );
            }

            return (
              /* 展开态直接展示可折叠分组和二级导航项。 */
              <section key={section.id}>
                <button
                  data-testid={`nav-section-${section.id}`}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md py-1 text-left text-[17px] font-bold text-slate-200 transition hover:text-white"
                  onClick={() => onSectionToggle(section.id)}
                  aria-expanded={expanded}
                >
                  <Icon className="h-5 w-5 flex-none text-slate-400" />
                  <span className="min-w-0 flex-1 truncate">{section.title}</span>
                  {expanded ? (
                    <ChevronDown className="h-5 w-5 flex-none text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 flex-none text-slate-400" />
                  )}
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
                          className={`relative flex min-h-[38px] w-full items-center rounded-lg pl-9 pr-3 text-left text-[14px] transition ${
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

      <div ref={settingsRef} className={`relative mt-7 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
        {/* 设置菜单当前只承载界面语言选择 */}
        {settingsOpen ? (
          <div
            className={`absolute z-50 rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-menu ${
              sidebarCollapsed ? 'bottom-0 w-[220px]' : 'bottom-[44px] left-0 right-0'
            }`}
            style={sidebarCollapsed ? { left: 'calc(100% + 12px)' } : undefined}
          >
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
          className={
            sidebarCollapsed
              ? 'grid h-11 w-11 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-white'
              : 'flex w-full items-center justify-end gap-2 rounded-md py-2 text-sm font-semibold text-slate-300 transition hover:text-white'
          }
          onClick={() => setSettingsOpen((open) => !open)}
          aria-expanded={settingsOpen}
          aria-label={t.settings.entry}
          title={sidebarCollapsed ? t.settings.entry : undefined}
        >
          <Settings className="h-4 w-4" />
          {sidebarCollapsed ? null : t.settings.entry}
        </button>
      </div>
    </aside>
  );
}
