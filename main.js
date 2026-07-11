/* twopalms.studio — motion + embeds */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reveal on scroll */
  var revealed = document.querySelectorAll('.rv');
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('on');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add('on'); });
  }

  /* Stat count-up */
  var stats = document.querySelectorAll('.statn[data-count]');
  if (!reduced && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        so.unobserve(e.target);
        var el = e.target;
        var target = parseInt(el.dataset.count, 10);
        var prefix = el.dataset.prefix || '';
        var suffix = el.dataset.suffix || '';
        var t0 = null, dur = 900;
        function tick(t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + Math.round(eased * target) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    stats.forEach(function (el) { so.observe(el); });
  }

  /* Hero UGC videos — kick playback (some browsers ignore autoplay attr), pause for reduced motion */
  document.querySelectorAll('.marquee video').forEach(function (v) {
    if (reduced) { v.removeAttribute('autoplay'); v.pause(); return; }
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* poster stays visible if playback is blocked */ });
  });

  /* Mobile hamburger */
  var burger = document.getElementById('navBurger');
  var menu = document.getElementById('navMenu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = document.body.dataset.menu === 'open';
      document.body.dataset.menu = open ? '' : 'open';
      burger.setAttribute('aria-expanded', String(!open));
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.dataset.menu = '';
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Work rail arrows */
  var rail = document.getElementById('rail');
  var prev = document.getElementById('railPrev');
  var next = document.getElementById('railNext');
  if (rail && prev && next) {
    prev.addEventListener('click', function () { rail.scrollLeft -= 318; });
    next.addEventListener('click', function () { rail.scrollLeft += 318; });
  }

  /* Live dual clocks — BALI (WITA) / BARCELONA */
  function fmt(tz) {
    try {
      return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(new Date());
    } catch (e) { return ''; }
  }
  function clocks() {
    var bali = fmt('Asia/Makassar');
    var bcn = fmt('Europe/Madrid');
    document.querySelectorAll('[data-clock="bali"]').forEach(function (el) { if (bali) el.textContent = bali; });
    document.querySelectorAll('[data-clock="bcn"]').forEach(function (el) { if (bcn) el.textContent = bcn; });
  }
  clocks();
  setInterval(clocks, 30000);

  /* Cal.com inline embed */
  (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
  Cal("init", "15min", { origin: "https://app.cal.com" });
  Cal.config = Cal.config || {};
  Cal.config.forwardQueryParams = true;
  Cal.ns["15min"]("inline", { elementOrSelector: "#my-cal-inline-15min", config: { layout: "month_view", useSlotsViewOnSmallScreen: "true" }, calLink: "aitor-truji/15min" });
  Cal.ns["15min"]("ui", { theme: "light", hideEventTypeDetails: false, layout: "month_view" });
})();
