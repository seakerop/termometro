// ¿Sigue funcionando hoy? Las señales técnicas de corto plazo, desglosadas por épocas.
// Uso: node src/epocas.mjs [sp500|btc]  (después de src/corto.mjs) → data/epocas_<activo>.json
import { readFileSync, writeFileSync } from 'node:fs';
import { spearman, binomTest } from './estadistica.mjs';

const activo = process.argv[2] || 'btc';
const EPOCAS = activo === 'btc'
  ? [['2011', '2014'], ['2015', '2018'], ['2019', '2022'], ['2023', '2026']]
  : [['1928', '1949'], ['1950', '1974'], ['1975', '1999'], ['2000', '2012'], ['2013', '2026']];
const HORIZ = activo === 'btc' ? [[5, '5 días'], [10, '10 días'], [30, '30 días']] : [[5, '5 sesiones'], [10, '10 sesiones'], [21, '21 sesiones']];
const SENALES = [
  { id: 'rsi', nombre: 'RSI (14)', reglas: [['RSI > 70', v => v > 70], ['RSI < 30', v => v < 30]] },
  { id: 'rsi2', nombre: 'RSI (2)', reglas: [['RSI (2) > 90', v => v > 90], ['RSI (2) < 10', v => v < 10]] },
  { id: 'boll', nombre: 'Bandas de Bollinger', reglas: [['Sobre la banda superior', v => v > 1], ['Bajo la banda inferior', v => v < 0]] },
];

const L = readFileSync(`data/procesado/corto_${activo}_diario.csv`, 'utf8').trim().split('\n');
const cab = L[0].split(','), filas = L.slice(1).map(l => l.split(','));
const fecha = filas.map(r => r[0]), precio = filas.map(r => +r[1]);
const col = id => { const k = cab.indexOf(id); return filas.map(r => (r[k] === '' ? null : +r[k])); };

const out = { activo, epocas: EPOCAS.map(([a, b]) => `${a}-${b}`), horizontes: HORIZ.map(h => h[1]), senales: [] };
for (const s of SENALES) {
  const v = col(s.id);
  const res = { id: s.id, nombre: s.nombre, horizontes: [] };
  for (const [velas, etiqueta] of HORIZ) {
    const porEpoca = EPOCAS.map(([a, b]) => {
      const idx = [];
      for (let i = 0; i + velas < precio.length; i++) { const y = fecha[i].slice(0, 4); if (y >= a && y <= b && v[i] != null) idx.push(i); }
      const ret = i => precio[i + velas] / precio[i] - 1;
      const base = idx.filter(i => ret(i) > 0).length / idx.length;
      const reglas = s.reglas.map(([nombre, cond]) => {
        const sel = idx.filter(i => cond(v[i]));
        // casos separados al menos un horizonte, para la prueba binomial
        const indep = []; for (const i of sel) if (!indep.length || i - indep.at(-1) >= velas) indep.push(i);
        const k = indep.filter(i => ret(i) > 0).length;
        return { nombre, n: sel.length, pctSubida: sel.length ? sel.filter(i => ret(i) > 0).length / sel.length : null,
          mediana: sel.length ? sel.map(ret).sort((x, y) => x - y)[Math.floor(sel.length / 2)] : null,
          nIndep: indep.length, p: indep.length ? binomTest(k, indep.length, base) : null };
      });
      return { n: idx.length, base, rho: spearman(idx.map(i => v[i]), idx.map(ret)), reglas };
    });
    res.horizontes.push({ etiqueta, velas, porEpoca });
  }
  out.senales.push(res);
}
writeFileSync(`data/epocas_${activo}.json`, JSON.stringify(out));
for (const s of out.senales) for (const h of s.horizontes)
  console.log(`${s.nombre.padEnd(20)} ${h.etiqueta.padEnd(12)} ` + h.porEpoca.map((e, k) => `${out.epocas[k]}: ρ ${e.rho.toFixed(2)} · ${e.reglas[0].nombre} ${e.reglas[0].pctSubida == null ? '—' : Math.round(e.reglas[0].pctSubida * 100) + '%'} vs ${Math.round(e.base * 100)}%`).join(' | '));
