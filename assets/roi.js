/* ==========================================================================
   R.O.I — RUN ON INVEST · comportements partagés
   Aucune dépendance. Chaque bloc est optionnel : il ne s'active que si
   l'élément correspondant est présent sur la page.
   ========================================================================== */
(function () {
  'use strict';

  /* ---- Chrono T+ : après la ligne, le temps continue de compter. ---- */
  var chrono = document.getElementById('chrono');
  if (chrono) {
    var t0 = Date.now();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    setInterval(function () {
      var s = Math.floor((Date.now() - t0) / 1000);
      chrono.textContent = 'T+' + pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60);
    }, 1000);
  }

  /* ---- Reveal au scroll ---- */
  var reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    reveals.forEach(function (e) { e.classList.add('on'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('on'); io.unobserve(en.target); }
      });
    }, { threshold: .15 });
    reveals.forEach(function (e) { io.observe(e); });
  }

  /* ---- Nav mobile ---- */
  var burger = document.querySelector('.burger');
  var links = document.getElementById('nav-links');
  if (burger && links) {
    var setNav = function (open) {
      links.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.textContent = open ? 'Fermer' : 'Menu';
    };
    burger.addEventListener('click', function () {
      setNav(!links.classList.contains('open'));
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) { setNav(false); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('open')) { setNav(false); burger.focus(); }
    });
  }
})();
