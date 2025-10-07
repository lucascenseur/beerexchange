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
  ShoppingCart,
  Smartphone
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SimpleServerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0
  });

  const { onProductUpdate, onProductCreated, onProductDeleted } = useSocket();
  const navigate = useNavigate();

  // Récupérer les produits
  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data.products);
      setFilteredProducts(response.data.products);
      
      // Calculer les statistiques
      const totalProducts = response.data.products.length;
      const totalSales = response.data.products.reduce((sum, product) => sum + (product.salesCount || 0), 0);
      
      setStats({ totalProducts, totalSales });
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
      console.log('🔄 Interface serveur: Produit mis à jour', updatedProduct);
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

  // Gérer une vente
  const handleSale = async (productId, quantity = 1) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      console.log(`🛒 Vente de ${quantity}x ${product.name} à ${product.currentPrice}€`);

      // Appeler l'API pour enregistrer la vente
      const response = await axios.post(`/api/products/${productId}/sell`, {
        quantity: quantity
      });

      if (response.data.message) {
        console.log('✅ Vente enregistrée:', response.data);
        
        // Mettre à jour l'état local avec les données du serveur
        setProducts(prev => prev.map(p => 
          p.id === productId 
            ? { ...p, salesCount: response.data.product.salesCount }
            : p
        ));
        setFilteredProducts(prev => prev.map(p => 
          p.id === productId 
            ? { ...p, salesCount: response.data.product.salesCount }
            : p
        ));

        toast.success(`${quantity}x ${product.name} vendu(e) !`);
      } else {
        throw new Error('Réponse API invalide');
      }
    } catch (error) {
      console.error('❌ Erreur vente:', error);
      if (error.response?.data?.message) {
        toast.error(`Erreur: ${error.response.data.message}`);
      } else {
        toast.error('Erreur lors de la vente');
      }
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
            <h1 className="text-2xl font-bold text-white">Interface Serveur</h1>
            <p className="text-white/70">Gestion des ventes</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/cashier')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Caisse</span>
          </button>
          <button
            onClick={() => navigate('/mobile')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile</span>
          </button>
          <button
            onClick={fetchProducts}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <Package className="w-6 h-6 text-beer-gold mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{stats.totalProducts}</p>
          <p className="text-white/70 text-sm">Produits</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{stats.totalSales}</p>
          <p className="text-white/70 text-sm">Ventes</p>
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
      </div>

      {/* Liste des produits */}
      <div className="h-96 overflow-y-auto">
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
                      <span className="text-white/70 text-sm">
                        Ventes: {product.salesCount || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSale(product.id, 1)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      Vendre 1
                    </button>
                    <button
                      onClick={() => handleSale(product.id, 2)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      Vendre 2
                    </button>
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

export default SimpleServerDashboard;
