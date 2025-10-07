#!/bin/bash

# Script d'installation complète pour Beer Exchange avec MariaDB
# Ce script installe et configure tout automatiquement

set -e

echo "🍺 Installation complète de Beer Exchange..."
echo "============================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then
    print_error "Ce script doit être exécuté en tant que root"
    exit 1
fi

# 1. Mise à jour du système
print_status "Mise à jour du système..."
apt update -y

# 2. Installation de Node.js
print_status "Installation de Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    print_success "Node.js installé: $(node --version)"
else
    print_success "Node.js déjà installé: $(node --version)"
fi

# 3. Installation de MariaDB
print_status "Installation de MariaDB..."
if ! command -v mysql &> /dev/null; then
    apt install -y mariadb-server
    systemctl start mariadb
    systemctl enable mariadb
    print_success "MariaDB installé et démarré"
else
    print_success "MariaDB déjà installé"
    systemctl start mariadb
fi

# 4. Configuration de MariaDB
print_status "Configuration de la base de données..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS beer_exchange;" 2>/dev/null || true
mysql -u root -e "CREATE USER IF NOT EXISTS 'beer_user'@'localhost' IDENTIFIED BY 'beer_password';" 2>/dev/null || true
mysql -u root -e "GRANT ALL PRIVILEGES ON beer_exchange.* TO 'beer_user'@'localhost';" 2>/dev/null || true
mysql -u root -e "FLUSH PRIVILEGES;" 2>/dev/null || true
print_success "Base de données configurée"

# 5. Installation des dépendances
print_status "Installation des dépendances..."
cd /var/www/beerexchange
npm run install-all
print_success "Dépendances installées"

# 6. Configuration de l'environnement
print_status "Configuration de l'environnement..."
if [ ! -f "server/.env" ]; then
    cp server/env.example server/.env
    print_success "Fichier .env créé"
else
    print_success "Fichier .env existe déjà"
fi

# 7. Vérifier que les fichiers publics existent
print_status "Vérification des fichiers publics..."
if [ ! -f "client/public/index.html" ]; then
    mkdir -p client/public
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

# 8. Initialisation de la base de données
print_status "Initialisation de la base de données..."
cd server
node scripts/initMariaDB.js all
print_success "Base de données initialisée"

# 8.1. Initialisation des produits de la soirée
print_status "Initialisation des produits de la soirée..."
node scripts/quickInit.js
print_success "Produits de la soirée initialisés"
cd ..

# 9. Configuration du firewall
print_status "Configuration du firewall..."
ufw allow 3001/tcp 2>/dev/null || true
ufw allow 5000/tcp 2>/dev/null || true
print_success "Ports ouverts"

# 10. Démarrage de l'application
print_status "Démarrage de l'application..."
print_success "Installation terminée !"
echo ""
echo "🎉 Beer Exchange est maintenant installé et configuré !"
echo "======================================================"
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
echo "🚀 Pour démarrer l'application :"
echo "   cd /var/www/beerexchange"
echo "   ./start.sh"
echo ""
echo "📚 Documentation :"
echo "   README.md - Documentation complète"
echo "   INSTALLATION.md - Guide d'installation"
echo "   DEMO.md - Guide de démonstration"
echo ""
print_success "Installation complète terminée !"
