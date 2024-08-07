import {FirebaseSettings} from './firebase-settings.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import {Database, getDatabase, ref, set} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js';
import {combine2} from './jslib/js/promise.js';

/**
 * SHORT DESCRIPTION
 *
 * content_script_*.js files will save the now playing song in the session database together with a timestamp.
 * Timestamp is used to make sure that `chrome.storage.session.onChanged` is called (this function is only
 * called when there is a difference between old and new data).
 *
 * background script will
 */

/**
 * @typedef {Object} SongInfo
 * @property {string} artist
 * @property {string} title
 * @property {number} timestamp
 */

/**
 * @typedef {Object} DbData
 * @property {string|undefined} token
 * @property {Database|undefined} db
 */

/**
 * @typedef {Object} VerifiedDbData
 * @property {string} token
 * @property {Database} db
 */

const KEY_SONG_TITLE_PREFIX = 'song-title-';
const KEY_SONG_TITLE = 'song-title';

/** @type {SongInfo} */
const EMPTY_INFO = {
  artist: '',
  title: '',
  timestamp: 0,
};

/**
 * @return {Promise<DbData>}
 */
function createDbData() {
  console.log('Creating database');
  const tokenPromise = FirebaseSettings.getToken();
  const dbPromise = FirebaseSettings.getUrl()
      .then((databaseURL) => databaseURL ? getDatabase(initializeApp({databaseURL})) : undefined);

  return combine2(tokenPromise, dbPromise, (token, db) => ({token, db}));
}

/**
 * @param {DbData} dbData
 * @return {VerifiedDbData}
 */
function verifyDbData(dbData) {
  if (dbData.token && dbData.db) {
    return ( /** @type {VerifiedDbData} */(dbData));
  } else {
    throw new Error('DbData invalid');
  }
}

/** @type{Promise<VerifiedDbData>|undefined} */
let dbDataPromise = undefined;

let clearSongTimeout = undefined;

/**
 * This method has to be invoked every 2 seconds (i.e. on content script song update) otherwise the
 * timer will clear the song title.
 */
function refreshSongTimeout() {
  clearTimeout(clearSongTimeout);
  clearSongTimeout = setTimeout(
      () => chrome.storage.session.set({[KEY_SONG_TITLE]: EMPTY_INFO}).then(() => console.log('Cleared song after the timeout')),
      2500);
}

/**
 * Will update the session storage if a new song is sent by a content script.
 *
 *
 * @param {Object} update
 * @return {Promise<any>}
 */
function processContentScriptUpdate(update) {
  /** @type {SongInfo[]} */
  const contentScriptUpdates =
    Object.getOwnPropertyNames(update)
        .filter((key) => key.startsWith(KEY_SONG_TITLE_PREFIX))
        .map((key) => update[key].newValue);

  if (contentScriptUpdates.length === 0) {
    return Promise.resolve();
  }

  // The update should contain a single value as each content_script works independently.
  if (contentScriptUpdates.length !== 1) {
    throw new Error('Unexpected update length', update);
  }

  refreshSongTimeout();

  /** @type {SongInfo} */
  const songInfo = contentScriptUpdates[0];
  // Clear timestamp so the chrome.storage.session.onChanged method is not invoked
  // when no change to the song title was done
  songInfo.timestamp = 0;
  return chrome.storage.session.set({[KEY_SONG_TITLE]: songInfo});
}

/**
 * Will update firebase if a new song is added in `KEY_SONG_TITLE`.
 *
 * @param {Object} update
 * @return {Promise<any>}
 */
function processSongUpdate(update) {
  if (!update.hasOwnProperty(KEY_SONG_TITLE)) {
    return Promise.resolve();
  }

  const songInfo = update[KEY_SONG_TITLE].newValue;
  console.log('Sending song info to firebase', songInfo);

  const verifiedDbDataPromise = (dbDataPromise || createDbData().then(verifyDbData));

  return verifiedDbDataPromise
  // Database promise will be cached as dbDataPromise only if there was no error when creating db.
      .then(() => dbDataPromise = verifiedDbDataPromise)
      .then((dbData) => set(ref(dbData.db, dbData.token + '/songs/current'), songInfo))
      .catch((e) => console.log(e));
}


chrome.storage.session.setAccessLevel({accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS'});
chrome.storage.session.onChanged.addListener((update) => processContentScriptUpdate(update));
chrome.storage.session.onChanged.addListener((update) => processSongUpdate(update));
