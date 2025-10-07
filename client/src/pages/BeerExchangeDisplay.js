import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Clock, Beer } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';

const BeerExchangeDisplay = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tradingPeriod] = useState(1);
  const [priceChanges, setPriceChanges] = useState({});

  const { onProductUpdate, onProductCreated, onProductDeleted } = useSocket();

  // Mise à jour de l'heure
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Récupérer les produits
  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      const productsWithChanges = response.data.products
        .filter(product => product && product.id && product.name && product.currentPrice !== null && product.currentPrice !== undefined)
        .map(product => ({
          ...product,
          currentPrice: product.currentPrice || 0,
          previousPrice: product.currentPrice || 0,
          priceChange: 0,
          trend: 'stable'
        }));
      setProducts(productsWithChanges);
    } catch (error) {
      console.error('Erreur récupération produits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Écouter les mises à jour en temps réel
  useEffect(() => {
    const unsubscribeUpdate = onProductUpdate((updatedProduct) => {
      console.log('🔄 Interface publique: Produit mis à jour', updatedProduct);
      if (!updatedProduct || !updatedProduct.id || updatedProduct.currentPrice === null || updatedProduct.currentPrice === undefined) {
        return;
      }
      
      setProducts(prev => prev.map(product => {
        if (product && product.id === updatedProduct.id) {
          const currentPrice = product.currentPrice || 0;
          const newPrice = updatedProduct.currentPrice || 0;
          const priceChange = newPrice - currentPrice;
          const trend = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'stable';
          
          // Animation de changement de prix
          setPriceChanges(prev => ({
            ...prev,
            [product.id]: { change: priceChange, timestamp: Date.now() }
          }));

          return {
            ...updatedProduct,
            previousPrice: currentPrice,
            priceChange,
            trend
          };
        }
        return product;
      }));
    });

    const unsubscribeCreate = onProductCreated((newProduct) => {
      setProducts(prev => [...prev, {
        ...newProduct,
        previousPrice: newProduct.currentPrice,
        priceChange: 0,
        trend: 'stable'
      }]);
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

  // Grouper les produits en deux colonnes (filtrer les produits valides)
  const validProducts = products.filter(product => 
    product && product.id && product.name && product.currentPrice !== null && product.currentPrice !== undefined
  );
  const leftColumn = validProducts.filter((_, index) => index % 2 === 0);
  const rightColumn = validProducts.filter((_, index) => index % 2 === 1);

  // Fonction pour obtenir l'icône de tendance
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  // Fonction pour obtenir la couleur du prix
  const getPriceColor = (trend) => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  // Fonction pour obtenir la couleur de fond de la ligne
  const getRowBgColor = (index) => {
    return index % 2 === 0 ? 'bg-slate-800/50' : 'bg-slate-900/50';
  };

  // Fonction pour formater l'heure
  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-400 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Beer Exchange</h2>
          <p className="text-lg text-white/80">Chargement du marché...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-700">
        {/* Trading Period */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-white text-lg">Trading Period</span>
            <div className="bg-orange-400 text-slate-900 rounded-full w-8 h-8 flex items-center justify-center font-bold">
              {tradingPeriod}
            </div>
            <Beer className="w-5 h-5 text-green-400" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-black text-white tracking-wider">
            BEER EXCHANGE
          </h1>
        </div>

        {/* Time */}
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-orange-400" />
          <span className="text-orange-400 text-2xl font-mono font-bold">
            {formatTime(currentTime)}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-full">
        {/* Left Column */}
        <div className="flex-1 border-r border-slate-700">
          <div className="h-full overflow-y-auto">
            {leftColumn.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center justify-between px-6 py-4 border-b border-slate-700 ${getRowBgColor(index)}`}
              >
                <div className="flex-1">
                  <h3 className="text-white text-lg font-medium">{product.name}</h3>
                  {product.description && (
                    <p className="text-slate-400 text-sm">{product.description}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <motion.div
                    key={product.currentPrice}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`text-2xl font-bold ${getPriceColor(product.trend)}`}
                  >
                    ${(product.currentPrice || 0).toFixed(2)}
                  </motion.div>
                  
                  <motion.div
                    key={`${product.id}-${product.trend}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={getPriceColor(product.trend)}
                  >
                    {getTrendIcon(product.trend)}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1">
          <div className="h-full overflow-y-auto">
            {rightColumn.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center justify-between px-6 py-4 border-b border-slate-700 ${getRowBgColor(index)}`}
              >
                <div className="flex-1">
                  <h3 className="text-white text-lg font-medium">{product.name}</h3>
                  {product.description && (
                    <p className="text-slate-400 text-sm">{product.description}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <motion.div
                    key={product.currentPrice}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`text-2xl font-bold ${getPriceColor(product.trend)}`}
                  >
                    ${(product.currentPrice || 0).toFixed(2)}
                  </motion.div>
                  
                  <motion.div
                    key={`${product.id}-${product.trend}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={getPriceColor(product.trend)}
                  >
                    {getTrendIcon(product.trend)}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Price Change Animations */}
      <AnimatePresence>
        {Object.entries(priceChanges).map(([productId, change]) => (
          <motion.div
            key={`${productId}-${change.timestamp}`}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -50, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="fixed pointer-events-none z-50"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className={`text-3xl font-bold ${change.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change.change > 0 ? '+' : ''}{change.change.toFixed(2)}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default BeerExchangeDisplay;
