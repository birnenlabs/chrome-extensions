const onlineradiobox = {
  KEY_SONG_TITLE_PREFIX: 'song-title-',
  CHECK_REPEAT_MS: 2000,
};

/**
 * @typedef {import('./background.js').SongInfo} OnlineRadioBoxSongInfo
 */

console.log('Status bar helper loaded, setting media online_radio_box handler');

/**
 * @return {OnlineRadioBoxSongInfo|undefined}
 */
function getInfo() {
  if (document.getElementById('b_top_play')?.classList?.contains('b-stop')) {
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
 * @param {OnlineRadioBoxSongInfo|undefined} songInfo
 * @return {Promise<any>}
 */
function maybeSetInfo(songInfo) {
  return songInfo ?
      chrome.storage.session.set({[onlineradiobox.KEY_SONG_TITLE_PREFIX + document.location.hostname]: songInfo}) :
      Promise.resolve();
}

/**
 * @return {Promise<any>}
 */
function handleStateChange() {
  return maybeSetInfo(getInfo())
      .then(() => setTimeout(handleStateChange, onlineradiobox.CHECK_REPEAT_MS));
}

handleStateChange();
