import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createContentResetState,
  createOutlineResetState,
  createPlanningResetState,
} from '../src/services/blogArticleAiStageData.js';

test('collaborative stage reset data removes downstream artifacts and playback', () => {
  const planning = createPlanningResetState('2026-07-16');
  const outline = createOutlineResetState('2026-07-16');
  const content = createContentResetState('2026-07-16');

  assert.deepEqual(planning.playback.visibleThinkingCounts, {});
  assert.deepEqual(outline.titleOptions, []);
  assert.deepEqual(outline.playback.visibleArtifactIds, []);
  assert.equal(content.finalArticle, null);
  assert.equal(content.savedArticleId, '');
  assert.deepEqual(content.playback.visibleArtifactIds, []);
});
