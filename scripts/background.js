import {isUrlBlacklisted, getMode, getLists} from './common.js';



// #region CONSTANTS
// =================

/** Is URL not a web page? */
const RNOTWEB = /$chrome:|$opera:|$https:\/\/ntp.msn.com\//;
// #endregion




// #region METHODS
// ===============

/**
 * Main function.
 * @returns {Promise<void>}
 */
async function main() {
  // NOTE: There is also a chrome.tabs.onActivated event.
  // When a tab is updated, check if it is blacklisted, and close it if so.
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (changeInfo.status!=='complete') return;
    var mode = await getMode();
    var tab  = await chrome.tabs.get(tabId);
    if (!tab || !tab.url || RNOTWEB.test(tab.url)) return;
    if (mode!=='ruthless') return;
    var {whitelist, blacklist, useDefault} = await getLists();
    if (!isUrlBlacklisted(tab.url, whitelist, blacklist, useDefault)) return;
    try { chrome.tabs.remove(tabId).then(() => console.log(`main(): Closed tab ${tab.url}`)); }
    catch (err) { console.error(err); }
  });
}
main();
// #endregion
