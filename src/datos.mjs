// Carga las fuentes de data/raw y las deja en estructuras simples.
// Regla de oro: cada dato lleva la fecha a partir de la cual se podía conocer ("disponible"),
// para que ningún indicador use información que en ese momento aún no se había publicado.
import { readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';

const iso = t => new Date(t * 1000).toISOString().slice(0, 10);
// Suma meses sin desbordar: 31-03 + 1 mes = 30-04 (JavaScript por defecto daría 01-05)
export const addMonths = (d, m) => {
  const y = +d.slice(0, 4), mo = +d.slice(5, 7) - 1 + m, day = +d.slice(8, 10);
  const ty = y + Math.floor(mo / 12), tm = ((mo % 12) + 12) % 12;
  const dim = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  return `${String(ty).padStart(4, '0')}-${String(tm + 1).padStart(2, '0')}-${String(Math.min(day, dim)).padStart(2, '0')}`;
};
export const addDays = (d, n) => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

// --- Yahoo: descarta la sesión en curso si el mercado aún no ha cerrado
function loadYahoo(file) {
  const r = JSON.parse(readFileSync(file, 'utf8')).chart.result[0];
  const q = r.indicators.quote[0];
  let rows = r.timestamp.map((t, i) => ({ date: iso(t), t, open: q.open[i], high: q.high[i], low: q.low[i], close: q.close[i] }))
    .filter(d => d.close != null && d.close > 0);
  const tp = r.meta.currentTradingPeriod?.regular;
  const descargado = JSON.parse(readFileSync('data/raw/descarga.json', 'utf8')).fecha;
  const now = Date.parse(descargado) / 1000;
  if (tp && rows.length && rows.at(-1).t >= tp.start && now < tp.end) rows = rows.slice(0, -1);
  // Antes de 1962 Yahoo no tiene máximos/mínimos reales del S&P (vienen igual que el cierre)
  for (const d of rows) d.hlValido = d.high != null && d.low != null && d.high !== d.low;
  return rows;
}
export const sp500 = () => loadYahoo('data/raw/gspc_raw.json');
export const vix = () => loadYahoo('data/raw/vix_raw.json');

// --- FRED: [{date, value}] (los '.' son huecos)
export function fred(id) {
  return readFileSync(`data/raw/fred_${id}.csv`, 'utf8').trim().split('\n').slice(1)
    .map(l => { const [date, v] = l.split(','); return { date, value: v === '.' || v === '' ? null : +v }; })
    .filter(d => d.value != null && Number.isFinite(d.value));
}

// --- Shiller: mensual desde 1871. La fecha 2025.1 significa octubre de 2025.
export function shiller() {
  const wb = XLSX.read(readFileSync('data/raw/shiller_ie_data.xls'));
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['Data'], { header: 1, raw: true }).filter(r => typeof r[0] === 'number');
  const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  return rows.map(r => {
    const y = Math.floor(r[0]), m = Math.round((r[0] - y) * 100);
    return {
      month: `${y}-${String(m).padStart(2, '0')}`,
      P: num(r[1]), D: num(r[2]), E: num(r[3]), CPI: num(r[4]), GS10: num(r[6]),
      realTR: num(r[9]), // índice de rentabilidad total real (dividendos reinvertidos, descontada la inflación)
    };
  });
}

// --- Series "con fecha de disponibilidad": [{date: fecha desde la que se conoce, value}]
// Consulta: último valor disponible en una fecha dada (búsqueda binaria).
export class AsOf {
  constructor(points) { this.p = points.filter(x => x.value != null && Number.isFinite(x.value)).sort((a, b) => (a.date < b.date ? -1 : 1)); }
  at(date) {
    const p = this.p; let lo = 0, hi = p.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (p[m].date <= date) lo = m + 1; else hi = m; }
    return lo ? p[lo - 1].value : null;
  }
  get desde() { return this.p[0]?.date; }
}

// Retrasos de publicación (conservadores). Ver la sección de metodología del informe.
export const RETRASO = {
  mediaMensual: 1,   // tipos de interés como media del mes M: se conocen al cerrar el mes → desde el día 1 de M+1
  datoMacro: 2,      // IPC, paro, producción industrial del mes M: se publican durante M+1 → desde el día 1 de M+2
  beneficios: 4,     // beneficios y dividendos de Shiller del mes M: 12 meses móviles interpolados de datos trimestrales → M+4
  trimestral: 6,     // Z.1 y PIB del trimestre que empieza en M: se publican ~10 semanas tras cerrar el trimestre → M+6
};
// FRED marca los datos mensuales con el día 1 del mes al que se refieren
export const disponibleMensual = (series, lag) => new AsOf(series.map(d => ({ date: addMonths(d.date.slice(0, 7) + '-01', lag), value: d.value })));
