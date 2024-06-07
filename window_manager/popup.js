import {filterWithDisplay, matchActionsToDisplay} from './classes/action.js';
import {Displays} from './classes/displays.js';
import {Settings} from './classes/settings.js';
import {Storage} from './classes/storage.js';
import {checkNonUndefined} from './jslib/js/preconditions.js';
import {combine2, combine3, promiseLogWithObject} from './jslib/js/promise.js';

/** @return {void} */
function organiseClick() {
  chrome.runtime.sendMessage({command: 'updateAllWindowsWithAllActions'});
}

/**
 * @param {Set<string>} actionMenuNames
 * @param {number|undefined} windowId
 */
function addActions(actionMenuNames, windowId) {
  const actionsEl = checkNonUndefined(document.getElementById('actions'));
  for (const actionMenuName of actionMenuNames) {
    const actionEl = document.createElement('button');
    actionEl.textContent = actionMenuName;
    actionEl.addEventListener('click', () => chrome.runtime.sendMessage(
        {command: 'updateWindowWithSpecifiedMenuName', menuName: actionMenuName, windowId: windowId}));
    actionsEl.appendChild(actionEl);
  }
}

/**
 * @param {Settings} settings
 */
function setCss(settings) {
  const style = document.createElement('style');
  style.innerHTML = `
    button {
      background-color: ${settings.popupButtonColor};
    }
    body {
      background-color: ${settings.popupBackgroundColor};
    }`;
  document.head.appendChild(style);
}

/**
 * @param {Settings} settings
 */
function initShortcuts(settings) {
  // Hide shortcut buttons if not defined
  for (let i=1; i<=4; i++) {
    const shortcutName = 'shortcut' + i;
    const shortcutEl = checkNonUndefined(document.getElementById(shortcutName));
    const shortcutSettings = settings[shortcutName];
    if (shortcutSettings) {
      shortcutEl.textContent = shortcutSettings.slice(0, firstAsciiIndex(shortcutSettings)) || i;
      shortcutEl.style.display = 'block';
    }
  }
}

/**
 * @param {Event} e
 * @return {Promise<any>}
 */
function shortcutClick(e) {
  const shortcutId = ( /** @type {HTMLElement} */ (checkNonUndefined(e).srcElement)).id;

  const configuredWindowsPromise = Storage.getSettings()
      .then((settings) => settings[shortcutId])
      .then((s) => s.slice(firstAsciiIndex(s)))
      .then((s) => s.split(','))
      .then((arr) => arr.map((u) => new URL(u).href))
      .then((arr) => promiseLogWithObject('Urls from the configuration', arr));

  const openedPopupsSetPromise = chrome.windows.getAll({populate: true, windowTypes: ['popup']})
      .then((popups) => popups.map((window) => window.tabs ? window.tabs[0].url : ''))
      .then((urls) => new Set(urls))
      .then((s) => promiseLogWithObject('Urls already opened', s));

  return combine2(configuredWindowsPromise, openedPopupsSetPromise,
      (configuredWindows, openedPopupsSet) =>
        configuredWindows.filter((url) => logFilteredUrl(url, !openedPopupsSet.has(url))))
      .then((arr) => promiseLogWithObject('Urls to open', arr))
      .then((arr) => arr.forEach((url) => chrome.windows.create({focused: false, type: 'popup', url})));
}

/**
 * @param {string} url
 * @param {boolean} verdict
 * @return {boolean}
 */
function logFilteredUrl(url, verdict) {
  if (!verdict) {
    const el = document.createElement('div');
    checkNonUndefined(document.getElementById('error')).appendChild(el);
    el.innerHTML = `<br>Popup window already exists for url: <i>${url}</i>`;
    setTimeout(() => el.remove(), 1500);
  }
  return verdict;
}

/**
 * @param {string} s
 * @return {number}
 */
function firstAsciiIndex(s) {
  let result = 0;
  while (s.charCodeAt(result) > 255) {
    result++;
  }
  return result;
}

/** @return {Promise<void>} */
function createActionsMenu() {
  const actionsWithMenuPromise = Storage.getActions()
      .then((actions) => actions.filter((a) => a.menuName));

  // Only create buttons for actions which have valid displays.
  const actionMenuNamesPromise = combine2(actionsWithMenuPromise, Displays.getDisplays(), matchActionsToDisplay)
      .then((actions) => filterWithDisplay(actions).map((a) => a.menuName))
      .then((actions) => new Set(actions));

  /** @type {Promise<void>} */
  const menuGeneratedPromise = combine2(actionMenuNamesPromise, chrome.windows.getCurrent().then((window) => window.id), addActions);
  const settingsPromise = Storage.getSettings();
  const cssPromise = settingsPromise.then((s) => setCss(s));
  // Calculate shortcuts in the background.
  const shortcutsPromise = settingsPromise.then((s) => setTimeout(initShortcuts, 1, s));

  return combine3(menuGeneratedPromise, cssPromise, shortcutsPromise, () => undefined);
}

document.addEventListener('DOMContentLoaded', createActionsMenu);
checkNonUndefined(document.getElementById('organise')).addEventListener('click', organiseClick);
checkNonUndefined(document.getElementById('shortcut1')).addEventListener('click', shortcutClick);
checkNonUndefined(document.getElementById('shortcut2')).addEventListener('click', shortcutClick);
checkNonUndefined(document.getElementById('shortcut3')).addEventListener('click', shortcutClick);
checkNonUndefined(document.getElementById('shortcut4')).addEventListener('click', shortcutClick);


