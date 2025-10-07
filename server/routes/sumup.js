const express = require('express');
const sumupService = require('../services/sumupServiceReal');
const SumUpToken = require('../models/SumUpToken');
const syncService = require('../services/syncService');
const router = express.Router();

// Route pour vérifier la configuration SumUp
router.get('/config', async (req, res) => {
  try {
    const config = sumupService.checkConfiguration();
    res.json({
      success: true,
      config: config,
      message: config.isConfigured ? 'Configuration SumUp complète' : 'Configuration SumUp incomplète'
    });
  } catch (error) {
    console.error('❌ Erreur vérification config SumUp:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de la configuration'
    });
  }
});

// Route pour initier l'authentification OAuth
router.get('/auth', async (req, res) => {
  try {
    // Vérifier la configuration d'abord
    const config = sumupService.checkConfiguration();
    if (!config.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Configuration SumUp incomplète. Veuillez configurer SUMUP_CLIENT_ID et SUMUP_CLIENT_SECRET.',
        config: config
      });
    }

    const state = req.query.state || 'beer-exchange-auth';
    const authUrl = sumupService.getAuthorizationUrl(state);
    
    console.log('🔐 Redirection vers SumUp pour authentification');
    res.json({
      success: true,
      authUrl: authUrl,
      message: 'Redirection vers SumUp pour authentification'
    });
  } catch (error) {
    console.error('❌ Erreur génération URL auth SumUp:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération de l\'URL d\'authentification'
    });
  }
});

// Callback OAuth - échange du code contre le token
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error('❌ Erreur OAuth SumUp:', error);
      return res.status(400).json({
        success: false,
        message: `Erreur d'authentification SumUp: ${error}`
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code d\'autorisation manquant'
      });
    }

    // Échanger le code contre le token
    const tokenData = await sumupService.exchangeCodeForToken(code);
    
    // Récupérer les informations du marchand
    try {
      const merchantInfo = await sumupService.getMerchantInfo();
      tokenData.merchant_id = merchantInfo.id;
      tokenData.merchant_email = merchantInfo.email;
    } catch (merchantError) {
      console.warn('⚠️ Impossible de récupérer les infos marchand:', merchantError.message);
    }

    // Sauvegarder le token en base
    await SumUpToken.saveNewToken(tokenData);

    console.log('✅ Authentification SumUp réussie');
    res.json({
      success: true,
      message: 'Authentification SumUp réussie',
      merchant: {
        id: tokenData.merchant_id,
        email: tokenData.merchant_email
      }
    });

  } catch (error) {
    console.error('❌ Erreur callback OAuth SumUp:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'authentification SumUp'
    });
  }
});

// Route pour vérifier le statut de l'authentification
router.get('/status', async (req, res) => {
  try {
    const activeToken = await SumUpToken.getActiveToken();
    const serviceStatus = sumupService.getStatus();
    
    if (!activeToken) {
      return res.json({
        authenticated: false,
        message: 'Aucune authentification SumUp active',
        isConfigured: serviceStatus.isConfigured,
        isDemoMode: serviceStatus.isDemoMode,
        statusMessage: serviceStatus.message
      });
    }

    // Vérifier si le token est encore valide
    const isExpired = Date.now() >= (activeToken.created_at.getTime() + (activeToken.expiresIn * 1000));
    
    res.json({
      authenticated: !isExpired,
      merchant: {
        id: activeToken.merchantId,
        email: activeToken.merchantEmail
      },
      expiresAt: new Date(activeToken.created_at.getTime() + (activeToken.expiresIn * 1000)),
      isExpired: isExpired,
      isConfigured: serviceStatus.isConfigured,
      isDemoMode: serviceStatus.isDemoMode,
      statusMessage: serviceStatus.message
    });

  } catch (error) {
    console.error('❌ Erreur vérification statut SumUp:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du statut'
    });
  }
});

// Route pour récupérer les produits SumUp
router.get('/products', async (req, res) => {
  try {
    const activeToken = await SumUpToken.getActiveToken();
    
    if (!activeToken) {
      return res.status(401).json({
        success: false,
        message: 'Authentification SumUp requise'
      });
    }

    // Charger le token dans le service
    await sumupService.loadTokens();
    
    const products = await sumupService.getProducts();
    
    res.json({
      success: true,
      products: products,
      count: products.length
    });

  } catch (error) {
    console.error('❌ Erreur récupération produits SumUp:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits SumUp'
    });
  }
});

// Route pour importer les produits SumUp dans Beer Exchange
router.post('/import-products', async (req, res) => {
  try {
    const activeToken = await SumUpToken.getActiveToken();
    if (!activeToken) {
      return res.status(401).json({
        success: false,
        message: 'Authentification SumUp requise'
      });
    }

    console.log('📦 Début import des produits SumUp...');
    
    // Charger le token dans le service
    await sumupService.loadTokens();
    
    // Récupérer les produits SumUp
    const sumupProducts = await sumupService.getProducts();
    
    if (!sumupProducts || sumupProducts.length === 0) {
      return res.json({
        success: true,
        message: 'Aucun produit trouvé dans SumUp',
        imported: 0,
        products: []
      });
    }

    // Importer les produits dans Beer Exchange
    const Product = require('../models/Product');
    const importedProducts = [];

    for (const sumupProduct of sumupProducts) {
      try {
        // Vérifier si le produit existe déjà
        const existingProduct = await Product.findOne({
          where: { name: sumupProduct.name }
        });

        if (existingProduct) {
          // Mettre à jour le produit existant
          await existingProduct.update({
            base_price: parseFloat(sumupProduct.price) || existingProduct.base_price,
            current_price: parseFloat(sumupProduct.price) || existingProduct.current_price,
            description: sumupProduct.description || existingProduct.description
          });
          console.log(`✅ Produit mis à jour: ${sumupProduct.name}`);
        } else {
          // Créer un nouveau produit
          const newProduct = await Product.create({
            name: sumupProduct.name,
            description: sumupProduct.description || '',
            category: 'other', // Catégorie par défaut
            base_price: parseFloat(sumupProduct.price) || 0,
            current_price: parseFloat(sumupProduct.price) || 0,
            stock: 999, // Stock illimité pour la soirée
            initial_stock: 999,
            sales_count: 0,
            is_active: true
          });
          console.log(`✅ Nouveau produit créé: ${sumupProduct.name}`);
        }

        importedProducts.push({
          name: sumupProduct.name,
          price: sumupProduct.price,
          description: sumupProduct.description
        });

      } catch (productError) {
        console.error(`❌ Erreur import produit ${sumupProduct.name}:`, productError);
      }
    }

    console.log(`🎉 Import terminé: ${importedProducts.length} produits traités`);

    res.json({
      success: true,
      message: `Import réussi: ${importedProducts.length} produits traités`,
      imported: importedProducts.length,
      products: importedProducts
    });

  } catch (error) {
    console.error('❌ Erreur import produits SumUp:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'import des produits'
    });
  }
});

// Route pour créer un produit dans SumUp
router.post('/products', async (req, res) => {
  try {
    const activeToken = await SumUpToken.getActiveToken();
    
    if (!activeToken) {
      return res.status(401).json({
        success: false,
        message: 'Authentification SumUp requise'
      });
    }

    const { name, price, description, category, image_url } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Nom et prix requis'
      });
    }

    // Charger le token dans le service
    await sumupService.loadTokens();

    const productData = {
      name: name,
      price: parseFloat(price),
      description: description || '',
      category: category || 'beverage',
      image_url: image_url || null
    };

    const newProduct = await sumupService.createProduct(productData);
    
    res.json({
      success: true,
      product: newProduct,
      message: 'Produit créé dans SumUp avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur création produit SumUp:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du produit dans SumUp'
    });
  }
});

// Route pour mettre à jour un produit dans SumUp
router.put('/products/:id', async (req, res) => {
  try {
    const activeToken = await SumUpToken.getActiveToken();
    
    if (!activeToken) {
      return res.status(401).json({
        success: false,
        message: 'Authentification SumUp requise'
      });
    }

    const productId = req.params.id;
    const updateData = req.body;

    // Charger le token dans le service
    await sumupService.loadTokens();

    const updatedProduct = await sumupService.updateProduct(productId, updateData);
    
    res.json({
      success: true,
      product: updatedProduct,
      message: 'Produit mis à jour dans SumUp avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour produit SumUp:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du produit dans SumUp'
    });
  }
});

// Route pour supprimer un produit dans SumUp
router.delete('/products/:id', async (req, res) => {
  try {
    const activeToken = await SumUpToken.getActiveToken();
    
    if (!activeToken) {
      return res.status(401).json({
        success: false,
        message: 'Authentification SumUp requise'
      });
    }

    const productId = req.params.id;

    // Charger le token dans le service
    await sumupService.loadTokens();

    await sumupService.deleteProduct(productId);
    
    res.json({
      success: true,
      message: 'Produit supprimé de SumUp avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression produit SumUp:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du produit dans SumUp'
    });
  }
});

// Route pour créer un paiement
router.post('/payments', async (req, res) => {
  try {
    const activeToken = await SumUpToken.getActiveToken();
    
    if (!activeToken) {
      return res.status(401).json({
        success: false,
        message: 'Authentification SumUp requise'
      });
    }

    const { amount, currency, checkout_reference, description } = req.body;

    if (!amount || !checkout_reference) {
      return res.status(400).json({
        success: false,
        message: 'Montant et référence de checkout requis'
      });
    }

    // Charger le token dans le service
    await sumupService.loadTokens();

    const paymentData = {
      amount: parseFloat(amount),
      currency: currency || 'EUR',
      checkout_reference: checkout_reference,
      description: description || 'Beer Exchange - Vente'
    };

    const payment = await sumupService.createPayment(paymentData);
    
    res.json({
      success: true,
      payment: payment,
      message: 'Paiement créé dans SumUp avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur création paiement SumUp:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du paiement dans SumUp'
    });
  }
});

// Route pour synchroniser depuis SumUp
router.post('/sync/from-sumup', async (req, res) => {
  try {
    await syncService.syncProductsFromSumUp();
    
    res.json({
      success: true,
      message: 'Synchronisation depuis SumUp réussie'
    });
  } catch (error) {
    console.error('❌ Erreur synchronisation depuis SumUp:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation depuis SumUp'
    });
  }
});

// Route pour synchroniser vers SumUp
router.post('/sync/to-sumup', async (req, res) => {
  try {
    await syncService.syncProductsToSumUp();
    
    res.json({
      success: true,
      message: 'Synchronisation vers SumUp réussie'
    });
  } catch (error) {
    console.error('❌ Erreur synchronisation vers SumUp:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation vers SumUp'
    });
  }
});

// Route pour obtenir le statut de synchronisation
router.get('/sync/status', async (req, res) => {
  try {
    const status = syncService.getSyncStatus();
    
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('❌ Erreur statut synchronisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut'
    });
  }
});

// Route pour démarrer la synchronisation automatique
router.post('/sync/auto-start', async (req, res) => {
  try {
    const { intervalMinutes = 5 } = req.body;
    syncService.startAutoSync(intervalMinutes);
    
    res.json({
      success: true,
      message: `Synchronisation automatique démarrée (${intervalMinutes} minutes)`
    });
  } catch (error) {
    console.error('❌ Erreur démarrage sync auto:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du démarrage de la synchronisation automatique'
    });
  }
});

// Route pour arrêter la synchronisation automatique
router.post('/sync/auto-stop', async (req, res) => {
  try {
    syncService.stopAutoSync();
    
    res.json({
      success: true,
      message: 'Synchronisation automatique arrêtée'
    });
  } catch (error) {
    console.error('❌ Erreur arrêt sync auto:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'arrêt de la synchronisation automatique'
    });
  }
});

module.exports = router;
