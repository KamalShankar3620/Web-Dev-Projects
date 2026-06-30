import { useState, useEffect } from 'react';
import { getWebSocketUrl } from '../utils/binance';

export function useBinanceSidebarData(symbol) {
  const [trades, setTrades] = useState([]);
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [ticker, setTicker] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [error, setError] = useState(null);

  // 1. WebSocket for Matches & 24h Ticker data
  useEffect(() => {
    setTrades([]);
    setTicker(null);
    
    const wsUrl = getWebSocketUrl();
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsConnected(true);
      setError(null);

      // Subscribe to matches (trades) and ticker channels
      const subscribeMsg = {
        type: 'subscribe',
        product_ids: [symbol.toUpperCase()],
        channels: ['ticker', 'matches'],
      };
      ws.send(JSON.stringify(subscribeMsg));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.product_id !== symbol.toUpperCase()) return;

      if (data.type === 'match') {
        const newTrade = {
          id: data.trade_id,
          time: new Date(data.time).getTime(),
          price: parseFloat(data.price),
          quantity: parseFloat(data.size),
          isSell: data.side === 'sell',
        };
        setTrades((prev) => [newTrade, ...prev.slice(0, 49)]);
      }

      else if (data.type === 'ticker') {
        const price = parseFloat(data.price);
        const open24h = parseFloat(data.open_24h) || price;
        const priceChange = price - open24h;
        const priceChangePercent = open24h > 0 ? (priceChange / open24h) * 100 : 0;

        setTicker({
          price,
          priceChangePercent,
          priceChange,
          high: parseFloat(data.high_24h),
          low: parseFloat(data.low_24h),
          volume: parseFloat(data.volume_24h),
          quoteVolume: parseFloat(data.volume_24h) * price, // Approximation
          lastUpdate: new Date(data.time).getTime(),
        });
      }
    };

    ws.onerror = (err) => {
      console.error('Coinbase Sidebar WS error:', err);
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
          channels: ['ticker', 'matches'],
        };
        try {
          ws.send(JSON.stringify(unsubscribeMsg));
        } catch (e) {
          console.warn('Failed to send unsubscribe message:', e);
        }
        ws.close();
      } else if (ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [symbol]);

  // 2. Poll Order Book snapshot via REST to avoid complex delta out-of-sync bugs
  useEffect(() => {
    setOrderBook({ bids: [], asks: [] });
    let active = true;

    const fetchOrderBook = async () => {
      try {
        const response = await fetch(`https://api.exchange.coinbase.com/products/${symbol.toUpperCase()}/book?level=2`);
        if (!response.ok) return;
        const data = await response.json();

        if (active && data.bids && data.asks) {
          // Coinbase book structure: [ [price, size, num-orders], ... ]
          const formattedBids = data.bids.slice(0, 10).map((b) => ({
            price: parseFloat(b[0]),
            quantity: parseFloat(b[1]),
          }));
          const formattedAsks = data.asks.slice(0, 10).map((a) => ({
            price: parseFloat(a[0]),
            quantity: parseFloat(a[1]),
          }));

          setOrderBook({
            bids: formattedBids,
            asks: formattedAsks,
          });
        }
      } catch (err) {
        console.error('Failed to poll Coinbase order book:', err);
      }
    };

    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 1500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [symbol]);

  return {
    trades,
    orderBook,
    ticker,
    wsConnected,
    error,
  };
}
