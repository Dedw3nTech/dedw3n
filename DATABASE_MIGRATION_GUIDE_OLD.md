# Database Migration & Seeding Guide

## Overview
This guide explains how to manage database migrations and seed data for your application.

## Prerequisites
- Ensure `DATABASE_URL` environment variable is set (automatically configured in Replit)
- Database should be provisioned

## Running Migrations

### 1. Generate New Migrations (After Schema Changes)
When you modify `shared/schema.ts`, generate a new migration:
```bash
npx drizzle-kit generate
```

### 2. Apply Migrations to Database
To apply all pending migrations:
```bash
tsx server/migrate.ts
```

Or using drizzle-kit directly:
```bash
npx drizzle-kit migrate
```

### 3. Push Schema Directly (Development Only)
For rapid development, you can push schema changes directly:
```bash
npx drizzle-kit push
```
**Note:** This bypasses migrations. Use only in development.

## Seeding the Database

### Seed Initial Data
To populate the database with initial data (admin user, categories, sample products):
```bash
tsx server/seed-runner.ts
```

The seed script will:
- Create an admin user (username: `admin`, password: `admin123`)
- Create default product categories
- Create a vendor account for the admin
- Create sample products

### Seed Behavior
- The seed script is **idempotent** - it won't duplicate data if run multiple times
- It checks for existing data before creating new records
- It dynamically uses the actual admin user ID (not hardcoded) for FK safety

### ⚠️ SECURITY WARNING
**The default admin credentials are:**
- **Username:** `admin`
- **Password:** `admin123`

**IMPORTANT:** These are placeholder credentials for initial setup only. You **MUST** change the admin password immediately after seeding:
1. Log in to the application using these credentials
2. Navigate to the admin user profile
3. Change the password to a strong, unique password
4. Never use the default password in production environments

**Failure to change the default admin password poses a critical security risk.**

## Production Deployment Workflow

When deploying to production:

1. **Before Publishing:**
   ```bash
   # Generate migrations from schema changes
   npx drizzle-kit generate
   
   # Test migrations locally
   tsx server/migrate.ts
   
   # Seed the database
   tsx server/seed-runner.ts
   ```

2. **Publish Your App:**
   - Click the "Publish" button in Replit
   - Migrations will be applied automatically on deployment

3. **If Database is Empty After Publish:**
   - Production and development databases are separate
   - You need to seed the production database separately
   - Contact Replit support or manually run seeds against production DB

## Troubleshooting

### Empty Production Database
**Symptom:** App connects but no users/data exist

**Solution:**
1. The production database is separate from development
2. Schema changes to development DB are applied to production on publish
3. Seed data must be added to production separately

### Migration Errors
If migrations fail:
1. Check `DATABASE_URL` is correctly set
2. Review migration files in `./migrations/` folder
3. Check for conflicting schema changes
4. Review Replit deployment logs

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npx drizzle-kit generate` | Generate migrations from schema |
| `tsx server/migrate.ts` | Apply migrations to database |
| `tsx server/seed-runner.ts` | Seed database with initial data |
| `npx drizzle-kit push` | Push schema directly (dev only) |
| `npx drizzle-kit studio` | Open Drizzle Studio (visual DB editor) |

## Important Notes

1. **Development vs Production**: Changes to the development database are NOT automatically synced to production
2. **Migrations**: Always generate and test migrations before deploying
3. **Seeding**: Seed scripts are safe to run multiple times (idempotent)
4. **Schema Changes**: After changing `shared/schema.ts`, run `npx drizzle-kit generate`
