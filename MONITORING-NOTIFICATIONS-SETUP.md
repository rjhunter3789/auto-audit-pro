# Website Monitoring - Notifications Setup Guide

## Overview
Auto Audit Pro Website Monitoring can send alerts via email and SMS when issues are detected. However, these services need to be configured on the server for notifications to work.

## Current Status
When you click the "Test" button, you may see messages like:
- ⚠️ Email notifications not configured on server (SMTP settings required)
- ⚠️ SMS notifications not configured on server (Twilio settings required)

This is normal and expected if the server hasn't been configured with email/SMS services.

## Email Setup (Optional)

To enable email notifications, you need to configure SMTP settings in your environment:

### Gmail Example
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### Other Email Providers
- **Outlook**: smtp-mail.outlook.com (port 587)
- **Yahoo**: smtp.mail.yahoo.com (port 587)
- **Custom**: Use your email provider's SMTP settings

## SMS Setup (Optional)

To enable SMS notifications, you need a Twilio account:

1. Sign up at https://www.twilio.com
2. Get your credentials from the Twilio Console
3. Configure environment variables:

```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Running Without Notifications

**Important**: The monitoring system works perfectly without email/SMS configured. You can:
- View all alerts in the dashboard
- See real-time status updates
- Export reports as CSV
- Check sites manually

The notification services are completely optional enhancements.

## Dashboard-Only Mode

If you don't configure email/SMS, the system will:
- Still monitor all websites on schedule
- Display all alerts in the dashboard
- Show status indicators (RED/YELLOW/GREEN)
- Keep full history of all checks

You just won't receive external notifications - everything else works normally.

## Testing Your Setup

1. Add a website to monitor
2. Click the "Test" button
3. Check the results:
   - ✅ = Successfully sent
   - ⚠️ = Service not configured (this is OK)
   - ❌ = Error occurred (check configuration)

## Note for Production

For production deployments, consider:
- Using environment variables for sensitive data
- Setting up dedicated email accounts for notifications
- Using professional SMTP services (SendGrid, AWS SES, etc.)
- Monitoring your SMS usage to control costs