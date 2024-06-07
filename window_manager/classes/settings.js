import {validateClass} from '../jslib/js/validation.js';

export const SETTINGS_HELP_MAP = new Map([
  ['popupButtonColor', 'Color of the button in the window that opens after left click on the extension icon. It should be the html notation (examples: white, red, #ffffff).'],
  ['popupBackgroundColor', 'Color of the window that opens after left click on the extension icon. It should be the html notation (examples: white, red, #ffffff).'],
  ['rememberPositionsSetWithShortcut', 'Actions can specify "menuName" or "shortcutId", so the window position can be set using them. When this setting is true, the window position will be remembered in this session and upon the next automatic  window positioning (after monitor changes, shortcut or button click) the window will be restored according to last used menuName or shortcutId.'],
  ['triggerOnMonitorChange', 'When this setting is true, all the windows will be automatically repositioned when monitor is attached or detached.'],
  ['triggerOnWindowCreated', 'When this setting is true, newly created windows will be positioned according to the settings.'],
  ['autostartApps', 'Comma separated list of urls that will be opened as popup windows when clicking on the extension icon (when the list is not empty, there will be a new button in the popup menu).'],
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
  autostartApps = '';

  /** @return {void} */
  validate() {
    validateClass(new Settings(), this, ['popupButtonColor', 'popupBackgroundColor', 'rememberPositionsSetWithShortcut', 'triggerOnMonitorChange', 'triggerOnWindowCreated', 'autostartApps']);
  }


  /**
   * Creates object from json string without validation.
   *
   * @param {*} json
   * @return {Settings}
   */
  static from(json) {
    return Object.assign(new Settings(), json);
  }
}
