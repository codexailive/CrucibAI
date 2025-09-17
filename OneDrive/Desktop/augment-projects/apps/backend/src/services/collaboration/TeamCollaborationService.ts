import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';

interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: TeamMember[];
  projects: string[];
  settings: TeamSettings;
  createdAt: Date;
  updatedAt: Date;
}

interface TeamMember {
  userId: string;
  role: 'owner' | 'admin' | 'developer' | 'designer' | 'viewer';
  permissions: Permission[];
  joinedAt: Date;
  lastActive: Date;
  status: 'active' | 'inactive' | 'pending';
}

interface Permission {
  resource: 'project' | 'deployment' | 'settings' | 'members' | 'billing';
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

interface TeamSettings {
  visibility: 'private' | 'public';
  allowInvites: boolean;
  requireApproval: boolean;
  defaultRole: TeamMember['role'];
  integrations: Integration[];
  notifications: NotificationSettings;
}

interface Integration {
  id: string;
  type: 'slack' | 'discord' | 'github' | 'jira' | 'trello';
  settings: Record<string, any>;
  enabled: boolean;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  slack: boolean;
  discord: boolean;
  events: NotificationEvent[];
}

interface NotificationEvent {
  type: string;
  enabled: boolean;
  channels: ('email' | 'push' | 'slack' | 'discord')[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  teamId: string;
  ownerId: string;
  collaborators: ProjectCollaborator[];
  status: 'active' | 'archived' | 'deleted';
  visibility: 'private' | 'team' | 'public';
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectCollaborator {
  userId: string;
  role: 'owner' | 'maintainer' | 'contributor' | 'viewer';
  permissions: Permission[];
  addedAt: Date;
  addedBy: string;
}

interface ProjectSettings {
  allowForks: boolean;
  requireReviews: boolean;
  autoMerge: boolean;
  branchProtection: BranchProtection[];
  webhooks: Webhook[];
}

interface BranchProtection {
  branch: string;
  requireReviews: boolean;
  requiredReviewers: number;
  dismissStaleReviews: boolean;
  requireStatusChecks: boolean;
  restrictPushes: boolean;
  allowedUsers: string[];
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
}

interface CollaborationSession {
  id: string;
  projectId: string;
  participants: SessionParticipant[];
  type: 'code' | 'design' | 'review' | 'meeting';
  status: 'active' | 'paused' | 'ended';
  startTime: Date;
  endTime?: Date;
  metadata: Record<string, any>;
}

interface SessionParticipant {
  userId: string;
  role: 'host' | 'participant' | 'observer';
  joinedAt: Date;
  cursor?: CursorPosition;
  selection?: Selection;
  status: 'active' | 'idle' | 'away';
}

interface CursorPosition {
  file: string;
  line: number;
  column: number;
  timestamp: Date;
}

interface Selection {
  file: string;
  start: { line: number; column: number };
  end: { line: number; column: number };
  timestamp: Date;
}

interface Comment {
  id: string;
  projectId: string;
  authorId: string;
  content: string;
  type: 'general' | 'code' | 'design' | 'bug' | 'suggestion';
  location?: CommentLocation;
  replies: CommentReply[];
  reactions: Reaction[];
  status: 'open' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

interface CommentLocation {
  file: string;
  line?: number;
  column?: number;
  element?: string;
}

interface CommentReply {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Reaction {
  userId: string;
  emoji: string;
  timestamp: Date;
}

interface ReviewRequest {
  id: string;
  projectId: string;
  requesterId: string;
  reviewers: string[];
  title: string;
  description: string;
  changes: FileChange[];
  status: 'pending' | 'approved' | 'rejected' | 'merged';
  createdAt: Date;
  updatedAt: Date;
}

interface FileChange {
  file: string;
  type: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  diff: string;
}

export class TeamCollaborationService extends EventEmitter {
  private teams: Map<string, Team> = new Map();
  private projects: Map<string, Project> = new Map();
  private sessions: Map<string, CollaborationSession> = new Map();
  private comments: Map<string, Comment> = new Map();
  private reviewRequests: Map<string, ReviewRequest> = new Map();
  private wsServer: WebSocket.Server | null = null;
  private collaborationRooms: Map<string, Set<WebSocket>> = new Map();

  constructor() {
    super();
    this.initializeWebSocketServer();
  }

  private initializeWebSocketServer() {
    this.wsServer = new WebSocket.Server({ port: 8081 });
    
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

  // Team Management
  async createTeam(ownerId: string, name: string, description: string): Promise<string> {
    const teamId = uuidv4();
    const team: Team = {
      id: teamId,
      name,
      description,
      ownerId,
      members: [{
        userId: ownerId,
        role: 'owner',
        permissions: this.getAllPermissions(),
        joinedAt: new Date(),
        lastActive: new Date(),
        status: 'active'
      }],
      projects: [],
      settings: {
        visibility: 'private',
        allowInvites: true,
        requireApproval: false,
        defaultRole: 'developer',
        integrations: [],
        notifications: {
          email: true,
          push: true,
          slack: false,
          discord: false,
          events: this.getDefaultNotificationEvents()
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.teams.set(teamId, team);
    this.emit('teamCreated', team);

    return teamId;
  }

  private getAllPermissions(): Permission[] {
    return [
      { resource: 'project', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'deployment', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'settings', actions: ['read', 'update'] },
      { resource: 'members', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'billing', actions: ['read', 'update'] }
    ];
  }

  private getDefaultNotificationEvents(): NotificationEvent[] {
    return [
      { type: 'member_joined', enabled: true, channels: ['email', 'push'] },
      { type: 'project_created', enabled: true, channels: ['email'] },
      { type: 'deployment_completed', enabled: true, channels: ['email', 'push'] },
      { type: 'review_requested', enabled: true, channels: ['email', 'push'] },
      { type: 'comment_added', enabled: true, channels: ['push'] }
    ];
  }

  async inviteTeamMember(teamId: string, inviterId: string, email: string, role: TeamMember['role']): Promise<string> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Check permissions
    const inviter = team.members.find(m => m.userId === inviterId);
    if (!inviter || !this.hasPermission(inviter, 'members', 'create')) {
      throw new Error('Insufficient permissions');
    }

    const inviteId = uuidv4();
    
    // In a real implementation, you would send an email invitation
    this.emit('memberInvited', { teamId, email, role, inviterId, inviteId });

    return inviteId;
  }

  async acceptTeamInvite(inviteId: string, userId: string): Promise<void> {
    // In a real implementation, you would validate the invite and add the user
    this.emit('memberJoined', { inviteId, userId });
  }

  private hasPermission(member: TeamMember, resource: string, action: string): boolean {
    return member.permissions.some(p => 
      p.resource === resource && p.actions.includes(action as any)
    );
  }

  // Project Management
  async createProject(teamId: string, ownerId: string, name: string, description: string): Promise<string> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const member = team.members.find(m => m.userId === ownerId);
    if (!member || !this.hasPermission(member, 'project', 'create')) {
      throw new Error('Insufficient permissions');
    }

    const projectId = uuidv4();
    const project: Project = {
      id: projectId,
      name,
      description,
      teamId,
      ownerId,
      collaborators: [{
        userId: ownerId,
        role: 'owner',
        permissions: this.getAllPermissions(),
        addedAt: new Date(),
        addedBy: ownerId
      }],
      status: 'active',
      visibility: 'team',
      settings: {
        allowForks: true,
        requireReviews: false,
        autoMerge: false,
        branchProtection: [],
        webhooks: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.projects.set(projectId, project);
    team.projects.push(projectId);

    this.emit('projectCreated', project);
    return projectId;
  }

  async addProjectCollaborator(
    projectId: string, 
    adderId: string, 
    userId: string, 
    role: ProjectCollaborator['role']
  ): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const adder = project.collaborators.find(c => c.userId === adderId);
    if (!adder || !this.hasPermission(adder as any, 'project', 'update')) {
      throw new Error('Insufficient permissions');
    }

    const collaborator: ProjectCollaborator = {
      userId,
      role,
      permissions: this.getRolePermissions(role),
      addedAt: new Date(),
      addedBy: adderId
    };

    project.collaborators.push(collaborator);
    project.updatedAt = new Date();

    this.emit('collaboratorAdded', { projectId, collaborator });
  }

  private getRolePermissions(role: ProjectCollaborator['role']): Permission[] {
    switch (role) {
      case 'owner':
        return this.getAllPermissions();
      case 'maintainer':
        return [
          { resource: 'project', actions: ['read', 'update'] },
          { resource: 'deployment', actions: ['create', 'read', 'update'] }
        ];
      case 'contributor':
        return [
          { resource: 'project', actions: ['read', 'update'] }
        ];
      case 'viewer':
        return [
          { resource: 'project', actions: ['read'] }
        ];
      default:
        return [];
    }
  }

  // Real-time Collaboration
  async startCollaborationSession(
    projectId: string, 
    hostId: string, 
    type: CollaborationSession['type']
  ): Promise<string> {
    const sessionId = uuidv4();
    const session: CollaborationSession = {
      id: sessionId,
      projectId,
      participants: [{
        userId: hostId,
        role: 'host',
        joinedAt: new Date(),
        status: 'active'
      }],
      type,
      status: 'active',
      startTime: new Date(),
      metadata: {}
    };

    this.sessions.set(sessionId, session);
    this.collaborationRooms.set(sessionId, new Set());

    this.emit('collaborationStarted', session);
    return sessionId;
  }

  private handleWebSocketMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case 'join_session':
        this.handleJoinSession(ws, data);
        break;
      case 'cursor_move':
        this.handleCursorMove(ws, data);
        break;
      case 'text_change':
        this.handleTextChange(ws, data);
        break;
      case 'selection_change':
        this.handleSelectionChange(ws, data);
        break;
      case 'voice_chat':
        this.handleVoiceChat(ws, data);
        break;
      case 'screen_share':
        this.handleScreenShare(ws, data);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private handleJoinSession(ws: WebSocket, data: any): void {
    const { sessionId, userId } = data;
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
      return;
    }

    const participant: SessionParticipant = {
      userId,
      role: 'participant',
      joinedAt: new Date(),
      status: 'active'
    };

    session.participants.push(participant);
    
    const room = this.collaborationRooms.get(sessionId);
    if (room) {
      room.add(ws);
      
      this.broadcastToRoom(sessionId, {
        type: 'participant_joined',
        data: participant
      }, ws);
    }

    ws.send(JSON.stringify({
      type: 'session_joined',
      data: { sessionId, participants: session.participants }
    }));
  }

  private handleCursorMove(ws: WebSocket, data: any): void {
    const { sessionId, cursor } = data;
    
    this.broadcastToRoom(sessionId, {
      type: 'cursor_moved',
      data: cursor
    }, ws);
  }

  private handleTextChange(ws: WebSocket, data: any): void {
    const { sessionId, change } = data;
    
    this.broadcastToRoom(sessionId, {
      type: 'text_changed',
      data: change
    }, ws);
  }

  private handleSelectionChange(ws: WebSocket, data: any): void {
    const { sessionId, selection } = data;
    
    this.broadcastToRoom(sessionId, {
      type: 'selection_changed',
      data: selection
    }, ws);
  }

  private handleVoiceChat(ws: WebSocket, data: any): void {
    const { sessionId, audioData } = data;
    
    this.broadcastToRoom(sessionId, {
      type: 'voice_data',
      data: audioData
    }, ws);
  }

  private handleScreenShare(ws: WebSocket, data: any): void {
    const { sessionId, screenData } = data;
    
    this.broadcastToRoom(sessionId, {
      type: 'screen_data',
      data: screenData
    }, ws);
  }

  private handleWebSocketDisconnection(ws: WebSocket): void {
    for (const [sessionId, room] of this.collaborationRooms.entries()) {
      if (room.has(ws)) {
        room.delete(ws);
        
        this.broadcastToRoom(sessionId, {
          type: 'participant_left',
          data: { timestamp: new Date() }
        });
        
        if (room.size === 0) {
          this.endCollaborationSession(sessionId);
        }
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

  // Comments and Reviews
  async addComment(
    projectId: string, 
    authorId: string, 
    content: string, 
    type: Comment['type'],
    location?: CommentLocation
  ): Promise<string> {
    const commentId = uuidv4();
    const comment: Comment = {
      id: commentId,
      projectId,
      authorId,
      content,
      type,
      location,
      replies: [],
      reactions: [],
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.comments.set(commentId, comment);
    this.emit('commentAdded', comment);

    return commentId;
  }

  async replyToComment(commentId: string, authorId: string, content: string): Promise<string> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    const replyId = uuidv4();
    const reply: CommentReply = {
      id: replyId,
      authorId,
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    comment.replies.push(reply);
    comment.updatedAt = new Date();

    this.emit('commentReplied', { commentId, reply });
    return replyId;
  }

  async createReviewRequest(
    projectId: string,
    requesterId: string,
    reviewers: string[],
    title: string,
    description: string,
    changes: FileChange[]
  ): Promise<string> {
    const reviewId = uuidv4();
    const review: ReviewRequest = {
      id: reviewId,
      projectId,
      requesterId,
      reviewers,
      title,
      description,
      changes,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.reviewRequests.set(reviewId, review);
    this.emit('reviewRequested', review);

    return reviewId;
  }

  async approveReview(reviewId: string, reviewerId: string): Promise<void> {
    const review = this.reviewRequests.get(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    if (!review.reviewers.includes(reviewerId)) {
      throw new Error('Not authorized to review');
    }

    review.status = 'approved';
    review.updatedAt = new Date();

    this.emit('reviewApproved', { reviewId, reviewerId });
  }

  // Utility Methods
  async endCollaborationSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'ended';
      session.endTime = new Date();
      
      this.emit('collaborationEnded', session);
      this.collaborationRooms.delete(sessionId);
    }
  }

  async getTeam(teamId: string): Promise<Team | undefined> {
    return this.teams.get(teamId);
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    return Array.from(this.teams.values())
      .filter(team => team.members.some(m => m.userId === userId));
  }

  async getProject(projectId: string): Promise<Project | undefined> {
    return this.projects.get(projectId);
  }

  async getTeamProjects(teamId: string): Promise<Project[]> {
    return Array.from(this.projects.values())
      .filter(project => project.teamId === teamId);
  }

  async getProjectComments(projectId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.projectId === projectId);
  }

  async getProjectReviews(projectId: string): Promise<ReviewRequest[]> {
    return Array.from(this.reviewRequests.values())
      .filter(review => review.projectId === projectId);
  }
}
