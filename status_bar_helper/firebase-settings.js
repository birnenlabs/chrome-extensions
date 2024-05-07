const name = 'firebase-local-settings';
/** Settings class */
export class FirebaseSettings {
  /**
   * @return {Promise<string>}
   */
  static getUrl() {
    return chrome.storage.local.get(name).then((data) => data[name]?.url || '');
  }

  /**
   * @return {Promise<string>}
   */
  static getToken() {
    return chrome.storage.local.get(name).then((data) => data[name]?.token || '');
  }

  /**
   * Save to storage.
   * @param {string} url
   * @param {string} token
   * @return {Promise<any>}
   */
  static save(url, token) {
    console.log(`FirebaseSettings saving: ${url}, ${token}`);
    return chrome.storage.local.set({[name]: {url, token}});
  }
}
