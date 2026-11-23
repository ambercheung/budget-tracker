/**
 * Budget Tracker → Google Sheets sync.
 * Paste into Extensions → Apps Script on an empty Google Sheet, set ACCESS_KEY,
 * then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 *
 * The app sends whole tables; each one replaces its tab. Transactions are split
 * into one tab per year ("Transactions 2026", "Transactions 2027", …).
 * Every cell is written as plain text so dates never shift; objects are stored as JSON.
 */
const ACCESS_KEY = 'change-me-to-a-long-secret';

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out({ ok: false, error: 'Bad request' }); }
  if (!body || body.key !== ACCESS_KEY) return out({ ok: false, error: 'Wrong access key' });
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return out({ ok: false, error: 'Busy, try again' });
  try {
    if (body.action === 'sync') { syncTables(body.tables || {}); return out({ ok: true, at: new Date().toISOString() }); }
    if (body.action === 'restore') return out({ ok: true, tables: readTables() });
    if (body.action === 'ping') return out({ ok: true });
    return out({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return out({ ok: false, error: String(err && err.message || err) });
  } finally { lock.releaseLock(); }
}

function doGet() { return out({ ok: true, hello: 'Budget Tracker sync is running' }); }

function out(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

const TAB = { rules: 'Recurring Rules', skips: 'Recurring Skips', wallets: 'Wallets', categories: 'Categories', budgets: 'Budgets', holidays: 'Holidays', settings: 'Settings' };

function syncTables(tables) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(tables).forEach((name) => {
    const rows = tables[name] || [];
    if (name === 'transactions') {
      const byYear = {};
      rows.forEach((r) => { const y = String(r.date || '').slice(0, 4) || 'Undated'; (byYear[y] = byYear[y] || []).push(r); });
      // clear years that no longer have rows
      ss.getSheets().filter((sh) => /^Transactions \d{4}$/.test(sh.getName()) && !byYear[sh.getName().slice(13)]).forEach((sh) => sh.clear());
      Object.keys(byYear).forEach((y) => writeTab(ss, 'Transactions ' + y, byYear[y], ['id', 'date', 'type', 'category', 'sub', 'title', 'note', 'amount', 'wallet', 'toWallet', 'ruleId', 'counts', 'deleted', 'createdAt', 'updatedAt']));
    } else if (TAB[name]) {
      writeTab(ss, TAB[name], rows, ['id']);
    }
  });
}

function writeTab(ss, title, rows, first) {
  const sh = ss.getSheetByName(title) || ss.insertSheet(title);
  const keys = first.slice();
  rows.forEach((r) => Object.keys(r).forEach((k) => { if (keys.indexOf(k) < 0) keys.push(k); }));
  const values = [keys].concat(rows.map((r) => keys.map((k) => {
    const v = r[k];
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  })));
  sh.clear();
  const range = sh.getRange(1, 1, values.length, keys.length);
  range.setNumberFormat('@');
  range.setValues(values);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, keys.length).setFontWeight('bold');
}

function readTables() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const res = {};
  const read = (sh) => {
    const v = sh.getDataRange().getValues();
    if (v.length < 2) return [];
    const keys = v[0];
    return v.slice(1).filter((row) => row.some((c) => c !== '')).map((row) => {
      const o = {};
      keys.forEach((k, i) => { if (k === '') return; o[k] = parseCell(row[i]); });
      return o;
    });
  };
  res.transactions = [];
  ss.getSheets().forEach((sh) => { if (/^Transactions \d{4}$/.test(sh.getName())) res.transactions = res.transactions.concat(read(sh)); });
  Object.keys(TAB).forEach((name) => { const sh = ss.getSheetByName(TAB[name]); if (sh) res[name] = read(sh); });
  return res;
}

function parseCell(c) {
  if (c === '') return null;
  const s = String(c);
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s[0] === '{' || s[0] === '[') { try { return JSON.parse(s); } catch (e) { return s; } }
  return s;
}
