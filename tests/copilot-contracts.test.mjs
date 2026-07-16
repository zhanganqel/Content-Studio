import assert from 'node:assert/strict';
import test from 'node:test';
import {
  copilotAttachmentLimits,
  createConversationId,
  createSseParser,
  parseSseFrame,
  uuidPattern,
  validateAttachments,
} from '../src/features/copilot/contracts.js';

function createAttachment(index, content = 'reference') {
  return {
    content,
    id: `knowledge-${index}`,
    kind: index % 2 ? 'knowledge_file' : 'knowledge_item',
    title: `Knowledge ${index}`,
  };
}

test('conversation IDs are direct UUID values', () => {
  const expected = '123e4567-e89b-42d3-a456-426614174000';
  assert.equal(createConversationId(() => expected), expected);
  assert.match(expected, uuidPattern);
  assert.equal(expected.length, 36);
});

test('attachment count, per-item size, total size, and duplicates are validated', () => {
  assert.equal(
    validateAttachments(
      Array.from({ length: copilotAttachmentLimits.maxAttachments }, (_, index) => createAttachment(index)),
    ).length,
    copilotAttachmentLimits.maxAttachments,
  );
  assert.throws(
    () => validateAttachments(
      Array.from({ length: copilotAttachmentLimits.maxAttachments + 1 }, (_, index) => createAttachment(index)),
    ),
    /maximum of 8 attachments/i,
  );
  assert.throws(
    () => validateAttachments([createAttachment(1, 'a'.repeat(12001))]),
    /too large/i,
  );
  assert.throws(
    () => validateAttachments(Array.from({ length: 5 }, (_, index) => createAttachment(index, 'a'.repeat(10000)))),
    /total attachment content is too large/i,
  );
  assert.throws(
    () => validateAttachments([createAttachment(1), createAttachment(1)]),
    /duplicate attachment/i,
  );
});

test('SSE parser handles frames split across network chunks', () => {
  const events = [];
  const parser = createSseParser((event) => events.push(event));
  parser.push('event: process_delta\ndata: {"type":"process_delta","content":"Analy');
  parser.push('zing"}\n\nevent: message_delta\ndata: {"type":"message_delta","content":"Hello"}\n\n');
  parser.push('event: done\ndata: {"type":"done","outcome":"completed"}');
  assert.equal(parser.finish(), 3);
  assert.deepEqual(events.map((event) => event.type), ['process_delta', 'message_delta', 'done']);
  assert.equal(events[0].content, 'Analyzing');
  assert.equal(events[2].outcome, 'completed');
});

test('error and completion events always retain their explicit type', () => {
  assert.deepEqual(
    parseSseFrame('event: error_message\ndata: {"content":"Gateway failed","code":"gateway_error"}'),
    { code: 'gateway_error', content: 'Gateway failed', type: 'error_message' },
  );
  assert.deepEqual(
    parseSseFrame('event: done\ndata: {"type":"done","outcome":"cancelled"}'),
    { outcome: 'cancelled', type: 'done' },
  );
});
