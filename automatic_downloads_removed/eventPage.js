/**
 * @param {string} newState
 * @return {void}
 */
function scanDownloadsOnState(newState) {
  if (newState === 'idle' || newState === 'locked') {
    console.log(new Date() + ' ScanDownloads OnState: ' + newState);
    chrome.downloads.search({exists: true}, processDownloads);
  }
}

/**
 * @param {chrome.downloads.DownloadItem[]} downloadItems
 * @return {void}
 */
function processDownloads(downloadItems) {
  const timestamp = (new Date()).getTime() - 86400000; // 86400000ms = 24h
  for (let i = 0; i < downloadItems.length; i++) {
    if (downloadItems[i].state === 'complete' && new Date(downloadItems[i].endTime || 0).getTime() < timestamp) {
      console.log(new Date() + ' Deleting: ' + downloadItems[i].filename);
      chrome.downloads.removeFile(downloadItems[i].id);
    } else {
      console.log(new Date() + ' Not deleting: ' + downloadItems[i].filename);
    }
  }
  chrome.downloads.erase({exists: false});
}


chrome.idle.onStateChanged.addListener(scanDownloadsOnState);
