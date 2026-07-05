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

export function getTaskRunningText(item, locale) {
  return getLocalizedTaskText(item, 'runningText', locale) || getTaskName(item, locale);
}

export function getTaskCompletedText(item, stateText, locale) {
  return getLocalizedTaskText(item, 'completedText', locale) || formatTaskState(getTaskName(item, locale), stateText, locale);
}

export function formatTaskState(taskName, stateText, locale) {
  return locale === 'en-US' ? `${stateText}: ${taskName}` : `${taskName}${stateText}`;
}
