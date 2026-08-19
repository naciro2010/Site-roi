# R.O.I — Run On Invest

Site officiel de **R.O.I — Run On Invest** : une course (5 / 10 / 21,5 km) au cœur de Paris La Défense suivie du plus grand événement de networking entre entrepreneurs de France. Septembre 2027.

> **R.O.I — L'impact après la ligne d'arrivée.**

## Identité visuelle « La Ligne »

Le site (refonte from scratch) reprend le système des affiches R.O.I. : deux fonds grainés (encre et craie), une typo fine étirée, un seul accent orange en barre.

- **Palette** : encre `#0A0A0A` et craie `#EFEBE2`, tous deux recouverts d'un grain photographique — les sections alternent les deux fonds comme les affiches alternent noir et papier. Orange impact `#FF4400` en accent unique : la barre sous les titres, les puces, quelques CTA.
- **Typographies** (100 % auto-hébergées, dossier `fonts/`) : Archivo variable en **graisse fine (250) et chasse étendue (125 %)** pour tous les titres — le style « CE N'EST PAS UN CLUB DE RUNNING. » — + JetBrains Mono pour les labels, la nav, les boutons et toute la data (`COURSE & NETWORKING — ENTREPRENEURS`).
- **Motifs signature** : la ligne (trait fin + damier d'arrivée), le logotype `R■O■I` à points carrés orange, et la convention chrono **T– / T+** (avant la ligne = la course, après la ligne = le networking). Les sections sont numérotées `T+01…T+05`.

Aucune dépendance externe (pas de Google Fonts, pas de JS tiers) — 100 % statique.

## Structure

| Chemin | Contenu |
|---|---|
| `index.html` | **Site officiel** — identité « La Ligne » — servi à la racine `/` |
| `cv/` | **Site indépendant** de Mohamed Ennaciri (Architecte Backend & Tech Lead) — hébergé ici temporairement sur `/cv`, destiné à être extrait dans son propre repo. Design system propre (« Le Dossier » : papier ivoire, encre vert nuit, accent émeraude, Fraunces/Instrument Sans/Plex Mono, schéma d'architecture animé en SVG). Fontes auto-hébergées dans `cv/fonts/` — le dossier est 100 % autonome. |
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
