const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serverName: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 200
  }
}, {
  timestamps: true
});

// Index pour les requêtes fréquentes
saleSchema.index({ timestamp: -1 });
saleSchema.index({ product: 1, timestamp: -1 });
saleSchema.index({ server: 1, timestamp: -1 });

// Méthode statique pour obtenir les statistiques
saleSchema.statics.getStats = async function(startDate, endDate) {
  const matchStage = {};
  
  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$quantity' },
        totalRevenue: { $sum: '$totalAmount' },
        averagePrice: { $avg: '$price' },
        uniqueProducts: { $addToSet: '$product' },
        uniqueServers: { $addToSet: '$server' }
      }
    },
    {
      $project: {
        _id: 0,
        totalSales: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        averagePrice: { $round: ['$averagePrice', 2] },
        uniqueProductsCount: { $size: '$uniqueProducts' },
        uniqueServersCount: { $size: '$uniqueServers' }
      }
    }
  ]);
  
  return stats[0] || {
    totalSales: 0,
    totalRevenue: 0,
    averagePrice: 0,
    uniqueProductsCount: 0,
    uniqueServersCount: 0
  };
};

// Méthode statique pour obtenir les ventes par produit
saleSchema.statics.getSalesByProduct = async function(startDate, endDate) {
  const matchStage = {};
  
  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }
  
  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$product',
        productName: { $first: '$productName' },
        totalSales: { $sum: '$quantity' },
        totalRevenue: { $sum: '$totalAmount' },
        averagePrice: { $avg: '$price' }
      }
    },
    {
      $project: {
        _id: 1,
        productName: 1,
        totalSales: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        averagePrice: { $round: ['$averagePrice', 2] }
      }
    },
    { $sort: { totalSales: -1 } }
  ]);
};

module.exports = mongoose.model('Sale', saleSchema);
