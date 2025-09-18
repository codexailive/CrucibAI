const { WebSocketServer } = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');
const { LeveldbPersistence } = require('y-leveldb');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

class CollaborationService {
  constructor(port = 8080) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    
    // Initialize Y.js persistence
    this.persistence = new LeveldbPersistence('./collaboration-db');
    
    // Initialize WebSocket server
    this.wss = new WebSocketServer({ 
      server: this.server,
      path: '/collaboration'
    });
    
    // Data stores
    this.sessions = new Map();
    this.users = new Map();
    this.chatMessages = new Map();
    
    this.setupExpress();
    this.setupWebSocket();
  }

  setupExpress() {
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.com'] 
        : ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true
    }));
    
    this.app.use(express.json());

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        activeSessions: this.sessions.size,
        connectedUsers: this.users.size,
        timestamp: new Date().toISOString()
      });
    });

    // Get session info
    this.app.get('/api/collaboration/sessions/:sessionId', (req, res) => {
      const { sessionId } = req.params;
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      res.json(session);
    });

    // Create new session
    this.app.post('/api/collaboration/sessions', (req, res) => {
      const { name, ownerId, ownerName, ownerEmail } = req.body;
      
      if (!name || !ownerId) {
        return res.status(400).json({ error: 'Name and owner ID are required' });
      }

      const sessionId = uuidv4();
      const owner = {
        id: ownerId,
        sessionId,
        name: ownerName || 'Anonymous',
        email: ownerEmail || '',
        color: this.getUserColor(0),
        isOnline: false,
        joinedAt: new Date(),
        lastActivity: new Date(),
        permissions: {
          canEdit: true,
          canComment: true,
          canInvite: true
        }
      };

      const session = {
        id: sessionId,
        name,
        ownerId,
        createdAt: new Date(),
        lastActivity: new Date(),
        users: [owner],
        permissions: {
          allowGuests: true,
          defaultRole: 'editor',
          maxUsers: 10
        }
      };

      this.sessions.set(sessionId, session);
      this.users.set(ownerId, owner);
      this.chatMessages.set(sessionId, []);

      res.status(201).json({ sessionId, session });
    });

    // Join session
    this.app.post('/api/collaboration/sessions/:sessionId/join', (req, res) => {
      const { sessionId } = req.params;
      const { userId, userName, userEmail } = req.body;
      
      const session = this.sessions.get(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Check if user already in session
      const existingUser = session.users.find(u => u.id === userId);
      if (existingUser) {
        existingUser.isOnline = true;
        existingUser.lastActivity = new Date();
        this.users.set(userId, existingUser);
        return res.json({ user: existingUser });
      }

      // Check session limits
      if (session.users.length >= session.permissions.maxUsers) {
        return res.status(403).json({ error: 'Session is full' });
      }

      const newUser = {
        id: userId,
        sessionId,
        name: userName || 'Anonymous',
        email: userEmail || '',
        color: this.getUserColor(session.users.length),
        isOnline: true,
        joinedAt: new Date(),
        lastActivity: new Date(),
        permissions: {
          canEdit: session.permissions.defaultRole === 'editor',
          canComment: true,
          canInvite: false
        }
      };

      session.users.push(newUser);
      session.lastActivity = new Date();
      this.users.set(userId, newUser);

      // Add system message
      const joinMessage = {
        id: uuidv4(),
        sessionId,
        userId: 'system',
        userName: 'System',
        userColor: '#6B7280',
        message: `${newUser.name} joined the session`,
        timestamp: new Date(),
        type: 'system'
      };

      const messages = this.chatMessages.get(sessionId) || [];
      messages.push(joinMessage);
      this.chatMessages.set(sessionId, messages);

      res.json({ user: newUser });
    });

    // Get chat messages
    this.app.get('/api/collaboration/sessions/:sessionId/messages', (req, res) => {
      const { sessionId } = req.params;
      const messages = this.chatMessages.get(sessionId) || [];
      
      res.json({ messages });
    });

    // Send chat message
    this.app.post('/api/collaboration/sessions/:sessionId/messages', (req, res) => {
      const { sessionId } = req.params;
      const { userId, message, type = 'text' } = req.body;
      
      const session = this.sessions.get(sessionId);
      const user = this.users.get(userId);
      
      if (!session || !user) {
        return res.status(404).json({ error: 'Session or user not found' });
      }

      const chatMessage = {
        id: uuidv4(),
        sessionId,
        userId,
        userName: user.name,
        userColor: user.color,
        message,
        timestamp: new Date(),
        type
      };

      const messages = this.chatMessages.get(sessionId) || [];
      messages.push(chatMessage);
      this.chatMessages.set(sessionId, messages);

      // Broadcast to all connected clients in this session
      this.broadcastToSession(sessionId, 'chat-message', chatMessage);

      res.json({ message: chatMessage });
    });

    // Update user permissions
    this.app.patch('/api/collaboration/users/:userId/permissions', (req, res) => {
      const { userId } = req.params;
      const { permissions } = req.body;
      
      const user = this.users.get(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.permissions = { ...user.permissions, ...permissions };
      
      // Broadcast permission update
      this.broadcastToSession(user.sessionId, 'user-permissions-updated', {
        userId,
        permissions: user.permissions
      });

      res.json({ user });
    });

    // Leave session
    this.app.post('/api/collaboration/sessions/:sessionId/leave', (req, res) => {
      const { sessionId } = req.params;
      const { userId } = req.body;
      
      const session = this.sessions.get(sessionId);
      const user = this.users.get(userId);
      
      if (session && user) {
        user.isOnline = false;
        user.lastActivity = new Date();
        
        // Add system message
        const leaveMessage = {
          id: uuidv4(),
          sessionId,
          userId: 'system',
          userName: 'System',
          userColor: '#6B7280',
          message: `${user.name} left the session`,
          timestamp: new Date(),
          type: 'system'
        };

        const messages = this.chatMessages.get(sessionId) || [];
        messages.push(leaveMessage);
        this.chatMessages.set(sessionId, messages);

        // Broadcast user left
        this.broadcastToSession(sessionId, 'user-left', { userId });
      }
      
      res.json({ success: true });
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const sessionId = url.pathname.split('/').pop();
      
      if (!sessionId) {
        ws.close(1008, 'Invalid session ID');
        return;
      }

      // Set up Y.js WebSocket connection
      setupWSConnection(ws, req, { 
        docName: sessionId,
        persistence: this.persistence,
        gc: true
      });

      // Store session info on WebSocket
      ws.sessionId = sessionId;

      // Handle WebSocket messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(ws, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        // Handle user disconnect
        const sessionId = ws.sessionId;
        if (sessionId) {
          this.handleUserDisconnect(sessionId);
        }
      });

      console.log(`WebSocket connection established for session: ${sessionId}`);
    });
  }

  handleWebSocketMessage(ws, message) {
    const { type, data } = message;
    const sessionId = ws.sessionId;

    switch (type) {
      case 'user-presence':
        this.updateUserPresence(sessionId, data);
        break;
      case 'cursor-position':
        this.broadcastToSession(sessionId, 'cursor-update', data, ws);
        break;
      case 'voice-activity':
        this.broadcastToSession(sessionId, 'voice-activity', data, ws);
        break;
      default:
        console.log('Unknown WebSocket message type:', type);
    }
  }

  updateUserPresence(sessionId, presenceData) {
    const { userId, status, activity } = presenceData;
    const user = this.users.get(userId);
    
    if (user && user.sessionId === sessionId) {
      user.isOnline = true;
      user.lastActivity = new Date();
      
      // Broadcast presence update
      this.broadcastToSession(sessionId, 'presence-update', {
        userId,
        status,
        activity,
        timestamp: new Date()
      });
    }
  }

  broadcastToSession(sessionId, type, data, excludeWs) {
    this.wss.clients.forEach(client => {
      if (client.readyState === 1 && // WebSocket.OPEN
          client.sessionId === sessionId &&
          client !== excludeWs) {
        client.send(JSON.stringify({ type, data }));
      }
    });
  }

  handleUserDisconnect(sessionId) {
    // In a real implementation, you'd track which user this WebSocket belongs to
    console.log(`User disconnected from session: ${sessionId}`);
  }

  getUserColor(index) {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
    ];
    return colors[index % colors.length];
  }

  // Cleanup inactive sessions
  cleanupSessions() {
    const now = new Date();
    const maxInactivity = 24 * 60 * 60 * 1000; // 24 hours

    this.sessions.forEach((session, sessionId) => {
      const timeSinceActivity = now.getTime() - session.lastActivity.getTime();
      
      if (timeSinceActivity > maxInactivity) {
        // Clean up inactive session
        session.users.forEach(user => {
          this.users.delete(user.id);
        });
        
        this.sessions.delete(sessionId);
        this.chatMessages.delete(sessionId);
        
        console.log(`Cleaned up inactive session: ${sessionId}`);
      }
    });
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`🚀 Collaboration service running on port ${this.port}`);
      console.log(`📝 WebSocket endpoint: ws://localhost:${this.port}/collaboration`);
      console.log(`🌐 REST API endpoint: http://localhost:${this.port}/api/collaboration`);
    });

    // Run cleanup every hour
    setInterval(() => {
      this.cleanupSessions();
    }, 60 * 60 * 1000);
  }

  stop() {
    this.wss.close();
    this.server.close();
    this.persistence.destroy();
  }
}

// Start the service
const collaborationService = new CollaborationService(
  parseInt(process.env.COLLABORATION_PORT || '8080')
);

collaborationService.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down collaboration service...');
  collaborationService.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down collaboration service...');
  collaborationService.stop();
  process.exit(0);
});

module.exports = { CollaborationService };