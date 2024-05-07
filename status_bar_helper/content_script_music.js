const KEY_SONG_TITLE = 'song-title';

/**
 * @typedef {import('./background.js').SongInfo} SongInfo
 */

console.log('Status bar helper loaded, setting media handlers');

const CHECK_REPEAT_MS = 2000;

/**
 * @return {Promise<any>}
 */
function handleStateChange() {
  const metadata = (navigator.mediaSession?.playbackState === 'playing') ?
    window.navigator?.mediaSession?.metadata : undefined;

  /** @type {SongInfo} */
  const info = {
    artist: metadata?.artist || '',
    title: metadata?.title || '',
    timestamp: Date.now(),
  };


  return chrome.storage.session.get(KEY_SONG_TITLE)
  // Store in session only if different
      .then((stored) =>
      shouldUpdate(stored[KEY_SONG_TITLE], info) ? chrome.storage.session.set({[KEY_SONG_TITLE]: info}) : undefined)
      .then(() => setTimeout(handleStateChange, CHECK_REPEAT_MS));
}

/**
 * @param {SongInfo|undefined} o1
 * @param {SongInfo} o2
 * @return {boolean}
 */
function shouldUpdate(o1, o2) {
  return o1?.title !== o2.title || o1?.artist !== o2.artist || Math.abs(o1?.timestamp - o2.timestamp) > 120000;
}

handleStateChange();
