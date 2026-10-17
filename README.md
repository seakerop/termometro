# Termómetro del S&P 500 y de Bitcoin

[English version](README.en.md)

Estudio sobre la capacidad predictiva de los indicadores de inversión más utilizados. Se contrastan 26 indicadores con casi un siglo de datos del S&P 500 y 28 con quince años de Bitcoin (los mismos técnicos y macroeconómicos, más indicadores de la propia red en lugar de los de valoración de empresas), en velas diarias, semanales y mensuales, frente a la rentabilidad posterior a 1, 6 y 12 meses y a 3, 5 y 10 años. Un segundo análisis repite el estudio a 1, 5 y 10 días.

Informes:

- S&P 500: https://seakerop.github.io/termometro/ ([inglés](https://seakerop.github.io/termometro/en/))
- Bitcoin: https://seakerop.github.io/termometro/bitcoin.html ([inglés](https://seakerop.github.io/termometro/en/bitcoin.html))

## Resultados principales

En el S&P 500, los indicadores técnicos no muestran capacidad predictiva fiable en ningún marco temporal. Lo que resiste las pruebas es la valoración a largo plazo, en particular la prima de la bolsa sobre el bono de Shiller (ECY), y un efecto de tendencia moderado: estar por debajo de la media de 200 sesiones o de la de 10 meses se asoció con rentabilidades algo inferiores.

En Bitcoin aparece una señal de momentum a corto plazo, contraria a la interpretación habitual: un RSI o unas bandas de Bollinger en zona de "sobrecompra" fueron seguidos de rentabilidades superiores a la media, aunque el efecto se ha debilitado desde 2019. También se observa el ciclo de cuatro años del halving, con la limitación de que solo hay cuatro ciclos. El modelo stock-to-flow, evaluado desde su publicación en 2019, no tiene capacidad predictiva.

## Metodología

Fuentes: Yahoo Finance (S&P 500 desde 1928, VIX desde 1990, máximos y mínimos de Bitcoin desde 2014), FRED (tipos de interés, crédito, inflación, desempleo, producción industrial, condiciones financieras, PIB, dólar y M2), los datos de Robert Shiller (beneficios, dividendos e IPC desde 1871), CoinMetrics (precio de Bitcoin desde 2010 y métricas de la red) y alternative.me (índice de miedo y codicia).

- Cada dato se utiliza solo a partir de la fecha en que se publicó, con el retraso correspondiente a cada serie.
- Las zonas de cada indicador (quintiles) se calculan únicamente con la historia anterior a cada fecha, para evitar el sesgo de anticipación.
- Los intervalos de confianza se obtienen con bootstrap por bloques del tamaño del horizonte, porque las rentabilidades a largo plazo se solapan.
- Se corrige por comparaciones múltiples con Benjamini-Hochberg. Un resultado se considera sólido si además supera una prueba que solo usa periodos independientes y, en el caso de las correlaciones, si se mantiene al controlar por el paso del tiempo.
- Las señales a corto plazo se desglosan por épocas para comprobar si siguen vigentes.

## Uso

Requiere Node 20 o superior.

```
npm install
npm run descargar     # descarga los datos en data/raw
npm run analizar      # S&P 500 (entre 5 y 9 minutos)
npm run analizar:btc
npm run corto         # horizontes de 1, 5 y 10 días y desglose por épocas
npm run informe       # genera los informes en español e inglés en docs/
npm test
```

`node src/servir.mjs` sirve los informes en http://localhost:4173.

## Código

- `src/descargar.mjs` y `src/descargar_btc.mjs`: descarga de las fuentes.
- `src/datos.mjs`: lectura de los datos y fechas de disponibilidad.
- `src/indicadores.mjs` y `src/indicadores_btc.mjs`: definición de los indicadores y de las reglas que se contrastan.
- `src/estadistica.mjs`: correlación de Spearman, bootstrap, Benjamini-Hochberg y pruebas binomial y t.
- `src/motor.mjs`: análisis común a los dos activos; `src/analisis.mjs` y `src/analisis_btc.mjs` lo configuran.
- `src/corto.mjs` y `src/epocas.mjs`: análisis a corto plazo y desglose por épocas.
- `src/informe.mjs`: generación de los informes, con los textos de `src/textos/`.

No constituye una recomendación de inversión; es un análisis histórico.
