# Production Environment Variables - Quick Reference

## Required for Production ✅

### Database
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```
**Status**: Already validated in code
**Required**: Yes - Application will not start without this

### Object Storage
```bash
PUBLIC_OBJECT_SEARCH_PATHS=/bucket-name/public
PRIVATE_OBJECT_DIR=/bucket-name/.private
```
**Status**: Must be configured via Replit Object Storage
**Required**: Yes - File uploads will fail without this

### Environment Mode
```bash
NODE_ENV=production
```
**Status**: Set via npm scripts
**Required**: Yes - Affects security settings and features

## Recommended for Production ⚠️

### CORS Configuration
```bash
ALLOWED_ORIGINS=https://dedw3n.com,https://www.dedw3n.com
CUSTOM_DOMAINS=https://yourdomain.com
```
**Status**: Optional but recommended
**Impact**: Controls which domains can access your API

### Captcha (Turnstile)
```bash
CAPTCHA_PROVIDER=turnstile
VITE_CAPTCHA_PROVIDER=turnstile
TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key
VITE_TURNSTILE_SITE_KEY=your_site_key
```
**Status**: Currently empty (dev bypass mode active)
**Required**: Yes for production security
**Get Keys**: https://dash.cloudflare.com/turnstile

## Already Configured ✓

### Security
```bash
JWT_SECRET=2c5e5b832c8ebb8b0a800dbb4113f9e7438a1248f4068407f1c3cdd948b08736a1522790ddbc930c3dae72e5ac19e7697db69513ce612809ae8acd16a1a949d3
```
**Status**: Configured in .env
**Action**: Verify this is unique for production

## Auto-Configured by Replit 🤖

```bash
REPLIT_DOMAINS=auto-populated
REPL_SLUG=auto-populated
REPL_OWNER=auto-populated
```
**Status**: Automatically set by Replit platform
**Action**: No action needed

## Configuration Priority

1. **Critical** (App won't work without these):
   - DATABASE_URL
   - PUBLIC_OBJECT_SEARCH_PATHS
   - PRIVATE_OBJECT_DIR
   - NODE_ENV=production

2. **Important** (Security and functionality):
   - TURNSTILE keys (all 3)
   - JWT_SECRET (unique value)

3. **Optional** (Enhanced configuration):
   - ALLOWED_ORIGINS
   - CUSTOM_DOMAINS

## Quick Setup for Production

1. **Set in Replit Secrets**:
   ```
   DATABASE_URL (from Replit database)
   TURNSTILE_SITE_KEY (from Cloudflare)
   TURNSTILE_SECRET_KEY (from Cloudflare)
   VITE_TURNSTILE_SITE_KEY (same as TURNSTILE_SITE_KEY)
   JWT_SECRET (generate unique value)
   ```

2. **Set via Object Storage Tool**:
   ```
   PUBLIC_OBJECT_SEARCH_PATHS (created automatically)
   PRIVATE_OBJECT_DIR (created automatically)
   ```

3. **Verify in Code**:
   - Run: Visit `/diagnostic/environment` (admin only)
   - Check: All required variables show as "configured"

## Environment Variable Format Rules

### CORS/Domain Variables
- Must be valid URLs (include protocol)
- HTTPS required for production (except development)
- Comma-separated for multiple values
- No trailing slashes
- Examples:
  ```
  ✓ https://dedw3n.com
  ✓ https://api.example.com
  ✗ dedw3n.com (missing protocol)
  ✗ http://production.com (HTTP not allowed in production)
  ```

### Object Storage Paths
- Must start with `/`
- Include bucket name
- Format: `/bucket-name/path`
- Examples:
  ```
  ✓ /repl-default-bucket-xyz/public
  ✓ /my-bucket/.private
  ✗ repl-bucket/public (missing leading slash)
  ```

### Database URL
- PostgreSQL connection string
- Format: `postgresql://user:password@host:port/database`
- SSL automatically enabled
- Example:
  ```
  ✓ postgresql://user:pass@host.neon.tech:5432/dbname
  ```

## Validation Commands

### Check Environment Variables (in shell)
```bash
echo "DATABASE_URL: ${DATABASE_URL:+SET}"
echo "PUBLIC_OBJECT_SEARCH_PATHS: ${PUBLIC_OBJECT_SEARCH_PATHS:+SET}"
echo "PRIVATE_OBJECT_DIR: ${PRIVATE_OBJECT_DIR:+SET}"
echo "NODE_ENV: $NODE_ENV"
```

### Check via Diagnostic Endpoint
```
GET https://yourdomain.com/api/diagnostic/environment
```
(Requires admin authentication)

## Common Issues

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| "DATABASE_URL must be set" | Missing DATABASE_URL | Set in Replit Secrets |
| "PUBLIC_OBJECT_SEARCH_PATHS not set" | Object storage not configured | Use Replit Object Storage tool |
| CORS errors in browser | Domain not in ALLOWED_ORIGINS | Add domain to ALLOWED_ORIGINS |
| Captcha always failing | Missing Turnstile keys | Set all 3 Turnstile variables |
| Session not persisting | DATABASE_URL issue | Verify database connectivity |

## Migration from Development to Production

### Development (.env file)
```bash
# Development uses .env file
NODE_ENV=development
DATABASE_URL=postgresql://...
```

### Production (Replit Secrets)
```bash
# Production uses Replit Secrets UI
NODE_ENV=production
DATABASE_URL=postgresql://... (production database)
TURNSTILE_SITE_KEY=your_key
TURNSTILE_SECRET_KEY=your_secret
VITE_TURNSTILE_SITE_KEY=your_key
```

**Important**: Never commit production secrets to .env file

## Testing Configuration

### Before Deployment
1. Set all required environment variables
2. Test database connection
3. Test object storage upload/download
4. Verify CORS with actual domain
5. Test captcha functionality

### After Deployment
1. Check application logs for errors
2. Visit diagnostic endpoint
3. Test core functionality
4. Monitor for CORS warnings
5. Verify all features work correctly

## Next Steps

1. Review `DEPLOYMENT_CONFIGURATION_CHECKLIST.md` for detailed information
2. Configure missing environment variables
3. Test configuration using diagnostic tools
4. Deploy to production
5. Verify all systems operational
