import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  X, 
  Beer,
  CreditCard,
  Calculator,
  Receipt
} from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';

const CashierInterface = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [serverName, setServerName] = useState('Serveur');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const { onProductUpdate } = useSocket();

  // Charger les produits
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/products');
      const activeProducts = response.data.products.filter(product => 
        product.is_active && product.currentPrice > 0
      );
      setProducts(activeProducts);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le modal de sélection de produit
  const openProductModal = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  // Ajouter un produit au panier avec quantité spécifique
  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { ...product, quantity }];
      }
    });
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  // Modifier la quantité d'un produit
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Supprimer un produit du panier
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // Vider le panier
  const clearCart = () => {
    setCart([]);
  };

  // Calculer le total
  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.currentPrice * item.quantity), 0);
  };

  // Calculer le nombre total d'articles
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Valider la vente
  const processSale = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      // Créer les ventes pour chaque produit
      const sales = cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        price: item.currentPrice,
        quantity: item.quantity,
        total_amount: item.currentPrice * item.quantity,
        server_id: 1, // ID du serveur par défaut
        server_name: serverName,
        notes: `Vente caisse - ${new Date().toLocaleString()}`
      }));

      // Envoyer toutes les ventes
      for (const sale of sales) {
        await axios.post('/api/sales', sale);
      }

      // Afficher le succès
      setShowSuccess(true);
      clearCart();
      
      // Masquer le succès après 2 secondes
      setTimeout(() => setShowSuccess(false), 2000);

    } catch (error) {
      console.error('Erreur lors de la vente:', error);
      alert('Erreur lors de la validation de la vente');
    } finally {
      setIsProcessing(false);
    }
  };

  // Grouper les produits par catégorie
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {});

  const categoryNames = {
    beer: '🍺 Bières',
    cocktail: '🍹 Cocktails',
    soft: '🥤 Softs',
    snack: '🍿 Snacks',
    other: '📦 Autres'
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="w-8 h-8 text-green-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">CAISSE 3iS VERTIGO</h1>
              <p className="text-green-400 text-sm">Interface de vente</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-white text-sm">Serveur: {serverName}</p>
            <p className="text-slate-400 text-xs">{new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* Panier - Côté droit */}
        <div className="w-80 bg-slate-800/50 border-l border-slate-700 flex flex-col">
          {/* En-tête du panier */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Panier ({getTotalItems()})
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Articles du panier */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-700/50 rounded-lg p-3 border border-slate-600"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium text-sm">{item.name}</h3>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-white font-bold text-sm w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 bg-green-500 text-white rounded flex items-center justify-center text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-green-400 font-bold">
                        {(item.currentPrice * item.quantity).toFixed(2)}€
                      </p>
                      <p className="text-slate-400 text-xs">
                        {item.currentPrice.toFixed(2)}€ × {item.quantity}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {cart.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Panier vide</p>
                <p className="text-sm">Ajoutez des produits pour commencer</p>
              </div>
            )}
          </div>

          {/* Total et validation */}
          {cart.length > 0 && (
            <div className="border-t border-slate-700 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-lg">Total:</span>
                <span className="text-green-400 font-bold text-2xl">
                  {getTotal().toFixed(2)}€
                </span>
              </div>
              
              <button
                onClick={processSale}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Validation...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>VALIDER LA VENTE</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Produits - Côté gauche */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
              <div key={category}>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  {categoryNames[category] || '📦 Autres'}
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categoryProducts.map((product) => (
                    <motion.button
                      key={product.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openProductModal(product)}
                      className="bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-lg p-3 text-left transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Beer className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-bold text-lg">
                          {product.currentPrice.toFixed(2)}€
                        </span>
                      </div>
                      
                      <h4 className="text-white font-medium text-sm mb-1 line-clamp-2">
                        {product.name}
                      </h4>
                      
                      {product.description && (
                        <p className="text-slate-400 text-xs line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-slate-500 text-xs">
                          Stock: {product.stock || '∞'}
                        </span>
                        <Plus className="w-4 h-4 text-green-400" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Message de succès */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5" />
              <span className="font-bold">Vente validée !</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de sélection de produit */}
      <AnimatePresence>
        {showProductModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowProductModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-600"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Sélectionner la quantité</h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Beer className="w-8 h-8 text-green-400" />
                  <div>
                    <h4 className="text-lg font-bold text-white">{selectedProduct.name}</h4>
                    <p className="text-green-400 font-bold text-xl">
                      {selectedProduct.currentPrice.toFixed(2)}€
                    </p>
                  </div>
                </div>
                
                {selectedProduct.description && (
                  <p className="text-slate-300 text-sm mb-4">{selectedProduct.description}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => addToCart(selectedProduct, 1)}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Ajouter 1</span>
                  </button>
                  
                  <button
                    onClick={() => addToCart(selectedProduct, 2)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Ajouter 2</span>
                  </button>
                </div>

                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => addToCart(selectedProduct, 3)}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold"
                  >
                    +3
                  </button>
                  <button
                    onClick={() => addToCart(selectedProduct, 5)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => addToCart(selectedProduct, 10)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
                  >
                    +10
                  </button>
                </div>

                <div className="border-t border-slate-600 pt-4">
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="w-full py-2 text-slate-400 hover:text-white border border-slate-600 rounded-lg"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CashierInterface;
