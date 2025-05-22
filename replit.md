# FreshMarket E-commerce Application

## Overview

FreshMarket is a full-stack e-commerce application for selling organic fruits and vegetables. The application features a modern React frontend with a Node.js/Express backend, PostgreSQL database with Drizzle ORM, and Replit Auth for user authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack Query** for server state management and caching
- **Tailwind CSS** with **shadcn/ui** components for styling
- **React Hook Form** with Zod validation for form handling

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with organized route handlers
- **Session-based authentication** using Replit Auth with OpenID Connect
- **PostgreSQL** database with connection pooling via Neon serverless
- **Drizzle ORM** for database operations and type safety

### Authentication Strategy
The application uses Replit's built-in authentication system, which provides:
- OpenID Connect integration
- Session management with PostgreSQL storage
- User profile management
- Secure cookie-based sessions

## Key Components

### Database Schema
The application defines several core entities:
- **Users**: Stores user profiles from Replit Auth
- **Categories**: Product categorization (fruits, vegetables, etc.)
- **Products**: Product catalog with pricing and descriptions
- **Cart Items**: User shopping cart management
- **Orders**: Order processing and history
- **Contact Messages**: Customer inquiry system
- **Sessions**: Authentication session storage

### API Endpoints
- `/api/auth/*` - Authentication and user management
- `/api/categories` - Product category operations
- `/api/products` - Product catalog and filtering
- `/api/cart` - Shopping cart management
- `/api/orders` - Order creation and history
- `/api/contact` - Contact form submissions

### Frontend Pages
- **Home**: Landing page with hero section and features
- **Shop**: Product catalog with category filtering
- **Cart**: Shopping cart and checkout process
- **Contact**: Customer contact form
- **Customers**: User account and order history

## Data Flow

1. **User Authentication**: Replit Auth handles login/logout with session persistence
2. **Product Browsing**: Products are fetched by category with real-time filtering
3. **Cart Management**: Authenticated users can add/remove items with quantity updates
4. **Order Processing**: Cart items are converted to orders with payment method selection
5. **Data Persistence**: All operations use Drizzle ORM with PostgreSQL for reliability

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL connection via Neon's serverless platform
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **express**: Web server framework
- **passport**: Authentication middleware

### UI and Styling
- **tailwindcss**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

### Development Tools
- **vite**: Fast build tool and dev server
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling

## Deployment Strategy

### Development Environment
- Uses Vite dev server with hot module replacement
- TypeScript compilation with strict type checking
- Database migrations handled via Drizzle Kit
- Environment variables for database and auth configuration

### Production Build
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle handles schema synchronization
- **Deployment**: Configured for Replit's autoscale deployment

### Environment Configuration
- Requires `DATABASE_URL` for PostgreSQL connection
- `SESSION_SECRET` for secure session management
- `REPLIT_DOMAINS` and OpenID Connect configuration for auth
- All sensitive data managed through environment variables

The application follows a monorepo structure with shared TypeScript types and schemas, enabling type safety across the full stack while maintaining clear separation between client and server concerns.