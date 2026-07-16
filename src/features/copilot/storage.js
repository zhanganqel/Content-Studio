const cleanupVersionKey = 'content-studio-edgeone-copilot:v2:cleanup';
const userIdKey = 'content-studio-edgeone-copilot:v2:user-id';
const sidebarKey = 'content-studio-edgeone-copilot:v2:sidebar-collapsed';
const projectPreferencesPrefix = 'content-studio-edgeone-copilot:v2:project:';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function cleanupLegacyCopilotStorage() {
  if (!canUseStorage() || window.localStorage.getItem(cleanupVersionKey) === '1') return;

  const removableKeys = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index) || '';
    const isLegacyCopilotKey =
      key.startsWith('content-studio-copilot-') ||
      (key.startsWith('content-studio-db:') && /:copilot-(artifacts|conversations|messages|runs|seed-meta|sources)$/.test(key));
    if (isLegacyCopilotKey) removableKeys.push(key);
  }
  removableKeys.forEach((key) => window.localStorage.removeItem(key));
  window.localStorage.setItem(cleanupVersionKey, '1');
}

export function getBrowserUserId() {
  cleanupLegacyCopilotStorage();
  if (!canUseStorage()) return 'server';
  let value = window.localStorage.getItem(userIdKey) || '';
  if (!value) {
    value = globalThis.crypto?.randomUUID?.() || `browser-${Date.now()}`;
    window.localStorage.setItem(userIdKey, value);
  }
  return value;
}

export function getProjectUserId(projectId) {
  return `content-studio.${String(projectId || 'default')}.${getBrowserUserId()}`;
}

export function getSidebarCollapsedPreference() {
  cleanupLegacyCopilotStorage();
  return canUseStorage() && window.localStorage.getItem(sidebarKey) === 'true';
}

export function saveSidebarCollapsedPreference(collapsed) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(sidebarKey, collapsed ? 'true' : 'false');
}

export function getProjectUiPreferences(projectId) {
  cleanupLegacyCopilotStorage();
  if (!canUseStorage()) return { pinnedIds: [], titleOverrides: {} };
  try {
    const value = JSON.parse(window.localStorage.getItem(`${projectPreferencesPrefix}${projectId}`) || '{}');
    return {
      pinnedIds: Array.isArray(value.pinnedIds) ? value.pinnedIds : [],
      titleOverrides: value.titleOverrides && typeof value.titleOverrides === 'object'
        ? value.titleOverrides
        : {},
    };
  } catch {
    return { pinnedIds: [], titleOverrides: {} };
  }
}

export function saveProjectUiPreferences(projectId, preferences) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(`${projectPreferencesPrefix}${projectId}`, JSON.stringify(preferences));
}
