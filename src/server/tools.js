import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { carePlans } from '../../db/schema';
import { miloProfile, dailyNeeds, petServices, petProducts } from '../data/pets.js';
import { DEFAULT_PET_ID, getToday, normalizeToolParams } from '../shared/tool-input.js';

const petIdSchema = {
  type: 'string',
  description: 'Stable pet identifier. Milo is milo-001.',
  minLength: 1,
  default: DEFAULT_PET_ID
};

export const tools = [
  {
    name: 'get_pet_profile',
    description: 'Retrieve Milo’s pet profile, including medical notes, allergies, and preferences. petId defaults to milo-001.',
    inputSchema: {
      type: 'object',
      properties: { petId: petIdSchema },
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  {
    name: 'get_daily_needs',
    description: 'Get Milo’s care checklist. petId defaults to milo-001 and date defaults to today.',
    inputSchema: {
      type: 'object',
      properties: {
        petId: petIdSchema,
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format. Defaults to today.',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          default: getToday()
        }
      },
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  {
    name: 'find_pet_services',
    description: 'Find matching veterinary, grooming, training, or boarding services.',
    inputSchema: {
      type: 'object',
      properties: {
        serviceType: {
          type: 'string',
          enum: ['veterinary', 'grooming', 'training', 'boarding']
        }
      },
      required: ['serviceType'],
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  {
    name: 'find_pet_products',
    description: 'Find matching food, treats, toys, or bedding for a pet.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['food', 'treats', 'toys', 'bedding']
        }
      },
      required: ['category'],
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  {
    name: 'save_care_plan',
    description: 'Persist an approved care plan. Call only after the user explicitly approves saving it.',
    inputSchema: {
      type: 'object',
      properties: {
        petId: petIdSchema,
        plan: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 120 },
            tasks: { type: 'array', items: { type: 'object' } },
            services: { type: 'array', items: { type: 'object' } },
            products: { type: 'array', items: { type: 'object' } }
          },
          required: ['title', 'tasks'],
          additionalProperties: false
        }
      },
      required: ['plan'],
      additionalProperties: false
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    }
  },
  {
    name: 'list_care_plans',
    description: 'List Milo’s saved care plans, newest first. petId defaults to milo-001.',
    inputSchema: {
      type: 'object',
      properties: { petId: petIdSchema },
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, openWorldHint: false }
  }
];

const toolByName = new Map(tools.map((tool) => [tool.name, tool]));

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ToolInputError(`${label} must be an object`);
  }
}

function validateParams(toolName, params) {
  assertObject(params, 'params');
  const schema = toolByName.get(toolName)?.inputSchema;
  if (!schema) throw new ToolInputError(`Unknown tool: ${toolName}`);

  for (const required of schema.required || []) {
    if (params[required] === undefined || params[required] === '') {
      throw new ToolInputError(`Missing required parameter: ${required}`);
    }
  }

  const allowed = new Set(Object.keys(schema.properties || {}));
  const unknown = Object.keys(params).find((key) => !allowed.has(key));
  if (unknown) throw new ToolInputError(`Unknown parameter: ${unknown}`);

  for (const [key, property] of Object.entries(schema.properties || {})) {
    const value = params[key];
    if (value === undefined) continue;
    if (property.type === 'string' && typeof value !== 'string') {
      throw new ToolInputError(`${key} must be a string`);
    }
    if (property.enum && !property.enum.includes(value)) {
      throw new ToolInputError(`${key} must be one of: ${property.enum.join(', ')}`);
    }
    if (property.pattern && !new RegExp(property.pattern).test(value)) {
      throw new ToolInputError(`${key} has an invalid format`);
    }
    if (property.type === 'object') assertObject(value, key);
  }

  if (toolName === 'save_care_plan') {
    const { plan } = params;
    if (typeof plan.title !== 'string' || !plan.title.trim()) {
      throw new ToolInputError('plan.title is required');
    }
    if (!Array.isArray(plan.tasks)) throw new ToolInputError('plan.tasks must be an array');
    for (const collection of ['services', 'products']) {
      if (plan[collection] !== undefined && !Array.isArray(plan[collection])) {
        throw new ToolInputError(`plan.${collection} must be an array`);
      }
    }
  }
}

export class ToolInputError extends Error {}

export async function executeTool(toolName, rawParams) {
  let params;
  try {
    params = normalizeToolParams(toolName, rawParams);
  } catch {
    throw new ToolInputError('Tool arguments must be valid JSON');
  }
  validateParams(toolName, params);

  switch (toolName) {
    case 'get_pet_profile':
      return getPetProfile(params.petId);
    case 'get_daily_needs':
      return getDailyNeeds(params.petId, params.date);
    case 'find_pet_services':
      return { success: true, data: petServices.filter((service) => service.type === params.serviceType) };
    case 'find_pet_products':
      return { success: true, data: petProducts.filter((product) => product.category === params.category) };
    case 'save_care_plan':
      return saveCarePlan(params.petId, params.plan);
    case 'list_care_plans':
      return listCarePlans(params.petId);
    default:
      throw new ToolInputError(`Unknown tool: ${toolName}`);
  }
}

function getPetProfile(petId) {
  if (petId !== miloProfile.id) return { success: false, error: 'Pet not found' };
  return { success: true, data: miloProfile };
}

function getDailyNeeds(petId, date) {
  if (petId !== miloProfile.id) return { success: false, error: 'Pet not found' };
  return {
    success: true,
    data: { ...dailyNeeds, date: date || new Date().toISOString().slice(0, 10) }
  };
}

async function saveCarePlan(petId, plan) {
  if (petId !== miloProfile.id) return { success: false, error: 'Pet not found' };
  const normalizedPlan = {
    title: plan.title.trim(),
    tasks: plan.tasks,
    services: plan.services || [],
    products: plan.products || []
  };
  const [saved] = await db
    .insert(carePlans)
    .values({ petId, title: normalizedPlan.title, plan: normalizedPlan })
    .returning();

  return { success: true, data: saved };
}

async function listCarePlans(petId) {
  if (petId !== miloProfile.id) return { success: false, error: 'Pet not found' };
  const plans = await db
    .select()
    .from(carePlans)
    .where(eq(carePlans.petId, petId))
    .orderBy(desc(carePlans.createdAt));
  return { success: true, data: plans };
}
