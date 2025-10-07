# 🍺 Guide d'Installation - Beer Exchange

Ce guide vous explique comment installer et configurer Beer Exchange sur votre machine.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (version 16 ou supérieure) - [Télécharger ici](https://nodejs.org/)
- **MongoDB** (local ou cloud) - [Télécharger ici](https://www.mongodb.com/try/download/community)
- **Git** - [Télécharger ici](https://git-scm.com/)

### Vérifier les installations

Ouvrez un terminal et vérifiez que tout est installé :

```bash
# Vérifier Node.js
node --version
# Doit afficher v16.x.x ou supérieur

# Vérifier npm
npm --version
# Doit afficher 8.x.x ou supérieur

# Vérifier MongoDB
mongod --version
# Doit afficher la version de MongoDB

# Vérifier Git
git --version
# Doit afficher la version de Git
```

## 🚀 Installation Rapide

### Méthode 1 : Installation automatique (Recommandée)

```bash
# 1. Cloner le repository
git clone https://github.com/lucascenseur/beerexchange.git
cd beerexchange

# 2. Rendre le script exécutable et l'exécuter
chmod +x start.sh
./start.sh
```

Le script `start.sh` va automatiquement :
- Installer toutes les dépendances
- Configurer l'environnement
- Initialiser la base de données
- Démarrer l'application

### Méthode 2 : Installation manuelle

Si vous préférez installer manuellement :

```bash
# 1. Cloner le repository
git clone https://github.com/lucascenseur/beerexchange.git
cd beerexchange

# 2. Installer les dépendances
npm run install-all

# 3. Configurer l'environnement
cp server/env.example server/.env

# 4. Démarrer MongoDB (si installé localement)
# Sur macOS avec Homebrew :
brew services start mongodb-community

# Sur Ubuntu/Debian :
sudo systemctl start mongod

# Sur Windows :
# Démarrer MongoDB Compass ou le service MongoDB

# 5. Initialiser la base de données
cd server
node scripts/initUsers.js all
cd ..

# 6. Démarrer l'application
npm run dev
```

## ⚙️ Configuration

### Configuration de l'environnement

Éditez le fichier `server/.env` :

```bash
nano server/.env
```

Variables importantes à configurer :

```env
# Port du serveur (par défaut : 5000)
PORT=5000

# URL de MongoDB
MONGODB_URI=mongodb://localhost:27017/beer-exchange

# Clé secrète JWT (changez-la en production !)
JWT_SECRET=your-super-secret-jwt-key-here

# Durée de validité des tokens JWT
JWT_EXPIRE=24h

# Environnement
NODE_ENV=development

# Comptes par défaut (changez les mots de passe !)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SERVER_PASSWORD=server123
```

### Configuration MongoDB

#### Option 1 : MongoDB Local

Si vous utilisez MongoDB local :

```bash
# Démarrer MongoDB
# Sur macOS :
brew services start mongodb-community

# Sur Ubuntu/Debian :
sudo systemctl start mongod

# Sur Windows :
# Utilisez MongoDB Compass ou démarrez le service
```

#### Option 2 : MongoDB Atlas (Cloud)

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créez un cluster gratuit
3. Obtenez la chaîne de connexion
4. Modifiez `MONGODB_URI` dans `.env` :

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/beer-exchange?retryWrites=true&w=majority
```

## 🎯 Démarrage de l'application

### Démarrage en mode développement

```bash
# Démarrer le serveur et le client
npm run dev
```

Cela va démarrer :
- **Backend** sur http://localhost:5000
- **Frontend** sur http://localhost:3000

### Démarrage en mode production

```bash
# Construire le client
npm run build

# Démarrer le serveur
npm start
```

## 🌐 Accès aux interfaces

Une fois l'application démarrée, vous pouvez accéder à :

### Interface Publique
- **URL** : http://localhost:3000
- **Description** : Affichage des prix en temps réel (pour écran géant)
- **Authentification** : Aucune

### Interface Serveur
- **URL** : http://localhost:3000/server/login
- **Utilisateur** : `server`
- **Mot de passe** : `server123`
- **Fonctionnalités** : Enregistrer les ventes (+1 vente)

### Interface Administrateur
- **URL** : http://localhost:3000/admin/login
- **Utilisateur** : `admin`
- **Mot de passe** : `admin123`
- **Fonctionnalités** : Gestion complète des produits et statistiques

## 🔧 Dépannage

### Problèmes courants

#### 1. Erreur de connexion MongoDB

```bash
# Vérifier que MongoDB est démarré
mongosh --eval "db.adminCommand('ping')"

# Si MongoDB n'est pas démarré :
# Sur macOS :
brew services start mongodb-community

# Sur Ubuntu/Debian :
sudo systemctl start mongod
```

#### 2. Port déjà utilisé

```bash
# Vérifier les ports utilisés
lsof -i :3000  # Port du client
lsof -i :5000  # Port du serveur

# Tuer le processus si nécessaire
kill -9 <PID>
```

#### 3. Erreur de dépendances

```bash
# Nettoyer et réinstaller
rm -rf node_modules
rm -rf server/node_modules
rm -rf client/node_modules
npm run install-all
```

#### 4. Erreur de permissions

```bash
# Sur macOS/Linux, rendre les scripts exécutables
chmod +x start.sh
chmod +x scripts/*.sh
```

### Logs et débogage

```bash
# Voir les logs du serveur
cd server
npm run dev

# Voir les logs du client
cd client
npm start

# Logs Docker (si utilisé)
docker-compose logs -f
```

## 🐳 Installation avec Docker

Si vous préférez utiliser Docker :

```bash
# 1. Installer Docker et Docker Compose
# Voir : https://docs.docker.com/get-docker/

# 2. Cloner le repository
git clone https://github.com/lucascenseur/beerexchange.git
cd beerexchange

# 3. Configurer l'environnement
cp server/env.example server/.env

# 4. Démarrer avec Docker
docker-compose up -d

# 5. Initialiser la base de données
docker-compose exec server node scripts/initUsers.js all
```

## 📱 Test de l'installation

### 1. Vérifier que l'application fonctionne

1. Ouvrez http://localhost:3000
2. Vous devriez voir l'interface publique avec les produits
3. Connectez-vous en tant qu'admin : http://localhost:3000/admin/login
4. Ajoutez quelques produits
5. Connectez-vous en tant que serveur : http://localhost:3000/server/login
6. Testez la fonction "+1 vente"

### 2. Test des fonctionnalités

- ✅ **Interface publique** : Affichage des produits et prix
- ✅ **Authentification** : Connexion admin et serveur
- ✅ **Gestion des produits** : Ajout, modification, suppression
- ✅ **Enregistrement des ventes** : Bouton +1 vente
- ✅ **Mise à jour temps réel** : Prix qui changent
- ✅ **Graphiques** : Évolution des prix

## 🎉 Félicitations !

Beer Exchange est maintenant installé et fonctionnel ! 

### Prochaines étapes :

1. **Personnaliser** les produits selon vos besoins
2. **Configurer** les paramètres de prix
3. **Tester** toutes les fonctionnalités
4. **Déployer** en production si nécessaire

### Ressources utiles :

- 📚 [Documentation complète](README.md)
- 🚀 [Guide de déploiement](DEPLOYMENT.md)
- 🎮 [Guide de démonstration](DEMO.md)

### Support :

Si vous rencontrez des problèmes :
1. Vérifiez ce guide de dépannage
2. Consultez les [issues GitHub](https://github.com/lucascenseur/beerexchange/issues)
3. Créez une nouvelle issue si nécessaire

---

**Beer Exchange** - Prêt pour vos soirées étudiantes ! 🍺🎊
