# Website Monitoring Setup Guide

## Quick Start - No Database Needed! 

I've made the monitoring system work without needing any database installation. It uses simple JSON files to store data.

## What You Need to Do:

### 1. Set Up Email Alerts (Optional)
To receive email alerts when websites have problems, add these to your `.env` file:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Auto Audit Pro <alerts@autoauditpro.com>
```

**For Gmail:**
1. Go to https://myaccount.google.com/apppasswords
2. Generate an "App Password"
3. Use that password (not your regular password) for SMTP_PASS

### 2. Start the Server
```bash
npm start
```

### 3. Access the Monitoring Dashboard
Open your browser and go to:
```
http://localhost:3002/monitoring
```

### 4. Add Your First Website to Monitor
1. Click "Add Website" button
2. Enter:
   - Dealership Name: e.g., "ABC Motors"
   - Website URL: e.g., "https://abcmotors.com"
   - Contact Email: Your email
   - Check Frequency: How often to check (default: 30 minutes)
3. Click "Add Website"

## How It Works:

The monitoring system automatically:
- ✅ Checks if the website is reachable
- ✅ Validates SSL certificates
- ✅ Checks for working contact forms
- ✅ Monitors page load speed
- ✅ Counts inventory vehicles

## Alert System:

- 🔴 **RED ALERTS** = Critical issues (website down, SSL expired, etc.)
- 🟡 **YELLOW ALERTS** = Warnings (slow loading, SSL expiring soon, etc.)
- 🟢 **GREEN STATUS** = Everything is working properly

## Data Storage:

All monitoring data is stored in the `/data/monitoring/` folder:
- `profiles.json` - Websites being monitored
- `results.json` - Check results history
- `alerts.json` - Alert history
- `rules.json` - Alert rules configuration

## Testing the System:

1. Add a website to monitor
2. Click "Check Now" to run an immediate test
3. View the results on the dashboard
4. If issues are found, you'll see alerts

## Troubleshooting:

**Q: Not receiving email alerts?**
A: Check your SMTP settings in the .env file

**Q: Website shows as "down" but it's working?**
A: Some websites block automated tools. This is normal.

**Q: How do I stop monitoring a website?**
A: Currently, you need to manually edit `/data/monitoring/profiles.json` and set `monitoring_enabled: false`

## Next Steps:

The monitoring system will automatically check all added websites based on their configured frequency. You can:
- View real-time status on the dashboard
- Acknowledge and resolve alerts
- Run manual checks anytime
- Monitor multiple dealership websites

That's it! The monitoring system is now ready to use. No database installation needed!