const databasePrefix = 'content-studio-db';
export const projectScopedStoreVersion = 1;

// 使用深拷贝返回默认值，避免调用方修改 demo 数据引用。
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// 项目 ID 归一化后参与 localStorage key，保证每个项目独立存储。
function normalizeProjectId(projectId) {
  return String(projectId || 'default');
}

// 统一生成项目级表 key，后续迁移可通过版本号区分。
export function getProjectTableStorageKey(projectId, tableName) {
  return `${databasePrefix}:v${projectScopedStoreVersion}:${normalizeProjectId(projectId)}:${tableName}`;
}

// 判断某张项目表是否已有本地数据，用于决定是否注入 demo seed。
export function hasProjectTable(projectId, tableName) {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(getProjectTableStorageKey(projectId, tableName)) !== null;
}

// 读取项目级表，异常或无数据时返回 fallback 的拷贝。
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

// 写入项目级表时记录 schemaVersion 和更新时间，方便后续迁移。
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

// 删除指定项目表，不影响同项目的其他业务表。
export function removeProjectTable(projectId, tableName) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(getProjectTableStorageKey(projectId, tableName));
}

// 创建项目内实体 ID，优先使用浏览器原生 UUID。
export function createProjectEntityId(prefix) {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${randomPart}`;
}
