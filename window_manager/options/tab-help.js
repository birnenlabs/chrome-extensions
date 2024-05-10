import {checkNonUndefined} from '../jslib/js/preconditions.js';

/**
 * @param {string} md
 * @return {string}
 */
function parseMd(md) {
  let result = md;

  // Headers - some of them are commented out as they are not used.
  result = result
      // .replaceAll(/(^|\n)#{6} ([^\n]*)\n/g, '\n<h6>$2</h6>\n')
      // .replaceAll(/(^|\n)#{5} ([^\n]*)\n/g, '\n<h5>$2</h5>\n')
      // .replaceAll(/(^|\n)#{4} ([^\n]*)\n/g, '\n<h4>$2</h4>\n')
      .replaceAll(/(^|\n)#{3} ([^\n]*)\n/g, '\n<h3>$2</h3>\n')
      .replaceAll(/(^|\n)#{2} ([^\n]*)\n/g, '\n<h2>$2</h2>\n')
      // .replaceAll(/(^|\n)#{1} ([^\n]*)\n/g, '\n<h1>$2</h1>\n')
  ;

  // Lists
  result = result
      .replaceAll(/(^|\n)- ([^\n]*)/g, '<ul><li>$2</li></ul>')
      .replaceAll('</ul><ul>', '');

  // source code
  result = result
      .replaceAll(/(^|\n)```([^`]*)\n```\n/g, '<pre class="code">$2</pre>')
      .replaceAll(/`([^`]*)`/g, '<span class="code">$1</span>');

  // New lines
  result = result.replaceAll(/\n\n/g, '<p>\n');

  // Bold and italics
  result = result
      .replaceAll(/\*\*([^\*]*)\*\*/g, '<b>$1</b>')
      .replaceAll(/_([^_]*)_/g, '<i>$1</i>');

  // Links
  result = result.replaceAll(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  return result;
}

/**
 * @return {Promise<void>}
 */
function onPageLoad() {
  const helpContent = checkNonUndefined(document.getElementById('helpContent'));

  return fetch(chrome.runtime.getURL('../README.md'))
      .then((resp) => resp.text())
      .then((md) => parseMd(md))
      .then(((resp) => helpContent.innerHTML = resp))
      .then(() => undefined);
}


document.addEventListener('DOMContentLoaded', onPageLoad);
