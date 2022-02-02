let accessToken;
const clientId = 'f4a01706a3f445679bf095d7f30d898b';
const redirectUri = 'https://brave-edison-56ed05.netlify.app/';

const Spotify = {
  getAccessToken() {
    if (accessToken) return accessToken;
    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
    if (accessTokenMatch && expiresInMatch) {
      accessToken = accessTokenMatch[1];
      const expiresIn = Number(expiresInMatch[1]);

      window.setTimeout(() => {
        accessToken = '';
      }, expiresIn * 1000);

      window.history.pushState('Access Token', null, '/');

      return accessToken;
    } else {
      const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
      window.location = accessUrl;
    }
  },
  async savePlaylist(playlistName, trackURIs) {
    if (!playlistName || !trackURIs) return;
    const token = Spotify.getAccessToken();
    const headers = { Authorization: `Bearer ${token}`};
    
    const response = await fetch('https://api.spotify.com/v1/me', {headers: headers});
    
    const jsonResponse = await response.json();
    const userId = jsonResponse.id;
    
    const createPlaylistEndpoint = `https://api.spotify.com/v1/users/${userId}/playlists`;
    const playlist = await fetch(createPlaylistEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({name: playlistName})
    });
    
    const playlistResponse = await playlist.json();
    const playlistID = playlistResponse.id;
    
    const addTracksEndpoint = `https://api.spotify.com/v1/playlists/${playlistID}/tracks`;
    fetch(addTracksEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({uris: trackURIs})
    });
  },
  async search(term) {
    const token = Spotify.getAccessToken();
    const endpoint = `https://api.spotify.com/v1/search?type=track&q=${term}`;
    const response = await fetch(endpoint, {
      headers: {Authorization: `Bearer ${token}`}
    });
    const jsonResponse = await response.json();
    if (!jsonResponse.tracks) return [];
    const results = jsonResponse.tracks.items.map(track => {
      return {
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        uri: track.uri
      }
    });
    return results;
  }
};

export default Spotify;