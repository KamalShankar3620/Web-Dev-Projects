import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

const DEFAULT_SETTINGS = {
  lineColor: '#38bdf8',
  lineOpacity: 1.0,
  lineWidth: 2,
  lineStyle: 'solid',
  leftArrow: false,
  rightArrow: false,
  middlePoint: false,
  priceLabels: false,
  stats: {
    priceRange: false,
    percentChange: false,
    barsRange: false,
    dateTimeRange: false,
    angle: false,
    alwaysShow: true,
  },
  statsPosition: 'middle',
  text: {
    enabled: false,
    content: '',
    color: '#ffffff',
    fontSize: 12,
    bold: false,
    italic: false,
    alignment: 'center',
  },
  visibility: {
    seconds: true,
    minutes: true,
    hours: true,
    days: true,
  }
};

export default function DrawingSettingsModal({ 
  drawing, 
  isOpen, 
  onClose, 
  onSave 
}) {
  if (!isOpen || !drawing) return null;

  const [activeTab, setActiveTab] = useState('style');
  const [settings, setSettings] = useState(() => {
    // Clone properties from drawing or use default settings schema
    return {
      ...DEFAULT_SETTINGS,
      ...(drawing.settings || {}),
      stats: {
        ...DEFAULT_SETTINGS.stats,
        ...(drawing.settings?.stats || {}),
      },
      text: {
        ...DEFAULT_SETTINGS.text,
        ...(drawing.settings?.text || {}),
      },
      visibility: {
        ...DEFAULT_SETTINGS.visibility,
        ...(drawing.settings?.visibility || {}),
      }
    };
  });

  // Direct editing of coordinates
  const [p1Price, setP1Price] = useState(() => drawing.p1?.price || drawing.yPrice || 0);
  const [p2Price, setP2Price] = useState(() => drawing.p2?.price || 0);
  const [p1Logical, setP1Logical] = useState(() => drawing.p1?.logical || 0);
  const [p2Logical, setP2Logical] = useState(() => drawing.p2?.logical || 0);

  const handleSave = () => {
    const updatedDrawing = {
      ...drawing,
      settings,
    };
    
    // Write back adjusted coordinate numbers
    if (drawing.type === 'horizontal') {
      updatedDrawing.yPrice = parseFloat(p1Price);
    } else {
      updatedDrawing.p1 = { ...drawing.p1, price: parseFloat(p1Price), logical: parseInt(p1Logical) };
      updatedDrawing.p2 = { ...drawing.p2, price: parseFloat(p2Price), logical: parseInt(p2Logical) };
    }

    onSave(updatedDrawing);
    onClose();
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNestedSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const colorOptions = [
    '#38bdf8', // sky blue
    '#e91e63', // pink
    '#ff9800', // orange
    '#4caf50', // green
    '#9c27b0', // purple
    '#ffffff', // white
    '#facc15', // yellow
    '#ef4444', // red
  ];

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal-container">
        
        {/* Modal Header */}
        <div className="settings-modal-header">
          <h3>Trendline Properties</h3>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Tabs Header */}
        <div className="settings-modal-tabs">
          <button 
            className={`tab-link ${activeTab === 'style' ? 'active' : ''}`}
            onClick={() => setActiveTab('style')}
          >
            Style
          </button>
          <button 
            className={`tab-link ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            Text
          </button>
          <button 
            className={`tab-link ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </button>
          <button 
            className={`tab-link ${activeTab === 'coordinates' ? 'active' : ''}`}
            onClick={() => setActiveTab('coordinates')}
          >
            Coordinates
          </button>
          <button 
            className={`tab-link ${activeTab === 'visibility' ? 'active' : ''}`}
            onClick={() => setActiveTab('visibility')}
          >
            Visibility
          </button>
        </div>

        {/* Modal Content Drawer */}
        <div className="settings-modal-content">
          
          {/* TAB 1: STYLE */}
          {activeTab === 'style' && (
            <div className="form-group-column">
              <div className="form-row-item">
                <label>Line Color</label>
                <div className="color-pickers-row">
                  {colorOptions.map(c => (
                    <button 
                      key={c}
                      className={`color-bubble ${settings.lineColor === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => updateSetting('lineColor', c)}
                    >
                      {settings.lineColor === c && <Check size={10} style={{ color: c === '#ffffff' ? '#000000' : '#ffffff' }} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row-grid">
                <div className="form-row-item">
                  <label>Width</label>
                  <select 
                    value={settings.lineWidth}
                    onChange={(e) => updateSetting('lineWidth', parseInt(e.target.value))}
                  >
                    <option value={1}>1px</option>
                    <option value={2}>2px (Default)</option>
                    <option value={3}>3px</option>
                    <option value={4}>4px</option>
                  </select>
                </div>

                <div className="form-row-item">
                  <label>Pattern</label>
                  <select 
                    value={settings.lineStyle}
                    onChange={(e) => updateSetting('lineStyle', e.target.value)}
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>
              </div>

              <div className="form-row-grid" style={{ marginTop: 8 }}>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.leftArrow}
                    onChange={(e) => updateSetting('leftArrow', e.target.checked)}
                  />
                  <span>Left Arrow End</span>
                </label>

                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.rightArrow}
                    onChange={(e) => updateSetting('rightArrow', e.target.checked)}
                  />
                  <span>Right Arrow End</span>
                </label>
              </div>

              <div className="form-row-grid" style={{ marginTop: 8 }}>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.middlePoint}
                    onChange={(e) => updateSetting('middlePoint', e.target.checked)}
                  />
                  <span>Show Mid-Point</span>
                </label>

                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.priceLabels}
                    onChange={(e) => updateSetting('priceLabels', e.target.checked)}
                  />
                  <span>Price Labels on Axis</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: TEXT */}
          {activeTab === 'text' && (
            <div className="form-group-column">
              <label className="checkbox-label" style={{ marginBottom: 12 }}>
                <input 
                  type="checkbox" 
                  checked={settings.text.enabled}
                  onChange={(e) => updateNestedSetting('text', 'enabled', e.target.checked)}
                />
                <span>Enable Text Label</span>
              </label>

              {settings.text.enabled && (
                <>
                  <div className="form-row-item">
                    <label>Text Content</label>
                    <textarea 
                      value={settings.text.content}
                      onChange={(e) => updateNestedSetting('text', 'content', e.target.value)}
                      placeholder="Type trendline notes here..."
                      rows={3}
                    />
                  </div>

                  <div className="form-row-grid">
                    <div className="form-row-item">
                      <label>Font Size</label>
                      <select 
                        value={settings.text.fontSize}
                        onChange={(e) => updateNestedSetting('text', 'fontSize', parseInt(e.target.value))}
                      >
                        <option value={10}>10px</option>
                        <option value={12}>12px</option>
                        <option value={14}>14px</option>
                        <option value={16}>16px</option>
                      </select>
                    </div>

                    <div className="form-row-item">
                      <label>Alignment</label>
                      <select 
                        value={settings.text.alignment}
                        onChange={(e) => updateNestedSetting('text', 'alignment', e.target.value)}
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row-grid" style={{ marginTop: 10 }}>
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={settings.text.bold}
                        onChange={(e) => updateNestedSetting('text', 'bold', e.target.checked)}
                      />
                      <span>Bold</span>
                    </label>

                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={settings.text.italic}
                        onChange={(e) => updateNestedSetting('text', 'italic', e.target.checked)}
                      />
                      <span>Italic</span>
                    </label>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: STATS */}
          {activeTab === 'stats' && (
            <div className="form-group-column">
              <div className="form-row-grid">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.stats.priceRange}
                    onChange={(e) => updateNestedSetting('stats', 'priceRange', e.target.checked)}
                  />
                  <span>Price Range</span>
                </label>

                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.stats.percentChange}
                    onChange={(e) => updateNestedSetting('stats', 'percentChange', e.target.checked)}
                  />
                  <span>Percent Change</span>
                </label>
              </div>

              <div className="form-row-grid" style={{ marginTop: 8 }}>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.stats.barsRange}
                    onChange={(e) => updateNestedSetting('stats', 'barsRange', e.target.checked)}
                  />
                  <span>Bars Range</span>
                </label>

                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.stats.dateTimeRange}
                    onChange={(e) => updateNestedSetting('stats', 'dateTimeRange', e.target.checked)}
                  />
                  <span>Date/time Range</span>
                </label>
              </div>

              <div className="form-row-grid" style={{ marginTop: 8 }}>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.stats.angle}
                    onChange={(e) => updateNestedSetting('stats', 'angle', e.target.checked)}
                  />
                  <span>Inclination Angle</span>
                </label>

                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.stats.alwaysShow}
                    onChange={(e) => updateNestedSetting('stats', 'alwaysShow', e.target.checked)}
                  />
                  <span>Always Show Stats</span>
                </label>
              </div>

              <div className="form-row-item" style={{ marginTop: 12 }}>
                <label>Stats Box Placement</label>
                <select 
                  value={settings.statsPosition}
                  onChange={(e) => updateSetting('statsPosition', e.target.value)}
                >
                  <option value="top">Top</option>
                  <option value="middle">Middle</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 4: COORDINATES */}
          {activeTab === 'coordinates' && (
            <div className="form-group-column">
              <div className="form-row-grid">
                <div className="form-row-item">
                  <label>Price 1 ($)</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    value={p1Price}
                    onChange={(e) => setP1Price(e.target.value)}
                  />
                </div>

                {drawing.type !== 'horizontal' && (
                  <div className="form-row-item">
                    <label>Price 2 ($)</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      value={p2Price}
                      onChange={(e) => setP2Price(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {drawing.type !== 'horizontal' && (
                <div className="form-row-grid" style={{ marginTop: 10 }}>
                  <div className="form-row-item">
                    <label>Bar Number 1</label>
                    <input 
                      type="number"
                      value={p1Logical}
                      onChange={(e) => setP1Logical(e.target.value)}
                    />
                  </div>

                  <div className="form-row-item">
                    <label>Bar Number 2</label>
                    <input 
                      type="number"
                      value={p2Logical}
                      onChange={(e) => setP2Logical(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: VISIBILITY */}
          {activeTab === 'visibility' && (
            <div className="form-group-column">
              <div className="form-row-grid">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.visibility.seconds}
                    onChange={(e) => updateNestedSetting('visibility', 'seconds', e.target.checked)}
                  />
                  <span>Seconds (30s)</span>
                </label>

                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.visibility.minutes}
                    onChange={(e) => updateNestedSetting('visibility', 'minutes', e.target.checked)}
                  />
                  <span>Minutes (1m - 45m)</span>
                </label>
              </div>

              <div className="form-row-grid" style={{ marginTop: 8 }}>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.visibility.hours}
                    onChange={(e) => updateNestedSetting('visibility', 'hours', e.target.checked)}
                  />
                  <span>Hours (1h - 4h)</span>
                </label>

                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={settings.visibility.days}
                    onChange={(e) => updateNestedSetting('visibility', 'days', e.target.checked)}
                  />
                  <span>Days (1d)</span>
                </label>
              </div>
            </div>
          )}

        </div>

        {/* Modal Buttons Footer */}
        <div className="settings-modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-save" onClick={handleSave}>
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
