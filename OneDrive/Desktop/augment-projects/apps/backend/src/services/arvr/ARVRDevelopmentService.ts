import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';

interface ARVRProject {
  id: string;
  userId: string;
  name: string;
  type: 'AR' | 'VR' | 'Mixed';
  platform: 'WebXR' | 'Unity' | 'Unreal' | 'Native';
  scene: ARVRScene;
  assets: ARVRAsset[];
  collaborators: string[];
  status: 'draft' | 'testing' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

interface ARVRScene {
  id: string;
  name: string;
  environment: Environment;
  objects: SceneObject[];
  lighting: LightingSetup;
  physics: PhysicsSettings;
  interactions: Interaction[];
  animations: Animation[];
}

interface Environment {
  type: 'skybox' | 'hdri' | 'procedural';
  settings: {
    skyboxTexture?: string;
    hdriPath?: string;
    proceduralSettings?: {
      timeOfDay: number;
      weather: 'clear' | 'cloudy' | 'rainy' | 'foggy';
      terrain: 'flat' | 'hills' | 'mountains' | 'urban';
    };
  };
}

interface SceneObject {
  id: string;
  name: string;
  type: '3d_model' | 'primitive' | 'text' | 'ui_element' | 'particle_system';
  transform: Transform;
  properties: ObjectProperties;
  components: Component[];
  children: SceneObject[];
}

interface Transform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
}

interface ObjectProperties {
  visible: boolean;
  castShadows: boolean;
  receiveShadows: boolean;
  material?: MaterialSettings;
  collider?: ColliderSettings;
}

interface MaterialSettings {
  type: 'standard' | 'pbr' | 'unlit' | 'custom';
  albedo: string;
  metallic: number;
  roughness: number;
  emission: string;
  normal?: string;
  occlusion?: string;
}

interface ColliderSettings {
  type: 'box' | 'sphere' | 'capsule' | 'mesh';
  isTrigger: boolean;
  physicsMaterial?: string;
}

interface Component {
  id: string;
  type: string;
  properties: Record<string, any>;
  enabled: boolean;
}

interface LightingSetup {
  ambientLight: {
    color: string;
    intensity: number;
  };
  directionalLights: DirectionalLight[];
  pointLights: PointLight[];
  spotLights: SpotLight[];
  environmentLighting: {
    enabled: boolean;
    hdriPath?: string;
    intensity: number;
  };
}

interface DirectionalLight {
  id: string;
  color: string;
  intensity: number;
  direction: { x: number; y: number; z: number };
  castShadows: boolean;
}

interface PointLight {
  id: string;
  color: string;
  intensity: number;
  position: { x: number; y: number; z: number };
  range: number;
  castShadows: boolean;
}

interface SpotLight {
  id: string;
  color: string;
  intensity: number;
  position: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  angle: number;
  range: number;
  castShadows: boolean;
}

interface PhysicsSettings {
  enabled: boolean;
  gravity: { x: number; y: number; z: number };
  timeStep: number;
  iterations: number;
}

interface Interaction {
  id: string;
  name: string;
  trigger: InteractionTrigger;
  actions: InteractionAction[];
  conditions?: InteractionCondition[];
}

interface InteractionTrigger {
  type: 'gaze' | 'touch' | 'gesture' | 'voice' | 'proximity' | 'timer';
  settings: Record<string, any>;
}

interface InteractionAction {
  type: 'move' | 'rotate' | 'scale' | 'animate' | 'sound' | 'script' | 'teleport';
  target: string;
  parameters: Record<string, any>;
}

interface InteractionCondition {
  type: 'object_state' | 'user_position' | 'time' | 'custom';
  parameters: Record<string, any>;
}

interface Animation {
  id: string;
  name: string;
  target: string;
  type: 'transform' | 'material' | 'custom';
  keyframes: Keyframe[];
  duration: number;
  loop: boolean;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

interface Keyframe {
  time: number;
  value: any;
  interpolation: 'linear' | 'bezier' | 'step';
}

interface ARVRAsset {
  id: string;
  name: string;
  type: '3d_model' | 'texture' | 'audio' | 'video' | 'script';
  url: string;
  metadata: {
    size: number;
    format: string;
    dimensions?: { width: number; height: number; depth?: number };
    duration?: number;
  };
}

interface ARVRSession {
  id: string;
  projectId: string;
  userId: string;
  type: 'preview' | 'test' | 'collaboration';
  status: 'active' | 'paused' | 'ended';
  startTime: Date;
  endTime?: Date;
  participants: SessionParticipant[];
  metrics: SessionMetrics;
}

interface SessionParticipant {
  userId: string;
  role: 'owner' | 'collaborator' | 'viewer';
  avatar: {
    model: string;
    position: Transform;
    animations: string[];
  };
  devices: {
    headset?: string;
    controllers: string[];
    tracking: 'inside-out' | 'outside-in' | 'none';
  };
}

interface SessionMetrics {
  duration: number;
  frameRate: number[];
  latency: number[];
  interactions: number;
  errors: string[];
}

export class ARVRDevelopmentService extends EventEmitter {
  private projects: Map<string, ARVRProject> = new Map();
  private sessions: Map<string, ARVRSession> = new Map();
  private wsServer: WebSocket.Server | null = null;
  private collaborationRooms: Map<string, Set<WebSocket>> = new Map();

  constructor() {
    super();
    this.initializeWebSocketServer();
  }

  private initializeWebSocketServer() {
    this.wsServer = new WebSocket.Server({ port: 8080 });
    
    this.wsServer.on('connection', (ws: WebSocket) => {
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.handleWebSocketDisconnection(ws);
      });
    });
  }

  // Project Management
  async createProject(userId: string, name: string, type: 'AR' | 'VR' | 'Mixed', platform: string): Promise<string> {
    const projectId = uuidv4();
    const project: ARVRProject = {
      id: projectId,
      userId,
      name,
      type,
      platform: platform as any,
      scene: this.createDefaultScene(),
      assets: [],
      collaborators: [],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.projects.set(projectId, project);
    this.emit('projectCreated', project);

    return projectId;
  }

  private createDefaultScene(): ARVRScene {
    return {
      id: uuidv4(),
      name: 'Main Scene',
      environment: {
        type: 'skybox',
        settings: {
          skyboxTexture: 'default_sky.hdr'
        }
      },
      objects: [
        {
          id: uuidv4(),
          name: 'Ground',
          type: 'primitive',
          transform: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 10, y: 0.1, z: 10 }
          },
          properties: {
            visible: true,
            castShadows: false,
            receiveShadows: true,
            material: {
              type: 'standard',
              albedo: '#808080',
              metallic: 0,
              roughness: 0.8,
              emission: '#000000'
            },
            collider: {
              type: 'box',
              isTrigger: false
            }
          },
          components: [],
          children: []
        }
      ],
      lighting: {
        ambientLight: {
          color: '#404040',
          intensity: 0.3
        },
        directionalLights: [
          {
            id: uuidv4(),
            color: '#ffffff',
            intensity: 1.0,
            direction: { x: -0.3, y: -1, z: -0.3 },
            castShadows: true
          }
        ],
        pointLights: [],
        spotLights: [],
        environmentLighting: {
          enabled: true,
          intensity: 1.0
        }
      },
      physics: {
        enabled: true,
        gravity: { x: 0, y: -9.81, z: 0 },
        timeStep: 0.016,
        iterations: 6
      },
      interactions: [],
      animations: []
    };
  }

  // Scene Editing
  async addSceneObject(projectId: string, object: Omit<SceneObject, 'id'>): Promise<string> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const objectId = uuidv4();
    const sceneObject: SceneObject = {
      ...object,
      id: objectId
    };

    project.scene.objects.push(sceneObject);
    project.updatedAt = new Date();

    this.emit('objectAdded', { projectId, object: sceneObject });
    this.broadcastToCollaborators(projectId, {
      type: 'object_added',
      data: sceneObject
    });

    return objectId;
  }

  async updateSceneObject(projectId: string, objectId: string, updates: Partial<SceneObject>): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const objectIndex = project.scene.objects.findIndex(obj => obj.id === objectId);
    if (objectIndex === -1) {
      throw new Error('Object not found');
    }

    project.scene.objects[objectIndex] = {
      ...project.scene.objects[objectIndex],
      ...updates
    };
    project.updatedAt = new Date();

    this.emit('objectUpdated', { projectId, objectId, updates });
    this.broadcastToCollaborators(projectId, {
      type: 'object_updated',
      data: { objectId, updates }
    });
  }

  async deleteSceneObject(projectId: string, objectId: string): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    project.scene.objects = project.scene.objects.filter(obj => obj.id !== objectId);
    project.updatedAt = new Date();

    this.emit('objectDeleted', { projectId, objectId });
    this.broadcastToCollaborators(projectId, {
      type: 'object_deleted',
      data: { objectId }
    });
  }

  // Asset Management
  async uploadAsset(projectId: string, file: any, metadata: any): Promise<string> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const assetId = uuidv4();
    const asset: ARVRAsset = {
      id: assetId,
      name: file.name,
      type: this.determineAssetType(file.name),
      url: `/assets/${projectId}/${assetId}`,
      metadata: {
        size: file.size,
        format: file.type,
        ...metadata
      }
    };

    project.assets.push(asset);
    project.updatedAt = new Date();

    // In a real implementation, you would upload the file to cloud storage
    this.emit('assetUploaded', { projectId, asset });

    return assetId;
  }

  private determineAssetType(filename: string): ARVRAsset['type'] {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    if (['gltf', 'glb', 'fbx', 'obj'].includes(ext || '')) return '3d_model';
    if (['jpg', 'jpeg', 'png', 'webp', 'hdr'].includes(ext || '')) return 'texture';
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) return 'audio';
    if (['mp4', 'webm'].includes(ext || '')) return 'video';
    if (['js', 'ts'].includes(ext || '')) return 'script';
    
    return 'texture';
  }

  // Interaction System
  async addInteraction(projectId: string, interaction: Omit<Interaction, 'id'>): Promise<string> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const interactionId = uuidv4();
    const newInteraction: Interaction = {
      ...interaction,
      id: interactionId
    };

    project.scene.interactions.push(newInteraction);
    project.updatedAt = new Date();

    this.emit('interactionAdded', { projectId, interaction: newInteraction });
    return interactionId;
  }

  // Animation System
  async createAnimation(projectId: string, animation: Omit<Animation, 'id'>): Promise<string> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const animationId = uuidv4();
    const newAnimation: Animation = {
      ...animation,
      id: animationId
    };

    project.scene.animations.push(newAnimation);
    project.updatedAt = new Date();

    this.emit('animationCreated', { projectId, animation: newAnimation });
    return animationId;
  }

  // Real-time Collaboration
  async startCollaborationSession(projectId: string, userId: string): Promise<string> {
    const sessionId = uuidv4();
    const session: ARVRSession = {
      id: sessionId,
      projectId,
      userId,
      type: 'collaboration',
      status: 'active',
      startTime: new Date(),
      participants: [],
      metrics: {
        duration: 0,
        frameRate: [],
        latency: [],
        interactions: 0,
        errors: []
      }
    };

    this.sessions.set(sessionId, session);
    this.collaborationRooms.set(sessionId, new Set());

    this.emit('collaborationStarted', session);
    return sessionId;
  }

  private handleWebSocketMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case 'join_collaboration':
        this.handleJoinCollaboration(ws, data);
        break;
      case 'transform_update':
        this.handleTransformUpdate(ws, data);
        break;
      case 'voice_chat':
        this.handleVoiceChat(ws, data);
        break;
      case 'gesture_data':
        this.handleGestureData(ws, data);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private handleJoinCollaboration(ws: WebSocket, data: any): void {
    const { sessionId, userId, avatar, devices } = data;
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
      return;
    }

    const participant: SessionParticipant = {
      userId,
      role: userId === session.userId ? 'owner' : 'collaborator',
      avatar,
      devices
    };

    session.participants.push(participant);
    
    const room = this.collaborationRooms.get(sessionId);
    if (room) {
      room.add(ws);
      
      // Notify other participants
      this.broadcastToRoom(sessionId, {
        type: 'participant_joined',
        data: participant
      }, ws);
    }

    ws.send(JSON.stringify({
      type: 'collaboration_joined',
      data: { sessionId, participants: session.participants }
    }));
  }

  private handleTransformUpdate(ws: WebSocket, data: any): void {
    const { sessionId, objectId, transform } = data;
    
    this.broadcastToRoom(sessionId, {
      type: 'transform_updated',
      data: { objectId, transform }
    }, ws);
  }

  private handleVoiceChat(ws: WebSocket, data: any): void {
    const { sessionId, audioData } = data;
    
    this.broadcastToRoom(sessionId, {
      type: 'voice_data',
      data: { userId: data.userId, audioData }
    }, ws);
  }

  private handleGestureData(ws: WebSocket, data: any): void {
    const { sessionId, gestureData } = data;
    
    this.broadcastToRoom(sessionId, {
      type: 'gesture_data',
      data: gestureData
    }, ws);
  }

  private handleWebSocketDisconnection(ws: WebSocket): void {
    // Remove from all collaboration rooms
    for (const [sessionId, room] of this.collaborationRooms.entries()) {
      if (room.has(ws)) {
        room.delete(ws);
        
        this.broadcastToRoom(sessionId, {
          type: 'participant_left',
          data: { timestamp: new Date() }
        });
        
        if (room.size === 0) {
          this.collaborationRooms.delete(sessionId);
        }
      }
    }
  }

  private broadcastToCollaborators(projectId: string, message: any): void {
    // Find active collaboration sessions for this project
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.projectId === projectId && session.status === 'active') {
        this.broadcastToRoom(sessionId, message);
      }
    }
  }

  private broadcastToRoom(sessionId: string, message: any, exclude?: WebSocket): void {
    const room = this.collaborationRooms.get(sessionId);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    
    for (const ws of room) {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    }
  }

  // Testing and Preview
  async startPreviewSession(projectId: string, userId: string, device: string): Promise<string> {
    const sessionId = uuidv4();
    const session: ARVRSession = {
      id: sessionId,
      projectId,
      userId,
      type: 'preview',
      status: 'active',
      startTime: new Date(),
      participants: [{
        userId,
        role: 'owner',
        avatar: {
          model: 'default_avatar',
          position: {
            position: { x: 0, y: 1.7, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 }
          },
          animations: []
        },
        devices: {
          headset: device,
          controllers: [],
          tracking: 'inside-out'
        }
      }],
      metrics: {
        duration: 0,
        frameRate: [],
        latency: [],
        interactions: 0,
        errors: []
      }
    };

    this.sessions.set(sessionId, session);
    this.emit('previewStarted', session);

    return sessionId;
  }

  // Publishing and Deployment
  async publishProject(projectId: string, platform: string, settings: any): Promise<{
    buildId: string;
    deploymentUrl: string;
    status: string;
  }> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const buildId = uuidv4();
    
    // Simulate build process
    await new Promise(resolve => setTimeout(resolve, 5000));

    project.status = 'published';
    project.updatedAt = new Date();

    const deploymentUrl = `https://arvr.crucibleai.com/projects/${projectId}`;

    this.emit('projectPublished', {
      projectId,
      buildId,
      deploymentUrl,
      platform
    });

    return {
      buildId,
      deploymentUrl,
      status: 'published'
    };
  }

  // Utility Methods
  async getProject(projectId: string): Promise<ARVRProject | undefined> {
    return this.projects.get(projectId);
  }

  async getUserProjects(userId: string): Promise<ARVRProject[]> {
    return Array.from(this.projects.values())
      .filter(project => project.userId === userId || project.collaborators.includes(userId));
  }

  async getSession(sessionId: string): Promise<ARVRSession | undefined> {
    return this.sessions.get(sessionId);
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'ended';
      session.endTime = new Date();
      session.metrics.duration = session.endTime.getTime() - session.startTime.getTime();
      
      this.emit('sessionEnded', session);
      
      // Clean up collaboration room
      this.collaborationRooms.delete(sessionId);
    }
  }
}
