import {Action} from './action.js';
import {Configuration, RawConfiguration, ValidatedConfiguration} from './configuration.js';
import {Matcher} from './matcher.js';
import {Settings} from './settings.js';
import {checkNonUndefined} from '../utils/preconditions.js';
import {isServiceWorker} from '../utils/utils.js';

/** Session config key for the validated configuration */
const VALID_CONFIG_KEY = 'validConfig';

/** Storage class */
export class Storage {
  /** @type {(function(Configuration): void)[]} */
  static #onChangeListeners = [];

  // uuid is used in logs to debug storage objects. Service worker logs
  // are also displayed in the console of options and popup windows.
  static #uuid = crypto.randomUUID();

  /**
   * This is cached version of configuration that is stored in the session.
   *
   * @type {Promise<Configuration>}
   */
  static #cachedConfiguration;

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
    console.log(`${new Date().toLocaleTimeString()} Storage [${Storage.#uuid}]: init`);
    chrome.storage.session.onChanged.addListener((changed) => changed.hasOwnProperty(VALID_CONFIG_KEY) ? Storage.#onSessionStorageChanged() : undefined);

    if (isServiceWorker()) {
      console.log(`${new Date().toLocaleTimeString()} Storage [${Storage.#uuid}]: starting SYNC to SESSION syncing job`);
      chrome.storage.sync.onChanged.addListener(() => Storage.#onSyncStorageChanged());
    }

    // Init cached config from session. If it is undefined force storage sync.
    Storage.#cachedConfiguration = Storage.#getSessionStorage()
        .then((config) => config || Storage.#onSyncStorageChanged());
  }

  /**
   * Adds a function that will be called when the configuration
   * was updated and the client should act on it
   *
   * @param {function(Configuration): void} fn
   */
  static addOnChangeListener(fn) {
    Storage.#onChangeListeners.push(fn);
  }

  /**
   * Returns configuration as it was stored in the chrome.storage. It will try
   * to format it but it wont fail if the configuration is invalid.
   *
   * WARNING: This method is slow as it's always reading data from the SYNC storage.
   *
   * @return {Promise<RawConfiguration>}
   */
  static getRawConfiguration() {
    return chrome.storage.sync.get({actions: '[]', matchers: '[]', settings: '{}'})
        .then((item) => RawConfiguration.fromString(item));
  }

  /**
   * @return {Promise<Configuration>}
   */
  static getConfiguration() {
    return Storage.#cachedConfiguration;
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
   * Saves configuration.
   *
   * @param {Configuration} config
   * @return {Promise<Configuration>}
   */
  static saveConfiguration(config) {
    console.log(`${new Date().toLocaleTimeString()} Storage [${Storage.#uuid}]: saving configuration`);

    const configuration = ValidatedConfiguration.fromConfiguration(config);

    if (configuration.valid !== true) {
      throw new Error(`Could not save invalid configuration:\n${[configuration.actionsValidation, configuration.matchersValidation, configuration.settingsValidation].filter(Boolean).join('\n')}`);
    }

    return Storage.#setSyncStorage(configuration);
  }

  /**
   * Read config from synced storage, and update session storage copy.
   * @return {Promise<Configuration>}
   */
  static #forceRefreshFromSyncedStorage() {
    console.log(`${new Date().toLocaleTimeString()} Storage [${Storage.#uuid}]: force refresh SYNC to SESSION`);

    return Storage.getRawConfiguration()
        .then((rawConfig) => ValidatedConfiguration.fromRawConfiguration(rawConfig))
        .then((config) => Storage.#setSessionStorage(config));
  }

  /**
   * Will be invoked on session storage change.
   *
   * @return {Promise<void>}
   */
  static #onSessionStorageChanged() {
    console.log(`${new Date().toLocaleTimeString()} Storage [${Storage.#uuid}]: SESSION changed, updating cache and notifying ${Storage.#onChangeListeners.length} listeners`);

    Storage.#cachedConfiguration = Storage.#getSessionStorage()
    // Session storage config should not be undefined when invoked on session storage change event.
        .then((conf) => checkNonUndefined(conf));

    return Storage.#cachedConfiguration
        .then((conf) => Storage.#onChangeListeners.forEach((fn) => fn(conf)))
        .then(() => undefined);
  }

  /**
   * Will be invoked on sync storage change.
   *
   * @return {Promise<Configuration>}
   */
  static #onSyncStorageChanged() {
    console.log(`${new Date().toLocaleTimeString()} Storage [${Storage.#uuid}]: SYNC changed, forcing refresh`);

    return Storage.#getSyncStorage().then((config) => Storage.#setSessionStorage(config));
  }

  /**
   * @return {Promise<Configuration | undefined>}
   */
  static #getSessionStorage() {
    return chrome.storage.session.get({[VALID_CONFIG_KEY]: null})
        .then((sessionConfig) => sessionConfig[VALID_CONFIG_KEY])
        .then((configObj) => {
          if (configObj) {
            return Configuration.fromStorage(configObj);
          } else {
            console.log(`${new Date().toLocaleTimeString()} Storage [${Storage.#uuid}]: SESSION empty`);
            return undefined;
          }
        });
  }

  /**
   * @param {ValidatedConfiguration} config
   * @return {Promise<Configuration>}
   */
  static #setSessionStorage(config) {
    console.log(`${new Date().toLocaleTimeString()} Storage [${Storage.#uuid}]: saving to SESSION`);
    // Not validating configuration - session version of config should be always in sync even if it is invalid.
    return chrome.storage.session.set({[VALID_CONFIG_KEY]: config}).then(() => config);
  }

  /**
   * Returns configuration stored in sync.
   * It returns ValidatedConfiguration as configuration read from
   * string has to always be validated.
   *
   * @return {Promise<ValidatedConfiguration>}
   */
  static #getSyncStorage() {
    return Storage.getRawConfiguration()
        .then((rawConfig) => ValidatedConfiguration.fromRawConfiguration(rawConfig));
  }

  /**
   * @param {Configuration} config
   * @return {Promise<Configuration>}
   */
  static #setSyncStorage(config) {
    return chrome.storage.sync.set(
        {
          actions: Storage.#toJson(config.actions, 0),
          matchers: Storage.#toJson(config.matchers, 0),
          settings: Storage.#toJson(config.settings, 0),
        }).then(() => config);
  }

  /**
   * @param {Action[]|Matcher[]|Settings} object
   * @param {number} indent
   * @return {string}
   */
  static #toJson(object, indent = 2) {
    return JSON.stringify(object, undefined, indent);
  }
}
