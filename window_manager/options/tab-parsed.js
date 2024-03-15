import {filterWithDisplay, matchActionsToDisplay, Action, ActionWithDisplay} from '../classes/action.js';
import {Display, Displays} from '../classes/displays.js';
import {matchMatcherToAction, Matcher, MatcherWithAction} from '../classes/matcher.js';
import {Storage} from '../classes/storage.js';
import {checkNonUndefined} from '../utils/preconditions.js';
import {combine4} from '../utils/promise.js';

const SHORTCUT_WATCH_TIMEOUT = 1000;
let definedShortcutsArray = [];

/**
 * @param {string} text
 * @param {boolean} code
 * @return {HTMLElement}
 */
function createPre(text, code = false) {
  const div = document.createElement('div');
  const pre = document.createElement('pre');
  pre.textContent = text;
  if (code) {
    pre.classList.add('code');
  }
  div.appendChild(pre);
  return div;
}

/**
 * @param {Action[]} actions
 * @param {Matcher[]} matchers
 * @param {Display[]} displays
 * @param {chrome.commands.Command[]} shortcuts
 */
function showActions(actions, matchers, displays, shortcuts) {
  const tableRows = [];

  // Prepare shortcuts map
  const commandIdPrefix = 'zzz-shortcut-';
  const shortcutsMap = new Map(
      shortcuts
          .filter((cmd) => cmd.name?.startsWith(commandIdPrefix))
          .map((cmd) => [parseInt(cmd.name?.slice(commandIdPrefix.length) || '-1', 10), cmd.shortcut]),
  );

  // Match actions to displays and matchers to actions.
  // Add id so actions with the same name can be distinguished.
  let id = 1;
  const ID_PROP = '___internal_id___';
  /** @type {(Action | ActionWithDisplay)[]} */
  const actionsWithDisplayAndId = matchActionsToDisplay(actions, displays)
      .map((action) => {
        action[ID_PROP] = id++; return action;
      });
  const matchersWithActions = matchMatcherToAction(matchers, filterWithDisplay(actionsWithDisplayAndId));

  // print ids that are defined in matchers but not in actions.
  const validActionIds = new Set(actions.map((a) => a.id));
  const invalidActionIds = [...new Set(matchers.map((m)=> m.actions).flat())].filter((a) => !validActionIds.has(a));

  for (const invalidActionId of invalidActionIds) {
    const displayRow = document.createElement('tr');
    displayRow.classList.add('error');
    tableRows.push(displayRow);

    const cols = new Array(2).fill(0).map(() => document.createElement('td'));
    displayRow.replaceChildren(...cols);

    cols[0].replaceChildren(createPre(invalidActionId, true));
    cols[1].replaceChildren(document.createTextNode('This action id is specified in some matchers but not defined in actions list. This is configuration error and will cause window manager to fail.'));
    cols[1].colSpan = 7;
  }


  for (const action of actionsWithDisplayAndId) {
    const displayRow = document.createElement('tr');
    tableRows.push(displayRow);

    const cols = new Array(8).fill(0).map(() => document.createElement('td'));
    displayRow.replaceChildren(...cols);

    cols[0].replaceChildren(createPre(action.id, true));
    cols[1].replaceChildren(createPre(action.display));
    cols[2].replaceChildren(document.createTextNode(action instanceof ActionWithDisplay ? action.matchedDisplay.name : 'not connected'));
    if (action instanceof ActionWithDisplay) {
      cols[2].removeAttribute('class');
    } else {
      cols[2].classList.add('warning');
    }
    cols[3].innerHTML = `<center>${action.row.start}<br>🡓<br>${action.row.end}</center>`;
    cols[4].replaceChildren(document.createTextNode(`${action.column.start}⟶${action.column.end}`));

    const filteredMatchers = matchersWithActions.filter((m) => m.actions.some((a) => a === action.id))
        .map((m) => createMatcherDiv(m, m instanceof MatcherWithAction && m.matchedAction[ID_PROP] === action[ID_PROP]));
    cols[5].replaceChildren(...filteredMatchers);
    cols[6].replaceChildren(document.createTextNode(action.menuName || ''));

    const mappedShortcut = shortcutsMap.get(action.shortcutId);
    cols[7].replaceChildren(document.createTextNode(
      action.shortcutId ? `${mappedShortcut || 'not set'} [${action.shortcutId}]` : ''));
    if (action.shortcutId && !mappedShortcut) {
      cols[7].classList.add('warning');
    } else {
      cols[7].removeAttribute('class');
    }
  }

  checkNonUndefined(document.getElementById('actionsTable')).replaceChildren(...tableRows);
}

/**
 * @param {Matcher} matcher
 * @param {boolean=} matched
 * @return {HTMLElement}
 */
function createMatcherDiv(matcher, matched = false) {
  const el = document.createElement('div');
  el.textContent = matcher.toString();
  el.classList.add('tableChip');
  if (matched) {
    el.classList.add('matchedMatcherChip');
  }
  return el;
}

/**
 * @return {Promise<void>}
 */
function onPageLoad() {
  setTimeout(shortcutWatcher, SHORTCUT_WATCH_TIMEOUT);
  return reloadActions();
}


/**
 * @return {Promise<void>}
 */
function shortcutWatcher() {
  setTimeout(shortcutWatcher, SHORTCUT_WATCH_TIMEOUT);

  return chrome.commands.getAll()
      .then((cmd) => maybeReloadActions(cmd));
}

/**
 * @param {chrome.commands.Command[]} shortcuts
 * @return {Promise<void> | void}
 */
function maybeReloadActions(shortcuts) {
  if (shortcuts.length != definedShortcutsArray.length) {
    console.info(`${new Date().toLocaleTimeString()} Shortcuts were updated, reloading actions.`);
    return reloadActions();
  } else {
    for (let i = 0; i < shortcuts.length; i++) {
      if (shortcuts[i].shortcut !== definedShortcutsArray[i].shortcut) {
        console.info(`${new Date().toLocaleTimeString()} Shortcuts were updated, reloading actions.`);
        return reloadActions();
      }
    }
  }
  return;
}


/**
 * @return {Promise<void>}
 */
function reloadActions() {
  const updateShortcutsArrayPromise = chrome.commands.getAll()
  // Assignment operator returns its value
      .then((shortcuts) => definedShortcutsArray = shortcuts);

  return combine4(Storage.getActions(), Storage.getMatchers(), Displays.getDisplays(), updateShortcutsArrayPromise, showActions);
}

document.addEventListener('DOMContentLoaded', onPageLoad);
Storage.addOnChangeListener(() => reloadActions());
