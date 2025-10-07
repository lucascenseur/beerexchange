const axios = require('axios');

class SumUpProductService {
  constructor() {
    this.baseURL = 'https://api.sumup.com';
    this.accessToken = null;
    this.isConfigured = false;
  }

  // Charger le token d'accès depuis la base de données
  async loadTokens() {
    try {
      const SumUpToken = require('../models/SumUpToken');
      const token = await SumUpToken.findOne({ where: { is_active: true } });
      
      if (token && token.access_token) {
        this.accessToken = token.access_token;
        this.isConfigured = true;
        console.log('✅ Token SumUp chargé pour l\'API Product');
        return true;
      } else {
        console.log('⚠️ Aucun token SumUp actif trouvé');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur chargement token SumUp:', error);
      return false;
    }
  }

  // Faire une requête authentifiée vers l'API SumUp
  async makeAuthenticatedRequest(method, endpoint, data = null) {
    if (!this.accessToken) {
      throw new Error('Token d\'accès SumUp non disponible');
    }

    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      console.log(`📡 API SumUp Product ${method} ${endpoint}`);
      const response = await axios(config);
      
      console.log(`✅ API SumUp Product ${method} ${endpoint} - Status: ${response.status}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur API SumUp Product ${method} ${endpoint}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Récupérer tous les produits
  async getProducts() {
    try {
      console.log('📦 Récupération des produits SumUp via API Product...');
      const products = await this.makeAuthenticatedRequest('GET', '/v0.1/me/products');
      console.log(`✅ ${products.length || 0} produits récupérés via API Product`);
      return products;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('📦 Endpoint /v0.1/me/products non disponible');
        return [];
      } else if (error.response?.status === 403) {
        console.log('⚠️ Scope "products" requis pour l\'API Product');
        return [];
      } else {
        console.error('❌ Erreur récupération produits API Product:', error.message);
        return [];
      }
    }
  }

  // Récupérer un produit par ID
  async getProduct(productId) {
    try {
      console.log(`📦 Récupération produit SumUp ${productId}...`);
      const product = await this.makeAuthenticatedRequest('GET', `/v0.1/me/products/${productId}`);
      console.log(`✅ Produit ${productId} récupéré`);
      return product;
    } catch (error) {
      console.error(`❌ Erreur récupération produit ${productId}:`, error.message);
      throw error;
    }
  }

  // Créer un nouveau produit
  async createProduct(productData) {
    try {
      console.log(`📦 Création produit SumUp: ${productData.name}`);
      
      const payload = {
        name: productData.name,
        price: parseFloat(productData.price),
        description: productData.description || '',
        category: productData.category || 'beer',
        is_active: productData.is_active !== false
      };

      const product = await this.makeAuthenticatedRequest('POST', '/v0.1/me/products', payload);
      console.log(`✅ Produit créé: ${product.name} - ${product.price}€`);
      return product;
    } catch (error) {
      console.error(`❌ Erreur création produit ${productData.name}:`, error.message);
      throw error;
    }
  }

  // Mettre à jour un produit (PUT - remplacement complet)
  async updateProduct(productId, productData) {
    try {
      console.log(`📦 Mise à jour complète produit SumUp ${productId}`);
      
      const payload = {
        name: productData.name,
        price: parseFloat(productData.price),
        description: productData.description || '',
        category: productData.category || 'beer',
        is_active: productData.is_active !== false
      };

      const product = await this.makeAuthenticatedRequest('PUT', `/v0.1/me/products/${productId}`, payload);
      console.log(`✅ Produit ${productId} mis à jour complètement`);
      return product;
    } catch (error) {
      console.error(`❌ Erreur mise à jour complète produit ${productId}:`, error.message);
      throw error;
    }
  }

  // Mettre à jour partiellement un produit (PATCH - modification partielle)
  async patchProduct(productId, updates) {
    try {
      console.log(`📦 Mise à jour partielle produit SumUp ${productId}`);
      
      const product = await this.makeAuthenticatedRequest('PATCH', `/v0.1/me/products/${productId}`, updates);
      console.log(`✅ Produit ${productId} mis à jour partiellement`);
      return product;
    } catch (error) {
      console.error(`❌ Erreur mise à jour partielle produit ${productId}:`, error.message);
      throw error;
    }
  }

  // Mettre à jour uniquement le prix d'un produit
  async updateProductPrice(productId, newPrice) {
    try {
      console.log(`💰 Mise à jour prix produit SumUp ${productId} → ${newPrice}€`);
      
      const updates = {
        price: parseFloat(newPrice)
      };

      const product = await this.patchProduct(productId, updates);
      console.log(`✅ Prix produit ${productId} mis à jour: ${newPrice}€`);
      return product;
    } catch (error) {
      console.error(`❌ Erreur mise à jour prix produit ${productId}:`, error.message);
      throw error;
    }
  }

  // Supprimer un produit
  async deleteProduct(productId) {
    try {
      console.log(`🗑️ Suppression produit SumUp ${productId}`);
      
      await this.makeAuthenticatedRequest('DELETE', `/v0.1/me/products/${productId}`);
      console.log(`✅ Produit ${productId} supprimé`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur suppression produit ${productId}:`, error.message);
      throw error;
    }
  }

  // Synchroniser les prix de Beer Exchange vers SumUp
  async syncPricesToSumUp(products) {
    try {
      console.log('📤 Synchronisation des prix vers SumUp via API Product...');
      
      let syncedCount = 0;
      const errors = [];

      for (const product of products) {
        try {
          const price = product.currentPrice || product.current_price || product.basePrice || product.base_price || 0;
          
          if (price > 0 && product.sumup_id) {
            await this.updateProductPrice(product.sumup_id, price);
            syncedCount++;
            console.log(`📈 Prix synchronisé: ${product.name} → ${price}€`);
          }
        } catch (error) {
          console.error(`❌ Erreur sync prix ${product.name}:`, error.message);
          errors.push({ product: product.name, error: error.message });
        }
      }

      console.log(`✅ ${syncedCount} prix synchronisés vers SumUp via API Product`);
      
      if (errors.length > 0) {
        console.log(`⚠️ ${errors.length} erreurs lors de la synchronisation:`, errors);
      }

      return { syncedCount, errors };
    } catch (error) {
      console.error('❌ Erreur synchronisation prix vers SumUp:', error);
      throw error;
    }
  }

  // Obtenir le statut du service
  getStatus() {
    return {
      isConfigured: this.isConfigured,
      hasToken: !!this.accessToken,
      message: this.isConfigured ? 'API Product SumUp configurée' : 'API Product SumUp non configurée'
    };
  }
}

// Instance singleton
const sumupProductService = new SumUpProductService();

module.exports = sumupProductService;
