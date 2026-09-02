import { createApprovalToken } from '../../server/approval.js';
import { ToolInputError, validateToolParams } from '../../server/tools.js';
import { normalizeToolParams } from '../../shared/tool-input.js';

function isAllowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers.host;
  if (!host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  if (!isAllowedOrigin(req)) return res.status(403).json({ success: false, error: 'Invalid request origin.' });
  try {
    const rawParams = req.body || {};
    const params = normalizeToolParams('save_care_plan', rawParams);
    if (!params?.plan) throw new ToolInputError('plan is required');
    if (params.confirmed !== true) throw new ToolInputError('Human confirmation is required before requesting approval.');
    validateToolParams('save_care_plan', params, { approvalVerified: true, requireApprovalToken: false });
    const token = createApprovalToken({ petId: params.petId, plan: params.plan });
    return res.status(200).json({ success: true, approvalToken: token, expiresInSeconds: 300 });
  } catch (error) {
    const status = error instanceof ToolInputError ? 400 : 500;
    return res.status(status).json({ success: false, error: error.message || 'Could not create approval token.' });
  }
}
