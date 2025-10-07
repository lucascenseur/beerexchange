import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  RefreshCw, 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  Settings,
  Sync,
  Play,
  Pause
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SumUpAdmin = () => {
  const [authStatus, setAuthStatus] = useState(null);
  const [sumupProducts, setSumupProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [config, setConfig] = useState(null);
  const [showManualImport, setShowManualImport] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '' });
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const navigate = useNavigate();

  // Vérifier la configuration SumUp
  const checkConfig = async () => {
    try {
      const response = await axios.get('/api/sumup/config');
      setConfig(response.data.config);
    } catch (error) {
      console.error('Erreur vérification config SumUp:', error);
      setConfig({ isConfigured: false });
    }
  };

  // Vérifier le statut d'authentification SumUp
  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/sumup/status');
      setAuthStatus(response.data);
    } catch (error) {
      console.error('Erreur vérification statut SumUp:', error);
      setAuthStatus({ authenticated: false });
    }
  };

  // Récupérer les produits SumUp
  const fetchSumUpProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/sumup/products');
      setSumupProducts(response.data.products || []);
    } catch (error) {
      console.error('Erreur récupération produits SumUp:', error);
      toast.error('Erreur lors de la récupération des produits SumUp');
    } finally {
      setLoading(false);
    }
  };

  // Importer les produits SumUp dans Beer Exchange
  const importSumUpProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/sumup/import-products');
      toast.success(`Import réussi: ${response.data.imported} produits traités`);
      
      // Rafraîchir la liste des produits
      fetchSumUpProducts();
    } catch (error) {
      console.error('Erreur import produits SumUp:', error);
      toast.error('Erreur lors de l\'import des produits SumUp');
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un produit manuellement
  const addManualProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      toast.error('Nom et prix requis');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/products', {
        name: newProduct.name,
        description: newProduct.description,
        category: 'other',
        base_price: parseFloat(newProduct.price),
        current_price: parseFloat(newProduct.price),
        stock: 999,
        initial_stock: 999,
        is_active: true
      });

      toast.success(`Produit "${newProduct.name}" ajouté avec succès`);
      setNewProduct({ name: '', price: '', description: '' });
      setShowManualImport(false);
      
      // Rafraîchir la liste
      fetchSumUpProducts();
    } catch (error) {
      console.error('Erreur ajout produit:', error);
      toast.error('Erreur lors de l\'ajout du produit');
    } finally {
      setLoading(false);
    }
  };

  // Vérifier le statut de synchronisation
  const checkSyncStatus = async () => {
    try {
      const response = await axios.get('/api/sumup/sync/status');
      setSyncStatus(response.data.status);
    } catch (error) {
      console.error('Erreur statut sync:', error);
    }
  };

  // Démarrer la synchronisation automatique
  const startAutoSync = async () => {
    setSyncLoading(true);
    try {
      const response = await axios.post('/api/sumup/sync/start', {
        intervalMinutes: 5
      });
      toast.success(response.data.message);
      checkSyncStatus();
    } catch (error) {
      console.error('Erreur démarrage sync:', error);
      toast.error('Erreur lors du démarrage de la synchronisation');
    } finally {
      setSyncLoading(false);
    }
  };

  // Arrêter la synchronisation automatique
  const stopAutoSync = async () => {
    setSyncLoading(true);
    try {
      const response = await axios.post('/api/sumup/sync/stop');
      toast.success(response.data.message);
      checkSyncStatus();
    } catch (error) {
      console.error('Erreur arrêt sync:', error);
      toast.error('Erreur lors de l\'arrêt de la synchronisation');
    } finally {
      setSyncLoading(false);
    }
  };

  // Synchronisation manuelle
  const performManualSync = async () => {
    setSyncLoading(true);
    try {
      const response = await axios.post('/api/sumup/sync/now');
      toast.success(response.data.message);
      checkSyncStatus();
    } catch (error) {
      console.error('Erreur sync manuelle:', error);
      toast.error('Erreur lors de la synchronisation manuelle');
    } finally {
      setSyncLoading(false);
    }
  };

  // Démarrer l'authentification SumUp
  const startSumUpAuth = async () => {
    try {
      const response = await axios.get('/api/sumup/auth');
      if (response.data.authUrl) {
        window.open(response.data.authUrl, '_blank');
        toast.success('Redirection vers SumUp pour authentification');
      }
    } catch (error) {
      console.error('Erreur authentification SumUp:', error);
      toast.error('Erreur lors de l\'authentification SumUp');
    }
  };

  // Synchroniser depuis SumUp
  const syncFromSumUp = async () => {
    setSyncing(true);
    try {
      await axios.post('/api/sumup/sync/from-sumup');
      toast.success('Synchronisation depuis SumUp réussie');
      await fetchSumUpProducts();
    } catch (error) {
      console.error('Erreur synchronisation depuis SumUp:', error);
      toast.error('Erreur lors de la synchronisation depuis SumUp');
    } finally {
      setSyncing(false);
    }
  };

  // Synchroniser vers SumUp
  const syncToSumUp = async () => {
    setSyncing(true);
    try {
      await axios.post('/api/sumup/sync/to-sumup');
      toast.success('Synchronisation vers SumUp réussie');
      await fetchSumUpProducts();
    } catch (error) {
      console.error('Erreur synchronisation vers SumUp:', error);
      toast.error('Erreur lors de la synchronisation vers SumUp');
    } finally {
      setSyncing(false);
    }
  };

  // Vérifier le statut de synchronisation
  const checkSyncStatus = async () => {
    try {
      const response = await axios.get('/api/sumup/sync/status');
      setSyncStatus(response.data);
    } catch (error) {
      console.error('Erreur vérification statut sync:', error);
    }
  };

  useEffect(() => {
    checkConfig();
    checkAuthStatus();
    checkSyncStatus();
  }, []);

  useEffect(() => {
    if (authStatus?.authenticated) {
      fetchSumUpProducts();
    }
  }, [authStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-extrabold text-beer-gold animate-pulse-glow">
          💳 SumUp Administration 💳
        </h2>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour Admin
        </button>
      </div>

      {/* Statut d'authentification */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6 border border-white/20">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Statut d'Authentification SumUp
        </h3>
        
        {/* Configuration */}
        {config && (
          <div className={`border rounded-lg p-4 mb-4 ${config.isConfigured ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
            <div className="flex items-center gap-2">
              {config.isConfigured ? (
                <CheckCircle className="w-6 h-6 text-green-400" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400" />
              )}
              <div>
                <p className={`font-semibold ${config.isConfigured ? 'text-green-400' : 'text-red-400'}`}>
                  {config.isConfigured ? '✅ Configuration SumUp' : '❌ Configuration Manquante'}
                </p>
                <p className={`text-sm ${config.isConfigured ? 'text-green-300' : 'text-red-300'}`}>
                  {config.isConfigured 
                    ? 'Client ID et Secret configurés - Prêt pour l\'authentification' 
                    : 'Veuillez configurer SUMUP_CLIENT_ID et SUMUP_CLIENT_SECRET dans le fichier .env'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mode démo */}
        {authStatus?.isDemoMode && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-semibold">🎭 Mode Démonstration</p>
                <p className="text-yellow-300 text-sm">{authStatus.statusMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {authStatus ? (
          <div className="flex items-center gap-4">
            {authStatus.authenticated ? (
              <>
                <CheckCircle className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-green-400 font-semibold">Authentifié avec SumUp</p>
                  {authStatus.merchant && (
                    <p className="text-white/70 text-sm">
                      Marchand: {authStatus.merchant.email} (ID: {authStatus.merchant.id})
                    </p>
                  )}
                  {authStatus.expiresAt && (
                    <p className="text-white/70 text-sm">
                      Expire: {new Date(authStatus.expiresAt).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-8 h-8 text-red-400" />
                <div>
                  <p className="text-red-400 font-semibold">Non authentifié avec SumUp</p>
                  <p className="text-white/70 text-sm">
                    {authStatus.isExpired ? 'Token expiré' : 'Aucune authentification active'}
                  </p>
                </div>
                <button
                  onClick={startSumUpAuth}
                  className="px-4 py-2 bg-beer-gold text-purple-900 rounded-lg hover:bg-yellow-400 transition-colors duration-200 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  S'authentifier avec SumUp
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-yellow-400" />
            <p className="text-yellow-400">Vérification du statut...</p>
          </div>
        )}
      </div>

      {/* Actions de synchronisation */}
      {authStatus?.authenticated && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6 border border-white/20">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <RefreshCw className="w-6 h-6" />
            Synchronisation des Produits
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={syncFromSumUp}
              disabled={syncing}
              className="p-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors duration-200 flex items-center gap-3"
            >
              <Download className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Synchroniser depuis SumUp</p>
                <p className="text-sm opacity-80">Importer les produits SumUp</p>
              </div>
            </button>
            
            <button
              onClick={syncToSumUp}
              disabled={syncing}
              className="p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors duration-200 flex items-center gap-3"
            >
              <Upload className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Synchroniser vers SumUp</p>
                <p className="text-sm opacity-80">Exporter les produits vers SumUp</p>
              </div>
            </button>
          </div>

          {syncing && (
            <div className="mt-4 flex items-center gap-2 text-yellow-400">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <p>Synchronisation en cours...</p>
            </div>
          )}
        </div>
      )}

      {/* Liste des produits SumUp */}
      {authStatus?.authenticated && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Produits SumUp ({sumupProducts.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={fetchSumUpProducts}
                disabled={loading}
                className="px-4 py-2 bg-beer-gold text-purple-900 rounded-lg hover:bg-yellow-400 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              
              <button
                onClick={importSumUpProducts}
                disabled={loading || sumupProducts.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Importer
              </button>
              
              <button
                onClick={() => setShowManualImport(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Ajouter manuellement
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Chargement des produits SumUp...</p>
            </div>
          ) : sumupProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sumupProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/20 rounded-lg p-4"
                >
                  <h4 className="font-semibold text-white mb-2">{product.name}</h4>
                  <p className="text-beer-gold font-bold text-lg">{product.price}€</p>
                  {product.description && (
                    <p className="text-white/70 text-sm mt-2">{product.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                      {product.category || 'default'}
                    </span>
                    {product.image_url && (
                      <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                        Image
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-white/50" />
              <p className="text-white/70 mb-4">Aucun produit trouvé dans SumUp</p>
              <p className="text-white/50 text-sm mb-4">
                L'API SumUp ne permet pas de récupérer les produits automatiquement.
              </p>
              <button
                onClick={() => setShowManualImport(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 mx-auto"
              >
                <Upload className="w-4 h-4" />
                Ajouter vos produits manuellement
              </button>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mt-6 border border-white/20">
        <h3 className="text-xl font-bold mb-4">📋 Instructions d'Intégration SumUp</h3>
        <div className="space-y-3 text-white/80">
          <p>1. <strong>Authentification :</strong> Cliquez sur "S'authentifier avec SumUp" pour connecter votre compte</p>
          <p>2. <strong>Synchronisation :</strong> Utilisez les boutons pour synchroniser les produits dans les deux sens</p>
          <p>3. <strong>Produits :</strong> Les produits SumUp seront automatiquement importés dans Beer Exchange</p>
          <p>4. <strong>Paiements :</strong> Les ventes peuvent être synchronisées avec SumUp pour le suivi</p>
        </div>
      </div>

      {/* Synchronisation automatique */}
      {authStatus?.authenticated && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mt-6 border border-white/20">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sync className="w-6 h-6" />
            Synchronisation automatique SumUp
          </h3>
          
          {syncStatus && (
            <div className="mb-4 p-4 bg-white/5 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-white/70">Statut:</span>
                  <div className={`font-semibold ${syncStatus.isRunning ? 'text-green-400' : 'text-red-400'}`}>
                    {syncStatus.isRunning ? '🟢 Actif' : '🔴 Inactif'}
                  </div>
                </div>
                <div>
                  <span className="text-white/70">Dernière sync:</span>
                  <div className="text-white">
                    {syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime).toLocaleTimeString() : 'Jamais'}
                  </div>
                </div>
                <div>
                  <span className="text-white/70">Sync réussies:</span>
                  <div className="text-green-400 font-semibold">
                    {syncStatus.stats?.successfulSyncs || 0}
                  </div>
                </div>
                <div>
                  <span className="text-white/70">Échecs:</span>
                  <div className="text-red-400 font-semibold">
                    {syncStatus.stats?.failedSyncs || 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={startAutoSync}
              disabled={syncLoading || syncStatus?.isRunning}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Démarrer auto-sync
            </button>
            
            <button
              onClick={stopAutoSync}
              disabled={syncLoading || !syncStatus?.isRunning}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              <Pause className="w-4 h-4" />
              Arrêter auto-sync
            </button>
            
            <button
              onClick={performManualSync}
              disabled={syncLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
              Sync maintenant
            </button>
            
            <button
              onClick={checkSyncStatus}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser statut
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-sm">
              <strong>🔄 Synchronisation automatique :</strong> Synchronise les prix et ventes entre Beer Exchange et SumUp toutes les 5 minutes.
              Les ventes SumUp déclenchent automatiquement le système de bourse.
            </p>
          </div>
        </div>
      )}

      {/* Modal d'ajout manuel */}
      {showManualImport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-purple-900 rounded-lg p-6 w-full max-w-md mx-4 border border-purple-500/30"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Ajouter un produit manuellement
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom du produit</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                  placeholder="Ex: Kwak 25cl"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Prix (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                  placeholder="Ex: 4.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description (optionnel)</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400 h-20 resize-none"
                  placeholder="Description du produit..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={addManualProduct}
                disabled={loading || !newProduct.name || !newProduct.price}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Ajouter
              </button>
              
              <button
                onClick={() => {
                  setShowManualImport(false);
                  setNewProduct({ name: '', price: '', description: '' });
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SumUpAdmin;
