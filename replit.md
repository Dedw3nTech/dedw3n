# Dedw3n Marketplace Platform

## Overview
Dedw3n is a multi-purpose social marketplace platform designed to enhance global communication through seamless product discovery, community interaction, and advanced transactional capabilities. It offers sophisticated post creation, real-time content sharing, comprehensive moderation, and flexible content type support (text, product, event) to foster a vibrant and secure online community. The platform aims to provide a robust and engaging experience for users worldwide by enabling global communication and commerce. It includes advanced features like an exclusive content system for community monetization and a modern CMS with a rich text editor.

## User Preferences
- Focus on resolving technical issues systematically.
- Prioritize Search Console compliance and SEO optimization.
- Maintain clear documentation of architectural changes.
- Use comprehensive error handling and logging.
- Implement comprehensive features without unnecessary advanced UI enhancements when core functionality is sufficient.
- Conduct comprehensive error assessments covering 400/500 errors, JavaScript, authentication, Wouter routing, LSP, and TypeScript issues when implementing major changes.
- NO middleware solutions - only manual coding approaches are acceptable.
- Strict black and white color scheme - absolutely no icons anywhere (use text for toggles/buttons).
- All user-facing strings must use DeepL Master Translation system for comprehensive multilingual support.

## System Architecture
The platform utilizes a modular, layered architecture for maintainability and scalability.

**UI/UX Decisions:**
- Clean, professional design with a consistent black color palette.
- Streamlined dashboards and personalized notifications.
- Enhanced product sharing and optimized accessibility.
- Mobile-first design with optimized touch targets, fluid grids, flexible images, and progressive text sizing.

**Technical Implementations:**
- **Frontend:** React with TypeScript (Vite), featuring route and component-level code splitting, video-based loading, and ChunkLoadErrorBoundary.
- **Backend:** Express.js with TypeScript, ensuring a clear separation of concerns.
- **Database:** PostgreSQL with Drizzle ORM for automated synchronization and enterprise-grade connection management.
- **Authentication:** Passport.js-based system for session management, JWT, secure cookies, rate limiting, input validation, 18+ age verification, password reset, and secure hashing, implemented without middleware.
- **File Management:** Multer for media uploads to Cloudflare R2, with specific handling for profile pictures including manual inline authentication, rate limiting, and a `ProfilePictureProtectionService`.
- **Real-time Communication:** WebSockets for live messaging and notifications with session caching.
- **Marketplace Core:** Modules for product, vendor, and order management.
- **Payment Processing:** Multi-provider support with refunds and commission calculation.
- **Notifications:** Multi-channel system with user preferences.
- **Analytics:** Comprehensive tracking for products, vendors, platform, and user engagement, including LinkedIn-style profile and post analytics.
- **Admin Control:** User management, content moderation, vendor requests, platform statistics, and a comprehensive ticketing system.
- **Ticketing System:** Multi-department support with Brevo email integration, automatic user linking, priority management, and status tracking.
- **Security:** Hardened against vulnerabilities with debug cleanup, error response sanitization, secure APIs, HTTPS enforcement, production-grade rate limiting, privacy-first cookie policy, and comprehensive security headers applied to all routes without middleware.
- **Data Protection Module:** Enterprise-grade data protection including input sanitization, output encoding, AES-256-GCM encryption, audit logging, privacy compliance (GDPR/CCPA), data masking, and secure deletion.
- **Internationalization:** Comprehensive multilingual translation system using DeepL API, supporting 20+ languages with auto-translation and full localization, including multi-layered caching.
- **Global Currency Support:** 100+ currency system with a professional selection interface and regional grouping.
- **Age Verification:** Comprehensive 18+ age verification on all registration forms with real-time validation.
- **Comprehensive City Database:** Self-contained local city database covering 195+ countries with intelligent autocomplete, fuzzy matching, and typo correction.
- **Search Console SEO Compliance:** Comprehensive 404 error resolution, synchronized `sitemap.xml` routing, and proper server-side SEO file handling.
- **Error Handling System:** User-friendly error handling with unique error codes, one-click instant error reporting, and centralized, database-first processing.
- **Server Resilience:** Comprehensive error handling for port conflicts, graceful shutdown, and proper exit codes.
- **Health Check System:** Production-ready health monitoring with public `/health` and detailed `/api/health/detailed` endpoints.
- **Vidz Feature:** TikTok-style short video viewing experience with interactive features.
- **Community Search System:** Full search capabilities across posts, members, videos, events, and dating profiles.
- **Logout Process:** Efficient, instant logout with comprehensive client and server-side state clearing.
- **Cross-Domain Data Consistency:** Environment-agnostic architecture with unified database access and comprehensive CORS configuration.
- **Global Holiday System:** Integration with Nager.Date API, featuring database-backed storage and caching.
- **Exclusive Content Feature:** Community monetization with tiered membership content, supporting 15 storage methods and 4 content types.
- **Performance Optimizations:** Production-grade enhancements including server-side LRU caching, geolocation API caching, frontend query optimization with React Query, smart cache invalidation, and request deduplication.
- **Offline Data Caching System:** Comprehensive offline mode with proactive, TTL-based data caching, priority-based warm-up, and queued request processing.
- **Middleware-Free Architecture:** All security, authentication, and privacy logic implemented manually inline.
- **Structured Logging System:** Centralized, middleware-free logger for structured JSON logging with level filtering and sensitive data masking.
- **Background Task Scheduler:** Production-optimized non-blocking startup using `setImmediate`-based task scheduling.
- **Optimized Database Seeding:** Enterprise-grade seeding with performance optimizations including parallel insertion and chunking.
- **Modern CMS with Rich Text Editor:** Content management powered by Lexical, offering comprehensive formatting, publishing workflows (draft/scheduled/published/archived), and content versioning.
- **Financial Information Management:** User profile financial section for managing banking details and payment card proof uploads, with security considerations for MVP.
- **Business Account Type System:** Differentiates personal/business accounts at the database level, with validation enforcing business account type for vendor registration.
- **Vendor Activation Profile Validation:** Comprehensive background check system validating user profile completeness (personal info, compliance documents, financial info) before vendor activation.
- **Vendor Registration System:** Streamlined onboarding with essential vendor-specific forms, auto-populating user data, and post-registration UX flow.
- **Centralized Avatar Rendering Architecture:** Platform-wide avatar rendering via a single `UserAvatar` component with API-based loading, cache busting, and fallback to initials.
- **Avatar Health Monitoring System:** Production-safe avatar file integrity monitoring that prevents data loss by detecting broken avatar references (database entries pointing to missing R2 files). **Opt-in only** via `AVATAR_MONITOR_ENABLED=true` environment variable (default: disabled). **Detection-only on startup** - monitors and reports broken avatars but never auto-repairs. **Admin API endpoint** (`GET /api/diagnostic/avatar-health`) for manual health checks, with optional `?autoRepair=true` query parameter for explicit repair operations (admin-only, clears broken database references via avatar nullification). **Technical implementation**: ObjectStorageService integration with AbortController-based timeout protection (2-second timeout per file, signal passed to S3 client for proper request cancellation), comprehensive try/catch error handling prevents startup crashes, graceful degradation when storage is misconfigured, health metrics tracking (total users, users with avatars, valid/broken/repaired counts), structured logging with detailed diagnostics. **Production-safe patterns**: No Promise.race (prevents unhandled rejections), proper timeout cleanup with clearTimeout, all methods return safely (never throw), detection-first approach to prevent accidental data deletion.

## External Dependencies
- **PostgreSQL:** Primary database.
- **Cloudflare R2:** Object storage for media files.
- **Brevo SMTP:** Email notifications.
- **Stripe:** Payment gateway.
- **PayPal:** Payment gateway.
- **KPM Logistics:** International shipping rate calculations.
- **Bpost:** Domestic and European shipping rate calculations.
- **FedEx, DHL, Maersk, UPS:** Carrier assignment and rate integration in shipping calculator.
- **DeepL API:** Machine translation for internationalization.
- **Nager.Date API:** Global holiday system.