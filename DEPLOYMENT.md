# 🚀 Guide de Déploiement - Beer Exchange

Ce guide vous explique comment déployer Beer Exchange en production.

## 📋 Prérequis

- Serveur avec Docker et Docker Compose installés
- Domaine configuré (optionnel)
- Certificat SSL (recommandé pour la production)

## 🐳 Déploiement avec Docker

### 1. Cloner le projet sur le serveur
```bash
git clone <repository-url>
cd beer-exchange
```

### 2. Configuration de l'environnement
```bash
# Copier et modifier le fichier d'environnement
cp server/env.example server/.env
nano server/.env
```

Variables d'environnement pour la production :
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://admin:password123@mongodb:27017/beer-exchange?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=24h

# Changez ces mots de passe en production !
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
SERVER_PASSWORD=your-secure-server-password
```

### 3. Démarrage avec Docker Compose
```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f
```

### 4. Initialisation de la base de données
```bash
# Initialiser les utilisateurs et produits
docker-compose exec server node scripts/initUsers.js all
```

## 🌐 Configuration du Reverse Proxy (Nginx)

### Installation de Nginx
```bash
sudo apt update
sudo apt install nginx
```

### Configuration Nginx
```bash
sudo nano /etc/nginx/sites-available/beer-exchange
```

Contenu du fichier de configuration :
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Remplacez par votre domaine

    # Redirection vers HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;  # Remplacez par votre domaine

    # Certificats SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Configuration SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Interface publique
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket pour Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Activation du site
```bash
sudo ln -s /etc/nginx/sites-available/beer-exchange /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Configuration SSL avec Let's Encrypt

### Installation de Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

### Obtenir le certificat SSL
```bash
sudo certbot --nginx -d your-domain.com
```

### Renouvellement automatique
```bash
sudo crontab -e
# Ajouter cette ligne :
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring et Logs

### Voir les logs en temps réel
```bash
# Logs de tous les services
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f mongodb
```

### Monitoring des ressources
```bash
# Utilisation des ressources
docker stats

# Espace disque
df -h
```

## 🔄 Mise à jour de l'application

### 1. Sauvegarder les données
```bash
# Sauvegarder la base de données
docker-compose exec mongodb mongodump --db beer-exchange --out /backup

# Copier la sauvegarde
docker cp beer-exchange-mongodb:/backup ./backup-$(date +%Y%m%d)
```

### 2. Mettre à jour le code
```bash
# Arrêter les services
docker-compose down

# Mettre à jour le code
git pull origin main

# Reconstruire et redémarrer
docker-compose up -d --build
```

### 3. Restaurer les données si nécessaire
```bash
# Restaurer la base de données
docker-compose exec mongodb mongorestore --db beer-exchange /backup/beer-exchange
```

## 🛡️ Sécurité

### Firewall
```bash
# Configurer UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Mots de passe sécurisés
- Changez tous les mots de passe par défaut
- Utilisez des mots de passe complexes
- Activez l'authentification à deux facteurs si possible

### Sauvegardes régulières
```bash
# Script de sauvegarde quotidienne
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec mongodb mongodump --db beer-exchange --out /backup
docker cp beer-exchange-mongodb:/backup ./backup-$DATE
```

## 🚨 Dépannage

### Problèmes courants

#### Service ne démarre pas
```bash
# Vérifier les logs
docker-compose logs service-name

# Redémarrer un service
docker-compose restart service-name
```

#### Problème de connexion à la base de données
```bash
# Vérifier le statut de MongoDB
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Vérifier les variables d'environnement
docker-compose exec server env | grep MONGO
```

#### Problème de certificat SSL
```bash
# Renouveler le certificat
sudo certbot renew --force-renewal

# Vérifier la configuration Nginx
sudo nginx -t
```

## 📈 Optimisation des performances

### Configuration MongoDB
```javascript
// Dans mongo-init.js, ajouter :
db.adminCommand({
  setParameter: 1,
  wiredTigerConcurrentReadTransactions: 256,
  wiredTigerConcurrentWriteTransactions: 256
});
```

### Configuration Nginx
```nginx
# Ajouter dans la configuration Nginx :
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Cache pour les assets statiques
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 📞 Support

En cas de problème :
1. Vérifiez les logs : `docker-compose logs -f`
2. Consultez la documentation
3. Vérifiez les issues GitHub
4. Créez une nouvelle issue si nécessaire

---

**Beer Exchange** - Prêt pour la production ! 🍺🚀
