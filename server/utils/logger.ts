import winston from 'winston';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { mkdirSync } from 'fs';
import { join } from 'path';

// Initialize Sentry only if DSN is provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
}

// Create logs directory if it doesn't exist
try {
  mkdirSync(join(process.cwd(), 'logs'), { recursive: true });
} catch (error) {
  console.warn('Could not create logs directory:', error);
}

// Custom format to handle error objects
const errorFormat = winston.format((info) => {
  if (info.error instanceof Error) {
    info.message = `${info.message}: ${info.error.message}`;
    info.stack = info.error.stack;
  }
  return info;
});

// Redact sensitive information
const redactSensitive = winston.format((info) => {
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
  const redactObject = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;

    Object.keys(obj).forEach(key => {
      if (sensitiveFields.includes(key.toLowerCase())) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        obj[key] = redactObject(obj[key]);
      }
    });
    return obj;
  };

  return redactObject({ ...info });
});

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    errorFormat(),
    redactSensitive(),
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Utility functions for different log types
export const logAuthFailure = (
  username: string, 
  ip: string, 
  reason: string
) => {
  const logData = {
    event: 'auth_failure',
    username,
    ip,
    reason,
    timestamp: new Date().toISOString(),
  };

  logger.warn(logData);
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage('Authentication Failure', {
      level: 'warning',
      extra: logData,
    });
  }
};

export const logUnauthorizedAccess = (
  userId: number,
  ip: string,
  resource: string,
  requiredRole?: string
) => {
  const logData = {
    event: 'unauthorized_access',
    userId,
    ip,
    resource,
    requiredRole,
    timestamp: new Date().toISOString(),
  };

  logger.warn(logData);
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage('Unauthorized Access Attempt', {
      level: 'warning',
      extra: logData,
    });
  }
};

export const logServerError = (
  error: Error,
  context: Record<string, any> = {}
) => {
  const logData = {
    event: 'server_error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    timestamp: new Date().toISOString(),
  };

  logger.error(logData);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
};

export default logger;