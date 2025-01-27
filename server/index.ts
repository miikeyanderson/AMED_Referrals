import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { correlationMiddleware } from "./middleware/correlation";
import { apiLimiter, requestMonitor } from "./middleware/rate-limit";
import logger from "./utils/logger";
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger';

// Extend Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime: number;
      };
    }
  }
}

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(correlationMiddleware);

// Rate limiting and monitoring for API routes only
app.use('/api', apiLimiter);
app.use('/api', requestMonitor.middleware);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "ARM Platform API Documentation",
  customfavIcon: "/favicon.ico"
}));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      logger.info({
        message: logLine,
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        response: capturedJsonResponse,
        rateLimit: req.rateLimit
      });
    }
  });

  next();
});

const startServer = async () => {
  try {
    const server = registerRoutes(app);

    // Error handling middleware
    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      logger.error({
        message: `Error handling request: ${message}`,
        correlationId: req.correlationId,
        error: err,
        status,
      });

      res.status(status).json({ 
        message,
        requestId: req.correlationId 
      });
    });

    // Development setup with Vite
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const PORT = 5000;
    const hostname = '0.0.0.0';

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error({
          message: `Port ${PORT} is already in use. Please ensure no other service is running on this port.`,
          error
        });
        process.exit(1);
      } else {
        logger.error({
          message: `Failed to start server: ${error.message}`,
          error
        });
        process.exit(1);
      }
    });

    await new Promise<void>((resolve, reject) => {
      server.listen(PORT, hostname, () => {
        logger.info({
          message: `Server running at http://${hostname}:${PORT}/`,
          port: PORT,
          hostname
        });
        resolve();
      }).on('error', reject);
    });

  } catch (error) {
    logger.error({
      message: 'Failed to start server',
      error
    });
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error({
    message: 'Uncaught exception',
    error
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({
    message: 'Unhandled rejection',
    reason,
    promise
  });
  process.exit(1);
});

startServer().catch((error) => {
  logger.error({
    message: 'Failed to start application',
    error
  });
  process.exit(1);
});