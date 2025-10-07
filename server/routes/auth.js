const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation des données de connexion
const loginValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage('Nom d\'utilisateur requis'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe requis (min 6 caractères)')
];

// Route de connexion
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors: errors.array() 
      });
    }

    const { username, password } = req.body;
    console.log('🔐 Tentative de connexion pour:', username);

    // Rechercher l'utilisateur
    const user = await User.findOne({ 
      where: { 
        username, 
        is_active: true 
      } 
    });
    
    console.log('👤 Utilisateur trouvé:', user ? `${user.username} (${user.role})` : 'Aucun');
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé ou inactif');
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    // Vérifier le mot de passe
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔑 Mot de passe valide:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Mot de passe incorrect');
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    // Mettre à jour la dernière connexion
    await user.update({ last_login: new Date() });

    // Générer le token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        is_active: user.is_active,
        last_login: user.last_login
      }
    });

  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir les informations de l'utilisateur connecté
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        is_active: req.user.is_active,
        last_login: req.user.last_login
      }
    });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route de déconnexion (côté client, on supprime le token)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
});

// Route pour vérifier la validité du token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      is_active: req.user.is_active,
      last_login: req.user.last_login
    }
  });
});

// Route pour changer le mot de passe (admin seulement)
router.post('/change-password', [
  authenticateToken,
  body('currentPassword').isLength({ min: 6 }).withMessage('Mot de passe actuel requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nouveau mot de passe requis (min 6 caractères)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    // Vérifier le mot de passe actuel
    const bcrypt = require('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    // Mettre à jour le mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({ message: 'Mot de passe modifié avec succès' });

  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
