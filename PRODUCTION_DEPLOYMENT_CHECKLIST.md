# Production Deployment Checklist
**Dedw3n Marketplace Platform**  
**Version:** 1.0  
**Last Updated:** November 6, 2025

---

## Pre-Deployment Verification

### 1. Environment Variables ✅
Verify all required environment variables are set:

```bash
# Database
[ ] DATABASE_URL - PostgreSQL connection string (Neon)

# Session Management  
[ ] SESSION_SECRET - Strong random secret (min 32 characters)

# Object Storage
[ ] PUBLIC_OBJECT_SEARCH_PATHS - Comma-separated public paths
[ ] PRIVATE_OBJECT_DIR - Private object directory path

# Payment Processing
[ ] STRIPE_SECRET_KEY - Stripe secret key (sk_live_...)
[ ] STRIPE_PUBLISHABLE_KEY - Stripe publishable key (pk_live_...)

# Email Service
[ ] BREVO_API_KEY - Brevo email service API key

# Optional but Recommended
[ ] COINGECKO_API_KEY - Paid tier to avoid rate limiting
[ ] NODE_OPTIONS=--max-old-space-size=2048 - Memory optimization
```

### 2. Database Health ✅
```bash
[ ] Database connection successful
[ ] Connection pool configured (max: 10, min: 2)
[ ] Migrations applied and verified
[ ] Backup strategy in place
[ ] Connection health check working (< 100ms response)
```

### 3. Object Storage ✅
```bash
[ ] Bucket created and accessible
[ ] Public directory configured  
[ ] Private directory configured
[ ] Upload/download tested
[ ] ACL permissions verified
```

### 4. Payment Integration ✅
```bash
[ ] Stripe webhook endpoint configured
[ ] Webhook secret stored securely
[ ] Test payment completed successfully
[ ] Crypto payment caching verified
[ ] Circuit breaker tested
```

---

## Configuration Verification

### 1. Database Connection Pool
Check that pool configuration matches production requirements:

```typescript
// Expected configuration in server/storage.ts
max: 10                      // ✅ Matches Neon free tier limit
min: 2                       // ✅ Keeps connections warm
idleTimeoutMillis: 30000     // ✅ Closes idle connections quickly
connectionTimeoutMillis: 5000 // ✅ Prevents long waits
maxUses: 7500                // ✅ Prevents memory leaks
```

### 2. Session Store Optimization
Verify session store settings:

```typescript
// Expected configuration
pruneSessionInterval: 6 * 60 * 60  // ✅ 6 hours (reduced DB load)
ttl: 7 * 24 * 60 * 60             // ✅ 7 days
touchAfter: 2 * 60 * 60            // ✅ 2 hours (66% fewer writes)
errorLog: console.error            // ✅ Error logging enabled
```

### 3. Crypto API Optimization
Confirm API rate limiting protection:

```typescript
// Circuit breaker configuration
MAX_FAILURES_BEFORE_CIRCUIT_BREAK: 5  // ✅ Prevent API hammering
CIRCUIT_BREAKER_COOLDOWN: 5 * 60 * 1000  // ✅ 5 minute cooldown
MIN_API_CALL_INTERVAL: 3000        // ✅ 3 seconds between calls

// Multi-tier caching
FRESH: 5 * 60 * 1000              // ✅ 5 minutes
ACCEPTABLE: 15 * 60 * 1000        // ✅ 15 minutes
FALLBACK: 60 * 60 * 1000          // ✅ 60 minutes
```

---

## Performance Benchmarks

Run these tests and verify they meet targets:

### Database Performance
```bash
# Expected: < 100ms for simple queries
curl -w "@curl-format.txt" http://localhost:5000/api/user

Target: < 100ms
Critical Threshold: > 500ms
```

### API Response Time
```bash
# Expected: < 200ms for API endpoints
curl -w "@curl-format.txt" http://localhost:5000/api/products

Target: < 200ms
Critical Threshold: > 1000ms
```

### Object Storage
```bash
# Expected: < 500ms for image loads
curl -w "@curl-format.txt" http://localhost:5000/public-objects/...

Target: < 500ms
Critical Threshold: > 2000ms
```

---

## Security Checklist

### 1. Authentication & Sessions
```bash
[ ] Session cookies are HTTP-only
[ ] Secure flag enabled in production
[ ] SameSite=Strict or Lax configured
[ ] CSRF protection enabled
[ ] Rate limiting on login endpoints
```

### 2. Database Security
```bash
[ ] SSL/TLS enabled for database connections
[ ] Connection pooling prevents exhaustion attacks
[ ] Parameterized queries used (Drizzle ORM)
[ ] Query timeouts configured
[ ] No SQL injection vulnerabilities
```

### 3. Object Storage Security
```bash
[ ] Private objects require authentication
[ ] Public objects have appropriate ACLs
[ ] Signed URLs expire (default: 15 minutes)
[ ] Upload size limits enforced
[ ] Rate limiting on upload endpoints
```

### 4. API Security
```bash
[ ] API keys stored in environment variables
[ ] No secrets in source code
[ ] CORS configured properly
[ ] Rate limiting on all public endpoints
[ ] Input validation on all endpoints
```

---

## Monitoring Setup

### 1. Health Checks
Verify these endpoints are working:

```bash
# Database health
[ ] Periodic health check runs every 30s
[ ] Logs response time
[ ] Warns if > 1000ms
[ ] Reports pool statistics

# Application health
[ ] GET /api/health returns 200
[ ] Memory usage monitored
[ ] CPU usage tracked
```

### 2. Error Tracking
```bash
[ ] Error logging to console
[ ] Critical errors flagged
[ ] Database errors logged
[ ] API failures tracked
[ ] Circuit breaker status logged
```

### 3. Performance Monitoring
```bash
[ ] Database query times logged
[ ] API response times tracked
[ ] Cache hit rates monitored
[ ] Connection pool stats logged
[ ] Session prune operations timed
```

---

## Deployment Steps

### 1. Pre-Deployment
```bash
1. [ ] Review all code changes
2. [ ] Run LSP diagnostics check
3. [ ] Execute test suite
4. [ ] Verify environment variables
5. [ ] Check database migrations
6. [ ] Backup production database
7. [ ] Review monitoring dashboards
```

### 2. Deployment
```bash
1. [ ] Deploy to staging environment
2. [ ] Run smoke tests
3. [ ] Verify database connectivity
4. [ ] Test object storage
5. [ ] Validate payment processing
6. [ ] Check email delivery
7. [ ] Monitor error rates
8. [ ] Deploy to production
```

### 3. Post-Deployment
```bash
1. [ ] Verify application is running
2. [ ] Check health endpoints
3. [ ] Monitor error logs (first 15 minutes)
4. [ ] Verify database connections
5. [ ] Test critical user flows
6. [ ] Check performance metrics
7. [ ] Validate cache behavior
8. [ ] Monitor for 24 hours
```

---

## Rollback Plan

### Immediate Rollback Triggers
- Application won't start
- Database connection failures
- 50%+ error rate
- Payment processing completely broken
- Data loss detected

### Rollback Steps
```bash
1. [ ] Notify team of rollback decision
2. [ ] Revert to previous deployment
3. [ ] Verify rollback successful
4. [ ] Check all systems operational
5. [ ] Investigate root cause
6. [ ] Create post-mortem
```

---

## Cost Optimization Verification

### Database (Neon)
```bash
[ ] Idle connections close after 30s
[ ] Connection pool size appropriate (max: 10)
[ ] Query result caching implemented where applicable
[ ] No long-running idle connections
```

### Object Storage (GCS)
```bash
[ ] CDN caching enabled (24h for images, 7d for videos)
[ ] Compression enabled for images
[ ] Lifecycle policies for old files
[ ] Appropriate cache headers set
```

### Compute Resources
```bash
[ ] Node.js memory optimized (2048MB)
[ ] No memory leaks detected
[ ] Graceful shutdown implemented
[ ] Autoscaling configured
```

---

## Emergency Contacts

### Critical Issues
- **Database Down**: Check Neon status page, verify DATABASE_URL
- **Payment Failures**: Check Stripe dashboard, verify webhooks
- **Storage Issues**: Verify bucket access, check environment variables
- **API Rate Limits**: Monitor circuit breaker, verify caching

### Support Channels
- Database: Neon support
- Payment: Stripe support  
- Storage: Google Cloud support
- Platform: Replit support

---

## Monitoring Dashboards

### Key Metrics to Monitor

1. **Application Health**
   - Uptime percentage
   - Error rate
   - Response time (p50, p95, p99)

2. **Database**
   - Connection pool usage
   - Query response times
   - Slow queries (> 1000ms)
   - Connection failures

3. **API Performance**
   - CoinGecko API failures
   - Circuit breaker activations
   - Cache hit rate
   - Stale data usage

4. **User Activity**
   - Active users
   - Session creation rate
   - Login failures
   - Payment transactions

---

## Post-Deployment Validation

### Day 1 (First 24 Hours)
```bash
Hour 1:  [ ] No critical errors, response times < 200ms
Hour 4:  [ ] Database connections stable, no pool exhaustion
Hour 12: [ ] Session pruning working, no user complaints
Hour 24: [ ] All systems stable, performance targets met
```

### Week 1
```bash
Day 1: [ ] Initial deployment stable
Day 3: [ ] Performance trends positive
Day 7: [ ] Cost within budget, no optimization needed
```

### Month 1
```bash
Week 1: [ ] All systems operational
Week 2: [ ] User feedback positive
Week 3: [ ] Performance benchmarks met
Week 4: [ ] Ready for scaling discussion
```

---

## Success Criteria

Deployment is considered successful when:

1. ✅ All health checks passing
2. ✅ Error rate < 0.1%
3. ✅ Response time < 200ms (p95)
4. ✅ Database queries < 100ms (p95)
5. ✅ Zero payment failures
6. ✅ Circuit breaker functioning correctly
7. ✅ Cache hit rate > 80%
8. ✅ User sessions stable
9. ✅ No data loss incidents
10. ✅ Cost within projected budget

---

## Sign-Off

**Pre-Deployment Review:**
- [ ] Technical Lead
- [ ] DevOps Engineer
- [ ] Product Manager

**Post-Deployment Verification:**
- [ ] All systems operational  
- [ ] Performance metrics met
- [ ] No critical issues
- [ ] Monitoring active

**Deployment Completed:** _______________  
**Verified By:** _______________  
**Date:** _______________

---

**Document Version:** 1.0  
**Next Review:** After every major deployment
