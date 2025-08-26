# Dedw3n Marketplace Platform

## Overview
Dedw3n is a sophisticated multi-purpose social marketplace platform designed to bridge global communication, enabling seamless product discovery, community interaction, and enhanced transactional capabilities. It aims to offer advanced post creation, real-time content sharing, comprehensive moderation, and flexible content type support (text, product, event) to foster a vibrant and secure online community.

## User Preferences
- Focus on resolving technical issues systematically.
- Prioritize Search Console compliance and SEO optimization.
- Maintain clear documentation of architectural changes.
- Use comprehensive error handling and logging.
- Implement comprehensive features without unnecessary advanced UI enhancements when core functionality is sufficient.
- Conduct comprehensive error assessments covering 400/500 errors, JavaScript, authentication, Wouter routing, LSP, and TypeScript issues when implementing major changes.

## System Architecture
The platform is built with a modular, layered architecture for maintainability and scalability.

- **Frontend**: React with TypeScript, utilizing Vite for building.
- **Backend**: Express.js with TypeScript, designed with a clear separation of concerns (controllers, services, repositories).
- **Database**: PostgreSQL, managed with Drizzle ORM for data interaction.
- **Authentication**: Robust authentication and authorization module using Passport.js for session management, JWT tokens, and secure cookie handling, with production-grade rate limiting, input validation, mandatory 18+ age verification for account creation with real-time visual feedback, and comprehensive password reset system with Brevo SMTP email integration.
- **File Management**: Multer handles media uploads efficiently.
- **Real-time Communication**: WebSocket for live messaging and notifications.
- **Marketplace Core**: Comprehensive modules for product management (CRUD, search, filtering, stock), vendor management (accounts, profiles, commissions), and order processing (lifecycle, status tracking).
- **Advanced Features**: Integrated services for payment processing (multi-provider support, refunds, commission calculation), multi-channel notifications (user preferences, templates), and comprehensive analytics (product, vendor, platform, user engagement).
- **Admin Control**: Features include user management, content moderation workflows, vendor request handling, and platform statistics monitoring.
- **UI/UX**: Clean, professional design with a focus on user experience, including dynamic button styling, clear navigation, and consistent language. Specific design choices include a streamlined vendor dashboard, comprehensive admin control center, personalized success notifications, and enhanced product sharing interface with color-coded icons (blue email, orange repost with circular arrows, green WhatsApp/SMS).
- **Security**: Hardened against common vulnerabilities with debug statement cleanup, error response sanitization, secure API integrations, and HTTPS enforcement.
- **Internationalization**: Integrated translation system for multi-language support with auto-translation for password reset emails based on user's selected language preference.
- **Global Currency Support**: Comprehensive 100+ currency system with professional selection interface, search functionality, and regional grouping for true international marketplace capabilities.
- **Mobile Responsiveness**: Comprehensive mobile-first responsive design with optimized touch targets (44px minimum), fluid grids, flexible images using max-width: 100% and height: auto principles, progressive text sizing, and enhanced mobile performance optimizations. Successfully resolved mobile hero section text cutoff issues with custom CSS classes and proper viewport handling.
- **Age Verification**: Comprehensive 18+ age verification system implemented across all registration forms (LoginPromptModal, auth.tsx) with real-time validation, visual feedback indicators (green checkmarks for valid ages, red error messages for under-18), and automatic account creation prevention for users under 18 years old.
- **Email Auto-Translation**: Password reset emails automatically translate to match user's selected language preference using EmailTranslationService with 50+ language support, intelligent user language detection, and English fallback.
- **Mobile Detection**: Comprehensive mobile device detection with instant auto-redirect functionality. Mobile users are automatically redirected to dedw3n.com/mobile without countdown modals or opt-in options for seamless mobile experience.

## External Dependencies
- **PostgreSQL**: Primary database for data storage.
- **Brevo SMTP**: Used for email notifications (user and vendor registration, error reports).
- **Stripe**: Payment gateway for secure transactions (architecture ready for integration).
- **PayPal**: Payment gateway (architecture ready for integration).
- **KPM Logistics**: Integrated for international shipping rate calculations.
- **Bpost**: Integrated for domestic and European shipping rate calculations.
- **FedEx, DHL, Maersk, UPS**: Carrier assignment and rate integration in shipping calculator.