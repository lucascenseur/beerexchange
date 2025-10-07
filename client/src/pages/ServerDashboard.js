import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, 
  Beer, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Clock,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import ProductCard from '../components/ProductCard';
import axios from 'axios';
import toast from 'react-hot-toast';

const ServerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    totalSales: 0
  });
  const { user, logout } = useAuth();
  const { onProductUpdate, onProductCreated, onProductDeleted } = useSocket();

  // Récupérer les produits
  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data.products);
      setFilteredProducts(response.data.products);
      setLoading(false);
      
      // Calculer les statistiques
      const totalStock = response.data.products.reduce((sum, product) => sum + product.stock, 0);
      const lowStockCount = response.data.products.filter(product => product.stock <= 5).length;
      const totalSales = response.data.products.reduce((sum, product) => sum + product.salesCount, 0);
      
      setStats({
        totalProducts: response.data.products.length,
        totalStock,
        lowStockCount,
        totalSales
      });
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      toast.error('Erreur lors du chargement des produits');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
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

  // Filtrer les produits
  useEffect(() => {
    let filtered = products;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par catégorie
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Filtre par stock
    if (stockFilter === 'in-stock') {
      filtered = filtered.filter(product => product.stock > 0);
    } else if (stockFilter === 'low-stock') {
      filtered = filtered.filter(product => product.stock <= 5 && product.stock > 0);
    } else if (stockFilter === 'out-of-stock') {
      filtered = filtered.filter(product => product.stock === 0);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter, stockFilter]);

  // Enregistrer une vente
  const handleSell = async (productId) => {
    try {
      const response = await axios.post(`/api/products/${productId}/sell`);
      toast.success('Vente enregistrée avec succès!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'enregistrement de la vente';
      toast.error(errorMessage);
    }
  };

  // Gestion de la déconnexion
  const handleLogout = async () => {
    await logout();
  };

  // Obtenir les catégories uniques
  const categories = [...new Set(products.map(product => product.category))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-beer-gold mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-sm border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-beer-gold rounded-xl">
                <Beer className="w-8 h-8 text-beer-dark" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Beer Exchange</h1>
                <p className="text-white/80">Interface Serveur</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right text-white">
                <p className="font-semibold">Bonjour, {user?.username}</p>
                <p className="text-sm text-white/70">Serveur</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistiques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <Package className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">{stats.totalProducts}</p>
            <p className="text-white/70">Produits</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">{stats.totalSales}</p>
            <p className="text-white/70">Ventes totales</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <DollarSign className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">{stats.totalStock}</p>
            <p className="text-white/70">Stock total</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <Clock className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">{stats.lowStockCount}</p>
            <p className="text-white/70">Stock faible</p>
          </div>
        </motion.div>

        {/* Filtres et recherche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Filtre par catégorie */}
            <div className="lg:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'beer' ? 'Bières' : 
                     category === 'cocktail' ? 'Cocktails' :
                     category === 'soft' ? 'Boissons' :
                     category === 'snack' ? 'Snacks' : 'Autres'}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par stock */}
            <div className="lg:w-48">
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">Tous les stocks</option>
                <option value="in-stock">En stock</option>
                <option value="low-stock">Stock faible</option>
                <option value="out-of-stock">Rupture</option>
              </select>
            </div>

            {/* Bouton de rafraîchissement */}
            <button
              onClick={fetchProducts}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </motion.div>

        {/* Liste des produits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <p className="text-white/70 text-lg">Aucun produit trouvé</p>
              <p className="text-white/50">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard
                      product={product}
                      showSellButton={true}
                      onSell={handleSell}
                      showChart={true}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ServerDashboard;
