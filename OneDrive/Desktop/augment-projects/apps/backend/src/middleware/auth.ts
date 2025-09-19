import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role?: string;
        subscription?: any;
      };
    }
  }
}

// JWT Authentication Middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { subscription: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Update last active timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription: user.subscription
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password validation
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Hash password with salt
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { 
      expiresIn: process.env.NODE_ENV === 'production' ? '1h' : '24h',
      issuer: 'crucibleai',
      audience: 'crucibleai-users'
    }
  );
};

// Generate refresh token
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    { 
      expiresIn: '7d',
      issuer: 'crucibleai',
      audience: 'crucibleai-users'
    }
  );
};

// Verify refresh token
export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!
    ) as any;
    
    if (decoded.type !== 'refresh') {
      return null;
    }
    
    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
};

// MFA Setup (TOTP)
export const generateMFASecret = (): string => {
  // In production, use a proper TOTP library like 'speakeasy'
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Role-based access control
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // For now, all authenticated users have access
    // In production, implement proper role checking
    next();
  };
};

// API Key authentication (for service-to-service calls)
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    // In production, validate API key against database
    if (apiKey === process.env.INTERNAL_API_KEY) {
      req.user = {
        id: 'system',
        email: 'system@crucibleai.com',
        name: 'System'
      };
      next();
    } else {
      return res.status(401).json({ error: 'Invalid API key' });
    }
  } catch (error) {
    console.error('API key auth error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Session management
export const createSession = async (userId: string, userAgent?: string, ipAddress?: string) => {
  const sessionId = Math.random().toString(36).substring(2, 15);
  
  // In production, store sessions in Redis or database
  return {
    sessionId,
    userId,
    createdAt: new Date(),
    userAgent,
    ipAddress,
    active: true
  };
};

// Logout and invalidate session
export const invalidateSession = async (sessionId: string) => {
  // In production, remove from Redis or mark as inactive in database
  return true;
};

export default {
  authenticateToken,
  authRateLimit,
  validatePassword,
  hashPassword,
  verifyPassword,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateMFASecret,
  requireRole,
  authenticateApiKey,
  createSession,
  invalidateSession
};
