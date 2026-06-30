export function calculateSMA(data, period) {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    sma.push({
      time: data[i].time,
      value: sum / period,
    });
  }
  return sma;
}

export function calculateEMA(data, period) {
  const ema = [];
  if (data.length < period) return ema;

  const k = 2 / (period + 1);
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let prevEma = sum / period;
  ema.push({
    time: data[period - 1].time,
    value: prevEma,
  });

  for (let i = period; i < data.length; i++) {
    const currentClose = data[i].close;
    const currentEma = currentClose * k + prevEma * (1 - k);
    ema.push({
      time: data[i].time,
      value: currentEma,
    });
    prevEma = currentEma;
  }
  return ema;
}

export function calculateRSI(data, period = 14) {
  const rsi = [];
  if (data.length <= period) return rsi;

  let gains = [];
  let losses = [];

  for (let i = 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  let firstRsiVal = 100 - 100 / (1 + (avgLoss === 0 ? 999999 : avgGain / avgLoss));
  rsi.push({
    time: data[period].time,
    value: firstRsiVal,
  });

  for (let i = period + 1; i < data.length; i++) {
    const gain = gains[i - 1];
    const loss = losses[i - 1];

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 999999 : avgGain / avgLoss;
    const rsiVal = 100 - 100 / (1 + rs);

    rsi.push({
      time: data[i].time,
      value: rsiVal,
    });
  }

  return rsi;
}

export function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const macd = [];
  if (data.length < slowPeriod) return macd;

  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);

  const slowMap = new Map(emaSlow.map(d => [d.time, d.value]));
  
  const macdLineData = [];
  for (const fast of emaFast) {
    const slowVal = slowMap.get(fast.time);
    if (slowVal !== undefined) {
      macdLineData.push({
        time: fast.time,
        close: fast.value - slowVal,
      });
    }
  }

  if (macdLineData.length < signalPeriod) return macd;

  const signalLineData = calculateEMA(macdLineData, signalPeriod);
  const signalMap = new Map(signalLineData.map(d => [d.time, d.value]));
  const macdLineMap = new Map(macdLineData.map(d => [d.time, d.close]));

  for (const time of signalMap.keys()) {
    const mLine = macdLineMap.get(time);
    const sLine = signalMap.get(time);
    macd.push({
      time: time,
      macd: mLine,
      signal: sLine,
      histogram: mLine - sLine,
    });
  }

  return macd;
}
