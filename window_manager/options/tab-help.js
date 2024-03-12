import {checkNonUndefined} from '../utils/preconditions.js';

const RULES = [
  // headers
  [/(^|\n)#{6} ([^\n]*)\n/g, '\n<h6>$2</h6>\n'],
  [/(^|\n)#{5} ([^\n]*)\n/g, '\n<h5>$2</h5>\n'],
  [/(^|\n)#{4} ([^\n]*)\n/g, '\n<h4>$2</h4>\n'],
  [/(^|\n)#{3} ([^\n]*)\n/g, '\n<h3>$2</h3>\n'],
  [/(^|\n)#{2} ([^\n]*)\n/g, '\n<h2>$2</h2>\n'],
  [/(^|\n)#{1} ([^\n]*)\n/g, '\n<h1>$2</h1>\n'],
  
  // source code
  [/(^|\n)```([^`]*)\n```\n/g, '<pre>$2</pre>'],
  [/`([^`]*)`/g,               '<pre>$1</pre>'],
]

const aa= [
  //bold, italics and paragragh rules
  [/\*\*\s?([^\n]+)\*\*/g, "<b>$1</b>"],
  [/\*\s?([^\n]+)\*/g, "<i>$1</i>"],
  [/__([^_]+)__/g, "<b>$1</b>"],
  [/_([^_`]+)_/g, "<i>$1</i>"],
  [/([^\n]+\n?)/g, "<p>$1</p>"],
  
  //links
  [
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" style="color:#2A5DB0;text-decoration: none;">$1</a>',
  ],
  
  //highlights
  [
    /(`)(\s?[^\n,]+\s?)(`)/g,
    '<a style="background-color:grey;color:black;text-decoration: none;border-radius: 3px;padding:0 2px;">$2</a>',
  ],
 
  //Lists
  [/([^\n]+)(\+)([^\n]+)/g, "<ul><li>$3</li></ul>"],
  [/([^\n]+)(\*)([^\n]+)/g, "<ul><li>$3</li></ul>"],

  //Image
  [
    /!\[([^\]]+)\]\(([^)]+)\s"([^")]+)"\)/g,
    '<img src="$2" alt="$1" title="$3" />',
  ],
];


function parseMd(md) {
  let result = md;
  
  // Headers - some of them are commented out as they are not used.
  result = result
      // .replaceAll(/(^|\n)#{6} ([^\n]*)\n/g, '\n<h6>$2</h6>\n')
      // .replaceAll(/(^|\n)#{5} ([^\n]*)\n/g, '\n<h5>$2</h5>\n')
      // .replaceAll(/(^|\n)#{4} ([^\n]*)\n/g, '\n<h4>$2</h4>\n')
      .replaceAll(/(^|\n)#{3} ([^\n]*)\n/g, '\n<h3>$2</h3>\n')
      .replaceAll(/(^|\n)#{2} ([^\n]*)\n/g, '\n<h2>$2</h2>\n')
      // .replaceAll(/(^|\n)#{1} ([^\n]*)\n/g, '\n<h1>$2</h1>\n');
  
  // Lists
  result = result
      .replaceAll(/(^|\n)- ([^\n]*)/g, '<ul><li>$2</li></ul>')
      .replaceAll('</ul><ul>', '');
  
  // source code
  result = result
      .replaceAll(/(^|\n)```([^`]*)\n```\n/g, '<pre>$2</pre>')
      .replaceAll(/`([^`]*)`/g,               '<span class="code">$1</span>');
  
  // New lines
  result = result.replaceAll(/\n\n/g, '<p>\n');
  
  // Blockquotes
  result = result
      .replaceAll(/(^|\n)> ([^\n]*)/g, '<blockquote>$2</blockquote>')
      .replaceAll('</blockquote><blockquote>', '<br>');

  // Bold and italics
  result = result
    .replaceAll(/\*\*([^\*]*)\*\*/g, '<b>$1</b>')
    .replaceAll(/_([^_]*)_/g, '<i>$1</i>')
  
  // Links
  result = result.replaceAll(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  return result;
}

function onPageLoad() {
  checkNonUndefined(document.getElementById('helpContent'));

  fetch(chrome.runtime.getURL('../README.md'))
    .then((resp) => resp.text())
    .then(parseMd)
    .then((resp => helpContent.innerHTML = resp))
}



document.addEventListener('DOMContentLoaded', onPageLoad);
