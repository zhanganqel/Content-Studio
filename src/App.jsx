import { useEffect, useMemo, useState } from 'react';
import AppShell from './components/AppShell.jsx';
import { navSections, projects, searchScopes, userMenuItems } from './data/navigation.js';
import { defaultLocale, messages } from './i18n/messages.js';

const localeStorageKey = 'content-studio-locale';

function getInitialLocale() {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  const storedLocale = window.localStorage.getItem(localeStorageKey);
  return messages[storedLocale] ? storedLocale : defaultLocale;
}

export default function App() {
  const [locale, setLocale] = useState(getInitialLocale);
  const [activeProjectId, setActiveProjectId] = useState(projects[0].id);
  const [expandedSections, setExpandedSections] = useState([]);
  const [activeItemId, setActiveItemId] = useState(null);
  const [searchScope, setSearchScope] = useState(searchScopes[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const t = messages[locale] ?? messages[defaultLocale];

  useEffect(() => {
    window.localStorage.setItem(localeStorageKey, locale);
  }, [locale]);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [activeProjectId],
  );

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
      onLocaleChange={setLocale}
      onProjectChange={setActiveProjectId}
      onSearchQueryChange={setSearchQuery}
      onSearchScopeChange={setSearchScope}
      onSectionToggle={toggleSection}
      onSelectItem={setActiveItemId}
    />
  );
}
