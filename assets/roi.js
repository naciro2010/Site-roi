/* ==========================================================================
   R.O.I — RUN ON INVEST · comportements partagés
   Aucune dépendance. Chaque bloc est optionnel : il ne s'active que si
   l'élément correspondant est présent sur la page.
   ========================================================================== */
(function () {
  'use strict';

  var sobre = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* ---- La ligne de progression + section courante dans la nav ----
     Un seul écouteur de scroll pour les deux, débrayé par requestAnimationFrame :
     le handler ne fait que lever un drapeau, la mesure attend la frame. */
  var jauge = document.querySelector('.progres');
  // Le CTA pointe lui aussi sur #tarifs : l'exclure, sinon il rafle en
  // permanence le surlignage destiné au lien de section.
  var liens = [].slice.call(document.querySelectorAll('.nav-links a[href^="#"]:not(.nav-cta)'));
  var sections = liens
    .map(function (a) { return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) }; })
    .filter(function (x) { return x.el; });

  if (jauge || sections.length) {
    var enAttente = false;
    var courante = null;

    var mesure = function () {
      enAttente = false;

      if (jauge) {
        var course = document.documentElement.scrollHeight - window.innerHeight;
        var part = course > 0 ? Math.min(Math.max(window.scrollY / course, 0), 1) : 0;
        document.documentElement.style.setProperty('--progres', (part * 100).toFixed(2) + '%');
      }

      if (sections.length) {
        var seuil = window.scrollY + (document.querySelector('header') || { offsetHeight: 0 }).offsetHeight + 24;
        var vue = null;
        sections.forEach(function (s) {
          if (s.el.offsetTop <= seuil) { vue = s.a; }
        });
        if (vue !== courante) {
          if (courante) { courante.classList.remove('on'); }
          if (vue) { vue.classList.add('on'); }
          courante = vue;
        }
      }
    };

    var planifie = function () {
      if (!enAttente) { enAttente = true; requestAnimationFrame(mesure); }
    };
    window.addEventListener('scroll', planifie, { passive: true });
    window.addEventListener('resize', planifie);
    mesure();
  }

  /* ---- Le dossard se retourne ---- */
  var dossard = document.querySelector('.dossard');
  if (dossard) {
    var retourne = function () {
      var ouvert = dossard.getAttribute('aria-pressed') === 'true';
      dossard.setAttribute('aria-pressed', ouvert ? 'false' : 'true');
    };
    dossard.addEventListener('click', retourne);
    // Le rappel « Retourne-le » est masqué à l'AT — le dossard porte déjà
    // l'état — mais il reste une cible cliquable à la souris.
    var rappel = document.querySelector('.d-retourne');
    if (rappel) { rappel.addEventListener('click', retourne); }
  }

  /* ---- Compteurs ----
     La valeur finale est déjà dans le HTML : sans JS, ou en mouvement réduit,
     le chiffre reste juste. L'animation ne fait que retarder son affichage. */
  var compteurs = document.querySelectorAll('[data-compte]');
  if (compteurs.length && !sobre && 'IntersectionObserver' in window) {
    var format = function (el, v, dec) {
      var s = v.toFixed(dec).replace('.', ',');
      if (el.dataset.format === 'espace') {
        s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      }
      return s;
    };

    var ioC = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) { return; }
        ioC.unobserve(en.target);
        var el = en.target;
        var brut = el.dataset.compte;
        var dec = (brut.split(',')[1] || '').length;
        var cible = parseFloat(brut.replace(',', '.'));
        var debut = null;
        var pas = function (t) {
          if (debut === null) { debut = t; }
          var p = Math.min((t - debut) / 1100, 1);
          el.textContent = format(el, cible * (1 - Math.pow(1 - p, 3)), dec);
          if (p < 1) { requestAnimationFrame(pas); }
        };
        requestAnimationFrame(pas);
      });
    }, { threshold: .4 });

    compteurs.forEach(function (el) {
      var brut = el.dataset.compte;
      el.textContent = format(el, 0, (brut.split(',')[1] || '').length);
      ioC.observe(el);
    });
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
