export const DEFAULT_SYMBOLS = [
  { id: 'BTC-USD', name: 'BTC/USD', base: 'BTC', quote: 'USD', precision: 2, quantityPrecision: 5 },
  { id: 'ETH-USD', name: 'ETH/USD', base: 'ETH', quote: 'USD', precision: 2, quantityPrecision: 4 },
  { id: 'SOL-USD', name: 'SOL/USD', base: 'SOL', quote: 'USD', precision: 2, quantityPrecision: 2 },
  { id: 'LTC-USD', name: 'LTC/USD', base: 'LTC', quote: 'USD', precision: 2, quantityPrecision: 3 },
  { id: 'ADA-USD', name: 'ADA/USD', base: 'ADA', quote: 'USD', precision: 4, quantityPrecision: 1 },
  { id: 'DOGE-USD', name: 'DOGE/USD', base: 'DOGE', quote: 'USD', precision: 5, quantityPrecision: 0 },
  { id: 'XRP-USD', name: 'XRP/USD', base: 'XRP', quote: 'USD', precision: 4, quantityPrecision: 1 },
  { id: 'LINK-USD', name: 'LINK/USD', base: 'LINK', quote: 'USD', precision: 3, quantityPrecision: 2 },
  { id: 'AVAX-USD', name: 'AVAX/USD', base: 'AVAX', quote: 'USD', precision: 2, quantityPrecision: 2 },
];

export const TIMEFRAMES = [
  // Minutes
  { label: '1 minute', value: '1m', category: 'minutes', baseInterval: '1m', factor: 1 },
  { label: '2 minutes', value: '2m', category: 'minutes', baseInterval: '1m', factor: 2 },
  { label: '3 minutes', value: '3m', category: 'minutes', baseInterval: '1m', factor: 3 },
  { label: '5 minutes', value: '5m', category: 'minutes', baseInterval: '5m', factor: 1 },
  { label: '10 minutes', value: '10m', category: 'minutes', baseInterval: '5m', factor: 2 },
  { label: '15 minutes', value: '15m', category: 'minutes', baseInterval: '15m', factor: 1 },
  { label: '30 minutes', value: '30m', category: 'minutes', baseInterval: '15m', factor: 2 },
  { label: '45 minutes', value: '45m', category: 'minutes', baseInterval: '15m', factor: 3 },
  
  // Hours
  { label: '1 hour', value: '1h', category: 'hours', baseInterval: '1h', factor: 1 },
  { label: '2 hours', value: '2h', category: 'hours', baseInterval: '1h', factor: 2 },
  { label: '4 hours', value: '4h', category: 'hours', baseInterval: '1h', factor: 4 },
  
  // Days
  { label: '1 day', value: '1d', category: 'days', baseInterval: '1d', factor: 1 },
];

export const getHistoricalKlinesUrl = (symbol, baseInterval) => {
  const granularityMap = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '1d': 86400,
  };
  const g = granularityMap[baseInterval] || 300;
  return `https://api.exchange.coinbase.com/products/${symbol.toUpperCase()}/candles?granularity=${g}`;
};

export const getWebSocketUrl = () => {
  return 'wss://ws-feed.exchange.coinbase.com';
};

export const formatSymbolName = (symbolId) => {
  if (!symbolId) return '';
  return symbolId.replace('-', '/').toUpperCase();
};
