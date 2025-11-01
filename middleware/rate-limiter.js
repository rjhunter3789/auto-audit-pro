/*
 * Rate Limiting Middleware for Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Protects API endpoints from abuse and DDoS attacks
 * Implements different rate limits for various endpoint types
 */

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Store for tracking requests (in-memory for now, can be upgraded to Redis)
const createMemoryStore = () => {
    const requests = new Map();
    
    return {
        increment: async (key) => {
            const current = requests.get(key) || { count: 0, resetTime: Date.now() + 60000 };
            current.count++;
            requests.set(key, current);
            return current;
        },
        decrement: async (key) => {
            const current = requests.get(key);
            if (current && current.count > 0) {
                current.count--;
                requests.set(key, current);
            }
        },
        reset: async (key) => {
            requests.delete(key);
        }
    };
};

// Helper to create custom error message
const createRateLimitMessage = (retryAfter) => {
    return {
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: retryAfter,
        retryAfterSeconds: Math.ceil(retryAfter / 1000),
        documentation: 'https://autoauditpro.com/docs/rate-limits'
    };
};

// Basic rate limiter for general API endpoints
const basicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json(createRateLimitMessage(req.rateLimit.resetTime - Date.now()));
    }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 login attempts per 15 minutes
    skipSuccessfulRequests: true, // Don't count successful logins
    message: 'Too many login attempts, please try again after 15 minutes',
    handler: (req, res) => {
        console.warn(`[Rate Limit] Too many auth attempts from IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many login attempts',
            message: 'For security reasons, please wait 15 minutes before trying again.',
            retryAfterMinutes: 15
        });
    }
});

// Moderate rate limiter for audit endpoints (resource intensive)
const auditLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 audits per hour
    message: 'Audit limit reached. Please upgrade to Pro for unlimited audits.',
    handler: (req, res) => {
        res.status(429).json({
            error: 'Audit limit reached',
            message: 'You have reached the maximum number of audits for this hour.',
            upgradeUrl: 'https://autoauditpro.com/pricing',
            retryAfterMinutes: 60
        });
    }
});

// Strict limiter for AI/LLM endpoints (expensive operations)
const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Only 10 AI analyses per hour
    message: 'AI analysis limit reached',
    handler: (req, res) => {
        res.status(429).json({
            error: 'AI analysis limit reached',
            message: 'AI Tag Analysis is limited to 10 requests per hour.',
            feature: 'premium',
            retryAfterMinutes: 60
        });
    }
});

// Progressive slow down for scrapers/bots
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Allow 50 requests per windowMs at full speed
    delayMs: () => 500, // Fixed: Use function for v2 compatibility
    maxDelayMs: 20000, // Max delay of 20 seconds
    // Remove deprecated onLimitReached
    validate: { delayMs: false } // Disable warning
});

// Create custom limiter with specific options
const createCustomLimiter = (options) => {
    return rateLimit({
        windowMs: options.windowMs || 15 * 60 * 1000,
        max: options.max || 100,
        message: options.message || 'Too many requests',
        ...options
    });
};

// IP-based blocking for severe abuse
const blockList = new Set();
const ipBlocker = (req, res, next) => {
    if (blockList.has(req.ip)) {
        return res.status(403).json({
            error: 'Access denied',
            message: 'Your IP has been temporarily blocked due to suspicious activity.'
        });
    }
    next();
};

// Rate limit configuration by endpoint type
const rateLimitConfig = {
    // Public endpoints - generous limits
    public: {
        windowMs: 15 * 60 * 1000,
        max: 200
    },
    // API endpoints - moderate limits
    api: {
        windowMs: 15 * 60 * 1000,
        max: 100
    },
    // Admin endpoints - strict limits
    admin: {
        windowMs: 15 * 60 * 1000,
        max: 50
    },
    // Audit endpoints - resource intensive
    audit: {
        windowMs: 60 * 60 * 1000,
        max: 20
    },
    // AI endpoints - very expensive
    ai: {
        windowMs: 60 * 60 * 1000,
        max: 10
    }
};

// Export middleware and utilities
module.exports = {
    // Pre-configured limiters
    basicLimiter,
    authLimiter,
    auditLimiter,
    aiLimiter,
    speedLimiter,
    ipBlocker,
    
    // Custom limiter creator
    createCustomLimiter,
    
    // Configuration
    rateLimitConfig,
    
    // Utilities
    blockIP: (ip) => blockList.add(ip),
    unblockIP: (ip) => blockList.delete(ip),
    isBlocked: (ip) => blockList.has(ip),
    
    // Apply rate limiting to all routes
    applyToApp: (app) => {
        // Global speed limiter for all routes
        app.use(speedLimiter);
        
        // IP blocker for all routes
        app.use(ipBlocker);
        
        // Specific limiters for different route types
        app.use('/api/', basicLimiter);
        app.use('/auth/', authLimiter);
        app.use('/login', authLimiter);
        app.use('/audit', auditLimiter);
        app.use('/api/audit', auditLimiter);
        app.use('/ai/', aiLimiter);
        app.use('/api/ai/', aiLimiter);
        
        console.log('✅ Rate limiting middleware applied to all routes');
    }
};