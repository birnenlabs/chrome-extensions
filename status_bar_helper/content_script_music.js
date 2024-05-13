const KEY_SONG_TITLE_PREFIX = 'song-title-';

/**
 * @typedef {import('./background.js').SongInfo} SongInfo
 */

console.log('Status bar helper loaded, setting media handlers');

const CHECK_REPEAT_MS = 2000;

/** @type {SongInfo} */
const EMPTY_INFO = {
  artist: '',
  title: '',
  timestamp: 0,
};

/**
 * @return {SongInfo}
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
    return EMPTY_INFO;
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
  return chrome.storage.session.set({[KEY_SONG_TITLE_PREFIX + document.location.hostname]: info})
      .then(() => setTimeout(handleStateChange, CHECK_REPEAT_MS));
}

handleStateChange();
