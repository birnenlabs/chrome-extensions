import {checkNonEmpty} from '../utils/preconditions.js';

/**
 * Loads the config, and sets up editors.
 */
function onPageLoad() {
  Array.from(document.getElementsByTagName('iframe')).forEach(setupIframeResizer);
  document.querySelectorAll('.tab-button').forEach((el) => el.addEventListener('click', onTabClick));
}

/**
 * Handles click on button of tab-button class.
 *
 * @param {Event} event
 * @return {void}
 */
function onTabClick(event) {
  const eventTarget = /** @type {HTMLButtonElement} */ (checkNonEmpty(event.target));

  const tabButtonId = eventTarget.id;
  const tabPanelId = eventTarget.id.slice(0, -6) + 'Tab';
  // Get all buttons
  document.querySelectorAll('.tab-button')
      .forEach((/** @type {HTMLElement} */el) => (el.id == tabButtonId ? el.classList.add('tab-button-active') : el.classList.remove('tab-button-active')));
  document.querySelectorAll('.tab-panel')
      .forEach((/** @type {HTMLElement} */el) => (el.style.display = (el.id == tabPanelId ? 'block' : 'none')));
}

/**
 * Sets resizer on all iframes. The height of an iframe will be
 * automatically adjusted to its content.
 *
 * @param {HTMLIFrameElement} iframeEl
 * @return {void}
 */
function setupIframeResizer(iframeEl) {
  const iframeBody = checkNonEmpty(iframeEl.contentDocument).body;
  // Without this setting, body size was not shrinking after removing table rows.
  iframeBody.style.height = 'fit-content';

  const ro = new ResizeObserver(function() {
    // Without this line iframe never shrinks.
    iframeEl.style.height = '0';
    iframeEl.style.height = `${iframeBody.scrollHeight + 1}px`;
  });

  ro.observe(iframeBody);
}

document.addEventListener('DOMContentLoaded', onPageLoad);
