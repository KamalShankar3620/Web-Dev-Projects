import React from 'react';

// Custom Outlined SVG Icons matching the TradingView design
const CrosshairIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" strokeDasharray="3,3" />
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

const TrendLineIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="19" x2="19" y2="5" />
    <circle cx="5" cy="19" r="2" fill="var(--bg-panel)" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="19" cy="5" r="2" fill="var(--bg-panel)" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const FibonacciIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
    <circle cx="18" cy="6" r="1.5" fill="currentColor" />
    <circle cx="6" cy="18" r="1.5" fill="currentColor" />
  </svg>
);

const PatternIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,18 12,6 18,14 10,14" />
    <circle cx="6" cy="18" r="1.5" fill="currentColor" />
    <circle cx="12" cy="6" r="1.5" fill="currentColor" />
    <circle cx="18" cy="14" r="1.5" fill="currentColor" />
  </svg>
);

const HorizontalRayIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="17" x2="20" y2="17" />
    <line x1="6" y1="7" x2="6" y2="17" />
    <circle cx="6" cy="7" r="1.5" fill="currentColor" />
    <circle cx="6" cy="17" r="1.5" fill="currentColor" />
    <text x="10" y="15" fontSize="8" fontFamily="sans-serif" fontWeight="bold" fill="currentColor" stroke="none">L</text>
  </svg>
);

const BrushIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.7 8.3L16 5.6M12 9.6L9.3 6.9M14.7 12.3c0-2.2-1.8-4-4-4S6.7 10.1 6.7 12.3c0 3 2.7 5.7 4 5.7s4-2.7 4-5.7z" />
  </svg>
);

const TextIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="5" x2="20" y2="5" />
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="9" y1="19" x2="15" y2="19" />
  </svg>
);

const IconSmileyIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const RulerIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="6" width="16" height="12" rx="2" transform="rotate(45 12 12)" />
    <line x1="9" y1="9" x2="10" y2="10" />
    <line x1="12" y1="12" x2="13" y2="13" />
    <line x1="15" y1="15" x2="16" y2="16" />
  </svg>
);

const ZoomIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const MagnetIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 12c0-2.76-2.24-5-5-5s-5 2.24-5 5v5h3v-5c0-1.1.9-2 2-2s2 .9 2 2v5h3v-5z" />
    <path d="M7 17h3" />
    <path d="M14 17h3" />
  </svg>
);

const PencilLockIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 16H4v-4L14 2l4 4-7.5 7.5" />
    <rect x="14" y="14" width="6" height="5" rx="1" />
    <path d="M15 14v-2a2 2 0 0 1 4 0v2" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeHideIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default function DrawingToolbar({ 
  activeTool, 
  setActiveTool, 
  onClearAll,
  magnetMode,
  setMagnetMode,
  drawModeLock,
  setDrawModeLock,
  lockDrawings,
  setLockDrawings,
  hideDrawings,
  setHideDrawings,
  favoriteActive,
  setFavoriteActive
}) {
  return (
    <div className="drawing-toolbar scrollbar">
      
      {/* 1. Drawing Tools Group */}
      <div className="tools-group">
        <button 
          className={`tool-btn ${activeTool === 'cursor' ? 'active' : ''}`}
          onClick={() => setActiveTool('cursor')}
          title="Crosshair Cursor (+)"
        >
          <CrosshairIcon />
          <span className="tooltip">Crosshair</span>
        </button>

        <button 
          className={`tool-btn ${activeTool === 'trendline' ? 'active' : ''}`}
          onClick={() => setActiveTool('trendline')}
          title="Trend Line"
        >
          <TrendLineIcon />
          <span className="tooltip">Trend Line</span>
        </button>

        <button 
          className={`tool-btn ${activeTool === 'fibonacci' ? 'active' : ''}`}
          onClick={() => setActiveTool('fibonacci')}
          title="Fibonacci Retracement"
        >
          <FibonacciIcon />
          <span className="tooltip">Fibonacci</span>
        </button>

        <button 
          className={`tool-btn ${activeTool === 'pattern' ? 'active' : ''}`}
          onClick={() => setActiveTool('pattern')}
          title="Pattern Line"
        >
          <PatternIcon />
          <span className="tooltip">Pattern</span>
        </button>

        <button 
          className={`tool-btn ${activeTool === 'horizontal' ? 'active' : ''}`}
          onClick={() => setActiveTool('horizontal')}
          title="Horizontal Ray Info (L)"
        >
          <HorizontalRayIcon />
          <span className="tooltip">Horizontal Ray</span>
        </button>

        <button 
          className={`tool-btn ${activeTool === 'brush' ? 'active' : ''}`}
          onClick={() => setActiveTool('brush')}
          title="Brush Pen"
        >
          <BrushIcon />
          <span className="tooltip">Brush Pen</span>
        </button>

        <button 
          className={`tool-btn ${activeTool === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTool('text')}
          title="Text Note (T)"
        >
          <TextIcon />
          <span className="tooltip">Text Tool</span>
        </button>

        <button 
          className={`tool-btn ${activeTool === 'smile' ? 'active' : ''}`}
          onClick={() => setActiveTool('smile')}
          title="Icons / Smiles"
        >
          <IconSmileyIcon />
          <span className="tooltip">Smiley Icons</span>
        </button>
      </div>

      <div className="divider"></div>

      {/* 2. Measurement / Zoom Utilities Group */}
      <div className="tools-group">
        <button 
          className={`tool-btn ${activeTool === 'measure' ? 'active' : ''}`}
          onClick={() => setActiveTool('measure')}
          title="Measure / Ruler"
        >
          <RulerIcon />
          <span className="tooltip">Measure Distance</span>
        </button>

        <button 
          className={`tool-btn ${activeTool === 'zoom' ? 'active' : ''}`}
          onClick={() => setActiveTool('zoom')}
          title="Zoom In"
        >
          <ZoomIcon />
          <span className="tooltip">Zoom In</span>
        </button>
      </div>

      <div className="divider"></div>

      {/* 3. Toggles and Locks Group */}
      <div className="tools-group">
        <button 
          className={`tool-btn toggle-btn ${magnetMode ? 'active' : ''}`}
          onClick={() => setMagnetMode(!magnetMode)}
          title="Magnet Mode (Snaps to price OHLC)"
        >
          <MagnetIcon />
          <span className="tooltip">Magnet Mode: {magnetMode ? 'ON' : 'OFF'}</span>
        </button>

        <button 
          className={`tool-btn toggle-btn ${drawModeLock ? 'active' : ''}`}
          onClick={() => setDrawModeLock(!drawModeLock)}
          title="Stay in Drawing Mode"
        >
          <PencilLockIcon />
          <span className="tooltip">Lock Drawing Mode: {drawModeLock ? 'ON' : 'OFF'}</span>
        </button>

        <button 
          className={`tool-btn toggle-btn ${lockDrawings ? 'active' : ''}`}
          onClick={() => setLockDrawings(!lockDrawings)}
          title="Lock All Drawings"
        >
          <LockIcon />
          <span className="tooltip">Lock Drawings: {lockDrawings ? 'ON' : 'OFF'}</span>
        </button>

        <button 
          className={`tool-btn toggle-btn ${hideDrawings ? 'active' : ''}`}
          onClick={() => setHideDrawings(!hideDrawings)}
          title="Hide All Drawings"
        >
          <EyeHideIcon />
          <span className="tooltip">Hide Drawings: {hideDrawings ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      <div className="divider"></div>

      {/* 4. Action Clear Group */}
      <button 
        className="tool-btn clear-btn" 
        onClick={onClearAll} 
        title="Clear All Drawings"
      >
        <TrashIcon />
        <span className="tooltip">Clear All Drawings</span>
      </button>

      {/* 5. Favorite Star Group (Aligned to bottom edge) */}
      <button 
        className={`star-favorite-btn ${favoriteActive ? 'active' : ''}`}
        onClick={() => setFavoriteActive(!favoriteActive)}
        title="Favorite Tools Toolbar"
      >
        <StarIcon />
        <span className="tooltip">Favorite Bar</span>
      </button>

    </div>
  );
}
