import React, { useRef, useState, useEffect } from 'react';
import { useBinanceChartData } from '../hooks/useBinanceChartData';
import ChartContainer from './ChartContainer';
import { RefreshCw, AlertTriangle, Target, Maximize2, Minimize2 } from 'lucide-react';
import { formatSymbolName } from '../utils/binance';

export default function ChartPanel({
  panel,
  isSelected,
  onSelect,
  activeTool,
  setActiveTool,
  drawings,
  setDrawings,
  isMaximized,
  onToggleMaximize,
  layout,
  magnetMode,
  drawModeLock,
  lockDrawings,
  hideDrawings,
  onOpenSettings
}) {
  const { candles, loading, error } = useBinanceChartData(panel.symbol, panel.timeframe);
  const panelRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Monitor browser fullscreen state to handle ESC key exits automatically
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === panelRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleFullscreenToggle = (e) => {
    e.stopPropagation();
    const element = panelRef.current;
    if (!element) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.error('Exit fullscreen error:', err));
    } else {
      element.requestFullscreen().catch((err) => console.error('Enter fullscreen error:', err));
    }
  };

  return (
    <div 
      ref={panelRef}
      className={`chart-panel-wrapper ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      {isSelected && (
        <div className="active-panel-tag">
          <Target size={10} style={{ marginRight: 4 }} />
          <span>Active</span>
        </div>
      )}
      
      <div className="chart-panel-header-overlay">
        <span className="panel-symbol-text">{formatSymbolName(panel.symbol)}</span>
        <span className="panel-tf-text">{panel.timeframe}</span>
        
        <button 
          className="panel-zoom-btn"
          onClick={handleFullscreenToggle}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
        >
          {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
      </div>

      {loading && candles.length === 0 ? (
        <div className="center-loader">
          <RefreshCw className="spinner" size={24} />
          <span>Loading {formatSymbolName(panel.symbol)}...</span>
        </div>
      ) : error && candles.length === 0 ? (
        <div className="center-error">
          <AlertTriangle size={24} />
          <span className="error-text">Failed to fetch API klines</span>
        </div>
      ) : (
        <ChartContainer
          candles={candles}
          activeSymbol={panel.symbol}
          activeTimeframe={panel.timeframe}
          activeTool={isSelected ? activeTool : 'cursor'}
          setActiveTool={setActiveTool}
          drawings={drawings}
          setDrawings={setDrawings}
          magnetMode={magnetMode}
          drawModeLock={drawModeLock}
          lockDrawings={lockDrawings}
          hideDrawings={hideDrawings}
          onOpenSettings={onOpenSettings}
        />
      )}
    </div>
  );
}
