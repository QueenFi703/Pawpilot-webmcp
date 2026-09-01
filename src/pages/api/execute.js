import { executeTool, ToolInputError } from '../../server/tools.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { tool, params } = req.body || {};

    if (typeof tool !== 'string' || !params) {
      return res.status(400).json({ success: false, error: 'tool and params are required' });
    }

    const result = await executeTool(tool, params);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    const status = error instanceof ToolInputError ? 400 : 500;
    return res.status(status).json({ success: false, error: error.message });
  }
}
