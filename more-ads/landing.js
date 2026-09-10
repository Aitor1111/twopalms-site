/* twopalms — paid landing (/more-ads).
   Port of the reactive "TP Paid Landing v2.dc.html" canvas to vanilla JS.
   The canvas ran on Claude Design's runtime (state + {{ bindings }}); here the
   same state drives [data-bind] / [data-show] nodes and a JS-rendered modal. */
(function () {
  'use strict';

  var CAL_LINK = 'aitor-truji/15min';
  var THANKS_URL = '/more-ads/thanks/';

  var state = {
    spendPos: 35,
    cur: 8,
    faqOpen: -1,
    qualOpen: false,
    step: 0,
    ans: {},
    calMounted: false
  };

  var spots = Math.max(0, Math.min(3, parseInt(document.body.dataset.spots || '2', 10)));

  var FAQ = [
    ['Can you really do 100+ statics and 50 videos a week?', 'Yes. The engine is the same at 20 or 200. Volume scales with your spend; the only cap is two new brands a month.'],
    ['Is this AI slop?', 'AI-native production, human art direction, briefed from a real angle and reviewed by the people who buy media with it.'],
    ['What does a pack cost?', "Depends on the weekly volume your account needs — that's what the audit calculates. You get the number on the call."],
    ['We already have a designer.', 'Keep them for brand and site. We feed the ad account.'],
    ['Do you need access to our ad account?', 'For the audit, no — you share screen. Once we work together, view access.'],
    ['Do you also run the media?', 'We can. But the audit and the packs stand alone — no bundle required.']
  ];

  var SPEND_OPTS = [['Under $10k', 'NOT YET'], ['$10k – $25k', 'FIT'], ['$25k – $50k', 'FIT'], ['$50k+', 'PRIORITY']];
  var VERT_OPTS = ['Beauty & skincare', 'Fashion & accessories', 'Supplements & health', 'Home & lifestyle', 'Other DTC'];
  var ROLE_OPTS = ['Founder / CEO', 'CMO / Head of growth', 'Media buyer', 'Agency on behalf of a brand'];

  var ON = '#00E000', OFF = 'rgba(255,255,255,.14)';

  /* ---------- Meta pixel ---------------------------------------------------
     Base pixel + PageView sit in each page's <head>. Events carry an eventID
     for future Conversions API dedup and fire at most once per pageview. */
  var fbFired = {};
  function fbEventId() {
    return 'tp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  function fbTrack(name, params, custom) {
    if (fbFired[name]) return;
    fbFired[name] = true;
    if (typeof window.fbq !== 'function') return;
    window.fbq(custom ? 'trackCustom' : 'track', name, params || {}, { eventID: fbEventId() });
  }

  /* ---------- maths (ported 1:1 from the canvas) --------------------------- */
  function spendVal() {
    var v = 5000 * Math.pow(100, state.spendPos / 100);
    var step = v < 20000 ? 1000 : v < 100000 ? 5000 : 25000;
    return Math.round(v / step) * step;
  }
  function fmt(v) {
    return v >= 1000000
      ? '$' + (v / 1000000).toFixed(v % 1000000 ? 1 : 0) + 'M'
      : '$' + Math.round(v / 1000) + 'k';
  }
  function nextMonday() {
    var d = new Date(), add = ((8 - d.getDay()) % 7) || 7;
    d.setDate(d.getDate() + add);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  }
  function day7() {
    var d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function weekNo() {
    var d = new Date(), s = new Date(d.getFullYear(), 0, 1);
    return String(Math.ceil(((d - s) / 86400000 + s.getDay() + 1) / 7)).padStart(2, '0');
  }

  function derive() {
    var spend = spendVal(), k = spend / 1000;
    var need = Math.max(15, Math.round((k <= 100 ? k * 7 : 700 + (k - 100) * 4) / 5) * 5);
    var covered = state.cur >= need;
    var gap = covered ? 0 : need - state.cur;
    var tier = spend < 10000 ? 1 : spend <= 30000 ? 2 : 3;
    var weights = tier === 1
      ? [['statics', .8, '#F5F5F3'], ['videos', .2, '#00E000']]
      : tier === 2
        ? [['statics', .6, '#F5F5F3'], ['gifs', .2, '#8A8A86'], ['videos', .2, '#00E000']]
        : [['statics', .45, '#F5F5F3'], ['gifs', .15, '#8A8A86'], ['videos', .15, '#00E000'], ['carousels', .13, '#55554F'], ['native ads', .12, '#3A3A37']];
    var base = covered ? Math.max(15, Math.round(need * 0.25 / 5) * 5) : gap;
    var acc = 0;
    var mix = weights.map(function (w, i) {
      var n = i === weights.length - 1 ? Math.max(0, base - acc) : Math.max(1, Math.round(base * w[1]));
      acc += n;
      return { label: w[0].toUpperCase(), slug: w[0].replace(' ', '_'), n: n, color: w[2] };
    });
    var per = Math.max(1, Math.ceil(need / 150));
    var dots = [];
    for (var i = 0; i < Math.ceil(need / per); i++) dots.push(i * per < state.cur);
    var under = Math.max(0, 1 - state.cur / need);
    var driftNowV = Math.round(under * 45);
    return {
      spend: spend, need: need, covered: covered, gap: gap, base: base, mix: mix, dots: dots,
      spendFmt: fmt(spend) + '/mo',
      dotNote: per > 1 ? '1 ■ = ' + per + ' ADS' : '1 ■ = 1 AD',
      painLine: covered
        ? 'You test ' + state.cur + ". You don't need us."
        : 'You test ' + state.cur + '. ' + gap + ' are missing.',
      fixLine: covered
        ? 'Want headroom anyway? ' + base + ' extra a week.'
        : 'We make the ' + gap + " you're missing.",
      mixNote: tier === 1
        ? 'Statics test angles, video scales winners.'
        : tier === 2
          ? 'Statics + GIFs test angles, video scales winners.'
          : 'Full format mix — statics, GIFs, video, carousels and native ads — so no placement runs dry.',
      driftNow: driftNowV > 0 ? '+' + driftNowV + '%' : 'flat',
      driftNowPct: Math.max(8, Math.round(driftNowV / 45 * 100))
    };
  }

  var spotsLabel = spots === 0 ? 'WAITLIST · NEXT MONTH' : spots + ' OF 3 SPOTS LEFT THIS MONTH';
  var spotsHeadline = spots === 0 ? 'This month is full.'
    : spots === 1 ? 'One spot left this month.'
      : "Three brands a month. That's it.";

  /* ---------- binding ------------------------------------------------------ */
  function setAll(key, value) {
    document.querySelectorAll('[data-bind="' + key + '"]').forEach(function (el) {
      el.textContent = value;
    });
  }

  function renderCalc() {
    var d = derive();
    setAll('need', d.need);
    setAll('cur', state.cur);
    setAll('gap', d.base);
    setAll('spendFmt', d.spendFmt);
    setAll('painLine', d.painLine);
    setAll('fixLine', d.fixLine);
    setAll('dotNote', d.dotNote);
    setAll('mixNote', d.mixNote);
    setAll('driftNow', d.driftNow);

    var drift = document.getElementById('driftBar');
    if (drift) drift.style.width = d.driftNowPct + '%';

    var dotWrap = document.getElementById('dots');
    if (dotWrap) {
      dotWrap.innerHTML = d.dots.map(function (filled) {
        return '<span style="aspect-ratio:4/5;border-radius:3px;box-sizing:border-box;'
          + (filled ? 'background:#0A0A0A;border:1.5px solid transparent' : 'background:transparent;border:1.5px dashed #FF5A3C')
          + '"></span>';
      }).join('');
    }

    var mixBar = document.getElementById('mixBar');
    if (mixBar) {
      mixBar.innerHTML = d.mix.map(function (m) {
        return '<span style="flex:' + m.n + ';background:' + m.color + '"></span>';
      }).join('');
    }
    var mixLeg = document.getElementById('mixLegend');
    if (mixLeg) {
      mixLeg.innerHTML = d.mix.map(function (m) {
        return '<span style="display:flex;align-items:center;gap:8px">'
          + '<span style="width:10px;height:10px;border-radius:3px;background:' + m.color + '"></span>'
          + '<span class="disp" style="font-size:20px">' + m.n + '</span>'
          + '<span class="lbl">' + m.label + '</span></span>';
      }).join('');
    }
    var friday = document.getElementById('fridayFiles');
    if (friday) {
      friday.innerHTML = d.mix.map(function (m) {
        return '<div style="display:flex;justify-content:space-between;font-size:12.5px;border-bottom:1px solid rgba(245,245,243,.14);padding-bottom:6px">'
          + '<span>📁 W' + weekNo() + '_' + m.slug + '</span><span class="lbl">' + m.n + '</span></div>';
      }).join('')
        + '<div style="display:flex;justify-content:space-between;font-size:12.5px"><span>📄 tracker · what won</span><span class="lbl" style="color:#00E000">LIVE</span></div>';
    }
  }

  /* ---------- FAQ ---------------------------------------------------------- */
  function renderFaq() {
    var wrap = document.getElementById('faq');
    if (!wrap) return;
    wrap.innerHTML = FAQ.map(function (f, i) {
      var open = state.faqOpen === i;
      return '<div class="faq" data-faq="' + i + '"><div class="faqq"><span>' + f[0] + '</span>'
        + '<span style="color:#00E000;flex:none">' + (open ? '−' : '+') + '</span></div>'
        + (open ? '<p class="sub" style="margin:12px 0 0;max-width:560px;font-size:15px">' + f[1] + '</p>' : '')
        + '</div>';
    }).join('');
  }

  /* ---------- qualification modal ------------------------------------------ */
  function disq() { return state.ans.spend === 'Under $10k'; }

  function optButtons(list, key, next) {
    return '<div class="optgrid">' + list.map(function (o, i) {
      var label = Array.isArray(o) ? o[0] : o;
      var note = Array.isArray(o) ? o[1] : '→';
      return '<button class="opt" data-pick="' + key + '" data-value="' + label.replace(/"/g, '&quot;')
        + '" data-next="' + next + '"><span>' + label + '</span><span class="lbl">' + note + '</span></button>';
    }).join('') + '</div>';
  }

  function renderModal() {
    var host = document.getElementById('qual');
    if (!host) return;
    if (!state.qualOpen) { host.innerHTML = ''; document.body.style.overflow = ''; state.calMounted = false; return; }
    document.body.style.overflow = 'hidden';

    var step = state.step, no = disq();
    var stepLabel = step === 3 ? (no ? 'NOT A FIT · YET' : 'STEP 04 · BOOK') : 'STEP 0' + (step + 1) + ' OF 04';
    var bar = function (i) { return step >= i ? ON : OFF; };
    var rail = function (i, filled) { return step === i ? ON : (filled ? 'rgba(0,224,0,.45)' : OFF); };

    var body = '';
    if (step === 0) {
      body = '<div class="disp" style="font-size:40px">What\'s your monthly Meta ad spend?</div>' + optButtons(SPEND_OPTS, 'spend', 1);
    } else if (step === 1) {
      body = '<div class="disp" style="font-size:40px">What do you sell?</div>' + optButtons(VERT_OPTS, 'vertical', 2);
    } else if (step === 2) {
      body = '<div class="disp" style="font-size:40px">Who\'s on the call?</div>' + optButtons(ROLE_OPTS, 'role', 3);
    } else if (no) {
      body = '<div class="disp" style="font-size:40px">Not yet — and we\'d rather tell you now.</div>'
        + '<p class="sub" style="margin:0;font-size:16px;max-width:560px">Under $10k/month, volume burns budget before your offer is proven. Send us your store and your best ad — we reply with the one thing to fix. Free, no call.</p>'
        + '<a href="mailto:hello@twopalms.studio?subject=Under%20$10k%20%E2%80%94%20one%20thing%20to%20fix" class="ctamini" style="background:#F5F5F3;align-self:flex-start;padding:16px 26px">Email us your store →</a>'
        + '<button data-act="backToQ1" class="lbl" style="background:transparent;border:none;color:#8A8A86;cursor:pointer;align-self:flex-start;padding:0">← I picked the wrong number</button>';
    } else {
      body = '<div><div class="disp" style="font-size:40px">Pick your slot.</div>'
        + '<p class="sub" style="margin:10px 0 0;font-size:14.5px">20 minutes · Google Meet · say yes and week one ships 10 animated GIFs of your winners, free.</p></div>'
        + '<div style="border:1px solid rgba(245,245,243,.12);border-radius:20px;min-height:640px;overflow:hidden;background:#111110"><div id="cal-qual" style="width:100%;min-height:640px"></div></div>';
    }

    host.innerHTML =
      '<div style="position:fixed;inset:0;z-index:100;background:#0C0C0B;color:#F5F5F3;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch">'
      + '<div style="position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:16px 28px;background:rgba(12,12,11,.9);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.08)">'
      + '<img src="/assets/logo-white.png" alt="twopalms" style="height:20px;width:auto;display:block">'
      + '<span class="lbl" style="color:#00E000">FREE CREATIVE VOLUME AUDIT · ' + stepLabel + '</span>'
      + '<button data-act="close" aria-label="Close" style="background:transparent;border:1px solid rgba(255,255,255,.2);color:#F5F5F3;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:14px;flex:none">✕</button></div>'
      + '<div style="display:flex;gap:4px;padding:0 28px;margin-top:14px">'
      + [0, 1, 2, 3].map(function (i) { return '<span style="flex:1;height:3px;border-radius:2px;background:' + bar(i) + '"></span>'; }).join('')
      + '</div><div class="bookgrid"><div class="bookrail">'
      + '<button class="railstep" data-act="goStep0" style="border-color:' + rail(0, state.ans.spend) + '"><span class="lbl">01 · SPEND</span><span style="font-size:15px;font-weight:550">' + (state.ans.spend || '—') + '</span></button>'
      + '<button class="railstep" data-act="goStep1" style="border-color:' + rail(1, state.ans.vertical) + '"><span class="lbl">02 · YOU SELL</span><span style="font-size:15px;font-weight:550">' + (state.ans.vertical || '—') + '</span></button>'
      + '<button class="railstep" data-act="goStep2" style="border-color:' + rail(2, state.ans.role) + '"><span class="lbl">03 · ON THE CALL</span><span style="font-size:15px;font-weight:550">' + (state.ans.role || '—') + '</span></button>'
      + '<div class="railstep" style="border-color:' + (step === 3 ? ON : OFF) + ';cursor:default"><span class="lbl">04 · SLOT</span><span style="font-size:15px;font-weight:550">' + (step === 3 && !no ? 'Pick a time' : '—') + '</span></div>'
      + '<div style="margin-top:12px;border-top:1px solid rgba(245,245,243,.12);padding-top:18px;display:flex;flex-direction:column;gap:8px">'
      + '<span class="lbl" style="color:#00E000">YOU LEAVE THE CALL WITH</span>'
      + '<span style="font-size:14px">Your creative fatigue map</span><span style="font-size:14px">5 angles you\'re not testing</span>'
      + '<span style="font-size:14px">Competitor teardown</span><span style="font-size:14px">Your weekly number + pack</span>'
      + '<span class="lbl" style="margin-top:6px;display:flex;align-items:center;gap:8px"><span class="livedot"></span>' + spotsLabel + '</span>'
      + '</div></div><div style="min-width:0;display:flex;flex-direction:column;gap:24px">' + body + '</div></div></div>';

    if (step === 3 && !no) mountCal();
  }

  function mountCal() {
    var el = document.getElementById('cal-qual');
    if (!el || state.calMounted) return;
    state.calMounted = true;

    if (!window.Cal) {
      (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
    }
    var ns = 'tp' + Date.now();
    var a = state.ans;
    Cal("init", ns, { origin: "https://app.cal.com" });
    Cal.ns[ns]("inline", {
      elementOrSelector: "#cal-qual",
      config: {
        layout: "month_view",
        useSlotsViewOnSmallScreen: "true",
        notes: 'Spend: ' + a.spend + ' · Sells: ' + a.vertical + ' · Role: ' + a.role
          + ' · Calc: ' + spendVal() + '/mo, ' + state.cur + ' ads/wk, pack auto'
      },
      calLink: CAL_LINK
    });
    Cal.ns[ns]("ui", {
      theme: "dark", hideEventTypeDetails: true, layout: "month_view",
      cssVarsPerTheme: { dark: { "cal-brand": "#00E000", "cal-brand-text": "#0A0A0A", "cal-bg": "#111110", "cal-bg-emphasis": "#1E1E1C" } }
    });

    /* The money event. Cal is a cross-origin iframe — this embed callback is the
       only way the pixel learns a booking happened. bookingSuccessfulV2
       supersedes bookingSuccessful; older embed builds still emit the latter,
       so listen to both and let fbTrack dedupe. The redirect is delayed so the
       pixel request leaves before the page unloads. */
    ['bookingSuccessfulV2', 'bookingSuccessful'].forEach(function (action) {
      Cal.ns[ns]("on", {
        action: action,
        callback: function () {
          fbTrack('Schedule', { content_name: 'creative volume audit' });
          fbTrack('Lead', { content_name: 'creative volume audit' });
          setTimeout(function () { window.location.href = THANKS_URL; }, 700);
        }
      });
    });
  }

  function openQual() {
    state.qualOpen = true; state.step = 0; state.ans = {}; state.calMounted = false;
    fbTrack('InitiateCheckout', { content_name: 'creative volume audit' });
    renderModal();
  }
  function closeQual() { state.qualOpen = false; renderModal(); }

  /* ---------- wiring ------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var vid = t.closest('[data-video]');
    if (vid) { openVideo(vid.dataset.video, vid.dataset.label || ''); return; }
    // clic en el fondo o en la ✕ del lightbox
    if (t.closest('[data-act="closeVideo"]') && !t.closest('video')) { closeVideo(); return; }

    if (t.closest('[data-act="openQual"]')) { openQual(); return; }
    if (t.closest('[data-act="close"]')) { closeQual(); return; }
    if (t.closest('[data-act="backToQ1"]')) { state.step = 0; renderModal(); return; }
    if (t.closest('[data-act="goStep0"]')) { state.step = 0; renderModal(); return; }
    if (t.closest('[data-act="goStep1"]')) { if (state.ans.spend && !disq()) { state.step = 1; renderModal(); } return; }
    if (t.closest('[data-act="goStep2"]')) { if (state.ans.vertical) { state.step = 2; renderModal(); } return; }

    var pick = t.closest('[data-pick]');
    if (pick) {
      var key = pick.dataset.pick, value = pick.dataset.value;
      state.ans[key] = value;
      state.step = (key === 'spend' && value === 'Under $10k') ? 3 : parseInt(pick.dataset.next, 10);
      state.calMounted = false;
      if (state.step === 3) {
        if (disq()) fbTrack('AuditDisqualified', { content_name: 'under 10k' }, true);
        else fbTrack('ViewContent', { content_name: 'audit calendar' });
      }
      renderModal();
      return;
    }

    var faq = t.closest('[data-faq]');
    if (faq) {
      var i = parseInt(faq.dataset.faq, 10);
      state.faqOpen = state.faqOpen === i ? -1 : i;
      renderFaq();
    }
  });

  /* ---------- video lightbox --------------------------------------------
     The tiles used to link out to Drive; they now play the local file in
     place, so nobody leaves the landing mid-funnel. */
  function closeVideo() {
    var host = document.getElementById('lightbox');
    if (!host || !host.innerHTML) return;
    var v = host.querySelector('video');
    if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
    host.innerHTML = '';
    if (!state.qualOpen) document.body.style.overflow = '';
  }
  function openVideo(src, label) {
    var host = document.getElementById('lightbox');
    if (!host) return;
    document.body.style.overflow = 'hidden';
    host.innerHTML =
      '<div class="lbox" data-act="closeVideo">'
      + '<button class="lboxx" data-act="closeVideo" aria-label="Close">✕</button>'
      + '<figure class="lboxf">'
      + '<video src="' + src + '" controls autoplay playsinline preload="metadata"></video>'
      + (label ? '<figcaption class="lbl">' + label + '</figcaption>' : '')
      + '</figure></div>';
    var v = host.querySelector('video');
    if (v) { v.focus(); v.play().catch(function () {}); }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (document.getElementById('lightbox') && document.getElementById('lightbox').innerHTML) closeVideo();
    else if (state.qualOpen) closeQual();
  });

  var spendEl = document.getElementById('spendRange');
  if (spendEl) spendEl.addEventListener('input', function (e) { state.spendPos = +e.target.value; renderCalc(); });
  var curEl = document.getElementById('curRange');
  if (curEl) curEl.addEventListener('input', function (e) { state.cur = +e.target.value; renderCalc(); });

  /* static bindings */
  setAll('day7', day7());
  setAll('nextMonday', nextMonday());
  setAll('weekNo', weekNo());
  setAll('spotsLabel', spotsLabel);
  setAll('spotsHeadline', spotsHeadline);
  document.querySelectorAll('[data-spot]').forEach(function (el, i) {
    el.style.background = spots >= (i + 1) ? ON : 'transparent';
  });

  renderCalc();
  renderFaq();
})();
