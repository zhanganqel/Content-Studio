import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_VISIBLE_TOASTS,
  createToastState,
  dismissToast,
  dismissToastScope,
  enqueueToast,
  findToast,
} from '../src/components/ui/toastState.js';

function toast(id, scope = 'page-a') {
  return { id, message: id, scope, version: 1 };
}

test('shows three toasts and queues later entries', () => {
  let state = createToastState();
  for (let index = 0; index < MAX_VISIBLE_TOASTS + 1; index += 1) {
    state = enqueueToast(state, toast(`toast-${index}`));
  }

  assert.deepEqual(state.visible.map((item) => item.id), ['toast-0', 'toast-1', 'toast-2']);
  assert.deepEqual(state.queued.map((item) => item.id), ['toast-3']);
});

test('promotes the next queued toast after dismissal', () => {
  let state = createToastState();
  for (let index = 0; index < 4; index += 1) {
    state = enqueueToast(state, toast(`toast-${index}`));
  }

  state = dismissToast(state, 'toast-1');

  assert.deepEqual(state.visible.map((item) => item.id), ['toast-0', 'toast-2', 'toast-3']);
  assert.deepEqual(state.queued, []);
});

test('updates an existing toast id instead of duplicating it', () => {
  let state = enqueueToast(createToastState(), toast('save', 'editor'));
  state = enqueueToast(state, { ...toast('save', 'editor'), message: 'Saved', version: 2 });

  assert.equal(state.visible.length, 1);
  assert.equal(findToast(state, 'save').message, 'Saved');
  assert.equal(findToast(state, 'save').version, 2);
});

test('removes a scoped persistent toast and promotes queued entries', () => {
  let state = createToastState();
  state = enqueueToast(state, toast('scoped', 'auto-task'));
  state = enqueueToast(state, toast('a', 'other'));
  state = enqueueToast(state, toast('b', 'other'));
  state = enqueueToast(state, toast('queued', 'other'));

  state = dismissToastScope(state, 'auto-task');

  assert.equal(findToast(state, 'scoped'), null);
  assert.deepEqual(state.visible.map((item) => item.id), ['a', 'b', 'queued']);
});
