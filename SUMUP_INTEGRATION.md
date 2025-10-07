# 💳 Intégration SumUp - Beer Exchange

## 🎯 Vue d'ensemble

L'intégration SumUp permet de synchroniser automatiquement les produits et les ventes entre Beer Exchange et SumUp, offrant une solution de paiement professionnelle pour vos soirées étudiantes.

## 🔧 Configuration

### 1. Variables d'environnement

Ajoutez ces variables à votre fichier `.env` :

```env
# Configuration SumUp
SUMUP_BASE_URL=https://api.sumup.com
SUMUP_CLIENT_ID=your-sumup-client-id
SUMUP_CLIENT_SECRET=your-sumup-client-secret
SUMUP_REDIRECT_URI=http://localhost:5000/api/sumup/callback
```

### 2. Création d'une application SumUp

1. Connectez-vous à [SumUp Developer Portal](https://developer.sumup.com/)
2. Créez une nouvelle application
3. Configurez les URLs de redirection :
   - **Callback URL** : `http://localhost:5000/api/sumup/callback`
   - **Webhook URL** : `http://localhost:5000/api/sumup/webhooks`
4. Notez votre `Client ID` et `Client Secret`

## 🚀 Fonctionnalités

### ✅ Authentification OAuth 2.0
- Flux d'authentification sécurisé
- Gestion automatique des tokens
- Rafraîchissement automatique des tokens expirés

### ✅ Synchronisation des Produits
- **Import depuis SumUp** : Récupération automatique du catalogue
- **Export vers SumUp** : Création/mise à jour des produits
- **Synchronisation bidirectionnelle** : Mise à jour en temps réel

### ✅ Gestion des Ventes
- Création automatique de paiements SumUp
- Suivi des transactions
- Intégration avec l'algorithme de prix dynamique

### ✅ Interface d'Administration
- Dashboard dédié à SumUp
- Contrôle de la synchronisation
- Visualisation des produits SumUp

## 📱 Utilisation

### 1. Authentification

1. Accédez à l'interface admin : `http://localhost:3001/admin/dashboard`
2. Cliquez sur l'icône 💳 (SumUp)
3. Cliquez sur "S'authentifier avec SumUp"
4. Suivez le processus OAuth dans la nouvelle fenêtre
5. Une fois authentifié, vous verrez les informations de votre compte

### 2. Synchronisation des Produits

#### Import depuis SumUp
```bash
POST /api/sumup/sync/from-sumup
```
- Récupère tous les produits de votre catalogue SumUp
- Les importe dans Beer Exchange
- Met à jour les prix et descriptions

#### Export vers SumUp
```bash
POST /api/sumup/sync/to-sumup
```
- Envoie tous les produits Beer Exchange vers SumUp
- Crée de nouveaux produits si nécessaire
- Met à jour les produits existants

### 3. Synchronisation Automatique

Démarrez la synchronisation automatique :
```bash
POST /api/sumup/sync/auto-start
{
  "intervalMinutes": 5
}
```

Arrêtez la synchronisation :
```bash
POST /api/sumup/sync/auto-stop
```

## 🔄 Flux de Synchronisation

### Import depuis SumUp
1. **Récupération** : Obtention du catalogue SumUp via API
2. **Comparaison** : Comparaison avec les produits Beer Exchange
3. **Mise à jour** : Mise à jour des prix et descriptions
4. **Création** : Création de nouveaux produits si nécessaire

### Export vers SumUp
1. **Récupération** : Obtention des produits Beer Exchange
2. **Mapping** : Conversion des catégories et formats
3. **Création/Mise à jour** : Synchronisation avec SumUp
4. **Confirmation** : Vérification de la synchronisation

## 🎨 Interface Utilisateur

### Dashboard SumUp
- **Statut d'authentification** : Vérification de la connexion
- **Actions de synchronisation** : Boutons pour importer/exporter
- **Liste des produits** : Visualisation du catalogue SumUp
- **Statut de synchronisation** : Indicateurs en temps réel

### Intégration Admin
- **Bouton SumUp** : Accès rapide depuis l'interface admin
- **Indicateurs visuels** : Statut de connexion et synchronisation
- **Notifications** : Feedback en temps réel des opérations

## 🔧 API Endpoints

### Authentification
- `GET /api/sumup/auth` - Initier l'authentification OAuth
- `GET /api/sumup/callback` - Callback OAuth
- `GET /api/sumup/status` - Vérifier le statut d'authentification

### Produits
- `GET /api/sumup/products` - Récupérer les produits SumUp
- `POST /api/sumup/products` - Créer un produit dans SumUp
- `PUT /api/sumup/products/:id` - Mettre à jour un produit SumUp
- `DELETE /api/sumup/products/:id` - Supprimer un produit SumUp

### Synchronisation
- `POST /api/sumup/sync/from-sumup` - Synchroniser depuis SumUp
- `POST /api/sumup/sync/to-sumup` - Synchroniser vers SumUp
- `GET /api/sumup/sync/status` - Statut de synchronisation
- `POST /api/sumup/sync/auto-start` - Démarrer la sync automatique
- `POST /api/sumup/sync/auto-stop` - Arrêter la sync automatique

### Paiements
- `POST /api/sumup/payments` - Créer un paiement SumUp

## 🗄️ Base de Données

### Table `sumup_tokens`
Stockage sécurisé des tokens OAuth :
- `access_token` : Token d'accès SumUp
- `refresh_token` : Token de rafraîchissement
- `expires_in` : Durée de validité
- `merchant_id` : ID du marchand SumUp
- `merchant_email` : Email du marchand

## 🔒 Sécurité

### Tokens OAuth
- Stockage sécurisé en base de données
- Rafraîchissement automatique avant expiration
- Gestion des erreurs d'authentification

### API Calls
- Authentification Bearer Token
- Gestion des erreurs et timeouts
- Logs détaillés pour le debugging

## 🐛 Dépannage

### Erreurs d'authentification
```bash
# Vérifier le statut
curl http://localhost:5000/api/sumup/status

# Relancer l'authentification
curl http://localhost:5000/api/sumup/auth
```

### Erreurs de synchronisation
```bash
# Vérifier les logs du serveur
tail -f server.log

# Tester la connexion SumUp
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.sumup.com/v1/me/catalog/products
```

### Problèmes de tokens
- Vérifiez que les tokens ne sont pas expirés
- Relancez l'authentification si nécessaire
- Vérifiez les variables d'environnement

## 📊 Monitoring

### Logs
- Authentification OAuth
- Synchronisation des produits
- Erreurs API SumUp
- Statut des tokens

### Métriques
- Nombre de produits synchronisés
- Fréquence des synchronisations
- Taux de succès des opérations
- Temps de réponse des API

## 🚀 Déploiement

### Production
1. Mettez à jour les URLs de callback :
   ```env
   SUMUP_REDIRECT_URI=https://votre-domaine.com/api/sumup/callback
   ```

2. Configurez les webhooks SumUp :
   ```
   https://votre-domaine.com/api/sumup/webhooks
   ```

3. Activez la synchronisation automatique :
   ```bash
   curl -X POST http://votre-domaine.com/api/sumup/sync/auto-start \
        -H "Content-Type: application/json" \
        -d '{"intervalMinutes": 10}'
   ```

## 📈 Évolutions Futures

### Fonctionnalités Prévues
- **Webhooks SumUp** : Notifications en temps réel
- **Analytics** : Statistiques de vente détaillées
- **Multi-marchands** : Support de plusieurs comptes SumUp
- **Synchronisation avancée** : Règles de mapping personnalisées

### Améliorations Techniques
- **Cache Redis** : Optimisation des performances
- **Queue System** : Traitement asynchrone des synchronisations
- **Retry Logic** : Gestion des échecs temporaires
- **Rate Limiting** : Respect des limites API SumUp

---

## 🎉 Conclusion

L'intégration SumUp transforme Beer Exchange en une solution de paiement professionnelle, offrant :

- ✅ **Synchronisation automatique** des produits
- ✅ **Paiements sécurisés** via SumUp
- ✅ **Interface intuitive** pour la gestion
- ✅ **Monitoring complet** des opérations

**Votre soirée étudiante est maintenant équipée d'un système de paiement professionnel !** 🍺💳✨
