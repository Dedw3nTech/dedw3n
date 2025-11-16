# Deployment Configuration Checklist

## Overview
This document outlines all environment-specific settings that must be properly configured for production deployment.

## Critical Environment Variables

### 1. Database Configuration ✓
**Environment Variable**: `DATABASE_URL`

**Status**: ✅ Already configured and validated in code
- Automatic validation in `server/db.ts` and `drizzle.config.ts`
- Throws error if not set
- Used for both database connections and session storage

**Production Requirement**: 
- Ensure the connection string points to your production database instance
- SSL is enabled by default in session store configuration

### 2. Object Storage Configuration ⚠️
**Environment Variables**: 
- `PUBLIC_OBJECT_SEARCH_PATHS`
- `PRIVATE_OBJECT_DIR`

**Current Status**: Must be configured via Replit's Object Storage tool

**Production Requirements**:
```bash
# Example configuration (set these in Replit Secrets)
PUBLIC_OBJECT_SEARCH_PATHS=/bucket-name/public
PRIVATE_OBJECT_DIR=/bucket-name/.private
```

**Validation**: Code throws descriptive errors if these are not set (see `server/objectStorage.ts`)

### 3. CORS and Domain Configuration ⚠️
**Environment Variables**:
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins
- `CUSTOM_DOMAINS` - Comma-separated list of custom domains (HTTPS only)
- `REPLIT_DOMAINS` - Automatically populated by Replit

**Current Hardcoded Production Domains**:
- `https://dedw3n.com`
- `https://www.dedw3n.com`

**Production Configuration Example**:
```bash
ALLOWED_ORIGINS=https://dedw3n.com,https://www.dedw3n.com
CUSTOM_DOMAINS=https://yourdomain.com
```

**Important Security Notes**:
- Only HTTPS URLs are accepted for custom production domains
- HTTP is only allowed in development mode
- Invalid URLs are automatically rejected with console warnings

### 4. Environment Detection ⚠️
**Environment Variable**: `NODE_ENV`

**Current Configuration**:
```json
"scripts": {
  "dev": "NODE_ENV=development tsx server/index.ts",
  "start": "NODE_ENV=production node dist/index.js"
}
```

**Production Requirement**: Ensure `NODE_ENV=production` is set for production deployments

**Impact**:
- Affects cache control headers
- Changes CORS allowed origins (excludes localhost)
- Disables development-only endpoints
- Affects captcha bypass mode

### 5. Security Configuration ⚠️

#### JWT Secret ✓
**Environment Variable**: `JWT_SECRET`
- **Status**: ✅ Configured in `.env`
- **Production**: Verify this uses a strong, unique value

#### Captcha Configuration ⚠️
**Current Provider**: Turnstile (Cloudflare)

**Environment Variables**:
```bash
CAPTCHA_PROVIDER=turnstile
VITE_CAPTCHA_PROVIDER=turnstile
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
VITE_TURNSTILE_SITE_KEY=
```

**Current Status**: Empty (development bypass mode active)

**Production Requirements**:
1. Obtain Turnstile keys from https://dash.cloudflare.com/turnstile
2. Set all three Turnstile variables
3. System automatically enables production mode when keys are present

#### Legacy reCAPTCHA Keys ℹ️
**Note**: The following are legacy and should be replaced by Turnstile:
```bash
VITE_RECAPTCHA_SITE_KEY=6LcFQForAAAAAAN8Qb50X0uJxT4mcIKLzrM1cKTJ
RECAPTCHA_SECRET_KEY=6LcFQForAAAAAF8nJpMT52lNnqkAfea9eSZooOqa
```

### 6. Session Storage ✓
**Configuration**: PostgreSQL-backed session storage

**Status**: ✅ Automatically configured using `DATABASE_URL`

**Implementation Details**:
- Uses `connect-pg-simple` with PostgreSQL pool
- SSL enabled with `{ rejectUnauthorized: false }`
- Table name: `session_store` (avoids conflict with analytics)

## Production Deployment Steps

### Pre-Deployment Checklist

1. **Database Configuration**
   - [ ] Verify `DATABASE_URL` points to production database
   - [ ] Test database connectivity
   - [ ] Run database migrations if needed

2. **Object Storage Setup**
   - [ ] Configure object storage bucket in Replit
   - [ ] Set `PUBLIC_OBJECT_SEARCH_PATHS` environment variable
   - [ ] Set `PRIVATE_OBJECT_DIR` environment variable
   - [ ] Test file upload/download functionality

3. **Domain Configuration**
   - [ ] Update `ALLOWED_ORIGINS` with production domains
   - [ ] Add any `CUSTOM_DOMAINS` (HTTPS only)
   - [ ] Verify CORS configuration works for all domains

4. **Environment Settings**
   - [ ] Set `NODE_ENV=production`
   - [ ] Verify production-only features are enabled
   - [ ] Confirm development endpoints are disabled

5. **Security Configuration**
   - [ ] Verify `JWT_SECRET` is strong and unique
   - [ ] Configure Turnstile captcha keys
   - [ ] Test captcha functionality in production mode

### Configuration Validation

Use the built-in diagnostic endpoints to verify configuration:

**Admin-Only Diagnostic Endpoint**:
```
GET /api/diagnostic/environment
```

**Accessible via**: `/diagnostic/environment` (requires admin access)

**Provides**:
- Database connection status
- CORS configuration details
- Object storage paths
- Environment variable status (without exposing secrets)

## Environment Variable Security

### Best Practices
1. **Never commit secrets to `.env` file**
2. **Use Replit Secrets for production**
3. **Rotate secrets regularly**
4. **Use strong, unique values for all secrets**

### Current `.env` File Status
The `.env` file contains:
- Development captcha keys (safe to keep)
- JWT secret (should be unique per environment)
- Turnstile placeholders (empty - safe)

### Recommended Secret Management
For production deployment on Replit:
1. Use Replit's Secrets feature (not `.env` file)
2. Set all production secrets in Replit Secrets UI
3. Secrets are automatically injected as environment variables

## Monitoring and Debugging

### Post-Deployment Verification

1. **Test Key Endpoints**:
   - [ ] Test user authentication flow
   - [ ] Test file upload/download
   - [ ] Test API endpoints
   - [ ] Verify CORS headers in browser console

2. **Check Logs**:
   - [ ] Review startup logs for configuration warnings
   - [ ] Monitor CORS rejection logs
   - [ ] Check object storage error messages

3. **Verify Environment**:
   - [ ] Visit `/diagnostic/environment` (admin only)
   - [ ] Confirm all settings match production requirements

### Common Production Issues

**Issue**: CORS errors in production
**Solution**: Verify `ALLOWED_ORIGINS` includes all production domains

**Issue**: Object storage not working
**Solution**: Confirm `PUBLIC_OBJECT_SEARCH_PATHS` and `PRIVATE_OBJECT_DIR` are set

**Issue**: Database connection failures
**Solution**: Verify `DATABASE_URL` and network connectivity

**Issue**: Captcha always fails
**Solution**: Ensure `TURNSTILE_SECRET_KEY` and `VITE_TURNSTILE_SITE_KEY` are set

## Architecture Notes

### Cross-Environment Data Consistency
The application is designed for environment-agnostic operation:
- Single `DATABASE_URL` ensures data consistency
- No hardcoded domain references in business logic
- All domain-specific logic is environment-driven
- Session persistence works across all deployment domains

### Automatic Configuration Detection
The codebase includes intelligent defaults:
- Development mode: Allows localhost origins
- Production mode: Requires HTTPS for custom domains
- Captcha: Auto-detects provider and enables bypass in dev
- Error messages: Provide guidance when config is missing

## Summary

✅ **Already Configured**: Database, JWT Secret, Session Storage
⚠️ **Needs Configuration**: Object Storage paths, Turnstile keys, Production domains
ℹ️ **Recommended**: Set `NODE_ENV=production`, verify all security settings

All environment-specific settings are properly abstracted through environment variables. No code changes are required - only environment variable configuration.
