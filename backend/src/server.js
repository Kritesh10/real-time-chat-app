// backend/src/server.js
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const { testConnection, syncDatabase } = require('./models');
const databaseService = require('./services/databaseService');

const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*", // In production, specify your frontend domain
    methods: ["GET", "POST"]
  }
});

// Store connected users
const connectedUsers = new Map();

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Join room (default: general)
  socket.on('join_room', async (data) => {
    const { roomId = 'general', userId } = data;
    
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userId = userId;
    
    // Update user online status
    if (userId) {
      await databaseService.updateUserOnlineStatus(userId, true);
      connectedUsers.set(socket.id, { userId, roomId });
    }
    
    console.log(`User ${userId} joined room: ${roomId}`);
    
    // Send recent messages to new user
    try {
      const recentMessages = await databaseService.getRecentMessages(roomId);
      socket.emit('message_history', recentMessages);
    } catch (error) {
      console.error('Error fetching message history:', error);
    }
    
    // Notify others in room
    socket.to(roomId).emit('user_joined', {
      message: 'A user joined the chat',
      userId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle new message
  socket.on('send_message', async (data) => {
    try {
      const { message, userId, roomId = 'general' } = data;
      
      if (!message || !userId) {
        socket.emit('error', { message: 'Missing message or user ID' });
        return;
      }

      // Save message to database
      const savedMessage = await databaseService.createMessage({
        userId,
        roomId,
        message,
        messageType: 'text'
      });

      // Broadcast to all users in room
      io.to(roomId).emit('new_message', {
        id: savedMessage.id,
        message: savedMessage.message,
        messageType: savedMessage.messageType,
        createdAt: savedMessage.createdAt,
        user: savedMessage.user
      });

      console.log(`Message saved: ${message} by user ${userId}`);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { roomId, username, isTyping } = data;
    socket.to(roomId).emit('user_typing', { username, isTyping });
  });

  // Handle disconnect
  socket.on('disconnect', async (reason) => {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    
    const userInfo = connectedUsers.get(socket.id);
    if (userInfo) {
      const { userId, roomId } = userInfo;
      
      // Update user offline status
      await databaseService.updateUserOnlineStatus(userId, false);
      
      // Notify others in room
      socket.to(roomId).emit('user_left', {
        message: 'A user left the chat',
        userId,
        timestamp: new Date().toISOString()
      });
      
      connectedUsers.delete(socket.id);
    }
  });

  // Test events for development
  socket.on('hello', (data) => {
    console.log('Received hello:', data);
    socket.emit('hello_response', {
      message: `Hello ${data.name}! Your socket ID is ${socket.id}`,
      timestamp: new Date().toISOString()
    });
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database (create tables)
    await syncDatabase(false); // Set to true to recreate tables
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO server ready for connections`);
      console.log(`🗄️  Database connected and synchronized`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();