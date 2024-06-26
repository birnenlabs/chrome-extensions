const music = {
  KEY_SONG_TITLE_PREFIX: 'song-title-',
  CHECK_REPEAT_MS: 2000,
  /** @type {MusicSongInfo} */
  EMPTY_INFO: {
    artist: '',
    title: '',
    timestamp: 0,
  },
};

/**
 * @typedef {import('./background.js').SongInfo} MusicSongInfo
 */

console.log('Status bar helper loaded, setting media handlers');

/**
 * @return {MusicSongInfo}
 */
function getInfo() {
  if (navigator.mediaSession?.playbackState === 'playing') {
    const metadata = window.navigator?.mediaSession?.metadata;
    return {
      artist: metadata?.artist || '',
      title: metadata?.title || '',
      timestamp: Date.now(),
    };
  } else {
    return music.EMPTY_INFO;
  }
}

/**
 * @return {Promise<any>}
 */
function handleStateChange() {
  const info = getInfo();

  // Update everytime for now - assuming 24h/day music this will end up
  // with 166MB of transfer per month (out of 10GB limit).
  // When the object is not changed, the onChange event will not be fired for the storage.
  return chrome.storage.session.set({[music.KEY_SONG_TITLE_PREFIX + document.location.hostname]: info})
      .then(() => setTimeout(handleStateChange, music.CHECK_REPEAT_MS));
}

handleStateChange();
