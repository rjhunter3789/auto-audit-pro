# Recovery Procedures - Latest Updates (July 18, 2025)

## Recent Changes Summary
1. Fixed admin access issues (session persistence)
2. Created multi-user SaaS system
3. Fixed Content Security Policy for report scripts
4. Removed duplicate monitoring tile from Website Analysis
5. Separated dealer ROI controls from admin monitoring controls
6. Fixed monitoring dashboard display issues (was showing "Checking..." instead of timestamps)
7. Updated all monitoring endpoints to use JSON storage instead of PostgreSQL
8. Fixed acknowledge/resolve alert functionality
9. Fixed fs import issue (fs.existsSync error) preventing dealer login
10. Added password visibility toggle to login page
11. Confirmed role-based UI working (dealers don't see delete buttons)
12. Fixed profile deletion - now uses direct file writes instead of non-existent methods
13. Fixed RED alerts display in Active Alerts section
14. Fixed monitoring stats endpoint to use JSON calculations
15. Fixed monitoring scheduler to use JSON storage - no more phantom monitoring
16. Fixed Admin Settings access with proper security restrictions
17. Added session repair endpoint for admin access issues

## Recovery Scenarios

### 1. Admin Access Issues (RESOLVED)

**If Admin Settings shows "Access Denied":**
1. Login as admin (admin / AutoAudit2025!)
2. Visit: http://localhost:3002/api/fix-admin-session
3. Then access: http://localhost:3002/admin/monitoring-settings

**Alternative Admin Settings Access:**
- Use: http://localhost:3002/settings-config (bypasses /admin/ route issues)

### 2. Report Display Issues (Template Errors)

**Current Issue**: Reports show raw template code like `<%= results.domain %>`

**Temporary Workarounds:**
1. View raw audit data: http://localhost:3002/api/audit/[AUDIT-ID]
2. Use monitoring dashboard for website status
3. Check browser console (F12) for specific errors

**Permanent Fix Needed**: Convert report files from .html to .ejs or fix client-side JavaScript

### 3. Multi-User System

**Files Added:**
- `lib/user-manager.js` - User authentication system
- `data/users.json` - User database
- `server-login-update.js` - New login code reference

**To Enable Multi-User:**
1. Add to server.js: `const { authenticateUser } = require('./lib/user-manager');`
2. Replace login route with code from server-login-update.js
3. Restart server

**To Rollback Multi-User:**
1. Keep existing login code in server.js
2. System continues using .env credentials only

### 4. CSP (Content Security Policy) Fix

**Changed in server.js:**
```javascript
// Old:
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "

// New (allows html2canvas for PDF export):
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; "
```

### 5. Permission Model Changes

**Dealer Controls** (in Lead Performance Settings):
- ROI calculations
- Business metrics
- Expected improvements

**Admin Only Controls**:
- Monitoring frequency (30 min, 59 min, 6 hours)
- User management (when implemented)
- System configuration

### 6. Removed Features

**Monitoring Tile Removed From:**
- Website Analysis page (index-new.html)
- Now only on main suite homepage

### 7. Monitoring Dashboard Fixes (January 17, 2025 - Evening)

**Issues Fixed:**
- Dashboard showing "Checking..." instead of actual timestamps
- Alert acknowledge/resolve buttons not working
- 500 errors on API calls

**What Was Changed:**
1. Updated `/api/monitoring/status` endpoint to use JSON storage
2. Updated `/api/monitoring/profiles` endpoint to use JSON storage  
3. Fixed acknowledge alert endpoint (`/api/monitoring/alerts/:alertId/acknowledge`)
4. Fixed resolve alert endpoint (`/api/monitoring/alerts/:alertId/resolve`)
5. Changed from `new JSONStorage()` to `require('./lib/json-storage').storage`

**Files Modified:**
- `server.js` - Multiple endpoint updates
- Created fix scripts: `fix-monitoring-status-display.js`, `fix-all-monitoring-endpoints.js`, `fix-json-storage-usage.js`

### 8. Multi-User System Enabled (January 17, 2025 - Late Evening)

**Login Credentials:**
- Admin: username `admin`, password `AutoAudit2025!`
- Dealer: username `dealer`, password `dealer123`

**Fixed Issues:**
- fs.existsSync error - changed `fs.promises` to separate `fs` and `fsPromises`
- Added debug logging to troubleshoot login issues
- Created `data/users.json` with both admin and dealer accounts

**UI Enhancements:**
- Added password visibility toggle (eye icon) on login page
- Click eye to show/hide password while typing

**Role-Based Features Working:**
- Admin sees: Red "Admin" badge, Admin Settings button, Delete buttons
- Dealer sees: Clean interface without admin controls
- Dealers cannot delete monitoring profiles (by design)

### 9. Profile Deletion Fixed (July 18, 2025)

**Previous Issue:**
- Delete button showed "Failed to delete monitoring profile"
- Error: `TypeError: jsonStorage.saveProfiles is not a function`

**Root Cause:**
- json-storage.js module didn't have saveProfiles/saveAlerts/saveResults methods
- Code was trying to call non-existent functions

**Fix Applied:**
- Changed to use direct file writes with fs.writeFile()
- Delete endpoint now writes directly to JSON files
- All profile/alert/result data properly cleaned up on delete

**Files Modified:**
- `server.js` - Updated delete endpoint, alerts endpoint, stats endpoint
- Now uses: `await fs.writeFile(profilesFile, JSON.stringify(updatedProfiles, null, 2))`

### 10. Phantom Monitoring Fixed (July 18, 2025)

**Previous Issue:**
- Deleted profiles continued to be monitored
- Price Ford kept reappearing even after deletion
- Monitoring scheduler was using PostgreSQL instead of JSON

**Fix Applied:**
- Updated MonitoringScheduler to use JSON storage
- Removed all PostgreSQL queries from scheduler
- Created cleanup script for ghost profiles

**To Clean Ghost Profiles:**
```bash
node clean-phantom-profile.js
```

### 11. Admin Settings Access Fixed (July 18, 2025)

**Issue:**
- Admin Settings button returned 403 Forbidden
- requireAdmin middleware blocking even admin users

**Fix Applied:**
- Created alternative route `/settings-admin`
- Properly restricted to admin users only
- Added session repair endpoint

**If Admin Access Denied:**
1. Visit: `/api/fix-admin`
2. This will repair your admin session
3. Then Admin Settings will work

## Emergency Rollback Commands

### Full System Reset
```bash
# Stop server
# Restore from backup
git checkout HEAD -- .
# Or specific files
git checkout HEAD -- server.js
git checkout HEAD -- views/index-new.html

# Restart
npm start
```

### Session Issues
```bash
# Clear all sessions
rm -rf sessions/
# Restart server
npm start
```

### User System Issues
```bash
# Reset to admin only
rm data/users.json
# Server auto-creates with admin from .env
npm start
```

## Current System State

### Working Features
- ✅ Admin login (admin / AutoAudit2025!)
- ✅ Dealer login (dealer / dealer123) 
- ✅ Multi-user system ACTIVE with role-based UI
- ✅ Website monitoring with correct timestamp display
- ✅ Alert acknowledgment and resolution
- ✅ New audits
- ✅ ROI calculations (dealer controlled)
- ✅ Monitoring frequency (admin controlled)
- ✅ Session management
- ✅ Manual monitoring checks ("Check Now" button)
- ✅ Password visibility toggle on login page

### Known Issues
- ⚠️ Report templates not rendering (showing raw code)
- ⚠️ Some routes require /settings-config workaround
- ⚠️ Monitoring gets 403 errors from sites with Cloudflare (need ScrapingDog)

## Prevention Tips

1. **Before Major Changes:**
   - Backup critical files
   - Test on single feature first
   - Keep recovery procedures updated

2. **After Changes:**
   - Test admin login
   - Verify core features work
   - Update documentation

3. **Regular Maintenance:**
   - Clear old sessions weekly
   - Backup data/ folder
   - Monitor error logs