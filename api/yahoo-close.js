// api/yahoo-close.js
// Returns PREVIOUS DAY CLOSING PRICE for tickers via Yahoo Finance
// Used for EU tickers (MONC.MI, PRX.AS, SAP.DE) and US tickers not on Polygon

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Missing ticker param' });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!r.ok) return res.status(r.status).json({ error: `Yahoo HTTP ${r.status}` });

    const data = await r.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return res.status(404).json({ error: 'No data from Yahoo' });

    // Previous close — NOT live price
    const prevClose = meta.chartPreviousClose || meta.previousClose;
    const regularPrice = meta.regularMarketPrice;

    return res.status(200).json({
      chart: {
        result: [{
          meta: {
            regularMarketPrice: prevClose,        // return prevClose as price
            previousClose:      prevClose,
            chartPreviousClose: prevClose,
            regularMarketChangePercent: 0,        // no day change for close
            currency: meta.currency || 'USD'
          }
        }]
      }
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
