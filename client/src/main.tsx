import { createRoot } from "react-dom/client";
import { Suspense } from "react";
import App from "./App";
import "./index.css";
// Import i18n
import i18n from "./lib/i18n";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Wait for i18n to initialize before rendering the app
const root = createRoot(document.getElementById("root")!);

// Loading component to show while i18n initializes
const LoadingComponent = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
    <p className="text-gray-500">Loading translations...</p>
  </div>
);

// Render the app wrapped in Suspense
root.render(
  <Suspense fallback={<LoadingComponent />}>
    <App />
  </Suspense>
);
