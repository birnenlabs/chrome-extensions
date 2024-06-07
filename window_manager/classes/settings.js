import {stripInvalidKeys, validateClass} from '../jslib/js/validation.js';

export const SETTINGS_HELP_MAP = new Map([
  ['popupButtonColor', 'Color of the button in the window that opens after left click on the extension icon. It should be the html notation (examples: white, red, #ffffff).'],
  ['popupBackgroundColor', 'Color of the window that opens after left click on the extension icon. It should be the html notation (examples: white, red, #ffffff).'],
  ['rememberPositionsSetWithShortcut', 'Actions can specify "menuName" or "shortcutId", so the window position can be set using them. When this setting is true, the window position will be remembered in this session and upon the next automatic  window positioning (after monitor changes, shortcut or button click) the window will be restored according to last used menuName or shortcutId.'],
  ['triggerOnMonitorChange', 'When this setting is true, all the windows will be automatically repositioned when monitor is attached or detached.'],
  ['triggerOnWindowCreated', 'When this setting is true, newly created windows will be positioned according to the settings.'],
  ['shortcut1', 'Add up to 4 buttons in the popup menu (which is displayed when clicking on the extension icon). The setting should contain a single URL (or comma separated list of URLs) that will be opened as a popup window(s) when clicked on the button. Optionally the first character can be emoji which will be used as a button label. The buttons will only be displayed when shortcut 1-4 setting is not empty. You can use regular URLs or chrome extension address.'],
  ['shortcut2', 'Example: https://web.whatsapp.com'],
  ['shortcut3', 'Example: 🚀https://web.whatsapp.com,https://messages.google.com/web/conversations'],
  ['shortcut4', 'Example: 🖥️chrome-extension://iodihamcpbpeioajjeobimgagajmlibd/html/nassh.html'],
]);

/** Settings class */
export class Settings {
  /** @type {string} */
  popupButtonColor = '#f9f9f9';

  /** @type {string} */
  popupBackgroundColor = 'white';

  /** @type {boolean} */
  rememberPositionsSetWithShortcut = true;

  /** @type {boolean} */
  triggerOnMonitorChange = true;

  /** @type {boolean} */
  triggerOnWindowCreated = true;

  /** @type {string} */
  shortcut1 = '';

  /** @type {string} */
  shortcut2 = '';

  /** @type {string} */
  shortcut3 = '';

  /** @type {string} */
  shortcut4 = '';

  /** @return {void} */
  validate() {
    validateClass(new Settings(), this, /* All keys are optional. */ Object.keys(new Settings()));
  }


  /**
   * Creates object from json string without validation.
   *
   * @param {*} json
   * @return {Settings}
   */
  static from(json) {
    const result = Object.assign(new Settings(), json);
    stripInvalidKeys(new Settings(), result);
    return result;
  }
}
