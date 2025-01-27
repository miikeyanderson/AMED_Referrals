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
// Trust proxy disabled for security
// Then add other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(correlationMiddleware);
app.use('/api', apiLimiter);
// Apply request monitoring middleware for dashboard
app.use('/api', requestMonitor.middleware);

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "ARM Platform API Documentation",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1
  }
}));

// Request logging middleware with correlation ID
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
        rateLimit: req.rateLimit // Now TypeScript knows about rateLimit
      });
    }
  });

  next();
});

(async () => {
  const server = registerRoutes(app);

  // Error handling middleware with correlation ID logging
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

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Set server hostname to 0.0.0.0 to allow external connections
  const hostname = '0.0.0.0';
  const port = parseInt(process.env.PORT || '3001', 10);
  const fallbackPort = 3002;

  server.listen(port, hostname, () => {
    logger.info({
      message: `Server running at http://${hostname}:${port}/`,
      port,
      hostname
    });
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn({
        message: `Port ${port} is busy, trying ${fallbackPort}...`,
        error: err
      });
      server.listen(fallbackPort, hostname, () => {
        logger.info({
          message: `Server running at http://${hostname}:${fallbackPort}/`,
          port: fallbackPort,
          hostname
        });
      });
    }
  });
})();