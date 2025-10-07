const express = require('express');
const { body, validationResult } = require('express-validator');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

const router = express.Router();

// Route pour obtenir toutes les ventes
router.get('/', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      product, 
      server, 
      page = 1, 
      limit = 50 
    } = req.query;
    
    const whereClause = {};
    
    // Filtres de date
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[require('sequelize').Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[require('sequelize').Op.lte] = new Date(endDate);
    }
    
    // Filtres par produit et serveur
    if (product) whereClause.productId = product;
    if (server) whereClause.serverId = server;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const sales = await Sale.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      offset: offset,
      limit: parseInt(limit)
    });
    
    const total = await Sale.count({ where: whereClause });
    
    res.json({
      sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération ventes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir les statistiques globales
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await Sale.getStats(startDate, endDate);
    const salesByProduct = await Sale.getSalesByProduct(startDate, endDate);
    
    res.json({
      globalStats: stats,
      salesByProduct
    });
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir les ventes d'aujourd'hui
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const sales = await Sale.findAll({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: today,
          [require('sequelize').Op.lt]: tomorrow
        }
      },
      order: [['createdAt', 'DESC']]
    });
    
    const stats = await Sale.getStats(today, tomorrow);
    
    res.json({
      sales,
      stats
    });
  } catch (error) {
    console.error('Erreur récupération ventes du jour:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir les ventes par serveur
router.get('/by-server', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = {};
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[require('sequelize').Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[require('sequelize').Op.lte] = new Date(endDate);
    }
    
    const salesByServer = await Sale.findAll({
      where: whereClause,
      attributes: [
        'serverId',
        'serverName',
        [require('sequelize').fn('SUM', require('sequelize').col('quantity')), 'totalSales'],
        [require('sequelize').fn('SUM', require('sequelize').col('total_amount')), 'totalRevenue'],
        [require('sequelize').fn('AVG', require('sequelize').col('price')), 'averagePrice']
      ],
      group: ['serverId', 'serverName'],
      order: [[require('sequelize').literal('totalSales'), 'DESC']],
      raw: true
    });
    
    res.json({ salesByServer });
  } catch (error) {
    console.error('Erreur récupération ventes par serveur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour créer une vente manuelle (admin seulement)
router.post('/', [
  body('productId').isInt().withMessage('ID produit invalide'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantité doit être un entier positif'),
  body('price').isFloat({ min: 0 }).withMessage('Prix doit être positif'),
  body('notes').optional().isString().isLength({ max: 200 }).withMessage('Notes trop longues')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors: errors.array() 
      });
    }

    const { productId, quantity, price, notes } = req.body;
    
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Stock insuffisant' });
    }
    
    // Créer la vente
    const sale = await Sale.create({
      productId: productId,
      productName: product.name,
      price: price,
      quantity: quantity,
      totalAmount: price * quantity,
      serverId: req.user?.id || 1,
      serverName: req.user?.username || 'Admin',
      notes: notes
    });
    
    // Mettre à jour le stock du produit
    await product.update({
      stock: product.stock - quantity,
      salesCount: (product.salesCount || 0) + quantity
    });
    
    res.status(201).json({
      message: 'Vente créée avec succès',
      sale: sale
    });
    
  } catch (error) {
    console.error('Erreur création vente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
