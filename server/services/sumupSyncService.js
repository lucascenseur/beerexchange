const axios = require('axios');
const cron = require('node-cron');

class SumUpSyncService {
  constructor() {
    this.isRunning = false;
    this.syncInterval = null;
    this.lastSyncTime = null;
    this.syncStats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastError: null
    };
  }

  // Démarrer la synchronisation automatique
  startAutoSync(intervalMinutes = 5) {
    if (this.isRunning) {
      console.log('⚠️ Synchronisation automatique déjà en cours');
      return;
    }

    console.log(`🔄 Démarrage synchronisation automatique (${intervalMinutes}min)`);
    this.isRunning = true;

    // Synchronisation immédiate
    this.performFullSync();

    // Puis toutes les X minutes
    this.syncInterval = cron.schedule(`*/${intervalMinutes} * * * *`, () => {
      this.performFullSync();
    });

    console.log('✅ Synchronisation automatique démarrée');
  }

  // Arrêter la synchronisation automatique
  stopAutoSync() {
    if (!this.isRunning) {
      console.log('⚠️ Aucune synchronisation automatique en cours');
      return;
    }

    if (this.syncInterval) {
      this.syncInterval.destroy();
      this.syncInterval = null;
    }

    this.isRunning = false;
    console.log('⏹️ Synchronisation automatique arrêtée');
  }

  // Effectuer une synchronisation complète
  async performFullSync() {
    try {
      // Protection contre les synchronisations trop fréquentes
      if (this.lastSyncTime && (Date.now() - this.lastSyncTime.getTime()) < 30000) {
        console.log('⏳ Synchronisation ignorée (trop récente)');
        return;
      }

      console.log('🔄 Début synchronisation complète SumUp...');
      this.syncStats.totalSyncs++;

      // 1. Synchroniser les prix depuis SumUp vers Beer Exchange
      await this.syncPricesFromSumUp();

      // 2. Synchroniser les ventes depuis SumUp
      await this.syncSalesFromSumUp();

      // 3. Synchronisation vers SumUp désactivée (API ne le permet pas)
      console.log('⚠️ Synchronisation vers SumUp désactivée (API limitée)');

      this.syncStats.successfulSyncs++;
      this.lastSyncTime = new Date();
      console.log('✅ Synchronisation complète terminée');

    } catch (error) {
      this.syncStats.failedSyncs++;
      this.syncStats.lastError = error.message;
      console.error('❌ Erreur synchronisation complète:', error);
    }
  }

  // Synchroniser les prix depuis SumUp
  async syncPricesFromSumUp() {
    try {
      console.log('📥 Synchronisation des prix depuis SumUp...');
      
      // Récupérer les produits SumUp (simulation car API limitée)
      const sumupProducts = await this.getSumUpProducts();
      
      if (sumupProducts.length === 0) {
        console.log('📦 Aucun produit SumUp trouvé');
        return;
      }

      const Product = require('../models/Product');
      let updatedCount = 0;

      for (const sumupProduct of sumupProducts) {
        try {
          const existingProduct = await Product.findOne({
            where: { name: sumupProduct.name }
          });

          const currentPrice = existingProduct.currentPrice || existingProduct.current_price;
          if (existingProduct && currentPrice !== parseFloat(sumupProduct.price)) {
            await existingProduct.update({
              currentPrice: parseFloat(sumupProduct.price)
            });
            console.log(`📈 Prix mis à jour: ${sumupProduct.name} → ${sumupProduct.price}€`);
            updatedCount++;
          }
        } catch (productError) {
          console.error(`❌ Erreur mise à jour ${sumupProduct.name}:`, productError);
        }
      }

      console.log(`✅ ${updatedCount} prix synchronisés depuis SumUp`);

    } catch (error) {
      console.error('❌ Erreur sync prix depuis SumUp:', error);
      throw error;
    }
  }

  // Synchroniser les ventes depuis SumUp
  async syncSalesFromSumUp() {
    try {
      console.log('🛒 Synchronisation des ventes depuis SumUp...');
      
      // Récupérer les transactions SumUp récentes
      const recentTransactions = await this.getSumUpTransactions();
      
      if (recentTransactions.length === 0) {
        console.log('📊 Aucune nouvelle transaction SumUp');
        return;
      }

      const Product = require('../models/Product');
      const Sale = require('../models/Sale');
      let newSalesCount = 0;

      for (const transaction of recentTransactions) {
        try {
          // Vérifier si cette vente existe déjà
          const existingSale = await Sale.findOne({
            where: {
              product_name: transaction.product_name,
              total_amount: transaction.amount,
              created_at: {
                [require('sequelize').Op.gte]: new Date(Date.now() - 60000) // Dernière minute
              }
            }
          });

          if (!existingSale) {
            // Trouver le produit correspondant
            const product = await Product.findOne({
              where: { name: transaction.product_name }
            });

            if (product) {
              // Créer la vente
              await Sale.create({
                product_id: product.id,
                product_name: transaction.product_name,
                price: transaction.amount,
                quantity: transaction.quantity || 1,
                total_amount: transaction.amount,
                server_id: 1, // Serveur SumUp
                server_name: 'SumUp',
                notes: 'Vente synchronisée depuis SumUp'
              });

              // Appliquer le système de bourse
              await this.applyMarketSystem(product.id, transaction.quantity || 1);

              console.log(`🛒 Vente synchronisée: ${transaction.product_name} (${transaction.amount}€)`);
              newSalesCount++;
            }
          }
        } catch (saleError) {
          console.error(`❌ Erreur sync vente ${transaction.product_name}:`, saleError);
        }
      }

      console.log(`✅ ${newSalesCount} ventes synchronisées depuis SumUp`);

    } catch (error) {
      console.error('❌ Erreur sync ventes depuis SumUp:', error);
      throw error;
    }
  }

  // Synchroniser les prix vers SumUp
  async syncPricesToSumUp() {
    try {
      console.log('📤 Synchronisation des prix vers SumUp...');
      
      const Product = require('../models/Product');
      const products = await Product.findAll({
        where: { is_active: true }
      });

      let syncedCount = 0;

      for (const product of products) {
        try {
          // Mettre à jour le prix dans SumUp (simulation)
          const price = product.currentPrice || product.current_price || product.basePrice || product.base_price || 0;
          await this.updateSumUpProductPrice(product.name, price);
          syncedCount++;
        } catch (priceError) {
          console.error(`❌ Erreur sync prix vers SumUp ${product.name}:`, priceError);
        }
      }

      console.log(`✅ ${syncedCount} prix synchronisés vers SumUp`);

    } catch (error) {
      console.error('❌ Erreur sync prix vers SumUp:', error);
      throw error;
    }
  }

  // Appliquer le système de bourse après une vente
  async applyMarketSystem(soldProductId, quantity) {
    try {
      console.log(`📈 Application du système de bourse pour produit ${soldProductId}`);
      
      const priceEngine = require('../utils/priceEngine');
      const Product = require('../models/Product');
      
      // Récupérer tous les produits
      const products = await Product.findAll({
        where: { is_active: true }
      });

      const soldProduct = products.find(p => p.id === soldProductId);
      if (!soldProduct) return;

      // Appliquer l'algorithme de prix
      const updatedProducts = await priceEngine.updatePricesAfterSale(
        products,
        soldProductId,
        quantity
      );

      // Sauvegarder les nouveaux prix
      for (const product of updatedProducts) {
        await product.save();
      }

      console.log('✅ Système de bourse appliqué');

    } catch (error) {
      console.error('❌ Erreur système de bourse:', error);
    }
  }

  // Récupérer les produits SumUp (simulation)
  async getSumUpProducts() {
    // Simulation car l'API SumUp ne permet pas de récupérer les produits
    // En production, vous devriez utiliser l'API SumUp réelle
    return [
      { name: 'Kwak 25cl', price: '4.00', description: 'Bière Kwak 25cl' },
      { name: 'Kwak 50cl', price: '7.00', description: 'Bière Kwak 50cl' },
      { name: 'Celtpils 25cl', price: '3.00', description: 'Bière Celtpils 25cl' },
      { name: 'Celtpils 50cl', price: '5.00', description: 'Bière Celtpils 50cl' }
    ];
  }

  // Récupérer les transactions SumUp récentes (simulation)
  async getSumUpTransactions() {
    // Simulation car l'API SumUp ne permet pas de récupérer les transactions
    // En production, vous devriez utiliser l'API SumUp réelle ou des webhooks
    return [
      // Exemple de transaction simulée
      // { product_name: 'Kwak 25cl', amount: 4.00, quantity: 1, timestamp: new Date() }
    ];
  }

  // Mettre à jour le prix d'un produit dans SumUp (simulation)
  async updateSumUpProductPrice(productName, newPrice) {
    console.log(`📤 Mise à jour prix SumUp: ${productName} → ${newPrice}€`);
    // Simulation - en production, utiliser l'API SumUp réelle
    return true;
  }

  // Obtenir le statut de la synchronisation
  getSyncStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      stats: this.syncStats,
      nextSync: this.syncInterval ? 'Programmée' : 'Aucune'
    };
  }
}

// Instance singleton
const sumupSyncService = new SumUpSyncService();

module.exports = sumupSyncService;
