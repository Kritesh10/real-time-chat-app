// backend/src/services/databaseService.js
const { User, Message } = require('../models');
const { Op } = require('sequelize');

class DatabaseService {
  // User operations
  async createUser(userData) {
    try {
      const user = await User.create({
        username: userData.username,
        email: userData.email,
        passwordHash: userData.password, // Will be hashed by the hook
        avatarUrl: userData.avatarUrl
      });
      
      // Return user without password hash
      const { passwordHash, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error('Username or email already exists');
      }
      throw error;
    }
  }

  async getUserById(id) {
    return User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] }
    });
  }

  async getUserByUsername(username) {
    return User.findByUsername(username);
  }

  async getUserByEmail(email) {
    return User.findByEmail(email);
  }

  async updateUserOnlineStatus(userId, isOnline) {
    return User.update(
      { 
        isOnline, 
        lastSeen: isOnline ? null : new Date() 
      },
      { where: { id: userId } }
    );
  }

  async getOnlineUsers() {
    return User.findAll({
      where: { isOnline: true },
      attributes: { exclude: ['passwordHash'] }
    });
  }

  // Message operations
  async createMessage(messageData) {
    try {
      const message = await Message.create({
        userId: messageData.userId,
        roomId: messageData.roomId || 'general',
        message: messageData.message,
        messageType: messageData.messageType || 'text',
        fileUrl: messageData.fileUrl
      });

      // Return message with user info
      return this.getMessageWithUser(message.id);
    } catch (error) {
      throw error;
    }
  }

  async getMessageWithUser(messageId) {
    return Message.findByPk(messageId, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatarUrl']
      }]
    });
  }

  async getRecentMessages(roomId = 'general', limit = 50) {
    const messages = await Message.findAll({
      where: { roomId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatarUrl']
      }],
      order: [['created_at', 'ASC']], // Oldest first for chat display
      limit
    });

    return messages.map(msg => ({
      id: msg.id,
      message: msg.message,
      messageType: msg.messageType,
      fileUrl: msg.fileUrl,
      createdAt: msg.created_at,
      user: msg.user
    }));
  }

  async searchMessages(query, roomId = 'general', limit = 20) {
    return Message.findAll({
      where: {
        roomId,
        message: {
          [Op.iLike]: `%${query}%`
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatarUrl']
      }],
      order: [['created_at', 'DESC']],
      limit
    });
  }

  async deleteMessage(messageId, userId) {
    const message = await Message.findByPk(messageId);
    if (!message) {
      throw new Error('Message not found');
    }
    
    if (message.userId !== userId) {
      throw new Error('Not authorized to delete this message');
    }
    
    return message.destroy();
  }

  // Room operations
  async getRoomUsers(roomId) {
    const messages = await Message.findAll({
      where: { roomId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatarUrl']
      }],
      attributes: ['userId'],
      group: ['userId', 'user.id', 'user.username', 'user.avatarUrl']
    });

    return messages.map(msg => msg.user);
  }
}

module.exports = new DatabaseService();