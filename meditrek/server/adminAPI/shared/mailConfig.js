/**
 * Shared mail configuration loader.
 * Reads mail host/user/pass and the app base URL from the `settings` table
 * so they're editable from the admin panel instead of hardcoded per function.
 * Falls back to process.env if a key isn't in the DB yet.
 * Cached for 60s; call clearMailConfigCache() after an admin saves settings.
 */

const KEYS = [
  "mail_host",
  "mail_port",
  "mail_username",
  "mail_password",
  "mail_from",
  "mail_from_name",
  "mail_secure",
  "app_base_url",
];

const ENV_FALLBACK = {
  mail_host: process.env.MAIL_HOST,
  mail_port: process.env.MAIL_PORT,
  mail_username: process.env.MAIL_USER,
  mail_password: process.env.MAIL_PASS,
  mail_from: process.env.MAIL_FROM,
  mail_from_name: process.env.MAIL_FROM_NAME || "Meditrek",
  mail_secure: process.env.MAIL_SECURE || "ssl",
  app_base_url: process.env.APP_BASE_URL,
};

const CACHE_TTL_MS = 60 * 1000;

let cache = null;
let cacheLoadedAt = 0;
let pendingLoad = null;

function queryAsync(connection, sql, params) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

async function getMailConfig(connection) {
  const now = Date.now();
  if (cache && now - cacheLoadedAt < CACHE_TTL_MS) {
    return cache;
  }
  if (pendingLoad) return pendingLoad;

  pendingLoad = (async () => {
    let dbRows = [];
    try {
      dbRows = await queryAsync(
        connection,
        "SELECT `key`, `value` FROM settings WHERE `key` IN (?)",
        [KEYS]
      );
    } catch (e) {
      console.error("mailConfig: failed to load settings from DB, using env fallback:", e.message);
    }

    const dbValues = {};
    dbRows.forEach((row) => {
      if (row.value !== null && row.value !== "") dbValues[row.key] = row.value;
    });

    const merged = {};
    KEYS.forEach((k) => {
      merged[k] = dbValues[k] ?? ENV_FALLBACK[k] ?? null;
    });

    cache = merged;
    cacheLoadedAt = Date.now();
    pendingLoad = null;
    return merged;
  })();

  return pendingLoad;
}

function clearMailConfigCache() {
  cache = null;
  cacheLoadedAt = 0;
}

module.exports = { getMailConfig, clearMailConfigCache, MAIL_SETTING_KEYS: KEYS };