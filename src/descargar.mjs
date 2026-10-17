// Descarga todas las fuentes en data/raw. Se puede relanzar: sobrescribe con la versión más reciente.
//   - Yahoo Finance: S&P 500 (^GSPC) y VIX (^VIX), diario
//   - FRED (Reserva Federal de St. Louis): tipos, crédito, inflación, paro, producción, condiciones financieras
//   - Robert Shiller: precios, beneficios, dividendos e IPC mensuales desde 1871
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('data/raw', { recursive: true });
const UA = { 'User-Agent': 'Mozilla/5.0 (termometro-sp500)' };

async function get(url, binary = false) {
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const res = await fetch(url, { headers: UA });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
    } catch (e) {
      if (intento === 3) throw new Error(`${url}: ${e.message}`);
      await new Promise(r => setTimeout(r, 2000 * intento));
    }
  }
}

// --- Yahoo
const hasta = Math.floor(Date.now() / 1000) + 86400;
for (const [simbolo, archivo] of [['%5EGSPC', 'gspc_raw.json'], ['%5EVIX', 'vix_raw.json']]) {
  const txt = await get(`https://query1.finance.yahoo.com/v8/finance/chart/${simbolo}?period1=-1325635200&period2=${hasta}&interval=1d&events=history`);
  const r = JSON.parse(txt).chart.result[0];
  writeFileSync(`data/raw/${archivo}`, txt);
  console.log(`Yahoo ${decodeURIComponent(simbolo)}: ${r.timestamp.length} sesiones`);
}

// --- FRED (CSV sin clave de API)
export const FRED = {
  BAA: 'Rentabilidad bonos corporativos Moody\'s Baa (media mensual, %)',
  AAA: 'Rentabilidad bonos corporativos Moody\'s Aaa (media mensual, %)',
  GS10: 'Bono del Tesoro a 10 años (media mensual, %)',
  TB3MS: 'Letra del Tesoro a 3 meses (media mensual, %)',
  T10Y2Y: 'Diferencial 10 años − 2 años (diario, puntos)',
  FEDFUNDS: 'Tipo efectivo de los fondos federales (media mensual, %)',
  CPIAUCNS: 'IPC urbano, sin desestacionalizar (índice)',
  UNRATE: 'Tasa de paro desestacionalizada (%)',
  INDPRO: 'Índice de producción industrial',
  NFCI: 'Índice de condiciones financieras de la Fed de Chicago (semanal)',
  NCBEILQ027S: 'Valor de mercado de las acciones de empresas no financieras (Z.1, millones $)',
  GDP: 'PIB nominal de EE. UU. (miles de millones $, anualizado)',
};
for (const id of Object.keys(FRED)) {
  const txt = await get(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`);
  writeFileSync(`data/raw/fred_${id}.csv`, txt);
  const filas = txt.trim().split('\n');
  console.log(`FRED ${id.padEnd(12)} ${filas[1].split(',')[0]} → ${filas.at(-1).split(',')[0]} (${filas.length - 1} filas)`);
}

// --- Shiller: la web actual enlaza el Excel desde shillerdata.com
const home = await get('https://shillerdata.com/');
const m = home.match(/href="([^"]*ie_data\.xls[^"]*)"/i);
if (!m) throw new Error('No encuentro el enlace a ie_data.xls en shillerdata.com');
const url = m[1].startsWith('//') ? 'https:' + m[1] : m[1];
writeFileSync('data/raw/shiller_ie_data.xls', await get(url, true));
console.log('Shiller ie_data.xls descargado de', url.split('?')[0]);
writeFileSync('data/raw/descarga.json', JSON.stringify({ fecha: new Date().toISOString(), shiller: url }, null, 2));
