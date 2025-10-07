import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Package } from 'lucide-react';

const ProductModal = ({ product, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'beer',
    basePrice: 0,
    stock: 0,
    priceMultiplier: 1.0,
    demandFactor: 1.0,
    isActive: true
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialiser le formulaire avec les données du produit
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || 'beer',
        basePrice: product.basePrice || 0,
        stock: product.stock || 0,
        priceMultiplier: product.priceMultiplier || 1.0,
        demandFactor: product.demandFactor || 1.0,
        isActive: product.isActive !== undefined ? product.isActive : true
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseFloat(value) || 0 : value
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (formData.basePrice <= 0) {
      newErrors.basePrice = 'Le prix de base doit être positif';
    }

    if (formData.stock < 0) {
      newErrors.stock = 'Le stock ne peut pas être négatif';
    }

    if (formData.priceMultiplier < 0.1 || formData.priceMultiplier > 5.0) {
      newErrors.priceMultiplier = 'Le multiplicateur doit être entre 0.1 et 5.0';
    }

    if (formData.demandFactor < 0.1 || formData.demandFactor > 3.0) {
      newErrors.demandFactor = 'Le facteur de demande doit être entre 0.1 et 3.0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { value: 'beer', label: 'Bières' },
    { value: 'cocktail', label: 'Cocktails' },
    { value: 'soft', label: 'Boissons' },
    { value: 'snack', label: 'Snacks' },
    { value: 'other', label: 'Autres' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {product ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Nom du produit *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Ex: Kronenbourg 1664"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="input-field"
                placeholder="Description du produit..."
              />
            </div>

            {/* Catégorie */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Statut
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Produit actif
                </label>
              </div>
            </div>

            {/* Prix de base */}
            <div>
              <label htmlFor="basePrice" className="block text-sm font-semibold text-gray-700 mb-2">
                Prix de base (€) *
              </label>
              <input
                type="number"
                id="basePrice"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`input-field ${errors.basePrice ? 'border-red-500' : ''}`}
                placeholder="3.50"
              />
              {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
            </div>

            {/* Stock */}
            <div>
              <label htmlFor="stock" className="block text-sm font-semibold text-gray-700 mb-2">
                Stock initial
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className={`input-field ${errors.stock ? 'border-red-500' : ''}`}
                placeholder="50"
              />
              {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
            </div>

            {/* Multiplicateur de prix */}
            <div>
              <label htmlFor="priceMultiplier" className="block text-sm font-semibold text-gray-700 mb-2">
                Multiplicateur de prix
              </label>
              <input
                type="number"
                id="priceMultiplier"
                name="priceMultiplier"
                value={formData.priceMultiplier}
                onChange={handleChange}
                step="0.1"
                min="0.1"
                max="5.0"
                className={`input-field ${errors.priceMultiplier ? 'border-red-500' : ''}`}
                placeholder="1.0"
              />
              {errors.priceMultiplier && <p className="text-red-500 text-sm mt-1">{errors.priceMultiplier}</p>}
              <p className="text-xs text-gray-500 mt-1">Facteur global d'augmentation des prix</p>
            </div>

            {/* Facteur de demande */}
            <div>
              <label htmlFor="demandFactor" className="block text-sm font-semibold text-gray-700 mb-2">
                Facteur de demande
              </label>
              <input
                type="number"
                id="demandFactor"
                name="demandFactor"
                value={formData.demandFactor}
                onChange={handleChange}
                step="0.1"
                min="0.1"
                max="3.0"
                className={`input-field ${errors.demandFactor ? 'border-red-500' : ''}`}
                placeholder="1.0"
              />
              {errors.demandFactor && <p className="text-red-500 text-sm mt-1">{errors.demandFactor}</p>}
              <p className="text-xs text-gray-500 mt-1">Sensibilité aux ventes</p>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-beer-dark"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {product ? 'Mettre à jour' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProductModal;
