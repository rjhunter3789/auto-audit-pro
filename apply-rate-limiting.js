#!/usr/bin/env node

/*
 * Rate Limiting Integration Script
 * Auto Audit Pro - Applies rate limiting to server.js
 * 
 * This script shows exactly where to add rate limiting in your server.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Rate Limiting Integration Helper\n');

// Check if rate limiter middleware exists
const rateLimiterPath = path.join(__dirname, 'middleware', 'rate-limiter.js');
if (!fs.existsSync(rateLimiterPath)) {
    console.error('❌ Rate limiter middleware not found at:', rateLimiterPath);
    process.exit(1);
}

// Check if dependencies are installed
try {
    require('express-rate-limit');
    require('express-slow-down');
    console.log('✅ Rate limiting dependencies are installed\n');
} catch (e) {
    console.error('❌ Dependencies not installed. Run: ./install-rate-limiting.sh');
    process.exit(1);
}

// Show integration code
console.log('📋 Add this code to your server.js:\n');
console.log('────────────────────────────────────────────────');
console.log(`
// Add after your existing middleware (after app.use(cors()), etc.)
const rateLimiter = require('./middleware/rate-limiter');

// Apply global rate limiting and speed limiting
app.use(rateLimiter.speedLimiter);
app.use(rateLimiter.ipBlocker);

// Protect authentication endpoints
app.use('/login', rateLimiter.authLimiter);
app.use('/api/login', rateLimiter.authLimiter);
app.use('/recover-access', rateLimiter.authLimiter);
app.use('/api/emergency-fix-session', rateLimiter.authLimiter);

// Protect audit endpoints (resource intensive)
app.post('/audit', rateLimiter.auditLimiter);
app.post('/api/audit', rateLimiter.auditLimiter);
app.post('/audit-dealer-group', rateLimiter.auditLimiter);
app.get('/api/audit-progress/:auditId', rateLimiter.basicLimiter);

// Protect future AI endpoints
app.use('/api/ai/', rateLimiter.aiLimiter);
app.use('/api/deep-seo/', rateLimiter.aiLimiter);

// General API protection
app.use('/api/', rateLimiter.basicLimiter);

// Special handling for admin routes (authenticated users)
app.use('/admin/', (req, res, next) => {
    // Authenticated admins get more generous limits
    if (req.session && req.session.isAdmin) {
        // Apply a more generous limit for admins
        const adminLimiter = rateLimiter.createCustomLimiter({
            windowMs: 15 * 60 * 1000,
            max: 200, // Double the normal limit
            message: 'Admin rate limit exceeded'
        });
        adminLimiter(req, res, next);
    } else {
        // Non-admins get standard limits
        rateLimiter.basicLimiter(req, res, next);
    }
});

// Add logging for rate limit monitoring
app.use((req, res, next) => {
    if (req.rateLimit && req.rateLimit.remaining < 10) {
        console.warn(\`[Rate Limit Warning] IP: \${req.ip}, Remaining: \${req.rateLimit.remaining}\`);
    }
    next();
});

console.log('✅ Rate limiting middleware configured');
`);
console.log('────────────────────────────────────────────────\n');

// Show where to add it in server.js
console.log('📍 WHERE TO ADD THIS CODE:\n');
console.log('Look for this section in your server.js:');
console.log('────────────────────────────────────────────────');
console.log(`
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ADD RATE LIMITING HERE <--- 🎯

// Serve static files
app.use('/js', express.static(path.join(__dirname, 'public/js')));
`);
console.log('────────────────────────────────────────────────\n');

// Trust proxy reminder
console.log('⚠️  IMPORTANT REMINDERS:\n');
console.log('1. If running behind a proxy (Railway, Heroku, etc), add this near the top:');
console.log('   app.set("trust proxy", 1);\n');
console.log('2. The rate limits are currently:');
console.log('   - General API: 100 requests per 15 minutes');
console.log('   - Login: 5 attempts per 15 minutes');
console.log('   - Audits: 20 per hour');
console.log('   - AI/LLM: 10 per hour\n');
console.log('3. To test rate limiting:');
console.log('   curl -H "X-Forwarded-For: 1.2.3.4" http://localhost:3002/api/health');
console.log('   (repeat 101 times to trigger rate limit)\n');

console.log('✨ Next steps:');
console.log('1. Add the code to server.js');
console.log('2. Restart the server');
console.log('3. Test with the provided curl commands');
console.log('4. Monitor logs for rate limit warnings\n');