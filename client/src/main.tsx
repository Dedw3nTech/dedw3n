import { createRoot } from "react-dom/client";
import { Suspense } from "react";
import App from "./App";
import "./index.css";
import { Loader2 } from "lucide-react";

const root = createRoot(document.getElementById("root")!);

// Loading component
const LoadingComponent = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
    <p className="text-gray-500">Loading application...</p>
  </div>
);

// Render the app
root.render(
  <Suspense fallback={<LoadingComponent />}>
    <App />
  </Suspense>
);
