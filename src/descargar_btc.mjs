// Descarga las fuentes de Bitcoin en data/raw (las macro de FRED y el VIX las baja descargar.mjs).
//   - CoinMetrics (API comunitaria, gratuita): precio de referencia diario y métricas de la red desde 2010
//   - Yahoo Finance: BTC-USD con máximos y mínimos (desde 2014)
//   - alternative.me: índice de miedo y codicia de cripto (desde 2018)
//   - FRED: índice del dólar y masa monetaria M2
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('data/raw', { recursive: true });
const UA = { 'User-Agent': 'Mozilla/5.0 (termometro-sp500)' };
async function get(url) {
  for (let intento = 1; intento <= 3; intento++) {
    try { const r = await fetch(url, { headers: UA }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return await r.text(); }
    catch (e) { if (intento === 3) throw new Error(`${url}: ${e.message}`); await new Promise(r => setTimeout(r, 2000 * intento)); }
  }
}

// CoinMetrics: se piden de una en una porque la API gratuita rechaza la petición entera si una métrica no está incluida
const METRICAS = ['PriceUSD', 'CapMVRVCur', 'IssTotUSD', 'HashRate', 'SplyCur'];
const cm = {};
for (const m of METRICAS) {
  let url = `https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=btc&metrics=${m}&frequency=1d&page_size=10000&start_time=2009-01-01`;
  const filas = [];
  while (url) { const j = JSON.parse(await get(url)); filas.push(...j.data); url = j.next_page_url || null; }
  for (const f of filas) { const d = f.time.slice(0, 10); (cm[d] ||= {})[m] = f[m] == null ? null : +f[m]; }
  console.log(`CoinMetrics ${m.padEnd(11)} ${filas.length} días (${filas[0].time.slice(0, 10)} → ${filas.at(-1).time.slice(0, 10)})`);
}
writeFileSync('data/raw/btc_coinmetrics.json', JSON.stringify(Object.entries(cm).sort().map(([date, v]) => ({ date, ...v }))));

const hasta = Math.floor(Date.now() / 1000) + 86400;
const y = await get(`https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD?period1=1262304000&period2=${hasta}&interval=1d`);
writeFileSync('data/raw/btc_yahoo.json', y);
console.log('Yahoo BTC-USD', JSON.parse(y).chart.result[0].timestamp.length, 'días');

const fng = await get('https://api.alternative.me/fng/?limit=0&format=json');
writeFileSync('data/raw/btc_fng.json', fng);
console.log('Miedo y codicia', JSON.parse(fng).data.length, 'días');

for (const id of ['DTWEXBGS', 'M2SL']) {
  const txt = await get(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`);
  writeFileSync(`data/raw/fred_${id}.csv`, txt);
  const filas = txt.trim().split('\n');
  console.log(`FRED ${id.padEnd(9)} ${filas[1].split(',')[0]} → ${filas.at(-1).split(',')[0]}`);
}
