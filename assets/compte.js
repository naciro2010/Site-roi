/* ==========================================================================
   R.O.I — RUN ON INVEST · le compte
   Inscription, connexion, espace personnel. Parle à /api/… (server.js).
   Si le site est servi sans serveur (aperçu statique), on bascule sur un
   mode local : les comptes vivent dans le navigateur, et on le dit.
   ========================================================================== */
(function () {
  'use strict';

  var CLE_LOCAL = 'roi.local.comptes';
  var CLE_SESSION_LOCALE = 'roi.local.session';
  var CLE_NAV = 'roi.connecte'; // lu par roi.js pour basculer « Connexion » → « Mon espace »

  /* ---------------------------------------------------------------- API ---- */
  var api = {
    modeLocal: false,
    appel: function (methode, chemin, corps) {
      return fetch(chemin, {
        method: methode,
        headers: corps ? { 'Content-Type': 'application/json' } : {},
        body: corps ? JSON.stringify(corps) : undefined,
        credentials: 'same-origin'
      }).then(function (r) {
        var ct = r.headers.get('content-type') || '';
        // Pas de serveur derrière (hébergement statique) : 404/405 en HTML.
        if (ct.indexOf('application/json') < 0) { throw { statique: true, status: r.status }; }
        return r.json().then(function (j) { j._status = r.status; return j; });
      }).catch(function (e) {
        if (e && e.statique || e instanceof TypeError) { api.modeLocal = true; return local.appel(methode, chemin, corps); }
        throw e;
      });
    }
  };

  /* -------------------------------------------- Mode local (sans serveur) ---- */
  var local = {
    lit: function () { try { return JSON.parse(localStorage.getItem(CLE_LOCAL)) || []; } catch (e) { return []; } },
    ecrit: function (l) { try { localStorage.setItem(CLE_LOCAL, JSON.stringify(l)); } catch (e) { /* privé */ } },
    hache: function (mdp) {
      // Un hachage sommaire — ce mode ne sert qu'à l'aperçu, jamais en production.
      var h = 5381; for (var i = 0; i < mdp.length; i++) { h = ((h << 5) + h + mdp.charCodeAt(i)) | 0; }
      return 'l:' + (h >>> 0).toString(16);
    },
    vague: function () {
      var t = Date.now();
      if (t <= Date.parse('2026-11-30T23:59:59+01:00')) { return { code: 'early', nom: 'Early Bird', prix: 350 }; }
      if (t <= Date.parse('2027-01-31T23:59:59+01:00')) { return { code: 'regulier', nom: 'Régulier', prix: 400 }; }
      return { code: 'last', nom: 'Last Call', prix: 500 };
    },
    publie: function (c) { var o = {}; for (var k in c) { if (k !== 'mdp') { o[k] = c[k]; } } return o; },
    courant: function () {
      var id; try { id = localStorage.getItem(CLE_SESSION_LOCALE); } catch (e) { id = null; }
      if (!id) { return null; }
      return local.lit().filter(function (c) { return c.id === id; })[0] || null;
    },
    appel: function (methode, chemin, d) {
      d = d || {};
      var l = local.lit();
      var rep = function (status, corps) { corps._status = status; corps._local = true; return Promise.resolve(corps); };
      if (methode === 'POST' && chemin === '/api/inscription') {
        var email = String(d.email || '').trim().toLowerCase();
        var erreurs = {};
        if (!d.prenom) { erreurs.prenom = 'Ton prénom.'; }
        if (!d.nom) { erreurs.nom = 'Ton nom.'; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { erreurs.email = 'Une adresse e-mail valide.'; }
        if (String(d.mdp || '').length < 8) { erreurs.mdp = 'Huit caractères au moins.'; }
        if (!d.fonction) { erreurs.fonction = 'Ta fonction — c\'est ce que portera ton dossard.'; }
        if (!d.entreprise) { erreurs.entreprise = 'Ton entreprise, ou ton nom si tu exerces en propre.'; }
        if (!d.consent) { erreurs.consent = 'Il faut accepter les conditions de participation.'; }
        if (Object.keys(erreurs).length) { return rep(422, { erreur: 'Quelques champs à revoir.', champs: erreurs }); }
        if (l.some(function (c) { return c.email === email; })) { return rep(409, { erreur: 'Un compte existe déjà avec cette adresse.', champs: { email: 'Déjà inscrit·e ? Connecte-toi.' } }); }
        var now = new Date().toISOString();
        var c = {
          id: 'l-' + Date.now().toString(36), reference: 'E01-L' + String(l.length + 1).padStart(5, '0'),
          email: email, mdp: local.hache(String(d.mdp)), prenom: d.prenom, nom: d.nom,
          fonction: d.fonction, entreprise: d.entreprise, profil: d.profil || 'autre', voie: d.voie || 'kbis',
          siren: d.siren || '', distance: String(d.distance || '10'), formule: d.formule || 'dossard',
          vague: local.vague(), etat: 'demande', cree: now, maj: now
        };
        l.push(c); local.ecrit(l);
        try { localStorage.setItem(CLE_SESSION_LOCALE, c.id); } catch (e) { /* privé */ }
        return rep(201, { compte: local.publie(c) });
      }
      if (methode === 'POST' && chemin === '/api/connexion') {
        var em = String(d.email || '').trim().toLowerCase();
        var trouve = l.filter(function (c) { return c.email === em; })[0];
        if (!trouve || trouve.mdp !== local.hache(String(d.mdp || ''))) { return rep(401, { erreur: 'Adresse ou mot de passe inconnu.' }); }
        try { localStorage.setItem(CLE_SESSION_LOCALE, trouve.id); } catch (e) { /* privé */ }
        return rep(200, { compte: local.publie(trouve) });
      }
      if (methode === 'POST' && chemin === '/api/deconnexion') {
        try { localStorage.removeItem(CLE_SESSION_LOCALE); } catch (e) { /* privé */ }
        return rep(200, { ok: true });
      }
      if (chemin === '/api/moi') {
        var moi = local.courant();
        if (!moi) { return rep(401, { erreur: 'Pas de session.' }); }
        if (methode === 'PATCH') {
          ['prenom', 'nom', 'fonction', 'entreprise', 'profil', 'voie', 'siren', 'distance', 'formule'].forEach(function (k) {
            if (d[k] != null && (d[k] !== '' || k === 'siren')) { moi[k] = String(d[k]); }
          });
          if (d.mdp) { moi.mdp = local.hache(String(d.mdp)); }
          moi.maj = new Date().toISOString();
          local.ecrit(l);
        }
        return rep(200, { compte: local.publie(moi) });
      }
      return rep(404, { erreur: 'Route inconnue.' });
    }
  };

  /* ------------------------------------------------------------ Helpers ---- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function racine() { return document.body.getAttribute('data-racine') || '../'; }

  function marqueNav(compte) {
    try {
      if (compte) { localStorage.setItem(CLE_NAV, compte.prenom || '1'); } else { localStorage.removeItem(CLE_NAV); }
    } catch (e) { /* privé */ }
    if (window.roiNavCompte) { window.roiNavCompte(); }
  }

  function afficheErreurs(form, rep) {
    $$('.champ-err', form).forEach(function (e) { e.textContent = ''; });
    $$('.champ.err', form).forEach(function (e) { e.classList.remove('err'); });
    var global = $('.form-msg', form);
    if (rep.champs) {
      Object.keys(rep.champs).forEach(function (k) {
        var champ = form.elements[k] && (form.elements[k].closest ? form.elements[k].closest('.champ') : null);
        if (!champ && form.elements[k] && form.elements[k][0]) { champ = form.elements[k][0].closest('.champ'); }
        if (champ) { champ.classList.add('err'); var m = $('.champ-err', champ); if (m) { m.textContent = rep.champs[k]; } }
      });
    }
    if (global) {
      global.textContent = rep.erreur || '';
      global.className = 'form-msg' + (rep.erreur ? ' on' : '');
    }
    var premier = $('.champ.err input, .champ.err select', form);
    if (premier) { premier.focus(); }
  }

  function noteModeLocal() {
    if (!api.modeLocal) { return; }
    var n = $('.note-local');
    if (n) { n.hidden = false; }
  }

  function donnees(form) {
    var fd = new FormData(form), o = {};
    fd.forEach(function (v, k) { o[k] = v; });
    o.consent = !!form.elements.consent && form.elements.consent.checked;
    return o;
  }

  function enCours(form, oui) {
    var b = $('button[type=submit]', form);
    if (!b) { return; }
    b.disabled = oui;
    b.setAttribute('aria-busy', oui ? 'true' : 'false');
  }

  /* -------------------------------------------------------- Inscription ---- */
  var fInscription = $('#f-inscription');
  if (fInscription) {
    // Le dossard d'aperçu se remplit en tapant : on voit tout de suite ce qu'il portera.
    var lie = function (nom, cible, defaut) {
      var i = fInscription.elements[nom], c = $(cible);
      if (!i || !c) { return; }
      var maj = function () { c.textContent = i.value.trim() || defaut; };
      i.addEventListener('input', maj); maj();
    };
    lie('prenom', '#ap-prenom', 'Ton prénom');
    lie('nom', '#ap-nom', 'Ton nom');
    lie('fonction', '#ap-fonction', 'Ta fonction');
    lie('entreprise', '#ap-entreprise', 'Ton entreprise');
    var apNom = function () {
      var p = fInscription.elements.prenom.value.trim(), n = fInscription.elements.nom.value.trim();
      $('#ap-nomcomplet').textContent = (p || n) ? (p + ' ' + n).trim() : 'Ton nom';
    };
    fInscription.elements.prenom.addEventListener('input', apNom);
    fInscription.elements.nom.addEventListener('input', apNom);

    // Formule choisie → étiquette sur le dossard d'aperçu.
    var majFormule = function () {
      var f = fInscription.elements.formule.value;
      var e = $('#ap-formule');
      if (e) { e.textContent = f === 'premium' ? '■ Premium' : f === 'cercle' ? '■ Cercle' : '■ Accès réseau'; }
    };
    $$('input[name=formule]', fInscription).forEach(function (r) { r.addEventListener('change', majFormule); });
    majFormule();

    // Une formule peut être pré-choisie depuis la page d'accueil (?formule=premium&distance=10).
    var q = new URLSearchParams(location.search);
    ['formule', 'distance'].forEach(function (k) {
      var v = q.get(k);
      if (v && fInscription.elements[k]) {
        $$('input[name=' + k + ']', fInscription).forEach(function (r) { r.checked = (r.value === v); });
      }
    });
    majFormule();

    fInscription.addEventListener('submit', function (e) {
      e.preventDefault();
      enCours(fInscription, true);
      var d = donnees(fInscription);
      api.appel('POST', '/api/inscription', d).then(function (rep) {
        if (rep._status >= 400) { afficheErreurs(fInscription, rep); enCours(fInscription, false); return; }
        marqueNav(rep.compte);
        location.href = racine() + 'espace/' + (rep._local ? '?local=1' : '') + '#bienvenue';
      }).catch(function () {
        afficheErreurs(fInscription, { erreur: 'Le serveur ne répond pas. Réessaie, ou écris-nous : contact@runoninvest.fr' });
        enCours(fInscription, false);
      });
    });
  }

  /* ---------------------------------------------------------- Connexion ---- */
  var fConnexion = $('#f-connexion');
  if (fConnexion) {
    fConnexion.addEventListener('submit', function (e) {
      e.preventDefault();
      enCours(fConnexion, true);
      api.appel('POST', '/api/connexion', donnees(fConnexion)).then(function (rep) {
        if (rep._status >= 400) { afficheErreurs(fConnexion, rep); enCours(fConnexion, false); return; }
        marqueNav(rep.compte);
        var suite = new URLSearchParams(location.search).get('suite');
        location.href = racine() + (suite && /^[a-z-]+\/$/.test(suite) ? suite : 'espace/');
      }).catch(function () {
        afficheErreurs(fConnexion, { erreur: 'Le serveur ne répond pas. Réessaie dans un instant.' });
        enCours(fConnexion, false);
      });
    });
  }

  /* ------------------------------------------------------------- Espace ---- */
  var espace = $('#espace');
  if (espace) {
    var LIBELLES = {
      distance: { '5': '5 km — Le Sprint', '10': '10 km — La Référence', '21': '21,1 km — Le Grand Format' },
      formule: { dossard: 'Dossard', premium: 'Dossard Premium', cercle: 'Cercle R.O.I' },
      voie: { kbis: 'Extrait Kbis', sirene: 'Avis de situation SIRENE', cooptation: 'Cooptation employeur' },
      profil: { entrepreneur: 'Entrepreneur·e / indépendant·e', intrapreneur: 'Intrapreneur·e', dirigeant: 'Cadre dirigeant·e', commercial: 'Commercial·e / business developer', investisseur: 'Investisseur / conseil', autre: 'Autre' },
      etat: { demande: 1, justificatif: 2, valide: 3, paye: 4 }
    };
    var SUPPLEMENT = { dossard: 0, premium: 290, cercle: 1140 };

    var rend = function (c) {
      espace.hidden = false;
      $('#es-prenom').textContent = c.prenom;
      $('#es-ref').textContent = c.reference;
      $('#es-vague').textContent = c.vague ? c.vague.nom : '—';
      // Le dossard : recto la course, verso le profil — le même objet qu'à l'accueil.
      $('#es-d-nom').textContent = (c.prenom + ' ' + c.nom).trim();
      $('#es-d-fonction').textContent = c.fonction;
      $('#es-d-entreprise').textContent = c.entreprise;
      $('#es-d-dist').textContent = (c.distance === '21' ? '21,1' : c.distance) + ' KM';
      $('#es-d-formule').textContent = c.formule === 'premium' ? '■ Premium' : c.formule === 'cercle' ? '■ Cercle' : '■ Accès réseau actif';
      $('#es-d-num').textContent = c.reference.slice(-3);

      $('#es-distance').textContent = LIBELLES.distance[c.distance] || c.distance;
      $('#es-formule').textContent = LIBELLES.formule[c.formule] || c.formule;
      $('#es-voie').textContent = LIBELLES.voie[c.voie] || c.voie;
      $('#es-profil').textContent = LIBELLES.profil[c.profil] || c.profil;
      var base = c.vague ? c.vague.prix : 0;
      var total = base + (SUPPLEMENT[c.formule] || 0);
      $('#es-prix').textContent = total + ' €' + (c.formule !== 'dossard' ? ' (' + base + ' € + ' + SUPPLEMENT[c.formule] + ' €)' : '');
      $('#es-cercle-note').hidden = c.formule !== 'cercle';

      // Les quatre étapes du dossier.
      var n = LIBELLES.etat[c.etat] || 1;
      $$('.etape-suivi', espace).forEach(function (el, i) {
        el.classList.toggle('fait', i + 1 < n);
        el.classList.toggle('cours', i + 1 === n);
        el.removeAttribute('aria-current');
        if (i + 1 === n) { el.setAttribute('aria-current', 'step'); }
      });
      var mailto = $('#es-justif');
      if (mailto) {
        mailto.href = 'mailto:dossiers@runoninvest.fr?subject=' + encodeURIComponent('Justificatif — dossier ' + c.reference) +
          '&body=' + encodeURIComponent('Bonjour,\n\nCi-joint mon justificatif (' + (LIBELLES.voie[c.voie] || c.voie) + ') pour le dossier ' + c.reference + '.\n\n' + c.prenom + ' ' + c.nom + '\n' + c.fonction + ' — ' + c.entreprise);
      }

      // Formules : la carte de la formule courante est marquée.
      $$('.formule-choix', espace).forEach(function (el) {
        var f = el.getAttribute('data-formule');
        el.classList.toggle('courante', f === c.formule);
        var b = $('button', el);
        if (b) {
          b.disabled = (f === c.formule);
          b.textContent = f === c.formule ? 'Ta formule' : (f === 'cercle' ? 'Demander une place' : f === 'premium' ? 'Passer en Premium' : 'Revenir au Dossard');
        }
      });

      // Formulaire de profil pré-rempli.
      var fp = $('#f-profil');
      if (fp) {
        ['prenom', 'nom', 'fonction', 'entreprise', 'profil', 'voie', 'siren'].forEach(function (k) { if (fp.elements[k]) { fp.elements[k].value = c[k] || ''; } });
        $$('input[name=distance]', fp).forEach(function (r) { r.checked = (r.value === c.distance); });
      }
      marqueNav(c);
    };

    var charge = function () {
      api.appel('GET', '/api/moi').then(function (rep) {
        noteModeLocal();
        if (rep._status >= 400) {
          marqueNav(null);
          location.replace(racine() + 'connexion/?suite=espace/');
          return;
        }
        rend(rep.compte);
        if (location.hash === '#bienvenue') { var b = $('#es-bienvenue'); if (b) { b.hidden = false; } }
      }).catch(function () {
        location.replace(racine() + 'connexion/?suite=espace/');
      });
    };
    charge();

    // Changer de formule.
    $$('.formule-choix button', espace).forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.closest('.formule-choix').getAttribute('data-formule');
        b.disabled = true;
        api.appel('PATCH', '/api/moi', { formule: f }).then(function (rep) {
          if (rep._status < 400) { rend(rep.compte); var m = $('#es-formule-msg'); if (m) { m.textContent = f === 'cercle' ? 'Demande transmise — le Cercle se confirme sur cooptation, on te répond sous 48 h ouvrées.' : 'Formule mise à jour.'; m.className = 'form-msg ok on'; } }
        });
      });
    });

    // Mettre à jour le profil.
    var fProfil = $('#f-profil');
    if (fProfil) {
      fProfil.addEventListener('submit', function (e) {
        e.preventDefault();
        enCours(fProfil, true);
        var d = donnees(fProfil);
        if (!d.mdp) { delete d.mdp; }
        api.appel('PATCH', '/api/moi', d).then(function (rep) {
          enCours(fProfil, false);
          if (rep._status >= 400) { afficheErreurs(fProfil, rep); return; }
          rend(rep.compte);
          if (fProfil.elements.mdp) { fProfil.elements.mdp.value = ''; }
          afficheErreurs(fProfil, {});
          var m = $('.form-msg', fProfil); m.textContent = 'Enregistré. Ton dossard est à jour.'; m.className = 'form-msg ok on';
        });
      });
    }

    // Se déconnecter.
    $$('.deconnexion').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        api.appel('POST', '/api/deconnexion').then(function () {
          marqueNav(null);
          location.href = racine();
        });
      });
    });
  }
})();
