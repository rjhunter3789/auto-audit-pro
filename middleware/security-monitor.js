/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

// Security monitoring and intrusion detection
const fs = require('fs');
const path = require('path');

// Track failed login attempts
const failedAttempts = new Map();
const blockedIPs = new Set();

// Configuration
const MAX_ATTEMPTS = 3; // Changed from 5 to 3 for stricter security
const BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes
const SUSPICIOUS_PATHS = [
    '/wp-admin', '/wp-login', '.php', '/phpmyadmin',
    '/config', '/.env', '/backup', '.sql',
    '/.git', '/eval', '/shell'
];

// Log security events
function logSecurityEvent(event) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ${event.type} - IP: ${event.ip} - Path: ${event.path} - Details: ${event.details}\n`;
    
    // Ensure logs directory exists
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Write to security log
    const logPath = path.join(logsDir, 'security.log');
    fs.appendFileSync(logPath, logEntry);
    
    // Also log to console with color
    if (event.type === 'INTRUSION_ATTEMPT' || event.type === 'BLOCKED') {
        console.error(`🚨 SECURITY ALERT: ${event.type} from ${event.ip} - ${event.details}`);
    }
}

// Check for suspicious activity
function checkSuspiciousActivity(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const requestPath = req.path.toLowerCase();
    
    // Check if IP is blocked
    if (blockedIPs.has(ip)) {
        logSecurityEvent({
            type: 'BLOCKED_ACCESS_ATTEMPT',
            ip: ip,
            path: requestPath,
            details: 'Blocked IP attempted access'
        });
        return res.status(403).send('Access Denied');
    }
    
    // Check for suspicious paths (common attack vectors)
    for (const suspicious of SUSPICIOUS_PATHS) {
        if (requestPath.includes(suspicious)) {
            logSecurityEvent({
                type: 'INTRUSION_ATTEMPT',
                ip: ip,
                path: requestPath,
                details: `Suspicious path accessed: ${suspicious}`
            });
            
            // Auto-block this IP
            blockedIPs.add(ip);
            setTimeout(() => blockedIPs.delete(ip), BLOCK_DURATION);
            
            return res.status(404).send('Not Found');
        }
    }
    
    // Check for SQL injection patterns (skip login endpoint to avoid false positives)
    if (requestPath !== '/api/login') {
        const sqlPatterns = /(\bselect\b|\bunion\b|\bdrop\b|\binsert\b|\bupdate\b|\bdelete\b|;|--|\/\*|\*\/)/i;
        const queryString = JSON.stringify(req.query) + JSON.stringify(req.body);
        
        if (sqlPatterns.test(queryString)) {
            logSecurityEvent({
                type: 'SQL_INJECTION_ATTEMPT',
                ip: ip,
                path: requestPath,
                details: `Potential SQL injection: ${queryString.substring(0, 100)}`
            });
            return res.status(400).send('Bad Request');
        }
    }
    
    next();
}

// Track failed login attempts
function trackFailedLogin(ip) {
    const attempts = failedAttempts.get(ip) || 0;
    failedAttempts.set(ip, attempts + 1);
    
    if (attempts + 1 >= MAX_ATTEMPTS) {
        blockedIPs.add(ip);
        failedAttempts.delete(ip);
        
        logSecurityEvent({
            type: 'IP_BLOCKED',
            ip: ip,
            path: '/login',
            details: `Blocked after ${MAX_ATTEMPTS} failed login attempts`
        });
        
        // Unblock after duration
        setTimeout(() => {
            blockedIPs.delete(ip);
            logSecurityEvent({
                type: 'IP_UNBLOCKED',
                ip: ip,
                path: '/login',
                details: 'Auto-unblocked after timeout'
            });
        }, BLOCK_DURATION);
    }
}

// Clear failed attempts on successful login
function clearFailedAttempts(ip) {
    failedAttempts.delete(ip);
}

// Get security stats
function getSecurityStats() {
    return {
        blockedIPs: Array.from(blockedIPs),
        failedAttempts: Object.fromEntries(failedAttempts),
        totalBlocked: blockedIPs.size
    };
}

module.exports = {
    checkSuspiciousActivity,
    trackFailedLogin,
    clearFailedAttempts,
    logSecurityEvent,
    getSecurityStats
};