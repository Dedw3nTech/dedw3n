# Production White Screen Debugging Guide

## Overview
This guide helps diagnose and fix white screen issues in production deployments.

## Immediate Steps

### 1. Check Browser Console
Open your browser's developer console (F12) on the production site:
- Press F12 or right-click → Inspect → Console tab
- Look for red error messages
- Check the Network tab for failed requests (red status codes)

### 2. View Captured Error Logs
If the error logger initialized successfully, errors are saved to localStorage:

```javascript
// In the browser console, run:
JSON.parse(localStorage.getItem('production-errors'))
```

### 3. Check Server Logs
View the deployment logs in the Publishing tool:
- Click on your published deployment
- Go to the "Logs" tab
- Filter by "errors" or search for specific error messages

### 4. Verify Build Assets
Ensure all static assets loaded correctly:
- Open Network tab in developer tools
- Reload the page
- Check if any JavaScript/CSS files failed to load (404 errors)
- Verify the main `index.*.js` file loaded successfully

## Common Causes & Solutions

### Cause 1: Missing Environment Variables
**Symptoms:**
- API calls fail immediately
- Console shows "undefined" for env variables

**Solution:**
1. Go to Replit Secrets
2. Verify all required environment variables are set
3. Ensure `NODE_ENV=production` is set for production deployments

### Cause 2: Stale Cache
**Symptoms:**
- Page works in development but not production
- Console shows "ChunkLoadError" or version mismatches

**Solution:**
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

Or use the "Clear Cache & Reload" button in the error fallback screen.

### Cause 3: Asset Path Issues
**Symptoms:**
- 404 errors for JavaScript/CSS files
- Console shows "Failed to fetch" or "Loading chunk failed"

**Solution:**
1. Check that the build completed successfully: `ls -la dist/public/`
2. Verify `dist/public/index.html` references correct asset paths
3. Rebuild if necessary: `npm run build`

### Cause 4: JavaScript Runtime Errors
**Symptoms:**
- Console shows specific error messages
- Error fallback screen appears with details

**Solution:**
1. Read the error stack trace
2. Identify the failing component/file
3. Check if environment-specific code is causing issues
4. Verify all dependencies are installed in production

### Cause 5: Database Connection Issues
**Symptoms:**
- App loads but API calls fail
- Console shows network errors or 500 responses

**Solution:**
1. Check database connection string in production
2. Verify database is accessible from deployment
3. Check server logs for database connection errors

## Automated Error Detection

The app now includes automatic error detection that:
- Captures all JavaScript errors
- Logs to browser console with `[PRODUCTION-ERROR]` prefix
- Saves errors to localStorage for later inspection
- Shows error fallback UI **immediately on the first error** detected during app initialization
- Automatically restores the initial loader visibility to display the error screen, even after the normal loading completes

## Manual Debugging Steps

### Step 1: Enable Verbose Logging
Add this to browser console:
```javascript
localStorage.setItem('debug', 'true');
location.reload();
```

### Step 2: Test API Connectivity
```javascript
fetch('/api/user')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Step 3: Check Version Info
```javascript
fetch('/version.json')
  .then(r => r.json())
  .then(console.log);
```

### Step 4: Verify Static Assets
```javascript
// First, find the main JS file name from the Network tab or page source
// Then test it (replace with your actual filename):
fetch('/assets/index.CAb-4p_2.js')
  .then(r => console.log('Asset status:', r.status))
  .catch(console.error);

// Or check any asset file shown in Network tab that failed
```

## Production Checklist

Before publishing:
- [ ] Run `npm run build` successfully
- [ ] Verify `dist/public/` contains built files
- [ ] Check all environment variables are set
- [ ] Test in production mode locally: `npm start`
- [ ] Clear browser cache before testing
- [ ] Check for console errors in production

## Quick Fixes

### Hard Reload
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### Clear Everything
```javascript
// Run in console:
localStorage.clear();
sessionStorage.clear();
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
location.reload(true);
```

### Force New Build
```bash
rm -rf dist/
npm run build
npm start
```

## Getting Help

If the issue persists:
1. Copy all console errors
2. Copy the production error log: `localStorage.getItem('production-errors')`
3. Copy server logs from the Logs tab
4. Share with support along with:
   - When did it start happening?
   - What changed before the issue?
   - Does it happen for all users or specific ones?
   - What browser/device are affected?

## Prevention

To avoid future white screens:
1. Test in production mode before publishing: `NODE_ENV=production npm start`
2. Monitor error logs regularly
3. Implement gradual rollouts for major changes
4. Keep dependencies updated
5. Use the version checker to force cache busts on deployments
