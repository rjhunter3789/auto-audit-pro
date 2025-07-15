# Security Monitoring Demo - Auto Audit Pro

## Overview
The application now includes a comprehensive Intrusion Detection System (IDS) that monitors and blocks suspicious activity in real-time.

## How It Works

### 1. Automatic Threat Detection
The system automatically detects and blocks:
- WordPress admin access attempts (/wp-admin, /wp-login)
- PHP file access attempts
- Database/backup file probing (.sql, /backup)
- Git repository access (/.git)
- SQL injection attempts in query parameters

### 2. Failed Login Protection
- Tracks failed login attempts by IP address
- Automatically blocks IPs after 5 failed attempts
- Block duration: 30 minutes
- Blocks are automatically lifted after timeout

### 3. Security Dashboard
Access the security dashboard at `/security` to view:
- Currently blocked IP addresses
- Recent security events
- Failed login attempts
- Real-time threat monitoring

### 4. Security Log
All security events are logged to `/logs/security.log` with:
- Timestamp
- Event type
- IP address
- Path accessed
- Details of the threat

## Testing the Security Features

### Simulate an Intrusion Attempt:
```bash
# Try accessing a suspicious path
curl http://localhost:3002/wp-admin

# Expected: 404 response and security event logged
```

### Simulate SQL Injection:
```bash
# Try SQL injection in query parameter
curl "http://localhost:3002/?id=1' OR '1'='1"

# Expected: 400 Bad Request response
```

### Simulate Failed Login:
```bash
# Multiple failed login attempts
curl -X POST http://localhost:3002/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"hacker","password":"wrongpass"}'

# After 5 attempts: IP gets blocked for 30 minutes
```

## Security Event Types

1. **INTRUSION_ATTEMPT** - Suspicious path accessed
2. **SQL_INJECTION_ATTEMPT** - SQL patterns detected
3. **LOGIN_FAILED** - Failed authentication attempt
4. **IP_BLOCKED** - IP blocked after max attempts
5. **BLOCKED_ACCESS_ATTEMPT** - Blocked IP tried to access
6. **LOGIN_SUCCESS** - Successful authentication
7. **IP_UNBLOCKED** - IP automatically unblocked

## Admin Access

1. Navigate to the home page
2. Scroll to footer and click "Security Dashboard"
3. View real-time security monitoring
4. Dashboard auto-refreshes every 30 seconds

## Configuration

Security settings in `/middleware/security-monitor.js`:
- `MAX_ATTEMPTS`: 5 (failed logins before blocking)
- `BLOCK_DURATION`: 30 minutes
- `SUSPICIOUS_PATHS`: Array of blocked paths

## Important Notes

- All security events trigger console alerts with 🚨 emoji
- Blocked IPs receive 403 Forbidden response
- Suspicious paths return 404 to avoid revealing structure
- SQL injection attempts return 400 Bad Request
- Security monitoring is active on ALL requests