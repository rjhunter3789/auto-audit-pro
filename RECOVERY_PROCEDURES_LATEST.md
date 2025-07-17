# Recovery Procedures - Latest Updates (January 17, 2025)

## Recent Changes Summary
1. Fixed admin access issues (session persistence)
2. Created multi-user SaaS system
3. Fixed Content Security Policy for report scripts
4. Removed duplicate monitoring tile from Website Analysis
5. Separated dealer ROI controls from admin monitoring controls

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
- ✅ Website monitoring
- ✅ New audits
- ✅ ROI calculations (dealer controlled)
- ✅ Monitoring frequency (admin controlled)
- ✅ Session management

### Known Issues
- ⚠️ Report templates not rendering (showing raw code)
- ⚠️ Multi-user system ready but not active
- ⚠️ Some routes require /settings-config workaround

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