# 🍺 Beer Exchange

Un site web complet et dynamique pour la gestion des boissons lors de soirées étudiantes, avec un système de prix en temps réel basé sur la demande.

## 🎯 Fonctionnalités

### Interface Publique (Écran Géant)
- 📊 Affichage en temps réel des produits avec prix et variations
- 📈 Graphiques animés des tendances de prix
- 🎨 Design festif avec animations
- 📱 Interface responsive adaptée aux grands écrans

### Interface Serveur
- 🔐 Connexion sécurisée par mot de passe
- ➕ Bouton "+1 vente" pour enregistrer les ventes
- 📊 Mise à jour en temps réel des prix selon l'algorithme de bourse
- 📦 Visualisation des stocks et prix
- 🔄 Synchronisation temps réel avec l'interface publique

### Interface Administrateur
- 🔐 Connexion sécurisée distincte
- ➕ Gestion complète des produits (ajout, modification, suppression)
- 💰 Configuration des prix de base et stocks
- 📊 Statistiques globales et visualisation des ventes
- ⚙️ Paramètres globaux (coefficient de variation des prix)
- 🔄 Options de réinitialisation (prix, stocks, ventes)

## 🛠️ Technologies Utilisées

### Backend
- **Node.js** + **Express** - Serveur web
- **MongoDB** + **Mongoose** - Base de données
- **JWT** - Authentification sécurisée
- **Socket.io** - Communication temps réel
- **bcryptjs** - Chiffrement des mots de passe
- **express-validator** - Validation des données

### Frontend
- **React** - Interface utilisateur
- **TailwindCSS** - Styling et design
- **Framer Motion** - Animations
- **Recharts** - Graphiques
- **Socket.io Client** - Communication temps réel
- **React Router** - Navigation
- **Axios** - Requêtes HTTP
- **React Hot Toast** - Notifications

## 🚀 Installation

### Prérequis
- Node.js (version 16 ou supérieure)
- MongoDB (local ou cloud)
- npm ou yarn

### 1. Cloner le projet
```bash
git clone <repository-url>
cd beer-exchange
```

### 2. Installer les dépendances
```bash
# Installer toutes les dépendances (racine, serveur et client)
npm run install-all
```

### 3. Configuration de l'environnement
```bash
# Copier le fichier d'exemple
cp server/env.example server/.env

# Éditer le fichier .env avec vos paramètres
nano server/.env
```

Variables d'environnement requises :
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/beer-exchange
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=24h
NODE_ENV=development

# Utilisateurs par défaut (à changer en production)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SERVER_PASSWORD=server123
```

### 4. Initialiser la base de données
```bash
# Initialiser les utilisateurs et produits de démonstration
cd server
node scripts/initUsers.js all
```

### 5. Démarrer l'application
```bash
# Démarrer le serveur et le client en mode développement
npm run dev
```

L'application sera accessible sur :
- **Interface publique** : http://localhost:3000
- **Interface serveur** : http://localhost:3000/server/login
- **Interface admin** : http://localhost:3000/admin/login
- **API** : http://localhost:5000/api

## 🔑 Comptes de Démonstration

### Administrateur
- **Nom d'utilisateur** : `admin`
- **Mot de passe** : `admin123`

### Serveur
- **Nom d'utilisateur** : `server`
- **Mot de passe** : `server123`

## 📱 Utilisation

### Interface Publique
- Affichez sur un écran géant pour que les clients voient les prix en temps réel
- Les prix se mettent à jour automatiquement selon les ventes
- Design optimisé pour les grands écrans

### Interface Serveur
1. Connectez-vous avec le compte serveur
2. Cliquez sur "+1 vente" à côté de chaque produit vendu
3. Les prix se mettent à jour automatiquement
4. Visualisez les stocks en temps réel

### Interface Administrateur
1. Connectez-vous avec le compte admin
2. Gérez les produits (ajout, modification, suppression)
3. Configurez les prix de base et stocks
4. Consultez les statistiques de ventes
5. Réinitialisez les données si nécessaire

## 🧮 Algorithme de Prix

Le système utilise un algorithme de "bourse" où :
- Les prix augmentent avec les ventes (plus de demande = prix plus élevé)
- Le prix de base est multiplié par un facteur de demande
- Chaque vente influence le prix selon la formule :
  ```
  Nouveau prix = Prix de base × (1 + (Ventes × 0.1 × Facteur de demande)) × Multiplicateur global
  ```

## 🔒 Sécurité

- Authentification JWT avec expiration
- Mots de passe chiffrés avec bcrypt
- Protection des routes par middleware
- Validation des données côté serveur
- Rate limiting pour éviter les abus

## 📊 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Informations utilisateur
- `POST /api/auth/logout` - Déconnexion

### Produits
- `GET /api/products/public` - Produits publics
- `GET /api/products` - Tous les produits (authentifié)
- `POST /api/products/:id/sell` - Enregistrer une vente

### Administration
- `GET /api/admin/dashboard` - Statistiques admin
- `POST /api/admin/products` - Créer un produit
- `PUT /api/admin/products/:id` - Modifier un produit
- `DELETE /api/admin/products/:id` - Supprimer un produit
- `POST /api/admin/reset` - Réinitialiser les données

## 🎨 Personnalisation

### Couleurs
Modifiez les couleurs dans `client/tailwind.config.js` :
```javascript
colors: {
  'beer-gold': '#FFD700',
  'beer-dark': '#8B4513',
  'beer-light': '#F4E4BC',
  // ...
}
```

### Animations
Les animations sont configurées dans `client/src/index.css` et utilisent Framer Motion.

## 🚀 Déploiement

### Production
1. Configurez les variables d'environnement pour la production
2. Construisez le client : `npm run build`
3. Démarrez le serveur : `npm start`
4. Configurez un reverse proxy (nginx) si nécessaire

### Docker (optionnel)
```bash
# Créer un Dockerfile pour le déploiement
docker build -t beer-exchange .
docker run -p 5000:5000 beer-exchange
```

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
1. Vérifiez la documentation
2. Consultez les issues existantes
3. Créez une nouvelle issue si nécessaire

## 🎉 Remerciements

- Icons par Lucide React
- Animations par Framer Motion
- Graphiques par Recharts
- Styling par TailwindCSS

---

**Beer Exchange** - Fait pour les soirées étudiantes ! 🍺🎉
