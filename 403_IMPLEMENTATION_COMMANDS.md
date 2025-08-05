# Quick Implementation Commands for 403 Handling

Execute these commands on the server to implement the 403 handling improvements:

## Step 1: Update Rule 13 in rules.json

```bash
cd /opt/auto-audit-pro

# Backup current rules
cp data/monitoring/rules.json data/monitoring/rules.json.backup

# Edit rule 13 - Change these values:
# - "alert_level": "RED" → "alert_level": "YELLOW"
# - Update alert message to: "INFO: Website has bot protection active (403). This is normal for sites with security measures. Site is likely accessible to regular visitors."
nano data/monitoring/rules.json
```

## Step 2: Update Selenium User-Agent

```bash
# Edit selenium-wrapper.js to add User-Agent
nano lib/selenium-wrapper.js

# In the createDriver function, after the chrome.Options() line, add:
# chromeOptions.addArguments('--user-agent=Mozilla/5.0 (compatible; AutoAuditPro/2.6; +https://autoauditpro.io/bot-info; Monitoring Service)');
```

## Step 3: Create Bot Info Page

```bash
# Create the bot information page
nano public/bot-info.html

# Copy the entire HTML content from the 403_handling_update.md file
```

## Step 4: Update Monitoring Dashboard for Yellow Alerts

```bash
# Edit the monitoring dashboard
nano views/monitoring-dashboard.html

# 1. In the <style> section (around line 200), add:
.alert-card.yellow {
    background-color: #fff3cd;
    border-color: #ffeaa7;
}

# 2. In the displayAlerts function (around line 1000), update the alertClass line to:
const alertClass = alert.alert_level === 'RED' ? 'red' : 
                   alert.alert_level === 'YELLOW' ? 'yellow' : 
                   'orange';
```

## Step 5: Restart Application

```bash
# Validate JSON first
python3 -m json.tool data/monitoring/rules.json > /dev/null && echo "JSON is valid"

# Restart PM2
pm2 restart auto-audit

# Check logs
pm2 logs auto-audit --lines 20
```

## Verification Steps:

1. Check that bot-info page is accessible:
   ```bash
   curl -I https://autoauditpro.io/bot-info.html
   ```

2. Test monitoring with new User-Agent:
   ```bash
   # Run a manual monitoring check
   curl -X POST http://localhost:3002/api/monitoring/check-now/[profile-id]
   ```

3. Verify 403 alerts show as YELLOW in dashboard