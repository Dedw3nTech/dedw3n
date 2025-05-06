# Architecture Overview

## 1. Overview

This application is a fullstack web platform that combines e-commerce, social networking, and content management functionalities. It follows a client-server architecture with a clear separation between frontend and backend components. The application is built with modern web technologies and follows RESTful API principles for communication between the client and server.

The platform includes features such as:
- User authentication and authorization
- E-commerce capabilities (products, vendors, carts, orders)
- Social networking features (posts, comments, likes, follows)
- Messaging and real-time communications
- Content management (communities, exclusive content)
- Payment processing integrations (Stripe, PayPal, Mobile Money)
- AI-powered insights and analytics

## 2. System Architecture

### 2.1 High-Level Architecture

The application follows a modern full-stack JavaScript/TypeScript architecture with the following main components:

- **Frontend**: React-based single-page application (SPA)
- **Backend**: Node.js Express server
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Dual strategy with session-based and JWT authentication
- **API**: RESTful API endpoints for data exchange between client and server
- **Real-time Communications**: WebSocket implementation for messaging
- **External Services**: Payment processors, media storage, AI insights

### 2.2 Directory Structure

```
/
├── client/               # Frontend React application
│   ├── src/              # Source code
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   ├── pages/        # Page components
│   ├── index.html        # HTML entry point
│
├── server/               # Backend Express application
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database connection
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Data access layer
│   ├── jwt-auth.ts       # JWT authentication
│   ├── unified-auth.ts   # Combined auth strategies
│   ├── messaging-suite.ts # Real-time messaging
│   ├── payment.ts        # Payment processing
│   ├── ...               # Other specialized modules
│
├── shared/               # Shared code between client and server
│   ├── schema.ts         # Database schema definitions
│
├── migrations/           # Database migration files
├── public/               # Static assets and uploads
```

## 3. Key Components

### 3.1 Frontend Architecture

The frontend is built with React and utilizes a modern component-based architecture. Key aspects include:

- **Component Library**: Uses shadcn/ui components based on Radix UI primitives for a consistent design system
- **Routing**: Uses Wouter for lightweight client-side routing
- **State Management**: 
  - React Query for server state management
  - React Context for global application state (auth, theme, etc.)
  - React Hook Form for form state management
- **Styling**: Uses Tailwind CSS for utility-first styling
- **Internationalization**: Supports multiple languages

#### Key Frontend Technologies:
- React
- TypeScript
- Tailwind CSS
- React Query (TanStack Query)
- Wouter (routing)
- React Hook Form with Zod validation
- shadcn/ui + Radix UI components

### 3.2 Backend Architecture

The backend is built with Node.js and Express, providing a RESTful API for the frontend to consume. Key aspects include:

- **API Structure**: RESTful endpoints organized by domain (users, products, social, payments, etc.)
- **Database Access**: Uses Drizzle ORM for type-safe database operations
- **Authentication**: Dual-strategy authentication with both session-based and JWT options
- **WebSockets**: Real-time communication for messaging features
- **File Handling**: Support for image and media uploads
- **Error Handling**: Centralized error handling and validation

#### Key Backend Technologies:
- Node.js with Express
- TypeScript
- Drizzle ORM with PostgreSQL
- Passport.js for authentication strategies
- WebSockets for real-time communication
- Various payment integrations (Stripe, PayPal, Mobile Money)

### 3.3 Database Schema

The database is designed with a comprehensive schema that supports all the application's features. Key entities include:

- **Users**: Core user accounts with role-based permissions
- **Products & E-commerce**: Products, vendors, categories, carts, orders
- **Social**: Posts, comments, likes, follows
- **Messaging**: Messages, conversations
- **Communities**: User groups, membership tiers, exclusive content
- **Content**: Various content types including videos, images, articles
- **Payments**: Wallets, transactions, subscriptions

The schema is defined in TypeScript using Drizzle ORM's schema definition syntax with Zod for validation.

## 4. Data Flow

### 4.1 Client-Server Communication

1. **Request Flow**:
   - Client makes API requests via React Query or direct fetch calls
   - Authentication token or session cookie is included in requests
   - Server validates the request and authentication
   - Server processes request, often interacting with the database
   - Server returns response with appropriate status code and data
   - Client updates UI based on response

2. **Real-time Communication**:
   - WebSocket connections are established for real-time features
   - Messages and notifications are pushed to connected clients
   - Connection state is managed with reconnection strategies

### 4.2 Authentication Flow

The application supports multiple authentication methods:

1. **Session-based Authentication**:
   - User logs in with credentials
   - Server validates credentials and creates a session
   - Session ID is stored in a cookie
   - Subsequent requests include the cookie for authentication

2. **JWT-based Authentication**:
   - User logs in with credentials
   - Server validates credentials and generates a JWT
   - Token is stored client-side and included in request headers
   - Server validates token for protected endpoints

3. **Unified Authentication**:
   - A unified authentication middleware checks both session and JWT
   - Provides flexibility for different client types (browser, mobile, etc.)

### 4.3 Payment Processing Flow

The application integrates multiple payment providers:

1. **Stripe Integration**:
   - Client initiates payment process
   - Server creates payment intent with Stripe
   - Client completes payment using Stripe Elements
   - Stripe webhooks notify the server of payment status
   - Server updates order status accordingly

2. **PayPal Integration**:
   - Similar flow to Stripe but using PayPal's SDK

3. **Mobile Money Integration**:
   - Region-specific mobile payment options
   - Server initiates payment request
   - User completes payment on their mobile device
   - Server receives confirmation and updates records

## 5. External Dependencies

### 5.1 Payment Processors

- **Stripe**: For credit card processing
- **PayPal**: Alternative payment method
- **PawaPay/Mobile Money**: Regional mobile payment solutions

### 5.2 Third-Party Services

- **Neon Database**: PostgreSQL database provider
- **AI Insights**: Integration for generating social media insights
- **News API**: Integration for fetching news content
- **OAuth Providers**: Google, Facebook, GitHub for social authentication (configured but may not be active)

### 5.3 Core Libraries

#### Frontend Dependencies:
- React and React DOM
- TanStack Query (React Query)
- Radix UI components
- React Hook Form with Zod validation
- Tailwind CSS
- Lucide React (icons)
- Various utility libraries

#### Backend Dependencies:
- Express
- Drizzle ORM
- Passport.js
- bcryptjs
- WebSocket (ws)
- multer (for file uploads)
- Various payment SDK libraries

## 6. Deployment Strategy

The application is configured for deployment in a modern cloud environment:

### 6.1 Development Environment

- Local development server with Vite for frontend
- Hot module replacement (HMR) for faster development
- Environment variables for configuration
- TypeScript support with type checking

### 6.2 Production Deployment

- **Build Process**:
  - Vite builds the frontend into static assets
  - esbuild bundles the server code
  - Output is placed in the `/dist` directory

- **Runtime Configuration**:
  - Environment variables for sensitive information
  - Database connection strings
  - API keys for third-party services

- **Hosting Configuration**:
  - Configured for deployment on Replit
  - Supports autoscaling
  - Exposes port 5000 internally, mapped to port 80 externally

### 6.3 Database Management

- Drizzle ORM for database operations
- Migration support for schema changes
- Schema defined in TypeScript for type safety
- Connection pooling for efficient database access

## 7. Security Considerations

- Passwords hashed with scrypt with salt for user security
- JWT tokens for stateless authentication
- Session management for traditional authentication flows
- Role-based access control for protected resources
- Input validation using Zod schemas
- Content moderation for user-generated content
- Rate limiting (implied but not explicitly defined)
- Secure payment processing with trusted providers