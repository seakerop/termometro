// Traducción al inglés de los textos que vienen de los datos (indicadores, reglas, horizontes, unidades).
// La usa src/informe.mjs al generar los informes en inglés.

export const FAMILIA = { 'Técnico': 'Technical', 'Sentimiento': 'Sentiment', 'Valoración': 'Valuation', 'Macro': 'Macro' };

export const UNIDAD = { '': '', '%': '%', '% del precio': '% of price', '% anual': '% annualised', 'puntos': 'points', '% del PIB': '% of GDP', 'meses': 'months' };

export const HORIZONTE = {
  '1 mes': '1 month', '6 meses': '6 months', '12 meses': '12 months', '3 años': '3 years', '5 años': '5 years', '10 años': '10 years',
  '1 sesión': '1 session', '5 sesiones': '5 sessions', '10 sesiones': '10 sessions', '21 sesiones': '21 sessions',
  '1 día': '1 day', '5 días': '5 days', '10 días': '10 days', '30 días': '30 days',
};

export const REGLA = {
  'RSI < 30': 'RSI < 30', 'RSI > 70': 'RSI > 70',
  'Precio sobre la media': 'Price above the average', 'Precio bajo la media': 'Price below the average',
  'Sobre la media de 10 meses': 'Above the 10-month average', 'Bajo la media de 10 meses': 'Below the 10-month average',
  'Cruza hacia arriba': 'Crosses above', 'Cruza hacia abajo': 'Crosses below',
  'Cruce dorado': 'Golden cross', 'Cruce de la muerte': 'Death cross',
  'Momentum positivo': 'Positive momentum', 'Momentum negativo': 'Negative momentum',
  'Cruce alcista': 'Bullish crossover', 'Cruce bajista': 'Bearish crossover',
  'Bajo la banda inferior': 'Below the lower band', 'Sobre la banda superior': 'Above the upper band',
  'Estocástico < 20': 'Stochastic < 20', 'Estocástico > 80': 'Stochastic > 80',
  'Primera caída del 10 %': 'First 10% drawdown', 'Primera caída del 20 %': 'First 20% drawdown', 'Primera caída del 30 %': 'First 30% drawdown',
  'Primera caída del 40 %': 'First 40% drawdown', 'Primera caída del 50 %': 'First 50% drawdown', 'Primera caída del 70 %': 'First 70% drawdown',
  'Primera caída del 80 %': 'First 80% drawdown',
  'Volatilidad > 30 %': 'Volatility > 30%', 'Volatilidad < 10 %': 'Volatility < 10%', 'Volatilidad > 100 %': 'Volatility > 100%', 'Volatilidad < 40 %': 'Volatility < 40%',
  'VIX > 30': 'VIX > 30', 'VIX > 40': 'VIX > 40', 'VIX < 12': 'VIX < 12', 'VIX < 15': 'VIX < 15',
  'Primer cierre del VIX sobre 40': 'First VIX close above 40', 'VIX por debajo de la volatilidad real': 'VIX below realised volatility',
  'CAPE > 30': 'CAPE > 30', 'CAPE < 10': 'CAPE < 10', 'PER > 25': 'P/E > 25', 'PER < 10': 'P/E < 10',
  'Dividendo < 2 %': 'Dividend yield < 2%', 'Dividendo > 5 %': 'Dividend yield > 5%', 'Prima negativa': 'Negative premium',
  'Curva invertida': 'Inverted curve', 'Primera inversión en 12 meses': 'First inversion in 12 months',
  'Fed subiendo tipos': 'Fed raising rates', 'Fed bajando tipos': 'Fed cutting rates',
  'Inflación > 5 %': 'Inflation > 5%', 'Deflación': 'Deflation',
  'Regla activada (≥ 0,5)': 'Rule triggered (≥ 0.5)', 'Se activa la regla': 'Rule is triggered',
  'Producción cayendo': 'Production falling', 'Condiciones más tensas que la media': 'Tighter than average conditions',
  'Precio > 2,4 veces la media': 'Price > 2.4 times the average',
  'Miedo extremo (< 25)': 'Extreme fear (< 25)', 'Codicia extrema (> 75)': 'Extreme greed (> 75)',
  'MVRV > 3,5': 'MVRV > 3.5', 'MVRV < 1': 'MVRV < 1', 'Puell > 4': 'Puell > 4', 'Puell < 0,5': 'Puell < 0.5',
  'Por debajo del modelo': 'Below the model',
  'Primer año tras el halving': 'First year after the halving', '12-18 meses tras el halving': '12-18 months after the halving',
  '18-30 meses tras el halving': '18-30 months after the halving', 'Más de 30 meses tras el halving': 'More than 30 months after the halving',
  'Capitulación de mineros': 'Miner capitulation', 'Fin de la capitulación (cruce al alza)': 'End of capitulation (upward cross)',
  'Dólar subiendo': 'Dollar rising', 'M2 contrayéndose': 'M2 contracting',
  'RSI (2) < 10': 'RSI (2) < 10', 'RSI (2) > 90': 'RSI (2) > 90',
  'RSI (2) < 10 sobre la media de 200': 'RSI (2) < 10 above the 200 average', 'RSI (2) < 5 sobre la media de 200': 'RSI (2) < 5 above the 200 average',
  // señales de la tabla por épocas
  'RSI (14)': 'RSI (14)', 'RSI (2)': 'RSI (2)', 'Bandas de Bollinger': 'Bollinger Bands',
};

// Indicadores: nombre, qué mide y creencia popular. `btc` sustituye campos cuando el texto de Bitcoin es distinto.
export const IND = {
  rsi: { nombre: 'RSI (14)', que: "Wilder's relative strength index: compares the gains and losses of the last 14 bars. Ranges from 0 to 100.",
    popular: 'Below 30 the market is "oversold" (a rebound is due); above 70, "overbought".' },
  mm200: { nombre: 'Distance to the 200 average', que: 'How far the price is above (+) or below (−) its average of the last 200 bars. On weekly bars this is the well-known 200-week average.',
    popular: 'Above the 200 average the market is bullish; below it, better stay out.',
    btc: { que: 'How far the price is above or below its average of the last 200 bars. On daily bars this is the "Mayer Multiple" (price over the 200-day average); on weekly bars, the well-known 200-week average of Bitcoin.',
      popular: 'Above the 200 average the market is bullish. The 200-week average marks the bottom of each cycle. A Mayer Multiple above 2.4 marks a top.' } },
  faber: { nombre: '10-month rule (Faber)', que: "Distance from the monthly close to its 10-month average (about 200 sessions). This is Mebane Faber's rule (2007).",
    popular: 'Invested while the monthly close is above the 10-month average; in cash when it is below.' },
  cruce: { nombre: '50 vs 200 average', que: 'Distance between the 50-bar and the 200-bar averages. When it turns from negative to positive it is the "golden cross"; the opposite is the "death cross".',
    popular: 'The golden cross signals gains; the death cross, losses.' },
  mom: { nombre: '12-1 momentum', que: 'Return over the last 12 months excluding the most recent one (the latest month tends to revert).',
    popular: 'What has been rising keeps rising (time-series momentum).' },
  macd: { nombre: 'MACD (12, 26, 9)', que: 'MACD histogram (MACD line minus its signal line), divided by the price so that 1930 can be compared with 2026.',
    popular: 'When the MACD line crosses above the signal, buy; when it crosses below, sell.' },
  boll: { nombre: 'Bollinger Bands (%B)', que: 'Position of the price within the Bollinger Bands (20-bar average ± 2 deviations). 0 = lower band, 1 = upper band.',
    popular: 'Breaking below the lower band means selling has gone too far and a rebound is coming.' },
  estoc: { nombre: 'Stochastic (14, 3)', que: 'Where the close sits within the high-low range of the last 14 bars, smoothed over 3. It needs real highs and lows: only from 1962.',
    popular: 'Below 20, oversold; above 80, overbought.',
    btc: { que: 'Where the close sits within the high-low range of the last 14 bars, smoothed over 3. Highs and lows come from Yahoo: only from September 2014.' } },
  caida: { nombre: 'Drawdown from the high', que: 'How far the index is below its all-time high (0 = at the high).',
    popular: '"Buy the dip": get in after a 10% correction, a 20% bear market or a 30-40% crash.',
    btc: { popular: 'In Bitcoin, bear markets are said to bottom after 75-85% drawdowns from the high.' } },
  vol: { nombre: 'Realised volatility (1 month)', que: 'Standard deviation of daily returns over the last 21 sessions, annualised. It measures actual fear, not expected fear.',
    popular: 'When volatility spikes there is panic, and panic is a buying opportunity.',
    btc: { nombre: 'Realised volatility (30 days)', que: 'Standard deviation of daily returns over the last 30 days, annualised with 365 days (Bitcoin trades every day).' } },
  vix: { nombre: 'VIX', que: 'Volatility priced by S&P 500 options over 30 days. The "fear index". Since 1990.',
    popular: 'VIX above 30-40 = panic = buy. Very low VIX = complacency.',
    btc: { nombre: 'VIX (stock market fear)', que: 'The US stock market fear index. Does fear in equities say anything about Bitcoin? On weekends the Friday close is used.',
      popular: 'When markets panic, Bitcoin falls with everything else; then it rebounds.' } },
  vrp: { nombre: 'VIX minus realised volatility', que: 'Difference between the fear priced by options (VIX) and the volatility actually taking place. Since 1990.',
    popular: 'If the market pays a lot for protection relative to the real risk, there is more fear than justified.' },
  cape: { nombre: 'Shiller CAPE', que: 'Price divided by the 10-year average of real earnings. It smooths out the business cycle.',
    popular: 'A high CAPE means low returns over the following decade. Above 30 is considered expensive.' },
  per: { nombre: 'P/E (12 months)', que: 'Price divided by earnings over the last 12 months.',
    popular: 'A high P/E means an expensive market. Above 25, expensive; below 10, cheap.' },
  dy: { nombre: 'Dividend yield', que: 'Dividends over the last 12 months divided by the price.', popular: 'A high dividend yield means a cheap market.' },
  ecy: { nombre: 'Equity premium over bonds (ECY)', que: "Shiller's Excess CAPE Yield: earnings yield (1/CAPE) minus the real 10-year bond yield (nominal yield minus average inflation over the previous 10 years).",
    popular: 'It measures whether stocks are expensive or cheap relative to bonds, not in absolute terms.' },
  buffett: { nombre: 'Buffett indicator', que: 'Market value of US non-financial companies (Federal Reserve Z.1 accounts) divided by GDP, updated with the S&P move since the latest figure. Since 1947.',
    popular: 'Above 100-150% of GDP, the stock market is overvalued.' },
  curva3m: { nombre: 'Yield curve 10 years − 3 months', que: '10-year bond minus 3-month bill (monthly averages). Negative = inverted curve. Since 1934.',
    popular: 'An inverted curve means a recession in 6-18 months, and a falling stock market.' },
  curva2a: { nombre: 'Yield curve 10 years − 2 years', que: 'Daily spread between the 10-year and 2-year bonds, the one most quoted in the press. Since 1976.',
    popular: 'Same as the previous one: inverted means recession.' },
  credito: { nombre: 'Credit spread Baa − 10-year bond', que: "How much more medium-quality companies (Moody's Baa) pay than the Treasury. It rises when the market fears defaults. Since 1919.",
    popular: 'A spiking spread signals financial stress; contrarians see it as a time to buy.' },
  fed: { nombre: 'Fed funds rate', que: 'Effective federal funds rate (monthly average). Since 1954.', popular: 'High rates slow down the economy and the stock market.' },
  fedCambio: { nombre: 'Change in the Fed rate over 12 months', que: 'How much the Fed rate has risen (+) or fallen (−) over the last year.',
    popular: '"Don\'t fight the Fed": when the Fed is cutting, stocks rise.' },
  inflacion: { nombre: 'Inflation (CPI, year on year)', que: '12-month change in the CPI. Since 1914.', popular: 'High inflation is bad for stocks (it pushes rates up and compresses multiples).' },
  sahm: { nombre: 'Sahm rule (unemployment)', que: '3-month average of the unemployment rate minus its low over the previous 12 months. Since 1949.',
    popular: 'When it exceeds 0.5 points, the economy is already in recession.' },
  indpro: { nombre: 'Industrial production (year on year)', que: '12-month change in industrial production. It replaces the ISM PMI, which is no longer on FRED. Since 1920.',
    popular: 'A growing economy means a rising stock market.' },
  nfci: { nombre: 'Financial conditions (NFCI)', que: 'Chicago Fed index summarising 105 credit, liquidity and risk indicators. Positive = tighter than average. Since 1971.',
    popular: 'Tight financial conditions are bad for stocks.' },
  fng: { nombre: 'Crypto Fear & Greed', que: 'alternative.me index (0 = extreme fear, 100 = extreme greed) combining volatility, volume, social media, dominance and searches. Since February 2018.',
    popular: '"Be greedy when others are fearful": buy in extreme fear, sell in extreme greed.' },
  mvrv: { nombre: 'MVRV', que: 'Market capitalisation divided by realised capitalisation (each coin valued at the price of its last move). It measures the average gain or loss of Bitcoin holders.',
    popular: 'Above 3.5, cycle top; below 1 (the market at a loss), bottom.' },
  puell: { nombre: 'Puell Multiple', que: 'Daily miner revenue (in dollars) divided by its average over the last year. When miners earn far more than usual, they sell more.',
    popular: 'Above 4, top; below 0.5, bottom (miners capitulate).' },
  s2f: { nombre: 'Deviation from stock-to-flow', que: "Log of the price divided by the price of PlanB's stock-to-flow model (2019). Positive = above the model.",
    popular: 'The price always returns to the model: below it, cheap; above it, expensive.',
    aviso: 'The model was published in March 2019, fitted with the data available until then, so it is only evaluated from that date: an out-of-sample test.' },
  halving: { nombre: 'Months since the last halving', que: 'Time since the last halving (when the issuance of new bitcoins is cut in half): Nov 2012, Jul 2016, May 2020 and Apr 2024. It is not a linear relationship, so the zone analysis matters more than the correlation.',
    popular: 'The four-year cycle: a strong rise in the 12-18 months after the halving, a top and then a bear market.' },
  hash: { nombre: 'Hash ribbons', que: '30-day average of the hashrate (mining power) against the 60-day average. Negative = miners are switching machines off (capitulation).',
    popular: 'When the 30-day average crosses back above the 60-day after a capitulation, it is a buy signal.' },
  dolar: { nombre: 'Dollar (12-month change)', que: "One-year change in the Fed's broad dollar index against major currencies.", popular: 'A strong dollar is bad for Bitcoin and risk assets.' },
  m2: { nombre: 'M2 money supply (year on year)', que: '12-month growth of the US M2 money supply. Published about 4 weeks after the month.',
    popular: '"Bitcoin follows liquidity": when money is printed, it rises.' },
  rsi2: { nombre: 'RSI (2)', que: 'RSI over just 2 bars: it reacts to the last two days. It is the one used for trades lasting a few days.',
    popular: 'Below 10, a rebound is imminent; above 90, profit-taking.' },
  rsi2tend: { nombre: 'RSI (2) in an uptrend', que: "The same RSI (2), but only on days when the price is above its 200 average. This is Connors' strategy: buy pullbacks within an uptrend.",
    popular: 'In an uptrend, an RSI (2) below 10 is a buying opportunity for a few days.' },
};

const tr = (map, s) => (s in map ? map[s] : s);

// Traduce en el sitio los campos de texto de un resultado del motor
export function traducirResultados(R, activo) {
  for (const h of R.horizontes || []) h.etiqueta = tr(HORIZONTE, h.etiqueta);
  for (const ind of R.indicadores || []) {
    const t = IND[ind.id];
    if (t) {
      const o = { ...t, ...(activo === 'btc' && t.btc ? t.btc : {}) };
      ind.nombre = o.nombre; ind.que = o.que; ind.popular = o.popular; if (ind.aviso) ind.aviso = o.aviso || null;
    } else console.warn('Sin traducción para el indicador', ind.id);
    ind.familia = tr(FAMILIA, ind.familia);
    ind.unidad = tr(UNIDAD, ind.unidad);
    for (const m of Object.values(ind.marcos || {})) for (const a of Object.values(m.horizontes || {})) if (a) for (const g of a.reglas || []) g.nombre = tr(REGLA, g.nombre);
  }
  return R;
}
export function traducirEpocas(E) {
  E.horizontes = E.horizontes.map(h => tr(HORIZONTE, h));
  for (const s of E.senales) {
    s.nombre = tr(REGLA, s.nombre);
    for (const h of s.horizontes) { h.etiqueta = tr(HORIZONTE, h.etiqueta); for (const e of h.porEpoca) for (const r of e.reglas) r.nombre = tr(REGLA, r.nombre); }
  }
  return E;
}
export const reglaEn = s => tr(REGLA, s);
