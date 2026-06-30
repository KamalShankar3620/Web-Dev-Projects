import React, { useState } from 'react';
import { Bell, BellOff, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export default function AlertsManager({ 
  alerts, 
  onAddAlert, 
  onDeleteAlert, 
  onClearHistory,
  alertHistory,
  ticker,
  symbol
}) {
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState('above'); // 'above' or 'below'

  const handleSubmit = (e) => {
    e.preventDefault();
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;

    onAddAlert({
      symbol,
      targetPrice: price,
      direction,
    });
    setTargetPrice('');
  };

  const formatPrice = (val) => {
    if (val === undefined || val === null) return '---';
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const currentPrice = ticker ? ticker.price : null;

  return (
    <div className="alerts-container">
      <div className="panel-title">Price Alerts</div>

      {/* Set Alert Form */}
      <form onSubmit={handleSubmit} className="alert-form">
        <div className="form-row">
          <label>Target Price</label>
          <div className="input-with-action">
            <input
              type="number"
              step="any"
              placeholder={currentPrice ? `Current: ${currentPrice}` : 'Target Price'}
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              required
            />
            {currentPrice && (
              <button 
                type="button" 
                className="btn-use-current"
                onClick={() => setTargetPrice(currentPrice.toString())}
              >
                Use Last
              </button>
            )}
          </div>
        </div>

        <div className="form-row flex-row">
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="direction"
                value="above"
                checked={direction === 'above'}
                onChange={() => setDirection('above')}
              />
              <span>Goes Above (≥)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="direction"
                value="below"
                checked={direction === 'below'}
                onChange={() => setDirection('below')}
              />
              <span>Goes Below (≤)</span>
            </label>
          </div>
          
          <button type="submit" className="add-alert-btn">
            <Plus size={16} />
            <span>Set</span>
          </button>
        </div>
      </form>

      {/* Lists */}
      <div className="alerts-lists-wrapper scrollbar">
        {/* Active Alerts */}
        <div className="alerts-section">
          <div className="section-header">
            <h4>Active Alerts ({alerts.length})</h4>
          </div>
          {alerts.length === 0 ? (
            <div className="empty-section txt-muted">
              <BellOff size={16} style={{ marginBottom: 4 }} />
              <span>No active alerts set.</span>
            </div>
          ) : (
            <div className="alerts-list">
              {alerts.map((alert) => (
                <div key={alert.id} className="alert-item">
                  <div className="alert-info">
                    <Bell className="bell-active" size={14} />
                    <span className="alert-symbol">{alert.symbol.replace('USDT', '')}</span>
                    <span className="alert-condition">
                      {alert.direction === 'above' ? '≥' : '≤'} {formatPrice(alert.targetPrice)}
                    </span>
                  </div>
                  <button 
                    className="delete-alert-btn"
                    onClick={() => onDeleteAlert(alert.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        {alertHistory.length > 0 && (
          <div className="alerts-section history-section">
            <div className="section-header">
              <h4>Triggered History</h4>
              <button className="clear-history-btn" onClick={onClearHistory}>
                Clear
              </button>
            </div>
            <div className="alerts-list">
              {alertHistory.map((hist) => (
                <div key={hist.id} className="alert-item triggered">
                  <div className="alert-info">
                    <CheckCircle2 className="bell-triggered" size={14} />
                    <span className="alert-symbol">{hist.symbol.replace('USDT', '')}</span>
                    <span className="alert-condition">
                      {hist.direction === 'above' ? '≥' : '≤'} {formatPrice(hist.targetPrice)}
                    </span>
                  </div>
                  <span className="triggered-time">
                    {new Date(hist.triggeredTime).toLocaleTimeString(undefined, { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit' 
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
