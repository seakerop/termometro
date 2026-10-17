// English texts for the Bitcoin report (HTML). Figures that change with the data are filled in on the page.
export default {
  titulo: 'Bitcoin Thermometer',
  descripcion: 'What technical, on-chain and macroeconomic indicators say about future Bitcoin returns, tested against 15 years of data.',
  navNube: 'The cycle',
  navComun: 'Since 2018',
  navOtro: '<a href="index.html" style="margin-left:auto;color:var(--pos)">S&amp;P 500 report →</a><a href="../bitcoin.html" style="color:var(--pos)">Español</a>',
  sujeto: 'Bitcoin',

  resumen: `    <p><b>Objective.</b> The same analysis as for the S&amp;P 500, applied to Bitcoin. The technical and macroeconomic indicators are the same. Company valuation (CAPE, P/E, dividend yield) does not exist for Bitcoin, which has no earnings, so it is replaced by the on-chain indicators used in the crypto world: MVRV, Puell, stock-to-flow, hash ribbons and the halving cycle. They are measured since 2011 against what Bitcoin did afterwards, over 1, 6 and 12 months and 3 and 5 years.</p>
    <p><b>Result.</b> Bitcoin behaves differently from the S&amp;P. Here there is a short-term signal, but it goes against the popular rule. With the daily RSI above 70, Bitcoin was higher one month later 74% of the time, against the usual 57%. The same happens with Bollinger Bands. In Bitcoin, "overbought" has meant "with momentum", not "about to fall". Out of <span data-k="corrTotal"></span> correlations, <span data-k="corrSolida"></span> pass every test, including an additional one needed for Bitcoin: checking that the relationship is not just an effect of its returns shrinking over the years.</p>
    <p>The other strong signal is the <b>four-year cycle</b>. In the first year after each halving, Bitcoin was higher 6 months later almost every time; between 18 and 30 months, only one time in four. And when the 50-week average moves far above the 200-week average, a sign of an overextended market, the following 6-12 months were weak. The caveat is that all of this rests on <b>only four cycles</b>, and these rules are so well known that they may stop working for that very reason. Stock-to-flow, the best-known model of the cycle, has already failed: today the price is far below what it predicted.</p>
    <p><b>Current situation.</b> Bitcoin is <span data-hoy="halving" data-marco="diario" data-dec="1"></span> months past the April 2024 halving, at the end of the zone that was historically the weakest of the cycle, and <span data-hoy="caida" data-marco="diario" data-abs="1" data-dec="0"></span>% below its high. The MVRV is at <span data-hoy="mvrv" data-marco="diario" data-dec="2"></span> (percentile <span data-pct="mvrv" data-marco="diario"></span>), far from both top and bottom zones. With four cycles of history, this is context, not a forecast.</p>`,

  cortoTexto: `  <p>This is the horizon at which the RSI and Bollinger Bands are actually used in crypto, and here Bitcoin does show a signal: out of the <span data-kc="corrTotal"></span> correlations at 1, 5 and 10 days, <span data-kc="corrSolida"></span> are solid, and all point in the same direction, <b>momentum</b>. With the RSI (14) above 70, Bitcoin was higher 10 days later 70% of the time, against the usual 55%. With the RSI below 30 (the "oversold" level people usually buy) there was no advantage distinguishable from chance. And Connors' 2-period RSI, designed to buy short pullbacks, also points the other way: days with a high RSI (2) were better than days with a low RSI (2), even when filtering for an uptrend.</p>
  <p>But the table by period tells the important part: <b>the signal has been fading</b>. In 2011-2014 it was strong and clear; since 2019 the correlation is close to zero and the RSI (2) no longer shows anything. The only rule that keeps the same direction in every period is the extreme one, RSI (14) above 70, which was still followed by more rises than average, although with so few cases per period it can no longer be confirmed statistically. At these horizons, fees and the bid-ask spread also take away a good part of an advantage of a few points.</p>`,

  nubeTitulo: 'The Bitcoin cycle, week by week',
  nubeTexto: '<p>Each point is a week since 2011: horizontally, the value of the indicator that week; vertically, how many times the price multiplied over the following 12 months (×1 = unchanged, ×2 = doubled, ×0.5 = halved), on a logarithmic scale. The orange line marks where we are today. With the months since the halving, the four-year cycle is visible at a glance.</p>',

  comunTitulo: 'All on equal terms: since 2018',
  comunTexto: '<p class="note">The Fear &amp; Greed index starts in February 2018. To compare all indicators over the same period, here they are measured from 2018 to today, on monthly data. That is only eight years: at 3 and 5 years there are almost no independent periods, so this is a contextual view.</p>',

  datos: `    <li><b>Bitcoin price</b>: CoinMetrics daily reference price (close at 00:00 UTC) since July 2010. It matches Yahoo Finance with an average difference of 0.3%. The analysis starts in 2011: 2010 was a tiny market that is only used to warm up the averages.</li>
    <li><b>Daily highs and lows</b>: Yahoo Finance (BTC-USD), since September 2014. Only the stochastic uses them.</li>
    <li><b>On-chain data</b> (MVRV, miner revenue, hashrate, coin supply): CoinMetrics community API.</li>
    <li><b>Fear &amp; Greed</b>: alternative.me, since February 2018.</li>
    <li><b>VIX, interest rates, credit, inflation, unemployment, production, financial conditions, dollar and M2</b>: Yahoo Finance and FRED (St. Louis Federal Reserve).</li>`,

  retrasos: `      <tr><td>Price and on-chain data</td><td class="l">At the end of the day (00:00 UTC)</td><td class="l">That same close</td></tr>
      <tr><td>Fear &amp; Greed</td><td class="l">Once a day</td><td class="l">On its date</td></tr>
      <tr><td>VIX</td><td class="l">At the stock market close</td><td class="l">That close; on weekends, Friday's</td></tr>
      <tr><td>Interest rates (monthly averages)</td><td class="l">At the end of the month</td><td class="l">Day 1 of the following month</td></tr>
      <tr><td>CPI, unemployment, industrial production, M2</td><td class="l">During the following month</td><td class="l">Day 1 of the second following month</td></tr>
      <tr><td>Dollar index and 10-year − 2-year spread</td><td class="l">The next day</td><td class="l">The next day</td></tr>
      <tr><td>Financial conditions (NFCI)</td><td class="l">On the Wednesday after the week</td><td class="l">7 days after the reference Friday</td></tr>
      <tr><td>Stock-to-flow model</td><td class="l">Published in March 2019</td><td class="l">Only evaluated since then (out-of-sample test)</td></tr>`,

  quintilesTexto: '<p>The zones of each indicator (quintiles) are computed at each date <b>using only the previous history</b>. As Bitcoin has little history, 4 prior years (one halving cycle) are required instead of the 10 used for the S&amp;P 500, and 2010 data are excluded.</p>',

  rentFutura: '<li><b>Future return</b>: from the close of each bar to the last known close at the target date (on monthly bars, exactly N months later). Bitcoin trades every day, so a daily bar includes weekends: the 14-period RSI covers 14 calendar days and the 200 average covers 200 days (the "Mayer Multiple").</li>',

  limitaciones: `    <li><b>Very little history.</b> Since 2011 there are 15 years and four halving cycles. At 3 years there are only 5 independent periods, and at 5 years, 3. And since 2011 Bitcoin was always higher 5 years later, so at that horizon there is nothing to predict.</li>
    <li><b>Shrinking returns.</b> The gains of 2011-2013 (×10 or ×100) have not been seen again. Any indicator with a time trend can look predictive without being so. That is why correlations only count as solid if they survive controlling for time. The 3-year credit spread, for example, drops from 0.56 to 0.20 when doing so.</li>
    <li><b>Rules that are too well known.</b> The halving cycle, the MVRV and stock-to-flow are followed by half the market. When everyone expects the same pattern, it tends to happen earlier or disappear. Stock-to-flow is the example: it worked within the sample it was built on and failed afterwards.</li>
    <li><b>A market that has changed.</b> Bitcoin went from Mt. Gox to listed ETFs and corporate treasuries. What worked with retail investors may not work with institutions.</li>
    <li><b>Revised data.</b> The NFCI is re-estimated every week and on-chain metrics can be revised; their results should be read with caution.</li>
    <li><b>No costs or taxes.</b> This measures associations, not strategies.</li>
    <li><b>Not investment advice.</b> This is a historical analysis for educational purposes.</li>`,

  siguiente: '<p>Combine short-term momentum with the halving cycle in a model validated walk-forward, to check whether the combination beats the base rate out of sample.</p>',
};
