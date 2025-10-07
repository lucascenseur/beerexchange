const crypto = require('crypto');

class SumUpServiceDemo {
  constructor() {
    this.baseURL = 'https://api.sumup.com';
    this.clientId = process.env.SUMUP_CLIENT_ID || 'demo-client-id';
    this.clientSecret = process.env.SUMUP_CLIENT_SECRET || 'demo-client-secret';
    this.redirectUri = process.env.SUMUP_REDIRECT_URI || 'http://localhost:5000/api/sumup/callback';
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.isDemoMode = true;
  }

  // Générer l'URL d'autorisation OAuth 2.0 (mode démo)
  getAuthorizationUrl(state = null) {
    console.log('🎭 Mode démo SumUp - Simulation de l\'authentification');
    
    // Retourner une URL de démonstration
    const demoUrl = `https://demo.sumup.com/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&response_type=code&scope=payments&state=${state || 'demo'}`;
    
    console.log('🔗 URL d\'authentification démo:', demoUrl);
    return demoUrl;
  }

  // Échanger le code d'autorisation contre un token d'accès (mode démo)
  async exchangeCodeForToken(code) {
    try {
      console.log('🎭 Mode démo SumUp - Simulation de l\'échange de token');
      
      // Simuler une réponse de token
      const mockTokenData = {
        access_token: 'demo_access_token_' + Date.now(),
        refresh_token: 'demo_refresh_token_' + Date.now(),
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'payments'
      };

      this.accessToken = mockTokenData.access_token;
      this.refreshToken = mockTokenData.refresh_token;
      this.tokenExpiry = Date.now() + (mockTokenData.expires_in * 1000);

      console.log('✅ Token SumUp simulé obtenu avec succès');
      return mockTokenData;
    } catch (error) {
      console.error('❌ Erreur lors de l\'échange du code (démo):', error.message);
      throw error;
    }
  }

  // Rafraîchir le token d'accès (mode démo)
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('Aucun refresh token disponible');
    }

    try {
      console.log('🎭 Mode démo SumUp - Simulation du rafraîchissement de token');
      
      // Simuler un nouveau token
      const mockTokenData = {
        access_token: 'demo_access_token_refreshed_' + Date.now(),
        refresh_token: 'demo_refresh_token_' + Date.now(),
        token_type: 'Bearer',
        expires_in: 3600
      };

      this.accessToken = mockTokenData.access_token;
      this.refreshToken = mockTokenData.refresh_token;
      this.tokenExpiry = Date.now() + (mockTokenData.expires_in * 1000);

      console.log('✅ Token SumUp simulé rafraîchi avec succès');
      return mockTokenData;
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement du token (démo):', error.message);
      throw error;
    }
  }

  // Vérifier si le token est valide et le rafraîchir si nécessaire
  async ensureValidToken() {
    if (!this.accessToken) {
      throw new Error('Aucun token d\'accès disponible');
    }

    if (this.tokenExpiry && Date.now() >= this.tokenExpiry - 60000) { // Rafraîchir 1 minute avant expiration
      await this.refreshAccessToken();
    }
  }

  // Faire un appel API authentifié (mode démo)
  async makeAuthenticatedRequest(method, endpoint, data = null) {
    await this.ensureValidToken();

    console.log(`🎭 Mode démo SumUp - Simulation de l'appel API ${method} ${endpoint}`);
    
    // Simuler une réponse selon l'endpoint
    if (endpoint.includes('/me')) {
      return {
        id: 'demo-merchant-123',
        email: 'demo@beerexchange.com',
        name: 'Beer Exchange Demo',
        country: 'FR',
        currency: 'EUR'
      };
    } else if (endpoint.includes('/checkouts')) {
      return {
        id: 'demo-checkout-' + Date.now(),
        checkout_reference: data?.checkout_reference || 'demo-ref-' + Date.now(),
        amount: data?.amount || 0,
        currency: data?.currency || 'EUR',
        status: 'pending',
        payment_url: 'https://demo.sumup.com/pay/demo-checkout-' + Date.now()
      };
    }

    return { success: true, message: 'Simulation réussie' };
  }

  // Récupérer le catalogue de produits (mode démo)
  async getProducts() {
    try {
      console.log('🎭 Mode démo SumUp - Simulation de la récupération des produits');
      
      // Retourner des produits de démonstration
      return [
        {
          id: 'demo-product-1',
          name: 'Kwak 25cl',
          price: 4.00,
          description: 'Bière belge artisanale',
          category: 'beverage'
        },
        {
          id: 'demo-product-2',
          name: 'Kwak 50cl',
          price: 7.00,
          description: 'Bière belge artisanale',
          category: 'beverage'
        },
        {
          id: 'demo-product-3',
          name: 'Celtpils 25cl',
          price: 3.00,
          description: 'Bière blonde',
          category: 'beverage'
        }
      ];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des produits SumUp (démo):', error.message);
      throw error;
    }
  }

  // Créer un produit dans SumUp (mode démo)
  async createProduct(productData) {
    try {
      console.log(`🎭 Mode démo SumUp - Simulation de la création du produit: ${productData.name}`);
      
      const mockProduct = {
        id: 'demo-product-' + Date.now(),
        ...productData,
        created_at: new Date().toISOString()
      };
      
      return mockProduct;
    } catch (error) {
      console.error('❌ Erreur lors de la création du produit SumUp (démo):', error.message);
      throw error;
    }
  }

  // Mettre à jour un produit dans SumUp (mode démo)
  async updateProduct(productId, productData) {
    try {
      console.log(`🎭 Mode démo SumUp - Simulation de la mise à jour du produit: ${productId}`);
      
      const mockProduct = {
        id: productId,
        ...productData,
        updated_at: new Date().toISOString()
      };
      
      return mockProduct;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du produit SumUp (démo):', error.message);
      throw error;
    }
  }

  // Supprimer un produit dans SumUp (mode démo)
  async deleteProduct(productId) {
    try {
      console.log(`🎭 Mode démo SumUp - Simulation de la suppression du produit: ${productId}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du produit SumUp (démo):', error.message);
      throw error;
    }
  }

  // Créer une transaction de paiement (mode démo)
  async createPayment(paymentData) {
    try {
      console.log(`🎭 Mode démo SumUp - Simulation de la création du paiement: ${paymentData.checkout_reference}`);
      
      const mockPayment = {
        id: 'demo-payment-' + Date.now(),
        checkout_reference: paymentData.checkout_reference,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: 'pending',
        payment_url: `https://demo.sumup.com/pay/demo-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      
      return mockPayment;
    } catch (error) {
      console.error('❌ Erreur lors de la création du paiement SumUp (démo):', error.message);
      throw error;
    }
  }

  // Récupérer les informations du marchand (mode démo)
  async getMerchantInfo() {
    try {
      console.log('🎭 Mode démo SumUp - Simulation de la récupération des infos marchand');
      
      return {
        id: 'demo-merchant-123',
        email: 'demo@beerexchange.com',
        name: 'Beer Exchange Demo',
        country: 'FR',
        currency: 'EUR',
        business_name: 'Beer Exchange Demo Business'
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des infos marchand (démo):', error.message);
      throw error;
    }
  }

  // Sauvegarder les tokens dans la base de données
  async saveTokens(tokens) {
    const SumUpToken = require('../models/SumUpToken');
    await SumUpToken.saveNewToken(tokens);
    
    // Mettre à jour les tokens en mémoire
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);
  }

  // Charger les tokens depuis la base de données
  async loadTokens() {
    const SumUpToken = require('../models/SumUpToken');
    const activeToken = await SumUpToken.getActiveToken();
    
    if (activeToken) {
      this.accessToken = activeToken.accessToken;
      this.refreshToken = activeToken.refreshToken;
      this.tokenExpiry = activeToken.created_at.getTime() + (activeToken.expiresIn * 1000);
      
      return {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        tokenExpiry: this.tokenExpiry
      };
    }
    
    return null;
  }

  // Obtenir le statut du mode démo
  getDemoStatus() {
    return {
      isDemoMode: this.isDemoMode,
      message: 'Mode démonstration SumUp activé - Toutes les fonctionnalités sont simulées'
    };
  }
}

// Instance singleton
const sumupServiceDemo = new SumUpServiceDemo();

module.exports = sumupServiceDemo;
