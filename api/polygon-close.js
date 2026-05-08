// api/polygon-close.js
// Returns PREVIOUS DAY CLOSING PRICE for US tickers
// Uses Polygon /v2/aggs/ticker/{sym}/prev endpoint

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing POLYGON_API_KEY' });

  const { tickers } = req.query;
  if (!tickers) return res.status(400).json({ error: 'Missing tickers param' });

  const symbolList = tickers.split(',').map(s => s.trim()).filter(Boolean);

  // Fetch prev day close for each ticker in parallel
  const results = await Promise.all(
    symbolList.map(async (sym) => {
      try {
        const url = `https://api.polygon.io/v2/aggs/ticker/${sym}/prev?adjusted=true&apiKey=${apiKey}`;
        const r = await fetch(url);
        if (!r.ok) return { ticker: sym, error: r.status };
        const data = await r.json();
        const result = data?.results?.[0];
        if (!result) return { ticker: sym, error: 'no data' };
        return {
          ticker: sym,
          prevClose: result.c,
          open:      result.o,
          high:      result.h,
          low:       result.l,
          volume:    result.v,
          date:      result.t
        };
      } catch(e) {
        return { ticker: sym, error: e.message };
      }
    })
  );

  // Format as priceCache-compatible object
  const output = {};
  results.forEach(r => {
    if (r.prevClose) {
      output[r.ticker] = {
        price:    r.prevClose,
        dayChg:   0, // prev close has no day change
        prevClose: r.prevClose
      };
    }
  });

  return res.status(200).json(output);
}
