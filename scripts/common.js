// #region TYPES
// =============

/**
 * Defines a blocklist.
 * @typedef {object} Blocklist
 * @property {string} name blocklist name
 * @property {string} icon blocklist icon
 * @property {string} url blocklist url (if remote)
 */
/**
 * Defines a blocklist collection.
 * @typedef {object.<string, Blocklist>} BlocklistMap
 */


/**
 * Defines a list of URLs to be blocked.
 * @typedef {object} BlocklistEntries
 * @property {string[]} exclude URLs to exlude
 * @property {string[]} include URLs to include
 * @property {string[]} sublists sublists (url)
 */
/**
 * Defines a blocklist entries collection.
 * @typedef {object.<string, BlocklistEntries>} BlocklistEntriesMap
 */


/**
 * Defines an activity.
 * @typedef {object} Activity
 * @property {string} name activity name
 * @property {string} icon activity icon
 * @property {string[]} parents activity parents
 */
/**
 * Defines an activity collection.
 * @typedef {object.<string, Activity>} ActivityMap
 */


/**
 * Defines an activity time.
 * @typedef {object} ActivityTime
 * @property {number} start start time (unix timestamp)
 * @property {number} end end time (unix timestamp)
 */


/**
 * Defines a collection of activity times.
 * @typedef {object.<string, ActivityTime[]>} ActivityTimesMap
 */
// #endregion




// #region GLOBALS
// ===============

/** All HTTP(s) urls. */
export const HTTPS = [
  'http://*/*',
  'https://*/*',
];


/** Default config. */
export const DEFAULT_CONFIG = {
  mode: 'disabled',
  whitelist: [],
  blacklist: [],
  blocklistMap: {},
  activityMap: {},
};
// #endregion




// #region METHODS
// ===============

// #region MODE
// ------------

/**
 * Read focus mode config.
 * @returns {Promise<string>} focus mode
 */
export async function readMode() {
  var c = await chrome.storage.local.get('mode');
  return c.mode || DEFAULT_CONFIG.mode;
}


/**
 * Write focus mode config.
 * @param {string} mode focus mode
 * @returns {Promise<void>}
 */
export async function writeMode(mode) {
  await chrome.storage.local.set({mode});
}
// #endregion




// #region LISTS
// -------------

/**
 * Search a wildcard list for a value.
 * @param {string[]} list wildcard list
 * @param {string} value value to search for
 * @returns {number} index of the value in the list, or -1 if not found
 */
function searchWildcardList(list, value) {
  // Is there a direct match?
  var i = list.indexOf(value);
  if (i>=0) return i;
  // Is there a wildcard match?
  for (var i=0, I=list.length; i<I; ++i) {
    var el = list[i];
    if (!/[*?]/.test(el)) continue;
    var el = el.replace(/([\.\*\?])/g, m => {
      if (m==='.') return '\\.';
      if (m==='*') return '.*?';
      if (m==='?') return '.';
      return m;
    });
    var re = new RegExp(el);
    if (re.test(value)) return i;
  }
  return -1;
}


/**
 * Examine if the url is blacklisted.
 * @param {string} url url string
 * @param {string[]} whitelist whitelist
 * @param {string[]} blacklist blacklist
 * @returns {boolean} true if url is blacklisted, false otherwise
 */
export function isUrlBlacklisted(url, whitelist, blacklist) {
  if (!url) return false;
  var hostname = new URL(url).hostname.replace(/^www\./, '');
  if (searchWildcardList(whitelist, hostname) >= 0) return false;
  if (searchWildcardList(blacklist, hostname) >= 0) return true;
  return false;
}



/**
 * Read whitelist and blacklist.
 * @returns {Promise<{whitelist: string[], blacklist: string[]}>} lists
 */
export async function readLists() {
  var c = await chrome.storage.local.get(['whitelist', 'blacklist']);
  return Object.assign({whitelist: [], blacklist: []}, c);
}


/**
 * Write whitelist and blacklist.
 * @param {string[]} whitelist whitelist
 * @param {string[]} blacklist blacklist
 * @returns {Promise<void>}
 */
export async function writeLists(whitelist, blacklist) {
  await chrome.storage.local.set({whitelist, blacklist});
}
// #endregion




// #region BLOCKLISTS
// ------------------

/**
 * Get blocklist id from name.
 * @param {string} name blocklist name (or url)
 * @returns {string} blocklist id
 */
export function blocklistId(name) {
  return name.replace(/\W+/g, '_').toLowerCase();
}


/**
 * Get remote blocklists.
 * @param {BlocklistMap} xs blocklist collection
 * @returns {Promise<string[]>} remote blocklist ids
 */
export async function remoteBlocklists(xs) {
  var remotes = [];
  for (var id of Object.keys(xs))
    if (xs[id].url) remotes.push(id);
  return remotes;
}


/**
 * Get remote-only blocklists.
 * @param {BlocklistMap} xs blocklist collection
 * @returns {Promise<string[]>} remote-only blocklist ids
 */
export async function remoteOnlyBlocklists(xs) {
  var remotes = [];
  for (var id of Object.keys(xs))
    if (xs[id].name===xs[id].url) remotes.push(id);
  return remotes;
}


/**
 * Fetch the blocklist collection.
 * @returns {Promise<BlocklistMap>} blocklist collection
 */
export async function readBlocklistMap() {
  var c = await chrome.storage.local.get('blocklistMap');
  return c.blocklistMap || DEFAULT_CONFIG.blocklistMap;
}


/**
 * Update a blocklist collection.
 * @param {BlocklistMap} xs blocklist collection
 * @returns {Promise<void>}
 */
export async function writeBlocklistMap(xs) {
  await chrome.storage.local.set({blocklistMap: xs});
}


/**
 * Delete some blocklists from the collection.
 * @param {BlocklistMap} xs blocklist collection
 * @param {string[]} ids blocklist ids
 */
export async function deleteBlocklists(xs, ids) {
  var a = {};
  for (var id of Object.keys(xs))
    if (!ids.includes(id)) a[id] = xs[id];
  await writeBlocklistMap(a);
  if (ids.length > 0) await deleteBlocklistEntriesMap(ids);
}


/**
 * Select the blocklists to use.
 * @param {string} id blocklist id
 * @returns {Promise<void>}
 */
export async function selectBlocklist(id) {
  var {exclude, include} = await flattenBlocklistEntries([id]);
  await writeLists(exclude, include);
}


/**
 * Import blocklist from url.
 * @param {string} name blocklist name
 * @param {string} icon blocklist icon
 * @param {string} url blocklist url
 * @param {boolean} overwrite overwrite existing blocklist?
 * @returns {Promise<void>}
 */
export async function importBlocklist(name, icon, url, overwrite=false) {
  var id = blocklistId(name);
  var xs = await readBlocklistMap(), imported = new Set();
  if (xs[id] && !overwrite) await writeBlocklistMap(Object.assign(xs, {[id]: {name, icon, url}}));
  await writeBlocklistEntriesMap({[id]: await fetchBlocklistEntries(url)});
  await importBlocklistDependenciesWith(xs, imported, [id], overwrite);
}


/**
 * Import blocklist dependencies of some blocklists.
 * @param {string[]} ids blocklist ids
 * @returns {Promise<void>}
 */
export async function importBlocklistDependencies(ids, overwrite=false) {
  var xs = await readBlocklistMap(), imported = new Set();
  await importBlocklistDependenciesWith(xs, imported, ids, overwrite);
}

async function importBlocklistDependenciesWith(xs, imported, ids, overwrite=false) {
  var sublists = (await blocklistEntriesSublists(ids)).filter(url => !imported.has(url));
  if (!overwrite) sublists = await unavailableBlocklistEntries(sublists);
  if (sublists.length===0) return;
  // Import the missing sublists.
  await Promise.all(sublists.map(async url => {
    var id = blocklistId(url);
    if (!xs[id] || overwrite) await writeBlocklistMap(Object.assign(xs, {[id]: {name: url, icon: null, url}}));
    await writeBlocklistEntriesMap({[id]: await fetchBlocklistEntries(url)});
    imported.add(url);
  }));
  // Recursively import sublists of the sublists.
  await importBlocklistDependenciesWith(xs, imported, sublists.map(blocklistId), overwrite);
}
// #endregion




// #region BLOCKLIST ENTRIES
// -------------------------

/**
 * Check if blocklist entries is empty.
 * @param {BlocklistEntries} x blocklist entries
 * @returns {boolean} true if empty, false otherwise
 */
export function isBlocklistEntriesEmpty(x) {
  return !x || (x.exclude.length===0 && x.include.length===0 && x.sublists.length===0);
}


/**
 * Fetch sublists in blocklist entries of some blocklists.
 * @param {string[]} blocklists blocklist ids
 * @returns {Promise<string[]>} sublists of blocklist entries
 */
async function blocklistEntriesSublists(blocklists) {
  var xs = await readBlocklistEntriesMap(blocklists);
  var sublists = new Set();
  for (var id of blocklists) {
    for (var item of xs[id].sublists)
      sublists.add(item);
  }
  return [...sublists];
}


/**
 * Fetch blocklists/URLs whose entries are unavailable.
 * @param {string[]} urls blocklist ids or urls
 * @returns {Promise<string[]>} unavailable urls
 */
async function unavailableBlocklistEntries(urls) {
  var xs = await readBlocklistEntriesMap(urls.map(blocklistId));
  var unavailable = [];
  for (var url of urls)
    if (isBlocklistEntriesEmpty(xs[blocklistId(url)])) unavailable.push(url);
  return unavailable;
}


/**
 * Fetch a collection of blocklist entries of some blocklists.
 * @param {string[]} blocklists blocklist ids
 * @returns {Promise<BlocklistEntriesMap>} collection of blocklist entries
 */
export async function readBlocklistEntriesMap(blocklists) {
  var keys = blocklists.map(id => `blocklistEntries_${id}`);
  var c    = await chrome.storage.local.get(keys), a = {};
  for (var id of blocklists)
    a[id] = c[`blocklistEntries_${id}`] || {exclude: [], include: [], sublists: []};
  return a;
}


/**
 * Update a collection of blocklist entries of some blocklists.
 * @param {BlocklistEntriesMap} xs collection of blocklist entries
 * @returns {Promise<void>}
 */
export async function writeBlocklistEntriesMap(xs) {
  var c = {}, removals = [];
  for (var id of Object.keys(xs)) {
    if (isBlocklistEntriesEmpty(xs[id])) removals.push(id);
    else c[`blocklistEntries_${id}`] = xs[id];
  }
  await chrome.storage.local.set(c);
  if (removals.length > 0) await deleteBlocklistEntriesMap(removals);
}


/**
 * Delete blocklist entries of some blocklists.
 * @param {string[]} blocklists blocklist ids
 * @returns {Promise<void>}
 */
export async function deleteBlocklistEntriesMap(blocklists) {
  var keys = blocklists.map(id => `blocklistEntries_${id}`);
  await chrome.storage.local.remove(keys);
}


/**
 * Flatten blocklist entries of some blocklists.
 * @param {string[]} blocklists blocklist ids
 * @returns {Promise<BlocklistEntries>} flattened blocklist entries
 */
export async function flattenBlocklistEntries(blocklists) {
  var exclude  = new Set();
  var include  = new Set();
  var sublists = new Set();
  await flattenBlocklistEntriesTo(exclude, include, sublists, blocklists);
  return {exclude: [...exclude], include: [...include], sublists: [...sublists]};
}

async function flattenBlocklistEntriesTo(exclude, include, sublists, blocklists) {
  var xs = await readBlocklistEntriesMap(blocklists);
  var newids = [];
  for (var id of blocklists) {
    var x = xs[id];
    for (var item of x.exclude) exclude.add(item);
    for (var item of x.include) include.add(item);
    for (var item of x.sublists) {
      if (sublists.has(item)) continue;
      sublists.add(item);
      newids.push(blocklistId(item));
    }
  }
  if (newids.length > 0) await flattenBlocklistEntriesTo(exclude, include, sublists, newids);
}


/**
 * Fetch blocklist entries from given url.
 * @param {string} url blocklist url
 * @returns {Promise<BlocklistEntries>} blocklist entries
 */
export async function fetchBlocklistEntries(url) {
  if (!/^https?:/.test(url)) url = chrome.runtime.getURL(`blocklists/${url}.txt`);
  var text = await (await fetch(url)).text();
  var exclude = [], include = [], sublists = [];
  for (var line of text.split(/\r?\n/)) {
    var line = line.trim();
    var rest = line.slice(1).trim();
    if (!line) continue;
    if (line.startsWith('#')) continue;
    if (line.startsWith('!'))     sublists.push(rest);
    else if (line.startsWith('+')) exclude.push(rest);
    else if (line.startsWith('-')) include.push(rest);
    else                           include.push(line);
  }
  return {exclude, include, sublists};
}
// #endregion




// #region ACTIVITIES
// ------------------

/**
 * Get activity id from name.
 * @param {string} name activity name
 * @returns {string} activity id
 */
export function activityId(name) {
  return name.replace(/\W+/g, '_').toLowerCase();
}


/**
 * Read the activity collection.
 * @returns {Promise<ActivityMap>} activity collection
 */
export async function readActivityMap() {
  var c = await chrome.storage.local.get('activityMap');
  return c.activityMap || DEFAULT_CONFIG.activityMap;
}


/**
 * Write an activity collection.
 * @param {ActivityMap} xs activity collection
 * @returns {Promise<void>}
 */
export async function writeActivityMap(xs) {
  await chrome.storage.local.set({activities: xs});
}


/**
 * Get parent activities of an activity.
 * @param {ActivityMap} xs activities
 * @param {string} id activity id
 * @returns {string[]} parent activity ids
 */
export function parentActivities(xs, id) {
  if   (!xs[id]) return [];
  return xs[id].parents;
}


/**
 * Obtain child activities of an activity.
 * @param {ActivityMap} xs activities
 * @param {string} id activity id
 * @returns {string[]} child activity ids
 */
export function childActivities(xs, id) {
  if (!xs[id]) return [];
  var children = [];
  for (var id of Object.keys(xs)) {
    var parents = xs[id].parents;
    if (parents.includes(id)) children.push(id);
  }
  return children;
}


/**
 * Obtain descendent activities of an activity.
 * @param {ActivityMap} xs activities
 * @param {string} id activity id
 * @returns {string[]} descendent activity ids
 */
export function descendentActivities(xs, id) {
  var descendents = new Set();
  descendentActivitiesTo(descendents, xs, id);
  return [...descendents];
}

function descendentActivitiesTo(descendents, xs, id) {
  if (!xs[id]) return;
  var children = childActivities(xs, id);
  for (var child of children) {
    if (descendents.has(child)) continue;
    descendents.add(child);
    descendentActivitiesTo(descendents, xs, child);
  }
}
// #endregion




// #region ACTIVITY TIMES
// ----------------------

/**
 * Read a collection of activity times of some activities.
 * @param {string[]} activities activity ids
 * @returns {Promise<ActivityTimesMap>} collection of activity times
 */
export async function readActivityTimesMap(activities) {
  var keys = activities.map(id => `activityTimes_${id}`);
  var c    = await chrome.storage.local.get(keys), a = {};
  for (var id of activities)
    a[id] = c[`activityTimes_${id}`] || [];
  return a;
}


/**
 * Write a collection of activity times of some activities.
 * @param {ActivityTimesMap} xs collection of activity times
 * @returns {Promise<void>}
 */
export async function writeActivityTimesMap(xs) {
  var c = {}, removals = [];
  for (var id in xs) {
    var  x = xs[id];
    if (!x || x.length===0) removals.push(id);
    else c[`activityTimes_${id}`] = x;
  }
  await chrome.storage.local.set(c);
  if (removals.length > 0) await deleteActivityTimes(removals);
}


/**
 * Delete activity times of some activities.
 * @param {string[]} activities activity ids
 * @returns {Promise<void>}
 */
export async function deleteActivityTimes(activities) {
  var keys = activities.map(id => `activityTimes_${id}`);
  await chrome.storage.local.remove(keys);
}
// #endregion




// #region TIMER
// -------------

/**
 * Get the current system date.
 * @returns {Promise<Date>} system date
 */
export function getSystemDate() {
  return new Date();
}


/**
 * Fetch the current internet date.
 * @returns {Promise<Date>} internet date
 */
export async function fetchInternetDate() {
  var x = await (await fetch('http://worldtimeapi.org/api/ip')).json();
  return new Date(x.datetime);
}
// #endregion
// #endregion
