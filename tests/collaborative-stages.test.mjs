import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCollaborativeStageAvailability,
  getCollaborativeStageStatuses,
  isCollaborativeStageRunning,
} from '../src/components/blog-article/collaborativeStages.js';

test('collaborative stages expose completed, stopped, running, and unavailable states', () => {
  assert.deepEqual(getCollaborativeStageStatuses(null), {
    content: 'unavailable',
    create: 'running',
    outline: 'unavailable',
    planning: 'unavailable',
  });

  assert.deepEqual(
    getCollaborativeStageStatuses({
      content: { playback: { currentTaskIndex: 2 } },
      mode: 'collaborative',
      outline: { playback: { isComplete: true } },
      planning: { playback: { isComplete: true } },
      stage: 'content',
    }),
    {
      content: 'running',
      create: 'completed',
      outline: 'completed',
      planning: 'completed',
    },
  );

  assert.equal(
    getCollaborativeStageStatuses({
      mode: 'collaborative',
      outline: { isStopped: true, playback: { currentTaskIndex: 1 } },
      planning: { playback: { isComplete: true } },
      stage: 'outline-stopped',
    }).outline,
    'stopped',
  );
});

test('collaborative task only unlocks persisted stages', () => {
  assert.deepEqual(getCollaborativeStageAvailability(null), {
    content: false,
    create: true,
    outline: false,
    planning: false,
  });

  assert.deepEqual(
    getCollaborativeStageAvailability({
      mode: 'collaborative',
      planning: { playback: { currentTaskIndex: 3 } },
      stage: 'planning-completed',
    }),
    {
      content: false,
      create: true,
      outline: false,
      planning: true,
    },
  );

  assert.deepEqual(
    getCollaborativeStageAvailability({
      content: { playback: { currentTaskIndex: 2 } },
      mode: 'collaborative',
      outline: { playback: { currentTaskIndex: 4 } },
      planning: { playback: { currentTaskIndex: 3 } },
      stage: 'content-stopped',
    }),
    {
      content: true,
      create: true,
      outline: true,
      planning: true,
    },
  );
});

test('only an active collaborative generation runs in the background', () => {
  assert.equal(isCollaborativeStageRunning({ mode: 'collaborative', stage: 'planning' }), true);
  assert.equal(isCollaborativeStageRunning({ mode: 'collaborative', stage: 'outline-stopped' }), false);
  assert.equal(isCollaborativeStageRunning({ mode: 'collaborative', stage: 'content-completed' }), false);
  assert.equal(isCollaborativeStageRunning({ mode: 'auto', stage: 'content' }), false);
});
