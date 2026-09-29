/**
 * cleanup_medicine_average.js  (put in webservice/controller/)
 *
 * Shrinks medicine_average_master WITHOUT deleting anything from it:
 *   1. copies every real row + one junk row per user/medicine/day into a new table,
 *   2. swaps the tables with an instant RENAME,
 *   3. leaves the original as medicine_average_master_old (your backup) until YOU drop it.
 *
 * Runs in the background inside your Node app, is controlled through URLs, keeps its
 * progress in the database (medicine_average_cleanup_state) and can be stopped/resumed.
 *
 * Junk = status = 2 AND time_slots_id = 0 (written by the old get_before_time_slots bug).
 *
 * !! Set CLEANUP_KEY below to a long random string. Remove the routes when you are done. !!
 */
const connection = require("../connection");

const CLEANUP_KEY = "12345";

const T = "medicine_average_master";
const NEW = "medicine_average_master_new";
const OLD = "medicine_average_master_old";
const STATE = "medicine_average_cleanup_state";
const LOCK_NAME = "medicine_average_cleanup";

const DEFAULT_CHUNK = 200000;
const DEFAULT_PAUSE_MS = 500;

// ------------------------------------------------------------------ helpers
const run = (c, sql, params = []) =>
  new Promise((resolve, reject) => c.query(sql, params, (err, res) => (err ? reject(err) : resolve(res))));
const getConn = () =>
  new Promise((resolve, reject) => connection.getConnection((err, c) => (err ? reject(err) : resolve(c))));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, lo, hi, dflt) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, lo), hi) : dflt;
};

const guard = (handler) => async (req, res) => {
  if (!CLEANUP_KEY || CLEANUP_KEY === "CHANGE_ME_TO_A_LONG_RANDOM_STRING" || CLEANUP_KEY.length < 16) {
    return res.status(500).json({ ok: false, error: "Edit CLEANUP_KEY in cleanup_medicine_average.js first (16+ characters)." });
  }
  if (req.query.key !== CLEANUP_KEY) return res.status(403).json({ ok: false, error: "Forbidden" });
  try {
    await handler(req, res);
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ ok: false, error: e.message });
  }
};

async function ensureStateTable() {
  await run(
    connection,
    `CREATE TABLE IF NOT EXISTS ${STATE} (
       id TINYINT NOT NULL PRIMARY KEY,
       phase VARCHAR(20) NOT NULL,
       cutoff BIGINT NULL,
       min_id BIGINT NULL,
       next_id BIGINT NULL,
       keep_one TINYINT NOT NULL DEFAULT 1,
       chunk_size INT NOT NULL DEFAULT ${DEFAULT_CHUNK},
       pause_ms INT NOT NULL DEFAULT ${DEFAULT_PAUSE_MS},
       real_rows BIGINT NOT NULL DEFAULT 0,
       junk_rows_kept BIGINT NOT NULL DEFAULT 0,
       stop_requested TINYINT NOT NULL DEFAULT 0,
       message TEXT NULL,
       started_at DATETIME NULL,
       run_started_at DATETIME NULL,
       run_start_id BIGINT NULL,
       updated_at DATETIME NULL
     ) ENGINE=InnoDB`,
  );
}

async function getState(c = connection) {
  const r = await run(
    c,
    `SELECT s.*, TIMESTAMPDIFF(SECOND, s.run_started_at, NOW()) AS run_seconds FROM ${STATE} s WHERE id = 1`,
  );
  return r[0] || null;
}

async function saveState(c, fields) {
  const keys = Object.keys(fields);
  const sets = keys.map((k) => `${k} = ?`).join(", ");
  await run(c, `UPDATE ${STATE} SET ${sets}, updated_at = NOW() WHERE id = 1`, keys.map((k) => fields[k]));
}

async function tableExists(c, name) {
  const r = await run(
    c,
    "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
    [name],
  );
  return r[0].n > 0;
}

// One job at a time, across every Node process, using a MySQL named lock that is held
// on a dedicated connection for the whole job (released automatically if the process dies).
async function acquireLock() {
  const c = await getConn();
  const r = await run(c, "SELECT GET_LOCK(?, 0) AS got", [LOCK_NAME]);
  if (r[0].got !== 1) {
    c.release();
    return null;
  }
  return c;
}
async function releaseLock(c) {
  try {
    await run(c, "SELECT RELEASE_LOCK(?)", [LOCK_NAME]);
  } catch (_) {}
  c.release();
}
async function isRunning() {
  const r = await run(connection, "SELECT IS_USED_LOCK(?) AS holder", [LOCK_NAME]);
  return r[0].holder !== null;
}

async function recentJunk(c = connection) {
  const r = await run(
    c,
    `SELECT COUNT(*) AS n FROM ${T}
     WHERE medicine_average_id > (SELECT MAX(medicine_average_id) FROM ${T}) - 5000
       AND status = 2 AND time_slots_id = 0 AND createtime > NOW() - INTERVAL 3 MINUTE`,
  );
  return r[0].n;
}

// ------------------------------------------------------------------ /cleanup_avg/stats
const cleanupStats = guard(async (req, res) => {
  const range = (await run(connection, `SELECT MIN(medicine_average_id) AS mn, MAX(medicine_average_id) AS mx FROM ${T}`))[0];
  const windows = 10;
  const size = 20000;
  let total = 0;
  let junk = 0;
  for (let i = 0; i < windows; i++) {
    const from = Math.floor(range.mn + ((range.mx - range.mn - size) * i) / (windows - 1));
    const r = (
      await run(
        connection,
        `SELECT COUNT(*) AS total, SUM(status = 2 AND time_slots_id = 0) AS junk
         FROM ${T} WHERE medicine_average_id BETWEEN ? AND ?`,
        [Math.max(from, range.mn), Math.max(from, range.mn) + size - 1],
      )
    )[0];
    total += Number(r.total);
    junk += Number(r.junk || 0);
  }
  const tables = await run(
    connection,
    `SELECT table_name AS name, table_rows AS est_rows,
            ROUND((data_length + index_length) / 1024 / 1024 / 1024, 2) AS size_gb
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name IN (?, ?, ?)`,
    [T, NEW, OLD],
  );
  res.json({
    ok: true,
    min_id: range.mn,
    max_id: range.mx,
    sampled_rows: total,
    sampled_junk_percent: total ? Number(((junk / total) * 100).toFixed(1)) : 0,
    junk_writes_last_3_min: await recentJunk(),
    ready_to_start: (await recentJunk()) === 0,
    tables,
    job_running: await isRunning(),
  });
});

// ------------------------------------------------------------------ /cleanup_avg/start
const cleanupStart = guard(async (req, res) => {
  await ensureStateTable();
  const conn = await acquireLock();
  if (!conn) return res.status(409).json({ ok: false, error: "A cleanup job is already running. Open /cleanup_avg/status" });

  let handedOff = false;
  try {
    let state = await getState(conn);
    if (state && state.phase === "copied")
      return res.status(400).json({ ok: false, error: "Copy already finished. Next: /cleanup_avg/finish?confirm=yes" });
    if (state && state.phase === "done")
      return res.status(400).json({ ok: false, error: "Cleanup is already done. Remove the cleanup routes." });
    if (state && state.phase === "finishing")
      return res.status(400).json({ ok: false, error: "The finish step was interrupted. Call /cleanup_avg/finish?confirm=yes again." });

    const chunk = clamp(req.query.chunk, 1000, 1000000, state ? state.chunk_size : DEFAULT_CHUNK);
    const pause = clamp(req.query.pause, 0, 5000, state ? state.pause_ms : DEFAULT_PAUSE_MS);
    const range = (await run(conn, `SELECT MIN(medicine_average_id) AS mn, MAX(medicine_average_id) AS mx FROM ${T}`))[0];

    if (!state) {
      if ((await tableExists(conn, NEW)) || (await tableExists(conn, OLD)))
        return res.status(400).json({ ok: false, error: `${NEW} or ${OLD} already exists from an earlier attempt. Check them in phpMyAdmin first.` });
      const recent = await recentJunk(conn);
      if (recent > 0 && req.query.force !== "1")
        return res.status(400).json({
          ok: false,
          error: `${recent} junk rows were written in the last 3 minutes. Deploy the getBeforeTimeSlots fix, wait a few minutes and try again.`,
        });
      const cutoff = req.query.cutoff ? parseInt(req.query.cutoff, 10) : range.mx;
      if (!(cutoff >= range.mn && cutoff <= range.mx))
        return res.status(400).json({ ok: false, error: `cutoff must be between ${range.mn} and ${range.mx}` });
      const keepOne = req.query.keep_one === "0" ? 0 : 1;
      await run(
        conn,
        `INSERT INTO ${STATE} (id, phase, cutoff, min_id, next_id, keep_one, chunk_size, pause_ms, message, started_at, run_started_at, run_start_id, updated_at)
         VALUES (1, 'copying', ?, ?, ?, ?, ?, ?, 'Starting', NOW(), NOW(), ?, NOW())`,
        [cutoff, range.mn, range.mn, keepOne, chunk, pause, range.mn],
      );
    } else {
      // resume after stop / error / restart
      await saveState(conn, {
        phase: "copying",
        stop_requested: 0,
        chunk_size: chunk,
        pause_ms: pause,
        message: "Resumed",
      });
      await run(conn, `UPDATE ${STATE} SET run_started_at = NOW(), run_start_id = next_id WHERE id = 1`);
    }

    if (!(await tableExists(conn, NEW))) await run(conn, `CREATE TABLE ${NEW} LIKE ${T}`);

    state = await getState(conn);
    res.json({ ok: true, started: true, cutoff: state.cutoff, next_id: state.next_id, keep_one: !!state.keep_one, chunk_size: state.chunk_size, note: "Running in the background. Open /cleanup_avg/status to follow progress." });

    handedOff = true;
    setImmediate(() => runCopy(conn));
  } finally {
    if (!handedOff) await releaseLock(conn);
  }
});

async function runCopy(conn) {
  try {
    let state = await getState(conn);
    let chunk = state.chunk_size;
    while (state.next_id <= state.cutoff) {
      state = await getState(conn);
      if (state.stop_requested) {
        await saveState(conn, { phase: "stopped", stop_requested: 0, message: "Stopped by request. Call /cleanup_avg/start to resume." });
        return;
      }
      const t0 = Date.now();
      const from = state.next_id;
      const to = Math.min(from + chunk - 1, state.cutoff);

      // every row that is not junk
      const keepRes = await run(
        conn,
        `INSERT IGNORE INTO ${NEW}
         SELECT * FROM ${T}
         WHERE medicine_average_id BETWEEN ? AND ?
           AND NOT (status = 2 AND time_slots_id = 0)`,
        [from, to],
      );

      // one junk row per user + medicine + day
      let junkKept = 0;
      if (state.keep_one) {
        const j = await run(
          conn,
          `INSERT IGNORE INTO ${NEW}
           SELECT o.* FROM ${T} o
           JOIN (
             SELECT MIN(medicine_average_id) AS id
             FROM ${T}
             WHERE medicine_average_id BETWEEN ? AND ?
               AND status = 2 AND time_slots_id = 0
             GROUP BY user_id, medicine_id, DATE(createtime)
           ) k ON k.id = o.medicine_average_id`,
          [from, to],
        );
        junkKept = j.affectedRows;
      }

      // adapt batch size to the server speed
      const ms = Date.now() - t0;
      if (ms > 25000) chunk = Math.max(1000, Math.floor(chunk / 2));
      else if (ms < 4000) chunk = Math.min(500000, chunk * 2);

      await saveState(conn, {
        next_id: to + 1,
        chunk_size: chunk,
        real_rows: state.real_rows + keepRes.affectedRows,
        junk_rows_kept: state.junk_rows_kept + junkKept,
        message: `Copied ids up to ${to} (last batch took ${ms} ms)`,
      });
      state.next_id = to + 1;
      if (state.pause_ms > 0) await sleep(state.pause_ms);
    }
    await saveState(conn, { phase: "copied", message: "Copy finished. Next: /cleanup_avg/finish?confirm=yes" });
  } catch (e) {
    try {
      await saveState(conn, { phase: "error", message: `Error: ${e.message}. Call /cleanup_avg/start to resume.` });
    } catch (_) {}
  } finally {
    await releaseLock(conn);
  }
}

// ------------------------------------------------------------------ /cleanup_avg/status
const cleanupStatus = guard(async (req, res) => {
  await ensureStateTable();
  const s = await getState();
  const running = await isRunning();
  if (!s) return res.json({ ok: true, phase: "not_started", running });

  const total = s.cutoff - s.min_id + 1;
  const done = Math.min(s.next_id - s.min_id, total);
  let eta = null;
  if (s.phase === "copying" && s.run_seconds > 0 && s.next_id > s.run_start_id) {
    const rate = (s.next_id - s.run_start_id) / s.run_seconds; // ids per second
    eta = Math.round((s.cutoff - s.next_id + 1) / rate / 60);
  }
  res.json({
    ok: true,
    phase: s.phase,
    running,
    interrupted: !running && ["copying", "finishing"].includes(s.phase),
    progress_percent: total > 0 ? Number(((done / total) * 100).toFixed(1)) : 0,
    eta_minutes: eta,
    next_id: s.next_id,
    cutoff: s.cutoff,
    real_rows_copied: s.real_rows,
    junk_rows_kept: s.junk_rows_kept,
    keep_one_junk_per_day: !!s.keep_one,
    chunk_size: s.chunk_size,
    message: s.message,
    started_at: s.started_at,
    updated_at: s.updated_at,
  });
});

// ------------------------------------------------------------------ /cleanup_avg/stop
const cleanupStop = guard(async (req, res) => {
  await ensureStateTable();
  const s = await getState();
  if (!s || !(await isRunning())) return res.json({ ok: true, note: "No job is running." });
  await saveState(connection, { stop_requested: 1 });
  res.json({ ok: true, note: "Stop requested. It stops after the current batch. Check /cleanup_avg/status" });
});

// ------------------------------------------------------------------ /cleanup_avg/finish
const cleanupFinish = guard(async (req, res) => {
  await ensureStateTable();
  if (req.query.confirm !== "yes")
    return res.status(400).json({ ok: false, error: "Add &confirm=yes. This swaps the tables (the original is kept as " + OLD + ")." });
  const conn = await acquireLock();
  if (!conn) return res.status(409).json({ ok: false, error: "A cleanup job is already running. Open /cleanup_avg/status" });

  let handedOff = false;
  try {
    const s = await getState(conn);
    const finishable = s && (s.phase === "copied" || s.phase === "finishing" || (s.phase === "error" && s.next_id > s.cutoff));
    if (!finishable) return res.status(400).json({ ok: false, error: "The copy step is not finished yet. Check /cleanup_avg/status" });
    await saveState(conn, { phase: "finishing", message: "Finishing" });
    res.json({ ok: true, started: true, note: "Finishing in the background. Open /cleanup_avg/status" });
    handedOff = true;
    setImmediate(() => runFinish(conn, s));
  } finally {
    if (!handedOff) await releaseLock(conn);
  }
});

async function runFinish(conn, s) {
  try {
    const oldExists = await tableExists(conn, OLD);
    const newExists = await tableExists(conn, NEW);

    if (oldExists && newExists) throw new Error(`Both ${OLD} and ${NEW} exist. Check them in phpMyAdmin.`);
    if (!oldExists) {
      if (!newExists) throw new Error(`${NEW} does not exist.`);

      // 1) collapse junk-per-day duplicates that were split across batch borders
      if (s.keep_one) {
        await saveState(conn, { message: "Removing duplicates across batch borders" });
        await run(
          conn,
          `DELETE n FROM ${NEW} n
           JOIN (
             SELECT MIN(medicine_average_id) AS keep_id, user_id, medicine_id, DATE(createtime) AS d
             FROM ${NEW}
             WHERE status = 2 AND time_slots_id = 0 AND medicine_average_id <= ?
             GROUP BY user_id, medicine_id, DATE(createtime)
           ) k ON k.user_id = n.user_id AND k.medicine_id = n.medicine_id AND k.d = DATE(n.createtime)
           WHERE n.status = 2 AND n.time_slots_id = 0
             AND n.medicine_average_id <= ? AND n.medicine_average_id <> k.keep_id`,
          [s.cutoff, s.cutoff],
        );
      }

      // 2) rows written after the cutoff (all legitimate)
      await saveState(conn, { message: "Copying rows written after the cutoff" });
      await run(conn, `INSERT IGNORE INTO ${NEW} SELECT * FROM ${T} WHERE medicine_average_id > ?`, [s.cutoff]);

      // 3) new ids far above anything the old table has
      const mx = (await run(conn, `SELECT MAX(medicine_average_id) AS mx FROM ${T}`))[0].mx;
      await run(conn, `ALTER TABLE ${NEW} AUTO_INCREMENT = ${Number(mx) + 1000000}`);

      // 4) atomic swap
      await saveState(conn, { message: "Swapping tables" });
      await run(conn, `RENAME TABLE ${T} TO ${OLD}, ${NEW} TO ${T}`);
    }

    // 5) anything the app wrote to the old table in the last seconds
    await run(conn, `INSERT IGNORE INTO ${T} SELECT * FROM ${OLD} WHERE medicine_average_id > ?`, [s.cutoff]);

    const cnt = (await run(conn, `SELECT COUNT(*) AS n FROM ${T}`))[0].n;
    await saveState(conn, {
      phase: "done",
      message:
        `Done. ${T} now has ${cnt} rows. Your original data is untouched in ${OLD}. ` +
        `Check the app and admin panel, then in phpMyAdmin run: DROP TABLE ${OLD};  ` +
        `To roll back instead: RENAME TABLE ${T} TO ${T}_bad, ${OLD} TO ${T};`,
    });
  } catch (e) {
    try {
      await saveState(conn, { phase: "error", message: `Error: ${e.message}. Call /cleanup_avg/finish?confirm=yes again.` });
    } catch (_) {}
  } finally {
    await releaseLock(conn);
  }
}

module.exports = { cleanupStats, cleanupStart, cleanupStatus, cleanupStop, cleanupFinish };