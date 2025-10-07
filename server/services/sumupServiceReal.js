const axios = require('axios');
const crypto = require('crypto');

class SumUpServiceReal {
  constructor() {
    this.baseURL = 'https://api.sumup.com';
    this.clientId = process.env.SUMUP_CLIENT_ID;
    this.clientSecret = process.env.SUMUP_CLIENT_SECRET;
    this.redirectUri = process.env.SUMUP_REDIRECT_URI || 'http://localhost:5000/api/sumup/callback';
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.isDemoMode = false;
  }

  // Générer l'URL d'autorisation OAuth 2.0 (vraie API SumUp)
  getAuthorizationUrl(state = null) {
    if (!this.clientId) {
      throw new Error('SUMUP_CLIENT_ID non configuré dans les variables d\'environnement');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'payments',
      state: state || crypto.randomBytes(16).toString('hex')
    });

    // URL d'authentification SumUp réelle
    const authUrl = `https://api.sumup.com/authorize?${params.toString()}`;
    console.log('🔐 URL d\'authentification SumUp réelle:', authUrl);
    return authUrl;
  }

  // Échanger le code d'autorisation contre un token d'accès (vraie API SumUp)
  async exchangeCodeForToken(code) {
    try {
      if (!this.clientId || !this.clientSecret) {
        throw new Error('SUMUP_CLIENT_ID et SUMUP_CLIENT_SECRET doivent être configurés');
      }

      console.log('🔄 Échange du code d\'autorisation contre un token SumUp...');
      
      const response = await axios.post(`${this.baseURL}/token`, {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      console.log('✅ Token SumUp réel obtenu avec succès');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de l\'échange du code SumUp:', error.response?.data || error.message);
      throw error;
    }
  }

  // Rafraîchir le token d'accès (vraie API SumUp)
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('Aucun refresh token disponible');
    }

    try {
      console.log('🔄 Rafraîchissement du token SumUp...');
      
      const response = await axios.post(`${this.baseURL}/token`, {
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      console.log('✅ Token SumUp rafraîchi avec succès');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement du token SumUp:', error.response?.data || error.message);
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

  // Faire un appel API authentifié (vraie API SumUp)
  async makeAuthenticatedRequest(method, endpoint, data = null) {
    await this.ensureValidToken();

    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    try {
      console.log(`🌐 Appel API SumUp réel: ${method} ${endpoint}`);
      const response = await axios(config);
      console.log(`✅ Réponse API SumUp: ${response.status}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur API SumUp ${method} ${endpoint}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Récupérer les informations du marchand (vraie API SumUp)
  async getMerchantInfo() {
    try {
      console.log('🏪 Récupération des informations marchand SumUp...');
      const response = await this.makeAuthenticatedRequest('GET', '/v0.1/me');
      console.log('✅ Informations marchand SumUp récupérées');
      return response;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des infos marchand SumUp:', error.message);
      throw error;
    }
  }

  // Créer une transaction de paiement (vraie API SumUp)
  async createPayment(paymentData) {
    try {
      console.log(`💳 Création d'un paiement SumUp réel: ${paymentData.checkout_reference}`);
      
      // Utiliser l'endpoint correct de SumUp pour créer un checkout
      const response = await this.makeAuthenticatedRequest('POST', '/v0.1/checkouts', paymentData);
      console.log(`✅ Paiement SumUp créé: ${response.id}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur lors de la création du paiement SumUp:', error.message);
      throw error;
    }
  }

  // Récupérer le catalogue de produits (SumUp n'a pas d'API publique pour cela)
  async getProducts() {
    try {
      console.log('📦 SumUp ne fournit pas d\'API publique pour récupérer les produits du catalogue');
      console.log('💡 Les produits doivent être gérés via l\'interface SumUp ou l\'API privée');
      return [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des produits SumUp:', error.message);
      throw error;
    }
  }

  // Créer un produit dans SumUp (SumUp n'a pas d'API publique pour cela)
  async createProduct(productData) {
    try {
      console.log(`📦 SumUp ne fournit pas d'API publique pour créer des produits`);
      console.log(`💡 Le produit "${productData.name}" doit être créé via l'interface SumUp`);
      throw new Error('API SumUp ne supporte pas la création de produits via API publique');
    } catch (error) {
      console.error('❌ Erreur lors de la création du produit SumUp:', error.message);
      throw error;
    }
  }

  // Mettre à jour un produit dans SumUp (SumUp n'a pas d'API publique pour cela)
  async updateProduct(productId, productData) {
    try {
      console.log(`📦 SumUp ne fournit pas d'API publique pour mettre à jour les produits`);
      console.log(`💡 Le produit "${productId}" doit être modifié via l'interface SumUp`);
      throw new Error('API SumUp ne supporte pas la mise à jour de produits via API publique');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du produit SumUp:', error.message);
      throw error;
    }
  }

  // Supprimer un produit dans SumUp (SumUp n'a pas d'API publique pour cela)
  async deleteProduct(productId) {
    try {
      console.log(`📦 SumUp ne fournit pas d'API publique pour supprimer les produits`);
      console.log(`💡 Le produit "${productId}" doit être supprimé via l'interface SumUp`);
      throw new Error('API SumUp ne supporte pas la suppression de produits via API publique');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du produit SumUp:', error.message);
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

  // Vérifier la configuration
  checkConfiguration() {
    const config = {
      clientId: !!this.clientId,
      clientSecret: !!this.clientSecret,
      redirectUri: !!this.redirectUri,
      isConfigured: !!(this.clientId && this.clientSecret && this.redirectUri)
    };

    if (!config.isConfigured) {
      console.warn('⚠️ Configuration SumUp incomplète:');
      if (!config.clientId) console.warn('  - SUMUP_CLIENT_ID manquant');
      if (!config.clientSecret) console.warn('  - SUMUP_CLIENT_SECRET manquant');
      if (!config.redirectUri) console.warn('  - SUMUP_REDIRECT_URI manquant');
    } else {
      console.log('✅ Configuration SumUp complète');
    }

    return config;
  }

  // Obtenir le statut du service
  getStatus() {
    return {
      isDemoMode: this.isDemoMode,
      isConfigured: this.checkConfiguration().isConfigured,
      hasToken: !!this.accessToken,
      message: this.isDemoMode ? 'Mode démonstration' : 'Mode production SumUp'
    };
  }
}

// Instance singleton
const sumupServiceReal = new SumUpServiceReal();

module.exports = sumupServiceReal;
