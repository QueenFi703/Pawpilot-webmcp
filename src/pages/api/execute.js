import { executeTool, ToolInputError } from '../../server/tools.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const tool = body.tool || body.name;
    const params = body.params ?? body.arguments ?? body.input ?? {};

    if (typeof tool !== 'string') {
      return res.status(400).json({ success: false, error: 'tool is required' });
    }

    const result = await executeTool(tool, params);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    const status = error instanceof ToolInputError ? 400 : 500;
    return res.status(status).json({ success: false, error: error.message });
  }
}
