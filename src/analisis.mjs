// Análisis del S&P 500: para cada indicador, marco temporal y horizonte, ¿qué pasó después?
// Uso: node src/analisis.mjs  → data/resultados.json y data/procesado/indicadores_<marco>.csv
import { cargarMarcos, cargarContexto, INDICADORES, marcoLargo, valoracionLarga } from './indicadores.mjs';
import { ejecutar, log } from './motor.mjs';
import { expandingPercentile } from './estadistica.mjs';

const HORIZONTES = [
  { id: '1m', etiqueta: '1 mes', meses: 1 },
  { id: '6m', etiqueta: '6 meses', meses: 6 },
  { id: '12m', etiqueta: '12 meses', meses: 12 },
  { id: '3a', etiqueta: '3 años', meses: 36 },
  { id: '5a', etiqueta: '5 años', meses: 60 },
  { id: '10a', etiqueta: '10 años', meses: 120, soloFamilia: 'Valoración' },
];
const REPS = { diario: 300, semanal: 1000, mensual: 1000, largo: 1000 };
const MIN_HIST = { diario: 2520, semanal: 520, mensual: 120, largo: 120 }; // 10 años de historia antes de asignar quintiles

const M = cargarMarcos();
const ctx = cargarContexto(M);
log('Datos cargados:', Object.entries(M).map(([k, v]) => `${k} ${v.length}`).join(', '));

ejecutar({
  activo: 'sp500', marcos: M, ctx, indicadores: INDICADORES, horizontes: HORIZONTES, reps: REPS, minHist: MIN_HIST,
  inicioComun: '1990-01-01', salidaJson: 'data/resultados.json', salidaCsv: 'data/procesado/indicadores', nombrePrecio: 'sp500',
  // Historia larga de Shiller (1881-): valoración frente a rentabilidad TOTAL REAL
  extra(resultados, { analizar, futurasMensual }) {
    const L = marcoLargo(ctx), vl = valoracionLarga(ctx, L), extra = [];
    const fwdL = {}; for (const hz of HORIZONTES) fwdL[hz.id] = futurasMensual(L.slice(0, -1), hz.meses, 'realTR').concat([null]); // el mes en curso de Shiller es provisional
    for (const id of ['cape', 'per', 'dy', 'ecy']) {
      const v = vl[id], pct = expandingPercentile(v, MIN_HIST.largo), ind = INDICADORES.find(i => i.id === id);
      resultados.largo[id] = { desde: L[v.findIndex(x => x != null)].month, horizontes: {} };
      for (const hz of HORIZONTES) {
        const a = analizar({ f: L, v, fwd: fwdL[hz.id], tf: 'largo', hz, reglas: ind.reglas.filter(r => r.estado), pct, reps: REPS.largo });
        resultados.largo[id].horizontes[hz.id] = a; if (a) extra.push(a);
      }
      log(`largo ${id.padEnd(5)} ${Object.entries(resultados.largo[id].horizontes).map(([h, a]) => `${h}:${a ? a.spearman.toFixed(2) : '—'}`).join(' ')}`);
    }
    return extra;
  },
});
