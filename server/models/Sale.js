const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product_id',
    references: {
      model: 'products',
      key: 'id'
    }
  },
  productName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'product_name'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_amount'
  },
  serverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'server_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  serverName: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'server_name'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'sales'
});

// Méthode statique pour obtenir les statistiques
Sale.getStats = async function(startDate, endDate) {
  const whereClause = {};
  
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt[sequelize.Op.gte] = new Date(startDate);
    if (endDate) whereClause.createdAt[sequelize.Op.lte] = new Date(endDate);
  }
  
  const stats = await Sale.findAll({
    where: whereClause,
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalSales'],
      [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue'],
      [sequelize.fn('AVG', sequelize.col('price')), 'averagePrice'],
      [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('product_id'))), 'uniqueProductsCount'],
      [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('server_id'))), 'uniqueServersCount']
    ],
    raw: true
  });
  
  return stats[0] || {
    totalSales: 0,
    totalQuantity: 0,
    totalRevenue: 0,
    averagePrice: 0,
    uniqueProductsCount: 0,
    uniqueServersCount: 0
  };
};

// Méthode statique pour obtenir les ventes par produit
Sale.getSalesByProduct = async function(startDate, endDate) {
  const whereClause = {};
  
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt[sequelize.Op.gte] = new Date(startDate);
    if (endDate) whereClause.createdAt[sequelize.Op.lte] = new Date(endDate);
  }
  
  return await Sale.findAll({
    where: whereClause,
    attributes: [
      'productId',
      'productName',
      [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSales'],
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue'],
      [sequelize.fn('AVG', sequelize.col('price')), 'averagePrice']
    ],
    group: ['productId', 'productName'],
    order: [[sequelize.literal('totalSales'), 'DESC']],
    raw: true
  });
};

module.exports = Sale;