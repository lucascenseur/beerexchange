const axios = require('axios');
const crypto = require('crypto');

class SumUpServiceSimple {
  constructor() {
    this.baseURL = process.env.SUMUP_BASE_URL || 'https://api.sumup.com';
    this.clientId = process.env.SUMUP_CLIENT_ID;
    this.clientSecret = process.env.SUMUP_CLIENT_SECRET;
    this.redirectUri = process.env.SUMUP_REDIRECT_URI || 'http://localhost:5000/api/sumup/callback';
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  // Générer l'URL d'autorisation OAuth 2.0
  getAuthorizationUrl(state = null) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'payments',
      state: state || crypto.randomBytes(16).toString('hex')
    });

    // URL d'authentification SumUp correcte
    return `https://api.sumup.com/authorize?${params.toString()}`;
  }

  // Échanger le code d'autorisation contre un token d'accès
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(`https://api.sumup.com/token`, {
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

      console.log('✅ Token SumUp obtenu avec succès');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de l\'échange du code:', error.response?.data || error.message);
      throw error;
    }
  }

  // Rafraîchir le token d'accès
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('Aucun refresh token disponible');
    }

    try {
      const response = await axios.post(`https://api.sumup.com/token`, {
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
      console.error('❌ Erreur lors du rafraîchissement du token:', error.response?.data || error.message);
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

  // Faire un appel API authentifié
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
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur API SumUp ${method} ${endpoint}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Récupérer le catalogue de produits (simulation)
  async getProducts() {
    try {
      console.log('📦 Mode simulation : Aucun produit SumUp disponible');
      return [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des produits SumUp:', error.message);
      throw error;
    }
  }

  // Créer un produit dans SumUp (simulation)
  async createProduct(productData) {
    try {
      console.log(`✅ Produit simulé créé dans SumUp: ${productData.name}`);
      return { id: Date.now(), ...productData };
    } catch (error) {
      console.error('❌ Erreur lors de la création du produit SumUp:', error.message);
      throw error;
    }
  }

  // Mettre à jour un produit dans SumUp (simulation)
  async updateProduct(productId, productData) {
    try {
      console.log(`✅ Produit simulé mis à jour dans SumUp: ${productId}`);
      return { id: productId, ...productData };
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du produit SumUp:', error.message);
      throw error;
    }
  }

  // Supprimer un produit dans SumUp (simulation)
  async deleteProduct(productId) {
    try {
      console.log(`✅ Produit simulé supprimé dans SumUp: ${productId}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du produit SumUp:', error.message);
      throw error;
    }
  }

  // Créer une transaction de paiement
  async createPayment(paymentData) {
    try {
      // Utiliser l'endpoint correct de SumUp pour créer un checkout
      const response = await this.makeAuthenticatedRequest('POST', '/v0.1/checkouts', paymentData);
      console.log(`💳 Paiement créé dans SumUp: ${paymentData.checkout_reference}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur lors de la création du paiement SumUp:', error.message);
      // En cas d'erreur, simuler le paiement pour la démo
      console.log('🔄 Simulation du paiement pour la démo');
      return { 
        id: Date.now(), 
        checkout_reference: paymentData.checkout_reference,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: 'pending'
      };
    }
  }

  // Récupérer les informations du marchand
  async getMerchantInfo() {
    try {
      const response = await this.makeAuthenticatedRequest('GET', '/v0.1/me');
      console.log('🏪 Informations marchand SumUp récupérées');
      return response;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des infos marchand:', error.message);
      // En cas d'erreur, retourner des infos simulées
      return {
        id: 'demo-merchant',
        email: 'demo@beerexchange.com',
        name: 'Beer Exchange Demo'
      };
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
}

// Instance singleton
const sumupServiceSimple = new SumUpServiceSimple();

module.exports = sumupServiceSimple;
