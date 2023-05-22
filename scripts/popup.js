import {HTTPS, isUrlBlacklisted, getMode, setMode, addBlockList, getBlockList} from './common.js';




// #region METHODS
// ===============

/**
 * Main function.
 * @returns {Promise<void>}
 */
async function main() {
  
  var mode = await getMode();
  var blockList = await getBlockList()
  console.log("Blocklist")
  console.log(blockList)
  var buttonMode = document.querySelector('#modeToggle');
  var buttonShowBL = document.querySelector('#show_block_list_btn')
  var buttonAddBL = document.querySelector('#add_blocklist')
  buttonMode.textContent = mode.toUpperCase();

  buttonMode.addEventListener('click', async () => {
    // Toggle focus mode.
    var mode = await getMode();
    var mode = mode==='ruthless'? 'disabled' : 'ruthless';
    buttonMode.textContent = mode.toUpperCase();
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

  buttonAddBL.addEventListener('click', async () => {
    let item = document.querySelector('#bl-item').value
    await addBlockList(item)
  })

  buttonShowBL.addEventListener('click', async () => {
    blockList = await getBlockList()
    document.querySelector('#block-list').innerHTML = '';

    if(blockList){
      blockList.map((item) => {
        let li = document.createElement("li");
        li.innerText = item
        document.querySelector('#block-list').appendChild(li)
      })
    }
  })

}

main();
// #endregion
