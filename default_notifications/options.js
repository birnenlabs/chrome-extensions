import {getAndApplyDataFromStorage, setDataInStorage} from './storage.js';

/**
 * @typedef {import('./storage.js').AppliedUrl} AppliedUrl
 */

/**
 * @return {Promise<void>}
 */
function initializePage() {
  // Applying data from storage as this is only way to get the error code.
  const allowedPromise = getAndApplyDataFromStorage('allow');
  const blockedPromise = getAndApplyDataFromStorage('block');

  const saveButtonEl = document.getElementById('saveButton');

  if (!saveButtonEl) {
    throw new Error('Cannot find saveButton');
  }

  saveButtonEl.addEventListener('click', save);

  return allowedPromise
      .then((list) => initializeList(list, 'allow'))
      .then(() => blockedPromise)
      .then((list) => initializeList(list, 'block'));
}

/**
 * @param {AppliedUrl[]} list
 * @param {'allow'|'block'} type
 */
function initializeList(list, type) {
  const divEl = document.getElementById(`${type}Div`);
  const inputEl = /** @type {HTMLInputElement} */ (document.getElementById(`${type}Input`));
  const buttonEl = document.getElementById(`${type}Button`);

  if (!divEl || !inputEl || !buttonEl) {
    throw new Error(`Cannot find ${type} element.`);
  }

  for (const value of list) {
    divEl.appendChild(createElement(value));
  }

  buttonEl.addEventListener('click', () => divEl.appendChild(createElement(validateAndClear(inputEl))));
}

/**
 * @param {HTMLInputElement} inputEl
 * @return {AppliedUrl}
 */
function validateAndClear(inputEl) {
  let result = inputEl.value.toLowerCase();
  if (!result.endsWith('/*')) {
    result = result + (result.endsWith('/') ? '*' : '/*');
  }
  if (!result.startsWith('http://') &&
    !result.startsWith('https://') &&
    !result.startsWith('*://')) {
    result = 'https://' + result;
  }

  inputEl.value = '';
  return {url: result, err: null};
}

/**
 * @param {AppliedUrl} value
 * @return {HTMLElement}
 */
function createElement(value) {
  const el = document.createElement('div');

  const valueEl = document.createElement('span');
  valueEl.classList.add('code');
  valueEl.classList.add('value');
  valueEl.textContent = value.url;

  const removeEl = document.createElement('span');
  removeEl.textContent = '✖';
  removeEl.role = 'button';
  removeEl.classList.add('remove-button');
  removeEl.addEventListener('click', () => el.remove());

  el.appendChild(valueEl);
  el.appendChild(removeEl);

  if (value.err) {
    const errorEl = document.createElement('span');
    errorEl.textContent = value.err.toString();
    errorEl.classList.add('error');
    el.appendChild(errorEl);
  }

  return el;
}

/**
 * @return {Promise<void>}
 */
function save() {
  const allow = [];
  const block = [];
  for (const valueEl of document.querySelectorAll('#allowDiv .value')) {
    if (valueEl.textContent) {
      allow.push(valueEl.textContent);
    }
  }
  for (const valueEl of document.querySelectorAll('#blockDiv .value')) {
    if (valueEl.textContent) {
      block.push(valueEl.textContent);
    }
  }

  console.log(`Saving new data:\nallow: ${allow}\nblock: ${block}`);
  return setDataInStorage(allow, 'allow')
      .then(() => setDataInStorage(block, 'block'));
}

document.addEventListener('DOMContentLoaded', initializePage);
