# Auto Audit Pro - Recovery Guide

Last Updated: November 2, 2025 - Version 2.8.3

## Quick Recovery Commands

### 1. Application Won't Start
```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs auto-audit --lines 100

# Restart application
pm2 restart auto-audit

# If still failing, kill and restart
pm2 delete auto-audit
pm2 start server.js --name auto-audit
```

### 2. Chrome/Selenium Issues

#### Session Creation Errors
```bash
# Kill all Chrome processes
pkill -f -9 chrome || true
pkill -f -9 chromium || true

# Clear Chrome temp directories
rm -rf /tmp/chrome* /tmp/.com.google.Chrome* /tmp/.org.chromium.*

# Clear Selenium cache
rm -rf /root/.cache/selenium/

# Restart application
pm2 restart auto-audit --update-env
```

#### ChromeDriver Version Mismatch
```bash
# Check versions
chromium-browser --version
chromedriver --version

# Update ChromeDriver (example for v142)
cd /tmp
wget https://storage.googleapis.com/chrome-for-testing-public/142.0.7444.59/linux64/chromedriver-linux64.zip
unzip chromedriver-linux64.zip
sudo mv /usr/local/bin/chromedriver /usr/local/bin/chromedriver.backup
sudo mv chromedriver-linux64/chromedriver /usr/local/bin/
sudo chmod +x /usr/local/bin/chromedriver
```

### 3. High Restart Count
```bash
# Check why it's restarting
pm2 logs auto-audit --err --lines 50

# Common fixes:
# - Check Node version: node --version (should be 18.x)
# - Check memory: pm2 monit
# - Clear logs: pm2 flush
```

### 4. Database/Storage Issues
```bash
# Check disk space
df -h

# Check audit storage
ls -la /opt/auto-audit-pro/audits/
du -sh /opt/auto-audit-pro/audits/

# Clear old audits if needed (older than 30 days)
find /opt/auto-audit-pro/audits/ -name "*.json" -mtime +30 -delete
```

### 5. Port Conflicts
```bash
# Check what's using port 3002
netstat -tulpn | grep 3002

# Kill process using port
kill -9 $(lsof -t -i:3002)

# Restart
pm2 restart auto-audit
```

### 6. Complete Reset
```bash
cd /opt/auto-audit-pro

# Backup current state
cp -r audits audits.backup
cp .env .env.backup

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Restart everything
pm2 kill
pm2 start server.js --name auto-audit
pm2 save
```

### 7. Environment Variables
```bash
# Check current env
cat .env

# Required variables:
echo "CHROME_BIN=/usr/bin/chromium-browser" >> .env
echo "NODE_ENV=production" >> .env
echo "PORT=3002" >> .env

# Apply changes
pm2 restart auto-audit --update-env
```

### 8. Monitoring Issues
```bash
# Check monitoring logs
tail -f logs/error.log
tail -f logs/combined.log

# Reset monitoring system
rm -rf logs/*
pm2 restart auto-audit
```

## Emergency Contacts
- Server: root@167.71.183.146
- GitHub: https://github.com/rjhunter3789/auto-audit-pro
- PM2 Docs: https://pm2.keymetrics.io/

## Common Error Messages

### "session not created: DevToolsActivePort file doesn't exist"
- Chrome can't start properly
- Run Chrome cleanup commands above

### "This version of ChromeDriver only supports Chrome version X"
- ChromeDriver/Chrome version mismatch
- Update ChromeDriver to match Chrome version

### "Unable to access website"
- Site may be bot-protected
- Check Selenium logs for details
- Verify Chrome is working: `pm2 logs auto-audit | grep Selenium`

### "ERR_ERL_UNEXPECTED_X_FORWARDED_FOR"
- Rate limiting configuration issue
- Already fixed in latest version
- Non-critical warning

### "0 Issues Found" when issues exist
- Fixed in v2.8.3
- Clear browser cache and refresh
- Check console: `pm2 logs auto-audit | grep "Deep SEO Report"`

### Logo not updating
- Verify file exists: `ls -la public/images/logo.png`
- Clear browser cache: Ctrl+F5
- Check direct URL: https://autoauditpro.io/images/logo.png
- May need to update logo.png AND auto-audit-pro-logo-transparent.svg