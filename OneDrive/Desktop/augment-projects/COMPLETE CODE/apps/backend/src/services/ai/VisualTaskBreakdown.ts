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

  async createTaskBreakdown(userId: string, projectId: string, input: any): Promise<TaskGraph> {
    const request: BreakdownRequest = {
      userId,
      projectId,
      description: input.description || 'Task breakdown',
      requirements: input.requirements || [],
      constraints: input.constraints || [],
      preferredTechnologies: input.technologies || [],
      timeline: input.timeline,
      teamSize: input.teamSize || 1
    };

    return this.breakdownComplexTask(request);
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

  async getTaskGraph(graphId: string): Promise<TaskGraph | null> {
    return this.taskGraphs.get(graphId) || null;
  }

  async updateTaskStatus(graphId: string, taskId: string, status: string, progress?: number): Promise<TaskGraph | null> {
    const graph = this.taskGraphs.get(graphId);
    if (!graph) return null;

    const task = graph.nodes.find(n => n.id === taskId);
    if (!task) return null;

    task.status = status as any;
    task.updatedAt = new Date();

    // Recalculate completion percentage
    const completedTasks = graph.nodes.filter(n => n.status === 'completed').length;
    graph.completionPercentage = (completedTasks / graph.nodes.length) * 100;

    this.emit('taskStatusUpdated', {
      graphId,
      taskId,
      status,
      completionPercentage: graph.completionPercentage
    });

    return graph;
  }

  generateMermaidDiagram(graph: TaskGraph): string {
    let mermaid = 'graph TD\n';
    
    // Add nodes
    for (const node of graph.nodes) {
      const shape = this.getMermaidShape(node.type);
      const color = this.getMermaidColor(node.status);
      mermaid += `    ${node.id}[${node.title}]:::${color}\n`;
    }
    
    // Add edges
    for (const edge of graph.edges) {
      mermaid += `    ${edge.fromNodeId} --> ${edge.toNodeId}\n`;
    }
    
    // Add styles
    mermaid += `
    classDef pending fill:#f9f9f9,stroke:#333,stroke-width:2px
    classDef in_progress fill:#fff3cd,stroke:#856404,stroke-width:2px
    classDef completed fill:#d4edda,stroke:#155724,stroke-width:2px
    classDef blocked fill:#f8d7da,stroke:#721c24,stroke-width:2px
    `;
    
    return mermaid;
  }

  private async generateRawTasks(request: BreakdownRequest): Promise<any[]> {
    // Mock AI-powered task generation
    const mockTasks = [
      {
        title: 'Setup Project Structure',
        description: 'Initialize project with basic folder structure and configuration',
        type: 'development',
        priority: 'high',
        estimatedHours: 2,
        tags: ['setup', 'initialization']
      },
      {
        title: 'Implement Core Features',
        description: 'Develop main functionality based on requirements',
        type: 'development',
        priority: 'high',
        estimatedHours: 16,
        tags: ['core', 'features']
      },
      {
        title: 'Write Unit Tests',
        description: 'Create comprehensive unit tests for core functionality',
        type: 'testing',
        priority: 'medium',
        estimatedHours: 8,
        tags: ['testing', 'unit-tests']
      },
      {
        title: 'Integration Testing',
        description: 'Test integration between different components',
        type: 'testing',
        priority: 'medium',
        estimatedHours: 4,
        tags: ['testing', 'integration']
      },
      {
        title: 'Documentation',
        description: 'Write user and developer documentation',
        type: 'documentation',
        priority: 'low',
        estimatedHours: 6,
        tags: ['docs', 'documentation']
      },
      {
        title: 'Code Review',
        description: 'Review code for quality and best practices',
        type: 'review',
        priority: 'medium',
        estimatedHours: 3,
        tags: ['review', 'quality']
      },
      {
        title: 'Deployment Setup',
        description: 'Configure deployment pipeline and environment',
        type: 'deployment',
        priority: 'high',
        estimatedHours: 4,
        tags: ['deployment', 'devops']
      }
    ];

    return mockTasks;
  }

  private async buildTaskGraph(graphId: string, request: BreakdownRequest, rawTasks: any[]): Promise<TaskGraph> {
    const nodes: TaskNode[] = [];
    const edges: TaskEdge[] = [];

    // Create nodes
    for (let i = 0; i < rawTasks.length; i++) {
      const task = rawTasks[i];
      const nodeId = `task_${i + 1}`;
      
      const node: TaskNode = {
        id: nodeId,
        title: task.title,
        description: task.description,
        type: task.type,
        status: 'pending',
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        dependencies: [],
        tags: task.tags,
        metadata: {},
        position: { x: 0, y: 0, z: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      nodes.push(node);
    }

    // Create dependencies (simplified logic)
    const setupTask = nodes.find(n => n.title.includes('Setup'));
    const coreTask = nodes.find(n => n.title.includes('Core'));
    const testTasks = nodes.filter(n => n.type === 'testing');
    const reviewTask = nodes.find(n => n.type === 'review');
    const deployTask = nodes.find(n => n.type === 'deployment');

    if (setupTask && coreTask) {
      coreTask.dependencies.push(setupTask.id);
      edges.push({
        id: `edge_${setupTask.id}_${coreTask.id}`,
        fromNodeId: setupTask.id,
        toNodeId: coreTask.id,
        type: 'dependency',
        weight: 1
      });
    }

    if (coreTask && testTasks.length > 0) {
      testTasks.forEach(testTask => {
        testTask.dependencies.push(coreTask.id);
        edges.push({
          id: `edge_${coreTask.id}_${testTask.id}`,
          fromNodeId: coreTask.id,
          toNodeId: testTask.id,
          type: 'dependency',
          weight: 1
        });
      });
    }

    if (reviewTask && testTasks.length > 0) {
      testTasks.forEach(testTask => {
        reviewTask.dependencies.push(testTask.id);
        edges.push({
          id: `edge_${testTask.id}_${reviewTask.id}`,
          fromNodeId: testTask.id,
          toNodeId: reviewTask.id,
          type: 'dependency',
          weight: 1
        });
      });
    }

    if (deployTask && reviewTask) {
      deployTask.dependencies.push(reviewTask.id);
      edges.push({
        id: `edge_${reviewTask.id}_${deployTask.id}`,
        fromNodeId: reviewTask.id,
        toNodeId: deployTask.id,
        type: 'dependency',
        weight: 1
      });
    }

    const estimatedTotalHours = nodes.reduce((sum, node) => sum + node.estimatedHours, 0);

    return {
      id: graphId,
      userId: request.userId,
      projectId: request.projectId,
      title: `Task Breakdown: ${request.description}`,
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
    // Simple optimization - sort by priority and dependencies
    graph.nodes.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });

    return graph;
  }

  private async calculateCriticalPath(graph: TaskGraph): Promise<TaskGraph> {
    // Simplified critical path calculation
    const criticalPath: string[] = [];
    const visited = new Set<string>();
    
    // Find the longest path through the graph
    const findLongestPath = (nodeId: string, currentPath: string[], currentDuration: number): { path: string[], duration: number } => {
      if (visited.has(nodeId)) {
        return { path: currentPath, duration: currentDuration };
      }
      
      visited.add(nodeId);
      const node = graph.nodes.find(n => n.id === nodeId);
      if (!node) return { path: currentPath, duration: currentDuration };
      
      const newPath = [...currentPath, nodeId];
      const newDuration = currentDuration + node.estimatedHours;
      
      // Find dependent tasks
      const dependentEdges = graph.edges.filter(e => e.fromNodeId === nodeId);
      if (dependentEdges.length === 0) {
        return { path: newPath, duration: newDuration };
      }
      
      let longestPath = { path: newPath, duration: newDuration };
      for (const edge of dependentEdges) {
        const result = findLongestPath(edge.toNodeId, newPath, newDuration);
        if (result.duration > longestPath.duration) {
          longestPath = result;
        }
      }
      
      return longestPath;
    };
    
    // Start from nodes with no dependencies
    const startNodes = graph.nodes.filter(node => node.dependencies.length === 0);
    let longestOverallPath = { path: [], duration: 0 };
    
    for (const startNode of startNodes) {
      visited.clear();
      const result = findLongestPath(startNode.id, [], 0);
      if (result.duration > longestOverallPath.duration) {
        longestOverallPath = result as any;
      }
    }
    
    graph.criticalPath = longestOverallPath.path;
    return graph;
  }

  private async generate3DPositions(graph: TaskGraph): Promise<void> {
    // Simple 3D layout algorithm
    const layers: { [key: number]: TaskNode[] } = {};
    
    // Group nodes by dependency level
    for (const node of graph.nodes) {
      const level = this.calculateNodeLevel(node, graph);
      if (!layers[level]) layers[level] = [];
      layers[level].push(node);
    }
    
    // Position nodes in 3D space
    Object.keys(layers).forEach((levelStr, levelIndex) => {
      const level = parseInt(levelStr);
      const nodesInLevel = layers[level];
      const angleStep = (2 * Math.PI) / nodesInLevel.length;
      
      nodesInLevel.forEach((node, nodeIndex) => {
        const angle = nodeIndex * angleStep;
        const radius = 100 + level * 50;
        
        node.position = {
          x: Math.cos(angle) * radius,
          y: levelIndex * 100,
          z: Math.sin(angle) * radius
        };
      });
    });
  }

  private calculateNodeLevel(node: TaskNode, graph: TaskGraph): number {
    if (node.dependencies.length === 0) return 0;
    
    let maxLevel = 0;
    for (const depId of node.dependencies) {
      const depNode = graph.nodes.find(n => n.id === depId);
      if (depNode) {
        const depLevel = this.calculateNodeLevel(depNode, graph);
        maxLevel = Math.max(maxLevel, depLevel + 1);
      }
    }
    
    return maxLevel;
  }

  private getMermaidShape(type: string): string {
    switch (type) {
      case 'development': return '[]';
      case 'testing': return '{}';
      case 'deployment': return '()';
      case 'documentation': return '<>';
      case 'review': return '(())';
      default: return '[]';
    }
  }

  private getMermaidColor(status: string): string {
    switch (status) {
      case 'pending': return 'pending';
      case 'in_progress': return 'in_progress';
      case 'completed': return 'completed';
      case 'blocked': return 'blocked';
      default: return 'pending';
    }
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
            description: request.description
          })
        }
      });
    } catch (error) {
      console.error('Failed to log task breakdown:', error);
    }
  }
}
