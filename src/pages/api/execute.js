import { verifyApprovalToken } from '../../server/approval.js';
import { executeTool, ToolInputError } from '../../server/tools.js';
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
    const body = req.body || {};
    const tool = body.tool || body.name;
    const rawParams = body.params ?? body.arguments ?? body.input ?? {};
    if (typeof tool !== 'string' || !tool.trim()) return res.status(400).json({ success: false, error: 'tool is required' });
    const normalizedTool = tool.trim();
    const params = normalizeToolParams(normalizedTool, rawParams);
    let approvalVerified = false;
    if (normalizedTool === 'save_care_plan') {
      const approval = verifyApprovalToken(params?.approvalToken, { petId: params?.petId || 'dojo-001', plan: params?.plan }, { consume: true });
      if (!approval.valid) return res.status(403).json({ success: false, error: approval.error });
      approvalVerified = true;
    }
    const result = await executeTool(normalizedTool, params, { approvalVerified });
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    const status = error instanceof ToolInputError ? 400 : 500;
    return res.status(status).json({ success: false, error: error.message || 'Tool execution failed.' });
  }
}
