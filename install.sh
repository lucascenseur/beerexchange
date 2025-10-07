#!/bin/bash

# Script d'installation automatique pour Beer Exchange
# Supporte macOS, Ubuntu/Debian, et CentOS/RHEL

set -e

echo "🍺 Installation de Beer Exchange..."
echo "=================================="

# Détecter le système d'exploitation
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ -f /etc/debian_version ]]; then
    OS="debian"
elif [[ -f /etc/redhat-release ]]; then
    OS="redhat"
else
    echo "❌ Système d'exploitation non supporté"
    exit 1
fi

echo "🖥️  Système détecté: $OS"

# Fonction pour installer Node.js
install_nodejs() {
    echo "📦 Installation de Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 16 ]; then
            echo "✅ Node.js v$(node --version) déjà installé"
            return 0
        fi
    fi
    
    case $OS in
        "macos")
            if command -v brew &> /dev/null; then
                brew install node
            else
                echo "❌ Homebrew non installé. Installez Node.js manuellement depuis nodejs.org"
                exit 1
            fi
            ;;
        "debian")
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        "redhat")
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
            ;;
    esac
    
    echo "✅ Node.js installé: $(node --version)"
}

# Fonction pour installer MongoDB
install_mongodb() {
    echo "🗄️  Installation de MongoDB..."
    
    if command -v mongod &> /dev/null; then
        echo "✅ MongoDB déjà installé"
        return 0
    fi
    
    case $OS in
        "macos")
            if command -v brew &> /dev/null; then
                brew tap mongodb/brew
                brew install mongodb-community
                brew services start mongodb-community
            else
                echo "❌ Homebrew non installé. Installez MongoDB manuellement"
                exit 1
            fi
            ;;
        "debian")
            wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
            echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
            sudo apt-get update
            sudo apt-get install -y mongodb-org
            sudo systemctl start mongod
            sudo systemctl enable mongod
            ;;
        "redhat")
            echo "[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc" | sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo
            sudo yum install -y mongodb-org
            sudo systemctl start mongod
            sudo systemctl enable mongod
            ;;
    esac
    
    echo "✅ MongoDB installé et démarré"
}

# Fonction pour installer Git
install_git() {
    echo "📥 Installation de Git..."
    
    if command -v git &> /dev/null; then
        echo "✅ Git déjà installé: $(git --version)"
        return 0
    fi
    
    case $OS in
        "macos")
            if command -v brew &> /dev/null; then
                brew install git
            else
                echo "❌ Homebrew non installé. Installez Git manuellement"
                exit 1
            fi
            ;;
        "debian")
            sudo apt-get update
            sudo apt-get install -y git
            ;;
        "redhat")
            sudo yum install -y git
            ;;
    esac
    
    echo "✅ Git installé: $(git --version)"
}

# Installation des prérequis
echo "🔧 Installation des prérequis..."
install_git
install_nodejs
install_mongodb

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Ce script doit être exécuté depuis le répertoire racine de Beer Exchange"
    exit 1
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm run install-all

# Configurer l'environnement
echo "⚙️  Configuration de l'environnement..."
if [ ! -f "server/.env" ]; then
    cp server/env.example server/.env
    echo "✅ Fichier .env créé"
else
    echo "✅ Fichier .env existe déjà"
fi

# Attendre que MongoDB soit prêt
echo "⏳ Attente que MongoDB soit prêt..."
sleep 5

# Initialiser la base de données
echo "🗄️  Initialisation de la base de données..."
cd server
node scripts/initUsers.js all
cd ..

echo ""
echo "🎉 Installation terminée !"
echo "=========================="
echo ""
echo "🚀 Pour démarrer Beer Exchange :"
echo "   npm run dev"
echo ""
echo "🌐 Accès aux interfaces :"
echo "   Interface publique: http://localhost:3000"
echo "   Interface serveur:  http://localhost:3000/server/login"
echo "   Interface admin:    http://localhost:3000/admin/login"
echo ""
echo "🔑 Comptes par défaut :"
echo "   Admin:  admin / admin123"
echo "   Serveur: server / server123"
echo ""
echo "📚 Documentation :"
echo "   README.md - Documentation complète"
echo "   INSTALLATION.md - Guide d'installation détaillé"
echo "   DEMO.md - Guide de démonstration"
echo ""
echo "🍺 Beer Exchange est prêt pour vos soirées étudiantes !"
