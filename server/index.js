const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const characterRoutes = require('./routes/characters');
const itemRoutes = require('./routes/items');
const spellRoutes = require('./routes/spells');
const monsterRoutes = require('./routes/monsters');
const combatRoutes = require('./routes/combat');
const campaignRoutes = require('./routes/campaigns');
const aiRoutes = require('./routes/ai');
const mapRoutes = require('./routes/maps');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Make io accessible to routes
app.set('io', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/spells', spellRoutes);
app.use('/api/monsters', monsterRoutes);
app.use('/api/combat', combatRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/maps', mapRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io for real-time multiplayer
const activeSessions = new Map(); // campaignId -> Set of socketIds
const playerPositions = new Map(); // campaignId -> Map of playerId -> {x, y}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join a campaign
  socket.on('join-campaign', ({ campaignId, userId, username }) => {
    socket.join(`campaign-${campaignId}`);
    
    if (!activeSessions.has(campaignId)) {
      activeSessions.set(campaignId, new Set());
    }
    activeSessions.get(campaignId).add(socket.id);
    
    socket.campaignId = campaignId;
    socket.userId = userId;
    socket.username = username;

    // Notify others
    socket.to(`campaign-${campaignId}`).emit('player-joined', {
      userId,
      username,
      socketId: socket.id
    });

    // Send current players
    const players = [];
    activeSessions.get(campaignId).forEach(sid => {
      const s = io.sockets.sockets.get(sid);
      if (s && s.userId) {
        players.push({
          userId: s.userId,
          username: s.username,
          socketId: sid
        });
      }
    });
    socket.emit('current-players', players);

    console.log(`User ${username} joined campaign ${campaignId}`);
  });

  // Player movement
  socket.on('player-move', ({ x, y }) => {
    if (socket.campaignId) {
      socket.to(`campaign-${socket.campaignId}`).emit('player-moved', {
        userId: socket.userId,
        username: socket.username,
        x,
        y
      });
    }
  });

  // Combat actions
  socket.on('combat-action', (action) => {
    if (socket.campaignId) {
      socket.to(`campaign-${socket.campaignId}`).emit('combat-update', {
        action,
        userId: socket.userId,
        timestamp: Date.now()
      });
    }
  });

  // Dice roll (for shared rolling)
  socket.on('dice-roll', ({ dice, reason }) => {
    if (socket.campaignId) {
      io.to(`campaign-${socket.campaignId}`).emit('dice-result', {
        dice,
        reason,
        userId: socket.userId,
        username: socket.username,
        timestamp: Date.now()
      });
    }
  });

  // Chat message
  socket.on('chat-message', ({ message }) => {
    if (socket.campaignId) {
      io.to(`campaign-${socket.campaignId}`).emit('chat-message', {
        message,
        userId: socket.userId,
        username: socket.username,
        timestamp: Date.now()
      });
    }
  });

  // AI GM message
  socket.on('ai-gm-message', ({ message }) => {
    if (socket.campaignId) {
      io.to(`campaign-${socket.campaignId}`).emit('ai-gm-message', {
        message,
        timestamp: Date.now()
      });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.campaignId && activeSessions.has(socket.campaignId)) {
      const session = activeSessions.get(socket.campaignId);
      session.delete(socket.id);
      
      socket.to(`campaign-${socket.campaignId}`).emit('player-left', {
        userId: socket.userId,
        username: socket.username
      });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`D&D 5e Server running on port ${PORT}`);
});

module.exports = { app, server, io };