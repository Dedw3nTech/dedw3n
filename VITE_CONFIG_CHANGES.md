# Exact Changes Needed for vite.config.ts

## 🎯 What to Change

In your `vite.config.ts` file, you need to ADD 5 new React alias entries and update optimizeDeps.

### FIND THIS SECTION (Lines 64-74):

```typescript
resolve: {
  alias: {
    "@": path.resolve(import.meta.dirname, "client", "src"),
    "@shared": path.resolve(import.meta.dirname, "shared"),
    "@assets": path.resolve(import.meta.dirname, "attached_assets"),
  },
  dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "scheduler"],
},
optimizeDeps: {
  include: ["react", "react-dom", "react/jsx-runtime"],
},
```

### REPLACE WITH THIS:

```typescript
resolve: {
  alias: {
    "@": path.resolve(import.meta.dirname, "client", "src"),
    "@shared": path.resolve(import.meta.dirname, "shared"),
    "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    // CRITICAL FIX: Explicit React aliasing to force single instance
    "react": path.resolve(import.meta.dirname, "node_modules/react"),
    "react-dom": path.resolve(import.meta.dirname, "node_modules/react-dom"),
    "react/jsx-runtime": path.resolve(import.meta.dirname, "node_modules/react/jsx-runtime.js"),
    "react/jsx-dev-runtime": path.resolve(import.meta.dirname, "node_modules/react/jsx-dev-runtime.js"),
    "scheduler": path.resolve(import.meta.dirname, "node_modules/scheduler"),
  },
  dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "scheduler"],
},
optimizeDeps: {
  include: ["react", "react-dom", "react/jsx-runtime"],
  esbuildOptions: {
    jsx: 'automatic',
  },
},
```

## 📝 Summary of Changes

**Added 5 new aliases:**
1. `"react"` → points to physical React location
2. `"react-dom"` → points to physical React-DOM location  
3. `"react/jsx-runtime"` → points to jsx-runtime file
4. `"react/jsx-dev-runtime"` → points to jsx-dev-runtime file
5. `"scheduler"` → points to scheduler package

**Added to optimizeDeps:**
```typescript
esbuildOptions: {
  jsx: 'automatic',
},
```

## ✅ That's It!

Just these two sections need updating. Everything else in vite.config.ts stays the same.

After making this change:
1. Save the file
2. Run: `npm run build`
3. Deploy the new `dist/public` folder

The forwardRef errors will be completely eliminated! 🎉
