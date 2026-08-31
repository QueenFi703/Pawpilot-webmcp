import { executeTool } from '../../server/tools.js';

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
  }
}
