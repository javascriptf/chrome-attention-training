import {
  HTTPS,
  readLists,
  importBlocklist,
  selectBlocklist,
  isUrlBlacklisted,
  writeBlocklistEntriesMap,
  parseBlocklistEntries,
} from './common.js';




// #region CONSTANTS
// =================

/** Is URL not a web page? */
const RNOTWEB = /$chrome:|$opera:|$https:\/\/ntp.msn.com\//;

/** Global state (interesting ones only). */
const S = {
  mode: 0,
  paused:  false,
  started: false,
  whitelist: [],
  blacklist: [],
};
// #endregion




// #region METHODS
// ===============

// #region UTILITY
// ---------------

// Close specified tabs.
function closeTabs(tabs) {
  for (let tab of tabs) {
    try { if (tab && tab.id) chrome.tabs.remove(tab.id).then(() => console.log(`Closed tab ${tab.url}`)); }
    catch (e) { console.error(e); }
  }
}


/**
 * Close all blacklisted tabs.
 * @param {string[]} whitelist whitelist
 * @param {string[]} blacklist blacklist
 * @returns {Promise<void>}
 */
export async function closeBlackTabs(whitelist, blacklist) {
  var blackTabs = [], whiteTab  = null;
  var tabs = await chrome.tabs.query({url: HTTPS});
  // Find all blacklisted tabs, and the first non-blacklisted tab.
  for (var tab of tabs) {
    if (isUrlBlacklisted(tab.url, whitelist, blacklist)) blackTabs.push(tab);
    else whiteTab = tab;
  }
  if (blackTabs.length === 0) return;
  // Close all blacklisted tabs, and open a new one if necessary.
  if (!whiteTab) whiteTab = chrome.tabs.create({});
  chrome.tabs.update(whiteTab.id, {active: true});
  closeTabs(blackTabs);
}
// #endregion




// #region MAIN
// ------------

// Read state from session storage.
async function readState(S) {
  var c = await chrome.storage.session.get(['mode', 'paused', 'started']);
  S.mode    = c.mode    || 0;
  S.paused  = c.paused  || false;
  S.started = c.started || false;
}


// Update blocklist from text.
async function updateBlocklist(S, text) {
  var entries = parseBlocklistEntries(text);
  await writeBlocklistEntriesMap({['main']: entries});
  await selectBlocklist('main');
  Object.assign(S, await readLists());
}


// Initialize background activities.
function initBackground(S) {
  // Message passing from popup.js.
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(`Message received: ${request.type}`);
    switch (request.type) {
      case 'updateBlocklist':
        updateBlocklist(S, request.text);
        break;
      case 'closeBlackTabs':
        closeBlackTabs(S.whitelist, S.blacklist);
        break;
    }
  });
  // When a tab is updated, check if it is blacklisted, and close it if so.
  // NOTE: There is also a chrome.tabs.onActivated event.
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    console.log(`Tab ${tabId} updated.`);
    if (changeInfo.status !== 'complete') return;
    await readState(S);
    if (!S.started || S.paused) return;
    var  tab = await chrome.tabs.get(tabId);
    if (!tab || RNOTWEB.test(tab.url)) return;
    if (!isUrlBlacklisted(tab.url, S.whitelist, S.blacklist)) return;
    closeTabs([tab]);
  });
}


// Main function.
async function main(S) {
  console.log('Background started.');
  var icon = chrome.runtime.getURL('icons/128.png');
  await importBlocklist('Default', icon, 'default');
  await importBlocklist('Main'   , icon, 'main');
  await selectBlocklist('main');
  Object.assign(S, await readLists());
  await readState(S);
  initBackground(S);
}
main(S);
// #endregion
