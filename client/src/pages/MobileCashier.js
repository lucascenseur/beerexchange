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

const MobileCashier = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [serverName, setServerName] = useState('Serveur');

  const { onProductUpdate } = useSocket();

  // Écouter les mises à jour de produits en temps réel
  useEffect(() => {
    const unsubscribe = onProductUpdate((updatedProduct) => {
      console.log('🔄 Interface mobile: Produit mis à jour', updatedProduct);
      if (!updatedProduct || !updatedProduct.id) {
        return;
      }
      
      setProducts(prev => prev.map(product => 
        product.id === updatedProduct.id 
          ? { ...product, ...updatedProduct }
          : product
      ));
    });

    return unsubscribe;
  }, [onProductUpdate]);

  // Charger les produits
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/products');
      console.log('📦 Réponse API produits:', response.data);
      
      // Vérifier la structure de la réponse
      let productsData = response.data;
      
      // Si c'est un objet avec une propriété products, l'utiliser
      if (response.data && typeof response.data === 'object' && response.data.products) {
        productsData = response.data.products;
      }
      // Si c'est déjà un tableau, l'utiliser directement
      else if (Array.isArray(response.data)) {
        productsData = response.data;
      }
      // Sinon, essayer de convertir en tableau
      else {
        productsData = [];
      }
      
      console.log('📦 Données produits (après traitement):', productsData);
      console.log('📦 Type de données:', typeof productsData, 'Array?', Array.isArray(productsData));
      
      if (!Array.isArray(productsData)) {
        console.error('❌ Les données ne sont pas un tableau:', productsData);
        setProducts([]);
        return;
      }
      
      const activeProducts = productsData.filter(product => 
        product && product.isActive
      ).map(product => ({
        ...product,
        currentPrice: parseFloat(product.currentPrice || product.basePrice || 0),
        basePrice: parseFloat(product.basePrice || product.currentPrice || 0)
      }));
      
      console.log('📦 Produits actifs:', activeProducts);
      setProducts(activeProducts);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un produit au panier
  const addToCart = (product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
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
    setShowCart(false);
  };

  // Calculer le total
  const getTotal = () => {
    return cart.reduce((total, item) => total + ((item.currentPrice || 0) * item.quantity), 0);
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
        price: item.currentPrice || 0,
        quantity: item.quantity,
        total_amount: (item.currentPrice || 0) * item.quantity,
        server_id: 1, // ID du serveur par défaut
        server_name: serverName,
        notes: `Vente mobile - ${new Date().toLocaleString()}`
      }));

      // Envoyer toutes les ventes
      for (const sale of sales) {
        await axios.post('/api/products/sales', sale);
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

  console.log('📊 Produits par catégorie:', productsByCategory);
  console.log('📊 Nombre total de produits:', products.length);

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
              <h1 className="text-xl font-bold text-white">CAISSE 3iS VERTIGO</h1>
              <p className="text-green-400 text-sm">Interface mobile</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-white text-sm">Serveur: {serverName}</p>
            <p className="text-slate-400 text-xs">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Produits - Plein écran */}
      <div className="h-full overflow-y-auto pb-24 p-4">
        {/* Debug info */}
        {!loading && products.length === 0 && (
          <div className="text-center py-8 text-red-400">
            <p>❌ Aucun produit trouvé</p>
            <p className="text-sm">Vérifiez la console pour plus de détails</p>
          </div>
        )}
        
        <div className="space-y-6">
          {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
            <div key={category}>
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                {categoryNames[category] || '📦 Autres'}
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {categoryProducts.map((product) => (
                  <motion.button
                    key={product.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCart(product)}
                    className="bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-lg p-4 text-left transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Beer className="w-6 h-6 text-green-400" />
                      <span className="text-green-400 font-bold text-lg">
                        {(product.currentPrice || 0).toFixed(2)}€
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
                      <Plus className="w-5 h-5 text-green-400" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panier flottant en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-slate-700 p-3 z-40">
        <button
          onClick={() => {
            setShowCart(!showCart);
            // Recharger les produits pour avoir les prix à jour
            if (!showCart) {
              fetchProducts();
            }
          }}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 text-sm"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Panier ({getTotalItems()}) - {getTotal().toFixed(2)}€</span>
        </button>
      </div>

      {/* Modal du panier */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-slate-800 rounded-t-lg w-full max-h-[80vh] border-t border-slate-600"
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête du panier */}
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Panier ({getTotalItems()})
                  </h2>
                  <div className="flex items-center space-x-2">
                    {cart.length > 0 && (
                      <button
                        onClick={clearCart}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowCart(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Articles du panier */}
              <div className="max-h-96 overflow-y-auto p-4 space-y-3">
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
                            className="w-8 h-8 bg-red-500 text-white rounded flex items-center justify-center text-sm"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-white font-bold text-sm w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 bg-green-500 text-white rounded flex items-center justify-center text-sm"
                          >
                            <Plus className="w-4 h-4" />
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message de succès */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5" />
              <span className="font-bold">Vente validée !</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileCashier;
