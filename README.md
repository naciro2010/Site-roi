# R.O.I — Run On Invest

Site officiel de **R.O.I — Run On Invest** : une course (5 / 10 / 21,5 km) au cœur de Paris La Défense suivie du plus grand événement de networking entre entrepreneurs de France. Septembre 2027.

> **R.O.I — L'impact après la ligne d'arrivée.**

## Identité visuelle « La Ligne »

Le site (refonte from scratch) repose sur une identité propre, pensée autour de la ligne d'arrivée — dans l'esprit affiche du studio (fond noir grainé, typo éditoriale, un seul accent) :

- **Palette** : encre `#0E0D0C` (fond dominant, grain photographique en surimpression) · craie `#EFEBE2` (texte) · orange impact `#FF4400` — un seul accent, utilisé en sobriété (soulignés, puces, barre de ligne).
- **Typographies** (100 % auto-hébergées, dossier `fonts/`) : Archivo variable pour les titres (chasse et graisse mesurées, pas de noir 900 systématique) + JetBrains Mono pour tout ce qui est label, chrono, data — à la manière des mentions `R.O.I.` / `NI UN AFTERWORK.` d'une affiche de communication.
- **Motifs signature** : la ligne (trait fin + damier d'arrivée), le logotype `R■O■I` à points carrés orange, et la convention chrono **T– / T+** (avant la ligne = la course, après la ligne = le networking). Les sections sont numérotées `T+01…T+05`.

Aucune dépendance externe (pas de Google Fonts, pas de JS tiers) — 100 % statique.

## Structure

| Chemin | Contenu |
|---|---|
| `index.html` | **Site officiel** — identité « La Ligne » — servi à la racine `/` |
| `v2/index.html` | Ancienne piste « Roadbook » — accessible sur `/v2` |
| `fonts/` | Fontes auto-hébergées (Archivo variable + JetBrains Mono) |

## Déploiement sur Railway

1. Créer un nouveau projet Railway → **Deploy from GitHub repo** → sélectionner ce repo.
2. Railway détecte le `package.json` et lance `npm start` automatiquement (serveur statique [`serve`](https://www.npmjs.com/package/serve), qui écoute sur `$PORT`).
3. Générer un domaine dans **Settings → Networking → Generate Domain**.

## Développement local

```bash
npm install
npm start
# → http://localhost:3000
```
