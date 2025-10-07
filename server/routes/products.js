const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');

const router = express.Router();

// Route publique pour obtenir tous les produits actifs (interface publique)
router.get('/public', async (req, res) => {
  try {
    console.log('🔍 Récupération des produits publics...');
    const products = await Product.findAll({
      where: { is_active: true },
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    
    console.log(`📊 ${products.length} produits trouvés en base`);
    
    const publicProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      currentPrice: parseFloat(product.current_price),
      stock: product.stock,
      image: product.image
    }));
    
    console.log(`✅ ${publicProducts.length} produits publics formatés`);
    
    res.json({
      products: publicProducts,
      count: publicProducts.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération produits publics:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir tous les produits (serveurs et admin)
router.get('/', async (req, res) => {
  try {
    const { category, active } = req.query;
    const where = {};
    
    if (category) where.category = category;
    if (active !== undefined) where.is_active = active === 'true';
    
    const products = await Product.findAll({
      where,
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    
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
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
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
router.post('/:id/sell', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    if (!product.is_active) {
      return res.status(400).json({ message: 'Produit inactif' });
    }
    
    if (product.stock <= 0) {
      return res.status(400).json({ message: 'Stock insuffisant' });
    }
    
    // Enregistrer la vente
    await product.update({
      stock: product.stock - 1,
      sales_count: product.sales_count + 1
    });
    
    // Émettre l'événement Socket.io pour mise à jour temps réel
    const io = req.app.get('io');
    if (io) {
      const publicProduct = {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        currentPrice: parseFloat(product.current_price),
        stock: product.stock - 1,
        image: product.image
      };
      io.to('public').emit('product-updated', publicProduct);
      io.to('servers').emit('product-updated', product);
    }
    
    res.json({
      message: 'Vente enregistrée avec succès',
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        currentPrice: parseFloat(product.current_price),
        stock: product.stock - 1,
        image: product.image
      }
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
router.get('/:id/price-history', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    // Pour l'instant, retourner des données de base
    res.json({
      priceHistory: [],
      currentPrice: parseFloat(product.current_price),
      priceVariation: 0
    });
  } catch (error) {
    console.error('Erreur récupération historique prix:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir les statistiques d'un produit
router.get('/:id/stats', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    const stats = {
      totalSales: product.sales_count,
      currentStock: product.stock,
      stockSold: product.initial_stock - product.stock,
      currentPrice: parseFloat(product.current_price),
      basePrice: parseFloat(product.base_price),
      priceVariation: 0,
      priceHistory: [] // 10 derniers points
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Erreur récupération statistiques produit:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
