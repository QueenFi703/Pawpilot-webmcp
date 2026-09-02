import { tools } from '../../server/tools.js';

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
    return res.status(200).json({ protocol: 'WebMCP', version: '1', tools });
  }
  res.setHeader('Allow', 'GET');
  return res.status(405).json({ error: 'Method not allowed' });
}
