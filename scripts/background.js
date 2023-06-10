import {
  isUrlBlacklisted,
  readMode,
  readLists,
  importBlocklist,
  readBlocklistEntriesMap,
  selectBlocklist,
} from './common.js';




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
    var c = await chrome.storage.session.get(['mode', 'paused', 'started']);
    if (!c.started || c.paused) return;
    var tab  = await chrome.tabs.get(tabId);
    if (!tab || !tab.url || RNOTWEB.test(tab.url)) return;
    var {whitelist, blacklist} = await readLists();
    if (!isUrlBlacklisted(tab.url, whitelist, blacklist)) return;
    try { chrome.tabs.remove(tabId).then(() => console.log(`main(): Closed tab ${tab.url}`)); }
    catch (err) { console.error(err); }
  });
  var icon = chrome.runtime.getURL('icons/128.png');
  await importBlocklist('Default', icon, 'default');
  await importBlocklist('Main'   , icon, 'main');
  await selectBlocklist('main');
}
main();
// #endregion
