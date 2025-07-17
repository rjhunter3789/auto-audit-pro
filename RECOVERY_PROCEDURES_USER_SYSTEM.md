# Recovery Procedures - User Management System

## Overview
This document provides recovery procedures for the new multi-user system implementation.

## What Changed
1. Added user management system with multiple dealer support
2. Created `/data/users.json` for user storage
3. Updated login to support multiple users
4. Maintained backward compatibility with environment variables

## Your Admin Credentials (Still Work!)
- **Username**: admin
- **Password**: AutoAudit2025!
- **Alternative**: Can also use email from .env file

## Recovery Scenarios

### 1. Cannot Login as Admin

**Option A - Check users.json**
```bash
cat data/users.json
# Verify admin user exists with correct password
```

**Option B - Use environment variables**
The system falls back to .env credentials if user not found:
```bash
# Check .env file
cat .env
# Should show:
# ADMIN_USERNAME=admin
# ADMIN_PASSWORD=AutoAudit2025!
```

**Option C - Reset admin password**
```bash
# Edit users.json directly
nano data/users.json
# Change admin password to known value
# Save and try login again
```

### 2. Lost users.json File

If the file is deleted, system auto-creates with admin from .env:
```bash
# Delete corrupted file
rm data/users.json
# Restart server - file recreates automatically
npm start
```

### 3. Server Won't Start

**Check for syntax errors:**
```bash
# Validate JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('./data/users.json')))"
```

**Restore from backup:**
```bash
# If you have backup
cp data/users.json.backup data/users.json
```

### 4. Session Issues

**Clear all sessions:**
```bash
# Stop server
# Delete session files if using file storage
rm -rf sessions/
# Restart server
npm start
```

### 5. Rollback Entire Change

**To completely remove user system:**

1. **Restore original login** in server.js:
```javascript
// Find the app.post('/api/login') route
// Replace with original code from backup
// Or use the code from CHANGELOG.md Version 2.4.3
```

2. **Remove new files:**
```bash
rm lib/user-manager.js
rm data/users.json
rm server-login-update.js
```

3. **Restart server**

## Testing User System

### Test Admin Login
```bash
# Use curl to test
curl -X POST http://localhost:3002/api/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=AutoAudit2025!" \
  -c cookies.txt -L

# Should redirect to home page
```

### Test Demo Dealer
```bash
curl -X POST http://localhost:3002/api/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=priceford&password=Demo2025!" \
  -c cookies.txt -L
```

## Manual User Creation

Add new dealer to users.json:
```json
{
  "id": "new-dealer",
  "email": "dealer@example.com",
  "username": "dealername",
  "password": "TempPassword123!",
  "dealership": "ABC Motors",
  "role": "dealer",
  "subscriptionTier": "professional",
  "subscriptionEnd": "2025-12-31",
  "isActive": true,
  "createdDate": "2025-01-17T00:00:00.000Z",
  "lastLogin": null
}
```

## Monitoring User Activity

Check last login times:
```bash
# View all users and last login
node -e "
const users = require('./data/users.json').users;
users.forEach(u => console.log(u.username, u.lastLogin || 'Never'));
"
```

## Emergency Contacts

If all recovery fails:
1. Check backup files in project folder
2. Review git history for previous versions
3. Use CHANGELOG.md for reference code

## Prevention

1. **Backup regularly:**
```bash
cp data/users.json data/users.json.backup
```

2. **Test after changes:**
- Always test admin login after updates
- Test one dealer login
- Verify data filtering works

3. **Monitor logs:**
- Check for login errors in console
- Watch for "Session save error" messages