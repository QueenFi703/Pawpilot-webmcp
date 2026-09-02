import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { carePlans } from '../../db/schema';
import { dojoProfile, dailyNeeds, petServices, petProducts } from '../data/pets.js';
import { DEFAULT_PET_ID, getToday, normalizeToolParams } from '../shared/tool-input.js';

const PET_ID_DESCRIPTION = `Stable pet identifier. The demo pet is ${DEFAULT_PET_ID}.`;
const petIdSchema = { type: 'string', description: PET_ID_DESCRIPTION, minLength: 1, maxLength: 100, default: DEFAULT_PET_ID };
const dateSchema = { type: 'string', description: 'Date in YYYY-MM-DD format. Defaults to today.', pattern: '^\\d{4}-\\d{2}-\\d{2}$', default: getToday() };
const taskSchema = {
  type: 'object',
  properties: {
    id: { type: ['string', 'number'], description: 'Stable task identifier.' },
    name: { type: 'string', minLength: 1, maxLength: 200 },
    completed: { type: 'boolean' },
    time: { type: 'string', minLength: 1, maxLength: 20 },
  },
  required: ['id', 'name', 'completed', 'time'],
  additionalProperties: false,
};
const serviceSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1, maxLength: 100 },
    name: { type: 'string', minLength: 1, maxLength: 200 },
    type: { type: 'string', enum: ['veterinary', 'grooming', 'training', 'boarding'] },
  },
  required: ['id', 'name', 'type'],
  additionalProperties: false,
};
const productSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1, maxLength: 100 },
    name: { type: 'string', minLength: 1, maxLength: 200 },
    category: { type: 'string', enum: ['food', 'treats', 'toys', 'bedding'] },
  },
  required: ['id', 'name', 'category'],
  additionalProperties: false,
};
const carePlanSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 120 },
    tasks: { type: 'array', minItems: 1, maxItems: 100, items: taskSchema },
    services: { type: 'array', maxItems: 50, items: serviceSchema, default: [] },
    products: { type: 'array', maxItems: 50, items: productSchema, default: [] },
  },
  required: ['title', 'tasks'],
  additionalProperties: false,
};

export const tools = [
  {
    name: 'get_pet_profile',
    title: 'Get pet profile',
    description: `Retrieve ${dojoProfile.name}'s pet profile, including basic care information and preferences.`,
    inputSchema: { type: 'object', properties: { petId: petIdSchema }, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_daily_needs',
    title: 'Get daily care needs',
    description: `Get ${dojoProfile.name}'s dated care checklist. petId defaults to ${DEFAULT_PET_ID} and date defaults to today.`,
    inputSchema: { type: 'object', properties: { petId: petIdSchema, date: dateSchema }, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'find_pet_services',
    title: 'Find pet services',
    description: 'Find matching veterinary, grooming, training, or boarding services.',
    inputSchema: { type: 'object', properties: { serviceType: { type: 'string', enum: ['veterinary', 'grooming', 'training', 'boarding'] } }, required: ['serviceType'], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'find_pet_products',
    title: 'Find pet products',
    description: 'Find matching food, treats, toys, or bedding for the pet.',
    inputSchema: { type: 'object', properties: { category: { type: 'string', enum: ['food', 'treats', 'toys', 'bedding'] } }, required: ['category'], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'save_care_plan',
    title: 'Save approved care plan',
    description: 'Persist a care plan only after the user explicitly approves the exact proposed plan. A valid one-time approval token is also required.',
    inputSchema: {
      type: 'object',
      properties: {
        petId: petIdSchema,
        plan: carePlanSchema,
        confirmed: { type: 'boolean', description: 'Must be true after explicit human approval.' },
        approvalToken: { type: 'string', minLength: 20, maxLength: 500, description: 'One-time server-issued approval token for this exact plan.' },
      },
      required: ['plan', 'confirmed', 'approvalToken'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  {
    name: 'list_care_plans',
    title: 'List saved care plans',
    description: `List ${dojoProfile.name}'s saved care plans, newest first. petId defaults to ${DEFAULT_PET_ID}.`,
    inputSchema: { type: 'object', properties: { petId: petIdSchema }, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];

const toolByName = new Map(tools.map((tool) => [tool.name, tool]));
export function getTool(toolName) { return toolByName.get(toolName); }
export function getToolNames() { return tools.map((tool) => tool.name); }

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ToolInputError(`${label} must be an object`);
}
function assertString(value, label, { minLength = 0, maxLength = Infinity } = {}) {
  if (typeof value !== 'string') throw new ToolInputError(`${label} must be a string`);
  if (value.length < minLength) throw new ToolInputError(`${label} must contain at least ${minLength} characters`);
  if (value.length > maxLength) throw new ToolInputError(`${label} must contain at most ${maxLength} characters`);
}
function assertBoolean(value, label) { if (typeof value !== 'boolean') throw new ToolInputError(`${label} must be a boolean`); }
function assertEnum(value, label, values) { if (!values.includes(value)) throw new ToolInputError(`${label} must be one of: ${values.join(', ')}`); }
function assertArray(value, label, { minLength = 0, maxLength = Infinity } = {}) {
  if (!Array.isArray(value)) throw new ToolInputError(`${label} must be an array`);
  if (value.length < minLength) throw new ToolInputError(`${label} must contain at least ${minLength} item(s)`);
  if (value.length > maxLength) throw new ToolInputError(`${label} must contain at most ${maxLength} item(s)`);
}
function assertDate(value, label) {
  assertString(value, label, { minLength: 10, maxLength: 10 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ToolInputError(`${label} has an invalid format`);
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new ToolInputError(`${label} is not a valid calendar date`);
}
function assertNoUnknownKeys(value, allowedKeys, label) {
  const allowed = new Set(allowedKeys);
  const unknown = Object.keys(value).find((key) => !allowed.has(key));
  if (unknown) throw new ToolInputError(`${label} contains unknown property: ${unknown}`);
}
function validateTask(task, index) {
  const label = `plan.tasks[${index}]`;
  assertObject(task, label);
  assertNoUnknownKeys(task, ['id', 'name', 'completed', 'time'], label);
  if (typeof task.id !== 'string' && typeof task.id !== 'number') throw new ToolInputError(`${label}.id must be a string or number`);
  assertString(task.name, `${label}.name`, { minLength: 1, maxLength: 200 });
  assertBoolean(task.completed, `${label}.completed`);
  assertString(task.time, `${label}.time`, { minLength: 1, maxLength: 20 });
}
function validateService(service, index) {
  const label = `plan.services[${index}]`;
  assertObject(service, label);
  assertNoUnknownKeys(service, ['id', 'name', 'type'], label);
  assertString(service.id, `${label}.id`, { minLength: 1, maxLength: 100 });
  assertString(service.name, `${label}.name`, { minLength: 1, maxLength: 200 });
  assertEnum(service.type, `${label}.type`, ['veterinary', 'grooming', 'training', 'boarding']);
}
function validateProduct(product, index) {
  const label = `plan.products[${index}]`;
  assertObject(product, label);
  assertNoUnknownKeys(product, ['id', 'name', 'category'], label);
  assertString(product.id, `${label}.id`, { minLength: 1, maxLength: 100 });
  assertString(product.name, `${label}.name`, { minLength: 1, maxLength: 200 });
  assertEnum(product.category, `${label}.category`, ['food', 'treats', 'toys', 'bedding']);
}
function validateCarePlan(plan) {
  assertObject(plan, 'plan');
  assertNoUnknownKeys(plan, ['title', 'tasks', 'services', 'products'], 'plan');
  assertString(plan.title, 'plan.title', { minLength: 1, maxLength: 120 });
  assertArray(plan.tasks, 'plan.tasks', { minLength: 1, maxLength: 100 });
  plan.tasks.forEach(validateTask);
  if (plan.services !== undefined) { assertArray(plan.services, 'plan.services', { maxLength: 50 }); plan.services.forEach(validateService); }
  if (plan.products !== undefined) { assertArray(plan.products, 'plan.products', { maxLength: 50 }); plan.products.forEach(validateProduct); }
}

export function validateToolParams(toolName, params, options = {}) {
  assertObject(params, 'params');
  const tool = toolByName.get(toolName);
  if (!tool) throw new ToolInputError(`Unknown tool: ${toolName}`);
  const properties = tool.inputSchema.properties || {};
  assertNoUnknownKeys(params, Object.keys(properties), 'params');
  for (const required of tool.inputSchema.required || []) if (params[required] === undefined || params[required] === '') throw new ToolInputError(`Missing required parameter: ${required}`);
  for (const [key, property] of Object.entries(properties)) {
    const value = params[key];
    if (value === undefined) continue;
    if (property.type === 'string') assertString(value, key, { minLength: property.minLength || 0, maxLength: property.maxLength || Infinity });
    if (property.type === 'boolean') assertBoolean(value, key);
    if (property.enum) assertEnum(value, key, property.enum);
    if (property.pattern && !new RegExp(property.pattern).test(value)) throw new ToolInputError(`${key} has an invalid format`);
    if (key === 'date') assertDate(value, key);
    if (key === 'plan') validateCarePlan(value);
  }
  if (toolName === 'save_care_plan') {
    if (params.confirmed !== true) throw new ToolInputError('Human confirmation is required before saving a care plan.');
    if (!options.approvalVerified) throw new ToolInputError('A valid approval token is required before saving a care plan.');
  }
  return params;
}

export class ToolInputError extends Error { constructor(message) { super(message); this.name = 'ToolInputError'; } }

export async function executeTool(toolName, rawParams, options = {}) {
  let params;
  try { params = normalizeToolParams(toolName, rawParams); } catch { throw new ToolInputError('Tool arguments must be valid JSON'); }
  validateToolParams(toolName, params, options);
  switch (toolName) {
    case 'get_pet_profile': return getPetProfile(params.petId);
    case 'get_daily_needs': return getDailyNeeds(params.petId, params.date);
    case 'find_pet_services': return { success: true, data: petServices.filter((service) => service.type === params.serviceType) };
    case 'find_pet_products': return { success: true, data: petProducts.filter((product) => product.category === params.category) };
    case 'save_care_plan': return saveCarePlan(params.petId, params.plan);
    case 'list_care_plans': return listCarePlans(params.petId);
    default: throw new ToolInputError(`Unknown tool: ${toolName}`);
  }
}
function getPetProfile(petId) { if (petId !== dojoProfile.id) return { success: false, error: 'Pet not found' }; return { success: true, data: dojoProfile }; }
function getDailyNeeds(petId, date) { if (petId !== dojoProfile.id) return { success: false, error: 'Pet not found' }; return { success: true, data: { ...dailyNeeds, date: date || getToday() } }; }
async function saveCarePlan(petId, plan) {
  if (petId !== dojoProfile.id) return { success: false, error: 'Pet not found' };
  const normalizedPlan = { title: plan.title.trim(), tasks: plan.tasks, services: plan.services || [], products: plan.products || [] };
  const [saved] = await db.insert(carePlans).values({ petId, title: normalizedPlan.title, plan: normalizedPlan }).returning();
  return { success: true, data: saved };
}
async function listCarePlans(petId) {
  if (petId !== dojoProfile.id) return { success: false, error: 'Pet not found' };
  const plans = await db.select().from(carePlans).where(eq(carePlans.petId, petId)).orderBy(desc(carePlans.createdAt));
  return { success: true, data: plans };
}
