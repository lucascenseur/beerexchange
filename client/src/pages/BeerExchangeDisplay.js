import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Clock, Beer } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';

const BeerExchangeDisplay = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [priceChanges, setPriceChanges] = useState({});
  const [priceHistory, setPriceHistory] = useState({});
  const [salesLogs, setSalesLogs] = useState([]);
  const [processedSales, setProcessedSales] = useState(new Set());
  const [productSaleAnimations, setProductSaleAnimations] = useState([]);
  const [dailyStats, setDailyStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    topProducts: []
  });

  const { onProductUpdate, onProductCreated, onProductDeleted } = useSocket();

  // Ajouter un log de vente
  const addSalesLog = (productName, quantity, price) => {
    // Exclure l'écocup des logs de vente
    if (productName.toLowerCase().includes('écocup') || productName.toLowerCase().includes('ecocup')) {
      return;
    }

    const now = Date.now();
    const log = {
      id: `${productName}-${quantity}-${now}`, // ID unique basé sur le contenu
      productName,
      quantity,
      price: parseFloat(price || 0),
      timestamp: new Date(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    
    setSalesLogs(prev => {
      // Vérifier si un log similaire existe déjà dans les 5 dernières secondes
      const recentLogs = prev.filter(existingLog => {
        const timeDiff = now - existingLog.timestamp.getTime();
        return existingLog.productName === productName && 
               existingLog.quantity === quantity && 
               Math.abs(existingLog.price - parseFloat(price || 0)) < 0.01 && // Même prix (tolérance 1 centime)
               timeDiff < 5000; // 5 secondes
      });
      
      // Si aucun log similaire récent, ajouter le nouveau
      if (recentLogs.length === 0) {
        const newLogs = [log, ...prev].slice(0, 10); // Garder seulement les 10 derniers logs
        return newLogs;
      }
      
      return prev; // Ne pas ajouter de doublon
    });
  };

  // Ajouter une animation de vente sur un produit spécifique
  const addProductSaleAnimation = (productId, productName, quantity, price) => {
    // Exclure l'écocup des animations de vente
    if (productName.toLowerCase().includes('écocup') || productName.toLowerCase().includes('ecocup')) {
      return;
    }

    const animationId = `${productId}-${Date.now()}`;
    const now = Date.now();
    
    setProductSaleAnimations(prev => {
      // Vérifier si une animation similaire existe déjà pour ce produit dans les 2 dernières secondes
      const recentAnimations = prev.filter(anim => 
        anim.productId === productId && 
        (now - anim.timestamp) < 2000 // 2 secondes
      );
      
      // Si aucune animation récente, ajouter la nouvelle
      if (recentAnimations.length === 0) {
        const newAnimation = {
          id: animationId,
          productId,
          productName,
          quantity,
          price: parseFloat(price || 0),
          timestamp: now,
          visible: true
        };
        
        // Ajouter à la fin de la liste et garder seulement les 5 dernières
        const newAnimations = [...prev, newAnimation].slice(-5);
        
        // Supprimer cette animation après 3 secondes
        setTimeout(() => {
          setProductSaleAnimations(current => 
            current.filter(anim => anim.id !== animationId)
          );
        }, 3000);
        
        return newAnimations;
      }
      
      return prev; // Ne pas ajouter de doublon
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

  // Récupérer les statistiques quotidiennes réelles depuis l'API
  const fetchDailyStats = async () => {
    try {
      console.log('🔍 Récupération des statistiques quotidiennes depuis l\'API...');
      const response = await axios.get('/api/products/stats/daily');
      console.log('📡 Réponse API stats:', response.data);
      
      if (response.data.success) {
        setDailyStats(response.data.stats);
        console.log('✅ Statistiques quotidiennes mises à jour (API):', response.data.stats);
      } else {
        console.warn('⚠️ API stats retourne success: false');
        calculateDailyStats(products);
      }
    } catch (error) {
      console.error('❌ Erreur récupération statistiques quotidiennes:', error);
      console.log('🔄 Utilisation du fallback local...');
      // Fallback sur le calcul local si l'API échoue
      calculateDailyStats(products);
    }
  };

  // Calculer les statistiques quotidiennes (fallback)
  const calculateDailyStats = (products) => {
    console.log('⚠️ ATTENTION: Utilisation du calcul local (fallback) - CA peut être incorrect!');
    console.log('📊 Produits pour calcul local:', products.length);
    
    // Exclure l'écocup des statistiques
    const productsWithoutEcocup = products.filter(product => 
      !product.name.toLowerCase().includes('écocup') && 
      !product.name.toLowerCase().includes('ecocup')
    );

    const totalSales = productsWithoutEcocup.reduce((sum, product) => sum + (product.salesCount || 0), 0);
    const totalRevenue = productsWithoutEcocup.reduce((sum, product) => {
      const sales = product.salesCount || 0;
      const price = parseFloat(product.currentPrice || 0);
      console.log(`💰 ${product.name}: ${sales} ventes × ${price}€ = ${sales * price}€`);
      return sum + (sales * price);
    }, 0);

    // Top 3 des produits les plus vendus (sans écocup)
    const topProducts = productsWithoutEcocup
      .filter(product => (product.salesCount || 0) > 0)
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 3)
      .map(product => ({
        name: product.name,
        sales: product.salesCount || 0,
        revenue: (product.salesCount || 0) * parseFloat(product.currentPrice || 0)
      }));

    const result = { totalSales, totalRevenue, topProducts };
    console.log('📊 Résultat calcul local:', result);
    setDailyStats(result);
    return result;
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
      
      // Calculer les statistiques quotidiennes
      const stats = calculateDailyStats(productsWithChanges);
      setDailyStats(stats);
      
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
      
      setProducts(prev => {
        const updatedProducts = prev.map(product => {
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
              // Créer un identifiant unique pour cette vente basé sur le timestamp
              const now = Date.now();
              const saleId = `${product.id}-${newSales}-${now}`;
              
              // Vérifier si cette vente a déjà été traitée récemment (dans les 3 dernières secondes)
              const recentSales = Array.from(processedSales).filter(id => {
                const parts = id.split('-');
                const productId = parts[0];
                const salesCount = parseInt(parts[1]);
                const timestamp = parseInt(parts[2]);
                return productId === product.id.toString() && 
                       salesCount === newSales && 
                       (now - timestamp) < 3000; // 3 secondes
              });
              
              if (recentSales.length === 0) {
                // Ajouter un log de vente
                addSalesLog(product.name, salesIncrease, newPrice);
                // Ajouter une animation sur le produit
                addProductSaleAnimation(product.id, product.name, salesIncrease, newPrice);
                console.log(`🛒 Vente détectée: ${salesIncrease}x ${product.name} à ${newPrice}€`);
                
                // Marquer cette vente comme traitée
                setProcessedSales(prev => {
                  const newSet = new Set(prev);
                  newSet.add(saleId);
                  // Garder seulement les 50 dernières ventes pour éviter une accumulation
                  if (newSet.size > 50) {
                    const array = Array.from(newSet);
                    return new Set(array.slice(-50));
                  }
                  return newSet;
                });
              }
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
        });

        // Recalculer les statistiques après mise à jour
        const stats = calculateDailyStats(updatedProducts);
        setDailyStats(stats);

        return updatedProducts;
      });
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
      <div className="px-8 py-4 border-b border-slate-700">
        {/* Ligne principale */}
        <div className="flex items-center justify-between mb-3">
          {/* 3iS VERTIGO */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-white text-lg font-bold">3iS VERTIGO</span>
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

        {/* Statistiques en temps réel */}
        <div className="flex items-center justify-center space-x-8">
          {/* Total des ventes */}
          <div className="flex items-center space-x-2 bg-green-500/20 border border-green-500/40 rounded-lg px-4 py-2">
            <span className="text-green-400 text-sm font-medium">📊 Ventes:</span>
            <span className="text-green-300 text-lg font-bold">{dailyStats.totalSales}</span>
          </div>

          {/* Chiffre d'affaires */}
          <div className="flex items-center space-x-2 bg-blue-500/20 border border-blue-500/40 rounded-lg px-4 py-2">
            <span className="text-blue-400 text-sm font-medium">💰 CA:</span>
            <span className="text-blue-300 text-lg font-bold">{dailyStats.totalRevenue.toFixed(2)}€</span>
          </div>

          {/* Top 3 produits */}
          {dailyStats.topProducts.length > 0 && (
            <div className="flex items-center space-x-2 bg-orange-500/20 border border-orange-500/40 rounded-lg px-4 py-2">
              <span className="text-orange-400 text-sm font-medium">🏆 Top:</span>
              <div className="flex items-center space-x-2">
                {dailyStats.topProducts.slice(0, 3).map((product, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    <span className="text-orange-300 text-xs">
                      {index + 1}. {product.name.split(' ')[0]}
                    </span>
                    <span className="text-orange-200 text-xs">({product.sales})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-full pb-16">
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
                  
                  {/* Animation de vente */}
                  {productSaleAnimations
                    .filter(anim => anim.productId === product.id)
                    .map(animation => (
                      <motion.div
                        key={animation.id}
                        initial={{ scale: 0.8, opacity: 0, x: -20 }}
                        animate={{ scale: 1, opacity: 1, x: 0 }}
                        exit={{ scale: 0.8, opacity: 0, x: 20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="bg-green-500/20 border border-green-500/40 rounded-lg px-3 py-2 mr-3"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-green-400 text-sm font-bold">
                            +{animation.quantity}
                          </span>
                          <span className="text-green-300 text-xs">
                            {animation.price.toFixed(2)}€
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  
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
                  
                  {/* Animation de vente */}
                  {productSaleAnimations
                    .filter(anim => anim.productId === product.id)
                    .map(animation => (
                      <motion.div
                        key={animation.id}
                        initial={{ scale: 0.8, opacity: 0, x: -20 }}
                        animate={{ scale: 1, opacity: 1, x: 0 }}
                        exit={{ scale: 0.8, opacity: 0, x: 20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="bg-green-500/20 border border-green-500/40 rounded-lg px-3 py-2 mr-3"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-green-400 text-sm font-bold">
                            +{animation.quantity}
                          </span>
                          <span className="text-green-300 text-xs">
                            {animation.price.toFixed(2)}€
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  
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
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-slate-700 p-2 z-40 max-h-16 overflow-hidden">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-green-400 font-mono text-sm whitespace-nowrap">
            <Beer className="w-4 h-4" />
            <span>VENTES EN TEMPS RÉEL:</span>
          </div>
          
          <div className="flex space-x-3">
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
        </div>
      </div>

    </div>
  );
};

export default BeerExchangeDisplay;
