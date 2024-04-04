import {notificationsSet} from './content-settings.js';

const KEY = {
  allow: 'allowed-pages',
  block: 'blocked-pages',
};

const DELIMITER = ',';

const DEFAULT = {
  block: '<all_urls>',
  allow: '*://*.google.com:*/*,https://www.messenger.com/*,https://web.skype.com/*,https://web.whatsapp.com/*,https://open.spotify.com/*,https://www.bennish.net/*',
};

/**
 * @typedef {Object} AppliedUrl
 * @property {string} url
 * @property {Error|null} err
 */

/**
 * @param {'allow'|'block'} type
 * @return {Promise<String[]>}
 */
export function getDataFromStorage(type) {
  return chrome.storage.sync.get({[KEY[type]]: DEFAULT[type]})
      .then((conf) => conf[KEY[type]])
      .then((list) => list || '')
      .then((list) => list.split(DELIMITER).filter((i) => i));
}

/**
 * @param {string[]} data
 * @param {'allow'|'block'} type
 * @return {Promise<void>}
 */
export function setDataInStorage(data, type) {
  return chrome.storage.sync.set({[KEY[type]]: data.join(DELIMITER)})
      .then(() => {});
}

/**
 * @param {'allow'|'block'} type
 * @return {Promise<AppliedUrl[]>}
 */
export function getAndApplyDataFromStorage(type) {
  return getDataFromStorage(type)
      .then((array) => Promise.all(array.map((url) => processUrl(url, type))));
}

/**
 * @param {string} url
 * @param {'allow'|'block'} type
 * @return {Promise<AppliedUrl>}
 */
function processUrl(url, type) {
  return notificationsSet({
    primaryPattern: url,
    setting: type,
  })
      .then(() => ({url, err: null}))
      .catch((err) => ({url, err}));
}
