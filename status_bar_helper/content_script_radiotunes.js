const radiotunes = {
  KEY_SONG_TITLE_PREFIX: 'song-title-',
  CHECK_REPEAT_MS: 2000,
};

/**
 * @typedef {import('./background.js').SongInfo} RadiotunesSongInfo
 */

console.log('Status bar helper loaded, setting media handlers');

/**
 * @return {RadiotunesSongInfo|undefined}
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
    return undefined;
  }
}

/**
 * @param {RadiotunesSongInfo|undefined} songInfo
 * @return {Promise<any>}
 */
function maybeSetInfo(songInfo) {
  return songInfo ?
      chrome.storage.session.set({[radiotunes.KEY_SONG_TITLE_PREFIX + document.location.hostname]: songInfo}) :
      Promise.resolve();
}

/**
 * @return {Promise<any>}
 */
function handleStateChange() {
  return maybeSetInfo(getInfo())
      .then(() => setTimeout(handleStateChange, radiotunes.CHECK_REPEAT_MS));
}

handleStateChange();
