import { executeTool, ToolInputError } from '../../server/tools.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { tool, name, params } = req.body || {};
      const toolName = tool || name;

      if (!toolName || !params) {
        return res
          .status(400)
          .json({ success: false, error: 'Missing tool or params' });
      }

      const result = await executeTool(toolName, params);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
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
