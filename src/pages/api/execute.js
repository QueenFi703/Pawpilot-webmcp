import { executeTool } from '../../server/tools.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { tool, params } = req.body;

      if (!tool || !params) {
        return res.status(400).json({ error: 'Missing tool or params' });
      }

      const result = await executeTool(tool, params);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
