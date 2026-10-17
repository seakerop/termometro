// Corto plazo: los indicadores técnicos en velas diarias frente a la rentabilidad de las 1, 5 y 10 velas siguientes,
// que es el plazo al que se usan de verdad el RSI, las bandas de Bollinger o el estocástico.
// Uso: node src/corto.mjs [sp500|btc]  → data/corto_<activo>.json
import { ejecutar, log } from './motor.mjs';
import { INDICADORES, cargarMarcos, cargarContexto, rsiWilder, sma } from './indicadores.mjs';

const activo = process.argv[2] || 'btc';

// RSI de 2 periodos (Larry Connors): la versión rápida que se usa para operaciones de pocos días
const rsi2 = {
  id: 'rsi2', nombre: 'RSI (2)', familia: 'Técnico', marcos: ['diario'], sentidoPopular: -1,
  que: 'RSI de solo 2 velas: reacciona a los dos últimos días. Es el que se usa para operaciones de pocos días.',
  popular: 'Por debajo de 10, rebote inminente; por encima de 90, recogida de beneficios.',
  calc: f => rsiWilder(f.map(r => r.close), 2),
  reglas: [{ id: 'rsi2<10', nombre: 'RSI (2) < 10', estado: v => v < 10 }, { id: 'rsi2>90', nombre: 'RSI (2) > 90', estado: v => v > 90 }],
};
// La regla de Connors completa: comprar el RSI (2) bajo solo cuando el precio está por encima de su media de 200
const rsi2Tendencia = {
  id: 'rsi2tend', nombre: 'RSI (2) con tendencia alcista', familia: 'Técnico', marcos: ['diario'], sentidoPopular: -1,
  que: 'El mismo RSI (2), pero solo en los días en que el precio está por encima de su media de 200. Es la estrategia de Connors: comprar retrocesos dentro de una tendencia alcista.',
  popular: 'Con tendencia alcista, un RSI (2) por debajo de 10 es una oportunidad de compra de pocos días.',
  calc: f => { const c = f.map(r => r.close), r2 = rsiWilder(c, 2), m = sma(c, 200); return c.map((x, i) => (m[i] && x > m[i] ? r2[i] : null)); },
  reglas: [{ id: 'rsi2t<10', nombre: 'RSI (2) < 10 sobre la media de 200', estado: v => v < 10 }, { id: 'rsi2t<5', nombre: 'RSI (2) < 5 sobre la media de 200', estado: v => v < 5 }],
};

let M, ctx, base, cfg;
if (activo === 'sp500') {
  const m = cargarMarcos(); M = { diario: m.diario }; ctx = cargarContexto(m); base = INDICADORES;
  cfg = { desdeObs: null, horizontes: [{ id: '1d', etiqueta: '1 sesión', velas: 1 }, { id: '5d', etiqueta: '5 sesiones', velas: 5 }, { id: '10d', etiqueta: '10 sesiones', velas: 10 }], minHist: { diario: 2520 } };
} else {
  const { cargarMarcosBtc, cargarContextoBtc, INDICADORES_BTC } = await import('./indicadores_btc.mjs');
  const m = cargarMarcosBtc(); M = { diario: m.diario }; ctx = cargarContextoBtc(m); base = INDICADORES_BTC;
  cfg = { desdeObs: '2011-01-01', horizontes: [{ id: '1d', etiqueta: '1 día', velas: 1 }, { id: '5d', etiqueta: '5 días', velas: 5 }, { id: '10d', etiqueta: '10 días', velas: 10 }], minHist: { diario: 1461 } };
}
// Solo lo que existe a diario: técnicos y sentimiento (la macro y la valoración cambian una vez al mes)
const indicadores = [rsi2, rsi2Tendencia, ...base.filter(i => i.marcos.includes('diario') && ['Técnico', 'Sentimiento'].includes(i.familia))]
  .map(i => ({ ...i, marcos: ['diario'] }));
log(`${activo}: ${indicadores.length} indicadores, ${M.diario.length} velas diarias`);

ejecutar({
  activo, marcos: M, ctx, indicadores, horizontes: cfg.horizontes, reps: { diario: 300 }, minHist: cfg.minHist,
  desdeObs: cfg.desdeObs, inicioComun: null,
  salidaJson: `data/corto_${activo}.json`, salidaCsv: `data/procesado/corto_${activo}`, nombrePrecio: activo,
});
