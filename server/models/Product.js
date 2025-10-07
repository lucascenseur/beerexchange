const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('beer', 'cocktail', 'soft', 'snack', 'other'),
    defaultValue: 'beer'
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'base_price'
  },
  currentPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'current_price'
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  initialStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'initial_stock'
  },
  salesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sales_count'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  priceMultiplier: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 1.0,
    field: 'price_multiplier'
  },
  demandFactor: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 1.0,
    field: 'demand_factor'
  }
}, {
  tableName: 'products'
});

// Méthode pour calculer le nouveau prix basé sur les ventes
Product.prototype.calculateNewPrice = function() {
  const basePrice = parseFloat(this.basePrice);
  const salesCount = this.salesCount;
  const demandFactor = parseFloat(this.demandFactor);
  const priceMultiplier = parseFloat(this.priceMultiplier);
  
  // Algorithme simple : prix augmente avec les ventes
  const salesImpact = Math.min(salesCount * 0.1, 2.0); // Max 200% d'augmentation
  const newPrice = basePrice * (1 + salesImpact * demandFactor) * priceMultiplier;
  
  // Arrondir à 2 décimales
  return Math.round(newPrice * 100) / 100;
};

// Méthode pour enregistrer une vente
Product.prototype.recordSale = async function() {
  if (this.stock > 0) {
    this.stock -= 1;
    this.salesCount += 1;
    
    // Calculer le nouveau prix
    const newPrice = this.calculateNewPrice();
    this.currentPrice = newPrice;
    
    await this.save();
    
    // Enregistrer dans l'historique des prix
    await PriceHistory.create({
      productId: this.id,
      price: newPrice,
      salesCount: this.salesCount
    });
    
    return this;
  }
  throw new Error('Stock insuffisant');
};

// Méthode pour obtenir la variation de prix
Product.prototype.getPriceVariation = async function() {
  const latestHistory = await PriceHistory.findOne({
    where: { productId: this.id },
    order: [['createdAt', 'DESC']],
    limit: 2
  });
  
  if (!latestHistory) return 0;
  
  const currentPrice = parseFloat(this.currentPrice);
  const previousPrice = parseFloat(latestHistory.price);
  
  return ((currentPrice - previousPrice) / previousPrice) * 100;
};

// Méthode pour obtenir les données publiques
Product.prototype.toPublicJSON = async function() {
  const priceVariation = await this.getPriceVariation();
  const priceHistory = await PriceHistory.findAll({
    where: { productId: this.id },
    order: [['createdAt', 'DESC']],
    limit: 20
  });
  
  return {
    id: this.id,
    name: this.name,
    description: this.description,
    category: this.category,
    currentPrice: parseFloat(this.currentPrice),
    stock: this.stock,
    salesCount: this.salesCount,
    priceVariation: Math.round(priceVariation * 100) / 100,
    priceHistory: priceHistory.map(h => ({
      price: parseFloat(h.price),
      timestamp: h.createdAt,
      salesCount: h.salesCount
    })),
    isActive: this.isActive,
    image: this.image
  };
};

module.exports = Product;