import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Se connecter au socket seulement si l'utilisateur est authentifié
    if (isAuthenticated && user) {
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      newSocket.on('connect', () => {
        console.log('🔌 Connecté au serveur Socket.io');
        setIsConnected(true);
        
        // Rejoindre les rooms appropriées selon le rôle
        if (user.role === 'admin') {
          newSocket.emit('join-room', 'admin');
          newSocket.emit('join-room', 'servers');
        } else if (user.role === 'server') {
          newSocket.emit('join-room', 'servers');
        }
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Déconnecté du serveur Socket.io');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Erreur de connexion Socket.io:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // Pour l'interface publique, se connecter sans authentification
      const publicSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
      
      publicSocket.on('connect', () => {
        console.log('🔌 Connecté au serveur Socket.io (public)');
        setIsConnected(true);
        publicSocket.emit('join-room', 'public');
      });

      publicSocket.on('disconnect', () => {
        console.log('🔌 Déconnecté du serveur Socket.io (public)');
        setIsConnected(false);
      });

      setSocket(publicSocket);

      return () => {
        publicSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  // Fonction pour écouter les mises à jour de produits
  const onProductUpdate = (callback) => {
    if (socket) {
      socket.on('product-updated', callback);
      return () => socket.off('product-updated', callback);
    }
  };

  // Fonction pour écouter la création de produits
  const onProductCreated = (callback) => {
    if (socket) {
      socket.on('product-created', callback);
      return () => socket.off('product-created', callback);
    }
  };

  // Fonction pour écouter la suppression de produits
  const onProductDeleted = (callback) => {
    if (socket) {
      socket.on('product-deleted', callback);
      return () => socket.off('product-deleted', callback);
    }
  };

  // Fonction pour écouter les nouvelles ventes
  const onSaleCreated = (callback) => {
    if (socket) {
      socket.on('sale-created', callback);
      return () => socket.off('sale-created', callback);
    }
  };

  // Fonction pour émettre un événement
  const emit = (event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  };

  const value = {
    socket,
    isConnected,
    onProductUpdate,
    onProductCreated,
    onProductDeleted,
    onSaleCreated,
    emit
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket doit être utilisé dans un SocketProvider');
  }
  return context;
};

export default SocketContext;
