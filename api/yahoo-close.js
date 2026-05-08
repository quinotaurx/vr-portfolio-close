// api/yahoo-close.js
// Returns PREVIOUS DAY CLOSING PRICE for EU tickers via Yahoo Finance
// Used for MONC.MI, PRX.AS, SAP.DE and US tickers not on Polygon

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Missing ticker param' });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    if (!r.ok) return res.status(r.status).json({ error: `Yahoo HTTP ${r.status}` });

    const data = await r.json();
    const meta = data?.chart?.result?.[0]?.meta;

    if (!meta) return res.status(404).json({ error: 'No data from Yahoo' });

    // Use chartPreviousClose or previousClose — NOT regularMarketPrice (live)
    const prevClose = meta.chartPreviousClose || meta.previousClose;

    return res.status(200).json({
      ticker,
      price:    prevClose,
      dayChg:   0,
      prevClose: prevClose
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
