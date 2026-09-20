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
    assert.match(await r.text(), /Run On Invest/);
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
    cookie = (r.headers.get('set-cookie') || '').split(';')[0];
    assert.match(cookie, /^roi_session=[0-9a-f]{64}$/);
  });
  await t('même e-mail → 409', async function () {
    const r = await appel(base, 'POST', '/api/inscription', {
      prenom: 'A', nom: 'B', email: email.toUpperCase(), mdp: 'motdepasse1', fonction: 'x', entreprise: 'y', consent: true
    });
    assert.equal(r.status, 409);
  });
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
