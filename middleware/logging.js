/*
 * Logging Middleware for Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Provides request/response logging, error tracking, and performance monitoring
 */

const { logger, loggers, logRequest, logResponse, logError, generateRequestId, PerformanceTracker } = require('../lib/logger');

// Request logging middleware
const requestLogger = (req, res, next) => {
    // Generate unique request ID
    req.id = generateRequestId();
    req.startTime = Date.now();
    
    // Add request ID to all logs for this request
    req.logger = logger.child({ requestId: req.id });
    
    // Log incoming request
    logRequest(req, {
        requestId: req.id,
        sessionId: req.session?.id,
        userId: req.session?.userId || req.session?.username
    });
    
    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
        res.responseBody = data;
        originalSend.call(this, data);
    };
    
    // Log response when finished
    res.on('finish', () => {
        const responseTime = Date.now() - req.startTime;
        logResponse(req, res, responseTime);
        
        // Log slow requests
        if (responseTime > 1000) {
            loggers.performance.warn('Slow request detected', {
                method: req.method,
                url: req.originalUrl,
                responseTime: `${responseTime}ms`,
                threshold: '1000ms'
            });
        }
    });
    
    next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
    // Log the error with context
    logError(err, {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.session?.userId,
        body: req.body,
        params: req.params,
        query: req.query
    });
    
    // Don't expose internal errors to client in production
    if (process.env.NODE_ENV === 'production') {
        // Send generic error message
        res.status(err.status || 500).json({
            error: 'Internal Server Error',
            message: 'An error occurred processing your request',
            requestId: req.id
        });
    } else {
        // In development, send full error details
        res.status(err.status || 500).json({
            error: err.message,
            stack: err.stack,
            requestId: req.id
        });
    }
};

// Audit logging middleware for sensitive operations
const auditLogger = (action) => {
    return (req, res, next) => {
        // Log the audit event
        const userId = req.session?.userId || req.session?.username || 'anonymous';
        const details = {
            requestId: req.id,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            method: req.method,
            url: req.originalUrl,
            body: req.body
        };
        
        // Remove sensitive data from logs
        if (details.body && details.body.password) {
            details.body = { ...details.body, password: '[REDACTED]' };
        }
        
        require('../lib/logger').logAudit(action, userId, details);
        
        next();
    };
};

// Performance monitoring middleware
const performanceMonitor = (operationName) => {
    return async (req, res, next) => {
        const tracker = new PerformanceTracker(operationName || `${req.method} ${req.route?.path || req.path}`);
        req.performanceTracker = tracker;
        
        // Track response time
        const startTime = Date.now();
        
        // Override res.json to capture when response is sent
        const originalJson = res.json;
        res.json = function(data) {
            tracker.checkpoint('response-sent');
            const duration = Date.now() - startTime;
            
            // Add performance headers
            res.set('X-Response-Time', `${duration}ms`);
            res.set('X-Request-ID', req.id);
            
            tracker.end({
                statusCode: res.statusCode,
                responseSize: JSON.stringify(data).length
            });
            
            return originalJson.call(this, data);
        };
        
        next();
    };
};

// Security event logger
const securityLogger = (eventType) => {
    return (req, res, next) => {
        loggers.audit.warn('Security Event', {
            type: eventType,
            ip: req.ip,
            url: req.originalUrl,
            method: req.method,
            userAgent: req.get('user-agent'),
            userId: req.session?.userId,
            requestId: req.id
        });
        next();
    };
};

// Database operation logger
const databaseLogger = (operation, collection) => {
    return (duration, result) => {
        require('../lib/logger').logDatabase(operation, collection, duration, {
            resultCount: result?.length || 0,
            success: true
        });
    };
};

// Custom morgan token for request ID
const morganTokens = {
    id: (req) => req.id,
    responseTime: (req, res) => {
        const responseTime = Date.now() - req.startTime;
        return `${responseTime}ms`;
    },
    userId: (req) => req.session?.userId || '-',
    sessionId: (req) => req.session?.id || '-'
};

// Create morgan format
const morganFormat = ':id :remote-addr :userId :method :url :status :responseTime :user-agent';

module.exports = {
    requestLogger,
    errorLogger,
    auditLogger,
    performanceMonitor,
    securityLogger,
    databaseLogger,
    morganTokens,
    morganFormat
};