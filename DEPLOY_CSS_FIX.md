# Deploy CSS Fix to Production

The CSS changes were made locally but need to be uploaded to your production server at 146.190.39.214.

## Files to Upload

1. **views/reports-dealer-style.html** - Contains the CSS changes:
   - Body padding increased to 100px
   - 3D text shadow effect on h1
   - Cache-busting timestamps

2. **server.js** - Contains view cache disable for development

## Manual Deployment Steps

### Option 1: Using SCP (from your local machine)
```bash
# Upload the updated template
scp views/reports-dealer-style.html root@146.190.39.214:/opt/auto-audit-pro/views/

# Upload the updated server.js
scp server.js root@146.190.39.214:/opt/auto-audit-pro/

# SSH into server and restart
ssh root@146.190.39.214
cd /opt/auto-audit-pro
pm2 restart auto-audit
```

### Option 2: Manual Edit on Server
```bash
# SSH into server
ssh root@146.190.39.214
cd /opt/auto-audit-pro

# Edit the template directly
nano views/reports-dealer-style.html

# Look for line ~31 and change:
# padding: 80px 20px 40px 20px; /* Increased top padding from 40px to 80px */
# TO:
# padding: 100px 20px 40px 20px !important; /* Further increased top padding for better spacing */

# Also add the 3D text shadow to h1 (around line 43):
# After "margin: 0;" add:
/* 3D text effect for dramatic impact */
text-shadow: 0 1px 0 #ccc, 
            0 2px 0 #c9c9c9, 
            0 3px 0 #bbb, 
            0 4px 0 #b9b9b9, 
            0 5px 0 #aaa, 
            0 6px 1px rgba(0,0,0,.1), 
            0 0 5px rgba(0,0,0,.1), 
            0 1px 3px rgba(0,0,0,.3), 
            0 3px 5px rgba(0,0,0,.2), 
            0 5px 10px rgba(0,0,0,.25), 
            0 10px 10px rgba(0,0,0,.2), 
            0 20px 20px rgba(0,0,0,.15);

# Save and exit (Ctrl+X, Y, Enter)

# Restart PM2
pm2 restart auto-audit
```

## Additional Caching Layers to Check

1. **Nginx Cache** - May need to clear:
   ```bash
   # On the server
   nginx -s reload
   ```

2. **CloudFlare** - If using CloudFlare:
   - Go to CloudFlare dashboard
   - Purge cache for autoauditpro.io
   - Or enable "Development Mode" temporarily

3. **Browser Cache** - Force refresh:
   - Chrome/Edge: Ctrl+Shift+R or Ctrl+F5
   - Firefox: Ctrl+Shift+R
   - Safari: Cmd+Shift+R
   - Or use Incognito/Private mode

## Verify Changes

After deployment, check if the file was updated:
```bash
ssh root@146.190.39.214 "grep -n 'padding: 100px' /opt/auto-audit-pro/views/reports-dealer-style.html"
```

This should show the updated CSS line if deployment was successful.