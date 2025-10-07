const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixPasswords() {
  try {
    // Connexion à MariaDB
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'beer_user',
      password: 'beer_password',
      database: 'beer_exchange'
    });

    console.log('✅ Connexion à MariaDB réussie');

    // Corriger le mot de passe admin
    console.log('🔧 Correction du mot de passe admin...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    await connection.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [adminPassword, 'admin']
    );
    console.log('✅ Mot de passe admin corrigé');

    // Corriger le mot de passe serveur
    console.log('🔧 Correction du mot de passe serveur...');
    const serverPassword = await bcrypt.hash('server123', 12);
    await connection.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [serverPassword, 'server']
    );
    console.log('✅ Mot de passe serveur corrigé');

    // Vérifier les corrections
    console.log('\n🔍 Vérification des corrections...');
    
    const [adminUser] = await connection.execute(
      'SELECT username, password FROM users WHERE username = ?',
      ['admin']
    );
    
    const [serverUser] = await connection.execute(
      'SELECT username, password FROM users WHERE username = ?',
      ['server']
    );

    // Tester les mots de passe
    const adminValid = await bcrypt.compare('admin123', adminUser[0].password);
    const serverValid = await bcrypt.compare('server123', serverUser[0].password);

    console.log('👑 Admin (admin123):', adminValid ? '✅ Valide' : '❌ Invalide');
    console.log('🍺 Serveur (server123):', serverValid ? '✅ Valide' : '❌ Invalide');

    await connection.end();
    console.log('\n🎉 Correction terminée ! Les connexions devraient maintenant fonctionner.');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixPasswords();
