import { tools } from '../../server/tools.js';

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Return available tools for WebMCP discovery
    res.status(200).json({ tools });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
