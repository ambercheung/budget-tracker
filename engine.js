/* Budget Tracker — calculation engine.
   Pure functions, no DOM. Dates are 'YYYY-MM-DD' strings in local (Toronto) calendar terms.
   Works in the browser (window.Engine) and in Node (module.exports) for tests. */
(function (root) {
  'use strict';

  // ---------- date helpers (UTC under the hood so time zones never shift a day) ----------
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; };
  const toDate = (s) => { const { y, m, d } = parse(s); return new Date(Date.UTC(y, m - 1, d)); };
  const fromDate = (dt) => ymd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  const addDays = (s, n) => { const dt = toDate(s); dt.setUTCDate(dt.getUTCDate() + n); return fromDate(dt); };
  const dow = (s) => toDate(s).getUTCDay(); // 0 Sun … 6 Sat
  const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  const clampDay = (y, m, d) => ymd(y, m, Math.min(d, daysInMonth(y, m)));
  const addMonths = (y, m, n) => { const t = (y * 12 + (m - 1)) + n; return { y: Math.floor(t / 12), m: (t % 12) + 1 }; };
  const diffDays = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtShort = (s) => { const { m, d } = parse(s); return `${SHORT[m - 1]} ${d}`; };
  const fmtDay = (s) => { const { m, d } = parse(s); return `${DAYS[dow(s)]}, ${SHORT[m - 1]} ${d}`; };

  // ---------- holidays: federal + Ontario statutory days banks observe ----------
  function easterSunday(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451), month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return ymd(y, month, day);
  }
  const nthWeekday = (y, m, weekday, n) => { let s = ymd(y, m, 1); while (dow(s) !== weekday) s = addDays(s, 1); return addDays(s, 7 * (n - 1)); };
  // Weekend holiday moves to the next weekday (Sat→Mon, Sun→Mon); Boxing Day shifts past Christmas.
  const observed = (s) => (dow(s) === 6 ? addDays(s, 2) : dow(s) === 0 ? addDays(s, 1) : s);
  function defaultHolidays(y) {
    const xmas = ymd(y, 12, 25), box = ymd(y, 12, 26);
    let xObs = observed(xmas), bObs = observed(box);
    if (bObs === xObs) bObs = addDays(bObs, 1);
    let victoria = ymd(y, 5, 24); while (dow(victoria) !== 1) victoria = addDays(victoria, -1);
    return [
      { date: observed(ymd(y, 1, 1)), name: "New Year's Day" },
      { date: nthWeekday(y, 2, 1, 3), name: 'Family Day' },
      { date: addDays(easterSunday(y), -2), name: 'Good Friday' },
      { date: victoria, name: 'Victoria Day' },
      { date: observed(ymd(y, 7, 1)), name: 'Canada Day' },
      { date: nthWeekday(y, 8, 1, 1), name: 'Civic Holiday' },
      { date: nthWeekday(y, 9, 1, 1), name: 'Labour Day' },
      { date: observed(ymd(y, 9, 30)), name: 'National Day for Truth and Reconciliation' },
      { date: nthWeekday(y, 10, 1, 2), name: 'Thanksgiving' },
      { date: observed(ymd(y, 11, 11)), name: 'Remembrance Day' },
      { date: xObs, name: 'Christmas Day' },
      { date: bObs, name: 'Boxing Day' }
    ];
  }
  const isBusinessDay = (s, holidaySet) => dow(s) !== 0 && dow(s) !== 6 && !holidaySet.has(s);
  const prevBusinessDay = (s, holidaySet) => { while (!isBusinessDay(s, holidaySet)) s = addDays(s, -1); return s; };

  // ---------- pay schedule ----------
  // schedule: { frequency: 'semimonthly'|'monthly'|'biweekly'|'weekly', day1, day2, anchor }
  // Returns pays between from and to (inclusive, by nominal date), each:
  // { date (actual deposit), nominal, monthKey: 'YYYY-MM' budget month, n: 1|2|3 }
  function payDatesOne(schedule, from, to, holidaySet) {
    const out = [];
    const f = parse(from), t = parse(to);
    if (schedule.frequency === 'semimonthly' || schedule.frequency === 'monthly') {
      const days = schedule.frequency === 'monthly' ? [schedule.day1] : [schedule.day1, schedule.day2];
      for (let k = -1; ; k++) {
        const { y, m } = addMonths(f.y, f.m, k);
        if (y * 12 + m > t.y * 12 + t.m + 1) break;
        days.forEach((day, idx) => {
          const nominal = clampDay(y, m, day);
          const date = prevBusinessDay(nominal, holidaySet);
          let key;
          if (schedule.frequency === 'monthly') key = ymd(y, m, 1).slice(0, 7);
          else if (idx === 0 && schedule.day1 > schedule.day2) { const nm = addMonths(y, m, 1); key = `${nm.y}-${pad(nm.m)}`; }
          else key = `${y}-${pad(m)}`;
          out.push({ date, nominal, monthKey: key, n: idx === 0 ? 1 : 2 });
        });
      }
    } else {
      const step = schedule.frequency === 'weekly' ? 7 : 14;
      let s = schedule.anchor;
      while (s > addDays(from, -40)) s = addDays(s, -step);
      for (; s <= addDays(to, 40); s = addDays(s, step)) {
        out.push({ date: prevBusinessDay(s, holidaySet), nominal: s, monthKey: s.slice(0, 7), n: 0 });
      }
      out.sort((a, b) => cmp(a.nominal, b.nominal));
      const counts = {};
      out.forEach((p) => { counts[p.monthKey] = (counts[p.monthKey] || 0) + 1; p.n = counts[p.monthKey]; });
    }
    out.sort((a, b) => cmp(a.date, b.date));
    return out.filter((p) => p.date >= addDays(from, -40) && p.date <= addDays(to, 40));
  }

  // Pay periods: each pay runs to the day before the next pay.

  // A schedule can carry a history of earlier schedules: { ...current, effectiveFrom, history: [{ ...older, effectiveFrom }] }.
  // Each one applies from its effectiveFrom date until the next one starts, so past months keep their pay dates.
  function segments(schedule) {
    const segs = (schedule.history || []).concat([schedule]).map((s) => ({ ...s, history: undefined }));
    return segs.sort((a, b) => cmp(a.effectiveFrom || '0000-00-00', b.effectiveFrom || '0000-00-00'));
  }
  function segmentAt(schedule, date) {
    const segs = segments(schedule);
    let cur = segs[0];
    segs.forEach((s) => { if ((s.effectiveFrom || '0000-00-00') <= date) cur = s; });
    return cur;
  }
  function payDates(schedule, from, to, holidaySet) {
    const segs = segments(schedule);
    let out;
    if (segs.length === 1) out = payDatesOne(segs[0], from, to, holidaySet);
    else {
      out = [];
      segs.forEach((seg, i) => {
        const lo = i === 0 ? null : seg.effectiveFrom, hi = i < segs.length - 1 ? segs[i + 1].effectiveFrom : null;
        payDatesOne(seg, from, to, holidaySet).forEach((p) => { if ((!lo || p.nominal >= lo) && (!hi || p.nominal < hi)) out.push(p); });
      });
      out.sort((a, b) => cmp(a.date, b.date));
      const counts = {};
      out.forEach((p) => { counts[p.monthKey] = (counts[p.monthKey] || 0) + 1; p.n = counts[p.monthKey]; });
    }
    return out;
  }
  function payPeriods(schedule, from, to, holidaySet) {
    const pays = payDates(schedule, addDays(from, -62), addDays(to, 62), holidaySet);
    const periods = [];
    for (let i = 0; i < pays.length - 1; i++) {
      periods.push({ start: pays[i].date, end: addDays(pays[i + 1].date, -1), monthKey: pays[i].monthKey, n: pays[i].n, label: `Pay ${pays[i].n}` });
    }
    return periods;
  }

  // Budget month for a key 'YYYY-MM': from its first pay to the day before next month's first pay.
  function budgetMonth(schedule, key, holidaySet) {
    const [y, m] = key.split('-').map(Number);
    if (segmentAt(schedule, ymd(y, m, 1)).frequency === 'monthly') {
      return { key, start: ymd(y, m, 1), end: ymd(y, m, daysInMonth(y, m)), name: MONTHS[m - 1], pays: payPeriods(schedule, ymd(y, m, 1), ymd(y, m, daysInMonth(y, m)), holidaySet).filter((p) => p.monthKey === key) };
    }
    const around = payPeriods(schedule, ymd(y, m, 1), ymd(y, m, daysInMonth(y, m)), holidaySet);
    const pays = around.filter((p) => p.monthKey === key);
    if (!pays.length) return { key, start: ymd(y, m, 1), end: ymd(y, m, daysInMonth(y, m)), name: MONTHS[m - 1], pays: [] };
    return { key, start: pays[0].start, end: pays[pays.length - 1].end, name: MONTHS[m - 1], pays };
  }
  function monthKeyFor(schedule, date, holidaySet) {
    const { y, m } = parse(date);
    for (const k of [-1, 0, 1, 2]) {
      const mm = addMonths(y, m, k), key = `${mm.y}-${pad(mm.m)}`;
      const bm = budgetMonth(schedule, key, holidaySet);
      if (date >= bm.start && date <= bm.end) return key;
    }
    return `${y}-${pad(m)}`;
  }
  const shiftKey = (key, n) => { const [y, m] = key.split('-').map(Number); const r = addMonths(y, m, n); return `${r.y}-${pad(r.m)}`; };

  // ---------- recurring rules ----------
  // rule: { id, pattern: 'interval'|'dom'|'payday', every, unit: 'week'|'month'|'year', dom, start, end, active, ... }
  function occurrences(rule, from, to, ctx) {
    if (rule.active === false) return [];
    const out = [];
    const end = rule.end && rule.end < to ? rule.end : to;
    if (rule.pattern === 'payday') {
      const every = Math.max(1, Number(rule.every) || 1);
      payDates(ctx.schedule, rule.start, end, ctx.holidaySet).filter((p) => p.date >= rule.start && p.date <= end)
        .forEach((p, i) => { if (i % every === 0 && p.date >= from) out.push(p.date); });
    } else if (rule.pattern === 'dom') {
      const s = parse(rule.start);
      for (let k = 0; k < 1200; k++) {
        const { y, m } = addMonths(s.y, s.m, k);
        const d = clampDay(y, m, rule.dom);
        if (d > end) break;
        if (d >= rule.start && d >= from) out.push(d);
      }
    } else {
      const every = Math.max(1, Number(rule.every) || 1);
      const s = parse(rule.start);
      for (let k = 0; k < 5000; k++) {
        let d;
        if (rule.unit === 'day') d = addDays(rule.start, every * k);
        else if (rule.unit === 'week') d = addDays(rule.start, 7 * every * k);
        else if (rule.unit === 'year') d = clampDay(s.y + every * k, s.m, s.d);
        else if (rule.unit === 'monthEnd') { const r = addMonths(s.y, s.m, every * k); d = ymd(r.y, r.m, daysInMonth(r.y, r.m)); }
        else if (rule.unit === 'monthStart') { const r = addMonths(s.y, s.m, (s.d === 1 ? 0 : 1) + every * k); d = ymd(r.y, r.m, 1); }
        else { const r = addMonths(s.y, s.m, every * k); d = clampDay(r.y, r.m, s.d); }
        if (d > end) break;
        if (d >= from) out.push(d);
      }
    }
    const skips = ctx.skips || new Set();
    return out.filter((d) => !skips.has(`${rule.id}|${d}`));
  }

  // All transactions in a range: real ones plus projected recurring occurrences not yet posted.
  function transactionsInRange(state, from, to) {
    const ctx = ctxOf(state);
    const real = state.transactions.filter((t) => !t.deleted && t.date >= from && t.date <= to);
    const posted = new Set(state.transactions.filter((t) => t.ruleId).map((t) => `${t.ruleId}|${t.date}`));
    const projected = [];
    state.rules.forEach((r) => {
      occurrences(r, from, to, ctx).forEach((d) => {
        if (posted.has(`${r.id}|${d}`)) return;
        projected.push({ ...r.template, id: `proj:${r.id}|${d}`, ruleId: r.id, date: d, projected: true, counts: r.counts || 'entry' });
      });
    });
    return real.concat(projected).sort((a, b) => cmp(b.date, a.date) || cmp(b.createdAt || '', a.createdAt || ''));
  }

  // Occurrences due on or before today that haven't been saved yet: the app saves these on open.
  function duePostings(state, today) {
    const ctx = ctxOf(state);
    const posted = new Set(state.transactions.filter((t) => t.ruleId).map((t) => `${t.ruleId}|${t.date}`));
    const out = [];
    state.rules.forEach((r) => {
      occurrences(r, r.start, today, ctx).forEach((d) => { if (!posted.has(`${r.id}|${d}`)) out.push({ rule: r, date: d }); });
    });
    return out;
  }

  function ctxOf(state) {
    const holidaySet = new Set((state.holidays || []).map((h) => h.date));
    return { schedule: state.schedule, holidaySet, skips: new Set((state.skips || []).map((s) => `${s.ruleId}|${s.date}`)) };
  }

  // ---------- money ----------
  const walletType = (state, name) => { const w = state.wallets.find((x) => x.name === name); return w ? w.type : 'bank'; };
  // Card and loan balances the app has no purchases for (the starting amount owed, or a balance
  // correction that raised it). Payments pay the oldest debt first, so a payment from a bank account
  // counts as spend until that untracked balance is gone; payments for purchases already counted don't.
  let debtCache = null;
  const isDebt = (state, name) => ['credit', 'loan'].includes(walletType(state, name));
  function debtSig(state) {
    return state.transactions.length + '|' + state.rules.length + '|' + (state.skips || []).length + '|' +
      state.wallets.map((w) => `${w.name}:${w.type}:${w.opening}:${w.openingDate || ''}`).join(',');
  }
  function buildDebt(state) {
    const map = new Map(), left = {}, opened = {};
    state.wallets.forEach((w) => { if (w.type === 'credit' || w.type === 'loan') { left[w.name] = Math.max(0, Number(w.opening) || 0); opened[w.name] = w.openingDate || '0000'; } });
    if (!Object.keys(left).length) return map;
    const real = state.transactions.filter((t) => !t.deleted);
    const now = fromDate(new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())));
    let first = now, last = now;
    real.forEach((t) => { if (t.date < first) first = t.date; if (t.date > last) last = t.date; });
    state.rules.forEach((r) => { if (r.start && r.start < first) first = r.start; });
    const list = transactionsInRange(state, first, addDays(last, 800)).slice().reverse(); // oldest first
    list.forEach((t) => {
      const a = Number(t.amount) || 0;
      if (t.type === 'adjustment' && t.wallet in left && t.date >= opened[t.wallet]) {
        left[t.wallet] = Math.max(0, left[t.wallet] - a); // a correction that raises the amount owed is untracked debt
      } else if (t.type === 'transfer' && t.toWallet in left && t.date >= opened[t.toWallet]) {
        const part = Math.min(a, left[t.toWallet]);
        if (part <= 0) return;
        left[t.toWallet] -= part;
        if (t.wallet in left) left[t.wallet] += part;                 // balance transfer between cards: still owed
        else if (walletType(state, t.wallet) === 'bank') map.set(t.id, Math.round(part * 100) / 100);
      }
    });
    return map;
  }
  function debtPaid(state, t) {
    const sig = debtSig(state);
    if (!debtCache || debtCache.state !== state || debtCache.sig !== sig) debtCache = { state, sig, map: buildDebt(state) };
    return debtCache.map.get(t.id) || 0;
  }
  function resetCache() { debtCache = null; }

  // How a transaction counts toward Income / Spend: returns { income, recurring, discretionary, savings, debt }
  function classify(state, t) {
    const amt = Number(t.amount) || 0;
    const z = { income: 0, recurring: 0, discretionary: 0, savings: 0, debt: 0 };
    if (t.type === 'income') z.income = amt;
    else if (t.type === 'expense') { if (t.ruleId) z.recurring = amt; else z.discretionary = amt; }
    else if (t.type === 'transfer') {
      const from = walletType(state, t.wallet), to = walletType(state, t.toWallet);
      if (from === 'bank' && to === 'savings') z.savings = amt;
      else if (from === 'savings' && to === 'bank') z.savings = -amt; // withdrawal: money back to spend
      else if (isDebt(state, t.toWallet)) z.debt = debtPaid(state, t); // paying off a balance with no purchases in the app
    }
    return z;
  }
  // Counts now? Past and today always; future only when set to count on entry.
  const countsNow = (t, today) => t.date <= today || (t.counts || 'entry') === 'entry';

  function totals(state, from, to, today) {
    const sum = { income: 0, recurring: 0, discretionary: 0, savings: 0, debt: 0 };
    transactionsInRange(state, from, to).forEach((t) => {
      if (!countsNow(t, today)) return;
      const c = classify(state, t);
      Object.keys(sum).forEach((k) => { sum[k] += c[k]; });
    });
    sum.spend = sum.recurring + sum.discretionary + sum.debt;
    sum.out = sum.spend + sum.savings;
    sum.remaining = sum.income - sum.out;
    Object.keys(sum).forEach((k) => { sum[k] = Math.round(sum[k] * 100) / 100 + 0; });
    return sum;
  }

  // Wallet balances as of today. Cards and loans are shown as amount owed (positive = owed).
  function balances(state, today) {
    const bal = {};
    state.wallets.forEach((w) => { bal[w.name] = Number(w.opening) || 0; });
    const owed = (name) => ['credit', 'loan'].includes(walletType(state, name));
    const move = (name, delta) => { if (!(name in bal)) return; bal[name] += owed(name) ? -delta : delta; };
    state.transactions.forEach((t) => {
      if (t.deleted || t.date > today) return;
      const w = state.wallets.find((x) => x.name === t.wallet);
      if (w && t.date < (w.openingDate || '0000')) return;
      const a = Number(t.amount) || 0;
      if (t.type === 'income') move(t.wallet, a);
      else if (t.type === 'expense') move(t.wallet, -a);
      else if (t.type === 'transfer') { move(t.wallet, -a); move(t.toWallet, a); }
      else if (t.type === 'adjustment') move(t.wallet, a);
    });
    Object.keys(bal).forEach((k) => { bal[k] = Math.round(bal[k] * 100) / 100 + 0; });
    return bal;
  }

  // Next payment due date for a card: a repeat rule like recurring transactions ({ start, every, unit }),
  // or the older single "due day of month".
  function nextDue(w, today) {
    if (w && w.due && w.due.start) {
      const occ = occurrences({ id: 'due', pattern: 'interval', unit: w.due.unit || 'month', every: w.due.every || 1, start: w.due.start }, today, addDays(today, 800), { skips: new Set() });
      return occ[0] || null;
    }
    if (w && w.dueDay) { const d = daysUntilDue(w.dueDay, today); return d == null ? null : addDays(today, d); }
    return null;
  }
  function daysUntilDue(dueDay, today) {
    if (!dueDay) return null;
    const { y, m, d } = parse(today);
    let due = clampDay(y, m, dueDay);
    if (due < today) { const n = addMonths(y, m, 1); due = clampDay(n.y, n.m, dueDay); }
    return diffDays(today, due);
  }

  const money = (n, opts = {}) => {
    const v = Math.abs(Number(n) || 0);
    const s = v.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (opts.sign && Number(n) < 0 ? '−' : '') + '$' + s;
  };

  // Budgets are stored per budget month: { id, month:'YYYY-MM', amount, pct, repeat }.
  // A month's own entry wins. Otherwise the nearest earlier entry carries forward if it has repeat on.
  // An entry with amount 0 and repeat off ends a repeating budget.
  function budgetFor(budgets, id, mk) {
    const mine = budgets.filter((b) => b.id === id);
    const exact = mine.find((b) => b.month === mk);
    if (exact) return exact.amount > 0 ? { ...exact, inherited: false } : null;
    const prior = mine.filter((b) => (b.month || '0000-00') < mk).sort((a, b) => ((a.month || '') < (b.month || '') ? 1 : -1))[0];
    if (prior && (prior.repeat || prior.month == null) && prior.amount > 0) return { ...prior, inherited: true, from: prior.month };
    return null;
  }

  const api = {
    ymd, parse, addDays, dow, diffDays, daysInMonth, fmtShort, fmtDay, MONTHS, SHORT,
    defaultHolidays, isBusinessDay, prevBusinessDay, payDates, payPeriods, budgetMonth, monthKeyFor, shiftKey,
    occurrences, transactionsInRange, duePostings, classify, countsNow, totals, resetCache, balances, daysUntilDue, nextDue, money, ctxOf, budgetFor, segments, segmentAt
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
