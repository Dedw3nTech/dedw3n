# Pre-Deployment Verification Guide

## Overview
Use this guide to verify your production deployment configuration is correct before going live.

## Automated Verification

### Built-in Diagnostic Endpoint ✅

Your application includes a comprehensive diagnostic system:

**Endpoint**: `/api/diagnostic/environment`
**Access**: Admin authentication required
**UI Route**: `/diagnostic/environment`

**What it checks**:
- ✓ Database connectivity and configuration
- ✓ CORS settings and allowed origins
- ✓ Object storage configuration
- ✓ Environment mode (development/production)
- ✓ Cross-environment data consistency

**How to use**:
1. Deploy your application
2. Log in as admin user
3. Navigate to `/diagnostic/environment`
4. Review all configuration sections
5. Verify green checkmarks for all critical items

## Manual Verification Checklist

### Step 1: Environment Variables

Run these checks in your Replit shell:

```bash
# Check critical variables are set
echo "Checking critical environment variables..."
echo ""

echo "DATABASE_URL: ${DATABASE_URL:+✓ SET}"
[ -z "$DATABASE_URL" ] && echo "DATABASE_URL: ✗ NOT SET - REQUIRED"

echo "PUBLIC_OBJECT_SEARCH_PATHS: ${PUBLIC_OBJECT_SEARCH_PATHS:+✓ SET}"
[ -z "$PUBLIC_OBJECT_SEARCH_PATHS" ] && echo "PUBLIC_OBJECT_SEARCH_PATHS: ✗ NOT SET - REQUIRED"

echo "PRIVATE_OBJECT_DIR: ${PRIVATE_OBJECT_DIR:+✓ SET}"
[ -z "$PRIVATE_OBJECT_DIR" ] && echo "PRIVATE_OBJECT_DIR: ✗ NOT SET - REQUIRED"

echo "NODE_ENV: ${NODE_ENV:-development}"
[ "$NODE_ENV" != "production" ] && echo "⚠ Warning: NODE_ENV not set to 'production'"

echo ""
echo "Checking security variables..."
echo "JWT_SECRET: ${JWT_SECRET:+✓ SET}"
[ -z "$JWT_SECRET" ] && echo "JWT_SECRET: ✗ NOT SET - REQUIRED"

echo "TURNSTILE_SECRET_KEY: ${TURNSTILE_SECRET_KEY:+✓ SET}"
[ -z "$TURNSTILE_SECRET_KEY" ] && echo "TURNSTILE_SECRET_KEY: ✗ NOT SET - RECOMMENDED"

echo "VITE_TURNSTILE_SITE_KEY: ${VITE_TURNSTILE_SITE_KEY:+✓ SET}"
[ -z "$VITE_TURNSTILE_SITE_KEY" ] && echo "VITE_TURNSTILE_SITE_KEY: ✗ NOT SET - RECOMMENDED"
```

### Step 2: Code Validation

Your codebase already includes automatic validation:

**Database Validation** (`server/db.ts`):
```typescript
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}
```
✓ Code will not start without DATABASE_URL

**Object Storage Validation** (`server/objectStorage.ts`):
```typescript
getPublicObjectSearchPaths(): Array<string> {
  // Throws error with helpful message if not set
}

getPrivateObjectDir(): string {
  // Throws error with helpful message if not set
}
```
✓ Clear error messages guide you to set these variables

**CORS Validation** (`server/index.ts`):
- Validates all URLs have proper protocols
- Rejects non-HTTPS URLs in production for custom domains
- Logs warnings for invalid domains
✓ Automatic validation and helpful console warnings

### Step 3: Database Connectivity Test

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# If successful, you should see PostgreSQL version info
# If failed, check DATABASE_URL format and network connectivity
```

Expected output:
```
PostgreSQL 14.x on x86_64-pc-linux-gnu...
```

### Step 4: Object Storage Test

**Via Replit UI**:
1. Open "Object Storage" tool pane
2. Verify bucket exists
3. Check `public` directory exists
4. Check `.private` directory exists
5. Try uploading a test file
6. Verify file appears in storage

**Via Environment Variables**:
```bash
echo "Public paths: $PUBLIC_OBJECT_SEARCH_PATHS"
echo "Private dir: $PRIVATE_OBJECT_DIR"

# Both should show valid bucket paths like:
# /repl-default-bucket-xyz/public
# /repl-default-bucket-xyz/.private
```

### Step 5: Application Startup Test

**Check startup logs for errors**:

Look for these SUCCESS indicators:
```
✓ No errors about missing DATABASE_URL
✓ No errors about missing PUBLIC_OBJECT_SEARCH_PATHS
✓ No errors about missing PRIVATE_OBJECT_DIR
✓ Server starts successfully on port 5000
✓ CORS configuration loaded successfully
```

Look for these WARNING indicators:
```
⚠ [CORS] Rejected invalid protocol domain
⚠ [CORS] Invalid ALLOWED_ORIGINS URL
⚠ Development mode: captcha bypass enabled
```

**Expected production startup**:
```
[CORS] Loaded X origins from ALLOWED_ORIGINS
[CORS] Total allowed origins configured: X
Serving attached_assets from: /path/to/attached_assets
Created uploads directory: /path/to/uploads
Created avatars directory: /path/to/uploads/avatars
Server running on port 5000
```

### Step 6: CORS Verification

**Browser Console Test**:
1. Open your production site
2. Open browser Developer Tools (F12)
3. Go to Console tab
4. Look for CORS errors (should be none)

**Expected**: No CORS errors in console

**If you see CORS errors**:
- Check `ALLOWED_ORIGINS` includes your domain
- Verify domain format is correct (https://domain.com)
- Check server logs for CORS rejection messages

### Step 7: Authentication Test

**Test Flow**:
1. Navigate to `/register`
2. Create a test account
3. Verify email verification (if enabled)
4. Log in with test account
5. Verify session persists after page reload

**Expected**:
- ✓ Registration succeeds
- ✓ Login succeeds
- ✓ Session persists across page reloads
- ✓ Session cookie is set with correct domain

**Check session in browser**:
1. Open Developer Tools → Application → Cookies
2. Verify `connect.sid` cookie exists
3. Check cookie domain matches your site

### Step 8: File Upload Test

**Test Flow**:
1. Log in as user
2. Try to upload profile picture
3. Verify image appears
4. Check image URL format

**Expected**:
- ✓ Upload succeeds without errors
- ✓ Image loads correctly
- ✓ Image URL uses object storage path

**If upload fails**:
- Check browser console for errors
- Check server logs for object storage errors
- Verify `PUBLIC_OBJECT_SEARCH_PATHS` and `PRIVATE_OBJECT_DIR` are set
- Test object storage access via Replit UI

### Step 9: API Endpoint Test

**Test Critical Endpoints**:

```bash
# Test ping endpoint
curl https://yourdomain.com/api/posts/ping

# Expected: {"success":true,"message":"API connection test successful","contentType":"json"}

# Test trending products
curl https://yourdomain.com/api/products/trending?limit=4

# Expected: JSON array of products

# Test with authentication (after logging in)
curl https://yourdomain.com/api/user \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Expected: User profile data
```

### Step 10: Security Verification

**Captcha Test**:
1. Go to `/register`
2. Verify Turnstile captcha appears
3. Complete captcha
4. Verify form submission works

**Expected**:
- ✓ Captcha widget loads (not "dev mode" message)
- ✓ Captcha validates correctly
- ✓ Form submission succeeds after captcha

**If captcha not working**:
- Check `TURNSTILE_SECRET_KEY` is set
- Check `VITE_TURNSTILE_SITE_KEY` is set
- Verify keys are from https://dash.cloudflare.com/turnstile
- Check browser console for Turnstile errors

## Production Readiness Scorecard

| Category | Item | Status |
|----------|------|--------|
| **Database** | DATABASE_URL set | ⬜ |
| | Database connection successful | ⬜ |
| | Migrations applied | ⬜ |
| **Object Storage** | PUBLIC_OBJECT_SEARCH_PATHS set | ⬜ |
| | PRIVATE_OBJECT_DIR set | ⬜ |
| | Test upload successful | ⬜ |
| **Environment** | NODE_ENV=production | ⬜ |
| | Correct domain in ALLOWED_ORIGINS | ⬜ |
| | No CORS errors in browser | ⬜ |
| **Security** | JWT_SECRET set and unique | ⬜ |
| | Turnstile keys configured | ⬜ |
| | HTTPS enabled | ⬜ |
| **Functionality** | Registration works | ⬜ |
| | Login works | ⬜ |
| | Session persists | ⬜ |
| | File upload works | ⬜ |
| | API endpoints respond | ⬜ |
| **Monitoring** | Diagnostic endpoint accessible | ⬜ |
| | No errors in startup logs | ⬜ |
| | No errors in application logs | ⬜ |

**Target**: All items checked ✓ before production launch

## Common Configuration Issues

### Issue: "DATABASE_URL must be set"
**Cause**: Missing DATABASE_URL environment variable  
**Fix**: Set DATABASE_URL in Replit Secrets  
**Validation**: Code automatically validates on startup

### Issue: "PUBLIC_OBJECT_SEARCH_PATHS not set"
**Cause**: Object storage not configured  
**Fix**: 
1. Open Object Storage tool in Replit
2. Create bucket if not exists
3. Environment variables auto-configured

### Issue: CORS errors in browser console
**Cause**: Production domain not in allowed origins  
**Fix**: Add domain to `ALLOWED_ORIGINS` environment variable  
**Format**: `https://yourdomain.com` (include protocol, no trailing slash)

### Issue: Captcha shows "Development Mode"
**Cause**: Turnstile keys not set  
**Fix**: Set `TURNSTILE_SECRET_KEY` and `VITE_TURNSTILE_SITE_KEY`  
**Note**: Development bypass is automatic when keys missing

### Issue: Session not persisting
**Cause**: Database connection or cookie domain issue  
**Fix**: 
1. Verify DATABASE_URL is correct
2. Check browser cookie settings
3. Verify cookie domain in browser dev tools

### Issue: Images not loading
**Cause**: Object storage paths misconfigured  
**Fix**:
1. Verify `PUBLIC_OBJECT_SEARCH_PATHS` format
2. Check object exists in bucket
3. Test direct object storage access

## Deployment Confidence Level

After completing all verifications:

- **100% (18/18)**: ✅ Ready for production deployment
- **90-99% (16-17/18)**: ⚠️ Nearly ready - fix remaining issues
- **< 90% (< 16/18)**: ❌ Not ready - review missing configurations

## Final Pre-Launch Checklist

Before going live:
- [ ] All environment variables configured
- [ ] Diagnostic endpoint shows all green
- [ ] Test user can register and login
- [ ] File uploads work correctly
- [ ] No console errors in browser
- [ ] No errors in application logs
- [ ] HTTPS enabled and working
- [ ] Captcha functioning correctly
- [ ] Session persistence verified
- [ ] Database connectivity confirmed
- [ ] CORS configured for production domain
- [ ] Backup plan ready if issues arise

## Post-Deployment Monitoring

First 24 hours:
- Monitor application logs for errors
- Check diagnostic endpoint regularly
- Test core functionality frequently
- Monitor database performance
- Watch for CORS or authentication issues
- Gather user feedback

## Support Resources

**Built-in Tools**:
- `/diagnostic/environment` - Comprehensive configuration check
- Application logs - Real-time error monitoring
- Browser console - Client-side issue detection

**Documentation**:
- `DEPLOYMENT_CONFIGURATION_CHECKLIST.md` - Detailed configuration guide
- `PRODUCTION_ENV_QUICK_REFERENCE.md` - Quick reference for env vars
- This file - Pre-deployment verification steps

**Code Validation**:
All critical configuration is validated in code with helpful error messages:
- `server/db.ts` - Database configuration
- `server/objectStorage.ts` - Object storage configuration  
- `server/index.ts` - CORS and server configuration

## Conclusion

Your application architecture is **production-ready** with proper environment variable abstraction and validation. No code changes are required for deployment - only proper configuration of environment variables.

The codebase includes:
✓ Automatic validation of critical settings
✓ Helpful error messages for missing configuration
✓ Built-in diagnostic tools
✓ Clean separation of environment-specific settings
✓ Secure defaults for production

Focus on configuring the environment variables correctly, and the application will handle the rest.
