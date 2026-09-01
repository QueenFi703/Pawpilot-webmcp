import OpenAI from 'openai';
import { executeTool } from '../../server/tools.js';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PET_ID = 'milo-001';

const tools = [
  {
    type: 'function',
    name: 'get_pet_profile',
    description: 'Retrieve the current pet profile with basic info, medical history, and preferences.',
    parameters: {
      type: 'object',
      properties: { petId: { type: 'string' } },
      required: ['petId'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_daily_needs',
    description: "Get today's care checklist derived from the pet's profile.",
    parameters: {
      type: 'object',
      properties: {
        petId: { type: 'string' },
        date: { type: 'string', description: 'Optional YYYY-MM-DD date.' },
      },
      required: ['petId', 'date'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'find_pet_services',
    description: 'Find available veterinary, grooming, training, or boarding services.',
    parameters: {
      type: 'object',
      properties: {
        serviceType: { type: 'string', enum: ['veterinary', 'grooming', 'training', 'boarding'] },
      },
      required: ['serviceType'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'find_pet_products',
    description: 'Find pet products by category: food, treats, toys, or bedding.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['food', 'treats', 'toys', 'bedding'] },
      },
      required: ['category'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'save_care_plan',
    description: 'Save a care plan only after the human has explicitly confirmed the proposed plan.',
    parameters: {
      type: 'object',
      properties: {
        petId: { type: 'string' },
        plan: { type: 'object', additionalProperties: true },
        confirmed: { type: 'boolean' },
      },
      required: ['petId', 'plan', 'confirmed'],
      additionalProperties: false,
    },
    strict: true,
  },
];

const instructions = `You are PawPilot, a calm and practical pet-care assistant.\n- Answer naturally and concisely.\n- Use the available tools when the user's request needs PawPilot data or an action.\n- The current demo pet is ${PET_ID}. If the user says "my dog" or "my pet" without another identity, use ${PET_ID}.\n- Never claim a tool was used unless it actually was.\n- Never save a care plan unless confirmed=true. If the user asks to save a plan but has not explicitly confirmed the proposed plan, prepare or explain the plan and request confirmation.\n- Do not invent pet facts, service results, or product results.`;

async function runTool(name, args) {
  if (name === 'save_care_plan' && args.confirmed !== true) {
    return {
      success: false,
      requiresConfirmation: true,
      error: 'Human confirmation is required before saving a care plan.',
    };
  }
  return executeTool(name, args);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
  }

  try {
    const { message, history = [] } = req.body || {};
    if (!message?.trim()) return res.status(400).json({ error: 'Missing message' });

    let input = [
      ...history.slice(-10).map((item) => ({
        role: item.role === 'assistant' ? 'assistant' : 'user',
        content: item.text,
      })),
      { role: 'user', content: message.trim() },
    ];

    const toolCalls = [];

    for (let turn = 0; turn < 5; turn += 1) {
      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
        instructions,
        input,
        tools,
        tool_choice: 'auto',
        store: false,
      });

      const functionCalls = response.output.filter((item) => item.type === 'function_call');

      if (functionCalls.length === 0) {
        return res.status(200).json({
          success: true,
          text: response.output_text,
          toolCalls,
          model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
        });
      }

      input = [...input, ...response.output];

      for (const call of functionCalls) {
        const args = JSON.parse(call.arguments || '{}');
        const result = await runTool(call.name, args);
        toolCalls.push({ name: call.name, arguments: args, result });
        input.push({
          type: 'function_call_output',
          call_id: call.call_id,
          output: JSON.stringify(result),
        });
      }
    }

    return res.status(500).json({ error: 'Tool execution loop exceeded the safety limit.' });
  } catch (error) {
    console.error('PawPilot agent error:', error);
    return res.status(500).json({ error: error.message || 'Agent request failed.' });
  }
}
