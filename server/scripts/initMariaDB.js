const { sequelize } = require('../config/database');
const User = require('../models/User');
const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');
const Sale = require('../models/Sale');
require('dotenv').config();

const initUsers = async () => {
  try {
    // Connexion à MariaDB
    await sequelize.authenticate();
    console.log('✅ Connexion à MariaDB réussie');

    // Synchroniser les modèles
    await sequelize.sync({ force: true });
    console.log('🗑️  Tables recréées');

    // Créer l'utilisateur admin
    const adminUser = await User.create({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin'
    });
    console.log('👑 Utilisateur admin créé:', adminUser.username);

    // Créer l'utilisateur serveur
    const serverUser = await User.create({
      username: 'server',
      password: process.env.SERVER_PASSWORD || 'server123',
      role: 'server'
    });
    console.log('🍺 Utilisateur serveur créé:', serverUser.username);

    console.log('✅ Initialisation des utilisateurs terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Déconnexion de MariaDB');
  }
};

const initProducts = async () => {
  try {
    // Connexion à MariaDB
    await sequelize.authenticate();
    console.log('✅ Connexion à MariaDB réussie');

    // Produits de démonstration
    const demoProducts = [
      {
        name: 'Kronenbourg 1664',
        description: 'Bière blonde française classique',
        category: 'beer',
        basePrice: 3.50,
        currentPrice: 3.50,
        stock: 50,
        initialStock: 50
      },
      {
        name: 'Heineken',
        description: 'Bière blonde néerlandaise',
        category: 'beer',
        basePrice: 3.80,
        currentPrice: 3.80,
        stock: 40,
        initialStock: 40
      },
      {
        name: 'Corona Extra',
        description: 'Bière mexicaine avec citron',
        category: 'beer',
        basePrice: 4.20,
        currentPrice: 4.20,
        stock: 30,
        initialStock: 30
      },
      {
        name: 'Guinness',
        description: 'Bière noire irlandaise',
        category: 'beer',
        basePrice: 4.50,
        currentPrice: 4.50,
        stock: 25,
        initialStock: 25
      },
      {
        name: 'Mojito',
        description: 'Cocktail à la menthe et citron vert',
        category: 'cocktail',
        basePrice: 8.00,
        currentPrice: 8.00,
        stock: 20,
        initialStock: 20
      },
      {
        name: 'Cuba Libre',
        description: 'Rhum, cola et citron vert',
        category: 'cocktail',
        basePrice: 7.50,
        currentPrice: 7.50,
        stock: 15,
        initialStock: 15
      },
      {
        name: 'Coca-Cola',
        description: 'Boisson gazeuse classique',
        category: 'soft',
        basePrice: 2.50,
        currentPrice: 2.50,
        stock: 100,
        initialStock: 100
      },
      {
        name: 'Jus d\'orange',
        description: 'Jus de fruit frais',
        category: 'soft',
        basePrice: 3.00,
        currentPrice: 3.00,
        stock: 50,
        initialStock: 50
      },
      {
        name: 'Chips',
        description: 'Chips de pommes de terre',
        category: 'snack',
        basePrice: 2.00,
        currentPrice: 2.00,
        stock: 80,
        initialStock: 80
      },
      {
        name: 'Cacahuètes',
        description: 'Cacahuètes salées',
        category: 'snack',
        basePrice: 1.50,
        currentPrice: 1.50,
        stock: 60,
        initialStock: 60
      }
    ];

    for (const productData of demoProducts) {
      const product = await Product.create(productData);
      console.log(`🍺 Produit créé: ${product.name}`);
      
      // Créer l'entrée initiale dans l'historique des prix
      await PriceHistory.create({
        productId: product.id,
        price: product.basePrice,
        salesCount: 0
      });
    }

    console.log('✅ Initialisation des produits terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des produits:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Déconnexion de MariaDB');
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
        initProducts();
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
