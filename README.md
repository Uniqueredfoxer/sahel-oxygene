# Gaz — Plateforme de livraison & localisation de gaz

Application pour le marché burkinabè, en deux parties :

1. **Livraison** — commande sans compte, attribution aux livreurs, suivi GPS,
   signature électronique, reçu PDF avec QR code de vérification, rapports.
2. **Gaz** — les vendeurs ("coins") activent un bouton "gaz disponible" ; les
   clients, via leur position GPS, voient instantanément les 3 coins les plus
   proches avec un itinéraire prêt à ouvrir dans Google Maps.

Le nom affiché ("Gaz" par défaut) est modifiable à tout moment par
l'administrateur depuis **Espace admin → Paramètres** — il se répercute sur le
logo, le titre de l'onglet, les reçus PDF, les rapports PDF et les messages
WhatsApp générés.

## Stack technique

- **Frontend** : React 18 + Vite, React Router, Tailwind CSS, Socket.IO
  client, PWA (installable sur mobile)
- **Backend** : Node.js + Express, Sequelize, PostgreSQL, Socket.IO,
  JWT (auth), PDFKit (reçus/rapports), ExcelJS (export), QRCode

## Choix pragmatiques (pas de clé API externe fournie)

- **Google Maps** : pas de clé API Google intégrée. Les distances utilisent
  soit la distance saisie manuellement par le client, soit un calcul à vol
  d'oiseau (Haversine) à partir de coordonnées GPS. Les "itinéraires" sont des
  liens `google.com/maps/dir/?api=1&...` qui ouvrent l'app Maps installée sur
  le téléphone — aucune clé requise, mais pas d'optimisation d'itinéraire
  routier tant que la clé n'est pas branchée.
- **WhatsApp** : pas d'accès à l'API WhatsApp Business (nécessite un compte
  Meta approuvé). À la place, l'app génère des liens `wa.me/...` pré-remplis :
  la personne clique, WhatsApp s'ouvre avec le message prêt, elle appuie sur
  envoyer. Pour une automatisation serveur complète (envoi sans intervention
  humaine), il faudra brancher l'API WhatsApp Business officielle.

Pour brancher une vraie clé Google Maps plus tard : ajouter la clé dans
`frontend/.env` puis remplacer les champs adresse texte par l'autocomplete
Google Places, et le calcul Haversine par l'API Distance Matrix.

## Démarrage local

### 1. Base de données

```bash
# PostgreSQL doit tourner, avec une base "sahel_oxygene" créée
createdb sahel_oxygene
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # ajuster DB_PASSWORD, JWT_SECRET, etc.
npm install
npm run seed            # crée les 2 comptes super-admin (SUPER_ADMIN_EMAILS)
npm run dev              # ou "npm start" en production
```

Le backend écoute sur `http://localhost:4000`.

Comptes créés par le seed (mot de passe temporaire `ChangeMoi123!`, à changer) :
- emails définis dans `SUPER_ADMIN_EMAILS` (`.env`)

### 3. Frontend

```bash
cd frontend
npm install
npm run dev      # développement, http://localhost:5173
npm run build    # production → dossier dist/
```

En développement, Vite fait proxy de `/api` et `/socket.io` vers le backend
(voir `vite.config.js`) — pas besoin de configurer CORS pour tester en local.

## Rôles

| Rôle            | Accès                                                        |
|-----------------|---------------------------------------------------------------|
| `administrateur`| Tout, y compris équipe, suppression, paramètres, vendeurs gaz|
| `gestionnaire`  | Commandes, clients, livraisons, rapports, doublons, WhatsApp  |
| `livreur`       | Ses courses, position GPS, signature, validation              |
| `vendeur_gaz`   | Son coin, bouton de disponibilité                              |

Un compte créé via `/inscription` n'a **aucun rôle** par défaut (sauf les
emails listés dans `SUPER_ADMIN_EMAILS`). Un administrateur doit attribuer un
rôle depuis **Équipe** avant que le compte ait accès à un espace.

## Structure

```
backend/
  src/
    models/       # Sequelize : User, UserRole, Livraison, GasVendor, Setting...
    routes/        # auth, public, livraisons, clients, reports, team, whatsapp, gaz, settings
    utils/         # tarif, numérotation, reçu PDF, itinéraire, formatage, branding
    middleware/    # auth JWT + vérification de rôle (toujours côté serveur)
frontend/
  src/
    pages/         # ClientOrder, TrackOrder, Verify, FindGas, Login, LivreurDashboard,
                    # VendeurGazDashboard, AdminDashboard (+ onglets dans pages/admin/)
    context/       # AuthContext, BrandingContext
    components/    # Logo, StatutPill, PadSignature, RouteProtegee
```

## Déploiement production

### Frontend

Créer un fichier `.env.production` dans `frontend/` :

```bash
VITE_API_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
```

Le frontend est prévu pour être hébergé sur Vercel, Netlify ou un autre hébergeur statique. Le fichier [frontend/vercel.json](frontend/vercel.json) permet le bon fonctionnement des routes SPA.

### Backend

Créer un fichier `.env` dans `backend/` à partir de [backend/.env.example](backend/.env.example) avec :

```bash
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=sahel_oxygene
DB_USER=postgres
DB_PASSWORD=your-strong-password
JWT_SECRET=your-very-strong-secret-min-32-chars
PORT=10000
NODE_ENV=production
PUBLIC_APP_URL=https://your-frontend-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com
SUPER_ADMIN_EMAILS=admin@example.com
```

Les instructions complètes de déploiement sont dans [DEPLOYMENT.md](DEPLOYMENT.md).

## Limites connues / à faire avant une mise en production

- Le nom du manifeste PWA (icône d'accueil mobile) est figé au moment du
  build ; le renommer depuis l'admin ne change pas l'icône déjà installée.
- Pas de tests automatisés (unitaires/E2E) — à ajouter.
- Le mot de passe des comptes seed doit être changé immédiatement.
- Prévoir HTTPS + variables d'environnement de production avant déploiement
  public (JWT_SECRET fort, DB_PASSWORD fort).
