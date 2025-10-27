# Website Monitoring Management Tools

## 1. Check User Permissions
```bash
node check-user-permissions.js
```
- Shows all users and their admin status
- Allows you to check specific users
- Can promote users to admin (with confirmation)

## 2. Remove Websites from Monitoring
```bash
node remove-monitoring-site.js
```
- Lists all monitored websites
- Allows safe removal with confirmation
- Creates automatic backup before deletion
- Cleans up associated history and alerts

## Quick Commands:

### Run permission checker:
```bash
cd /mnt/c/Users/nakap/Desktop/auto-audit-pro
node check-user-permissions.js
```

### Remove a website:
```bash
cd /mnt/c/Users/nakap/Desktop/auto-audit-pro
node remove-monitoring-site.js
```

## Notes:
- Always creates backups before making changes
- Requires Node.js to be installed
- Works directly with the data files (no server needed)