const { sequelize } = require('../config/database');
const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');
require('dotenv').config();

const realProducts = [
  // Bières
  {
    name: 'Kwak 25cl',
    category: 'beer',
    description: 'Ambrée 8,4%',
    basePrice: 4.00,
    currentPrice: 4.00,
    initialStock: 50,
    stock: 50,
    salesCount: 0,
    isActive: true
  },
  {
    name: 'Kwak 50cl',
    category: 'beer',
    description: 'Ambrée 8,4%',
    basePrice: 7.00,
    currentPrice: 7.00,
    initialStock: 30,
    stock: 30,
    salesCount: 0,
    isActive: true
  },
  {
    name: 'Celtpils 25cl',
    category: 'beer',
    description: 'Blonde 4,8%',
    basePrice: 3.00,
    currentPrice: 3.00,
    initialStock: 60,
    stock: 60,
    salesCount: 0,
    isActive: true
  },
  {
    name: 'Celtpils 50cl',
    category: 'beer',
    description: 'Blonde 4,8%',
    basePrice: 5.00,
    currentPrice: 5.00,
    initialStock: 40,
    stock: 40,
    salesCount: 0,
    isActive: true
  },
  {
    name: 'Levrettes Cherry 25cl',
    category: 'beer',
    description: 'Blanche, fruitée 3,5%',
    basePrice: 3.50,
    currentPrice: 3.50,
    initialStock: 45,
    stock: 45,
    salesCount: 0,
    isActive: true
  },
  {
    name: 'Levrettes Cherry 50cl',
    category: 'beer',
    description: 'Blanche, fruitée 3,5%',
    basePrice: 6.00,
    currentPrice: 6.00,
    initialStock: 25,
    stock: 25,
    salesCount: 0,
    isActive: true
  },
  {
    name: 'Levrettes Pêche 25cl',
    category: 'beer',
    description: 'Blanche, fruitée 3,7%',
    basePrice: 3.50,
    currentPrice: 3.50,
    initialStock: 45,
    stock: 45,
    salesCount: 0,
    isActive: true
  },
  {
    name: 'Levrettes Pêche 50cl',
    category: 'beer',
    description: 'Blanche, fruitée 3,7%',
    basePrice: 6.00,
    currentPrice: 6.00,
    initialStock: 25,
    stock: 25,
    salesCount: 0,
    isActive: true
  },
  // Vins
  {
    name: 'Vin blanc (verre)',
    category: 'cocktail',
    description: 'Vin blanc au verre',
    basePrice: 3.50,
    currentPrice: 3.50,
    initialStock: 100,
    stock: 100,
    salesCount: 0,
    isActive: true
  },
  {
    name: 'Rosé (verre)',
    category: 'cocktail',
    description: 'Rosé au verre',
    basePrice: 3.50,
    currentPrice: 3.50,
    initialStock: 100,
    stock: 100,
    salesCount: 0,
    isActive: true
  },
  // Softs
  {
    name: 'Soft classique',
    category: 'soft',
    description: 'Boisson non alcoolisée',
    basePrice: 2.00,
    currentPrice: 2.00,
    initialStock: 80,
    stock: 80,
    salesCount: 0,
    isActive: true
  },
  {
    name: 'RedBull',
    category: 'soft',
    description: 'Boisson énergisante',
    basePrice: 3.00,
    currentPrice: 3.00,
    initialStock: 50,
    stock: 50,
    salesCount: 0,
    isActive: true
  },
  {
    name: 'Eau',
    category: 'soft',
    description: 'Eau plate',
    basePrice: 1.00,
    currentPrice: 1.00,
    initialStock: 100,
    stock: 100,
    salesCount: 0,
    isActive: true
  },
  // Écocup
  {
    name: 'Écocup',
    category: 'other',
    description: 'Écocup non remboursable',
    basePrice: 1.00,
    currentPrice: 1.00,
    initialStock: 200,
    stock: 200,
    salesCount: 0,
    isActive: true
  }
];

async function quickInit() {
  try {
    console.log('🔌 Connexion à MariaDB...');
    await sequelize.authenticate();
    console.log('✅ Connexion réussie');

    console.log('🗑️  Suppression des anciens produits...');
    // Supprimer d'abord les enregistrements liés (price_history)
    await PriceHistory.destroy({ where: {} });
    // Puis supprimer les produits
    await Product.destroy({ where: {} });
    console.log('✅ Anciens produits supprimés');

    console.log('🍺 Création des nouveaux produits...');

    for (const productData of realProducts) {
      const product = await Product.create(productData);

      // Créer l'entrée d'historique des prix
      await PriceHistory.create({
        productId: product.id,
        price: product.currentPrice,
        salesCount: product.salesCount
      });

      console.log(`✅ ${product.name} créé - ${product.currentPrice}€`);
    }

    console.log(`\n🎉 ${realProducts.length} produits créés avec succès !`);
    console.log(`📊 Total de produits en base : ${await Product.count()}`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    // Ne pas fermer la connexion ici si ce script est appelé par initMariaDB.js
    // await sequelize.close();
  }
}

if (require.main === module) {
  quickInit().then(() => {
    sequelize.close();
    console.log('🔌 Déconnexion de MariaDB');
  });
}

module.exports = { quickInit };