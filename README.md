# SAAQ Prep B++

Outil gratuit de préparation à l'examen théorique du permis de conduire classe 5 — Québec.

---

## Déploiement rapide (Web — PWA)

### Prérequis
- Node.js 18+ (`node --version`)
- Git (`git --version`)
- Compte Vercel gratuit (https://vercel.com/signup)

### Étape 1 — Installation locale (2 min)

```bash
cd saaq-prep
npm install
npm run dev
# → http://localhost:5173
```

### Étape 2 — Générer les icônes (1 min)

```bash
# Installer l'outil de génération d'icônes
npm install -g pwa-asset-generator

# Générer toutes les icônes depuis le favicon SVG
pwa-asset-generator public/favicon.svg public/ \
  --icon-only \
  --type png \
  --background "#0f172a" \
  --padding "15%"

# OU manuellement : créer icon-192.png, icon-512.png et apple-touch-icon.png (180x180)
# à partir du favicon.svg avec n'importe quel outil graphique
```

### Étape 3 — Déployer sur Vercel (5 min)

**Option A — Via CLI :**
```bash
npm i -g vercel
vercel login
vercel
# Suivre les prompts → accepter les défauts → URL live en ~60 secondes
```

**Option B — Via GitHub :**
```bash
git init
git add .
git commit -m "SAAQ Prep B++ v1.0"
git remote add origin git@github.com:TON_USER/saaq-prep.git
git push -u origin main
```
Puis sur vercel.com :
1. "Add New Project"
2. Importer le repo GitHub
3. Framework preset : Vite
4. Deploy → URL live en ~90 secondes

### Étape 4 — Domaine personnalisé (optionnel)

```bash
vercel domains add saaqprep.ca
# Ou dans le dashboard Vercel : Settings > Domains
```

### Résultat

- URL publique type : `https://saaq-prep.vercel.app`
- PWA installable sur mobile (icône sur écran d'accueil)
- Fonctionne hors-ligne (service worker)
- HTTPS automatique
- CDN global (rapide partout au Québec)
- 0$/mois (tier gratuit Vercel = 100 GB bandwidth)

---

## Déploiement mobile — App Stores

### Architecture : Capacitor (wrapper natif)

Capacitor encapsule l'app web dans un conteneur natif.
Même code React → app Android + iOS.

### Android (Google Play Store)

#### Prérequis
- Android Studio installé
- JDK 17+
- Compte Google Play Developer (25$ USD — frais unique à vie)

#### Étapes

```bash
# 1. Installer Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init "SAAQ Prep" "ca.marksystems.saaqprep" --web-dir dist

# 2. Ajouter la plateforme Android
npm install @capacitor/android
npx cap add android

# 3. Build le projet web
npm run build

# 4. Synchroniser avec Android
npx cap sync android

# 5. Ouvrir dans Android Studio
npx cap open android
```

Dans Android Studio :
1. Build > Generate Signed Bundle / APK
2. Créer un keystore (garder précieusement — requis pour les mises à jour)
3. Générer un Android App Bundle (.aab)

Google Play Console :
1. Créer une app ("SAAQ Prep")
2. Remplir la fiche : description, captures d'écran, catégorie "Éducation"
3. Upload le .aab dans "Production"
4. Soumettre pour review (1-3 jours)

#### Fiche Play Store suggérée

```
Titre : SAAQ Prep — Examen théorique Québec
Sous-titre : Prépare ton permis de conduire gratuitement

Description courte :
Outil 100% gratuit pour réussir l'examen théorique SAAQ du premier coup.

Description longue :
Prépare-toi efficacement à l'examen théorique de la SAAQ avec un outil basé
sur les sciences cognitives.

✅ 250+ questions couvrant les 12 catégories de l'examen
✅ 5 niveaux de difficulté (facile à expert)
✅ Système de révision espacée (SRS) pour ne rien oublier
✅ Simulation d'examen réaliste (30 questions / 60 minutes)
✅ Diagnostic initial pour un plan d'étude personnalisé
✅ Jauge de confiance pour détecter la surconfiance
✅ Scénarios visuels d'intersection
✅ Zéro pub. Zéro frais. 100% communautaire.

Basé sur le Code de la sécurité routière du Québec.

Catégorie : Éducation
Classification : Tout public
Prix : Gratuit (pas d'achats intégrés)
```

### iOS (Apple App Store)

#### Prérequis
- Mac avec macOS (obligatoire — Apple ne permet pas de build iOS sur Linux/Windows)
- Xcode 15+
- Compte Apple Developer (99$ USD/an)

#### Étapes

```bash
# 1. Ajouter la plateforme iOS
npm install @capacitor/ios
npx cap add ios

# 2. Build + sync
npm run build
npx cap sync ios

# 3. Ouvrir dans Xcode
npx cap open ios
```

Dans Xcode :
1. Signer avec ton Apple Developer certificate
2. Product > Archive
3. Distribute App > App Store Connect

App Store Connect :
1. Créer l'app, remplir la fiche
2. Upload le build depuis Xcode
3. Soumettre pour review (1-7 jours, Apple est plus strict)

#### Alternative iOS sans Mac : PWA

Depuis iOS 16.4+, les PWA installées depuis Safari supportent :
- Push notifications (partiel)
- Stockage persistant
- Mode plein écran

Pour ton cas (app éducative sans besoin de hardware natif), la PWA est suffisante sur iOS.
L'utilisateur visite le site → Safari → "Ajouter à l'écran d'accueil" → app fonctionnelle.

---

## Coûts totaux

| Poste | Coût | Fréquence |
|-------|------|-----------|
| Hébergement Vercel | 0$ | — |
| Domaine .ca (optionnel) | ~15$/an | Annuel |
| Google Play Developer | 25$ USD | Unique (à vie) |
| Apple Developer | 99$ USD | Annuel |
| **Total sans Apple** | **25$ USD** | **Unique** |
| **Total avec Apple** | **124$ USD** | **Première année** |

### Recommandation budget 0$ absolu

Si tu ne veux dépenser aucun dollar :
1. Déployer sur Vercel (gratuit)
2. Les utilisateurs Android installent la PWA depuis Chrome ("Ajouter à l'écran d'accueil")
3. Les utilisateurs iOS installent la PWA depuis Safari
4. Pas de frais de stores, pas de review Apple/Google
5. Mises à jour instantanées (pas besoin de republier sur les stores)

---

## Mises à jour

### Web (Vercel)
```bash
# Modifier le code
git add . && git commit -m "v1.x" && git push
# Vercel redéploie automatiquement en ~30 secondes
```

### Mobile (Capacitor)
```bash
npm run build
npx cap sync
# Ouvrir Android Studio / Xcode → rebuild → upload nouveau .aab/.ipa
```

---

## Structure du projet

```
saaq-prep/
├── index.html              # Point d'entrée HTML
├── package.json            # Dépendances
├── vite.config.js          # Config Vite + PWA
├── vercel.json             # Config déploiement Vercel
├── capacitor.config.ts     # Config mobile (Android/iOS)
├── public/
│   ├── favicon.svg         # Icône vectorielle
│   ├── icon-192.png        # Icône PWA (à générer)
│   ├── icon-512.png        # Icône PWA (à générer)
│   └── apple-touch-icon.png # Icône iOS (à générer)
└── src/
    ├── main.jsx            # Bootstrap React
    └── App.jsx             # Application complète
```

---

## Licence

Projet communautaire gratuit — Mark Systems, Québec.

---

# SAAQ Prep B++ — Quebec Driving Test Preparation

Free tool to prepare for the SAAQ Class 5 theoretical driving exam in Quebec.

> Built by [Mark Systems](https://github.com/AILabManager-tech/mark-systems).

## Features

- 250+ questions covering all 12 exam categories
- 5 difficulty levels (easy to expert)
- Spaced repetition system (SRS)
- Realistic exam simulation (30 questions / 60 minutes)
- Initial diagnostic for personalized study plan
- Confidence gauge to detect overconfidence
- Visual intersection scenarios
- PWA — installable on mobile, works offline
- Zero ads. Zero fees. 100% community.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React + Vite |
| Mobile | Capacitor (Android / iOS) |
| PWA | Service Worker, offline-first |
| Deployment | Vercel |

## Getting Started

```bash
cd saaq-prep
npm install
npm run dev    # http://localhost:5173
```

## Deployment

Hosted on Vercel (free tier). PWA installable on any device.

URL: [saaq-prep.vercel.app](https://saaq-prep.vercel.app)

## Cost

| Item | Cost | Frequency |
|------|------|-----------|
| Vercel hosting | $0 | — |
| Domain .ca (optional) | ~$15/yr | Annual |
| Google Play Developer | $25 USD | One-time |
| Apple Developer | $99 USD | Annual |

## License

Free community project — Mark Systems, Quebec.
