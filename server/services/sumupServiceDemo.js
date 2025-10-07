const crypto = require('crypto');

class SumUpServiceDemo {
  constructor() {
    this.baseURL = process.env.SUMUP_BASE_URL || 'https://api.sumup.com';
    this.clientId = process.env.SUMUP_CLIENT_ID;
    this.clientSecret = process.env.SUMUP_CLIENT_SECRET;
    this.redirectUri = process.env.SUMUP_REDIRECT_URI || 'http://localhost:5000/api/sumup/callback';
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.demoMode = true;
  }

  // Générer l'URL d'autorisation OAuth 2.0 (simulation)
  getAuthorizationUrl(state = null) {
    console.log('🔄 Mode démo : Simulation de l\'URL d\'autorisation SumUp');
    // Retourner une URL de démonstration
    return `https://demo.sumup.com/authorize?demo=true&state=${state || crypto.randomBytes(16).toString('hex')}`;
  }

  // Échanger le code d'autorisation contre un token d'accès (simulation)
  async exchangeCodeForToken(code) {
    console.log('🔄 Mode démo : Simulation de l\'échange de code SumUp');
    
    // Simuler un token d'accès
    const mockToken = {
      access_token: 'demo_access_token_' + Date.now(),
      refresh_token: 'demo_refresh_token_' + Date.now(),
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'payments'
    };

    this.accessToken = mockToken.access_token;
    this.refreshToken = mockToken.refresh_token;
    this.tokenExpiry = Date.now() + (mockToken.expires_in * 1000);

    console.log('✅ Token SumUp simulé obtenu avec succès');
    return mockToken;
  }

  // Rafraîchir le token d'accès (simulation)
  async refreshAccessToken() {
    console.log('🔄 Mode démo : Simulation du rafraîchissement de token SumUp');
    
    const mockToken = {
      access_token: 'demo_refreshed_token_' + Date.now(),
      refresh_token: 'demo_refresh_token_' + Date.now(),
      token_type: 'Bearer',
      expires_in: 3600
    };

    this.accessToken = mockToken.access_token;
    this.refreshToken = mockToken.refresh_token;
    this.tokenExpiry = Date.now() + (mockToken.expires_in * 1000);

    console.log('✅ Token SumUp simulé rafraîchi avec succès');
    return mockToken;
  }

  // Vérifier si le token est valide (simulation)
  async ensureValidToken() {
    if (!this.accessToken) {
      // Créer un token de démo si aucun n'existe
      this.accessToken = 'demo_token_' + Date.now();
      this.refreshToken = 'demo_refresh_' + Date.now();
      this.tokenExpiry = Date.now() + (3600 * 1000);
      console.log('🔄 Token de démo créé automatiquement');
    }

    if (this.tokenExpiry && Date.now() >= this.tokenExpiry - 60000) {
      await this.refreshAccessToken();
    }
  }

  // Faire un appel API authentifié (simulation)
  async makeAuthenticatedRequest(method, endpoint, data = null) {
    await this.ensureValidToken();
    
    console.log(`🔄 Mode démo : Simulation API SumUp ${method} ${endpoint}`);
    
    // Simuler une réponse selon l'endpoint
    if (endpoint === '/v0.1/me') {
      return {
        id: 'demo-merchant-' + Date.now(),
        email: 'demo@beerexchange.com',
        name: 'Beer Exchange Demo',
        status: 'active',
        demo_mode: true
      };
    }
    
    if (endpoint === '/v0.1/checkouts') {
      return {
        id: 'demo_checkout_' + Date.now(),
        checkout_reference: data?.checkout_reference || 'demo_ref_' + Date.now(),
        amount: data?.amount || 0,
        currency: data?.currency || 'EUR',
        status: 'pending',
        demo_mode: true
      };
    }
    
    return { demo_mode: true, endpoint, method, data };
  }

  // Récupérer le catalogue de produits (simulation)
  async getProducts() {
    console.log('📦 Mode démo : Simulation des produits SumUp');
    
    // Retourner des produits de démonstration
    return [
      {
        id: 'demo_product_1',
        name: 'Kwak 25cl',
        price: 4.00,
        description: 'Bière belge artisanale',
        category: 'beverage',
        demo_mode: true
      },
      {
        id: 'demo_product_2',
        name: 'Kwak 50cl',
        price: 7.00,
        description: 'Bière belge artisanale',
        category: 'beverage',
        demo_mode: true
      },
      {
        id: 'demo_product_3',
        name: 'Celtpils 25cl',
        price: 3.00,
        description: 'Bière blonde',
        category: 'beverage',
        demo_mode: true
      }
    ];
  }

  // Créer un produit dans SumUp (simulation)
  async createProduct(productData) {
    console.log(`✅ Mode démo : Produit simulé créé dans SumUp: ${productData.name}`);
    return { 
      id: 'demo_product_' + Date.now(), 
      ...productData,
      demo_mode: true
    };
  }

  // Mettre à jour un produit dans SumUp (simulation)
  async updateProduct(productId, productData) {
    console.log(`✅ Mode démo : Produit simulé mis à jour dans SumUp: ${productId}`);
    return { 
      id: productId, 
      ...productData,
      demo_mode: true
    };
  }

  // Supprimer un produit dans SumUp (simulation)
  async deleteProduct(productId) {
    console.log(`✅ Mode démo : Produit simulé supprimé dans SumUp: ${productId}`);
    return true;
  }

  // Créer une transaction de paiement (simulation)
  async createPayment(paymentData) {
    console.log(`💳 Mode démo : Paiement simulé créé dans SumUp: ${paymentData.checkout_reference}`);
    
    return { 
      id: 'demo_payment_' + Date.now(), 
      checkout_reference: paymentData.checkout_reference,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: 'pending',
      demo_mode: true,
      payment_url: `https://demo.sumup.com/pay/${paymentData.checkout_reference}`
    };
  }

  // Récupérer les informations du marchand (simulation)
  async getMerchantInfo() {
    console.log('🏪 Mode démo : Informations marchand SumUp simulées');
    
    return {
      id: 'demo-merchant-' + Date.now(),
      email: 'demo@beerexchange.com',
      name: 'Beer Exchange Demo',
      status: 'active',
      demo_mode: true,
      created_at: new Date().toISOString()
    };
  }

  // Sauvegarder les tokens dans la base de données (simulation)
  async saveTokens(tokens) {
    console.log('💾 Mode démo : Sauvegarde simulée des tokens SumUp');
    
    const SumUpToken = require('../models/SumUpToken');
    
    // Ajouter le flag demo_mode
    const demoTokens = {
      ...tokens,
      demo_mode: true
    };
    
    await SumUpToken.saveNewToken(demoTokens);
    
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
      
      console.log('🔄 Mode démo : Tokens SumUp chargés depuis la base de données');
      
      return {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        tokenExpiry: this.tokenExpiry,
        demo_mode: true
      };
    }
    
    console.log('🔄 Mode démo : Aucun token SumUp trouvé, mode démo activé');
    return null;
  }

  // Obtenir le statut du mode démo
  getDemoStatus() {
    return {
      demo_mode: this.demoMode,
      message: 'Beer Exchange fonctionne en mode démo SumUp',
      features: [
        'Authentification simulée',
        'Produits de démonstration',
        'Paiements simulés',
        'Interface complète fonctionnelle'
      ]
    };
  }
}

// Instance singleton
const sumupServiceDemo = new SumUpServiceDemo();

module.exports = sumupServiceDemo;
