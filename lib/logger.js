/*
 * Logger Configuration for Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Centralized logging system using Winston
 * Provides structured logging, error tracking, and performance monitoring
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            // Handle error objects specially
            if (meta.stack) {
                log += `\n${meta.stack}`;
            } else if (meta.error && meta.error.stack) {
                log += `\n${meta.error.stack}`;
            } else {
                log += ` ${JSON.stringify(meta)}`;
            }
        }
        
        return log;
    })
);

// Console format (colorized and simplified)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
    winston.format.printf(({ level, message, timestamp }) => {
        return `[${timestamp}] ${level}: ${message}`;
    })
);

// Create main logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    defaultMeta: { service: 'auto-audit-pro' },
    transports: [
        // Error logs
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            tailable: true
        }),
        
        // Combined logs
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        }),
        
        // Audit logs (for security and compliance)
        new winston.transports.File({
            filename: path.join(logsDir, 'audit.log'),
            level: 'info',
            maxsize: 10485760, // 10MB
            maxFiles: 30, // Keep 30 days of audit logs
            tailable: true,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5
        })
    ]
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            customFormat
        )
    }));
}

// Create specialized loggers
const loggers = {
    // Main application logger
    app: logger,
    
    // Audit logger for security events
    audit: logger.child({ type: 'audit' }),
    
    // Performance logger
    performance: logger.child({ type: 'performance' }),
    
    // API logger
    api: logger.child({ type: 'api' }),
    
    // Error logger
    error: logger.child({ type: 'error' }),
    
    // Database logger
    db: logger.child({ type: 'database' })
};

// Helper functions
const logHelpers = {
    // Log API requests
    logRequest: (req, meta = {}) => {
        loggers.api.info('API Request', {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            ...meta
        });
    },
    
    // Log API responses
    logResponse: (req, res, responseTime) => {
        const level = res.statusCode >= 400 ? 'warn' : 'info';
        loggers.api[level]('API Response', {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip || req.connection.remoteAddress
        });
    },
    
    // Log audit events (login, data changes, etc)
    logAudit: (action, userId, details = {}) => {
        loggers.audit.info('Audit Event', {
            action,
            userId,
            timestamp: new Date().toISOString(),
            ...details
        });
    },
    
    // Log performance metrics
    logPerformance: (operation, duration, meta = {}) => {
        loggers.performance.info('Performance Metric', {
            operation,
            duration: `${duration}ms`,
            ...meta
        });
    },
    
    // Log errors with context
    logError: (error, context = {}) => {
        loggers.error.error('Error occurred', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            ...context
        });
    },
    
    // Log database operations
    logDatabase: (operation, collection, duration, meta = {}) => {
        loggers.db.debug('Database Operation', {
            operation,
            collection,
            duration: `${duration}ms`,
            ...meta
        });
    }
};

// Performance tracking class
class PerformanceTracker {
    constructor(operation) {
        this.operation = operation;
        this.startTime = Date.now();
        this.checkpoints = [];
    }
    
    checkpoint(name) {
        const elapsed = Date.now() - this.startTime;
        this.checkpoints.push({ name, elapsed });
        loggers.performance.debug(`Checkpoint: ${name}`, {
            operation: this.operation,
            elapsed: `${elapsed}ms`
        });
    }
    
    end(meta = {}) {
        const duration = Date.now() - this.startTime;
        logHelpers.logPerformance(this.operation, duration, {
            checkpoints: this.checkpoints,
            ...meta
        });
        return duration;
    }
}

// Request ID middleware generator
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export logger and utilities
module.exports = {
    logger,
    loggers,
    ...logHelpers,
    PerformanceTracker,
    generateRequestId,
    
    // Log levels for reference
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6
    }
};