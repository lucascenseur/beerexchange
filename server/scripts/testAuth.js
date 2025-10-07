const { sequelize } = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const testAuth = async () => {
  try {
    // Connexion à MariaDB
    await sequelize.authenticate();
    console.log('✅ Connexion à MariaDB réussie');

    // Vérifier les utilisateurs existants
    const users = await User.findAll();
    console.log('👥 Utilisateurs trouvés:', users.length);
    
    for (const user of users) {
      console.log(`- ${user.username} (${user.role}) - Actif: ${user.is_active}`);
      
      // Tester la connexion avec les mots de passe par défaut
      if (user.username === 'admin') {
        const isPasswordValid = await bcrypt.compare('admin123', user.password);
        console.log(`  Mot de passe admin123 valide: ${isPasswordValid}`);
      } else if (user.username === 'server') {
        const isPasswordValid = await bcrypt.compare('server123', user.password);
        console.log(`  Mot de passe server123 valide: ${isPasswordValid}`);
      }
    }

    // Si aucun utilisateur, les créer
    if (users.length === 0) {
      console.log('🔧 Création des utilisateurs...');
      
      const adminUser = await User.create({
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        is_active: true
      });
      console.log('👑 Utilisateur admin créé:', adminUser.username);

      const serverUser = await User.create({
        username: 'server',
        password: 'server123',
        role: 'server',
        is_active: true
      });
      console.log('🍺 Utilisateur serveur créé:', serverUser.username);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Déconnexion de MariaDB');
  }
};

testAuth();
