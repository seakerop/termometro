// Herramientas estadísticas comunes. Sin dependencias.

export const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; };
export const median = a => { const s = Float64Array.from(a).sort(); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
export const sd = a => { const m = mean(a); let s = 0; for (const x of a) s += (x - m) ** 2; return Math.sqrt(s / (a.length - 1)); };

export function ranks(a) {
  const n = a.length, idx = new Uint32Array(n);
  for (let i = 0; i < n; i++) idx[i] = i;
  idx.sort((p, q) => a[p] - a[q]);
  const r = new Float64Array(n);
  for (let i = 0; i < n;) {
    let j = i; while (j + 1 < n && a[idx[j + 1]] === a[idx[i]]) j++;
    const avg = (i + j) / 2; for (let k = i; k <= j; k++) r[idx[k]] = avg;
    i = j + 1;
  }
  return r;
}
export function pearson(x, y) {
  const n = x.length; let mx = 0, my = 0;
  for (let i = 0; i < n; i++) { mx += x[i]; my += y[i]; }
  mx /= n; my /= n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const a = x[i] - mx, b = y[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}
export const spearman = (x, y) => pearson(ranks(x), ranks(y));

// Normal estándar: función de distribución (Abramowitz-Stegun 7.1.26, error < 1.5e-7)
export function normCdf(z) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const e = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z / 2);
  return z >= 0 ? (1 + e) / 2 : (1 - e) / 2;
}

// Generador con semilla: todo el análisis da los mismos números cada vez que se lanza
export function rng(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

// Bootstrap por bloques circulares (Politis-Romano). Los bloques miden lo mismo que el horizonte,
// así se conserva el solapamiento de las rentabilidades a largo plazo y el intervalo no sale artificialmente estrecho.
// Devuelve intervalo del 95 % por percentiles y p-valor bilateral con aproximación normal sobre el error típico bootstrap
// (con miles de pruebas, un p-valor de recuento con 1000 réplicas no tiene resolución suficiente para la corrección de Benjamini-Hochberg).
export function blockBootstrap({ n, block, reps, stat, estimate, seed = 1 }) {
  const rand = rng(seed), out = new Float64Array(reps), idx = new Uint32Array(n);
  block = Math.max(1, Math.min(block, Math.floor(n / 2)));
  for (let r = 0; r < reps; r++) {
    let k = 0;
    while (k < n) { const start = Math.floor(rand() * n); for (let b = 0; b < block && k < n; b++) idx[k++] = (start + b) % n; }
    out[r] = stat(idx);
  }
  const valid = Array.from(out).filter(Number.isFinite).sort((a, b) => a - b);
  const se = sd(valid);
  const z = se > 0 ? estimate / se : 0;
  return { ic: [valid[Math.floor(valid.length * 0.025)], valid[Math.min(valid.length - 1, Math.floor(valid.length * 0.975))]], se, p: 2 * (1 - normCdf(Math.abs(z))) };
}

// Prueba binomial exacta bilateral: k éxitos en n con probabilidad p0 (para episodios casi independientes)
export function binomTest(k, n, p0) {
  // con una tasa base de 0 % o 100 % no hay nada que contrastar: o pasa lo de siempre (p = 1) o algo imposible (p = 0)
  if (p0 >= 1) return k === n ? 1 : 0;
  if (p0 <= 0) return k === 0 ? 1 : 0;
  const logC = (n, k) => lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
  const pmf = i => Math.exp(logC(n, i) + i * Math.log(p0) + (n - i) * Math.log(1 - p0));
  const pk = pmf(k); let p = 0;
  for (let i = 0; i <= n; i++) { const q = pmf(i); if (q <= pk * (1 + 1e-7)) p += q; }
  return Math.min(1, p);
}
function lgamma(x) { // Lanczos
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1; let a = c[0]; const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

// Benjamini-Hochberg: devuelve los q-valores en el mismo orden que los p-valores
export function bhAdjust(ps) {
  const m = ps.length, order = ps.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0]);
  const q = new Array(m); let prev = 1;
  for (let r = m - 1; r >= 0; r--) { const [p, i] = order[r]; prev = Math.min(prev, p * m / (r + 1)); q[i] = prev; }
  return q;
}

// Percentil de cada valor respecto SOLO a los valores anteriores (sin mirar el futuro).
// Devuelve null mientras no haya `minHist` observaciones previas.
export function expandingPercentile(values, minHist) {
  const out = new Array(values.length).fill(null), sorted = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v == null || !Number.isFinite(v)) continue;
    if (sorted.length >= minHist) {
      let lo = 0, hi = sorted.length; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < v) lo = m + 1; else hi = m; }
      let lo2 = lo, hi2 = sorted.length; while (lo2 < hi2) { const m = (lo2 + hi2) >> 1; if (sorted[m] <= v) lo2 = m + 1; else hi2 = m; }
      out[i] = ((lo + lo2) / 2) / sorted.length; // empates al punto medio
    }
    let lo = 0, hi = sorted.length; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < v) lo = m + 1; else hi = m; }
    sorted.splice(lo, 0, v);
  }
  return out;
}

// Distribución t de Student: p-valor bilateral (vía beta incompleta regularizada, Numerical Recipes 6.4)
export function tTestP(t, df) {
  if (!Number.isFinite(t) || df <= 0) return null;
  return betaInc(df / 2, 0.5, df / (df + t * t));
}
function betaInc(a, b, x) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
}
function betacf(a, b, x) {
  const FPMIN = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d;
    const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break;
  }
  return h;
}
// p-valor de una correlación contando solo los periodos independientes (prueba conservadora)
export function corrPConservador(r, nEff) { if (nEff < 4 || Math.abs(r) >= 1) return null; return tTestP(r * Math.sqrt((nEff - 2) / (1 - r * r)), nEff - 2); }

// Correlación parcial de x e y descontando z (sobre rangos: Spearman parcial)
export function parcial(rxy, rxz, ryz) { const d = Math.sqrt((1 - rxz * rxz) * (1 - ryz * ryz)); return d > 0 ? (rxy - rxz * ryz) / d : 0; }
