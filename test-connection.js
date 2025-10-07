const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    // Connexion à MariaDB
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'beer_user',
      password: 'beer_password',
      database: 'beer_exchange'
    });

    console.log('✅ Connexion à MariaDB réussie');

    // Vérifier les utilisateurs
    const [users] = await connection.execute('SELECT id, username, role, is_active FROM users');
    console.log('👥 Utilisateurs trouvés:', users.length);
    
    for (const user of users) {
      console.log(`- ${user.username} (${user.role}) - Actif: ${user.is_active}`);
    }

    // Tester la connexion avec un utilisateur spécifique
    const [adminUser] = await connection.execute(
      'SELECT id, username, password, role, is_active FROM users WHERE username = ? AND is_active = 1',
      ['admin']
    );

    if (adminUser.length > 0) {
      console.log('👑 Utilisateur admin trouvé:', adminUser[0].username);
      console.log('🔑 Mot de passe hashé:', adminUser[0].password.substring(0, 20) + '...');
    } else {
      console.log('❌ Utilisateur admin non trouvé ou inactif');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testConnection();
