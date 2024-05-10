import {SETTINGS_HELP_MAP, Settings} from '../classes/settings.js';
import {Storage} from '../classes/storage.js';
import {checkNonUndefined} from '../jslib/js/preconditions.js';

const INPUT_CLASS = 'settingsValueInput';

/**
 * @param {string} text
 * @return {HTMLElement}
 */
function createPre(text) {
  const div = document.createElement('div');
  const pre = document.createElement('pre');
  pre.textContent = text;
  pre.classList.add('code');
  div.appendChild(pre);
  return div;
}

/**
 * Returns settings from the html inputs.
 *
 * @return {Settings}
 */
function getSettings() {
  const settings = new Settings();
  document.querySelectorAll('.' + INPUT_CLASS)
      .forEach((/** @type {HTMLInputElement} */el) => settings[el.id] = (el.type == 'checkbox' ? el.checked : el.value));
  console.log(`getSettings: ${JSON.stringify(settings, undefined, 2)}`);
  return settings;
}

/**
 * Creates html editor structure based on the settings.
 *
 * @param {Settings} settings
 */
function setSettings(settings) {
  console.log(`setSettings: ${JSON.stringify(settings, undefined, 2)}`);

  const tableRows = [];
  for (const setting of new Set(Object.keys(settings))) {
    const rowEl = document.createElement('tr');
    tableRows.push(rowEl);

    const cols = new Array(3).fill(0).map(() => document.createElement('td'));
    rowEl.replaceChildren(...cols);

    const inputEl = document.createElement('input');
    if (typeof settings[setting] === 'boolean') {
      inputEl.type = 'checkbox';
      inputEl.checked = settings[setting];
    } else {
      inputEl.value = settings[setting];
    }

    inputEl.id = setting;
    inputEl.classList.add(INPUT_CLASS);

    cols[0].replaceChildren(createPre(setting));
    cols[1].replaceChildren(inputEl);
    cols[2].replaceChildren(document.createTextNode(checkNonUndefined(SETTINGS_HELP_MAP.get(setting))));
  }

  checkNonUndefined(document.getElementById('settingsTable')).replaceChildren(...tableRows);
}

/**
 * @return {Promise<void>}
 */
function onPageLoad() {
  return Storage.getSettings().then((s) => setSettings(s));
}

/**
 * @return {Promise<void>}
 */
function onSaveClick() {
  const settings = getSettings();
  settings.validate();

  const saveBtn = checkNonUndefined(document.getElementById('saveButton'));
  saveBtn.classList.add('button-processing');
  setTimeout(() => saveBtn.classList.remove('button-processing'), 500);
  return Storage.getConfiguration()
      .then((config) => {
        config.settings = settings;
        return config;
      })
      .then((config) => Storage.saveConfiguration(config))
      .then(() => undefined);
}

document.addEventListener('DOMContentLoaded', onPageLoad);
Storage.addOnChangeListener(() => onPageLoad());

checkNonUndefined(document.getElementById('saveButton')).addEventListener('click', onSaveClick);
