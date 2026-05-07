export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.POLYGON_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'POLYGON_API_KEY not configured' });

  const { path, ...queryParams } = req.query;
  if (!path) return res.status(400).json({ error: 'Missing path parameter' });

  const qs = new URLSearchParams({ ...queryParams, apiKey: API_KEY }).toString();
  const url = `https://api.polygon.io${path}?${qs}`;

  try {
    const upstream = await fetch(url);
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=15');
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Upstream fetch failed' });
  }
}
