// #region TYPES
// =============

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
  useDefault: true,
  activityMap: {},
};


/** Default whitelist of websites to be allowed. */
export const DEFAULT_WHITELIST = [
];


/** Default blacklist of websites to be blocked. */
export const DEFAULT_BLACKLIST = [
  // #region ARTS & ENTERTAINMENT
  // - https://www.similarweb.com/top-websites/arts-and-entertainment/
  'youtube.com',
  'netflix.com',
  'bilibili.com',
  'fandom.com',
  'imdb.com',
  'spotify.com',
  'archiveofourown.org',
  'pixiv.net',
  'disneyplus.com',
  'aparat.com',
  'zoro.to',
  '9animetv.to',
  'jiocinema.com',
  'dcinside.com',
  'hbomax.com',
  'hotstar.com',
  'primevideo.com',
  'miguvideo.com',
  'syosetu.com',
  'worldstar.com',
  'hulu.com',
  'nicovideo.jp',
  'kinopoisk.ru',
  'pikabu.ru',
  'rumble.com',
  'animeflv.net',
  'wattpad.com',
  'xfinity.com',
  'asurascans.com',
  'dailymotion.com',
  'soundcloud.com',
  'manganato.com',
  'twimg.com',
  'genius.com',
  '9gag.com',
  'nhk.or.jp',
  '9anime.to',
  'qidian.com',
  'npr.org',
  'cmoa.jp',
  'crunchyroll.com',
  'soap2day.to',
  'tenki.jp',
  'ficbook.net',
  'deviantart.com',
  'programme-tv.net',
  'tapmad.com',
  'fandomwire.com',
  'mediaset.it',
  'fmovies.to',
  'bookmyshow.com',
  // #endregion
  // #region MOVIE REVIEW
  'rottentomatoes.com',
  'metacritic.com',
  'letterboxd.com',
  'themoviedb.org',
  'douban.com',
  // #endregion
  // #region SHOPPING
  'amazon.*',
  'ebay.com',
  'craigslist.org',
  'walmart.com',
  'target.com',
  'bestbuy.com',
  'apple.com',
  'microsoft.com',
  // #endregion
  // #region SOCIAL MEDIA
  'facebook.com',
  'twitter.com',
  'instagram.com',
  'reddit.com',
  'tumblr.com',
  'pinterest.com',
  'twitch.tv',
  'tiktok.com',
  'linkedin.com',
  'quora.com',
  'vk.com',
  'weibo.com',
  'telegram.org',
  'discord.com',
  'snapchat.com',
  'medium.com',
  'mix.com',
  'myspace.com',
  'livejournal.com',
  'flickr.com',
  'meetup.com',
  'tagged.com',
  'ask.fm',
  'nextdoor.com',
  'foursquare.com',
  'meetme.com',
  'vimeo.com',
  'vine.co',
  // #endregion
  // #region EMAIL
  'mail.google.com',
  'outlook.live.com',
  'outlook.office.com',
  'mail.yahoo.com',
  'mail.aol.com',
  'mail.yandex.com',
  'mail.zoho.com',
  'mail.com',
  'protonmail.com',
  // #endregion
];
// #endregion




// #region METHODS
// ===============

// #region UTILITY
// ---------------

/**
 * Fetch text from specified URL.
 * @param url fetch url
 * @returns {Promise<string>} response text
 */
export function fetchText(url) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = () => {
      if (xhr.status>=200 && xhr.status<300) resolve(xhr.responseText);
      else reject(new Error(xhr.statusText));
    };
    xhr.onerror = () => reject(new Error(xhr.statusText));
    xhr.send();
  });
}
// #endregion




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
 * Examine if the url is in a list.
 * @param {string} url url string
 * @param {string[]} whitelist whitelist
 * @param {string[]} blacklist blacklist
 * @param {boolean} useDefault use default lists?
 * @returns {boolean} true if url is blacklisted, false otherwise
 */
export function isUrlBlacklisted(url, whitelist, blacklist, useDefault) {
  if (!url) return false;
  var hostname = new URL(url).hostname.replace(/^www\./, '');
  if (searchWildcardList(whitelist, hostname) >= 0) return false;
  if (searchWildcardList(blacklist, hostname) >= 0) return true;
  if (useDefault && searchWildcardList(DEFAULT_WHITELIST, hostname) >= 0) return false;
  if (useDefault && searchWildcardList(DEFAULT_BLACKLIST, hostname) >= 0) return true;
  return false;
}



/**
 * Read whitelist and blacklist.
 * @returns {Promise<{whitelist: string[], blacklist: string[], useDefaultList: boolean}>} lists
 */
export async function readLists() {
  var c = await chrome.storage.local.get(['whitelist', 'blacklist', 'useDefault']);
  return Object.assign({}, DEFAULT_CONFIG, c);
}


/**
 * Write whitelist and blacklist.
 * @param {string[]} whitelist whitelist
 * @param {string[]} blacklist blacklist
 * @param {boolean} useDefault use default lists?
 * @returns {Promise<void>}
 */
export async function writeLists(whitelist, blacklist, useDefault) {
  await chrome.storage.local.set({whitelist, blacklist, useDefault});
}


/**
 * Write whether to use default lists.
 * @param {boolean} useDefault use default lists?
 * @returns {Promise<void>}
 */
export async function writeUseDefault(useDefault) {
  await chrome.storage.local.set({useDefault});
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
  return Array.from(descendents);
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
  var text = await fetchText('http://worldtimeapi.org/api/ip');
  return new Date(JSON.parse(text).datetime);
}
// #endregion
// #endregion
