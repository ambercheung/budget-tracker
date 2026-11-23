/* Budget Tracker — on-phone storage (IndexedDB).
   Each table is stored as one record in a key-value store; the whole state loads into memory on open. */
(function (root) {
  'use strict';
  const DB_NAME = (typeof window !== 'undefined' && window.BT_DEMO) ? 'budget-tracker-demo' : 'budget-tracker';
  const STORE = 'tables';
  const TABLES = ['transactions', 'rules', 'skips', 'wallets', 'categories', 'budgets', 'holidays', 'settings'];

  function open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function readAll(db) {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const out = {};
    await Promise.all(TABLES.map((t) => new Promise((res) => {
      const r = store.get(t);
      r.onsuccess = () => { out[t] = r.result; res(); };
      r.onerror = () => res();
    })));
    return out;
  }
  function write(db, table, value) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, table);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

  // ---------- starting data ----------
  const C = (name, icon, color, type, parent) => ({ id: uid(), name, icon, color, type: type || 'expense', parent: parent || null });
  function seedCategories() {
    const list = [];
    const add = (name, icon, color, subs, type) => {
      const p = C(name, icon, color, type);
      list.push(p);
      (subs || []).forEach(([n, i]) => list.push(C(n, i || icon, color, type, p.id)));
    };
    add('Beauty', 'beauty', '#6B3FA0');
    add('Bills & Fees', 'bills', '#46606C', [['Phone', 'phone'], ['Bank', 'bank'], ['CC Carryover', 'card']]);
    add('Car', 'car', '#8E3434', [['Gas', 'gas'], ['Insurance', 'shield'], ['Maintenance', 'wrench']]);
    add('Food', 'food', '#3E7A4E', [['Delivery', 'bag'], ['Dining Out', 'food'], ['Grocery', 'basket']]);
    add('Gifts', 'gifts', '#A3423F');
    add('Home', 'home', '#8C5A6E', [['Maintenance', 'wrench'], ['Accessories', 'lamp']]);
    add('Recreation', 'rec', '#2F5F95', [['Entertainment', 'film'], ['Fitness', 'dumbbell'], ['Hobby', 'star']]);
    add('Shopping', 'shopping', '#A94B69');
    add('Transit', 'transit', '#6A5A3C', [['Presto', 'card'], ['Rideshare', 'car']]);
    add('Travel', 'travel', '#2C3E7A', [['Accommodation', 'bed'], ['Transportation', 'plane']]);
    add('Medical', 'medical', '#3C7A5C');
    add('Salary', 'income', '#2E7A72', [], 'income');
    add('Bonus', 'star', '#2E7A72', [], 'income');
    add('Other', 'gifts', '#2E7A72', [], 'income');
    return list;
  }
  const W = (name, type, extra) => ({ id: uid(), name, type, opening: 0, openingDate: '2026-11-30', inNetWorth: type === 'savings', dueDay: null, ...extra });
  function seedWallets() {
    return [
      W('Chequing', 'bank'),
      W('Savings', 'savings', { note: 'Emergency fund' }),
      W('TFSA', 'savings', { room: 0 }),
      W('RRSP', 'savings', { room: 0 }),
      W('Credit Card 1', 'credit'),
      W('Credit Card 2', 'credit'),
      W('Credit Card 3', 'credit'),
      W('Credit Card 4', 'credit'),
      W('Credit Card 5', 'credit')
    ];
  }
  function seedHolidays() {
    return [2026, 2027, 2028].flatMap((y) => root.Engine.defaultHolidays(y));
  }
  const defaultSettings = () => ({
    schedule: { frequency: 'semimonthly', day1: 31, day2: 15, anchor: '2026-11-30', effectiveFrom: '2026-11-30' },
    startDate: '2026-11-30',
    theme: { accent: '#EFA2B5' }
  });

  async function load() {
    const db = await open();
    const raw = await readAll(db);
    const state = {
      transactions: raw.transactions || [],
      rules: raw.rules || [],
      skips: raw.skips || [],
      wallets: raw.wallets || seedWallets(),
      categories: raw.categories || seedCategories(),
      budgets: raw.budgets || [],
      holidays: raw.holidays || seedHolidays(),
      settings: raw.settings || defaultSettings()
    };
    state.schedule = state.settings.schedule;
    const firstRun = !raw.wallets;
    if (firstRun && window.BT_DEMO) window.BT_DEMO.seed(state, uid);
    if (firstRun) await Promise.all(TABLES.map((t) => write(db, t, state[t])));
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    return {
      state,
      firstRun,
      save: (table) => write(db, table, state[table]),
      saveAll: () => Promise.all(TABLES.map((t) => write(db, t, state[t])))
    };
  }

  root.DB = { load, uid };
})(window);
