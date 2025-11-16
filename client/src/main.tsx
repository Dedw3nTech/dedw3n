import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ErrorBoundary } from "./components/ui/error-boundary";

// Unregister any old service workers that might be cached
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().then(() => {
        console.log('[SW-CLEANUP] Unregistered old service worker');
      });
    });
  }).catch((error) => {
    console.warn('[SW-CLEANUP] Failed to unregister service workers:', error);
  });
}

// Initialize root and render app immediately for instant page load
const root = createRoot(document.getElementById("root")!);

// Render the app with error boundary
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
