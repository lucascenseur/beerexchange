const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const User = require('../models/User');
const Sale = require('../models/Sale');

const router = express.Router();

// Toutes les routes admin sont maintenant publiques

// Route pour obtenir le dashboard admin
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Statistiques globales
    const globalStats = await Sale.getStats();
    const todayStats = await Sale.getStats(today, tomorrow);
    
    // Produits les plus vendus
    const topProducts = await Sale.getSalesByProduct();
    
    // Ventes par serveur
    const salesByServer = await Sale.aggregate([
      {
        $group: {
          _id: '$server',
          serverName: { $first: '$serverName' },
          totalSales: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]);
    
    // Produits avec stock faible
    const lowStockProducts = await Product.find({
      stock: { $lte: 5 },
      isActive: true
    }).sort({ stock: 1 });
    
    // Ventes récentes
    const recentSales = await Sale.find()
      .populate('product', 'name category')
      .populate('server', 'username')
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.json({
      globalStats,
      todayStats,
      topProducts: topProducts.slice(0, 10),
      salesByServer,
      lowStockProducts,
      recentSales
    });
  } catch (error) {
    console.error('Erreur dashboard admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour créer un nouveau produit
router.post('/products', [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Nom requis (max 100 caractères)'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description trop longue'),
  body('category').isIn(['beer', 'cocktail', 'soft', 'snack', 'other']).withMessage('Catégorie invalide'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Prix de base doit être positif'),
  body('stock').isInt({ min: 0 }).withMessage('Stock doit être un entier positif'),
  body('priceMultiplier').optional().isFloat({ min: 0.1, max: 5.0 }).withMessage('Multiplicateur de prix invalide'),
  body('demandFactor').optional().isFloat({ min: 0.1, max: 3.0 }).withMessage('Facteur de demande invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors: errors.array() 
      });
    }

    const {
      name,
      description,
      category,
      basePrice,
      stock,
      priceMultiplier = 1.0,
      demandFactor = 1.0,
      image
    } = req.body;

    const product = new Product({
      name,
      description,
      category,
      basePrice,
      currentPrice: basePrice,
      stock,
      initialStock: stock,
      priceMultiplier,
      demandFactor,
      image,
      priceHistory: [{
        price: basePrice,
        timestamp: new Date(),
        salesCount: 0
      }]
    });

    await product.save();

    // Émettre l'événement Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('public').emit('product-created', product.toPublicJSON());
      io.to('servers').emit('product-created', product);
    }

    res.status(201).json({
      message: 'Produit créé avec succès',
      product
    });

  } catch (error) {
    console.error('Erreur création produit:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour mettre à jour un produit
router.put('/products/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Nom invalide'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description trop longue'),
  body('category').optional().isIn(['beer', 'cocktail', 'soft', 'snack', 'other']).withMessage('Catégorie invalide'),
  body('basePrice').optional().isFloat({ min: 0 }).withMessage('Prix de base doit être positif'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock doit être un entier positif'),
  body('priceMultiplier').optional().isFloat({ min: 0.1, max: 5.0 }).withMessage('Multiplicateur de prix invalide'),
  body('demandFactor').optional().isFloat({ min: 0.1, max: 3.0 }).withMessage('Facteur de demande invalide'),
  body('isActive').optional().isBoolean().withMessage('isActive doit être un booléen')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors: errors.array() 
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    const updateData = req.body;
    
    // Si le prix de base change, recalculer le prix actuel
    if (updateData.basePrice && updateData.basePrice !== product.basePrice) {
      updateData.currentPrice = updateData.basePrice;
      updateData.priceHistory = [{
        price: updateData.basePrice,
        timestamp: new Date(),
        salesCount: product.salesCount
      }];
    }

    Object.assign(product, updateData);
    await product.save();

    // Émettre l'événement Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('public').emit('product-updated', product.toPublicJSON());
      io.to('servers').emit('product-updated', product);
    }

    res.json({
      message: 'Produit mis à jour avec succès',
      product
    });

  } catch (error) {
    console.error('Erreur mise à jour produit:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour supprimer un produit
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    await Product.findByIdAndDelete(req.params.id);

    // Émettre l'événement Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('public').emit('product-deleted', { id: req.params.id });
      io.to('servers').emit('product-deleted', { id: req.params.id });
    }

    res.json({ message: 'Produit supprimé avec succès' });

  } catch (error) {
    console.error('Erreur suppression produit:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour réinitialiser les prix et stocks
router.post('/reset', [
  body('resetPrices').optional().isBoolean().withMessage('resetPrices doit être un booléen'),
  body('resetStocks').optional().isBoolean().withMessage('resetStocks doit être un booléen'),
  body('resetSales').optional().isBoolean().withMessage('resetSales doit être un booléen')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors: errors.array() 
      });
    }

    const { resetPrices = false, resetStocks = false, resetSales = false } = req.body;

    if (resetPrices || resetStocks || resetSales) {
      const products = await Product.find({ isActive: true });
      
      for (const product of products) {
        if (resetPrices) {
          product.currentPrice = product.basePrice;
          product.priceHistory = [{
            price: product.basePrice,
            timestamp: new Date(),
            salesCount: product.salesCount
          }];
        }
        
        if (resetStocks) {
          product.stock = product.initialStock;
        }
        
        if (resetSales) {
          product.salesCount = 0;
          product.priceHistory = [{
            price: product.basePrice,
            timestamp: new Date(),
            salesCount: 0
          }];
        }
        
        await product.save();
      }
      
      if (resetSales) {
        await Sale.deleteMany({});
      }
      
      // Émettre l'événement Socket.io
      const io = req.app.get('io');
      if (io) {
        const updatedProducts = await Product.find({ isActive: true });
        updatedProducts.forEach(product => {
          io.to('public').emit('product-updated', product.toPublicJSON());
          io.to('servers').emit('product-updated', product);
        });
      }
    }

    res.json({ message: 'Réinitialisation effectuée avec succès' });

  } catch (error) {
    console.error('Erreur réinitialisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour gérer les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ role: 1, username: 1 });
    res.json({ users });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour créer un utilisateur
router.post('/users', [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Nom d\'utilisateur requis (3-30 caractères)'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe requis (min 6 caractères)'),
  body('role').isIn(['admin', 'server']).withMessage('Rôle invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors: errors.array() 
      });
    }

    const { username, password, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Nom d\'utilisateur déjà utilisé' });
    }

    const user = new User({ username, password, role });
    await user.save();

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
