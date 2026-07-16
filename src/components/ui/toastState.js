export const MAX_VISIBLE_TOASTS = 3;

export function createToastState() {
  return { queued: [], visible: [] };
}

export function findToast(state, id) {
  return [...state.visible, ...state.queued].find((toast) => toast.id === id) ?? null;
}

function promoteQueuedToasts(visible, queued) {
  const nextVisible = [...visible];
  const nextQueued = [...queued];

  while (nextVisible.length < MAX_VISIBLE_TOASTS && nextQueued.length) {
    nextVisible.push(nextQueued.shift());
  }

  return { queued: nextQueued, visible: nextVisible };
}

export function enqueueToast(state, toast) {
  const replaceToast = (items) => items.map((item) => (item.id === toast.id ? toast : item));

  if (state.visible.some((item) => item.id === toast.id)) {
    return { ...state, visible: replaceToast(state.visible) };
  }

  if (state.queued.some((item) => item.id === toast.id)) {
    return { ...state, queued: replaceToast(state.queued) };
  }

  if (state.visible.length < MAX_VISIBLE_TOASTS) {
    return { ...state, visible: [...state.visible, toast] };
  }

  return { ...state, queued: [...state.queued, toast] };
}

export function dismissToast(state, id) {
  const visible = state.visible.filter((toast) => toast.id !== id);
  const queued = state.queued.filter((toast) => toast.id !== id);
  return promoteQueuedToasts(visible, queued);
}

export function dismissToastScope(state, scope) {
  const visible = state.visible.filter((toast) => toast.scope !== scope);
  const queued = state.queued.filter((toast) => toast.scope !== scope);
  return promoteQueuedToasts(visible, queued);
}

export function dismissAllToasts() {
  return createToastState();
}
