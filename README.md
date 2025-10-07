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
- 💳 **Intégration SumUp** : Synchronisation des produits et paiements

## 🛠️ Technologies Utilisées

### Backend
- **Node.js** + **Express** - Serveur web
- **MariaDB** + **Sequelize** - Base de données et ORM
- **JWT** - Authentification sécurisée
- **Socket.io** - Communication temps réel
- **bcryptjs** - Chiffrement des mots de passe
- **express-validator** - Validation des données
- **SumUp API** - Intégration paiements professionnels
- **OAuth 2.0** - Authentification SumUp sécurisée

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

### ⚡ Installation Rapide (5 minutes)

```bash
# Cloner et installer automatiquement
git clone https://github.com/lucascenseur/beerexchange.git
cd beerexchange
chmod +x start.sh
./start.sh
```

### 📋 Installation Manuelle

#### Prérequis
- Node.js (version 16 ou supérieure)
- MongoDB (local ou cloud)
- npm ou yarn

#### Étapes

1. **Cloner le projet**
```bash
git clone https://github.com/lucascenseur/beerexchange.git
cd beerexchange
```

2. **Installer les dépendances**
```bash
npm run install-all
```

3. **Configuration de l'environnement**
```bash
cp server/env.example server/.env
# Éditer le fichier .env avec vos paramètres
```

4. **Configuration SumUp (Optionnel)**
```bash
# Ajouter vos clés SumUp dans server/.env
SUMUP_CLIENT_ID=your-sumup-client-id
SUMUP_CLIENT_SECRET=your-sumup-client-secret
```

5. **Initialiser la base de données**
```bash
cd server
node scripts/initUsers.js all
cd ..
```

6. **Démarrer l'application**
```bash
npm run dev
```

### 🌐 Accès aux interfaces

- **Interface publique** : http://localhost:3001
- **Interface serveur** : http://localhost:3001/server/login
- **Interface admin** : http://localhost:3001/admin/login
- **Interface SumUp** : http://localhost:3001/admin/sumup
- **API** : http://localhost:5000/api

### 📚 Guides détaillés

- **[QUICKSTART.md](QUICKSTART.md)** - Installation en 3 étapes
- **[INSTALLATION.md](INSTALLATION.md)** - Guide complet avec dépannage
- **[SUMUP_INTEGRATION.md](SUMUP_INTEGRATION.md)** - Intégration SumUp complète
- **[DEMO.md](DEMO.md)** - Guide de démonstration

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
