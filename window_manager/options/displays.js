import {filterWithDisplay, matchActionsToDisplay, ActionWithDisplay} from '../classes/action.js';
import {Displays} from '../classes/displays.js';
import {Storage} from '../classes/storage.js';
import {checkNonUndefined} from '../utils/preconditions.js';
import {combine2} from '../utils/promise.js';

/**
 * @param {string} text
 * @return {HTMLElement}
 */
function createPre(text) {
  const div = document.createElement('div');
  const pre = document.createElement('pre');
  pre.textContent = text;
  div.appendChild(pre);
  return div;
}

/**
 * @return {Promise<void>}
 */
async function showDisplays() {
  const storage = new Storage();
  // Always refresh config as this function might have been invoked after storage onChanged event.
  storage.refreshConfigFromSyncedStorage();

  const tableRows = [];

  const displaysPromise = Displays.getDisplays();
  const actions = await combine2(storage.getActions(), displaysPromise, matchActionsToDisplay);

  const actionsWithDisplay = filterWithDisplay(actions);
  const actionsWithoutDisplay = actions.filter((a) => (!(a instanceof ActionWithDisplay)));


  for (const display of await displaysPromise) {
    const displayRow = document.createElement('tr');
    tableRows.push(displayRow);

    const cols = new Array(8).fill(0).map(() => document.createElement('td'));
    displayRow.replaceChildren(...cols);

    cols[0].replaceChildren(document.createTextNode(display.name));
    cols[1].replaceChildren(document.createTextNode(display.id.toString()));
    cols[2].replaceChildren(document.createTextNode(display.isPrimary.toString()));
    cols[3].replaceChildren(document.createTextNode(display.isInternal.toString()));
    cols[4].replaceChildren(createPre(display.resolution));
    cols[5].replaceChildren(createPre(`${display.bounds.width}x${display.bounds.height}`));
    cols[6].replaceChildren(createPre(`left: ${display.bounds.left}\ntop: ${display.bounds.top}`));
    cols[7].replaceChildren(createPre([...new Set(actionsWithDisplay.filter((a) => a.matchedDisplay.id === display.id).map((a) => a.display))].join('\n')));
  }

  const missingDisplays = new Set(actionsWithoutDisplay.map((a) => a.display));

  for (const missingDisplay of missingDisplays) {
    const displayRow = document.createElement('tr');
    displayRow.classList.add('warning');
    tableRows.push(displayRow);

    const cols = new Array(2).fill(0).map(() => document.createElement('td'));
    displayRow.replaceChildren(...cols);

    cols[0].replaceChildren(document.createTextNode(
        `Display '${missingDisplay}' is referred by some of the actions but it doesn't exist (this is normal if the display is not currently connected).`,
    ));
    cols[0].colSpan = 7;
    cols[1].replaceChildren(createPre(missingDisplay));
  }

  checkNonUndefined(document.getElementById('displaysTable')).replaceChildren(...tableRows);
}

document.addEventListener('DOMContentLoaded', showDisplays);
chrome.system.display.onDisplayChanged.addListener(showDisplays);
chrome.storage.sync.onChanged.addListener(showDisplays);
