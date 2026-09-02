import { executeTool, tools } from '../../server/tools.js';
import { DEFAULT_PET_ID } from '../../shared/tool-input.js';

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY_PawPilot;

function toOpenAITool(tool) {
  return { type: 'function', name: tool.name, description: tool.description, parameters: toStrictOpenAISchema(tool.inputSchema), strict: true };
}
function toStrictOpenAISchema(schema) {
  if (!schema || typeof schema !== 'object') return schema;
  const result = { ...schema };
  if (schema.type === 'object') {
    const properties = Object.fromEntries(Object.entries(schema.properties || {}).map(([key, value]) => [key, toStrictOpenAISchema(value)]));
    result.properties = properties;
    result.required = Object.keys(properties);
    result.additionalProperties = false;
  }
  if (schema.type === 'array' && schema.items) result.items = toStrictOpenAISchema(schema.items);
  return result;
}

const openAITools = tools.filter((tool) => tool.name !== 'save_care_plan').map(toOpenAITool);
const instructions = `You are PawPilot, a calm and practical pet-care assistant.
- Answer naturally and concisely.
- Use tools when the request needs PawPilot data or an action.
- The current demo pet is ${DEFAULT_PET_ID}. If the user says my dog or my pet without another identity, use ${DEFAULT_PET_ID}.
- Never invent pet, service, or product facts.
- You may propose a care plan, but you must never save a care plan yourself.
- When a user wants to save a care plan, explain the proposed plan and let the PawPilot interface request explicit approval.
- Never claim a care plan was saved unless the save operation actually succeeded.`;

async function callOpenAI(input) {
  if (!OPENAI_API_KEY) throw new Error('PawPilot OpenAI credential is not configured on Netlify. Add a valid OpenAI API key as OPENAI_API_KEY_PawPilot.');
  const response = await fetch(OPENAI_URL, { method: 'POST', headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: MODEL, instructions, input, tools: openAITools, tool_choice: 'auto', store: false }) });
  const payload = await response.json();
  if (!response.ok) {
    const apiMessage = payload?.error?.message || `OpenAI request failed (${response.status})`;
    if (response.status === 401) throw new Error(`PawPilot could not authenticate with OpenAI. The Netlify OpenAI credential is invalid or is not an OpenAI API key. ${apiMessage}`);
    throw new Error(apiMessage);
  }
  return payload;
}
async function runTool(name, args) {
  if (name === 'save_care_plan') return { success: false, requiresConfirmation: true, error: 'Saving care plans is controlled by the PawPilot confirmation UI. Present the proposed plan and wait for the user to confirm.' };
  return executeTool(name, args);
}
function responseText(response) {
  if (typeof response.output_text === 'string') return response.output_text;
  return (response.output || []).filter((item) => item.type === 'message').flatMap((item) => item.content || []).filter((part) => part.type === 'output_text').map((part) => part.text).join('');
}
function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-10).filter((item) => item && typeof item.text === 'string').map((item) => ({ role: item.role === 'assistant' ? 'assistant' : 'user', content: item.text }));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'PawPilot OpenAI credential is not configured on Netlify. Add a valid OpenAI API key as OPENAI_API_KEY_PawPilot.' });
  try {
    const { message, history = [] } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'Missing message' });
    let input = [...normalizeHistory(history), { role: 'user', content: message.trim() }];
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
