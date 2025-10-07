const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['beer', 'cocktail', 'soft', 'snack', 'other'],
    default: 'beer'
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  initialStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  },
  priceHistory: [{
    price: Number,
    timestamp: {
      type: Date,
      default: Date.now
    },
    salesCount: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: null
  },
  // Paramètres pour l'algorithme de prix
  priceMultiplier: {
    type: Number,
    default: 1.0,
    min: 0.1,
    max: 5.0
  },
  demandFactor: {
    type: Number,
    default: 1.0,
    min: 0.1,
    max: 3.0
  }
}, {
  timestamps: true
});

// Méthode pour calculer le nouveau prix basé sur les ventes
productSchema.methods.calculateNewPrice = function() {
  const basePrice = this.basePrice;
  const salesCount = this.salesCount;
  const demandFactor = this.demandFactor;
  const priceMultiplier = this.priceMultiplier;
  
  // Algorithme simple : prix augmente avec les ventes
  // Plus il y a de ventes, plus le prix augmente
  const salesImpact = Math.min(salesCount * 0.1, 2.0); // Max 200% d'augmentation
  const newPrice = basePrice * (1 + salesImpact * demandFactor) * priceMultiplier;
  
  // Arrondir à 2 décimales
  return Math.round(newPrice * 100) / 100;
};

// Méthode pour enregistrer une vente
productSchema.methods.recordSale = function() {
  if (this.stock > 0) {
    this.stock -= 1;
    this.salesCount += 1;
    
    // Calculer le nouveau prix
    const newPrice = this.calculateNewPrice();
    this.currentPrice = newPrice;
    
    // Ajouter à l'historique des prix
    this.priceHistory.push({
      price: newPrice,
      timestamp: new Date(),
      salesCount: this.salesCount
    });
    
    // Garder seulement les 50 derniers enregistrements
    if (this.priceHistory.length > 50) {
      this.priceHistory = this.priceHistory.slice(-50);
    }
    
    return this.save();
  }
  throw new Error('Stock insuffisant');
};

// Méthode pour obtenir la variation de prix
productSchema.methods.getPriceVariation = function() {
  if (this.priceHistory.length < 2) return 0;
  
  const currentPrice = this.currentPrice;
  const previousPrice = this.priceHistory[this.priceHistory.length - 2].price;
  
  return ((currentPrice - previousPrice) / previousPrice) * 100;
};

// Méthode pour obtenir les données publiques
productSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    category: this.category,
    currentPrice: this.currentPrice,
    stock: this.stock,
    salesCount: this.salesCount,
    priceVariation: this.getPriceVariation(),
    priceHistory: this.priceHistory.slice(-20), // 20 derniers points
    isActive: this.isActive,
    image: this.image
  };
};

module.exports = mongoose.model('Product', productSchema);
