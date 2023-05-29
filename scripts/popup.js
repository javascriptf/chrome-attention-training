import {
  HTTPS,
  isUrlBlacklisted,
  getMode,
  setMode,
  getLists,
  setLists,
  setUseDefault,
} from './common.js';




// #region METHODS
// ===============

/**
 * Close all blacklisted tabs.
 * @param {string[]} whitelist whitelist
 * @param {string[]} blacklist blacklist
 * @param {boolean} useDefault use default lists?
 * @returns {Promise<void>}
 */
async function closeBlacklistedTabs(whitelist, blacklist, useDefault) {
  var blacklistedTabs = [], whitelistedTab = null;
  var tabs = await chrome.tabs.query({url: HTTPS});
  for (var tab of tabs) {
    if (isUrlBlacklisted(tab.url, whitelist, blacklist, useDefault)) blacklistedTabs.push(tab);
    else whitelistedTab = tab;
  }
  if (blacklistedTabs.length===0) return;
  // If there is no whitelisted tab, create one.
  if (!whitelistedTab) whitelistedTab = chrome.tabs.create({});
  chrome.tabs.update(whitelistedTab.id, {active: true});
  // Close all blacklisted tabs.
  for (let tab of blacklistedTabs) {
    try { if (tab && tab.id) chrome.tabs.remove(tab.id).then(() => console.log(`closeBlacklistedTabs(): Closed tab ${tab.url}`)); }
    catch (err) { console.error(err); }
  }
}


/**
 * Main function.
 * @returns {Promise<void>}
 */
async function main() {
  var mode = await getMode();
  var {whitelist, blacklist, useDefault} = await getLists();
  var xmode    = document.querySelector('#mode');
  var xbl      = document.querySelector('#bl');
  var xblShow  = document.querySelector('#bl-show');
  var xblAdd   = document.querySelector('#bl-add');
  var xblItem  = document.querySelector('#bl-item');
  var xuseDefault = document.querySelector('#use-default');
  // var xdateGet = document.querySelector('#date-get')
  // Setup popup view.
  xmode.textContent   = mode==='ruthless'? 'Stop' : 'Start Blocking';
  xuseDefault.checked = useDefault;

  // Toggle focus mode.
  xmode.addEventListener('click', async () => {
    var mode = await getMode();
    // Udapte popup view.
    mode = mode==='ruthless'? 'disabled' : 'ruthless';
    xmode.textContent = mode==='ruthless'? 'Stop' : 'Start Blocking';
    // Set mode, and close all blacklisted tabs.
    await setMode(mode);
    if (mode==='ruthless') closeBlacklistedTabs(whitelist, blacklist, useDefault);
  });

  // Add item to blacklist.
  xblAdd.addEventListener('click', () => {
    var item = xblItem.value;
    xblItem.value = '';
    if (!blacklist.includes(item)) blacklist.push(item);
    setLists({whitelist, blacklist, useDefault});
  })

  // Show blacklist.
  xblShow.addEventListener('click', () => {
    xbl.innerHTML = '';
    for (var item of blacklist) {
      var li = document.createElement('li');
      li.innerText = item;
      xbl.appendChild(li);
    }
  });

  // Add item to blacklist.
  xblItem.addEventListener('keyup', event => {
    event.preventDefault();
    // On enter, add item to blacklist.
    if (event.keyCode===13) xblAdd.click();
  });

  // Use default list?
  xuseDefault.addEventListener('click', async () => {
    setUseDefault(xuseDefault.checked);
  })

  // buttonGetDate.addEventListener('click', async ()=> {
  //   var cdate = await getClientTimeZone()
  //   var haspassed = await checkIfTimeHasFinished(cdate.getTime())
  //   console.log(cdate.getTime())
  //   console.log("from internet")
  //   console.log(haspassed.getTime())
  // });
}
main();
// #endregion
