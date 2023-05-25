import {HTTPS, isUrlBlacklisted, getMode, setMode, addBlockList, getBlockList, getClientTimeZone, checkIfTimeHasFinished, toggleDefaultList} from './common.js';




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
  var buttonGetDate = document.querySelector('#get-date')
  var toggleAddDefault = document.querySelector('#toggleAddDefault')
  var bl_input = document.querySelector('#bl-item')
  // buttonMode.textContent = mode.toUpperCase();

  buttonMode.addEventListener('click', async () => {
    // Toggle focus mode.
    var mode = await getMode();
    if(buttonMode.checked){
      mode = 'ruthless'
    }else{
      mode = 'disabled'
    }
    // buttonMode.textContent = mode.toUpperCase();
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
    bl_input.value = ''
  })

  buttonShowBL.addEventListener('click', async () => {
    blockList = await getBlockList()
    document.querySelector('#block-list').innerHTML = '';
    let isDeafultSelected = toggleAddDefault.checked
    if(isDeafultSelected){
      blockList = [...blockList,"DEFAULT LIST"]
    }

    if(blockList){
      blockList.map((item) => {
        let li = document.createElement("li");
        li.innerText = item
        document.querySelector('#block-list').appendChild(li)
      })
    }
  })

  bl_input.addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
      buttonAddBL.click();
    }
});

  buttonGetDate.addEventListener('click', async ()=> {
    var cdate = await getClientTimeZone()
    var haspassed = await checkIfTimeHasFinished(cdate.getTime())
    console.log(cdate.getTime())
    console.log("from internet")
    console.log(haspassed.getTime())
  })

  toggleAddDefault.addEventListener('click', async () => {
    // console.log(toggleAddDefault.checked)
    await toggleDefaultList(toggleAddDefault.checked)
  })

}

main();
// #endregion
