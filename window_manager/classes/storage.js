import {Action} from './action.js';
import {Configuration, RawConfiguration, ValidatedConfiguration} from './configuration.js';
import {Matcher} from './matcher.js';
import {Settings} from './settings.js';

/** Session config key for the validated configuration */
const VALID_CONFIG_KEY = 'validConfig';

/** Storage class */
export class Storage {
  /** @type {(function(): void)[]} */
  static #onChangeListeners = [];

  /**
   * Note that worker, popup and options don't share the same VM, so this
   * code will be initialized multiple times.
   *
   * The popup and options page are usually closed and when they are open
   * they should listen to configuration change event. These events should
   * only be fired after the storages are synced so it is better to do it
   * multiple times and not risk firing events to early.
   */
  static {
    console.log(`${new Date().toLocaleTimeString()} Storage initialization - creating storage onChange listener`);
    // If synced storage changes, refresh the session copy.
    chrome.storage.sync.onChanged.addListener(() => Storage.#forceRefreshFromSyncedStorage().then(() => Storage.#sendOnChangedEvents()));
  }

  /**
   * Read config from synced storage, and update session storage copy.
   * @return {Promise<Configuration>}
   */
  static #forceRefreshFromSyncedStorage() {
    console.log(`${new Date().toLocaleTimeString()} Forcing configuration refresh from the synced storage.`);

    return Storage.getRawConfiguration()
        .then((rawConfig) => ValidatedConfiguration.fromRawConfiguration(rawConfig))
        .then((config) => Storage.#setSessionStorage(config));
  }

  /**
   * Will invoke all the registered callbacks.
   */
  static #sendOnChangedEvents() {
    console.log(`${new Date().toLocaleTimeString()} Storage will notify ${Storage.#onChangeListeners.length} listeners about configuration change`);
    Storage.#onChangeListeners.forEach((fn) => fn());
  }

  /**
   * @return {Promise<Configuration | undefined>}
   */
  static #getSessionStorage() {
    return chrome.storage.session.get({[VALID_CONFIG_KEY]: null})
        .then((sessionConfig) => sessionConfig[VALID_CONFIG_KEY])
        .then((configObj) => configObj ? Configuration.fromStorage(configObj) : undefined);
  }

  /**
   * @param {ValidatedConfiguration} config
   * @return {Promise<Configuration>}
   */
  static #setSessionStorage(config) {
    console.log(`${new Date().toLocaleTimeString()} Updating configuration in the session storage.`);
    if (config.valid) {
      return chrome.storage.session.set({[VALID_CONFIG_KEY]: config}).then(() => config);
    } else {
      return chrome.storage.session.remove(VALID_CONFIG_KEY)
          .then(() => Promise.reject(
              new Error(`${new Date().toLocaleTimeString()
              } Failed parsing config from synced storage errors: actions:${
                config.actionsValidation
              } matchers:${
                config.matchersValidation
              } settings:${
                config.settingsValidation
              }`)));
    }
  }

  /**
   * Returns configuration as it was stored in the chrome.storage. It will try
   * to format it but it wont fail if the configuration is invalid.
   *
   * @return {Promise<RawConfiguration>}
   */
  static getRawConfiguration() {
    return chrome.storage.sync.get({actions: '[]', matchers: '[]', settings: '{}'})
        .then((item) => RawConfiguration.fromString(item));
  }

  /**
   * @param {function(): void} fn
   */
  static addOnChangeListener(fn) {
    Storage.#onChangeListeners.push(fn);
  }

  /**
   * @return {Promise<Configuration>}
   */
  static getConfiguration() {
    return Storage.#getSessionStorage()
        .then((config) => config || Storage.#forceRefreshFromSyncedStorage());
  }

  /** @return {Promise<Action[]>} */
  static getActions() {
    return Storage.getConfiguration().then((config) => config.actions);
  }

  /** @return {Promise<Matcher[]>} */
  static getMatchers() {
    return Storage.getConfiguration().then((config) => config.matchers);
  }

  /** @return {Promise<Settings>} */
  static getSettings() {
    return Storage.getConfiguration().then((config) => config.settings);
  }

  /**
   * Saves validated configuration to the synced storage.
   *
   * @param {Configuration} input
   * @return {Promise<void>}
   */
  static save(input) {
    const configuration = ValidatedConfiguration.fromConfiguration(input);

    if (configuration.valid !== true) {
      throw new Error(`Could not save invalid configuration:\n${[configuration.actionsValidation, configuration.matchersValidation, configuration.settingsValidation].filter(Boolean).join('\n')}`);
    }

    // No need to update session storage - if anything is actually changed
    // the onChanged event handler in the service workers background.js
    // will refresh the session storage, and the Storage instance
    return chrome.storage.sync.set(
        {
          actions: StorageToJson.actions(configuration.actions, 0),
          matchers: StorageToJson.matchers(configuration.matchers, 0),
          settings: StorageToJson.settings(configuration.settings, 0),
        });
  }
}


/** StorageToJson class */
export class StorageToJson {
  /**
   * @param {Action[]} actions
   * @param {number} indent
   * @return {string}
   */
  static actions(actions, indent = 2) {
    return JSON.stringify(actions, undefined, indent);
  }

  /**
   * @param {Matcher[]} matchers
   * @param {number} indent
   * @return {string}
   */
  static matchers(matchers, indent = 2) {
    return JSON.stringify(matchers, undefined, indent);
  }

  /**
   * @param {Settings} settings
   * @param {number} indent
   * @return {string}
   */
  static settings(settings, indent = 2) {
    return JSON.stringify(settings, undefined, indent);
  }
}
