import {
  messageRuntime,
  readBlocklistEntriesMap,
} from './common.js';




// #region CONSTANTS
// =================

// Controls.
const HTML        = document.documentElement;
const CONTROLS    = document.getElementById('controls');
const COMODE      = document.getElementById('comode');
const CODURATION  = document.getElementById('coduration');
const COPAUSE     = document.getElementById('copause');
const COSTART     = document.getElementById('costart');
const COBLOCKLIST = document.getElementById('coblocklist');
const COMODE_TEXT = COMODE.querySelector('summary');
const MODE_NAMES  = new Map();

// Tracker.
const TRACKER   = document.getElementById('tracker');
const TRTEXT    = document.getElementById('trtext');

// Blocklist.
const BLOCKLIST = document.getElementById('blocklist');
const BLHIDE    = document.getElementById('blhide');
const BLUPDATE  = document.getElementById('blupdate');
const BLTEXT    = document.getElementById('bltext');

// Global state (interesting ones only).
const S = {
  menu: '',
  mode:      0,
  duration:  0,
  startTime: 0,
  paused:  false,
  started: false,
  blocklist: {},
};
// #endregion




// #region METHODS
// ===============

// #region MAIN
// -----------

// Read state from session storage.
async function readState(S) {
  var c = await chrome.storage.session.get(['menu', 'mode', 'duration', 'startTime', 'paused', 'started']);
  S.menu      = c.menu || '';
  S.mode      = c.mode      || 0;
  S.duration  = c.duration  || 0;
  S.startTime = c.startTime || 0;
  S.paused    = c.paused  || false;
  S.started   = c.started || false;
}


// Read blocklist from local storage.
async function readBlocklist(S) {
  var {main} = await readBlocklistEntriesMap(['main']);
  S.blocklist = main;
}


// Enable selection of values in dropdowns.
function initDropdown() {
  var dropdowns = document.querySelectorAll('details[role="list"]');
  for (let dropdown of dropdowns) {
    let summary = dropdown.querySelector('summary');
    let ul      = dropdown.querySelector('ul');
    ul.addEventListener('click', e => {
      if (e.target.tagName === 'UL') return;
      var value = e.target.getAttribute('data-value');
      summary.textContent = e.target.textContent;
      dropdown.setAttribute('data-value', value);
      dropdown.removeAttribute('open');
      dropdown.dispatchEvent(new Event('change'));
    });
  }
}


// Initialize mode names.
function initModeNames() {
  for (var a of COMODE.querySelectorAll('a')) {
    var value = parseFloat(a.getAttribute('data-value'));
    MODE_NAMES.set(value, a.textContent);
  }
}


// Initialize menu, and handle menu events.
function initMenu(S) {
  if (S.mode) {
    COMODE.setAttribute('data-value', S.mode.toString());
    updateMenu(S);
  }
  COMODE.addEventListener('change', () => {
    S.mode = parseFloat(COMODE.getAttribute('data-value'));
    chrome.storage.session.set({mode: S.mode});
  });
  COPAUSE.addEventListener('click', e => {
    e.preventDefault();
    S.paused = !S.paused;
    chrome.storage.session.set({paused: S.paused});
    if (!S.paused) messageRuntime({type: 'closeBlackTabs'});
    updateMenu(S);
  });
  COSTART.addEventListener('click', e => {
    e.preventDefault();
    S.started = !S.started;
    if (S.started) {
      S.startTime = Date.now();
      S.mode = S.mode || 40;
    }
    else S.paused = false;
    chrome.storage.session.set({started: S.started, paused: S.paused, startTime: S.startTime});
    messageRuntime({type: 'closeBlackTabs'});
    updateMenu(S);
  });
  COBLOCKLIST.addEventListener('click', e => {
    e.preventDefault();
    if (!S.started || S.paused) S.menu = 'blocklist';
    updateMenu(S);
  });
  BLHIDE.addEventListener('click', e => {
    e.preventDefault();
    S.menu = '';
    updateMenu(S);
  });
  BLUPDATE.addEventListener('click', e => {
    e.preventDefault();
    messageRuntime({type: 'updateBlocklist', text: BLTEXT.value});
    S.blocklist.text = BLTEXT.value;
    updateMenu(S);
  });
  updateMenu(S);
}


// Update menu based on current state.
function updateMenu(S) {
  var running = S.started && !S.paused;
  CONTROLS    .hidden = S.menu!=='';
  BLOCKLIST   .hidden = S.menu!=='blocklist';
  TRACKER     .hidden = !running;
  COBLOCKLIST .hidden =  running;
  CODURATION.disabled =  running;
  COPAUSE   .disabled = !S.started;
  COPAUSE.textContent =  S.started && S.paused? 'Resume' : 'Pause';
  COSTART.textContent =  S.started? 'Stop' : 'Start';
  BLTEXT .value = S.blocklist.text;
  console.log(S.mode, MODE_NAMES);
  if (S.mode)  COMODE_TEXT.textContent = MODE_NAMES.get(S.mode);
  if (running) HTML.classList.add   ('running');
  else         HTML.classList.remove('running');
}


// Intialize tracker for activity time and points accrued.
function initTracker(S) {
  setInterval(() => {
    if (!S.started || S.paused) return;
    var now = Date.now();
    var elapsed = now - S.startTime;
    var points  = Math.floor(elapsed / 1000);
    TRTEXT.value = `${points} pts`;
  }, 1000);
}


// Main function.
async function main(S) {
  await readState(S);
  await readBlocklist(S);
  initDropdown();
  initModeNames();
  initMenu(S);
  initTracker(S);
}
main(S);
// #endregion
// #endregion
