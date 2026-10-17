# S&P 500 and Bitcoin Thermometer

[Versión en español](README.md)

A study of the predictive power of the most widely used investment indicators. It tests 26 indicators against almost a century of S&P 500 data and 28 against fifteen years of Bitcoin data (the same technical and macroeconomic indicators, plus on-chain indicators instead of company valuation), on daily, weekly and monthly bars, against the subsequent return over 1, 6 and 12 months and 3, 5 and 10 years. A second analysis repeats the study at 1, 5 and 10 days.

Reports:

- S&P 500: https://seakerop.github.io/termometro/en/
- Bitcoin: https://seakerop.github.io/termometro/en/bitcoin.html

## Main results

For the S&P 500, technical indicators show no reliable predictive power on any timeframe. What survives the tests is long-run valuation, in particular Shiller's equity premium over bonds (ECY), and a moderate trend effect: being below the 200-session or the 10-month average was associated with somewhat lower returns.

For Bitcoin there is a short-term momentum signal that runs against the usual interpretation: an RSI or Bollinger Bands in "overbought" territory were followed by above-average returns, although the effect has weakened since 2019. The four-year halving cycle is also visible, with the limitation that there are only four cycles. The stock-to-flow model, evaluated since its publication in 2019, has no predictive power.

## Methodology

Sources: Yahoo Finance (S&P 500 since 1928, VIX since 1990, Bitcoin highs and lows since 2014), FRED (interest rates, credit, inflation, unemployment, industrial production, financial conditions, GDP, dollar and M2), Robert Shiller's data (earnings, dividends and CPI since 1871), CoinMetrics (Bitcoin price since 2010 and on-chain metrics) and alternative.me (Fear & Greed index).

- Each data point is used only from its publication date, with the delay that applies to each series.
- The zones of each indicator (quintiles) are computed using only the history prior to each date, to avoid look-ahead bias.
- Confidence intervals come from a block bootstrap with blocks the size of the horizon, because long-horizon returns overlap.
- Multiple comparisons are corrected with Benjamini-Hochberg. A result is considered solid only if it also passes a test that uses independent periods only and, for correlations, if it holds after controlling for time.
- Short-term signals are broken down by period to check whether they still hold.

## Usage

Requires Node 20 or later.

```
npm install
npm run descargar     # downloads the data into data/raw
npm run analizar      # S&P 500 (5 to 9 minutes)
npm run analizar:btc
npm run corto         # 1, 5 and 10-day horizons and breakdown by period
npm run informe       # builds the Spanish and English reports in docs/
npm test
```

`node src/servir.mjs` serves the reports at http://localhost:4173.

## Code

- `src/descargar.mjs` and `src/descargar_btc.mjs`: data download.
- `src/datos.mjs`: data loading and availability dates.
- `src/indicadores.mjs` and `src/indicadores_btc.mjs`: indicator definitions and the rules being tested.
- `src/estadistica.mjs`: Spearman correlation, bootstrap, Benjamini-Hochberg, binomial and t tests.
- `src/motor.mjs`: analysis engine shared by both assets; `src/analisis.mjs` and `src/analisis_btc.mjs` configure it.
- `src/corto.mjs` and `src/epocas.mjs`: short-term analysis and breakdown by period.
- `src/informe.mjs`: report generation, with texts in `src/textos/`.

This is not investment advice; it is a historical analysis.
