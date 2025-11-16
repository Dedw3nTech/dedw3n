# Dedw3n Marketplace Platform

## Overview
Dedw3n is a multi-purpose social marketplace platform designed to enhance global communication through seamless product discovery, community interaction, and advanced transactional capabilities. It offers sophisticated post creation, real-time content sharing, comprehensive moderation, and flexible content type support (text, product, event) to foster a vibrant and secure online community. The platform aims to provide a robust and engaging experience for users worldwide by enabling global communication and commerce.

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

- **Frontend**: React with TypeScript, built using Vite. Implements route-level and component-level code splitting for performance optimization, including a video-based loading screen and ChunkLoadErrorBoundary for graceful error recovery.
- **Backend**: Express.js with TypeScript, featuring a clear separation of concerns.
- **Database**: PostgreSQL with Drizzle ORM, automated synchronization, and enterprise-grade connection management.
- **Authentication**: Passport.js-based system for session management, JWT tokens, secure cookies, rate limiting, input validation, 18+ age verification, password reset, and secure hashing. Utilizes manual inline authentication utilities to avoid middleware.
- **File Management**: Multer handles media uploads to Cloudflare R2. Profile picture uploads use manual inline authentication, rate limiting, and a `ProfilePictureProtectionService` for data loss protection and backups.
- **Real-time Communication**: WebSocket for live messaging and notifications, optimized with session caching.
- **Marketplace Core**: Modules for product management, vendor management, and order processing.
- **Payment Processing**: Multi-provider support with refunds and commission calculation.
- **Notifications**: Multi-channel system with user preferences and templates.
- **Analytics**: Comprehensive tracking for product, vendor, platform, and user engagement.
- **Admin Control**: User management, content moderation, vendor requests, platform statistics, and a comprehensive ticketing system.
- **Ticketing System**: Multi-department support with Brevo email integration, automatic user linking, priority management, status tracking, and secure email webhook for inbound ticket creation.
- **UI/UX**: Clean, professional design with consistent black color palette, streamlined dashboards, personalized notifications, enhanced product sharing, and optimized accessibility.
- **Security**: Hardened against vulnerabilities with debug cleanup, error response sanitization, secure APIs, HTTPS enforcement, production-grade rate limiting, privacy-first cookie policy, and comprehensive security headers applied to ALL routes via Express monkey-patching (CSP, HSTS, X-Frame-Options, COOP/COEP, Referrer-Policy). Triple-layer implementation covers app verbs, Router.prototype, and app.use() to ensure complete coverage while preserving error handler function arity and respecting "NO middleware" constraint.
- **Data Protection Module**: Enterprise-grade data protection with input sanitization, output encoding, data encryption (AES-256-GCM), audit logging, privacy compliance (GDPR/CCPA), data masking, secure deletion, and validation.
- **Internationalization**: Comprehensive multilingual translation system using Master Translation hooks, LanguageContext, and DeepL API, supporting 20+ languages with auto-translation and full localization.
- **Global Currency Support**: 100+ currency system with professional selection interface and regional grouping.
- **Mobile Responsiveness**: Mobile-first design with optimized touch targets, fluid grids, flexible images, progressive text sizing, mobile device detection, and auto-redirect.
- **Age Verification**: Comprehensive 18+ age verification on all registration forms with real-time validation.
- **Comprehensive City Database**: Self-contained local city database covering 195+ countries with intelligent autocomplete, fuzzy matching, and typo correction.
- **Search Console SEO Compliance**: Comprehensive 404 error resolution, synchronized `sitemap.xml` routing, proper server-side SEO file handling, and enhanced route coverage documentation.
- **Error Handling System**: User-friendly error handling with unique error codes, one-click instant error reporting, and centralized, database-first processing with optional email notifications.
- **Server Resilience**: Comprehensive error handling for port conflicts, graceful shutdown handlers, and proper exit codes.
- **Health Check System**: Production-ready health monitoring with public `/health` and detailed `/api/health/detailed` endpoints, implementing a clean architecture with dependency injection.
- **Vidz Feature**: TikTok-style short video viewing experience with interactive features and unauthenticated access.
- **Community Search System**: Fully functional search across posts, members, videos, events, and dating profiles.
- **Logout Process**: Efficient, instant logout with comprehensive client and server-side state clearing.
- **Cross-Domain Data Consistency**: Environment-agnostic architecture with unified database access via `DATABASE_URL` and comprehensive CORS configuration.
- **Global Holiday System**: Comprehensive holiday integration using Nager.Date API, featuring database-backed storage, caching, admin-driven country population, and calendar UI integration.
- **Exclusive Content Feature**: Community monetization with tiered membership content, supporting 15 storage methods and 4 content types (video, article, image, audio).
- **Performance Optimizations**: Production-grade enhancements including server-side LRU caching, geolocation API caching, frontend query optimization with React Query, smart cache invalidation, and request deduplication.
- **Language & Translation Caching**: Multi-layered caching system for language preferences and DeepL translations with HTTP ETag conditional requests (5-minute max-age, stale-while-revalidate), persistent localStorage translation cache (24-hour TTL), RFC 9110 compliant 304 responses, accurate cache hit-rate monitoring, and CacheMonitor component for real-time performance visibility.
- **Offline Data Caching System**: Comprehensive offline mode with proactive, TTL-based data caching, priority-based warm-up, exact URL-to-key mapping, localStorage storage with IndexedDB migration path, and queued request processing on reconnection.
- **Middleware-Free Architecture**: Elimination of middleware overhead through manual inline implementations for privacy headers, authentication, security, and privacy logic.
- **Structured Logging System**: Production-ready observability with a centralized, middleware-free logger for structured JSON logging, level filtering, timestamps, categories, context enrichment, and sensitive data masking.
- **Background Task Scheduler**: Production-optimized non-blocking startup architecture using `setImmediate`-based task scheduling with timeout protection, named tasks, instant health check responses, structured logging, and resilient error handling.
- **Optimized Database Seeding**: Enterprise-grade database seeding with performance optimizations including persistent flag files, batch category creation, parallel insertion, chunking, progress logging, early exit patterns, and performance timing tracking.
- **Modern CMS with Rich Text Editor**: Production-ready content management powered by Lexical (Meta's editor framework) with comprehensive formatting toolbar, auto-link detection, markdown shortcuts, publishing workflow (draft/scheduled/published/archived), content versioning, automatic legacy plain-text migration, and synchronized publishStatus/isPublished fields for backward compatibility. Supports scheduling future posts via publishAt timestamp.
- **User Analytics Tracking**: LinkedIn-style analytics system tracking profile views, post impressions, and search appearances. Features automatic frontend tracking via React useEffect hooks, dedicated backend API endpoints (`/api/analytics/*`), efficient database schema with proper indexes, real-time stats aggregation, privacy-first design (excludes own-profile views), and non-blocking async tracking that doesn't impact UX performance.
- **Financial Information Management**: User profile financial section for managing banking details (bank name, account holder, account number, routing number), PayPal accounts, and payment card proof uploads. Features dedicated FinancialSection component, modular API endpoints (GET /api/users/financial, PATCH /api/users/financial, POST /api/users/financial/card-proof), account number masking in responses, input validation (email format, card digits, account length), file upload restrictions (MIME types: JPG/PNG/WEBP/PDF, 10MB limit), and private R2 storage for card proofs. **Security Note**: MVP implementation with response masking and validation; production deployment requires encryption at-rest for bank account numbers, malware scanning for uploaded files, and enhanced schema validation.
- **Business Account Type System**: User account type differentiation (personal/business) enforced at database level via `user_account_type` enum with default 'personal'. Only Business account holders can create Business Vendor accounts. Validation enforced on both frontend (vendor-dashboard.tsx, become-vendor.tsx) and backend (/api/vendors/register, /api/vendors/manage) with comprehensive error messaging through DeepL translation system. Returns 403 error with errorCode "BUSINESS_ACCOUNT_REQUIRED" when personal account users attempt business vendor creation.
- **Vendor Activation Profile Validation**: Comprehensive background check system that validates user profile completeness before vendor activation. Checks three critical areas: (1) Personal Information (name, email, phone, address, city, country, region, date of birth, gender), (2) Compliance Documents (ID document front/back, proof of address, ID selfie), and (3) Financial Information (bank details, card proof). Validation enforced on both frontend and backend with specific error messages for each missing category. Users are redirected to their profile page via toast action button to complete missing information. Returns 400 error with errorCode "PROFILE_INCOMPLETE" and detailed missingFields array when requirements are not met.
- **Vendor Registration System**: Streamlined vendor onboarding with simplified forms collecting only essential vendor-specific information (store name, description, website). Backend auto-populates required database fields from user profile data (email, phone, address, city, country) to satisfy NOT NULL constraints. Simplified Zod schemas on frontend (privateVendorSchema, businessVendorSchema) align with backend insertVendorSchema which uses `.extend()` to make contact fields optional. Post-registration UX flow automatically redirects new vendors to `/add-product` page instead of become-vendor page. Active vendor protection prevents re-registration attempts by checking vendor status via `/api/vendors/me` and automatically redirecting to add-product page. Vendor data is permanently linked to user account and protected from loss.
- **Centralized Avatar Rendering Architecture**: Platform-wide avatar rendering system using UserAvatar component (`client/src/components/ui/user-avatar.tsx`) as the single source of truth for all user avatar displays. Features API-based avatar loading via `/api/users/:id/profilePicture` endpoint with proper URL normalization, timestamp-based cache busting, automatic fallback to username initials, and consistent error handling. All 17+ page and component files (Profile.tsx, wall.tsx, PostCard.tsx, members.tsx, etc.) use UserAvatar to eliminate manual Avatar/AvatarImage patterns and raw URL rendering. ResolvedUserAvatar component serves as migration helper with intelligent type conversion (string-to-number userId handling via `parseInt`) ensuring proper routing to UserAvatar regardless of prop type variations. Wall feed cards and all social components benefit from centralized avatar updates and cache invalidation. Vendor logos and business account avatars intentionally use separate rendering patterns and are excluded from UserAvatar system.

## External Dependencies
- **PostgreSQL**: Primary database.
- **Cloudflare R2**: Object storage (S3-compatible) for media files.
- **Brevo SMTP**: Email notifications.
- **Stripe**: Payment gateway.
- **PayPal**: Payment gateway.
- **KPM Logistics**: International shipping rate calculations.
- **Bpost**: Domestic and European shipping rate calculations.
- **FedEx, DHL, Maersk, UPS**: Carrier assignment and rate integration in shipping calculator.
- **DeepL API**: Machine translation for internationalization.