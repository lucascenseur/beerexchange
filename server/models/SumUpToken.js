const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SumUpToken = sequelize.define('SumUpToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'access_token'
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'refresh_token'
  },
  tokenType: {
    type: DataTypes.STRING(50),
    defaultValue: 'Bearer',
    field: 'token_type'
  },
  expiresIn: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'expires_in'
  },
  scope: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  merchantId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'merchant_id'
  },
  merchantEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'merchant_email'
  }
}, {
  tableName: 'sumup_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Méthodes statiques pour gérer les tokens
SumUpToken.getActiveToken = async () => {
  return await SumUpToken.findOne({
    where: { isActive: true },
    order: [['created_at', 'DESC']]
  });
};

SumUpToken.saveNewToken = async (tokenData) => {
  // Désactiver tous les anciens tokens
  await SumUpToken.update(
    { isActive: false },
    { where: { isActive: true } }
  );

  // Créer le nouveau token
  return await SumUpToken.create({
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    tokenType: tokenData.token_type || 'Bearer',
    expiresIn: tokenData.expires_in,
    scope: tokenData.scope,
    isActive: true,
    merchantId: tokenData.merchant_id,
    merchantEmail: tokenData.merchant_email
  });
};

SumUpToken.updateToken = async (tokenId, tokenData) => {
  return await SumUpToken.update(tokenData, {
    where: { id: tokenId }
  });
};

module.exports = SumUpToken;
