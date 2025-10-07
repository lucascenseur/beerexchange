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
  const [priceHistory, setPriceHistory] = useState({});
  const [salesLogs, setSalesLogs] = useState([]);

  const { onProductUpdate, onProductCreated, onProductDeleted } = useSocket();

  // Ajouter un log de vente
  const addSalesLog = (productName, quantity, price) => {
    const log = {
      id: Date.now(),
      productName,
      quantity,
      price: parseFloat(price || 0),
      timestamp: new Date(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    
    setSalesLogs(prev => {
      const newLogs = [log, ...prev].slice(0, 20); // Garder seulement les 20 derniers logs
      return newLogs;
    });
  };

  // Récupérer l'historique réel des prix depuis l'API
  const fetchPriceHistory = async (productId) => {
    try {
      const response = await axios.get(`/api/products/${productId}/price-history`);
      return response.data.priceHistory || [];
    } catch (error) {
      console.error('Erreur récupération historique prix:', error);
      return [];
    }
  };

  // Générer un historique de prix basé sur les vraies données (1 heure)
  const generatePriceHistory = (currentPrice, basePrice, salesCount = 0) => {
    const history = [];
    const points = 12; // 12 points d'historique sur 1 heure
    const intervalMinutes = 5; // 5 minutes entre chaque point
    
    // Commencer avec le prix de base et évoluer vers le prix actuel
    for (let i = points; i >= 0; i--) {
      const timeFactor = i / points; // 0 = maintenant, 1 = il y a 1h
      
      // Évolution basée sur les ventes réelles
      const salesImpact = (salesCount / 20) * (1 - timeFactor); // Plus d'impact récent
      const baseVariation = (Math.random() - 0.5) * 0.05; // Petite variation aléatoire
      
      // Prix qui évolue du prix de base vers le prix actuel
      const price = basePrice + (currentPrice - basePrice) * (1 - timeFactor) + (basePrice * salesImpact) + (basePrice * baseVariation);
      
      history.push({
        price: Math.max(0.1, price), // Prix minimum de 0.1€
        time: new Date(Date.now() - i * intervalMinutes * 60000) // 5 minutes entre chaque point
      });
    }
    
    return history;
  };

  // Créer un mini-graphique SVG pour l'historique des prix
  const createMiniChart = (history, currentPrice, basePrice) => {
    if (!history || history.length === 0) return null;
    
    const width = 60;
    const height = 20;
    const padding = 2;
    
    const prices = history.map(h => h.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 0.01; // Éviter la division par 0
    
    const points = history.map((h, index) => {
      const x = padding + (index / (history.length - 1)) * (width - 2 * padding);
      const y = padding + ((maxPrice - h.price) / priceRange) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');
    
    // Couleur basée sur la différence avec le prix de base
    const priceDiff = currentPrice - basePrice;
    const color = priceDiff > 0 ? '#10B981' : priceDiff < 0 ? '#EF4444' : '#6B7280';
    
    return (
      <svg width={width} height={height} className="opacity-80">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Point final pour marquer le prix actuel */}
        <circle
          cx={padding + (width - 2 * padding)}
          cy={padding + ((maxPrice - currentPrice) / priceRange) * (height - 2 * padding)}
          r="1.5"
          fill={color}
        />
      </svg>
    );
  };

  // Mise à jour de l'heure
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // L'historique se met à jour seulement quand les prix changent via Socket.io

  // Fonction pour obtenir l'icône de tendance basée sur le prix de base
  const getTrendIcon = (currentPrice, basePrice) => {
    const priceDiff = currentPrice - basePrice;
    if (priceDiff > 0) {
      return <TrendingUp className="w-5 h-5 text-green-500" />;
    } else if (priceDiff < 0) {
      return <TrendingDown className="w-5 h-5 text-red-500" />;
    } else {
      return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  // Fonction pour obtenir la couleur basée sur le prix de base
  const getPriceColor = (currentPrice, basePrice) => {
    const priceDiff = currentPrice - basePrice;
    if (priceDiff > 0) {
      return 'text-green-400';
    } else if (priceDiff < 0) {
      return 'text-red-400';
    } else {
      return 'text-white';
    }
  };

  // Nettoyer les anciens logs automatiquement
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setSalesLogs(prev => {
        const now = Date.now();
        return prev.filter(log => now - log.timestamp < 30000); // Garder les logs de moins de 30 secondes
      });
    }, 5000); // Vérifier toutes les 5 secondes

    return () => clearInterval(cleanupInterval);
  }, []);

  // Récupérer les produits
  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      const productsWithChanges = response.data.products
        .filter(product => product && product.id && product.name && product.currentPrice !== null && product.currentPrice !== undefined)
        .map(product => ({
          ...product,
          currentPrice: parseFloat(product.currentPrice || 0),
          previousPrice: parseFloat(product.currentPrice || 0),
          basePrice: parseFloat(product.basePrice || product.currentPrice || 0),
          priceChange: 0
        }));
      
      setProducts(productsWithChanges);
      
      // Générer l'historique des prix pour chaque produit basé sur les vraies ventes
      const historyData = {};
      productsWithChanges.forEach(product => {
        historyData[product.id] = generatePriceHistory(
          product.currentPrice, 
          product.basePrice || product.currentPrice,
          product.salesCount || 0
        );
      });
      setPriceHistory(historyData);
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
          const currentPrice = parseFloat(product.currentPrice || 0);
          const newPrice = parseFloat(updatedProduct.currentPrice || 0);
          const basePrice = parseFloat(product.basePrice || newPrice);
          const priceChange = newPrice - currentPrice;
          
          // Détecter une vente (augmentation du salesCount)
          const currentSales = product.salesCount || 0;
          const newSales = updatedProduct.salesCount || 0;
          const salesIncrease = newSales - currentSales;
          
          if (salesIncrease > 0) {
            // Ajouter un log de vente
            addSalesLog(product.name, salesIncrease, newPrice);
            console.log(`🛒 Vente détectée: ${salesIncrease}x ${product.name} à ${newPrice}€`);
          }
          
          // Animation de changement de prix
          setPriceChanges(prev => ({
            ...prev,
            [product.id]: { change: priceChange, timestamp: Date.now() }
          }));

          // Mettre à jour l'historique des prix
          setPriceHistory(prev => ({
            ...prev,
            [product.id]: generatePriceHistory(newPrice, product.basePrice || newPrice, updatedProduct.salesCount || 0)
          }));

          return {
            ...updatedProduct,
            currentPrice: newPrice,
            previousPrice: currentPrice,
            basePrice: basePrice,
            priceChange
          };
        }
        return product;
      }));
    });

    const unsubscribeCreate = onProductCreated((newProduct) => {
      setProducts(prev => [...prev, {
        ...newProduct,
        currentPrice: parseFloat(newProduct.currentPrice || 0),
        previousPrice: parseFloat(newProduct.currentPrice || 0),
        basePrice: parseFloat(newProduct.basePrice || newProduct.currentPrice || 0),
        priceChange: 0
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
                className={`px-6 py-4 border-b border-slate-700 ${getRowBgColor(index)}`}
              >
                {/* Ligne principale */}
                <div className="flex items-center justify-between mb-2">
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
                      className={`text-2xl font-bold ${getPriceColor(product.currentPrice, product.basePrice)}`}
                    >
                      ${parseFloat(product.currentPrice || 0).toFixed(2)}
                    </motion.div>
                    
                    <motion.div
                      key={`${product.id}-${product.trend}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={getPriceColor(product.currentPrice, product.basePrice)}
                    >
                      {getTrendIcon(product.currentPrice, product.basePrice)}
                    </motion.div>
                  </div>
                </div>
                
                {/* Historique des prix */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 text-xs">Base:</span>
                    <span className={`text-xs font-medium ${getPriceColor(product.currentPrice, product.basePrice)}`}>
                      {(() => {
                        const currentPrice = product.currentPrice || 0;
                        const basePrice = product.basePrice || currentPrice;
                        const change = currentPrice - basePrice;
                        const sign = change > 0 ? '+' : change < 0 ? '-' : '';
                        
                        return `${sign}${Math.abs(change).toFixed(2)}€`;
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 text-xs">Graph:</span>
                    {createMiniChart(priceHistory[product.id], product.currentPrice, product.basePrice)}
                  </div>
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
                className={`px-6 py-4 border-b border-slate-700 ${getRowBgColor(index)}`}
              >
                {/* Ligne principale */}
                <div className="flex items-center justify-between mb-2">
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
                      className={`text-2xl font-bold ${getPriceColor(product.currentPrice, product.basePrice)}`}
                    >
                      ${parseFloat(product.currentPrice || 0).toFixed(2)}
                    </motion.div>
                    
                    <motion.div
                      key={`${product.id}-${product.trend}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={getPriceColor(product.currentPrice, product.basePrice)}
                    >
                      {getTrendIcon(product.currentPrice, product.basePrice)}
                    </motion.div>
                  </div>
                </div>
                
                {/* Historique des prix */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 text-xs">Base:</span>
                    <span className={`text-xs font-medium ${getPriceColor(product.currentPrice, product.basePrice)}`}>
                      {(() => {
                        const currentPrice = product.currentPrice || 0;
                        const basePrice = product.basePrice || currentPrice;
                        const change = currentPrice - basePrice;
                        const sign = change > 0 ? '+' : change < 0 ? '-' : '';
                        
                        return `${sign}${Math.abs(change).toFixed(2)}€`;
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 text-xs">Graph:</span>
                    {createMiniChart(priceHistory[product.id], product.currentPrice, product.basePrice)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Barre de logs des ventes */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-slate-700 p-2 z-40">
        <div className="flex items-center space-x-4 overflow-x-auto">
          <div className="flex items-center space-x-2 text-green-400 font-mono text-sm whitespace-nowrap">
            <Beer className="w-4 h-4" />
            <span>VENTES EN TEMPS RÉEL:</span>
          </div>
          
          <div className="flex space-x-3 overflow-x-auto">
            <AnimatePresence>
              {salesLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 rounded px-3 py-1 whitespace-nowrap"
                >
                  <span className="text-green-400 font-mono text-xs">{log.time}</span>
                  <span className="text-white text-sm">
                    {log.quantity}x {log.productName}
                  </span>
                  <span className="text-green-300 font-bold text-sm">
                    {log.price.toFixed(2)}€
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {salesLogs.length === 0 && (
            <div className="text-slate-500 text-sm font-mono">
              En attente des ventes...
            </div>
          )}
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
