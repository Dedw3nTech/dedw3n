# Cloudflare Turnstile Migration Guide

## Overview
This guide explains how to configure and use Cloudflare Turnstile as a replacement for Google reCAPTCHA in the Dedw3n platform.

## Environment Variables

### Backend (.env)
```bash
# Captcha Provider Selection (default: turnstile)
CAPTCHA_PROVIDER=turnstile  # Options: turnstile, recaptcha

# Cloudflare Turnstile Configuration
TURNSTILE_SITE_KEY=your_turnstile_site_key_here
TURNSTILE_SECRET_KEY=your_turnstile_secret_key_here

# Legacy Google reCAPTCHA (for fallback/compatibility)
RECAPTCHA_SITE_KEY=6LcFQForAAAAAAN8Qb50X0uJxT4mcIKLzrM1cKTJ
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key_here
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key_here
```

### Frontend (.env or Vite environment)
```bash
# Captcha Provider Selection (must match backend)
VITE_CAPTCHA_PROVIDER=turnstile  # Options: turnstile, recaptcha

# Cloudflare Turnstile Site Key
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key_here

# Legacy Google reCAPTCHA Site Key (for fallback)
VITE_RECAPTCHA_SITE_KEY=6LcFQForAAAAAAN8Qb50X0uJxT4mcIKLzrM1cKTJ
```

## Getting Cloudflare Turnstile Keys

1. **Sign up for Cloudflare** (if you don't have an account)
   - Visit: https://dash.cloudflare.com/sign-up
   - Free tier is sufficient

2. **Create a Turnstile Site**
   - Go to: https://dash.cloudflare.com/?to=/:account/turnstile
   - Click "Add Site"
   - Enter your domain(s) or use `localhost` for development
   - Choose "Invisible" widget mode
   - Copy the **Site Key** and **Secret Key**

3. **Configure Environment Variables**
   - Add keys to your `.env` file
   - Set `CAPTCHA_PROVIDER=turnstile`
   - Set `VITE_CAPTCHA_PROVIDER=turnstile`

## Architecture

### Clean Abstraction Layer
The migration uses a clean adapter pattern that isolates captcha provider logic:

```
server/captcha/
├── types.ts                  # Provider interfaces
├── factory.ts                # Provider factory
├── middleware.ts             # Express middleware
├── turnstile-provider.ts     # Turnstile implementation
├── recaptcha-provider.ts     # reCAPTCHA wrapper
└── index.ts                  # Module entry point

client/src/components/captcha/
├── TurnstileProvider.tsx     # Turnstile React provider
├── UnifiedCaptchaProvider.tsx # Dynamic provider selector
└── index.ts                  # Module entry point
```

### Benefits
- **Zero vendor lock-in**: Switch providers via environment variable
- **Clean code**: All captcha logic isolated to dedicated modules
- **Backward compatible**: Existing code continues to work
- **Development friendly**: Auto-bypass in development mode
- **Type safe**: Full TypeScript support

## Migration Checklist

### Phase 1: Setup ✅
- [x] Create captcha abstraction layer
- [x] Implement Turnstile provider
- [x] Create frontend provider component
- [x] Update backend middleware
- [x] Update frontend App.tsx

### Phase 2: Configuration
- [ ] Get Cloudflare Turnstile keys
- [ ] Add environment variables
- [ ] Set `CAPTCHA_PROVIDER=turnstile`
- [ ] Set `VITE_CAPTCHA_PROVIDER=turnstile`

### Phase 3: Testing
- [ ] Test authentication flows
- [ ] Test vendor registration
- [ ] Test contact forms
- [ ] Test email validation
- [ ] Verify development bypass works
- [ ] Test production deployment

### Phase 4: Cleanup (Optional)
- [ ] Remove Google reCAPTCHA dependencies if not needed
- [ ] Update documentation
- [ ] Remove old reCAPTCHA files

## Provider Comparison

| Feature | Turnstile | reCAPTCHA v3 | reCAPTCHA Enterprise |
|---------|-----------|--------------|----------------------|
| Cost | **Free** | Free | Pay-per-use |
| User Friction | Minimal | Minimal | Minimal |
| Privacy | **Excellent** | Good | Good |
| Scoring | Binary (pass/fail) | 0.0-1.0 | 0.0-1.0 |
| Setup | Simple | Simple | Complex |
| Dependencies | None | Google account | Google Cloud |

## Development Mode

Both providers support development bypass:

```typescript
// Frontend automatically returns bypass token in dev mode
const token = await executeRecaptcha('login'); 
// Returns 'dev_bypass_token' in development

// Backend automatically accepts dev bypass
// When: process.env.NODE_ENV === 'development'
// Or: host includes 'replit.dev' or 'localhost'
```

## Switching Back to reCAPTCHA

If you need to switch back to Google reCAPTCHA:

```bash
# Backend
CAPTCHA_PROVIDER=recaptcha

# Frontend
VITE_CAPTCHA_PROVIDER=recaptcha
```

No code changes required! The abstraction layer handles everything.

## Troubleshooting

### "Turnstile provider not configured" error
- Check that `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are set
- Verify environment variables are loaded (restart server)
- Confirm keys are valid (test in Cloudflare dashboard)

### Token verification fails
- Ensure `VITE_CAPTCHA_PROVIDER` matches backend `CAPTCHA_PROVIDER`
- Check Turnstile site key matches between frontend and backend config
- Verify domain is whitelisted in Cloudflare Turnstile settings

### Development bypass not working
- Check `NODE_ENV=development` is set
- Verify host includes 'replit.dev' or 'localhost'
- Look for `[TURNSTILE]` or `[CAPTCHA-MIDDLEWARE]` logs confirming bypass

## Cost Savings

**Before (Google reCAPTCHA Enterprise):**
- Variable cost based on usage
- Requires Google Cloud account
- Requires API key management

**After (Cloudflare Turnstile):**
- $0/month unlimited requests
- Simple Cloudflare account
- Minimal configuration

## Support

For issues with:
- **Turnstile**: https://developers.cloudflare.com/turnstile/
- **Migration**: Check server logs for `[TURNSTILE]` or `[CAPTCHA]` prefixes
- **Integration**: Review this guide and code comments

## Next Steps

1. Get Turnstile keys from Cloudflare dashboard
2. Update environment variables
3. Restart application
4. Test critical flows (auth, vendor registration, contact)
5. Monitor logs for verification success
6. Celebrate $0/month captcha protection! 🎉
