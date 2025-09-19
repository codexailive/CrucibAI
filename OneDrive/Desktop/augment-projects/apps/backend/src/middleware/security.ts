import cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { body, validationResult } from 'express-validator';
import helmet from 'helmet';
import multer from 'multer';
import validator from 'validator';

// Extend session data to include csrfToken
declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
  }
}

// Extend Request interface to include session and file
declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<session.SessionData>;
      file?: Express.Multer.File;
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

// Get client IP address
const getClientIP = (req: Request): string => {
  const clientIP = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         'unknown';
  return clientIP;
};

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow for third-party integrations
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Rate limiting configurations
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 API requests per minute
  message: {
    error: 'API rate limit exceeded, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS middleware
export const corsMiddleware = cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://crucibleai.com', 'https://www.crucibleai.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

// File upload configuration
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    // Allow specific file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/wav'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Validation schemas
export const validationSchemas = {
  register: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('name').isLength({ min: 2, max: 50 }).trim()
  ],
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  aiRequest: [
    body('prompt').isLength({ min: 1, max: 4000 }).trim(),
    body('provider').isIn(['openai', 'anthropic', 'google', 'huggingface', 'cohere', 'replicate']),
    body('model').isLength({ min: 1, max: 100 }).trim()
  ]
};

// Input validation middleware
export const validateInput = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    next();
  };
};

// Security middleware object
export const securityMiddleware = {
  helmet: securityHeaders,
  rateLimiter: generalRateLimit,
  authRateLimit,
  validateInput,
  upload,

  // IP blocking middleware
  blockSuspiciousIPs: (req: Request, res: Response, next: NextFunction) => {
    const clientIP = getClientIP(req);

    // Block known malicious IPs (in production, this would come from a database or service)
    const blockedIPs = process.env.BLOCKED_IPS?.split(',') || [];

    if (blockedIPs.includes(clientIP)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  },

  // Request sanitization
  sanitizeInput: (req: Request, _res: Response, next: NextFunction) => {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = validator.escape(req.body[key]);
        }
      }
    }

    next();
  }
};

// Common validation schemas
export const userValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters')
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const quantumJobValidation = [
  body('deviceArn').notEmpty().withMessage('Device ARN is required'),
  body('circuit').isObject().withMessage('Circuit must be a valid object'),
  body('shots').isInt({ min: 1, max: 10000 }).withMessage('Shots must be between 1 and 10000')
];

export const aiRequestValidation = [
  body('provider').isIn(['openai', 'anthropic', 'google', 'huggingface', 'cohere', 'replicate']).withMessage('Invalid AI provider'),
  body('model').notEmpty().withMessage('Model is required'),
  body('prompt').isLength({ min: 1, max: 10000 }).withMessage('Prompt must be 1-10000 characters')
];

// SQL injection protection
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential SQL injection patterns
      return obj.replace(/['"\\;]/g, '');
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

// CSRF protection for state-changing operations
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = req.session?.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
      return res.status(403).json({
        error: 'CSRF token validation failed'
      });
    }
  }

  next();
};

// Request logging for security monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      userId: (req as any).user?.id
    };

    // Log suspicious activities
    if (res.statusCode >= 400 || duration > 5000) {
      console.warn('Security Alert:', logData);
    }
  });

  next();
};

// Content type validation
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.get('Content-Type');
      
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        return res.status(415).json({
          error: 'Unsupported content type',
          allowed: allowedTypes
        });
      }
    }

    next();
  };
};

// File upload security
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (req.file) {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/json'
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'File type not allowed',
        allowed: allowedMimeTypes
      });
    }

    // Check file size (10MB limit)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        error: 'File too large',
        maxSize: '10MB'
      });
    }
  }

  next();
};

// IP whitelist for admin endpoints
export const adminIPWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || 'unknown';

    if (!allowedIPs.includes(clientIP)) {
      console.warn(`Unauthorized admin access attempt from IP: ${clientIP}`);
      return res.status(403).json({
        error: 'Access denied from this IP address'
      });
    }

    next();
  };
};
