# Automatic Storage Management - Simple Guide

## How It Works (100% Automatic)

### The Simple Truth
**Everything is handled automatically. You don't need to do anything.**

Replit Object Storage uses the SAME bucket for development and production, and files are automatically migrated from temporary storage to persistent storage.

### What Happens Automatically

1. **On App Startup** (Development):
   - System detects files in temporary folders (`public/uploads`, `private/uploads`)
   - Automatically migrates them to persistent object storage
   - Shows friendly message: `ℹ️  Ephemeral files detected - Auto-migration will handle this`
   - Completes with: `✅ AUTO-MIGRATION COMPLETE - All files protected!`

2. **On File Upload**:
   - Files are saved directly to object storage
   - No temporary storage used
   - Immediately available in both dev and production

3. **On Deployment**:
   - Code deploys ✓
   - Database is accessible ✓
   - Object storage bucket is the SAME ✓
   - Files are already there ✓

**Result**: Everything just works!

## Monitoring Endpoints (Read-Only)

These endpoints let you check status, but don't require any manual action:

### Storage Health Check
```bash
GET /api/admin/storage/diagnostics
```
Returns comprehensive storage health information.

### Environment Variables
```bash
GET /api/admin/storage/environment
```
Shows current environment configuration.

### Storage Configuration
```bash
GET /api/admin/storage/config
```
Displays bucket and path configuration.

## What You See in Logs

### Normal Development Startup
```
ℹ️  Ephemeral files detected - Auto-migration will handle this
Object Storage Configured: ✓ YES

🔄 AUTO-MIGRATION ENABLED - Starting file migration...
📦 34 files (30 public, 4 private)
[MIGRATION] Migrated ... → ...
✅ Complete in 3.4s | Migrated: 34 | Failed: 0
✅ AUTO-MIGRATION COMPLETE - All files protected!
```

This is **normal and good** - the system is automatically protecting your files!

### Production Startup
No migration messages - files are already in object storage.

## Bucket Structure (Automatic)

```
replit-objstore-[your-bucket-id]/
├── public-objects/      # Public files
│   ├── avatars/
│   ├── images/
│   └── product/
└── private-objects/     # Private files
    └── documents/
```

## Environment Variables (Already Set)

These are configured automatically when you create object storage:
- `PUBLIC_OBJECT_SEARCH_PATHS`: `/replit-objstore-[id]/public-objects`
- `PRIVATE_OBJECT_DIR`: `/replit-objstore-[id]/private-objects`

## Summary

**No manual intervention needed. The system automatically:**
- Migrates files from temporary to persistent storage
- Uses the same bucket for dev and production
- Handles all uploads to object storage
- Protects your data on deployment

Just code and deploy - storage is handled for you!
