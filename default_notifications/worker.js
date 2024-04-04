import {notificationsClear} from './content-settings.js';
import {getAndApplyDataFromStorage} from './storage.js';

/**
 * @return {Promise<void>}
 */
function updateNotifications() {
  console.log(`${new Date()} updating notifications settings`);

  return notificationsClear()
      .then(() => getAndApplyDataFromStorage('allow'))
      .then((applied) => applied.forEach((a) => console.log(`allow: ${a.url} ${a.err || ''}`)))
      .then(() => getAndApplyDataFromStorage('block'))
      .then((applied) => applied.forEach((a) => console.log(`block: ${a.url} ${a.err || ''}`)))
  // Display any error
      .catch((err) => console.error(err.message));
}

chrome.runtime.onInstalled.addListener(updateNotifications);
chrome.storage.sync.onChanged.addListener(updateNotifications);
