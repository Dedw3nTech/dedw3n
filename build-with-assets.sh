#!/bin/bash
# Build script that includes attached_assets

echo "Building frontend..."
vite build

echo "Building backend..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Copying attached_assets to dist..."
mkdir -p dist/attached_assets
cp -r attached_assets/* dist/attached_assets/

echo "Build complete with assets!"
