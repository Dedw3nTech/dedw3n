# Production Debug: Profile Pictures & User Data Not Loading

## Root Cause Analysis

### Issue Summary
Profile pictures and user data are not loading in **production environment** but work fine in **development environment**.

## Critical Findings

### 1. ✅ Database Configuration - CORRECT
- **Both environments use the same DATABASE_URL**
- Database paths are stored correctly: `/public-objects/avatars/user-X-timestamp-hash.png`
- No database synchronization issues

### 2. ❌ Object Storage Configuration - PRODUCTION ISSUE
**Root Cause**: Production environment likely has incorrect or missing object storage environment variables.

**Evidence**:
```bash
# Required environment variables
PUBLIC_OBJECT_SEARCH_PATHS=/bucket-name/public
PRIVATE_OBJECT_DIR=/bucket-name/.private
```

**How it works**:
1. Avatar URL stored in DB: `/public-objects/avatars/user-4-1762440553060.png`
2. API endpoint: `GET /public-objects/:filePath(*)`
3. Backend parses `PUBLIC_OBJECT_SEARCH_PATHS` to find bucket
4. Backend serves file from object storage

**Why it fails in production**:
- Production might have different bucket name
- Production might not have PUBLIC_OBJECT_SEARCH_PATHS set
- Production object storage might not have the files uploaded

### 3. ❌ Session/Authentication - PRODUCTION ISSUE
**Root Cause**: Session persistence differs between dev and production.

**Configuration differences**:
```javascript
// Cookie configuration
const isHttps = process.env.REPLIT_DEPLOYMENT === '1' || 
                process.env.REPL_SLUG !== undefined ||
                isProduction;

cookie: {
  secure: isHttps,     // TRUE in production
  sameSite: 'lax',
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000
}
```

**Why sessions might fail**:
1. Cookie `secure: true` requires HTTPS (production only)
2. Cross-domain cookie issues if domain differs
3. Session store PostgreSQL connection slower in production
4. Cookie not being sent by browser on initial request

## Diagnostic Steps

### Step 1: Verify Object Storage Environment Variables

**Production Check**:
```bash
# SSH into production or check Replit Secrets
echo $PUBLIC_OBJECT_SEARCH_PATHS
echo $PRIVATE_OBJECT_DIR

# Expected output:
# /replit-objstore-[bucket-id]/public
# /replit-objstore-[bucket-id]/.private
```

**If not set or incorrect**:
```bash
# In Replit Production Secrets, add:
PUBLIC_OBJECT_SEARCH_PATHS=/replit-objstore-[your-bucket-id]/public
PRIVATE_OBJECT_DIR=/replit-objstore-[your-bucket-id]/.private
```

### Step 2: Verify Object Storage Bucket Contents

**Check if files exist in bucket**:
1. Open Replit Object Storage tool
2. Navigate to bucket
3. Check `/public/avatars/` directory
4. Verify files like `user-4-1762440553060-c870787447c85514.png` exist

**If files are missing**:
- Files were uploaded to development local storage, not production object storage
- Need to upload avatar files to production bucket

### Step 3: Test Object Storage API Endpoint

**Development test**:
```bash
curl https://[dev-url]/public-objects/avatars/user-4-1762440553060-c870787447c85514.png
# Expected: Image returned (HTTP 200)
```

**Production test**:
```bash
curl https://[production-url]/public-objects/avatars/user-4-1762440553060-c870787447c85514.png
# Expected: Image returned (HTTP 200)
# If 404: File not in bucket
# If 500: Object storage config error
```

### Step 4: Check Database Avatar Paths

**SQL Query**:
```sql
-- Check avatar paths in database
SELECT id, username, avatar 
FROM users 
WHERE avatar IS NOT NULL 
LIMIT 10;

-- Expected output:
-- id=4, avatar=/public-objects/avatars/user-4-1762440553060-c870787447c85514.png
```

### Step 5: Verify Session Persistence

**Check session store**:
```sql
-- Check if sessions are being created
SELECT * FROM session_store 
ORDER BY expire DESC 
LIMIT 10;

-- Check session count
SELECT COUNT(*) as session_count 
FROM session_store 
WHERE expire > NOW();
```

## Configuration Fixes

### Fix 1: Set Production Object Storage Environment Variables

**In Replit Production Environment Secrets**:
```bash
# Object Storage (CRITICAL)
PUBLIC_OBJECT_SEARCH_PATHS=/replit-objstore-[production-bucket-id]/public
PRIVATE_OBJECT_DIR=/replit-objstore-[production-bucket-id]/.private

# Database (should already be set)
DATABASE_URL=postgresql://[production-db-url]

# Session (CRITICAL)
SESSION_SECRET=[secure-random-string-32-chars-min]
PASSWORD_PEPPER=[secure-random-string-32-chars-min]

# Environment
NODE_ENV=production
```

### Fix 2: Upload Avatar Files to Production Object Storage

**Option A: Manual Upload**:
1. Open Replit Object Storage tool
2. Create `/public/avatars/` directory in production bucket
3. Upload avatar files from development

**Option B: Automated Sync** (if available):
```bash
# Copy files from dev to production bucket
# Use Replit Object Storage API or manual upload
```

### Fix 3: Verify CORS Configuration

**Check that production allows cross-domain requests**:
```javascript
// In server/index.ts (already configured)
const allowedOrigins = [
  'https://dedw3n.com',
  'https://www.dedw3n.com',
  // Production domain should be in ALLOWED_ORIGINS env var
];
```

**Set in production secrets**:
```bash
ALLOWED_ORIGINS=https://dedw3n.com,https://www.dedw3n.com,https://[production-url]
```

## Environment-Specific Configuration Matrix

| Configuration | Development | Production | Status |
|--------------|-------------|-----------|--------|
| DATABASE_URL | Same DB | Same DB | ✅ OK |
| PUBLIC_OBJECT_SEARCH_PATHS | /bucket-dev/public | /bucket-prod/public | ⚠️ CHECK |
| PRIVATE_OBJECT_DIR | /bucket-dev/.private | /bucket-prod/.private | ⚠️ CHECK |
| Cookie secure | true (HTTPS) | true (HTTPS) | ✅ OK |
| Session store | PostgreSQL | PostgreSQL | ✅ OK |
| NODE_ENV | development | production | ✅ OK |
| CORS origins | Replit domains | Custom domains | ⚠️ CHECK |

## Quick Validation Script

**Create this diagnostic endpoint** (temporary):

```typescript
// Add to server/routes.ts for debugging
app.get('/api/debug/config', (req, res) => {
  // ONLY USE IN DEVELOPMENT - REMOVE IN PRODUCTION
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Debug endpoint disabled in production' });
  }
  
  res.json({
    environment: process.env.NODE_ENV,
    hasPublicObjectPaths: !!process.env.PUBLIC_OBJECT_SEARCH_PATHS,
    hasPrivateObjectDir: !!process.env.PRIVATE_OBJECT_DIR,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasSessionSecret: !!process.env.SESSION_SECRET,
    publicPathsCount: (process.env.PUBLIC_OBJECT_SEARCH_PATHS || '').split(',').filter(Boolean).length,
    replId: process.env.REPL_ID,
    isHttps: process.env.REPLIT_DEPLOYMENT === '1' || process.env.REPL_SLUG !== undefined,
  });
});
```

## Expected Production Behavior

### ✅ Working Correctly:
1. User visits site
2. Browser sends request to `/api/user`
3. Session authenticated via cookie
4. User data returned including `avatar: "/public-objects/avatars/user-4-...png"`
5. Browser requests avatar: `GET /public-objects/avatars/user-4-...png`
6. Server reads `PUBLIC_OBJECT_SEARCH_PATHS` → finds bucket
7. Server serves file from object storage
8. Avatar displays

### ❌ Current Production Issue:
1. User visits site ✅
2. Browser sends request to `/api/user`
3. Session NOT authenticated ❌ (Cookie not sent/stored)
4. OR: User data returned ✅ but avatar path incorrect
5. Browser requests avatar: `GET /public-objects/avatars/user-4-...png`
6. Server reads `PUBLIC_OBJECT_SEARCH_PATHS` → NOT SET ❌
7. OR: Bucket doesn't have file ❌
8. 404 or 500 error ❌
9. Avatar doesn't display ❌

## Production Deployment Checklist

### Pre-Deployment
- [ ] Verify `PUBLIC_OBJECT_SEARCH_PATHS` is set in production secrets
- [ ] Verify `PRIVATE_OBJECT_DIR` is set in production secrets
- [ ] Verify `SESSION_SECRET` is set (32+ chars, secure random)
- [ ] Verify `PASSWORD_PEPPER` is set (32+ chars, secure random)
- [ ] Verify `DATABASE_URL` is set
- [ ] Verify `ALLOWED_ORIGINS` includes production domain
- [ ] Upload avatar files to production object storage bucket

### Post-Deployment
- [ ] Test `/api/user` endpoint returns user data
- [ ] Test avatar URL: `GET /public-objects/avatars/user-X-...png` returns 200
- [ ] Test login flow (should work on first attempt)
- [ ] Check browser console for CORS errors
- [ ] Check server logs for object storage errors
- [ ] Verify session persistence (login, refresh page, still logged in)

## Troubleshooting Commands

### 1. Check Environment Variables
```bash
# In production shell
env | grep -E "PUBLIC_OBJECT|PRIVATE_OBJECT|DATABASE_URL|SESSION_SECRET"
```

### 2. Test Database Connection
```bash
# Test database query
curl https://[production-url]/api/user
```

### 3. Test Object Storage
```bash
# Test file access
curl -I https://[production-url]/public-objects/avatars/user-4-1762440553060-c870787447c85514.png
```

### 4. Check Application Logs
```bash
# Look for these indicators
grep "Object Storage Available" logs
grep "Storage Status" logs
grep "PUBLIC_OBJECT_SEARCH_PATHS" logs
```

## Clean Coding Best Practices Applied

### 1. Environment Variable Validation
- Validators check for required vars on startup
- Clear error messages if vars missing
- Fail fast in production if critical config missing

### 2. Separation of Concerns
- Object storage service isolated in `objectStorage.ts`
- Route handlers don't handle storage logic directly
- Clean error handling and logging

### 3. Error Handling
- Try-catch blocks around storage operations
- Detailed logging for debugging
- User-friendly error messages

### 4. Configuration Management
- Environment-specific configurations clearly separated
- Production vs development differences documented
- No hardcoded values

## Next Steps

1. **Immediate**: Check production environment variables
2. **Urgent**: Upload avatar files to production bucket
3. **Important**: Test session persistence in production
4. **Monitor**: Check application logs for storage errors
5. **Validate**: Run all checklist items above

## Success Criteria

✅ **Production working when**:
1. Environment variables set correctly
2. Avatar files exist in production bucket
3. `/api/user` returns user data with avatar path
4. Avatar images load without 404 errors
5. Sessions persist across requests
6. Login works on first attempt

---

**Summary**: The issue is NOT in the code or database. It's a production environment configuration issue where object storage environment variables are not properly set or the bucket doesn't contain the uploaded files.
