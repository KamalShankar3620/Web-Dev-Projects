import { useState, useEffect, useRef } from 'react';
import { getHistoricalKlinesUrl, getWebSocketUrl } from '../utils/binance';

export function useBinanceData(symbol, timeframe) {
  const [candles, setCandles] = useState([]);
  const [trades, setTrades] = useState([]);
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [ticker, setTicker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  // References to keep track of the latest data to avoid closure issues in WS callbacks
  const candlesRef = useRef([]);
  const wsRef = useRef(null);

  // 1. Fetch Historical Klines
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setCandles([]);
    candlesRef.current = [];

    const fetchHistory = async () => {
      try {
        const response = await fetch(getHistoricalKlinesUrl(symbol, timeframe));
        if (!response.ok) {
          throw new Error(`Failed to fetch history: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Map Binance kline array to Lightweight Charts format
        const formattedCandles = data.map((item) => ({
          time: Math.floor(item[0] / 1000), // open time in seconds
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5]),
        }));

        if (active) {
          setCandles(formattedCandles);
          candlesRef.current = formattedCandles;
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching historical candles:', err);
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

  // 2. Set up WebSockets for Real-time Streams
  useEffect(() => {
    // Determine streams based on symbol and timeframe
    const sLower = symbol.toLowerCase();
    const streams = [
      `${sLower}@kline_${timeframe}`,
      `${sLower}@trade`,
      `${sLower}@depth10@100ms`,
      `${sLower}@ticker`,
    ];

    const wsUrl = getWebSocketUrl(streams);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const stream = data.stream;
      const payload = data.data;

      if (!stream || !payload) return;

      // Handle Kline Stream
      if (stream.includes('@kline')) {
        const k = payload.k;
        const newCandle = {
          time: Math.floor(k.t / 1000),
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v),
        };

        const currentCandles = candlesRef.current;
        if (currentCandles.length > 0) {
          const lastCandle = currentCandles[currentCandles.length - 1];
          let updatedCandles;
          if (newCandle.time === lastCandle.time) {
            // Update last candle
            updatedCandles = [...currentCandles.slice(0, -1), newCandle];
          } else if (newCandle.time > lastCandle.time) {
            // Append new candle
            updatedCandles = [...currentCandles, newCandle];
          } else {
            // Old candle, ignore
            return;
          }
          setCandles(updatedCandles);
          candlesRef.current = updatedCandles;
        }
      }

      // Handle Trade Stream
      else if (stream.includes('@trade')) {
        const newTrade = {
          id: payload.t,
          time: payload.T,
          price: parseFloat(payload.p),
          quantity: parseFloat(payload.q),
          isSell: payload.m,
        };
        setTrades((prev) => [newTrade, ...prev.slice(0, 49)]); // Keep last 50 trades
      }

      // Handle Depth (Order Book) Stream
      else if (stream.includes('@depth')) {
        const formattedBids = payload.bids.map((b) => ({
          price: parseFloat(b[0]),
          quantity: parseFloat(b[1]),
        }));
        const formattedAsks = payload.asks.map((a) => ({
          price: parseFloat(a[0]),
          quantity: parseFloat(a[1]),
        }));
        setOrderBook({
          bids: formattedBids,
          asks: formattedAsks,
        });
      }

      // Handle Ticker Stream
      else if (stream.includes('@ticker')) {
        setTicker({
          price: parseFloat(payload.c),
          priceChangePercent: parseFloat(payload.P),
          priceChange: parseFloat(payload.p),
          high: parseFloat(payload.h),
          low: parseFloat(payload.l),
          volume: parseFloat(payload.v),
          quoteVolume: parseFloat(payload.q),
          lastUpdate: payload.E,
        });
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('WebSocket connection error.');
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [symbol, timeframe]);

  return {
    candles,
    trades,
    orderBook,
    ticker,
    loading,
    error,
    wsConnected,
  };
}
