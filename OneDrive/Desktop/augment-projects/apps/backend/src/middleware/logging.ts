import morgan from 'morgan';
import { Request, Response } from 'express';

// Custom token for user ID
morgan.token('user-id', (req: Request) => {
  return (req as any).user?.id || 'anonymous';
});

// Custom token for request ID
morgan.token('request-id', (req: Request) => {
  return (req as any).requestId || 'unknown';
});

// Development logging format
export const developmentLogging = morgan('dev');

// Production logging format with more details
export const productionLogging = morgan(
  ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms :request-id'
);

// Combined logging format
export const combinedLogging = morgan('combined');

// Custom logging format for API requests
export const apiLogging = morgan(
  '[:date[iso]] :method :url :status :response-time ms - :res[content-length] bytes - User: :user-id - Request: :request-id'
);

// Error logging middleware
export const errorLogging = (err: Error, req: Request, res: Response, next: Function) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: (req as any).user?.id,
    requestId: (req as any).requestId,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  next(err);
};

// Request ID middleware
export const requestIdMiddleware = (req: Request, res: Response, next: Function) => {
  (req as any).requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  res.setHeader('X-Request-ID', (req as any).requestId);
  next();
};

// Default export for backward compatibility
export const logging = process.env.NODE_ENV === 'production' ? productionLogging : developmentLogging;
