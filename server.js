/* ==========================================================================
   R.O.I — RUN ON INVESTMENT · serveur
   Sert le site statique et expose une petite API de compte (inscription,
   connexion, espace personnel). Zéro dépendance : Node ≥ 18 suffit.

   Données : un fichier JSON (data/comptes.json par défaut, ROI_DATA_DIR
   pour le déplacer — sur Railway, monter un volume dessus). Les mots de
   passe sont hachés en scrypt, la session vit dans un cookie HttpOnly.

   Ce n'est pas la billetterie : le paiement arrive après la validation du
   dossier, hors de ce serveur. Ici on crée le compte, on garde la vague,
   on suit le dossier. Et on tend un pont vers l'app R.O.I (GET /api/dossier) :
   elle lit le dossier, elle ne l'écrit jamais.
   ========================================================================== */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RACINE = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.ROI_DATA_DIR || path.join(RACINE, 'data');
const FICHIER = path.join(DATA_DIR, 'comptes.json');
const COOKIE = 'roi_session';
const DUREE_SESSION = 30 * 24 * 3600 * 1000; // 30 jours

const DISTANCES = ['5', '10', '21'];
const FORMULES = ['dossard', 'premium', 'cercle'];
const PROFILS = ['entrepreneur', 'intrapreneur', 'dirigeant', 'commercial', 'investisseur', 'autre'];
const VOIES = ['kbis', 'sirene', 'cooptation'];

/* ---- Stockage : lecture/écriture atomique du fichier JSON ---- */
let base = null;
function charge() {
  if (base) { return base; }
  try {
    base = JSON.parse(fs.readFileSync(FICHIER, 'utf8'));
  } catch (e) {
    base = { suite: 1001, comptes: [], sessions: {} };
  }
  base.suite = base.suite || 1001;
  base.comptes = base.comptes || [];
  base.sessions = base.sessions || {};
  return base;
}
function sauve() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = FICHIER + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(base, null, 1));
  fs.renameSync(tmp, FICHIER);
}

/* ---- Mots de passe ---- */
function hache(mdp) {
  const sel = crypto.randomBytes(16);
  const cle = crypto.scryptSync(mdp, sel, 64);
  return sel.toString('hex') + ':' + cle.toString('hex');
}
function verifie(mdp, stocke) {
  const [selHex, cleHex] = String(stocke).split(':');
  if (!selHex || !cleHex) { return false; }
  const attendu = Buffer.from(cleHex, 'hex');
  const cle = crypto.scryptSync(mdp, Buffer.from(selHex, 'hex'), attendu.length);
  return attendu.length === cle.length && crypto.timingSafeEqual(attendu, cle);
}

/* ---- Sessions ---- */
function litCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(function (p) {
    const i = p.indexOf('=');
    if (i > 0) { out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }
  });
  return out;
}
function estHttps(req) {
  return (req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
}
function poseSession(req, res, id) {
  const b = charge();
  const jeton = crypto.randomBytes(32).toString('hex');
  b.sessions[jeton] = { id: id, exp: Date.now() + DUREE_SESSION };
  // Purge des sessions périmées au passage.
  Object.keys(b.sessions).forEach(function (k) { if (b.sessions[k].exp < Date.now()) { delete b.sessions[k]; } });
  sauve();
  res.setHeader('Set-Cookie', COOKIE + '=' + jeton + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + (DUREE_SESSION / 1000) + (estHttps(req) ? '; Secure' : ''));
}
function videSession(req, res) {
  const jeton = litCookies(req)[COOKIE];
  const b = charge();
  if (jeton && b.sessions[jeton]) { delete b.sessions[jeton]; sauve(); }
  res.setHeader('Set-Cookie', COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}
function compteCourant(req) {
  const jeton = litCookies(req)[COOKIE];
  if (!jeton) { return null; }
  const b = charge();
  const s = b.sessions[jeton];
  if (!s || s.exp < Date.now()) { return null; }
  return b.comptes.find(function (c) { return c.id === s.id; }) || null;
}

/* ---- Garde-fou sur la connexion et la lecture du dossier : 10 essais / minute / IP ---- */
const essais = new Map();
function tropDEssais(req) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const now = Date.now();
  const l = (essais.get(ip) || []).filter(function (t) { return now - t < 60000; });
  l.push(now);
  essais.set(ip, l);
  return l.length > 10;
}

/* ---- Utilitaires HTTP ---- */
function json(res, code, corps, req) {
  const s = JSON.stringify(corps);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(s)
  });
  res.end(req && req.method === 'HEAD' ? undefined : s);
}
function litCorps(req) {
  return new Promise(function (resolve, reject) {
    let taille = 0; const morceaux = [];
    req.on('data', function (c) {
      taille += c.length;
      if (taille > 64 * 1024) { reject(new Error('trop gros')); req.destroy(); return; }
      morceaux.push(c);
    });
    req.on('end', function () {
      if (!morceaux.length) { return resolve({}); }
      try { resolve(JSON.parse(Buffer.concat(morceaux).toString('utf8'))); }
      catch (e) { reject(new Error('json')); }
    });
    req.on('error', reject);
  });
}
function texte(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 120); }
function emailValide(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 160; }
function dansListe(v, liste, defaut) { return liste.indexOf(v) >= 0 ? v : defaut; }

function vagueCourante() {
  // Les dates des vagues vivent aussi dans index.html — garder les deux alignées.
  const t = Date.now();
  if (t <= Date.parse('2026-11-30T23:59:59+01:00')) { return { code: 'early', nom: 'Early Bird', prix: 350 }; }
  if (t <= Date.parse('2027-01-31T23:59:59+01:00')) { return { code: 'regulier', nom: 'Régulier', prix: 400 }; }
  return { code: 'last', nom: 'Last Call', prix: 500 };
}

/* Ce que le navigateur a le droit de voir d'un compte : jamais le hachage. */
function publie(c) {
  return {
    id: c.id, reference: c.reference, prenom: c.prenom, nom: c.nom, email: c.email,
    fonction: c.fonction, entreprise: c.entreprise, profil: c.profil, voie: c.voie, siren: c.siren,
    distance: c.distance, formule: c.formule, vague: c.vague, etat: c.etat,
    cree: c.cree, maj: c.maj
  };
}

/* Ce que l'app a le droit de voir d'un dossier : ni e-mail, ni id, ni SIREN,
   ni hachage, ni dates. De quoi reconnaître un dossard, rien de plus. */
function publieDossier(c) {
  return {
    reference: c.reference, prenom: c.prenom, nom: c.nom,
    fonction: c.fonction, entreprise: c.entreprise, profil: c.profil,
    distance: c.distance, formule: c.formule, vague: c.vague, etat: c.etat,
    edition: '01'
  };
}

/* ---- Routes API ---- */
async function api(req, res, url) {
  const route = req.method + ' ' + url.pathname;

  if (route === 'GET /api/sante' || route === 'HEAD /api/sante') {
    return json(res, 200, { ok: true, vague: vagueCourante() }, req);
  }

  if (route === 'POST /api/inscription') {
    let d; try { d = await litCorps(req); } catch (e) { return json(res, 400, { erreur: 'Requête illisible.' }); }
    const email = texte(d.email, 160).toLowerCase();
    const mdp = String(d.mdp || '');
    const prenom = texte(d.prenom, 60), nom = texte(d.nom, 60);
    const fonction = texte(d.fonction, 80), entreprise = texte(d.entreprise, 80);
    const erreurs = {};
    if (!prenom) { erreurs.prenom = 'Votre prénom.'; }
    if (!nom) { erreurs.nom = 'Votre nom.'; }
    if (!emailValide(email)) { erreurs.email = 'Une adresse e-mail valide.'; }
    if (mdp.length < 8) { erreurs.mdp = 'Huit caractères au minimum.'; }
    if (!fonction) { erreurs.fonction = 'Votre fonction, telle qu\'elle figurera sur le dossard.'; }
    if (!entreprise) { erreurs.entreprise = 'Votre entreprise, ou votre nom si vous exercez en propre.'; }
    if (!d.consent) { erreurs.consent = 'Il faut accepter les conditions de participation.'; }
    if (Object.keys(erreurs).length) { return json(res, 422, { erreur: 'Quelques champs à revoir.', champs: erreurs }); }

    const b = charge();
    if (b.comptes.some(function (c) { return c.email === email; })) {
      return json(res, 409, { erreur: 'Un compte existe déjà avec cette adresse.', champs: { email: 'Adresse déjà utilisée. Connectez-vous.' } });
    }
    const n = b.suite++;
    const now = new Date().toISOString();
    const c = {
      id: crypto.randomUUID(),
      reference: 'E01-' + String(n).padStart(6, '0'),
      email: email, mdp: hache(mdp), prenom: prenom, nom: nom,
      fonction: fonction, entreprise: entreprise,
      profil: dansListe(d.profil, PROFILS, 'autre'),
      voie: dansListe(d.voie, VOIES, 'kbis'),
      siren: texte(d.siren, 20).replace(/\s+/g, ''),
      distance: dansListe(String(d.distance), DISTANCES, '10'),
      formule: dansListe(d.formule, FORMULES, 'dossard'),
      vague: vagueCourante(),
      etat: 'demande',           // demande → justificatif → valide → paye
      cree: now, maj: now
    };
    b.comptes.push(c);
    sauve();
    poseSession(req, res, c.id);
    return json(res, 201, { compte: publie(c) });
  }

  if (route === 'POST /api/connexion') {
    if (tropDEssais(req)) { return json(res, 429, { erreur: 'Trop d\'essais. Reprends dans une minute.' }); }
    let d; try { d = await litCorps(req); } catch (e) { return json(res, 400, { erreur: 'Requête illisible.' }); }
    const email = texte(d.email, 160).toLowerCase();
    const c = charge().comptes.find(function (x) { return x.email === email; });
    if (!c || !verifie(String(d.mdp || ''), c.mdp)) {
      return json(res, 401, { erreur: 'Adresse ou mot de passe inconnu.' });
    }
    poseSession(req, res, c.id);
    return json(res, 200, { compte: publie(c) });
  }

  if (route === 'POST /api/deconnexion') {
    videSession(req, res);
    return json(res, 200, { ok: true });
  }

  if (route === 'GET /api/moi') {
    const c = compteCourant(req);
    if (!c) { return json(res, 401, { erreur: 'Pas de session.' }); }
    return json(res, 200, { compte: publie(c) });
  }

  if (route === 'PATCH /api/moi') {
    const c = compteCourant(req);
    if (!c) { return json(res, 401, { erreur: 'Pas de session.' }); }
    let d; try { d = await litCorps(req); } catch (e) { return json(res, 400, { erreur: 'Requête illisible.' }); }
    if (d.prenom != null) { c.prenom = texte(d.prenom, 60) || c.prenom; }
    if (d.nom != null) { c.nom = texte(d.nom, 60) || c.nom; }
    if (d.fonction != null) { c.fonction = texte(d.fonction, 80) || c.fonction; }
    if (d.entreprise != null) { c.entreprise = texte(d.entreprise, 80) || c.entreprise; }
    if (d.profil != null) { c.profil = dansListe(d.profil, PROFILS, c.profil); }
    if (d.voie != null) { c.voie = dansListe(d.voie, VOIES, c.voie); }
    if (d.siren != null) { c.siren = texte(d.siren, 20).replace(/\s+/g, ''); }
    if (d.distance != null) { c.distance = dansListe(String(d.distance), DISTANCES, c.distance); }
    if (d.formule != null) { c.formule = dansListe(d.formule, FORMULES, c.formule); }
    if (d.mdp) {
      if (String(d.mdp).length < 8) { return json(res, 422, { erreur: 'Huit caractères au minimum.', champs: { mdp: 'Huit caractères au minimum.' } }); }
      c.mdp = hache(String(d.mdp));
    }
    c.maj = new Date().toISOString();
    sauve();
    return json(res, 200, { compte: publie(c) });
  }

  /* ---- Le pont vers l'app ----
     L'app R.O.I (annuaire, rencontres, sorties — toute l'année) vit sur une
     autre origine. Elle lit le dossier, elle ne l'écrit jamais : un seul
     point d'entrée public, en lecture, verrouillé par le couple
     référence + e-mail. Jamais l'e-mail, l'id, le SIREN, le hachage ni les
     dates dans la réponse — le strict nécessaire pour reconnaître un dossard. */
  if (url.pathname === '/api/dossier') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Vary', 'Origin');
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Max-Age': '86400'
      });
      return res.end();
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD, OPTIONS');
      return json(res, 405, { erreur: 'Méthode non autorisée.' }, req);
    }
    if (tropDEssais(req)) { return json(res, 429, { erreur: 'Trop d\'essais. Reprends dans une minute.' }, req); }
    const reference = texte(url.searchParams.get('reference'), 20).toUpperCase();
    const email = texte(url.searchParams.get('email'), 160).toLowerCase();
    if (!reference || !email) { return json(res, 400, { erreur: 'Référence et e-mail requis.' }, req); }
    const c = charge().comptes.find(function (x) {
      return String(x.reference).toUpperCase() === reference && x.email === email;
    });
    // Même message que la référence ou l'e-mail soit faux : on n'énumère pas.
    if (!c) { return json(res, 404, { erreur: 'Aucun dossier avec cette référence et cet e-mail.' }, req); }
    return json(res, 200, { dossier: publieDossier(c) }, req);
  }

  return json(res, 404, { erreur: 'Route inconnue.' });
}

/* ---- Statique ---- */
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.webmanifest': 'application/manifest+json', '.pdf': 'application/pdf'
};
const INTERDIT = ['data', 'node_modules', 'server.js', 'package.json', 'package-lock.json'];

function statique(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end();
  }
  let chemin;
  try { chemin = decodeURIComponent(url.pathname); } catch (e) { res.writeHead(400); return res.end(); }
  const segments = chemin.split('/').filter(Boolean);
  if (segments.some(function (s) { return s === '..' || s.startsWith('.'); }) || INTERDIT.indexOf(segments[0]) >= 0) {
    res.writeHead(404); return res.end();
  }
  let fichier = path.join(RACINE, ...segments);
  let st = null;
  try { st = fs.statSync(fichier); } catch (e) { /* absent */ }
  if (st && st.isDirectory()) {
    // /pour-qui → /pour-qui/ : les liens relatifs des pages en dépendent.
    if (!chemin.endsWith('/')) {
      res.writeHead(301, { Location: chemin + '/' + url.search }); return res.end();
    }
    fichier = path.join(fichier, 'index.html');
    try { st = fs.statSync(fichier); } catch (e) { st = null; }
  }
  if (!st || !st.isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<!doctype html><meta charset="utf-8"><title>404 — R.O.I</title><body style="font-family:system-ui;background:#070707;color:#EFEBE2;padding:10vh 8vw"><p style="font:700 12px/1 monospace;letter-spacing:.2em;color:#FF4400">404</p><h1 style="font-weight:300;text-transform:uppercase">Hors parcours.</h1><p><a href="/" style="color:#EFEBE2">← Retour au départ</a></p>');
  }
  const ext = path.extname(fichier).toLowerCase();
  const entetes = {
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Content-Length': st.size,
    'Cache-Control': ext === '.html' ? 'no-cache' : (ext === '.woff2' || ext === '.jpg' ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'),
    'X-Content-Type-Options': 'nosniff'
  };
  res.writeHead(200, entetes);
  if (req.method === 'HEAD') { return res.end(); }
  fs.createReadStream(fichier).pipe(res);
}

/* ---- Serveur ---- */
const serveur = http.createServer(function (req, res) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  if (url.pathname.startsWith('/api/')) {
    api(req, res, url).catch(function (e) {
      console.error(e);
      json(res, 500, { erreur: 'Erreur côté serveur.' });
    });
  } else {
    statique(req, res, url);
  }
});

if (require.main === module) {
  serveur.listen(PORT, '0.0.0.0', function () {
    console.log('R.O.I — Run On Investment · http://localhost:' + PORT + ' · données : ' + FICHIER);
  });
}

module.exports = serveur;
