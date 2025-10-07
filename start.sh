#!/bin/bash

echo "🍺 Démarrage de Beer Exchange..."
echo "================================"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si MongoDB est installé
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB n'est pas installé. Assurez-vous qu'il est installé et démarré."
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installation des dépendances du serveur..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installation des dépendances du client..."
    cd client && npm install && cd ..
fi

# Vérifier si le fichier .env existe
if [ ! -f "server/.env" ]; then
    echo "⚙️  Création du fichier de configuration..."
    cp server/env.example server/.env
    echo "✅ Fichier .env créé. Vous pouvez le modifier si nécessaire."
fi

# Vérifier si le port 3000 est utilisé et le libérer si nécessaire
if lsof -i :3000 >/dev/null 2>&1; then
    echo "⚠️  Le port 3000 est déjà utilisé. Beer Exchange utilisera le port 3001."
    echo "🔄 Arrêt des processus utilisant le port 3000..."
    sudo pkill -f "react-scripts start" 2>/dev/null || true
    sleep 2
fi

# Initialiser la base de données si nécessaire
echo "🗄️  Initialisation de la base de données..."
cd server
node scripts/initMariaDB.js all
echo "🍺 Initialisation des produits de la soirée..."
node scripts/quickInit.js
cd ..

echo ""
echo "🚀 Démarrage de l'application..."
echo "================================"
echo "Interface publique: http://localhost:3001"
echo "Interface serveur:  http://localhost:3001/server/login"
echo "Interface admin:    http://localhost:3001/admin/login"
echo ""
echo "Comptes de démonstration:"
echo "  Admin:  admin / admin123"
echo "  Serveur: server / server123"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter l'application"
echo ""

# Démarrer l'application
npm run dev
