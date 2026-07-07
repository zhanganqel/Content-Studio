const sidebarCollapsedStorageKey = 'content-studio-copilot-sidebar-collapsed';
const conversationsStorageKeyPrefix = 'content-studio-copilot-conversations:';

function getConversationsStorageKey(projectId) {
  return `${conversationsStorageKeyPrefix}${projectId}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getCopilotSidebarCollapsedPreference() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(sidebarCollapsedStorageKey) === 'true';
}

export function saveCopilotSidebarCollapsedPreference(collapsed) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(sidebarCollapsedStorageKey, collapsed ? 'true' : 'false');
}

export function createCopilotConversation(title) {
  return {
    id: `copilot-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    pinned: false,
    title,
    updatedAt: new Date().toISOString(),
  };
}

export function getCopilotConversations(projectId, defaults) {
  if (typeof window === 'undefined') {
    return clone(defaults);
  }

  try {
    const storedValue = window.localStorage.getItem(getConversationsStorageKey(projectId));
    if (!storedValue) {
      return clone(defaults);
    }

    const parsed = JSON.parse(storedValue);
    return Array.isArray(parsed) && parsed.length ? parsed : clone(defaults);
  } catch {
    return clone(defaults);
  }
}

export function saveCopilotConversations(projectId, conversations) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getConversationsStorageKey(projectId), JSON.stringify(conversations));
}
