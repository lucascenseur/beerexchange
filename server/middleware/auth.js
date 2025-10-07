const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour vérifier le token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Token d\'accès requis' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Utilisateur invalide ou inactif' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    }
    console.error('Erreur d\'authentification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Middleware pour vérifier le rôle administrateur
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès administrateur requis' });
  }
  next();
};

// Middleware pour vérifier le rôle serveur ou admin
const requireServerOrAdmin = (req, res, next) => {
  if (req.user.role !== 'server' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès serveur ou administrateur requis' });
  }
  next();
};

// Middleware pour vérifier le rôle serveur
const requireServer = (req, res, next) => {
  if (req.user.role !== 'server') {
    return res.status(403).json({ message: 'Accès serveur requis' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireServerOrAdmin,
  requireServer
};
