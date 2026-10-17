// Genera el informe de un activo: una sola página, sin dependencias externas, con los resultados incrustados.
// Uso: node src/informe.mjs [sp500|btc] [es|en]
//   es → docs/index.html, docs/bitcoin.html      en → docs/en/index.html, docs/en/bitcoin.html
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { traducirResultados, traducirEpocas, reglaEn } from './textos/en.mjs';

const activo = process.argv[2] || 'sp500';
const lang = process.argv[3] || 'es';
const en = lang === 'en';
const L10N = (es, ing) => (en ? ing : es);
let R, textos, salida;

if (activo === 'sp500') {
  const { cargarMarcos, cargarContexto, marcoLargo, valoracionLarga, INDICADORES } = await import('./indicadores.mjs');
  R = JSON.parse(readFileSync('data/resultados.json', 'utf8'));
  textos = en ? (await import('./textos/sp500.en.mjs')).default : JSON.parse(readFileSync('src/textos/sp500_html.json', 'utf8'));
  salida = en ? 'docs/en/index.html' : 'docs/index.html';
  // Nube: valoración de cada mes (historia de Shiller) frente a la rentabilidad real total anualizada de los 10 años siguientes
  const M = cargarMarcos(), ctx = cargarContexto(M);
  const L = marcoLargo(ctx).slice(0, -1), vl = valoracionLarga(ctx, L);
  const pts = { cape: [], ecy: [] };
  for (let i = 0; i + 120 < L.length; i++) {
    const a = L[i].realTR, b = L[i + 120].realTR;
    if (a == null || b == null) continue;
    const y = +(((b / a) ** 0.1 - 1) * 100).toFixed(2);
    if (vl.cape[i] != null) pts.cape.push([L[i].month, +vl.cape[i].toFixed(2), y]);
    if (vl.ecy[i] != null) pts.ecy.push([L[i].month, +vl.ecy[i].toFixed(2), y]);
  }
  const hoy = id => R.indicadores.find(i => i.id === id).marcos.mensual.hoy.valor;
  R.nube = {
    yTipo: 'pct', agrupar: 'decada',
    yEtiqueta: L10N('Rentabilidad real anual de los 10 años siguientes', 'Annual real return over the following 10 years'),
    yCorto: L10N('la rentabilidad real de los 10 años siguientes', 'the real return over the following 10 years'),
    unidad: L10N('meses', 'months'), articulo: 'los',
    variables: [
      { id: 'cape', nombre: 'CAPE', frase: L10N('con un CAPE {rango}', 'with a CAPE {rango}'), xEtiqueta: L10N('CAPE de Shiller ese mes', 'Shiller CAPE that month'), hoy: hoy('cape'), ventana: 3, dec: 1, puntos: pts.cape },
      { id: 'ecy', nombre: L10N('Prima sobre el bono (ECY)', 'Premium over bonds (ECY)'), frase: L10N('con una prima sobre el bono {rango}', 'with a premium over bonds {rango}'), xEtiqueta: L10N('Prima de la bolsa sobre el bono ese mes (puntos)', 'Equity premium over bonds that month (points)'), hoy: hoy('ecy'), ventana: 0.75, dec: 2, puntos: pts.ecy },
    ],
  };
  R.textos = {
    sub: L10N('{n} indicadores técnicos, de sentimiento, de valoración y macroeconómicos frente a la rentabilidad posterior del S&P 500. Datos hasta el {fecha}.',
      '{n} technical, sentiment, valuation and macroeconomic indicators against subsequent S&P 500 returns. Data up to {fecha}.'),
    fuentes: L10N('Yahoo Finance, FRED (Reserva Federal de St. Louis) y Robert Shiller', 'Yahoo Finance, FRED (St. Louis Federal Reserve) and Robert Shiller'),
    largoEtiqueta: L10N('historia larga desde 1881, rentabilidad total real', 'long history since 1881, real total return'),
    sujetoTexto: L10N('el índice', 'the index'),
  };
  R.catalogo = INDICADORES.map(i => ({ id: i.id, reglas: i.reglas.map(r => ({ id: r.id, nombre: r.nombre, tipo: r.estado ? 'estado' : 'evento' })) }));
} else if (activo === 'btc') {
  const { cargarMarcosBtc, cargarContextoBtc, INDICADORES_BTC } = await import('./indicadores_btc.mjs');
  R = JSON.parse(readFileSync('data/resultados_btc.json', 'utf8'));
  textos = (await import(en ? './textos/btc.en.mjs' : './textos/btc.mjs')).default;
  salida = en ? 'docs/en/bitcoin.html' : 'docs/bitcoin.html';
  // Nube: cada semana desde 2011, un indicador frente a cuántas veces se multiplicó el precio en los 12 meses siguientes
  const M = cargarMarcosBtc(), ctx = cargarContextoBtc(M), f = M.semanal;
  const ind = id => INDICADORES_BTC.find(i => i.id === id);
  const vals = { mvrv: ind('mvrv').calc(f, 'semanal', ctx), halving: ind('halving').calc(f, 'semanal', ctx), mm200: ind('mm200').calc(f, 'semanal', ctx) };
  const pts = { mvrv: [], halving: [], mm200: [] };
  const ultima = f.at(-1).date;
  for (let i = 0; i < f.length; i++) {
    if (f[i].date < '2011-01-01') continue;
    const j = f.findIndex((r, k) => k > i && r.date >= addYear(f[i].date));
    if (j < 0 || addYear(f[i].date) > ultima) break;
    const y = +(f[j].close / f[i].close).toFixed(3);
    for (const k of Object.keys(pts)) if (vals[k][i] != null) pts[k].push([f[i].date, +vals[k][i].toFixed(2), y]);
  }
  const hoyD = id => R.indicadores.find(i => i.id === id).marcos.diario.hoy.valor;
  const hoyS = id => R.indicadores.find(i => i.id === id).marcos.semanal.hoy.valor;
  R.nube = {
    yTipo: 'mult', agrupar: 'ano',
    yEtiqueta: L10N('Precio 12 meses después', 'Price 12 months later'),
    yCorto: L10N('la rentabilidad de los 12 meses siguientes', 'the return over the following 12 months'),
    unidad: L10N('semanas', 'weeks'), articulo: 'las',
    variables: [
      { id: 'halving', nombre: L10N('Meses desde el halving', 'Months since the halving'), frase: L10N('situadas {rango} meses después de un halving', 'falling {rango} months after a halving'), xEtiqueta: L10N('Meses desde el último halving', 'Months since the last halving'), hoy: hoyD('halving'), ventana: 1.5, dec: 1, puntos: pts.halving },
      { id: 'mvrv', nombre: 'MVRV', frase: L10N('con el MVRV {rango}', 'with the MVRV {rango}'), xEtiqueta: L10N('MVRV esa semana', 'MVRV that week'), hoy: hoyD('mvrv'), ventana: 0.15, dec: 2, puntos: pts.mvrv },
      { id: 'mm200', nombre: L10N('Distancia a la media de 200 semanas', 'Distance to the 200-week average'), frase: L10N('con el precio {rango} % por encima de la media de 200 semanas', 'with the price {rango}% above the 200-week average'), xEtiqueta: L10N('Distancia a la media de 200 semanas (%)', 'Distance to the 200-week average (%)'), hoy: hoyS('mm200'), ventana: 10, dec: 0, puntos: pts.mm200 },
    ],
  };
  R.textos = {
    sub: L10N('{n} indicadores técnicos, de sentimiento, de la red de Bitcoin y macroeconómicos frente a la rentabilidad posterior de Bitcoin. Datos hasta el {fecha}.',
      '{n} technical, sentiment, on-chain and macroeconomic indicators against subsequent Bitcoin returns. Data up to {fecha}.'),
    fuentes: L10N('CoinMetrics, Yahoo Finance, alternative.me y FRED (Reserva Federal de St. Louis)', 'CoinMetrics, Yahoo Finance, alternative.me and FRED (St. Louis Federal Reserve)'),
    largoEtiqueta: '', sujetoTexto: 'Bitcoin', hoyHorizontes: ['6m', '12m'],
  };
  R.catalogo = INDICADORES_BTC.map(i => ({ id: i.id, reglas: i.reglas.map(r => ({ id: r.id, nombre: r.nombre, tipo: r.estado ? 'estado' : 'evento' })) }));
} else throw new Error('Activo desconocido: ' + activo);

// Corto plazo (1-10 velas) y desglose por épocas, si se han calculado
const clave = activo === 'btc' ? 'btc' : 'sp500';
if (existsSync(`data/corto_${clave}.json`)) {
  const C = JSON.parse(readFileSync(`data/corto_${clave}.json`, 'utf8'));
  for (const i of C.indicadores) for (const r of Object.values(i.marcos)) { delete r.serie; for (const a of Object.values(r.horizontes)) if (a) for (const g of a.reglas) delete g.lista; }
  R.corto = { horizontes: C.horizontes, pruebas: C.pruebas, indicadores: C.indicadores };
}
if (existsSync(`data/epocas_${clave}.json`)) R.epocas = JSON.parse(readFileSync(`data/epocas_${clave}.json`, 'utf8'));

// Inglés: se traducen los textos que vienen de los datos
if (en) {
  traducirResultados(R, clave);
  if (R.corto) traducirResultados(R.corto, clave);
  if (R.epocas) traducirEpocas(R.epocas);
  for (const c of R.catalogo) for (const r of c.reglas) r.nombre = reglaEn(r.nombre);
}

function addYear(d) { return `${+d.slice(0, 4) + 1}${d.slice(4)}`; }

const json = JSON.stringify(R, (k, v) => (typeof v === 'number' && !Number.isInteger(v) ? +v.toPrecision(4) : v));
let html = readFileSync(en ? 'docs/plantilla.en.html' : 'docs/plantilla.html', 'utf8');
for (const [k, v] of Object.entries(textos)) html = html.split(`{{${k}}}`).join(v);
const resto = html.match(/\{\{\w+\}\}/g);
if (resto) throw new Error('Faltan textos: ' + [...new Set(resto)].join(', '));
html = html.replace('/*DATOS*/null', () => json);
mkdirSync(en ? 'docs/en' : 'docs', { recursive: true });
writeFileSync(salida, html);
console.log(`${salida} (${(html.length / 1024).toFixed(0)} KB)`);
