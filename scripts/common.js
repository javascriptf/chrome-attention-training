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
};


/** Default whitelist of websites to be allowed. */
export const DEFAULT_WHITELIST = [
];


/** Deafult blacklist of websites to be blocked. */
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
    var el = el.replace(/\./g, '\\.');
    var el = el.replace(/\*/g, '.*?');
    var el = el.replace(/\?/g, '.');
    var re = new RegExp(el);
    if (re.test(value)) return i;
  }
  return -1;
}


/**
 * Examine if the url is blacklisted.
 * @param {string} url url string
 * @returns {boolean} true if blacklisted, false otherwise
 */
export function isUrlBlacklisted(url) {
  if (!url) return false;
  var {protocol, hostname} = new URL(url);
  var hostname = hostname.replace(/^www\./, '');
  if (!protocol.startsWith('http')) return false;
  if (searchWildcardList(DEFAULT_WHITELIST, hostname) >= 0) return false;
  if (searchWildcardList(DEFAULT_BLACKLIST, hostname) >= 0) return true;
  return false;
}


/**
 * Fetch focus mode config.
 * @returns {Promise<string>} focus mode
 */
export async function getMode() {
  var c = await chrome.storage.local.get('mode');
  return c.mode || DEFAULT_CONFIG.mode;
}


/**
 * Update focus mode config.
 * @param {string} mode focus mode
 * @returns {Promise<void>}
 */
export async function setMode(mode) {
  await chrome.storage.local.set({mode});
}
// #endregion