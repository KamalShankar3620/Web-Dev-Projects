import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function OrderBook({ orderBook, ticker, symbol }) {
  const { bids = [], asks = [] } = orderBook;

  // Format currency values based on magnitude
  const formatPrice = (val) => {
    if (val === undefined || val === null) return '---';
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const formatQuantity = (val) => {
    if (val === undefined || val === null) return '---';
    if (val >= 1000) return val.toFixed(1);
    if (val < 1) return val.toFixed(4);
    return val.toFixed(3);
  };

  // Process bids and asks to calculate cumulative totals and find the maximum total for volume bar scaling
  const processedData = useMemo(() => {
    // 1. Sort Asks: lowest ask at the bottom (closer to mid price)
    // For visualization, we slice to top 8 asks, then reverse so the highest price is at the top.
    const sortedAsks = [...asks].slice(0, 8).reverse();
    
    // Calculate cumulative totals for asks
    let askTotal = 0;
    const asksWithTotal = sortedAsks.map(ask => {
      askTotal += ask.quantity;
      return { ...ask, total: askTotal };
    });

    // 2. Sort Bids: highest bid at the top (closer to mid price)
    const sortedBids = [...bids].slice(0, 8);
    
    // Calculate cumulative totals for bids
    let bidTotal = 0;
    const bidsWithTotal = sortedBids.map(bid => {
      bidTotal += bid.quantity;
      return { ...bid, total: bidTotal };
    });

    // Max total among both bids and asks for scaling the background bars
    const maxTotal = Math.max(
      asksWithTotal.length > 0 ? asksWithTotal[0].total : 1, // Since asks are reversed, first index is the max total
      bidsWithTotal.length > 0 ? bidsWithTotal[bidsWithTotal.length - 1].total : 1
    );

    return {
      asksList: asksWithTotal,
      bidsList: bidsWithTotal,
      maxTotal,
    };
  }, [bids, asks]);

  const { asksList, bidsList, maxTotal } = processedData;

  const midPriceDirection = ticker ? (ticker.priceChangePercent >= 0 ? 'up' : 'down') : 'flat';

  return (
    <div className="orderbook-container">
      <div className="panel-title">Order Book</div>
      
      {/* Table Headers */}
      <div className="orderbook-headers">
        <span className="col-header txt-left">Price (USDT)</span>
        <span className="col-header txt-right">Size</span>
        <span className="col-header txt-right">Total</span>
      </div>

      {/* Asks (Sellers) - Red */}
      <div className="orderbook-list asks-list">
        {asksList.map((ask, idx) => {
          const percentage = Math.min((ask.total / maxTotal) * 100, 100);
          return (
            <div key={`ask-${idx}`} className="orderbook-row ask-row">
              <div 
                className="depth-bar ask-bar" 
                style={{ width: `${percentage}%` }}
              ></div>
              <span className="cell price-cell txt-down txt-left">{formatPrice(ask.price)}</span>
              <span className="cell size-cell txt-right">{formatQuantity(ask.quantity)}</span>
              <span className="cell total-cell txt-right">{formatQuantity(ask.total)}</span>
            </div>
          );
        })}
      </div>

      {/* Mid Market Price */}
      {ticker ? (
        <div className={`orderbook-mid-price ${midPriceDirection}`}>
          <span className="mid-price-value">
            {formatPrice(ticker.price)}
          </span>
          <span className="mid-price-icon">
            {midPriceDirection === 'up' ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
          </span>
        </div>
      ) : (
        <div className="orderbook-mid-price-loading">
          <span>---</span>
        </div>
      )}

      {/* Bids (Buyers) - Green */}
      <div className="orderbook-list bids-list">
        {bidsList.map((bid, idx) => {
          const percentage = Math.min((bid.total / maxTotal) * 100, 100);
          return (
            <div key={`bid-${idx}`} className="orderbook-row bid-row">
              <div 
                className="depth-bar bid-bar" 
                style={{ width: `${percentage}%` }}
              ></div>
              <span className="cell price-cell txt-up txt-left">{formatPrice(bid.price)}</span>
              <span className="cell size-cell txt-right">{formatQuantity(bid.quantity)}</span>
              <span className="cell total-cell txt-right">{formatQuantity(bid.total)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
