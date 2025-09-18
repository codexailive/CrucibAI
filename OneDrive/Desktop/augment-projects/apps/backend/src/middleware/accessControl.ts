import { NextFunction, Request, Response } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role?: 'user' | 'admin';
    subscription?: any;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Assume JWT verification here (use jsonwebtoken if installed)
    // For example: const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded as any;
    req.user = {
      id: 'user1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin'
    }; // Mock for now
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: ('user' | 'admin')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

// Example usage: app.use('/api/marketplace', requireAuth, requireRole(['admin']));
