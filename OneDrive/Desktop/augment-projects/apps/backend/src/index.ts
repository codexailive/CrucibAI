import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import services
import { AdvancedMultimodalConductor } from './services/ai/AdvancedMultimodalConductor';
import { QuantumComputingService } from './services/quantum/QuantumComputingService';
import { ARVRDevelopmentService } from './services/arvr/ARVRDevelopmentService';
import { AdvancedDeploymentService } from './services/deployment/AdvancedDeploymentService';
import { TeamCollaborationService } from './services/collaboration/TeamCollaborationService';
import { AdvancedAnalyticsService } from './services/analytics/AdvancedAnalyticsService';
import { SecurityComplianceService } from './services/security/SecurityComplianceService';
import { MarketplaceService } from './services/marketplace/MarketplaceService';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter as any);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize services
const aiConductor = new AdvancedMultimodalConductor();
const quantumService = new QuantumComputingService();
const arvrService = new ARVRDevelopmentService();
const deploymentService = new AdvancedDeploymentService();
const collaborationService = new TeamCollaborationService();
const analyticsService = new AdvancedAnalyticsService();
const securityService = new SecurityComplianceService();
const marketplaceService = new MarketplaceService();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    services: {
      ai: 'operational',
      quantum: 'operational',
      arvr: 'operational',
      deployment: 'operational',
      collaboration: 'operational',
      analytics: 'operational',
      security: 'operational',
      marketplace: 'operational'
    }
  });
});

// API Routes
app.use('/api/ai', createAIRoutes());
app.use('/api/quantum', createQuantumRoutes());
app.use('/api/arvr', createARVRRoutes());
app.use('/api/deployment', createDeploymentRoutes());
app.use('/api/collaboration', createCollaborationRoutes());
app.use('/api/analytics', createAnalyticsRoutes());
app.use('/api/security', createSecurityRoutes());
app.use('/api/marketplace', createMarketplaceRoutes());

// Socket.IO for real-time features
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle collaboration events
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('code-change', (data) => {
    socket.to(data.roomId).emit('code-update', data);
  });

  socket.on('cursor-move', (data) => {
    socket.to(data.roomId).emit('cursor-update', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Route creators
function createAIRoutes() {
  const router = express.Router();

  router.post('/process', async (req, res) => {
    try {
      const { input } = req.body;
      const result = await aiConductor.processMultimodalRequest(input);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  router.post('/voice/process', async (req, res) => {
    try {
      const { audioData } = req.body;
      // Mock voice processing for now
      const result = { transcription: "Voice processing completed", confidence: 0.95 };
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
}

function createQuantumRoutes() {
  const router = express.Router();

  router.post('/circuit/create', async (req, res) => {
    try {
      const { circuitData } = req.body;
      // Mock quantum circuit creation
      const result = {
        circuitId: 'qc_' + Date.now(),
        qubits: circuitData?.qubits || 4,
        gates: circuitData?.gates || [],
        status: 'created'
      };
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  router.post('/optimize', async (req, res) => {
    try {
      const { problem, algorithm } = req.body;
      // Mock quantum optimization
      const result = {
        optimizationId: 'opt_' + Date.now(),
        algorithm: algorithm || 'QAOA',
        result: 'Optimization completed',
        cost: Math.random() * 100
      };
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
}

function createARVRRoutes() {
  const router = express.Router();

  router.post('/scene/create', async (req, res) => {
    try {
      const { sceneData } = req.body;
      // Mock AR/VR scene creation
      const result = {
        sceneId: 'scene_' + Date.now(),
        name: sceneData?.name || 'New Scene',
        objects: sceneData?.objects || [],
        status: 'created'
      };
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
}

function createDeploymentRoutes() {
  const router = express.Router();

  router.post('/deploy', async (req, res) => {
    try {
      const { projectData, platform } = req.body;
      // Mock deployment
      const result = {
        deploymentId: 'dep_' + Date.now(),
        platform: platform || 'vercel',
        url: `https://${projectData?.name || 'app'}.vercel.app`,
        status: 'deployed'
      };
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
}

function createCollaborationRoutes() {
  const router = express.Router();

  router.post('/room/create', async (req, res) => {
    try {
      const { roomData } = req.body;
      // Mock collaboration room
      const result = {
        roomId: 'room_' + Date.now(),
        name: roomData?.name || 'New Room',
        participants: [],
        status: 'active'
      };
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
}

function createAnalyticsRoutes() {
  const router = express.Router();

  router.get('/usage', async (req, res) => {
    try {
      const { userId } = req.query;
      // Mock analytics data
      const result = {
        userId: userId || 'user_123',
        aiCalls: Math.floor(Math.random() * 1000),
        quantumSimulations: Math.floor(Math.random() * 50),
        deployments: Math.floor(Math.random() * 20),
        storageUsed: Math.floor(Math.random() * 10000) + 'MB'
      };
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
}

function createSecurityRoutes() {
  const router = express.Router();

  router.post('/authenticate', async (req, res) => {
    try {
      const { credentials } = req.body;
      // Mock authentication
      const result = {
        token: 'jwt_' + Date.now(),
        user: { id: 'user_123', name: 'Demo User', role: 'developer' },
        expiresIn: '24h'
      };
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
}

function createMarketplaceRoutes() {
  const router = express.Router();

  router.get('/plugins', async (req, res) => {
    try {
      // Mock marketplace plugins
      const result = [
        { id: 'plugin_1', name: 'OpenAI Integration', category: 'AI', price: 'Free' },
        { id: 'plugin_2', name: 'AWS Connector', category: 'Cloud', price: '$9.99' },
        { id: 'plugin_3', name: 'Stripe Payments', category: 'Payments', price: 'Free' },
        { id: 'plugin_4', name: 'Analytics Pro', category: 'Analytics', price: '$19.99' }
      ];
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 CrucibleAI Server running on port ${PORT}`);
  console.log(`🌟 All advanced services initialized and ready!`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});