# Gmail Setup Guide for Auto Audit Pro Monitoring

This guide will help you set up free email notifications in 5 minutes.

## Step 1: Prepare Your Gmail Account

1. Go to https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "How you sign in to Google", make sure "2-Step Verification" is ON
   - If not, click on it and follow the steps to enable it

## Step 2: Generate an App Password

1. Go to https://myaccount.google.com/apppasswords
2. You might need to sign in again
3. In the "Select app" dropdown, choose "Mail"
4. In the "Select device" dropdown, choose "Other (custom name)"
5. Type "Auto Audit Pro" as the name
6. Click "Generate"
7. **IMPORTANT**: Copy the 16-character password that appears (looks like: "abcd efgh ijkl mnop")
8. Remove the spaces when you use it

## Step 3: Create Your .env File

1. In your dealership-audit-mvp folder, create a new file called `.env` (note the dot)
2. Add these lines (replace with your info):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM=yourname@gmail.com
```

Example with real values (but fake password):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=autoauditpro@gmail.com
SMTP_PASS=xvwz1234abcd5678
SMTP_FROM=autoauditpro@gmail.com
```

## Step 4: Restart the Server

1. Stop the server (Ctrl+C in terminal)
2. Start it again: `npm start`
3. You should NOT see any email errors

## Step 5: Test It!

1. Go to your monitoring dashboard
2. Add a website to monitor (if you haven't already)
3. Click the yellow "Test" button
4. You should see: "✅ Email sent to yourname@gmail.com"
5. Check your email - you should have a test notification!

## Troubleshooting

### "Invalid login" Error
- Make sure you're using the App Password, NOT your regular Gmail password
- Check that you removed all spaces from the app password
- Verify 2-Step Verification is enabled

### "Cannot find module 'dotenv'" Error
Run this command: `npm install dotenv`

### Still Not Working?
- Double-check your .env file has no typos
- Make sure the .env file is in the root folder (dealership-audit-mvp)
- Try generating a new app password

## Security Notes

- NEVER commit your .env file to Git
- The app password is NOT your Gmail password
- You can revoke the app password anytime from Google's security settings
- Consider creating a dedicated Gmail account just for notifications

## What Happens Next?

Once configured:
- 🔴 RED alerts = Immediate email (site down, SSL expired)
- 🟡 YELLOW alerts = Email within 5 minutes (warnings)
- 🟢 GREEN status = No email (everything is fine)

Dealers will get emails like:
- Subject: "🔴 CRITICAL: Website Issue Detected - Site Unreachable"
- Body: Details about the issue and what to do

That's it! Your monitoring system now sends email alerts.