// backend/src/models/index.js
const { sequelize } = require('../config/database');
const User = require('./User');
const Message = require('./Message');

// Define associations
User.hasMany(Message, {
  foreignKey: 'userId',
  as: 'messages',
  onDelete: 'CASCADE'
});

Message.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Sync models (create tables)
async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  User,
  Message,
  syncDatabase
};
