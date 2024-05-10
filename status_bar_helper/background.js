import {FirebaseSettings} from './firebase-settings.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import {Database, getDatabase, ref, set} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js';


/**
 * @typedef {Object} SongInfo
 * @property {string} artist
 * @property {string} title
 * @property {number} timestampMin
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

/**
 * @return {Promise<DbData>}
 */
function createDbData() {
  console.log('Creating database');
  const tokenPromise = FirebaseSettings.getToken();
  const dbPromise = FirebaseSettings.getUrl()
      .then((databaseURL) => databaseURL ? getDatabase(initializeApp({databaseURL})) : undefined);

  return Promise.all([tokenPromise, dbPromise])
      .then((vals) => ({token: vals[0], db: vals[1]}));
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
 * @param {SongInfo} songInfo
 * @return {Promise<any>}
 */
function setInDatabase(songInfo) {
  console.log('Sending song info to firebase:', songInfo);

  const verifiedDbDataPromise = (dbDataPromise || createDbData().then(verifyDbData));

  return verifiedDbDataPromise
  // Database promise will be cached as dbDataPromise only if there was no error when creating db.
      .then(() => dbDataPromise = verifiedDbDataPromise)
      .then((dbData) => set(ref(dbData.db, dbData.token + '/songs/current'), songInfo))
      .catch((e) => console.log(e));
}

/**
 * @param {Object} items
 * @return {SongInfo|undefined}
 */
function findNewestSongTitleInStorage(items) {
  let result = undefined;
  for (const key of Object.getOwnPropertyNames(items)) {
    if (key.startsWith(KEY_SONG_TITLE_PREFIX) && items[key].timestampMin > (result?.timestampMin || 0)) {
      result = items[key];
    }
  }
  return result;
}

/**
 * @param {Object} update
 * @return {Promise<SongInfo|undefined>}
 */
function findSongTitleInStorageUpdate(update) {
  let maybeResult;
  for (const key of Object.getOwnPropertyNames(update)) {
    if (key.startsWith(KEY_SONG_TITLE_PREFIX)) {
      maybeResult = update[key].newValue;
      break;
    }
  }

  if (maybeResult.timestampMin != 0) {
    return Promise.resolve(maybeResult);
  }

  // Check if anything is still playing
  return chrome.storage.session.get()
      .then((items) => findNewestSongTitleInStorage(items) || maybeResult);
}

chrome.storage.session.setAccessLevel({accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS'});
chrome.storage.session.onChanged.addListener(
    (update) => findSongTitleInStorageUpdate(update)
        .then((changed) => changed ? setInDatabase(changed) : undefined),
);