import React from 'react';

export default function LiveTrades({ trades }) {
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

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

  return (
    <div className="trades-container">
      <div className="panel-title">Recent Trades</div>

      {/* Column Headers */}
      <div className="trades-headers">
        <span className="col-header txt-left">Time</span>
        <span className="col-header txt-right">Price</span>
        <span className="col-header txt-right">Size</span>
      </div>

      {/* Trades List */}
      <div className="trades-list scrollbar">
        {trades.length > 0 ? (
          trades.map((trade) => (
            <div key={trade.id} className="trade-row">
              <span className="cell time-cell txt-muted txt-left">{formatTime(trade.time)}</span>
              <span className={`cell price-cell txt-right ${trade.isSell ? 'txt-down' : 'txt-up'}`}>
                {formatPrice(trade.price)}
              </span>
              <span className="cell size-cell txt-right">{formatQuantity(trade.quantity)}</span>
            </div>
          ))
        ) : (
          <div className="trades-loading">
            <span>Waiting for trades...</span>
          </div>
        )}
      </div>
    </div>
  );
}
