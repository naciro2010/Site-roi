/* ==========================================================================
   R.O.I — RUN ON INVESTMENT · comportements partagés
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

  /* ---- Le lien de compte dans la nav ----
     « Connexion » devient « Mon espace » dès qu'une session est ouverte.
     On lit un simple drapeau posé par compte.js : pas d'appel réseau à
     chaque page, la vérité reste côté serveur quand on ouvre l'espace. */
  var lienCompte = document.querySelector('.nav-compte');
  if (lienCompte) {
    var hrefConnexion = lienCompte.getAttribute('href');
    var hrefEspace = hrefConnexion.replace(/connexion\/$/, 'espace/');
    window.roiNavCompte = function () {
      var prenom = null;
      try { prenom = localStorage.getItem('roi.connecte'); } catch (e) { /* stockage indisponible */ }
      if (prenom) {
        lienCompte.textContent = 'Mon espace';
        lienCompte.setAttribute('href', hrefEspace);
      } else {
        lienCompte.textContent = 'Connexion';
        lienCompte.setAttribute('href', hrefConnexion);
      }
    };
    window.roiNavCompte();
  }

  /* ---- Le pont vers l'app ----
     L'app R.O.I vit sur une autre origine. Tous les liens .lien-app prennent
     leur adresse ici : data-app sur <body> pour la changer, sinon la valeur
     par défaut, l'app sur Railway (voir README). */
  var liensApp = document.querySelectorAll('a.lien-app');
  if (liensApp.length) {
    var app = (document.body.dataset.app || 'https://roi-mvp.up.railway.app').replace(/\/+$/, '');
    liensApp.forEach(function (a) { a.setAttribute('href', app + '/'); });
  }

  var reduit = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Les animations ne tournent que lorsqu'elles sont à l'écran.
  var observe = function (el, rappel) {
    if (!('IntersectionObserver' in window)) { rappel(true); return; }
    new IntersectionObserver(function (en) { rappel(en[0].isIntersecting); }, { threshold: .25 }).observe(el);
  };

  /* ---- Le plan des départs ----
     Une horloge de 8 h 30 à 11 h 45, jouée en 18 secondes. Chaque ligne lit
     son départ et sa plage d'arrivée dans ses data-* (en minutes depuis
     minuit) : le HTML reste la seule source des horaires. */
  var departs = document.querySelector('[data-departs]');
  if (departs) {
    var AXE0 = 510, AXE1 = 705, VITESSE = (AXE1 - AXE0) / 18000;
    var pct = function (m) { return ((m - AXE0) / (AXE1 - AXE0) * 100).toFixed(3) + '%'; };
    var deux = function (n) { return (n < 10 ? '0' : '') + n; };
    var hhmm = function (m) { m = Math.round(m); return deux(Math.floor(m / 60)) + ':' + deux(m % 60); };
    var lisible = function (m) { m = Math.round(m); return Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + deux(m % 60) : ''); };
    var LEGENDES = [
      [AXE0, "8 h 30 : le village est ouvert. Le semi-marathon partira en premier."],
      [525, "8 h 45 : premier départ. Le semi part en premier, les allures les plus lentes d'abord."],
      [575, "9 h 35 : dernier sas du semi. Plus l'allure est rapide, plus le départ est tardif."],
      [595, "9 h 55 : départs du 10 km, pendant que le semi est à mi-parcours."],
      [630, "10 h 30 : départs du 5 km. Toutes les courses convergent vers l'Arena."],
      [660, "11 h : premières arrivées, toutes distances confondues."],
      [685, "11 h 25 : tous les sas sont arrivés. L'après-midi commence en même temps pour tout le monde."]
    ];
    var lignes = [].slice.call(departs.querySelectorAll('.dp-row[data-dep]')).map(function (el) {
      var l = { el: el, dep: +el.dataset.dep, a1: +el.dataset.a1, a2: +el.dataset.a2, km: parseFloat(el.dataset.km), etat: el.querySelector('.dp-etat'), vu: null };
      l.fin = (l.a1 + l.a2) / 2;
      el.style.setProperty('--dep', pct(l.dep));
      el.style.setProperty('--a1', pct(l.a1));
      el.style.setProperty('--aw', ((l.a2 - l.a1) / (AXE1 - AXE0) * 100).toFixed(3) + '%');
      return l;
    });
    var legende = departs.querySelector('[data-dp-legende]');
    var heure = departs.querySelector('[data-dp-heure]');
    var curseur = departs.querySelector('[data-dp-curseur]');
    var nCourse = departs.querySelector('[data-dp-course]');
    var nArrives = departs.querySelector('[data-dp-arrives]');
    var bouton = departs.querySelector('[data-dp-play]');
    var t = AXE1, texteLegende = null;

    var dessine = function () {
      departs.style.setProperty('--t', pct(t));
      heure.textContent = hhmm(t);
      var enCourse = 0, arrives = 0;
      lignes.forEach(function (l) {
        var etat = '', run = 0, texte;
        if (t < l.dep) {
          texte = 'Départ ' + lisible(l.dep);
        } else if (t < l.fin) {
          etat = 'course'; run = t - l.dep; enCourse++;
          texte = 'Km ' + (l.km * run / (l.fin - l.dep)).toFixed(1).replace('.', ',');
        } else {
          etat = 'arrive'; run = l.fin - l.dep; arrives++;
          texte = '✓ Arrivé';
        }
        l.el.style.setProperty('--run', (run / (AXE1 - AXE0) * 100).toFixed(3) + '%');
        if (etat !== l.vu) {
          l.el.classList.toggle('course', etat === 'course');
          l.el.classList.toggle('arrive', etat === 'arrive');
          l.vu = etat;
        }
        if (l.etat.textContent !== texte) { l.etat.textContent = texte; }
      });
      nCourse.textContent = enCourse;
      nArrives.textContent = arrives;
      var txt = LEGENDES[0][1];
      LEGENDES.forEach(function (x) { if (t >= x[0]) { txt = x[1]; } });
      if (txt !== texteLegende) { legende.textContent = txt; texteLegende = txt; }
      curseur.value = Math.round(t);
      curseur.setAttribute('aria-valuetext', lisible(t));
    };

    var lecture = !reduit, visible = false, dejaVu = false, raf = null, dernier = 0, attente = 0;
    var boucle = function (now) {
      raf = null;
      if (!lecture || !visible) { return; }
      var dt = dernier ? Math.min(100, now - dernier) : 0;
      dernier = now;
      if (t >= AXE1) {
        attente += dt;
        if (attente > 3000) { t = AXE0; attente = 0; }
      } else {
        t = Math.min(AXE1, t + dt * VITESSE);
      }
      dessine();
      raf = requestAnimationFrame(boucle);
    };
    var relance = function () {
      bouton.textContent = lecture ? 'Pause' : 'Lecture';
      if (!raf && lecture && visible) { dernier = 0; raf = requestAnimationFrame(boucle); }
    };
    bouton.addEventListener('click', function () {
      lecture = !lecture;
      if (lecture && t >= AXE1) { t = AXE0; attente = 0; }
      relance();
    });
    curseur.addEventListener('input', function () {
      lecture = false; t = +curseur.value; dessine(); relance();
    });
    observe(departs, function (vu) {
      visible = vu;
      if (vu && !dejaVu && lecture) { dejaVu = true; t = AXE0; }
      relance();
    });
    bouton.hidden = false;
    departs.querySelector('[data-dp-bas]').hidden = false;
    dessine();
  }

  /* ---- Le plan de l'Arena ----
     Le JS pose data-etape sur la scène et relance .joue ; le mouvement est
     entièrement en CSS. Les bornes et la foule du café sont générées ici
     pour ne pas alourdir le HTML de 60 éléments décoratifs. */
  var arena = document.querySelector('[data-arena]');
  if (arena) {
    var NS = 'http://www.w3.org/2000/svg';
    var svgEl = function (nom, attrs, texte) {
      var e = document.createElementNS(NS, nom);
      Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
      if (texte) { e.textContent = texte; }
      return e;
    };
    var gBornes = arena.querySelector('[data-ar-bornes]');
    var HOTES = { 'R-02': 1, 'V-05': 1, 'A-03': 1 };
    ['R', 'F', 'V', 'A', 'P'].forEach(function (q, i) {
      for (var n = 1; n <= 8; n++) {
        var x = 260 + 104 * i + 18 + 32 * ((n - 1) % 2), y = 218 + 54 * Math.floor((n - 1) / 2);
        var id = q + '-0' + n, cible = id === 'F-07';
        gBornes.appendChild(svgEl('rect', { x: x, y: y, width: 26, height: 26, 'class': 'borne' + (cible ? ' cible' : '') + (HOTES[id] ? ' hote' : '') }));
        gBornes.appendChild(svgEl('text', { x: x + 13, y: y + 17, 'class': 'borne-n' + (cible ? ' cible-n' : '') }, '0' + n));
        if (HOTES[id]) { gBornes.appendChild(svgEl('text', { x: x, y: y - 4, 'class': 'hote-l' }, 'HÔTE')); }
      }
    });
    var gFoule = arena.querySelector('[data-ar-foule]');
    var k = 0;
    [48, 138].forEach(function (tx) {
      [216, 266, 316, 366].forEach(function (ty) {
        for (var j = 0; j < 3; j++, k++) {
          gFoule.appendChild(svgEl('rect', {
            x: -3, y: -3, width: 6, height: 6, 'class': 'p',
            style: '--x:' + (tx + 14 + 18 * j) + ';--y:' + (ty + 42) + ';--x0:' + (40 + (k * 67) % 180) + ';--d:' + (k * .06).toFixed(2) + 's'
          }));
        }
      });
    });

    var scene = arena.querySelector('.ar-scene');
    var boutons = [].slice.call(arena.querySelectorAll('.ar-etapes button'));
    var titre = arena.querySelector('[data-ar-titre]');
    var texteEtape = arena.querySelector('[data-ar-texte]');
    var lire = arena.querySelector('[data-ar-play]');
    var DUREES = [6500, 7000, 6000, 6500, 7000];
    var courante = 0, enLecture = !reduit, vuArena = false, dejaJoue = false;
    var minuteur = null, debut = 0, reste = 0;

    var arrete = function () {
      if (minuteur) { clearTimeout(minuteur); minuteur = null; reste -= performance.now() - debut; }
    };
    var synchro = function () {
      var actif = enLecture && vuArena;
      arena.classList.toggle('pause', !actif);
      if (!actif) { arrete(); return; }
      if (!minuteur) {
        debut = performance.now();
        minuteur = setTimeout(function () { minuteur = null; montre((courante + 1) % DUREES.length); }, Math.max(0, reste));
      }
    };
    var montre = function (i) {
      arrete();
      courante = i; reste = DUREES[i];
      scene.setAttribute('data-etape', i);
      scene.classList.remove('joue');
      arena.classList.remove('lecture');
      void scene.getBoundingClientRect();
      scene.classList.add('joue');
      arena.style.setProperty('--duree', DUREES[i] + 'ms');
      if (enLecture) { arena.classList.add('lecture'); }
      boutons.forEach(function (b, n) {
        if (n === i) { b.setAttribute('aria-current', 'step'); } else { b.removeAttribute('aria-current'); }
        b.classList.toggle('fait', n < i);
      });
      titre.textContent = '0' + (i + 1) + ' / 0' + boutons.length + ' · ' + boutons[i].querySelector('.ar-t').textContent;
      texteEtape.textContent = boutons[i].querySelector('.ar-d').textContent;
      synchro();
    };
    boutons.forEach(function (b, n) { b.addEventListener('click', function () { dejaJoue = true; montre(n); }); });
    lire.addEventListener('click', function () {
      enLecture = !enLecture;
      lire.textContent = enLecture ? 'Pause' : 'Lecture';
      if (enLecture && !arena.classList.contains('lecture')) { montre(courante); } else { synchro(); }
    });
    lire.textContent = enLecture ? 'Pause' : 'Lecture';
    lire.hidden = false;
    observe(arena, function (vu) {
      vuArena = vu;
      if (vu && !dejaJoue) { dejaJoue = true; montre(0); } else { synchro(); }
    });
    texteEtape.textContent = boutons[0].querySelector('.ar-d').textContent;
  }

  /* ---- L'app : le téléphone de démonstration ---- */
  var demo = document.querySelector('[data-app-demo]');
  if (demo) {
    var onglets = [].slice.call(demo.querySelectorAll('[data-onglet]'));
    var onglesTel = onglets.filter(function (b) { return b.getAttribute('role') === 'tab'; });
    var panneaux = [0, 1, 2].map(function (i) { return document.getElementById('tel-p' + i); });
    var titreTel = demo.querySelector('[data-tel-titre]');
    var TITRES = ['Mes courses', 'Mes rendez-vous', 'Mes rencontres'];
    var choisit = function (i) {
      onglets.forEach(function (b) {
        var on = +b.dataset.onglet === i;
        if (b.getAttribute('role') === 'tab') {
          b.setAttribute('aria-selected', on ? 'true' : 'false');
          b.tabIndex = on ? 0 : -1;
        } else {
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        }
      });
      panneaux.forEach(function (p, n) { p.hidden = n !== i; });
      titreTel.textContent = TITRES[i];
    };
    onglets.forEach(function (b) { b.addEventListener('click', function () { choisit(+b.dataset.onglet); }); });
    onglesTel.forEach(function (b, n) {
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) { return; }
        var i = (n + d + onglesTel.length) % onglesTel.length;
        choisit(i); onglesTel[i].focus(); e.preventDefault();
      });
    });
    choisit(0);

    var note = function (el, texte) {
      el.textContent = texte; el.hidden = false; el.tabIndex = -1; el.focus();
    };
    var proposer = demo.querySelector('[data-tl-proposer]');
    proposer.addEventListener('click', function () {
      proposer.textContent = 'Demande envoyée'; proposer.classList.remove('pri'); proposer.disabled = true;
    });
    var sortie = demo.querySelector('[data-tl-sortie]');
    sortie.addEventListener('click', function () {
      var inscrit = sortie.classList.toggle('pri') === false;
      sortie.textContent = inscrit ? 'Inscrit ✓' : 'Je viens';
    });
    demo.querySelectorAll('[data-tl-marc]').forEach(function (b) {
      if (b.tagName !== 'BUTTON') { return; }
      b.addEventListener('click', function () {
        var ligne = demo.querySelector('div[data-tl-marc]');
        if (b.dataset.tlMarc === 'ok') {
          var ok = document.createElement('span');
          ok.className = 'tl-ok'; ok.textContent = '✓ Accepté des deux côtés'; ok.tabIndex = -1;
          b.parentNode.replaceWith(ok); ok.focus();
        } else {
          ligne.hidden = true;
          note(demo.querySelector('[data-tl-marc-note]'), "Créneau décliné. Marc voit seulement que le créneau n'est plus disponible.");
        }
      });
    });
    demo.querySelectorAll('button[data-tl-ines]').forEach(function (b) {
      b.addEventListener('click', function () {
        demo.querySelector('div[data-tl-ines]').hidden = true;
        note(demo.querySelector('[data-tl-ines-note]'), b.dataset.tlInes === 'ok'
          ? 'Demande acceptée. Le contact est ouvert : vous pouvez écrire à Inès et lui proposer un créneau.'
          : "Demande laissée à expirer. Inès ne reçoit aucune notification : elle ne saura pas si vous l'avez vue.");
      });
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
