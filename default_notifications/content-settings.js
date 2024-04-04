/**
 * @typedef {Object} NotificationsUpdate
 * @property {string} primaryPattern
 * @property {'allow'|'block'} setting
 */

/**
 * Wrapper of chrome.contentSettings.notifications.set that returns promise.
 *
 * @param {NotificationsUpdate} o
 * @return {Promise<void>}
 */
export function notificationsSet(o) {
  // casting to unkown first as typescript doesn't allow direct casting void to promise.
  // The chrome.contentSettings returns promise but typescript doesn't know about it.
  return /** @type {Promise<void>} */ (/** @type {unknown} */(chrome.contentSettings.notifications.set(o)));
}

/**
 *
 * Wrapper of chrome.contentSettings.notifications.clear that returns promise.
 * @return {Promise<void>}
 */
export function notificationsClear() {
  return /** @type {Promise<void>} */ (/** @type {unknown} */ (chrome.contentSettings.notifications.clear({})));
}
