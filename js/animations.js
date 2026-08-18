/* ============================================================
   Notaio Minniti Giuseppe — animations.js (GSAP + Lenis)
   Retry-loop initGSAP/initLenis (250ms, max 32). Lenis: UNA
   istanza su window.lenis (alias __lenis) sync a ScrollTrigger.
   Reveal bulletproof: .reveal opacity:1 di default, pre-hide
   dopo registerPlugin, ScrollTrigger once:true, MAI onLeaveBack,
   MAI gsap.from() con scrollTrigger inline, niente .reveal sulle
   card con stagger dedicato. Hero = solo CSS @keyframes inline.
   NO prefers-reduced-motion che azzera (regola utente).
   ============================================================ */

(function () {
  'use strict';

  var attempts = 0;
  var MAX_ATTEMPTS = 32;

  function init() {
    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    var LenisCtor = window.Lenis;

    if (!gsap || !ScrollTrigger || !LenisCtor) {
      attempts += 1;
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(init, 250);
      }
      return;
    }

    window.__gsapReady = true;

    gsap.registerPlugin(ScrollTrigger);

    /* Lenis — una sola istanza, sync con ScrollTrigger (flag in entrambi i loop) */
    if (!window.lenis) {
      window.lenis = new LenisCtor({
        duration: 1.1,
        smoothWheel: true
      });
      window.__lenis = window.lenis;
    }
    var lenis = window.lenis;

    if (!window.__lenisSynced) {
      lenis.on('scroll', ScrollTrigger.update);
      window.__lenisSynced = true;
    }

    function rafLoop(time) {
      lenis.raf(time);
      requestAnimationFrame(rafLoop);
    }
    requestAnimationFrame(rafLoop);

    /* Pre-hide anti-blink (dopo registerPlugin, mai prima) */
    gsap.set('.reveal', { opacity: 0, y: 40 });
    gsap.set('.cards-grid .card', { opacity: 0, y: 40 });

    /* Reveal bulletproof: un trigger per elemento, once:true */
    gsap.utils.toArray('.reveal').forEach(function (el) {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 82%',
        once: true,
        onEnter: function () {
          gsap.fromTo(el, { opacity: 0, y: 40 }, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power2.out'
          });
        }
      });
    });

    /* Card servizi: stagger dedicato, nessun .reveal sulle card */
    var grid = document.querySelector('.cards-grid');
    if (grid) {
      ScrollTrigger.create({
        trigger: grid,
        start: 'top 82%',
        once: true,
        onEnter: function () {
          gsap.to(grid.querySelectorAll('.card'), {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.1,
            ease: 'power2.out'
          });
        }
      });
    }

    /* Refresh dopo il load (layout + mappa) */
    window.addEventListener('load', function () {
      ScrollTrigger.refresh();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
