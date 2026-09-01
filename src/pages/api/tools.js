import { tools } from '../../server/tools.js';

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
    res.status(200).json({
      protocol: 'WebMCP',
      tools
    });
  } else {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
  }
}
