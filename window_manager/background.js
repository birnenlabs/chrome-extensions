import {Displays} from './classes/displays.js';
import {Storage} from './classes/storage.js';
import {promiseTimeout} from './jslib/js/promise.js';
import {updateWindowWithAllActions, updateAllWindowsWithAllActions, updateWindowWithSpecifiedAction} from './worker.js';

const ACTION_START_TIMEOUT_MS = 200;

let displayChangedTimeoutId = null;

chrome.commands.onCommand.addListener((command, tab) => {
  const commandIdPrefix = 'zzz-shortcut-';

  let promise;
  if (command === 'all-windows-shortcut') {
    promise = updateAllWindowsWithAllActions();
  } else if (command === 'focused-window-shortcut') {
    promise = updateWindowWithAllActions(tab?.windowId);
  } else if (command.startsWith(commandIdPrefix)) {
    const shortcutId = parseInt(command.slice(commandIdPrefix.length), 10);
    promise = updateWindowWithSpecifiedAction(tab?.windowId, ((a) => a.shortcutId === shortcutId));
  } else {
    promise = Promise.reject(new Error(`Invalid command: ${command}`));
  }

  return promise.catch((e) => console.error(`onCommand failed with error: ${e.message}.`));
});

chrome.system.display.onDisplayChanged.addListener(() => {
  return Storage.getSettings()
      .then((settings) => {
        if (settings.triggerOnMonitorChange) {
          if (displayChangedTimeoutId) {
            clearTimeout(displayChangedTimeoutId);
            console.log(`${new Date().toLocaleTimeString()} onDisplayChanged: setting timer (previous timer cancelled)`);
          } else {
            console.log(`${new Date().toLocaleTimeString()} onDisplayChanged: setting timer`);
          }

          // wait a moment before doing anything - when display is created onDisplayChanged is triggered multiple times, this will consider the last change only.
          displayChangedTimeoutId = setTimeout(
              () => {
                displayChangedTimeoutId = null;
                return Displays.displaysChanged()
                    .then((changed) => changed ? updateAllWindowsWithAllActions() : undefined)
                    .catch((e) => console.error(`onDisplayChanged failed with error: ${e.message}.`));
              },
              ACTION_START_TIMEOUT_MS,
          );
        }
        return undefined;
      });
});

chrome.windows.onCreated.addListener((window) => {
  return Storage.getSettings()
      .then((settings) => promiseTimeout(ACTION_START_TIMEOUT_MS, settings))
      .then((settings) =>
      settings.triggerOnWindowCreated ?
        updateWindowWithAllActions(window.id) :
        console.warn('settings.triggerOnWindowCreated is false, not updating window:', window))
      .catch((e) => console.error(`onCreated failed with error: ${e.message}.`));
});

// This is triggered from the options menu.
chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
      let promise;

      if (request.command === 'updateAllWindowsWithAllActions') {
        promise = updateAllWindowsWithAllActions();
      } else if (request.command === 'updateWindowWithSpecifiedMenuName') {
        promise = request.menuName ?
          updateWindowWithSpecifiedAction(request.windowId, ((a) => a.menuName === request.menuName)) :
          Promise.reject(new Error('updateWindowWithSpecifiedMenuName requires menuName'));
      } else {
        promise = Promise.reject(new Error(`invalid command: ${request.command}`));
      }

      return promise.catch((e) => console.error(`onMessage failed with error: ${e.message}.`));
    },
);

