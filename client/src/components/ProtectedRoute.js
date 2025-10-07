import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-beer-gold mx-auto mb-4"></div>
          <p className="text-white text-lg">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Rediriger vers la page de connexion si non authentifié
  if (!isAuthenticated || !user) {
    // Déterminer la page de connexion appropriée selon l'URL
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/admin')) {
      return <Navigate to="/admin/login" replace />;
    } else if (currentPath.startsWith('/server')) {
      return <Navigate to="/server/login" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // Vérifier les rôles autorisés
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Rediriger selon le rôle de l'utilisateur
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'server') {
      return <Navigate to="/server/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
