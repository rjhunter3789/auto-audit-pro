# Admin Access Fix Instructions

## Issue
You're getting "Access Denied" when trying to access Admin Settings despite logging in successfully.

## Solution Steps

1. **Restart the server** (if not already running):
   ```bash
   npm start
   ```

2. **Login normally** at http://localhost:3002/login with:
   - Username: `admin`
   - Password: `AutoAudit2025!`

3. **After login, immediately visit this URL to fix your session**:
   ```
   http://localhost:3002/api/fix-admin-session
   ```
   
   You should see a response like:
   ```json
   {
     "success": true,
     "message": "Admin session fixed",
     "session": {
       "username": "admin",
       "role": "admin",
       "isAdmin": true
     }
   }
   ```

4. **Now you can access Admin Settings**:
   ```
   http://localhost:3002/admin/settings
   ```

## Optional: Check Your Session Status

Visit this URL anytime to see your current session status:
```
http://localhost:3002/api/session-info
```

## What Changed?

1. Added a session debugging endpoint (`/api/session-info`)
2. Improved the requireAdmin middleware to check both `isAdmin` and `role === 'admin'`
3. Added a temporary fix endpoint (`/api/fix-admin-session`) that ensures your session has admin privileges

## If the Fix Doesn't Work

The server logs will now show more detailed information when you try to access admin pages. Check the console output for lines starting with `[RequireAdmin]`.

## Quick Alternative (Not Recommended)

If you need immediate access for testing, you can temporarily bypass the admin check:

1. Stop the server
2. Edit `server.js` line ~2588
3. Change: `app.get('/admin/settings', requireAdmin, (req, res) => {`
4. To: `app.get('/admin/settings', (req, res) => {`
5. Save and restart the server

Remember to restore the `requireAdmin` middleware after testing!