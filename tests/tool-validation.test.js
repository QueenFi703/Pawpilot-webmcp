import test from 'node:test';
import assert from 'node:assert/strict';
import { ToolInputError, validateToolParams } from '../src/server/tools.js';

const validPlan = {
  title: 'Daily care plan',
  tasks: [{ id: 1, name: 'Morning walk', completed: false, time: '08:00' }],
  services: [],
  products: [],
};
const approved = { petId: 'dojo-001', plan: validPlan, confirmed: true, approvalToken: 'test-approval-token-1234567890' };
const options = { approvalVerified: true };

test('accepts a valid care plan when approval is verified', () => assert.doesNotThrow(() => validateToolParams('save_care_plan', approved, options)));
test('rejects missing confirmation', () => assert.throws(() => validateToolParams('save_care_plan', { ...approved, confirmed: false }, options), ToolInputError));
test('rejects missing approval verification', () => assert.throws(() => validateToolParams('save_care_plan', approved), /approval token is required/));
test('rejects arbitrary task properties', () => assert.throws(() => validateToolParams('save_care_plan', { ...approved, plan: { ...validPlan, tasks: [{ ...validPlan.tasks[0], arbitrary: 'not allowed' }] } }, options), /unknown property/));
test('rejects invalid service types', () => assert.throws(() => validateToolParams('save_care_plan', { ...approved, plan: { ...validPlan, services: [{ id: 'service-1', name: 'Bad service', type: 'something-else' }] } }, options), /plan.services\[0\]\.type/));
test('rejects an empty task list', () => assert.throws(() => validateToolParams('save_care_plan', { ...approved, plan: { ...validPlan, tasks: [] } }, options), /plan.tasks/));
test('rejects an invalid calendar date', () => assert.throws(() => validateToolParams('get_daily_needs', { petId: 'dojo-001', date: '2026-02-31' }), /date/));
test('rejects unknown top-level parameters', () => assert.throws(() => validateToolParams('get_pet_profile', { petId: 'dojo-001', admin: true }), /unknown property/i));
test('can validate an approval request before a token exists', () => assert.doesNotThrow(() => validateToolParams('save_care_plan', { petId: 'dojo-001', plan: validPlan, confirmed: true }, { approvalVerified: true, requireApprovalToken: false })));
