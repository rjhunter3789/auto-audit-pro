# Rate Limiting Implementation Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
chmod +x install-rate-limiting.sh
./install-rate-limiting.sh
```

### 2. Add to server.js

Add these lines after your middleware setup (after `app.use(cors())` etc.):

```javascript
// Load rate limiting middleware
const rateLimiter = require('./middleware/rate-limiter');

// Apply rate limiting to all routes
rateLimiter.applyToApp(app);

// Or apply specific limiters to specific routes
app.use('/api/', rateLimiter.basicLimiter);
app.use('/login', rateLimiter.authLimiter);
app.post('/audit', rateLimiter.auditLimiter);
```

## 📋 Available Rate Limiters

### 1. **basicLimiter** - General API Protection
- **Limit**: 100 requests per 15 minutes
- **Use for**: General API endpoints
- **Example**: `/api/health`, `/api/status`

### 2. **authLimiter** - Login Protection
- **Limit**: 5 attempts per 15 minutes
- **Use for**: Login and authentication endpoints
- **Example**: `/login`, `/auth/login`
- **Special**: Only counts failed attempts

### 3. **auditLimiter** - Resource Protection
- **Limit**: 20 audits per hour
- **Use for**: Website audit endpoints
- **Example**: `/audit`, `/api/audit`

### 4. **aiLimiter** - AI Feature Protection
- **Limit**: 10 requests per hour
- **Use for**: AI Tag Analysis endpoints
- **Example**: `/api/ai/analyze`, `/ai/tags`

### 5. **speedLimiter** - Progressive Slowdown
- **Limit**: Slows after 50 requests in 15 minutes
- **Use for**: Global protection against scrapers
- **Effect**: Adds 500ms delay per request after threshold

## 🛠️ Custom Rate Limits

Create custom limiters for specific needs:

```javascript
const customLimiter = rateLimiter.createCustomLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 requests per window
    message: 'Custom limit exceeded'
});

app.use('/special-endpoint', customLimiter);
```

## 🔧 Advanced Features

### IP Blocking
```javascript
// Block an IP manually
rateLimiter.blockIP('192.168.1.100');

// Unblock an IP
rateLimiter.unblockIP('192.168.1.100');

// Check if IP is blocked
if (rateLimiter.isBlocked(req.ip)) {
    // Handle blocked IP
}
```

### Rate Limit Headers
The middleware automatically adds these headers:
- `RateLimit-Limit`: Request limit
- `RateLimit-Remaining`: Requests remaining
- `RateLimit-Reset`: Reset time

### Error Responses
Rate limited requests receive:
```json
{
    "error": "Too many requests",
    "message": "You have exceeded the rate limit. Please try again later.",
    "retryAfter": 900000,
    "retryAfterSeconds": 900,
    "documentation": "https://autoauditpro.com/docs/rate-limits"
}
```

## 📊 Monitoring Rate Limits

Add to your logging:

```javascript
app.use((req, res, next) => {
    if (req.rateLimit) {
        console.log(`[Rate Limit] IP: ${req.ip}, Remaining: ${req.rateLimit.remaining}`);
    }
    next();
});
```

## 🎯 Recommended Configuration

For Auto Audit Pro, apply these limits:

```javascript
// In server.js, after middleware setup:
const rateLimiter = require('./middleware/rate-limiter');

// Global protection
app.use(rateLimiter.speedLimiter);
app.use(rateLimiter.ipBlocker);

// Auth endpoints
app.use('/login', rateLimiter.authLimiter);
app.use('/api/login', rateLimiter.authLimiter);
app.use('/recover-access', rateLimiter.authLimiter);

// Audit endpoints (expensive operations)
app.post('/audit', rateLimiter.auditLimiter);
app.post('/api/audit', rateLimiter.auditLimiter);
app.post('/audit-dealer-group', rateLimiter.auditLimiter);

// Future AI endpoints
app.use('/api/ai/', rateLimiter.aiLimiter);

// General API protection
app.use('/api/', rateLimiter.basicLimiter);

// Admin routes (authenticated users get more requests)
app.use('/admin/', (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        // Admins get higher limits
        next();
    } else {
        rateLimiter.basicLimiter(req, res, next);
    }
});
```

## 🧪 Testing Rate Limits

Test script to verify rate limiting:

```bash
# Test basic rate limit (should fail after 100 requests)
for i in {1..110}; do
    curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3002/api/health
    sleep 0.1
done

# Test auth rate limit (should fail after 5 attempts)
for i in {1..10}; do
    curl -X POST http://localhost:3002/login \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"wrong"}'
done
```

## ⚠️ Important Notes

1. **Session Compatibility**: Rate limits are IP-based, not session-based
2. **Proxy Consideration**: If behind a proxy, configure Express trust proxy:
   ```javascript
   app.set('trust proxy', 1);
   ```
3. **Memory Usage**: Current implementation uses in-memory storage. For production with multiple servers, consider Redis.
4. **Whitelisting**: Consider whitelisting monitoring services, internal IPs

## 📈 Future Enhancements

1. **Redis Store**: For distributed rate limiting across multiple servers
2. **User-Based Limits**: Different limits for free vs. paid users
3. **Dynamic Limits**: Adjust based on server load
4. **Analytics**: Track rate limit hits for abuse pattern detection

---

*Rate limiting is now protecting Auto Audit Pro from abuse and ensuring fair usage!*