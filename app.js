/* Budget Tracker — app screens (step 1: Transactions, Add Transaction, setup screens under More). */
(function () {
  'use strict';
  const E = window.Engine;
  let DBH, S;
  const $app = () => document.getElementById('app');

  // ---------- small helpers ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => E.money(n);
  // fallback in case an older engine.js is still cached on the phone
  if (!E.nextDue) E.nextDue = (w, today) => { if (!w || !w.dueDay) return null; const d = E.daysUntilDue(w.dueDay, today); return d == null ? null : E.addDays(today, d); };
  const todayStr = () => {
    const q = new URLSearchParams(location.search).get('today');
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q;
    if (window.BT_DEMO) return window.BT_DEMO.today;
    const d = new Date();
    return E.ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
  };
  const hs = () => new Set(S.holidays.map((h) => h.date));
  const cat = (id) => S.categories.find((c) => c.id === id);
  const wallet = (name) => S.wallets.find((w) => w.name === name);
  const TYPE_COLOR = { bank: 'var(--bank)', savings: 'var(--savings)', credit: 'var(--credit)', loan: 'var(--loan)' };
  const TYPE_LABEL = { bank: 'Bank', savings: 'Savings', credit: 'Credit cards', loan: 'Loans' };
  const ICONS = {
    beauty: 'M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z',
    bills: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h4',
    car: 'M3 13l2-5h14l2 5v5h-3M3 13v5h3M3 13h18M7 18a1.5 1.5 0 1 0 3 0M14 18a1.5 1.5 0 1 0 3 0',
    food: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2-3 5s1 4 3 4v9',
    gifts: 'M4 11h16v10H4zM3 7h18v4H3zM12 7v14M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0',
    home: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6',
    rec: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
    shopping: 'M5 8h14l-1 13H6zM9 8a3 3 0 0 1 6 0',
    transit: 'M7 3h10a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zM5 10h14M8 21l2-4M16 21l-2-4',
    travel: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
    medical: 'M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z',
    income: 'M12 3v18M16 7h-6a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H8',
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
    phone: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2',
    bank: 'M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18',
    card: 'M3 6h18v12H3zM3 10h18M7 15h4',
    gas: 'M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M4 21h12M7 9h6M15 8l3 3v6a1.5 1.5 0 0 0 3 0V9l-3-3',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
    wrench: 'M14 6a4 4 0 0 0 5 5l-9 9-3-3 9-9a4 4 0 0 0-2-2z',
    bag: 'M6 8h12l-1 12H7zM9 8V6a3 3 0 0 1 6 0v2',
    basket: 'M4 10h16l-2 10H6zM8 10l3-6M16 10l-3-6M9 14v3M15 14v3',
    lamp: 'M8 3h8l3 8H5zM12 11v8M8 21h8',
    film: 'M4 5h16v14H4zM8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4',
    dumbbell: 'M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12',
    bed: 'M3 18V7M3 13h18v5M21 18v-3a3 3 0 0 0-3-3H10v1M5 10a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
    plane: 'M10 20l2-6-7-3 1-2 8 1 4-6 2 1-3 7 4 3-1 2-5-2-3 6z',
    coffee: 'M5 9h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 11h2a2 2 0 0 1 0 4h-2M8 3v3M11 3v3M14 3v3',
    pizza: 'M12 3l9 16H3zM6 14c3 2 9 2 12 0M10 10h.01M14 14h.01M11 16h.01',
    wine: 'M8 3h8v5a4 4 0 0 1-8 0zM12 12v8M8 21h8',
    beer: 'M6 6h10v14H6zM16 9h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M9 10v6M13 10v6M6 6a3 3 0 0 1 5-2 3 3 0 0 1 5 2',
    cake: 'M4 12h16v8H4zM4 15c2 2 4 2 6 0s4-2 6 0 4 2 4 0M12 12V8M12 5v.01',
    music: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    book: 'M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z',
    game: 'M6 9h12a3 3 0 0 1 3 3l-1 5a2 2 0 0 1-3.5 1L15 16H9l-1.5 2A2 2 0 0 1 4 17l-1-5a3 3 0 0 1 3-3zM8 12v3M6.5 13.5h3M15 13h.01M17 14.5h.01',
    ticket: 'M3 8a2 2 0 0 0 0 4v0a2 2 0 0 0 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 1 0-4V6H3zM14 6v12',
    camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
    paw: 'M12 13c-3 0-5 3-5 5a2 2 0 0 0 2 2c1 0 2-.5 3-.5s2 .5 3 .5a2 2 0 0 0 2-2c0-2-2-5-5-5zM3.9 10.5a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0M16.9 10.5a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0M7.4 6a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0M13.4 6a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0',
    baby: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM9 11h.01M15 11h.01M10 15c1 1 3 1 4 0M12 4c-1 1-1 2 0 3',
    school: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6',
    briefcase: 'M4 7h16v12H4zM9 7V5h6v2M4 12h16',
    bus: 'M6 3h12a2 2 0 0 1 2 2v12H4V5a2 2 0 0 1 2-2zM4 11h16M7 17v3M17 17v3M8 14h.01M16 14h.01',
    train: 'M7 3h10a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zM5 10h14M9 14h.01M15 14h.01M8 21l2-3M16 21l-2-3',
    bike: 'M2.5 16a3.5 3.5 0 1 0 7.0 0a3.5 3.5 0 1 0 -7.0 0M14.5 16a3.5 3.5 0 1 0 7.0 0a3.5 3.5 0 1 0 -7.0 0M6 16l4-8h5l3 8M10 8l3 8M8 5h3M15 8l-1-3h2',
    shirt: 'M8 4l-5 3 2 4 2-1v10h10V10l2 1 2-4-5-3c0 2-2 3-4 3S8 6 8 4z',
    scissors: 'M3 7a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M3 17a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M8.5 8.5L20 19M8.5 15.5L20 5',
    pill: 'M10 4l-6 6a4.2 4.2 0 0 0 6 6l6-6a4.2 4.2 0 0 0-6-6zM7 7l6 6',
    heartbeat: 'M3 12h4l2-4 4 8 2-4h6',
    tooth: 'M7 3c-3 0-4 3-3 6l2 10c.3 1.5 2 1.5 2.3 0L9 14h6l.7 5c.3 1.5 2 1.5 2.3 0l2-10c1-3 0-6-3-6-2 0-3 1-5 1S9 3 7 3z',
    wifi: 'M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01',
    bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
    water: 'M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z',
    flame: 'M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z',
    tv: 'M3 6h18v12H3zM8 21h8M12 18v3',
    laptop: 'M5 5h14v10H5zM2 19h20l-2-4H4z',
    tag: 'M3 3h8l10 10-8 8L3 11zM7.5 7.5h.01',
    piggy: 'M5 11a7 6 0 0 1 12-3l3-1-1 3a6 6 0 0 1 1 3v2h-2l-1 3h-3v-2h-4v2H7l-1-3a6 6 0 0 1-1-4zM15 11h.01M2 10c0 2 1 3 3 3',
    chart: 'M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6',
    umbrella: 'M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM12 12v7a2 2 0 0 1-4 0',
    leaf: 'M5 19c0-9 5-14 15-15-1 10-6 15-15 15zM5 19l8-8',
    church: 'M12 2v4M10 4h4M12 6l6 5v10H6V11zM10 21v-5h4v5',
    donate: 'M12 8c-1.5-2-5-1.5-5 1 0 2.5 5 5 5 5s5-2.5 5-5c0-2.5-3.5-3-5-1zM3 15l4 4h8l5-3-1-2-5 2H9',
    key: 'M4 15a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M11 12l8-8M16 7l3 3M14 9l2 2',
    pin: 'M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12zM12 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
    parking: 'M5 3h14v18H5zM10 17V7h3a3 3 0 0 1 0 6h-3',
    sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
    cloud: 'M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-1 9z',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
    sortIc: 'M4 7h10M4 12h7M4 17h4M17 6v12M14 15l3 3 3-3',
    grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
    copy: 'M9 9h11v11H9zM5 15V4h11',
    burger: 'M4 11a8 6 0 0 1 16 0zM3 14h18M5 17h14v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z',
    icecream: 'M7 10a5 5 0 0 1 10 0zM7 10l5 11 5-11',
    cart: 'M3 4h2l2.5 11h10.5l2-8H6.3M7.5 19.5a1.5 1.5 0 1 0 3.0 0a1.5 1.5 0 1 0 -3.0 0M15.5 19.5a1.5 1.5 0 1 0 3.0 0a1.5 1.5 0 1 0 -3.0 0',
    glasses: 'M3.0 14a3.5 3.5 0 1 0 7.0 0a3.5 3.5 0 1 0 -7.0 0M14.0 14a3.5 3.5 0 1 0 7.0 0a3.5 3.5 0 1 0 -7.0 0M10 14h4M3 14l2-6M21 14l-2-6',
    headphones: 'M4 16v-4a8 8 0 0 1 16 0v4M4 15h3v6H4zM17 15h3v6h-3z',
    hammer: 'M14 4l6 6-3 3-6-6zM12 8L3 17l3 3 9-9',
    brush: 'M19 3l2 2-9 9-2-2zM10 12l-3 3c-2 0-3 1.5-3 3.5 0 1-.5 2-1.5 2.5 4 0 7.5-1 7.5-5l2-2',
    bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c1 1 1 2 1 2.5h6c0-.5 0-1.5 1-2.5A6 6 0 0 0 12 3z',
    mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
    trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6',
    plant: 'M12 21v-9M12 12c0-4 3-7 7-7 0 4-3 7-7 7zM12 15c0-3-2-5-6-5 0 3 2 5 6 5zM7 21h10',
    coin: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M15 9c-.5-1-1.7-1.5-3-1.5-1.8 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2-1.4 0-2.6-.6-3-1.6M12 6v1.5M12 16.5V18',
    gem: 'M6 3h12l4 6-10 12L2 9zM2 9h20M9 3l3 18M15 3l-3 18',
    baguette: 'M5 19L19 5a2.5 2.5 0 0 1 0 3.5L8.5 19a2.5 2.5 0 0 1-3.5 0zM9 13l2 2M12 10l2 2M15 7l2 2',
    cocktail: 'M4 5h16l-8 8zM12 13v8M8 21h8M14 9l4-6',
    bubbletea: 'M6 8h12l-1.6 12a1.5 1.5 0 0 1-1.5 1.3H9.1a1.5 1.5 0 0 1-1.5-1.3zM5 8h14M7 8a5 4 0 0 1 10 0M13 2l-1 6M9.4 17a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M13.4 17a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M11.4 15a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0',
    egg: 'M12 3c4 0 5 3 7 5s2 7-2 9-4 4-8 2-6-4-5-8 4-8 8-8zM8 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
    noodles: 'M3 11h18a9 7 0 0 1-18 0zM9 21h6M7 11c1-4 4-6 8-6M11 11c1-3 3-4 6-4M15 3l6 4',
    apple: 'M12 8c-2-1.5-7-1.5-7 4.5 0 4 3 8.5 5 8.5 1 0 1.3-.5 2-.5s1 .5 2 .5c2 0 5-4.5 5-8.5 0-6-5-6-7-4.5zM12 8c0-2 1-4 3-5',
    carrot: 'M4 20c3-1 8-5 11-9a3 3 0 0 0-4-4C8 10 5 15 4 20zM14 8l2-4M15 10l5-1M8 13l2 1M6 16l2 1',
    cookie: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M8.4 9a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M13.4 8a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M14.9 13a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M9.4 15.5a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M11.4 12a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0',
    donut: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M7 8l1 1M16 6.5l-1 1M17.5 14l-1-.5M8 16.5l1-1',
    popcorn: 'M6 10h12l-2 11H8zM10 10l.5 11M14 10l-.5 11M6 10a2.5 2.5 0 0 1 1.5-4.5 3 3 0 0 1 5-1.5 3 3 0 0 1 4.5 1.5A2.5 2.5 0 0 1 18 10',
    candy: 'M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M9.2 9.2L4 6l1 4.5L3.5 13l5.7-1M14.8 14.8L20 18l-1-4.5 1.5-2.5-5.7 1',
    fish: 'M2 7l4 5-4 5M6 12c2-4 6-6 9-6 3 0 6 3 7 6-1 3-4 6-7 6-3 0-7-2-9-6zM16.4 11a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0',
    drumstick: 'M14 3a6 6 0 0 1 4 10.5c-2 2-5 2-7 1l-3 3a2 2 0 1 1-2.5 2.5 2 2 0 1 1-2.5-2.5 2 2 0 1 1 2.5-2.5l3-3c-1-2-1-5 1-7a6 6 0 0 1 4.5-2z',
    milk: 'M8 8l2-4h4l2 4v13H8zM8 8h8M10 4V2h4v2M8 13h8',
    laundry: 'M5 3h14v18H5zM5 7h14M7.4 5a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M10.4 5a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M8 14a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
    faucet: 'M3 10h7V7h6a4 4 0 0 1 4 4v2h-4v-2h-2v3H3zM10 7V4M7 4h6M17.4 17a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M17.4 20.5a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0',
    plug: 'M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4',
    spray: 'M8 10h7v11H8zM9 10V6h5v4M14 7l3-2.5M9 6l-1-3h5M18 4h2M18 7l2 1M8 15h7',
    fan: 'M10.4 10a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0M12 8.4C11.5 4 9 2.5 7.5 3.5S8 8 10.4 9.6M13.6 10c4.4.5 6 3 5 4.5s-4.5-1-5.6-3.4M11 11.4c-2.5 3.5-5 4-5.8 2.6S7.5 10 10.4 9.8M12 11.6V20M8 21h8',
    lock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3M12 15v2',
    boat: 'M3 16h18l-3 5H6zM12 3v12M12 4l7 11h-7M11 7l-5 8h5',
    taxi: 'M3 14l2-5h14l2 5v4h-3M3 14v4h3M3 14h18M10 9V6h4v3M6.0 18a1.5 1.5 0 1 0 3.0 0a1.5 1.5 0 1 0 -3.0 0M15.0 18a1.5 1.5 0 1 0 3.0 0a1.5 1.5 0 1 0 -3.0 0',
    moto: 'M2 16a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M16 16a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M5 16l4-6h5l2.5 6M14 10l2-4h3M9 10L7 7H4',
    evcharge: 'M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M2 21h14M10 7l-3 4h3l-2 4M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-2-2',
    tire: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M8.5 12a3.5 3.5 0 1 0 7.0 0a3.5 3.5 0 1 0 -7.0 0M12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21',
    palm: 'M11 21c0-6 1.5-10 4-13M15 8c-2-3-6-3-8-1M15 8c1-3 5-4 7-2M15 8c3 0 6 2 6 5M15 8c-3 1-5 4-5 7M4 21h16',
    map: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15',
    tent: 'M3 20L12 4l9 16zM9 20l3-6 3 6',
    dress: 'M9 3h6l-1 4 4 14H6l4-14zM10 7h4',
    heels: 'M3 17c0-1.5 1-2 2.5-2H9l3.5-5.5C14 7.5 16 7 18 7.5c2 .5 3 2 3 4V17H3zM18 17l-1 4',
    sneaker: 'M3 16V9l4 1 3-4 4 4 7 3v3H3zM3 19h18M10 10l1 2M12.5 9l1 2',
    cap: 'M4 15a8 8 0 0 1 16 0zM12 7V6M3 15h18l-2 3H5zM12 7v8',
    watch: 'M6 12a6 6 0 1 0 12 0a6 6 0 1 0 -12 0M9 6.6L10 3h4l1 3.6M9 17.4l1 3.6h4l1-3.6M12 9v3l2 1.5',
    package: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10M7.5 5l9 4',
    lipstick: 'M9 21h6V11H9zM10 11V6l4-3v8M8 15h8',
    eye: 'M2 12c3-5 6-7 10-7s7 2 10 7c-3 5-6 7-10 7s-7-2-10-7zM9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
    cat: 'M5 3l3.5 4h7L19 3v10a7 7 0 0 1-14 0zM11 16h2M8.4 12a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M14.4 12a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0',
    dog: 'M8 5H5l-1 6 3 1M16 5h3l1 6-3 1M7 7c0-2 2-3 5-3s5 1 5 3v6a5 5 0 0 1-10 0zM11 15h2M9.4 10.5a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M13.4 10.5a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0',
    family: 'M5 7a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M14.5 8.5a2.5 2.5 0 1 0 5.0 0a2.5 2.5 0 1 0 -5.0 0M3 21v-3a5 5 0 0 1 10 0v3M14 21v-2a3.5 3.5 0 0 1 7 0v2',
    teddy: 'M6 14a6 6 0 1 0 12 0a6 6 0 1 0 -12 0M4.0 6.5a2.5 2.5 0 1 0 5.0 0a2.5 2.5 0 1 0 -5.0 0M15.0 6.5a2.5 2.5 0 1 0 5.0 0a2.5 2.5 0 1 0 -5.0 0M11 16.5h2M9.4 13a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M13.4 13a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0',
    balloon: 'M12 3a6 6 0 0 1 6 6c0 4-3 7-6 7s-6-3-6-7a6 6 0 0 1 6-6zM11 16h2l-1 2M12 18c-1.5 2 1.5 2 0 4',
    gavel: 'M8 8l5-5 5 5-5 5zM10.5 10.5L3 18l2 2 7.5-7.5M13 21h8',
    flower: 'M9 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M13 10a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M9 14a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M5 10a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M12 17v5M12 20c-2-.5-3.5-1.5-4.5-3',
    tree: 'M12 22v-6M12 16c-4 0-7-2-7-6 0-3 2-4 3-4 0-2 2-4 4-4s4 2 4 4c1 0 3 1 3 4 0 4-3 6-7 6z',
    cash: 'M2 6h20v12H2zM6 6a4 4 0 0 1-4 4M18 6a4 4 0 0 0 4 4M6 18a4 4 0 0 0-4-4M18 18a4 4 0 0 1 4-4M9.5 12a2.5 2.5 0 1 0 5.0 0a2.5 2.5 0 1 0 -5.0 0',
    moneybag: 'M9 3h6l-2 4h-2zM11 7C6 9 4 13 4 16a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5c0-3-2-7-7-9M14 12.5c-.5-1-3.5-1-3.5.5s3.5 1 3.5 2.5-3 1.5-3.5.5M12.3 10.5v1M12.3 17.5v1',
    calculator: 'M6 3h12v18H6zM8 6h8v4H8zM8.4 14a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M11.4 14a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M14.4 14a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M8.4 17.5a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M11.4 17.5a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M14.4 17.5a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0',
    safe: 'M4 4h16v15H4zM6 19v2M18 19v2M16.5 9v5M7 11.5a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
    guitar: 'M19 3l2 2-6 6M14.5 9.5a3 3 0 0 0-4-1L7 9a4 4 0 0 0-3 6c1 3 4 5 6 5a4 4 0 0 0 4-3l1-3.5a3 3 0 0 0-.5-3M8.5 14a1.5 1.5 0 1 0 3.0 0a1.5 1.5 0 1 0 -3.0 0',
    mic: 'M9 3h6v10a3 3 0 0 1-6 0zM5 11a7 7 0 0 0 14 0M12 18v3M8 21h8',
    dice: 'M4 4h16v16H4zM7.4 8a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M15.4 8a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M11.4 12a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M7.4 16a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M15.4 16a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0',
    cards: 'M9 3h10v15H9zM9 6L4 7.5l3.5 13L13 19M14 7c-1 1.5-2.5 2.5-2.5 4a2.5 2.5 0 0 0 5 0c0-1.5-1.5-2.5-2.5-4zM14 13.5V15',
    chess: 'M7 21h10M8 18h8M9 18l1-8h4l1 8M8 10h8M8 10V5h2v2h1.5V5h1v2H14V5h2v5',
    ball: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M3.5 9c4 1 8 0 11-6M20.5 15c-4-1-8 0-11 6',
    golf: 'M6 21V3l9 3-9 3M3 21h11M16 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
    yarn: 'M4 13a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M5 10c4 0 9 3 11 8M7 7.5c4 1 8.5 5.5 10 10M14 6.8C10 9 7 14 7 19M17 3l-4 7M20 5l-5 7',
    clock: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 7v5l3 2',
    masks: 'M3 3h9v6a4.5 4.5 0 0 1-9 0zM5.5 10c1 1 3 1 4 0M12 8h9v7a4.5 4.5 0 0 1-9 0M14.5 17c1-1 3-1 4 0M5.4 6a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M8.4 6a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M14.4 12a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0M17.4 12a0.6 0.6 0 1 0 1.2 0a0.6 0.6 0 1 0 -1.2 0',
    pencil: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13.5 6.5l4 4',
    plus: 'M12 5v14M5 12h14',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    transfer: 'M4 8h14l-3-3M20 16H6l3 3',
    adjust: 'M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4',
    chevDown: 'M6 9l6 6 6-6', chevUp: 'M6 15l6-6 6 6', back: 'M19 12H5M11 5l-7 7 7 7', close: 'M6 6l12 12M18 6L6 18',
    cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4', repeat: 'M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M20 4v5h-5M4 20v-5h5',
    navHome: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6', navSum: 'M12 3v9h9M21 12A9 9 0 1 1 12 3', navTx: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01', navMore: 'M5 12h.01M12 12h.01M19 12h.01',
    palette: 'M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-2 0-3 3 0 4-1 3-2 3-5a9 9 0 0 0-9-7zM7.5 11h.01M10 7.5h.01M14.5 7.5h.01',
    wallet: 'M3 7h18v12H3zM3 7l2-3h14l2 3M16 13h2', grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', check: 'M5 12l4 4 10-10M4 20h16',
    sync: 'M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M20 4v5h-5M4 20v-5h5', download: 'M12 4v11M7 10l5 5 5-5M5 20h14', budget: 'M12 3v9h9M21 12A9 9 0 1 1 12 3'
  };
  const ICON_GROUPS = [
    ['Food & drink', ['food', 'coffee', 'pizza', 'wine', 'beer', 'cake', 'basket', 'burger', 'icecream', 'baguette', 'cocktail', 'bubbletea', 'egg', 'noodles', 'apple', 'carrot', 'cookie', 'donut', 'popcorn', 'candy', 'fish', 'drumstick', 'milk']],
    ['Home & bills', ['home', 'bills', 'phone', 'wifi', 'bolt', 'water', 'flame', 'tv', 'lamp', 'bed', 'key', 'wrench', 'bulb', 'hammer', 'mail', 'laundry', 'trash', 'faucet', 'plug', 'spray', 'fan', 'lock']],
    ['Travel', ['car', 'gas', 'parking', 'transit', 'bus', 'train', 'bike', 'plane', 'travel', 'pin', 'boat', 'taxi', 'moto', 'evcharge', 'tire', 'palm', 'map', 'tent']],
    ['Shopping', ['shopping', 'bag', 'shirt', 'tag', 'gifts', 'laptop', 'cart', 'glasses', 'gem', 'dress', 'heels', 'sneaker', 'cap', 'watch', 'package']],
    ['Health & beauty', ['medical', 'pill', 'heartbeat', 'tooth', 'dumbbell', 'beauty', 'scissors', 'lipstick', 'eye']],
    ['Family & life', ['baby', 'paw', 'school', 'briefcase', 'church', 'donate', 'plant', 'cat', 'dog', 'family', 'teddy', 'balloon', 'gavel', 'flower', 'tree']],
    ['Money', ['income', 'bank', 'card', 'piggy', 'chart', 'shield', 'coin', 'wallet', 'cash', 'moneybag', 'calculator', 'safe']],
    ['Miscellaneous', ['rec', 'film', 'music', 'game', 'ticket', 'camera', 'book', 'star', 'sun', 'cloud', 'umbrella', 'leaf', 'headphones', 'brush', 'trophy', 'cal', 'guitar', 'mic', 'dice', 'cards', 'chess', 'ball', 'golf', 'palette', 'yarn', 'clock', 'masks']],
  ];
  const ICON_CHOICES = ICON_GROUPS.flatMap((g) => g[1]);
  // tile colours, grouped by colour family (4 shades each, light to dark)
  const COLOR_FAMILIES = [['#D46A8C', '#A94B69', '#8C5A6E', '#6D1D3B'], ['#C65A4E', '#A3423F', '#8E3434', '#6E2A2A'], ['#D9823B', '#B5651D', '#9A5420', '#7A4220'], ['#A07850', '#8A6642', '#6A5A3C', '#4E3B2A'], ['#C9A227', '#B08A1E', '#957418', '#7A5F14'], ['#7E9A3A', '#64852F', '#4B6B2E', '#3A5424'], ['#4E9A62', '#3E7A4E', '#3C7A5C', '#2D5E3E'], ['#3E9A90', '#2E7A72', '#256660', '#1C504C'], ['#4F86C6', '#2F5F95', '#24497A', '#46606C'], ['#5560A8', '#2C3E7A', '#3D3A8C', '#23295A'], ['#8E62C4', '#6B3FA0', '#563383', '#3F2563'], ['#8A8590', '#5C5960', '#4A4750', '#34323A']];
  const COLOR_CHOICES = COLOR_FAMILIES.flat();
  // per-icon viewBox so every glyph sits centred in its tile without clipping
  const ICON_VB = {"beauty": "0.0 -2.0 24 24", "car": "0.0 1.75 24 24", "food": "-1.0 0.0 24 24", "gifts": "0.0 0.68 24 24", "rec": "0.0 1.07 24 24", "shopping": "0.0 1.0 24 24", "star": "-0.0 -0.55 24 24", "wrench": "1.0 1.0 24 24", "plane": "1.0 0.5 24 24", "pizza": "0.0 -1.0 24 24", "beer": "1.0 -0.39 24 24", "game": "0.0 1.85 24 24", "ticket": "-1.0 0.0 24 24", "school": "0.0 -1.25 24 24", "pill": "-2.0 -2.0 24 24", "flame": "0.0 -1.5 24 24", "tv": "0.0 1.5 24 24", "piggy": "-1.0 0.05 24 24", "donate": "-0.5 0.88 24 24", "check": "0.0 1.0 24 24", "burger": "0.0 1.0 24 24", "icecream": "0.0 1.0 24 24", "glasses": "0.0 0.75 24 24", "plant": "0.5 1.0 24 24", "egg": "0.03 -0.59 24 24", "drumstick": "-1.19 0.21 24 24", "faucet": "-0.5 0.55 24 24", "spray": "2.0 0.0 24 24", "taxi": "0.0 0.75 24 24", "palm": "1.0 0.98 24 24", "heels": "0.0 2.16 24 24", "dog": "0.0 -1.0 24 24", "chess": "0.0 1.0 24 24", "masks": "0.0 -0.75 24 24"};
  const svg = (name, size = 22, color = 'currentColor', sw = 2) => `<svg width="${size}" height="${size}" viewBox="${ICON_VB[name] || '0 0 24 24'}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[name] || ICONS.star}"></path></svg>`;

  // ---------- UI state ----------
  const ui = { tab: 'transactions', stack: [], month: null, paysOpen: true, futureOpen: true, sheet: null, form: null, toast: null };
  let TODAY;

  let undoFn = null;
  function toast(msg, undo) {
    ui.toast = msg; undoFn = undo || null; render();
    clearTimeout(toast.t); toast.t = setTimeout(() => { ui.toast = null; undoFn = null; render(); }, undo ? 5000 : 1800);
  }
  // Use browser history (so Android's back button works) only when the app is the whole page, not inside a preview frame.
  const useHistory = (() => { try { return window.top === window.self; } catch (e) { return false; } })();
  const push = (screen) => { ui.stack.push(screen); if (useHistory) history.pushState({ d: ui.stack.length }, ''); ui.sheet = null; render(); window.scrollTo(0, 0); };
  const pop = () => { if (ui.sheet) { ui.sheet = null; render(); return; } if (ui.stack.length) { ui.stack.pop(); render(); } };
  window.addEventListener('popstate', () => { if (ui.sheet) { ui.sheet = null; render(); history.pushState({}, ''); return; } if (ui.stack.length) { ui.stack.pop(); render(); } });
  const goBack = () => { if (!ui.stack.length) return; if (useHistory) history.back(); else { ui.stack.pop(); render(); } };
  const leaveTo = (n) => { if (useHistory) history.go(-n); };
  // In-app confirm (browser confirm() is blocked in some frames).
  function ask(message, yesLabel, onYes) { ui.sheet = { name: 'confirm', message, yesLabel, onYes }; render(); }

  // ---------- data actions ----------
  async function postDue() {
    const due = E.duePostings(S, TODAY);
    if (!due.length) return;
    due.forEach(({ rule, date }) => S.transactions.push({ ...rule.template, id: DB.uid(), date, ruleId: rule.id, counts: rule.counts || 'entry', createdAt: new Date().toISOString() }));
    await save('transactions');
  }
  const save = (t) => DBH.save(t).then(() => markDirty(t));

  // ---------- rendering ----------
  let lastScreenKey = '', lastSheetKey = '';
  // Remember where you are (tab, open screens, half-typed entry) so a pull-to-refresh lands you back in the same place.
  function saveNav() {
    try { sessionStorage.setItem('bt-nav', JSON.stringify({ tab: ui.tab, month: ui.month, stack: ui.stack, form: ui.form, sumPeriod: ui.sumPeriod, sumWallet: ui.sumWallet, homeYear: ui.homeYear, paysOpen: ui.paysOpen, futureOpen: ui.futureOpen })); } catch (e) { /* storage unavailable */ }
  }
  function restoreNav() {
    try {
      const n = JSON.parse(sessionStorage.getItem('bt-nav') || 'null');
      if (!n) return false;
      if (TABS[n.tab]) ui.tab = n.tab;
      if (n.month) ui.month = clampMonth(n.month);
      ['sumPeriod', 'sumWallet', 'paysOpen', 'futureOpen', 'homeYear'].forEach((k) => { if (n[k] !== undefined) ui[k] = n[k]; });
      const stack = [];
      for (const sc of n.stack || []) {
        if (!sc || !SCREENS[sc.name]) break;
        if (sc.name === 'add' && !n.form) break;
        if ((sc.name === 'acct' || sc.name === 'wallet') && !S.wallets.some((w) => w.id === (sc.id || (sc.wallet && sc.wallet.id))) && !(sc.isNew)) break;
        stack.push(sc);
      }
      ui.stack = stack;
      if (stack.some((x) => x.name === 'add')) ui.form = n.form;
      if (useHistory) stack.forEach((x, i) => history.pushState({ d: i + 1 }, ''));
      return true;
    } catch (e) { return false; }
  }
  function render() {
    const top = ui.stack[ui.stack.length - 1];
    let html = '';
    try {
    if (top) html = SCREENS[top.name](top);
    else html = TABS[ui.tab]() + navBar() + `<button class="fab" data-act="add" aria-label="Add transaction">${svg('plus', 26, 'currentColor', 2.5)}</button>`;
    } catch (err) {
      console.error(err);
      html = `<section class="screen">${top ? header('Something went wrong') : '<h1>Something went wrong</h1>'}<div class="card"><p style="margin:0">This screen hit an error: <b>${esc(err && err.message)}</b></p><p class="muted small" style="margin:0">Close the app fully and reopen it. If an update just went out, refresh once so all files match. If it keeps happening, send Claude a screenshot of this.</p></div></section>` + (top ? '' : navBar());
    }
    if (ui.sheet) html += SHEETS[ui.sheet.name](ui.sheet);
    if (th().net === 'simple') html = html.replace(/▴ ?/g, '+').replace(/▾ ?/g, '−');
    if (window.BT_DEMO) html = `<div class="demobar">Sample data · pretending today is ${E.fmtDay(TODAY)}, ${TODAY.slice(0, 4)}</div>` + html;
    if (ui.toast) html += `<div class="toast ${undoFn ? 'withundo' : ''}" role="status"><span>${esc(ui.toast)}</span>${undoFn ? '<button data-act="undo">Undo</button>' : ''}</div>`;
    const prev = document.querySelector('.monthscroll');
    const keepX = prev ? prev.scrollLeft : null;
    $app().innerHTML = html;
    saveNav();
    { const key = (top ? top.name : ui.tab) + '|' + ui.stack.length, sk = ui.sheet ? ui.sheet.name : '';
      const a = $app(); a.classList.toggle('enter', key !== lastScreenKey); a.classList.toggle('sheetenter', !!sk && sk !== lastSheetKey);
      lastScreenKey = key; lastSheetKey = sk; }
    document.querySelectorAll('.hscroll:not(.monthscroll)').forEach((row) => {
      const on = row.querySelector('.chip.on');
      if (on && (on.offsetLeft < row.scrollLeft || on.offsetLeft + on.offsetWidth > row.scrollLeft + row.clientWidth)) row.scrollLeft = on.offsetLeft - 16;
    });
    const ms = document.querySelector('.monthscroll');
    if (ms) {
      const on = ms.querySelector('.on');
      if (keepX != null && !ui.recenter) ms.scrollLeft = keepX;
      else if (on) ms.scrollLeft = on.offsetLeft - (ms.clientWidth - on.offsetWidth) / 2;
      ui.recenter = false;
    }
  }
  function navBar() {
    const tabs = [['home', 'Home', 'navHome'], ['summary', 'Summary', 'navSum'], ['transactions', 'Transactions', 'navTx'], ['more', 'More', 'navMore']];
    return `<nav class="tabbar" aria-label="Main">${tabs.map(([k, l, i]) => `<button class="${ui.tab === k ? 'on' : ''}" data-act="tab" data-v="${k}"><span class="pill">${svg(i)}</span>${l}</button>`).join('')}</nav>`;
  }
  const header = (title, opts = {}) => `<div class="row"><button class="iconbtn" data-act="back" aria-label="Back">${svg('back')}</button><h1 style="font-size:26px" class="grow">${esc(title)}</h1>${opts.right || ''}</div>`;

  // ---------- tabs ----------
  const TABS = {
    home: renderHome,
    summary: renderSummary,
    transactions: renderTransactions,
    more: renderMore
  };

  function monthLabel(key) { const [y, m] = key.split('-').map(Number); return E.MONTHS[m - 1] + (y !== Number(TODAY.slice(0, 4)) ? ` ${y}` : ''); }

  function txView(t) {
    if (t.skipped) {
      const c = cat(t.category), sub = cat(t.sub);
      return `<button class="tx skippedtx" data-act="unskipAsk" data-id="${esc(t.id)}" aria-label="Skipped payment: ${esc(t.title || (c && c.name) || 'Recurring')}. Tap to undo the skip.">
        <span class="ic" style="background:var(--card2)">${svg((sub && sub.icon) || (c && c.icon) || 'transfer', 22, 'var(--muted)')}</span>
        <span class="grow" style="display:flex;flex-direction:column;gap:6px;min-width:0"><span class="row" style="gap:6px"><span class="name grow" style="text-decoration:line-through;color:var(--muted)">${esc(t.title || (sub && sub.name) || (c && c.name) || 'Recurring')}</span><span class="amt" style="color:var(--muted);text-decoration:line-through">${money(t.amount)}</span></span>
        <span class="row" style="gap:6px"><span class="ctag acct" style="background:var(--card2)">Skipped</span><span class="muted" style="font-size:13px">Tap to undo</span></span></span></button>`;
    }
    const c = cat(t.category), sub = cat(t.sub);
    let icon = c ? (sub && sub.icon) || c.icon : 'transfer', bg = c ? c.color : '#5C5960';
    let name = t.title || (sub && sub.name) || (c && c.name) || 'Transfer';
    let amt, color, category;
    const a = Number(t.amount) || 0;
    if (t.type === 'income') { amt = '+' + money(a); color = 'var(--green)'; category = c ? c.name + (sub ? ': ' + sub.name : '') : 'Income'; }
    else if (t.type === 'expense') { amt = '−' + money(a); color = 'var(--red)'; category = c ? c.name + (sub ? ': ' + sub.name : '') : 'Expense'; }
    else if (t.type === 'adjustment') { icon = 'adjust'; bg = '#5C5960'; name = t.title || 'Balance correction'; amt = (a < 0 ? '−' : '+') + money(a); color = 'var(--muted)'; category = 'Correct balance'; }
    else {
      icon = 'transfer'; bg = '#5C5960';
      const cls = E.classify(S, t);
      if (cls.savings) { amt = '−' + money(a); color = 'var(--pink)'; category = 'Savings transfer'; }
      else { amt = money(a); color = 'var(--muted)'; category = (wallet(t.toWallet) || {}).type === 'credit' ? 'Card payment' : 'Transfer'; }
      name = t.title || (cls.savings ? 'To ' + (t.toWallet || '').replace(/^\[.*?\]\s*/, '') : 'Transfer');
    }
    const TYPE_HEX = { bank: '#B8B2B9', savings: '#8FD9A0', credit: '#7FB2F0', loan: '#F2A65A' };
    const acctTag = (name) => { const hex = TYPE_HEX[(wallet(name) || {}).type] || '#B8B2B9'; return `<span class="ctag acct" style="background:${hex}45">${esc(name)}</span>`; };
    const walletTags = t.type === 'transfer' ? `${acctTag(t.wallet)}<span class="muted" aria-label="to">→</span>${acctTag(t.toWallet)}` : acctTag(t.wallet);
    const catBg = t.type === 'transfer' || t.type === 'adjustment' ? '#4A4750' : c ? c.color : '#4A4750';
    const acts = `<button class="act-more" data-act="txMore" data-id="${esc(t.id)}" aria-label="More">${svg('navMore', 24, '#fff', 3)}</button><button class="act-del" data-act="txDelete" data-id="${esc(t.id)}" aria-label="Delete">${svg('trash', 22, '#fff')}</button>`;
    const tagChips = (t.tags || []).map((g) => `<span class="ctag acct" style="background:var(--card2)">#${esc(g)}</span>`).join('');
    if (th().layout === 'compact') return `<div class="swipe" data-id="${esc(t.id)}"><div class="acts l">${acts}</div><div class="acts r">${acts}</div><button class="tx compact" data-act="${t.projected ? 'occ' : 'edit'}" data-id="${esc(t.id)}">
      <span class="ic" style="background:${bg};width:38px;height:38px">${svg(icon, 18, '#fff')}</span>
      <span class="grow" style="display:flex;flex-direction:column;gap:2px;min-width:0"><span class="row" style="gap:6px">${t.ruleId ? svg('repeat', 14, 'var(--pink)', 2.2) : ''}<span class="name grow" style="font-size:16px">${esc(name)}</span><span class="amt" style="color:${color};font-size:16px">${amt}</span></span>
      <span class="muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(category)} · ${esc(t.type === 'transfer' ? shortName(t.wallet) + ' → ' + shortName(t.toWallet) : t.wallet)}${(t.tags || []).map((g) => ' · #' + esc(g)).join('')}</span></span></button></div>`;
    return `<div class="swipe" data-id="${esc(t.id)}"><div class="acts l">${acts}</div><div class="acts r">${acts}</div><button class="tx" data-act="${t.projected ? 'occ' : 'edit'}" data-id="${esc(t.id)}">
      <span class="ic" style="background:${bg}">${svg(icon, 22, '#fff')}</span>
      <span class="grow" style="display:flex;flex-direction:column;gap:6px">
        <span class="row" style="gap:6px">${t.ruleId ? `<span role="img" aria-label="Recurring">${svg('repeat', 16, 'var(--pink)', 2.2)}</span>` : ''}<span class="name grow">${esc(name)}</span><span class="amt" style="color:${color}">${amt}</span></span>
        ${t.note ? `<span class="muted" style="font-size:13px">${esc(t.note)}</span>` : ''}
        <span class="row" style="flex-wrap:wrap;gap:6px;row-gap:6px">${walletTags}<span class="ctag" style="background:${catBg}B3">${t.type === 'income' || t.type === 'expense' ? svg(icon, 14, '#fff') : ''}${esc(category)}</span>${tagChips}</span>
      </span></button></div>`;
  }
  function dayGroups(list, pays) {
    const byDay = {};
    list.forEach((t) => { (byDay[t.date] = byDay[t.date] || []).push(t); });
    return Object.keys(byDay).sort().reverse().map((d) => {
      const rows = byDay[d];
      const net = rows.reduce((s, t) => s + (t.skipped ? 0 : t.type === 'income' ? +t.amount : t.type === 'expense' ? -t.amount : 0), 0);
      const pay = pays.find((p) => d >= p.start && d <= p.end);
      const label = (d === TODAY ? 'Today, ' : '') + E.fmtDay(d) + (d > TODAY && pay ? ` · ${pay.label}` : '');
      return `<div style="display:flex;flex-direction:column;gap:6px"><div class="dayhead"><span>${label}</span><span>${net ? (net < 0 ? '−' : '+') + money(net) : ''}</span></div>${rows.map(txView).join('')}</div>`;
    }).join('');
  }

  function renderTransactions() {
    const H = hs();
    const bm = E.budgetMonth(S.schedule, ui.month, H);
    const list = E.transactionsInRange(S, bm.start, bm.end);
    const mt = E.totals(S, bm.start, bm.end, TODAY);
    const pays = bm.pays.map((p) => ({ ...p, t: E.totals(S, p.start, p.end, TODAY) }));
    // skipped upcoming payments stay visible (faded) so they can be brought back
    const skipped = S.skips.filter((k) => k.date > TODAY && k.date >= bm.start && k.date <= bm.end).map((k) => { const r = S.rules.find((x) => x.id === k.ruleId); return r && r.active !== false ? { ...r.template, id: `skip:${r.id}|${k.date}`, date: k.date, ruleId: r.id, skipped: true } : null; }).filter(Boolean);
    const future = list.filter((t) => t.date > TODAY).concat(skipped), past = list.filter((t) => t.date <= TODAY);
    const first = E.monthKeyFor(S.schedule, S.settings.startDate, H);
    const keys = []; for (let k = first; k <= E.shiftKey(ui.month > first ? ui.month : first, 12); k = E.shiftKey(k, 1)) keys.push(k);
    return `<section class="screen">
      <div class="between"><h1>Transactions</h1><button class="iconbtn" data-act="search" aria-label="Search transactions">${svg('search', 22)}</button></div>
      <div class="tabs hscroll monthscroll" role="tablist" aria-label="Month" style="margin:0 -16px;padding:0 16px">${keys.map((k) => (k.endsWith('-01') && k !== keys[0] ? `<span class="yearmark" aria-hidden="true">${k.slice(0, 4)}</span>` : '') + `<button role="tab" aria-selected="${k === ui.month}" aria-label="${E.MONTHS[Number(k.slice(5)) - 1]} ${k.slice(0, 4)}" class="${k === ui.month ? 'on' : ''}" data-act="month" data-v="${k}" style="flex:none;padding:0 18px">${E.MONTHS[Number(k.slice(5)) - 1]}</button>`).join('')}</div>
      <section style="background:var(--card);border-radius:14px;overflow:hidden">
        <button class="collapse" style="background:transparent;height:40px;color:var(--muted);font-size:13px;font-weight:700" data-act="togglePays" aria-expanded="${ui.paysOpen}" aria-label="Show Pay 1 and Pay 2">${E.fmtShort(bm.start)} – ${E.fmtShort(bm.end)}${svg(ui.paysOpen ? 'chevUp' : 'chevDown', 18, 'currentColor', 2.5)}</button>
        <div class="bar3" style="height:44px;align-items:center;font-size:16px" aria-label="Month: income, expenses, remaining"><span class="green">▴ ${money(mt.income)}</span><span class="red">▾ ${money(mt.out)}</span><span>= ${mt.remaining < 0 ? '−' : ''}${money(mt.remaining)}</span></div>
        ${ui.paysOpen ? `<div style="display:flex;flex-direction:column;gap:8px;padding:0 8px 8px">${pays.map((p) => `
          <div style="background:var(--card2);border-radius:12px;padding:8px 6px 10px;display:flex;flex-direction:column;gap:6px">
            <div class="between" style="padding:0 8px;font-size:13px"><b>${p.label}</b><span style="color:var(--soft)">${E.fmtShort(p.start)} – ${E.fmtShort(p.end)}</span></div>
            <div class="bar3" style="font-size:16px"><span class="green">▴ ${money(p.t.income)}</span><span class="red">▾ ${money(p.t.out)}</span><span>= ${p.t.remaining < 0 ? '−' : ''}${money(p.t.remaining)}</span></div>
          </div>`).join('')}</div>` : ''}
      </section>
      ${future.length ? `<button class="collapse" data-act="toggleFuture" aria-expanded="${ui.futureOpen}">Future Transactions${svg(ui.futureOpen ? 'chevUp' : 'chevDown', 18, 'currentColor', 2.5)}</button>${ui.futureOpen ? dayGroups(future, pays) : ''}` : ''}
      ${past.length ? dayGroups(past, pays) : (!future.length ? `<div class="empty">No transactions in ${monthLabel(ui.month)} yet.<br>Tap + to add one.</div>` : '')}
    </section>`;
  }

  // ---------- shared helpers for Home / Summary ----------
  const curMonthKey = () => clampMonth(E.monthKeyFor(S.schedule, TODAY, hs()));
  const monthName = (k) => E.MONTHS[Number(k.slice(5)) - 1];
  function monthChips(selected, act) {
    const first = E.monthKeyFor(S.schedule, S.settings.startDate, hs());
    const keys = []; for (let k = first; k <= E.shiftKey(selected > first ? selected : first, 12); k = E.shiftKey(k, 1)) keys.push(k);
    return `<div class="tabs hscroll monthscroll" role="tablist" aria-label="Month" style="margin:0 -16px;padding:0 16px">${keys.map((k) => (k.endsWith('-01') && k !== keys[0] ? `<span class="yearmark" aria-hidden="true">${k.slice(0, 4)}</span>` : '') + `<button role="tab" aria-selected="${k === selected}" aria-label="${monthName(k)} ${k.slice(0, 4)}" class="${k === selected ? 'on' : ''}" data-act="${act}" data-v="${k}" style="flex:none;padding:0 18px">${monthName(k)}</button>`).join('')}</div>`;
  }
  const rng = (a, b) => { const x = E.fmtShort(a), y = E.fmtShort(b); return x.split(' ')[0] === y.split(' ')[0] ? `${x}–${y.split(' ')[1]}` : `${x}–${y}`; };
  const signed = (n) => (n < -0.004 ? '−' : '') + money(Math.abs(n));
  const pctOf = (a, b) => (b > 0 ? Math.round(a / b * 100) : 0);
  const bar = (pct, color, h = 8) => `<div class="pbar" style="height:${h}px"><div style="width:${Math.max(0, Math.min(100, pct))}%;background:${color}"></div></div>`;
  const budgetAmt = (id, mk) => { const b = E.budgetFor(S.budgets, id, mk); return b ? b.amount : 0; };
  // savings moves into each savings account for a range (bank → savings, the same rule Money remaining uses)
  function savingsByWallet(list) {
    const out = {};
    list.forEach((t) => { const c = E.classify(S, t); if (c.savings) out[t.toWallet] = (out[t.toWallet] || 0) + c.savings; });
    return out;
  }
  function netWorth() {
    const bal = E.balances(S, TODAY);
    const ws = S.wallets.filter((w) => w.inNetWorth);
    const total = ws.reduce((t, w) => t + (['credit', 'loan'].includes(w.type) ? -(bal[w.name] || 0) : (bal[w.name] || 0)), 0);
    return { total: Math.round(total * 100) / 100, ws };
  }

  // combo chart: actual as bars, budget as a shaded area, one point per budget month
  const kfmt = (n) => { const a = Math.abs(n); return a >= 1e5 ? '$' + Math.round(a / 1000) + 'k' : a >= 1000 ? '$' + (Math.round(a / 100) / 10).toString().replace(/\.0$/, '') + 'k' : '$' + Math.round(a); };
  function comboChart(pts, color, label) {
    const W = 320, Hh = 150, top = 18, base = 128, n = pts.length, slot = W / n;
    const max = Math.max(1, ...pts.map((p) => Math.max(p.a, p.b))) * 1.08;
    const y = (v) => base - (v / max) * (base - top);
    const cx = (i) => slot * i + slot / 2;
    const bw = Math.min(30, slot * 0.5);
    const hasB = pts.some((p) => p.b > 0);
    let area = '';
    if (hasB) {
      // budget as a stepped area: one shaded block per item, joined into a single outline
      const pad = slot * 0.08;
      area = pts.map((p, i) => p.b > 0 ? `<rect x="${(slot * i + pad).toFixed(1)}" y="${y(p.b).toFixed(1)}" width="${(slot - 2 * pad).toFixed(1)}" height="${(base - y(p.b)).toFixed(1)}" rx="6" fill="${color}" opacity=".16"></rect><line x1="${(slot * i + pad).toFixed(1)}" x2="${(slot * (i + 1) - pad).toFixed(1)}" y1="${y(p.b).toFixed(1)}" y2="${y(p.b).toFixed(1)}" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 3"></line>` : '').join('');
    }
    const bars = pts.map((p, i) => { const yy = y(p.a); return `<rect x="${(cx(i) - bw / 2).toFixed(1)}" y="${yy.toFixed(1)}" width="${bw.toFixed(1)}" height="${(base - yy).toFixed(1)}" rx="4" fill="${color}"></rect><text x="${cx(i).toFixed(1)}" y="${(yy - 5).toFixed(1)}" text-anchor="middle" font-size="${n > 8 ? 8.5 : 10}" font-weight="800" fill="var(--text)">${p.a ? kfmt(p.a) : ''}</text><text x="${cx(i).toFixed(1)}" y="${base + 14}" text-anchor="middle" font-size="10" font-weight="700" fill="var(--muted)">${n > 5 ? p.label.slice(0, 4) : p.label}</text>`; }).join('');
    return `<svg viewBox="0 0 ${W} ${Hh}" width="100%" role="img" aria-label="${esc(label)}: ${pts.map((p) => `${p.label} ${money(p.a)}${p.b ? ` of ${money(p.b)}` : ''}`).join(', ')}">${area}<line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="var(--card2)"></line>${bars}</svg>
      <div class="row muted" style="gap:14px;font-size:12px;justify-content:center"><span class="row" style="gap:6px"><span class="dot" style="width:10px;height:10px;border-radius:3px;background:${color}"></span>Actual</span>${hasB ? `<span class="row" style="gap:6px"><span style="width:14px;height:10px;border-radius:2px;background:${color};opacity:.3"></span>${label.startsWith('Savings') ? 'Goal' : 'Budget'}</span>` : ''}</div>`;
  }
  function renderHome() {
    // Home shows whole dollars (net worth keeps cents via signed())
    const money = (n) => '$' + Math.round(Math.abs(Number(n) || 0)).toLocaleString('en-CA');
    const H = hs(), mk = curMonthKey();
    // Home covers one budget year: the January to December budget months (by pay period) of the chosen year
    const startKey = E.monthKeyFor(S.schedule, S.settings.startDate, H);
    // years that have data: any saved transaction or budget, by budget year; this year is always listed
    const ys = new Set([mk.slice(0, 4)]);
    S.transactions.forEach((t) => { if (!t.deleted && t.date) ys.add(E.monthKeyFor(S.schedule, t.date, H).slice(0, 4)); });
    S.budgets.forEach((b) => { if (b.month && b.amount > 0) ys.add(b.month.slice(0, 4)); });
    const years = [...ys].filter((y) => y >= startKey.slice(0, 4)).sort().reverse();
    const yr = years.includes(ui.homeYear) ? ui.homeYear : mk.slice(0, 4);
    const firstKey = [`${yr}-01`, startKey].sort().pop();
    const lastKey = `${yr}-12`;
    const ytdStart = E.budgetMonth(S.schedule, firstKey, H).start, yearEnd = E.budgetMonth(S.schedule, lastKey, H).end;
    const until = yearEnd < TODAY ? yearEnd : TODAY;
    const keys = []; for (let k = firstKey; k <= lastKey; k = E.shiftKey(k, 1)) keys.push(k);
    const sumBudget = (id) => keys.reduce((t, k) => t + budgetAmt(id, k), 0);
    const real = E.transactionsInRange(S, ytdStart, until);
    const nw = netWorth();
    // income: received this year vs this year's income budgets, per category
    const incCats = S.categories.filter((c) => c.type === 'income' && !c.parent);
    const inc = incCats.map((c) => ({ label: c.name, a: real.filter((t) => t.type === 'income' && (t.category === c.id || (cat(t.category) || {}).parent === c.id)).reduce((x, t) => x + Number(t.amount), 0), b: sumBudget(c.id) }));
    const incA = inc.reduce((t, i) => t + i.a, 0), incB = inc.reduce((t, i) => t + i.b, 0);
    // savings: today's balance vs goal balance (balance when the year started + this year's goals), per account
    const now = E.balances(S, until), start = E.balances(S, E.addDays(ytdStart, -1));
    const sav = S.wallets.filter((w) => w.type === 'savings').map((w) => { return { label: w.name.replace(/^\[[^\]]+\]\s*/, ''), a: now[w.name] || 0, b: (start[w.name] || 0) + sumBudget('wallet:' + w.id) }; });
    const savA = sav.reduce((t, i) => t + i.a, 0), savB = sav.reduce((t, i) => t + i.b, 0), savAB = sav.filter((i) => i.b).reduce((t, i) => t + i.a, 0);
    const ratio = (a, b) => `${money(a)} / ${b ? money(b) : '—'}${b ? ` <span class="muted">(${pctOf(a, b)}%)</span>` : ''}`;
    const breakdown = (items) => { const ta = items.reduce((t, i) => t + i.a, 0), tb = items.reduce((t, i) => t + i.b, 0); return `<div class="lines" style="font-size:13px;gap:4px;border-top:1px solid var(--line);padding-top:10px;color:var(--text)">${items.map((i) => `<span class="between"><span style="font-weight:700">${esc(i.label)}</span><span>${ratio(i.a, i.b)}</span></span>`).join('')}
      <span class="between" style="border-top:1px solid var(--line);padding-top:6px;margin-top:2px;font-weight:800"><span>Total</span><span>${ratio(ta, tb)}</span></span></div>`; };
    // contribution room, calendar year to date
    const cy = TODAY.slice(0, 4);
    const ytd = E.transactionsInRange(S, `${cy}-01-01`, TODAY);
    const showRoom = yr === cy;
    const room = S.wallets.filter((w) => w.type === 'savings' && Number(w.room) > 0).map((w) => {
      const used = ytd.filter((t) => t.type === 'transfer' && t.toWallet === w.name && t.wallet !== w.name).reduce((x, t) => x + Number(t.amount), 0);
      return { w, used, limit: Number(w.room) };
    });
    const line = (l, v) => `<span class="between"><span>${l}</span><span>${v}</span></span>`;
    return `<section class="screen">
      <div class="between"><h1>Home</h1><label class="yearpick"><span class="sr">Year</span><select data-homeyear="1" aria-label="Year">${years.map((y) => `<option value="${y}" ${y === yr ? 'selected' : ''}>${y}</option>`).join('')}</select>${svg('chevDown', 16, 'currentColor', 2.5)}</label></div>
      <p class="muted" style="margin:-6px 0 0;font-size:14px">Jan–Dec budget months: ${E.fmtShort(ytdStart)} – ${E.fmtShort(yearEnd)}${until < yearEnd ? ` · to ${E.fmtShort(until)}` : ''}</p>
      <section class="card" style="gap:4px" aria-label="Net worth">
        <div class="between"><h2 style="margin:0;font-size:14px;color:var(--muted)">Net Worth</h2><button class="linkbtn" data-act="nwPick">Choose accounts</button></div>
        <p style="margin:0;font-size:34px;font-weight:800" class="${nw.total < 0 ? 'red' : 'green'}">${signed(nw.total)}</p>
        <p class="muted" style="margin:0;font-size:13px">${nw.ws.length ? nw.ws.map((w) => esc(w.name)).join(' · ') : 'No accounts chosen yet'}</p>
      </section>
      <section class="card" style="gap:10px" aria-label="Income">
        <div style="display:flex;flex-direction:column;gap:2px"><h2 class="ctitle">Income</h2>
          <b class="green" style="font-size:26px">${money(incA)}</b>${incB ? `<span class="muted" style="font-size:13px">of ${money(incB)} goal · <b style="color:var(--text)">${pctOf(incA, incB)}%</b></span>` : ''}</div>
        ${comboChart(inc, 'var(--green)', 'Income')}
        ${breakdown(inc)}
      </section>
      <section class="card" style="gap:10px" aria-label="Savings">
        <div style="display:flex;flex-direction:column;gap:2px"><h2 class="ctitle">Savings</h2>
          <b style="color:var(--pink);font-size:26px">${money(savA)}</b>${savB ? `<span class="muted" style="font-size:13px">of ${money(savB)} goal · <b style="color:var(--text)">${pctOf(savA, savB)}%</b></span>` : ''}</div>
        ${comboChart(sav, 'var(--pink)', 'Savings')}
        ${breakdown(sav)}
      </section>
      ${showRoom ? `<section class="card" style="gap:10px" aria-label="Contribution room">
        <h2 class="ctitle">${cy} Contribution Room</h2>
        ${room.length ? room.map((r) => `<div style="display:flex;flex-direction:column;gap:4px"><div class="between" style="font-size:13px"><b>${esc(r.w.name)}</b><span class="muted">${money(r.used)} of ${money(r.limit)} · <b style="color:var(--text)">${pctOf(r.used, r.limit)}%</b></span></div>${bar(pctOf(r.used, r.limit), 'var(--pink)')}<span class="muted" style="font-size:12px">${r.used > r.limit ? `<span class="red">${money(r.used - r.limit)} over</span>` : `${money(r.limit - r.used)} left`}</span></div>`).join('') : `<p class="muted small" style="margin:0">Add your contribution room on a TFSA or RRSP in More → Accounts.</p>`}
      </section>` : ''}
    </section>`;
  }

  function sumTotals(list) {
    const z = { income: 0, recurring: 0, discretionary: 0, savings: 0 };
    list.forEach((t) => { const c = E.classify(S, t); Object.keys(z).forEach((k) => { z[k] += c[k]; }); });
    z.spend = z.recurring + z.discretionary; z.out = z.spend + z.savings; z.remaining = z.income - z.out;
    Object.keys(z).forEach((k) => { z[k] = Math.round(z[k] * 100) / 100 + 0; });
    return z;
  }
  function summaryBudget(mk, list, mt) {
    const exp = list.filter((t) => t.type === 'expense');
    const spentIn = (id) => exp.filter((t) => { const c = cat(t.category); return t.category === id || t.sub === id || (c && c.parent === id); }).reduce((x, t) => x + Number(t.amount), 0);
    const subSpent = (sid) => exp.filter((t) => t.sub === sid || t.category === sid).reduce((x, t) => x + Number(t.amount), 0);
    const overall = budgetAmt('overall', mk);
    const prog = (spent, budget, big) => {
      const over = spent > budget + 0.004, pc = pctOf(spent, budget);
      return `${bar(pc, over ? 'var(--red)' : 'var(--pink)', big ? 10 : 8)}<div class="between muted" style="font-size:12px"><span>${money(spent)} of ${money(budget)} · ${pc}%</span>${over ? `<span class="red">${money(spent - budget)} over</span>` : `<span>${money(budget - spent)} left</span>`}</div>`;
    };
    const parents = S.categories.filter((c) => c.type === 'expense' && !c.parent);
    const budgeted = parents.filter((p) => budgetAmt(p.id, mk) > 0);
    const unb = parents.filter((p) => !budgetAmt(p.id, mk)).map((p) => ({ p, a: spentIn(p.id) })).filter((x) => x.a > 0.004).sort((a, b) => b.a - a.a);
    const uncategorized = exp.filter((t) => !cat(t.category)).reduce((x, t) => x + Number(t.amount), 0);
    const incomeRows = S.categories.filter((c) => c.type === 'income' && !c.parent && budgetAmt(c.id, mk) > 0).map((c) => ({ c, b: budgetAmt(c.id, mk), a: list.filter((t) => t.type === 'income' && (t.category === c.id || (cat(t.category) || {}).parent === c.id)).reduce((x, t) => x + Number(t.amount), 0) }));
    const sv = savingsByWallet(list);
    const goals = S.wallets.filter((w) => w.type === 'savings' && budgetAmt('wallet:' + w.id, mk) > 0).map((w) => ({ w, b: budgetAmt('wallet:' + w.id, mk), a: sv[w.name] || 0 }));
    const goalRow = (name, a, b, color) => { const pc = pctOf(a, b); return `<div style="display:flex;flex-direction:column;gap:4px"><div class="between" style="font-size:13px"><b>${esc(name)}</b><span class="muted">${money(a)} / ${money(b)} · ${pc}%</span></div>${bar(pc, color)}</div>`; };
    return `
      <section class="card" style="gap:8px" aria-label="Overall spend budget">
        <div class="between" style="align-items:baseline"><h2 class="ctitle">Overall Spend</h2><b class="${overall && mt.spend > overall ? 'red' : ''}" style="font-size:20px">${money(mt.spend)}</b></div>
        ${overall ? prog(mt.spend, overall, true) : `<p class="muted small" style="margin:0">No overall budget for ${monthName(mk)}.</p>`}
      </section>
      <section class="card" style="gap:14px" aria-label="Category budgets">
        <h2 class="ctitle">Categories</h2>
        ${budgeted.length ? budgeted.map((p) => {
          const b = budgetAmt(p.id, mk), a = spentIn(p.id);
          const subs = S.categories.filter((x) => x.parent === p.id && budgetAmt(x.id, mk) > 0);
          return `<div style="display:flex;flex-direction:column;gap:6px">
            <div class="row" style="gap:12px"><span style="width:40px;height:40px;border-radius:20px;background:${p.color};display:flex;align-items:center;justify-content:center;flex:none">${svg(p.icon, 20, '#fff')}</span><b class="grow" style="font-size:16px">${esc(p.name)}</b></div>
            ${prog(a, b)}
            ${subs.length ? `<div class="subtree" style="gap:10px">${subs.map((x) => `<div style="display:flex;flex-direction:column;gap:4px"><span class="ctag" style="background:${p.color}B3;align-self:flex-start">${esc(x.name)}</span>${prog(subSpent(x.id), budgetAmt(x.id, mk))}</div>`).join('')}</div>` : ''}
          </div>`;
        }).join('') : `<p class="muted small" style="margin:0">No category budgets for ${monthName(mk)}.</p>`}
        ${unb.length || uncategorized > 0.004 ? `<div style="display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--line);padding-top:12px"><span class="ml2">Unbudgeted · ${money(unb.reduce((x, u) => x + u.a, 0) + uncategorized)}</span>${unb.map((u) => `<div class="row" style="gap:8px;font-size:14px"><span class="dot" style="background:${u.p.color};width:10px;height:10px"></span><b class="grow">${esc(u.p.name)}</b><span class="red" style="font-weight:800">${money(u.a)}</span></div>`).join('')}${uncategorized > 0.004 ? `<div class="row" style="gap:8px;font-size:14px"><span class="dot" style="background:#5E5A62;width:10px;height:10px"></span><b class="grow">Uncategorized</b><span class="red" style="font-weight:800">${money(uncategorized)}</span></div>` : ''}</div>` : ''}
      </section>
      ${incomeRows.length ? `<section class="card" style="gap:10px" aria-label="Income budget"><h2 class="ctitle">Income</h2>${incomeRows.map((r) => goalRow(r.c.name, r.a, r.b, 'var(--green)')).join('')}</section>` : ''}
      ${goals.length ? `<section class="card" style="gap:10px" aria-label="Savings goals"><h2 class="ctitle">Savings</h2>${goals.map((g) => goalRow(g.w.name, g.a, g.b, 'var(--pink)')).join('')}</section>` : ''}
      <button class="btn outline" data-act="editBudgets" data-v="${mk}">Edit ${monthName(mk)} budgets</button>`;
  }

  function renderSummary() {
    const H = hs(), mk = ui.month, bm = E.budgetMonth(S.schedule, mk, H);
    const listM = E.transactionsInRange(S, bm.start, bm.end).filter((t) => E.countsNow(t, TODAY));
    const mtM = E.totals(S, bm.start, bm.end, TODAY);
    const pays = bm.pays;
    // Spend view can look at the whole month or one pay period
    const per = ui.sumPeriod != null && ui.sumPeriod < pays.length ? ui.sumPeriod : 'all';
    const rg = per === 'all' ? bm : pays[per];
    const fw = ui.sumWallet && S.wallets.some((w) => w.name === ui.sumWallet) ? ui.sumWallet : null;
    const list = (per === 'all' ? listM : listM.filter((t) => t.date >= rg.start && t.date <= rg.end)).filter((t) => !fw || t.wallet === fw || t.toWallet === fw);
    const mt = fw ? sumTotals(list) : per === 'all' ? mtM : E.totals(S, rg.start, rg.end, TODAY);
    const incCats = S.categories.filter((c) => c.type === 'income' && !c.parent);
    const incBy = (c) => list.filter((t) => t.type === 'income' && (t.category === c.id || (cat(t.category) || {}).parent === c.id)).reduce((x, t) => x + Number(t.amount), 0);
    const sv = savingsByWallet(list);
    const overall = per === 'all' ? budgetAmt('overall', mk) : 0;
    const upcoming = list.filter((t) => t.date > TODAY && t.type === 'expense');
    const upTot = upcoming.reduce((x, t) => x + Number(t.amount), 0);
    // spend by category
    const exp = list.filter((t) => t.type === 'expense');
    const parentOf = (t) => { const c = cat(t.category); return c ? (c.parent || c.id) : null; };
    const byCat = {};
    exp.forEach((t) => {
      const pid = parentOf(t) || 'none';
      const g = byCat[pid] = byCat[pid] || { amt: 0, n: 0, subs: {} };
      g.amt += Number(t.amount); g.n += 1;
      const c = cat(t.category); const sid = t.sub || (c && c.parent ? c.id : '');
      g.subs[sid] = (g.subs[sid] || 0) + Number(t.amount);
    });
    const total = mt.spend;
    const rows = Object.entries(byCat).map(([pid, g]) => ({ c: cat(pid) || { id: 'none', name: 'Uncategorized', color: '#5E5A62', icon: 'grid' }, ...g })).sort((a, b) => b.amt - a.amt);
    // donut
    const R = 54, C = 2 * Math.PI * R; let off = 0;
    const arcs = total > 0 ? rows.map((r) => { const len = r.amt / total * C; const a = `<circle cx="66" cy="66" r="${R}" stroke="${r.c.color}" stroke-dasharray="${len.toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"></circle>`; off += len; return a; }).join('') : `<circle cx="66" cy="66" r="${R}" stroke="var(--card2)"></circle>`;
    const pctTxt = (a, b) => (b > 0 ? `${Math.round(a / b * 100)}%` : '0%');
    const line = (l, v) => `<span class="between"><span>${l}</span><span>${v}</span></span>`;
    const spendView = () => `      <section class="card tile2" aria-label="Total spend">
        <span class="ml2">Total Spend</span><b class="red big">▾ ${money(mt.spend)}</b>
        <div class="lines">${line('Expenses', money(mt.recurring))}${line('Discretionary', money(mt.discretionary))}</div>
        ${TODAY >= rg.start && TODAY <= rg.end && mt.income > 0 ? (() => { const gone = Math.round((E.diffDays(rg.start, TODAY) + 1) / (E.diffDays(rg.start, rg.end) + 1) * 100); const used = Math.round(mt.out / mt.income * 100); const ahead = used > gone + 5;
          return `<div class="pace" aria-label="Spending pace"><div class="between" style="font-size:12px"><span class="muted">Spending pace</span><b class="${ahead ? 'red' : 'green'}">${ahead ? 'Ahead of pace' : 'On track'}</b></div>
            <div class="pacerow"><span>${per === 'all' ? 'Month' : 'Pay'} gone</span>${bar(gone, 'var(--muted)', 6)}<span>${gone}%</span></div>
            <div class="pacerow"><span>Income used</span>${bar(used, ahead ? 'var(--red)' : 'var(--pink)', 6)}<span>${used}%</span></div></div>`; })() : ''}
        ${overall ? `<div style="display:flex;flex-direction:column;gap:4px;margin-top:4px">${bar(pctOf(mt.spend, overall), mt.spend > overall ? 'var(--red)' : 'var(--pink)')}<span class="muted" style="font-size:12px">${pctOf(mt.spend, overall)}% of ${money(overall)} budget · ${mt.spend > overall ? `<span class="red">${money(mt.spend - overall)} over</span>` : `${money(overall - mt.spend)} left`}</span></div>` : ''}
        ${upcoming.length ? `<button class="collapse upbtn" data-act="toggleUp" aria-expanded="${!!ui.upOpen}"><span>Upcoming Transactions · <span class="red">${money(upTot)}</span></span>${svg(ui.upOpen ? 'chevUp' : 'chevDown', 18, 'currentColor', 2.5)}</button>
        ${ui.upOpen ? `<div style="display:flex;flex-direction:column;gap:4px;padding:4px 4px 0">${upcoming.map((t) => { const c = cat(t.category) || {}; const pc = c.parent ? cat(c.parent) : c; const d = E.diffDays(TODAY, t.date); return `<div class="row" style="gap:10px;min-height:44px"><span style="width:32px;height:32px;border-radius:16px;background:${(pc || {}).color || '#5E5A62'};display:flex;align-items:center;justify-content:center;flex:none">${svg((pc || {}).icon || 'repeat', 16, '#fff')}</span><span class="grow" style="display:flex;flex-direction:column"><b style="font-size:14px">${esc(t.title || c.name || 'Expense')}</b><span class="muted" style="font-size:12px">${E.fmtDay(t.date)} · in ${d} day${d === 1 ? '' : 's'} · ${esc(t.wallet)}</span></span><b class="red" style="font-size:14px">${money(t.amount)}</b></div>`; }).join('')}</div>` : ''}` : ''}
      </section>
      <section class="grid2" aria-label="Income and savings">
        <div class="card tile2"><span class="ml2">Income</span><b class="green big">▴ ${money(mt.income)}</b><div class="lines">${incCats.map((c) => line(esc(c.name), money(incBy(c)))).join('')}</div></div>
        <div class="card tile2"><span class="ml2">Savings</span><b class="big" style="color:var(--savings)">▴ ${money(mt.savings)}</b><div class="lines">${S.wallets.filter((w) => w.type === 'savings').map((w) => line(esc(w.name.replace(/^\[[^\]]+\]\s*/, '')), money(sv[w.name] || 0))).join('')}</div></div>
      </section>
      <section class="card" style="gap:14px" aria-label="Spending by category">
        <div class="row" style="gap:16px;align-items:center">
          <svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label="Spending by category: ${rows.map((r) => `${esc(r.c.name)} ${pctTxt(r.amt, total)}`).join(', ') || 'none'}" style="flex:none"><g transform="rotate(-90 66 66)" fill="none" stroke-width="22">${arcs}</g>
            <text x="66" y="62" text-anchor="middle" fill="var(--muted)" font-size="11" font-weight="700">Total Spend</text><text x="66" y="80" text-anchor="middle" fill="var(--text)" font-size="${total >= 10000 ? 13 : 16}" font-weight="800">${money(total)}</text></svg>
          <div class="grow" style="display:flex;flex-direction:column;gap:8px">${rows.length ? rows.map((r) => `<div class="row" style="gap:8px;font-size:13px"><span class="dot" style="background:${r.c.color};width:10px;height:10px"></span><b class="grow">${esc(r.c.name)}</b><span class="muted">${pctTxt(r.amt, total)}</span></div>`).join('') : `<span class="muted small">No spending yet ${per === 'all' ? 'this month' : 'this pay'}.</span>`}</div>
        </div>
        ${rows.map((r) => { const subs = Object.entries(r.subs).filter(([sid]) => sid).map(([sid, a]) => ({ c: cat(sid), a })).filter((x) => x.c).sort((a, b) => b.a - a.a); const rest = r.subs[''] || 0; return `<div style="display:flex;flex-direction:column;gap:6px">
          <button class="row catrow" style="gap:12px" data-act="catTx" data-id="${r.c.id}" data-r="${rg.start}|${rg.end}" aria-label="${esc(r.c.name)} transactions"><span style="width:44px;height:44px;border-radius:22px;background:${r.c.color};display:flex;align-items:center;justify-content:center;flex:none">${svg(r.c.icon, 22, '#fff')}</span>
            <div class="grow" style="display:flex;flex-direction:column"><b style="font-size:16px">${esc(r.c.name)}</b><span class="muted" style="font-size:12px">${pctTxt(r.amt, total)} of total spend</span></div>
            <div style="display:flex;flex-direction:column;align-items:flex-end"><b class="red" style="font-size:16px">▾ ${money(r.amt)}</b><span class="muted" style="font-size:12px">${r.n} transaction${r.n === 1 ? '' : 's'}</span></div></button>
          ${subs.length ? `<div class="subtree">${subs.map((x) => `<div class="row" style="gap:8px"><span class="ctag" style="background:${r.c.color}B3">${esc(x.c.name)}</span><span class="muted grow" style="font-size:12px">${pctTxt(x.a, r.amt)} of category</span><b class="red" style="font-size:14px">${money(x.a)}</b></div>`).join('')}${rest > 0.004 ? `<div class="row" style="gap:8px"><span class="ctag acct" style="background:var(--card2)">No subcategory</span><span class="muted grow" style="font-size:12px">${pctTxt(rest, r.amt)} of category</span><b class="red" style="font-size:14px">${money(rest)}</b></div>` : ''}</div>` : ''}
        </div>`; }).join('')}
      </section>
`;
    const view = S.settings.summaryView === 'budget' ? 'budget' : 'spend';
    return `<section class="screen">
      <div class="between"><h1>Summary</h1><div class="seg" role="group" aria-label="Summary view"><button class="${view === 'spend' ? 'on' : ''}" data-act="sumView" data-v="spend" aria-pressed="${view === 'spend'}" style="padding:0 14px">Spend</button><button class="${view === 'budget' ? 'on' : ''}" data-act="sumView" data-v="budget" aria-pressed="${view === 'budget'}" style="padding:0 14px">Budget</button></div></div>
      ${monthChips(mk, 'month')}
      ${view === 'spend' ? `<div class="row" style="gap:4px;flex-wrap:wrap;justify-content:space-between"><button class="perbtn" data-act="perPick" aria-haspopup="dialog" aria-label="Choose period">${per === 'all' ? 'Budget month' : pays[per].label}: ${E.fmtShort(rg.start)} – ${E.fmtShort(rg.end)}${svg('chevDown', 16, 'currentColor', 2.5)}</button><button class="perbtn" data-act="walletPickSum" aria-haspopup="dialog" aria-label="Filter by account" style="${fw ? 'color:var(--pink)' : ''}">${fw ? esc(shortName(fw)) : 'All accounts'}${svg('chevDown', 16, 'currentColor', 2.5)}</button></div>` : `<p class="muted" style="margin:0;font-size:13px">Budget month: ${E.fmtShort(bm.start)} – ${E.fmtShort(bm.end)}</p>`}
      ${view === 'budget' ? summaryBudget(mk, listM, mtM) : spendView()}
    </section>`;
  }

  function renderMore() {
    const tiles = [['calendar', 'Calendar', 'cal'], ['budgets', 'Budgets', 'budget'], ['accounts', 'Accounts', 'wallet'], ['subs', 'Subscriptions', 'repeat'], ['categories', 'Categories', 'grid'], ['close', 'Close Month', 'check'], ['sync', 'Data Sync', 'sync'], ['export', 'Export', 'download']];
    return `<section class="screen"><h1>More</h1>
      <button class="tile" style="flex-direction:row;align-items:center;min-height:72px" data-act="open" data-v="settings">${svg('palette', 26, 'var(--pink)')}<span style="display:flex;flex-direction:column;gap:2px"><span class="t" style="font-size:17px">Theme &amp; Style</span><span class="muted" style="font-size:13px">Theme, colours, layout, pay schedule and holidays</span></span></button>
      <div class="more-grid">${tiles.map(([k, l, i]) => `<button class="tile" data-act="open" data-v="${k}">${svg(i, 26, 'var(--pink)')}<span class="t">${l}</span></button>`).join('')}</div>
    </section>`;
  }

  // ---------- add / edit transaction ----------
  const parseTags = (str) => [...new Set(String(str || '').split(/[,#]/).map((x) => x.trim().toLowerCase()).filter(Boolean))];
  function newForm(opts = {}) {
    const firstExpense = S.categories.find((c) => c.type === 'expense' && !c.parent);
    const f = { type: 'expense', catId: firstExpense && firstExpense.id, subId: null, amount: '', date: TODAY < S.settings.startDate ? S.settings.startDate : TODAY, mode: 'default', counts: 'entry', wallet: (S.wallets.find((w) => w.type === 'credit') || S.wallets[0]).name, toWallet: (S.wallets.find((w) => w.type === 'savings') || S.wallets[0]).name, title: '', note: '', tags: '', rec: { every: 1, unit: 'month', end: '' }, editId: null, ruleId: null };
    if (opts.edit) {
      const t = opts.edit;
      Object.assign(f, { type: t.type, catId: t.category, subId: t.sub || null, amount: String(t.amount), date: t.date, wallet: t.wallet, toWallet: t.toWallet || f.toWallet, title: t.title || '', note: t.note || '', tags: (t.tags || []).join(', '), counts: t.counts || 'entry', editId: t.id, mode: 'default', counts: 'entry' });
    }
    if (opts.rule) {
      const r = opts.rule, t = r.template;
      Object.assign(f, { type: t.type, catId: t.category, subId: t.sub || null, amount: String(t.amount), date: r.start, wallet: t.wallet, toWallet: t.toWallet || f.toWallet, title: t.title || '', note: t.note || '', tags: (t.tags || []).join(', '), counts: r.counts || 'entry', mode: 'recurring', ruleId: r.id, rec: { every: r.pattern === 'dom' ? 1 : (r.every || 1), unit: r.pattern === 'payday' ? 'pay' : r.pattern === 'dom' ? 'month' : (r.unit || 'month'), end: r.end || '' } });
    }
    return f;
  }
  function openForm(opts) { ui.form = newForm(opts); push({ name: 'add' }); }

  function renderAdd() {
    const f = ui.form;
    const isT = f.type === 'transfer';
    const parent = cat(f.catId);
    const subs = parent ? S.categories.filter((c) => c.parent === parent.id) : [];
    const heroBg = isT ? '#4A4750' : parent ? parent.color : '#4A4750';
    const TI = { expense: ['Expense', 'chevDown', 'var(--red)'], income: ['Income', 'chevUp', 'var(--green)'], transfer: ['Transfer', 'transfer', '#fff'] };
    const acctRow = (field, label) => `<div class="row" style="gap:8px">
        <button class="chip" style="width:48px;justify-content:center;padding:0" data-act="acctlist" data-f="${field}" aria-label="All accounts">${svg('chevDown', 18, 'currentColor', 2.5)}</button>
        ${label ? `<span class="muted" style="font-weight:800;font-size:13px">${label}</span>` : ''}
        <div class="hscroll" style="margin-right:-16px;padding-right:16px">${S.wallets.map((w) => `<button class="chip ${f[field] === w.name ? 'on' : ''}" data-act="wallet" data-f="${field}" data-v="${esc(w.name)}"><span class="dot" style="background:${TYPE_COLOR[w.type]}"></span>${esc(w.name)}</button>`).join('')}</div>
      </div>`;
    const firstOn = (unit) => { const d = E.occurrences({ pattern: 'interval', unit, every: 1, start: f.date }, f.date, E.addDays(f.date, 40), { skips: new Set() })[0] || f.date; return `${E.fmtDay(d)}, ${d.slice(0, 4)}`; };
    const units = [['day', 'day(s)'], ['week', 'week(s)'], ['month', 'month(s)'], ['monthStart', 'month(s) · 1st'], ['monthEnd', 'month(s) · last day'], ['year', 'year(s)'], ['pay', 'pay(s)']];
    const recFields = f.mode === 'recurring' ? `<div class="card">
        <div class="row"><div class="field" style="background:var(--card2);flex:0 0 118px;min-width:0"><label for="ev" style="min-width:0">Every</label><input id="ev" type="number" min="1" inputmode="numeric" value="${esc(f.rec.every)}" data-bind="rec.every" style="width:100%;min-width:0"></div><div class="field grow" style="background:var(--card2);min-width:0"><select style="width:100%;min-width:0" aria-label="Repeat unit" data-bind="rec.unit" data-rerender="1">${units.map(([v, l]) => `<option value="${v}" ${f.rec.unit === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
        <div class="field" style="background:var(--card2)"><label for="end">End date</label><input id="end" type="date" value="${esc(f.rec.end)}" data-bind="rec.end"></div>
        <p class="muted small" style="margin:0">${f.rec.unit === 'pay' ? 'Repeats on your paydays from the date above (weekends and holidays already handled).' : f.rec.unit === 'monthEnd' ? `Repeats on the last day of the month (28th–31st), starting ${firstOn('monthEnd')}.` : f.rec.unit === 'monthStart' ? `Repeats on the 1st of the month, starting ${firstOn('monthStart')}.` : `First one on ${E.fmtDay(f.date)}. Change the date above to move it.`}</p>
      </div>` : '';
    return `<div class="add">
      <div class="top"><button class="iconbtn" style="background:transparent" data-act="back" aria-label="Back">${svg('back', 24)}</button><div class="between"><h1 style="font-size:32px">${f.editId ? 'Edit Transaction' : f.ruleId ? 'Edit Recurring' : 'Add Transaction'}</h1>${f.editId || f.ruleId ? `<span class="row" style="gap:8px">${f.editId ? `<button class="iconbtn" data-act="duplicate" data-id="${f.editId}" aria-label="Duplicate">${svg('copy', 22)}</button>` : ''}<button class="iconbtn" data-act="delete" aria-label="Delete">${svg('trash', 22, 'var(--red)')}</button></span>` : ''}</div></div>
      ${!f.editId && !f.ruleId && (S.settings.presets || []).length ? `<div class="hscroll presets" role="group" aria-label="Presets">${S.settings.presets.map((pr) => { const pc = cat(pr.tmpl.category); return `<button class="chip" data-act="presetUse" data-id="${pr.id}"><span class="dot" style="width:10px;height:10px;background:${pc ? pc.color : 'var(--muted)'}"></span>${esc(pr.name)} · ${money(pr.tmpl.amount)}</button>`; }).join('')}<button class="chip" data-act="presetManage" aria-label="Edit presets">${svg('pencil', 16)}</button></div>` : ''}
      <section class="hero" style="background:${heroBg}">
        <div class="typebar" role="tablist" aria-label="Transaction type">${['expense', 'income', 'transfer'].map((k) => `<button role="tab" aria-selected="${f.type === k}" class="${f.type === k ? 'on' : ''}" data-act="type" data-v="${k}">${svg(TI[k][1], 16, TI[k][2], 2.6)}${TI[k][0]}</button>`).join('')}</div>
        <div class="row" style="gap:14px">
          ${isT ? `<span class="bigicon" style="display:flex">${svg('transfer', 40, '#fff', 1.8)}</span>` : `<button class="bigicon" data-act="pickcat" aria-label="Change category">${svg(parent ? parent.icon : 'plus', 40, '#fff', 1.8)}</button>`}
          <div class="grow" style="display:flex;flex-direction:column;align-items:flex-end">
            <label class="amountwrap"><span class="sr">Amount</span><span class="cur" aria-hidden="true">$</span><input class="amount" inputmode="decimal" placeholder="0" value="${esc(f.amount)}" data-bind="amount"></label>
            <span class="catname">${isT ? 'Transfer' : parent ? esc(parent.name) : 'Pick a category'}</span>
          </div>
        </div>
        ${!isT && subs.length ? `<div class="hscroll" role="group" aria-label="Subcategory" style="margin:0 -16px;padding:0 16px">${[{ id: '', name: 'None' }].concat(subs).map((s) => `<button class="chip ${(f.subId || '') === s.id ? 'on' : ''}" data-act="sub" data-v="${s.id}">${esc(s.name)}</button>`).join('')}</div>` : ''}
      </section>
      <div class="body">
        <div class="row" style="gap:14px">
          <label class="datebtn" aria-label="Pick date">${svg('cal', 24)}<input type="date" value="${f.date}" data-bind="date" data-rerender="1"></label>
          <span style="font-size:28px;font-weight:800" class="grow">${f.date === TODAY ? 'Today' : E.fmtDay(f.date)}</span>
        </div>
        <div class="hscroll" role="group" aria-label="When">${[['default', 'Default'], ['recurring', 'Recurring']].map(([k, l]) => `<button class="chip ${f.mode === k ? 'on' : ''}" data-act="mode" data-v="${k}">${l}</button>`).join('')}</div>
        ${recFields}
        ${isT ? acctRow('wallet', 'From') + acctRow('toWallet', 'To') : acctRow('wallet', '')}
        <label class="field"><span class="sr">Title</span><input placeholder="Title" value="${esc(f.title)}" data-bind="title"></label>
        <label class="field" style="align-items:flex-start"><span class="sr">Notes</span><textarea rows="3" placeholder="Notes" data-bind="note">${esc(f.note)}</textarea></label>
        <label class="field"><span class="sr">Tags</span>${svg('tag', 18, 'var(--muted)')}<input placeholder="Tags, e.g. travel, date night" value="${esc(f.tags || '')}" data-bind="tags" autocomplete="off"></label>
        ${!f.editId && !f.ruleId ? `<button class="chip" style="align-self:flex-start;height:40px" data-act="presetSave">${svg('star', 16)} Save as preset</button>` : ''}
        <p class="warn" id="formwarn" style="margin:0"></p>
      </div>
      <button class="save" data-act="save">Save</button>
    </div>`;
  }

  async function saveForm() {
    const f = ui.form;
    const amount = Math.round(parseFloat(String(f.amount).replace(/[$,\s]/g, '')) * 100) / 100;
    const warn = (m) => { const el = document.getElementById('formwarn'); if (el) el.textContent = m; };
    if (!(amount > 0)) return warn('Enter an amount above $0.');
    if (f.type !== 'transfer' && !f.catId) return warn('Pick a category.');
    if (f.type === 'transfer' && f.wallet === f.toWallet) return warn('Pick two different accounts.');
    if (f.mode !== 'recurring' && isLocked(f.date)) return warn(lockMsg(f.date));
    if (f.editId) { const o = S.transactions.find((x) => x.id === f.editId); if (o && isLocked(o.date)) return warn(lockMsg(o.date)); }
    const tmpl = { type: f.type, category: f.type === 'transfer' ? null : f.catId, sub: f.type === 'transfer' ? null : (f.subId || null), title: f.title.trim(), note: f.note.trim(), tags: parseTags(f.tags), amount, wallet: f.wallet, toWallet: f.type === 'transfer' ? f.toWallet : null };
    const now = new Date().toISOString();
    if (f.mode === 'recurring') {
      const rule = { id: f.ruleId || DB.uid(), pattern: f.rec.unit === 'pay' ? 'payday' : 'interval', every: Math.max(1, Number(f.rec.every) || 1), unit: f.rec.unit === 'pay' ? null : f.rec.unit, start: f.date, end: f.rec.end || null, active: true, counts: 'entry', template: tmpl, updatedAt: now };
      const i = S.rules.findIndex((r) => r.id === rule.id);
      if (i >= 0) { rule.active = S.rules[i].active; S.rules[i] = rule; } else S.rules.push(rule);
      if (f.editId) { const t = S.transactions.find((x) => x.id === f.editId); if (t && !t.ruleId) { t.deleted = true; t.updatedAt = now; } }
      await save('rules');
      await postDue();
      await save('transactions');
    } else {
      if (f.editId) {
        const t = S.transactions.find((x) => x.id === f.editId);
        Object.assign(t, tmpl, { date: f.date, counts: 'entry', updatedAt: now });
      } else {
        S.transactions.push({ ...tmpl, id: DB.uid(), date: f.date, counts: 'entry', ruleId: null, createdAt: now, updatedAt: now });
      }
      await save('transactions');
    }
    ui.month = E.monthKeyFor(S.schedule, f.date, hs()); ui.recenter = true;
    const depth = ui.stack.length;
    ui.form = null; ui.stack = []; ui.tab = 'transactions';
    leaveTo(depth);
    toast('Saved');
  }
  async function delRecAction(thisOnly) {
        const sh = ui.sheet; ui.sheet = null;
        const r = S.rules.find((x) => x.id === sh.ruleId); if (!r) { render(); return; }
        const now = new Date().toISOString();
        const leaveForm = () => { if (sh.fromForm) { const depth = ui.stack.length; ui.form = null; ui.stack = []; leaveTo(depth); } };
        if (thisOnly) {
          if (sh.txId) {
            const t = S.transactions.find((x) => x.id === sh.txId); t.deleted = true; t.updatedAt = now;
            // keep the rule from posting this date again
            if (!S.skips.some((k) => k.ruleId === r.id && k.date === sh.date)) S.skips.push({ ruleId: r.id, date: sh.date });
            await save('transactions'); await save('skips'); leaveForm();
            toast('Deleted', async () => { t.deleted = false; t.updatedAt = new Date().toISOString(); S.skips = S.skips.filter((k) => !(k.ruleId === r.id && k.date === sh.date)); await save('transactions'); await save('skips'); toast('Restored'); });
          } else {
            S.skips.push({ ruleId: r.id, date: sh.date }); await save('skips');
            toast('Deleted', async () => { S.skips = S.skips.filter((k) => !(k.ruleId === r.id && k.date === sh.date)); await save('skips'); toast('Restored'); });
          }
          render(); return;
        }
        // this and all following: end the rule the day before, remove posted payments on or after this date
        const prevEnd = r.end || null, idx = S.rules.indexOf(r);
        const posted = S.transactions.filter((t) => t.ruleId === r.id && !t.deleted && t.date >= sh.date && !isLocked(t.date));
        posted.forEach((t) => { t.deleted = true; t.updatedAt = now; });
        const removeRule = sh.date <= r.start;
        if (removeRule) S.rules = S.rules.filter((x) => x.id !== r.id); else r.end = E.addDays(sh.date, -1);
        await save('rules'); if (posted.length) await save('transactions'); leaveForm();
        toast(removeRule ? 'Recurring payment deleted' : `Ends ${E.fmtShort(E.addDays(sh.date, -1))}`, async () => {
          if (removeRule) S.rules.splice(Math.max(0, idx), 0, r); else r.end = prevEnd;
          posted.forEach((t) => { t.deleted = false; t.updatedAt = new Date().toISOString(); });
          await save('rules'); await save('transactions'); toast('Restored');
        });
        render(); return;
      }
  async function deleteForm() {
    const f = ui.form, now = new Date().toISOString();
    let undo = null;
    if (f.ruleId) { const idx = S.rules.findIndex((r) => r.id === f.ruleId), rule = S.rules[idx]; S.rules = S.rules.filter((r) => r.id !== f.ruleId); await save('rules'); undo = async () => { S.rules.splice(Math.max(0, idx), 0, rule); await save('rules'); toast('Restored'); }; }
    else if (f.editId) { const t = S.transactions.find((x) => x.id === f.editId); if (isLocked(t.date)) { ui.sheet = null; toast(lockMsg(t.date)); return; } t.deleted = true; t.updatedAt = now; await save('transactions'); undo = async () => { t.deleted = false; t.updatedAt = new Date().toISOString(); await save('transactions'); toast('Restored'); }; }
    const depth = ui.stack.length;
    ui.form = null; ui.stack = []; ui.sheet = null; leaveTo(depth); toast('Deleted', undo);
  }

  // ---------- More screens ----------
  const placeholder = (title, text) => () => `<section class="screen sub">${header(title)}<div class="card"><p class="muted" style="margin:0">${text}</p></div></section>`;

  function renderAccounts() {
    const bal = E.balances(S, TODAY);
    const groups = ['bank', 'savings', 'credit', 'loan'].map((type) => ({ type, items: S.wallets.filter((w) => w.type === type) }));
    return `<section class="screen sub">${header('Accounts', { right: `<button class="iconbtn" data-act="open" data-v="reorder" data-k="wallets" aria-label="Order accounts">${svg('sortIc', 20)}</button><button class="iconbtn" data-act="walletNew" aria-label="Add account">${svg('plus', 22)}</button>` })}
      <div style="background:var(--bg2);border-radius:22px;padding:12px;display:flex;flex-direction:column;gap:12px">
      ${groups.map((g) => {
        const owed = g.type === 'credit' || g.type === 'loan';
        const total = g.items.reduce((s, w) => s + (bal[w.name] || 0), 0);
        const fmt = (v) => v === 0 ? `<span>$0</span>` : owed ? `<span class="${v > 0 ? 'red' : 'green'}">${v > 0 ? '▾' : '▴'}${money(v)}</span>` : `<span class="${v > 0 ? 'green' : 'red'}">${v > 0 ? '▴' : '▾'}${money(v)}</span>`;
        return `<section aria-label="${TYPE_LABEL[g.type]}" class="acctgroup" style="border-color:${TYPE_COLOR[g.type]};padding:6px 0 0">
          ${g.items.length ? g.items.map((w) => {
            const nd = (g.type === 'credit' || g.type === 'loan') ? E.nextDue(w, TODAY) : null; const due = nd ? E.diffDays(TODAY, nd) : null; const used = (g.type === 'credit' || g.type === 'loan') && Number(w.limit) > 0 ? Math.round(Math.max(0, bal[w.name] || 0) / Number(w.limit) * 100) : null;
            return `<button class="acctrow" data-act="acctOpen" data-id="${w.id}"><span class="ring" style="border-color:${TYPE_COLOR[g.type]}"></span><span class="acctname"><span style="font-size:17px;font-weight:800">${esc(w.name)}</span>${due != null || used != null ? `<span class="small">${due != null ? `<span class="${due <= 3 ? 'red' : 'muted'}">Due in ${due} day${due === 1 ? '' : 's'}</span>` : ''}${due != null && used != null ? '<span class="muted"> · </span>' : ''}${used != null ? `<span class="${used >= 90 ? 'red' : 'muted'}">${used}% of limit</span>` : ''}</span>` : ''}</span><span class="leader"></span><span class="acctamt">${fmt(bal[w.name] || 0)}</span></button>`;
          }).join('') : `<div class="acctrow"><span class="ring" style="border-color:${TYPE_COLOR[g.type]}"></span><span class="muted">No ${TYPE_LABEL[g.type].toLowerCase()} yet</span></div>`}
          <div class="between" style="border-top:2px solid ${TYPE_COLOR[g.type]};padding:12px 16px 12px 50px;margin-top:6px;opacity:.95"><b style="font-size:17px">Total</b><b style="font-size:17px">${fmt(Math.round(total * 100) / 100)}</b></div>
        </section>`;
      }).join('')}</div>
      <p class="muted small" style="margin:0">Tap an account to see its transactions, correct its balance or pay a card. Edit opening balances from the account’s pencil.</p>
    </section>`;
  }
  function renderWalletForm(scr) {
    const w = scr.wallet;
    const sw = (k) => `<button class="switch ${w[k] ? 'on' : ''}" role="switch" aria-checked="${!!w[k]}" data-act="wtoggle" data-k="${k}" aria-label="In net worth"></button>`;
    return `<section class="screen sub">${header(scr.isNew ? 'Add Account' : 'Edit Account', scr.isNew ? {} : { right: `<button class="iconbtn" data-act="walletDelete" aria-label="Delete account">${svg('trash', 22, 'var(--red)')}</button>` })}
      <label class="field"><span class="lbl">Name</span><input value="${esc(w.name)}" data-wbind="name" placeholder="[Bank] Account"></label>
      <div class="field"><label for="wt">Type</label><select id="wt" data-wbind="type" data-rerender="1">${['bank', 'savings', 'credit', 'loan'].map((t) => `<option value="${t}" ${w.type === t ? 'selected' : ''}>${TYPE_LABEL[t].replace(/s$/, '')}</option>`).join('')}</select></div>
      <label class="field"><span class="lbl">${w.type === 'credit' || w.type === 'loan' ? 'Amount owed' : 'Opening balance'}</span><input inputmode="decimal" value="${esc(w.opening)}" data-wbind="opening"></label>
      <label class="field"><span class="lbl">As of</span><input type="date" value="${esc(w.openingDate)}" data-wbind="openingDate"></label>
      ${(w.type === 'credit' || w.type === 'loan') ? (() => {
        if (!w.due) w.due = { start: w.dueDay ? E.nextDue(w, TODAY) : '', every: 1, unit: 'month' };
        const units = [['day', 'day(s)'], ['week', 'week(s)'], ['month', 'month(s)'], ['monthStart', 'month(s) · 1st'], ['monthEnd', 'month(s) · last day'], ['year', 'year(s)']];
        const nd = w.due.start ? E.nextDue({ due: { ...w.due, every: Number(w.due.every) || 1 } }, TODAY) : null;
        return `<label class="field"><span class="lbl">${w.type === 'loan' ? 'Limit (optional)' : 'Credit limit'}</span><span class="muted">$</span><input inputmode="decimal" placeholder="${w.type === 'loan' ? 'For a line of credit' : 'e.g. 5000'}" value="${esc(w.limit || '')}" data-wbind="limit"></label>
      <div class="card" style="gap:10px"><span style="font-weight:800">Payment due</span>
        <div class="row"><div class="field" style="background:var(--card2);flex:0 0 118px;min-width:0"><label for="dev" style="min-width:0">Every</label><input id="dev" type="number" min="1" inputmode="numeric" value="${esc(w.due.every)}" data-wbind="due.every" data-rerender="1" style="width:100%;min-width:0"></div><div class="field grow" style="background:var(--card2);min-width:0"><select style="width:100%;min-width:0" aria-label="Repeat unit" data-wbind="due.unit" data-rerender="1">${units.map(([v, l]) => `<option value="${v}" ${w.due.unit === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
        <label class="field" style="background:var(--card2)"><span class="lbl">Next due date</span><input type="date" value="${esc(w.due.start || '')}" data-wbind="due.start" data-rerender="1"></label>
        <p class="muted small" style="margin:0">${nd ? `Next payment due ${E.fmtDay(nd)}, ${nd.slice(0, 4)} · in ${E.diffDays(TODAY, nd)} day${E.diffDays(TODAY, nd) === 1 ? '' : 's'}.` : 'Pick the next due date to see the countdown on Accounts.'}</p>
      </div>`; })() : ''}
      ${w.type === 'savings' ? `<label class="field"><span class="lbl">${TODAY.slice(0, 4)} contribution room</span><input inputmode="decimal" placeholder="TFSA / RRSP only" value="${esc(w.room || '')}" data-wbind="room"></label>` : ''}
      <div class="card"><div class="between"><span style="font-weight:800">Include in net worth</span>${sw('inNetWorth')}</div></div>
      <p class="warn" id="wwarn" style="margin:0"></p>
      <button class="btn primary" data-act="walletSave">Save</button>
    </section>`;
  }

  function nextOcc(r) {
    const ctx = E.ctxOf(S);
    const occ = E.occurrences(r, TODAY, E.addDays(TODAY, 800), ctx);
    return occ[0] || null;
  }
  function repeatText(r) {
    if (r.pattern === 'payday') return (r.every || 1) > 1 ? `Every ${r.every} pays` : 'Every payday';
    if (r.pattern === 'dom') return `On day ${r.dom} of every month`;
    if (r.unit === 'monthStart') return (r.every || 1) > 1 ? `1st of every ${r.every} months` : '1st of every month';
    if (r.unit === 'monthEnd') return (r.every || 1) > 1 ? `Last day of every ${r.every} months` : 'Last day of every month';
    return `Every ${r.every} ${r.unit}${r.every > 1 ? 's' : ''}`;
  }
  let scrSubs = null;
  const ruleName = (r) => r.template.title || (cat(r.template.sub) || cat(r.template.category) || {}).name || 'Transfer';
  function renderSubs() {
    scrSubs = ui.stack[ui.stack.length - 1]; const filt = scrSubs.filter || 'all';
    const smode = (S.settings.sort || {}).rules || 'date';
    let rows = S.rules.map((r) => ({ r, next: nextOcc(r) })).filter(({ r, next }) => filt === 'all' || (filt === 'upcoming' && r.active !== false && next && E.diffDays(TODAY, next) <= 30) || (filt === 'paused' && r.active === false));
    if (smode === 'date') rows.sort((a, b) => (a.next || '9999').localeCompare(b.next || '9999'));
    else if (smode === 'az' || smode === 'za') rows.sort((a, b) => ruleName(a.r).localeCompare(ruleName(b.r), 'en', { sensitivity: 'base' }) * (smode === 'za' ? -1 : 1));
    const monthly = S.rules.filter((r) => r.active !== false && r.template.type === 'expense').reduce((s, r) => {
      const a = r.template.amount, f = r.pattern === 'payday' ? 2 / (r.every || 1) : r.pattern === 'dom' ? 1 : r.unit === 'day' ? 365 / 12 / r.every : r.unit === 'week' ? 52 / 12 / r.every : r.unit === 'year' ? 1 / 12 / r.every : 1 / r.every;
      return s + a * f;
    }, 0);
    return `<section class="screen sub">${header('Subscriptions', { right: `<button class="iconbtn" data-act="open" data-v="reorder" data-k="rules" aria-label="Order subscriptions">${svg('sortIc', 20)}</button><button class="iconbtn" data-act="addRecurring" aria-label="Add recurring transaction">${svg('plus', 22)}</button>` })}
      <div class="seg full" role="group" aria-label="Filter">${[['all', 'All'], ['upcoming', 'Upcoming'], ['paused', 'Paused']].map(([k, l]) => `<button class="${filt === k ? 'on' : ''}" data-act="subsFilter" data-v="${k}" aria-pressed="${filt === k}">${l}</button>`).join('')}</div>
      <div class="card" style="align-items:center"><span class="red" style="font-size:30px;font-weight:800">▾ ${money(monthly)}</span><span class="muted">Averaged monthly recurring expenses</span></div>
      ${rows.length ? rows.map(({ r, next }) => {
        const c = cat(r.template.category), d = next ? E.diffDays(TODAY, next) : null;
        return `<button class="tx" data-act="ruleMenu" data-id="${r.id}" style="${r.active === false ? 'opacity:.55' : ''}">
          <span class="ic" style="background:${c ? c.color : '#5C5960'}">${svg(c ? c.icon : 'transfer', 22, '#fff')}</span>
          <span class="grow" style="display:flex;flex-direction:column;gap:4px">
            <span class="between"><b style="font-size:15px">${next ? E.fmtShort(next) + ` · ${d === 0 ? 'today' : d + ' day' + (d === 1 ? '' : 's')}` : 'No upcoming dates'}</b><span class="muted small">${repeatText(r)}</span></span>
            <span class="between"><span class="name">${esc(r.template.title || (c && c.name) || 'Transfer')}</span><span class="amt ${r.template.type === 'income' ? 'green' : 'red'}">${r.template.type === 'income' ? '+' : '−'}${money(r.template.amount)}</span></span>
            <span class="row" style="gap:6px;flex-wrap:wrap"><span class="tag">${esc(r.template.wallet)}</span>${c ? `<span class="tag">${esc(c.name)}</span>` : ''}${r.active === false ? '<span class="tag">Paused</span>' : ''}</span>
          </span></button>`;
      }).join('') : `<div class="empty">No recurring transactions yet. Add one with + and choose Recurring.</div>`}
    </section>`;
  }

  // ---------- budgets ----------
  const bnum = (v) => { const n = parseFloat(String(v == null ? '' : v).replace(/[$,%\s]/g, '')); return n > 0 ? n : 0; };
  const r2 = (n) => Math.round(n * 100) / 100;
  const fmtPct = (n) => (Math.round(n * 10) / 10).toString().replace(/\.0$/, '') + '%';
  const budgetIds = () => ['overall'].concat(S.categories.map((c) => c.id), S.wallets.filter((w) => w.type === 'savings').map((w) => 'wallet:' + w.id));
  function migrateBudgets() {
    if (!S.budgets.some((b) => !b.month)) return false;
    const first = E.monthKeyFor(S.schedule, S.settings.startDate, hs());
    S.budgets.forEach((b) => { if (!b.month) { b.month = first; b.repeat = true; } });
    return true;
  }
  // values for a month in the given basis, plus repeat flags
  function loadBudgetVals(mk, basis) {
    const vals = {}, rep = {}, from = {};
    const res = {}; budgetIds().forEach((id) => { res[id] = E.budgetFor(S.budgets, id, mk); });
    budgetIds().forEach((id) => {
      const r = res[id];
      rep[id] = r ? !!r.repeat : true;
      if (!r) return;
      if (r.inherited) from[id] = r.from;
      const c = cat(id);
      if (basis === 'pct' && c && c.type === 'expense') {
        if (r.pct != null) vals[id] = String(r.pct);
        else {
          const base = c.parent ? (res[c.parent] || {}).amount : (res.overall || {}).amount;
          vals[id] = base ? String(Math.round(r.amount / base * 1000) / 10) : '';
        }
      } else vals[id] = String(r.amount);
    });
    return { vals, rep, from };
  }
  function budgetDraft(scr) {
    if (scr.d) return scr.d;
    if (migrateBudgets()) save('budgets');
    scr.month = scr.month || ui.month;
    const basis = S.settings.budgetBasis === 'pct' ? 'pct' : 'amt';
    scr.d = { basis, open: {}, dirty: false, ...loadBudgetVals(scr.month, basis) };
    return scr.d;
  }
  // amounts and percentages for every spend entry. Parents are a share of overall; subs a share of their parent.
  function budgetCalc(d) {
    const overall = bnum(d.vals.overall);
    const amt = {}, pct = {};
    const one = (id, base) => {
      const n = bnum(d.vals[id]);
      if (!n) { amt[id] = 0; pct[id] = 0; return; }
      if (d.basis === 'pct') { pct[id] = n; amt[id] = base ? r2(base * n / 100) : 0; }
      else { amt[id] = r2(n); pct[id] = base ? n / base * 100 : 0; }
    };
    const parents = S.categories.filter((c) => c.type === 'expense' && !c.parent);
    parents.forEach((p) => {
      one(p.id, overall);
      S.categories.filter((s) => s.parent === p.id).forEach((s) => one(s.id, amt[p.id]));
    });
    const subsOf = (pid) => S.categories.filter((s) => s.parent === pid);
    const sumAmt = parents.reduce((t, p) => t + amt[p.id], 0);
    const sumPct = d.basis === 'pct' ? parents.reduce((t, p) => t + pct[p.id], 0) : (overall ? sumAmt / overall * 100 : 0);
    const left = (pid) => { const a = subsOf(pid).reduce((t, s) => t + amt[s.id], 0); return { amt: amt[pid] - a, pct: amt[pid] ? 100 - a / amt[pid] * 100 : 0 }; };
    return { overall, amt, pct, unAmt: overall - sumAmt, unPct: 100 - sumPct, left };
  }
  function budgetHint(d, k, id, parentName) {
    if (!bnum(d.vals[id])) return '';
    if (d.basis === 'pct') return k.amt[id] ? money(k.amt[id]) : (parentName ? `Set ${parentName} first` : 'Set overall first');
    return k.pct[id] ? `${fmtPct(k.pct[id])} of ${parentName || 'spend'}` : '';
  }
  function unallocText(k) {
    if (!k.overall) return { main: 'Set an overall spend budget', cls: 'muted' };
    const over = k.unAmt < -0.004;
    return { main: `${over ? '−' : ''}${money(Math.abs(k.unAmt))} · ${fmtPct(Math.abs(k.unPct))} ${over ? 'over' : 'unallocated'}`, cls: over ? 'red' : 'green' };
  }
  function renderBudgets(scr) {
    const d = budgetDraft(scr), k = budgetCalc(d);
    const pctMode = d.basis === 'pct';
    const input = (id, ph, unit) => `<span class="bin">${unit === '$' ? '<span class="muted">$</span>' : ''}<input inputmode="decimal" placeholder="${ph}" value="${esc(d.vals[id] || '')}" data-bv="${id}">${unit === '%' ? '<span class="muted">%</span>' : ''}</span>`;
    const rep = (id) => `<button class="iconbtn brep ${d.rep[id] ? 'on' : ''} ${bnum(d.vals[id]) ? '' : 'hide'}" data-act="budgetRepeat" data-id="${id}" aria-pressed="${!!d.rep[id]}" aria-label="Repeat every month">${svg('repeat', 18, 'currentColor')}</button>`;
    const mk = scr.month, mname = (k) => E.MONTHS[Number(k.slice(5)) - 1];
    const first = E.monthKeyFor(S.schedule, S.settings.startDate, hs());
    const keys = []; for (let k = first; k <= E.shiftKey(mk > first ? mk : first, 12); k = E.shiftKey(k, 1)) keys.push(k);
    const prevK = E.shiftKey(mk, -1);
    const unit = pctMode ? '%' : '$';
    const parentRow = (p) => {
      const subs = S.categories.filter((s) => s.parent === p.id);
      const open = !!d.open[p.id];
      const lf = k.left(p.id);
      return `<div class="card brow-card">
        <div class="brow"><span class="ic" style="background:${p.color}">${svg(p.icon, 18, '#fff')}</span>
          <span class="grow bname"><b>${esc(p.name)}</b><span class="muted small" data-hint="${p.id}">${budgetHint(d, k, p.id)}</span></span>
          ${input(p.id, '—', unit)}${rep(p.id)}
          ${subs.length ? `<button class="iconbtn bchev" data-act="budgetToggle" data-id="${p.id}" aria-label="${open ? 'Hide' : 'Show'} ${esc(p.name)} subcategories" aria-expanded="${open}">${svg(open ? 'chevUp' : 'chevDown', 18, 'var(--muted)')}</button>` : '<span class="bchev"></span>'}
        </div>
        ${subs.length && open ? subs.map((s) => `<div class="brow sub"><span class="dot" style="background:${s.color};width:10px;height:10px"></span>
            <span class="grow bname"><span style="font-weight:700">${esc(s.name)}</span><span class="muted small" data-hint="${s.id}">${budgetHint(d, k, s.id, p.name)}</span></span>
            ${input(s.id, '—', unit)}${rep(s.id)}<span class="bchev"></span></div>`).join('') + `<div class="muted small bleft" data-left="${p.id}">${k.amt[p.id] ? `${money(lf.amt)} · ${fmtPct(lf.pct)} of ${esc(p.name)} not in a subcategory` : ''}</div>` : ''}
      </div>`;
    };
    const ua = unallocText(k);
    return `<section class="screen sub">${header('Budgets')}
      <div class="tabs hscroll monthscroll" role="tablist" aria-label="Budget month" style="margin:0 -16px;padding:0 16px">${keys.map((k) => (k.endsWith('-01') && k !== keys[0] ? `<span class="yearmark" aria-hidden="true">${k.slice(0, 4)}</span>` : '') + `<button role="tab" aria-selected="${k === mk}" aria-label="${mname(k)} ${k.slice(0, 4)}" class="${k === mk ? 'on' : ''}" data-act="budgetMonth" data-v="${k}" style="flex:none;padding:0 18px">${mname(k)}</button>`).join('')}</div>
      <div class="between"><span class="muted small" style="display:flex;align-items:center;gap:6px">${svg('repeat', 16, 'var(--pink)')} = same every month until you change it</span>${mk > first ? `<button class="chip" style="height:36px" data-act="budgetCopy">Copy ${mname(prevK)}</button>` : ''}</div>
      <div class="card" style="gap:10px">
        <div class="brow"><span class="grow bname"><b style="font-size:17px">Overall spend</b><span class="muted small">Monthly limit for everything you spend</span></span>${input('overall', '—', '$')}${rep('overall')}</div>
        <div class="between"><span class="muted small">Left to give categories</span><b class="${ua.cls}" id="bunalloc">${ua.main}</b></div>
      </div>
      <div class="between"><h2 style="margin:0">Categories</h2>
        <div class="seg" role="group" aria-label="Budget categories by"><button class="${pctMode ? '' : 'on'}" data-act="budgetBasis" data-v="amt" aria-pressed="${!pctMode}">$</button><button class="${pctMode ? 'on' : ''}" data-act="budgetBasis" data-v="pct" aria-pressed="${pctMode}">%</button></div></div>
      <p class="muted small" style="margin:0">${pctMode ? 'Percent of overall spend. Subcategories are a percent of their parent.' : 'Dollar amounts. Each shows its share of overall spend (subcategories: share of their parent).'} Leave blank for no budget.</p>
      ${S.categories.filter((c) => c.type === 'expense' && !c.parent).map(parentRow).join('')}
      <h2>Income</h2><div class="card" style="gap:4px">${S.categories.filter((c) => c.type === 'income' && !c.parent).map((p) => `<div class="brow"><span class="dot" style="background:${p.color};width:10px;height:10px"></span><span class="grow bname"><b>${esc(p.name)}</b></span>${input(p.id, '—', '$')}${rep(p.id)}</div>`).join('')}</div>
      <h2>Savings</h2><div class="card" style="gap:4px">${S.wallets.filter((w) => w.type === 'savings').map((w) => `<div class="brow"><span class="dot" style="background:var(--savings);width:10px;height:10px"></span><span class="grow bname"><b>${esc(w.name)}</b></span>${input('wallet:' + w.id, '—', '$')}${rep('wallet:' + w.id)}</div>`).join('')}</div>
      <p class="warn" id="bwarn" style="margin:0"></p>
      <button class="btn primary" data-act="budgetSave">Save budgets</button>
    </section>`;
  }
  // live update of hints and the unallocated line while typing (no re-render, so focus stays put)
  function budgetRefresh(scr) {
    const d = scr.d, k = budgetCalc(d);
    S.categories.filter((c) => c.type === 'expense').forEach((c) => {
      const el = document.querySelector(`[data-hint="${c.id}"]`);
      if (el) el.textContent = budgetHint(d, k, c.id, c.parent ? (cat(c.parent) || {}).name : '');
      const lf = document.querySelector(`[data-left="${c.id}"]`);
      if (lf) { const l = k.left(c.id); lf.textContent = k.amt[c.id] ? `${money(l.amt)} · ${fmtPct(l.pct)} of ${c.name} not in a subcategory` : ''; }
    });
    document.querySelectorAll('.brep').forEach((b) => b.classList.toggle('hide', !bnum(d.vals[b.dataset.id])));
    const u = document.getElementById('bunalloc');
    if (u) { const t = unallocText(k); u.textContent = t.main; u.className = t.cls; }
  }

  function renderCategories(scr) {
    scr.open = scr.open || {};
    const block = (type) => S.categories.filter((c) => c.type === type && !c.parent).map((p) => {
      const subs = S.categories.filter((s) => s.parent === p.id);
      const open = !!scr.open[p.id];
      return `
      <div class="card" style="gap:6px">
        <div class="row" style="gap:4px"><button class="acctrow grow" style="padding:0;min-height:48px" data-act="catEdit" data-id="${p.id}"><span class="ic" style="width:40px;height:40px;border-radius:14px;background:${p.color};display:flex;align-items:center;justify-content:center">${svg(p.icon, 20, '#fff')}</span><span class="grow" style="display:flex;flex-direction:column;align-items:flex-start"><b style="font-size:16px">${esc(p.name)}</b>${subs.length ? `<span class="muted small">${subs.length} subcategor${subs.length === 1 ? 'y' : 'ies'}</span>` : ''}</span></button>
        <button class="iconbtn bchev" data-act="catToggle" data-id="${p.id}" aria-expanded="${open}" aria-label="${open ? 'Hide' : 'Show'} ${esc(p.name)} subcategories">${svg(open ? 'chevUp' : 'chevDown', 18, 'var(--muted)')}</button></div>
        ${open ? subs.map((s) => `<button class="acctrow" style="padding:0 0 0 24px;min-height:44px" data-act="catEdit" data-id="${s.id}"><span style="width:30px;height:30px;border-radius:10px;background:${s.color};display:flex;align-items:center;justify-content:center">${svg(s.icon, 16, '#fff')}</span><span class="grow" style="font-weight:700">${esc(s.name)}</span></button>`).join('') + `<button class="chip" style="height:36px;align-self:flex-start;margin-left:24px" data-act="catNew" data-parent="${p.id}">+ Subcategory</button>` : ''}
      </div>`;
    }).join('');
    return `<section class="screen sub">${header('Categories', { right: `<button class="iconbtn" data-act="open" data-v="reorder" data-k="categories" aria-label="Order categories">${svg('sortIc', 20)}</button><button class="iconbtn" data-act="catNew" data-type="expense" aria-label="Add category">${svg('plus', 22)}</button>` })}
      <p class="muted small" style="margin:0">Tap a category or subcategory to change its name, icon or tile colour.</p>
      <h2>Expense</h2>${block('expense')}<h2>Income</h2>${block('income')}
    </section>`;
  }
  function renderCatForm(scr) {
    const c = scr.cat;
    return `<section class="screen sub">${header(scr.isNew ? (c.parent ? 'Add Subcategory' : 'Add Category') : 'Edit Category', scr.isNew ? {} : { right: `<button class="iconbtn" data-act="catDelete" aria-label="Delete category">${svg('trash', 22, 'var(--red)')}</button>` })}
      <div class="row" style="justify-content:center"><span style="width:80px;height:80px;border-radius:26px;background:${c.color};display:flex;align-items:center;justify-content:center">${svg(c.icon, 40, '#fff', 1.8)}</span></div>
      <label class="field"><span class="lbl">Name</span><input value="${esc(c.name)}" data-cbind="name" placeholder="Name"></label>
      ${scr.isNew ? `<h2>Type</h2><div class="seg" role="group" aria-label="Category type">${['expense', 'income'].map((t) => `<button class="${c.type === t ? 'on' : ''}" data-act="catType" data-v="${t}" aria-pressed="${c.type === t}" style="padding:0 16px">${t === 'expense' ? 'Expense' : 'Income'}</button>`).join('')}</div>
      <h2>Subcategory of</h2><div class="hscroll row" style="gap:8px"><button class="chip ${!c.parent ? 'on' : ''}" data-act="catParent" data-v="">None</button>${S.categories.filter((x) => x.type === c.type && !x.parent).map((x) => `<button class="chip ${c.parent === x.id ? 'on' : ''}" data-act="catParent" data-v="${x.id}">${esc(x.name)}</button>`).join('')}</div>` : ''}
      <section class="card collapser">
        <button class="row catrow collapsebar" data-act="coloursToggle" aria-expanded="${!!scr.coloursOpen}"><b class="grow">${scr.coloursOpen ? 'Hide colours' : 'View colours'}</b>${svg(scr.coloursOpen ? 'chevUp' : 'chevDown', 18, 'var(--muted)', 2.5)}</button>
        ${scr.coloursOpen ? (() => {
          const sw = (col) => `<button style="background:${col}" class="${c.color.toLowerCase() === col.toLowerCase() ? 'on' : ''}" data-act="catColor" data-v="${col}" aria-label="Colour ${col}"></button>`;
          const custom = (S.settings.customColors || []).filter((x) => !COLOR_CHOICES.some((y) => y.toLowerCase() === x.toLowerCase()));
          const isCustom = ![...COLOR_CHOICES, ...(S.settings.customColors || [])].some((x) => x.toLowerCase() === c.color.toLowerCase());
          return `<div class="collapsebody">
            <div class="swgrid">${COLOR_FAMILIES.map((f) => f.map(sw).join('')).join('')}</div>
            <div class="swatches">${custom.map(sw).join('')}<label class="swcustom ${isCustom ? 'on' : ''}" title="Custom colour" style="--c:${c.color}"><input type="color" value="${c.color}" data-cbind="color" data-rerender="1" aria-label="Pick a custom colour"></label></div>
            <p class="muted small" style="margin:0">Tap the rainbow circle to pick any colour. Custom colours you save are added to this palette.</p>
          </div>`; })() : ''}
      </section>
      <section class="card collapser">
        <button class="row catrow collapsebar" data-act="iconsToggle" aria-expanded="${!!scr.iconsOpen}"><b class="grow">${scr.iconsOpen ? 'Hide icons' : 'View icons'}</b>${svg(scr.iconsOpen ? 'chevUp' : 'chevDown', 18, 'var(--muted)', 2.5)}</button>
        ${scr.iconsOpen ? `<div class="collapsebody">${ICON_GROUPS.map(([g, list]) => `<h3 class="icongrp">${g}</h3><div class="grid4">${list.map((i) => `<button class="cattile ${c.icon === i ? 'on' : ''}" data-act="catIcon" data-v="${i}" aria-label="${i}"><span class="t" style="background:${c.color}">${svg(i, 26, '#fff')}</span></button>`).join('')}</div>`).join('')}</div>` : ''}
      </section>
      <p class="warn" id="cwarn" style="margin:0"></p>
      <button class="btn primary" data-act="catSave">Save</button>
    </section>`;
  }

  const FREQ_LABEL = { semimonthly: 'Twice a month', monthly: 'Monthly', biweekly: 'Every 2 weeks', weekly: 'Weekly' };
  const ord = (n) => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
  const dayName = (d) => (Number(d) >= 31 ? 'last day' : ord(Number(d)));
  const schedText = (x) => x.frequency === 'semimonthly' ? `Twice a month · ${dayName(x.day1)} & ${dayName(x.day2)}` : x.frequency === 'monthly' ? `Monthly · ${dayName(x.day1)}` : `${FREQ_LABEL[x.frequency]} · from ${E.fmtShort(x.anchor)}`;
  function renderSettings(scr) {
    if (!scr.sc) { const { history, ...cur } = S.schedule; scr.sc = { ...cur, effectiveFrom: TODAY < S.settings.startDate ? S.settings.startDate : TODAY }; }
    const sc = scr.sc;
    const segs = E.segments(S.schedule).slice().reverse();
    const yrs = [...new Set(S.holidays.map((h) => h.date.slice(0, 4)))];
    const t = th();
    const segRow = (label, key, opts) => `<div class="between" style="gap:10px;min-height:48px"><span style="font-weight:800">${label}</span><div class="seg" role="group" aria-label="${label}">${opts.map(([v, l]) => `<button class="${t[key] === v ? 'on' : ''}" data-act="themeSet" data-k="${key}" data-v="${v}" aria-pressed="${t[key] === v}" style="padding:0 12px;min-width:0">${l}</button>`).join('')}</div></div>`;
    const sample = { id: 'sample', date: TODAY, type: 'expense', category: (S.categories.find((c) => c.name === 'Food') || S.categories[0] || {}).id, sub: null, title: 'Dinner out', note: 'Preview', amount: 42.5, wallet: (S.wallets.find((w) => w.type === 'credit') || S.wallets[0] || {}).name, tags: ['date night'] };
    return `<section class="screen sub">${header('Theme & Style')}
      <div class="card" style="gap:10px" aria-label="Preview">
        <span class="ml2">Preview</span>
        <div class="previewtx">${txView(sample).replace(/data-act="[^"]*"/g, 'tabindex="-1"')}</div>
        <div class="bar3" style="font-size:16px"><span class="green">▴ ${money(2150)}</span><span class="red">▾ ${money(642.18)}</span><span>= ${money(1507.82)}</span></div>
        ${bar(64, 'var(--pink)', 10)}
      </div>
      <div class="card" style="gap:4px">
        ${segRow('Theme', 'mode', [['system', 'System'], ['dark', 'Dark'], ['light', 'Light']])}
        <div style="display:flex;flex-direction:column;gap:8px;padding:6px 0"><span style="font-weight:800">Accent colour</span><div class="swatches">${ACCENTS.map(([n, d]) => `<button style="background:${d}" class="${t.accent === n ? 'on' : ''}" data-act="themeSet" data-k="accent" data-v="${n}" aria-label="${n}"></button>`).join('')}<label class="swcustom ${t.accent === 'custom' ? 'on' : ''}" title="Custom colour" style="--c:${t.accentCustom || '#EFA2B5'}"><input type="color" value="${t.accentCustom || '#EFA2B5'}" data-accent="1" aria-label="Pick a custom accent colour"></label></div></div>
        ${segRow('Text size', 'font', [['s', 'S'], ['m', 'M'], ['l', 'L']])}
        ${segRow('Icon shape', 'shape', [['rounded', 'Rounded'], ['circle', 'Circle']])}
        ${segRow('Transactions', 'layout', [['expanded', 'Expanded'], ['compact', 'Compact']])}
        ${segRow('Net totals', 'net', [['colourful', 'Colourful'], ['simple', 'Simple']])}
        ${segRow('Progress bars', 'bars', [['simple', 'Simple'], ['wavy', 'Wavy']])}
        <div class="between" style="min-height:48px"><span style="font-weight:800">Animations</span><button class="switch ${t.anim ? 'on' : ''}" role="switch" aria-checked="${t.anim}" data-act="themeSet" data-k="anim" data-v="${t.anim ? '' : '1'}" aria-label="Animations"></button></div>
      </div>
      <div class="card"><h2>Pay schedule</h2>
        <div class="field" style="background:var(--card2)"><label for="freq">Frequency</label><select id="freq" data-sbind="frequency" data-rerender="1">${[['semimonthly', 'Twice a month'], ['monthly', 'Monthly'], ['biweekly', 'Every 2 weeks'], ['weekly', 'Weekly']].map(([v, l]) => `<option value="${v}" ${sc.frequency === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        ${sc.frequency === 'semimonthly' || sc.frequency === 'monthly' ? `<div class="field" style="background:var(--card2)"><label for="day1">Pay 1 day</label><select id="day1" data-sbind="day1">${Array.from({ length: 30 }, (_, i) => i + 1).concat([31]).map((d) => `<option value="${d}" ${Number(sc.day1) === d ? 'selected' : ''}>${d === 31 ? 'Last day of month' : ord(d)}</option>`).join('')}</select></div>` : ''}
        ${sc.frequency === 'semimonthly' ? `<div class="field" style="background:var(--card2)"><label for="day2">Pay 2 day</label><select id="day2" data-sbind="day2">${Array.from({ length: 30 }, (_, i) => i + 1).concat([31]).map((d) => `<option value="${d}" ${Number(sc.day2) === d ? 'selected' : ''}>${d === 31 ? 'Last day of month' : ord(d)}</option>`).join('')}</select></div>` : ''}
        ${sc.frequency === 'biweekly' || sc.frequency === 'weekly' ? `<label class="field" style="background:var(--card2)"><span class="lbl">Any payday</span><input type="date" value="${sc.anchor}" data-sbind="anchor"></label>` : ''}
        <label class="field" style="background:var(--card2)"><span class="lbl">Starts from</span><input type="date" value="${sc.effectiveFrom}" data-sbind="effectiveFrom"></label>
        <p class="muted small" style="margin:0">Changes apply from the first payday on or after this date. Earlier months keep their pay dates. Paydays on a weekend or holiday move to the business day before.</p>
        <button class="btn primary" data-act="scheduleSave">Save pay schedule</button>
        <h2 style="margin-top:6px">History</h2>
        ${segs.map((x, i) => `<div class="between" style="font-size:14px;padding:4px 0"><span>${esc(schedText(x))}</span><span class="muted">${i === 0 ? 'since' : 'from'} ${E.fmtShort(x.effectiveFrom || S.settings.startDate)}${x.effectiveFrom ? ' ' + x.effectiveFrom.slice(0, 4) : ''}</span></div>`).join('')}
      </div>
      <div class="card"><h2>Bank holidays</h2>
        ${yrs.map((y) => `<details><summary style="font-weight:800;padding:6px 0">${y}</summary>${S.holidays.filter((h) => h.date.startsWith(y)).sort((a, b) => a.date.localeCompare(b.date)).map((h) => `<div class="between" style="padding:6px 0"><span>${E.fmtDay(h.date)} · ${esc(h.name)}</span><button class="chip" style="height:32px" data-act="holDel" data-v="${h.date}|${esc(h.name)}">Remove</button></div>`).join('')}</details>`).join('')}
        <div class="row" style="min-width:0"><input type="date" id="holDate" class="field" style="min-height:44px;flex:1;min-width:0;width:0"><input id="holName" class="field" placeholder="Name" style="min-height:44px;flex:1;min-width:0;width:0"></div>
        <button class="btn" data-act="holAdd">Add holiday</button>
      </div>
    </section>`;
  }


  // ---------- closed months ----------
  const closedKeys = () => S.settings.closed || [];
  const isLocked = (date) => !!date && closedKeys().includes(E.monthKeyFor(S.schedule, date, hs()));
  const lockMsg = (date) => `${monthLabel(E.monthKeyFor(S.schedule, date, hs()))} is closed. Reopen it in More → Close Month to change it.`;
  const shortName = (n) => (n || '').replace(/^\[[^\]]+\]\s*/, '');

  // ---------- account detail ----------
  function renderAcct(scr) {
    const w = S.wallets.find((x) => x.id === scr.id);
    if (!w) return `<section class="screen sub">${header('Account')}<div class="empty">This account was deleted.</div></section>`;
    const bal = E.balances(S, TODAY)[w.name] || 0;
    const owed = w.type === 'credit' || w.type === 'loan';
    const list = E.transactionsInRange(S, w.openingDate || '2000-01-01', E.addDays(TODAY, 62)).filter((t) => t.wallet === w.name || t.toWallet === w.name).sort((a, b) => (a.date < b.date ? 1 : -1));
    const shown = list.slice(0, scr.more ? 1000 : 60);
    const H = hs(), curK = E.monthKeyFor(S.schedule, TODAY, H), bm = E.budgetMonth(S.schedule, curK, H);
    const pay = bm.pays.find((p) => TODAY >= p.start && TODAY <= p.end) || bm.pays[0];
    const charged = pay ? list.filter((t) => t.type === 'expense' && t.wallet === w.name && t.date >= pay.start && t.date <= pay.end).reduce((x, t) => x + Number(t.amount), 0) : 0;
    const nd = (w.type === 'credit' || w.type === 'loan') ? E.nextDue(w, TODAY) : null; const due = nd ? E.diffDays(TODAY, nd) : null;
    const color = TYPE_COLOR[w.type];
    return `<section class="screen sub">${header(shortName(w.name) || w.name, { right: `<button class="iconbtn" data-act="walletEdit" data-id="${w.id}" aria-label="Edit account">${svg('pencil', 20)}</button>` })}
      <div class="card" style="gap:6px;border-left:4px solid ${color}">
        <span class="muted small">${esc(w.name)} · ${TYPE_LABEL[w.type].replace(/s$/, '')}</span>
        <span style="font-size:32px;font-weight:800" class="${bal === 0 ? '' : owed ? (bal > 0 ? 'red' : 'green') : (bal > 0 ? 'green' : 'red')}">${owed && bal > 0 ? 'Owing ' : ''}${signed(owed ? Math.abs(bal) : bal)}</span>
        ${due != null ? `<span class="small ${due <= 3 ? 'red' : 'muted'}">Payment due ${E.fmtDay(nd)} · in ${due} day${due === 1 ? '' : 's'}</span>` : ''}
        ${(w.type === 'credit' || w.type === 'loan') && Number(w.limit) > 0 ? (() => { const lim = Number(w.limit), owe = Math.max(0, bal), pc = Math.round(owe / lim * 100); return `<div style="display:flex;flex-direction:column;gap:4px;margin-top:4px">${bar(pc, pc >= 90 ? 'var(--red)' : w.type === 'loan' ? 'var(--loan)' : 'var(--credit)', 8)}<div class="between muted" style="font-size:12px"><span>${pc}% of ${money(lim)} limit</span><span>${money(Math.max(0, lim - owe))} available</span></div></div>`; })() : ''}
        ${w.type === 'credit' && pay ? `<span class="muted small">To be paid · ${pay.label} (${E.fmtShort(pay.start)} – ${E.fmtShort(pay.end)}): <b style="color:var(--text)">${money(charged)}</b></span>` : ''}
      </div>
      <div class="grid2">
        <button class="btn" data-act="correctOpen" data-id="${w.id}">Correct balance</button>
        ${owed ? `<button class="btn" data-act="payOpen" data-id="${w.id}">Pay ${w.type === 'loan' ? 'loan' : 'card'}</button>` : `<button class="btn" data-act="addFor" data-id="${w.id}">Add transaction</button>`}
      </div>
      ${owed ? `<button class="btn outline" data-act="addFor" data-id="${w.id}">Add transaction (e.g. interest as Bills &amp; Fees)</button>` : ''}
      <h2 style="margin:4px 0 0">Transactions</h2>
      ${shown.length ? dayGroups(shown, []) : `<div class="empty">No transactions on this account yet.</div>`}
      ${list.length > shown.length ? `<button class="btn outline" data-act="acctMore">Show all ${list.length}</button>` : ''}
    </section>`;
  }

  // ---------- close month ----------
  function firstOpenMonth() {
    const H = hs();
    let k = E.monthKeyFor(S.schedule, S.settings.startDate, H);
    const cur = E.monthKeyFor(S.schedule, TODAY, H);
    while (closedKeys().includes(k) && k < cur) k = E.shiftKey(k, 1);
    return k;
  }
  function renderClose(scr) {
    scr.month = scr.month || firstOpenMonth();
    const H = hs(), mk = scr.month, bm = E.budgetMonth(S.schedule, mk, H);
    const closed = closedKeys().includes(mk);
    const asOf = bm.end < TODAY ? bm.end : TODAY;
    const endBal = E.balances(S, asOf), startBal = E.balances(S, E.addDays(bm.start, -1));
    const inMonth = S.transactions.filter((t) => !t.deleted && t.date >= bm.start && t.date <= bm.end);
    const inv = S.wallets.filter((w) => w.type === 'savings');
    const debts = S.wallets.filter((w) => w.type === 'credit' || w.type === 'loan');
    const card = (w) => {
      const charges = inMonth.filter((t) => t.wallet === w.name && t.type === 'expense').reduce((x, t) => x + Number(t.amount), 0);
      const pays = inMonth.filter((t) => t.toWallet === w.name && t.type === 'transfer').reduce((x, t) => x + Number(t.amount), 0);
      return { w, carry: startBal[w.name] || 0, charges, pays, end: endBal[w.name] || 0 };
    };
    const cards = debts.map(card);
    const carryTotal = cards.reduce((x, c) => x + Math.max(0, c.end), 0);
    const ended = bm.end < TODAY;
    return `<section class="screen sub">${header('Close Month')}
      ${monthChips(mk, 'closeMonth')}
      <p class="muted" style="margin:0;font-size:13px">${E.fmtShort(bm.start)} – ${E.fmtShort(bm.end)} · ${closed ? '<b class="green">Closed</b>' : ended ? 'Ready to close' : `Ends ${E.fmtDay(bm.end)}`}</p>
      <section class="card" style="gap:8px">
        <h2 class="ctitle">1 · Investment balances</h2>
        <p class="muted small" style="margin:0">Type each account's real balance on ${E.fmtShort(asOf)}. The difference is saved as a balance correction, which never counts as income or spend.</p>
        ${inv.map((w) => `<div class="between" style="min-height:48px"><span style="display:flex;flex-direction:column"><b>${esc(w.name)}</b><span class="muted small">${money(endBal[w.name] || 0)}</span></span>${closed ? '' : `<button class="chip" style="height:40px" data-act="correctOpen" data-id="${w.id}" data-v="${asOf}">Correct</button>`}</div>`).join('') || '<p class="muted small" style="margin:0">No savings accounts.</p>'}
      </section>
      <section class="card" style="gap:10px">
        <h2 class="ctitle">2 · Cards &amp; loans</h2>
        ${(() => { const owed = cards.reduce((x, c) => x + Math.max(0, c.carry + c.charges), 0), paid = cards.reduce((x, c) => x + Math.min(c.pays, Math.max(0, c.carry + c.charges)), 0); const pc = owed > 0 ? Math.round(paid / owed * 100) : 100;
          return owed > 0.004 ? `<div style="display:flex;flex-direction:column;gap:6px;padding-bottom:8px;border-bottom:1px solid var(--line)"><div class="between" style="align-items:baseline"><span class="muted small">Paid this month</span><span><b class="${pc >= 100 ? 'green' : ''}" style="font-size:20px">${money(paid)}</b><span class="muted"> of ${money(owed)} · ${pc}%</span></span></div>${bar(pc, 'var(--green)', 10)}<span class="muted" style="font-size:12px">${pc >= 100 ? 'Every card and loan is paid off for the month.' : `${money(owed - paid)} still owing across your cards and loans.`}</span></div>` : ''; })()}
        ${cards.map((c) => { const due = Math.max(0, c.carry + c.charges), pc = due > 0 ? Math.min(100, Math.round(c.pays / due * 100)) : 100; return `<div style="display:flex;flex-direction:column;gap:4px">
          <div class="between"><b>${esc(c.w.name)}</b>${!closed && c.end > 0.004 ? `<button class="chip" style="height:36px" data-act="payOpen" data-id="${c.w.id}">Pay</button>` : due > 0.004 ? '<span class="green small" style="font-weight:800">Paid off</span>' : ''}</div>
          ${due > 0.004 ? `${bar(pc, 'var(--green)', 6)}<span class="muted" style="font-size:12px">${money(Math.min(c.pays, due))} of ${money(due)} paid · ${pc}%</span>` : ''}
          <div class="lines" style="font-size:13px">
            <span class="between"><span>Carryover from last month</span><span>${money(c.carry)}</span></span>
            <span class="between"><span>Charges this month</span><span class="red">+ ${money(c.charges)}</span></span>
            <span class="between"><span>Payments this month</span><span class="green">− ${money(c.pays)}</span></span>
            <span class="between" style="color:var(--text);font-weight:800;border-top:1px solid var(--line);padding-top:4px"><span>${c.end > 0.004 ? 'Carries over' : c.carry + c.charges > 0.004 ? 'Paid off' : 'Nothing owing'}</span><span>${money(Math.max(0, c.end))}</span></span>
          </div></div>`; }).join('') || '<p class="muted small" style="margin:0">No cards or loans.</p>'}
      </section>
      <section class="card" style="gap:8px">
        <h2 class="ctitle">3 · ${closed ? 'Closed' : 'Close'}</h2>
        <p class="muted small" style="margin:0">${closed ? `${monthLabel(mk)} is locked so it can't be changed by accident. ${money(carryTotal)} carried over on cards and loans.` : `Closing locks ${monthLabel(mk)} against edits. ${money(carryTotal)} on cards and loans carries into ${monthLabel(E.shiftKey(mk, 1))} automatically.`}</p>
        ${closed ? `<button class="btn outline" data-act="reopenMonth" data-v="${mk}">Reopen ${monthLabel(mk)}</button>` : `<button class="btn primary" data-act="closeIt" data-v="${mk}">${ended ? '' : 'Close early · '}Close ${monthLabel(mk)}</button>`}
      </section>
    </section>`;
  }

  // ---------- calendar ----------
  function renderCalendar(scr) {
    scr.month = scr.month || ui.month;
    const H = hs(), mk = scr.month, bm = E.budgetMonth(S.schedule, mk, H);
    const list = E.transactionsInRange(S, bm.start, bm.end);
    const net = {}, inc = {}, out = {};
    list.forEach((t) => {
      const a = Number(t.amount) || 0;
      if (t.type === 'income') { inc[t.date] = (inc[t.date] || 0) + a; net[t.date] = (net[t.date] || 0) + a; }
      else if (t.type === 'expense') { out[t.date] = (out[t.date] || 0) + a; net[t.date] = (net[t.date] || 0) - a; }
    });
    const tIn = Object.values(inc).reduce((x, v) => x + v, 0), tOut = Object.values(out).reduce((x, v) => x + v, 0);
    // grid from the Sunday on/before the start to the Saturday on/after the end
    let d = E.addDays(bm.start, -E.dow(bm.start));
    const last = E.addDays(bm.end, 6 - E.dow(bm.end));
    const cells = [];
    for (; d <= last; d = E.addDays(d, 1)) cells.push(d);
    const sel = scr.day && scr.day >= bm.start && scr.day <= bm.end ? scr.day : null;
    const kf = (n) => { const a = Math.abs(n); return a >= 1000 ? (Math.round(a / 100) / 10).toString().replace(/\.0$/, '') + 'k' : Math.round(a).toString(); };
    return `<section class="screen sub">${header('Calendar')}
      ${monthChips(mk, 'calMonth')}
      <div class="card" style="padding:10px 12px"><div class="bar3" style="font-size:16px"><span class="green">▴ ${money(tIn)}</span><span class="red">▾ ${money(tOut)}</span><span>= ${signed(tIn - tOut)}</span></div></div>
      <div class="calgrid" role="grid" aria-label="${monthLabel(mk)}">
        ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((x) => `<span class="calhd" aria-hidden="true">${x}</span>`).join('')}
        ${cells.map((c) => { const inM = c >= bm.start && c <= bm.end; const n = net[c] || 0; const has = inc[c] || out[c];
          return `<button class="calday ${inM ? '' : 'off'} ${c === TODAY ? 'today' : ''} ${c === sel ? 'sel' : ''}" ${inM ? `data-act="calDay" data-v="${c}"` : 'disabled'} aria-label="${E.fmtDay(c)}${has ? `, net ${signed(n)}` : ''}"><span class="dn">${Number(c.slice(8))}</span>${inM && has ? `<span class="dv ${n > 0.004 ? 'green' : n < -0.004 ? 'red' : 'muted'}">${n > 0.004 ? '+' : n < -0.004 ? '−' : ''}${kf(n)}</span>` : ''}</button>`; }).join('')}
      </div>
      ${sel ? (() => { const day = list.filter((t) => t.date === sel).sort((a, b) => (a.type > b.type ? 1 : -1)); return day.length ? dayGroups(day, []) : `<div class="empty">Nothing on ${E.fmtDay(sel)}.</div>`; })() : '<p class="muted small" style="margin:0;text-align:center">Tap a day to see its transactions. Transfers and balance corrections don’t count toward a day’s net.</p>'}
    </section>`;
  }

  // ---------- search ----------
  function renderSearch(scr) {
    const q = (scr.q || '').trim().toLowerCase();
    let list = S.transactions.filter((t) => !t.deleted);
    let title = 'Search';
    if (scr.catId) {
      const c = cat(scr.catId); title = c ? c.name : 'Category';
      const bm = scr.month ? E.budgetMonth(S.schedule, scr.month, hs()) : null;
      list = (bm ? E.transactionsInRange(S, bm.start, bm.end) : list).filter((t) => t.type === 'expense' && (t.category === scr.catId || t.sub === scr.catId || (cat(t.category) || {}).parent === scr.catId) && (!scr.range || (t.date >= scr.range[0] && t.date <= scr.range[1])));
    }
    if (q) {
      const num = parseFloat(q.replace(/[$,]/g, ''));
      list = list.filter((t) => {
        const c = cat(t.category), sb = cat(t.sub);
        const hay = [t.title, t.note, c && c.name, sb && sb.name, t.wallet, t.toWallet, (t.tags || []).map((g) => '#' + g).join(' ')].join(' ').toLowerCase();
        return hay.includes(q) || (!isNaN(num) && Math.abs(Number(t.amount) - num) < 0.005);
      });
    }
    list = list.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 200);
    const total = list.filter((t) => t.type === 'expense').reduce((x, t) => x + Number(t.amount), 0);
    return `<section class="screen sub">${header(title)}
      <label class="field"><span class="sr">Search</span>${svg('search', 18, 'var(--muted)')}<input id="searchbox" type="search" placeholder="${scr.catId ? 'Filter' : 'Search title, note, #tag, category, account or amount'}" value="${esc(scr.q || '')}" data-qbind="1" autocomplete="off"></label>
      ${scr.catId && scr.month ? `<p class="muted" style="margin:0;font-size:13px">${monthLabel(scr.month)} · ${list.length} transaction${list.length === 1 ? '' : 's'} · <span class="red">${money(total)}</span></p>` : ''}
      <div id="searchres">${q || scr.catId ? (list.length ? dayGroups(list, []) : '<div class="empty">No matches.</div>') : '<div class="empty">Type to search every transaction.</div>'}</div>
    </section>`;
  }

  // ---------- data sync & export ----------
  const SYNC_TABLES = ['transactions', 'rules', 'skips', 'wallets', 'categories', 'budgets', 'holidays', 'settings'];
  const dirty = () => { try { return JSON.parse(localStorage.getItem('bt-dirty') || '[]'); } catch (e) { return []; } };
  const setDirty = (arr) => { try { localStorage.setItem('bt-dirty', JSON.stringify(arr)); } catch (e) { /* storage blocked */ } };
  function markDirty(table) { if (!SYNC_TABLES.includes(table)) return; const d = dirty(); if (!d.includes(table)) { d.push(table); setDirty(d); } scheduleSync(); }
  let syncTimer = null, syncing = false;
  function scheduleSync() {
    const cfg = S.settings.sync || {};
    if (!cfg.url || !cfg.key) return;
    clearTimeout(syncTimer); syncTimer = setTimeout(() => { if (navigator.onLine) syncNow(true); }, 4000);
  }
  async function callScript(payload) {
    const cfg = S.settings.sync || {};
    const res = await fetch(cfg.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ key: cfg.key, ...payload }) });
    const j = await res.json();
    if (!j.ok) throw new Error(j.error || 'The script said no');
    return j;
  }
  const tableRows = (t) => (t === 'settings' ? [{ id: 'settings', ...S.settings }] : S[t]);
  async function syncNow(quiet) {
    if (syncing) return;
    const cfg = S.settings.sync || {};
    if (!cfg.url || !cfg.key) { if (!quiet) toast('Add your script URL and key first'); return; }
    const d = dirty();
    const tables = quiet ? d : SYNC_TABLES;
    if (!tables.length) { if (!quiet) toast('Already up to date'); return; }
    syncing = true; if (!quiet) render();
    try {
      const body = {}; tables.forEach((t) => { body[t] = tableRows(t); });
      await callScript({ action: 'sync', tables: body });
      setDirty(dirty().filter((t) => !tables.includes(t)));
      S.settings.sync = { ...cfg, lastSync: new Date().toISOString(), lastError: null };
      await DBH.save('settings');
      if (!quiet) toast('Synced to Google Sheets');
    } catch (err) {
      S.settings.sync = { ...cfg, lastError: String(err.message || err) };
      await DBH.save('settings');
      if (!quiet) toast('Sync failed — check the URL and key');
    }
    syncing = false;
    const top = ui.stack[ui.stack.length - 1]; if (top && top.name === 'sync') render();
  }
  function renderSync(scr) {
    const cfg = S.settings.sync || {};
    scr.url = scr.url != null ? scr.url : (cfg.url || ''); scr.key = scr.key != null ? scr.key : (cfg.key || '');
    const pend = dirty();
    return `<section class="screen sub">${header('Data Sync')}
      <section class="card" style="gap:10px">
        <h2 class="ctitle">Google Sheets backup</h2>
        <p class="muted small" style="margin:0">Your data lives on this phone. Changes copy one way to your Sheet a few seconds after you make them, whenever you're online.</p>
        <label class="field" style="background:var(--card2)"><span class="lbl">Script URL</span><input value="${esc(scr.url)}" data-ybind="url" placeholder="https://script.google.com/macros/s/…/exec" autocomplete="off"></label>
        <label class="field" style="background:var(--card2)"><span class="lbl">Access key</span><input value="${esc(scr.key)}" data-ybind="key" placeholder="The key in your script" autocomplete="off"></label>
        <button class="btn outline" data-act="syncSaveCfg">Save connection</button>
        <div class="lines" style="font-size:13px">
          <span class="between"><span>Last sync</span><span>${cfg.lastSync ? new Date(cfg.lastSync).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never'}</span></span>
          <span class="between"><span>Waiting to sync</span><span>${pend.length ? pend.length + ' table' + (pend.length === 1 ? '' : 's') : 'Nothing'}</span></span>
          ${cfg.lastError ? `<span class="red">Last error: ${esc(cfg.lastError)}</span>` : ''}
        </div>
        <button class="btn primary" data-act="syncNow" ${syncing ? 'disabled' : ''}>${syncing ? 'Syncing…' : 'Sync now'}</button>
        <details><summary style="font-weight:800;padding:6px 0">How to set up the Sheet</summary>
          <ol class="muted small" style="margin:6px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:4px">
            <li>Create an empty Google Sheet (e.g. "Budget Tracker").</li>
            <li>Extensions → Apps Script. Delete what's there and paste the script from <b>sheets-sync.gs</b> in the app's files.</li>
            <li>Change the <b>ACCESS_KEY</b> line to a long password only you know.</li>
            <li>Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone. Copy the URL.</li>
            <li>Paste the URL and your key above, tap Save connection, then Sync now.</li>
          </ol></details>
      </section>
      <section class="card" style="gap:10px">
        <h2 class="ctitle">Restore</h2>
        <p class="muted small" style="margin:0">For a new or wiped phone: replaces everything on this phone with what's in your Sheet.</p>
        <button class="btn outline" data-act="restoreAsk">Restore from Sheet</button>
      </section>
    </section>`;
  }
  const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  function download(name, text) {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function exportCsv(kind, from, to) {
    if (kind === 'transactions') {
      const rows = S.transactions.filter((t) => !t.deleted && (!from || t.date >= from) && (!to || t.date <= to)).sort((a, b) => (a.date > b.date ? 1 : -1));
      const head = ['Date', 'Budget month', 'Type', 'Category', 'Subcategory', 'Title', 'Note', 'Amount', 'From account', 'To account', 'Recurring', 'ID'];
      const lines = [head.join(',')].concat(rows.map((t) => { const c = cat(t.category), sb = cat(t.sub); const pc = c && c.parent ? cat(c.parent) : null;
        return [t.date, monthLabel(E.monthKeyFor(S.schedule, t.date, hs())), t.type, pc ? pc.name : c ? c.name : '', sb ? sb.name : (pc ? c.name : ''), t.title, t.note, Number(t.amount).toFixed(2), t.wallet, t.toWallet || '', t.ruleId ? 'yes' : '', t.id].map(csvCell).join(','); }));
      download(`budget-transactions${from ? '-' + from : ''}.csv`, lines.join('\n'));
    } else {
      const rows = tableRows(kind); const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
      download(`budget-${kind}.csv`, [keys.join(',')].concat(rows.map((r) => keys.map((k) => csvCell(typeof r[k] === 'object' && r[k] !== null ? JSON.stringify(r[k]) : r[k])).join(','))).join('\n'));
    }
  }
  function renderExport(scr) {
    scr.from = scr.from || ''; scr.to = scr.to || '';
    return `<section class="screen sub">${header('Export')}
      <section class="card" style="gap:10px">
        <h2 class="ctitle">Transactions (CSV)</h2>
        <div class="grid2"><label class="field" style="background:var(--card2)"><span class="lbl">From</span><input type="date" value="${scr.from}" data-xbind="from"></label><label class="field" style="background:var(--card2)"><span class="lbl">To</span><input type="date" value="${scr.to}" data-xbind="to"></label></div>
        <p class="muted small" style="margin:0">Leave the dates blank for everything. Opens in Sheets, Excel or Numbers.</p>
        <button class="btn primary" data-act="exportTx">Download transactions</button>
      </section>
      <section class="card" style="gap:8px">
        <h2 class="ctitle">Other tables</h2>
        <div class="grid2">${['budgets', 'categories', 'wallets', 'rules'].map((k) => `<button class="btn outline" data-act="exportTable" data-v="${k}">${{ budgets: 'Budgets', categories: 'Categories', wallets: 'Accounts', rules: 'Recurring' }[k]}</button>`).join('')}</div>
      </section>
    </section>`;
  }


  // ---------- ordering (accounts and categories) ----------
  const WTYPES = ['bank', 'savings', 'credit', 'loan'];
  function applySort(kind, mode) {
    const cmp = (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) * (mode === 'za' ? -1 : 1);
    if (kind === 'wallets') S.wallets = WTYPES.flatMap((t) => S.wallets.filter((w) => w.type === t).sort(cmp)).concat(S.wallets.filter((w) => !WTYPES.includes(w.type)));
    else {
      const parents = (type) => S.categories.filter((c) => c.type === type && !c.parent).sort(cmp);
      S.categories = ['expense', 'income'].flatMap((type) => parents(type).flatMap((p) => [p].concat(S.categories.filter((c) => c.parent === p.id).sort(cmp))));
    }
  }
  function renderReorder(scr) {
    const kind = scr.kind, mode = (S.settings.sort || {})[kind] || (kind === 'rules' ? 'date' : 'custom');
    const row = (id, label, sub, color, icon) => `<div class="rrow" data-id="${id}">${icon ? `<span class="ic" style="width:32px;height:32px;border-radius:10px;background:${color};display:flex;align-items:center;justify-content:center;flex:none">${svg(icon, 16, '#fff')}</span>` : `<span class="ring" style="border-color:${color}"></span>`}<span class="grow" style="font-weight:${sub ? 600 : 800}">${esc(label)}</span>${mode === 'custom' ? `<span class="rhandle" role="button" aria-label="Drag to reorder ${esc(label)}">${svg('grip', 20, 'var(--muted)', 3.2)}</span>` : ''}</div>`;
    let lists = '';
    if (kind === 'rules') lists = `<div class="rlist" data-group="r:all">${S.rules.map((r) => { const c = cat(r.template.category); return row(r.id, ruleName(r), false, c ? c.color : '#5C5960', c ? c.icon : 'transfer'); }).join('')}</div>`;
    else if (kind === 'wallets') lists = WTYPES.map((t) => { const items = S.wallets.filter((w) => w.type === t); return items.length ? `<h2 style="margin:4px 0 0">${TYPE_LABEL[t]}</h2><div class="rlist" data-group="w:${t}">${items.map((w) => row(w.id, w.name, false, TYPE_COLOR[t])).join('')}</div>` : ''; }).join('');
    else lists = ['expense', 'income'].map((type) => `<h2 style="margin:4px 0 0">${type === 'expense' ? 'Expense' : 'Income'}</h2><div class="rlist" data-group="c:${type}">${S.categories.filter((c) => c.type === type && !c.parent).map((c) => row(c.id, c.name, false, c.color, c.icon)).join('')}</div>`).join('')
      + (mode === 'custom' ? S.categories.filter((p) => !p.parent && S.categories.some((c) => c.parent === p.id)).map((p) => `<h2 style="margin:4px 0 0">${esc(p.name)} subcategories</h2><div class="rlist" data-group="s:${p.id}">${S.categories.filter((c) => c.parent === p.id).map((c) => row(c.id, c.name, true, c.color, c.icon)).join('')}</div>`).join('') : '');
    return `<section class="screen sub">${header(kind === 'wallets' ? 'Order accounts' : kind === 'rules' ? 'Order subscriptions' : 'Order categories')}
      <div class="seg full" role="group" aria-label="Sort">${(kind === 'rules' ? [['date', 'Next date'], ['az', 'A–Z'], ['za', 'Z–A'], ['custom', 'Custom']] : [['az', 'A–Z'], ['za', 'Z–A'], ['custom', 'Custom']]).map(([k, l]) => `<button class="${mode === k ? 'on' : ''}" data-act="sortMode" data-v="${k}" aria-pressed="${mode === k}">${l}</button>`).join('')}</div>
      <p class="muted small" style="margin:0">${mode === 'custom' ? 'Drag the handle to move a row. The order is used everywhere in the app.' : mode === 'date' ? 'Sorted by the next payment date, soonest first. Choose Custom to drag rows into your own order.' : 'Sorted alphabetically. Choose Custom to drag rows into your own order.'}</p>
      ${lists}
    </section>`;
  }
  // drag to reorder: pointer events on .rhandle, rows swap as the dragged row passes their midpoint
  (function setupDrag() {
    let drag = null;
    document.addEventListener('pointerdown', (e) => {
      const h = e.target.closest('.rhandle'); if (!h) return;
      const rowEl = h.closest('.rrow'), list = rowEl.parentElement;
      e.preventDefault(); h.setPointerCapture(e.pointerId);
      const r = rowEl.getBoundingClientRect();
      drag = { rowEl, list, startY: e.clientY, offset: 0, h: r.height + 6 };
      rowEl.classList.add('dragging');
    });
    document.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dy = e.clientY - drag.startY;
      drag.rowEl.style.transform = `translateY(${dy - drag.offset}px)`;
      const prev = drag.rowEl.previousElementSibling, next = drag.rowEl.nextElementSibling;
      if (dy - drag.offset > drag.h / 2 && next) { drag.list.insertBefore(next, drag.rowEl); drag.offset += drag.h; drag.rowEl.style.transform = `translateY(${dy - drag.offset}px)`; }
      else if (dy - drag.offset < -drag.h / 2 && prev) { drag.list.insertBefore(drag.rowEl, prev); drag.offset -= drag.h; drag.rowEl.style.transform = `translateY(${dy - drag.offset}px)`; }
    });
    const end = async () => {
      if (!drag) return;
      const { rowEl, list } = drag; drag = null;
      rowEl.classList.remove('dragging'); rowEl.style.transform = '';
      const ids = [...list.querySelectorAll('.rrow')].map((x) => x.dataset.id);
      const [g] = list.dataset.group.split(':');
      const arr = g === 'w' ? S.wallets : g === 'r' ? S.rules : S.categories;
      const pos = arr.map((x, i) => (ids.includes(x.id) ? i : -1)).filter((i) => i >= 0);
      const moved = ids.map((id) => arr.find((x) => x.id === id));
      if (g === 'c') {
        // parents move together with their subcategories
        const type = list.dataset.group.split(':')[1];
        const others = S.categories.filter((c) => (c.parent ? (cat(c.parent) || {}).type : c.type) !== type);
        S.categories = moved.flatMap((p) => [p].concat(S.categories.filter((c) => c.parent === p.id))).concat(others);
      } else pos.forEach((p, i) => { arr[p] = moved[i]; });
      await save(g === 'w' ? 'wallets' : g === 'r' ? 'rules' : 'categories');
    };
    document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
  })();
  const SCREENS = {
    add: renderAdd,
    accounts: renderAccounts, wallet: renderWalletForm, subs: renderSubs, budgets: renderBudgets, categories: renderCategories, cat: renderCatForm, settings: renderSettings,
    calendar: renderCalendar, reorder: renderReorder, close: renderClose, sync: renderSync, export: renderExport, acct: renderAcct, search: renderSearch,
    placeholder: placeholder('Coming soon', '')
  };

  // ---------- sheets ----------
  const SHEETS = {
    unskip: (sh) => {
      const r = S.rules.find((x) => x.id === sh.ruleId); const name = r ? (r.template.title || (cat(r.template.category) || {}).name || 'Recurring') : 'Recurring';
      return `<div class="scrim" data-act="closeSheet"><div class="sheet" role="dialog" aria-label="Skipped payment" data-stop="1">
        <div class="between"><div style="display:flex;flex-direction:column;gap:2px"><h3 style="margin:0">${esc(name)}</h3><span class="muted small">Skipped · ${E.fmtDay(sh.date)}, ${sh.date.slice(0, 4)}</span></div><button class="iconbtn" style="background:transparent" data-act="closeSheet" aria-label="Close">${svg('close')}</button></div>
        <button class="btn primary" data-act="unskipOne" data-id="${sh.ruleId}" data-v="${sh.date}">Undo skip</button>
      </div></div>`;
    },
    sumWallet: () => `<div class="scrim" data-act="closeSheet"><div class="sheet" role="dialog" aria-label="Filter by account" data-stop="1">
        <div class="between"><h3>Show account</h3><button class="iconbtn" style="background:transparent" data-act="closeSheet" aria-label="Close">${svg('close')}</button></div>
        <div class="acctgroup" style="border-color:var(--pink)"><button class="acctrow" data-act="sumWalletSet" data-v="" role="radio" aria-checked="${!ui.sumWallet}"><span class="ring" style="border-color:var(--pink);background:${!ui.sumWallet ? 'var(--pink)' : 'transparent'}"></span><b class="grow" style="text-align:left">All accounts</b></button></div>
        ${WTYPES.map((t) => { const items = S.wallets.filter((w) => w.type === t); return items.length ? `<div class="acctgroup" style="border-color:${TYPE_COLOR[t]}">${items.map((w) => `<button class="acctrow" data-act="sumWalletSet" data-v="${esc(w.name)}" role="radio" aria-checked="${ui.sumWallet === w.name}"><span class="ring" style="border-color:${TYPE_COLOR[t]};background:${ui.sumWallet === w.name ? TYPE_COLOR[t] : 'transparent'}"></span><b class="grow" style="text-align:left">${esc(w.name)}</b></button>`).join('')}</div>` : ''; }).join('')}
      </div></div>`,
    presets: () => `<div class="scrim" data-act="closeSheet"><div class="sheet" role="dialog" aria-label="Presets" data-stop="1">
        <div class="between"><h3>Presets</h3><button class="iconbtn" style="background:transparent" data-act="closeSheet" aria-label="Close">${svg('close')}</button></div>
        <p class="muted small" style="margin:0">Tap a preset on Add Transaction to fill in everything but the date. Make one with “Save as preset”.</p>
        ${(S.settings.presets || []).map((pr) => `<div class="between" style="min-height:48px"><span><b>${esc(pr.name)}</b> <span class="muted">· ${money(pr.tmpl.amount)} · ${esc(pr.tmpl.wallet || '')}</span></span><button class="iconbtn" style="background:transparent" data-act="presetDel" data-id="${pr.id}" aria-label="Delete ${esc(pr.name)}">${svg('trash', 20, 'var(--red)')}</button></div>`).join('')}
      </div></div>`,
    correct: (sh) => {
      const w = S.wallets.find((x) => x.id === sh.id);
      const cur = E.balances(S, sh.date)[w.name] || 0;
      const owed = w.type === 'credit' || w.type === 'loan';
      return `<div class="scrim" data-act="closeSheet"><div class="sheet" role="dialog" aria-label="Correct balance" data-stop="1">
        <div class="between"><h3>Correct ${esc(shortName(w.name))}</h3><button class="iconbtn" style="background:transparent" data-act="closeSheet" aria-label="Close">${svg('close')}</button></div>
        <p class="muted small" style="margin:0">${w.openingDate && sh.date <= w.openingDate ? `This account starts tracking on ${E.fmtDay(w.openingDate)}. Type its ${owed ? 'amount owing' : 'balance'} on that day and it becomes the starting balance.` : `The app has ${money(cur)}${owed ? ' owing' : ''} on ${E.fmtShort(sh.date)}. Type the real ${owed ? 'amount owing' : 'balance'}; the difference is saved as a balance correction.`}</p>
        <label class="field" style="background:var(--card2)"><span class="lbl">Real ${owed ? 'owing' : 'balance'}</span><span class="muted">$</span><input id="realbal" inputmode="decimal" placeholder="${cur.toFixed(2)}" autocomplete="off"></label>
        <p class="warn" id="cbwarn" style="margin:0"></p>
        <button class="btn primary" data-act="correctSave" data-id="${w.id}" data-v="${sh.date}">Save correction</button>
      </div></div>`;
    },
    pay: (sh) => {
      const w = S.wallets.find((x) => x.id === sh.id);
      const owe = Math.max(0, E.balances(S, TODAY)[w.name] || 0);
      const from = S.wallets.filter((x) => x.type === 'bank' || x.type === 'savings');
      return `<div class="scrim" data-act="closeSheet"><div class="sheet" role="dialog" aria-label="Pay" data-stop="1">
        <div class="between"><h3>Pay ${esc(shortName(w.name))}</h3><button class="iconbtn" style="background:transparent" data-act="closeSheet" aria-label="Close">${svg('close')}</button></div>
        <p class="muted small" style="margin:0">Owing ${money(owe)}. A payment moves money between your own accounts, so it doesn't change Money remaining.</p>
        <label class="field" style="background:var(--card2)"><span class="lbl">Amount</span><span class="muted">$</span><input id="payamt" inputmode="decimal" value="${owe ? owe.toFixed(2) : ''}" autocomplete="off"></label>
        <div class="field" style="background:var(--card2)"><label for="payfrom">From</label><select id="payfrom">${from.map((x) => `<option ${x.type === 'bank' ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
        <p class="warn" id="paywarn" style="margin:0"></p>
        <button class="btn primary" data-act="paySave" data-id="${w.id}">Save payment</button>
      </div></div>`;
    },
    perPick: () => {
      const bm = E.budgetMonth(S.schedule, ui.month, hs());
      const cur = ui.sumPeriod != null && ui.sumPeriod < bm.pays.length ? ui.sumPeriod : 'all';
      const opt = (v, label, a, b) => `<button class="acctrow" data-act="sumPeriod" data-v="${v}" role="radio" aria-checked="${cur === v}"><span class="ring" style="border-color:var(--pink);background:${cur === v ? 'var(--pink)' : 'transparent'}"></span><b class="grow" style="text-align:left">${label}</b><span class="muted">${E.fmtShort(a)} – ${E.fmtShort(b)}</span></button>`;
      return `<div class="scrim" data-act="closeSheet"><div class="sheet" role="dialog" aria-label="Choose period" data-stop="1">
        <div class="between"><h3>Show</h3><button class="iconbtn" style="background:transparent" data-act="closeSheet" aria-label="Close">${svg('close')}</button></div>
        <div class="acctgroup" style="border-color:var(--pink)" role="radiogroup">${opt('all', 'Budget month', bm.start, bm.end)}${bm.pays.map((p, i) => opt(i, p.label, p.start, p.end)).join('')}</div>
      </div></div>`;
    },
    nwPick: () => `<div class="scrim" data-act="closeSheet"><div class="sheet" role="dialog" aria-label="Net worth accounts" data-stop="1">
        <div class="between"><h3>Net Worth Accounts</h3><button class="iconbtn" style="background:transparent" data-act="closeSheet" aria-label="Close">${svg('close')}</button></div>
        <p class="muted small" style="margin:0">Cards and loans are subtracted.</p>
        ${['bank', 'savings', 'credit', 'loan'].map((t) => { const items = S.wallets.filter((w) => w.type === t); return items.length ? `<div class="acctgroup" style="border-color:${TYPE_COLOR[t]}">${items.map((w) => `<button class="acctrow" data-act="nwToggle" data-id="${w.id}" role="switch" aria-checked="${!!w.inNetWorth}"><b class="grow" style="text-align:left">${esc(w.name)}</b><span class="switch ${w.inNetWorth ? 'on' : ''}" aria-hidden="true"></span></button>`).join('')}</div>` : ''; }).join('')}
      </div></div>`,
    txMore: (sh) => {
      const isProj = sh.id.startsWith('proj:');
      const t = isProj ? null : S.transactions.find((x) => x.id === sh.id);
      const ruleId = isProj ? sh.id.slice(5).split('|')[0] : t && t.ruleId;
      const date = isProj ? sh.id.slice(5).split('|')[1] : t.date;
      const opts = isProj
        ? `<button class="btn" data-act="skipOne" data-id="${ruleId}" data-v="${date}">Skip this payment</button><button class="btn" data-act="editRule" data-id="${ruleId}">Edit recurring</button>`
        : ruleId
          ? `<button class="btn" data-act="editTx" data-id="${t.id}">Edit this payment</button>${S.rules.some((r) => r.id === ruleId) ? `<button class="btn" data-act="editRule" data-id="${ruleId}">Edit recurring</button>` : ''}`
          : `<button class="btn" data-act="makeRecurring" data-id="${t.id}">Set as recurring</button><button class="btn" data-act="editTx" data-id="${t.id}">Edit</button>`;
      const dup = !isProj && t && t.type !== 'adjustment' ? `<button class="btn" data-act="duplicate" data-id="${t.id}">Duplicate</button>` : '';
      return `<div class="scrim" data-act="closeSheet"><div class="sheet" role="dialog" aria-label="More" data-stop="1">
        <div class="between"><h3>More</h3><button class="iconbtn" style="background:transparent" data-act="closeSheet" aria-label="Close">${svg('close')}</button></div>${opts}${dup}</div></div>`;
    },
    confirm: (sh) => `<div class="scrim" data-act="closeSheet"><div class="sheet" role="alertdialog" aria-label="Confirm" data-stop="1">
        <h3>${esc(sh.message)}</h3>
        <div class="row"><button class="btn grow" data-act="closeSheet">No</button><button class="btn danger grow" data-act="confirmYes">${esc(sh.yesLabel)}</button></div>
      </div></div>`,
    cats: () => {
      const f = ui.form;
      const list = S.categories.filter((c) => c.type === f.type && !c.parent);
      return `<div class="scrim" data-act="closeSheet"><div class="sheet" role="dialog" aria-label="Select category" data-stop="1">
        <div class="between"><h3>Select Category</h3><button class="iconbtn" style="background:transparent" data-act="closeSheet" aria-label="Close">${svg('close')}</button></div>
        <div class="grid4">${list.map((c) => `<button class="cattile ${c.id === f.catId ? 'on' : ''}" data-act="cat" data-v="${c.id}"><span class="t" style="background:${c.color}">${svg(c.icon, 28, '#fff')}</span>${esc(c.name)}</button>`).join('')}
        <button class="cattile" data-act="open" data-v="categories"><span class="t" style="background:#5E5A62">${svg('plus', 28, '#fff')}</span>Add</button></div>
      </div></div>`;
    },
    accts: (sh) => {
      const f = ui.form;
      return `<div class="scrim" data-act="closeSheet"><div class="sheet" role="dialog" aria-label="Select account" data-stop="1">
        <div class="between"><h3>Select Account</h3><button class="iconbtn" style="background:transparent" data-act="closeSheet" aria-label="Close">${svg('close')}</button></div>
        ${['bank', 'savings', 'credit', 'loan'].map((t) => { const items = S.wallets.filter((w) => w.type === t); return items.length ? `<div class="acctgroup" style="border-color:${TYPE_COLOR[t]}">${items.map((w) => `<button class="acctrow" data-act="walletPick" data-f="${sh.field}" data-v="${esc(w.name)}"><span class="ring" style="border-color:${TYPE_COLOR[t]};background:${f[sh.field] === w.name ? TYPE_COLOR[t] : 'transparent'}"></span><b>${esc(w.name)}</b></button>`).join('')}</div>` : ''; }).join('')}
      </div></div>`;
    },
    delRec: (sh) => {
      const r = S.rules.find((x) => x.id === sh.ruleId);
      const name = r ? (r.template.title || (cat(r.template.category) || {}).name || 'Recurring') : 'Recurring';
      return `<div class="scrim" data-act="closeSheet"><div class="sheet" role="dialog" aria-label="Delete recurring payment" data-stop="1">
        <div class="between"><h3>Delete ${esc(name)} · ${E.fmtShort(sh.date)}?</h3><button class="iconbtn" style="background:transparent" data-act="closeSheet" aria-label="Close">${svg('close')}</button></div>
        <p class="muted small" style="margin:0">This is a recurring payment. Earlier payments are never affected.</p>
        <button class="btn" data-act="delThis">Delete this payment only</button>
        <button class="btn danger" data-act="delFollowing">Delete this and all following</button>
      </div></div>`;
    },
    occ: (sh) => {
      const r = S.rules.find((x) => x.id === sh.ruleId);
      const name = r.template.title || (cat(r.template.category) || {}).name || 'Recurring';
      // an upcoming payment skips from its own date; a posted one skips from the next payment due
      const skipStart = sh.txId ? (E.occurrences(r, E.addDays(sh.date > TODAY ? sh.date : TODAY, 1), E.addDays(TODAY, 4000), E.ctxOf(S))[0] || null) : sh.date;
      if (sh.step === 'skip') {
        return `<div class="scrim" data-act="closeSheet"><div class="sheet" role="dialog" aria-label="Skip payments" data-stop="1">
        <div class="between"><div style="display:flex;flex-direction:column;gap:2px"><h3 style="margin:0">Skip ${esc(name)}</h3><span class="muted small">Starting ${E.fmtDay(skipStart)}, ${skipStart.slice(0, 4)}</span></div><button class="iconbtn" style="background:transparent" data-act="closeSheet" aria-label="Close">${svg('close')}</button></div>
        <label class="field" style="background:var(--card2)"><span class="lbl">Skip</span><input id="skipCount" type="number" min="1" inputmode="numeric" value="1" style="width:70px"><span class="muted">payment(s)</span></label>
        <p class="muted small" style="margin:0">Skips this payment and the next ones in a row. Undo any time from More → Subscriptions.</p>
        <div class="row"><button class="btn grow" data-act="occBack">Back</button><button class="btn primary grow" data-act="skipFrom" data-id="${r.id}" data-v="${skipStart}">Skip</button></div>
      </div></div>`;
      }
      return `<div class="scrim" data-act="closeSheet"><div class="sheet" role="dialog" aria-label="Upcoming payment" data-stop="1">
        <div class="row" style="gap:10px;align-items:center">
          <button class="iconbtn" data-act="editRule" data-id="${r.id}" aria-label="Edit recurring">${svg('pencil', 20)}</button>
          <div class="grow" style="display:flex;flex-direction:column;gap:2px;min-width:0"><h3 style="margin:0">${esc(name)}</h3><span class="muted small">${E.fmtDay(sh.date)}, ${sh.date.slice(0, 4)}</span></div>
          <button class="iconbtn" style="background:transparent" data-act="closeSheet" aria-label="Close">${svg('close')}</button>
        </div>
        ${sh.txId ? `<button class="btn" data-act="editTx" data-id="${sh.txId}">Edit this payment</button><button class="btn" data-act="duplicate" data-id="${sh.txId}">Duplicate</button>` : ''}
        ${skipStart ? `<button class="btn" data-act="occSkip">Skip recurring payment</button>` : ''}
        <button class="btn danger" data-act="occDeleteAll" data-id="${r.id}" data-v="${sh.date}">Delete all</button>
      </div></div>`;
    },
    ruleMenu: (sh) => {
      const r = S.rules.find((x) => x.id === sh.ruleId);
      const next = nextOcc(r);
      return `<div class="scrim" data-act="closeSheet"><div class="sheet" role="dialog" aria-label="Recurring options" data-stop="1">
        <div class="between"><h3>${esc(r.template.title || (cat(r.template.category) || {}).name || 'Recurring')}</h3><button class="iconbtn" style="background:transparent" data-act="closeSheet" aria-label="Close">${svg('close')}</button></div>
        ${next ? `<div class="row"><span class="grow" style="font-weight:700">Skip the next</span><input id="skipN" type="number" min="1" value="1" class="field" style="width:80px;min-height:44px"><button class="btn" data-act="skipN" data-id="${r.id}">Skip</button></div>` : ''}
        <button class="btn" data-act="editRule" data-id="${r.id}">Edit</button>
        <button class="btn" data-act="pauseRule" data-id="${r.id}">${r.active === false ? 'Resume' : 'Pause'}</button>
        ${S.skips.some((s) => s.ruleId === r.id && s.date >= TODAY) ? `<button class="btn" data-act="unskip" data-id="${r.id}">Undo upcoming skips</button>` : ''}
      </div></div>`;
    }
  };

  // ---------- events ----------
  const setPath = (obj, path, v) => { const ks = path.split('.'); let o = obj; ks.slice(0, -1).forEach((k) => { o = o[k]; }); o[ks[ks.length - 1]] = v; };
  document.addEventListener('input', (e) => {
    const el = e.target;
    clearTimeout(saveNav.t); saveNav.t = setTimeout(saveNav, 300);
    if (el.dataset.accent) { document.documentElement.style.setProperty('--pink', el.value); return; }
    if (el.dataset.bind && ui.form) { setPath(ui.form, el.dataset.bind, el.value); if (el.dataset.rerender) render(); }
    const top = ui.stack[ui.stack.length - 1];
    if (el.dataset.wbind && top) { const [a, b] = el.dataset.wbind.split('.'); if (b) { top.wallet[a] = { ...(top.wallet[a] || {}), [b]: el.value }; } else top.wallet[a] = el.value; if (el.dataset.rerender && el.tagName !== 'INPUT') render(); }
    if (el.dataset.cbind && top) top.cat[el.dataset.cbind] = el.value;
    if (el.dataset.ybind && top) top[el.dataset.ybind] = el.value;
    if (el.dataset.xbind && top) top[el.dataset.xbind] = el.value;
    if (el.dataset.qbind && top) { top.q = el.value; const pos = el.selectionStart; render(); const b = document.getElementById('searchbox'); if (b) { b.focus(); try { b.setSelectionRange(pos, pos); } catch (e) { /* type=search */ } } }
    if (el.dataset.bv && top && top.d) { top.d.vals[el.dataset.bv] = el.value; top.d.dirty = true; budgetRefresh(top); }
    if (el.dataset.sbind && top && top.sc) { const k = el.dataset.sbind; top.sc[k] = (k === 'day1' || k === 'day2') ? Number(el.value) : el.value; if (el.dataset.rerender) render(); }
  });
  document.addEventListener('change', async (e) => {
    if (e.target.dataset.homeyear) { ui.homeYear = e.target.value; render(); return; }
    if (e.target.dataset.accent) { S.settings.theme = { ...th(), accent: 'custom', accentCustom: e.target.value }; applyTheme(); render(); await save('settings'); return; } if (e.target.dataset.rerender) render(); });
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    if (el.dataset.act === 'closeSheet' && e.target.closest('[data-stop]') && !e.target.closest('button[data-act="closeSheet"]')) return;
    const a = el.dataset.act, v = el.dataset.v, id = el.dataset.id;
    const top = ui.stack[ui.stack.length - 1];
    const f = ui.form;
    switch (a) {
      case 'tab': ui.tab = v; ui.stack = []; ui.recenter = true; render(); window.scrollTo(0, 0); break;
      case 'month': ui.month = v; render(); break;
      case 'sumView': S.settings.summaryView = v; render(); save('settings'); break;
      case 'editBudgets': push({ name: 'budgets', month: v }); break;
      case 'sumPeriod': ui.sumPeriod = v === 'all' ? null : Number(v); ui.sheet = null; render(); break;
      case 'perPick': ui.sheet = { name: 'perPick' }; render(); break;
      case 'acctOpen': push({ name: 'acct', id }); break;
      case 'acctMore': top.more = true; render(); break;
      case 'addFor': { const w = S.wallets.find((x) => x.id === id); ui.form = newForm({}); ui.form.wallet = w.name; if (w.type === 'savings') ui.form.type = 'income'; push({ name: 'add' }); break; }
      case 'correctOpen': ui.sheet = { name: 'correct', id, date: v || TODAY }; render(); break;
      case 'correctSave': {
        const w = S.wallets.find((x) => x.id === id), date = v;
        const raw = document.getElementById('realbal').value.replace(/[$,\s]/g, '');
        const real = parseFloat(raw);
        if (raw === '' || isNaN(real)) { document.getElementById('cbwarn').textContent = 'Type the real balance.'; break; }
        if (isLocked(date)) { document.getElementById('cbwarn').textContent = lockMsg(date); break; }
        // Before the account's start date there is nothing to correct yet: set its starting balance instead.
        if (w.openingDate && date <= w.openingDate) {
          const hadBefore = S.transactions.some((t) => t.type === 'adjustment' && t.wallet === w.name && t.date < w.openingDate && !t.deleted);
          if (hadBefore) { S.transactions.forEach((t) => { if (t.type === 'adjustment' && t.wallet === w.name && t.date < w.openingDate) { t.deleted = true; t.updatedAt = new Date().toISOString(); } }); await save('transactions'); }
          w.opening = Math.round(real * 100) / 100;
          ui.sheet = null; await save('wallets'); toast(`Starting balance set for ${E.fmtShort(w.openingDate)}`); render(); break;
        }
        const cur = E.balances(S, date)[w.name] || 0;
        const owed = w.type === 'credit' || w.type === 'loan';
        const delta = Math.round((owed ? cur - real : real - cur) * 100) / 100;
        ui.sheet = null;
        if (Math.abs(delta) < 0.005) { toast('Already matches'); render(); break; }
        const now = new Date().toISOString();
        S.transactions.push({ id: DB.uid(), date, type: 'adjustment', category: null, sub: null, title: 'Balance correction', note: `${money(cur)} → ${money(real)}`, amount: delta, wallet: w.name, toWallet: null, ruleId: null, counts: 'entry', createdAt: now, updatedAt: now });
        await save('transactions'); toast('Balance corrected'); render(); break;
      }
      case 'payOpen': ui.sheet = { name: 'pay', id }; render(); break;
      case 'paySave': {
        const w = S.wallets.find((x) => x.id === id);
        const amt = Math.round(parseFloat(document.getElementById('payamt').value.replace(/[$,\s]/g, '')) * 100) / 100;
        if (!(amt > 0)) { document.getElementById('paywarn').textContent = 'Enter an amount above $0.'; break; }
        if (isLocked(TODAY)) { document.getElementById('paywarn').textContent = lockMsg(TODAY); break; }
        const now = new Date().toISOString();
        S.transactions.push({ id: DB.uid(), date: TODAY, type: 'transfer', category: null, sub: null, title: `Pay ${shortName(w.name)}`, note: '', amount: amt, wallet: document.getElementById('payfrom').value, toWallet: w.name, ruleId: null, counts: 'entry', createdAt: now, updatedAt: now });
        ui.sheet = null; await save('transactions'); toast('Payment saved'); render(); break;
      }
      case 'closeMonth': top.month = v; render(); break;
      case 'closeIt': ask(`Close ${monthLabel(v)}? You can reopen it later.`, 'Close', async () => { S.settings.closed = [...new Set(closedKeys().concat(v))].sort(); await save('settings'); toast(`${monthLabel(v)} closed`); }); break;
      case 'reopenMonth': S.settings.closed = closedKeys().filter((k) => k !== v); await save('settings'); toast(`${monthLabel(v)} reopened`); render(); break;
      case 'calMonth': top.month = v; top.day = null; render(); break;
      case 'calDay': top.day = top.day === v ? null : v; render(); break;
      case 'search': push({ name: 'search', q: '' }); setTimeout(() => { const b = document.getElementById('searchbox'); if (b) b.focus(); }, 50); break;
      case 'catTx': push({ name: 'search', q: '', catId: id, month: ui.month, range: el.dataset.r ? el.dataset.r.split('|') : null }); break;
      case 'syncSaveCfg': S.settings.sync = { ...(S.settings.sync || {}), url: (top.url || '').trim(), key: (top.key || '').trim() }; await DBH.save('settings'); toast('Connection saved'); render(); break;
      case 'syncNow': await syncNow(false); break;
      case 'restoreAsk': ask('Replace everything on this phone with your Sheet?', 'Restore', async () => {
        try {
          const j = await callScript({ action: 'restore' });
          const tbl = j.tables || {};
          if (!tbl.wallets || !tbl.categories) throw new Error('The Sheet has no backup yet');
          const NUM = ['amount', 'opening', 'room', 'dueDay', 'every', 'pct', 'limit'];
          Object.keys(tbl).forEach((t) => { if (Array.isArray(tbl[t])) tbl[t].forEach((r) => NUM.forEach((k) => { if (r[k] != null && r[k] !== '') r[k] = Number(r[k]); })); });
          SYNC_TABLES.forEach((t) => { if (!tbl[t]) return; if (t === 'settings') { const { id: _x, ...st } = tbl.settings[0] || {}; S.settings = { ...st, sync: S.settings.sync }; S.schedule = S.settings.schedule; } else S[t] = tbl[t]; });
          await DBH.saveAll(); setDirty([]); toast('Restored from Sheet');
        } catch (err) { toast('Restore failed: ' + (err.message || err)); }
      }); break;
      case 'exportTx': exportCsv('transactions', top.from, top.to); toast('Downloading'); break;
      case 'exportTable': exportCsv(v); toast('Downloading'); break;
      case 'subsFilter': top.filter = v; render(); break;
      case 'sortMode': { const st = { ...(S.settings.sort || {}) }; st[top.kind] = v; S.settings.sort = st; if (v !== 'custom' && top.kind !== 'rules') { applySort(top.kind, v); await save(top.kind); }
        if (top.kind === 'rules' && v !== 'custom' && v !== 'date') { S.rules.sort((a, b) => ruleName(a).localeCompare(ruleName(b), 'en', { sensitivity: 'base' }) * (v === 'za' ? -1 : 1)); await save('rules'); }
        if (top.kind === 'rules' && v === 'date') { S.rules.sort((a, b) => (nextOcc(a) || '9999').localeCompare(nextOcc(b) || '9999')); await save('rules'); } await save('settings'); render(); break; }
      case 'presetSave': {
        const amount = Math.round(parseFloat(String(f.amount).replace(/[$,\s]/g, '')) * 100) / 100;
        if (!(amount > 0)) { document.getElementById('formwarn').textContent = 'Enter an amount first.'; break; }
        const c = cat(f.subId) || cat(f.catId);
        const pr = { id: DB.uid(), name: f.title.trim() || (f.type === 'transfer' ? 'Transfer' : c ? c.name : 'Preset'), tmpl: { type: f.type, category: f.type === 'transfer' ? null : f.catId, sub: f.type === 'transfer' ? null : (f.subId || null), title: f.title.trim(), amount, wallet: f.wallet, toWallet: f.type === 'transfer' ? f.toWallet : null, tags: f.tags || '' } };
        S.settings.presets = (S.settings.presets || []).concat(pr); await save('settings'); toast(`Saved preset “${pr.name}”`); render(); break;
      }
      case 'presetUse': { const pr = (S.settings.presets || []).find((x) => x.id === id); if (!pr) break; const t = pr.tmpl; Object.assign(f, { type: t.type, catId: t.category || f.catId, subId: t.sub || null, title: t.title || '', amount: String(t.amount), wallet: t.wallet || f.wallet, toWallet: t.toWallet || f.toWallet, tags: t.tags || '' }); render(); break; }
      case 'presetManage': ui.sheet = { name: 'presets' }; render(); break;
      case 'presetDel': S.settings.presets = (S.settings.presets || []).filter((x) => x.id !== id); await save('settings'); if (!S.settings.presets.length) ui.sheet = null; render(); break;
      case 'walletPickSum': ui.sheet = { name: 'sumWallet' }; render(); break;
      case 'sumWalletSet': ui.sumWallet = v || null; ui.sheet = null; render(); break;
      case 'undo': { const fn = undoFn; undoFn = null; ui.toast = null; if (fn) await fn(); break; }
      case 'duplicate': { const t = S.transactions.find((x) => x.id === id); if (!t) break; ui.sheet = null; ui.form = newForm({ edit: t }); Object.assign(ui.form, { editId: null, ruleId: null, mode: 'default', date: TODAY }); if (top && top.name === 'add') render(); else push({ name: 'add' }); toast('Copied with today’s date'); break; }
      case 'addRecurring': ui.form = newForm({}); ui.form.mode = 'recurring'; push({ name: 'add' }); break;
      case 'homeYear': ui.homeYear = v; render(); break;
      case 'delRecOpen': ui.sheet = { name: 'delRec', ruleId: id, date: v }; render(); break;
      case 'delThis': case 'delFollowing': {
        await delRecAction(a === 'delThis'); break;
      }
      case 'toggleUp': ui.upOpen = !ui.upOpen; render(); break;
      case 'nwPick': ui.sheet = { name: 'nwPick' }; render(); break;
      case 'nwToggle': { const w = S.wallets.find((x) => x.id === id); w.inNetWorth = !w.inNetWorth; await save('wallets'); render(); break; }
      case 'togglePays': ui.paysOpen = !ui.paysOpen; render(); break;
      case 'toggleFuture': ui.futureOpen = !ui.futureOpen; render(); break;
      case 'add': openForm({}); break;
      case 'back': goBack(); break;
      case 'edit': { const adj = S.transactions.find((x) => x.id === id); if (adj && adj.type === 'adjustment') { if (isLocked(adj.date)) { toast(lockMsg(adj.date)); break; } ask(`Delete this balance correction (${adj.note || money(adj.amount)})?`, 'Delete', async () => { adj.deleted = true; adj.updatedAt = new Date().toISOString(); await save('transactions'); toast('Deleted', async () => { adj.deleted = false; await save('transactions'); toast('Restored'); }); }); break; } }
      case 'editX': { const t = S.transactions.find((x) => x.id === id); if (t && t.ruleId) { const r = S.rules.find((x) => x.id === t.ruleId); if (r) { openForm({ edit: t }); break; } } if (t) openForm({ edit: t }); break; }
      case 'occ': { const [rid, date] = id.slice(5).split('|'); ui.sheet = { name: 'occ', ruleId: rid, date }; render(); break; }
      case 'type': { f.type = v; if (v !== 'transfer') { const c = cat(f.catId); if (!c || c.type !== v) { const first = S.categories.find((x) => x.type === v && !x.parent); f.catId = first && first.id; f.subId = null; } } render(); break; }
      case 'pickcat': ui.sheet = { name: 'cats' }; render(); break;
      case 'cat': f.catId = v; f.subId = null; ui.sheet = null; render(); break;
      case 'sub': f.subId = v || null; render(); break;
      case 'mode': f.mode = v; render(); break;
      case 'wallet': f[el.dataset.f] = v; render(); break;
      case 'acctlist': ui.sheet = { name: 'accts', field: el.dataset.f }; render(); break;
      case 'walletPick': f[el.dataset.f] = v; ui.sheet = null; render(); break;
      case 'closeSheet': ui.sheet = null; render(); break;
      case 'save': await saveForm(); break;
      case 'delete': {
        if (f.editId && !f.ruleId) { const t = S.transactions.find((x) => x.id === f.editId); if (t && t.ruleId && S.rules.some((r) => r.id === t.ruleId)) { if (isLocked(t.date)) { toast(lockMsg(t.date)); break; } ui.sheet = { name: 'delRec', ruleId: t.ruleId, date: t.date, txId: t.id, fromForm: true }; render(); break; } }
        ask(f.ruleId ? 'Delete recurring transaction? Payments already made stay.' : 'Delete transaction?', 'Yes', deleteForm); break;
      }
      case 'txDelete': {
        if (id.startsWith('proj:')) { const [rid, date] = id.slice(5).split('|'); if (S.rules.some((r) => r.id === rid)) { ui.sheet = { name: 'delRec', ruleId: rid, date }; render(); break; } ask('Delete this upcoming payment? The recurring transaction stays.', 'Yes', async () => { S.skips.push({ ruleId: rid, date }); await save('skips'); toast('Deleted', async () => { S.skips = S.skips.filter((k) => !(k.ruleId === rid && k.date === date)); await save('skips'); toast('Restored'); }); }); break; }
        { const lt = S.transactions.find((x) => x.id === id); if (lt && isLocked(lt.date)) { toast(lockMsg(lt.date)); break; } }
        { const rt = S.transactions.find((x) => x.id === id); if (rt && rt.ruleId && S.rules.some((r) => r.id === rt.ruleId)) { ui.sheet = { name: 'delRec', ruleId: rt.ruleId, date: rt.date, txId: rt.id }; render(); break; } }
        ask('Delete transaction?', 'Yes', async () => { const t = S.transactions.find((x) => x.id === id); t.deleted = true; t.updatedAt = new Date().toISOString(); await save('transactions'); toast('Deleted', async () => { t.deleted = false; t.updatedAt = new Date().toISOString(); await save('transactions'); toast('Restored'); }); });
        break;
      }
      case 'txMore': {
        // recurring payments (upcoming or already posted) get the recurring menu; one-off transactions keep the simple menu
        if (id.startsWith('proj:')) { const [rid, date] = id.slice(5).split('|'); if (S.rules.some((r) => r.id === rid)) { ui.sheet = { name: 'occ', ruleId: rid, date }; render(); break; } }
        else { const t = S.transactions.find((x) => x.id === id); if (t && t.ruleId && S.rules.some((r) => r.id === t.ruleId)) { ui.sheet = { name: 'occ', ruleId: t.ruleId, date: t.date, txId: t.id }; render(); break; } }
        ui.sheet = { name: 'txMore', id }; render(); break;
      }
      case 'makeRecurring': { const t = S.transactions.find((x) => x.id === id); ui.sheet = null; ui.form = newForm({ edit: t }); ui.form.mode = 'recurring'; push({ name: 'add' }); break; }
      case 'editTx': { const t = S.transactions.find((x) => x.id === id); ui.sheet = null; openForm({ edit: t }); break; }
      case 'confirmYes': { const fn = ui.sheet && ui.sheet.onYes; ui.sheet = null; if (fn) await fn(); render(); break; }
      case 'open': ui.sheet = null; push(el.dataset.k ? { name: v, kind: el.dataset.k } : { name: v }); break;
      // recurring actions
      case 'unskipAsk': { const [rid, date] = id.slice(5).split('|'); ui.sheet = { name: 'unskip', ruleId: rid, date }; render(); break; }
      case 'unskipOne': { S.skips = S.skips.filter((k) => !(k.ruleId === id && k.date === v)); await save('skips'); ui.sheet = null; toast('Payment restored', async () => { S.skips.push({ ruleId: id, date: v }); await save('skips'); toast('Skipped again'); }); break; }
      case 'occSkip': ui.sheet = { ...ui.sheet, step: 'skip' }; render(); setTimeout(() => { const i = document.getElementById('skipCount'); if (i) i.select(); }, 30); break;
      case 'occBack': ui.sheet = { ...ui.sheet, step: null }; render(); break;
      case 'skipFrom': {
        const n = Math.max(1, Math.floor(Number(document.getElementById('skipCount').value) || 1));
        const r = S.rules.find((x) => x.id === id);
        const dates = E.occurrences(r, v, E.addDays(v, 4000), E.ctxOf(S)).filter((d) => d >= v).slice(0, n);
        dates.forEach((d) => S.skips.push({ ruleId: id, date: d }));
        await save('skips'); ui.sheet = null;
        toast(`Skipped ${dates.length} payment${dates.length === 1 ? '' : 's'}`, async () => { S.skips = S.skips.filter((k) => !(k.ruleId === id && dates.includes(k.date))); await save('skips'); toast('Restored'); });
        break;
      }
      case 'occDeleteAll': ui.sheet = { name: 'delRec', ruleId: id, date: v }; await delRecAction(false); break;
      case 'skipOne': S.skips.push({ ruleId: id, date: v }); await save('skips'); ui.sheet = null; toast('Skipped'); break;
      case 'skipN': {
        const n = Math.max(1, Number(document.getElementById('skipN').value) || 1);
        const r = S.rules.find((x) => x.id === id);
        E.occurrences(r, TODAY, E.addDays(TODAY, 1500), E.ctxOf(S)).slice(0, n).forEach((d) => S.skips.push({ ruleId: id, date: d }));
        await save('skips'); ui.sheet = null; toast(`Skipped ${n}`); break;
      }
      case 'unskip': S.skips = S.skips.filter((s) => !(s.ruleId === id && s.date >= TODAY)); await save('skips'); ui.sheet = null; toast('Skips removed'); break;
      case 'editRule': { const r = S.rules.find((x) => x.id === id); ui.sheet = null; openForm({ rule: r }); break; }
      case 'pauseRule': { const r = S.rules.find((x) => x.id === id); r.active = r.active === false; await save('rules'); ui.sheet = null; toast(r.active ? 'Resumed' : 'Paused'); break; }
      case 'ruleMenu': ui.sheet = { name: 'ruleMenu', ruleId: id }; render(); break;
      // wallets
      case 'walletNew': push({ name: 'wallet', isNew: true, wallet: { id: DB.uid(), name: '', type: 'bank', opening: 0, openingDate: S.settings.startDate, inNetWorth: false, dueDay: null } }); break;
      case 'walletEdit': { const w = S.wallets.find((x) => x.id === id); push({ name: 'wallet', isNew: false, wallet: { ...w }, oldName: w.name }); break; }
      case 'wtoggle': top.wallet[el.dataset.k] = !top.wallet[el.dataset.k]; render(); break;
      case 'walletSave': {
        const w = top.wallet; w.name = (w.name || '').trim();
        if (!w.name) { document.getElementById('wwarn').textContent = 'Give the account a name.'; break; }
        if (S.wallets.some((x) => x.name === w.name && x.id !== w.id)) { document.getElementById('wwarn').textContent = 'You already have an account with that name.'; break; }
        w.opening = Number(String(w.opening).replace(/[$,\s]/g, '')) || 0; w.room = w.room ? Number(w.room) : null; w.limit = (w.type === 'credit' || w.type === 'loan') && Number(String(w.limit || '').replace(/[$,\s]/g, '')) > 0 ? Number(String(w.limit).replace(/[$,\s]/g, '')) : null;
        if ((w.type === 'credit' || w.type === 'loan') && w.due && w.due.start) { w.due = { start: w.due.start, every: Math.max(1, Number(w.due.every) || 1), unit: w.due.unit || 'month' }; w.dueDay = null; } else if (w.type !== 'credit' && w.type !== 'loan') { w.due = null; w.dueDay = null; } else if (w.due && !w.due.start) w.due = null;
        const i = S.wallets.findIndex((x) => x.id === w.id);
        if (i >= 0) {
          if (top.oldName && top.oldName !== w.name) {
            S.transactions.forEach((t) => { if (t.wallet === top.oldName) t.wallet = w.name; if (t.toWallet === top.oldName) t.toWallet = w.name; });
            S.rules.forEach((r) => { if (r.template.wallet === top.oldName) r.template.wallet = w.name; if (r.template.toWallet === top.oldName) r.template.toWallet = w.name; });
            await save('transactions'); await save('rules');
          }
          S.wallets[i] = w;
        } else S.wallets.push(w);
        { const m = (S.settings.sort || {}).wallets; if (m === 'az' || m === 'za') applySort('wallets', m); }
        await save('wallets'); goBack(); toast('Saved'); break;
      }
      case 'walletDelete': {
        const w = top.wallet;
        if (S.transactions.some((t) => !t.deleted && (t.wallet === top.oldName || t.toWallet === top.oldName)) || S.rules.some((r) => r.template.wallet === top.oldName || r.template.toWallet === top.oldName)) { document.getElementById('wwarn').textContent = 'This account has transactions, so it can’t be deleted.'; break; }
        ask('Delete this account?', 'Delete', async () => { S.wallets = S.wallets.filter((x) => x.id !== w.id); S.budgets = S.budgets.filter((b) => b.id !== 'wallet:' + w.id); await save('wallets'); await save('budgets'); goBack(); toast('Deleted'); }); break;
      }
      // budgets
      case 'budgetRepeat': top.d.rep[id] = !top.d.rep[id]; top.d.dirty = true; render(); break;
      case 'budgetMonth': {
        if (v === top.month) break;
        const go = () => { top.month = v; const basis = top.d.basis; top.d = { basis, open: top.d.open, dirty: false, ...loadBudgetVals(v, basis) }; render(); };
        if (top.d.dirty) ask('Discard unsaved budget changes?', 'Discard', async () => go()); else go();
        break;
      }
      case 'budgetCopy': {
        const c = loadBudgetVals(E.shiftKey(top.month, -1), top.d.basis);
        top.d.vals = c.vals; top.d.rep = c.rep; top.d.dirty = true; render(); toast('Copied — tap Save to keep'); break;
      }
      case 'budgetToggle': top.d.open[id] = !top.d.open[id]; render(); break;
      case 'budgetBasis': {
        const d = top.d; if (d.basis === v) break;
        const k = budgetCalc(d);
        S.categories.filter((c) => c.type === 'expense').forEach((c) => {
          if (!bnum(d.vals[c.id])) return;
          d.vals[c.id] = v === 'pct' ? String(Math.round(k.pct[c.id] * 10) / 10) : (k.amt[c.id] ? String(k.amt[c.id]) : '');
        });
        d.basis = v; render(); break;
      }
      case 'budgetSave': {
        const d = top.d, k = budgetCalc(d);
        const problems = [];
        const parents = S.categories.filter((c) => c.type === 'expense' && !c.parent);
        const anyCat = S.categories.some((c) => c.type === 'expense' && bnum(d.vals[c.id]));
        if (d.basis === 'pct' && anyCat && !k.overall) problems.push('Set an overall spend budget to budget by %.');
        if (k.overall && k.unAmt < -0.004) problems.push(`Categories add up to ${money(k.overall - k.unAmt)}, more than overall spend of ${money(k.overall)}.`);
        parents.forEach((p) => {
          const subs = S.categories.filter((s) => s.parent === p.id && bnum(d.vals[s.id]));
          if (!subs.length) return;
          if (!bnum(d.vals[p.id])) problems.push(`${p.name}: set a budget on ${p.name} before its subcategories.`);
          else if (k.left(p.id).amt < -0.004) problems.push(`${p.name}: subcategories add up to more than ${p.name}.`);
        });
        if (problems.length) { document.getElementById('bwarn').innerHTML = problems.map(esc).join('<br>'); break; }
        const mk = top.month, out = {};
        if (k.overall) out.overall = { amount: r2(k.overall) };
        S.categories.forEach((c) => {
          if (c.type === 'expense') { if (k.amt[c.id]) out[c.id] = { amount: k.amt[c.id], pct: d.basis === 'pct' ? bnum(d.vals[c.id]) : null }; }
          else if (bnum(d.vals[c.id])) out[c.id] = { amount: r2(bnum(d.vals[c.id])) };
        });
        S.wallets.filter((w) => w.type === 'savings').forEach((w) => { const n = bnum(d.vals['wallet:' + w.id]); if (n) out['wallet:' + w.id] = { amount: r2(n) }; });
        const others = S.budgets.filter((x) => x.month !== mk);
        const mine = [];
        budgetIds().forEach((bid) => {
          if (out[bid]) { mine.push({ id: bid, month: mk, pct: null, ...out[bid], repeat: !!d.rep[bid] }); return; }
          // cleared: if a repeating budget would flow into this month, stop it here
          const before = E.budgetFor(others, bid, mk);
          if (before) mine.push({ id: bid, month: mk, amount: 0, pct: null, repeat: false });
        });
        S.budgets = others.concat(mine);
        d.dirty = false;
        S.settings.budgetBasis = d.basis;
        document.getElementById('bwarn').textContent = '';
        await save('budgets'); await save('settings'); toast('Budgets saved'); break;
      }
      // categories
      case 'catEdit': { const c = cat(id); push({ name: 'cat', isNew: false, cat: { ...c } }); break; }
      case 'catNew': {
        const parent = el.dataset.parent ? cat(el.dataset.parent) : null;
        push({ name: 'cat', isNew: true, cat: { id: DB.uid(), name: '', icon: parent ? parent.icon : 'star', color: parent ? parent.color : COLOR_CHOICES[0], type: parent ? parent.type : (el.dataset.type || 'expense'), parent: parent ? parent.id : null } });
        break;
      }
      case 'catToggle': top.open[id] = !top.open[id]; render(); break;
      case 'catType': top.cat.type = v; top.cat.parent = null; render(); break;
      case 'catParent': { const pc = v ? cat(v) : null; top.cat.parent = pc ? pc.id : null; if (pc && !top.cat.name) { top.cat.color = pc.color; top.cat.icon = pc.icon; } render(); break; }
      case 'catColor': top.cat.color = v; render(); break;
      case 'catIcon': top.cat.icon = v; render(); break;
      case 'iconsToggle': top.iconsOpen = !top.iconsOpen; render(); break;
      case 'coloursToggle': top.coloursOpen = !top.coloursOpen; render(); break;
      case 'catSave': {
        const c = top.cat; c.name = (c.name || '').trim();
        if (!c.name) { document.getElementById('cwarn').textContent = 'Give it a name.'; break; }
        const i = S.categories.findIndex((x) => x.id === c.id);
        if (i >= 0) S.categories[i] = c; else S.categories.push(c);
        { const m = (S.settings.sort || {}).categories; if (m === 'az' || m === 'za') applySort('categories', m); }
        if (!COLOR_CHOICES.some((x) => x.toLowerCase() === c.color.toLowerCase())) { const cc = (S.settings.customColors || []).filter((x) => x.toLowerCase() !== c.color.toLowerCase()); S.settings.customColors = [c.color].concat(cc).slice(0, 12); await save('settings'); }
        await save('categories'); goBack(); toast('Saved'); break;
      }
      case 'catDelete': {
        const c = top.cat;
        const nTx = S.transactions.filter((t) => !t.deleted && (t.category === c.id || t.sub === c.id)).length + S.rules.filter((r) => r.template.category === c.id || r.template.sub === c.id).length;
        const nSub = S.categories.filter((s) => s.parent === c.id).length;
        if (nSub) { document.getElementById('cwarn').textContent = `Delete its ${nSub} subcategor${nSub === 1 ? 'y' : 'ies'} first.`; break; }
        if (nTx) { document.getElementById('cwarn').textContent = `${nTx} transaction${nTx === 1 ? ' uses' : 's use'} this category. Change ${nTx === 1 ? 'it' : 'them'} to another category first.`; break; }
        ask('Delete this category?', 'Delete', async () => { S.categories = S.categories.filter((x) => x.id !== c.id); S.budgets = S.budgets.filter((b) => b.id !== c.id); await save('categories'); await save('budgets'); goBack(); toast('Deleted'); }); break;
      }
      // settings
      case 'themeSet': { const k = el.dataset.k; const val = k === 'anim' ? v === '1' : v; S.settings.theme = { ...th(), [k]: val }; applyTheme(); render(); await save('settings'); break; }
      case 'scheduleSave': {
        const d = top.sc;
        const ns = { frequency: d.frequency, day1: Number(d.day1) || 30, day2: Number(d.day2) || 15, anchor: d.anchor || TODAY, effectiveFrom: d.effectiveFrom || TODAY };
        if (ns.effectiveFrom < S.settings.startDate) ns.effectiveFrom = S.settings.startDate;
        // keep schedules that started before this one; anything starting on or after it is replaced
        const kept = E.segments(S.schedule).filter((x) => (x.effectiveFrom || '0000-00-00') < ns.effectiveFrom).map(({ history, ...x }) => x);
        S.schedule = { ...ns, history: kept };
        S.settings.schedule = S.schedule; await save('settings');
        top.sc = null;
        ui.month = clampMonth(E.monthKeyFor(S.schedule, TODAY, hs())); toast('Pay schedule saved'); render(); break;
      }
      case 'holDel': { const [d, n] = v.split('|'); S.holidays = S.holidays.filter((h) => !(h.date === d && h.name === n)); await save('holidays'); render(); break; }
      case 'holAdd': { const d = document.getElementById('holDate').value, n = document.getElementById('holName').value.trim() || 'Holiday'; if (d) { S.holidays.push({ date: d, name: n }); await save('holidays'); render(); } break; }
    }
  });


  // ---------- swipe rows (Gmail-style) ----------
  const OPEN = 128;
  let drag = null, suppressClick = false, openRow = null;
  const setX = (row, x, animate) => { const tx = row.querySelector('.tx'); tx.style.transition = animate ? 'transform .18s' : 'none'; tx.style.transform = x ? `translateX(${x}px)` : ''; row.dataset.x = x; };
  const closeOpen = () => { if (openRow && document.body.contains(openRow)) setX(openRow, 0, true); openRow = null; };
  document.addEventListener('pointerdown', (e) => {
    const row = e.target.closest('.swipe');
    if (e.target.closest('.acts')) return;
    if (openRow && openRow !== row) closeOpen();
    if (!row) return;
    drag = { row, x0: e.clientX, y0: e.clientY, base: Number(row.dataset.x || 0), moving: false };
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moving) { if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) drag.moving = true; else if (Math.abs(dy) > 10) { drag = null; return; } else return; }
    setX(drag.row, Math.max(-OPEN - 20, Math.min(OPEN + 20, drag.base + dx)), false);
  });
  const endDrag = () => {
    if (!drag) return;
    if (drag.moving) {
      const x = Number(drag.row.dataset.x || 0);
      const snap = x > OPEN / 2 ? OPEN : x < -OPEN / 2 ? -OPEN : 0;
      setX(drag.row, snap, true);
      openRow = snap ? drag.row : null;
      suppressClick = true; setTimeout(() => { suppressClick = false; }, 300);
    }
    drag = null;
  };
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);
  document.addEventListener('click', (e) => {
    if (suppressClick && e.target.closest('.swipe .tx')) { e.stopImmediatePropagation(); e.preventDefault(); return; }
    if (openRow && e.target.closest('.swipe .tx')) { closeOpen(); e.stopImmediatePropagation(); e.preventDefault(); }
  }, true);

  function clampMonth(key) {
    const first = E.monthKeyFor(S.schedule, S.settings.startDate, hs());
    return key < first ? first : key;
  }

  // ---------- start ----------
  const ACCENTS = [['Pink', '#EFA2B5', '#B8456E'], ['Lavender', '#C9B1F5', '#6B48B8'], ['Mint', '#8FD9C0', '#22795F'], ['Sky', '#8EC5F5', '#2F6FB8'], ['Peach', '#F5B98E', '#A85A22'], ['Lemon', '#EFD98A', '#7E6A10'], ['Coral', '#F59A92', '#B83A30'], ['Silver', '#C9C5CB', '#55505A']];
  const TH_DEFAULT = { mode: 'dark', accent: 'Pink', font: 'm', shape: 'rounded', layout: 'expanded', net: 'colourful', bars: 'simple', anim: true };
  const th = () => ({ ...TH_DEFAULT, ...(S.settings.theme || {}) });
  let sysQuery = null;
  function applyTheme() {
    const t = th(), root = document.documentElement;
    if (!sysQuery && window.matchMedia) { sysQuery = window.matchMedia('(prefers-color-scheme: light)'); sysQuery.addEventListener && sysQuery.addEventListener('change', () => { if (th().mode === 'system') { applyTheme(); render(); } }); }
    const mode = t.mode === 'system' ? (sysQuery && sysQuery.matches ? 'light' : 'dark') : t.mode === 'light' ? 'light' : 'dark';
    root.dataset.theme = mode;
    const acc = t.accent === 'custom' && t.accentCustom ? ['custom', t.accentCustom] : (ACCENTS.find((x) => x[0] === t.accent) || ACCENTS[0]);
    root.style.setProperty('--pink', acc[1]);
    root.dataset.shape = t.shape; root.dataset.net = t.net; root.dataset.layout = t.layout; root.dataset.bars = t.bars; root.dataset.anim = t.anim ? 'on' : 'off';
    const app = document.getElementById('app'); if (app) app.style.zoom = { s: 0.92, m: 1, l: 1.1 }[t.font] || 1;
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', mode === 'light' ? '#F7F3F5' : '#1F1E22');
  }
  async function start() {
    DBH = await DB.load();
    S = DBH.state;
    TODAY = todayStr();
    applyTheme();
    await postDue();
    ui.month = clampMonth(E.monthKeyFor(S.schedule, TODAY, hs()));
    history.replaceState({ d: 0 }, '');
    const addShortcut = new URLSearchParams(location.search).get('add') === '1';
    if (!addShortcut) restoreNav();
    render();
    if (addShortcut) { history.replaceState({ d: 0 }, '', location.pathname); openForm({}); }
    window.addEventListener('online', () => scheduleSync());
    if (dirty().length) scheduleSync();
  }
  start().catch((err) => { $app().innerHTML = `<section class="screen"><h1>Something went wrong</h1><p class="muted">${esc(err && err.message)}</p></section>`; });
})();
