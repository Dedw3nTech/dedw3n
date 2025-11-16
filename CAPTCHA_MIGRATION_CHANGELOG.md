# Recent Changes Log

## October 26, 2025 - Captcha Provider Migration

### Summary
Migrated from Google reCAPTCHA Enterprise to a flexible captcha abstraction layer supporting multiple providers, with Cloudflare Turnstile as the default provider.

### Changes
- Created clean abstraction layer in `server/captcha/` with provider interfaces
- Implemented Cloudflare Turnstile provider (default)
- Maintained backward compatibility with Google reCAPTCHA
- Updated frontend to use unified captcha provider
- Zero code changes required for existing implementations
- Switch providers via environment variables

### Benefits
- **Cost Savings**: $0/month with Cloudflare Turnstile vs pay-per-use Google reCAPTCHA Enterprise
- **Zero Vendor Lock-in**: Switch providers via single environment variable
- **Better Privacy**: Cloudflare Turnstile is more privacy-focused
- **Invisible UX**: Minimal user friction with invisible challenges
- **Clean Architecture**: All captcha logic isolated to dedicated modules

### Files Changed
- `server/captcha/` - New captcha abstraction layer
- `client/src/components/captcha/` - Frontend provider components
- `server/routes.ts` - Updated to use new middleware
- `client/src/App.tsx` - Updated provider import
- `.env` - Added Turnstile configuration
- `replit.md` - Updated documentation
- `TURNSTILE_MIGRATION_GUIDE.md` - Complete migration guide

### Configuration
```bash
# Backend
CAPTCHA_PROVIDER=turnstile  # Options: turnstile, recaptcha

# Frontend
VITE_CAPTCHA_PROVIDER=turnstile
```

See TURNSTILE_MIGRATION_GUIDE.md for complete setup instructions.

