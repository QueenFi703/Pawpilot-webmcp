import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PET_ID, getToday, normalizeToolParams } from '../src/shared/tool-input.js';

test('uses the canonical Dojo pet ID', () => assert.equal(DEFAULT_PET_ID, 'dojo-001'));
test('normalizes empty arguments', () => {
  const result = normalizeToolParams('get_daily_needs', {});
  assert.equal(result.petId, DEFAULT_PET_ID);
  assert.match(result.date, /^\d{4}-\d{2}-\d{2}$/);
});
test('normalizes JSON-string arguments', () => {
  const result = normalizeToolParams('get_daily_needs', '{"pet_id":"dojo-001","date":"2026-09-02"}');
  assert.deepEqual(result, { petId: 'dojo-001', date: '2026-09-02' });
});
test('normalizes MCP arguments wrapper', () => assert.deepEqual(normalizeToolParams('get_pet_profile', { arguments: '{"pet_id":"dojo-001"}' }), { petId: 'dojo-001' }));
test('normalizes input wrapper', () => assert.deepEqual(normalizeToolParams('get_pet_profile', { input: { pet_id: 'dojo-001' } }), { petId: 'dojo-001' }));
test('normalizes service_type alias', () => assert.deepEqual(normalizeToolParams('find_pet_services', { service_type: 'grooming' }), { serviceType: 'grooming' }));
test('getToday returns a local calendar date', () => assert.match(getToday(), /^\d{4}-\d{2}-\d{2}$/));
