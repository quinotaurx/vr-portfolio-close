// api/polygon-close.js
// Returns PREVIOUS DAY CLOSING PRICE for ALL US tickers
// Uses Polygon /v2/aggs/prev endpoint
// Falls back to Yahoo Finance for tickers not available on Polygon Free tier

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing POLYGON_API_KEY' });

  const { tickers } = req.query;
  if (!tickers) return res.status(400).json({ error: 'Missing tickers param' });

  const symbolList = tickers.split(',').map(s => s.trim()).filter(Boolean);

  const results = await Promise.all(
    symbolList.map(async (sym) => {
      // Try Polygon first
      try {
        const url = `https://api.polygon.io/v2/aggs/ticker/${sym}/prev?adjusted=true&apiKey=${apiKey}`;
        const r = await fetch(url);
        if (r.ok) {
          const data = await r.json();
          const result = data?.results?.[0];
          if (result?.c) {
            return { ticker: sym, prevClose: result.c, source: 'polygon' };
          }
        }
      } catch(e) {}

      // Fallback to Yahoo Finance
      try {
        const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`;
        const yr = await fetch(yUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json'
          }
        });
        if (yr.ok) {
          const yData = await yr.json();
          const meta = yData?.chart?.result?.[0]?.meta;
          const prevClose = meta?.regularMarketPrice || meta?.chartPreviousClose || meta?.previousClose;
          if (prevClose) {
            return { ticker: sym, prevClose, source: 'yahoo' };
          }
        }
      } catch(e) {}

      return { ticker: sym, error: 'no data' };
    })
  );

  const output = {};
  results.forEach(r => {
    if (r.prevClose) {
      output[r.ticker] = {
        price:     r.prevClose,
        dayChg:    0,
        prevClose: r.prevClose,
        source:    r.source
      };
    }
  });

  return res.status(200).json(output);
}
