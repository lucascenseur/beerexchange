const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
require('dotenv').config();

const initUsers = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beer-exchange');
    console.log('✅ Connexion à MongoDB réussie');

    // Supprimer les utilisateurs existants (optionnel)
    await User.deleteMany({});
    console.log('🗑️  Anciens utilisateurs supprimés');

    // Créer l'utilisateur admin
    const adminUser = new User({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin'
    });
    await adminUser.save();
    console.log('👑 Utilisateur admin créé:', adminUser.username);

    // Créer l'utilisateur serveur
    const serverUser = new User({
      username: 'server',
      password: process.env.SERVER_PASSWORD || 'server123',
      role: 'server'
    });
    await serverUser.save();
    console.log('🍺 Utilisateur serveur créé:', serverUser.username);

    console.log('✅ Initialisation des utilisateurs terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
  }
};

const initProducts = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beer-exchange');
    console.log('✅ Connexion à MongoDB réussie');

    // Supprimer les produits existants (optionnel)
    await Product.deleteMany({});
    console.log('🗑️  Anciens produits supprimés');

    // Produits de démonstration
    const demoProducts = [
      {
        name: 'Kronenbourg 1664',
        description: 'Bière blonde française classique',
        category: 'beer',
        basePrice: 3.50,
        stock: 50,
        initialStock: 50
      },
      {
        name: 'Heineken',
        description: 'Bière blonde néerlandaise',
        category: 'beer',
        basePrice: 3.80,
        stock: 40,
        initialStock: 40
      },
      {
        name: 'Corona Extra',
        description: 'Bière mexicaine avec citron',
        category: 'beer',
        basePrice: 4.20,
        stock: 30,
        initialStock: 30
      },
      {
        name: 'Guinness',
        description: 'Bière noire irlandaise',
        category: 'beer',
        basePrice: 4.50,
        stock: 25,
        initialStock: 25
      },
      {
        name: 'Mojito',
        description: 'Cocktail à la menthe et citron vert',
        category: 'cocktail',
        basePrice: 8.00,
        stock: 20,
        initialStock: 20
      },
      {
        name: 'Cuba Libre',
        description: 'Rhum, cola et citron vert',
        category: 'cocktail',
        basePrice: 7.50,
        stock: 15,
        initialStock: 15
      },
      {
        name: 'Coca-Cola',
        description: 'Boisson gazeuse classique',
        category: 'soft',
        basePrice: 2.50,
        stock: 100,
        initialStock: 100
      },
      {
        name: 'Jus d\'orange',
        description: 'Jus de fruit frais',
        category: 'soft',
        basePrice: 3.00,
        stock: 50,
        initialStock: 50
      },
      {
        name: 'Chips',
        description: 'Chips de pommes de terre',
        category: 'snack',
        basePrice: 2.00,
        stock: 80,
        initialStock: 80
      },
      {
        name: 'Cacahuètes',
        description: 'Cacahuètes salées',
        category: 'snack',
        basePrice: 1.50,
        stock: 60,
        initialStock: 60
      }
    ];

    for (const productData of demoProducts) {
      const product = new Product({
        ...productData,
        currentPrice: productData.basePrice,
        priceHistory: [{
          price: productData.basePrice,
          timestamp: new Date(),
          salesCount: 0
        }]
      });
      await product.save();
      console.log(`🍺 Produit créé: ${product.name}`);
    }

    console.log('✅ Initialisation des produits terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des produits:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
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
    console.log('Usage: node initUsers.js [users|products|all]');
    console.log('  users    - Initialiser seulement les utilisateurs');
    console.log('  products - Initialiser seulement les produits');
    console.log('  all      - Initialiser utilisateurs et produits');
  }
}

module.exports = { initUsers, initProducts };
