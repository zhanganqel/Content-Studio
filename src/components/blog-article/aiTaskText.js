// 工作流任务文案支持中英文双字段，英文优先读取 En 后缀。
export function getLocalizedTaskText(item, field, locale) {
  const localizedField = `${field}En`;

  if (locale === 'en-US' && item?.[localizedField]) {
    return item[localizedField];
  }

  return item?.[field] ?? '';
}

export function getTaskName(item, locale) {
  return getLocalizedTaskText(item, 'taskName', locale);
}

// 运行中文案缺失时回退到任务名称，避免步骤标题为空。
export function getTaskRunningText(item, locale) {
  return getLocalizedTaskText(item, 'runningText', locale) || getTaskName(item, locale);
}

// 完成文案缺失时用任务名称和状态文本组合生成。
export function getTaskCompletedText(item, stateText, locale) {
  return getLocalizedTaskText(item, 'completedText', locale) || formatTaskState(getTaskName(item, locale), stateText, locale);
}

export function formatTaskState(taskName, stateText, locale) {
  return locale === 'en-US' ? `${stateText}: ${taskName}` : `${taskName}${stateText}`;
}
