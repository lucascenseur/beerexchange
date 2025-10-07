const { sequelize } = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixPasswords() {
  try {
    // Connexion à MariaDB via Sequelize
    await sequelize.authenticate();
    console.log('✅ Connexion à MariaDB réussie');

    // Corriger le mot de passe admin
    console.log('🔧 Correction du mot de passe admin...');
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (adminUser) {
      const adminPassword = await bcrypt.hash('admin123', 12);
      await adminUser.update({ password: adminPassword });
      console.log('✅ Mot de passe admin corrigé');
    } else {
      console.log('❌ Utilisateur admin non trouvé');
    }

    // Corriger le mot de passe serveur
    console.log('🔧 Correction du mot de passe serveur...');
    const serverUser = await User.findOne({ where: { username: 'server' } });
    if (serverUser) {
      const serverPassword = await bcrypt.hash('server123', 12);
      await serverUser.update({ password: serverPassword });
      console.log('✅ Mot de passe serveur corrigé');
    } else {
      console.log('❌ Utilisateur serveur non trouvé');
    }

    // Vérifier les corrections
    console.log('\n🔍 Vérification des corrections...');
    
    const adminUserCheck = await User.findOne({ where: { username: 'admin' } });
    const serverUserCheck = await User.findOne({ where: { username: 'server' } });

    if (adminUserCheck) {
      const adminValid = await bcrypt.compare('admin123', adminUserCheck.password);
      console.log('👑 Admin (admin123):', adminValid ? '✅ Valide' : '❌ Invalide');
    }

    if (serverUserCheck) {
      const serverValid = await bcrypt.compare('server123', serverUserCheck.password);
      console.log('🍺 Serveur (server123):', serverValid ? '✅ Valide' : '❌ Invalide');
    }

    await sequelize.close();
    console.log('\n🎉 Correction terminée ! Les connexions devraient maintenant fonctionner.');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixPasswords();
