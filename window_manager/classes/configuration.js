import {Action} from './action.js';
import {Matcher} from './matcher.js';
import {Settings} from './settings.js';

/** RawConfiguration class */
export class RawConfiguration {
  /** @type {string} */
  actions;

  /** @type {string} */
  matchers;

  /** @type {string} */
  settings;

  /**
   * @param {Object} obj
   * @return {RawConfiguration}
   */
  static fromString(obj) {
    const result = new RawConfiguration();
    result.actions = RawConfiguration.#maybeFormat(obj.actions || '');
    result.matchers = RawConfiguration.#maybeFormat(obj.matchers || '');
    result.settings = RawConfiguration.#maybeFormat(obj.settings || '');
    return result;
  }

  /**
   * It will try to format the string data but won't fail in case of problems.
   *
   * @param {string} value
   * @return {string}
   */
  static #maybeFormat(value) {
    try {
      return JSON.stringify(JSON.parse(value), undefined, 2);
    } catch (e) {
      console.warn(`Could not format JSON: ${e.message}`);
      return value;
    }
  }
}

/** Configuration class */
export class Configuration {
  /** @type {Action[]} */
  actions;

  /** @type {Matcher[]} */
  matchers;

  /** @type {Settings} */
  settings;

  /**
   * Constructor
   */
  constructor() {
    this.actions = [];
    this.matchers = [];
    this.settings = new Settings();
  }

  /**
   * @param {{actions: Action[], matchers: Matcher[], settings: Settings}} obj
   * @return {Configuration}
   */
  static fromStorage(obj) {
    const result = new Configuration();
    result.actions = StorageFromJson.actionsFromObj(obj.actions),
    result.matchers = StorageFromJson.matchersFromObj(obj.matchers),
    result.settings = StorageFromJson.settingsFromObj(obj.settings);
    return result;
  }
}

/** ValidatedConfiguration class */
export class ValidatedConfiguration {
  /** @type {Action[]} */
  actions;

  /** @type {Matcher[]} */
  matchers;

  /** @type {Settings} */
  settings;

  /** @type {boolean} */
  valid;

  /** @type {string} */
  actionsValidation;

  /** @type {string} */
  matchersValidation;

  /** @type {string} */
  settingsValidation;

  /**
   * @param {Configuration} configuration
   */
  constructor(configuration) {
    this.actions = configuration.actions;
    this.matchers = configuration.matchers;
    this.settings = configuration.settings;
    this.actionsValidation = '';
    this.matchersValidation = '';
    this.settingsValidation = '';
    this.valid = true;
  }

  /**
   * @param {RawConfiguration} configuration
   * @return {ValidatedConfiguration}
   */
  static fromRawConfiguration(configuration) {
    const result = new ValidatedConfiguration(new Configuration());

    try {
      result.actions = StorageFromJson.actions(configuration.actions);
    } catch (e) {
      result.actionsValidation = e.message;
      result.valid = false;
    }

    try {
      result.matchers = StorageFromJson.matchers(configuration.matchers);
    } catch (e) {
      result.matchersValidation = e.message;
      result.valid = false;
    }

    try {
      result.settings = StorageFromJson.settings(configuration.settings);
    } catch (e) {
      result.settingsValidation = e.message;
      result.valid = false;
    }

    return result.valid ? ValidatedConfiguration.fromConfiguration(result) : result;
  }

  /**
   * @param {Configuration} configuration
   * @return {ValidatedConfiguration}
   */
  static fromConfiguration(configuration) {
    const result = (configuration instanceof ValidatedConfiguration) ? configuration : new ValidatedConfiguration(configuration);

    try {
      result.actions.forEach((a) => a.validate());
    } catch (e) {
      result.actionsValidation = e.message;
      result.valid = false;
    }

    try {
      result.matchers.forEach((m) => m.validate());
    } catch (e) {
      result.matchersValidation = e.message;
      result.valid = false;
    }

    try {
      result.settings.validate();
    } catch (e) {
      result.settingsValidation = e.message;
      result.valid = false;
    }
    return result;
  }
}

/** StorageFromJson class */
class StorageFromJson {
  /**
   * @param {string} actions
   * @return {Action[]}
   */
  static actions(actions) {
    if (actions.trim().length===0) {
      throw new Error('Actions needs to be an array');
    }
    return this.actionsFromObj(JSON.parse(actions));
  }

  /**
   * @param {Object[]} actionsObj
   * @return {Action[]}
   */
  static actionsFromObj(actionsObj) {
    if (! (actionsObj instanceof Array)) {
      throw new Error('Actions needs to be an array');
    }
    return actionsObj.map((a) => Action.from(a));
  }

  /**
   * @param {string} matchers
   * @return {Matcher[]}
   */
  static matchers(matchers) {
    if (matchers.trim().length===0) {
      throw new Error('Matchers needs to be an array');
    }
    return this.matchersFromObj(JSON.parse(matchers));
  }

  /**
   * @param {Object[]} matchersObj
   * @return {Matcher[]}
   */
  static matchersFromObj(matchersObj) {
    if (! (matchersObj instanceof Array)) {
      throw new Error('Matchers needs to be an array');
    }
    return matchersObj.map((m) => Matcher.from(m)); ;
  }

  /**
   * @param {string} settings
   * @return {Settings}
   */
  static settings(settings) {
    if (settings.trim().length===0) {
      throw new Error('Settings needs to be an Object');
    }
    return this.settingsFromObj(JSON.parse(settings));
  }

  /**
   * @param {Object} settingsObj
   * @return {Settings}
   */
  static settingsFromObj(settingsObj) {
    if (! (settingsObj instanceof Object)) {
      throw new Error('Settings needs to be an Object');
    }
    return Settings.from(settingsObj);
  }
}
