// Motor del análisis, común a todos los activos: rentabilidades futuras, bootstrap, zonas, reglas,
// corrección por comparaciones múltiples y niveles de evidencia.
import { writeFileSync, mkdirSync } from 'node:fs';
import { addMonths, addDays } from './datos.mjs';
import { mean, median, ranks, pearson, rng, sd, normCdf, bhAdjust, binomTest, expandingPercentile, corrPConservador, parcial } from './estadistica.mjs';

const t0 = Date.now();
export const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0).padStart(4)} s]`, ...a);

export function lowerBound(f, date) { let lo = 0, hi = f.length; while (lo < hi) { const m = (lo + hi) >> 1; if (f[m].date < date) lo = m + 1; else hi = m; } return lo; }

// ---------- Rentabilidades futuras
// En velas mensuales se avanza exactamente N velas: por calendario, "28-02 + 1 mes" caería antes del cierre de marzo.
// La última vela mensual solo cuenta si el mes ya ha terminado: su fecha es el último día laborable del mes
// (o el último día natural, en activos que cotizan todos los días).
export function futurasMensual(f, meses, campo = 'close', { todosLosDias = false } = {}) {
  const out = new Array(f.length).fill(null), u = f.at(-1).date;
  const finMes = new Date(Date.UTC(+u.slice(0, 4), +u.slice(5, 7), 0));
  if (!todosLosDias) while ([0, 6].includes(finMes.getUTCDay())) finMes.setUTCDate(finMes.getUTCDate() - 1);
  const ultimaValida = u >= finMes.toISOString().slice(0, 10) ? f.length - 1 : f.length - 2;
  for (let i = 0; i + meses <= ultimaValida; i++) if (f[i][campo] != null && f[i + meses][campo] != null) out[i] = f[i + meses][campo] / f[i][campo] - 1;
  return out;
}
// Resto de marcos: del cierre de la vela i al último cierre conocido en la fecha objetivo.
// Si la fecha objetivo cae después de la última vela, no hay dato (no se usa un periodo a medias).
export function futuras(f, meses, campo = 'close') {
  const out = new Array(f.length).fill(null), ultima = f.at(-1).date;
  for (let i = 0; i < f.length; i++) {
    const objetivo = addMonths(f[i].date, meses);
    if (objetivo > ultima) break;
    const j = lowerBound(f, addDays(objetivo, 1)) - 1;
    if (j > i && f[i][campo] != null && f[j][campo] != null) out[i] = f[j][campo] / f[i][campo] - 1;
  }
  return out;
}

// Horizonte en velas (1, 5, 10 sesiones): la rentabilidad va del cierre de la vela i al de la vela i + N
export function futurasVelas(f, velas) {
  const out = new Array(f.length).fill(null);
  for (let i = 0; i + velas < f.length; i++) if (f[i].close != null && f[i + velas].close != null) out[i] = f[i + velas].close / f[i].close - 1;
  return out;
}

// ---------- Bootstrap por bloques circulares con estadístico vectorial (una remuestra para todas las medidas)
function bootstrap(n, block, reps, statVec, estimates, seed) {
  const rand = rng(seed), k = estimates.length, samples = Array.from({ length: k }, () => []);
  const idx = new Uint32Array(n);
  block = Math.max(1, Math.min(block, Math.floor(n / 2)));
  for (let r = 0; r < reps; r++) {
    let c = 0;
    while (c < n) { const s = Math.floor(rand() * n); for (let b = 0; b < block && c < n; b++) idx[c++] = (s + b) % n; }
    const v = statVec(idx);
    for (let j = 0; j < k; j++) if (Number.isFinite(v[j])) samples[j].push(v[j]);
  }
  return estimates.map((est, j) => {
    const s = samples[j].sort((a, b) => a - b);
    if (s.length < reps * 0.5 || !Number.isFinite(est)) return { ic: null, p: null };
    const se = sd(s);
    return { ic: [s[Math.floor(s.length * 0.025)], s[Math.min(s.length - 1, Math.floor(s.length * 0.975))]], p: se > 0 ? 2 * (1 - normCdf(Math.abs(est / se))) : 1 };
  });
}

// ---------- Análisis de un indicador en un marco y horizonte
let semilla = 20261016;
export function analizar({ f, v, fwd, tf, hz, reglas, pct, reps, desdeObs = null }) {
  const obs = [];
  for (let i = 0; i < f.length; i++) if (v[i] != null && Number.isFinite(v[i]) && fwd[i] != null && (!desdeObs || f[i].date >= desdeObs)) obs.push(i);
  if (obs.length < 30) return null;
  const n = obs.length, x = obs.map(i => v[i]), y = obs.map(i => fwd[i]), up = y.map(r => (r > 0 ? 1 : 0));
  const anos = (Date.parse(f[obs.at(-1)].date) - Date.parse(f[obs[0]].date)) / 3.15576e10;
  const block = hz.velas ? hz.velas : Math.max(1, Math.round(n / anos * hz.meses / 12));
  // separados lo bastante para no compartir periodo: por fecha (meses) o por posición (velas)
  const separados = (iPrev, iNew) => (hz.velas ? iNew - iPrev >= hz.velas : f[iNew].date >= addMonths(f[iPrev].date, hz.meses));
  const quint = obs.map(i => (pct[i] == null ? -1 : Math.min(4, Math.floor(pct[i] * 5))));
  const estados = reglas.filter(r => r.estado).map(r => ({ ...r, en: x.map(r.estado) }));

  const rho = pearson(ranks(x), ranks(y));
  const conQ = quint.map(q => q >= 0);
  const nQ = conQ.filter(Boolean).length;
  const baseQ = nQ ? up.reduce((s, u, i) => s + (conQ[i] ? u : 0), 0) / nQ : null;
  const baseQmedia = nQ ? y.reduce((s, r, i) => s + (conQ[i] ? r : 0), 0) / nQ : null;
  const base = mean(up), baseMedia = mean(y);

  // [rho, dif %subida Q1..Q5, dif media Q1..Q5, dif %subida estado1.., dif media estado1..]
  const statVec = (idx) => {
    const out = [];
    const xs = new Float64Array(idx.length), ys = new Float64Array(idx.length);
    for (let k = 0; k < idx.length; k++) { xs[k] = x[idx[k]]; ys[k] = y[idx[k]]; }
    out.push(pearson(ranks(xs), ranks(ys)));
    const cU = [0, 0, 0, 0, 0], cN = [0, 0, 0, 0, 0], cR = [0, 0, 0, 0, 0]; let tU = 0, tN = 0, tR = 0;
    for (const i of idx) { const q = quint[i]; if (q < 0) continue; cN[q]++; cU[q] += up[i]; cR[q] += y[i]; tN++; tU += up[i]; tR += y[i]; }
    for (let q = 0; q < 5; q++) out.push(cN[q] ? cU[q] / cN[q] - tU / tN : NaN);
    for (let q = 0; q < 5; q++) out.push(cN[q] ? cR[q] / cN[q] - tR / tN : NaN);
    let aU = 0, aR = 0; for (const i of idx) { aU += up[i]; aR += y[i]; }
    for (const e of estados) { let eN = 0, eU = 0; for (const i of idx) if (e.en[i]) { eN++; eU += up[i]; } out.push(eN ? eU / eN - aU / idx.length : NaN); }
    for (const e of estados) { let eN = 0, eR = 0; for (const i of idx) if (e.en[i]) { eN++; eR += y[i]; } out.push(eN ? eR / eN - aR / idx.length : NaN); }
    return out;
  };
  const est = statVec(Uint32Array.from({ length: n }, (_, k) => k));
  const bs = bootstrap(n, block, reps, statVec, est, semilla++);

  // Prueba conservadora: solo observaciones separadas al menos un horizonte, binomial exacta frente a la tasa base
  const aclarar = sel => { const out = []; let prev = null; for (const k of sel) { if (prev == null || separados(obs[prev], obs[k])) { out.push(k); prev = k; } } return out; };
  const conservador = (sel, p0) => { const t = aclarar(sel); const k = t.filter(i => up[i]).length; return { nIndep: t.length, pctSubidaIndep: t.length ? k / t.length : null, pBinom: t.length ? binomTest(k, t.length, p0) : null }; };
  const quintiles = [0, 1, 2, 3, 4].map(q => {
    const sel = []; for (let k = 0; k < n; k++) if (quint[k] === q) sel.push(k);
    if (!sel.length) return { q: q + 1, n: 0 };
    const r = sel.map(k => y[k]), vals = sel.map(k => x[k]);
    return { q: q + 1, n: sel.length, valorMediano: median(vals), valorMin: Math.min(...vals), valorMax: Math.max(...vals),
      pctSubida: mean(sel.map(k => up[k])), media: mean(r), mediana: median(r),
      dif: est[1 + q], difIC: bs[1 + q].ic, p: bs[1 + q].p, difMedia: est[6 + q], difMediaIC: bs[6 + q].ic, pMedia: bs[6 + q].p, ...conservador(sel, baseQ) };
  });
  const ne = estados.length;
  const estadosRes = estados.map((e, j) => {
    const sel = []; for (let k = 0; k < n; k++) if (e.en[k]) sel.push(k);
    let episodios = 0; for (let k = 0; k < n; k++) if (e.en[k] && (k === 0 || !e.en[k - 1])) episodios++;
    if (!sel.length) return { id: e.id, nombre: e.nombre, tipo: 'estado', n: 0, episodios: 0 };
    return { id: e.id, nombre: e.nombre, tipo: 'estado', n: sel.length, episodios, pctTiempo: sel.length / n,
      pctSubida: mean(sel.map(k => up[k])), media: mean(sel.map(k => y[k])), mediana: median(sel.map(k => y[k])),
      dif: est[11 + j], difIC: bs[11 + j].ic, p: bs[11 + j].p, difMedia: est[11 + ne + j], difMediaIC: bs[11 + ne + j].ic, pMedia: bs[11 + ne + j].p, ...conservador(sel, base) };
  });

  // Eventos: para el p-valor solo cuentan los separados al menos un horizonte
  const eventos = reglas.filter(r => r.evento).map(r => {
    const marca = r.evento(v, tf);
    const lista = [];
    for (let i = 0; i < f.length; i++) if (marca[i] && fwd[i] != null && (!desdeObs || f[i].date >= desdeObs)) lista.push(i);
    const indep = []; let ultimo = null;
    for (const i of lista) if (ultimo == null || separados(ultimo, i)) { indep.push(i); ultimo = i; }
    const sub = indep.filter(i => fwd[i] > 0).length;
    return { id: r.id, nombre: r.nombre, tipo: 'evento', n: lista.length,
      pctSubida: lista.length ? mean(lista.map(i => (fwd[i] > 0 ? 1 : 0))) : null,
      media: lista.length ? mean(lista.map(i => fwd[i])) : null, mediana: lista.length ? median(lista.map(i => fwd[i])) : null,
      nIndep: indep.length, pctSubidaIndep: indep.length ? sub / indep.length : null,
      p: indep.length ? binomTest(sub, indep.length, base) : null,
      lista: lista.length <= 80 ? lista.map(i => ({ fecha: f[i].date, valor: v[i], ret: fwd[i], indep: indep.includes(i) })) : null };
  });

  const mitad = Math.floor(n / 2), rh = (a, b) => pearson(ranks(x.slice(a, b)), ranks(y.slice(a, b)));
  // Control de tendencia: correlación parcial descontando el paso del tiempo. Si la rentabilidad del activo baja con los años
  // (Bitcoin) y el indicador también tiene tendencia, la correlación simple puede ser un espejismo.
  const rx = ranks(x), ry = ranks(y), rt = Float64Array.from({ length: n }, (_, k) => k);
  const rhoT = parcial(rho, pearson(rx, rt), pearson(ry, rt));
  const indepN = hz.velas ? Math.floor((obs.at(-1) - obs[0] + 1) / hz.velas) : Math.floor(anos / (hz.meses / 12));
  return {
    n, anos, indep: Math.max(1, indepN), desde: f[obs[0]].date, hasta: f[obs.at(-1)].date,
    base, baseMedia, baseQ, baseQmedia, spearman: rho, ic: bs[0].ic, p: bs[0].p, pCons: corrPConservador(rho, indepN),
    parcialTiempo: rhoT, pParcialCons: corrPConservador(rhoT, indepN - 1),
    mitades: [{ desde: f[obs[0]].date, hasta: f[obs[mitad - 1]].date, rho: rh(0, mitad) }, { desde: f[obs[mitad]].date, hasta: f[obs.at(-1)].date, rho: rh(mitad, n) }],
    quintiles, reglas: [...estadosRes, ...eventos],
  };
}

// ---------- Corrección por comparaciones múltiples y niveles
// qv: q-valor de Benjamini-Hochberg de la prueba principal (bootstrap por bloques).
// Sólida = qv < 0,05 y además p < 0,05 contando solo periodos independientes (pConsMax = max de los dos p).
function corregir(resultados, colecciones) {
  for (const [nombre, items] of Object.entries(colecciones)) {
    const vivos = items.filter(it => it.obj.p != null);
    const q = bhAdjust(vivos.map(it => it.obj.p));
    vivos.forEach((it, k) => { it.obj.qv = q[k]; });
    const pc = vivos.map(it => { const c = it.obj[it.pc]; return c == null ? 1 : Math.max(c, it.obj.p); });
    const qc = bhAdjust(pc);
    vivos.forEach((it, k) => {
      const o = it.obj; o.qCons = qc[k]; o.pConsMax = pc[k];
      // en correlaciones, además tiene que resistir el control del tiempo (mismo signo y p conservador < 0,05)
      const resiste = !it.tiempo || (o.pParcialCons != null && o.pParcialCons < 0.05 && Math.sign(o.parcialTiempo) === Math.sign(o.spearman));
      if (it.tiempo) o.resisteTiempo = resiste;
      o.nivel = o.qv < 0.05 ? (pc[k] < 0.05 && resiste ? 'solida' : 'indicio') : 'nada';
    });
    resultados.pruebas = resultados.pruebas || {};
    resultados.pruebas[nombre] = { total: vivos.length, sinCorregir: vivos.filter(it => it.obj.p < 0.05).length, indicio: q.filter(x => x < 0.05).length, solida: vivos.filter(it => it.obj.nivel === 'solida').length };
  }
}

// ---------- Ejecución completa para un activo
// cfg: { activo, marcos, ctx, indicadores, horizontes, reps, minHist, inicioComun, desdeObs, todosLosDias,
//        familiaLargoPlazo, extra(resultados) → colecciones adicionales de correlaciones, salidaJson, salidaCsv, nombrePrecio }
export function ejecutar(cfg) {
  const { marcos: M, ctx, indicadores, horizontes: HZ, reps, minHist, inicioComun, desdeObs = null, todosLosDias = false } = cfg;
  const FWD = {};
  for (const tf of Object.keys(M)) { FWD[tf] = {}; for (const hz of HZ) FWD[tf][hz.id] = hz.velas ? futurasVelas(M[tf], hz.velas) : tf === 'mensual' ? futurasMensual(M[tf], hz.meses, 'close', { todosLosDias }) : futuras(M[tf], hz.meses); }
  const resultados = { activo: cfg.activo, generado: new Date().toISOString(), hasta: M.diario.at(-1).date, desdeObs, horizontes: HZ, indicadores: [], comun: { desde: inicioComun }, largo: {} };
  const valores = Object.fromEntries(Object.keys(M).map(k => [k, {}]));

  for (const ind of indicadores) {
    const res = { id: ind.id, nombre: ind.nombre, familia: ind.familia, que: ind.que, popular: ind.popular, sentidoPopular: ind.sentidoPopular, unidad: ind.unidad || '', aviso: ind.aviso || null, marcos: {} };
    for (const tf of ind.marcos) {
      const f = M[tf], v = ind.calc(f, tf, ctx).map(x => (x != null && Number.isFinite(x) ? x : null));
      valores[tf][ind.id] = v;
      // los percentiles solo usan valores desde el inicio del análisis (antes solo hay historia para calentar las medias)
      const pct = expandingPercentile(desdeObs ? v.map((x, i) => (f[i].date < desdeObs ? null : x)) : v, minHist[tf]);
      const iHoy = v.length - 1;
      const primero = v.findIndex(x => x != null);
      if (primero < 0) continue;
      const r = { desde: f[primero].date, hoy: { fecha: f[iHoy].date, valor: v[iHoy], percentil: pct[iHoy], quintil: pct[iHoy] == null ? null : Math.min(4, Math.floor(pct[iHoy] * 5)) + 1 }, horizontes: {} };
      const desdeInd = ind.desdeObs && (!desdeObs || ind.desdeObs > desdeObs) ? ind.desdeObs : desdeObs;
      for (const hz of HZ) {
        if (hz.soloFamilia && ind.familia !== hz.soloFamilia) continue;
        r.horizontes[hz.id] = analizar({ f, v, fwd: FWD[tf][hz.id], tf, hz, reglas: ind.reglas, pct, reps: reps[tf], desdeObs: desdeInd });
      }
      if (tf === 'mensual' && inicioComun) {
        const desde = lowerBound(f, inicioComun);
        const fC = f.slice(desde), vC = v.slice(desde);
        r.comun = {};
        for (const hz of HZ.filter(h => !h.soloFamilia)) {
          const a = analizar({ f: fC, v: vC, fwd: FWD[tf][hz.id].slice(desde), tf, hz, reglas: [], pct: pct.slice(desde), reps: reps[tf], desdeObs: desdeInd });
          r.comun[hz.id] = a && { n: a.n, spearman: a.spearman, ic: a.ic, p: a.p, pCons: a.pCons, parcialTiempo: a.parcialTiempo, pParcialCons: a.pParcialCons, indep: a.indep, base: a.base, quintiles: a.quintiles.map(q => ({ q: q.q, n: q.n, pctSubida: q.pctSubida, dif: q.dif, difIC: q.difIC, p: q.p })) };
        }
      }
      if (tf === 'mensual') r.serie = f.map((row, i) => [row.key, v[i] == null ? null : +v[i].toPrecision(5)]);
      res.marcos[tf] = r;
      log(`${ind.id.padEnd(10)} ${tf.padEnd(8)} ${Object.entries(r.horizontes).map(([h, a]) => `${h}:${a ? a.spearman.toFixed(2) : '—'}`).join(' ')}`);
    }
    resultados.indicadores.push(res);
  }

  const extraCorr = cfg.extra ? cfg.extra(resultados, { analizar, futurasMensual }) : [];

  const col = { correlaciones: [], zonas: [], eventos: [] };
  for (const ind of resultados.indicadores) for (const r of Object.values(ind.marcos)) for (const a of Object.values(r.horizontes)) {
    if (!a) continue;
    col.correlaciones.push({ obj: a, pc: 'pCons', tiempo: true });
    for (const z of a.quintiles) if (z.n) col.zonas.push({ obj: z, pc: 'pBinom' });
    for (const g of a.reglas) { if (g.tipo === 'estado' && g.n) col.zonas.push({ obj: g, pc: 'pBinom' }); if (g.tipo === 'evento' && g.nIndep) col.eventos.push({ obj: g, pc: 'p' }); }
  }
  for (const a of extraCorr) col.correlaciones.push({ obj: a, pc: 'pCons', tiempo: true });
  const colComun = [];
  for (const ind of resultados.indicadores) if (ind.marcos.mensual?.comun) for (const a of Object.values(ind.marcos.mensual.comun)) if (a) colComun.push({ obj: a, pc: 'pCons', tiempo: true });
  corregir(resultados, col);
  corregir(resultados, { comun: colComun });
  log('Pruebas:', JSON.stringify(resultados.pruebas));

  for (const ind of resultados.indicadores) for (const r of Object.values(ind.marcos)) for (const a of Object.values(r.horizontes)) {
    if (!a) continue;
    a.veredicto = a.nivel === 'nada' ? 'nada' : (Math.sign(a.spearman) === ind.sentidoPopular ? 'confirma' : 'contradice');
  }

  mkdirSync('data/procesado', { recursive: true });
  writeFileSync(cfg.salidaJson, JSON.stringify(resultados));
  for (const tf of Object.keys(valores)) {
    const ids = Object.keys(valores[tf]), f = M[tf];
    const filas = f.map((row, i) => [row.date, row.close.toFixed(2), ...ids.map(id => (valores[tf][id][i] == null ? '' : +valores[tf][id][i].toPrecision(6)))].join(','));
    writeFileSync(`${cfg.salidaCsv}_${tf}.csv`, [`fecha,${cfg.nombrePrecio},` + ids.join(','), ...filas].join('\n'));
  }
  log(`Escrito ${cfg.salidaJson} y ${cfg.salidaCsv}_*.csv`);
  return resultados;
}
