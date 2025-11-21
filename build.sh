#!/bin/bash
set -e

echo "🏗️  Starting build process..."

# Build frontend
echo "📦 Building frontend with Vite..."
NODE_OPTIONS='--max-old-space-size=4096' vite build

# Build backend
echo "🔧 Building backend with esbuild..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Copy attached_assets to dist
echo "📁 Copying attached_assets to dist..."
mkdir -p dist/attached_assets
if [ -d "attached_assets" ]; then
  cp -r attached_assets/* dist/attached_assets/ 2>/dev/null || echo "⚠️  Warning: Some files might not have been copied"
  echo "✅ Attached assets copied successfully"
else
  echo "⚠️  Warning: attached_assets directory not found"
fi

echo "✅ Build complete!"
