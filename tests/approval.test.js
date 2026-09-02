import test from 'node:test';
import assert from 'node:assert/strict';

process.env.PAWPILOT_APPROVAL_SECRET = 'test-only-secret-do-not-use-in-production';
const { createApprovalToken, verifyApprovalToken } = await import('../src/server/approval.js');

const plan = {
  title: 'Daily care',
  tasks: [{ id: 1, name: 'Morning walk', completed: false, time: '08:00' }],
};

test('creates and verifies an approval token', () => {
  const token = createApprovalToken({ petId: 'dojo-001', plan });
  assert.equal(verifyApprovalToken(token, { petId: 'dojo-001', plan }).valid, true);
});
test('rejects a token for another pet', () => {
  const token = createApprovalToken({ petId: 'dojo-001', plan });
  const result = verifyApprovalToken(token, { petId: 'other-pet', plan });
  assert.equal(result.valid, false);
  assert.match(result.error, /pet/i);
});
test('rejects a token for a modified plan', () => {
  const token = createApprovalToken({ petId: 'dojo-001', plan });
  const result = verifyApprovalToken(token, { petId: 'dojo-001', plan: { ...plan, title: 'Changed after approval' } });
  assert.equal(result.valid, false);
  assert.match(result.error, /care plan/i);
});
test('rejects a tampered token', () => {
  const token = createApprovalToken({ petId: 'dojo-001', plan });
  const result = verifyApprovalToken(`${token.slice(0, -1)}x`, { petId: 'dojo-001', plan });
  assert.equal(result.valid, false);
  assert.match(result.error, /signature/i);
});
test('consumes a token when verification is requested as one-time', () => {
  const token = createApprovalToken({ petId: 'dojo-001', plan });
  const first = verifyApprovalToken(token, { petId: 'dojo-001', plan }, { consume: true });
  const second = verifyApprovalToken(token, { petId: 'dojo-001', plan }, { consume: true });
  assert.equal(first.valid, true);
  assert.equal(second.valid, false);
  assert.match(second.error, /already been used/i);
});
