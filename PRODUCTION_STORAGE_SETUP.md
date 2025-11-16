# Production Object Storage Setup Guide

## Problem
The Object Storage system was hardcoded to use Replit's sidecar service (localhost:1106), which doesn't exist in production deployments. This caused all uploads to fail with "Object Storage is not available" errors.

## Solution
The Object Storage client is now environment-aware:
- **Development (Replit)**: Uses the Replit sidecar automatically
- **Production**: Uses Google Cloud Storage with service account credentials

## Required Production Environment Variables

To enable Object Storage in production (dedw3n.com), you must set the following environment variables:

### 1. GCP_SERVICE_ACCOUNT_KEY (Required)
Your Google Cloud service account JSON key as a string.

**How to get it:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to IAM & Admin → Service Accounts
3. Create a service account or select an existing one
4. Create a key (JSON format)
5. Copy the entire JSON content

**Required permissions:**
- Storage Object Admin (roles/storage.objectAdmin) OR
- Storage Object Creator (roles/storage.objectCreator)

**Example:**
```bash
GCP_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project",...}'
```

### 2. GCP_PROJECT_ID (Required)
Your Google Cloud project ID.

**Example:**
```bash
GCP_PROJECT_ID=your-project-id
```

Alternative: You can use `GOOGLE_CLOUD_PROJECT` instead.

### 3. Existing Variables (Already Set)
These should already be configured in your production environment:
- `PUBLIC_OBJECT_SEARCH_PATHS=/replit-objstore-933e312b-a3f8-4c9e-b3e9-99fe9e01ba0a,/replit-objstore-933e312b-a3f8-4c9e-b3e9-99fe9e01ba0a/public`
- `PRIVATE_OBJECT_DIR=/replit-objstore-933e312b-a3f8-4c9e-b3e9-99fe9e01ba0a/.private`

## Validation

When the application starts:
- **Development**: You'll see `[OBJECT-STORAGE] ✓ Using Replit sidecar for storage credentials`
- **Production with valid credentials**: You'll see `[OBJECT-STORAGE] ✓ Production GCS credentials configured`
- **Production with missing credentials**: You'll see a detailed error message explaining what's missing

## Testing

After setting the environment variables:
1. Deploy to production
2. Check the startup logs for the validation message
3. Try uploading a profile picture
4. Verify uploads work correctly

## Troubleshooting

### Error: "Object Storage is not available"
- Check that `GCP_SERVICE_ACCOUNT_KEY` is set and valid JSON
- Check that `GCP_PROJECT_ID` is set
- Verify the service account has Storage Object Admin permissions
- Check production logs for detailed error messages

### Error: "Could not load the default credentials"
- This means `GCP_SERVICE_ACCOUNT_KEY` is not set or invalid
- Verify the JSON key is properly formatted and enclosed in quotes

### Error: "Invalid bucket name"
- Verify `PUBLIC_OBJECT_SEARCH_PATHS` is set correctly
- Should point to your Google Cloud Storage bucket

## Security Notes

- The service account JSON key contains sensitive credentials
- Keep it secure and never commit it to version control
- Rotate the key periodically for security
- Use environment variables or secret management systems
- In production, ensure the variable is set securely in your hosting platform's environment configuration
