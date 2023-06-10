import {
  closeBlacklistedTabs,
  readBlocklistEntriesMap,
  readLists,
} from './common.js';




// #region CONSTANTS
// =================

const EMODE      = document.getElementById('mode');
const EDURATION  = document.getElementById('duration');
const EPAUSE     = document.getElementById('pause');
const ESTART     = document.getElementById('start');
const EBLOCKLIST = document.getElementById('blocklist');
const MODE_NAMES = new Map();
// #endregion




// #region METHODS
// ===============

// Enable selection of values in dropdowns.
function initDropdown() {
  var dropdowns = document.querySelectorAll('details[role="list"]');
  for (let dropdown of dropdowns) {
    let summary = dropdown.querySelector('summary');
    let ul      = dropdown.querySelector('ul');
    ul.addEventListener('click', e => {
      var value = e.target.getAttribute('data-value');
      summary.textContent = e.target.textContent;
      dropdown.setAttribute('data-value', value);
      dropdown.removeAttribute('open');
      dropdown.dispatchEvent(new Event('change'));
    });
  }
}


// Initialize menu, and handle menu events.
function initMenu(c) {
  for (var li of EMODE.querySelectorAll('li')) {
    var value = li.getAttribute('data-value');
    MODE_NAMES.set(value, li.textContent);
  }
  if (c.mode) {
    EMODE.setAttribute('data-value', c.mode);
    summary.textContent = MODE_NAMES.get(c.mode);
  }
  EMODE.addEventListener('change', () => {
    c.mode = EMODE.getAttribute('data-value');
    chrome.storage.session.set({mode: c.mode});
  });
  EPAUSE.addEventListener('click', () => {
    c.paused = !c.paused;
    chrome.storage.session.set({paused: c.paused});
    updateMenu(c);
  });
  ESTART.addEventListener('click', async () => {
    c.started = !c.started;
    if (!c.started) c.paused = false;
    chrome.storage.session.set({started: c.started, paused: c.paused});
    updateMenu(c);
    var {whitelist, blacklist} = await readLists();
    closeBlacklistedTabs(whitelist, blacklist);
  });
  updateMenu(c);
}


// Update menu based on current state.
function updateMenu(c) {
  if (c.started) {
    EDURATION.disabled = !c.paused;
    EPAUSE.disabled = false;
    EPAUSE.textContent = c.paused? 'Resume' : 'Pause';
    ESTART.textContent = 'Stop';
  }
  else {
    EDURATION.disabled = false;
    EPAUSE.disabled = true;
    EPAUSE.textContent = 'Pause';
    ESTART.textContent = 'Start';
  }
  EBLOCKLIST.textContent = c.blocklist.text;
}


// Main function.
async function main() {
  var c = await chrome.storage.session.get(['mode', 'started', 'paused']);
  var b = await readBlocklistEntriesMap(['main']);
  c.blocklist = b.main;
  initDropdown();
  initMenu(c);
}
main();
// #endregion
