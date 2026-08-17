const tunein = {
  KEY_SONG_TITLE_PREFIX: 'song-title-',
  CHECK_REPEAT_MS: 2000,
};

/**
 * @typedef {import('./background.js').SongInfo} TuneinSongInfo
 */

console.log('Status bar helper loaded, setting media handlers');

/**
 * @return {TuneinSongInfo|undefined}
 */
function getInfo() {
  if (document.querySelector('svg[data-icon="stop"]')) {
    const contents = document.getElementById('playerTitle')?.textContent?.trim()?.split('-', 2) || [];
    return {
      artist: contents[0] || '',
      title: contents[1] || '',
      timestamp: Date.now(),
    };
  } else {
    return undefined;
  }
}

/**
 * @param {TuneinSongInfo|undefined} songInfo
 * @return {Promise<any>}
 */
function maybeSetInfo(songInfo) {
  return songInfo ?
      chrome.storage.session.set({[tunein.KEY_SONG_TITLE_PREFIX + document.location.hostname]: songInfo}) :
      Promise.resolve();
}

/**
 * @return {Promise<any>}
 */
function handleStateChange() {
  return maybeSetInfo(getInfo())
      .then(() => setTimeout(handleStateChange, tunein.CHECK_REPEAT_MS));
}

handleStateChange();
