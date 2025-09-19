import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/node';
import { StatsD } from 'hot-shots';

const prisma = new PrismaClient();

export class MonitoringService {
  private statsD: StatsD;
  private isInitialized: boolean = false;

  constructor() {
    this.statsD = new StatsD({
      host: process.env.DATADOG_HOST || 'localhost',
      port: parseInt(process.env.DATADOG_PORT || '8125')
    });
    this.initializeSentry();
    this.initializeDataDog();
  }

  private initializeSentry(): void {
    if (process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        integrations: [
          Sentry.httpIntegration(),
          Sentry.expressIntegration()
        ],
      });
      console.log('Sentry initialized');
    } else {
      console.warn('Sentry DSN not configured');
    }
  }

  private initializeDataDog(): void {
    this.statsD = new StatsD({
      host: process.env.DATADOG_AGENT_HOST || 'localhost',
      port: parseInt(process.env.DATADOG_AGENT_PORT || '8125'),
      prefix: 'crucibleai.',
      globalTags: [
        `env:${process.env.NODE_ENV || 'development'}`,
        'service:crucibleai-backend'
      ]
    });

    this.isInitialized = true;
    console.log('DataDog StatsD initialized');
  }

  /**
   * Track custom metrics
   */
  trackMetric(metricName: string, value: number, tags: Record<string, string> = {}): void {
    if (!this.isInitialized) return;

    try {
      this.statsD.gauge(metricName, value, tags);
    } catch (error) {
      console.error('Error tracking metric:', error);
    }
  }

  /**
   * Increment counter metrics
   */
  incrementCounter(metricName: string, value: number = 1, tags: Record<string, string> = {}): void {
    if (!this.isInitialized) return;

    try {
      this.statsD.increment(metricName, value, tags);
    } catch (error) {
      console.error('Error incrementing counter:', error);
    }
  }

  /**
   * Track timing metrics
   */
  trackTiming(metricName: string, duration: number, tags: Record<string, string> = {}): void {
    if (!this.isInitialized) return;

    try {
      this.statsD.timing(metricName, duration, tags);
    } catch (error) {
      console.error('Error tracking timing:', error);
    }
  }

  /**
   * Track histogram metrics
   */
  trackHistogram(metricName: string, value: number, tags: Record<string, string> = {}): void {
    if (!this.isInitialized) return;

    try {
      this.statsD.histogram(metricName, value, tags);
    } catch (error) {
      console.error('Error tracking histogram:', error);
    }
  }

  /**
   * Log error to Sentry
   */
  logError(error: Error, context: Record<string, any> = {}): void {
    try {
      Sentry.withScope((scope) => {
        Object.keys(context).forEach(key => {
          scope.setTag(key, context[key]);
        });
        Sentry.captureException(error);
      });

      // Also increment error counter
      this.incrementCounter('errors.total', 1, {
        error_type: error.name,
        error_message: error.message.substring(0, 100)
      });
    } catch (err) {
      console.error('Error logging to Sentry:', err);
    }
  }

  /**
   * Log custom event
   */
  logEvent(eventName: string, data: Record<string, any> = {}): void {
    try {
      Sentry.addBreadcrumb({
        message: eventName,
        data,
        level: 'info'
      });

      this.incrementCounter(`events.${eventName}`, 1, data);
    } catch (error) {
      console.error('Error logging event:', error);
    }
  }

  /**
   * Track business metrics
   */
  async trackBusinessMetrics(): Promise<void> {
    try {
      // User metrics
      const totalUsers = await prisma.user.count();
      this.trackMetric('users.total', totalUsers);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dailyActiveUsers = await prisma.user.count({
        where: {
          lastLoginAt: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      this.trackMetric('users.daily_active', dailyActiveUsers);

      // Subscription metrics
      const activeSubscriptions = await prisma.userSubscription.count({
        where: { status: 'active' }
      });

      this.trackMetric('subscriptions.active', activeSubscriptions);

      // Revenue metrics - calculate from payments
      const monthlyRevenue = await prisma.payment.aggregate({
        where: {
          status: 'completed',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { amount: true }
      });

      this.trackMetric('revenue.monthly', monthlyRevenue._sum.amount || 0);

      // Usage metrics
      const quantumJobsToday = await prisma.quantumJob.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      this.trackMetric('quantum.jobs_today', quantumJobsToday);

      // AI usage metrics
      const aiRequestsToday = await prisma.usageTracking.count({
        where: {
          timestamp: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      this.trackMetric('ai.requests_today', aiRequestsToday);

      // Support metrics
      const openTickets = await prisma.supportTicket.count({
        where: { status: 'open' }
      });

      this.trackMetric('support.open_tickets', openTickets);

    } catch (error) {
      console.error('Error tracking business metrics:', error);
      this.logError(error as Error, { context: 'business_metrics' });
    }
  }

  /**
   * Health check endpoint data
   */
  async getHealthMetrics(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    services: Record<string, boolean>;
    metrics: Record<string, number>;
  }> {
    const services: Record<string, boolean> = {};
    const metrics: Record<string, number> = {};

    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      services.database = true;
    } catch (error) {
      services.database = false;
      this.logError(error as Error, { service: 'database' });
    }

    try {
      // Check Redis connection (if configured)
      if (process.env.REDIS_URL) {
        // Add Redis health check here
        services.redis = true;
      }
    } catch (error) {
      services.redis = false;
      this.logError(error as Error, { service: 'redis' });
    }

    try {
      // Check external services
      services.stripe = !!process.env.STRIPE_SECRET_KEY;
      services.aws = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
      services.openai = !!process.env.OPENAI_API_KEY;
      services.anthropic = !!process.env.ANTHROPIC_API_KEY;
    } catch (error) {
      this.logError(error as Error, { service: 'external_services' });
    }

    // Calculate metrics
    const healthyServices = Object.values(services).filter(Boolean).length;
    const totalServices = Object.keys(services).length;
    const healthPercentage = (healthyServices / totalServices) * 100;

    metrics.healthy_services = healthyServices;
    metrics.total_services = totalServices;
    metrics.health_percentage = healthPercentage;

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthPercentage >= 90) {
      status = 'healthy';
    } else if (healthPercentage >= 70) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    // Track health metrics
    this.trackMetric('health.percentage', healthPercentage);
    this.trackMetric('health.healthy_services', healthyServices);

    return {
      status,
      timestamp: new Date().toISOString(),
      services,
      metrics
    };
  }

  /**
   * Performance monitoring middleware
   */
  performanceMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const route = req.route?.path || req.path;
        const method = req.method;
        const statusCode = res.statusCode;

        // Track response time
        this.trackTiming('http.response_time', duration, {
          method,
          route,
          status_code: statusCode.toString()
        });

        // Track request count
        this.incrementCounter('http.requests', 1, {
          method,
          route,
          status_code: statusCode.toString()
        });

        // Track error rates
        if (statusCode >= 400) {
          this.incrementCounter('http.errors', 1, {
            method,
            route,
            status_code: statusCode.toString()
          });
        }

        // Log slow requests
        if (duration > 5000) {
          this.logEvent('slow_request', {
            method,
            route,
            duration,
            status_code: statusCode
          });
        }
      });

      next();
    };
  }

  /**
   * Start periodic metric collection
   */
  startPeriodicMetrics(): void {
    // Track business metrics every 5 minutes
    setInterval(() => {
      this.trackBusinessMetrics();
    }, 5 * 60 * 1000);

    console.log('Periodic metrics collection started');
  }
}

export const monitoringService = new MonitoringService();
