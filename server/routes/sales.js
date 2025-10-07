const express = require('express');
const { body, validationResult } = require('express-validator');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { authenticateToken, requireServerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Route pour obtenir toutes les ventes
router.get('/', authenticateToken, requireServerOrAdmin, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      product, 
      server, 
      page = 1, 
      limit = 50 
    } = req.query;
    
    const filter = {};
    
    // Filtres de date
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    // Filtres par produit et serveur
    if (product) filter.product = product;
    if (server) filter.server = server;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const sales = await Sale.find(filter)
      .populate('product', 'name category')
      .populate('server', 'username')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Sale.countDocuments(filter);
    
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
router.get('/stats', authenticateToken, requireServerOrAdmin, async (req, res) => {
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
router.get('/today', authenticateToken, requireServerOrAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const sales = await Sale.find({
      timestamp: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate('product', 'name category')
    .populate('server', 'username')
    .sort({ timestamp: -1 });
    
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
router.get('/by-server', authenticateToken, requireServerOrAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }
    
    const salesByServer = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$server',
          serverName: { $first: '$serverName' },
          totalSales: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalAmount' },
          averagePrice: { $avg: '$price' }
        }
      },
      {
        $project: {
          _id: 1,
          serverName: 1,
          totalSales: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          averagePrice: { $round: ['$averagePrice', 2] }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);
    
    res.json({ salesByServer });
  } catch (error) {
    console.error('Erreur récupération ventes par serveur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour créer une vente manuelle (admin seulement)
router.post('/', [
  authenticateToken,
  requireServerOrAdmin,
  body('productId').isMongoId().withMessage('ID produit invalide'),
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
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Stock insuffisant' });
    }
    
    // Créer la vente
    const sale = new Sale({
      product: productId,
      productName: product.name,
      price: price,
      quantity: quantity,
      totalAmount: price * quantity,
      server: req.user._id,
      serverName: req.user.username,
      notes: notes
    });
    
    await sale.save();
    
    // Mettre à jour le stock du produit
    product.stock -= quantity;
    product.salesCount += quantity;
    
    // Recalculer le prix si nécessaire
    const newPrice = product.calculateNewPrice();
    product.currentPrice = newPrice;
    
    // Ajouter à l'historique des prix
    product.priceHistory.push({
      price: newPrice,
      timestamp: new Date(),
      salesCount: product.salesCount
    });
    
    await product.save();
    
    // Émettre l'événement Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('public').emit('product-updated', product.toPublicJSON());
      io.to('servers').emit('product-updated', product);
    }
    
    res.status(201).json({
      message: 'Vente créée avec succès',
      sale: await Sale.findById(sale._id)
        .populate('product', 'name category')
        .populate('server', 'username')
    });
    
  } catch (error) {
    console.error('Erreur création vente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
