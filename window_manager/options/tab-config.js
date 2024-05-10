import {RawConfiguration, ValidatedConfiguration} from '../classes/configuration.js';
import {Storage} from '../classes/storage.js';
import {checkNonUndefined} from '../jslib/js/preconditions.js';
import {promiseTimeout} from '../jslib/js/promise.js';
import * as StandaloneJsonEditor from '../jsoneditor/standalone.js';
import * as schemaValidator from '../jsoneditor/schema-validator.js';

/**
 * @typedef {import('ajv').default} Ajv
 * @typedef {import('vanilla-jsoneditor/standalone.js').Validator} Validator
 */

/** @type {StandaloneJsonEditor.JSONEditor} */
let actionsEditor;
/** @type {StandaloneJsonEditor.JSONEditor} */
let matchersEditor;

/**
 * Returns a JSONEditor schema validator wrapping a precomiled AJV Schema
 * validator.
 *
 * This is a hack around the JsonEditor's lack of support for precompiled
 * schema validators. It only supports on-demand compiled validators, and these
 * cannot be used because chrome extensions do not support eval()
 *
 * This function creates a stub replacement for the Ajv instance created by the
 * JsonEditor, providing the minimum required properties which include a
 * compile() function that returns the precompiled AJV validator.
 *
 * This stub is then returned from an onCreateAjv function passed as an option
 * to JSONEditor's {@link StandaloneJsonEditor.createAjvValidator}.
 *
 * The JSONEditor {@link StandaloneJsonEditor.createAjvValidator} function is still required because
 * it enhances the errors returned by the AJV validator function
 *
 * @see https://github.com/josdejong/svelte-jsoneditor/blob/main/src/lib/plugins/validator/createAjvValidator.ts#L46
 *
 * @param {Function} validateFunction AJV schema validator.
 * @return {Validator} JSONEditor wrapped schema validator.
 */
function createAjvValidatorForPrecompiled(validateFunction) {
  // Create a stub Ajv instance providing the minimum required properties
  // needed by the JSONEditor.
  /** @type{Ajv} */
  const stubAjv = {
    // @ts-expect-error
    opts: {
      verbose: true,
    },
    // @ts-expect-error
    compile: () => {
      return validateFunction;
    },
  };

  return StandaloneJsonEditor.createAjvValidator(
      {
        schema: {},
        onCreateAjv: () => {
          return stubAjv;
        },
      });
}

/**
 * Builds a JSONEditor for the given parameters.
 *
 * @param {String} elementId
 * @param {*} initialValue
 * @param {Function} precompiledValidator
 * @return {StandaloneJsonEditor.JSONEditor}
 */
function createJSONEditorForElement(elementId, initialValue, precompiledValidator) {
  return new StandaloneJsonEditor.JSONEditor({
    target: checkNonUndefined(document.getElementById(elementId)),
    props: {
      content: {json: initialValue},
      mode: StandaloneJsonEditor.Mode.text,
      navigationBar: false,
      validator: createAjvValidatorForPrecompiled(precompiledValidator),
    },
  });
}

/**
 * @param {StandaloneJsonEditor.JSONEditor} editor
 * @return {String}
 */
function getJsonTextFromEditor(editor) {
  const content = editor.get();

  // content can contain either text or json properties, depending
  // on whether the text is valid JSON or where the user
  // is in the JSONEditor UI.
  if ('text' in content && content.text != null) {
    return content.text;
  } if ('json' in content && content.json != null) {
    return JSON.stringify(content.json);
  } else {
    throw new Error('unexpected content from json Editor: '+JSON.stringify(content));
  }
}

/**
 * Performs validation of input data.
 *
 * @return {Promise<ValidatedConfiguration>}
 * @throws {SyntaxError} on invalid JSON
 */
function validate() {
  // Settings are not modified by this page. Let's refresh from the storage.
  return Storage.getRawConfiguration()
      .then((rawConfig) => ({
        actions: getJsonTextFromEditor(actionsEditor),
        matchers: getJsonTextFromEditor(matchersEditor),
        settings: rawConfig.settings,
      }))
      .then((s) => RawConfiguration.fromString(s))
      .then((r) => ValidatedConfiguration.fromRawConfiguration(r))
      .then((conf) => validateCheckEditors(conf))
      .then((conf) => validateActionIdsAreDefined(conf))
      .then((conf) => validateSetStatuses(conf));
}

/**
 * Checks if json editors are valid.
 *
 * @param {ValidatedConfiguration} config
 * @return {ValidatedConfiguration}
 */
function validateCheckEditors(config) {
  if (actionsEditor.validate() !== null || matchersEditor.validate() !== null) {
    config.valid = false;
  }
  return config;
}

/**
 * Check if actions used in matchers are defined.
 *
 * @param {ValidatedConfiguration} config
 * @return {ValidatedConfiguration}
 */
function validateActionIdsAreDefined(config) {
  // This check is performed only if config is valid.
  if (config.valid) {
    // find ids that are defined in matchers but not in actions.
    const validActionIds = new Set(config.actions.map((a) => a.id));
    const invalidActionIds = [...new Set(config.matchers.map((m)=> m.actions).flat())].filter((a) => !validActionIds.has(a));

    if (invalidActionIds.length > 0) {
      config.valid = false;
      config.matchersValidation = `Matchers refer to unknown Action ids: ${invalidActionIds}.`;
    }
  }
  return config;
}

/**
 * Sets validation statuses widgets on page.
 *
 * @param {ValidatedConfiguration} config
 * @return {ValidatedConfiguration}
 */
function validateSetStatuses(config) {
  checkNonUndefined(document.getElementById('actionsStatus')).textContent = config.actionsValidation;
  checkNonUndefined(document.getElementById('matchersStatus')).textContent = config.matchersValidation;
  return config;
}

/**
 * @return {Promise<void>}
 */
function onPageLoad() {
  actionsEditor = createJSONEditorForElement('actionsInput', [], schemaValidator.actions);
  matchersEditor = createJSONEditorForElement('matchersInput', [], schemaValidator.matchers);

  return Storage.getRawConfiguration().then((config) => {
    actionsEditor.set({text: config.actions});
    matchersEditor.set({text: config.matchers});
    // Make editors visible.
    [...document.getElementsByClassName('jsonEditor')].forEach(
        (/** @type {HTMLElement} */ e) => e.style.display='');
    // Remove "Loading" messages.
    [...document.getElementsByClassName('loading')].forEach(
        (/** @type {HTMLElement} */ e) => e.style.display='none');
  })
      .then(() => validate())
      .then(() => undefined);
}


/**
 * @param {KeyboardEvent} event
 * @return {Promise<void> | void}
 */
function onKeyDown(event) {
  if (event.key === 's' && !event.shiftKey && !event.altKey &&
          // ctrl or mac-command=meta-key
          ( (event.ctrlKey && !event.metaKey) ||
            (!event.ctrlKey && event.metaKey))) {
    // Ctrl-S or CMD-S pressed
    event.preventDefault();
    return onSaveClick();
  }
}

/** @return {Promise<void>} */
function onSaveClick() {
  const saveBtn = checkNonUndefined(document.getElementById('saveButton'));
  const statusEl = checkNonUndefined(document.getElementById('generalStatus'));
  saveBtn.style.display = 'none';

  return validate()
      .then((validatedConfig) => Storage.saveConfiguration(validatedConfig))
      .then(() => statusEl.textContent = 'Options saved')
      .then(() => undefined)
      .catch((e) => statusEl.textContent = e.message)
      .finally(() => promiseTimeout(3000, undefined)
          .then(() => saveBtn.style.display = '')
          .then(() => statusEl.textContent = ''));
}

document.addEventListener('DOMContentLoaded', onPageLoad);

document.addEventListener('keydown', onKeyDown);
checkNonUndefined(document.getElementById('saveButton')).addEventListener('click', onSaveClick);
