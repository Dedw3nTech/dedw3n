# Production Storage Synchronization System

## Overview

The Production Storage Sync system automatically synchronizes object storage between development and production environments after deployments, ensuring data consistency across all environments.

## Features

- ✅ **Auto-detect environment** (development/production)
- ✅ **Automatic sync on deployment** (production only)
- ✅ **Manual sync trigger** (via admin endpoint)
- ✅ **Intelligent sync** (only syncs modified/new files)
- ✅ **Validation tools** (verify sync integrity)
- ✅ **Minimal configuration**

## Architecture

### Components

1. **ProductionStorageSync** (`server/production-storage-sync.ts`)
   - Core synchronization logic
   - Environment detection
   - File comparison and syncing
   - Validation utilities

2. **DeploymentSyncHook** (`server/deployment-sync-hook.ts`)
   - Automatic deployment detection
   - Sync trigger on new deployments
   - Status tracking

3. **StorageSyncStartup** (`server/storage-sync-startup.ts`)
   - Startup integration
   - Manual sync endpoints
   - Status reporting

## Configuration

### Environment Variables

```bash
# Development storage bucket
DEV_STORAGE_BUCKET=dedw3n-dev-storage

# Production storage bucket
PROD_STORAGE_BUCKET=dedw3n-production-storage

# Required: Object storage paths
PUBLIC_OBJECT_SEARCH_PATHS=/bucket-name/public
PRIVATE_OBJECT_DIR=/bucket-name/private
```

### Default Values

If not specified, the system uses these defaults:
- Development: `dedw3n-dev-storage`
- Production: `dedw3n-production-storage`

## How It Works

### Automatic Sync (Production)

1. Application starts in production environment
2. Deployment hook detects new deployment
3. Checks if sync is needed (compares timestamps)
4. Syncs modified files from dev to production
5. Updates sync marker to prevent duplicate syncs

### Manual Sync

Administrators can trigger manual sync via API endpoint (to be added to admin routes).

### File Comparison

The system intelligently determines which files need syncing by comparing:
- **Modification time**: Newer files are synced
- **File size**: Different sizes trigger sync
- **Existence**: Missing files are synced

## Usage

### Automatic Usage

The system runs automatically on every production deployment. No manual intervention required.

### Manual Sync (Admin)

```typescript
import { triggerManualStorageSync } from './server/storage-sync-startup';

// Trigger sync
const result = await triggerManualStorageSync();

console.log(`Success: ${result.success}`);
console.log(`Message: ${result.message}`);
console.log(`Synced files: ${result.details?.syncedFiles}`);
```

### Validation

```typescript
import { validateStorageSync } from './server/storage-sync-startup';

// Validate sync integrity
const validation = await validateStorageSync();

console.log(`Valid: ${validation.valid}`);
console.log(`Missing files: ${validation.missingFiles}`);
console.log(`Mismatched files: ${validation.mismatchedFiles}`);
```

### Status Check

```typescript
import { getStorageSyncStatus } from './server/storage-sync-startup';

// Get sync system status
const status = getStorageSyncStatus();

console.log(`Environment: ${status.environment}`);
console.log(`Configured: ${status.configured}`);
console.log(`Hook active: ${status.hookActive}`);
```

## Logging

The system provides comprehensive logging:

```
=== Production Storage Sync ===
Environment: production
Source: dedw3n-dev-storage
Destination: dedw3n-production-storage
Dry Run: NO

Syncing path: public/
  ✓ Synced: avatars/user123.png (145.32 KB)
  ✓ Synced: images/product456.jpg (523.18 KB)
  - Skipped: videos/demo.mp4 (already up-to-date)

=== Sync Summary ===
✓ Synced: 42
- Skipped: 15
✗ Failed: 0
Total Size: 12.45 MB

=== Sync Complete ===
```

## Sync Behavior

### Development Environment
- Sync hook is **inactive**
- Manual sync is **available**
- No automatic syncing occurs

### Production Environment
- Sync hook is **active**
- Automatic sync on deployment
- Manual sync is **available**

## Error Handling

The system handles errors gracefully:

1. **Network errors**: Retries with exponential backoff
2. **Permission errors**: Logs and skips file
3. **Missing buckets**: Fails with clear error message
4. **Invalid config**: Warns and uses defaults

## Sync Frequency

- **Automatic**: Once per deployment (minimum 1 hour between syncs)
- **Manual**: Unlimited (admin-triggered)

## Best Practices

1. **Configure buckets**: Set environment variables before deployment
2. **Test in development**: Use manual sync to test configuration
3. **Monitor logs**: Check sync logs after deployments
4. **Validate regularly**: Run validation to ensure integrity

## Troubleshooting

### Sync not running

1. Check environment variables are set
2. Verify production environment detection
3. Check deployment hook initialization logs

### Files not syncing

1. Verify file permissions
2. Check bucket names are correct
3. Validate file modification times

### Slow sync

1. Check network connectivity
2. Reduce sync paths if needed
3. Monitor file count and sizes

## Integration Points

The sync system integrates with:

1. **Startup process** (`server/routes.ts`)
   - Initializes after database seeding
   - Runs before API routes registration

2. **Object Storage** (`server/objectStorage.ts`)
   - Uses same storage client
   - Respects ACL policies

3. **Deployment lifecycle** (Replit platform)
   - Detects new deployments automatically
   - Syncs on first startup after deployment

## Future Enhancements

- [ ] Admin dashboard for sync management
- [ ] Sync scheduling (cron jobs)
- [ ] Selective path syncing
- [ ] Rollback functionality
- [ ] Performance metrics
- [ ] Email notifications on sync completion

## Support

For issues or questions about the storage sync system:
1. Check logs for detailed error messages
2. Validate configuration with status check
3. Test with dry run mode first
4. Review this documentation

## Version History

- **v1.0.0** (2025-01-05): Initial release
  - Automatic deployment sync
  - Manual sync triggers
  - Validation tools
  - Comprehensive logging
