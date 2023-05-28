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
    var tab = await chrome.tabs.get(tabId);
    if (mode!=='ruthless') return;
    if(tab.url=='chrome://newtab/') {
      return;
    }
    console.log("testing")
    console.log(await testFunction())
    if (!isUrlBlacklisted(tab.url)) return;
    try { if (tab && tab.id) await chrome.tabs.remove(tab.id); }
    catch (e) { console.error(e); }
  });
}
main();
// #endregion
