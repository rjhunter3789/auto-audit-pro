# Auto Audit Pro - System Recovery Guide

## Last Updated: October 27, 2025

### Current System Status
- **Version**: 2.6.3
- **Server Port**: 3002
- **Admin User**: admin / Admin123!
- **Email**: alerts@autoauditpro.io

## Quick Recovery Steps

### 1. Server Won't Start
```bash
# Check if port is in use
netstat -an | grep 3002

# Start server
node server.js
```

### 2. Login Issues
- Admin username: `admin`
- Password: `Admin123!`
- Users file: `/data/users.json`

### 3. Clear Monitoring Data
```bash
node fix-monitoring-data.js
```

### 4. Manage Users
```bash
# Check user permissions
node check-user-permissions.js

# Manage users
node manage-users.js

# Remove monitoring sites
node remove-monitoring-site.js
```

### 5. Lead Management
- Captured leads stored in: `/data/captured-leads.json`
- View leads at: `/captured-leads` (admin only)
- Lead gate at: `/request-access`

## Key File Locations

### Configuration
- `.env` - Environment variables
- `/data/users.json` - User accounts
- `/data/captured-leads.json` - Lead data
- `/data/monitoring/` - Monitoring data

### Views
- `/views/homepage-public.html` - Public landing page
- `/views/lead-gate.html` - Lead capture form
- `/views/suite-home.html` - Main dashboard
- `/views/captured-leads.html` - Lead management

### Management Scripts
- `check-user-permissions.js` - View/modify user permissions
- `manage-users.js` - Add/remove users
- `remove-monitoring-site.js` - Remove monitored websites
- `manage-pending-monitoring.js` - Handle pending requests
- `fix-monitoring-data.js` - Reset monitoring system
- `force-clear-monitoring.js` - Complete monitoring reset

## System Features

### Lead Generation System
1. **Public Homepage** (`/`) - Showcases features
2. **Lead Gate** (`/request-access`) - Captures visitor info
3. **Email Notifications** - Sends to alerts@autoauditpro.io
4. **Admin Panel** (`/captured-leads`) - View all leads

### Access Flow
- **New Visitors**: Homepage → Lead Gate → Suite Access
- **Captured Leads**: Auto-redirect to suite
- **Admin Users**: Bypass lead gate
- **Existing Users**: Login → Suite Access

### Monitoring System
- Real-time website monitoring
- Email/SMS alerts
- Performance tracking
- Downtime detection

## Common Issues

### "Error loading pending requests"
Run: `node fix-monitoring-data.js`

### Can't remove website from monitoring
1. Check if you're logged in as admin
2. Run: `node remove-monitoring-site.js`

### Lead form shows "Failed to process request"
- Email system may not be initialized
- Lead is still captured in `/data/captured-leads.json`
- Check server logs for details

### Session/Login Issues
1. Clear browser cookies
2. Restart server
3. Check `/data/users.json` for valid users

## Emergency Contacts
- **Developer**: Jeffrey Lee Robinson
- **Support**: alerts@autoauditpro.io
- **Copyright**: © 2025 JL Robinson. All Rights Reserved.