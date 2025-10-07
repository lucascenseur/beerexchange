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
    base_price: 4.00,
    current_price: 4.00,
    initial_stock: 50,
    stock: 50,
    sales_count: 0,
    is_active: true
  },
  {
    name: 'Kwak 50cl',
    category: 'beer',
    description: 'Ambrée 8,4%',
    base_price: 7.00,
    current_price: 7.00,
    initial_stock: 30,
    stock: 30,
    sales_count: 0,
    is_active: true
  },
  {
    name: 'Celtpils 25cl',
    category: 'beer',
    description: 'Blonde 4,8%',
    base_price: 3.00,
    current_price: 3.00,
    initial_stock: 60,
    stock: 60,
    sales_count: 0,
    is_active: true
  },
  {
    name: 'Celtpils 50cl',
    category: 'beer',
    description: 'Blonde 4,8%',
    base_price: 5.00,
    current_price: 5.00,
    initial_stock: 40,
    stock: 40,
    sales_count: 0,
    is_active: true
  },
  {
    name: 'Levrettes Cherry 25cl',
    category: 'beer',
    description: 'Blanche, fruitée 3,5%',
    base_price: 3.50,
    current_price: 3.50,
    initial_stock: 45,
    stock: 45,
    sales_count: 0,
    is_active: true
  },
  {
    name: 'Levrettes Cherry 50cl',
    category: 'beer',
    description: 'Blanche, fruitée 3,5%',
    base_price: 6.00,
    current_price: 6.00,
    initial_stock: 25,
    stock: 25,
    sales_count: 0,
    is_active: true
  },
  {
    name: 'Levrettes Pêche 25cl',
    category: 'beer',
    description: 'Blanche, fruitée 3,7%',
    base_price: 3.50,
    current_price: 3.50,
    initial_stock: 45,
    stock: 45,
    sales_count: 0,
    is_active: true
  },
  {
    name: 'Levrettes Pêche 50cl',
    category: 'beer',
    description: 'Blanche, fruitée 3,7%',
    base_price: 6.00,
    current_price: 6.00,
    initial_stock: 25,
    stock: 25,
    sales_count: 0,
    is_active: true
  },
  // Vins
  {
    name: 'Vin blanc (verre)',
    category: 'cocktail',
    description: 'Vin blanc au verre',
    base_price: 3.50,
    current_price: 3.50,
    initial_stock: 100,
    stock: 100,
    sales_count: 0,
    is_active: true
  },
  {
    name: 'Rosé (verre)',
    category: 'cocktail',
    description: 'Rosé au verre',
    base_price: 3.50,
    current_price: 3.50,
    initial_stock: 100,
    stock: 100,
    sales_count: 0,
    is_active: true
  },
  // Softs
  {
    name: 'Soft classique',
    category: 'soft',
    description: 'Boisson non alcoolisée',
    base_price: 2.00,
    current_price: 2.00,
    initial_stock: 80,
    stock: 80,
    sales_count: 0,
    is_active: true
  },
  {
    name: 'RedBull',
    category: 'soft',
    description: 'Boisson énergisante',
    base_price: 3.00,
    current_price: 3.00,
    initial_stock: 50,
    stock: 50,
    sales_count: 0,
    is_active: true
  },
  {
    name: 'Eau',
    category: 'soft',
    description: 'Eau plate',
    base_price: 1.00,
    current_price: 1.00,
    initial_stock: 100,
    stock: 100,
    sales_count: 0,
    is_active: true
  },
  // Écocup
  {
    name: 'Écocup',
    category: 'other',
    description: 'Écocup non remboursable',
    base_price: 1.00,
    current_price: 1.00,
    initial_stock: 200,
    stock: 200,
    sales_count: 0,
    is_active: true
  }
];

async function quickInit() {
  try {
    console.log('🔌 Connexion à MariaDB...');
    await sequelize.authenticate();
    console.log('✅ Connexion réussie');

    console.log('🗑️  Suppression des anciens produits...');
    await PriceHistory.destroy({ where: {}, truncate: true });
    await Product.destroy({ where: {}, truncate: true });
    console.log('✅ Anciens produits supprimés');

    console.log('🍺 Création des nouveaux produits...');

    for (const productData of realProducts) {
      const product = await Product.create(productData);

      // Créer l'entrée d'historique des prix
      await PriceHistory.create({
        productId: product.id,
        price: product.current_price,
        salesCount: product.sales_count
      });

      console.log(`✅ ${product.name} créé - ${product.current_price}€`);
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