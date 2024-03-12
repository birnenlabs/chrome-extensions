import {Action} from '../classes/action.js';
import {Matcher} from '../classes/matcher.js';
import {Position} from '../classes/position.js';
import {checkNonUndefined} from '../utils/preconditions.js';

/**
 * Creates examples of action and matcher to be displayed on the page.
 */
function createValidatedExamples() {
  const actionExample = new Action();
  actionExample.comment = 'An example Action definition';
  actionExample.id = 'action-id';
  actionExample.display = 'display-name';
  actionExample.column = new Position();
  actionExample.column.start = 0;
  actionExample.column.end = '100%';
  actionExample.row = new Position();
  actionExample.row.start = 0;
  actionExample.row.end = '100%';
  actionExample.shortcutId = 0;
  actionExample.menuName = '';

  const matcherExample = new Matcher();
  matcherExample.comment = 'An example Matcher definition';
  matcherExample.actions = ['action-id'];
  matcherExample.windowTypes = ['normal'];
  matcherExample.anyTabUrl = 'https://example.org/';
  matcherExample.minTabsNum = 0;
  matcherExample.maxTabsNum = 1000000;

  const actionExampleEl = checkNonUndefined(document.getElementById('actionExample'));
  const matcherExampleEl = checkNonUndefined(document.getElementById('matcherExample'));

  try {
    actionExample.validate();
    actionExampleEl.textContent = JSON.stringify(actionExample, undefined, 2);
  } catch (e) {
    actionExampleEl.textContent = 'Invalid example (most likely bug in the code):\n' + e.message;
  }

  try {
    matcherExample.validate();
    matcherExampleEl.textContent = JSON.stringify(matcherExample, undefined, 2);
  } catch (e) {
    matcherExampleEl.textContent = 'Invalid example (most likely bug in the code):\n' + e.message;
  }
}

document.addEventListener('DOMContentLoaded', createValidatedExamples);
