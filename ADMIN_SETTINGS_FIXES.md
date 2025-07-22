# Admin Settings Navigation Fixes

## Issues Fixed

### 1. ROI Config 403 Error
**Problem**: The `roi-config-static.json` file was returning 403 Forbidden because the public directory root wasn't being served.

**Solution**: Added the following line to server.js (line 89):
```javascript
app.use('/', express.static(path.join(__dirname, 'public')));
```

This allows the server to serve files directly from the public directory, including `roi-config-static.json`.

### 2. Navigation Routes
**Current Setup**:
- The "Back to Main" button in admin-settings.html navigates to `/` 
- The `/` route renders `suite-home.html` (the main landing page)
- This is the correct behavior

### 3. Admin Settings Routes Available
The following routes are available for accessing admin settings:
- `/admin-settings-direct` - Direct access, no auth required
- `/admin-settings.html` - Direct HTML file access
- `/admin-settings` - Alternative route
- `/settings-admin` - Emergency direct access route
- `/admin/settings` - Requires admin authentication
- `/views/admin-settings.html` - Direct file access through views

## To Apply Fixes

1. **Restart the server** to apply the changes to server.js
2. The ROI config should now load properly at `/roi-config-static.json`
3. The "Back to Main" button already navigates correctly to the home page

## Testing

After restarting the server, test:
1. Navigate to `/admin-settings-direct` or any of the admin settings routes
2. Check that ROI config loads without 403 error
3. Verify "Back to Main" button takes you to the home page