# Network Dealers Page Updates

## 1. Response Time Fixes

Add these to `/public/js/lead-performance.js`:

### Add parseElapsedTime function (around line 1650, before any response time calculations):

```javascript
// Parse elapsed time from various formats (0:15, 2:30:45, 15, 0h 13m, etc.)
function parseElapsedTime(elapsed) {
    try {
        const elapsedStr = String(elapsed).trim();
        
        // If it's just a number, assume it's minutes
        if (/^\d+$/.test(elapsedStr)) {
            return parseInt(elapsedStr);
        }
        
        // If it's in "0h 13m" or "20h 35m" format
        if (/^\d+h\s+\d+m$/.test(elapsedStr)) {
            const match = elapsedStr.match(/(\d+)h\s+(\d+)m/);
            const hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            return hours * 60 + minutes;
        }
        
        // If it's in H:MM or HH:MM format
        if (/^\d+:\d{2}$/.test(elapsedStr)) {
            const [hours, minutes] = elapsedStr.split(':').map(Number);
            return hours * 60 + minutes;
        }
        
        // If it's in H:MM:SS or HH:MM:SS format
        if (/^\d+:\d{2}:\d{2}$/.test(elapsedStr)) {
            const [hours, minutes, seconds] = elapsedStr.split(':').map(Number);
            return hours * 60 + minutes + Math.round(seconds / 60);
        }
        
        console.log(`Unable to parse elapsed time: ${elapsedStr}`);
        return 999999;
    } catch (e) {
        console.error('Error parsing elapsed time:', e);
        return 999999;
    }
}
```

### Update date parsing (find where dates are parsed from Excel):

Add this fix for AM/PM format:
```javascript
// Handle "1/15/2025 10:30AM" format
const actionableStr = String(actionableDate).replace(/(\d)(AM|PM)/i, '$1 $2');
const responseStr = String(responseDate).replace(/(\d)(AM|PM)/i, '$1 $2');
```

### Use Column F (actionableDate) instead of receipt date for response time calculation

## 2. Security Monitoring Re-enable

Add to server.js (after other middleware):

```javascript
// Load security monitoring
const securityMonitor = require('./middleware/security-monitor');

// Add localhost whitelist check
app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    // Whitelist localhost and local IPs
    if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1' || ip.includes('localhost')) {
        return next();
    }
    
    // Apply security checks for non-localhost
    securityMonitor.checkSuspiciousActivity(req, res, next);
});
```

## 3. Add to login route:

```javascript
// In the login POST route, add:
if (validCredentials) {
    securityMonitor.clearFailedAttempts(ip);
} else {
    securityMonitor.trackFailedLogin(ip);
}
```