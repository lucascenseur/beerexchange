import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Beer, Wine, Coffee, Utensils, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';

const PublicDisplayCompact = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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
      
      // Calculer les statistiques
      const totalProducts = response.data.products.length;
      const totalSales = response.data.products.reduce((sum, product) => sum + (product.salesCount || 0), 0);
      const averagePrice = totalProducts > 0 
        ? (response.data.products.reduce((sum, product) => sum + product.currentPrice, 0) / totalProducts).toFixed(2)
        : 0;
      
      setStats({ totalProducts, totalSales, averagePrice });
      setLoading(false);
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
    <div className="h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-3 overflow-hidden">
      {/* Header compact */}
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-3"
      >
        <h1 className="text-2xl font-black text-beer-gold mb-1 animate-pulse-glow">
          🍺 BEER EXCHANGE 🍺
        </h1>
        <p className="text-sm text-white/90 font-semibold">
          Marché en temps réel des boissons
        </p>
        
        {/* Statistiques compactes */}
        <div className="flex justify-center gap-3 mt-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-beer-gold">{stats.totalProducts}</p>
            <p className="text-white/80 text-xs">Produits</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-green-400">{stats.totalSales}</p>
            <p className="text-white/80 text-xs">Ventes</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-blue-400">{stats.averagePrice}€</p>
            <p className="text-white/80 text-xs">Prix moyen</p>
          </div>
        </div>
      </motion.div>

      {/* Produits par catégorie - Layout compact */}
      <div className="h-[calc(100vh-120px)] overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full">
          {Object.entries(productsByCategory).map(([category, categoryProducts]) => {
            const IconComponent = categoryIcons[category] || Beer;
            const colorClass = categoryColors[category] || 'from-purple-500 to-violet-600';
            
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 h-full overflow-y-auto"
              >
                {/* En-tête de catégorie compact */}
                <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white/5 backdrop-blur-sm rounded-lg p-2">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-r ${colorClass}`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white capitalize">
                      {category === 'beer' ? 'Bières' : 
                       category === 'cocktail' ? 'Cocktails' :
                       category === 'soft' ? 'Boissons' :
                       category === 'snack' ? 'Snacks' : category}
                    </h2>
                    <p className="text-white/70 text-xs">{categoryProducts.length} produit{categoryProducts.length > 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Grille de produits compacte */}
                <div className="grid grid-cols-1 gap-1.5">
                  {categoryProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20 hover:border-beer-gold/50 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-white truncate">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          {product.stock > 10 ? (
                            <span className="text-green-400 text-xs">✓</span>
                          ) : product.stock > 0 ? (
                            <span className="text-yellow-400 text-xs">⚠</span>
                          ) : (
                            <span className="text-red-400 text-xs">✗</span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-white/70 text-xs mb-1 line-clamp-1">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-base font-bold text-beer-gold">
                          {product.currentPrice.toFixed(2)}€
                        </div>
                        <div className="text-white/60 text-xs">
                          Stock: {product.stock}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PublicDisplayCompact;
