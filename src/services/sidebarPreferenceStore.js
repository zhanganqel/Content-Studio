export const sidebarCollapsedStorageKey = 'content-studio-sidebar-collapsed';
export const expandedSidebarWidth = 300;
export const collapsedSidebarWidth = 76;

// 侧栏折叠偏好保存在浏览器本地，刷新后继续使用上次布局。
export function getSidebarCollapsedPreference() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(sidebarCollapsedStorageKey) === 'true';
}

// 保存侧栏折叠偏好，不参与项目级数据隔离。
export function saveSidebarCollapsedPreference(collapsed) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(sidebarCollapsedStorageKey, collapsed ? 'true' : 'false');
}
