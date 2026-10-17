// Análisis de Bitcoin con el mismo motor que el S&P 500.
// Uso: node src/analisis_btc.mjs  → data/resultados_btc.json y data/procesado/btc_<marco>.csv
import { cargarMarcosBtc, cargarContextoBtc, INDICADORES_BTC } from './indicadores_btc.mjs';
import { ejecutar, log } from './motor.mjs';

const HORIZONTES = [
  { id: '1m', etiqueta: '1 mes', meses: 1 },
  { id: '6m', etiqueta: '6 meses', meses: 6 },
  { id: '12m', etiqueta: '12 meses', meses: 12 },
  { id: '3a', etiqueta: '3 años', meses: 36 },
  { id: '5a', etiqueta: '5 años', meses: 60 },
];
const REPS = { diario: 300, semanal: 1000, mensual: 1000 };
// Bitcoin tiene poca historia: se exigen 4 años previos (un ciclo de halving) para asignar quintiles, en vez de 10
const MIN_HIST = { diario: 1461, semanal: 209, mensual: 48 };

const M = cargarMarcosBtc();
const ctx = cargarContextoBtc(M);
log('Datos cargados:', Object.entries(M).map(([k, v]) => `${k} ${v.length}`).join(', '));

ejecutar({
  activo: 'btc', marcos: M, ctx, indicadores: INDICADORES_BTC, horizontes: HORIZONTES, reps: REPS, minHist: MIN_HIST,
  desdeObs: '2011-01-01',      // 2010 fue un mercado diminuto (precios de céntimos, poca liquidez): solo sirve para calentar las medias
  inicioComun: '2018-02-01',   // desde que existe el índice de miedo y codicia
  todosLosDias: true,
  salidaJson: 'data/resultados_btc.json', salidaCsv: 'data/procesado/btc', nombrePrecio: 'btc',
});
