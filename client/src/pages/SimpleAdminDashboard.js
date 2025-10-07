import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Beer, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Clock,
  Filter,
  Search,
  RefreshCw,
  ArrowLeft,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SimpleAdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    totalSales: 0,
    totalRevenue: 0
  });

  const { onProductUpdate, onProductCreated, onProductDeleted } = useSocket();
  const navigate = useNavigate();

  // Fonction pour mettre à jour le prix d'un produit
  const handlePriceUpdate = async (productId, newPrice) => {
    try {
      console.log(`🔄 Mise à jour prix produit ${productId} vers ${newPrice}€`);
      
      const response = await axios.put(`/api/products/${productId}`, {
        currentPrice: newPrice
      });
      
      console.log('📡 Réponse API:', response.data);
      
      if (response.data.success) {
        toast.success('Prix mis à jour !');
        // Mettre à jour l'état local
        setProducts(prev => prev.map(product => 
          product.id === productId 
            ? { ...product, currentPrice: newPrice }
            : product
        ));
        setFilteredProducts(prev => prev.map(product => 
          product.id === productId 
            ? { ...product, currentPrice: newPrice }
            : product
        ));
        console.log('✅ État local mis à jour');
      } else {
        toast.error('Erreur: ' + response.data.message);
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour prix:', error);
      toast.error('Erreur lors de la mise à jour du prix: ' + error.message);
    }
  };

  // Fonction pour mettre à jour le stock d'un produit
  const handleStockUpdate = async (productId, newStock) => {
    try {
      const response = await axios.put(`/api/products/${productId}`, {
        stock: newStock
      });
      
      if (response.data.success) {
        toast.success('Stock mis à jour !');
        // Mettre à jour l'état local
        setProducts(prev => prev.map(product => 
          product.id === productId 
            ? { ...product, stock: newStock }
            : product
        ));
        setFilteredProducts(prev => prev.map(product => 
          product.id === productId 
            ? { ...product, stock: newStock }
            : product
        ));
      }
    } catch (error) {
      console.error('Erreur mise à jour stock:', error);
      toast.error('Erreur lors de la mise à jour du stock');
    }
  };

  // Fonction pour rafraîchir les produits
  const refreshProducts = async () => {
    setLoading(true);
    await fetchProducts();
    setLoading(false);
  };

  // Récupérer les produits
  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data.products);
      setFilteredProducts(response.data.products);
      
      // Calculer les statistiques
      const totalProducts = response.data.products.length;
      const totalStock = response.data.products.reduce((sum, product) => sum + (product.stock || 0), 0);
      const lowStockCount = response.data.products.filter(product => (product.stock || 0) < 10).length;
      const totalSales = response.data.products.reduce((sum, product) => sum + (product.salesCount || 0), 0);
      const totalRevenue = response.data.products.reduce((sum, product) => 
        sum + ((product.salesCount || 0) * (product.currentPrice || 0)), 0);
      
      setStats({ totalProducts, totalStock, lowStockCount, totalSales, totalRevenue });
    } catch (error) {
      console.error('Erreur récupération produits:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

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

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter]);

  // Écouter les mises à jour en temps réel
  useEffect(() => {
    const unsubscribeUpdate = onProductUpdate((updatedProduct) => {
      setProducts(prev => prev.map(product => 
        product.id === updatedProduct.id ? updatedProduct : product
      ));
    });

    const unsubscribeCreate = onProductCreated((newProduct) => {
      setProducts(prev => [...prev, newProduct]);
    });

    const unsubscribeDelete = onProductDeleted((deletedProductId) => {
      setProducts(prev => prev.filter(product => product.id !== deletedProductId));
    });

    return () => {
      unsubscribeUpdate();
      unsubscribeCreate();
      unsubscribeDelete();
    };
  }, [onProductUpdate, onProductCreated, onProductDeleted]);

  // Charger les produits au montage
  useEffect(() => {
    fetchProducts();
  }, []);

  // Mettre à jour le prix d'un produit
  const handlePriceUpdate = async (productId, newPrice) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      // Mettre à jour localement
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, currentPrice: newPrice } : p
      ));

      toast.success(`Prix de ${product.name} mis à jour !`);
    } catch (error) {
      console.error('Erreur mise à jour prix:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Mettre à jour le stock d'un produit
  const handleStockUpdate = async (productId, newStock) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      // Mettre à jour localement
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, stock: newStock } : p
      ));

      toast.success(`Stock de ${product.name} mis à jour !`);
    } catch (error) {
      console.error('Erreur mise à jour stock:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Obtenir les catégories uniques
  const categories = [...new Set(products.map(product => product.category))];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-beer-gold mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Beer Exchange</h2>
          <p className="text-lg text-white/80">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Interface Admin</h1>
            <p className="text-white/70">Gestion complète</p>
          </div>
        </div>
        
        <button
          onClick={fetchProducts}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <RefreshCw className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <Package className="w-6 h-6 text-beer-gold mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{stats.totalProducts}</p>
          <p className="text-white/70 text-sm">Produits</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <Beer className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{stats.totalStock}</p>
          <p className="text-white/70 text-sm">Stock total</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{stats.totalSales}</p>
          <p className="text-white/70 text-sm">Ventes</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <DollarSign className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{stats.totalRevenue.toFixed(2)}€</p>
          <p className="text-white/70 text-sm">Chiffre d'affaires</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <Clock className="w-6 h-6 text-orange-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{stats.lowStockCount}</p>
          <p className="text-white/70 text-sm">Stock faible</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex space-x-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-beer-gold"
          />
        </div>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-beer-gold"
        >
          <option value="all">Toutes les catégories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
        
        <button
          onClick={refreshProducts}
          disabled={loading}
          className="px-4 py-2 bg-beer-gold text-purple-900 rounded-lg hover:bg-yellow-400 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {/* Liste des produits */}
      <div className="h-80 overflow-y-auto">
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{product.name}</h3>
                    <p className="text-white/70 text-sm">{product.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-beer-gold font-bold">{product.currentPrice}€</span>
                      <span className={`text-sm ${product.stock < 10 ? 'text-red-400' : 'text-white/70'}`}>
                        Stock: {product.stock}
                      </span>
                      <span className="text-white/70 text-sm">
                        Ventes: {product.salesCount || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      value={product.currentPrice}
                      onChange={(e) => handlePriceUpdate(product.id, parseFloat(e.target.value))}
                      className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                    <input
                      type="number"
                      value={product.stock}
                      onChange={(e) => handleStockUpdate(product.id, parseInt(e.target.value))}
                      className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SimpleAdminDashboard;
