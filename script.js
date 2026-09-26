(function () {
  var header = document.querySelector('.header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 0); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // text and image blocks per section (elements carrying their own transform are avoided)
  var groups = [
    '.hero__eyebrow, .hero__title, .hero__cta',
    '.section-tt > *',
    '.card__img, .card__tt',
    '.logos',
    '.value__in',
    '.map',
    '.cu__head, .cu__info, .cu__form',
    '.footer__in'
  ];
  var els = [];
  groups.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.setProperty('--d', (i % 4) * 0.12 + 's');
      els.push(el);
    });
  });
  document.documentElement.classList.add('js');

  function show(el) { el.classList.add('is-visible'); }
  if (!('IntersectionObserver' in window)) { els.forEach(show); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0, rootMargin: '0px 0px -80px 0px' });
  els.forEach(function (el) { io.observe(el); });
})();

// partner logo marquee: duplicate the set so the -50% loop is seamless
(function () {
  var track = document.querySelector('.logos__track');
  if (!track) return;
  Array.prototype.slice.call(track.children).forEach(function (el) {
    var c = el.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    track.appendChild(c);
  });
})();

// nav: current-section highlight (click + scroll spy)
(function () {
  var links = document.querySelectorAll('.nav__menu a[href^="#"]:not(.nav__cta)');
  var map = [];
  links.forEach(function (a) {
    var t = document.querySelector(a.getAttribute('href'));
    if (t && a.getAttribute('href') !== '#top') map.push({ a: a, t: t });
    a.addEventListener('click', function () { setActive(a); });
  });
  function setActive(active) { links.forEach(function (a) { a.classList.toggle('is-active', a === active); }); }
  function spy() {
    var line = window.innerHeight * 0.35, cur = null;
    map.forEach(function (m) {
      var r = m.t.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) cur = m.a;
    });
    setActive(cur);
  }
  window.addEventListener('scroll', spy, { passive: true });
  spy();
})();

// map: custom zoom buttons (embed's own controls cannot be moved)
(function () {
  var map = document.querySelector('.map');
  if (!map) return;
  var frame = map.querySelector('iframe');
  var zin = map.querySelector('.zin'), zout = map.querySelector('.zout');
  var MIN = 10, MAX = 20;
  var z = parseInt((frame.getAttribute('src').match(/!6i(\d+)/) || [0, 17])[1], 10);
  function apply() {
    frame.src = frame.getAttribute('src').replace(/!6i\d+/, '!6i' + z);
    zin.disabled = z >= MAX; zout.disabled = z <= MIN;
  }
  zin.addEventListener('click', function () { if (z < MAX) { z++; apply(); } });
  zout.addEventListener('click', function () { if (z > MIN) { z--; apply(); } });
})();

// mobile menu toggle
(function () {
  var header = document.querySelector('.header');
  var btn = document.querySelector('.nav__toggle');
  if (!btn) return;
  function set(open) {
    header.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  }
  btn.addEventListener('click', function () { set(!header.classList.contains('is-open')); });
  document.querySelectorAll('.nav__menu a').forEach(function (a) {
    a.addEventListener('click', function () { set(false); });
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
})();

// hero: play top_vod1 -> top_vod2 -> top_vod1 ... with a short crossfade
(function () {
  var vids = document.querySelectorAll('.hero__video');
  if (vids.length < 2) return;
  var cur = 0;
  function swap() {
    var from = vids[cur], to = vids[1 - cur];
    to.currentTime = 0;
    var p = to.play();
    if (p && p.catch) p.catch(function () {});
    to.classList.add('is-active');
    from.classList.remove('is-active');
    setTimeout(function () { from.pause(); from.currentTime = 0; }, 700);
    cur = 1 - cur;
  }
  vids.forEach(function (v, i) {
    v.addEventListener('ended', function () { if (i === cur) swap(); });
  });
})();

// contact form: required-field validation (no submit backend connected yet)
(function () {
  var form = document.querySelector('.cu__form');
  if (!form) return;
  var msg = form.querySelector('.f-msg');
  var defaultMsg = msg.textContent;
  function ok(el) {
    var v = el.value.trim();
    if (!v) return false;
    if (el.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (el.type === 'tel') return /^[0-9+\-\s()]{7,}$/.test(v);
    return true;
  }
  form.querySelectorAll('input,textarea').forEach(function (el) {
    el.addEventListener('input', function () {
      if (ok(el)) el.closest('.f').classList.remove('is-invalid');
    });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var first = null;
    form.querySelectorAll('input,textarea').forEach(function (el) {
      var good = ok(el);
      el.closest('.f').classList.toggle('is-invalid', !good);
      if (!good && !first) first = el;
    });
    if (first) { msg.textContent = defaultMsg; first.focus(); return; }
    msg.textContent = '문의 접수 기능은 아직 연동되지 않았습니다.';
  });
})();
