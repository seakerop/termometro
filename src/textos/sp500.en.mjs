// English texts for the S&P 500 report (HTML). Figures that change with the data are filled in on the page.
export default {
  titulo: 'S&amp;P 500 Thermometer',
  descripcion: 'What 26 investment indicators say about future S&P 500 returns, tested against almost a century of data.',
  navNube: '145 years',
  navComun: 'Since 1990',
  navOtro: '<a href="bitcoin.html" style="margin-left:auto;color:var(--pos)">Bitcoin report →</a><a href="../index.html" style="color:var(--pos)">Español</a>',
  sujeto: 'the S&amp;P',

  resumen: `    <p><b>Objective.</b> Investors watch dozens of indicators every day: the RSI, the 200-day moving average, the VIX, the CAPE, the yield curve… Each comes with a popular rule ("low RSI, a rebound is due"; "inverted curve, a recession is coming"). This study tests <b>26 indicators</b> against what the S&amp;P 500 actually did afterwards, over 1, 6 and 12 months and 3, 5 and 10 years, with data since 1928 (and since 1881 for valuation).</p>
    <p><b>Result.</b> In the short term, practically no indicator has predictive power. Out of <span data-k="corrTotal"></span> correlations, <span data-k="corrSinCorregir"></span> look "significant" with a naive test, but about <span data-k="corrAzar"></span> would be expected by pure chance. After correcting for multiple comparisons, <span data-k="corrIndicio"></span> remain, and only <span data-k="corrSolida"></span> also pass a test that counts only non-overlapping periods. None of these survivors is a technical indicator: the RSI, the MACD, Bollinger Bands, the stochastic, moving-average crossovers and "buying the dip" say nothing reliable about future returns, on any timeframe.</p>
    <p>What does emerge, in line with the academic literature, is that <b>valuation matters in the long run</b>. The most robust indicator is Shiller's equity premium over bonds (ECY): the higher it was, the better the returns over the following 5 and 10 years. The CAPE and the P/E point in the same direction, although with so few independent decades they do not pass every test. On the trend side, being below the 200-session or the 10-month average was followed by somewhat weaker returns, which is what trend followers argue.</p>
    <p><b>Current situation.</b> Stocks are expensive relative to their own history: the CAPE is at percentile <span data-pct="cape"></span> (higher than in <span data-pct="cape"></span>% of previous months) and the premium over bonds at percentile <span data-pct="ecy"></span> (a low premium means stocks offer little more than a bond). Historically, from such levels the market rose less than usual over the following 5-10 years, but it did not always fall, and these data cannot tell when an adjustment will come.</p>`,

  cortoTexto: `  <p>This is the horizon at which the RSI, the 2-period RSI and Bollinger Bands are actually used. Over the whole history, they predict nothing in the S&amp;P: their correlations with the return over the next 1, 5 and 10 sessions are zero. Out of <span data-kc="corrTotal"></span> correlations, <span data-kc="corrSolida"></span> are solid, but they are tiny effects that only show up because of the large amount of data: the trend (being above the 200 average, and momentum) and, above all, the <b>VIX</b>. When fear in the market was high, the following two weeks were somewhat better than average, and the effect is stronger in the second half of the history than in the first.</p>
  <p>The table by period shows something the average hides: <b>the behaviour has changed sign</b>. Until the 1970s there was some short-term momentum; in the last decade it is the opposite, and the index tends to rebound after falling. In 2013-2026, after an RSI (14) below 30, the S&amp;P was higher 10 sessions later 71% of the time, against 64% for that period. That is the direction of the popular rule, although with the cases of a single decade it cannot be confirmed statistically. It is the opposite of Bitcoin, where following the rise is what worked.</p>`,

  nubeTitulo: 'Valuation: 145 years of history',
  nubeTexto: "<p>Robert Shiller's data go back to 1881 and allow measuring the <b>total real</b> return (with dividends and net of inflation), which is what an investor actually receives. Each point is a month: horizontally, the valuation in that month; vertically, the annual real return over the following 10 years. The orange line marks where we are today.</p>",

  comunTitulo: 'All on equal terms: since 1990',
  comunTexto: '<p class="note">Each indicator has a history of different length (the VIX starts in 1990 and the CAPE in the 19th century). To compare them fairly, here they are all measured over the same period, from 1990 to today, on monthly data.</p>',

  datos: `    <li><b>S&amp;P 500</b>: daily closes from Yahoo Finance (^GSPC) since 30 December 1927. Until March 1957 the series is its 90-stock predecessor. Real highs and lows only since 1962.</li>
    <li><b>VIX</b>: Yahoo Finance (^VIX), since 1990.</li>
    <li><b>Interest rates, credit, inflation, unemployment, production, financial conditions, GDP and corporate market value</b>: FRED, the St. Louis Federal Reserve database.</li>
    <li><b>Earnings, dividends and CPI since 1871</b>: Robert Shiller's dataset (<i>Irrational Exuberance</i>).</li>`,

  retrasos: `      <tr><td>S&amp;P 500 and VIX prices</td><td class="l">At the daily close</td><td class="l">That same close. If the market is open when downloading, the current session is discarded.</td></tr>
      <tr><td>Interest rates (monthly averages)</td><td class="l">At the end of the month</td><td class="l">Day 1 of the following month</td></tr>
      <tr><td>CPI, unemployment, industrial production</td><td class="l">During the following month</td><td class="l">Day 1 of the second following month</td></tr>
      <tr><td>Earnings and dividends (Shiller)</td><td class="l">Weeks after the quarter closes</td><td class="l">4 months after the month they refer to</td></tr>
      <tr><td>GDP and Z.1 market value</td><td class="l">About 10 weeks after the quarter</td><td class="l">6 months after the start of the quarter</td></tr>
      <tr><td>10-year − 2-year spread</td><td class="l">The next day</td><td class="l">The next day</td></tr>
      <tr><td>Financial conditions (NFCI)</td><td class="l">On the Wednesday after the week</td><td class="l">7 days after the reference Friday</td></tr>`,

  quintilesTexto: '<p>The zones of each indicator (quintiles) are computed at each date <b>using only the previous history</b> and require 10 years of prior data. Using quintiles from the whole series would introduce look-ahead bias: a CAPE of 25 was very expensive in 1950 and normal in 2010.</p>',

  rentFutura: "<li><b>Future return</b>: from the close of each bar to the last known close at the target date (on monthly bars, exactly N months later). It is a price return, without dividends, except in Shiller's long history, which is total and real.</li>",

  limitaciones: `    <li><b>There is less history than it seems.</b> In 98 years there are only 9 non-overlapping 10-year periods. Any conclusion at 5-10 years rests on a handful of decades.</li>
    <li><b>Revised data.</b> FRED provides the latest version of each series, not the one known at the time. Unemployment and industrial production are revised little; the NFCI index is re-estimated in full every week, so its history may be more accurate than it was in real time, and its results should be read with caution.</li>
    <li><b>A single market.</b> The US S&amp;P 500 was one of the best markets of the 20th century (country survivorship bias). What worked here may not work elsewhere.</li>
    <li><b>Price return.</b> Except in the long history, dividends are not included. This does not change the comparison between zones, but it makes rises look less frequent than they really were.</li>
    <li><b>No costs or taxes.</b> This measures associations, not strategies. A rule that "works" may stop working after fees, taxes and the fact that many people use it.</li>
    <li><b>Not investment advice.</b> This is a historical analysis for educational purposes.</li>`,

  siguiente: '<p>Combine the indicators with some evidence in a model (logistic regression) validated walk-forward: train on data up to a given year, predict the next one and move the window forward, to see whether the combination beats the base rate out of sample.</p>',
};
