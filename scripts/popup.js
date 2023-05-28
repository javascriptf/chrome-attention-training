import {
  HTTPS,
  isUrlBlacklisted,
  getMode, 
  setMode, 
  addBlockList, 
  getBlockList, 
  getClientTimeZone, 
  checkIfTimeHasFinished, 
  toggleDefaultList,
  DEFAULT_BLACKLIST
} from './common.js';




// #region METHODS
// ===============

/**
 * Main function.
 * @returns {Promise<void>}
 */
async function main() {
  
  var mode = await getMode();
  var blockList = await getBlockList()

  var btnMode = document.querySelector('#modeToggle');
  var btnShowBL = document.querySelector('#show-bl-btn')
  var btnAddBL = document.querySelector('#add-bl')
  var toggleAddDefault = document.querySelector('#toggleAddDefault')
  var textBLItem = document.querySelector('#bl-item')

  btnMode.checked = (mode === 'ruthless')
  // var buttonGetDate = document.querySelector('#get-date')
  // buttonMode.textContent = mode.toUpperCase();

  btnMode.addEventListener('click', async () => {
    // Toggle focus mode.
    var mode = await getMode();
    if(btnMode.checked){
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

  btnAddBL.addEventListener('click', async () => {
    let item = document.querySelector('#bl-item').value
    await addBlockList(item)
    textBLItem.value = ''
  })

  btnShowBL.addEventListener('click', async () => {
    blockList = await getBlockList()
    document.querySelector('#bl').innerHTML = '';
    let isDeafultSelected = toggleAddDefault.checked
    if(isDeafultSelected){
      blockList = [...blockList,"DEFAULT LIST"]
      // let list = [...blockList,...DEFAULT_BLACKLIST]
      // await chrome.storage.local.set({list})
    }

    if(blockList){
      blockList.map((item) => {
        let li = document.createElement("li");
        li.innerText = item
        document.querySelector('#bl').appendChild(li)
      })
    }
  })

  textBLItem.addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
      btnAddBL.click();
    }
});


toggleAddDefault.addEventListener('click', async () => {
  await toggleDefaultList(toggleAddDefault.checked)
})

// buttonGetDate.addEventListener('click', async ()=> {
//   var cdate = await getClientTimeZone()
//   var haspassed = await checkIfTimeHasFinished(cdate.getTime())
//   console.log(cdate.getTime())
//   console.log("from internet")
//   console.log(haspassed.getTime())
// })
}

main();
// #endregion
