import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';

export interface TaskNode {
  id: string;
  title: string;
  description: string;
  type: 'development' | 'testing' | 'deployment' | 'documentation' | 'review';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  actualHours?: number;
  dependencies: string[]; // IDs of tasks this depends on
  assignee?: string;
  tags: string[];
  metadata: any;
  position: {
    x: number;
    y: number;
    z?: number; // For 3D visualization
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskGraph {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  description: string;
  nodes: TaskNode[];
  edges: TaskEdge[];
  criticalPath: string[];
  estimatedTotalHours: number;
  actualTotalHours: number;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: 'dependency' | 'sequence' | 'parallel';
  weight: number; // For optimization algorithms
}

export interface BreakdownRequest {
  userId: string;
  projectId?: string;
  description: string;
  requirements: string[];
  constraints: string[];
  preferredTechnologies: string[];
  timeline?: string;
  teamSize?: number;
}

export class VisualTaskBreakdown extends EventEmitter {
  private prisma: PrismaClient;
  private taskGraphs: Map<string, TaskGraph> = new Map();

  constructor() {
    super();
    this.prisma = new PrismaClient();
  }

  async breakdownComplexTask(request: BreakdownRequest): Promise<TaskGraph> {
    const graphId = `graph_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Step 1: AI-powered task decomposition
    const rawTasks = await this.generateRawTasks(request);
    
    // Step 2: Build dependency graph
    const taskGraph = await this.buildTaskGraph(graphId, request, rawTasks);
    
    // Step 3: Optimize task ordering
    const optimizedGraph = await this.optimizeTaskGraph(taskGraph);
    
    // Step 4: Calculate critical path
    const finalGraph = await this.calculateCriticalPath(optimizedGraph);
    
    // Step 5: Generate 3D positions for visualization
    await this.generate3DPositions(finalGraph);
    
    // Store the graph
    this.taskGraphs.set(graphId, finalGraph);
    
    // Log the breakdown
    await this.logTaskBreakdown(request, finalGraph);
    
    this.emit('taskGraphCreated', {
      graphId,
      userId: request.userId,
      nodeCount: finalGraph.nodes.length,
      estimatedHours: finalGraph.estimatedTotalHours
    });
    
    return finalGraph;
  }

  private async generateRawTasks(request: BreakdownRequest): Promise<Partial<TaskNode>[]> {
    // Mock AI-powered task generation - in production, use actual AI
    const tasks: Partial<TaskNode>[] = [];
    
    // Analyze the description and requirements to generate tasks
    const taskTypes = this.identifyTaskTypes(request);
    
    for (const taskType of taskTypes) {
      switch (taskType) {
        case 'setup':
          tasks.push({
            title: 'Project Setup',
            description: 'Initialize project structure and dependencies',
            type: 'development',
            priority: 'high',
            estimatedHours: 4,
            tags: ['setup', 'initialization']
          });
          break;
          
        case 'database':
          tasks.push({
            title: 'Database Design',
            description: 'Design and implement database schema',
            type: 'development',
            priority: 'high',
            estimatedHours: 8,
            tags: ['database', 'schema']
          });
          break;
          
        case 'api':
          tasks.push({
            title: 'API Development',
            description: 'Implement REST API endpoints',
            type: 'development',
            priority: 'medium',
            estimatedHours: 16,
            tags: ['api', 'backend']
          });
          break;
          
        case 'frontend':
          tasks.push({
            title: 'Frontend Implementation',
            description: 'Build user interface components',
            type: 'development',
            priority: 'medium',
            estimatedHours: 20,
            tags: ['frontend', 'ui']
          });
          break;
          
        case 'testing':
          tasks.push({
            title: 'Unit Testing',
            description: 'Write and execute unit tests',
            type: 'testing',
            priority: 'medium',
            estimatedHours: 12,
            tags: ['testing', 'quality']
          });
          break;
          
        case 'deployment':
          tasks.push({
            title: 'Deployment Setup',
            description: 'Configure deployment pipeline',
            type: 'deployment',
            priority: 'low',
            estimatedHours: 6,
            tags: ['deployment', 'devops']
          });
          break;
      }
    }
    
    return tasks;
  }

  private identifyTaskTypes(request: BreakdownRequest): string[] {
    const types: string[] = ['setup'];
    
    const description = request.description.toLowerCase();
    const requirements = request.requirements.join(' ').toLowerCase();
    
    if (description.includes('database') || requirements.includes('data')) {
      types.push('database');
    }
    
    if (description.includes('api') || requirements.includes('endpoint')) {
      types.push('api');
    }
    
    if (description.includes('frontend') || description.includes('ui') || requirements.includes('interface')) {
      types.push('frontend');
    }
    
    if (description.includes('test') || requirements.includes('quality')) {
      types.push('testing');
    }
    
    if (description.includes('deploy') || requirements.includes('production')) {
      types.push('deployment');
    }
    
    return types;
  }

  private async buildTaskGraph(
    graphId: string,
    request: BreakdownRequest,
    rawTasks: Partial<TaskNode>[]
  ): Promise<TaskGraph> {
    const nodes: TaskNode[] = [];
    const edges: TaskEdge[] = [];
    
    // Create task nodes
    for (let i = 0; i < rawTasks.length; i++) {
      const rawTask = rawTasks[i];
      const nodeId = `task_${i + 1}`;
      
      const node: TaskNode = {
        id: nodeId,
        title: rawTask.title || `Task ${i + 1}`,
        description: rawTask.description || '',
        type: rawTask.type || 'development',
        status: 'pending',
        priority: rawTask.priority || 'medium',
        estimatedHours: rawTask.estimatedHours || 8,
        dependencies: [],
        tags: rawTask.tags || [],
        metadata: {},
        position: { x: 0, y: 0, z: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      nodes.push(node);
    }
    
    // Create dependencies based on task types
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      
      // Setup tasks come first
      if (node.type === 'development' && node.tags.includes('setup')) {
        // No dependencies
      }
      // Database comes after setup
      else if (node.tags.includes('database')) {
        const setupTask = nodes.find(n => n.tags.includes('setup'));
        if (setupTask) {
          node.dependencies.push(setupTask.id);
          edges.push({
            id: `edge_${setupTask.id}_${node.id}`,
            fromNodeId: setupTask.id,
            toNodeId: node.id,
            type: 'dependency',
            weight: 1
          });
        }
      }
      // API comes after database
      else if (node.tags.includes('api')) {
        const dbTask = nodes.find(n => n.tags.includes('database'));
        if (dbTask) {
          node.dependencies.push(dbTask.id);
          edges.push({
            id: `edge_${dbTask.id}_${node.id}`,
            fromNodeId: dbTask.id,
            toNodeId: node.id,
            type: 'dependency',
            weight: 1
          });
        }
      }
      // Frontend can start after API
      else if (node.tags.includes('frontend')) {
        const apiTask = nodes.find(n => n.tags.includes('api'));
        if (apiTask) {
          node.dependencies.push(apiTask.id);
          edges.push({
            id: `edge_${apiTask.id}_${node.id}`,
            fromNodeId: apiTask.id,
            toNodeId: node.id,
            type: 'dependency',
            weight: 1
          });
        }
      }
      // Testing comes after development tasks
      else if (node.type === 'testing') {
        const devTasks = nodes.filter(n => n.type === 'development' && !n.tags.includes('setup'));
        for (const devTask of devTasks) {
          node.dependencies.push(devTask.id);
          edges.push({
            id: `edge_${devTask.id}_${node.id}`,
            fromNodeId: devTask.id,
            toNodeId: node.id,
            type: 'dependency',
            weight: 1
          });
        }
      }
      // Deployment comes last
      else if (node.type === 'deployment') {
        const testTask = nodes.find(n => n.type === 'testing');
        if (testTask) {
          node.dependencies.push(testTask.id);
          edges.push({
            id: `edge_${testTask.id}_${node.id}`,
            fromNodeId: testTask.id,
            toNodeId: node.id,
            type: 'dependency',
            weight: 1
          });
        }
      }
    }
    
    const estimatedTotalHours = nodes.reduce((sum, node) => sum + node.estimatedHours, 0);
    
    return {
      id: graphId,
      userId: request.userId,
      projectId: request.projectId,
      title: `Task Breakdown: ${request.description.substring(0, 50)}...`,
      description: request.description,
      nodes,
      edges,
      criticalPath: [],
      estimatedTotalHours,
      actualTotalHours: 0,
      completionPercentage: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async optimizeTaskGraph(graph: TaskGraph): Promise<TaskGraph> {
    // Simple optimization - in production, use more sophisticated algorithms
    // Sort nodes by priority and dependencies
    const optimizedNodes = [...graph.nodes].sort((a, b) => {
      // Higher priority first
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Fewer dependencies first
      return a.dependencies.length - b.dependencies.length;
    });
    
    return {
      ...graph,
      nodes: optimizedNodes,
      updatedAt: new Date()
    };
  }

  private async calculateCriticalPath(graph: TaskGraph): Promise<TaskGraph> {
    // Simple critical path calculation
    const criticalPath: string[] = [];
    const nodeMap = new Map(graph.nodes.map(node => [node.id, node]));
    
    // Find the longest path through the graph
    const visited = new Set<string>();
    const longestPath = this.findLongestPath(graph.nodes[0]?.id, nodeMap, visited, graph.edges);
    
    return {
      ...graph,
      criticalPath: longestPath,
      updatedAt: new Date()
    };
  }

  private findLongestPath(
    nodeId: string,
    nodeMap: Map<string, TaskNode>,
    visited: Set<string>,
    edges: TaskEdge[]
  ): string[] {
    if (!nodeId || visited.has(nodeId)) return [];
    
    visited.add(nodeId);
    const node = nodeMap.get(nodeId);
    if (!node) return [];
    
    let longestPath = [nodeId];
    let maxLength = node.estimatedHours;
    
    // Find all outgoing edges
    const outgoingEdges = edges.filter(edge => edge.fromNodeId === nodeId);
    
    for (const edge of outgoingEdges) {
      const subPath = this.findLongestPath(edge.toNodeId, nodeMap, new Set(visited), edges);
      const subLength = subPath.reduce((sum, id) => {
        const n = nodeMap.get(id);
        return sum + (n?.estimatedHours || 0);
      }, 0);
      
      if (node.estimatedHours + subLength > maxLength) {
        maxLength = node.estimatedHours + subLength;
        longestPath = [nodeId, ...subPath];
      }
    }
    
    return longestPath;
  }

  private async generate3DPositions(graph: TaskGraph): Promise<void> {
    // Generate 3D positions for visualization
    const layers = this.calculateLayers(graph);
    
    layers.forEach((layer, layerIndex) => {
      layer.forEach((nodeId, nodeIndex) => {
        const node = graph.nodes.find(n => n.id === nodeId);
        if (node) {
          node.position = {
            x: (nodeIndex - layer.length / 2) * 200,
            y: layerIndex * 150,
            z: 0
          };
        }
      });
    });
  }

  private calculateLayers(graph: TaskGraph): string[][] {
    const layers: string[][] = [];
    const processed = new Set<string>();
    const nodeMap = new Map(graph.nodes.map(node => [node.id, node]));
    
    // Start with nodes that have no dependencies
    let currentLayer = graph.nodes
      .filter(node => node.dependencies.length === 0)
      .map(node => node.id);
    
    while (currentLayer.length > 0) {
      layers.push([...currentLayer]);
      currentLayer.forEach(nodeId => processed.add(nodeId));
      
      // Find next layer - nodes whose dependencies are all processed
      const nextLayer = graph.nodes
        .filter(node => 
          !processed.has(node.id) &&
          node.dependencies.every(depId => processed.has(depId))
        )
        .map(node => node.id);
      
      currentLayer = nextLayer;
    }
    
    return layers;
  }

  private async logTaskBreakdown(request: BreakdownRequest, graph: TaskGraph): Promise<void> {
    try {
      await this.prisma.auditLogEntry.create({
        data: {
          eventId: `task_breakdown_${graph.id}`,
          action: 'task_breakdown_created',
          userId: request.userId,
          data: JSON.stringify({
            graphId: graph.id,
            nodeCount: graph.nodes.length,
            estimatedHours: graph.estimatedTotalHours,
            criticalPathLength: graph.criticalPath.length
          })
        }
      });
    } catch (error) {
      console.error('Failed to log task breakdown:', error);
    }
  }

  async getTaskGraph(graphId: string): Promise<TaskGraph | undefined> {
    return this.taskGraphs.get(graphId);
  }

  async updateTaskStatus(graphId: string, taskId: string, status: TaskNode['status']): Promise<boolean> {
    const graph = this.taskGraphs.get(graphId);
    if (!graph) return false;
    
    const task = graph.nodes.find(node => node.id === taskId);
    if (!task) return false;
    
    task.status = status;
    task.updatedAt = new Date();
    
    // Recalculate completion percentage
    const completedTasks = graph.nodes.filter(node => node.status === 'completed').length;
    graph.completionPercentage = (completedTasks / graph.nodes.length) * 100;
    
    this.emit('taskStatusUpdated', {
      graphId,
      taskId,
      status,
      completionPercentage: graph.completionPercentage
    });
    
    return true;
  }
}
