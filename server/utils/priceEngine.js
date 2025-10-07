const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');

class PriceEngine {
  constructor() {
    this.priceUpdateInterval = null;
    this.isRunning = false;
  }

  // Démarrer le moteur de prix
  start(io) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Moteur de prix démarré');
    
    // Mise à jour des prix toutes les 30 secondes
    this.priceUpdateInterval = setInterval(async () => {
      await this.updatePrices(io);
    }, 30000);
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

  // Mettre à jour les prix de tous les produits
  async updatePrices(io) {
    try {
      const products = await Product.findAll({
        where: { is_active: true }
      });

      for (const product of products) {
        const newPrice = this.calculateNewPrice(product);
        
        if (newPrice !== product.current_price) {
          // Sauvegarder l'historique des prix
          await PriceHistory.create({
            productId: product.id,
            price: newPrice,
            salesCount: product.sales_count
          });

          // Mettre à jour le produit
          await product.update({
            current_price: newPrice
          });

          // Émettre l'événement Socket.io
          io.emit('product-updated', {
            id: product.id,
            name: product.name,
            description: product.description,
            category: product.category,
            currentPrice: newPrice,
            stock: product.stock,
            salesCount: product.sales_count,
            isActive: product.is_active
          });

          console.log(`💰 Prix mis à jour: ${product.name} - ${product.current_price}€ → ${newPrice}€`);
        }
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour prix:', error);
    }
  }

  // Calculer le nouveau prix basé sur l'algorithme de marché
  calculateNewPrice(product) {
    const basePrice = parseFloat(product.base_price);
    const currentPrice = parseFloat(product.current_price);
    const salesCount = product.sales_count || 0;
    const stock = product.stock || 0;
    const initialStock = product.initial_stock || 1;
    
    // Facteurs de prix
    const demandFactor = this.calculateDemandFactor(salesCount, stock, initialStock);
    const timeFactor = this.calculateTimeFactor();
    const volatilityFactor = this.calculateVolatilityFactor();
    
    // Calcul du nouveau prix
    let newPrice = basePrice * demandFactor * timeFactor * volatilityFactor;
    
    // Limites de prix (entre 50% et 200% du prix de base)
    newPrice = Math.max(basePrice * 0.5, Math.min(basePrice * 2.0, newPrice));
    
    // Arrondir à 2 décimales
    return Math.round(newPrice * 100) / 100;
  }

  // Calculer le facteur de demande
  calculateDemandFactor(salesCount, stock, initialStock) {
    const stockRatio = stock / initialStock;
    const salesRatio = salesCount / initialStock;
    
    // Plus de ventes = prix plus élevé
    // Moins de stock = prix plus élevé
    let demandFactor = 1.0;
    
    if (stockRatio < 0.2) {
      demandFactor += 0.3; // Stock très faible
    } else if (stockRatio < 0.5) {
      demandFactor += 0.15; // Stock faible
    }
    
    if (salesRatio > 0.3) {
      demandFactor += 0.2; // Beaucoup de ventes
    } else if (salesRatio > 0.1) {
      demandFactor += 0.1; // Quelques ventes
    }
    
    return demandFactor;
  }

  // Calculer le facteur temporel (variation aléatoire)
  calculateTimeFactor() {
    // Variation aléatoire entre 0.95 et 1.05
    return 0.95 + Math.random() * 0.1;
  }

  // Calculer le facteur de volatilité
  calculateVolatilityFactor() {
    // Volatilité plus élevée pour simuler un marché dynamique
    return 0.9 + Math.random() * 0.2;
  }

  // Mettre à jour le prix après une vente
  async updatePriceAfterSale(productId, io) {
    try {
      const product = await Product.findByPk(productId);
      if (!product) return;

      const newPrice = this.calculateNewPrice(product);
      
      // Sauvegarder l'historique
      await PriceHistory.create({
        productId: product.id,
        price: newPrice,
        salesCount: product.sales_count
      });

      // Mettre à jour le produit
      await product.update({
        current_price: newPrice
      });

      // Émettre l'événement
      io.emit('product-updated', {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        currentPrice: newPrice,
        stock: product.stock,
        salesCount: product.sales_count,
        isActive: product.is_active
      });

      console.log(`💰 Prix mis à jour après vente: ${product.name} - ${newPrice}€`);
    } catch (error) {
      console.error('❌ Erreur mise à jour prix après vente:', error);
    }
  }
}

module.exports = new PriceEngine();
