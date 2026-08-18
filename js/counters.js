/* ============================================================
   Notaio Minniti Giuseppe — counters.js
   Count-up dei numeri reali (4.7, 3, 170) in trust bar.
   IntersectionObserver + rAF + performance.now(), una volta sola.
   Dati reali dagli attributi data-target/data-decimals.
   ============================================================ */

(function () {
  'use strict';

  function format(value, decimals) {
    if (decimals > 0) {
      return value.toFixed(decimals);
    }
    return String(Math.round(value));
  }

  function animate(counter) {
    var target = parseFloat(counter.getAttribute('data-target'));
    var decimals = parseInt(counter.getAttribute('data-decimals') || '0', 10);
    if (isNaN(target)) return;
    var duration = 1100;
    var start = null;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var elapsed = timestamp - start;
      var progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = format(target * eased, decimals);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        counter.textContent = format(target, decimals);
      }
    }

    requestAnimationFrame(step);
  }

  function init() {
    var counters = document.querySelectorAll('.counter');
    if (!counters.length) return;

    if (!('IntersectionObserver' in window)) {
      counters.forEach(function (c) {
        animate(c);
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    counters.forEach(function (c) {
      observer.observe(c);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
