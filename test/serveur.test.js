/* Parcours complet du compte contre le serveur, sur un fichier de données jetable.
   Lancer : npm test */
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.ROI_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'roi-test-'));
process.env.PORT = '0';
const serveur = require('../server.js');

function appel(base, methode, chemin, corps, cookie) {
  return fetch(base + chemin, {
    method: methode,
    headers: Object.assign({}, corps ? { 'Content-Type': 'application/json' } : {}, cookie ? { Cookie: cookie } : {}),
    body: corps ? JSON.stringify(corps) : undefined,
    redirect: 'manual'
  });
}

(async function () {
  await new Promise(function (r) { serveur.listen(0, '127.0.0.1', r); });
  const base = 'http://127.0.0.1:' + serveur.address().port;
  let echecs = 0;
  async function t(nom, fn) {
    try { await fn(); console.log('  ✓ ' + nom); } catch (e) { echecs++; console.log('  ✗ ' + nom + '\n    ' + (e && e.message)); }
  }

  console.log('statique');
  await t('/ sert l\'accueil', async function () {
    const r = await appel(base, 'GET', '/');
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type'), /text\/html/);
    assert.match(await r.text(), /Run On Investment/);
  });
  await t('/pour-qui redirige vers /pour-qui/', async function () {
    const r = await appel(base, 'GET', '/pour-qui');
    assert.equal(r.status, 301);
    assert.equal(r.headers.get('location'), '/pour-qui/');
  });
  await t('/inscription/, /connexion/, /espace/ répondent', async function () {
    for (const p of ['/inscription/', '/connexion/', '/espace/']) {
      assert.equal((await appel(base, 'GET', p)).status, 200, p);
    }
  });
  await t('les fichiers sensibles sont cachés', async function () {
    for (const p of ['/server.js', '/package.json', '/data/comptes.json', '/.gitignore', '/../etc/passwd']) {
      const r = await appel(base, 'GET', p);
      assert.ok(r.status === 404 || r.status === 400, p + ' → ' + r.status);
    }
  });
  await t('woff2 servi avec le bon type', async function () {
    const r = await appel(base, 'GET', '/fonts/jetbrains-mono-latin-500-normal.woff2');
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('content-type'), 'font/woff2');
  });

  console.log('api');
  let cookie = null;
  let reference = null;
  const email = 'test+' + Date.now() + '@runoninvest.fr';
  await t('inscription incomplète → 422 avec les champs', async function () {
    const r = await appel(base, 'POST', '/api/inscription', { email: 'pas-un-mail', mdp: 'court' });
    assert.equal(r.status, 422);
    const j = await r.json();
    assert.ok(j.champs.email && j.champs.mdp && j.champs.prenom && j.champs.consent);
  });
  await t('inscription complète → 201 + cookie de session', async function () {
    const r = await appel(base, 'POST', '/api/inscription', {
      prenom: 'Léa', nom: 'Martin', email: email, mdp: 'motdepasse1', fonction: 'Fondatrice', entreprise: 'Nordwind',
      profil: 'entrepreneur', voie: 'kbis', distance: '10', formule: 'premium', consent: true
    });
    assert.equal(r.status, 201);
    const j = await r.json();
    assert.equal(j.compte.email, email);
    assert.equal(j.compte.formule, 'premium');
    assert.match(j.compte.reference, /^E01-\d{6}$/);
    assert.equal(j.compte.etat, 'demande');
    assert.equal(j.compte.mdp, undefined, 'le hachage ne sort jamais');
    reference = j.compte.reference;
    cookie = (r.headers.get('set-cookie') || '').split(';')[0];
    assert.match(cookie, /^roi_session=[0-9a-f]{64}$/);
  });
  await t('même e-mail → 409', async function () {
    const r = await appel(base, 'POST', '/api/inscription', {
      prenom: 'A', nom: 'B', email: email.toUpperCase(), mdp: 'motdepasse1', fonction: 'x', entreprise: 'y', consent: true
    });
    assert.equal(r.status, 409);
  });

  console.log('le pont vers l\'app');
  await t('GET /api/dossier → 200, le dossard sans rien de privé, CORS ouvert', async function () {
    // Référence en minuscules et e-mail en majuscules avec des espaces : le serveur normalise.
    const r = await appel(base, 'GET', '/api/dossier?reference=' + encodeURIComponent(' ' + reference.toLowerCase()) + '&email=' + encodeURIComponent(email.toUpperCase() + ' '));
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('access-control-allow-origin'), '*');
    assert.match(r.headers.get('vary') || '', /Origin/);
    const j = await r.json();
    assert.equal(j.dossier.reference, reference);
    assert.equal(j.dossier.prenom, 'Léa');
    assert.equal(j.dossier.nom, 'Martin');
    assert.equal(j.dossier.fonction, 'Fondatrice');
    assert.equal(j.dossier.entreprise, 'Nordwind');
    assert.equal(j.dossier.profil, 'entrepreneur');
    assert.equal(j.dossier.distance, '10');
    assert.equal(j.dossier.formule, 'premium');
    assert.equal(j.dossier.etat, 'demande');
    assert.equal(j.dossier.edition, '01');
    assert.ok(j.dossier.vague && j.dossier.vague.code, 'la vague est là');
    ['email', 'mdp', 'id', 'siren', 'voie', 'cree', 'maj'].forEach(function (k) {
      assert.equal(j.dossier[k], undefined, k + ' ne sort jamais');
    });
  });
  await t('HEAD /api/dossier → 200 sans corps', async function () {
    const r = await appel(base, 'HEAD', '/api/dossier?reference=' + reference + '&email=' + encodeURIComponent(email));
    assert.equal(r.status, 200);
    assert.equal(await r.text(), '');
  });
  await t('GET /api/dossier mauvais e-mail → 404, même message', async function () {
    const r = await appel(base, 'GET', '/api/dossier?reference=' + reference + '&email=autre%40runoninvest.fr');
    assert.equal(r.status, 404);
    assert.equal((await r.json()).erreur, 'Aucun dossier avec cette référence et cet e-mail.');
    const r2 = await appel(base, 'GET', '/api/dossier?reference=E01-999999&email=' + encodeURIComponent(email));
    assert.equal(r2.status, 404);
    assert.equal((await r2.json()).erreur, 'Aucun dossier avec cette référence et cet e-mail.');
  });
  await t('GET /api/dossier sans référence ou sans e-mail → 400', async function () {
    for (const q of ['', '?reference=' + reference, '?email=' + encodeURIComponent(email)]) {
      const r = await appel(base, 'GET', '/api/dossier' + q);
      assert.equal(r.status, 400, q || '(vide)');
      assert.equal((await r.json()).erreur, 'Référence et e-mail requis.');
    }
  });
  await t('OPTIONS /api/dossier → 204 + en-têtes CORS', async function () {
    const r = await appel(base, 'OPTIONS', '/api/dossier');
    assert.equal(r.status, 204);
    assert.equal(r.headers.get('access-control-allow-origin'), '*');
    assert.equal(r.headers.get('access-control-allow-methods'), 'GET, HEAD, OPTIONS');
    assert.equal(r.headers.get('access-control-max-age'), '86400');
  });
  await t('POST /api/dossier → 405 : l\'app lit, elle n\'écrit jamais', async function () {
    const r = await appel(base, 'POST', '/api/dossier', { reference: reference });
    assert.equal(r.status, 405);
  });

  console.log('session');
  await t('GET /api/moi avec le cookie', async function () {
    const r = await appel(base, 'GET', '/api/moi', null, cookie);
    assert.equal(r.status, 200);
    assert.equal((await r.json()).compte.prenom, 'Léa');
  });
  await t('GET /api/moi sans cookie → 401', async function () {
    assert.equal((await appel(base, 'GET', '/api/moi')).status, 401);
  });
  await t('PATCH /api/moi change formule et distance, ignore les valeurs hors liste', async function () {
    const r = await appel(base, 'PATCH', '/api/moi', { formule: 'cercle', distance: '42', fonction: 'CEO' }, cookie);
    assert.equal(r.status, 200);
    const c = (await r.json()).compte;
    assert.equal(c.formule, 'cercle');
    assert.equal(c.distance, '10');
    assert.equal(c.fonction, 'CEO');
  });
  await t('déconnexion puis /api/moi → 401', async function () {
    const r = await appel(base, 'POST', '/api/deconnexion', null, cookie);
    assert.equal(r.status, 200);
    assert.equal((await appel(base, 'GET', '/api/moi', null, cookie)).status, 401);
  });
  await t('connexion mauvais mot de passe → 401', async function () {
    const r = await appel(base, 'POST', '/api/connexion', { email: email, mdp: 'faux' });
    assert.equal(r.status, 401);
  });
  await t('connexion → 200 + nouvelle session', async function () {
    const r = await appel(base, 'POST', '/api/connexion', { email: email, mdp: 'motdepasse1' });
    assert.equal(r.status, 200);
    cookie = (r.headers.get('set-cookie') || '').split(';')[0];
    const r2 = await appel(base, 'GET', '/api/moi', null, cookie);
    assert.equal((await r2.json()).compte.formule, 'cercle');
  });
  await t('les données sont sur disque, mot de passe haché', async function () {
    const b = JSON.parse(fs.readFileSync(path.join(process.env.ROI_DATA_DIR, 'comptes.json'), 'utf8'));
    assert.equal(b.comptes.length, 1);
    assert.match(b.comptes[0].mdp, /^[0-9a-f]{32}:[0-9a-f]{128}$/);
  });
  await t('au-delà de dix lectures par minute → 429', async function () {
    let dernier = 0;
    for (let i = 0; i < 12 && dernier !== 429; i++) {
      dernier = (await appel(base, 'GET', '/api/dossier?reference=' + reference + '&email=' + encodeURIComponent(email))).status;
    }
    assert.equal(dernier, 429);
  });
  await t('route inconnue → 404 JSON', async function () {
    const r = await appel(base, 'GET', '/api/rien');
    assert.equal(r.status, 404);
    assert.match(r.headers.get('content-type'), /json/);
  });

  serveur.close();
  fs.rmSync(process.env.ROI_DATA_DIR, { recursive: true, force: true });
  console.log(echecs ? '\n' + echecs + ' échec(s)' : '\nTout passe.');
  process.exit(echecs ? 1 : 0);
})();
