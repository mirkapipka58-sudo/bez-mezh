/* Без меж — interactions */
(function (w, d) {
  'use strict';
  d.documentElement.classList.add('js');
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header shadow + burger */
  var top = $('#top'), nav = $('#nav'), burger = $('#burger');
  var onScroll = function () { top.classList.toggle('is-scrolled', w.scrollY > 8); };
  w.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger.addEventListener('click', function () {
    var open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open);
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }); });

  /* active nav item */
  if ('IntersectionObserver' in w) {
    var links = {};
    $$('a', nav).forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var navIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var a = links[e.target.id]; if (!a) return;
        if (e.isIntersecting) { $$('a', nav).forEach(function (x) { x.classList.remove('is-active'); }); a.classList.add('is-active'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = d.getElementById(id); if (s) navIO.observe(s); });
  }

  /* hero: words rise one after another, photo settles */
  var title = $('.hero__title');
  if (title && !reduce) {
    var parts = title.innerHTML.split(/(\s+|&nbsp;)/);
    var i = 0;
    title.innerHTML = parts.map(function (p) {
      if (/^\s+$|^&nbsp;$/.test(p)) return p;
      return '<span class="word" style="animation-delay:' + (0.08 * i++) + 's">' + p + '</span>';
    }).join('');
  }
  var heroPhoto = $('.hero__photo');
  w.requestAnimationFrame(function () { heroPhoto.classList.add('is-in'); });

  /* chair modes: plays by itself until the visitor picks one */
  var MODES = {
    sit: 'Звичайна посадка з підлокітниками й ременем безпеки — для перших кілометрів, кави й розмов.',
    rest: 'Спинка відкинута, ноги на підставці. Так зручно дивитися у вікно годинами.',
    sleep: 'Крісло розкладається повністю. Подушка під голову, плед — і зранку ви вже на місці.'
  };
  var ORDER = ['sit', 'rest', 'sleep'];
  var chair = $('#chair'), desc = $('#mode-desc'), prog = $('#seat-progress'), modeBtns = $$('.mode');
  var auto = !reduce, timer = null, current = 'sit';
  function setMode(m) {
    current = m;
    chair.setAttribute('data-mode', m);
    modeBtns.forEach(function (b) { var on = b.getAttribute('data-mode') === m; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
    desc.classList.add('is-fading');
    setTimeout(function () { desc.textContent = MODES[m]; desc.classList.remove('is-fading'); }, 200);
  }
  function tick() {
    if (!auto) return;
    prog.classList.remove('is-running'); void prog.offsetWidth; prog.classList.add('is-running');
    timer = setTimeout(function () { setMode(ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]); tick(); }, 4000);
  }
  modeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      auto = false; clearTimeout(timer); prog.classList.remove('is-running'); prog.style.visibility = 'hidden';
      setMode(b.getAttribute('data-mode'));
    });
  });
  if ('IntersectionObserver' in w) {
    var seatIO = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && auto && !timer) tick();
    }, { threshold: 0.4 });
    seatIO.observe($('#seat'));
  } else { tick(); }

  /* seat map */
  var ROWS = [[1, null, 2, 3], [4, null, 5, 6], [7, 8, 9]];
  var picked = [];
  var rowsEl = $('#bus-rows');
  rowsEl.innerHTML = ROWS.map(function (r) {
    return '<div class="bus__row' + (r.length === 3 ? ' bus__row--back' : '') + '">' + r.map(function (n) {
      return n === null ? '<span class="aisle"></span>' : '<button type="button" class="place" aria-pressed="false" data-place="' + n + '" aria-label="Місце ' + n + '">' + n + '</button>';
    }).join('') + '</div>';
  }).join('');
  function plural(n) { var a = n % 10, b = n % 100; return a === 1 && b !== 11 ? 'місце' : (a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'місця' : 'місць'); }
  function renderPicked() {
    var el = $('#map-picked');
    if (!picked.length) { el.textContent = 'Місця ще не обрані'; return; }
    var s = picked.slice().sort(function (a, b) { return a - b; });
    el.innerHTML = 'Обрано ' + s.length + ' ' + plural(s.length) + ': <b>' + s.join(', ') + '</b>';
  }
  rowsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.place'); if (!b) return;
    var n = +b.getAttribute('data-place'), on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', on);
    if (on) picked.push(n); else picked = picked.filter(function (x) { return x !== n; });
    renderPicked();
  });

  /* salons: tabs + gallery */
  var NOTES = {
    tiff: 'Шкіряні крісла-реклайнери кольору тіффані, світлова стеля та холодильник.',
    ivory: 'Світла шкіра, подушки під голову, шторки на вікнах і м\'яке підсвічування.'
  };
  var shots = $$('.shot'), tabs = $$('.tab');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var s = t.getAttribute('data-salon');
      tabs.forEach(function (x) { var on = x === t; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on); });
      $('#salon-note').textContent = NOTES[s];
      var k = 0;
      shots.forEach(function (sh) {
        var show = sh.getAttribute('data-salon') === s;
        sh.hidden = !show;
        if (show && !reduce) { sh.classList.remove('is-entering'); void sh.offsetWidth; sh.style.animationDelay = (k++ * 0.07) + 's'; sh.classList.add('is-entering'); }
      });
    });
  });

  /* lightbox with arrows, keys and swipe */
  var lb = $('#lightbox'), lbImg = $('#lb-img'), lbCount = $('#lb-count'), list = [], idx = 0, opener = null;
  function lbShow(i) {
    idx = (i + list.length) % list.length;
    var sh = list[idx];
    lbImg.src = sh.getAttribute('data-full'); lbImg.alt = $('img', sh).alt;
    lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
    lbCount.textContent = (idx + 1) + ' / ' + list.length;
  }
  shots.forEach(function (sh) {
    sh.addEventListener('click', function () {
      list = shots.filter(function (x) { return !x.hidden; });
      opener = sh; lbShow(list.indexOf(sh)); lb.showModal();
    });
  });
  lb.addEventListener('click', function (e) {
    var nb = e.target.closest('[data-lb]');
    if (nb) { lbShow(idx + (nb.getAttribute('data-lb') === 'next' ? 1 : -1)); return; }
    if (e.target.closest('[data-close]') || e.target === lb) lb.close();
  });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') lbShow(idx + 1);
    if (e.key === 'ArrowLeft') lbShow(idx - 1);
  });
  lb.addEventListener('close', function () { if (opener) opener.focus({ preventScroll: true }); });
  var x0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) lbShow(idx + (dx < 0 ? 1 : -1));
  });

  /* booking → WhatsApp of the chosen manager */
  var modal = $('#modal'), form = $('#form'), err = $('#form-err'), seatsEl = $('#form-seats');
  var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  form.date.min = today.toISOString().slice(0, 10);
  $$('[data-book]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (picked.length) {
        var s = picked.slice().sort(function (a, c) { return a - c; });
        seatsEl.textContent = 'Обрані місця: ' + s.join(', ');
        seatsEl.hidden = false;
        form.pax.value = Math.max(+form.pax.value || 1, s.length);
      } else { seatsEl.hidden = true; }
      err.textContent = '';
      modal.showModal();
      if (w.matchMedia('(pointer: fine)').matches) form.from.focus();
    });
  });
  modal.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]') || e.target === modal) modal.close();
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = [];
    ['from', 'to', 'date', 'pax', 'name', 'phone'].forEach(function (n) {
      var f = form[n], ok = f.value.trim() !== '';
      if (n === 'phone') ok = f.value.replace(/\D/g, '').length >= 9;
      f.classList.toggle('is-bad', !ok);
      if (!ok) bad.push(f);
    });
    if (bad.length) { err.textContent = 'Заповніть позначені поля.'; bad[0].focus(); return; }
    err.textContent = '';
    var lines = [
      'Вітаю! Хочу забронювати поїздку «Без меж».',
      'Маршрут: ' + form.from.value.trim() + ' → ' + form.to.value.trim(),
      'Дата: ' + form.date.value.split('-').reverse().join('.'),
      'Пасажирів: ' + form.pax.value
    ];
    if (picked.length) lines.push('Місця: ' + picked.slice().sort(function (a, c) { return a - c; }).join(', '));
    lines.push('Ім\'я: ' + form.name.value.trim(), 'Телефон: ' + form.phone.value.trim());
    if (form.comment.value.trim()) lines.push('Коментар: ' + form.comment.value.trim());
    var to = form.querySelector('input[name="mgr"]:checked').value;
    w.open('https://wa.me/' + to + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    modal.close();
  });
  $$('input, textarea', form).forEach(function (f) { f.addEventListener('input', function () { f.classList.remove('is-bad'); }); });

  /* reveal on scroll */
  var revealEls = $$('section h2, .feat, .steps li, .mgr, .seat__stage, .bus');
  revealEls.forEach(function (el, i) { el.setAttribute('data-reveal', ''); if (el.classList.contains('feat') || el.parentNode.classList.contains('steps')) el.style.setProperty('--d', ((i % 3) * 0.1) + 's'); });
  if ('IntersectionObserver' in w && !reduce) {
    var rIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); rIO.unobserve(e.target); } });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { rIO.observe(el); });
  } else { revealEls.forEach(function (el) { el.classList.add('is-in'); }); }

  /* mobile dock hides over the footer and contacts */
  var dock = $('.dock');
  if ('IntersectionObserver' in w) {
    var seen = new Set();
    var dIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
      dock.classList.toggle('is-hidden', seen.size > 0);
    });
    dIO.observe($('.foot')); dIO.observe($('#contacts'));
  }

  $('#year').textContent = new Date().getFullYear();
})(window, document);
