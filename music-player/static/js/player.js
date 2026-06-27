// Global State Manager
const state = {
    queue: [],
    currentTrackIndex: -1,
    isPlaying: false,
    volume: 0.7,
    isMuted: false,
    isShuffle: false,
    isLoop: 'none', // 'none', 'all', 'one'
    currentView: 'home',
    historyStack: ['home'],
    searchFilter: 'songs',
    lastSearchQuery: '',
    audio: null
};

// DOM Elements
let audio, playerPlayBtn, playerProgressTrack, playerProgressFill, playerProgressThumb;
let playerTimeCurrent, playerTimeTotal, playerVolumeTrack, playerVolumeFill, playerVolumeThumb;
let playerThumb, playerTitle, playerArtist, playerLikeBtn, queueBadge;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initAudioEngine();
    initDOMElements();
    setupEventListeners();
    loadCharts();
    
    // Set initial volume
    updateVolumeUI();
});

// Audio Engine Setup
function initAudioEngine() {
    audio = document.getElementById('audio-engine');
    state.audio = audio;
    audio.volume = state.volume;

    // Audio Event Listeners
    audio.addEventListener('play', () => {
        state.isPlaying = true;
        updatePlayButtonUI();
    });

    audio.addEventListener('pause', () => {
        state.isPlaying = false;
        updatePlayButtonUI();
    });

    audio.addEventListener('timeupdate', () => {
        updateProgressUI();
    });

    audio.addEventListener('ended', () => {
        handleTrackEnded();
    });

    audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        showNotification('Failed to play track. Trying next song...', 'error');
        setTimeout(() => {
            playNext();
        }, 2000);
    });
}

function initDOMElements() {
    playerPlayBtn = document.getElementById('btn-play');
    playerProgressTrack = document.getElementById('player-progress-track');
    playerProgressFill = document.getElementById('player-progress-fill');
    playerProgressThumb = document.getElementById('player-progress-thumb');
    playerTimeCurrent = document.getElementById('player-time-current');
    playerTimeTotal = document.getElementById('player-time-total');
    
    playerVolumeTrack = document.getElementById('volume-track');
    playerVolumeFill = document.getElementById('volume-fill');
    playerVolumeThumb = document.getElementById('volume-thumb');
    
    playerThumb = document.getElementById('player-thumb');
    playerTitle = document.getElementById('player-title');
    playerArtist = document.getElementById('player-artist');
    playerLikeBtn = document.getElementById('player-like-btn');
    queueBadge = document.getElementById('queue-badge');
}

function setupEventListeners() {
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = item.getAttribute('data-view');
            navigateTo(viewId);
        });
    });

    // Back Navigation Button
    document.getElementById('history-back-btn').addEventListener('click', () => {
        navigateBack();
    });

    // Search input
    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');

    searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        searchClearBtn.style.display = val ? 'block' : 'none';
        
        // Debounce search
        clearTimeout(state.searchTimeout);
        if (val.trim()) {
            state.searchTimeout = setTimeout(() => {
                performSearch(val.trim());
            }, 600);
        }
    });

    searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchClearBtn.style.display = 'none';
        searchInput.focus();
        // Clear search results
        renderSearchPlaceholder();
    });

    // Search filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.searchFilter = tab.getAttribute('data-filter');
            
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
            }
        });
    });

    // Player Controls
    playerPlayBtn.addEventListener('click', togglePlay);
    document.getElementById('btn-prev').addEventListener('click', playPrev);
    document.getElementById('btn-next').addEventListener('click', playNext);
    
    // Repeat Toggle
    const loopBtn = document.getElementById('btn-loop');
    loopBtn.addEventListener('click', () => {
        if (state.isLoop === 'none') {
            state.isLoop = 'all';
            loopBtn.classList.add('active');
            loopBtn.innerHTML = '<i class="ri-repeat-line"></i>';
            showNotification('Repeat All enabled');
        } else if (state.isLoop === 'all') {
            state.isLoop = 'one';
            loopBtn.classList.add('active');
            loopBtn.innerHTML = '<i class="ri-repeat-one-line"></i>';
            showNotification('Repeat One enabled');
        } else {
            state.isLoop = 'none';
            loopBtn.classList.remove('active');
            loopBtn.innerHTML = '<i class="ri-repeat-line"></i>';
            showNotification('Repeat disabled');
        }
    });

    // Shuffle Toggle
    const shuffleBtn = document.getElementById('btn-shuffle');
    shuffleBtn.addEventListener('click', () => {
        state.isShuffle = !state.isShuffle;
        shuffleBtn.classList.toggle('active', state.isShuffle);
        showNotification(state.isShuffle ? 'Shuffle enabled' : 'Shuffle disabled');
    });

    // Mute Toggle
    document.getElementById('btn-mute').addEventListener('click', toggleMute);

    // Seek events
    playerProgressTrack.addEventListener('click', (e) => {
        const rect = playerProgressTrack.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        seekToPercent(percent);
    });

    // Volume events
    playerVolumeTrack.addEventListener('click', (e) => {
        const rect = playerVolumeTrack.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        setVolume(percent);
    });

    // Fast links to lyrics and queue in player
    document.getElementById('btn-show-lyrics').addEventListener('click', () => navigateTo('lyrics'));
    document.getElementById('btn-show-queue').addEventListener('click', () => navigateTo('queue'));

    // Clear queue button
    document.getElementById('clear-queue-btn').addEventListener('click', () => {
        state.queue = [];
        state.currentTrackIndex = -1;
        audio.src = '';
        state.isPlaying = false;
        updatePlayButtonUI();
        updatePlayerMetadata(null);
        renderQueue();
        updateQueueBadge();
        showNotification('Queue cleared');
    });

    // Play/Add to Queue like button (Quick action)
    playerLikeBtn.addEventListener('click', () => {
        const track = getCurrentTrack();
        if (track) {
            showNotification('Track added to Library (Mocked)', 'info');
            playerLikeBtn.classList.toggle('active');
        }
    });
}

// Navigation System
function navigateTo(viewId, addToHistory = true) {
    if (viewId === state.currentView) return;
    
    // Hide header search bar if not in search view
    const searchBar = document.getElementById('header-search-bar');
    if (viewId === 'search') {
        searchBar.style.display = 'flex';
    } else {
        searchBar.style.display = 'none';
    }

    // Update active sidebar item
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-view') === viewId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Hide old view and show new view
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    const activeView = document.getElementById(`view-${viewId}`);
    if (activeView) {
        activeView.classList.add('active');
    }

    state.currentView = viewId;

    if (addToHistory) {
        // Simple back stack limits duplicates
        if (state.historyStack[state.historyStack.length - 1] !== viewId) {
            state.historyStack.push(viewId);
        }
    }

    // Load dynamic updates based on view
    if (viewId === 'queue') {
        renderQueue();
    } else if (viewId === 'lyrics') {
        renderLyrics();
    }
}

function navigateBack() {
    if (state.historyStack.length <= 1) return;
    
    // Pop current view
    state.historyStack.pop();
    // Get previous view
    const prevView = state.historyStack[state.historyStack.length - 1];
    
    navigateTo(prevView, false);
}

function showSearchView() {
    navigateTo('search');
    document.getElementById('search-input').focus();
}

// Fetching Charts (Home Page)
async function loadCharts() {
    try {
        const res = await fetch('/api/charts');
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        renderChartsSongs(data.songs?.items || []);
        renderChartsPlaylists(data.playlists?.items || []);
        
    } catch (e) {
        console.error('Failed to load charts:', e);
        document.getElementById('charts-songs').innerHTML = '<p class="empty-message">Could not load trending songs right now.</p>';
        document.getElementById('charts-playlists').innerHTML = '<p class="empty-message">Could not load popular playlists right now.</p>';
    }
}

function renderChartsSongs(songs) {
    const container = document.getElementById('charts-songs');
    container.innerHTML = '';
    
    // Take top 8 songs
    songs.slice(0, 8).forEach(song => {
        const artistNames = song.artists ? song.artists.map(a => a.name).join(', ') : 'Unknown';
        const thumbnail = song.thumbnails ? song.thumbnails[0].url : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%231e293b"/></svg>';
        
        const card = document.createElement('div');
        card.className = 'track-item-card';
        card.innerHTML = `
            <div class="track-img-container">
                <img src="${thumbnail}" alt="${song.title}">
                <div class="track-play-overlay">
                    <i class="ri-play-fill"></i>
                </div>
            </div>
            <div class="track-card-details">
                <div class="track-card-title">${song.title}</div>
                <div class="track-card-artists">${artistNames}</div>
            </div>
            <div class="track-card-actions">
                <button class="track-icon-btn add-queue-btn" title="Add to Queue">
                    <i class="ri-add-line"></i>
                </button>
            </div>
        `;

        // Click to play immediately
        card.addEventListener('click', (e) => {
            if (e.target.closest('.add-queue-btn')) {
                e.stopPropagation();
                addTrackToQueue(song, true);
            } else {
                playDirect(song);
            }
        });

        container.appendChild(card);
    });
}

function renderChartsPlaylists(playlists) {
    const container = document.getElementById('charts-playlists');
    container.innerHTML = '';
    
    playlists.slice(0, 6).forEach(playlist => {
        const thumbnail = playlist.thumbnails ? playlist.thumbnails[0].url : '';
        const card = document.createElement('div');
        card.className = 'content-card';
        card.innerHTML = `
            <div class="card-img-container">
                <img src="${thumbnail}" alt="${playlist.title}">
            </div>
            <div class="card-title">${playlist.title}</div>
            <div class="card-subtitle">${playlist.description || 'YouTube Music'}</div>
        `;

        card.addEventListener('click', () => {
            openDetail('playlist', playlist.playlistId);
        });

        container.appendChild(card);
    });
}

// Detail Views (Playlists, Albums, Artists)
async function openDetail(type, id) {
    navigateTo('detail');
    const contentArea = document.getElementById('detail-content-area');
    contentArea.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const res = await fetch(`/api/${type}/${id}`);
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);
        
        if (type === 'playlist') {
            renderPlaylistDetail(data);
        } else if (type === 'album') {
            renderAlbumDetail(data);
        } else if (type === 'artist') {
            renderArtistDetail(data);
        }
    } catch (e) {
        console.error(`Failed to fetch detail for ${type} ${id}:`, e);
        contentArea.innerHTML = `<p class="empty-message">Could not load details for this ${type} right now.</p>`;
    }
}

function renderPlaylistDetail(playlist) {
    const contentArea = document.getElementById('detail-content-area');
    const thumbnail = playlist.thumbnails ? playlist.thumbnails[playlist.thumbnails.length - 1].url : '';
    
    let tracksHTML = '';
    playlist.tracks.forEach((track, index) => {
        const artistNames = track.artists ? track.artists.map(a => a.name).join(', ') : 'Unknown';
        const albumName = track.album ? track.album.name : '';
        const trackThumbnail = track.thumbnails ? track.thumbnails[0].url : '';
        
        tracksHTML += `
            <div class="track-row" data-index="${index}">
                <div class="track-row-num">${index + 1}</div>
                <img src="${trackThumbnail}" class="track-row-img" alt="${track.title}">
                <div class="track-row-details">
                    <div class="track-row-title">${track.title}</div>
                    <div class="track-row-artists">${artistNames}</div>
                </div>
                <div class="track-row-album">${albumName}</div>
                <div class="track-row-duration">${track.duration || '--:--'}</div>
                <button class="track-icon-btn list-add-queue" title="Add to Queue"><i class="ri-add-line"></i></button>
            </div>
        `;
    });

    contentArea.innerHTML = `
        <div class="detail-banner">
            <img src="${thumbnail}" class="detail-banner-img" alt="${playlist.title}">
            <div class="detail-banner-info">
                <span class="detail-type">Playlist</span>
                <h2 class="detail-title">${playlist.title}</h2>
                <div class="detail-meta">
                    <span>Created by ${playlist.author?.name || 'YouTube Music'}</span>
                    <div class="detail-meta-bullet"></div>
                    <span>${playlist.trackCount || playlist.tracks.length} tracks</span>
                </div>
                <div class="detail-banner-actions">
                    <button class="btn btn-primary" id="detail-play-all-btn">
                        <i class="ri-play-fill"></i> Play All
                    </button>
                </div>
            </div>
        </div>
        
        <div class="detail-tracks-list">
            ${tracksHTML}
        </div>
    `;

    // Bind events
    document.getElementById('detail-play-all-btn').addEventListener('click', () => {
        playTracksList(playlist.tracks);
    });

    contentArea.querySelectorAll('.track-row').forEach(row => {
        const trackIndex = parseInt(row.getAttribute('data-index'));
        const track = playlist.tracks[trackIndex];
        
        row.addEventListener('click', (e) => {
            if (e.target.closest('.list-add-queue')) {
                e.stopPropagation();
                addTrackToQueue(track, true);
            } else {
                playDirect(track);
            }
        });
    });
}

function renderAlbumDetail(album) {
    const contentArea = document.getElementById('detail-content-area');
    const thumbnail = album.thumbnails ? album.thumbnails[album.thumbnails.length - 1].url : '';
    const artistNames = album.artists ? album.artists.map(a => a.name).join(', ') : 'Unknown';

    let tracksHTML = '';
    album.tracks.forEach((track, index) => {
        const trackArtistNames = track.artists ? track.artists.map(a => a.name).join(', ') : artistNames;
        
        tracksHTML += `
            <div class="track-row" data-index="${index}">
                <div class="track-row-num">${index + 1}</div>
                <div class="track-row-details">
                    <div class="track-row-title">${track.title}</div>
                    <div class="track-row-artists">${trackArtistNames}</div>
                </div>
                <div class="track-row-duration">${track.duration || '--:--'}</div>
                <button class="track-icon-btn list-add-queue" title="Add to Queue"><i class="ri-add-line"></i></button>
            </div>
        `;
    });

    contentArea.innerHTML = `
        <div class="detail-banner">
            <img src="${thumbnail}" class="detail-banner-img" alt="${album.title}">
            <div class="detail-banner-info">
                <span class="detail-type">Album</span>
                <h2 class="detail-title">${album.title}</h2>
                <div class="detail-meta">
                    <span>By ${artistNames}</span>
                    <div class="detail-meta-bullet"></div>
                    <span>${album.year || 'Unknown Year'}</span>
                    <div class="detail-meta-bullet"></div>
                    <span>${album.trackCount || album.tracks.length} tracks</span>
                </div>
                <div class="detail-banner-actions">
                    <button class="btn btn-primary" id="detail-play-all-btn">
                        <i class="ri-play-fill"></i> Play All
                    </button>
                </div>
            </div>
        </div>
        
        <div class="detail-tracks-list">
            ${tracksHTML}
        </div>
    `;

    // Bind events
    document.getElementById('detail-play-all-btn').addEventListener('click', () => {
        // Map album tracks to include album thumbnails
        const albumTracks = album.tracks.map(t => {
            if (!t.thumbnails && album.thumbnails) t.thumbnails = album.thumbnails;
            return t;
        });
        playTracksList(albumTracks);
    });

    contentArea.querySelectorAll('.track-row').forEach(row => {
        const trackIndex = parseInt(row.getAttribute('data-index'));
        const track = album.tracks[trackIndex];
        if (!track.thumbnails && album.thumbnails) track.thumbnails = album.thumbnails;
        
        row.addEventListener('click', (e) => {
            if (e.target.closest('.list-add-queue')) {
                e.stopPropagation();
                addTrackToQueue(track, true);
            } else {
                playDirect(track);
            }
        });
    });
}

function renderArtistDetail(artist) {
    const contentArea = document.getElementById('detail-content-area');
    const thumbnail = artist.thumbnails ? artist.thumbnails[artist.thumbnails.length - 1].url : '';
    
    // Top Songs
    let songsHTML = '';
    const songsList = artist.songs?.results || [];
    songsList.forEach((track, index) => {
        const trackArtistNames = track.artists ? track.artists.map(a => a.name).join(', ') : artist.name;
        const trackThumbnail = track.thumbnails ? track.thumbnails[0].url : '';
        const albumName = track.album ? track.album.name : '';
        
        songsHTML += `
            <div class="track-row" data-type="song" data-index="${index}">
                <div class="track-row-num">${index + 1}</div>
                <img src="${trackThumbnail}" class="track-row-img" alt="${track.title}">
                <div class="track-row-details">
                    <div class="track-row-title">${track.title}</div>
                    <div class="track-row-artists">${trackArtistNames}</div>
                </div>
                <div class="track-row-album">${albumName}</div>
                <div class="track-row-duration">${track.duration || '--:--'}</div>
                <button class="track-icon-btn list-add-queue" title="Add to Queue"><i class="ri-add-line"></i></button>
            </div>
        `;
    });

    // Albums
    let albumsHTML = '';
    const albumsList = artist.albums?.results || [];
    albumsList.forEach(album => {
        const albThumbnail = album.thumbnails ? album.thumbnails[0].url : '';
        albumsHTML += `
            <div class="content-card artist-album-card" data-id="${album.browseId}">
                <div class="card-img-container">
                    <img src="${albThumbnail}" alt="${album.title}">
                </div>
                <div class="card-title">${album.title}</div>
                <div class="card-subtitle">${album.year || ''}</div>
            </div>
        `;
    });

    contentArea.innerHTML = `
        <div class="detail-banner">
            <img src="${thumbnail}" class="detail-banner-img circle" alt="${artist.name}">
            <div class="detail-banner-info">
                <span class="detail-type">Artist</span>
                <h2 class="detail-title">${artist.name}</h2>
                <div class="detail-meta">
                    <span>${artist.description || 'YouTube Music Catalog'}</span>
                </div>
                <div class="detail-banner-actions">
                    <button class="btn btn-primary" id="detail-play-artist-btn" ${songsList.length === 0 ? 'disabled' : ''}>
                        <i class="ri-play-fill"></i> Play Top Songs
                    </button>
                </div>
            </div>
        </div>
        
        <div class="section-container">
            <div class="section-header">
                <h3>Top Tracks</h3>
            </div>
            <div class="detail-tracks-list">
                ${songsHTML || '<p class="empty-message">No songs found for this artist.</p>'}
            </div>
        </div>
        
        <div class="section-container" style="${albumsList.length === 0 ? 'display:none;' : ''}">
            <div class="section-header">
                <h3>Albums</h3>
            </div>
            <div class="cards-grid">
                ${albumsHTML}
            </div>
        </div>
    `;

    // Bind events
    if (songsList.length > 0) {
        document.getElementById('detail-play-artist-btn').addEventListener('click', () => {
            playTracksList(songsList);
        });
    }

    contentArea.querySelectorAll('.track-row').forEach(row => {
        const idx = parseInt(row.getAttribute('data-index'));
        const track = songsList[idx];
        
        row.addEventListener('click', (e) => {
            if (e.target.closest('.list-add-queue')) {
                e.stopPropagation();
                addTrackToQueue(track, true);
            } else {
                playDirect(track);
            }
        });
    });

    contentArea.querySelectorAll('.artist-album-card').forEach(card => {
        const id = card.getAttribute('data-id');
        card.addEventListener('click', () => {
            openDetail('album', id);
        });
    });
}

// Search Functionality
async function performSearch(query) {
    if (!query) return;
    state.lastSearchQuery = query;
    
    const resultsContainer = document.getElementById('search-results-list');
    resultsContainer.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&filter=${state.searchFilter}`);
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);
        
        renderSearchResults(data);
    } catch (e) {
        console.error('Search error:', e);
        resultsContainer.innerHTML = '<p class="empty-message">Something went wrong. Please check your connection.</p>';
    }
}

function renderSearchPlaceholder() {
    const resultsContainer = document.getElementById('search-results-list');
    resultsContainer.innerHTML = `
        <div class="search-placeholder">
            <i class="ri-search-2-line"></i>
            <p>Search for your favorite tracks or artists to begin</p>
        </div>
    `;
}

function renderSearchResults(results) {
    const resultsContainer = document.getElementById('search-results-list');
    resultsContainer.innerHTML = '';

    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p class="empty-message">No results found. Try a different query.</p>';
        return;
    }

    if (state.searchFilter === 'songs') {
        let tracksHTML = '';
        results.forEach((track, index) => {
            const artistNames = track.artists ? track.artists.map(a => a.name).join(', ') : 'Unknown';
            const albumName = track.album ? track.album.name : '';
            const thumbnail = track.thumbnails ? track.thumbnails[0].url : '';
            
            tracksHTML += `
                <div class="track-row" data-index="${index}">
                    <div class="track-row-num">${index + 1}</div>
                    <img src="${thumbnail}" class="track-row-img" alt="${track.title}">
                    <div class="track-row-details">
                        <div class="track-row-title">${track.title}</div>
                        <div class="track-row-artists">${artistNames}</div>
                    </div>
                    <div class="track-row-album">${albumName}</div>
                    <div class="track-row-duration">${track.duration || '--:--'}</div>
                    <button class="track-icon-btn list-add-queue" title="Add to Queue"><i class="ri-add-line"></i></button>
                </div>
            `;
        });
        
        resultsContainer.className = 'results-layout detail-tracks-list';
        resultsContainer.innerHTML = tracksHTML;

        resultsContainer.querySelectorAll('.track-row').forEach(row => {
            const idx = parseInt(row.getAttribute('data-index'));
            const track = results[idx];
            
            row.addEventListener('click', (e) => {
                if (e.target.closest('.list-add-queue')) {
                    e.stopPropagation();
                    addTrackToQueue(track, true);
                } else {
                    playDirect(track);
                }
            });
        });
        
    } else {
        // Grid layouts for albums, artists, playlists
        resultsContainer.className = 'cards-grid';
        
        results.forEach(item => {
            const thumbnail = item.thumbnails ? item.thumbnails[0].url : '';
            let subtitle = '';
            let type = '';

            if (state.searchFilter === 'albums') {
                subtitle = item.artists ? item.artists.map(a => a.name).join(', ') : (item.type || 'Album');
                type = 'album';
            } else if (state.searchFilter === 'artists') {
                subtitle = 'Artist';
                type = 'artist';
            } else if (state.searchFilter === 'playlists') {
                subtitle = item.author || 'Playlist';
                type = 'playlist';
            }

            const card = document.createElement('div');
            card.className = 'content-card';
            card.innerHTML = `
                <div class="card-img-container ${type === 'artist' ? 'circle' : ''}">
                    <img src="${thumbnail}" alt="${item.title || item.artist}">
                </div>
                <div class="card-title">${item.title || item.artist}</div>
                <div class="card-subtitle">${subtitle}</div>
            `;

            card.addEventListener('click', () => {
                openDetail(type, item.browseId);
            });

            resultsContainer.appendChild(card);
        });
    }
}

function quickSearch(tag) {
    navigateTo('search');
    const searchInput = document.getElementById('search-input');
    searchInput.value = tag;
    document.getElementById('search-clear-btn').style.display = 'block';
    
    // Set filter to songs
    document.querySelectorAll('.filter-tab').forEach(t => {
        if (t.getAttribute('data-filter') === 'songs') t.classList.add('active');
        else t.classList.remove('active');
    });
    state.searchFilter = 'songs';
    
    performSearch(tag);
}

// Queue Management
function playDirect(track) {
    // Add to queue if not present, and play immediately
    const cleanTrack = formatTrackObject(track);
    const existingIndex = state.queue.findIndex(t => t.videoId === cleanTrack.videoId);
    
    if (existingIndex !== -1) {
        state.currentTrackIndex = existingIndex;
    } else {
        state.queue.splice(state.currentTrackIndex + 1, 0, cleanTrack);
        state.currentTrackIndex = state.currentTrackIndex + 1;
    }
    
    loadAndPlayTrack(state.queue[state.currentTrackIndex]);
    updateQueueBadge();
}

function playTracksList(tracks) {
    if (!tracks || tracks.length === 0) return;
    
    state.queue = tracks.map(t => formatTrackObject(t));
    state.currentTrackIndex = 0;
    
    loadAndPlayTrack(state.queue[0]);
    updateQueueBadge();
    showNotification(`Playing ${tracks.length} tracks`);
}

function addTrackToQueue(track, notify = true) {
    const cleanTrack = formatTrackObject(track);
    
    // Avoid double addition of identical videoId
    const existing = state.queue.find(t => t.videoId === cleanTrack.videoId);
    if (existing) {
        if (notify) showNotification('Already in Queue');
        return;
    }

    state.queue.push(cleanTrack);
    updateQueueBadge();
    
    if (state.currentTrackIndex === -1) {
        state.currentTrackIndex = 0;
        loadAndPlayTrack(cleanTrack);
    } else {
        if (notify) showNotification(`Added "${cleanTrack.title}" to Queue`);
    }

    // Refresh queue view if open
    if (state.currentView === 'queue') {
        renderQueue();
    }
}

function removeTrackFromQueue(index, event) {
    if (event) event.stopPropagation();
    
    if (index === state.currentTrackIndex) {
        // Playing track is removed
        state.queue.splice(index, 1);
        if (state.queue.length === 0) {
            state.currentTrackIndex = -1;
            audio.src = '';
            state.isPlaying = false;
            updatePlayButtonUI();
            updatePlayerMetadata(null);
        } else {
            // Keep index bounding boxes
            if (state.currentTrackIndex >= state.queue.length) {
                state.currentTrackIndex = 0;
            }
            loadAndPlayTrack(state.queue[state.currentTrackIndex]);
        }
    } else {
        state.queue.splice(index, 1);
        if (index < state.currentTrackIndex) {
            state.currentTrackIndex--;
        }
    }
    
    renderQueue();
    updateQueueBadge();
    showNotification('Track removed');
}

function formatTrackObject(track) {
    // Normalize format inconsistencies between searches and details
    let artists = 'Unknown Artist';
    if (track.artists) {
        artists = Array.isArray(track.artists) 
            ? track.artists.map(a => a.name || a).join(', ') 
            : track.artists;
    }

    let thumbnail = '';
    if (track.thumbnails) {
        thumbnail = track.thumbnails[0].url || track.thumbnails[0];
    }

    return {
        videoId: track.videoId,
        title: track.title,
        artist: artists,
        thumbnail: thumbnail || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%231e293b"/></svg>',
        duration: track.duration || ''
    };
}

// Audio Engine Actions
async function loadAndPlayTrack(track) {
    if (!track) return;
    
    updatePlayerMetadata(track);
    updateAmbientGlow(track.thumbnail, track.title, track.artist);
    
    // Set status to loading
    playerPlayBtn.innerHTML = '<div class="loading-spinner-small"></div>';
    
    try {
        audio.src = `/api/stream?videoId=${track.videoId}`;
        await audio.play();
        state.isPlaying = true;
        updatePlayButtonUI();
        
        // Auto load lyrics background
        if (state.currentView === 'lyrics') {
            renderLyrics();
        }
    } catch (e) {
        console.error('Play request failed:', e);
    }
}

function getCurrentTrack() {
    if (state.currentTrackIndex >= 0 && state.currentTrackIndex < state.queue.length) {
        return state.queue[state.currentTrackIndex];
    }
    return null;
}

function togglePlay() {
    const track = getCurrentTrack();
    if (!track) return;

    if (state.isPlaying) {
        audio.pause();
    } else {
        audio.play().catch(e => console.error(e));
    }
}

function playNext() {
    if (state.queue.length === 0) return;

    if (state.isLoop === 'one') {
        audio.currentTime = 0;
        audio.play().catch(e => console.error(e));
        return;
    }

    if (state.isShuffle) {
        // Random index
        state.currentTrackIndex = Math.floor(Math.random() * state.queue.length);
    } else {
        state.currentTrackIndex++;
        if (state.currentTrackIndex >= state.queue.length) {
            if (state.isLoop === 'all') {
                state.currentTrackIndex = 0;
            } else {
                state.currentTrackIndex = state.queue.length - 1;
                state.isPlaying = false;
                updatePlayButtonUI();
                showNotification('Queue finished');
                return;
            }
        }
    }
    loadAndPlayTrack(state.queue[state.currentTrackIndex]);
    
    if (state.currentView === 'queue') renderQueue();
}

function playPrev() {
    if (state.queue.length === 0) return;

    // Reset if playing for more than 3 seconds
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }

    if (state.isShuffle) {
        state.currentTrackIndex = Math.floor(Math.random() * state.queue.length);
    } else {
        state.currentTrackIndex--;
        if (state.currentTrackIndex < 0) {
            if (state.isLoop === 'all') {
                state.currentTrackIndex = state.queue.length - 1;
            } else {
                state.currentTrackIndex = 0;
            }
        }
    }
    loadAndPlayTrack(state.queue[state.currentTrackIndex]);

    if (state.currentView === 'queue') renderQueue();
}

function handleTrackEnded() {
    playNext();
}

// Volume Controls
function setVolume(percent) {
    percent = Math.max(0, Math.min(1, percent));
    state.volume = percent;
    audio.volume = percent;
    state.isMuted = false;
    updateVolumeUI();
}

function toggleMute() {
    state.isMuted = !state.isMuted;
    audio.muted = state.isMuted;
    
    const muteBtn = document.getElementById('btn-mute');
    if (state.isMuted) {
        muteBtn.innerHTML = '<i class="ri-volume-mute-line"></i>';
        playerVolumeFill.style.width = '0%';
        playerVolumeThumb.style.left = '0%';
    } else {
        muteBtn.innerHTML = state.volume > 0.5 ? '<i class="ri-volume-up-line"></i>' : '<i class="ri-volume-down-line"></i>';
        updateVolumeUI();
    }
}

// Media seek
function seekToPercent(percent) {
    if (!audio.duration) return;
    percent = Math.max(0, Math.min(1, percent));
    audio.currentTime = percent * audio.duration;
}

// Updates UI Elements
function updatePlayButtonUI() {
    if (state.isPlaying) {
        playerPlayBtn.innerHTML = '<i class="ri-pause-fill"></i>';
    } else {
        playerPlayBtn.innerHTML = '<i class="ri-play-fill"></i>';
    }
}

function updateProgressUI() {
    if (!audio.duration) return;
    
    const current = audio.currentTime;
    const duration = audio.duration;
    const percent = (current / duration) * 100;
    
    playerProgressFill.style.width = `${percent}%`;
    playerProgressThumb.style.left = `${percent}%`;
    
    playerTimeCurrent.innerText = formatTime(current);
    playerTimeTotal.innerText = formatTime(duration);
}

function updateVolumeUI() {
    const percent = state.volume * 100;
    playerVolumeFill.style.width = `${percent}%`;
    playerVolumeThumb.style.left = `${percent}%`;
    
    const muteBtn = document.getElementById('btn-mute');
    if (state.volume === 0) {
        muteBtn.innerHTML = '<i class="ri-volume-mute-line"></i>';
    } else if (state.volume < 0.5) {
        muteBtn.innerHTML = '<i class="ri-volume-down-line"></i>';
    } else {
        muteBtn.innerHTML = '<i class="ri-volume-up-line"></i>';
    }
}

function updatePlayerMetadata(track) {
    if (track) {
        playerThumb.src = track.thumbnail;
        playerTitle.innerText = track.title;
        playerArtist.innerText = track.artist;
        
        // Match active highlight if showing detail view
        document.querySelectorAll('.track-row').forEach(row => {
            const rowTitle = row.querySelector('.track-row-title')?.innerText;
            if (rowTitle === track.title) {
                row.classList.add('playing');
            } else {
                row.classList.remove('playing');
            }
        });
    } else {
        playerThumb.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' fill='%231e293b'/><circle cx='50' cy='50' r='20' fill='%23475569'/></svg>";
        playerTitle.innerText = 'Not Playing';
        playerArtist.innerText = '-';
        playerProgressFill.style.width = '0%';
        playerProgressThumb.style.left = '0%';
        playerTimeCurrent.innerText = '0:00';
        playerTimeTotal.innerText = '0:00';
        
        document.querySelectorAll('.track-row').forEach(row => row.classList.remove('playing'));
    }
}

function updateQueueBadge() {
    if (state.queue.length > 0) {
        queueBadge.innerText = state.queue.length;
        queueBadge.style.display = 'inline-block';
    } else {
        queueBadge.style.display = 'none';
    }
}

// Rendering Views
function renderQueue() {
    const currentContainer = document.getElementById('queue-now-playing-container');
    const upcomingContainer = document.getElementById('queue-upcoming-list');
    
    currentContainer.innerHTML = '';
    upcomingContainer.innerHTML = '';
    
    const currentTrack = getCurrentTrack();
    if (currentTrack) {
        currentContainer.innerHTML = `
            <div class="track-row playing">
                <div class="track-row-num"><i class="ri-volume-up-fill"></i></div>
                <img src="${currentTrack.thumbnail}" class="track-row-img" alt="${currentTrack.title}">
                <div class="track-row-details">
                    <div class="track-row-title">${currentTrack.title}</div>
                    <div class="track-row-artists">${currentTrack.artist}</div>
                </div>
                <div class="track-row-duration">${currentTrack.duration || '--:--'}</div>
            </div>
        `;
    } else {
        currentContainer.innerHTML = '<p class="empty-message">Nothing playing right now.</p>';
    }

    if (state.queue.length > 1) {
        let upcomingHTML = '';
        state.queue.forEach((track, index) => {
            if (index === state.currentTrackIndex) return; // Skip currently playing
            
            upcomingHTML += `
                <div class="track-row" data-index="${index}">
                    <div class="track-row-num">${index < state.currentTrackIndex ? 'Previously' : index - state.currentTrackIndex}</div>
                    <img src="${track.thumbnail}" class="track-row-img" alt="${track.title}">
                    <div class="track-row-details">
                        <div class="track-row-title">${track.title}</div>
                        <div class="track-row-artists">${track.artist}</div>
                    </div>
                    <div class="track-row-duration">${track.duration || '--:--'}</div>
                    <button class="track-icon-btn remove-queue-btn" title="Remove from Queue"><i class="ri-delete-bin-line"></i></button>
                </div>
            `;
        });
        upcomingContainer.innerHTML = upcomingHTML;

        upcomingContainer.querySelectorAll('.track-row').forEach(row => {
            const idx = parseInt(row.getAttribute('data-index'));
            
            row.addEventListener('click', (e) => {
                if (e.target.closest('.remove-queue-btn')) {
                    removeTrackFromQueue(idx, e);
                } else {
                    state.currentTrackIndex = idx;
                    loadAndPlayTrack(state.queue[state.currentTrackIndex]);
                    renderQueue();
                }
            });
        });
    } else {
        upcomingContainer.innerHTML = '<p class="empty-message">No upcoming songs in the queue.</p>';
    }
}

async function renderLyrics() {
    const titleEl = document.getElementById('lyrics-song-title');
    const artistEl = document.getElementById('lyrics-song-artist');
    const contentEl = document.getElementById('lyrics-content');
    
    const track = getCurrentTrack();
    if (!track) {
        titleEl.innerText = 'No Song Selected';
        artistEl.innerText = 'Play a song to view lyrics';
        contentEl.innerText = 'Select a song and start playing. If lyrics are available on YouTube Music, they will be shown here.';
        return;
    }

    titleEl.innerText = track.title;
    artistEl.innerText = track.artist;
    contentEl.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const res = await fetch(`/api/lyrics?videoId=${track.videoId}`);
        const data = await res.json();
        
        contentEl.innerText = data.lyrics || 'Lyrics not available for this song.';
    } catch (e) {
        console.error('Failed to load lyrics:', e);
        contentEl.innerText = 'Could not load lyrics for this song.';
    }
}

// Ambient Glow System
function updateAmbientGlow(imgUrl, title, artist) {
    if (!imgUrl) {
        updateAmbientGlowFallback(title, artist);
        return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imgUrl;

    img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            
            // Apply colors to document root
            document.documentElement.style.setProperty('--ambient-color', `rgb(${r}, ${g}, ${b})`);
            document.documentElement.style.setProperty('--ambient-color-glow', `rgba(${r}, ${g}, ${b}, 0.22)`);
        } catch (e) {
            // CORS security restriction on drawing canvas from cross-origin image
            updateAmbientGlowFallback(title, artist);
        }
    };

    img.onerror = () => {
        updateAmbientGlowFallback(title, artist);
    };
}

function updateAmbientGlowFallback(title, artist) {
    // Generate beautiful consistent hue by hashing strings
    let hash = 0;
    const str = title + artist;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    document.documentElement.style.setProperty('--ambient-color', `hsl(${hue}, 75%, 45%)`);
    document.documentElement.style.setProperty('--ambient-color-glow', `hsla(${hue}, 75%, 45%, 0.22)`);
}

// Helpers
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Dynamic notification Toast
function showNotification(message, type = 'info') {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.bottom = '110px';
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '8px';
        container.style.zIndex = '999';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.background = 'rgba(15, 23, 42, 0.9)';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '20px';
    toast.style.fontSize = '13px';
    toast.style.fontWeight = '600';
    toast.style.border = '1px solid rgba(255, 255, 255, 0.08)';
    toast.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
    toast.style.backdropFilter = 'blur(10px)';
    toast.style.animation = 'toastFadeIn 0.3s ease forwards';
    toast.innerHTML = message;

    // Fade css rules injected dynamically
    if (!document.getElementById('toast-styles')) {
        const styleSheet = document.createElement("style");
        styleSheet.id = 'toast-styles';
        styleSheet.innerText = `
            @keyframes toastFadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes toastFadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-10px); }
            }
            .loading-spinner-small {
                width: 14px;
                height: 14px;
                border: 2px solid rgba(0,0,0,0.1);
                border-radius: 50%;
                border-top-color: #000;
                animation: spin 0.8s linear infinite;
                display: inline-block;
            }
        `;
        document.head.appendChild(styleSheet);
    }

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastFadeOut 0.3s ease forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2500);
}
