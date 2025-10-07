const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');

const router = express.Router();

// Route publique pour obtenir tous les produits actifs (interface publique)
router.get('/public', async (req, res) => {
  try {
    console.log('🔍 Récupération des produits publics...');
    const products = await Product.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    
    console.log(`📊 ${products.length} produits trouvés en base`);
    
    const publicProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      currentPrice: parseFloat(product.currentPrice),
      stock: product.stock,
      image: product.image
    }));
    
    console.log(`✅ ${publicProducts.length} produits publics formatés`);
    console.log('📋 Premier produit:', publicProducts[0] || 'Aucun produit');
    
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
    if (active !== undefined) where.isActive = active === 'true';
    
    const products = await Product.findAll({
      where,
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    
    // Formater les produits de la même manière que l'API publique
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      currentPrice: parseFloat(product.currentPrice),
      stock: product.stock,
      salesCount: product.salesCount,
      isActive: product.isActive,
      image: product.image,
      basePrice: parseFloat(product.basePrice),
      initialStock: product.initialStock
    }));
    
    res.json({
      products: formattedProducts,
      count: formattedProducts.length
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
    
    if (!product.isActive) {
      return res.status(400).json({ message: 'Produit inactif' });
    }
    
    if (product.stock <= 0) {
      return res.status(400).json({ message: 'Stock insuffisant' });
    }
    
    // Enregistrer la vente
    await product.update({
      stock: product.stock - 1,
      salesCount: product.salesCount + 1
    });
    
    // Émettre l'événement Socket.io pour mise à jour temps réel
    const io = req.app.get('io');
    if (io) {
      const publicProduct = {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        currentPrice: parseFloat(product.currentPrice),
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
        currentPrice: parseFloat(product.currentPrice),
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

// Route pour mettre à jour un produit (admin seulement)
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    // Mettre à jour le produit avec les données reçues
    await product.update(req.body);
    
    // Émettre l'événement Socket.io pour mise à jour temps réel
    const io = req.app.get('io');
    if (io) {
      console.log(`📡 Émission Socket.io: product-updated pour ${product.name}`);
      io.emit('product-updated', product);
      io.to('public').emit('product-updated', product);
      io.to('servers').emit('product-updated', product);
      io.to('admin').emit('product-updated', product);
    }
    
    res.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        currentPrice: parseFloat(product.currentPrice),
        stock: product.stock,
        salesCount: product.salesCount,
        isActive: product.isActive,
        image: product.image
      }
    });
    
  } catch (error) {
    console.error('Erreur mise à jour produit:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la mise à jour' 
    });
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
      totalSales: product.salesCount,
      currentStock: product.stock,
      stockSold: product.initialStock - product.stock,
      currentPrice: parseFloat(product.currentPrice),
      basePrice: parseFloat(product.basePrice),
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
