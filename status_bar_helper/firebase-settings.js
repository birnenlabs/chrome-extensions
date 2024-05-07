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
   * Save to storage.
   * @param {string} url
   * @return {Promise<any>}
   */
  static save(url) {
    console.log(`FirebaseSettings saving: ${url}`);
    return chrome.storage.local.set({[name]: {url}});
  }
}
