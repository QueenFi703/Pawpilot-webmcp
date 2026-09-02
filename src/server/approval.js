import crypto from 'node:crypto';

const TOKEN_VERSION = 'v1';
const TOKEN_TTL_SECONDS = 5 * 60;
const usedNonces = new Map();

function getApprovalSecret() {
  const secret = process.env.PAWPILOT_APPROVAL_SECRET || process.env.NEXTAUTH_SECRET || process.env.NETLIFY_DATABASE_URL;
  if (!secret) throw new Error('PawPilot approval signing secret is not configured. Set PAWPILOT_APPROVAL_SECRET.');
  return secret;
}
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') return Object.keys(value).sort().reduce((result, key) => { result[key] = canonicalize(value[key]); return result; }, {});
  return value;
}
export function hashApprovalPayload({ petId, plan }) {
  const canonical = JSON.stringify(canonicalize({ petId, plan }));
  return crypto.createHash('sha256').update(canonical).digest('hex');
}
function sign(value) { return crypto.createHmac('sha256', getApprovalSecret()).update(value).digest('base64url'); }
function encode(payload) { return Buffer.from(JSON.stringify(payload)).toString('base64url'); }
function decode(value) { return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')); }
function pruneUsedNonces(now) { for (const [nonce, expiresAt] of usedNonces) if (expiresAt <= now) usedNonces.delete(nonce); }

export function createApprovalToken({ petId, plan }) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { v: TOKEN_VERSION, iat: now, exp: now + TOKEN_TTL_SECONDS, nonce: crypto.randomUUID(), petId, planHash: hashApprovalPayload({ petId, plan }) };
  const encoded = encode(payload);
  return `${encoded}.${sign(encoded)}`;
}

export function verifyApprovalToken(token, { petId, plan }, { consume = false } = {}) {
  if (typeof token !== 'string') return { valid: false, error: 'Approval token is required.' };
  const [encoded, suppliedSignature] = token.split('.');
  if (!encoded || !suppliedSignature) return { valid: false, error: 'Approval token has an invalid format.' };
  const expectedSignature = sign(encoded);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (suppliedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) return { valid: false, error: 'Approval token signature is invalid.' };
  let payload;
  try { payload = decode(encoded); } catch { return { valid: false, error: 'Approval token payload is invalid.' }; }
  const now = Math.floor(Date.now() / 1000);
  pruneUsedNonces(now);
  if (payload.v !== TOKEN_VERSION || typeof payload.exp !== 'number' || payload.exp < now) return { valid: false, error: 'Approval token has expired.' };
  if (typeof payload.nonce !== 'string' || !payload.nonce) return { valid: false, error: 'Approval token nonce is invalid.' };
  if (usedNonces.has(payload.nonce)) return { valid: false, error: 'Approval token has already been used.' };
  if (payload.petId !== petId) return { valid: false, error: 'Approval token does not match this pet.' };
  const expectedPlanHash = hashApprovalPayload({ petId, plan });
  if (payload.planHash !== expectedPlanHash) return { valid: false, error: 'Approval token does not match this care plan.' };
  if (consume) usedNonces.set(payload.nonce, payload.exp);
  return { valid: true, payload };
}
