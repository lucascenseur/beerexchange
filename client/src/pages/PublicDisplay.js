import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Beer, Wine, Coffee, Utensils } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import ProductCard from '../components/ProductCard';
import PriceChart from '../components/PriceChart';

const PublicDisplay = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    averagePrice: 0
  });
  const { onProductUpdate, onProductCreated, onProductDeleted } = useSocket();

  // Récupérer les produits
  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products/public');
      setProducts(response.data.products);
      setLoading(false);
      
      // Calculer les statistiques
      const totalSales = response.data.products.reduce((sum, product) => sum + product.salesCount, 0);
      const averagePrice = response.data.products.length > 0 
        ? response.data.products.reduce((sum, product) => sum + product.currentPrice, 0) / response.data.products.length
        : 0;
      
      setStats({
        totalProducts: response.data.products.length,
        totalSales,
        averagePrice: Math.round(averagePrice * 100) / 100
      });
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
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

  // Grouper les produits par catégorie
  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  // Icônes pour les catégories
  const categoryIcons = {
    beer: Beer,
    cocktail: Wine,
    soft: Coffee,
    snack: Utensils,
    other: Beer
  };

  // Couleurs pour les catégories
  const categoryColors = {
    beer: 'from-amber-500 to-orange-600',
    cocktail: 'from-pink-500 to-rose-600',
    soft: 'from-blue-500 to-cyan-600',
    snack: 'from-green-500 to-emerald-600',
    other: 'from-purple-500 to-violet-600'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-beer-gold mx-auto mb-8"></div>
          <h2 className="text-4xl font-bold text-white mb-4">Beer Exchange</h2>
          <p className="text-xl text-white/80">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 overflow-hidden">
      {/* Header compact */}
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <h1 className="text-3xl font-black text-beer-gold mb-2 animate-pulse-glow">
          🍺 BEER EXCHANGE 🍺
        </h1>
        <p className="text-lg text-white/90 font-semibold">
          Marché en temps réel des boissons
        </p>
        
        {/* Statistiques compactes */}
        <div className="flex justify-center gap-4 mt-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-beer-gold">{stats.totalProducts}</p>
            <p className="text-white/80 text-sm">Produits</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-400">{stats.totalSales}</p>
            <p className="text-white/80 text-sm">Ventes</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-blue-400">{stats.averagePrice}€</p>
            <p className="text-white/80 text-sm">Prix moyen</p>
          </div>
        </div>
      </motion.div>

      {/* Produits par catégorie */}
      <div className="space-y-12">
        {Object.entries(productsByCategory).map(([category, categoryProducts]) => {
          const IconComponent = categoryIcons[category] || Beer;
          const gradientClass = categoryColors[category] || 'from-gray-500 to-gray-600';
          
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-8"
            >
              {/* En-tête de catégorie */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`p-4 rounded-xl bg-gradient-to-r ${gradientClass}`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-white capitalize">
                    {category === 'beer' ? 'Bières' : 
                     category === 'cocktail' ? 'Cocktails' :
                     category === 'soft' ? 'Boissons' :
                     category === 'snack' ? 'Snacks' : 'Autres'}
                  </h2>
                  <p className="text-white/70 text-lg">
                    {categoryProducts.length} produit{categoryProducts.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Grille de produits */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                <AnimatePresence>
                  {categoryProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedProduct(product)}
                      className="cursor-pointer"
                    >
                      <ProductCard 
                        product={product} 
                        isPublic={true}
                        showChart={false}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal pour le graphique détaillé */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold text-gray-800">
                  {selectedProduct.name}
                </h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <ProductCard 
                    product={selectedProduct} 
                    isPublic={true}
                    showChart={false}
                  />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-4">Évolution du prix</h4>
                  <PriceChart 
                    priceHistory={selectedProduct.priceHistory}
                    currentPrice={selectedProduct.currentPrice}
                    height={300}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicDisplay;
