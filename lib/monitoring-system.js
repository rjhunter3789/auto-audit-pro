/*
 * Application Monitoring System
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Tracks application health, performance metrics, and system resources
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { logger, loggers } = require('./logger');

class MonitoringSystem {
    constructor() {
        this.metrics = {
            requests: {
                total: 0,
                success: 0,
                errors: 0,
                byStatus: {},
                byEndpoint: {},
                avgResponseTime: 0,
                responseTimes: []
            },
            audits: {
                total: 0,
                completed: 0,
                failed: 0,
                avgDuration: 0,
                byType: {
                    quick: 0,
                    comprehensive: 0,
                    custom: 0,
                    group: 0
                }
            },
            errors: {
                total: 0,
                byType: {},
                recent: []
            },
            system: {
                uptime: 0,
                memory: {},
                cpu: {},
                startTime: Date.now()
            },
            performance: {
                slowRequests: [],
                slowAudits: []
            }
        };
        
        // Start periodic system monitoring
        this.startSystemMonitoring();
        
        // Start metrics cleanup
        this.startMetricsCleanup();
    }
    
    // Track HTTP request
    trackRequest(req, res, responseTime) {
        this.metrics.requests.total++;
        
        if (res.statusCode < 400) {
            this.metrics.requests.success++;
        } else {
            this.metrics.requests.errors++;
        }
        
        // Track by status code
        const statusGroup = `${Math.floor(res.statusCode / 100)}xx`;
        this.metrics.requests.byStatus[statusGroup] = (this.metrics.requests.byStatus[statusGroup] || 0) + 1;
        
        // Track by endpoint
        const endpoint = `${req.method} ${req.route?.path || req.path}`;
        if (!this.metrics.requests.byEndpoint[endpoint]) {
            this.metrics.requests.byEndpoint[endpoint] = {
                count: 0,
                avgTime: 0,
                times: []
            };
        }
        
        const endpointMetric = this.metrics.requests.byEndpoint[endpoint];
        endpointMetric.count++;
        endpointMetric.times.push(responseTime);
        
        // Keep only last 100 times for memory efficiency
        if (endpointMetric.times.length > 100) {
            endpointMetric.times.shift();
        }
        
        endpointMetric.avgTime = endpointMetric.times.reduce((a, b) => a + b, 0) / endpointMetric.times.length;
        
        // Track overall response times
        this.metrics.requests.responseTimes.push(responseTime);
        if (this.metrics.requests.responseTimes.length > 1000) {
            this.metrics.requests.responseTimes.shift();
        }
        
        this.metrics.requests.avgResponseTime = 
            this.metrics.requests.responseTimes.reduce((a, b) => a + b, 0) / 
            this.metrics.requests.responseTimes.length;
        
        // Track slow requests
        if (responseTime > 2000) {
            this.metrics.performance.slowRequests.push({
                timestamp: new Date(),
                endpoint,
                responseTime,
                url: req.originalUrl
            });
            
            // Keep only last 50 slow requests
            if (this.metrics.performance.slowRequests.length > 50) {
                this.metrics.performance.slowRequests.shift();
            }
        }
    }
    
    // Track audit operations
    trackAudit(type, success, duration, url) {
        this.metrics.audits.total++;
        
        if (success) {
            this.metrics.audits.completed++;
        } else {
            this.metrics.audits.failed++;
        }
        
        if (type) {
            this.metrics.audits.byType[type] = (this.metrics.audits.byType[type] || 0) + 1;
        }
        
        // Track audit duration
        if (duration) {
            const allDurations = this.metrics.audits.avgDuration * (this.metrics.audits.total - 1);
            this.metrics.audits.avgDuration = (allDurations + duration) / this.metrics.audits.total;
            
            // Track slow audits
            if (duration > 90000) { // > 90 seconds
                this.metrics.performance.slowAudits.push({
                    timestamp: new Date(),
                    type,
                    duration,
                    url
                });
                
                // Keep only last 20 slow audits
                if (this.metrics.performance.slowAudits.length > 20) {
                    this.metrics.performance.slowAudits.shift();
                }
            }
        }
    }
    
    // Track errors
    trackError(error, context = {}) {
        this.metrics.errors.total++;
        
        const errorType = error.name || 'UnknownError';
        this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;
        
        // Store recent errors
        this.metrics.errors.recent.push({
            timestamp: new Date(),
            type: errorType,
            message: error.message,
            stack: error.stack,
            context
        });
        
        // Keep only last 100 errors
        if (this.metrics.errors.recent.length > 100) {
            this.metrics.errors.recent.shift();
        }
    }
    
    // Get system metrics
    getSystemMetrics() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        
        return {
            uptime: process.uptime(),
            appUptime: (Date.now() - this.metrics.system.startTime) / 1000,
            memory: {
                total: totalMem,
                free: freeMem,
                used: usedMem,
                percentUsed: (usedMem / totalMem * 100).toFixed(2),
                process: process.memoryUsage()
            },
            cpu: {
                loadAvg: os.loadavg(),
                cores: os.cpus().length,
                usage: this.calculateCPUUsage()
            },
            platform: {
                type: os.type(),
                platform: os.platform(),
                release: os.release(),
                hostname: os.hostname()
            }
        };
    }
    
    // Calculate CPU usage
    calculateCPUUsage() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        
        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        
        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        const usage = 100 - ~~(100 * idle / total);
        
        return usage;
    }
    
    // Get health status
    getHealthStatus() {
        const systemMetrics = this.getSystemMetrics();
        const errorRate = this.metrics.requests.total > 0 
            ? (this.metrics.errors.total / this.metrics.requests.total * 100).toFixed(2)
            : 0;
        
        // Determine health status
        let status = 'healthy';
        const issues = [];
        
        if (errorRate > 5) {
            status = 'degraded';
            issues.push(`High error rate: ${errorRate}%`);
        }
        
        if (systemMetrics.memory.percentUsed > 90) {
            status = 'degraded';
            issues.push(`High memory usage: ${systemMetrics.memory.percentUsed}%`);
        }
        
        if (systemMetrics.cpu.usage > 80) {
            status = 'degraded';
            issues.push(`High CPU usage: ${systemMetrics.cpu.usage}%`);
        }
        
        if (this.metrics.requests.avgResponseTime > 2000) {
            status = 'degraded';
            issues.push(`Slow response times: ${this.metrics.requests.avgResponseTime.toFixed(0)}ms avg`);
        }
        
        return {
            status,
            issues,
            timestamp: new Date(),
            metrics: {
                errorRate: `${errorRate}%`,
                avgResponseTime: `${this.metrics.requests.avgResponseTime.toFixed(0)}ms`,
                memoryUsage: `${systemMetrics.memory.percentUsed}%`,
                cpuUsage: `${systemMetrics.cpu.usage}%`,
                uptime: `${(systemMetrics.appUptime / 3600).toFixed(2)} hours`
            }
        };
    }
    
    // Get full metrics report
    getMetricsReport() {
        return {
            summary: this.getHealthStatus(),
            requests: this.metrics.requests,
            audits: this.metrics.audits,
            errors: {
                total: this.metrics.errors.total,
                byType: this.metrics.errors.byType,
                recent: this.metrics.errors.recent.slice(-10) // Last 10 errors
            },
            system: this.getSystemMetrics(),
            performance: this.metrics.performance
        };
    }
    
    // Start system monitoring
    startSystemMonitoring() {
        // Update system metrics every minute
        this.systemMonitorInterval = setInterval(() => {
            this.metrics.system = {
                ...this.metrics.system,
                ...this.getSystemMetrics()
            };
            
            // Log if system is degraded
            const health = this.getHealthStatus();
            if (health.status !== 'healthy') {
                loggers.performance.warn('System health degraded', health);
            }
        }, 60000); // Every minute
    }
    
    // Start metrics cleanup
    startMetricsCleanup() {
        // Clean up old metrics every hour
        this.cleanupInterval = setInterval(() => {
            // Reset endpoint metrics if too many
            if (Object.keys(this.metrics.requests.byEndpoint).length > 100) {
                const sorted = Object.entries(this.metrics.requests.byEndpoint)
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 50);
                
                this.metrics.requests.byEndpoint = Object.fromEntries(sorted);
            }
            
            // Clean up old slow requests
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            this.metrics.performance.slowRequests = this.metrics.performance.slowRequests
                .filter(req => new Date(req.timestamp).getTime() > oneDayAgo);
            
            this.metrics.performance.slowAudits = this.metrics.performance.slowAudits
                .filter(audit => new Date(audit.timestamp).getTime() > oneDayAgo);
            
            logger.info('Metrics cleanup completed');
        }, 3600000); // Every hour
    }
    
    // Stop monitoring
    stop() {
        if (this.systemMonitorInterval) {
            clearInterval(this.systemMonitorInterval);
        }
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

// Create singleton instance
let monitoringInstance = null;

module.exports = {
    getMonitoring: () => {
        if (!monitoringInstance) {
            monitoringInstance = new MonitoringSystem();
        }
        return monitoringInstance;
    },
    MonitoringSystem
};