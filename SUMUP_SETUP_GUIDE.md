# 🚀 Guide de Configuration SumUp - Beer Exchange

## 📋 **Étapes pour une vraie intégration SumUp**

### 1. **Créer un compte développeur SumUp**
- Allez sur [developer.sumup.com](https://developer.sumup.com)
- Créez un compte développeur
- Créez une nouvelle application

### 2. **Configurer votre application SumUp**
Dans votre dashboard SumUp, configurez :
- **Nom de l'application** : `Beer Exchange`
- **Description** : `Système de bourse aux bières pour soirée étudiante`
- **URL de redirection** : `http://57.128.183.204:5000/api/sumup/callback`
- **Scopes** : `payments` (pour les paiements)

### 3. **Récupérer vos identifiants**
Après création, vous obtiendrez :
- `Client ID` (ex: `sumup_client_123456789`)
- `Client Secret` (ex: `sumup_secret_abcdef123456`)

### 4. **Configurer votre fichier .env**
```bash
# Sur votre VPS, éditez le fichier .env
nano .env
```

Ajoutez/modifiez ces lignes :
```env
# Configuration SumUp
SUMUP_CLIENT_ID=votre_client_id_ici
SUMUP_CLIENT_SECRET=votre_client_secret_ici
SUMUP_REDIRECT_URI=http://57.128.183.204:5000/api/sumup/callback
```

### 5. **Redémarrer l'application**
```bash
./fix-and-start.sh
```

### 6. **Tester l'intégration**
1. Allez sur `http://57.128.183.204:3001/admin/sumup`
2. Vérifiez que la configuration est verte ✅
3. Cliquez sur "Se connecter à SumUp"
4. Suivez le processus OAuth

## 🔧 **Configuration actuelle**

### **URLs importantes :**
- **Interface publique** : `http://57.128.183.204:3001`
- **Interface admin** : `http://57.128.183.204:3001/admin/login`
- **Interface SumUp** : `http://57.128.183.204:3001/admin/sumup`
- **Callback SumUp** : `http://57.128.183.204:5000/api/sumup/callback`

### **Ports utilisés :**
- **Frontend** : `3001` (React)
- **Backend** : `5000` (Node.js/Express)
- **Base de données** : `3306` (MariaDB)

## ⚠️ **Points importants**

### **Pourquoi utiliser l'IP publique ?**
- SumUp doit pouvoir accéder à votre serveur depuis Internet
- `localhost` n'est accessible que depuis votre machine
- L'IP `57.128.183.204` est accessible depuis partout

### **Sécurité :**
- Gardez vos `Client ID` et `Client Secret` secrets
- Ne les commitez jamais dans Git
- Utilisez HTTPS en production (avec un domaine)

### **En cas de problème :**
1. Vérifiez que le port 5000 est ouvert sur votre VPS
2. Vérifiez que l'URL de callback correspond exactement
3. Vérifiez que vos identifiants SumUp sont corrects

## 🎯 **Prochaines étapes**

Une fois configuré :
1. **Authentification** : Connectez-vous à SumUp
2. **Paiements** : Testez la création de paiements
3. **Synchronisation** : Configurez la sync des produits (si disponible)

## 📞 **Support**

Si vous avez des problèmes :
1. Vérifiez les logs du serveur : `tail -f server.log`
2. Vérifiez la configuration : `http://57.128.183.204:3001/admin/sumup`
3. Consultez la documentation SumUp : [developer.sumup.com](https://developer.sumup.com)

---

**🎉 Une fois configuré, vous aurez une vraie intégration SumUp fonctionnelle !**
