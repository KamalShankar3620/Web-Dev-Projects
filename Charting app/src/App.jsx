import React, { useState, useEffect } from 'react';
import { useBinanceSidebarData } from './hooks/useBinanceSidebarData';
import Header from './components/Header';
import Watchlist from './components/Watchlist';
import DrawingToolbar from './components/DrawingToolbar';
import OrderBook from './components/OrderBook';
import LiveTrades from './components/LiveTrades';
import AlertsManager from './components/AlertsManager';
import ChartPanel from './components/ChartPanel';
import DrawingSettingsModal from './components/DrawingSettingsModal';
import { formatSymbolName } from './utils/binance';
import { Star, BarChart3, Bell, RefreshCw, AlertTriangle, Info, ChevronRight } from 'lucide-react';

export default function App() {
  // 1. Multi-Chart Panels State
  const [layout, setLayout] = useState(() => {
    return localStorage.getItem('chartLayout') || 'single';
  });

  const [selectedPanelId, setSelectedPanelId] = useState(0);
  const [maximizedPanelId, setMaximizedPanelId] = useState(null);
  const [zenMode, setZenMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sanitizePanels = (savedPanels) => {
    const defaultCoinbase = [
      { id: 0, symbol: 'BTC-USD', timeframe: '1m' },
      { id: 1, symbol: 'ETH-USD', timeframe: '5m' },
      { id: 2, symbol: 'SOL-USD', timeframe: '15m' },
      { id: 3, symbol: 'LTC-USD', timeframe: '1h' },
    ];
    if (!savedPanels || !Array.isArray(savedPanels)) return defaultCoinbase;
    const hasBinance = savedPanels.some(p => p.symbol.includes('USDT') || p.symbol === 'BNBUSDT');
    if (hasBinance) {
      return defaultCoinbase;
    }
    return savedPanels;
  };

  const [panels, setPanels] = useState(() => {
    const saved = localStorage.getItem('chartPanels');
    return sanitizePanels(saved ? JSON.parse(saved) : null);
  });

  // Selected focused panel helper
  const selectedPanel = panels.find((p) => p.id === selectedPanelId) || panels[0];

  // 2. Active Drawing Tool (shared or local to panels)
  const [activeTool, setActiveTool] = useState('cursor');
  const [magnetMode, setMagnetMode] = useState(false);
  const [drawModeLock, setDrawModeLock] = useState(false);
  const [lockDrawings, setLockDrawings] = useState(false);
  const [hideDrawings, setHideDrawings] = useState(false);
  const [favoriteActive, setFavoriteActive] = useState(false);

  // Drawings State
  const [drawings, setDrawings] = useState(() => {
    const saved = localStorage.getItem('drawings');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleOpenDrawingSettings = (drawing) => {
    setSelectedDrawing(drawing);
    setIsSettingsOpen(true);
  };

  const handleSaveDrawingSettings = (updatedDrawing) => {
    setDrawings(prev => prev.map(d => d.id === updatedDrawing.id ? updatedDrawing : d));
  };

  // Alerts States
  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem('alerts');
    return saved ? JSON.parse(saved) : [];
  });
  const [alertHistory, setAlertHistory] = useState(() => {
    const saved = localStorage.getItem('alertHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // UI Tab Navigation
  const [activeTab, setActiveTab] = useState('watchlist');
  const [toasts, setToasts] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 3. High-Frequency Feed for Sidebar Panels (Linked to Selected Symbol)
  const {
    trades,
    orderBook,
    ticker,
    wsConnected,
    error
  } = useBinanceSidebarData(selectedPanel.symbol);

  // 4. Save states to localStorage on change
  useEffect(() => {
    localStorage.setItem('chartLayout', layout);
  }, [layout]);

  useEffect(() => {
    localStorage.setItem('chartPanels', JSON.stringify(panels));
  }, [panels]);

  useEffect(() => {
    localStorage.setItem('drawings', JSON.stringify(drawings));
  }, [drawings]);

  useEffect(() => {
    localStorage.setItem('alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('alertHistory', JSON.stringify(alertHistory));
  }, [alertHistory]);

  // Adjust selected panel focus if it becomes hidden in split-screens
  useEffect(() => {
    const visible = getVisiblePanels();
    if (!visible.some((p) => p.id === selectedPanelId)) {
      setSelectedPanelId(visible[0].id);
    }
    setMaximizedPanelId(null); // Reset zoom when grid layout changes!
  }, [layout]);

  // Trigger a window resize event whenever layout, zenMode, or sidebarCollapsed changes to recalculate chart dimensions
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 120);
    return () => clearTimeout(timer);
  }, [layout, zenMode, sidebarCollapsed]);

  // Get active panels based on split layout configuration
  const getVisiblePanels = () => {
    if (maximizedPanelId !== null) {
      return panels.filter((p) => p.id === maximizedPanelId);
    }
    if (layout === 'single') return [panels[0]];
    if (layout === 'split-v' || layout === 'split-h') return [panels[0], panels[1]];
    return panels; // 'grid' layout displays all 4
  };

  const updatePanel = (id, updates) => {
    setPanels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  // 5. Price Alerts Loop Monitor
  useEffect(() => {
    if (!ticker || !ticker.price || alerts.length === 0) return;

    const currentPrice = ticker.price;
    const triggered = [];

    alerts.forEach((alert) => {
      if (alert.symbol === selectedPanel.symbol) {
        if (alert.direction === 'above' && currentPrice >= alert.targetPrice) {
          triggered.push(alert);
        } else if (alert.direction === 'below' && currentPrice <= alert.targetPrice) {
          triggered.push(alert);
        }
      }
    });

    if (triggered.length > 0) {
      playBeep();

      const triggeredIds = triggered.map((t) => t.id);
      const remainingAlerts = alerts.filter((a) => !triggeredIds.includes(a.id));
      setAlerts(remainingAlerts);

      const now = Date.now();
      const newHistory = triggered.map((t) => ({
        ...t,
        triggeredTime: now,
      }));
      setAlertHistory((prev) => [...newHistory, ...prev].slice(0, 50));

      triggered.forEach((t) => {
        addToast(
          `Price Target Met! ${formatSymbolName(t.symbol)} crossed ${
            t.direction === 'above' ? 'above' : 'below'
          } $${t.targetPrice.toLocaleString()}`,
          'warning'
        );
      });
    }
  }, [ticker?.price, alerts, selectedPanel.symbol]);

  // Sound Synthesizer via Web Audio API (Double Beep)
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.35);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.5, audioCtx.currentTime);
        gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.35);
      }, 150);
    } catch (err) {
      console.error('Failed to play synthesized alert tone:', err);
    }
  };

  const handleTabClick = (tab) => {
    if (activeTab === tab) {
      setSidebarCollapsed((prev) => !prev);
    } else {
      setActiveTab(tab);
      setSidebarCollapsed(false);
    }
  };

  // Toast Notification Manager
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Alert Callbacks
  const handleAddAlert = (alertConfig) => {
    const newAlert = {
      id: Date.now(),
      ...alertConfig,
      active: true,
    };
    setAlerts([...alerts, newAlert]);
    addToast(
      `Alert set for ${formatSymbolName(alertConfig.symbol)} at $${alertConfig.targetPrice.toLocaleString()}`,
      'success'
    );
  };

  const handleDeleteAlert = (id) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  const handleClearHistory = () => {
    setAlertHistory([]);
  };

  const handleClearAllDrawings = () => {
    if (window.confirm('Are you sure you want to clear all drawings on this active chart?')) {
      setDrawings(drawings.filter((d) => d.symbol !== selectedPanel.symbol));
      addToast('Drawings cleared.', 'info');
    }
  };

  return (
    <div className={`app-root ${zenMode ? 'zen-mode' : ''}`}>
      <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: '0' }}>
        ApexTerminal - Real-Time multi-chart split market and order book terminal
      </h1>

      {/* Toast Notification Container */}
      <div className="toasts-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'warning' ? <AlertTriangle size={16} /> : <Info size={16} />}
            <span className="toast-message">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Main Header */}
      <Header
        symbol={selectedPanel.symbol}
        timeframe={selectedPanel.timeframe}
        setTimeframe={(tf) => updatePanel(selectedPanelId, { timeframe: tf })}
        ticker={ticker}
        wsConnected={wsConnected}
        onSearchClick={() => setIsSearchOpen(true)}
        layout={layout}
        setLayout={setLayout}
        zenMode={zenMode}
        setZenMode={setZenMode}
      />

      <div className="workspace-container">
        {/* Left Drawing Toolbar */}
        <DrawingToolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onClearAll={handleClearAllDrawings}
          magnetMode={magnetMode}
          setMagnetMode={setMagnetMode}
          drawModeLock={drawModeLock}
          setDrawModeLock={setDrawModeLock}
          lockDrawings={lockDrawings}
          setLockDrawings={setLockDrawings}
          hideDrawings={hideDrawings}
          setHideDrawings={setHideDrawings}
          favoriteActive={favoriteActive}
          setFavoriteActive={setFavoriteActive}
        />

        {/* Center Split Screen Chart Grid */}
        <main className="chart-wrapper-main">
          {error && getVisiblePanels().length === 1 && (
            <div className="center-error">
              <AlertTriangle size={32} />
              <span>{error}</span>
              <button className="btn-retry" onClick={() => window.location.reload()}>
                Retry Connection
              </button>
            </div>
          )}
          
          <div className={`charts-grid-layout layout-${layout}`}>
            {getVisiblePanels().map((panel) => (
              <ChartPanel
                key={panel.id}
                panel={panel}
                isSelected={panel.id === selectedPanelId}
                onSelect={() => setSelectedPanelId(panel.id)}
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                drawings={drawings}
                setDrawings={setDrawings}
                isMaximized={maximizedPanelId === panel.id}
                onToggleMaximize={(id) => setMaximizedPanelId(prev => prev === id ? null : id)}
                layout={layout}
                magnetMode={magnetMode}
                drawModeLock={drawModeLock}
                lockDrawings={lockDrawings}
                hideDrawings={hideDrawings}
                onOpenSettings={handleOpenDrawingSettings}
              />
            ))}
          </div>
        </main>

        {/* Right Sidebar Tabbed Interface */}
        <aside className={`sidebar-right ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-tabs">
            <button
              className={`tab-btn ${activeTab === 'watchlist' && !sidebarCollapsed ? 'active' : ''}`}
              onClick={() => handleTabClick('watchlist')}
              title="Watchlist"
            >
              <Star size={18} />
              <span>Markets</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'orderbook' && !sidebarCollapsed ? 'active' : ''}`}
              onClick={() => handleTabClick('orderbook')}
              title="Order Book & Trades"
            >
              <BarChart3 size={18} />
              <span>Terminal</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'alerts' && !sidebarCollapsed ? 'active' : ''}`}
              onClick={() => handleTabClick('alerts')}
              title="Price Alerts"
            >
              <Bell size={18} />
              {alerts.filter(a => a.symbol === selectedPanel.symbol).length > 0 && (
                <span className="tab-badge">
                  {alerts.filter(a => a.symbol === selectedPanel.symbol).length}
                </span>
              )}
              <span>Alerts</span>
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="sidebar-content">
              <div className="sidebar-header-bar">
                <span className="sidebar-header-title">
                  {activeTab === 'watchlist' && 'Markets Watchlist'}
                  {activeTab === 'orderbook' && 'Trading Terminal'}
                  {activeTab === 'alerts' && 'Price Alerts'}
                </span>
                <button 
                  className="sidebar-collapse-btn"
                  onClick={() => setSidebarCollapsed(true)}
                  title="Collapse Sidebar"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {activeTab === 'watchlist' && (
                <Watchlist
                  activeSymbol={selectedPanel.symbol}
                  setActiveSymbol={(sym) => updatePanel(selectedPanelId, { symbol: sym })}
                />
              )}
              {activeTab === 'orderbook' && (
                <div className="tab-split scrollbar">
                  <OrderBook
                    orderBook={orderBook}
                    ticker={ticker}
                    symbol={selectedPanel.symbol}
                  />
                  <LiveTrades trades={trades} />
                </div>
              )}
              {activeTab === 'alerts' && (
                <AlertsManager
                  alerts={alerts.filter((a) => a.symbol === selectedPanel.symbol)}
                  onAddAlert={handleAddAlert}
                  onDeleteAlert={handleDeleteAlert}
                  onClearHistory={handleClearHistory}
                  alertHistory={alertHistory.filter((a) => a.symbol === selectedPanel.symbol)}
                  ticker={ticker}
                  symbol={selectedPanel.symbol}
                />
              )}
            </div>
          )}
        </aside>
      </div>

      <DrawingSettingsModal
        drawing={selectedDrawing}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveDrawingSettings}
      />
    </div>
  );
}
