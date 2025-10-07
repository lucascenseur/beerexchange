const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');

class PriceEngine {
  constructor() {
    this.priceUpdateInterval = null;
    this.isRunning = false;
    this.marketActivity = 0; // Activité globale du marché
    this.lastUpdate = Date.now();
  }

  // Démarrer le moteur de prix
  start(io) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Moteur de prix démarré (mode soirée - sans stock)');
    
    // Mise à jour des prix toutes les 10 secondes pour plus de dynamisme
    this.priceUpdateInterval = setInterval(async () => {
      await this.updatePrices(io);
    }, 10000);
  }

  // Arrêter le moteur de prix
  stop() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️  Moteur de prix arrêté');
  }

  // Notifier une vente (influence le marché global)
  notifySale(productId, quantity = 1) {
    this.marketActivity += quantity;
    console.log(`📈 Activité marché: +${quantity} (total: ${this.marketActivity})`);
  }

  // Mettre à jour les prix de tous les produits
  async updatePrices(io) {
    try {
      const products = await Product.findAll({
        where: { isActive: true }
      });

      // Calculer l'activité du marché global
      const totalSales = products.reduce((sum, product) => sum + (product.salesCount || 0), 0);
      const marketTrend = this.calculateMarketTrend(totalSales);

      for (const product of products) {
        const newPrice = this.calculateNewPrice(product, marketTrend);
        
        if (newPrice !== product.currentPrice) {
          // Sauvegarder l'historique des prix
          await PriceHistory.create({
            productId: product.id,
            price: newPrice,
            salesCount: product.salesCount
          });

          // Mettre à jour le produit
          await product.update({ currentPrice: newPrice });

          // Émettre l'événement Socket.io
          if (io) {
            io.emit('product-updated', product);
            console.log(`💰 Prix mis à jour: ${product.name} - ${product.currentPrice}€ → ${newPrice}€`);
          }
        }
      }

      // Réduire l'activité du marché avec le temps
      this.marketActivity = Math.max(0, this.marketActivity * 0.95);
      
    } catch (error) {
      console.error('❌ Erreur mise à jour prix:', error);
    }
  }

  // Calculer la tendance du marché global
  calculateMarketTrend(totalSales) {
    // Plus il y a de ventes globales, plus le marché est actif
    const baseActivity = Math.min(totalSales / 50, 1); // Normalisé entre 0 et 1
    const currentActivity = Math.min(this.marketActivity / 20, 1); // Normalisé entre 0 et 1
    
    return {
      baseActivity,
      currentActivity,
      trend: baseActivity + currentActivity // Entre 0 et 2
    };
  }

  // Calculer le nouveau prix d'un produit
  calculateNewPrice(product, marketTrend) {
    const basePrice = parseFloat(product.basePrice);
    const currentPrice = parseFloat(product.currentPrice);
    const salesCount = product.salesCount || 0;
    
    // Facteur de demande basé sur les ventes du produit
    const productDemand = 1 + (salesCount / 20); // Plus de ventes = prix plus élevé
    
    // Facteur de marché global (influence de toutes les ventes)
    const marketInfluence = 1 + (marketTrend.trend * 0.3); // Jusqu'à 60% d'influence du marché
    
    // Variation aléatoire pour simuler la volatilité
    const randomVariation = (Math.random() - 0.5) * 0.15; // ±7.5% de variation
    
    // Calcul du nouveau prix
    let newPrice = basePrice * productDemand * marketInfluence * (1 + randomVariation);
    
    // Limiter les variations (entre 60% et 180% du prix de base)
    newPrice = Math.max(basePrice * 0.6, Math.min(basePrice * 1.8, newPrice));
    
    return parseFloat(newPrice.toFixed(2));
  }
}

// Instance singleton
const priceEngine = new PriceEngine();

module.exports = priceEngine;