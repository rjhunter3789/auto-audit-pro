# Auto Audit Pro - Recovery Procedures

## Table of Contents
1. [Emergency Contacts](#emergency-contacts)
2. [System Overview](#system-overview)
3. [Common Issues & Quick Fixes](#common-issues--quick-fixes)
4. [Recovery Procedures](#recovery-procedures)
5. [Rollback Procedures](#rollback-procedures)
6. [Backup & Restore](#backup--restore)
7. [API Key Management](#api-key-management)
8. [Database Recovery](#database-recovery)
9. [Monitoring System Recovery](#monitoring-system-recovery)

---

## Emergency Contacts

- **Primary Admin**: admin (use credentials from .env)
- **ScrapingDog Support**: https://www.scrapingdog.com/contact
- **Server Logs**: Check server console output and system logs

---

## System Overview

### Critical Components
1. **Server**: `server.js` - Main application server
2. **Monitoring Engine**: `lib/monitoring-engine.js` - Website monitoring
3. **ScrapingDog Integration**: `lib/scrapingdog-wrapper.js` - Anti-bot bypass
4. **ROI Configuration**: `lib/roi-config.js` - Admin-controlled ROI settings
5. **Authentication**: Session-based with admin roles

### Key Dependencies
- Node.js application
- PostgreSQL database (or JSON storage in simplified mode)
- ScrapingDog API (optional fallback)
- Email service (Gmail SMTP)

---

## Common Issues & Quick Fixes

### 1. Server Won't Start
```bash
# Check if port 3000 is in use
lsof -i :3000
# or
netstat -an | grep 3000

# Kill process using port
kill -9 <PID>

# Check environment variables
cat .env

# Reinstall dependencies
npm install
```

### 2. Login Issues
```bash
# Reset admin password in .env
ADMIN_PASSWORD=NewSecurePassword123!

# Clear sessions (if using file-based sessions)
rm -rf sessions/

# Restart server
npm start
```

### 3. Monitoring Not Working
```bash
# Check monitoring engine logs
grep -i "monitor" server.log

# Test ScrapingDog API key
node test-scrapingdog-direct.js

# Manually trigger monitoring check
curl -X POST http://localhost:3000/api/monitoring/check/<profile_id>
```

### 4. ScrapingDog API Failures
```bash
# Test API key validity
curl "https://api.scrapingdog.com/scrape?api_key=YOUR_KEY&url=https://example.com"

# Check usage/credits
# Visit: https://app.scrapingdog.com/dashboard

# Fallback to Selenium-only mode
# Comment out ScrapingDog integration in monitoring-engine.js
```

---

## Recovery Procedures

### 1. Full System Recovery

```bash
# 1. Stop all services
pm2 stop all  # if using PM2
# or press Ctrl+C in server console

# 2. Backup current state
cp -r /mnt/c/Users/nakap/Desktop/dealership-audit-mvp /mnt/c/Users/nakap/Desktop/dealership-audit-mvp-backup-$(date +%Y%m%d)

# 3. Check system health
npm test  # if tests exist
node test-scrapingdog.js

# 4. Clear temporary files
rm -rf node_modules/.cache
rm -rf temp/

# 5. Reinstall dependencies
npm install

# 6. Restore environment variables
cp .env.backup .env  # if backup exists

# 7. Start server
npm start
```

### 2. Database Recovery (PostgreSQL)

```bash
# Check database connection
psql -U your_user -d autoaudit_db -c "SELECT 1;"

# Export current data
pg_dump -U your_user autoaudit_db > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U your_user autoaudit_db < backup_20250117.sql

# Reset sequences if needed
psql -U your_user -d autoaudit_db -c "
  SELECT setval('monitoring_profiles_id_seq', (SELECT MAX(id) FROM monitoring_profiles));
  SELECT setval('monitoring_results_id_seq', (SELECT MAX(id) FROM monitoring_results));
"
```

### 3. JSON Storage Recovery (Simplified Mode)

```bash
# Backup JSON data
cp -r data/ data-backup-$(date +%Y%m%d)/

# Check JSON file integrity
for file in data/*.json; do
  echo "Checking $file"
  jq . "$file" > /dev/null || echo "ERROR: $file is corrupted"
done

# Restore from backup
cp -r data-backup-20250117/* data/
```

---

## Rollback Procedures

### Rolling Back ScrapingDog Integration

1. **Remove ScrapingDog API calls**:
```javascript
// In lib/monitoring-engine.js, comment out:
// const ScrapingDogWrapper = require('./scrapingdog-wrapper');
// this.scrapingDog = new ScrapingDogWrapper();

// Replace checkConnectivity method with original version
```

2. **Remove API key from .env**:
```bash
# Comment out or remove:
# SCRAPINGDOG_API_KEY=6877d1cfa281473f17abfc7d
```

3. **Hide API stats in dashboard**:
```javascript
// In views/monitoring-dashboard.html
// Set display: none for #apiStatsSection
```

### Rolling Back Admin Controls

1. **Restore original monitoring frequency**:
```javascript
// In server.js, change line ~2500:
check_frequency || 30  // back to 30 minutes
```

2. **Remove role checks**:
```javascript
// Remove requireAdmin middleware from routes
app.put('/api/monitoring/profiles/:id', async (req, res) => {
// Remove: requireAdmin,
```

3. **Restore UI elements**:
```javascript
// In monitoring-dashboard.html, remove role-based hiding
```

---

## Backup & Restore

### Automated Backup Script

Create `backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/mnt/c/Users/nakap/Desktop/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup code
cp -r /mnt/c/Users/nakap/Desktop/dealership-audit-mvp "$BACKUP_DIR/$DATE/"

# Backup environment
cp .env "$BACKUP_DIR/$DATE/.env.backup"

# Backup database (if using PostgreSQL)
# pg_dump -U your_user autoaudit_db > "$BACKUP_DIR/$DATE/database.sql"

# Backup JSON data (if using JSON storage)
cp -r data/ "$BACKUP_DIR/$DATE/data/"

echo "Backup completed: $BACKUP_DIR/$DATE"
```

### Restore from Backup

```bash
#!/bin/bash
BACKUP_PATH=$1

if [ -z "$BACKUP_PATH" ]; then
  echo "Usage: ./restore.sh /path/to/backup"
  exit 1
fi

# Stop server
echo "Stopping server..."
# pm2 stop all or kill node process

# Restore files
echo "Restoring files..."
cp -r "$BACKUP_PATH/dealership-audit-mvp/"* /mnt/c/Users/nakap/Desktop/dealership-audit-mvp/

# Restore environment
cp "$BACKUP_PATH/.env.backup" /mnt/c/Users/nakap/Desktop/dealership-audit-mvp/.env

# Restore data
cp -r "$BACKUP_PATH/data/"* /mnt/c/Users/nakap/Desktop/dealership-audit-mvp/data/

echo "Restore completed. Please restart the server."
```

---

## API Key Management

### ScrapingDog API Key Issues

1. **Check API key validity**:
```bash
node test-scrapingdog-direct.js
```

2. **Rotate API key**:
```bash
# Update in .env
SCRAPINGDOG_API_KEY=new_key_here

# Restart server
npm start
```

3. **Monitor API usage**:
- Dashboard: https://app.scrapingdog.com/dashboard
- Check credits remaining
- Review usage patterns

### Google PageSpeed API Key

1. **Test API key**:
```bash
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&key=YOUR_KEY"
```

2. **Generate new key**:
- Visit: https://console.cloud.google.com/apis/credentials
- Create new API key
- Restrict to PageSpeed Insights API

---

## Database Recovery

### PostgreSQL Connection Issues

```bash
# Check PostgreSQL service
sudo service postgresql status

# Restart PostgreSQL
sudo service postgresql restart

# Check connection settings
psql -U postgres -c "SHOW ALL;" | grep -E "(port|listen_addresses)"

# Test connection
psql -h localhost -U your_user -d autoaudit_db
```

### Data Corruption Recovery

```sql
-- Check for corrupted tables
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public';

-- Rebuild indexes
REINDEX DATABASE autoaudit_db;

-- Vacuum and analyze
VACUUM ANALYZE;

-- Check table integrity
SELECT COUNT(*) FROM monitoring_profiles;
SELECT COUNT(*) FROM monitoring_results;
```

---

## Monitoring System Recovery

### Reset Monitoring Status

```javascript
// Emergency reset script: reset-monitoring.js
const { Pool } = require('pg');
const pool = new Pool(/* your config */);

async function resetMonitoring() {
  try {
    // Clear all pending checks
    await pool.query(`
      UPDATE monitoring_profiles 
      SET last_check = NULL, 
          next_check = CURRENT_TIMESTAMP
      WHERE monitoring_enabled = true
    `);
    
    // Clear stuck alerts
    await pool.query(`
      UPDATE monitoring_alerts 
      SET resolved = true, 
          resolved_at = CURRENT_TIMESTAMP
      WHERE resolved = false 
      AND created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours'
    `);
    
    console.log('Monitoring system reset completed');
  } catch (error) {
    console.error('Reset failed:', error);
  }
}

resetMonitoring();
```

### Manual Monitoring Check

```bash
# Force check specific site
curl -X POST http://localhost:3000/api/monitoring/check/1

# Check all sites
curl -X POST http://localhost:3000/api/monitoring/check-all
```

---

## Troubleshooting Checklist

- [ ] Server running? (`ps aux | grep node`)
- [ ] Port 3000 accessible? (`telnet localhost 3000`)
- [ ] Environment variables loaded? (`echo $ADMIN_USERNAME`)
- [ ] Database connected? (check logs)
- [ ] ScrapingDog API working? (`node test-scrapingdog.js`)
- [ ] Monitoring scheduler running? (check logs for "scheduler")
- [ ] Email service configured? (test with notification)
- [ ] Admin login working? (try logging in)
- [ ] Permissions correct? (`ls -la`)
- [ ] Disk space available? (`df -h`)

---

## Emergency Commands

```bash
# Kill all Node processes
killall node

# Clear all sessions
rm -rf sessions/

# Reset to clean state
git reset --hard HEAD  # WARNING: Loses all changes

# Check system resources
top
df -h
free -m

# View recent logs
tail -f server.log
journalctl -u autoaudit -f  # if using systemd

# Test connectivity
curl http://localhost:3000/
wget -O- http://localhost:3000/
```

---

Last Updated: January 17, 2025