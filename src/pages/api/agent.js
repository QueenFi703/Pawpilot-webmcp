import { executeTool } from '../../server/tools.js';

const PET_ID = 'dojo-001';
const OPENAI_URL = 'https://api.openai.com/v1/responses';
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna';

const tools = [
  { type: 'function', name: 'get_pet_profile', description: 'Retrieve the current pet profile.', parameters: { type: 'object', properties: { petId: { type: 'string' } }, required: ['petId'], additionalProperties: false }, strict: true },
  { type: 'function', name: 'get_daily_needs', description: "Get today's care checklist.", parameters: { type: 'object', properties: { petId: { type: 'string' }, date: { type: 'string' } }, required: ['petId', 'date'], additionalProperties: false }, strict: true },
  { type: 'function', name: 'find_pet_services', description: 'Find veterinary, grooming, training, or boarding services.', parameters: { type: 'object', properties: { serviceType: { type: 'string', enum: ['veterinary', 'grooming', 'training', 'boarding'] } }, required: ['serviceType'], additionalProperties: false }, strict: true },
  { type: 'function', name: 'find_pet_products', description: 'Find food, treats, toys, or bedding.', parameters: { type: 'object', properties: { category: { type: 'string', enum: ['food', 'treats', 'toys', 'bedding'] } }, required: ['category'], additionalProperties: false }, strict: true },
  { type: 'function', name: 'save_care_plan', description: 'Save a care plan only after explicit human confirmation.', parameters: { type: 'object', properties: { petId: { type: 'string' }, plan: { type: 'object', additionalProperties: true }, confirmed: { type: 'boolean' } }, required: ['petId', 'plan', 'confirmed'], additionalProperties: false }, strict: true }
];

const instructions = `You are PawPilot, a calm and practical pet-care assistant.\n- Answer naturally and concisely.\n- Use tools when the request needs PawPilot data or an action.\n- The current demo pet is ${PET_ID}. If the user says my dog or my pet without another identity, use ${PET_ID}.\n- Never invent pet, service, or product facts.\n- Never save a care plan unless confirmed=true.\n- If saving has not been explicitly confirmed, propose the plan and ask for confirmation.`;

async function callOpenAI(input) {
  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, instructions, input, tools, tool_choice: 'auto', store: false })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `OpenAI request failed (${response.status})`);
  return payload;
}

async function runTool(name, args) {
  if (name === 'save_care_plan' && args.confirmed !== true) return { success: false, requiresConfirmation: true, error: 'Human confirmation is required before saving a care plan.' };
  return executeTool(name, args);
}

function responseText(response) {
  if (typeof response.output_text === 'string') return response.output_text;
  return (response.output || []).filter((item) => item.type === 'message').flatMap((item) => item.content || []).filter((part) => part.type === 'output_text').map((part) => part.text).join('');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' });

  try {
    const { message, history = [] } = req.body || {};
    if (!message?.trim()) return res.status(400).json({ error: 'Missing message' });

    let input = [...history.slice(-10).map((item) => ({ role: item.role === 'assistant' ? 'assistant' : 'user', content: item.text })), { role: 'user', content: message.trim() }];
    const toolCalls = [];

    for (let turn = 0; turn < 5; turn += 1) {
      const response = await callOpenAI(input);
      const functionCalls = (response.output || []).filter((item) => item.type === 'function_call');
      if (functionCalls.length === 0) return res.status(200).json({ success: true, text: responseText(response), toolCalls, model: MODEL });

      input = [...input, ...response.output];
      for (const call of functionCalls) {
        let args;
        try { args = JSON.parse(call.arguments || '{}'); } catch { args = {}; }
        const result = await runTool(call.name, args);
        toolCalls.push({ name: call.name, arguments: args, result });
        input.push({ type: 'function_call_output', call_id: call.call_id, output: JSON.stringify(result) });
      }
    }

    return res.status(500).json({ error: 'Tool execution loop exceeded the safety limit.' });
  } catch (error) {
    console.error('PawPilot agent error:', error);
    return res.status(500).json({ error: error.message || 'Agent request failed.' });
  }
}
