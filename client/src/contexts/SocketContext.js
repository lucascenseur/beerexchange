import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Se connecter au socket sans authentification
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || '');

    newSocket.on('connect', () => {
      console.log('🔌 Connecté au serveur Socket.io');
      setIsConnected(true);
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
  }, []);

  // Fonctions pour écouter les événements
  const onProductUpdate = (callback) => {
    if (socket) {
      socket.on('product-updated', callback);
      return () => socket.off('product-updated', callback);
    }
    return () => {};
  };

  const onProductCreated = (callback) => {
    if (socket) {
      socket.on('product-created', callback);
      return () => socket.off('product-created', callback);
    }
    return () => {};
  };

  const onProductDeleted = (callback) => {
    if (socket) {
      socket.on('product-deleted', callback);
      return () => socket.off('product-deleted', callback);
    }
    return () => {};
  };

  const onSaleCreated = (callback) => {
    if (socket) {
      socket.on('sale-created', callback);
      return () => socket.off('sale-created', callback);
    }
    return () => {};
  };

  const value = {
    socket,
    isConnected,
    onProductUpdate,
    onProductCreated,
    onProductDeleted,
    onSaleCreated
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