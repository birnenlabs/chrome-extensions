import {FirebaseSettings} from './firebase-settings.js';

/**
 * @param{string} id
 * @return {HTMLInputElement}
 */
function getInput(id) {
  const inputEl = document.getElementById(id);
  if (inputEl instanceof HTMLInputElement) {
    return inputEl;
  }
  throw new Error(`Input ${id} not found.`);
}

/**
 * @return {Promise<any>}
 */
function firebaseInit() {
  return FirebaseSettings.getUrl().then((url) => getInput('firebase-url').value = (url || ''));
}

/**
 * @return {Promise<any>}
 */
function firebaseSave() {
  return FirebaseSettings.save(getInput('firebase-url').value);
}


document.addEventListener('DOMContentLoaded', firebaseInit);
document.getElementById('firebaseSave')?.addEventListener('click', firebaseSave);
