# ⚡ Installation Rapide - Beer Exchange

Guide d'installation express en 5 minutes !

## 🚀 Installation en 3 étapes

### 1. Prérequis
Assurez-vous d'avoir installé :
- **Node.js** (v16+) : [nodejs.org](https://nodejs.org/)
- **MongoDB** : [mongodb.com](https://www.mongodb.com/try/download/community)

### 2. Installation
```bash
# Cloner et installer
git clone https://github.com/lucascenseur/beerexchange.git
cd beerexchange
chmod +x start.sh
./start.sh
```

### 3. Accès
- **Interface publique** : http://localhost:3001
- **Admin** : http://localhost:3001/admin/login (admin/admin123)
- **Serveur** : http://localhost:3001/server/login (server/server123)

## 🎯 Test rapide

1. **Connectez-vous en admin** → Ajoutez des produits
2. **Connectez-vous en serveur** → Testez "+1 vente"
3. **Regardez l'interface publique** → Voir les prix évoluer !

## ❓ Problème ?

- **MongoDB ne démarre pas** ? Voir [INSTALLATION.md](INSTALLATION.md#dépannage)
- **Port occupé** ? `lsof -i :3001` puis `kill -9 <PID>`
- **Dépendances** ? `npm run install-all`

---

**C'est tout !** 🍺 Votre Beer Exchange est prêt !
