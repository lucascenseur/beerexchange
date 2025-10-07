const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { authenticateToken, requireServerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Route publique pour obtenir tous les produits actifs (interface publique)
router.get('/public', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ category: 1, name: 1 });
    
    const publicProducts = products.map(product => product.toPublicJSON());
    
    res.json({
      products: publicProducts,
      count: publicProducts.length
    });
  } catch (error) {
    console.error('Erreur récupération produits publics:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir tous les produits (serveurs et admin)
router.get('/', authenticateToken, requireServerOrAdmin, async (req, res) => {
  try {
    const { category, active } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (active !== undefined) filter.isActive = active === 'true';
    
    const products = await Product.find(filter)
      .sort({ category: 1, name: 1 });
    
    res.json({
      products,
      count: products.length
    });
  } catch (error) {
    console.error('Erreur récupération produits:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir un produit par ID
router.get('/:id', authenticateToken, requireServerOrAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.json({ product });
  } catch (error) {
    console.error('Erreur récupération produit:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour enregistrer une vente (+1 vente)
router.post('/:id/sell', authenticateToken, requireServerOrAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    if (!product.isActive) {
      return res.status(400).json({ message: 'Produit inactif' });
    }
    
    if (product.stock <= 0) {
      return res.status(400).json({ message: 'Stock insuffisant' });
    }
    
    // Enregistrer la vente
    await product.recordSale();
    
    // Émettre l'événement Socket.io pour mise à jour temps réel
    const io = req.app.get('io');
    if (io) {
      io.to('public').emit('product-updated', product.toPublicJSON());
      io.to('servers').emit('product-updated', product);
    }
    
    res.json({
      message: 'Vente enregistrée avec succès',
      product: product.toPublicJSON()
    });
    
  } catch (error) {
    console.error('Erreur enregistrement vente:', error);
    if (error.message === 'Stock insuffisant') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir l'historique des prix d'un produit
router.get('/:id/price-history', authenticateToken, requireServerOrAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.json({
      priceHistory: product.priceHistory,
      currentPrice: product.currentPrice,
      priceVariation: product.getPriceVariation()
    });
  } catch (error) {
    console.error('Erreur récupération historique prix:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir les statistiques d'un produit
router.get('/:id/stats', authenticateToken, requireServerOrAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    const stats = {
      totalSales: product.salesCount,
      currentStock: product.stock,
      stockSold: product.initialStock - product.stock,
      currentPrice: product.currentPrice,
      basePrice: product.basePrice,
      priceVariation: product.getPriceVariation(),
      priceHistory: product.priceHistory.slice(-10) // 10 derniers points
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Erreur récupération statistiques produit:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
