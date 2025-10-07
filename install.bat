@echo off
REM Script d'installation pour Windows - Beer Exchange
REM Nécessite PowerShell ou Command Prompt

echo 🍺 Installation de Beer Exchange sur Windows...
echo ================================================

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé
    echo 📥 Téléchargez Node.js depuis: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js détecté: 
node --version

REM Vérifier si MongoDB est installé
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MongoDB n'est pas installé
    echo 📥 Téléchargez MongoDB depuis: https://www.mongodb.com/try/download/community
    echo 💡 Ou utilisez MongoDB Atlas (cloud)
    pause
    exit /b 1
)

echo ✅ MongoDB détecté: 
mongod --version

REM Installer les dépendances
echo 📦 Installation des dépendances...
call npm run install-all

REM Configurer l'environnement
echo ⚙️ Configuration de l'environnement...
if not exist "server\.env" (
    copy "server\env.example" "server\.env"
    echo ✅ Fichier .env créé
) else (
    echo ✅ Fichier .env existe déjà
)

REM Démarrer MongoDB (si installé localement)
echo 🗄️ Démarrage de MongoDB...
net start MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Service MongoDB démarré
) else (
    echo ⚠️ Impossible de démarrer MongoDB automatiquement
    echo 💡 Démarrez MongoDB manuellement ou utilisez MongoDB Atlas
)

REM Attendre que MongoDB soit prêt
echo ⏳ Attente que MongoDB soit prêt...
timeout /t 5 /nobreak >nul

REM Initialiser la base de données
echo 🗄️ Initialisation de la base de données...
cd server
call node scripts/initUsers.js all
cd ..

echo.
echo 🎉 Installation terminée !
echo ==========================
echo.
echo 🚀 Pour démarrer Beer Exchange :
echo    npm run dev
echo.
echo 🌐 Accès aux interfaces :
echo    Interface publique: http://localhost:3000
echo    Interface serveur:  http://localhost:3000/server/login
echo    Interface admin:    http://localhost:3000/admin/login
echo.
echo 🔑 Comptes par défaut :
echo    Admin:  admin / admin123
echo    Serveur: server / server123
echo.
echo 📚 Documentation :
echo    README.md - Documentation complète
echo    INSTALLATION.md - Guide d'installation détaillé
echo    DEMO.md - Guide de démonstration
echo.
echo 🍺 Beer Exchange est prêt pour vos soirées étudiantes !
echo.
pause
