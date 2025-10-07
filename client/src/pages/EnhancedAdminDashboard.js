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
  Trash2,
  CreditCard,
  Download,
  FileText,
  BarChart3,
  Calendar,
  Target,
  TrendingDown,
  Minus,
  Activity
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const EnhancedAdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)),
    end: new Date()
  });
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    averagePrice: 0,
    minPrice: 0,
    maxPrice: 0
  });
  const [detailedStats, setDetailedStats] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const { onProductUpdate, onProductCreated, onProductDeleted } = useSocket();
  const navigate = useNavigate();

  // Fonction pour mettre à jour le prix d'un produit
  const handlePriceUpdate = async (productId, newPrice) => {
    try {
      console.log(`🔄 Mise à jour prix produit ${productId} vers ${newPrice}€`);
      
      const response = await axios.put(`/api/products/${productId}`, {
        currentPrice: newPrice
      });
      
      if (response.data.success) {
        toast.success('Prix mis à jour !');
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
      } else {
        toast.error('Erreur: ' + response.data.message);
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour prix:', error);
      toast.error('Erreur lors de la mise à jour du prix: ' + error.message);
    }
  };

  // Récupérer les produits
  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data.products);
      setFilteredProducts(response.data.products);
      
      // Calculer les statistiques de base
      const totalProducts = response.data.products.length;
      const totalSales = response.data.products.reduce((sum, product) => sum + (product.salesCount || 0), 0);
      const totalRevenue = response.data.products.reduce((sum, product) => 
        sum + ((product.salesCount || 0) * (product.currentPrice || 0)), 0);
      
      const prices = response.data.products.map(p => p.currentPrice).filter(p => p > 0);
      const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      
      setStats({ totalProducts, totalSales, totalRevenue, averagePrice, minPrice, maxPrice });
    } catch (error) {
      console.error('Erreur récupération produits:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les statistiques détaillées
  const fetchDetailedStats = async () => {
    try {
      const response = await axios.get('/api/sales/stats', {
        params: {
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        }
      });
      
      setDetailedStats(response.data.salesByProduct || []);
    } catch (error) {
      console.error('Erreur récupération statistiques détaillées:', error);
      // Fallback sur les données des produits
      const productStats = products.map(product => ({
        productId: product.id,
        productName: product.name,
        totalSales: product.salesCount || 0,
        totalRevenue: (product.salesCount || 0) * (product.currentPrice || 0),
        averagePrice: product.currentPrice || 0
      }));
      setDetailedStats(productStats);
    }
  };

  // Récupérer les données de ventes
  const fetchSalesData = async () => {
    try {
      const response = await axios.get('/api/sales', {
        params: {
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        }
      });
      
      setSalesData(response.data.sales || []);
    } catch (error) {
      console.error('Erreur récupération données ventes:', error);
      // Fallback sur des données simulées
      setSalesData([]);
    }
  };

  // Filtrer les produits
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

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

  // Charger les données au montage
  useEffect(() => {
    fetchProducts();
    fetchDetailedStats();
    fetchSalesData();
  }, [dateRange]);

  // Charger les données détaillées quand les produits sont chargés
  useEffect(() => {
    if (products.length > 0) {
      fetchDetailedStats();
      fetchSalesData();
    }
  }, [products, dateRange]);

  // Fonction d'export PDF
  const exportToPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Rapport Admin - Beer Exchange</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
            .products-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .products-table th, .products-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .products-table th { background-color: #f5f5f5; }
            .date-range { margin-bottom: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Rapport Admin - Beer Exchange</h1>
            <div class="date-range">
              Période: ${dateRange.start.toLocaleDateString('fr-FR')} - ${dateRange.end.toLocaleDateString('fr-FR')}
            </div>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <h3>${stats.totalProducts}</h3>
              <p>Produits</p>
            </div>
            <div class="stat-card">
              <h3>${stats.totalSales}</h3>
              <p>Ventes</p>
            </div>
            <div class="stat-card">
              <h3>${stats.totalRevenue.toFixed(2)}€</h3>
              <p>Chiffre d'affaires</p>
            </div>
          </div>
          
          <h2>Statistiques par produit</h2>
          <table class="products-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Prix actuel</th>
                <th>Ventes</th>
                <th>CA généré</th>
                <th>Prix moyen</th>
                <th>Prix min</th>
                <th>Prix max</th>
              </tr>
            </thead>
            <tbody>
              ${detailedStats.map(product => `
                <tr>
                  <td>${product.productName}</td>
                  <td>${parseFloat(product.averagePrice || 0).toFixed(2)}€</td>
                  <td>${product.totalSales || 0}</td>
                  <td>${parseFloat(product.totalRevenue || 0).toFixed(2)}€</td>
                  <td>${parseFloat(product.averagePrice || 0).toFixed(2)}€</td>
                  <td>${parseFloat(product.averagePrice || 0).toFixed(2)}€</td>
                  <td>${parseFloat(product.averagePrice || 0).toFixed(2)}€</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Obtenir les catégories uniques
  const categories = [...new Set(products.map(product => product.category))];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-beer-gold mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Beer Exchange</h2>
          <p className="text-lg text-white/80">Chargement des données...</p>
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
            <h1 className="text-2xl font-bold text-white">Rapports Admin</h1>
            <p className="text-white/70">Gestion et analyse complète</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={() => navigate('/admin/sumup')}
            className="p-2 bg-beer-gold/20 rounded-lg hover:bg-beer-gold/30 transition-colors"
            title="Gestion SumUp"
          >
            <CreditCard className="w-5 h-5 text-beer-gold" />
          </button>
          <button
            onClick={() => { fetchProducts(); fetchDetailedStats(); fetchSalesData(); }}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'overview' 
              ? 'bg-beer-gold text-purple-900' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Vue d'ensemble
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'products' 
              ? 'bg-beer-gold text-purple-900' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Produits
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'sales' 
              ? 'bg-beer-gold text-purple-900' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Ventes
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'analytics' 
              ? 'bg-beer-gold text-purple-900' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Analytics
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="h-full overflow-y-auto">
        <div id="report-content">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statistiques principales */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <Package className="w-8 h-8 text-beer-gold mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.totalProducts}</p>
                  <p className="text-white/70 text-sm">Produits</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.totalSales}</p>
                  <p className="text-white/70 text-sm">Ventes</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <DollarSign className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.totalRevenue.toFixed(2)}€</p>
                  <p className="text-white/70 text-sm">Chiffre d'affaires</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.averagePrice.toFixed(2)}€</p>
                  <p className="text-white/70 text-sm">Prix moyen</p>
                </div>
              </div>

              {/* Statistiques de prix */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <TrendingDown className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-xl font-bold text-white">{stats.minPrice.toFixed(2)}€</p>
                  <p className="text-white/70 text-sm">Prix minimum</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-xl font-bold text-white">{stats.maxPrice.toFixed(2)}€</p>
                  <p className="text-white/70 text-sm">Prix maximum</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <Activity className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-xl font-bold text-white">{(stats.maxPrice - stats.minPrice).toFixed(2)}€</p>
                  <p className="text-white/70 text-sm">Écart de prix</p>
                </div>
              </div>

              {/* Top produits */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-4">Top 5 des produits les plus vendus</h3>
                <div className="space-y-2">
                  {detailedStats.slice(0, 5).map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-beer-gold font-bold text-lg">#{index + 1}</span>
                        <span className="text-white font-medium">{product.productName}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{product.totalSales} ventes</p>
                        <p className="text-white/70 text-sm">{parseFloat(product.totalRevenue || 0).toFixed(2)}€</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-4">
              {/* Filtres */}
              <div className="flex space-x-4">
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
                            <span className="text-white/70 text-sm">
                              Stock: {product.stock || '∞'}
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
                            placeholder="Prix"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Détail des ventes</h3>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                {salesData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-white">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-2">Produit</th>
                          <th className="text-left py-2">Quantité</th>
                          <th className="text-left py-2">Prix</th>
                          <th className="text-left py-2">Total</th>
                          <th className="text-left py-2">Serveur</th>
                          <th className="text-left py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.slice(0, 20).map((sale, index) => (
                          <tr key={index} className="border-b border-white/10">
                            <td className="py-2">{sale.productName}</td>
                            <td className="py-2">{sale.quantity}</td>
                            <td className="py-2">{parseFloat(sale.price).toFixed(2)}€</td>
                            <td className="py-2">{parseFloat(sale.totalAmount).toFixed(2)}€</td>
                            <td className="py-2">{sale.serverName}</td>
                            <td className="py-2">{new Date(sale.createdAt).toLocaleString('fr-FR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/70">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune vente trouvée pour cette période</p>
                    <p className="text-sm">Les ventes apparaîtront ici une fois enregistrées</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white">Analytics détaillées</h3>
              
              {/* Statistiques par produit */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h4 className="text-md font-semibold text-white mb-4">Statistiques par produit</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-2">Produit</th>
                        <th className="text-left py-2">Ventes</th>
                        <th className="text-left py-2">CA généré</th>
                        <th className="text-left py-2">Prix moyen</th>
                        <th className="text-left py-2">Prix min</th>
                        <th className="text-left py-2">Prix max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedStats.map((product, index) => (
                        <tr key={product.productId} className="border-b border-white/10">
                          <td className="py-2">{product.productName}</td>
                          <td className="py-2">{product.totalSales || 0}</td>
                          <td className="py-2">{parseFloat(product.totalRevenue || 0).toFixed(2)}€</td>
                          <td className="py-2">{parseFloat(product.averagePrice || 0).toFixed(2)}€</td>
                          <td className="py-2">{parseFloat(product.averagePrice || 0).toFixed(2)}€</td>
                          <td className="py-2">{parseFloat(product.averagePrice || 0).toFixed(2)}€</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;
