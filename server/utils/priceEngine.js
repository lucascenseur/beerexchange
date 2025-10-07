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
    this.io = io;
    console.log('🚀 Moteur de prix démarré (mode soirée - basé sur les ventes)');
    
    // Pas de mise à jour automatique, seulement quand il y a des ventes
    // this.priceUpdateInterval = setInterval(async () => {
    //   await this.updatePrices(io);
    // }, 10000);
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
  async notifySale(productId, quantity = 1) {
    this.marketActivity += quantity;
    console.log(`📈 Activité marché: +${quantity} (total: ${this.marketActivity})`);
    
    // Déclencher une mise à jour des prix basée sur cette vente
    await this.updatePricesAfterSale(this.io, productId, quantity);
  }

  // Mettre à jour les prix après une vente
  async updatePricesAfterSale(io, soldProductId, quantity) {
    try {
      const products = await Product.findAll({
        where: { isActive: true }
      });

      const soldProduct = products.find(p => p.id === soldProductId);
      console.log(`🔄 Mise à jour des prix après vente de ${quantity}x ${soldProduct?.name || 'produit inconnu'}`);

      // Filtrer les produits (exclure l'écocup qui n'influence rien)
      const productsToUpdate = products.filter(product => 
        !(product.name && product.name.toLowerCase().includes('écocup'))
      );
      
      console.log(`📊 ${productsToUpdate.length} produits à mettre à jour (écocup exclu)`);

      // Traiter chaque vente individuellement avec accumulation des prix
      for (let i = 0; i < quantity; i++) {
        console.log(`🔄 Traitement vente ${i + 1}/${quantity} pour ${soldProduct?.name}`);
        
        // Recharger les produits pour avoir les prix à jour
        const currentProducts = await Product.findAll({
          where: { isActive: true }
        });
        
        for (const product of currentProducts) {
          // Exclure l'écocup
          if (product.name && product.name.toLowerCase().includes('écocup')) {
            continue;
          }
          
          // Vérifier si ce produit est du même type que celui vendu (même nom de base)
          const getBaseProductName = (name) => {
            // Extraire le nom de base en supprimant les tailles et formats
            return name
              .replace(/\s*\(?\d+cl\)?/gi, '') // Supprimer 25cl, 50cl, etc.
              .replace(/\s*\(?(verre|bouteille|canette)\)?/gi, '') // Supprimer verre, bouteille, canette
              .replace(/\s*\(?\d+ml\)?/gi, '') // Supprimer 250ml, 500ml, etc.
              .trim();
          };
          
          const soldProductBaseName = getBaseProductName(soldProduct?.name || '');
          const productBaseName = getBaseProductName(product.name);
          const isSameProductType = productBaseName === soldProductBaseName && productBaseName !== '';
          
          // Appliquer les changements de prix pour cette vente
          const priceChange = this.calculatePriceChangeForSale(product, soldProductId, isSameProductType);
          const newPrice = Math.max(0.01, Math.round((parseFloat(product.currentPrice) + priceChange) * 100) / 100);
          
          console.log(`🔍 Debug prix: ${product.name} - Changement: ${priceChange}€ - Nouveau prix: ${newPrice}€`);
          
          if (Math.abs(priceChange) > 0.001) { // Seuil de 0.001€ pour éviter les micro-changements
            // Sauvegarder l'historique des prix
            await PriceHistory.create({
              productId: product.id,
              price: newPrice,
              salesCount: product.salesCount
            });

            // Mettre à jour le produit
            await product.update({ currentPrice: newPrice });

            console.log(`💰 ${product.name}: ${parseFloat(product.currentPrice).toFixed(2)}€ → ${newPrice.toFixed(2)}€ (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}€)`);

            // Émettre l'événement Socket.io
            if (io) {
              io.emit('product-updated', product);
            }
          }
        }
      }
      
      // L'écocup garde son prix fixe (pas de mise à jour)
      const ecocupProduct = products.find(p => p.name && p.name.toLowerCase().includes('écocup'));
      if (ecocupProduct) {
        console.log(`🔒 Écocup maintenu à prix fixe: ${ecocupProduct.currentPrice}€`);
      }

      // Réduire l'activité du marché avec le temps
      this.marketActivity = Math.max(0, this.marketActivity * 0.9);
      
    } catch (error) {
      console.error('❌ Erreur mise à jour prix après vente:', error);
    }
  }

  // Mettre à jour les prix de tous les produits (ancienne fonction, désactivée)
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

  // Calculer le nouveau prix d'un produit après une vente
  calculateNewPriceAfterSale(product, marketTrend, soldProductId, quantity, isSameProductType = false) {
    const currentPrice = parseFloat(product.currentPrice);
    const basePrice = parseFloat(product.basePrice);
    
    // L'écocup garde toujours son prix de base (prix fixe) et n'influence rien
    if (product.name && product.name.toLowerCase().includes('écocup')) {
      console.log(`🔒 Prix fixe maintenu pour: ${product.name} (${basePrice}€)`);
      return basePrice;
    }
    
    let newPrice = currentPrice;
    
    if (product.id === soldProductId) {
      // Le produit vendu augmente de 0,10 € (10 centimes)
      newPrice = currentPrice + 0.10;
      console.log(`📈 ${product.name}: +0.10€ (${currentPrice}€ → ${newPrice}€)`);
    } else if (isSameProductType) {
      // Les produits du même type (même nom de base) augmentent aussi de 0,05 € (5 centimes)
      newPrice = currentPrice + 0.05;
      console.log(`📈 ${product.name} (même type): +0.05€ (${currentPrice}€ → ${newPrice}€)`);
    } else {
      // Les autres produits (hors écocup) baissent de 0,01 € (1 centime)
      newPrice = currentPrice - 0.01;
      console.log(`📉 ${product.name}: -0.01€ (${currentPrice}€ → ${newPrice}€)`);
    }
    
    // Limiter les variations (entre 50% et 200% du prix de base)
    newPrice = Math.max(basePrice * 0.5, Math.min(basePrice * 2.0, newPrice));
    
    // S'assurer que le prix ne descend pas en dessous de 0.50€
    newPrice = Math.max(0.50, newPrice);
    
    // Arrondir à 2 décimales pour éviter les problèmes de précision
    return Math.round(newPrice * 100) / 100;
  }

  // Calculer le nouveau prix d'un produit (ancienne fonction, désactivée)
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
    
    // Arrondir à 2 décimales pour éviter les problèmes de précision
    return Math.round(newPrice * 100) / 100;
  }

  // Calculer le changement de prix pour une vente
  calculatePriceChangeForSale(product, soldProductId, isSameProductType) {
    console.log(`🔍 calculatePriceChangeForSale: ${product.name} (ID: ${product.id}) vs vendu (ID: ${soldProductId}) - Même type: ${isSameProductType}`);
    
    // Si c'est le même produit ou le même type de produit vendu
    if (product.id === soldProductId || isSameProductType) {
      // Augmenter le prix de 10 centimes par vente
      console.log(`📈 ${product.name}: +0.10€ (produit vendu ou même type)`);
      return 0.10;
    } else {
      // Diminuer le prix de 1 centime par vente pour les autres produits
      console.log(`📉 ${product.name}: -0.01€ (autre produit)`);
      return -0.01;
    }
  }
}

// Instance singleton
const priceEngine = new PriceEngine();

module.exports = priceEngine;