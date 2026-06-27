import os
import webbrowser
from threading import Timer
from flask import Flask, jsonify, request, render_template, redirect
from ytmusicapi import YTMusic
import yt_dlp

app = Flask(__name__)
yt = YTMusic()

def get_audio_stream_url(video_id):
    url = f"https://music.youtube.com/watch?v={video_id}"
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'noplaylist': True,
        'nocheckcertificate': True,
        'ignoreerrors': True,
        'logtostderr': False,
        'no_warnings': True,
        'default_search': 'auto',
        'source_address': '0.0.0.0'  # force ipv4 since ipv6 can resolve slowly
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if info:
                return info.get('url')
    except Exception as e:
        print(f"Error extracting stream url for {video_id}: {e}")
    return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/search')
def api_search():
    query = request.args.get('q', '')
    filter_type = request.args.get('filter', 'songs')  # songs, albums, artists, playlists
    if not query:
        return jsonify([])
    try:
        results = yt.search(query, filter=filter_type)
        return jsonify(results)
    except Exception as e:
        print(f"Search error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/charts')
def api_charts():
    try:
        # Default global charts
        charts = yt.get_charts(country='ZZ')
        return jsonify(charts)
    except Exception as e:
        print(f"Charts fetch error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stream')
def api_stream():
    video_id = request.args.get('videoId')
    if not video_id:
        return jsonify({'error': 'No videoId provided'}), 400
    
    stream_url = get_audio_stream_url(video_id)
    if stream_url:
        return redirect(stream_url)
    else:
        return jsonify({'error': 'Failed to extract stream URL'}), 500

@app.route('/api/lyrics')
def api_lyrics():
    video_id = request.args.get('videoId')
    if not video_id:
        return jsonify({'error': 'No videoId provided'}), 400
    try:
        watch_playlist = yt.get_watch_playlist(videoId=video_id)
        lyrics_browse_id = watch_playlist.get('lyrics')
        if lyrics_browse_id:
            lyrics_data = yt.get_lyrics(lyrics_browse_id)
            return jsonify({'lyrics': lyrics_data.get('lyrics', '')})
        else:
            return jsonify({'lyrics': 'Lyrics not available for this song.'})
    except Exception as e:
        print(f"Lyrics error: {e}")
        return jsonify({'lyrics': 'Could not fetch lyrics for this song.'}), 200

@app.route('/api/album/<album_id>')
def api_album(album_id):
    try:
        album = yt.get_album(album_id)
        return jsonify(album)
    except Exception as e:
        print(f"Album error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/artist/<artist_id>')
def api_artist(artist_id):
    try:
        artist = yt.get_artist(artist_id)
        return jsonify(artist)
    except Exception as e:
        print(f"Artist error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/playlist/<playlist_id>')
def api_playlist(playlist_id):
    try:
        playlist = yt.get_playlist(playlist_id)
        return jsonify(playlist)
    except Exception as e:
        print(f"Playlist error: {e}")
        return jsonify({'error': str(e)}), 500

def open_browser():
    webbrowser.open_new("http://127.0.0.1:5000/")

if __name__ == '__main__':
    # Verify templates folder exists
    if not os.path.exists('templates'):
        os.makedirs('templates')
    if not os.path.exists('static/css'):
        os.makedirs('static/css')
    if not os.path.exists('static/js'):
        os.makedirs('static/js')
        
    Timer(1.5, open_browser).start()
    app.run(debug=True, port=5000)
