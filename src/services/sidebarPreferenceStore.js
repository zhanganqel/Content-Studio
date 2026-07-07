export const sidebarCollapsedStorageKey = 'content-studio-sidebar-collapsed';
export const expandedSidebarWidth = 300;
export const collapsedSidebarWidth = 76;

export function getSidebarCollapsedPreference() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(sidebarCollapsedStorageKey) === 'true';
}

export function saveSidebarCollapsedPreference(collapsed) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(sidebarCollapsedStorageKey, collapsed ? 'true' : 'false');
}
