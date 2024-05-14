const radiotunes = {
  KEY_SONG_TITLE_PREFIX: 'song-title-',
  CHECK_REPEAT_MS: 2000,
  /** @type {RadiotunesSongInfo} */
  EMPTY_INFO: {
    artist: '',
    title: '',
    timestamp: 0,
  },
};

/**
 * @typedef {import('./background.js').SongInfo} RadiotunesSongInfo
 */

console.log('Status bar helper loaded, setting media handlers');

/**
 * @return {RadiotunesSongInfo}
 */
function getInfo() {
  if (document.getElementById('webplayer-region')?.getAttribute('data-state') === 'playing') {
    const metadata = window.navigator?.mediaSession?.metadata;
    return {
      artist: metadata?.artist || '',
      title: metadata?.title || '',
      timestamp: Date.now(),
    };
  } else {
    return radiotunes.EMPTY_INFO;
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
  return chrome.storage.session.set({[radiotunes.KEY_SONG_TITLE_PREFIX + document.location.hostname]: info})
      .then(() => setTimeout(handleStateChange, radiotunes.CHECK_REPEAT_MS));
}

handleStateChange();
