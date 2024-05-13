import {FirebaseSettings} from './firebase-settings.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import {Database, getDatabase, ref, set} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js';
import {combine2} from './jslib/js/promise.js';


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

/**
 * @param {SongInfo|undefined} songInfo
 * @return {Promise<any>}
 */
function maybeSetInDatabase(songInfo) {
  if (songInfo === undefined) {
    return Promise.resolve();
  }

  console.log('Sending song info to firebase:', songInfo);

  const verifiedDbDataPromise = (dbDataPromise || createDbData().then(verifyDbData));

  return verifiedDbDataPromise
  // Database promise will be cached as dbDataPromise only if there was no error when creating db.
      .then(() => dbDataPromise = verifiedDbDataPromise)
      .then((dbData) => set(ref(dbData.db, dbData.token + '/songs/current'), songInfo))
      .catch((e) => console.log(e));
}

let clearSongTimeout = undefined;

/**
 * @param {SongInfo|undefined} songInfo
 * @return {Promise<any>}
 */
function maybeUpdateSession(songInfo) {
  if (songInfo === undefined) {
    return Promise.resolve();
  }

  clearTimeout(clearSongTimeout);
  if (songInfo.title) {
    // Set timer to clear the title in 2.5 seconds if it's not refreshed
    clearSongTimeout = setTimeout(
        () => maybeUpdateSession(EMPTY_INFO).then(() => console.log('Cleared song after the timeout')),
        2500);
  }

  // Clear timestamp so the onUpdate method is not invoked when no change to the song title was done
  songInfo.timestamp = 0;
  return chrome.storage.session.set({[KEY_SONG_TITLE]: songInfo});
}

/**
 * This function will be invoked for both:
 * - contentScript song update
 * - background script current song update
 *
 * chrome.storage.onChanged is invoked only when data was really updated. When using
 * storage before updating the database it will filter out no op updates when whe should
 * not update data in the realtime database (last updated value will be stored localy
 * like in the cache).
 *
 * @param {Object} update
 * @return {Promise<any>}
 */
function processStorageUpdate(update) {
  /** @type {SongInfo[]} */
  const contentScriptUpdates =
    Object.getOwnPropertyNames(update)
        .filter((key) => key.startsWith(KEY_SONG_TITLE_PREFIX))
        .map((key) => update[key].newValue);

  /** @type {SongInfo|undefined} */
  const contentScriptUpdate =
    contentScriptUpdates.length === 0 ? undefined :
    contentScriptUpdates
        .reduce((value, maxValue) => value.timestamp > maxValue.timestamp ? value : maxValue);

  /** @type {SongInfo|undefined} */
  const databaseUpdate = update.hasOwnProperty(KEY_SONG_TITLE) ?
     update[KEY_SONG_TITLE].newValue :
     undefined;

  return maybeSetInDatabase(databaseUpdate)
      .then(() => maybeUpdateSession(contentScriptUpdate));
}

chrome.storage.session.setAccessLevel({accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS'});
chrome.storage.session.onChanged.addListener((update) => processStorageUpdate(update));
