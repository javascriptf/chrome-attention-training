import {HTTPS, isUrlBlacklisted, getMode, setMode} from './common.js';




// #region METHODS
// ===============

/**
 * Main function.
 * @returns {Promise<void>}
 */
async function main() {
  var mode = await getMode();
  var button = document.querySelector('button');
  button.textContent = mode.toUpperCase();
  button.addEventListener('click', async () => {
    // Toggle focus mode.
    var mode = await getMode();
    var mode = mode==='ruthless'? 'disabled' : 'ruthless';
    button.textContent = mode.toUpperCase();
    await setMode(mode);
    // Close blacklisted tabs.
    if (mode!=='ruthless') return;
    var tabs  = await chrome.tabs.query({url: HTTPS});
    var blacklistedTabs = [], whitelistedTab = null;
    for (var tab of tabs) {
      if (isUrlBlacklisted(tab.url)) blacklistedTabs.push(tab);
      else whitelistedTab = tab;
    }
    if (blacklistedTabs.length===0) return;
    if (!whitelistedTab) whitelistedTab = chrome.tabs.create({});
    chrome.tabs.update(whitelistedTab.id, {active: true});
    for (var tab of blacklistedTabs) {
      try { if (tab && tab.id) await chrome.tabs.remove(tab.id); }
      catch (e) { console.error(e); }
    }
  });
}
main();
// #endregion
