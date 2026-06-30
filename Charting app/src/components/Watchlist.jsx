import React, { useState, useEffect } from 'react';
import { DEFAULT_SYMBOLS, formatSymbolName } from '../utils/binance';
import { Search, Star, Trash2, X, Plus } from 'lucide-react';

export default function Watchlist({ activeSymbol, setActiveSymbol }) {
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('watchlist');
    return saved ? JSON.parse(saved) : DEFAULT_SYMBOLS.map(s => s.id);
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [allPairs, setAllPairs] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    const fetchAllPairs = async () => {
      try {
        const res = await fetch('https://api.binance.com/api/v3/exchangeInfo');
        if (!res.ok) throw new Error('Failed to fetch pairs');
        const data = await res.json();
        
        const usdtPairs = data.symbols
          .filter(s => s.status === 'TRADING' && s.quoteAsset === 'USDT')
          .map(s => ({
            id: s.symbol,
            name: `${s.baseAsset}/${s.quoteAsset}`,
            base: s.baseAsset,
            quote: s.quoteAsset
          }));
        
        setAllPairs(usdtPairs);
      } catch (err) {
        console.error('Error fetching Binance symbols:', err);
      }
    };
    fetchAllPairs();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toUpperCase();
    const filtered = allPairs.filter(p => 
      p.id.includes(query) || p.base.includes(query)
    ).slice(0, 15);

    setSearchResults(filtered);
  }, [searchQuery, allPairs]);

  const addToWatchlist = (symbolId) => {
    if (!watchlist.includes(symbolId)) {
      setWatchlist([...watchlist, symbolId]);
    }
    setActiveSymbol(symbolId);
    setSearchQuery('');
    setIsSearching(false);
  };

  const removeFromWatchlist = (e, symbolId) => {
    e.stopPropagation();
    if (watchlist.length <= 1) return;
    const updated = watchlist.filter(id => id !== symbolId);
    setWatchlist(updated);
    
    if (activeSymbol === symbolId) {
      setActiveSymbol(updated[0]);
    }
  };

  return (
    <div className="watchlist-container">
      <div className="watchlist-header">
        <h3>Watchlist</h3>
        <button className="search-toggle-btn" onClick={() => setIsSearching(!isSearching)}>
          {isSearching ? <X size={16} /> : <Search size={16} />}
        </button>
      </div>

      {isSearching ? (
        <div className="watchlist-search-panel">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={14} />
            <input
              type="text"
              placeholder="Search symbol (e.g. BTC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="search-results scrollbar">
            {searchResults.length > 0 ? (
              searchResults.map((pair) => (
                <div 
                  key={pair.id} 
                  className="search-result-item"
                  onClick={() => addToWatchlist(pair.id)}
                >
                  <span className="symbol-id">{pair.name}</span>
                  <Plus size={14} className="add-icon" />
                </div>
              ))
            ) : searchQuery.trim() ? (
              <div className="no-results">No symbols found</div>
            ) : (
              <div className="search-prompt">Type to search USDT pairs</div>
            )}
          </div>
        </div>
      ) : (
        <div className="watchlist-items scrollbar">
          {watchlist.map((symbolId) => {
            const isActive = symbolId === activeSymbol;
            return (
              <div
                key={symbolId}
                className={`watchlist-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveSymbol(symbolId)}
              >
                <div className="item-name">
                  <Star className="star-icon" size={12} fill="#eab308" color="#eab308" />
                  <span>{formatSymbolName(symbolId)}</span>
                </div>
                <button
                  className="remove-btn"
                  onClick={(e) => removeFromWatchlist(e, symbolId)}
                  disabled={watchlist.length <= 1}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
