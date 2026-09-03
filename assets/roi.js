/* ==========================================================================
   R.O.I — RUN ON INVEST · comportements partagés
   Aucune dépendance. Chaque bloc est optionnel : il ne s'active que si
   l'élément correspondant est présent sur la page.
   ========================================================================== */
(function () {
  'use strict';

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
    // Un clic hors du header referme le menu déplié.
    document.addEventListener('click', function (e) {
      if (links.classList.contains('open') && !e.target.closest('header')) { setNav(false); }
    });
  }

  /* ---- Barre CTA mobile ----
     Visible une fois le hero passé, masquée dès qu'une zone qui porte déjà
     son propre bouton (tarifs, finale, footer) entre dans l'écran. */
  var sticky = document.getElementById('sticky-cta');
  var hero = document.querySelector('.hero, .page-hero');
  if (sticky && hero && 'IntersectionObserver' in window) {
    var heroPasse = false, surCible = false;
    var visibles = {};
    var synchro = function () { sticky.classList.toggle('show', heroPasse && !surCible); };
    new IntersectionObserver(function (en) {
      heroPasse = !en[0].isIntersecting && en[0].boundingClientRect.top < 0;
      synchro();
    }, { threshold: 0 }).observe(hero);
    var cache = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visibles[en.target.id || en.target.tagName] = en.isIntersecting; });
      surCible = Object.keys(visibles).some(function (k) { return visibles[k]; });
      synchro();
    }, { threshold: 0 });
    ['#tarifs', '#dossards', '.finale', 'footer'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) { cache.observe(el); }
    });
  }
})();
