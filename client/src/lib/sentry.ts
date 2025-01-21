import * as Sentry from '@sentry/react';
import { Replay } from "@sentry/replay";

export function initSentry() {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new Replay(),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0, // Capture 100% of the transactions
      // Session Replay
      replaysSessionSampleRate: 0.1, // Sample rate for all sessions
      replaysOnErrorSampleRate: 1.0, // Sample rate for sessions with errors
      environment: import.meta.env.MODE,
    });
  } else {
    console.warn('Sentry DSN not found. Error tracking is disabled for frontend.');
  }
}

// Export Sentry for manual error capturing
export { Sentry };