# Dedw3n Marketplace Platform

## Overview
A sophisticated multi-purpose social marketplace platform that bridges global communication through advanced technological innovations, enabling seamless product discovery and community interaction with enhanced transactional capabilities.

**Stack:**
- TypeScript (React + Node.js)
- PostgreSQL database
- Advanced post creation system with rich metadata
- Real-time content sharing and interaction
- Comprehensive moderation and review mechanisms
- Flexible content type support (text, product, event)

## Recent Changes
- **2025-07-08**: Fixed critical SEO/indexing issues for Search Console compliance and robots.txt blocking errors
  - **SOLVED: "Blocked by robots.txt" errors** - Restructured robots.txt using "allow by default, block specific paths" approach
  - Removed redundant explicit Allow rules that were causing conflicts with Search Console crawling
  - Simplified robots.txt to only block sensitive areas (dashboards, APIs, user accounts) while allowing all public content
  - Enhanced parameter blocking (sort, filter, page, category, tab, ref) to prevent duplicate content indexing
  - Added comprehensive AI training bot blocking (GPTBot, Google-Extended, CCBot, anthropic-ai, Claude-Web)
  - Resolved robots.txt blocking issue that was preventing proper indexing
  - Fixed conflicts between robots.txt and sitemap.xml (removed private pages from sitemap)
  - Enhanced security.txt with comprehensive security policy information
  - Moved SEO routes to server/index.ts to ensure they load before any middleware interference
  - **SOLVED: Soft 404 errors** - Implemented proper 404 detection middleware that returns correct HTTP status codes
  - Invalid routes now return HTTP 404 with "noindex, nofollow" headers instead of HTTP 200 (soft 404)
  - Added beautiful styled 404 error pages for better user experience
  - **SOLVED: Duplicate canonical URL conflicts** - Unified canonical URL management through SEOHead component
  - Removed conflicting static canonical URLs from HTML template
  - Implemented proper trailing slash redirects (301) to prevent duplicate content
  - Deprecated conflicting canonical URL hooks to prevent multiple canonical declarations
  - Updated meta tags and caching headers for better search engine optimization
  - All SEO files (robots.txt, sitemap.xml, security.txt, .well-known/security.txt) now working correctly

## Project Architecture
- **Frontend**: React with TypeScript, Vite build system
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session management
- **File Uploads**: Multer for media handling
- **WebSocket**: Real-time messaging and notifications
- **SEO**: Static files served with proper headers and caching

## User Preferences
- Focus on resolving technical issues systematically
- Prioritize Search Console compliance and SEO optimization
- Maintain clear documentation of architectural changes
- Use comprehensive error handling and logging

## Current State
✅ SEO/indexing issues resolved for Search Console
✅ All critical marketplace functionality operational
✅ Authentication and user management working
✅ Real-time messaging and WebSocket connections active
✅ Database seeding and admin user setup complete

## Known Issues
- None currently - all major SEO and indexing issues have been resolved
- **Soft 404 errors completely fixed** - Search Console should now properly crawl and index valid pages only

## Deployment Notes
- Application runs on port 5000
- All static SEO files served with proper caching headers
- Search Console can now properly crawl and index the site