# R.O.I — Run On Investment

Site officiel de **R.O.I — Run On Investment** : un événement de networking pour entrepreneurs, dirigeants, commerciaux et investisseurs. Le matin, une course de 5, 10 ou 21,1 km entre les tours de Paris La Défense. L'après-midi, des rencontres d'affaires dans Paris La Défense Arena, avec celles et ceux qui viennent de courir. Un seul dossard pour les deux. Première édition en septembre 2027.

> **R.O.I — Une course le matin. Des affaires l'après-midi.**

Le site n'est plus 100 % statique : un petit serveur Node sans dépendance (`server.js`) le sert **et** porte l'inscription, la connexion et l'espace personnel. Voir « Le compte » plus bas.

## Identité visuelle « La Ligne »

Le site (refonte from scratch) reprend le système des affiches R.O.I. : deux fonds grainés (encre et craie), une typo fine étirée, un seul accent orange en barre.

- **Palette** : encre `#0A0A0A` et craie `#EFEBE2`, tous deux recouverts d'un grain photographique — les sections alternent les deux fonds comme les affiches alternent noir et papier. Orange impact `#FF4400` en accent unique : la barre sous les titres, les puces, quelques CTA.
- **Typographies** (100 % auto-hébergées, dossier `fonts/`) : Archivo variable en **graisse fine (250) et chasse étendue (125 %)** pour tous les titres — le style « CE N'EST PAS UN CLUB DE RUNNING. » — + JetBrains Mono pour les labels, la nav, les boutons et toute la data (`COURSE & NETWORKING — ENTREPRENEURS`).
- **Motifs signature** : la ligne (trait fin + damier d'arrivée), le logotype `R■O■I` à points carrés orange. Les sections de l'accueil sont numérotées `01…08` avec de vraies heures dans les programmes ; la convention chrono **T– / T+** reste sur `/pour-qui` et `/espace` (l'accès se règle *avant* la ligne).

Aucune dépendance externe (pas de Google Fonts, pas de JS tiers, pas de paquet npm).

## Les quatre gestes d'interface

Tout part du même motif : **la ligne**. Rien n'est décoratif au sens strict — chaque élément dit quelque chose de l'événement.

1. **La typo évidée.** Les titres marchent en deux temps : le premier plein, le second tracé au contour (`.creuse`, via `-webkit-text-stroke`). C'est le geste des affiches. En dessous de 620 px le corps devient trop petit pour qu'un contour reste lisible : on revient au plein.
2. **La ligne de progression.** Le filet sous la nav se remplit d'orange à mesure qu'on descend, **damier d'arrivée en tête**. La largeur passe par la variable `--progres` posée en JS ; la nav surligne au passage la section courante.
3. **Le dossard recto/verso.** « Un seul dossard : il te fait franchir la ligne, puis il devient ton profil » — la phrase existait, l'objet non. Recto la course (numéro, chrono, œillets d'épingle), verso le réseau (nom, fonction, entreprise). **Le même papier des deux côtés** : c'est justement l'argument. Retournable au clic et au clavier (`aria-pressed`).

## Le positionnement : un événement de networking, pas une course avec afterwork

Le contenu dit d'abord ce qu'est R.O.I, en une phrase, dès le haut de page : un événement de networking pour entrepreneurs, dirigeants, commerciaux et investisseurs, qui commence par une course. Le ton est direct et professionnel : phrases courtes, peu de métaphores, une idée par paragraphe. La baseline des affiches (« L'impact après la ligne d'arrivée ») reste sur le sceau du concept ; la nav appelle la première section « Le concept ».

### Ce qu'on a emprunté aux formats qui existent déjà

Le contenu de l'accueil (programme de l'après-midi `04.2`, les règles de `04.3`, le laïus de `06`) adapte ce qui marche chez ceux qui courent déjà ensemble — sans les nommer sur le site :

| Format | Ce qu'on en garde |
|---|---|
| [Founders Running Club](https://foundersrc.com/) — 5–10 km « easy », puis café et *talks*, dans une soixantaine de villes | Départs par vagues d'allure « du rythme de conversation au chrono », le café d'arrivée, les « conversations debout » de quinze minutes par des fondateurs qui ont couru le matin, **zéro slide** |
| [Entrep'runners](https://www.entreprunners.fr/) (Lyon) — sortie mensuelle de dirigeants, 8–10 km sans chrono, apéro ensuite, « pas de badge, pas de slides, pas de chrono » | Les principes 01–04 (zéro pitch en course, toutes les allures, « l'après compte autant »), et l'argument que l'essentiel du retour se fait après l'effort |
| [GO Entrepreneurs](https://www.go-entrepreneurs.com/fr/paris) (Paris La Défense Arena) — rencontres flash de 6 minutes, networking par secteur | Les rendez-vous proposés avec un objet (recruter, lever, vendre, s'associer), les tables par secteur au déjeuner. **Pas** la durée fixe ni le chrono : un rendez-vous a un lieu et une heure, et n'existe que s'il est accepté des deux côtés |
| [JPMorgan Corporate Challenge](https://www.jpmorganchasecc.com/en/home), [B2RUN](https://sporsora.com/b2run-le-1er-evenement-de-running-des-entreprises/), [L'Afterwork Running](https://afterwork-running.fr/lyon) — courses d'entreprise, équipes de 4, village et soirée après la ligne | Les packs entreprises « à partir de quatre coureurs », la soirée qui prolonge la journée |

Le programme horaire de l'après-midi est **indicatif**, signalé en commentaire HTML : à arbitrer avec la production.

### Les formules : Dossard · Premium · Cercle

Section `07.1 / LES FORMULES` (ancre `#formules`). Aucune formule n'achète une meilleure course — elle change *quand* le réseau commence et combien de portes s'ouvrent après :

- **Dossard** (tarif de la vague) : la journée entière.
- **Premium** (sur demande) : l'annuaire ouvert dès validation, six demandes de rendez-vous à envoyer avant l'événement, le Salon de l'Arena, le dîner des fondateurs. Demande possible à tout moment depuis l'espace personnel.
- **Cercle** (sur cooptation, quarante places) : Premium, plus la table des investisseurs (avec les fonds présents, sans rendez-vous garanti : ce serait contraire à la règle de l'accord des deux), trois dossards invités, la place reconduite. Sur demande depuis l'espace, ou sur cooptation de deux membres.

**Les seuls prix affichés sur le site sont ceux des vagues** (350 / 400 / 500 €, entreprises sur devis), inchangés. Premium et Cercle n'ont pas de montant : leurs conditions « sont précisées à la validation ». Les dates des vagues vivent à deux endroits — `index.html` et `vagueCourante()` dans `server.js` (doublée dans `assets/compte.js` pour le mode local) — à garder alignées.

> ⚠️ Contenus des formules et jauge du Cercle sont des **propositions** à arbitrer (commentaire HTML dans `index.html`).

## Le compte : s'inscrire avant, se connecter, suivre son dossier

Le parcours est de bout en bout : **`/inscription/`** (compte + distance + formule + ce que portera le dossard, avec l'aperçu du verso qui se remplit en tapant) → **`/espace/`** (les quatre étapes du dossier, la fiche, le dossard recto/verso, changement de formule, modification du profil) → **`/connexion/`** pour y revenir. Le lien « Connexion » de la nav devient « Mon espace » dès qu'une session est ouverte.

- **`server.js`** — Node ≥ 18, zéro dépendance. Sert le statique (redirection `/pour-qui` → `/pour-qui/`, types MIME, cache) et l'API : `POST /api/inscription`, `POST /api/connexion`, `POST /api/deconnexion`, `GET|PATCH /api/moi`, `GET /api/sante`, plus `GET /api/dossier` — le pont vers l'app (voir plus bas). Mots de passe en **scrypt** (sel par compte), session en cookie **HttpOnly / SameSite=Lax** (Secure derrière HTTPS), 10 essais de connexion par minute et par IP, corps limité à 64 Ko. Les fichiers `server.js`, `package.json`, `data/` et les dotfiles ne sont jamais servis.
- **Données** : `data/comptes.json` (gitignoré), écriture atomique. `ROI_DATA_DIR` déplace le dossier — **sur Railway, monter un volume dessus**, sinon les comptes disparaissent au redéploiement.
- **`assets/compte.js`** — le client. Si le site est servi sans serveur (aperçu statique, GitHub Pages), il bascule en **mode local** : les comptes vivent dans le `localStorage` du navigateur, et un bandeau « aperçu sans serveur » le dit. Ce mode ne sert qu'à l'aperçu.
- **Ce que le serveur ne fait pas** (volontairement, pour l'instant) : la réception du justificatif (un `mailto:dossiers@runoninvest.fr` pré-rempli avec la référence du dossier), la validation (l'état `demande → justificatif → valide → paye` est dans les données mais ne change pas depuis le site), le paiement, la réinitialisation de mot de passe (par mail à contact@). Le SIREN est facultatif et n'est pas vérifié.
- **Tests** : `npm test` déroule le parcours complet contre le serveur (statique, inscription, doublon, le pont vers l'app, session, modification, déconnexion, reconnexion, hachage sur disque, garde-fou 429).

> ⚠️ **RGPD** : le compte stocke nom, e-mail, fonction, entreprise, SIREN facultatif et un hachage de mot de passe. Il manque encore une politique de confidentialité liée depuis le formulaire, et la case de consentement renvoie pour l'instant à `/pour-qui/#acces`.

R.O.I s'adresse aux **entrepreneurs, intrapreneurs, cadres dirigeants et commerciaux** — plus les investisseurs et conseils. L'accès au dossard est donc **vérifié**, par l'une de trois voies au choix : extrait **Kbis**, **avis de situation SIRENE**, ou **cooptation employeur**. Un seul critère : exercer — ni seuil de chiffre d'affaires, ni taille d'entreprise minimum, ni chrono à tenir.

Ce discours vit à deux endroits : la section `06 / POUR QUI` de la page d'accueil (le laïus, les quatre publics du cahier des charges, et le bloc `06.1 / L'ACCÈS` qui résume les trois justificatifs), et la page dédiée `/pour-qui` qui déroule les six familles de profils, les justificatifs, le parcours du dossier et une FAQ d'éligibilité.

> ⚠️ **À arbitrer avant mise en ligne** (signalé en commentaire HTML dans les deux pages) : le délai de réponse annoncé (48 h ouvrées), la validité du Kbis (3 mois), la politique de suppression des justificatifs — à faire relire côté RGPD — et les chiffres Paris La Défense, à confirmer sur la source officielle. L'arrivée en salle dans **Paris La Défense Arena** et la jauge de **10 000 participants** viennent du cahier des charges de consultation (v1.0, sept. 2026), où le site indoor est encore « à confirmer ». Le site dit désormais « Run On Investment », comme ce document ; le domaine, les adresses e-mail et le compte Instagram restent sur `runoninvest`.

> **Reste à renseigner** : le lien LinkedIn du footer pointe encore sur `#` (marqué en commentaire dans les deux pages). Instagram est branché sur [@runoninvest](https://www.instagram.com/runoninvest/).

## Le pont vers l'app

À côté du site vit **l'app R.O.I** — une application React séparée, sur sa propre origine, où le réseau continue toute l'année : l'annuaire de celles et ceux qui courent, les rendez-vous acceptés des deux côtés, la messagerie sans échange de coordonnées, les sorties entre deux éditions. Le site ne la contient pas ; il lui tend un pont dans les deux sens. **L'app lit le dossier, elle ne l'écrit jamais** : tout ce qui change un dossier (formule, profil, mot de passe) passe par `/espace/` et la session du site.

**Adresse de l'app** : par défaut `https://roi-mvp.up.railway.app` (l'app déployée sur Railway), partout — `assets/roi.js`, `assets/compte.js`, et en dur dans les `href` de `index.html` pour le cas sans JS. Pour la changer sans toucher au code (domaine définitif, environnement de recette) : poser `data-app="https://…"` sur le `<body>` de la page — le JS le lit et retombe sur la valeur par défaut sinon.

- **Depuis le site vers l'app.** Sur l'accueil, la section `05 / L'APP` et le lien « L'app » du footer (classe `lien-app`, cible réglée par `roi.js`, `target="_blank"`). Depuis l'espace, la section `T+ / L'APP — TOUTE L'ANNÉE` porte le bouton « Ouvrir mon dossard dans l'app » : `compte.js` y pose le **lien profond** `{app}/?dossier={reference}&email={email}` (les deux valeurs encodées) — c'est avec ce couple que l'app retrouve le dossard. Le formulaire d'inscription l'annonce d'une ligne sous le consentement.
- **Depuis l'app vers le site : `GET /api/dossier?reference=E01-000123&email=x@y.z`** (répond aussi en `HEAD`). Les deux paramètres sont **obligatoires** ; la référence est comparée sans tenir compte de la casse ni des espaces, l'e-mail en minuscules.
  - `200` → `{ dossier: { reference, prenom, nom, fonction, entreprise, profil, distance, formule, vague, etat, edition: '01' } }`.
  - `400` → `{ erreur: 'Référence et e-mail requis.' }` s'il manque l'un des deux.
  - `404` → `{ erreur: 'Aucun dossier avec cette référence et cet e-mail.' }` — **le même message** que la référence ou l'e-mail soit faux, pour ne rien laisser énumérer.
  - `429` → même garde-fou que la connexion, **10 essais par minute et par IP** (compteur partagé avec `POST /api/connexion`).
  - `405` pour toute autre méthode : l'app lit, elle n'écrit pas.
  - **Ce que la réponse ne contient jamais** : l'e-mail, l'`id`, le SIREN, la voie de justificatif, le hachage de mot de passe, les dates de création et de mise à jour.
- **CORS.** L'endpoint est fait pour être appelé depuis une autre origine : `Access-Control-Allow-Origin: *` et `Vary: Origin` sur toutes ses réponses, et `OPTIONS /api/dossier` répond `204` avec `Access-Control-Allow-Methods: GET, HEAD, OPTIONS` et `Access-Control-Max-Age: 86400`. Aucun cookie n'entre en jeu : la session du site reste `SameSite=Lax`, hors de portée de l'app.

## SEO, partage & confort

- **Image de partage** `og.png` (1200 × 630, générée depuis le design system) branchée en `og:image` / `twitter:image` sur `/` et `/pour-qui`, avec `canonical` et `og:url`.
- **Icônes** : `favicon.svg` (motif « la ligne » : point d'impact, trait, damier), `favicon-32.png`, `apple-touch-icon.png`, `icon-512.png`, `site.webmanifest`.
- `robots.txt` (exclut `/v2/`) et `sitemap.xml` (`/` et `/pour-qui/`). Les pages de compte sont en `noindex`. Domaine de référence : `https://runoninvest.fr/`.
- **JSON-LD** : `url`, `image`, `inLanguage` sur l'événement, `url` sur les offres.
- **Robustesse** : contenu visible sans JavaScript (`.no-js`), `.sr-only` pour le `<h1>` d'accueil, ancres décalées sous le header sticky.

## Le registre : vouvoiement, phrases factuelles

Tout le contenu visible est au **vouvoiement** — accueil, `/pour-qui`, les trois pages de compte, et les messages de validation de `assets/compte.js` et `server.js`, qui sont identiques de part et d'autre. L'audience est composée de dirigeants, d'investisseurs et de cadres dirigeants, pour un dossard à 350–500 €.

Trois règles tenues sur l'ensemble des pages :

1. **Pas de superlatif invérifiable.** Pour une première édition, « le plus grand événement de networking de France » n'est pas démontrable : le site décrit ce qui se passe (une course, puis une après-midi de rencontres) et annonce la jauge attendue (10 000 décideurs).
2. **Pas de formule d'accroche à la place d'une information.** Les antithèses (« tu ne changes pas de badge, tu changes de conversation »), les phrases nominales de relance (« Sans slide. », « Personne ne déjeune seul. ») et les tirets cadratins en incise ont été remplacés par des phrases qui disent ce qui est prévu.
3. **Pas de points médians.** `salarié·e`, `fondateur·rice` : formulations neutres ou masculin générique à la place. La graphie était appliquée de façon inégale, et les lecteurs d'écran épellent le point. À rétablir si c'est un choix de marque.

Reste volontairement en place : la signature « L'impact après la ligne d'arrivée » et le texte des deux affiches de campagne (« Au 3e km, plus personne ne joue un rôle », « Personne ne vend en montée · Zéro pitch »), qui sont dans l'image.

## Accessibilité — un point ouvert sur l'orange

Le contraste a été mesuré sur toute la palette. Tout passe le seuil AA (4,5:1) **sauf l'orange de marque `#FF4400`**, qui est un héritage des affiches :

| Usage | Ratio | AA 4,5:1 |
|---|---|---|
| Orange sur craie (`.tmark b`, numéros, liens des sections claires) | 2,90 | ✗ |
| Craie sur orange (bouton principal, `nav-cta`, badge « vague ouverte ») | 2,90 | ✗ |
| Orange sur encre (sections sombres) | 5,83 | ✓ |

Sur fond sombre l'orange est conforme ; c'est **sur fond clair** qu'il ne l'est pas. **Tranché avec la refonte « La Ligne, affûtée » : sorties 2 et 3 combinées.** Les boutons orange portent un texte encre, et le texte orange sur la craie passe par `--accent` (`#C63500` dans `.light`, `#FF4400` ailleurs). Pour mémoire, les trois sorties étudiées :

1. **Ne rien changer** — assumé, mais le CTA principal reste sous le seuil.
2. **Texte encre sur les boutons orange** (`#070707` sur `#FF4400` = 5,83:1) — conforme, et graphiquement très proche de l'affiche.
3. **Un orange assombri réservé aux fonds clairs** (`#C63500` = 4,51:1), l'orange d'origine restant sur les fonds sombres.

Le reste de la palette a été corrigé : `--beton` sur fond clair est passé de `#7C7669` (3,79:1) à `#6B6558` (4,87:1). L'anneau de focus clavier utilise `var(--texte)` et non l'orange, précisément parce que l'orange ne tient pas les 3:1 exigés pour un indicateur de focus sur la craie.

## La page d'accueil, en huit temps

`01` Le principe (affiche « Au 3e km » + quatre phrases) · `02` Comment ça marche (le parcours en cinq étapes, du dossier à l'app, chacune renvoie à sa section) · `03` La course (le plan des départs animé, puis les cinq règles qui tiennent la fenêtre d'arrivée) · `04` L'Arena (le dossard recto/verso, le plan animé de l'après-midi, le programme, les règles) · `05` L'app (un téléphone manipulable : courses, rendez-vous, rencontres) · `06` Pour qui (le laïus, les quatre publics, l'accès sur justificatif) · `07` Les dossards (distances, formules, vagues tarifaires) · `08` Le lieu. Puis la finale « Prenez votre place sur la ligne ».

### Les départs échelonnés (`#course`)

Trois distances (5 km, 10 km, semi-marathon), un seul départ au pied de la Grande Arche, une seule arrivée à l'intérieur de Paris La Défense Arena. Pour que l'après-midi commence au même moment pour tous, **les distances longues et les allures lentes partent en premier** : huit sas de 8 h 45 à 10 h 45, calculés pour que toutes les arrivées tombent entre 11 h et 11 h 30. Le mot « sas » désigne les groupes de départ ; « vague » reste réservé aux vagues tarifaires (Early Bird, Régulier, Last Call).

- **Les horaires vivent dans le HTML**, sur chaque ligne `.dp-row` : `data-dep`, `data-a1`, `data-a2` en minutes depuis minuit (525 = 8 h 45), `data-km`. Le libellé affiché à côté doit dire la même chose. `roi.js` n'invente rien : il place les barres sur l'axe 8 h 30 → 11 h 45 et fait avancer l'horloge (18 s pour la matinée, en boucle, uniquement quand le bloc est à l'écran). Un curseur permet de se placer à une heure précise ; il arrête la lecture.
- Les cinq règles affichées dessous (temps visé, horaire par sas, meneurs d'allure, temps net, ligne ouverte jusqu'à 11 h 45) sont ce qui rend la fenêtre crédible.

> ⚠️ **Plan indicatif** (commentaire HTML) : jauges des sas, horaires et fermeture des routes à valider avec l'organisateur technique. Le formulaire d'inscription ne demande pas encore le temps visé : à ajouter côté `/inscription/` et `server.js` si le principe est retenu.

### L'après-midi dans l'Arena (`#arena`, `#plan`)

Aucun stand d'exposant. L'Arena est découpée en **cinq quartiers, un par objectif** (Recruter, Financer, Vendre, S'associer, Entre pairs), chacun avec des **bornes numérotées** (`F-07` = quartier Financer, borne 7). Le plan animé déroule un rendez-vous en cinq temps :

1. **L'arrivée** : le café des finishers est organisé par sas, on y retrouve ceux qui ont couru à la même allure.
2. **La demande** : proposée depuis l'app avec son objet, elle n'existe que si l'autre l'accepte ; l'app réserve alors une borne et un horaire.
3. **Le tableau des rencontres** : à l'entrée des quartiers, les rendez-vous de l'heure s'affichent **par numéro de dossard, jamais par nom**.
4. **La borne** : on s'y retrouve. Pas de chrono.
5. **Les stands d'hôtes** : un participant admis (entreprise qui recrute, fonds, acheteur) tient une borne une heure, sujet affiché ; on demande un passage, l'hôte accepte ou non. Aucun emplacement n'est vendu.

Le mouvement est **entièrement en CSS** (`data-etape` sur `.ar-scene`, la classe `.joue` relancée à chaque étape) ; le JS ne fait que changer d'étape, générer les 40 bornes et la foule du café, et mettre en pause hors écran. Avec `prefers-reduced-motion`, rien ne bouge seul : les étapes restent cliquables et s'affichent dans leur état final.

> ⚠️ **Proposition à valider** avec la production et le lieu (commentaire HTML) : quartiers, bornes, tableau et stands d'hôtes. Les noms et numéros de dossard de l'animation et du téléphone sont fictifs.

## Structure

| Chemin | Contenu |
|---|---|
| `index.html` | **Site officiel** — identité « La Ligne » — servi à la racine `/` |
| `inscription/` · `connexion/` · `espace/` | **Le compte** — créer son dossier, y revenir, le suivre. Pages `noindex`, même design system, `assets/compte.js` en plus |
| `server.js` | **Serveur** statique + API de compte, zéro dépendance (`npm start`), plus `GET /api/dossier`, le pont en lecture seule vers l'app · `test/serveur.test.js` (`npm test`) |
| `pour-qui/` | **Page « Pour qui, et comment »** — le réseau derrière la course, les six familles de profils, les trois justificatifs d'accès, le parcours du dossier et la FAQ d'éligibilité. Accessible sur `/pour-qui` |
| `assets/roi.css` | **Design system partagé** par `/` et `/pour-qui` (les URL de fontes y sont relatives au fichier CSS, donc en `../fonts/`) |
| `assets/roi.js` | Comportements partagés : reveal au scroll, ligne de progression et section courante dans la nav, dossard recto/verso, nav mobile, bascule « Connexion » → « Mon espace », adresse de l'app sur les liens `.lien-app` (`data-app`), et sur l'accueil le plan des départs, le plan de l'Arena et le téléphone de démonstration. Chaque bloc ne s'active que si son élément est présent. |
| `assets/compte.js` | Le client du compte (inscription, connexion, espace) avec repli en mode local sans serveur. Pose le lien profond vers l'app depuis l'espace. |
| `assets/img/` | Les deux affiches de campagne (« Personne ne vend en montée », « Au 3e km, plus personne ne joue un rôle »), en 1200 px et 640 px. Le texte est dans l'image : elles se posent entières, jamais recadrées. |
| `cv/` | **Site indépendant** de Mohamed Ennaciri (Architecte Backend · Tech Lead · Engineering Partner) — hébergé ici temporairement sur `/cv`, destiné à être extrait dans son propre repo. Design system propre (« Le Dossier » : papier ivoire, encre vert nuit, accent émeraude, Fraunces/Instrument Sans/Plex Mono, schéma d'architecture animé en SVG). Positionnement cabinet d'ingénierie : expertise, engagements (renfort / forfait / squad), méthode en 5 temps, études de cas détaillées. Fontes auto-hébergées dans `cv/fonts/` — le dossier est 100 % autonome. |
| `v2/index.html` | Ancienne piste « Roadbook » — accessible sur `/v2` |
| `fonts/` | Fontes auto-hébergées (Archivo variable + JetBrains Mono) |
| `og.png`, `favicon*.{svg,png}`, `apple-touch-icon.png`, `icon-512.png` | Image de partage (1200 × 630) et icônes, en remplacement du favicon data-URI |
| `site.webmanifest`, `robots.txt`, `sitemap.xml`, `serve.json` | Manifest, indexation (`robots.txt` exclut `/v2/`, `sitemap.xml` couvre `/` et `/pour-qui/`), cache du serveur statique |

## Déploiement sur Railway

1. Créer un nouveau projet Railway → **Deploy from GitHub repo** → sélectionner ce repo.
2. Railway détecte le `package.json` et lance `npm start` automatiquement (`node server.js`, qui écoute sur `$PORT`). Aucun `npm install` nécessaire.
3. **Ajouter un volume** (Settings → Volumes) monté sur `/data`, et poser la variable `ROI_DATA_DIR=/data` : c'est là que vivent les comptes.
4. Générer un domaine dans **Settings → Networking → Generate Domain**.

## Développement local

```bash
npm start          # → http://localhost:3000 — les comptes vont dans ./data/comptes.json
npm test           # parcours complet contre le serveur, sur un dossier jetable
```
