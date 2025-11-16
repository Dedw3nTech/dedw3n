# Data Protection Module

A comprehensive, enterprise-grade data protection system implementing security best practices, privacy compliance, and data safeguards for web applications.

## Overview

This module provides a complete suite of data protection tools designed with clean coding principles and following industry standards for data security and privacy compliance.

## Features

### 🛡️ Core Security
- **Input Sanitization** - Comprehensive sanitization to prevent XSS and injection attacks
- **Output Encoding** - Context-aware encoding for safe data rendering
- **Data Validation** - Flexible validation system with built-in and custom rules
- **Encryption** - Strong encryption using AES-256-GCM with authentication
- **Hashing** - Secure hashing with SHA-256/SHA-512 and HMAC

### 📊 Audit & Compliance
- **Audit Logging** - Complete audit trail for all data operations
- **Privacy Compliance** - GDPR and CCPA compliance features
- **Data Retention** - Configurable retention policies
- **Data Portability** - Export user data in multiple formats

### 🔒 Privacy Protection
- **Data Masking** - Mask sensitive information (email, phone, SSN, credit cards)
- **Anonymization** - Convert PII to anonymous identifiers
- **Secure Deletion** - Multi-pass overwriting with verification
- **Right to be Forgotten** - GDPR Article 17 compliance

## Installation

The module is self-contained in `server/data-protection/`. Import the services you need:

```typescript
import {
  SanitizationService,
  ValidationService,
  EncryptionService,
  AuditService,
  PrivacyService,
  MaskingService,
  DeletionService,
  EncodingService,
} from './server/data-protection';
```

## Quick Start

### 1. Initialize the Module

```typescript
import { initializeDataProtection } from './server/data-protection';

// Initialize with optional configuration
await initializeDataProtection({
  enableAuditLogging: true,
  enableGdprCompliance: true,
  encryptionKey: process.env.ENCRYPTION_KEY,
});
```

### 2. Sanitize User Input

```typescript
import { SanitizationService } from './server/data-protection';

// Sanitize string input
const cleanInput = SanitizationService.sanitizeString(userInput);

// Sanitize object (all string values)
const cleanData = SanitizationService.sanitizeObject(formData);

// Sanitize email
const cleanEmail = SanitizationService.sanitizeEmail(email);

// Sanitize URL
const cleanUrl = SanitizationService.sanitizeUrl(url);
```

### 3. Validate Data

```typescript
import { ValidationService } from './server/data-protection';

// Validate single value
const result = ValidationService.validate(email, [
  { type: 'required', message: 'Email is required' },
  { type: 'email', message: 'Invalid email format' }
]);

if (!result.isValid) {
  console.log(result.errors);
}

// Validate object with schema
const schema = {
  email: [{ type: 'required' }, { type: 'email' }],
  age: [{ type: 'required' }, { type: 'numeric' }],
};

const results = ValidationService.validateObject(userData, schema);
```

### 4. Encrypt Sensitive Data

```typescript
import { EncryptionService } from './server/data-protection';

// Encrypt data
const encrypted = EncryptionService.encrypt('sensitive data');
console.log(encrypted); // { encrypted: '...', iv: '...', authTag: '...' }

// Decrypt data
const decrypted = EncryptionService.decrypt(encrypted);

// Hash data
const hash = EncryptionService.hash('data to hash');

// HMAC for data integrity
const hmac = EncryptionService.hmac('message', 'secret-key');
```

### 5. Log Audit Events

```typescript
import { AuditService } from './server/data-protection';

// Log data access
AuditService.logAccess(userId, 'user_profile', profileId);

// Log data modification
AuditService.logModification(userId, 'update', 'user', userId, {
  changedFields: ['email', 'phone'],
});

// Log security event
AuditService.logSecurityEvent(
  userId,
  'login',
  { method: '2fa', success: true },
  'medium',
  ipAddress
);

// Get audit logs
const logs = AuditService.getLogs({
  userId: 123,
  startDate: new Date('2024-01-01'),
  limit: 50,
});
```

### 6. Mask Sensitive Data

```typescript
import { MaskingService } from './server/data-protection';

// Mask email
const masked = MaskingService.maskEmail('john.doe@example.com');
// Result: j******@example.com

// Mask phone
const phone = MaskingService.maskPhone('(123) 456-7890');
// Result: (***) ***-7890

// Mask credit card
const card = MaskingService.maskCreditCard('4532123456789012');
// Result: ************9012

// Mask object fields
const maskedUser = MaskingService.maskObject(user, ['email', 'phone']);
```

### 7. Privacy Compliance

```typescript
import { PrivacyService } from './server/data-protection';

// Submit data subject request (GDPR)
const request = PrivacyService.submitDataSubjectRequest(
  userId,
  'erasure', // or 'access', 'portability', etc.
  'User requested account deletion'
);

// Export user data (Data Portability)
const userData = await PrivacyService.exportUserData(userId, 'json');

// Check data retention
const shouldKeep = PrivacyService.shouldRetainData('user_posts', createdDate);

// Record consent
PrivacyService.recordConsent(userId, 'marketing_emails', true);
```

### 8. Secure Deletion

```typescript
import { DeletionService } from './server/data-protection';

// Delete user data (Right to be Forgotten)
const result = await DeletionService.deleteUserData(userId, {
  overwritePasses: 3,
  verifyDeletion: true,
  cascadeDelete: true,
});

// Anonymize instead of delete (preserves analytics)
await DeletionService.anonymizeUserData(userId);

// Schedule deletion
DeletionService.scheduleForDeletion(
  'inactive_users',
  userId,
  new Date('2025-01-01')
);
```

## API Reference

### SanitizationService

| Method | Description |
|--------|-------------|
| `sanitizeString(input, options?)` | Sanitize a string input |
| `sanitizeObject(obj, options?)` | Recursively sanitize all string values in an object |
| `sanitizeSql(input)` | Sanitize SQL input to prevent SQL injection |
| `sanitizeFilePath(path)` | Sanitize file path to prevent directory traversal |
| `sanitizeEmail(email)` | Sanitize email address |
| `sanitizePhone(phone)` | Sanitize phone number |
| `sanitizeUrl(url)` | Sanitize and validate URL |

### ValidationService

| Method | Description |
|--------|-------------|
| `validate(value, rules)` | Validate a value against rules |
| `validateObject(obj, schema)` | Validate object against schema |
| `validatePassword(password, options?)` | Validate password strength |
| `isValidEmail(email)` | Check if email is valid |
| `isValidUrl(url)` | Check if URL is valid |
| `isValidPhone(phone)` | Check if phone is valid |

### EncryptionService

| Method | Description |
|--------|-------------|
| `encrypt(data, config?)` | Encrypt data using AES-256-GCM |
| `decrypt(encryptedData, config?)` | Decrypt encrypted data |
| `hash(data)` | Hash data using SHA-256 |
| `hashSha512(data)` | Hash data using SHA-512 |
| `hmac(data, secret?)` | Create HMAC |
| `verifyHmac(data, hmac, secret?)` | Verify HMAC |
| `generateToken(length?)` | Generate random token |
| `generateUuid()` | Generate UUID v4 |

### AuditService

| Method | Description |
|--------|-------------|
| `log(entry)` | Log an audit event |
| `logAccess(userId, resource, resourceId?, metadata?)` | Log data access |
| `logModification(userId, action, resource, resourceId, metadata?)` | Log data modification |
| `logSecurityEvent(userId, action, details, severity?, ip?, userAgent?)` | Log security event |
| `getLogs(filters?)` | Get filtered audit logs |
| `getSecurityAlerts(limit?)` | Get security alerts |

### PrivacyService

| Method | Description |
|--------|-------------|
| `submitDataSubjectRequest(userId, type, notes?)` | Submit GDPR data subject request |
| `getUserData(userId)` | Get all user data (Right to Access) |
| `exportUserData(userId, format?)` | Export user data in specified format |
| `shouldRetainData(resource, createdAt)` | Check if data should be retained |
| `hasConsent(userId, purpose)` | Check if user has given consent |
| `recordConsent(userId, purpose, granted)` | Record user consent |

### MaskingService

| Method | Description |
|--------|-------------|
| `mask(value, config?)` | Mask a value based on config |
| `maskEmail(email)` | Mask email address |
| `maskPhone(phone, maskChar?, preserveFormat?)` | Mask phone number |
| `maskCreditCard(cardNumber)` | Mask credit card number |
| `maskSSN(ssn)` | Mask social security number |
| `anonymize(value)` | Anonymize value with hash |
| `pseudonymize(userData)` | Pseudonymize user data |

### DeletionService

| Method | Description |
|--------|-------------|
| `deleteUserData(userId, options?)` | Securely delete user data |
| `deleteRecord(table, recordId, options?)` | Delete specific record |
| `anonymizeUserData(userId)` | Anonymize user data instead of deletion |
| `scheduleForDeletion(resource, recordId, deletionDate)` | Schedule deletion |
| `processScheduledDeletions()` | Process scheduled deletions |

### EncodingService

| Method | Description |
|--------|-------------|
| `encodeHtml(str)` | Encode for HTML context |
| `encodeHtmlAttribute(str)` | Encode for HTML attribute |
| `encodeJavaScript(str)` | Encode for JavaScript context |
| `encodeJson(obj)` | Encode for JSON context |
| `encodeUrl(str)` | Encode for URL context |
| `encodeCss(str)` | Encode for CSS context |
| `stripHtml(str)` | Strip all HTML tags |

## Configuration

### Environment Variables

```bash
# Encryption key (required for production)
ENCRYPTION_KEY=your-secure-key-here-at-least-32-chars

# Optional: Enable features
ENABLE_AUDIT_LOGGING=true
ENABLE_GDPR_COMPLIANCE=true
```

### Privacy Configuration

```typescript
PrivacyService.configure({
  enableGdpr: true,
  enableCcpa: true,
  dataRetentionDays: 365,
  anonymizeAfterDays: 730,
});
```

### Encryption Key Setup

```typescript
// Set custom encryption key
EncryptionService.setEncryptionKey('your-secure-key-here');
```

## Best Practices

### 1. Always Sanitize User Input
```typescript
// ✅ Good
const clean = SanitizationService.sanitizeString(userInput);
await db.insert(posts).values({ content: clean });

// ❌ Bad
await db.insert(posts).values({ content: userInput });
```

### 2. Validate Before Processing
```typescript
// ✅ Good
const result = ValidationService.validate(email, [{ type: 'email' }]);
if (result.isValid) {
  // Process email
}

// ❌ Bad
// Process without validation
```

### 3. Encode Output Based on Context
```typescript
// ✅ Good - HTML context
res.send(`<div>${EncodingService.encodeHtml(userContent)}</div>`);

// ✅ Good - JavaScript context
res.send(`<script>var name = "${EncodingService.encodeJavaScript(userName)}";</script>`);

// ❌ Bad
res.send(`<div>${userContent}</div>`);
```

### 4. Log Important Actions
```typescript
// ✅ Good
AuditService.logModification(userId, 'delete', 'post', postId);
await db.delete(posts).where(eq(posts.id, postId));

// ❌ Bad
await db.delete(posts).where(eq(posts.id, postId));
```

### 5. Mask Sensitive Data in Logs
```typescript
// ✅ Good
console.log('User:', MaskingService.maskEmail(user.email));

// ❌ Bad
console.log('User:', user.email);
```

## Security Considerations

1. **Encryption Key**: Always use a strong, unique encryption key in production
2. **Audit Logs**: Store audit logs securely and implement log rotation
3. **Data Retention**: Implement automated cleanup of old data
4. **Access Control**: Combine with proper authentication and authorization
5. **HTTPS Only**: Always use HTTPS in production
6. **Rate Limiting**: Implement rate limiting to prevent abuse

## Compliance

This module helps meet requirements for:
- **GDPR** (General Data Protection Regulation)
- **CCPA** (California Consumer Privacy Act)
- **SOC 2** (System and Organization Controls 2)
- **HIPAA** (Health Insurance Portability and Accountability Act)
- **PCI DSS** (Payment Card Industry Data Security Standard)

## Examples

### Complete User Registration Flow

```typescript
import {
  SanitizationService,
  ValidationService,
  EncryptionService,
  AuditService,
} from './server/data-protection';

async function registerUser(userData: any, ipAddress: string) {
  // 1. Sanitize input
  const sanitized = SanitizationService.sanitizeObject(userData);

  // 2. Validate data
  const schema = {
    email: [{ type: 'required' }, { type: 'email' }],
    password: [{ type: 'required' }],
    name: [{ type: 'required' }],
  };
  
  const validation = ValidationService.validateObject(sanitized, schema);
  
  if (!ValidationService.isValid(validation)) {
    const errors = ValidationService.getErrors(validation);
    throw new Error(errors.join(', '));
  }

  // 3. Validate password strength
  const passwordCheck = ValidationService.validatePassword(sanitized.password);
  if (!passwordCheck.isValid) {
    throw new Error(passwordCheck.errors.join(', '));
  }

  // 4. Hash password
  const hashedPassword = EncryptionService.hashPassword(sanitized.password);

  // 5. Create user
  const user = await db.insert(users).values({
    email: sanitized.email,
    password: hashedPassword,
    name: sanitized.name,
  }).returning();

  // 6. Log audit event
  AuditService.log({
    userId: user[0].id,
    action: 'create',
    resource: 'user',
    resourceId: String(user[0].id),
    status: 'success',
    severity: 'medium',
    ipAddress,
  });

  return user[0];
}
```

### Handle Data Subject Request

```typescript
import { PrivacyService, DeletionService } from './server/data-protection';

async function handleDataDeletionRequest(userId: number) {
  // 1. Submit request
  const request = PrivacyService.submitDataSubjectRequest(
    userId,
    'erasure',
    'User requested account deletion via settings'
  );

  // 2. Update status to in progress
  PrivacyService.updateRequestStatus(request.id!, 'in_progress');

  // 3. Delete user data
  const result = await DeletionService.deleteUserData(userId, {
    overwritePasses: 3,
    verifyDeletion: true,
    cascadeDelete: true,
  });

  // 4. Update request status
  if (result.success && result.verified) {
    PrivacyService.updateRequestStatus(
      request.id!,
      'completed',
      `Deleted ${result.recordsDeleted} records`
    );
  } else {
    PrivacyService.updateRequestStatus(
      request.id!,
      'rejected',
      result.errors.join(', ')
    );
  }

  return result;
}
```

## Testing

```typescript
// Example test
import { SanitizationService, ValidationService } from './server/data-protection';

describe('Data Protection', () => {
  test('sanitizes XSS attempts', () => {
    const malicious = '<script>alert("XSS")</script>';
    const clean = SanitizationService.sanitizeString(malicious);
    expect(clean).not.toContain('<script>');
  });

  test('validates email format', () => {
    const result = ValidationService.validate('invalid-email', [
      { type: 'email' }
    ]);
    expect(result.isValid).toBe(false);
  });
});
```

## License

This module is part of the application and follows the same license.

## Support

For issues or questions about the data protection module, contact your development team or refer to the main application documentation.
