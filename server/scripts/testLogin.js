const { sequelize } = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const testLogin = async () => {
  try {
    // Connexion à MariaDB
    await sequelize.authenticate();
    console.log('✅ Connexion à MariaDB réussie');

    // Tester la connexion admin
    console.log('\n🔐 Test de connexion admin...');
    const adminUser = await User.findOne({
      where: { 
        username: 'admin',
        is_active: true 
      }
    });

    if (adminUser) {
      console.log('👤 Utilisateur admin trouvé:', adminUser.username);
      console.log('🔑 Mot de passe hashé (début):', adminUser.password.substring(0, 20) + '...');
      
      const isPasswordValid = await bcrypt.compare('admin123', adminUser.password);
      console.log('✅ Mot de passe admin123 valide:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('❌ Le mot de passe ne correspond pas !');
        console.log('🔧 Recréation de l\'utilisateur admin...');
        
        // Supprimer l'ancien utilisateur
        await adminUser.destroy();
        
        // Créer un nouvel utilisateur avec le bon mot de passe
        const hashedPassword = await bcrypt.hash('admin123', 12);
        const newAdminUser = await User.create({
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
          is_active: true
        });
        console.log('✅ Nouvel utilisateur admin créé');
      }
    } else {
      console.log('❌ Utilisateur admin non trouvé');
      console.log('🔧 Création de l\'utilisateur admin...');
      
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const newAdminUser = await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        is_active: true
      });
      console.log('✅ Utilisateur admin créé');
    }

    // Tester la connexion serveur
    console.log('\n🔐 Test de connexion serveur...');
    const serverUser = await User.findOne({
      where: { 
        username: 'server',
        is_active: true 
      }
    });

    if (serverUser) {
      console.log('👤 Utilisateur serveur trouvé:', serverUser.username);
      
      const isPasswordValid = await bcrypt.compare('server123', serverUser.password);
      console.log('✅ Mot de passe server123 valide:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('❌ Le mot de passe ne correspond pas !');
        console.log('🔧 Recréation de l\'utilisateur serveur...');
        
        // Supprimer l'ancien utilisateur
        await serverUser.destroy();
        
        // Créer un nouvel utilisateur avec le bon mot de passe
        const hashedPassword = await bcrypt.hash('server123', 12);
        const newServerUser = await User.create({
          username: 'server',
          password: hashedPassword,
          role: 'server',
          is_active: true
        });
        console.log('✅ Nouvel utilisateur serveur créé');
      }
    } else {
      console.log('❌ Utilisateur serveur non trouvé');
      console.log('🔧 Création de l\'utilisateur serveur...');
      
      const hashedPassword = await bcrypt.hash('server123', 12);
      const newServerUser = await User.create({
        username: 'server',
        password: hashedPassword,
        role: 'server',
        is_active: true
      });
      console.log('✅ Utilisateur serveur créé');
    }

    console.log('\n🎉 Test terminé ! Les utilisateurs devraient maintenant fonctionner.');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Déconnexion de MariaDB');
  }
};

testLogin();
