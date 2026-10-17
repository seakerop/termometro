// Pruebas de las piezas críticas. Uso: node --test src/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addMonths } from './datos.mjs';
import { spearman, bhAdjust, binomTest, expandingPercentile, tTestP, corrPConservador, normCdf, parcial } from './estadistica.mjs';

const cerca = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) < tol, `${a} != ${b}`);

test('sumar meses respeta el fin de mes y los años', () => {
  assert.equal(addMonths('2026-03-31', 1), '2026-04-30');
  assert.equal(addMonths('2024-01-31', 1), '2024-02-29'); // bisiesto
  assert.equal(addMonths('2023-01-31', 1), '2023-02-28');
  assert.equal(addMonths('2026-12-15', 1), '2027-01-15');
  assert.equal(addMonths('2026-02-28', -12), '2025-02-28');
  assert.equal(addMonths('1871-01-01', 4), '1871-05-01');
});

test('Spearman: monótona = 1, inversa = −1, con empates', () => {
  cerca(spearman([1, 2, 3, 4, 5], [2, 4, 8, 16, 32]), 1);
  cerca(spearman([1, 2, 3, 4, 5], [5, 4, 3, 2, 1]), -1);
  // ejemplo con empates calculado a mano: rangos x [1,2.5,2.5,4], y [1,2,3,4]
  cerca(spearman([1, 2, 2, 3], [10, 20, 30, 40]), 0.9486832980505138);
});

test('Benjamini-Hochberg coincide con p.adjust(method = "BH") de R', () => {
  const q = bhAdjust([0.01, 0.04, 0.03, 0.005]);
  [0.02, 0.04, 0.04, 0.02].forEach((v, i) => cerca(q[i], v));
});

test('prueba binomial exacta bilateral', () => {
  cerca(binomTest(10, 10, 0.8), 0.2282, 1e-4);
  cerca(binomTest(5, 10, 0.5), 1, 1e-9);
  cerca(binomTest(9, 10, 0.5), 0.021484375, 1e-9); // binom.test(9, 10) en R
  // tasa base del 100 %: que todo suba no es evidencia de nada
  cerca(binomTest(5, 5, 1), 1, 1e-12);
  cerca(binomTest(0, 5, 0), 1, 1e-12);
});

test('t de Student y normal', () => {
  cerca(tTestP(2.228138852, 10), 0.05, 1e-6);
  cerca(normCdf(1.959963985), 0.975, 1e-6);
  cerca(corrPConservador(0, 50), 1, 1e-9);
});

test('el percentil expandido no mira el futuro', () => {
  const v = [1, 2, 3, 4, 5, 100, 0];
  const p = expandingPercentile(v, 3);
  assert.equal(p[2], null);                 // aún no hay 3 valores previos
  cerca(p[3], 1);                           // 4 es mayor que 1, 2, 3
  cerca(p[5], 1);                           // 100 frente a 1..5
  cerca(p[6], 0);                           // 0 es el menor
  // cambiar valores futuros no cambia el percentil de hoy
  const p2 = expandingPercentile([1, 2, 3, 4, 5, -999, 999], 3);
  cerca(p2[4], p[4]);
});

test('correlación parcial: quita la parte que se explica por el tiempo', () => {
  cerca(parcial(0.5, 0, 0), 0.5);               // sin relación con el tiempo, no cambia
  cerca(parcial(0.6, 0.6, 1 - 1e-12) , 0, 1e-3); // y depende casi solo del tiempo → desaparece
  cerca(parcial(0.3, 0.5, 0.6), 0, 1e-12);       // 0,3 = 0,5·0,6: toda la correlación venía del tiempo
});

test('rentabilidad a N velas: de un cierre al de N velas después, sin pasarse del final', async () => {
  const { futurasVelas } = await import('./motor.mjs');
  const f = [1, 2, 4, 2].map((close, i) => ({ date: `2026-01-0${i + 1}`, close }));
  assert.deepEqual(futurasVelas(f, 1), [1, 1, -0.5, null]);
  assert.deepEqual(futurasVelas(f, 2), [3, 0, null, null]);
});
