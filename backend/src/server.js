const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');

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

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Test event - client says hello
  socket.on('hello', (data) => {
    console.log('Received hello:', data);
    
    // Send response back to client
    socket.emit('hello_response', {
      message: `Hello ${data.name}! Your socket ID is ${socket.id}`,
      timestamp: new Date().toISOString()
    });
    
    // Broadcast to all other clients
    socket.broadcast.emit('user_joined', {
      message: `${data.name} joined the chat!`,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Test event - client sends message
  socket.on('send_message', (data) => {
    console.log('Message received:', data);
    
    // Broadcast message to all clients
    io.emit('new_message', {
      id: Date.now(), // Temporary ID
      username: data.username || 'Anonymous',
      message: data.message,
      timestamp: new Date().toISOString(),
      socketId: socket.id
    });
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    
    // Notify other clients
    socket.broadcast.emit('user_left', {
      message: 'A user left the chat',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
});