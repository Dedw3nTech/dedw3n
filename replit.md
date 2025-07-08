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
- **2025-07-08**: Updated Community Guidelines with comprehensive new content (Version 08-07-2025)
  - **COMPLETED: Community Guidelines Content Update** - Replaced entire community guidelines with new comprehensive document
  - Updated to DEDW3N LTD. Community Guidelines Version 08-07-2025 with detailed safety and moderation policies
  - Added comprehensive sections for content moderation, safety protocols, and community standards
  - Included specific provisions for preventing violence, hate speech, harassment, abuse, and harmful content
  - Enhanced suicide prevention resources and emergency contact protocols
  - Added clear enforcement guidelines and reporting mechanisms
  - Updated last modified date to 2025-07-08 to reflect current version
- **2025-07-08**: Updated Cookie Policy with comprehensive new content (Version 08-07-2025)
  - **COMPLETED: Cookie Policy Content Update** - Replaced entire cookie policy with new comprehensive document
  - Updated to DEDW3N LTD. Cookie Policy Version 08-07-2025 with detailed tracking and privacy controls
  - Added comprehensive sections for cookie types, data collection, and user control mechanisms
  - Included specific provisions for targeting cookies, performance tracking, and CCPA compliance
  - Enhanced ad personalization controls and opt-out procedures for all platforms
  - Updated contact information to legal@dedw3n.com for cookie-related inquiries
  - Updated last modified date to 2025-07-08 to reflect current version
- **2025-07-08**: Updated Terms of Service with comprehensive new content (Version 08-07-2025)
  - **COMPLETED: Terms of Service Content Update** - Replaced entire terms of service with new comprehensive document
  - Updated to DEDW3N LTD. Terms Of Service Version 08-07-2025 with detailed marketplace and community guidelines
  - Added comprehensive sections for user responsibilities, payment procedures, refund policies, and shipping terms
  - Included specific provisions for business sellers, community features, dating services, and escrow transactions
  - Enhanced dispute resolution processes and account management procedures
  - Updated contact information and legal framework to reflect current company structure
  - Updated last modified date to 2025-07-08 to reflect current version
- **2025-07-08**: Updated Privacy Policy with comprehensive new content (Version 08-07-2025)
  - **COMPLETED: Privacy Policy Content Update** - Replaced entire privacy policy with new comprehensive document
  - Updated to DEDW3N LTD. Privacy Policy Version 08-07-2025 with detailed GDPR and CCPA compliance
  - Added comprehensive sections for data collection, security measures, payment processing, and user rights
  - Included specific California Privacy Policy section with CCPA compliance information
  - Enhanced contact information with legal@dedw3n.com for privacy inquiries
  - Updated last modified date to 2025-07-08 to reflect current version
- **2025-07-08**: Page Removal - Completely removed shipping page as requested
  - **COMPLETED: Shipping Page Removal** - Deleted shipping page and all references
  - Removed client/src/pages/shipping.tsx file completely
  - Removed shipping page import from App.tsx
  - Removed shipping route from App.tsx routing configuration
  - Removed shipping link from footer navigation
  - Removed shipping text from footer translations array
  - Removed /shipping from valid routes in server/index.ts
  - Footer navigation now properly excludes the shipping/catalogue rules link
- **2025-07-08**: Page Removal - Completely removed partnerships page as requested
  - **COMPLETED: Partnerships Page Removal** - Deleted partnerships page and all references
  - Removed client/src/pages/partnerships.tsx file completely
  - Removed partnerships page import from App.tsx
  - Removed partnerships route from App.tsx routing configuration
  - Removed partnerships link from footer navigation
  - Removed partnerships text from footer translations array
  - Footer navigation now properly excludes the partnerships link
- **2025-07-08**: Page Creation - Added new Catalogue Rules page with comprehensive content
  - **COMPLETED: Catalogue Rules Page Creation** - Created new page with comprehensive marketplace guidelines
  - Added client/src/pages/catalogue-rules.tsx with proper page structure and SEO
  - Added catalogue rules content to server/routes.ts pageContents with Version 08-07-2025 content
  - Updated footer navigation to include Catalogue Rules link after FAQ
  - Added catalogue rules text to footer translations array
  - Added /catalogue-rules route to App.tsx routing configuration
  - Added /catalogue-rules to valid routes in server/index.ts for proper SEO handling
  - Page includes comprehensive sections: allowed items, prohibited items, general guidelines, photo requirements, intellectual property policy, commercial activities, and sanctions
  - Content matches provided DEDW3N LTD. Catalogue Rules Version 08-07-2025 document
- **2025-07-08**: Page Creation - Added new Tips & Tricks page with comprehensive safety guidelines
  - **COMPLETED: Tips & Tricks Page Creation** - Created new page with comprehensive safety and dating guidelines
  - Added client/src/pages/tips-tricks.tsx with proper page structure and SEO
  - Added tips & tricks content to server/routes.ts pageContents with Version 08-07-2025 content
  - Updated footer navigation to include Tips & Tricks link after Catalogue Rules
  - Added tips & tricks text to footer translations array
  - Added /tips-tricks route to App.tsx routing configuration
  - Added /tips-tricks to valid routes in server/index.ts for proper SEO handling
  - Page includes comprehensive sections: personal information protection, financial safety, platform safety, relationship warnings, reporting guidelines, account security, and in-person meeting safety
  - Content matches provided DEDW3N LTD. Tips & Tricks Version 08-07-2025 document
- **2025-07-08**: UI Enhancement - Changed header language and currency text colors to blue
  - **COMPLETED: Header Color Update** - Language selector "EN" text now displays in blue (text-blue-600)
  - Currency selector "GBP" text and "£" symbol now display in blue (text-blue-600)
  - Applied changes to all relevant header components (language-switcher, currency-selector variants)
- **2025-07-08**: Content Enhancement - Added comprehensive cookie and tracker transparency section to cookies page
  - **COMPLETED: Cookie Tracker Documentation** - Added detailed "Comprehensive List of Cookies and Trackers Used on the Platform" section
  - Positioned above Contact Us section on cookies page with complete breakdown of all tracking technologies
  - Includes Essential/Necessary, Analytics, Marketing/Advertising, Performance, and Functional cookies
  - Documents Cookie Consent Management System with GDPR/CCPA compliance information
  - Lists all third-party services and data collection purposes with user control options
  - Provides transparent cookie management information for enhanced user privacy awareness
- **2025-07-08**: UI Cleanup - Removed header section from privacy page
  - **COMPLETED: Privacy Page Cleanup** - Removed entire header section including "Privacy Policy" title and descriptive subtitle
  - Privacy page now displays only the PageContent component without additional styling or header text
  - Simplified page layout for cleaner content presentation
- **2025-07-08**: Fixed critical SEO/indexing issues for Search Console compliance and robots.txt blocking errors
- **2025-07-08**: Resolved contact form authentication and email functionality issues
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
  - **SOLVED: Contact form authentication issues** - Removed duplicate contact endpoints that were causing conflicts
  - Contact form is now properly public (no authentication required) for visitor accessibility
  - Fixed email functionality with updated Brevo API key integration
  - Contact form submissions now send emails successfully to love@dedw3n.com
  - Implemented graceful fallback handling for email service failures
  - Added admin API key management endpoint for email service configuration

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
- None currently - all major SEO, indexing, and contact form issues have been resolved
- **Soft 404 errors completely fixed** - Search Console should now properly crawl and index valid pages only
- **Contact form authentication and email issues completely fixed** - All functionality working correctly

## Deployment Notes
- Application runs on port 5000
- All static SEO files served with proper caching headers
- Search Console can now properly crawl and index the site