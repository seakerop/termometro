// Definición y cálculo de todos los indicadores.
// Cada indicador devuelve un valor por vela del marco (null si aún no se puede calcular) y declara
// las reglas populares que se contrastan: "estados" (estar en una zona) y "eventos" (cruzar un umbral).
import { sp500, vix, fred, shiller, AsOf, disponibleMensual, RETRASO, addMonths, addDays } from './datos.mjs';

// ---------- Marcos temporales
export function agrupar(daily, keyFn) {
  const out = [];
  for (let i = 0; i < daily.length; i++) {
    const d = daily[i], k = keyFn(d.date), last = out.at(-1);
    if (last && last.key === k) {
      last.date = d.date; last.close = d.close; last.di = i;
      last.high = Math.max(last.high, d.high ?? d.close); last.low = Math.min(last.low, d.low ?? d.close);
      last.hlValido = last.hlValido && d.hlValido;
    } else out.push({ key: k, date: d.date, close: d.close, high: d.high ?? d.close, low: d.low ?? d.close, hlValido: d.hlValido, di: i });
  }
  return out;
}
export const semana = d => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() - (t.getUTCDay() + 6) % 7); return t.toISOString().slice(0, 10); };

export function cargarMarcos() {
  const daily = sp500().map((d, i) => ({ ...d, di: i }));
  return {
    diario: daily,
    semanal: agrupar(daily, semana),
    mensual: agrupar(daily, d => d.slice(0, 7)),
  };
}

// ---------- Utilidades de series
export const sma = (a, n) => { const o = new Array(a.length).fill(null); let s = 0, c = 0; for (let i = 0; i < a.length; i++) { if (a[i] == null) { s = 0; c = 0; continue; } s += a[i]; c++; if (c > n) s -= a[i - n]; if (c >= n) o[i] = s / n; } return o; };
export const ema = (a, n) => { const o = new Array(a.length).fill(null), k = 2 / (n + 1); let e = null, c = 0, s = 0; for (let i = 0; i < a.length; i++) { const v = a[i]; if (v == null) continue; if (e == null) { s += v; c++; if (c === n) { e = s / n; o[i] = e; } } else { e = v * k + e * (1 - k); o[i] = e; } } return o; };
export const rollingStd = (a, n) => { const o = new Array(a.length).fill(null); for (let i = n - 1; i < a.length; i++) { let m = 0; for (let k = i - n + 1; k <= i; k++) m += a[k]; m /= n; let s = 0; for (let k = i - n + 1; k <= i; k++) s += (a[k] - m) ** 2; o[i] = Math.sqrt(s / n); } return o; };
export function rsiWilder(c, n = 14) {
  const o = new Array(c.length).fill(null); let g = 0, l = 0;
  for (let i = 1; i < c.length; i++) {
    const ch = c[i] - c[i - 1], G = Math.max(ch, 0), L = Math.max(-ch, 0);
    if (i <= n) { g += G / n; l += L / n; if (i < n) continue; } else { g = (g * (n - 1) + G) / n; l = (l * (n - 1) + L) / n; }
    o[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
  }
  return o;
}
export const cruces = (v, haciaArriba) => v.map((x, i) => i > 0 && x != null && v[i - 1] != null && (haciaArriba ? v[i - 1] <= 0 && x > 0 : v[i - 1] > 0 && x <= 0));
// Primera vez que la caída desde máximos supera un umbral desde el último máximo histórico
export function primerToque(dd, umbral) {
  const o = new Array(dd.length).fill(false); let armado = true;
  for (let i = 0; i < dd.length; i++) { if (dd[i] == null) continue; if (dd[i] >= 0) armado = true; else if (armado && dd[i] <= umbral) { o[i] = true; armado = false; } }
  return o;
}
// Primera vez que se cumple una condición tras al menos `pausa` velas sin cumplirse (también al principio de la serie)
export function primeraVez(v, cond, pausa) {
  const o = new Array(v.length).fill(false); let sin = 0;
  for (let i = 0; i < v.length; i++) { if (v[i] == null) continue; if (cond(v[i])) { if (sin >= pausa) o[i] = true; sin = 0; } else sin++; }
  return o;
}

// Barras equivalentes por marco
export const BARRAS = { diario: { mes: 21, ano: 252 }, semanal: { mes: 4, ano: 52 }, mensual: { mes: 1, ano: 12 } };
const TODOS = ['diario', 'semanal', 'mensual'];

// ---------- Contexto con todas las fuentes externas ya alineadas por fecha de disponibilidad
export function cargarContexto(marcos) {
  const daily = marcos.diario;
  // Volatilidad realizada a 1 mes (21 sesiones), anualizada, en %
  const lr = daily.map((d, i) => (i ? Math.log(d.close / daily[i - 1].close) : 0));
  const vol21 = rollingStd(lr, 21).map((s, i) => (i >= 21 && s != null ? s * Math.sqrt(252) * 100 : null));
  const volPorFecha = new AsOf(daily.map((d, i) => ({ date: d.date, value: vol21[i] })));
  const vixDia = vix();
  const vixPorFecha = new AsOf(vixDia.map(d => ({ date: d.date, value: d.close })));
  const cierrePorFecha = new AsOf(daily.map(d => ({ date: d.date, value: d.close })));

  const sh = shiller();
  const shIdx = new Map(sh.map((r, i) => [r.month, i]));
  // Media real de 10 años de beneficios, expresada en dólares del propio mes M
  const realE10 = sh.map((r, i) => {
    if (i < 119) return null; let s = 0;
    for (let k = 0; k < 120; k++) { const q = sh[i - k]; if (q.E == null || q.CPI == null || r.CPI == null) return null; s += q.E * r.CPI / q.CPI; }
    return s / 120;
  });
  // Inflación anualizada de los 10 años anteriores (para el tipo real del ECY de Shiller)
  const infl10 = sh.map((r, i) => (i >= 120 && r.CPI && sh[i - 120].CPI ? ((r.CPI / sh[i - 120].CPI) ** 0.1 - 1) * 100 : null));
  const mesD = m => m + '-01';
  const sE = new AsOf(sh.map(r => ({ date: addMonths(mesD(r.month), RETRASO.beneficios), value: r.E })));
  const sD = new AsOf(sh.map(r => ({ date: addMonths(mesD(r.month), RETRASO.beneficios), value: r.D })));
  // índice del último mes de Shiller con beneficios conocidos / con IPC conocido
  const sMesBenef = new AsOf(sh.map((r, i) => ({ date: addMonths(mesD(r.month), RETRASO.beneficios), value: r.E != null ? i : null })));
  const sMesIPC = new AsOf(sh.map((r, i) => ({ date: addMonths(mesD(r.month), RETRASO.datoMacro), value: r.CPI != null ? i : null })));
  const sGS10 = new AsOf(sh.map(r => ({ date: addMonths(mesD(r.month), RETRASO.mediaMensual), value: r.GS10 })));

  const F = id => fred(id);
  const gs10fred = F('GS10');
  // Bono a 10 años: FRED desde 1953 y la serie larga de Shiller antes (coinciden desde 1953)
  const primerGS10 = gs10fred[0].date.slice(0, 7);
  const gs10 = [...sh.filter(r => r.month < primerGS10 && r.GS10 != null).map(r => ({ date: mesD(r.month), value: r.GS10 })), ...gs10fred];
  const m = (serie, lag) => disponibleMensual(serie, lag);
  const yoy = serie => serie.map((d, i) => { const j = serie.findIndex(x => x.date === addMonths(d.date, -12)); return { date: d.date, value: j >= 0 ? (d.value / serie[j].value - 1) * 100 : null }; });
  const cambio12 = serie => serie.map((d, i) => { const j = serie.findIndex(x => x.date === addMonths(d.date, -12)); return { date: d.date, value: j >= 0 ? d.value - serie[j].value : null }; });
  const ur = F('UNRATE');
  const ur3 = ur.map((d, i) => ({ date: d.date, value: i >= 2 ? (ur[i].value + ur[i - 1].value + ur[i - 2].value) / 3 : null }));
  const sahm = ur3.map((d, i) => { if (i < 14 || d.value == null) return { date: d.date, value: null }; let mn = Infinity; for (let k = i - 12; k < i; k++) mn = Math.min(mn, ur3[k].value); return { date: d.date, value: d.value - mn }; });
  // Indicador Buffett: valor de mercado Z.1 al cierre del trimestre, actualizado con lo que ha hecho el S&P desde entonces, entre el último PIB conocido
  const z1 = F('NCBEILQ027S'), gdp = F('GDP');
  const finTrim = d => addDays(addMonths(d, 3), -1);
  const z1Disp = new AsOf(z1.map(d => ({ date: addMonths(d.date, RETRASO.trimestral), value: d.value / 1000 }))); // miles de millones
  const z1Fin = new AsOf(z1.map(d => ({ date: addMonths(d.date, RETRASO.trimestral), value: cierrePorFecha.at(finTrim(d.date)) })));
  const gdpDisp = new AsOf(gdp.map(d => ({ date: addMonths(d.date, RETRASO.trimestral), value: d.value })));

  return {
    volPorFecha, vixPorFecha, vixDesde: vixDia[0].date, cierrePorFecha,
    sh, shIdx, realE10, infl10, sE, sD, sMesBenef, sMesIPC, sGS10,
    gs10: m(gs10, RETRASO.mediaMensual),
    tb3: m(F('TB3MS'), RETRASO.mediaMensual),
    baa: m(F('BAA'), RETRASO.mediaMensual),
    ff: m(F('FEDFUNDS'), RETRASO.mediaMensual),
    ffCambio: m(cambio12(F('FEDFUNDS')), RETRASO.mediaMensual),
    inflacion: m(yoy(F('CPIAUCNS')), RETRASO.datoMacro),
    sahm: m(sahm, RETRASO.datoMacro),
    indpro: m(yoy(F('INDPRO')), RETRASO.datoMacro),
    t10y2y: new AsOf(F('T10Y2Y').map(d => ({ date: addDays(d.date, 1), value: d.value }))), // se publica al día siguiente
    nfci: new AsOf(F('NFCI').map(d => ({ date: addDays(d.date, 7), value: d.value }))),     // semana que acaba el viernes, publicada el miércoles
    buffett: date => { const z = z1Disp.at(date), pz = z1Fin.at(date), g = gdpDisp.at(date), p = cierrePorFecha.at(date); return z && pz && g && p ? (z * p / pz) / g * 100 : null; },
  };
}

// CAPE, PER, dividendo y ECY en una fecha, usando solo lo publicado hasta entonces. `precio` es el del momento.
function valoracion(ctx, date, precio) {
  const iB = ctx.sMesBenef.at(date), iC = ctx.sMesIPC.at(date);
  if (iB == null || iC == null || precio == null) return null;
  const sh = ctx.sh, e10 = ctx.realE10[iB];
  const out = { per: sh[iB].E ? precio / sh[iB].E : null, dy: sh[iB].D != null ? sh[iB].D / precio * 100 : null, cape: null, ecy: null };
  if (e10) {
    out.cape = precio / (e10 * sh[iC].CPI / sh[iB].CPI); // beneficios llevados a dólares del último IPC conocido
    const gs = ctx.sGS10.at(date), inf = ctx.infl10[iC];
    if (gs != null && inf != null) out.ecy = 100 / out.cape - (gs - inf);
  }
  return out;
}

// ---------- Catálogo
// sentidoPopular: +1 si la creencia popular es "más valor → más subida"; −1 si es "más valor → menos subida".
export const INDICADORES = [
  // --- Técnicos
  { id: 'rsi', nombre: 'RSI (14)', familia: 'Técnico', marcos: TODOS, sentidoPopular: -1,
    que: 'Fuerza relativa de Wilder: compara las subidas y bajadas de las últimas 14 velas. Va de 0 a 100.',
    popular: 'Por debajo de 30 está "sobrevendido" (toca rebote); por encima de 70, "sobrecomprado".',
    calc: (f) => rsiWilder(f.map(r => r.close)),
    reglas: [{ id: 'rsi<30', nombre: 'RSI < 30', estado: v => v < 30 }, { id: 'rsi>70', nombre: 'RSI > 70', estado: v => v > 70 }] },
  { id: 'mm200', nombre: 'Distancia a la media de 200', familia: 'Técnico', marcos: TODOS, sentidoPopular: +1, unidad: '%',
    que: 'Cuánto está el precio por encima (+) o por debajo (−) de su media de las últimas 200 velas. En semanal es la famosa media de 200 semanas.',
    popular: 'Por encima de la media de 200 el mercado es alcista; por debajo, mejor no estar.',
    calc: (f) => { const c = f.map(r => r.close), s = sma(c, 200); return c.map((x, i) => (s[i] ? (x / s[i] - 1) * 100 : null)); },
    reglas: [{ id: '>mm200', nombre: 'Precio sobre la media', estado: v => v > 0 }, { id: '<mm200', nombre: 'Precio bajo la media', estado: v => v <= 0 }] },
  { id: 'faber', nombre: 'Regla de los 10 meses (Faber)', familia: 'Técnico', marcos: ['mensual'], sentidoPopular: +1, unidad: '%',
    que: 'Distancia del cierre mensual a su media de 10 meses (unas 200 sesiones). Es la regla de Mebane Faber (2007).',
    popular: 'Invertido si el cierre de mes está sobre la media de 10 meses; en liquidez si está debajo.',
    calc: (f) => { const c = f.map(r => r.close), s = sma(c, 10); return c.map((x, i) => (s[i] ? (x / s[i] - 1) * 100 : null)); },
    reglas: [{ id: '>mm10', nombre: 'Sobre la media de 10 meses', estado: v => v > 0 }, { id: '<mm10', nombre: 'Bajo la media de 10 meses', estado: v => v <= 0 },
      { id: 'cruceArriba', nombre: 'Cruza hacia arriba', evento: v => cruces(v, true) }, { id: 'cruceAbajo', nombre: 'Cruza hacia abajo', evento: v => cruces(v, false) }] },
  { id: 'cruce', nombre: 'Media de 50 frente a la de 200', familia: 'Técnico', marcos: TODOS, sentidoPopular: +1, unidad: '%',
    que: 'Distancia entre la media de 50 velas y la de 200. Cuando pasa de negativa a positiva es el "cruce dorado"; al revés, el "cruce de la muerte".',
    popular: 'El cruce dorado anuncia subidas; el de la muerte, bajadas.',
    calc: (f) => { const c = f.map(r => r.close), a = sma(c, 50), b = sma(c, 200); return c.map((x, i) => (a[i] && b[i] ? (a[i] / b[i] - 1) * 100 : null)); },
    reglas: [{ id: 'dorado', nombre: 'Cruce dorado', evento: v => cruces(v, true) }, { id: 'muerte', nombre: 'Cruce de la muerte', evento: v => cruces(v, false) }] },
  { id: 'mom', nombre: 'Momentum 12-1', familia: 'Técnico', marcos: TODOS, sentidoPopular: +1, unidad: '%',
    que: 'Rentabilidad de los últimos 12 meses sin contar el último (el mes más reciente tiende a revertir).',
    popular: 'Lo que viene subiendo sigue subiendo (momentum de serie temporal).',
    calc: (f, tf, ctx) => { const c = f.map(r => r.close), { mes, ano } = (ctx?.barras || BARRAS)[tf]; return c.map((x, i) => (i >= ano ? (c[i - mes] / c[i - ano] - 1) * 100 : null)); },
    reglas: [{ id: 'mom>0', nombre: 'Momentum positivo', estado: v => v > 0 }, { id: 'mom<0', nombre: 'Momentum negativo', estado: v => v <= 0 }] },
  { id: 'macd', nombre: 'MACD (12, 26, 9)', familia: 'Técnico', marcos: TODOS, sentidoPopular: +1, unidad: '% del precio',
    que: 'Histograma del MACD (línea MACD menos su señal), dividido por el precio para poder comparar 1930 con 2026.',
    popular: 'Cuando la línea MACD cruza por encima de la señal, compra; por debajo, venta.',
    calc: (f) => { const c = f.map(r => r.close), e12 = ema(c, 12), e26 = ema(c, 26); const mac = c.map((x, i) => (e12[i] != null && e26[i] != null ? e12[i] - e26[i] : null)); const sig = ema(mac, 9); return c.map((x, i) => (mac[i] != null && sig[i] != null ? (mac[i] - sig[i]) / x * 100 : null)); },
    reglas: [{ id: 'macdArriba', nombre: 'Cruce alcista', evento: v => cruces(v, true) }, { id: 'macdAbajo', nombre: 'Cruce bajista', evento: v => cruces(v, false) }] },
  { id: 'boll', nombre: 'Bandas de Bollinger (%B)', familia: 'Técnico', marcos: TODOS, sentidoPopular: -1,
    que: 'Posición del precio dentro de las bandas de Bollinger (media de 20 ± 2 desviaciones). 0 = banda inferior, 1 = banda superior.',
    popular: 'Perforar la banda inferior es exceso de venta y anticipa rebote.',
    calc: (f) => { const c = f.map(r => r.close), m = sma(c, 20), s = rollingStd(c, 20); return c.map((x, i) => (m[i] != null && s[i] ? (x - (m[i] - 2 * s[i])) / (4 * s[i]) : null)); },
    reglas: [{ id: 'b<0', nombre: 'Bajo la banda inferior', estado: v => v < 0 }, { id: 'b>1', nombre: 'Sobre la banda superior', estado: v => v > 1 }] },
  { id: 'estoc', nombre: 'Estocástico (14, 3)', familia: 'Técnico', marcos: TODOS, sentidoPopular: -1,
    que: 'Dónde está el cierre dentro del rango máximo-mínimo de las últimas 14 velas, suavizado a 3. Necesita máximos y mínimos reales: solo desde 1962.',
    popular: 'Por debajo de 20, sobreventa; por encima de 80, sobrecompra.',
    calc: (f) => { const n = 14, k = f.map((r, i) => { if (i < n - 1) return null; let hi = -Infinity, lo = Infinity; for (let j = i - n + 1; j <= i; j++) { if (!f[j].hlValido) return null; hi = Math.max(hi, f[j].high); lo = Math.min(lo, f[j].low); } return hi > lo ? (r.close - lo) / (hi - lo) * 100 : null; }); return sma(k, 3); },
    reglas: [{ id: 'e<20', nombre: 'Estocástico < 20', estado: v => v < 20 }, { id: 'e>80', nombre: 'Estocástico > 80', estado: v => v > 80 }] },
  { id: 'caida', nombre: 'Caída desde máximos', familia: 'Técnico', marcos: TODOS, sentidoPopular: -1, unidad: '%',
    que: 'Cuánto está el índice por debajo de su máximo histórico (0 = en máximos).',
    popular: '"Compra las caídas": entrar tras una corrección del 10 %, un mercado bajista del 20 % o un desplome del 30-40 %.',
    calc: (f) => { let mx = -Infinity; return f.map(r => { mx = Math.max(mx, r.close); return (r.close / mx - 1) * 100; }); },
    reglas: [-10, -20, -30, -40].map(u => ({ id: `caida${u}`, nombre: `Primera caída del ${-u} %`, evento: v => primerToque(v, u) })) },
  { id: 'vol', nombre: 'Volatilidad realizada (1 mes)', familia: 'Técnico', marcos: TODOS, sentidoPopular: +1, unidad: '% anual',
    que: 'Desviación típica de las rentabilidades diarias de las últimas 21 sesiones, anualizada. Mide el miedo real, no el esperado.',
    popular: 'Cuando la volatilidad se dispara hay pánico, y el pánico es oportunidad de compra.',
    calc: (f, tf, ctx) => f.map(r => ctx.volPorFecha.at(r.date)),
    reglas: [{ id: 'vol>30', nombre: 'Volatilidad > 30 %', estado: v => v > 30 }, { id: 'vol<10', nombre: 'Volatilidad < 10 %', estado: v => v < 10 }] },
  // --- Sentimiento
  { id: 'vix', nombre: 'VIX', familia: 'Sentimiento', marcos: TODOS, sentidoPopular: +1,
    que: 'Volatilidad que descuentan las opciones del S&P 500 a 30 días. El "índice del miedo". Desde 1990.',
    popular: 'VIX por encima de 30-40 = pánico = comprar. VIX muy bajo = complacencia.',
    calc: (f, tf, ctx) => f.map(r => (r.date >= ctx.vixDesde ? ctx.vixPorFecha.at(r.date) : null)),
    reglas: [{ id: 'vix>30', nombre: 'VIX > 30', estado: v => v > 30 }, { id: 'vix>40', nombre: 'VIX > 40', estado: v => v > 40 }, { id: 'vix<12', nombre: 'VIX < 12', estado: v => v < 12 },
      { id: 'vix40', nombre: 'Primer cierre del VIX sobre 40', evento: (v, tf) => primeraVez(v, x => x > 40, BARRAS[tf].mes * 3) }] },
  { id: 'vrp', nombre: 'VIX menos volatilidad realizada', familia: 'Sentimiento', marcos: TODOS, sentidoPopular: +1, unidad: 'puntos',
    que: 'Diferencia entre el miedo que descuentan las opciones (VIX) y la volatilidad que de verdad está habiendo. Desde 1990.',
    popular: 'Si el mercado paga mucho por protegerse respecto al riesgo real, hay más miedo del justificado.',
    calc: (f, tf, ctx) => f.map(r => { if (r.date < ctx.vixDesde) return null; const a = ctx.vixPorFecha.at(r.date), b = ctx.volPorFecha.at(r.date); return a != null && b != null ? a - b : null; }),
    reglas: [{ id: 'vrp<0', nombre: 'VIX por debajo de la volatilidad real', estado: v => v < 0 }] },
  // --- Valoración (mensual)
  { id: 'cape', nombre: 'CAPE de Shiller', familia: 'Valoración', marcos: ['mensual'], sentidoPopular: -1, largo: true,
    que: 'Precio entre la media de beneficios reales de 10 años. Suaviza el ciclo económico.',
    popular: 'CAPE alto = rentabilidades bajas en la década siguiente. Por encima de 30 se considera caro.',
    calc: (f, tf, ctx) => f.map(r => valoracion(ctx, r.date, r.close)?.cape ?? null),
    reglas: [{ id: 'cape>30', nombre: 'CAPE > 30', estado: v => v > 30 }, { id: 'cape<10', nombre: 'CAPE < 10', estado: v => v < 10 }] },
  { id: 'per', nombre: 'PER (12 meses)', familia: 'Valoración', marcos: ['mensual'], sentidoPopular: -1, largo: true,
    que: 'Precio entre los beneficios de los últimos 12 meses.',
    popular: 'PER alto = mercado caro. Por encima de 25, caro; por debajo de 10, barato.',
    calc: (f, tf, ctx) => f.map(r => valoracion(ctx, r.date, r.close)?.per ?? null),
    reglas: [{ id: 'per>25', nombre: 'PER > 25', estado: v => v > 25 }, { id: 'per<10', nombre: 'PER < 10', estado: v => v < 10 }] },
  { id: 'dy', nombre: 'Rentabilidad por dividendo', familia: 'Valoración', marcos: ['mensual'], sentidoPopular: +1, unidad: '%', largo: true,
    que: 'Dividendos de los últimos 12 meses entre el precio.',
    popular: 'Dividendo alto = mercado barato.',
    calc: (f, tf, ctx) => f.map(r => valoracion(ctx, r.date, r.close)?.dy ?? null),
    reglas: [{ id: 'dy<2', nombre: 'Dividendo < 2 %', estado: v => v < 2 }, { id: 'dy>5', nombre: 'Dividendo > 5 %', estado: v => v > 5 }] },
  { id: 'ecy', nombre: 'Prima de la bolsa sobre el bono (ECY)', familia: 'Valoración', marcos: ['mensual'], sentidoPopular: +1, unidad: 'puntos', largo: true,
    que: 'Excess CAPE Yield de Shiller: rentabilidad por beneficios (1/CAPE) menos el tipo real del bono a 10 años (tipo nominal menos la inflación media de los 10 años anteriores).',
    popular: 'Mide si la bolsa está cara o barata en comparación con los bonos, no en absoluto.',
    calc: (f, tf, ctx) => f.map(r => valoracion(ctx, r.date, r.close)?.ecy ?? null),
    reglas: [{ id: 'ecy<0', nombre: 'Prima negativa', estado: v => v < 0 }] },
  { id: 'buffett', nombre: 'Indicador Buffett', familia: 'Valoración', marcos: ['mensual'], sentidoPopular: -1, unidad: '% del PIB',
    que: 'Valor en bolsa de las empresas no financieras de EE. UU. (cuentas Z.1 de la Fed) entre el PIB, actualizado con lo que ha hecho el S&P desde el último dato. Desde 1947.',
    popular: 'Por encima del 100-150 % del PIB, la bolsa está sobrevalorada.',
    calc: (f, tf, ctx) => f.map(r => ctx.buffett(r.date)),
    reglas: [] },
  // --- Macro, tipos y crédito (mensual)
  { id: 'curva3m', nombre: 'Curva de tipos 10 años − 3 meses', familia: 'Macro', marcos: ['mensual'], sentidoPopular: +1, unidad: 'puntos',
    que: 'Bono a 10 años menos letra a 3 meses (medias mensuales). Negativa = curva invertida. Desde 1934.',
    popular: 'Curva invertida = recesión en 6-18 meses = bajada de la bolsa.',
    calc: (f, tf, ctx) => f.map(r => { const a = ctx.gs10.at(r.date), b = ctx.tb3.at(r.date); return a != null && b != null ? a - b : null; }),
    reglas: [{ id: 'inv3m', nombre: 'Curva invertida', estado: v => v < 0 }, { id: 'inv3mEv', nombre: 'Primera inversión en 12 meses', evento: v => primeraVez(v, x => x < 0, 12) }] },
  { id: 'curva2a', nombre: 'Curva de tipos 10 años − 2 años', familia: 'Macro', marcos: ['mensual'], sentidoPopular: +1, unidad: 'puntos',
    que: 'Diferencial diario entre el bono a 10 y a 2 años, el más citado por la prensa. Desde 1976.',
    popular: 'Igual que la anterior: invertida = recesión.',
    calc: (f, tf, ctx) => f.map(r => ctx.t10y2y.at(r.date)),
    reglas: [{ id: 'inv2a', nombre: 'Curva invertida', estado: v => v < 0 }, { id: 'inv2aEv', nombre: 'Primera inversión en 12 meses', evento: v => primeraVez(v, x => x < 0, 12) }] },
  { id: 'credito', nombre: 'Diferencial de crédito Baa − bono 10 años', familia: 'Macro', marcos: ['mensual'], sentidoPopular: +1, unidad: 'puntos',
    que: 'Cuánto más pagan las empresas de calidad media (Baa de Moody\'s) que el Tesoro. Sube cuando el mercado teme impagos. Desde 1919.',
    popular: 'Diferencial disparado = estrés financiero; los contrarios lo ven como momento de compra.',
    calc: (f, tf, ctx) => f.map(r => { const a = ctx.baa.at(r.date), b = ctx.gs10.at(r.date); return a != null && b != null ? a - b : null; }),
    reglas: [] },
  { id: 'fed', nombre: 'Tipo de la Fed', familia: 'Macro', marcos: ['mensual'], sentidoPopular: -1, unidad: '%',
    que: 'Tipo efectivo de los fondos federales (media mensual). Desde 1954.',
    popular: 'Tipos altos frenan la economía y la bolsa.',
    calc: (f, tf, ctx) => f.map(r => ctx.ff.at(r.date)),
    reglas: [] },
  { id: 'fedCambio', nombre: 'Cambio del tipo de la Fed en 12 meses', familia: 'Macro', marcos: ['mensual'], sentidoPopular: -1, unidad: 'puntos',
    que: 'Cuánto ha subido (+) o bajado (−) el tipo de la Fed en el último año.',
    popular: '"No luches contra la Fed": con la Fed bajando tipos, la bolsa sube.',
    calc: (f, tf, ctx) => f.map(r => ctx.ffCambio.at(r.date)),
    reglas: [{ id: 'fedSube', nombre: 'Fed subiendo tipos', estado: v => v > 0 }, { id: 'fedBaja', nombre: 'Fed bajando tipos', estado: v => v < 0 }] },
  { id: 'inflacion', nombre: 'Inflación (IPC interanual)', familia: 'Macro', marcos: ['mensual'], sentidoPopular: -1, unidad: '%',
    que: 'Variación del IPC en 12 meses. Desde 1914.',
    popular: 'Inflación alta es mala para la bolsa (sube tipos y comprime múltiplos).',
    calc: (f, tf, ctx) => f.map(r => ctx.inflacion.at(r.date)),
    reglas: [{ id: 'inf>5', nombre: 'Inflación > 5 %', estado: v => v > 5 }, { id: 'inf<0', nombre: 'Deflación', estado: v => v < 0 }] },
  { id: 'sahm', nombre: 'Regla de Sahm (paro)', familia: 'Macro', marcos: ['mensual'], sentidoPopular: -1, unidad: 'puntos',
    que: 'Media de 3 meses del paro menos su mínimo de los 12 meses anteriores. Desde 1949.',
    popular: 'Cuando supera 0,5 puntos, la economía ya está en recesión.',
    calc: (f, tf, ctx) => f.map(r => ctx.sahm.at(r.date)),
    reglas: [{ id: 'sahm', nombre: 'Regla activada (≥ 0,5)', estado: v => v >= 0.5 }, { id: 'sahmEv', nombre: 'Se activa la regla', evento: v => primeraVez(v, x => x >= 0.5, 12) }] },
  { id: 'indpro', nombre: 'Producción industrial (interanual)', familia: 'Macro', marcos: ['mensual'], sentidoPopular: +1, unidad: '%',
    que: 'Variación en 12 meses de la producción industrial. Sustituye al PMI del ISM, que ya no está en FRED. Desde 1920.',
    popular: 'Economía creciendo = bolsa subiendo.',
    calc: (f, tf, ctx) => f.map(r => ctx.indpro.at(r.date)),
    reglas: [{ id: 'ip<0', nombre: 'Producción cayendo', estado: v => v < 0 }] },
  { id: 'nfci', nombre: 'Condiciones financieras (NFCI)', familia: 'Macro', marcos: ['mensual'], sentidoPopular: -1,
    que: 'Índice de la Fed de Chicago que resume 105 indicadores de crédito, liquidez y riesgo. Positivo = más tenso que la media. Desde 1971.',
    popular: 'Condiciones financieras tensas = malo para la bolsa.',
    calc: (f, tf, ctx) => f.map(r => ctx.nfci.at(r.date)),
    reglas: [{ id: 'nfci>0', nombre: 'Condiciones más tensas que la media', estado: v => v > 0 }] },
];

// Versión larga de la valoración con los datos de Shiller desde 1881 (precio medio mensual y rentabilidad total real)
export function marcoLargo(ctx) {
  return ctx.sh.filter(r => r.P != null).map(r => ({ date: r.month + '-15', month: r.month, close: r.P, realTR: r.realTR }));
}
export function valoracionLarga(ctx, f) {
  // En la historia larga el precio es la media mensual de Shiller; los beneficios llevan el mismo retraso de 4 meses
  const v = f.map(r => valoracion(ctx, r.month + '-28', r.close));
  return { cape: v.map(x => x?.cape ?? null), per: v.map(x => x?.per ?? null), dy: v.map(x => x?.dy ?? null), ecy: v.map(x => x?.ecy ?? null) };
}
