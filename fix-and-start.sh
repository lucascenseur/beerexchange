#!/bin/bash

# Script de correction et démarrage rapide pour Beer Exchange
# Ce script corrige tous les problèmes et démarre l'application

set -e

echo "🔧 Correction et démarrage de Beer Exchange..."
echo "=============================================="

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 1. S'assurer que MariaDB est démarré
print_status "Démarrage de MariaDB..."
systemctl start mariadb 2>/dev/null || true
systemctl enable mariadb 2>/dev/null || true
print_success "MariaDB démarré"

# 2. Créer la base de données si elle n'existe pas
print_status "Configuration de la base de données..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS beer_exchange;" 2>/dev/null || true
mysql -u root -e "CREATE USER IF NOT EXISTS 'beer_user'@'localhost' IDENTIFIED BY 'beer_password';" 2>/dev/null || true
mysql -u root -e "GRANT ALL PRIVILEGES ON beer_exchange.* TO 'beer_user'@'localhost';" 2>/dev/null || true
mysql -u root -e "FLUSH PRIVILEGES;" 2>/dev/null || true
print_success "Base de données configurée"

# 3. S'assurer que le fichier .env existe
print_status "Vérification de la configuration..."
if [ ! -f "server/.env" ]; then
    cp server/env.example server/.env
    print_success "Fichier .env créé"
else
    print_success "Fichier .env existe"
fi

# 4. Créer les fichiers publics manquants
print_status "Vérification des fichiers publics..."
mkdir -p client/public

if [ ! -f "client/public/index.html" ]; then
    cat > client/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#FFD700" />
    <meta name="description" content="Beer Exchange - Marché en temps réel des boissons pour soirées étudiantes" />
    <title>Beer Exchange - Marché des Boissons</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🍺%3C/text%3E%3C/svg%3E">
  </head>
  <body>
    <noscript>Vous devez activer JavaScript pour utiliser cette application.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF
    print_success "Fichier index.html créé"
fi

if [ ! -f "client/public/manifest.json" ]; then
    cat > client/public/manifest.json << 'EOF'
{
  "short_name": "Beer Exchange",
  "name": "Beer Exchange - Marché des Boissons",
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#FFD700",
  "background_color": "#1a1a2e"
}
EOF
    print_success "Fichier manifest.json créé"
fi

# 5. Arrêter les processus existants
print_status "Arrêt des processus existants..."
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
pkill -f "node index.js" 2>/dev/null || true
sleep 2
print_success "Processus arrêtés"

# 6. Initialiser la base de données
print_status "Initialisation de la base de données..."
cd server
node scripts/initMariaDB.js all
cd ..
print_success "Base de données initialisée"

# 7. Démarrer l'application
print_status "Démarrage de l'application..."
print_success "Tout est prêt ! Démarrage de Beer Exchange..."
echo ""
echo "🌐 Accès aux interfaces :"
echo "   Interface publique: http://$(hostname -I | awk '{print $1}'):3001"
echo "   Interface serveur:  http://$(hostname -I | awk '{print $1}'):3001/server/login"
echo "   Interface admin:    http://$(hostname -I | awk '{print $1}'):3001/admin/login"
echo ""
echo "🔑 Comptes de démonstration :"
echo "   Admin:  admin / admin123"
echo "   Serveur: server / server123"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter l'application"
echo ""

# Démarrer l'application
npm run dev
