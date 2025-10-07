const Product = require('../models/Product');
const sumupService = require('./sumupService');
const priceEngine = require('../utils/priceEngine');

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
  }

  // Démarrer la synchronisation automatique
  startAutoSync(intervalMinutes = 5) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.syncProductsFromSumUp();
      } catch (error) {
        console.error('❌ Erreur synchronisation automatique:', error.message);
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`🔄 Synchronisation automatique démarrée (${intervalMinutes} minutes)`);
  }

  // Arrêter la synchronisation automatique
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Synchronisation automatique arrêtée');
    }
  }

  // Synchroniser les produits depuis SumUp vers Beer Exchange
  async syncProductsFromSumUp() {
    if (this.isSyncing) {
      console.log('⏳ Synchronisation déjà en cours...');
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Début synchronisation produits depuis SumUp...');

    try {
      // Charger les tokens SumUp
      await sumupService.loadTokens();
      
      // Récupérer les produits SumUp
      const sumupProducts = await sumupService.getProducts();
      
      // Récupérer les produits Beer Exchange
      const beerExchangeProducts = await Product.findAll({
        where: { isActive: true }
      });

      let syncedCount = 0;
      let createdCount = 0;
      let updatedCount = 0;

      // Synchroniser chaque produit SumUp
      for (const sumupProduct of sumupProducts) {
        try {
          // Chercher le produit correspondant dans Beer Exchange
          const existingProduct = beerExchangeProducts.find(be => 
            be.name.toLowerCase().trim() === sumupProduct.name.toLowerCase().trim()
          );

          if (existingProduct) {
            // Mettre à jour le produit existant
            const hasChanges = 
              existingProduct.basePrice !== parseFloat(sumupProduct.price) ||
              existingProduct.currentPrice !== parseFloat(sumupProduct.price) ||
              existingProduct.description !== (sumupProduct.description || '');

            if (hasChanges) {
              await existingProduct.update({
                basePrice: parseFloat(sumupProduct.price),
                currentPrice: parseFloat(sumupProduct.price),
                description: sumupProduct.description || existingProduct.description,
                image: sumupProduct.image_url || existingProduct.image
              });

              updatedCount++;
              console.log(`✅ Produit mis à jour: ${existingProduct.name}`);
            }
          } else {
            // Créer un nouveau produit
            await Product.create({
              name: sumupProduct.name,
              description: sumupProduct.description || '',
              category: this.mapSumUpCategoryToBeerExchange(sumupProduct.category),
              basePrice: parseFloat(sumupProduct.price),
              currentPrice: parseFloat(sumupProduct.price),
              stock: 999, // Stock illimité pour la soirée
              initialStock: 999,
              salesCount: 0,
              isActive: true,
              image: sumupProduct.image_url || null
            });

            createdCount++;
            console.log(`✅ Nouveau produit créé: ${sumupProduct.name}`);
          }

          syncedCount++;
        } catch (productError) {
          console.error(`❌ Erreur synchronisation produit ${sumupProduct.name}:`, productError.message);
        }
      }

      console.log(`🔄 Synchronisation terminée: ${syncedCount} produits traités, ${createdCount} créés, ${updatedCount} mis à jour`);

    } catch (error) {
      console.error('❌ Erreur synchronisation depuis SumUp:', error.message);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  // Synchroniser les produits depuis Beer Exchange vers SumUp
  async syncProductsToSumUp() {
    if (this.isSyncing) {
      console.log('⏳ Synchronisation déjà en cours...');
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Début synchronisation produits vers SumUp...');

    try {
      // Charger les tokens SumUp
      await sumupService.loadTokens();
      
      // Récupérer les produits Beer Exchange
      const beerExchangeProducts = await Product.findAll({
        where: { isActive: true }
      });

      // Récupérer les produits SumUp existants
      const sumupProducts = await sumupService.getProducts();

      let syncedCount = 0;
      let createdCount = 0;
      let updatedCount = 0;

      // Synchroniser chaque produit Beer Exchange
      for (const beProduct of beerExchangeProducts) {
        try {
          // Chercher le produit correspondant dans SumUp
          const existingSumUpProduct = sumupProducts.find(sp => 
            sp.name.toLowerCase().trim() === beProduct.name.toLowerCase().trim()
          );

          const productData = {
            name: beProduct.name,
            price: parseFloat(beProduct.currentPrice),
            description: beProduct.description || '',
            category: this.mapBeerExchangeCategoryToSumUp(beProduct.category),
            image_url: beProduct.image || null
          };

          if (existingSumUpProduct) {
            // Mettre à jour le produit SumUp
            await sumupService.updateProduct(existingSumUpProduct.id, productData);
            updatedCount++;
            console.log(`✅ Produit SumUp mis à jour: ${beProduct.name}`);
          } else {
            // Créer un nouveau produit SumUp
            await sumupService.createProduct(productData);
            createdCount++;
            console.log(`✅ Nouveau produit SumUp créé: ${beProduct.name}`);
          }

          syncedCount++;
        } catch (productError) {
          console.error(`❌ Erreur synchronisation produit ${beProduct.name}:`, productError.message);
        }
      }

      console.log(`🔄 Synchronisation vers SumUp terminée: ${syncedCount} produits traités, ${createdCount} créés, ${updatedCount} mis à jour`);

    } catch (error) {
      console.error('❌ Erreur synchronisation vers SumUp:', error.message);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  // Mapper les catégories SumUp vers Beer Exchange
  mapSumUpCategoryToBeerExchange(sumupCategory) {
    const categoryMap = {
      'beverage': 'beer',
      'food': 'snack',
      'alcohol': 'beer',
      'soft_drink': 'soft',
      'default': 'other'
    };

    return categoryMap[sumupCategory] || 'other';
  }

  // Mapper les catégories Beer Exchange vers SumUp
  mapBeerExchangeCategoryToSumUp(beCategory) {
    const categoryMap = {
      'beer': 'beverage',
      'cocktail': 'beverage',
      'soft': 'soft_drink',
      'snack': 'food',
      'other': 'default'
    };

    return categoryMap[beCategory] || 'default';
  }

  // Synchroniser une vente vers SumUp
  async syncSaleToSumUp(saleData) {
    try {
      await sumupService.loadTokens();
      
      const paymentData = {
        amount: saleData.totalAmount,
        currency: 'EUR',
        checkout_reference: `beer-exchange-${Date.now()}-${saleData.productId}`,
        description: `Vente: ${saleData.quantity}x ${saleData.productName}`
      };

      const payment = await sumupService.createPayment(paymentData);
      console.log(`💳 Paiement SumUp créé: ${payment.checkout_reference}`);
      
      return payment;
    } catch (error) {
      console.error('❌ Erreur synchronisation vente vers SumUp:', error.message);
      throw error;
    }
  }

  // Obtenir le statut de la synchronisation
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      hasAutoSync: this.syncInterval !== null,
      lastSync: new Date().toISOString()
    };
  }
}

// Instance singleton
const syncService = new SyncService();

module.exports = syncService;
