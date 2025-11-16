# Dedw3n Marketplace Platform - Deployment Guide

## Production Readiness Status: ✅ READY

This document provides comprehensive instructions for deploying the Dedw3n marketplace platform to production on Replit.

---

## Pre-Deployment Checklist

### ✅ Completed Items
- [x] Frontend image loading errors resolved
- [x] API error handling verified (cryptocurrency & geolocation APIs have graceful fallbacks)
- [x] Environment variables configured and verified
- [x] Build configuration optimized for production
- [x] Multi-level caching system implemented and tested
- [x] Security headers applied to all routes
- [x] Database migrations configured (Drizzle ORM auto-sync)
- [x] LSP errors verified (only 1 non-critical error in vite.config.ts)
- [x] Server health checks active
- [x] Cache warmup confirmed working

### ⚠️ Action Required Before Deployment
- [ ] **Add STRIPE_PUBLISHABLE_KEY** - Required for frontend Stripe integration
  - Go to Replit Secrets
  - Add key: `STRIPE_PUBLISHABLE_KEY`
  - Value: Your Stripe publishable key from Stripe Dashboard

---

## Environment Variables

### Critical Production Secrets (Already Configured)
```
DATABASE_URL                 - PostgreSQL connection string
SESSION_SECRET              - Express session encryption key
STRIPE_SECRET_KEY           - Stripe API secret key (backend)
R2_ACCOUNT_ID               - Cloudflare R2 account ID
R2_ACCESS_KEY_ID            - Cloudflare R2 access key
R2_SECRET_ACCESS_KEY        - Cloudflare R2 secret key
R2_BUCKET_NAME              - Cloudflare R2 bucket name
BREVO_API_KEY               - Brevo SMTP API key for emails
```

### Missing (Add Before Deployment)
```
STRIPE_PUBLISHABLE_KEY      - Stripe publishable key (frontend) ⚠️ REQUIRED
```

### Optional API Keys (Graceful Fallbacks Configured)
```
COINMARKETCAP_API_KEY       - Cryptocurrency data (optional)
OPENCAGE_API_KEY            - Geolocation services (optional)
DEEPL_API_KEY               - Translation services (optional)
```

---

## Build Configuration

### Production Optimizations
The build configuration is already optimized for production deployment:

**Vite Build Settings:**
- Code splitting enabled with optimized chunk strategy
- Minification: Terser for JS, cssnano for CSS
- Cache busting with content hashes in filenames
- Tree shaking enabled
- Source maps disabled for production
- Asset optimization (images, fonts, etc.)

**Chunking Strategy:**
```javascript
vendor:   React, Wouter, TanStack Query (cached across deployments)
ui:       Radix UI, Shadcn components
charts:   Recharts library
editor:   Lexical rich text editor
```

**Build Command:** `npm run build`

**Output Directory:** `dist/`

---

## Security Implementation

### Comprehensive Security Headers
All routes (app-level, router-level, and nested routers) are protected with security headers via Express monkey-patching:

**Headers Applied (Production Only):**
- **Content-Security-Policy (CSP):** Restricts resource loading
- **Strict-Transport-Security (HSTS):** Forces HTTPS (only when HTTPS detected)
- **X-Frame-Options:** Prevents clickjacking
- **X-Content-Type-Options:** Prevents MIME sniffing
- **X-XSS-Protection:** Enables browser XSS protection
- **Referrer-Policy:** Controls referrer information
- **Permissions-Policy:** Controls browser features
- **Cross-Origin-Embedder-Policy (COEP):** Prevents cross-origin resource loading
- **Cross-Origin-Opener-Policy (COOP):** Isolates browsing context
- **Cross-Origin-Resource-Policy (CORP):** Prevents cross-origin resource access

**Implementation Details:**
- Located in: `server/index.ts` and `server/utils/securityHeaders.ts`
- NO middleware used (pure function patching)
- Preserves Express error handler function arity
- Covers all routes: app verbs, Router prototype, and app.use()

**Dev vs Production:**
- Development: Most headers disabled for easier debugging
- Production: Full security header suite enabled

---

## Database Configuration

### Drizzle ORM Auto-Sync
The platform uses Drizzle ORM with automatic schema synchronization:

**Configuration:**
- Schema defined in: `shared/schema.ts`
- Migrations: Automatic via `db:push` (no manual migration needed)
- Connection pooling: Configured in `server/db.ts`

**Pre-Deployment Database Tasks:**
- ✅ Schema verified and synchronized
- ✅ Connection pooling configured
- ✅ Session store configured (connect-pg-simple)

---

## Performance Features

### Multi-Level Caching System
The application implements a comprehensive three-tier caching system:

**1. LRU Cache (server/cache-service.ts)**
- In-memory caching for frequently accessed data
- Automatic TTL and size limits
- Categories: users, products, posts, communities, etc.

**2. HTTP Cache (server/http-cache-middleware.ts)**
- ETag-based caching with conditional requests
- RFC 9110 compliant 304 Not Modified responses
- Cache-Control headers with stale-while-revalidate

**3. Query Cache (server/query-cache.ts)**
- React Query integration on frontend
- Smart cache invalidation
- Request deduplication

**Cache Invalidation:**
- Centralized cache clearing via `server/cache-invalidation.ts`
- Synchronized across all three tiers
- Prevents stale data issues

**Cache Warmup:**
- Automatic background warmup on server start
- Priority-based data pre-loading
- Non-blocking startup architecture

---

## Publishing on Replit

### Step-by-Step Deployment

1. **Verify Environment Variables**
   ```bash
   # Add STRIPE_PUBLISHABLE_KEY in Replit Secrets
   # All other secrets should already be configured
   ```

2. **Build the Application**
   ```bash
   npm run build
   ```
   This creates optimized production assets in `dist/`

3. **Test Production Build Locally**
   ```bash
   NODE_ENV=production npm start
   ```
   Verify the application runs correctly in production mode

4. **Click the "Publish" Button**
   - In Replit, click the "Publish" or "Deploy" button
   - Replit will automatically:
     - Build your application
     - Configure hosting and TLS
     - Run health checks
     - Assign a `.replit.app` domain

5. **Monitor Health Checks**
   - Health endpoint: `GET /health`
   - Detailed health: `GET /api/health/detailed` (requires authentication)
   - Replit uses `/health` for deployment health checks

6. **Verify Deployment**
   - Check that HTTPS is enforced
   - Verify security headers are present (use browser dev tools)
   - Test critical features: login, product listing, checkout

---

## Post-Deployment Verification

### Critical Checks

1. **Security Headers**
   ```bash
   curl -I https://your-app.replit.app/
   ```
   Verify headers: CSP, HSTS, X-Frame-Options, etc.

2. **HTTPS Enforcement**
   - All requests should redirect to HTTPS
   - HSTS header should be present

3. **Database Connectivity**
   - Test user registration/login
   - Verify data persistence

4. **File Uploads**
   - Test profile picture upload
   - Test product image upload
   - Verify Cloudflare R2 integration

5. **Payment Processing**
   - Test Stripe checkout flow
   - Verify webhook endpoints

6. **Email Notifications**
   - Test user registration email
   - Test password reset email
   - Verify Brevo SMTP integration

7. **Caching System**
   - Monitor cache hit rates
   - Verify cache invalidation works correctly

8. **Performance**
   - Test page load times
   - Verify lazy loading works
   - Check mobile responsiveness

---

## Known Issues & Limitations

### Non-Critical Issues (Graceful Fallbacks)
1. **Cryptocurrency API:** May fail if COINMARKETCAP_API_KEY is invalid
   - Fallback: Default currency list displayed
   - Impact: Low - currency selection still works

2. **Geolocation API:** May fail if OPENCAGE_API_KEY is invalid
   - Fallback: Manual location entry
   - Impact: Low - users can still set location

3. **Translation API:** May fail if DEEPL_API_KEY is invalid
   - Fallback: UI still works in default language
   - Impact: Low - manual translation can be added

### Single-Node Caching
- Current caching implementation uses in-memory storage
- For multi-instance deployments (Autoscale), consider:
  - Redis for shared cache backing store
  - Distributed cache invalidation

---

## Monitoring & Maintenance

### Health Monitoring
```
GET /health                     - Public health check
GET /api/health/detailed        - Detailed system status (authenticated)
```

### Logs
- Server logs: View in Replit console
- Error tracking: Centralized error reporting system
- Cache monitoring: `CacheMonitor` component in admin dashboard

### Performance Monitoring
- Cache hit rates: View in admin dashboard
- Query performance: Monitor via browser dev tools
- Database connections: Check Neon dashboard

---

## Rollback Procedure

If issues occur after deployment:

1. **Use Replit Checkpoints**
   - Click "View Checkpoints" in Replit
   - Select a previous stable checkpoint
   - Rollback code, database, and files

2. **Manual Rollback**
   ```bash
   git log --oneline
   git revert <commit-hash>
   ```

3. **Database Rollback**
   - Replit checkpoints include database state
   - For manual rollback, use database backups

---

## Support & Documentation

### Additional Resources
- `replit.md` - Project overview and architecture
- `README.md` - Development setup instructions
- `server/utils/securityHeaders.ts` - Security header configuration
- `vite.config.ts` - Build configuration

### External Documentation
- [Replit Deployments](https://docs.replit.com/hosting/deployments)
- [Stripe Documentation](https://stripe.com/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)

---

## Deployment Summary

### Ready for Production ✅
- **Security:** Comprehensive headers on all routes
- **Performance:** Multi-level caching with cache warmup
- **Build:** Optimized production configuration
- **Database:** Auto-sync with Drizzle ORM
- **Monitoring:** Health checks and error tracking
- **Resilience:** Graceful fallbacks for external APIs

### Action Required ⚠️
- **Add STRIPE_PUBLISHABLE_KEY** before deployment

### Post-Deployment Tasks
- Verify security headers in production
- Monitor cache performance
- Test payment flows end-to-end
- Set up custom domain (optional)

---

**Deployment Status:** PRODUCTION READY (pending STRIPE_PUBLISHABLE_KEY)

**Last Updated:** November 13, 2025
