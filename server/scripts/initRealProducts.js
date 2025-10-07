const { sequelize } = require('../config/database');
const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');
require('dotenv').config();

const realProducts = [
  // Bières
  {
    name: 'Kwak 25cl',
    category: 'biere',
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
    category: 'biere',
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
    category: 'biere',
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
    category: 'biere',
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
    category: 'biere',
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
    category: 'biere',
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
    category: 'biere',
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
    category: 'biere',
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
    category: 'vin',
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
    category: 'vin',
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
    category: 'accessoire',
    description: 'Écocup non remboursable',
    basePrice: 1.00,
    currentPrice: 1.00,
    initialStock: 200,
    stock: 200,
    salesCount: 0,
    isActive: true
  }
];

async function initRealProducts() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à MariaDB réussie');

    // Supprimer tous les produits existants
    await Product.destroy({ where: {} });
    await PriceHistory.destroy({ where: {} });
    console.log('🗑️  Anciens produits supprimés');

    // Créer les nouveaux produits
    console.log('🍺 Création des produits de la soirée...');
    
    for (const productData of realProducts) {
      const product = await Product.create(productData);
      
      // Créer l'entrée d'historique des prix
      await PriceHistory.create({
        product_id: product.id,
        price: product.currentPrice,
        sales_count: product.salesCount
      });
      
      console.log(`✅ ${product.name} créé (${product.category}) - ${product.currentPrice}€`);
    }

    console.log(`\n🎉 ${realProducts.length} produits créés avec succès !`);
    console.log('\n📊 Résumé par catégorie :');
    
    const categories = [...new Set(realProducts.map(p => p.category))];
    categories.forEach(category => {
      const count = realProducts.filter(p => p.category === category).length;
      console.log(`  ${category}: ${count} produits`);
    });

    await sequelize.close();
    console.log('\n🔌 Déconnexion de MariaDB');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des produits:', error);
  }
}

if (require.main === module) {
  initRealProducts();
}

module.exports = { initRealProducts };
