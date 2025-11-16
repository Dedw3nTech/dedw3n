#!/usr/bin/env node

/**
 * Version Generation Script for Cache Busting
 * Generates version.json with build metadata for client-side cache detection
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get Git commit hash
let gitHash = 'unknown';
let gitBranch = 'unknown';
try {
  gitHash = execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8' }).trim();
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
} catch (error) {
  console.warn('[VERSION] Could not get git info, using defaults');
}

// Get package version
let packageVersion = '0.0.0';
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  packageVersion = packageJson.version || '0.0.0';
} catch (error) {
  console.warn('[VERSION] Could not read package.json');
}

// Generate version info
const versionInfo = {
  version: packageVersion,
  gitHash,
  gitBranch,
  buildTime: new Date().toISOString(),
  buildTimestamp: Date.now(),
  // Create a unique build ID combining version and hash
  buildId: `${packageVersion}-${gitHash}`
};

// Ensure dist/public directory exists
const distPath = path.join(__dirname, 'dist', 'public');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Write version.json to public folder
const versionPath = path.join(distPath, 'version.json');
fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));

// Also write to client/public for development
const clientPublicPath = path.join(__dirname, 'client', 'public');
if (!fs.existsSync(clientPublicPath)) {
  fs.mkdirSync(clientPublicPath, { recursive: true });
}

const devVersionPath = path.join(clientPublicPath, 'version.json');
fs.writeFileSync(devVersionPath, JSON.stringify(versionInfo, null, 2));

console.log('[VERSION] Generated version.json with build info:');
console.log(JSON.stringify(versionInfo, null, 2));

// Export for use in build scripts
module.exports = versionInfo;