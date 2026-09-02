export const DEFAULT_PET_ID = 'dojo-001';

const PET_CONTEXT_TOOLS = new Set([
  'get_pet_profile',
  'get_daily_needs',
  'save_care_plan',
  'list_care_plans',
]);

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const getToday = () => getLocalDateString();

function parseArguments(rawParams) {
  if (rawParams === undefined || rawParams === null || rawParams === '') return {};
  if (typeof rawParams === 'string') return parseArguments(JSON.parse(rawParams));
  if (typeof rawParams !== 'object' || Array.isArray(rawParams)) return rawParams;
  if ('arguments' in rawParams && Object.keys(rawParams).length === 1) return parseArguments(rawParams.arguments);
  if ('input' in rawParams && Object.keys(rawParams).length === 1) return parseArguments(rawParams.input);
  return rawParams;
}

export function normalizeToolParams(toolName, rawParams) {
  const parsed = parseArguments(rawParams);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return parsed;
  const params = { ...parsed };
  if (params.petId === undefined && params.pet_id !== undefined) params.petId = params.pet_id;
  if (params.serviceType === undefined && params.service_type !== undefined) params.serviceType = params.service_type;
  delete params.pet_id;
  delete params.service_type;
  if (PET_CONTEXT_TOOLS.has(toolName) && !params.petId) params.petId = DEFAULT_PET_ID;
  if (toolName === 'get_daily_needs' && !params.date) params.date = getToday();
  return params;
}
