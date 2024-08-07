const music = {
  KEY_SONG_TITLE_PREFIX: 'song-title-',
  CHECK_REPEAT_MS: 2000,
};

/**
 * @typedef {import('./background.js').SongInfo} MusicSongInfo
 */

console.log('Status bar helper loaded, setting media handlers');

/**
 * @return {MusicSongInfo|undefined}
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
    return undefined;
  }
}

/**
 * @param {MusicSongInfo|undefined} songInfo
 * @return {Promise<any>}
 */
function maybeSetInfo(songInfo) {
  return songInfo ?
      chrome.storage.session.set({[music.KEY_SONG_TITLE_PREFIX + document.location.hostname]: songInfo}) :
      Promise.resolve();
}

/**
 * @return {Promise<any>}
 */
function handleStateChange() {
  return maybeSetInfo(getInfo())
      .then(() => setTimeout(handleStateChange, music.CHECK_REPEAT_MS));
}

handleStateChange();
