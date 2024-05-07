import {FirebaseSettings} from './firebase-settings.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import {getDatabase, ref, set} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js';


/**
 * @typedef {Object} SongInfo
 * @property {string} artist
 * @property {string} title
 * @property {number} timestamp
 */

const KEY_SONG_TITLE = 'song-title';


/**
 * @param {SongInfo} songInfo
 */
async function setInDatabase(songInfo) {
  console.log('Sending song info to firebase:', songInfo);
  const databaseURL = await FirebaseSettings.getUrl();
  const token = await FirebaseSettings.getToken();
  if (!databaseURL) {
    console.warn('Database url not set');
    return;
  }

  const db = getDatabase(initializeApp({databaseURL}));
  set(ref(db, token + '/songs/current'), songInfo);
}


chrome.storage.session.setAccessLevel({accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS'});
chrome.storage.session.onChanged.addListener(
    (changed) => changed.hasOwnProperty(KEY_SONG_TITLE) ? setInDatabase(changed[KEY_SONG_TITLE].newValue) : undefined,
);
