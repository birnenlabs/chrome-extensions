import {FirebaseSettings} from './firebase-settings.js';
import {getHTMLInputElement} from './jslib/js/html.js';

/**
 * @return {Promise<any>}
 */
function firebaseInit() {
  return FirebaseSettings.getUrl()
      .then((url) => getHTMLInputElement('firebase-url').value = (url || ''))
      .then(() => FirebaseSettings.getToken())
      .then((token) => getHTMLInputElement('firebase-token').value = (token || ''));
}

/**
 * @return {Promise<any>}
 */
function firebaseSave() {
  return FirebaseSettings.save(getHTMLInputElement('firebase-url').value, getHTMLInputElement('firebase-token').value);
}


document.addEventListener('DOMContentLoaded', firebaseInit);
document.getElementById('firebaseSave')?.addEventListener('click', firebaseSave);
