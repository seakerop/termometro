// Indicadores aplicados a Bitcoin. Los técnicos y los macro son los mismos que en el S&P 500;
// la valoración de empresas (CAPE, PER, dividendo, Buffett) no existe en Bitcoin y se sustituye por sus equivalentes de la red.
import { readFileSync } from 'node:fs';
import { AsOf, fred, disponibleMensual, RETRASO, addDays, addMonths } from './datos.mjs';
import { INDICADORES, cargarMarcos, cargarContexto, agrupar, semana, sma, rollingStd, cruces, primerToque, primeraVez } from './indicadores.mjs';

const BARRAS_BTC = { diario: { mes: 30, ano: 365 }, semanal: { mes: 4, ano: 52 }, mensual: { mes: 1, ano: 12 } };
const TODOS = ['diario', 'semanal', 'mensual'];
export const HALVINGS = ['2012-11-28', '2016-07-09', '2020-05-11', '2024-04-20'];

// ---------- Marcos: precio de referencia de CoinMetrics (cierre a las 00:00 UTC), máximos y mínimos de Yahoo desde 2014
export function cargarMarcosBtc() {
  const cm = JSON.parse(readFileSync('data/raw/btc_coinmetrics.json', 'utf8')).filter(r => r.PriceUSD > 0);
  const y = JSON.parse(readFileSync('data/raw/btc_yahoo.json', 'utf8')).chart.result[0];
  const hl = new Map(y.timestamp.map((t, i) => [new Date(t * 1000).toISOString().slice(0, 10), [y.indicators.quote[0].high[i], y.indicators.quote[0].low[i]]]));
  const daily = cm.map((r, i) => {
    const h = hl.get(r.date), c = r.PriceUSD;
    const ok = !!(h && h[0] != null && h[1] != null);
    // el cierre es el de CoinMetrics; el rango se amplía si hace falta para que lo contenga (las dos fuentes cierran a horas algo distintas)
    return { date: r.date, close: c, high: ok ? Math.max(h[0], c) : c, low: ok ? Math.min(h[1], c) : c, hlValido: ok, di: i, cm: r };
  });
  return { diario: daily, semanal: agrupar(daily, semana), mensual: agrupar(daily, d => d.slice(0, 7)) };
}

export function cargarContextoBtc(M) {
  // Macro, tipos y VIX: los mismos objetos que en el S&P (ya llevan sus retrasos de publicación)
  const base = cargarContexto(cargarMarcos());
  const daily = M.diario, cm = daily.map(d => d.cm);
  const lr = daily.map((d, i) => (i ? Math.log(d.close / daily[i - 1].close) : 0));
  const vol30 = rollingStd(lr, 30).map((s, i) => (i >= 30 && s != null ? s * Math.sqrt(365) * 100 : null));
  const porFecha = arr => new AsOf(daily.map((d, i) => ({ date: d.date, value: arr[i] })));
  // Puell: ingresos diarios de los mineros entre su media de 365 días
  const iss = cm.map(r => r.IssTotUSD ?? null), iss365 = sma(iss, 365);
  // Hash ribbons: media de 30 días del hashrate frente a la de 60
  const hr = cm.map(r => r.HashRate ?? null), hr30 = sma(hr, 30), hr60 = sma(hr, 60);
  // Stock-to-flow (PlanB, marzo de 2019): ln(capitalización) = 3,3·ln(SF) + 14,6, con SF = oferta / emisión del último año
  const s2f = cm.map((r, i) => {
    if (i < 365 || !r.SplyCur || !cm[i - 365].SplyCur) return null;
    const flujo = r.SplyCur - cm[i - 365].SplyCur; if (flujo <= 0) return null;
    const precioModelo = Math.exp(14.6) * (r.SplyCur / flujo) ** 3.3 / r.SplyCur;
    return Math.log(daily[i].close / precioModelo);
  });
  const fng = JSON.parse(readFileSync('data/raw/btc_fng.json', 'utf8')).data.map(d => ({ date: new Date(+d.timestamp * 1000).toISOString().slice(0, 10), value: +d.value }));
  // Dólar: índice amplio de la Fed (diario, se publica con un día de retraso), variación en 12 meses
  const dx = fred('DTWEXBGS'), dxAsOf = new AsOf(dx.map(d => ({ date: addDays(d.date, 1), value: d.value })));
  const m2 = fred('M2SL');
  const m2yoy = m2.map(d => { const j = m2.findIndex(x => x.date === addMonths(d.date, -12)); return { date: d.date, value: j >= 0 ? (d.value / m2[j].value - 1) * 100 : null }; });
  return {
    ...base, barras: BARRAS_BTC,
    volPorFecha: porFecha(vol30),
    mvrv: porFecha(cm.map(r => r.CapMVRVCur ?? null)),
    puell: porFecha(iss.map((v, i) => (v != null && iss365[i] ? v / iss365[i] : null))),
    hash: porFecha(hr.map((v, i) => (hr30[i] && hr60[i] ? (hr30[i] / hr60[i] - 1) * 100 : null))),
    s2f: porFecha(s2f),
    fng: new AsOf(fng),
    fngDesde: fng.reduce((a, d) => (d.date < a ? d.date : a), '9999'),
    dolar: date => { const a = dxAsOf.at(date), b = dxAsOf.at(addMonths(date, -12)); return a != null && b != null && addMonths(date, -12) >= dx[0].date ? (a / b - 1) * 100 : null; },
    m2: disponibleMensual(m2yoy, RETRASO.datoMacro),
  };
}

const deSp = id => INDICADORES.find(i => i.id === id);
const mesesDesdeHalving = date => { const h = HALVINGS.filter(d => d <= date).at(-1); return h ? (Date.parse(date) - Date.parse(h)) / (30.4375 * 864e5) : null; };

export const INDICADORES_BTC = [
  // --- Técnicos: los mismos cálculos, en velas de 7 días a la semana
  deSp('rsi'),
  { ...deSp('mm200'), marcos: ['diario', 'semanal'], que: 'Cuánto está el precio por encima o por debajo de su media de las últimas 200 velas. En diario es el "Mayer Multiple" (precio entre la media de 200 días); en semanal, la famosa media de 200 semanas de Bitcoin.',
    popular: 'Por encima de la media de 200, mercado alcista. La media de 200 semanas marca los suelos de cada ciclo. Mayer Multiple por encima de 2,4 = zona de techo.',
    reglas: [...deSp('mm200').reglas, { id: 'mayer>2.4', nombre: 'Precio > 2,4 veces la media', estado: v => v > 140 }] },
  deSp('faber'), { ...deSp('cruce'), marcos: ['diario', 'semanal'] }, deSp('mom'), deSp('macd'), deSp('boll'),
  { ...deSp('estoc'), que: 'Dónde está el cierre dentro del rango máximo-mínimo de las últimas 14 velas, suavizado a 3. Los máximos y mínimos vienen de Yahoo: solo desde septiembre de 2014.' },
  { ...deSp('caida'), popular: 'En Bitcoin se dice que los mercados bajistas tocan fondo con caídas del 75-85 % desde máximos.',
    reglas: [-20, -30, -50, -70, -80].map(u => ({ id: `caida${u}`, nombre: `Primera caída del ${-u} %`, evento: v => primerToque(v, u) })) },
  { ...deSp('vol'), nombre: 'Volatilidad realizada (30 días)', que: 'Desviación típica de las rentabilidades diarias de los últimos 30 días, anualizada con 365 días (Bitcoin cotiza todos los días).',
    reglas: [{ id: 'vol>100', nombre: 'Volatilidad > 100 %', estado: v => v > 100 }, { id: 'vol<40', nombre: 'Volatilidad < 40 %', estado: v => v < 40 }] },
  // --- Sentimiento
  { id: 'vix', nombre: 'VIX (miedo en bolsa)', familia: 'Sentimiento', marcos: TODOS, sentidoPopular: +1,
    que: 'El índice del miedo de la bolsa de EE. UU. ¿El pánico en las acciones dice algo de Bitcoin? En fin de semana se usa el último cierre del viernes.',
    popular: 'Cuando hay pánico en los mercados, Bitcoin cae con todo lo demás; luego rebota.',
    calc: (f, tf, ctx) => f.map(r => (r.date >= ctx.vixDesde ? ctx.vixPorFecha.at(r.date) : null)),
    reglas: [{ id: 'vix>30', nombre: 'VIX > 30', estado: v => v > 30 }, { id: 'vix<15', nombre: 'VIX < 15', estado: v => v < 15 }] },
  { id: 'fng', nombre: 'Miedo y codicia cripto', familia: 'Sentimiento', marcos: TODOS, sentidoPopular: -1,
    que: 'Índice de alternative.me (0 = miedo extremo, 100 = codicia extrema) que combina volatilidad, volumen, redes sociales, dominancia y búsquedas. Desde febrero de 2018.',
    popular: '"Sé codicioso cuando otros tienen miedo": comprar con miedo extremo, vender con codicia extrema.',
    calc: (f, tf, ctx) => f.map(r => (r.date >= ctx.fngDesde ? ctx.fng.at(r.date) : null)),
    reglas: [{ id: 'fng<25', nombre: 'Miedo extremo (< 25)', estado: v => v < 25 }, { id: 'fng>75', nombre: 'Codicia extrema (> 75)', estado: v => v > 75 }] },
  // --- Valoración de la red (el equivalente del CAPE en Bitcoin)
  { id: 'mvrv', nombre: 'MVRV', familia: 'Valoración', marcos: TODOS, sentidoPopular: -1,
    que: 'Capitalización de mercado entre capitalización realizada (cada moneda valorada al precio de su último movimiento). Mide cuánto gana o pierde de media quien tiene bitcoins.',
    popular: 'Por encima de 3,5, techo de ciclo; por debajo de 1 (el mercado en pérdidas), suelo.',
    calc: (f, tf, ctx) => f.map(r => ctx.mvrv.at(r.date)),
    reglas: [{ id: 'mvrv>3.5', nombre: 'MVRV > 3,5', estado: v => v > 3.5 }, { id: 'mvrv<1', nombre: 'MVRV < 1', estado: v => v < 1 }] },
  { id: 'puell', nombre: 'Puell Multiple', familia: 'Valoración', marcos: TODOS, sentidoPopular: -1,
    que: 'Ingresos diarios de los mineros (en dólares) entre su media del último año. Si los mineros ganan mucho más de lo normal, venden más.',
    popular: 'Por encima de 4, techo; por debajo de 0,5, suelo (los mineros capitulan).',
    calc: (f, tf, ctx) => f.map(r => ctx.puell.at(r.date)),
    reglas: [{ id: 'puell>4', nombre: 'Puell > 4', estado: v => v > 4 }, { id: 'puell<0.5', nombre: 'Puell < 0,5', estado: v => v < 0.5 }] },
  { id: 's2f', nombre: 'Desviación del stock-to-flow', familia: 'Valoración', marcos: TODOS, sentidoPopular: -1, desdeObs: '2019-03-22',
    aviso: 'El modelo se publicó en marzo de 2019 ajustado con los datos de hasta entonces, así que solo se evalúa desde esa fecha: es una prueba fuera de muestra.',
    que: 'Logaritmo del precio entre el precio del modelo stock-to-flow de PlanB (2019). Positivo = por encima del modelo.',
    popular: 'El precio vuelve siempre al modelo: por debajo, barato; por encima, caro.',
    calc: (f, tf, ctx) => f.map(r => ctx.s2f.at(r.date)),
    reglas: [{ id: 's2f<0', nombre: 'Por debajo del modelo', estado: v => v < 0 }] },
  { id: 'halving', nombre: 'Meses desde el último halving', familia: 'Valoración', marcos: TODOS, sentidoPopular: -1, unidad: 'meses',
    que: 'Tiempo desde el último halving (cuando se reduce a la mitad la emisión de nuevos bitcoins): nov. 2012, jul. 2016, may. 2020 y abr. 2024. No es una relación lineal, así que importa más el análisis por zonas que la correlación.',
    popular: 'El ciclo de 4 años: subida fuerte los 12-18 meses tras el halving, techo y después mercado bajista.',
    calc: f => f.map(r => mesesDesdeHalving(r.date)),
    reglas: [{ id: 'h0-12', nombre: 'Primer año tras el halving', estado: v => v < 12 }, { id: 'h12-18', nombre: '12-18 meses tras el halving', estado: v => v >= 12 && v < 18 },
      { id: 'h18-30', nombre: '18-30 meses tras el halving', estado: v => v >= 18 && v < 30 }, { id: 'h30+', nombre: 'Más de 30 meses tras el halving', estado: v => v >= 30 }] },
  { id: 'hash', nombre: 'Hash ribbons', familia: 'Valoración', marcos: TODOS, sentidoPopular: +1, unidad: '%',
    que: 'Media de 30 días del hashrate (potencia de minado) frente a la de 60. Negativa = los mineros apagan máquinas (capitulación).',
    popular: 'Cuando la media de 30 vuelve a cruzar por encima de la de 60 tras una capitulación, es señal de compra.',
    calc: (f, tf, ctx) => f.map(r => ctx.hash.at(r.date)),
    reglas: [{ id: 'capit', nombre: 'Capitulación de mineros', estado: v => v < 0 }, { id: 'hashCruce', nombre: 'Fin de la capitulación (cruce al alza)', evento: v => cruces(v, true) }] },
  // --- Macro: los mismos que en el S&P 500, más dos muy citados en cripto
  ...['curva3m', 'curva2a', 'credito', 'fed', 'fedCambio', 'inflacion', 'sahm', 'indpro', 'nfci'].map(deSp),
  { id: 'dolar', nombre: 'Dólar (variación en 12 meses)', familia: 'Macro', marcos: ['mensual'], sentidoPopular: -1, unidad: '%',
    que: 'Variación en un año del índice amplio del dólar de la Fed frente a las principales divisas.',
    popular: 'Dólar fuerte = malo para Bitcoin y para los activos de riesgo.',
    calc: (f, tf, ctx) => f.map(r => ctx.dolar(r.date)),
    reglas: [{ id: 'dolarSube', nombre: 'Dólar subiendo', estado: v => v > 0 }] },
  { id: 'm2', nombre: 'Masa monetaria M2 (interanual)', familia: 'Macro', marcos: ['mensual'], sentidoPopular: +1, unidad: '%',
    que: 'Crecimiento en 12 meses de la masa monetaria M2 de EE. UU. Se publica unas 4 semanas después del mes.',
    popular: '"Bitcoin sigue a la liquidez": cuando se imprime dinero, sube.',
    calc: (f, tf, ctx) => f.map(r => ctx.m2.at(r.date)),
    reglas: [{ id: 'm2<0', nombre: 'M2 contrayéndose', estado: v => v < 0 }] },
];
