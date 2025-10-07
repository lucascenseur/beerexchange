const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration de la base de données
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'beer_exchange',
  process.env.MYSQL_USER || 'beer_user',
  process.env.MYSQL_PASSWORD || 'beer_password',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

// Test de connexion
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à MariaDB réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion MariaDB:', error);
    return false;
  }
};

module.exports = { sequelize, testConnection };
