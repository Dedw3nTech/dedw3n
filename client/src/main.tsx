import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import i18n
import i18n from "./lib/i18n";

// Initialize root and render app immediately to prevent loading blocks
const root = createRoot(document.getElementById("root")!);

// Render the app immediately without Suspense to prevent hanging
root.render(<App />);
