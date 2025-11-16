# Brevo Inbound Email Webhook Setup for Dedw3n Ticketing System

## Overview
This guide explains how to configure Brevo's inbound email webhook to automatically create support tickets from emails sent to love@dedw3n.com.

## Prerequisites
- Brevo account with verified domain
- Access to domain DNS settings
- love@dedw3n email address configured in Brevo

## Step 1: Verify SMTP Credentials

The application requires Brevo SMTP credentials to be set as environment variables:

- `BREVO_SMTP_USER` - Your SMTP login from Brevo Dashboard → Settings → SMTP & API
- `BREVO_SMTP_PASS` - Your SMTP key from the same location

**Important**: If you're seeing "Invalid login: 535 5.7.8 Authentication failed" in the logs, please verify these credentials are correct.

## Step 2: Configure Brevo Inbound Webhook

### 2.1 Get Your Webhook URL

Your webhook endpoint is:
```
https://[YOUR_REPLIT_DOMAIN]/api/webhooks/email-inbound
```

Example:
```
https://d7e2c77e-31e2-4ebb-8dc2-54c5a9909834.picard.replit.dev/api/webhooks/email-inbound
```

### 2.2 Set Up the Webhook in Brevo

1. Log in to your Brevo Dashboard: https://app.brevo.com
2. Go to **Settings** → **Webhooks** → **Inbound** tab
3. Click **"+ Add a new webhook"**
4. Configure the webhook:
   - **URL**: Enter your webhook endpoint URL
   - **Events**: Select "Inbound emails"
   - **Email address**: Enter `love@dedw3n.com` (or configure a catch-all)
5. Click **"Create webhook"**

### 2.3 Test the Webhook

1. Send a test email to love@dedw3n.com
2. Check your application logs for:
   ```
   [WEBHOOK] ✅ Ticket #TKT-XXXXX created: sender@example.com → department
   ```
3. Verify the ticket appears in the admin dashboard at `/admin/tickets`

## Step 3: Department Routing

Emails are automatically routed to departments based on the recipient address:

| Recipient Contains | Department |
|-------------------|------------|
| `tech` or `support` | Tech |
| `legal` | Legal |
| `marketing` | Marketing |
| `sales` | Sales |
| `finance` or `billing` | Finance |
| `hr` or `human` | HR |
| *default* | Operations |

**Examples:**
- `love@dedw3n.com` → Operations (default)
- `support@dedw3n.com` → Tech
- `sales@dedw3n.com` → Sales

## Step 4: Email Reply Functionality

### How Admin Replies Work

When an admin responds to a ticket in the portal:

1. Admin adds a message via POST `/api/tickets/:id/messages` with `sendEmailNotification: true`
2. The system sends an email to the customer with the admin's reply
3. The customer receives a formatted email with:
   - Ticket number
   - Department and status
   - Admin's message
   - Reply instructions

### Example Admin Reply Request

```javascript
POST /api/tickets/123/messages
{
  "message": "Thank you for contacting us. We're looking into your issue.",
  "isInternal": false,
  "sendEmailNotification": true
}
```

The customer will receive an email with subject:
```
Re: Original Subject [Ticket #TKT-12345]
```

## Step 5: Debugging

### Enable Debug Logging

Set the environment variable:
```
DEBUG_WEBHOOKS=true
```

This will log the complete webhook payload to help troubleshoot issues.

### Common Issues

**Issue**: "Missing required email fields"
- **Cause**: Brevo payload structure doesn't match expected format
- **Solution**: Enable DEBUG_WEBHOOKS and check logs for the actual payload structure

**Issue**: "Authentication failed" 535 error
- **Cause**: Incorrect SMTP credentials
- **Solution**: Verify BREVO_SMTP_USER and BREVO_SMTP_PASS are correct in Replit Secrets

**Issue**: Tickets not being created
- **Cause**: Webhook not configured or incorrect URL
- **Solution**: Verify webhook URL in Brevo dashboard and check application logs

## Webhook Payload Format

The endpoint expects Brevo's inbound email format:

```json
{
  "items": [
    {
      "email": {
        "from": [
          {
            "address": "sender@example.com",
            "name": "Sender Name"
          }
        ],
        "to": [
          {
            "address": "love@dedw3n.com"
          }
        ],
        "subject": "Help with my order",
        "text": "Email body in plain text",
        "html": "<p>Email body in HTML</p>",
        "headers": {
          "From": "Sender Name <sender@example.com>"
        }
      }
    }
  ]
}
```

## Security Considerations

- The webhook endpoint is public (no authentication required) to accept emails from Brevo
- All SMTP credentials are stored in environment variables, not hardcoded
- Internal ticket messages are never sent via email
- Email content is truncated to 5000 characters to prevent abuse

## Support

For issues with this integration, check:
1. Application logs for webhook activity
2. Brevo webhook logs in your dashboard
3. Ensure love@dedw3n.com is properly configured in Brevo

---

Last updated: November 8, 2025
