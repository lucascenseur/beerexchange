const { sequelize } = require('../config/database');
const User = require('../models/User');
const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');
const Sale = require('../models/Sale');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const initUsers = async () => {
  try {
    // Connexion à MariaDB
    await sequelize.authenticate();
    console.log('✅ Connexion à MariaDB réussie');

    // Synchroniser les modèles
    await sequelize.sync({ force: true });
    console.log('🗑️  Tables recréées');

    // Créer l'utilisateur admin avec mot de passe hashé
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);
    
    const adminUser = await User.create({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: hashedAdminPassword,
      role: 'admin',
      is_active: true
    });
    console.log('👑 Utilisateur admin créé:', adminUser.username);

    // Créer l'utilisateur serveur avec mot de passe hashé
    const serverPassword = process.env.SERVER_PASSWORD || 'server123';
    const hashedServerPassword = await bcrypt.hash(serverPassword, 12);
    
    const serverUser = await User.create({
      username: 'server',
      password: hashedServerPassword,
      role: 'server',
      is_active: true
    });
    console.log('🍺 Utilisateur serveur créé:', serverUser.username);

    console.log('✅ Initialisation des utilisateurs terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  }
};

const initProducts = async () => {
  try {
    // Connexion à MariaDB
    await sequelize.authenticate();
    console.log('✅ Connexion à MariaDB réussie');

    // Utiliser les vrais produits de la soirée étudiante
    const { quickInit } = require('./quickInit');
    await quickInit();

    console.log('✅ Initialisation des produits terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des produits:', error);
  }
};

// Exécuter l'initialisation
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'users') {
    initUsers();
  } else if (command === 'products') {
    initProducts();
  } else if (command === 'all') {
    initUsers().then(() => {
      setTimeout(() => {
        initProducts().then(() => {
          sequelize.close();
          console.log('🔌 Déconnexion de MariaDB');
        });
      }, 1000);
    });
  } else {
    console.log('Usage: node initMariaDB.js [users|products|all]');
    console.log('  users    - Initialiser seulement les utilisateurs');
    console.log('  products - Initialiser seulement les produits');
    console.log('  all      - Initialiser utilisateurs et produits');
  }
}

module.exports = { initUsers, initProducts };
