import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from '@sentry/react';
import App from './App';
import "./index.css";
import { initSentry } from "./lib/sentry";

// Initialize Sentry
initSentry();

// Enable HMR
if (import.meta.hot) {
  import.meta.hot.accept();
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Failed to find the root element");
}

createRoot(root).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>An error has occurred</p>}>
      <App/>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);