# R.O.I. — Run On Invest

Site officiel de **R.O.I. — Run On Invest** : une course (5 / 10 / 21,5 km) au cœur de Paris La Défense suivie du plus grand événement de networking entre entrepreneurs de France. Septembre 2027.

## Structure

| Chemin | Contenu |
|---|---|
| `index.html` | **Site officiel** (v1) — servi à la racine `/` |
| `v2/index.html` | **V2 « Roadbook »** — refonte design, accessible sur `/v2` |

Les deux pages sont 100% statiques (HTML/CSS/JS vanilla, aucun build).

## Déploiement sur Railway

1. Créer un nouveau projet Railway → **Deploy from GitHub repo** → sélectionner ce repo.
2. Railway détecte le `package.json` et lance `npm start` automatiquement (serveur statique [`serve`](https://www.npmjs.com/package/serve), qui écoute sur `$PORT`).
3. Générer un domaine dans **Settings → Networking → Generate Domain**.

- `https://<domaine>/` → site officiel (v1)
- `https://<domaine>/v2` → nouvelle version

## Passer la v2 en site officiel

Quand la v2 est validée, il suffit d'inverser les fichiers :

```bash
mv index.html v1.html
cp v2/index.html index.html
```

## Développement local

```bash
npm install
npm start
# → http://localhost:3000
```
