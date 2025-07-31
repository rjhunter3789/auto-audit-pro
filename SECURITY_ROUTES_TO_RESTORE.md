# Security Routes to Restore

## IMPORTANT: Authentication has been temporarily disabled for debugging purposes

### Routes that need authentication restored:

1. **Admin Routes** (requireAdmin):
   - `/admin/settings`
   - `/admin/monitoring-settings`
   - `/api/monitoring/profiles/:id` (DELETE)
   - `/api/monitoring/profiles/pending` (GET)
   - `/api/monitoring/profiles/:id/approve` (POST)
   - `/api/monitoring/profiles/:id/deny` (POST)
   - `/api/roi/config` (PUT)
   - Various other admin endpoints

2. **General Auth Routes** (checkAuth):
   - `/monitoring` (currently no auth)
   - `/api/user/current`
   - Various API endpoints

3. **Frontend Changes to Restore**:
   - `monitoring-dashboard.html` - loadUserInfo() function
   - Admin button visibility logic
   - Role-based UI updates

4. **Middleware to Re-enable**:
   - `const { checkAuth, ADMIN_USERNAME, ADMIN_PASSWORD } = require('./middleware/auth');`
   - `requireAdmin` function implementation

## To Restore Security:
1. Uncomment the auth middleware import
2. Remove the bypass functions
3. Restore the original requireAdmin function
4. Update frontend loadUserInfo() to check actual auth
5. Hide admin button by default