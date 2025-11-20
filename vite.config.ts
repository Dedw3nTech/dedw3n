import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { visualizer } from "rollup-plugin-visualizer";
import { execSync } from "child_process";
import { writeFileSync } from "fs";

// Plugin to generate version.json with Git hash and build metadata
const versionPlugin = (): Plugin => {
  return {
    name: "generate-version",
    closeBundle() {
      let gitHash = "unknown";
      let gitBranch = "unknown";

      try {
        gitHash = execSync("git rev-parse --short=7 HEAD", {
          encoding: "utf8",
        }).trim();
        gitBranch = execSync("git rev-parse --abbrev-ref HEAD", {
          encoding: "utf8",
        }).trim();
      } catch (error) {
        console.warn("[VERSION] Could not get git info, using timestamp");
        gitHash = Date.now().toString(36);
      }

      const versionInfo = {
        gitHash,
        gitBranch,
        buildTime: new Date().toISOString(),
        buildTimestamp: Date.now(),
        buildId: `${gitHash}-${Date.now()}`,
      };

      // Write version.json to dist folder
      writeFileSync(
        path.resolve(import.meta.dirname, "dist/public/version.json"),
        JSON.stringify(versionInfo, null, 2),
      );

      console.log("[VERSION] Generated version.json:", versionInfo);
    },
  };
};

// Add to your existing vite.config.ts

export default defineConfig({
  // ... your existing config

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate payment/checkout logic into its own chunk
          payments: [
            "./client/src/pages/cart.tsx",
            "./client/src/pages/checkout.tsx",
            "./client/src/pages/payment-gateway.tsx",
            "./client/src/pages/payment-success.tsx",
          ],
        },
      },
    },
  },

  server: {
    hmr: {
      overlay: true, // Show HMR errors clearly
    },
  },

  // Enable better debugging
  logLevel: "info",
});

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    versionPlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
    visualizer({
      filename: "./dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      // CRITICAL FIX: Explicit React aliasing to force single instance
      // This ensures ALL imports (CommonJS, ESM, deep imports) resolve to same React
      react: path.resolve(import.meta.dirname, "node_modules/react"),
      "react-dom": path.resolve(import.meta.dirname, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(
        import.meta.dirname,
        "node_modules/react/jsx-runtime.js",
      ),
      "react/jsx-dev-runtime": path.resolve(
        import.meta.dirname,
        "node_modules/react/jsx-dev-runtime.js",
      ),
      scheduler: path.resolve(import.meta.dirname, "node_modules/scheduler"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "scheduler",
    ],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "recharts"],
    esbuildOptions: {
      // Ensure JSX transforms use the aliased React
      jsx: "automatic",
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,

    // Use esbuild for faster builds
    minify: "esbuild",

    // CRITICAL FIX: Handle Recharts CommonJS/ESM interop
    // Prevents "forwardRef undefined" errors in production
    commonjsOptions: {
      include: [/recharts/, /node_modules/],
      transformMixedEsModules: true,
    },

    // Disable modulepreload polyfill to prevent Chrome warning about unsupported 'as' value
    // Chrome doesn't support as="document" for <link rel="preload">, causing console warnings
    // This doesn't affect functionality as browsers will still load modules via <script type="module">
    modulePreload: false,

    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      external: [
        "@anthropic-ai/sdk",
        "@aws-sdk/client-s3",
        "@aws-sdk/s3-request-presigner",
        "@getbrevo/brevo",
        "@google-cloud/storage",
        "nodemailer",
        "multer",
        "sharp",
        "qrcode",
        "speakeasy",
        "openai",
        "bcryptjs",
        "passport",
        "passport-local",
        "passport-google-oauth20",
        "passport-facebook",
        "passport-github2",
        "express",
        "express-session",
        "connect-pg-simple",
        "cookie",
        "cookie-signature",
        "cors",
        "helmet",
        "hpp",
        "express-rate-limit",
        "express-mongo-sanitize",
      ],
      output: {
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || [];
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name].[hash][extname]`;
          } else if (/css/i.test(extType)) {
            return `assets/css/[name].[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            return `assets/fonts/[name].[hash][extname]`;
          }
          return `assets/[name].[hash][extname]`;
        },

        // CRITICAL FIX: Bundle Recharts with React to prevent forwardRef errors
        // Recharts must load synchronously with React to access React.forwardRef
        manualChunks: (id) => {
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/wouter") ||
            id.includes("node_modules/recharts")
          ) {
            return "react-vendor";
          }
          if (id.includes("node_modules/lexical")) {
            return "lexical-editor";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "icons";
          }
          if (id.includes("node_modules/@uppy")) {
            return "uppy-uploader";
          }
          if (id.includes("node_modules/@radix-ui")) {
            return "ui-vendor";
          }
          if (id.includes("node_modules/@tanstack/react-query")) {
            return "react-query";
          }
          if (id.includes("node_modules/emoji-picker-react")) {
            return "emoji-picker";
          }
          if (
            id.includes("node_modules/react-hook-form") ||
            id.includes("node_modules/@hookform/resolvers") ||
            id.includes("node_modules/zod")
          ) {
            return "forms";
          }
          if (
            id.includes("node_modules/@paypal") ||
            id.includes("node_modules/@stripe")
          ) {
            return "payments";
          }
          return undefined;
        },
      },
      maxParallelFileOps: 50,
    },
  },
  server: {
    hmr: process.env.REPLIT_DOMAINS
      ? {
          protocol: "wss",
          host: process.env.REPLIT_DOMAINS.split(",")[0],
          clientPort: 443,
        }
      : true,
  },
});
// ❌ Bad - creates runtime dependency
import { UserType, formatUser } from "./utils";

// ✅ Good - type import ignored by Vite
import type { UserType } from "./utils";
import { formatUser } from "./utils";
