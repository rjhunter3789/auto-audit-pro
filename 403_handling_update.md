# 403 Handling Professional Update

## 1. Update Rule 13 in `/opt/auto-audit-pro/data/monitoring/rules.json`

Find rule 13 (Access Forbidden) and replace it with:

```json
{
  "id": 13,
  "rule_name": "Access Restricted - Bot Detection",
  "rule_category": "uptime",
  "check_type": "http_status_code",
  "condition": "equals",
  "threshold_value": 403,
  "alert_level": "YELLOW",
  "alert_message_template": "INFO: Website has bot protection active (403). This is normal for sites with security measures. Site is likely accessible to regular visitors.",
  "enabled": true
}
```

## 2. Update `/opt/auto-audit-pro/lib/selenium-wrapper.js`

Add this User-Agent configuration in the createDriver function (around line 20-30):

```javascript
// Add professional bot identification
const chromeOptions = new chrome.Options();
chromeOptions.addArguments('--no-sandbox');
chromeOptions.addArguments('--disable-dev-shm-usage');
chromeOptions.addArguments('--disable-gpu');
chromeOptions.addArguments('--window-size=1920,1080');

// Professional monitoring bot identification
chromeOptions.addArguments('--user-agent=Mozilla/5.0 (compatible; AutoAuditPro/2.6; +https://autoauditpro.io/bot-info; Monitoring Service)');

// Add headless mode for server
if (process.env.NODE_ENV === 'production' || !process.env.DISPLAY) {
    chromeOptions.addArguments('--headless');
}
```

## 3. Create `/opt/auto-audit-pro/public/bot-info.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AutoAudit Pro Monitoring Bot Information</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            background: #2c3e50;
            color: white;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .contact {
            background: #e8f4f8;
            padding: 15px;
            border-left: 4px solid #3498db;
        }
        code {
            background: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>AutoAudit Pro Monitoring Bot</h1>
        <p>Professional Website Monitoring Service for Automotive Dealerships</p>
    </div>

    <div class="section">
        <h2>About Our Bot</h2>
        <p>The AutoAudit Pro bot is a legitimate monitoring service that helps automotive dealerships track their website performance, uptime, and SEO health. We perform non-intrusive checks to ensure dealership websites are functioning properly for their customers.</p>
    </div>

    <div class="section">
        <h2>What We Monitor</h2>
        <ul>
            <li>Website uptime and availability</li>
            <li>Page load performance</li>
            <li>SSL certificate validity</li>
            <li>Mobile responsiveness</li>
            <li>SEO best practices</li>
            <li>Contact form functionality</li>
        </ul>
    </div>

    <div class="section">
        <h2>Bot Identification</h2>
        <p>Our bot identifies itself with the following User-Agent string:</p>
        <code>Mozilla/5.0 (compatible; AutoAuditPro/2.6; +https://autoauditpro.io/bot-info; Monitoring Service)</code>
    </div>

    <div class="section">
        <h2>Whitelisting Instructions</h2>
        <p>To ensure accurate monitoring of your website, please whitelist our bot:</p>
        <h3>For Cloudflare Users:</h3>
        <ol>
            <li>Log into your Cloudflare dashboard</li>
            <li>Navigate to Security → WAF → Tools</li>
            <li>Add a new IP Access Rule</li>
            <li>Add User-Agent contains "AutoAuditPro"</li>
            <li>Set action to "Allow"</li>
        </ol>
        
        <h3>For Other WAF/Security Services:</h3>
        <p>Add an allow rule for User-Agent containing "AutoAuditPro" or our monitoring IP addresses.</p>
    </div>

    <div class="section contact">
        <h2>Contact Information</h2>
        <p>If you have questions about our monitoring service or need assistance with whitelisting:</p>
        <p>
            <strong>Email:</strong> support@autoauditpro.io<br>
            <strong>Website:</strong> <a href="https://autoauditpro.io">https://autoauditpro.io</a><br>
            <strong>Purpose:</strong> Legitimate website monitoring for automotive industry
        </p>
    </div>

    <div class="section">
        <h2>Compliance</h2>
        <p>Our monitoring service:</p>
        <ul>
            <li>Respects robots.txt directives</li>
            <li>Limits request frequency to avoid server load</li>
            <li>Does not collect or store personal data</li>
            <li>Only accesses publicly available pages</li>
            <li>Complies with all applicable laws and regulations</li>
        </ul>
    </div>
</body>
</html>
```

## 4. Update Monitoring Dashboard Alert Display

In `/opt/auto-audit-pro/views/monitoring-dashboard.html`, update the alert card styling to handle YELLOW alerts properly. Find the section that creates alert cards and add:

```javascript
// Add this CSS class definition in the <style> section:
.alert-card.yellow {
    background-color: #fff3cd;
    border-color: #ffeaa7;
}

// In the JavaScript that creates alert cards, update the class assignment:
const alertClass = alert.alert_level === 'RED' ? 'red' : 
                   alert.alert_level === 'YELLOW' ? 'yellow' : 
                   'orange';
```

## Implementation Steps:

1. SSH into the server: `ssh root@146.190.39.214`
2. Navigate to the project: `cd /opt/auto-audit-pro`
3. Edit the rules file: `nano data/monitoring/rules.json`
   - Find rule 13 and change:
     - `alert_level` from "RED" to "YELLOW"
     - Update the `alert_message_template` to the new text
4. Edit selenium-wrapper.js: `nano lib/selenium-wrapper.js`
   - Add the User-Agent configuration
5. Create the bot info page: `nano public/bot-info.html`
   - Copy the HTML content above
6. Update the monitoring dashboard: `nano views/monitoring-dashboard.html`
   - Add the yellow alert styling
7. Restart the application: `pm2 restart auto-audit`

## Benefits:

1. **Professional Identification**: Clear bot identification helps sites understand our legitimate purpose
2. **Appropriate Alert Level**: 403 errors show as YELLOW (informational) not RED (critical)
3. **Whitelist Documentation**: Sites can easily whitelist us if they choose
4. **Better Messaging**: Alert message explains this is normal behavior, not a critical error