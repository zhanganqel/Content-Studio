const databasePrefix = 'content-studio-db';
export const projectScopedStoreVersion = 1;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeProjectId(projectId) {
  return String(projectId || 'default');
}

export function getProjectTableStorageKey(projectId, tableName) {
  return `${databasePrefix}:v${projectScopedStoreVersion}:${normalizeProjectId(projectId)}:${tableName}`;
}

export function hasProjectTable(projectId, tableName) {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(getProjectTableStorageKey(projectId, tableName)) !== null;
}

export function readProjectTable(projectId, tableName, fallbackValue) {
  if (typeof window === 'undefined') {
    return clone(fallbackValue);
  }

  try {
    const raw = window.localStorage.getItem(getProjectTableStorageKey(projectId, tableName));
    if (!raw) return clone(fallbackValue);

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'data' in parsed) {
      return parsed.data ?? clone(fallbackValue);
    }

    return parsed ?? clone(fallbackValue);
  } catch {
    return clone(fallbackValue);
  }
}

export function writeProjectTable(projectId, tableName, data) {
  if (typeof window === 'undefined') {
    return data;
  }

  window.localStorage.setItem(
    getProjectTableStorageKey(projectId, tableName),
    JSON.stringify({
      data,
      schemaVersion: projectScopedStoreVersion,
      updatedAt: new Date().toISOString(),
    }),
  );
  return data;
}

export function removeProjectTable(projectId, tableName) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(getProjectTableStorageKey(projectId, tableName));
}

export function createProjectEntityId(prefix) {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${randomPart}`;
}
