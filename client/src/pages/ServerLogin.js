import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Beer, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ServerLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, user, error } = useAuth();

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else if (user.role === 'server') {
        window.location.href = '/server/dashboard';
      }
    }
  }, [isAuthenticated, user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        // La redirection sera gérée par useEffect
        if (user?.role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/server/dashboard';
        }
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-beer-gold rounded-full mb-4"
          >
            <Beer className="w-10 h-10 text-beer-dark" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">Beer Exchange</h1>
          <p className="text-white/80 text-lg">Connexion Serveur</p>
        </div>

        {/* Formulaire de connexion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom d'utilisateur */}
            <div>
              <label htmlFor="username" className="block text-white font-semibold mb-2">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="input-field w-full"
                placeholder="Entrez votre nom d'utilisateur"
                disabled={isLoading}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-white font-semibold mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input-field w-full pr-12"
                  placeholder="Entrez votre mot de passe"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/30 rounded-lg p-3"
              >
                <p className="text-red-200 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Bouton de connexion */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-beer-dark"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Se connecter
                </>
              )}
            </motion.button>
          </form>

          {/* Liens de navigation */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-white/70 text-sm">
              Vous êtes administrateur ?{' '}
              <a 
                href="/admin/login" 
                className="text-beer-gold hover:text-yellow-400 font-semibold transition-colors"
              >
                Connexion Admin
              </a>
            </p>
            <p className="text-white/70 text-sm">
              Retour à l'interface publique{' '}
              <a 
                href="/" 
                className="text-beer-gold hover:text-yellow-400 font-semibold transition-colors"
              >
                Voir les prix
              </a>
            </p>
          </div>
        </motion.div>

        {/* Informations de démonstration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl p-4"
        >
          <h3 className="text-white font-semibold mb-2">🔑 Comptes de démonstration</h3>
          <div className="text-white/80 text-sm space-y-1">
            <p><strong>Serveur:</strong> server / server123</p>
            <p><strong>Admin:</strong> admin / admin123</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ServerLogin;
