/* ============================================================
   Notaio Minniti Giuseppe — main.js (non-GSAP)
   Status aperto/chiuso, riga oggi, burger, sticky CTA,
   anchor smooth, safety net 4s gated. Solo forEach.
   ============================================================ */

(function () {
  'use strict';

  var doc = document;

  /* ---------- Orari (verificati GMaps 12/08) ---------- */
  // Indice JS: 0 = DOMENICA ... 6 = SABATO.
  // Coppie [apertura, chiusura] in ore decimali; [] = chiuso.
  var HOURS = [
    [],                              // 0 Domenica — chiuso
    [[9.5, 13], [15.5, 19]],         // 1 Lunedì
    [[9.5, 13], [15.5, 18.5]],       // 2 Martedì
    [[9.5, 13], [15.5, 18.5]],       // 3 Mercoledì
    [[9.5, 13], [15.5, 19]],         // 4 Giovedì
    [],                              // 5 Venerdì — chiuso
    []                               // 6 Sabato — chiuso
  ];

  var DAY_NAMES = [
    'domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'
  ];

  function fmtHour(h) {
    var hh = Math.floor(h);
    var mm = Math.round((h - hh) * 60);
    return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
  }

  function getStatus(now) {
    var day = now.getDay();
    var mins = now.getHours() + now.getMinutes() / 60;
    var windows = HOURS[day];
    var i;

    for (i = 0; i < windows.length; i += 1) {
      if (mins >= windows[i][0] && mins < windows[i][1]) {
        return { open: true, closesAt: windows[i][1], day: day };
      }
    }
    // Chiuso ma apre più tardi oggi?
    var opensLater = null;
    for (i = 0; i < windows.length; i += 1) {
      if (mins < windows[i][0]) {
        opensLater = windows[i][0];
        break;
      }
    }
    if (opensLater !== null) {
      return { open: false, opensAt: opensLater, daysAhead: 0, day: day };
    }
    // Cerca il prossimo giorno di apertura (max 7 passi).
    for (i = 1; i <= 7; i += 1) {
      var next = (day + i) % 7;
      if (HOURS[next].length > 0) {
        return {
          open: false,
          opensAt: HOURS[next][0][0],
          daysAhead: i,
          day: next
        };
      }
    }
    return { open: false, opensAt: 9.5, daysAhead: 1, day: 1 };
  }

  function pillText(st) {
    if (st.open) {
      return 'Aperto ora — chiudiamo alle ' + fmtHour(st.closesAt);
    }
    if (st.daysAhead === 0) {
      return 'Chiuso ora — riapriamo alle ' + fmtHour(st.opensAt);
    }
    if (st.daysAhead === 1) {
      return 'Chiuso ora — riapriamo domani alle ' + fmtHour(st.opensAt);
    }
    return 'Chiuso ora — riapriamo ' + DAY_NAMES[st.day] + ' alle ' + fmtHour(st.opensAt);
  }

  function updateStatus() {
    var st = getStatus(new Date());
    doc.querySelectorAll('.js-status').forEach(function (pill) {
      var text = pill.querySelector('.js-status-text');
      if (text) text.textContent = pillText(st);
      pill.classList.remove('status-pill--open', 'status-pill--closed');
      pill.classList.add(st.open ? 'status-pill--open' : 'status-pill--closed');
    });

    // Riga "oggi" nella tabella orari (1=Lunedì ... 7=Domenica).
    // Usa il giorno REALE odierno, non il prossimo giorno di apertura:
    // altrimenti il venerdì evidenzierebbe "Lunedì — oggi".
    var realDay = new Date().getDay();
    var todayNum = realDay === 0 ? 7 : realDay;
    doc.querySelectorAll('.hours-table tr[data-day]').forEach(function (tr) {
      tr.classList.toggle('is-today', Number(tr.getAttribute('data-day')) === todayNum);
    });
  }

  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------- Burger / menu mobile ---------- */

  var burger = doc.getElementById('burger');
  var mobileMenu = doc.getElementById('mobileMenu');

  function closeMenu() {
    if (!burger || !mobileMenu) return;
    burger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('is-open');
    doc.body.style.overflow = '';
    if (window.lenis) window.lenis.start();
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      doc.body.style.overflow = isOpen ? 'hidden' : '';
      if (window.lenis) {
        if (isOpen) window.lenis.stop();
        else window.lenis.start();
      }
    });
  }

  /* ---------- Sticky CTA mobile ---------- */

  var stickyCta = doc.getElementById('stickyCta');
  var footerEl = doc.getElementById('siteFooter');
  var heroThreshold = 480;

  function measureThreshold() {
    // "oltre l'hero" = dopo il primo schermo; soglia sensata anche con
    // hero più alto del viewport (mobile).
    heroThreshold = Math.max(280, Math.round((window.innerHeight || 812) * 0.6));
  }

  function onScroll() {
    if (!stickyCta) return;
    var y = window.scrollY || doc.documentElement.scrollTop;
    stickyCta.classList.toggle('is-visible', y > heroThreshold);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measureThreshold, { passive: true });
  measureThreshold();
  onScroll();

  if (stickyCta && footerEl && 'IntersectionObserver' in window) {
    var footerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        stickyCta.classList.toggle('hidden', entry.isIntersecting);
      });
    }, { threshold: 0.05 });
    footerObserver.observe(footerEl);
  }

  /* ---------- Anchor smooth (Lenis aware) ---------- */

  doc.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var hash = link.getAttribute('href');
    if (!hash || hash === '#') return;
    var target = doc.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(target, { offset: -72, duration: 1.2 });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  /* ---------- Safety net 4s (gated su __gsapReady) ---------- */

  setTimeout(function () {
    if (window.__gsapReady) return;
    doc.querySelectorAll(
      '.reveal, .hero__badge, .hero__title .word > span, .hero__sub, ' +
      '.hero__cta-row, .hero__rating, .hero__status'
    ).forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.animation = 'none';
    });
  }, 4000);
})();

