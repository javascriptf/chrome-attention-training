import {
  messageRuntime,
  writeBounty,
  readBlocklistEntriesMap,
} from './common.js';




// #region CONSTANTS
// =================

// Navigation.
const HTML        = document.documentElement;
const RANK        = document.getElementById('rank');
const BOUNTY      = document.getElementById('bounty');

// Controls.
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

// Ranks.
const RANKS = [
  'Cadet',
  'Cadet II',
  'Officer',
  'Officer II',
  'Patrolman',
  'Patrolman II',
  'Patrolman III',
  'Trooper',
  'Trooper II',
  'Trooper III',
  'Sergeant',
  'Sergeant II',
  'Sergeant III',
  'Lieutenant',
  'Lieutenant II',
  'Lieutenant III',
  'Undercover',
  'Captain',
  'Pursuit Agent',
  'Ultimate Enforcer',
];

// Global state (interesting ones only).
const S = {
  menu: '',
  bounty:   0,
  mode:     0,
  duration: 0,
  elapsed:  0,
  startBounty: 0,
  startTime:   0,
  paused:  false,
  started: false,
  blocklist: {},
  durationReverse: false,
};
// #endregion




// #region METHODS
// ===============

// #region MAIN
// -----------

// Parse duration in text to milliseconds.
function parseDuration(text) {
  // Early check for invalid cases.
  var re = /([\d\.]+)|(\w+)|[,\s]+/g;
  if (text.replace(re, '').length > 0) return NaN;
  var text  = text.replace(re, ' $1 $2 ').trim().toLowerCase();
  if (text.length===0) return 0;  // Empty string is valid.
  var words = text.split(/\s+/);
  if (words.length % 2!==0) return NaN;
  // Obtain duration in milliseconds.
  var ms = 0;
  for (var i=0; i<words.length; i+=2) {
    var n = parseFloat(words[i]);
    if (isNaN(n)) return NaN;
    var u = words[i+1];
    if (u.startsWith('d')) ms += n*24*60*60*1000;
    if (u.startsWith('h')) ms += n*60*60*1000;
    if (u.startsWith('m')) ms += n*60*1000;
    if (u.startsWith('s')) ms += n*1000;
  }
  return ms;
}


// Stringify duration in milliseconds.
function stringifyDuration(ms) {
  var s = Math.floor(ms/1000);
  var m = Math.floor(s/60); s %= 60;
  var h = Math.floor(m/60); m %= 60;
  var d = Math.floor(h/24); h %= 24;
  var a = '';
  if (d) a += d + ' day ';
  if (h) a += h + ' hour ';
  if (m) a += m + ' min ';
  if (s) a += s + ' sec ';
  return a.trim() || '0 sec';
}


// Get rank from bounty.
function getRank(bounty) {
  var rank = Math.floor(bounty/1000);
  if (rank >= RANKS.length) rank = RANKS.length - 1;
  return RANKS[rank];
}


// Stringify bounty.
function stringifyBounty(bounty) {
  if (bounty > 1E+6) return (bounty/1E+6).toFixed(1) + 'M';
  if (bounty > 1E+3) return (bounty/1E+3).toFixed(1) + 'k';
  return bounty.toString();
}


// Calculate bounty from elapsed time and mode.
function calculateBounty(elapsed, mode) {
  var factor = mode/10;
  console.log('calculateBounty', mode, factor);
  return Math.floor(elapsed*factor/1000);
}


// Read state from session storage.
async function readState(S, local=false) {
  var c = await chrome.storage.session.get([
    'bounty', 'mode', 'duration', 'elapsed', 'startBounty', 'startTime',
    'paused', 'started'
  ]);
  S.bounty   = c.bounty   || (local? await readBounty() : 0);
  S.mode     = c.mode     || 0;
  S.duration = c.duration || 0;
  S.elapsed  = c.elapsed  || 0;
  S.startBounty = c.startBounty || 0;
  S.startTime   = c.startTime   || 0;
  S.paused  = c.paused  || false;
  S.started = c.started || false;
}


// Write state to session storage.
async function writeState(S) {
  await chrome.storage.session.set({
    bounty:   S.bounty,
    mode:     S.mode,
    duration: S.duration,
    elapsed:  S.elapsed,
    startTime:   S.startBounty,
    startTime:   S.startTime,
    paused:  S.paused,
    started: S.started,
  });
}


// Read blocklist from local storage.
async function readBlocklist(S) {
  var {main} = await readBlocklistEntriesMap(['main']);
  S.blocklist = main;
}


// Update elapsed time and bounty accrued.
async function recordElapsed(S, mode=S.mode) {
  var elapsed = Date.now() - S.startTime;
  var bounty  = calculateBounty(elapsed, mode);
  S.bounty   += bounty;
  S.elapsed  += elapsed;
  S.startTime = Date.now();
  // await writeState(S);
  await writeBounty(S.bounty);
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
    if (S.started && !S.paused) recordElapsed(S, S.mode);
    S.mode = parseFloat(COMODE.getAttribute('data-value'));
    writeState(S);
  });
  CODURATION.addEventListener('change', () => {
    S.duration = parseDuration(CODURATION.value);
    writeState(S);
    updateMenu(S);
  });
  CODURATION.addEventListener('click', () => {
    if (S.running) S.durationReverse = !S.durationReverse;
    updateMenu(S);
  });
  COPAUSE.addEventListener('click', e => {
    e.preventDefault();
    S.paused = !S.paused;
    if (S.paused) recordElapsed(S);
    else {
      S.startTime = Date.now();
      messageRuntime({type: 'closeBlackTabs'});
    }
    writeState(S);
    updateMenu(S);
  });
  COSTART.addEventListener('click', e => {
    e.preventDefault();
    S.started = !S.started;
    if (S.started) {
      S.mode    = S.mode || 10;
      S.elapsed = 0;
      S.startBounty = S.bounty;
      S.startTime   = Date.now();
    }
    else {
      S.paused = false;
      recordElapsed(S);
    }
    messageRuntime({type: 'closeBlackTabs'});
    writeState(S);
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
  setInterval(() => updateTracker(S), 1000);
  updateMenu(S);
}


// Update tracker based on current state.
function updateTracker(S) {
  if (!S.started || S.paused) return;
  var elapsed = Date.now() - S.startTime;
  var bounty  = calculateBounty(elapsed, S.mode);
  var currentElapsed = S.elapsed + elapsed;
  var currentBounty  = S.bounty  + bounty - S.startBounty;
  if (S.duration>0) {
    var remaining = S.duration - currentElapsed;
    if (S.durationReverse && remaining>0) CODURATION.value = stringifyDuration(remaining) + ' remaining';
    else if (remaining>0) CODURATION.value = stringifyDuration(currentElapsed);
    else CODURATION.value = stringifyDuration(S.duration) + ' +  ' + stringifyDuration(-remaining) + ' overtime';
  }
  else CODURATION.value = stringifyDuration(currentElapsed);
  TRTEXT.value = stringifyBounty(currentBounty) + ' bounty';
  if (S.duration>0 && currentElapsed >= S.duration) HTML.classList.add('completed');
}


// Update menu based on current state.
function updateMenu(S) {
  var running = S.started && !S.paused;
  if (S.duration===0)  CODURATION.removeAttribute('aria-invalid');
  else if (!S.started) CODURATION.setAttribute('aria-invalid', isNaN(S.duration)? 'true' : 'false');
  RANK  .textContent = getRank(S.bounty);
  BOUNTY.textContent = stringifyBounty(S.bounty);
  CONTROLS    .hidden = S.menu!=='';
  BLOCKLIST   .hidden = S.menu!=='blocklist';
  TRACKER     .hidden = !running;
  COBLOCKLIST .hidden =  running;
  CODURATION.disabled =  running;
  COPAUSE   .disabled = !S.started;
  COPAUSE.textContent =  S.started && S.paused? 'Resume' : 'Pause';
  COSTART.textContent =  S.started? 'Stop' : 'Start';
  BLTEXT .value = S.blocklist.text;
  if (S.mode)  COMODE_TEXT.textContent = MODE_NAMES.get(S.mode);
  if (running)  HTML.classList.add   ('running');
  else          HTML.classList.remove('running');
  if (!running) HTML.classList.remove('completed');
  updateTracker(S);
}


// Main function.
async function main(S) {
  await readState(S);
  await readBlocklist(S);
  initDropdown();
  initModeNames();
  initMenu(S);
}
main(S);
// #endregion
// #endregion
