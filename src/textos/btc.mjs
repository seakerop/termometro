// Textos del informe de Bitcoin (HTML). Las cifras que cambian con los datos se rellenan en la página
// con data-k (recuentos de pruebas), data-pct (percentil de hoy) y data-hoy (valor de hoy).
export default {
  titulo: 'Termómetro de Bitcoin',
  descripcion: 'Qué dicen los indicadores técnicos, de la red y macroeconómicos sobre la rentabilidad futura de Bitcoin, contrastado con 15 años de datos.',
  navNube: 'El ciclo',
  navComun: 'Desde 2018',
  navOtro: '<a href="index.html" style="margin-left:auto;color:var(--pos)">Ver S&amp;P 500 →</a><a href="en/bitcoin.html" style="color:var(--pos)">English</a>',
  sujeto: 'Bitcoin',

  resumen: `    <p><b>Objetivo.</b> Es el mismo análisis que el del S&amp;P 500, aplicado a Bitcoin. Los indicadores técnicos y los macroeconómicos son los mismos. La valoración de empresas (CAPE, PER, dividendo) no existe en Bitcoin, que no tiene beneficios, así que se sustituye por los indicadores de la propia red que usa el mundo cripto: MVRV, Puell, stock-to-flow, hash ribbons y el ciclo del halving. Se miden desde 2011 frente a lo que hizo Bitcoin después, a 1, 6 y 12 meses y a 3 y 5 años.</p>
    <p><b>Resultado.</b> Bitcoin se comporta de forma distinta al S&amp;P. Aquí sí hay señal a corto plazo, pero va al revés de lo que dice la regla popular. Con el RSI diario por encima de 70, Bitcoin estaba más alto un mes después el 74 % de las veces, frente al 57 % habitual. Con las bandas de Bollinger pasa lo mismo. En Bitcoin, "sobrecomprado" ha significado "con inercia", no "a punto de caer". De <span data-k="corrTotal"></span> correlaciones, <span data-k="corrSolida"></span> superan todas las pruebas, incluida una nueva que hace falta en Bitcoin: comprobar que la relación no es solo un efecto de que sus rentabilidades han ido bajando con los años.</p>
    <p>La otra señal fuerte es el <b>ciclo de cuatro años</b>. En el primer año tras cada halving, Bitcoin estaba más alto 6 meses después casi siempre; entre los 18 y los 30 meses, solo una de cada cuatro veces. Y cuando la media de 50 semanas se aleja mucho de la de 200, señal de un mercado muy estirado, los 6-12 meses siguientes fueron malos. El problema es que todo esto descansa en <b>solo cuatro ciclos</b>, y que son reglas tan conocidas que pueden dejar de cumplirse justo por eso. El stock-to-flow, el modelo más famoso de ese ciclo, ya ha fallado: hoy el precio está muy por debajo de lo que predecía.</p>
    <p><b>Situación actual.</b> Bitcoin está a <span data-hoy="halving" data-marco="diario" data-dec="1"></span> meses del halving de abril de 2024, en el final de la zona que históricamente fue la peor del ciclo, y un <span data-hoy="caida" data-marco="diario" data-abs="1" data-dec="0"></span> % por debajo de su máximo. El MVRV está en <span data-hoy="mvrv" data-marco="diario" data-dec="2"></span> (percentil <span data-pct="mvrv" data-marco="diario"></span>), lejos tanto de las zonas de techo como de las de suelo. Con cuatro ciclos de historia, eso es contexto y no un pronóstico.</p>`,

  cortoTexto: `  <p>Es el plazo al que se usan de verdad el RSI o las bandas de Bollinger en cripto, y en Bitcoin aquí sí hay señal: de las ${'<span data-kc="corrTotal"></span>'} correlaciones a 1, 5 y 10 días, ${'<span data-kc="corrSolida"></span>'} son sólidas, y todas apuntan al mismo sitio, el <b>momentum</b>. Con el RSI (14) por encima de 70, Bitcoin estaba más alto 10 días después el 70 % de las veces, frente al 55 % habitual. Con el RSI por debajo de 30 (la "sobreventa" que se suele comprar) no hubo ninguna ventaja que se pueda distinguir del azar. Y el RSI de 2 de Connors, pensado para comprar caídas de pocos días, también va al revés: los días de RSI (2) alto fueron mejores que los de RSI (2) bajo, incluso filtrando por tendencia alcista.</p>
  <p>Pero la tabla por épocas cuenta la parte importante: <b>la señal se ha ido apagando</b>. En 2011-2014 era fuerte y clara; desde 2019 la correlación está cerca de cero y el RSI (2) ya no da nada. Lo único que se mantiene en la misma dirección en todas las épocas es la regla extrema, RSI (14) por encima de 70, que siguió viniendo seguida de más subidas que la media, aunque con tan pocos casos por época ya no se puede confirmar estadísticamente. A estos plazos, además, las comisiones y el diferencial de compraventa reducen buena parte de una ventaja de pocos puntos.</p>`,

  nubeTitulo: 'El ciclo de Bitcoin, semana a semana',
  nubeTexto: '<p>Cada punto es una semana desde 2011: en horizontal, el valor del indicador esa semana; en vertical, cuántas veces se multiplicó el precio en los 12 meses siguientes (×1 = igual, ×2 = el doble, ×0,5 = la mitad), en escala logarítmica. La línea naranja marca dónde estamos hoy. Con los meses desde el halving se ve el ciclo de cuatro años a simple vista.</p>',

  comunTitulo: 'Todos en igualdad de condiciones: desde 2018',
  comunTexto: '<p class="note">El índice de miedo y codicia empieza en febrero de 2018. Para comparar todos los indicadores en el mismo periodo, aquí están medidos de 2018 a hoy, en datos mensuales. Son solo ocho años: a 3 y 5 años casi no hay periodos independientes, así que es una vista de contexto.</p>',

  datos: `    <li><b>Precio de Bitcoin</b>: precio de referencia diario de CoinMetrics (cierre a las 00:00 UTC) desde julio de 2010. Coincide con el de Yahoo Finance con una diferencia media del 0,3 %. El análisis empieza en 2011: 2010 fue un mercado diminuto que solo sirve para calentar las medias.</li>
    <li><b>Máximos y mínimos diarios</b>: Yahoo Finance (BTC-USD), desde septiembre de 2014. Solo los usa el estocástico.</li>
    <li><b>Datos de la red</b> (MVRV, ingresos de los mineros, hashrate, oferta de monedas): API comunitaria de CoinMetrics.</li>
    <li><b>Miedo y codicia</b>: alternative.me, desde febrero de 2018.</li>
    <li><b>VIX, tipos, crédito, inflación, paro, producción, condiciones financieras, dólar y M2</b>: Yahoo Finance y FRED (Reserva Federal de St. Louis).</li>`,

  retrasos: `      <tr><td>Precio y datos de la red</td><td class="l">Al acabar el día (00:00 UTC)</td><td class="l">Ese mismo cierre</td></tr>
      <tr><td>Miedo y codicia</td><td class="l">Una vez al día</td><td class="l">El día de su fecha</td></tr>
      <tr><td>VIX</td><td class="l">Al cierre de la bolsa</td><td class="l">Ese cierre; en fin de semana, el del viernes</td></tr>
      <tr><td>Tipos de interés (medias mensuales)</td><td class="l">Al acabar el mes</td><td class="l">Día 1 del mes siguiente</td></tr>
      <tr><td>IPC, paro, producción industrial, M2</td><td class="l">Durante el mes siguiente</td><td class="l">Día 1 del segundo mes siguiente</td></tr>
      <tr><td>Índice del dólar y diferencial 10 años − 2 años</td><td class="l">Al día siguiente</td><td class="l">El día siguiente</td></tr>
      <tr><td>Condiciones financieras (NFCI)</td><td class="l">El miércoles tras la semana</td><td class="l">7 días después del viernes de referencia</td></tr>
      <tr><td>Modelo stock-to-flow</td><td class="l">Publicado en marzo de 2019</td><td class="l">Solo se evalúa desde entonces (prueba fuera de muestra)</td></tr>`,

  quintilesTexto: '<p>Las zonas de cada indicador (quintiles) se calculan en cada fecha <b>solo con la historia anterior</b>. Como Bitcoin tiene poca historia, se exigen 4 años previos (un ciclo de halving) en lugar de los 10 del S&amp;P 500, y los datos de 2010 no cuentan.</p>',

  rentFutura: '<li><b>Rentabilidad futura</b>: del cierre de cada vela al último cierre conocido en la fecha objetivo (en velas mensuales, exactamente N meses después). Bitcoin cotiza todos los días, así que una vela diaria incluye los fines de semana: el RSI de 14 son 14 días naturales y la media de 200 son 200 días (el "Mayer Multiple").</li>',

  limitaciones: `    <li><b>Muy poca historia.</b> Desde 2011 hay 15 años y cuatro ciclos de halving. A 3 años solo caben 5 periodos independientes y a 5 años, 3. Y desde 2011 Bitcoin siempre estuvo más alto 5 años después, así que a ese plazo no hay nada que predecir.</li>
    <li><b>Rentabilidades que se encogen.</b> Las subidas de 2011-2013 (de ×10 o ×100) no se han vuelto a ver. Cualquier indicador con tendencia en el tiempo puede parecer predictivo sin serlo. Por eso las correlaciones solo cuentan como sólidas si sobreviven a descontar el paso del tiempo. El diferencial de crédito a 3 años, por ejemplo, pasa de 0,56 a 0,20 al hacerlo.</li>
    <li><b>Reglas demasiado conocidas.</b> El ciclo del halving, el MVRV o el stock-to-flow los sigue medio mercado. Cuando todo el mundo espera el mismo patrón, tiende a adelantarse o a desaparecer. El stock-to-flow es el ejemplo: funcionó dentro de la muestra con la que se construyó y falló después.</li>
    <li><b>Un mercado que ha cambiado.</b> Bitcoin pasó de Mt. Gox a ETF cotizados y tesorerías de empresas. Lo que funcionó con inversores particulares puede no funcionar con institucionales.</li>
    <li><b>Datos revisados.</b> El NFCI se reestima cada semana y las métricas de la red pueden revisarse; sus resultados deben tomarse con cautela.</li>
    <li><b>Sin costes ni impuestos.</b> Esto mide asociaciones, no estrategias.</li>
    <li><b>No es una recomendación de inversión.</b> Es un análisis histórico con fines educativos.</li>`,

  siguiente: '<p>Combinar el momentum a corto plazo con el ciclo del halving en un modelo validado hacia delante, para comprobar si el conjunto bate a la tasa base fuera de la muestra.</p>',
};
