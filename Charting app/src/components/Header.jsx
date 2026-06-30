import React, { useState, useEffect } from 'react';
import { TIMEFRAMES, formatSymbolName } from '../utils/binance';
import { Activity, RefreshCw, Square, Columns, Rows, LayoutGrid, ChevronDown, Expand, Minimize, Plus } from 'lucide-react';

export default function Header({ 
  symbol, 
  timeframe, 
  setTimeframe, 
  ticker, 
  wsConnected,
  onSearchClick,
  layout,
  setLayout,
  zenMode,
  setZenMode
}) {
  const [prevPrice, setPrevPrice] = useState(null);
  const [priceDirection, setPriceDirection] = useState('flat'); // 'up', 'down', 'flat'
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);

  useEffect(() => {
    if (ticker && ticker.price) {
      if (prevPrice !== null) {
        if (ticker.price > prevPrice) {
          setPriceDirection('up');
        } else if (ticker.price < prevPrice) {
          setPriceDirection('down');
        }
      }
      setPrevPrice(ticker.price);
    }
  }, [ticker?.price]);

  // Format currency values
  const formatPrice = (val) => {
    if (val === undefined || val === null) return '---';
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const formatPercentage = (val) => {
    if (val === undefined || val === null) return '0.00%';
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(2)}%`;
  };

  const formatVolume = (val) => {
    if (val === undefined || val === null) return '---';
    if (val >= 1e6) {
      return (val / 1e6).toFixed(2) + 'M';
    }
    if (val >= 1e3) {
      return (val / 1e3).toFixed(2) + 'K';
    }
    return val.toFixed(2);
  };

  const isPositive = ticker ? ticker.priceChangePercent >= 0 : true;

  return (
    <header className="header-container">
      <div className="header-left">
        <button className="symbol-selector-btn" onClick={onSearchClick}>
          <h2>{formatSymbolName(symbol)}</h2>
          <span className="search-hint">Search</span>
        </button>

        <div className="ws-status">
          <span className={`status-dot ${wsConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">{wsConnected ? 'Live' : 'Connecting'}</span>
          <span className="feed-source-badge">Coinbase</span>
        </div>

        {/* Structured Timeframe selector dropdown */}
        <div className="timeframe-dropdown-container" style={{ position: 'relative' }}>
          <button 
            className="timeframe-toggle-btn"
            onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
            title="Timeframe Interval"
          >
            <span>{timeframe}</span>
            <ChevronDown size={10} style={{ marginLeft: 4 }} />
          </button>
          
          {isTimeframeOpen && (
            <>
              <div className="dropdown-overlay" onClick={() => setIsTimeframeOpen(false)} />
              <div className="timeframe-dropdown scrollbar">
                <div className="timeframe-dropdown-header">
                  <Plus size={12} style={{ marginRight: 6 }} />
                  <span>Add custom interval...</span>
                </div>
                
                {/* TICKS */}
                <div className="timeframe-category-section">
                  <div className="timeframe-category-title">Ticks</div>
                  <button className="timeframe-option-btn" style={{ opacity: 0.4, cursor: 'not-allowed' }} disabled>1 tick</button>
                  <button className="timeframe-option-btn" style={{ opacity: 0.4, cursor: 'not-allowed' }} disabled>10 ticks</button>
                  <button className="timeframe-option-btn" style={{ opacity: 0.4, cursor: 'not-allowed' }} disabled>100 ticks</button>
                </div>

                {/* SECONDS */}
                <div className="timeframe-category-section">
                  <div className="timeframe-category-title">Seconds</div>
                  <button className="timeframe-option-btn" style={{ opacity: 0.4, cursor: 'not-allowed' }} disabled>1 second</button>
                  <button className="timeframe-option-btn" style={{ opacity: 0.4, cursor: 'not-allowed' }} disabled>5 seconds</button>
                  <button className="timeframe-option-btn" style={{ opacity: 0.4, cursor: 'not-allowed' }} disabled>15 seconds</button>
                  <button 
                    className={`timeframe-option-btn ${timeframe === '30s' ? 'active' : ''}`}
                    onClick={() => { setTimeframe('30s'); setIsTimeframeOpen(false); }}
                  >
                    30 seconds
                  </button>
                </div>

                {/* MINUTES */}
                <div className="timeframe-category-section">
                  <div className="timeframe-category-title">Minutes</div>
                  {TIMEFRAMES.filter(t => t.category === 'minutes').map(t => (
                    <button 
                      key={t.value}
                      className={`timeframe-option-btn ${timeframe === t.value ? 'active' : ''}`}
                      onClick={() => { setTimeframe(t.value); setIsTimeframeOpen(false); }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* HOURS */}
                <div className="timeframe-category-section">
                  <div className="timeframe-category-title">Hours</div>
                  {TIMEFRAMES.filter(t => t.category === 'hours').map(t => (
                    <button 
                      key={t.value}
                      className={`timeframe-option-btn ${timeframe === t.value ? 'active' : ''}`}
                      onClick={() => { setTimeframe(t.value); setIsTimeframeOpen(false); }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* DAYS */}
                <div className="timeframe-category-section">
                  <div className="timeframe-category-title">Days</div>
                  {TIMEFRAMES.filter(t => t.category === 'days').map(t => (
                    <button 
                      key={t.value}
                      className={`timeframe-option-btn ${timeframe === t.value ? 'active' : ''}`}
                      onClick={() => { setTimeframe(t.value); setIsTimeframeOpen(false); }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Layout split selector */}
        <div className="layout-selector" style={{ position: 'relative' }}>
          <button 
            className="layout-toggle-btn"
            onClick={() => setIsLayoutOpen(!isLayoutOpen)}
            title="Chart Layouts"
          >
            {layout === 'single' && <Square size={14} />}
            {layout === 'split-v' && <Columns size={14} />}
            {layout === 'split-h' && <Rows size={14} />}
            {layout === 'grid' && <LayoutGrid size={14} />}
            <ChevronDown size={10} style={{ marginLeft: 4 }} />
          </button>
          
          {isLayoutOpen && (
            <>
              <div className="dropdown-overlay" onClick={() => setIsLayoutOpen(false)} />
              <div className="layout-dropdown">
                <button 
                  className={`layout-option-btn ${layout === 'single' ? 'active' : ''}`}
                  onClick={() => { setLayout('single'); setIsLayoutOpen(false); }}
                >
                  <Square size={12} />
                  <span>Single Chart</span>
                </button>
                <button 
                  className={`layout-option-btn ${layout === 'split-v' ? 'active' : ''}`}
                  onClick={() => { setLayout('split-v'); setIsLayoutOpen(false); }}
                >
                  <Columns size={12} />
                  <span>Split Vertically</span>
                </button>
                <button 
                  className={`layout-option-btn ${layout === 'split-h' ? 'active' : ''}`}
                  onClick={() => { setLayout('split-h'); setIsLayoutOpen(false); }}
                >
                  <Rows size={12} />
                  <span>Split Horizontally</span>
                </button>
                <button 
                  className={`layout-option-btn ${layout === 'grid' ? 'active' : ''}`}
                  onClick={() => { setLayout('grid'); setIsLayoutOpen(false); }}
                >
                  <LayoutGrid size={12} />
                  <span>2x2 Grid</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Full View Toggle */}
        <button 
          className={`layout-toggle-btn zen-toggle-btn ${zenMode ? 'active' : ''}`}
          onClick={() => setZenMode(!zenMode)}
          title={zenMode ? "Show Sidebar & Toolbars" : "Hide Sidebars (Full View)"}
          style={{ marginLeft: 6 }}
        >
          {zenMode ? <Minimize size={14} /> : <Expand size={14} />}
        </button>
      </div>



      {ticker ? (
        <div className="header-stats">
          <div className="stat-box price-box">
            <span className="stat-label">Last Price</span>
            <span className={`stat-value price-value ${priceDirection === 'up' ? 'flash-green' : priceDirection === 'down' ? 'flash-red' : ''}`}>
              {formatPrice(ticker.price)}
            </span>
          </div>

          <div className="stat-box">
            <span className="stat-label">24h Change</span>
            <span className={`stat-value ${isPositive ? 'txt-up' : 'txt-down'}`}>
              {formatPrice(ticker.priceChange)} ({formatPercentage(ticker.priceChangePercent)})
            </span>
          </div>

          <div className="stat-box hidden-mobile">
            <span className="stat-label">24h High</span>
            <span className="stat-value">{formatPrice(ticker.high)}</span>
          </div>

          <div className="stat-box hidden-mobile">
            <span className="stat-label">24h Low</span>
            <span className="stat-value">{formatPrice(ticker.low)}</span>
          </div>

          <div className="stat-box hidden-md">
            <span className="stat-label">24h Volume ({formatSymbolName(symbol).split('/')[0]})</span>
            <span className="stat-value">{formatVolume(ticker.volume)}</span>
          </div>

          <div className="stat-box hidden-md">
            <span className="stat-label">24h Value ({formatSymbolName(symbol).split('/')[1]})</span>
            <span className="stat-value">{formatVolume(ticker.quoteVolume)}</span>
          </div>
        </div>
      ) : (
        <div className="header-stats loading-stats">
          <RefreshCw className="spinner" size={16} />
          <span>Fetching live rates...</span>
        </div>
      )}
    </header>
  );
}
