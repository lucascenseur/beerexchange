import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Package, DollarSign } from 'lucide-react';
import PriceChart from './PriceChart';

const ProductCard = ({ 
  product, 
  isPublic = false, 
  showChart = true, 
  onSell = null,
  showSellButton = false 
}) => {
  // Calculer la variation de prix
  const getPriceVariation = () => {
    if (!product.priceHistory || product.priceHistory.length < 2) {
      return { percentage: 0, direction: 'stable' };
    }
    
    const currentPrice = product.currentPrice;
    const previousPrice = product.priceHistory[product.priceHistory.length - 2]?.price || product.basePrice;
    const percentage = ((currentPrice - previousPrice) / previousPrice) * 100;
    
    return {
      percentage: Math.round(percentage * 100) / 100,
      direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable'
    };
  };

  const variation = getPriceVariation();

  // Déterminer la couleur selon la variation
  const getVariationColor = () => {
    switch (variation.direction) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Déterminer l'icône selon la variation
  const getVariationIcon = () => {
    switch (variation.direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  // Couleurs pour les catégories
  const getCategoryColor = (category) => {
    const colors = {
      beer: 'bg-amber-100 text-amber-800',
      cocktail: 'bg-pink-100 text-pink-800',
      soft: 'bg-blue-100 text-blue-800',
      snack: 'bg-green-100 text-green-800',
      other: 'bg-purple-100 text-purple-800'
    };
    return colors[category] || colors.other;
  };

  // Formatage du prix
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`product-card p-6 ${isPublic ? 'text-center' : ''}`}
    >
      {/* En-tête avec nom et catégorie */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className={`font-bold text-gray-800 ${isPublic ? 'text-2xl' : 'text-lg'}`}>
            {product.name}
          </h3>
          {product.description && (
            <p className={`text-gray-600 mt-1 ${isPublic ? 'text-lg' : 'text-sm'}`}>
              {product.description}
            </p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(product.category)}`}>
          {product.category}
        </span>
      </div>

      {/* Prix et variation */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-beer-gold" />
            <span className={`font-bold ${isPublic ? 'text-3xl' : 'text-xl'} text-gray-800`}>
              {formatPrice(product.currentPrice)}
            </span>
          </div>
          <div className={`flex items-center gap-1 ${getVariationColor()}`}>
            {getVariationIcon()}
            <span className="font-semibold">
              {variation.percentage > 0 ? '+' : ''}{variation.percentage}%
            </span>
          </div>
        </div>
        
        {!isPublic && (
          <p className="text-sm text-gray-500 mt-1">
            Prix de base: {formatPrice(product.basePrice)}
          </p>
        )}
      </div>

      {/* Stock */}
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">
          Stock: <span className="font-semibold">{product.stock}</span>
        </span>
        {!isPublic && product.initialStock && (
          <span className="text-sm text-gray-500">
            (Initial: {product.initialStock})
          </span>
        )}
      </div>

      {/* Ventes */}
      {!isPublic && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Ventes: <span className="font-semibold">{product.salesCount}</span>
          </p>
        </div>
      )}

      {/* Graphique de prix */}
      {showChart && product.priceHistory && product.priceHistory.length > 1 && (
        <div className="mb-4">
          <PriceChart 
            priceHistory={product.priceHistory}
            currentPrice={product.currentPrice}
            height={isPublic ? 120 : 80}
          />
        </div>
      )}

      {/* Bouton de vente */}
      {showSellButton && onSell && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSell(product.id)}
          disabled={product.stock <= 0}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
            product.stock > 0
              ? 'btn-success hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {product.stock > 0 ? '+1 Vente' : 'Stock épuisé'}
        </motion.button>
      )}

      {/* Indicateur de stock faible */}
      {product.stock <= 5 && product.stock > 0 && (
        <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
          <p className="text-yellow-800 text-sm font-medium">
            ⚠️ Stock faible
          </p>
        </div>
      )}

      {/* Indicateur de stock épuisé */}
      {product.stock === 0 && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-red-800 text-sm font-medium">
            ❌ Stock épuisé
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ProductCard;
