import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  BarChart3,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  Settings,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import StatsChart from '../components/StatsChart';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({});
  const [recentSales, setRecentSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const { user, logout } = useAuth();
  const { onProductUpdate, onProductCreated, onProductDeleted } = useSocket();

  // Récupérer les données du dashboard
  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard');
      setDashboardStats(response.data.globalStats);
      setRecentSales(response.data.recentSales);
      setTopProducts(response.data.topProducts);
      setLowStockProducts(response.data.lowStockProducts);
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  // Récupérer les produits
  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data.products);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      toast.error('Erreur lors du chargement des produits');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchDashboardData();
  }, []);

  // Écouter les mises à jour en temps réel
  useEffect(() => {
    const unsubscribeUpdate = onProductUpdate((updatedProduct) => {
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === updatedProduct.id ? updatedProduct : product
        )
      );
    });

    const unsubscribeCreate = onProductCreated((newProduct) => {
      setProducts(prevProducts => [...prevProducts, newProduct]);
    });

    const unsubscribeDelete = onProductDeleted(({ id }) => {
      setProducts(prevProducts => 
        prevProducts.filter(product => product.id !== id)
      );
    });

    return () => {
      unsubscribeUpdate();
      unsubscribeCreate();
      unsubscribeDelete();
    };
  }, [onProductUpdate, onProductCreated, onProductDeleted]);

  // Supprimer un produit
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await axios.delete(`/api/admin/products/${productId}`);
        toast.success('Produit supprimé avec succès');
        fetchProducts();
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression';
        toast.error(errorMessage);
      }
    }
  };

  // Ouvrir le modal d'édition
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  // Ouvrir le modal de création
  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  // Fermer le modal
  const handleCloseModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
  };

  // Sauvegarder le produit
  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        await axios.put(`/api/admin/products/${editingProduct.id}`, productData);
        toast.success('Produit mis à jour avec succès');
      } else {
        await axios.post('/api/admin/products', productData);
        toast.success('Produit créé avec succès');
      }
      fetchProducts();
      handleCloseModal();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la sauvegarde';
      toast.error(errorMessage);
    }
  };

  // Réinitialiser les données
  const handleReset = async (type) => {
    const confirmMessage = type === 'prices' ? 'Réinitialiser tous les prix ?' :
                          type === 'stocks' ? 'Réinitialiser tous les stocks ?' :
                          'Réinitialiser toutes les ventes ?';
    
    if (window.confirm(confirmMessage)) {
      try {
        const resetData = {};
        resetData[`reset${type.charAt(0).toUpperCase() + type.slice(1)}`] = true;
        
        await axios.post('/api/admin/reset', resetData);
        toast.success('Réinitialisation effectuée avec succès');
        fetchProducts();
        fetchDashboardData();
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Erreur lors de la réinitialisation';
        toast.error(errorMessage);
      }
    }
  };

  // Gestion de la déconnexion
  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-sm border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500 rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Beer Exchange</h1>
                <p className="text-white/80">Interface Administrateur</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right text-white">
                <p className="font-semibold">Bonjour, {user?.username}</p>
                <p className="text-sm text-white/70">Administrateur</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn-danger flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation par onglets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-2 mb-8"
        >
          <div className="flex space-x-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'products', label: 'Produits', icon: Package },
              { id: 'settings', label: 'Paramètres', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-white text-gray-800 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Contenu des onglets */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Statistiques globales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                  <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white">{dashboardStats.totalRevenue || 0}€</p>
                  <p className="text-white/70">Chiffre d'affaires</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white">{dashboardStats.totalSales || 0}</p>
                  <p className="text-white/70">Ventes totales</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                  <Package className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white">{dashboardStats.uniqueProductsCount || 0}</p>
                  <p className="text-white/70">Produits vendus</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                  <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white">{dashboardStats.uniqueServersCount || 0}</p>
                  <p className="text-white/70">Serveurs actifs</p>
                </div>
              </div>

              {/* Graphique des ventes */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Évolution des ventes</h3>
                <StatsChart data={topProducts} />
              </div>

              {/* Produits avec stock faible */}
              {lowStockProducts.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                    <h3 className="text-2xl font-bold text-white">Stock faible</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lowStockProducts.map(product => (
                      <div key={product.id} className="bg-white/5 rounded-lg p-4">
                        <h4 className="font-semibold text-white">{product.name}</h4>
                        <p className="text-yellow-400 font-bold">Stock: {product.stock}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* En-tête avec bouton d'ajout */}
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white">Gestion des produits</h2>
                <button
                  onClick={handleCreateProduct}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter un produit
                </button>
              </div>

              {/* Liste des produits */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <ProductCard
                      product={product}
                      showChart={true}
                    />
                    
                    {/* Boutons d'action */}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <h2 className="text-3xl font-bold text-white">Paramètres système</h2>
              
              {/* Actions de réinitialisation */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Réinitialisation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleReset('prices')}
                    className="btn-warning flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Reset Prix
                  </button>
                  <button
                    onClick={() => handleReset('stocks')}
                    className="btn-warning flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Reset Stocks
                  </button>
                  <button
                    onClick={() => handleReset('sales')}
                    className="btn-danger flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Reset Ventes
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de produit */}
      <AnimatePresence>
        {showProductModal && (
          <ProductModal
            product={editingProduct}
            onSave={handleSaveProduct}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
