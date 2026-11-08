/* Без меж — interactions. Prices: same routes and tariff table as Eurotour, minus 10 €. */
(function (w, d) {
  'use strict';
  d.documentElement.classList.add('js');
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BM = w.BM || { routes: [], country: {}, disc: { child: 15, pens: 10 }, rate: 51.4 };
  var MAX = 7;
  var MGR = { '380685609199': '068 560 91 99', '380976208330': '097 620 83 30' };

  /* ---------- helpers ---------- */
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function round50(n) { return Math.round(n / 50) * 50; }
  var rate = BM.rate;
  function toUah(eur) { return round50(eur * rate); }
  function hoursText(h) { var H = Math.floor(h), M = Math.round((h - H) * 60); if (M === 60) { H++; M = 0; } return M ? H + ' год ' + M + ' хв' : H + ' год'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plural(n, a, b, c) { var x = n % 10, y = n % 100; return x === 1 && y !== 11 ? a : (x >= 2 && x <= 4 && (y < 12 || y > 14) ? b : c); }
  function isoDate(dt) { var z = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); }
  var collator = w.Intl && Intl.Collator ? new Intl.Collator('uk') : null;
  function cmp(a, b) { return collator ? collator.compare(a, b) : (a < b ? -1 : a > b ? 1 : 0); }
  var toastT = null;
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('is-on'); }, 3200); }
  function bump(el) { if (!el || reduce) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

  /* smooth number change for prices */
  function tween(el, to, suffix) {
    var from = +(el.dataset.v || 0);
    el.dataset.v = to;
    if (reduce || !from || from === to) { el.textContent = fmt(to) + suffix; return; }
    var t0 = null, dur = 450;
    function step(ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(round50(from + (to - from) * e)) + suffix;
      if (k < 1 && +el.dataset.v === to) w.requestAnimationFrame(step);
      else if (+el.dataset.v === to) el.textContent = fmt(to) + suffix;
    }
    w.requestAnimationFrame(step);
  }

  /* ---------- route index ---------- */
  var ROUTES = BM.routes.map(function (r) { return { from: r[0], to: r[1], h: r[2], km: r[3], comfort: r[4], lux: r[5] }; });
  var byKey = {};
  ROUTES.forEach(function (r) { byKey[r.from + '|' + r.to] = r; });
  function route(a, b) { return byKey[a + '|' + b] || null; }
  var FROMS = Object.keys(ROUTES.reduce(function (o, r) { o[r.from] = 1; return o; }, {})).sort(cmp);
  function destsFrom(a) { return ROUTES.filter(function (r) { return r.from === a; }).map(function (r) { return r.to; }).sort(cmp); }
  var COUNTRY = { UA: 'Україна', MD: 'Молдова', PL: 'Польща', CZ: 'Чехія', SK: 'Словаччина', HU: 'Угорщина', AT: 'Австрія', RO: 'Румунія', DE: 'Німеччина', NL: 'Нідерланди', FR: 'Франція', IT: 'Італія', ES: 'Іспанія', PT: 'Португалія' };
  function minPrice(c) { return ROUTES.reduce(function (m, r) { return Math.min(m, r[c]); }, Infinity); }

  /* ---------- shared state ---------- */
  var S = { cls: 'comfort', from: 'Київ', to: 'Варшава', pax: 1, seats: { comfort: [], lux: [] } };
  if (!route(S.from, S.to) && ROUTES[0]) { S.from = ROUTES[0].from; S.to = ROUTES[0].to; }
  try { var saved = localStorage.getItem('bm_cls'); if (saved === 'lux' || saved === 'comfort') S.cls = saved; } catch (e) {}

  function fillSelect(sel, list, value) {
    sel.innerHTML = list.map(function (c) { return '<option' + (c === value ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
  }

  /* ---------- header ---------- */
  var top = $('#top'), nav = $('#nav'), burger = $('#burger');
  function onScroll() { top.classList.toggle('is-scrolled', w.scrollY > 8); }
  w.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function closeNav() { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', closeNav); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
  if ('IntersectionObserver' in w) {
    var links = {};
    $$('a', nav).forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var navIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        $$('a', nav).forEach(function (x) { x.classList.toggle('is-active', x === links[e.target.id]); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = d.getElementById(id); if (s) navIO.observe(s); });
  }

  /* ---------- finder ---------- */
  var fFrom = $('#f-from'), fTo = $('#f-to'), fDate = $('#f-date'), fPax = $('#f-pax');
  var tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  var todayIso = isoDate(new Date());
  fDate.min = todayIso; fDate.value = isoDate(tomorrow);
  function renderFinder() {
    fillSelect(fFrom, FROMS, S.from);
    var dests = destsFrom(S.from);
    if (dests.indexOf(S.to) < 0) S.to = dests[0];
    fillSelect(fTo, dests, S.to);
    fPax.textContent = S.pax;
    $$('[data-pax]').forEach(function (b) { b.disabled = +b.dataset.pax < 0 ? S.pax <= 1 : S.pax >= MAX; });
    var r = route(S.from, S.to);
    if (!r) { $('#f-uah').textContent = '—'; $('#f-eur').textContent = ''; $('#f-meta').textContent = '—'; return; }
    var eur = r[S.cls] * S.pax;
    tween($('#f-uah'), toUah(r[S.cls]) * S.pax, ' грн');
    $('#f-eur').textContent = '≈ €' + eur;
    $('#f-meta').textContent = '≈ ' + fmt(r.km) + ' км · ~' + hoursText(r.h) + ' · ' + (S.cls === 'lux' ? 'Lux' : 'Comfort') + (S.pax > 1 ? ' · ' + S.pax + ' ' + plural(S.pax, 'пасажир', 'пасажири', 'пасажирів') : '');
    $('#dock-price').textContent = 'від ' + fmt(toUah(r[S.cls])) + ' грн';
  }
  fFrom.addEventListener('change', function () { S.from = fFrom.value; renderFinder(); bump($('.finder__price strong')); });
  fTo.addEventListener('change', function () { S.to = fTo.value; renderFinder(); bump($('.finder__price strong')); });
  $('#f-swap').addEventListener('click', function () {
    var btn = this;
    if (!route(S.to, S.from)) { toast('Зворотного рейсу ' + S.to + ' – ' + S.from + ' немає в розкладі'); return; }
    var a = S.from; S.from = S.to; S.to = a;
    btn.classList.add('is-spin'); setTimeout(function () { btn.classList.remove('is-spin'); }, 450);
    renderFinder(); bump($('.finder__price strong'));
  });
  $$('[data-pax]').forEach(function (b) {
    b.addEventListener('click', function () { S.pax = Math.max(1, Math.min(MAX, S.pax + +b.dataset.pax)); renderFinder(); });
  });
  $('#finder').addEventListener('submit', function (e) { e.preventDefault(); openBooking({ from: S.from, to: S.to, date: fDate.value, adult: S.pax }); });

  /* ---------- class switching (shared everywhere) ---------- */
  var CLASS = {
    comfort: {
      title: 'Comfort', img: 'images/ivory-door-1200.webp', w: 924, h: 1065,
      lead: 'Світлий салон зі шкіряними кріслами, подушками під голову та шторками на вікнах.',
      feats: ['7 місць у салоні', 'Шкіряні крісла з підлокітниками', 'Подушка під голову', 'Шторки на вікнах', 'М\'яке підсвічування', 'Ремінь безпеки на кожному місці']
    },
    lux: {
      title: 'Lux', img: 'images/tiff-cabin-1200.webp', w: 960, h: 1280,
      lead: 'Крісла-реклайнери, що розкладаються повністю, з підставкою для ніг. Холодильник і світлова стеля.',
      feats: ['7 місць у салоні', 'Реклайнер розкладається повністю', 'Висувна підставка для ніг', 'Холодильник з напоями', 'Подушки й пледи', 'Світлова стеля']
    }
  };
  var ROWS = [[1, null, 2], [3, null, 4], [5, 6, 7]];
  function renderSeats() {
    var picked = S.seats[S.cls];
    $('#bus-rows').innerHTML = ROWS.map(function (r) {
      return '<div class="bus__row' + (r.length === 3 && r[1] !== null ? ' bus__row--back' : '') + '">' + r.map(function (n) {
        if (n === null) return '<span class="aisle"></span>';
        var on = picked.indexOf(n) >= 0;
        return '<button type="button" class="place" data-place="' + n + '" aria-pressed="' + on + '" aria-label="Місце ' + n + '">' + n + '</button>';
      }).join('') + '</div>';
    }).join('');
    var s = picked.slice().sort(function (a, b) { return a - b; });
    $('#seat-picked').innerHTML = s.length ? 'Обрано ' + s.length + ' ' + plural(s.length, 'місце', 'місця', 'місць') + ': <b>' + s.join(', ') + '</b>' : 'Можна обрати до 7 місць';
  }
  $('#bus-rows').addEventListener('click', function (e) {
    var b = e.target.closest('.place'); if (!b) return;
    var n = +b.dataset.place, list = S.seats[S.cls], i = list.indexOf(n);
    if (i >= 0) list.splice(i, 1); else list.push(n);
    if (list.length > S.pax) { S.pax = list.length; renderFinder(); }
    renderSeats();
  });
  function renderClass(animate) {
    var c = CLASS[S.cls], img = $('#class-img');
    $$('.tab[data-cls]').forEach(function (t) { var on = t.dataset.cls === S.cls; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', String(on)); });
    $$('input[name="cls"], input[name="rcls"], input[name="fcls"]').forEach(function (i) { i.checked = i.value === S.cls; });
    $('#class-title').textContent = c.title; $('#class-btn').textContent = c.title;
    $('#class-lead').textContent = c.lead;
    $('#class-from').textContent = fmt(toUah(minPrice(S.cls))) + ' грн';
    $('#class-feats').innerHTML = c.feats.map(function (f, i) { return '<li style="animation-delay:' + (i * 0.05) + 's"><svg class="ic" aria-hidden="true"><use href="#i-check"/></svg>' + esc(f) + '</li>'; }).join('');
    if (img.getAttribute('src') !== c.img) {
      if (animate && !reduce) {
        img.classList.add('is-swap');
        setTimeout(function () { img.src = c.img; img.alt = 'Салон класу ' + c.title; img.onload = function () { img.classList.remove('is-swap'); }; }, 250);
      } else { img.src = c.img; img.alt = 'Салон класу ' + c.title; }
    }
    renderSeats();
  }
  function setClass(c, animate) {
    c = c === 'lux' ? 'lux' : 'comfort';
    if (c === S.cls && !animate) return;
    S.cls = c;
    try { localStorage.setItem('bm_cls', c); } catch (e) {}
    renderClass(animate); renderFinder(); renderRoutes(false); updateTotal();
  }
  $$('.tab[data-cls]').forEach(function (t) { t.addEventListener('click', function () { setClass(t.dataset.cls, true); }); });
  d.addEventListener('change', function (e) {
    if (e.target.name === 'cls' || e.target.name === 'rcls' || e.target.name === 'fcls') { setClass(e.target.value, true); bump($('.finder__price strong')); }
  });

  /* ---------- routes catalogue ---------- */
  var rState = { q: '', country: 'all', shown: 12 };
  var grid = $('#rgrid'), chipsEl = $('#chips');
  function countryOf(r) { var a = BM.country[r.from], b = BM.country[r.to]; return a === 'UA' ? b : (b === 'UA' ? a : b); }
  (function buildChips() {
    var counts = {};
    ROUTES.forEach(function (r) { var c = countryOf(r); counts[c] = (counts[c] || 0) + 1; });
    var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || cmp(COUNTRY[a] || a, COUNTRY[b] || b); });
    chipsEl.innerHTML = '<button type="button" class="chip" data-c="all" aria-pressed="true">Усі ' + ROUTES.length + '</button>' +
      keys.map(function (k) { return '<button type="button" class="chip" data-c="' + k + '" aria-pressed="false">' + esc(COUNTRY[k] || k) + ' ' + counts[k] + '</button>'; }).join('');
  })();
  function filtered() {
    var q = rState.q.toLowerCase();
    return ROUTES.filter(function (r) {
      if (rState.country !== 'all' && countryOf(r) !== rState.country) return false;
      return !q || r.from.toLowerCase().indexOf(q) >= 0 || r.to.toLowerCase().indexOf(q) >= 0;
    });
  }
  function renderRoutes(resetAnim) {
    var list = filtered(), part = list.slice(0, rState.shown);
    grid.innerHTML = part.map(function (r, i) {
      var key = esc(r.from + '|' + r.to);
      return '<button type="button" class="rcard" data-route="' + key + '"' + (resetAnim ? ' style="animation-delay:' + Math.min(i, 11) * 0.03 + 's"' : ' style="animation:none"') + ' aria-label="' + esc(r.from + ' – ' + r.to + ', ' + fmt(toUah(r[S.cls])) + ' грн') + '">' +
        '<span class="rcard__line">' + esc(r.from) + '<i aria-hidden="true"></i>' + esc(r.to) + '</span>' +
        '<span class="rcard__meta"><span><svg class="ic" aria-hidden="true"><use href="#i-clock"/></svg>~' + hoursText(r.h) + '</span><span>' + fmt(r.km) + ' км</span></span>' +
        '<span class="rcard__foot"><span class="rcard__price">' + fmt(toUah(r[S.cls])) + ' грн <small>≈ €' + r[S.cls] + '</small></span><span class="rcard__cta">Обрати</span></span>' +
      '</button>';
    }).join('');
    $('#r-count').textContent = list.length ? 'Знайдено ' + list.length + ' ' + plural(list.length, 'напрямок', 'напрямки', 'напрямків') + ' · клас ' + (S.cls === 'lux' ? 'Lux' : 'Comfort') : '';
    $('#r-empty').hidden = list.length > 0;
    var more = $('#r-more');
    more.parentNode.hidden = list.length <= rState.shown;
    more.textContent = 'Показати ще ' + Math.min(12, list.length - rState.shown);
  }
  chipsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    $$('.chip', chipsEl).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    rState.country = b.dataset.c; rState.shown = 12; renderRoutes(true);
  });
  var qT = null;
  $('#r-search').addEventListener('input', function () {
    var v = this.value.trim();
    clearTimeout(qT); qT = setTimeout(function () { rState.q = v; rState.shown = 12; renderRoutes(true); }, 120);
  });
  $('#r-more').addEventListener('click', function () { rState.shown += 12; renderRoutes(false); });
  grid.addEventListener('click', function (e) {
    var b = e.target.closest('.rcard'); if (!b) return;
    var p = b.dataset.route.split('|');
    S.from = p[0]; S.to = p[1]; renderFinder();
    openBooking({ from: p[0], to: p[1], date: fDate.value, adult: S.pax });
  });

  /* ---------- chair modes ---------- */
  var MODES = {
    sit: 'Звичайна посадка з підлокітниками й ременем безпеки — для перших кілометрів, кави й розмов.',
    rest: 'Спинка відкинута, ноги на підставці. Так зручно дивитися у вікно годинами.',
    sleep: 'Крісло розкладається повністю. Подушка під голову, плед — і зранку ви вже на місці.'
  };
  var ORDER = ['sit', 'rest', 'sleep'], chair = $('#chair'), desc = $('#mode-desc'), prog = $('#seat-progress');
  var auto = !reduce, timer = null, cur = 'sit';
  function setMode(m) {
    cur = m; chair.setAttribute('data-mode', m);
    $$('.mode').forEach(function (b) { var on = b.dataset.mode === m; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); });
    desc.classList.add('is-fading');
    setTimeout(function () { desc.textContent = MODES[m]; desc.classList.remove('is-fading'); }, 180);
  }
  function tick() {
    if (!auto) return;
    prog.classList.remove('is-running'); void prog.offsetWidth; prog.classList.add('is-running');
    timer = setTimeout(function () { setMode(ORDER[(ORDER.indexOf(cur) + 1) % 3]); tick(); }, 4000);
  }
  $$('.mode').forEach(function (b) {
    b.addEventListener('click', function () { auto = false; clearTimeout(timer); prog.style.visibility = 'hidden'; setMode(b.dataset.mode); });
  });
  if ('IntersectionObserver' in w) {
    new IntersectionObserver(function (es, o) { if (es[0].isIntersecting && auto) { tick(); o.disconnect(); } }, { threshold: 0.35 }).observe($('#seat'));
  }

  /* ---------- gallery + lightbox ---------- */
  var shots = $$('.shot');
  $$('.tab[data-salon]').forEach(function (t) {
    t.addEventListener('click', function () {
      var s = t.dataset.salon, k = 0;
      $$('.tab[data-salon]').forEach(function (x) { var on = x === t; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', String(on)); });
      shots.forEach(function (sh) {
        var show = sh.dataset.salon === s; sh.hidden = !show;
        if (show && !reduce) { sh.classList.remove('is-entering'); void sh.offsetWidth; sh.style.animationDelay = (k++ * 0.07) + 's'; sh.classList.add('is-entering'); }
      });
    });
  });
  var lb = $('#lightbox'), lbImg = $('#lb-img'), list = [], idx = 0, opener = null;
  function lbShow(i) {
    idx = (i + list.length) % list.length;
    var sh = list[idx];
    lbImg.src = sh.dataset.full; lbImg.alt = $('img', sh).alt;
    lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
    $('#lb-count').textContent = (idx + 1) + ' / ' + list.length;
  }
  shots.forEach(function (sh) {
    sh.addEventListener('click', function () {
      list = shots.filter(function (x) { return !x.hidden; });
      opener = sh; lbShow(list.indexOf(sh)); openDialog(lb);
    });
  });
  lb.addEventListener('click', function (e) {
    var nb = e.target.closest('[data-lb]');
    if (nb) { lbShow(idx + (nb.dataset.lb === 'next' ? 1 : -1)); return; }
    if (e.target.closest('[data-close]') || e.target === lb) lb.close();
  });
  lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') lbShow(idx + 1); if (e.key === 'ArrowLeft') lbShow(idx - 1); });
  var x0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) lbShow(idx + (dx < 0 ? 1 : -1));
  });

  /* ---------- dialogs: scroll lock, focus return ---------- */
  var lastFocus = null;
  function openDialog(dlg) {
    lastFocus = d.activeElement;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    d.body.classList.add('is-locked');
  }
  [lb, $('#modal')].forEach(function (dlg) {
    dlg.addEventListener('close', function () {
      d.body.classList.remove('is-locked');
      var f = dlg === lb ? opener : lastFocus;
      if (f && f.focus) f.focus({ preventScroll: true });
    });
  });

  /* ---------- booking ---------- */
  var modal = $('#modal'), form = $('#form'), err = $('#form-err');
  var P = { adult: 1, child: 0, pens: 0 };
  form.date.min = todayIso;
  $$('[data-disc]').forEach(function (s) { s.textContent = BM.disc[s.dataset.disc]; });
  function formRoute() { return route(form.from.value, form.to.value); }
  function fillFormRoute(a, b) {
    fillSelect(form.from, FROMS, a);
    var dests = destsFrom(form.from.value);
    fillSelect(form.to, dests, dests.indexOf(b) >= 0 ? b : dests[0]);
  }
  function fare(base, k) { return k === 'adult' ? base : round50(base * (1 - BM.disc[k] / 100)); }
  function updateTotal() {
    if (!form.from.value) return;
    var r = formRoute(), sum = P.adult + P.child + P.pens;
    $$('[data-out]', form).forEach(function (o) { o.textContent = P[o.dataset.out]; });
    $$('#pax [data-k]').forEach(function (b) {
      var k = b.dataset.k, up = +b.dataset.d > 0;
      b.disabled = up ? sum >= MAX : P[k] <= 0 || sum <= 1;
    });
    var seats = S.seats[S.cls].slice().sort(function (a, b) { return a - b; }), fs = $('#form-seats');
    fs.hidden = !seats.length;
    fs.textContent = seats.length ? 'Обрані місця (' + (S.cls === 'lux' ? 'Lux' : 'Comfort') + '): ' + seats.join(', ') : '';
    if (!r) { $('#total').textContent = '—'; return; }
    var base = toUah(r[S.cls]);
    var total = fare(base, 'adult') * P.adult + fare(base, 'child') * P.child + fare(base, 'pens') * P.pens;
    tween($('#total'), total, ' грн');
  }
  function openBooking(pre) {
    pre = pre || {};
    fillFormRoute(pre.from || S.from, pre.to || S.to);
    form.date.value = pre.date && pre.date >= todayIso ? pre.date : fDate.value;
    var need = Math.max(pre.adult || S.pax, S.seats[S.cls].length, 1);
    P = { adult: Math.min(MAX, need), child: 0, pens: 0 };
    err.textContent = '';
    $$('.is-bad', form).forEach(function (f) { f.classList.remove('is-bad'); });
    updateTotal();
    openDialog(modal);
    if (w.matchMedia('(pointer: fine)').matches) form.name.focus();
  }
  $$('[data-book]').forEach(function (b) { b.addEventListener('click', function () { openBooking(); }); });
  form.from.addEventListener('change', function () { fillFormRoute(form.from.value, form.to.value); updateTotal(); });
  form.to.addEventListener('change', updateTotal);
  $('#pax').addEventListener('click', function (e) {
    var b = e.target.closest('[data-k]'); if (!b || b.disabled) return;
    var k = b.dataset.k, sum = P.adult + P.child + P.pens, dlt = +b.dataset.d;
    if (dlt > 0 && sum >= MAX) return;
    if (dlt < 0 && (P[k] <= 0 || sum <= 1)) return;
    P[k] += dlt; updateTotal();
  });
  modal.addEventListener('click', function (e) { if (e.target.closest('[data-close]') || e.target === modal) modal.close(); });
  $$('input, select, textarea', form).forEach(function (f) { f.addEventListener('input', function () { f.classList.remove('is-bad'); err.textContent = ''; }); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = [];
    var phoneOk = form.phone.value.replace(/\D/g, '').length >= 9;
    [['date', form.date.value >= todayIso], ['name', form.name.value.trim().length >= 2], ['phone', phoneOk]].forEach(function (x) {
      form[x[0]].classList.toggle('is-bad', !x[1]); if (!x[1]) bad.push(form[x[0]]);
    });
    if (bad.length) { err.textContent = 'Перевірте позначені поля.'; bad[0].focus(); return; }
    var r = formRoute(); if (!r) { err.textContent = 'Оберіть напрямок зі списку.'; return; }
    var base = toUah(r[S.cls]);
    var lines = [
      'Вітаю! Хочу забронювати поїздку «Без меж».',
      'Маршрут: ' + r.from + ' – ' + r.to,
      'Дата: ' + form.date.value.split('-').reverse().join('.'),
      'Клас: ' + (S.cls === 'lux' ? 'Lux' : 'Comfort'),
      'Пасажири: дорослі ' + P.adult + (P.child ? ', діти ' + P.child : '') + (P.pens ? ', пенсіонери ' + P.pens : '')
    ];
    var seats = S.seats[S.cls].slice().sort(function (a, b) { return a - b; });
    if (seats.length) lines.push('Місця: ' + seats.join(', '));
    lines.push('Орієнтовна сума: ' + fmt(fare(base, 'adult') * P.adult + fare(base, 'child') * P.child + fare(base, 'pens') * P.pens) + ' грн');
    lines.push('Ім\'я: ' + form.name.value.trim(), 'Телефон: ' + form.phone.value.trim());
    if (form.comment.value.trim()) lines.push('Коментар: ' + form.comment.value.trim());
    var to = form.querySelector('input[name="mgr"]:checked').value;
    var url = 'https://wa.me/' + to + '?text=' + encodeURIComponent(lines.join('\n'));
    var win = w.open(url, '_blank', 'noopener');
    if (!win) w.location.href = url;
    modal.close();
    toast('Заявку відкрито у WhatsApp — надішліть повідомлення менеджеру ' + MGR[to]);
  });

  /* ---------- count-up stats ---------- */
  function countUp(el) {
    var to = +el.dataset.count, t0 = null;
    if (reduce) { el.textContent = to; return; }
    function step(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 1100); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) w.requestAnimationFrame(step); }
    el.textContent = '0'; w.requestAnimationFrame(step);
  }
  $$('[data-count]').forEach(countUp);

  /* ---------- reveal on scroll ---------- */
  var revealEls = $$('section:not(.hero) h2, .feat, .steps li, .mgr, .chair-card, .class-card');
  revealEls.forEach(function (el, i) { el.setAttribute('data-reveal', ''); if (el.classList.contains('feat') || el.parentNode.classList.contains('steps')) el.style.setProperty('--d', ((i % 3) * 0.1) + 's'); });
  if ('IntersectionObserver' in w && !reduce) {
    var rIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); rIO.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { rIO.observe(el); });
  } else revealEls.forEach(function (el) { el.classList.add('is-in'); });

  /* ---------- mobile dock: hide over contacts/footer ---------- */
  if ('IntersectionObserver' in w) {
    var seen = [], dock = $('.dock');
    var dIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var i = seen.indexOf(e.target); if (e.isIntersecting && i < 0) seen.push(e.target); if (!e.isIntersecting && i >= 0) seen.splice(i, 1); });
      dock.classList.toggle('is-hidden', seen.length > 0);
    });
    dIO.observe($('.foot')); dIO.observe($('#contacts'));
  }

  /* ---------- live NBU euro rate ---------- */
  function applyRate() {
    $('#rate').textContent = rate.toFixed(2).replace('.', ',');
    renderFinder(); renderRoutes(false); renderClass(false); updateTotal();
  }
  fetch('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=EUR&json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (j) { var v = j && j[0] && +j[0].rate; if (v > 20 && v < 200) { rate = v; applyRate(); } })
    .catch(function () {});

  /* ---------- first render ---------- */
  renderClass(false); renderFinder(); renderRoutes(true);
  $('#rate').textContent = rate.toFixed(2).replace('.', ',');
  $('#year').textContent = new Date().getFullYear();
})(window, document);
