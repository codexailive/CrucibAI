import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
// Adjust the import to match the actual export from './routes/auth'
import client from 'prom-client';
import authRoutes from './routes/auth';
// import creditsRoutes from './routes/credits';
// import pricingRoutes from './routes/pricing';
// import terminalRoutes from './routes/terminal';
import uploadRoutes from './routes/upload';
import { getMetrics, getPrometheusMetrics } from './services/metrics';

// Import revolutionary services
// import { ModelFlexibilityHub } from './services/ai/ModelFlexibilityHub';
// TODO: Uncomment and fix the path below if the file exists with a different name or location
// import { ModelFlexibilityHub } from './services/ai/ModelFlexibilityHub'; 
import { MultimodalConductor } from './services/ai/MultimodalConductor';
import { PermissionBasedAutoFix } from './services/ai/PermissionBasedAutoFix';
import { PersistentMemoryBank } from './services/ai/PersistentMemoryBank';
import { VisualTaskBreakdown } from './services/ai/VisualTaskBreakdown';
import { ComplianceAutomationEngine } from './services/compliance/ComplianceAutomationEngine';

const app = express();
const port = process.env.PORT || 3001;

// Initialize revolutionary services
const multimodalConductor = new MultimodalConductor();
const memoryBank = new PersistentMemoryBank();
const autoFixService = new PermissionBasedAutoFix();
const taskBreakdown = new VisualTaskBreakdown();
const complianceEngine = new ComplianceAutomationEngine();
const modelHub = new ModelFlexibilityHub();

// Make services available globally for routes
app.locals.services = {
  multimodalConductor,
  memoryBank,
  autoFixService,
  taskBreakdown,
  complianceEngine,
  modelHub
};

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

import { loggingMiddleware } from './middleware/logging';
app.use(loggingMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
// app.use('/api/pricing', pricingRoutes);
// app.use('/api/terminal', terminalRoutes);
// app.use('/api/credits', creditsRoutes);

// Revolutionary AI Services API Routes
app.post('/api/conductor/orchestrate', async (req, res) => {
  try {
    const { userId, input, mode, complianceLevel } = req.body;
    const result = await multimodalConductor.orchestrate(userId, input, mode, complianceLevel);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

app.post('/api/conductor/execute', async (req, res) => {
  try {
    const { orchestrationId, userId, approvedTasks } = req.body;
    const result = await multimodalConductor.execute(orchestrationId, userId, approvedTasks);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

app.post('/api/memory/store', async (req, res) => {
  try {
    const { userId, type, scope, title, content, context, metadata } = req.body;
    const memoryId = await memoryBank.storeMemory(userId, type, scope, title, content, context, metadata);
    res.json({ memoryId });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

app.post('/api/memory/retrieve', async (req, res) => {
  try {
    const memories = await memoryBank.retrieveMemories(req.body);
    res.json(memories);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

app.post('/api/autofix/analyze', async (req, res) => {
  try {
    const { userId, projectId, code, filePath, language } = req.body;
    const fixes = await autoFixService.analyzeAndProposeFixes(userId, projectId, code, filePath, language);
    res.json(fixes);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

app.post('/api/autofix/approve', async (req, res) => {
  try {
    const { fixRequestId, approverId, decision, reasoning } = req.body;
    const result = await autoFixService.submitApproval(fixRequestId, approverId, decision, reasoning);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

app.post('/api/tasks/breakdown', async (req, res) => {
  try {
    const { userId, projectId, input } = req.body;
    const taskGraph = await taskBreakdown.createTaskBreakdown(userId, projectId, input);
    res.json(taskGraph);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

app.get('/api/tasks/:graphId/mermaid', async (req, res) => {
  try {
    const graph = await taskBreakdown.getTaskGraph(req.params.graphId);
    if (!graph) {
      return res.status(404).json({ error: 'Task graph not found' });
    }
    const mermaidCode = taskBreakdown.generateMermaidDiagram(graph);
    res.json({ mermaidCode });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

app.post('/api/compliance/assess', async (req, res) => {
  try {
    const { organizationId, standards, scope } = req.body;
    const report = await complianceEngine.assessCompliance(organizationId, standards, scope);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

app.post('/api/compliance/remediate', async (req, res) => {
  try {
    const { violationId } = req.body;
    const result = await complianceEngine.autoRemediate(violationId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

app.get('/api/models', async (req, res) => {
  try {
    const models = await modelHub.getAvailableModels(req.query);
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

app.post('/api/models/execute', async (req, res) => {
  try {
    const { userId, request } = req.body;
    const result = await modelHub.executeModelRequest(userId, request);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

app.post('/api/models/byok', async (req, res) => {
  try {
    const { userId, config } = req.body;
    const configId = await modelHub.configureBYOK(userId, config);
    res.json({ configId });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

// Additional missing API endpoints
app.post('/api/memory/insights', async (req, res) => {
  try {
    const { userId, projectId } = req.body;
    const insights = await memoryBank.generateInsights(userId, projectId);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

app.get('/api/autofix/pending', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    const pending = await autoFixService.getPendingApprovals(userId);
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

app.post('/api/tasks/:graphId/update', async (req, res) => {
  try {
    const { graphId } = req.params;
    const { taskId, status, progress } = req.body;
    const updatedGraph = await taskBreakdown.updateTaskStatus(graphId, taskId, status, progress);
    res.json(updatedGraph);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

import stripeWebhook from './webhooks/stripe.webhook';
app.use('/api/webhook', stripeWebhook);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    metrics: getMetrics(),
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await getPrometheusMetrics();
    res.set('Content-Type', client.register.contentType);
    res.end(metrics);
  } catch (err) {
    const errorMessage = (err instanceof Error) ? err.message : String(err);
    res.status(500).end(`Error: ${errorMessage}`);
  }
});

// Swagger UI
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

if (process.env.NODE_ENV !== 'test') {
  try {
    const swaggerPath = path.resolve(__dirname, '../../docs/openapi.yaml');
    const swaggerFile = fs.readFileSync(swaggerPath, 'utf8');
    const swaggerDoc = yaml.load(swaggerFile) as object;
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  } catch (err) {
    console.log('Swagger docs not available', err instanceof Error ? err.message : String(err));
  }
}

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});

export default app;