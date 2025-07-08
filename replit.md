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
- **2025-07-08**: Fixed critical SEO/indexing issues for Search Console compliance
  - Resolved robots.txt blocking issue that was preventing proper indexing
  - Fixed conflicts between robots.txt and sitemap.xml (removed private pages from sitemap)
  - Enhanced security.txt with comprehensive security policy information
  - Moved SEO routes to server/index.ts to ensure they load before any middleware interference
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

## Deployment Notes
- Application runs on port 5000
- All static SEO files served with proper caching headers
- Search Console can now properly crawl and index the site