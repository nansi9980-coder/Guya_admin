# GUYA FIBRE — Dashboard Admin

Dashboard d'administration React + Vite, séparé du site vitrine.

## Stack technique

- **React 18** + **TypeScript**
- **Vite** (bundler ultra-rapide)
- **React Router v6** (navigation)
- **Axios** (appels API avec auto-refresh JWT)
- **Zustand** (état global auth)
- **TailwindCSS** (styling)
- **Recharts** (graphiques)
- **Sonner** (notifications toast)

## Installation

```bash
cd admin-dashboard

# Copier le fichier d'environnement
cp .env.example .env

# Éditer l'URL du backend
# VITE_API_URL=http://localhost:4000

# Installer les dépendances
npm install

# Lancer en développement (port 3001)
npm run dev

# Build pour production
npm run build
```

## Structure

```
src/
├── api/          ← Tous les appels HTTP (auth, devis, contact, users…)
├── components/
│   ├── layout/   ← AdminLayout (sidebar + header)
│   └── ui/       ← Composants réutilisables (Button, Card, Modal, Table…)
├── pages/        ← Une page par module
│   ├── Login
│   ├── Dashboard
│   ├── Devis
│   ├── Contact
│   ├── Utilisateurs
│   ├── Services
│   ├── Realisations
│   ├── Medias
│   ├── SiteContent
│   ├── EmailTemplates
│   ├── Stats
│   ├── Logs
│   └── Parametres
├── router/       ← Routes + PrivateRoute
├── store/        ← Zustand auth store
├── types/        ← Types TypeScript partagés
└── lib/          ← Utilitaires (cn, formatDate…)
```

## Rôles

| Rôle | Accès |
|------|-------|
| `SUPER_ADMIN` | Accès total, gestion utilisateurs |
| `EDITOR` | Lecture + édition contenu, devis, contact |
| `VIEWER` | Lecture seule |

## Backend requis

Le backend NestJS doit tourner sur le port défini dans `VITE_API_URL`.  
Routes principales utilisées :
- `POST /api/auth/login`
- `GET /api/stats/dashboard`
- `GET /api/devis`
- `GET /api/contact`
- `GET /api/users`
- `GET /api/services-content`
- `GET /api/realisations`
- `GET /api/medias`
- `GET /api/site-content`
- `GET /api/email-templates`
- `GET /api/logs`
- `GET /api/settings`
