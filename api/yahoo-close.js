// api/yahoo-close.js
// Returns closing price for EU tickers and US fallback tickers via Yahoo Finance
// regularMarketPrice = most recent close (when market is closed = today's close)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Missing ticker param' });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      }
    });

    if (!r.ok) return res.status(r.status).json({ error: `Yahoo HTTP ${r.status}` });

    const data = await r.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return res.status(404).json({ error: 'No data from Yahoo' });

    // regularMarketPrice = today's closing price when market is closed
    const price = meta.regularMarketPrice || meta.chartPreviousClose || meta.previousClose;

    return res.status(200).json({
      chart: {
        result: [{
          meta: {
            regularMarketPrice:         price,
            previousClose:              meta.chartPreviousClose,
            chartPreviousClose:         meta.chartPreviousClose,
            regularMarketChangePercent: 0,
            currency:                   meta.currency || 'USD'
          }
        }]
      }
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
