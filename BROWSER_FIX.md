# Fix "Failed to Fetch" Error

## The server is running on PORT 3002 (not 3000)

### Step 1: Clear Browser Cache
1. Press F12 to open DevTools
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Step 2: Access the Correct URLs
- Login: http://localhost:3002/login
- Admin Fix: http://localhost:3002/admin-fix
- Monitoring: http://localhost:3002/monitoring

### Step 3: If Still Getting Errors
1. Close ALL browser tabs
2. Open a new incognito/private window
3. Go to: http://localhost:3002/login
4. Login with:
   - Username: admin
   - Password: Admin123!
5. Then go to: http://localhost:3002/admin-fix

### Alternative: Direct API Test
Open a new tab and go to:
http://localhost:3002/api/session-info

This should show your current session status.

### If Nothing Works
The server might be bound to WSL IP instead of localhost. Try:
1. In PowerShell: `wsl hostname -I`
2. Use that IP instead: http://[WSL-IP]:3002/login