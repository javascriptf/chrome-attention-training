import {isUrlBlacklisted, getMode} from './common.js';




// #region METHODS
// ===============

/**
 * Main function.
 * @returns {Promise<void>}
 */
async function main() {
  // NOTE: There is also a chrome.tabs.onActivated event.
  // When a tab is updated, check if it is blacklisted, and close it if so.
  chrome.tabs.onUpdated.addListener(async (tabId) => {
    var mode = await getMode();
    if (mode!=='ruthless') return;
    var tab = await chrome.tabs.get(tabId);
    if(tab.url){
    if (!isUrlBlacklisted(tab.url)) return;
    try { if (tab && tab.id) await chrome.tabs.remove(tab.id); }
    catch (e) { console.error(e); }
    }
  });
}
main();
// #endregion
