import { useState, useEffect, useRef } from 'react';
import { getHistoricalKlinesUrl, getWebSocketUrl, TIMEFRAMES } from '../utils/binance';

export function useBinanceChartData(symbol, timeframe) {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  const candlesRef = useRef([]);
  const wsRef = useRef(null);

  // Helper: Merges base interval candles into custom duration chunks (e.g. 1m -> 3m)
  const aggregateCandles = (baseCandles, factor) => {
    if (factor <= 1 || baseCandles.length === 0) return baseCandles;
    const merged = [];
    
    // Slice ascending order list into blocks of size 'factor'
    for (let i = 0; i < baseCandles.length; i += factor) {
      const chunk = baseCandles.slice(i, i + factor);
      if (chunk.length === 0) continue;
      
      const open = chunk[0].open;
      const close = chunk[chunk.length - 1].close;
      const high = Math.max(...chunk.map((c) => c.high));
      const low = Math.min(...chunk.map((c) => c.low));
      const volume = chunk.reduce((sum, c) => sum + c.volume, 0);
      const time = chunk[0].time;

      merged.push({ time, open, high, low, close, volume });
    }
    return merged;
  };

  // 1. Fetch History
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setCandles([]);
    candlesRef.current = [];

    const fetchHistory = async () => {
      try {
        const tfConfig = TIMEFRAMES.find((t) => t.value === timeframe) || { baseInterval: '1m', factor: 1 };
        
        // Fetch base candles (e.g. 1m candles for a 3m chart)
        const response = await fetch(getHistoricalKlinesUrl(symbol, tfConfig.baseInterval));
        if (!response.ok) {
          throw new Error(`Failed to fetch history: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Reverse descending array
        let formattedCandles = data.reverse().map((item) => ({
          time: item[0],
          low: parseFloat(item[1]),
          high: parseFloat(item[2]),
          open: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5]),
        }));

        // Merge candles locally if custom interval
        if (tfConfig.factor > 1) {
          formattedCandles = aggregateCandles(formattedCandles, tfConfig.factor);
        }

        if (active) {
          setCandles(formattedCandles);
          candlesRef.current = formattedCandles;
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching historical candles from Coinbase:', err);
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      active = false;
    };
  }, [symbol, timeframe]);

  // 2. Stream Live Tickers to Update/Append Candles
  useEffect(() => {
    const wsUrl = getWebSocketUrl();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      setError(null);
      
      const subscribeMsg = {
        type: 'subscribe',
        product_ids: [symbol.toUpperCase()],
        channels: ['ticker'],
      };
      ws.send(JSON.stringify(subscribeMsg));
    };

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type !== 'ticker') return;
      if (payload.product_id !== symbol.toUpperCase()) return;

      const tradePrice = parseFloat(payload.price);
      const tradeVolume = parseFloat(payload.last_size) || 0;
      const tradeTime = Math.floor(new Date(payload.time).getTime() / 1000);
      if (isNaN(tradeTime) || isNaN(tradePrice)) return;

      // Map intervals to precise second limits
      const granularityMap = {
        '30s': 30,
        '1m': 60,
        '2m': 120,
        '3m': 180,
        '5m': 300,
        '10m': 600,
        '15m': 900,
        '30m': 1800,
        '45m': 2700,
        '1h': 3600,
        '2h': 7200,
        '4h': 14400,
        '1d': 86400,
      };
      const intervalSeconds = granularityMap[timeframe] || 300;
      const candleTime = Math.floor(tradeTime / intervalSeconds) * intervalSeconds;

      const currentCandles = candlesRef.current;
      if (currentCandles.length > 0) {
        const lastCandle = currentCandles[currentCandles.length - 1];
        let updatedCandles;
        
        if (candleTime === lastCandle.time) {
          updatedCandles = [...currentCandles.slice(0, -1), {
            ...lastCandle,
            close: tradePrice,
            high: Math.max(lastCandle.high, tradePrice),
            low: Math.min(lastCandle.low, tradePrice),
            volume: lastCandle.volume + tradeVolume,
          }];
        } else if (candleTime > lastCandle.time) {
          updatedCandles = [...currentCandles, {
            time: candleTime,
            open: tradePrice,
            high: tradePrice,
            low: tradePrice,
            close: tradePrice,
            volume: tradeVolume,
          }];
        } else {
          return;
        }

        setCandles(updatedCandles);
        candlesRef.current = updatedCandles;
      }
    };

    ws.onerror = (err) => {
      console.error('Coinbase Kline WS error:', err);
      setError('WS Connection Error.');
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        const unsubscribeMsg = {
          type: 'unsubscribe',
          product_ids: [symbol.toUpperCase()],
          channels: ['ticker'],
        };
        try {
          ws.send(JSON.stringify(unsubscribeMsg));
        } catch (e) {
          console.warn('Failed to unsubscribe:', e);
        }
        ws.close();
      } else if (ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [symbol, timeframe]);

  return {
    candles,
    loading,
    error,
    wsConnected,
  };
}
