// backend/src/models/Message.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  roomId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'general',
    field: 'room_id'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 2000]
    }
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'file'),
    defaultValue: 'text',
    field: 'message_type'
  },
  fileUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'file_url'
  }
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false // Messages don't get updated
});

// Class methods
Message.getRecentMessages = function(roomId = 'general', limit = 50) {
  return this.findAll({
    where: { roomId },
    include: [{
      model: sequelize.models.User,
      attributes: ['id', 'username', 'avatarUrl']
    }],
    order: [['created_at', 'DESC']],
    limit
  });
};

Message.getMessagesByUser = function(userId, limit = 50) {
  return this.findAll({
    where: { userId },
    include: [{
      model: sequelize.models.User,
      attributes: ['id', 'username', 'avatarUrl']
    }],
    order: [['created_at', 'DESC']],
    limit
  });
};

module.exports = Message;