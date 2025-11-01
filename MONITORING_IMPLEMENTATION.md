# Monitoring & Logging Implementation Guide

## 🚀 Quick Start

Add monitoring and logging to your Auto Audit Pro server with these simple steps:

### 1. Add to server.js

```javascript
// Add these imports at the top
const { logger, loggers } = require('./lib/logger');
const { requestLogger, errorLogger, auditLogger, performanceMonitor } = require('./middleware/logging');
const { getMonitoring } = require('./lib/monitoring-system');

// Initialize monitoring
const monitoring = getMonitoring();

// Add after your session middleware but before routes
app.use(requestLogger);

// Add performance monitoring to specific routes
app.post('/audit', performanceMonitor('audit'), auditLogger('website-audit'), async (req, res, next) => {
    // Track audit start
    const auditStart = Date.now();
    const auditType = req.body.auditType || 'comprehensive';
    
    try {
        // ... existing audit code ...
        
        // Track successful audit
        monitoring.trackAudit(auditType, true, Date.now() - auditStart, req.body.url);
    } catch (error) {
        // Track failed audit
        monitoring.trackAudit(auditType, false, Date.now() - auditStart, req.body.url);
        throw error;
    }
});

// Add monitoring endpoints
app.get('/api/monitoring/metrics', (req, res) => {
    res.json(monitoring.getMetricsReport());
});

app.get('/api/monitoring/health', (req, res) => {
    const health = monitoring.getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
});

app.get('/monitoring', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'system-monitoring.html'));
});

// Add error logging middleware at the VERY END (after all routes)
app.use(errorLogger);

// Update request tracking in middleware
app.use((req, res, next) => {
    res.on('finish', () => {
        monitoring.trackRequest(req, res, Date.now() - req.startTime);
    });
    next();
});

// Log server startup
logger.info('Auto Audit Pro server starting', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
});

// Replace console.log with logger
console.log(`Server running on port ${PORT}`);
// becomes:
logger.info(`Server running on port ${PORT}`);
```

### 2. Add Error Tracking

Replace error handling throughout your code:

```javascript
// Before:
catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
}

// After:
catch (error) {
    monitoring.trackError(error, { 
        endpoint: req.path,
        userId: req.session?.userId 
    });
    next(error); // Let error middleware handle it
}
```

### 3. Add Audit Logging

For sensitive operations:

```javascript
// Login endpoint
app.post('/login', auditLogger('user-login'), async (req, res) => {
    // ... login logic ...
});

// Admin operations
app.post('/admin/settings', auditLogger('admin-settings-update'), async (req, res) => {
    // ... settings update logic ...
});

// User management
app.post('/api/users', auditLogger('user-created'), async (req, res) => {
    // ... user creation logic ...
});
```

## 📊 What Gets Logged

### 1. **Request Logs** (`logs/combined.log`)
- HTTP method, URL, status code
- Response time
- User IP and agent
- Request ID for tracking

### 2. **Error Logs** (`logs/error.log`)
- Full error stack traces
- Request context
- User information
- Timestamp and request ID

### 3. **Audit Logs** (`logs/audit.log`)
- User actions (login, logout, data changes)
- Admin operations
- Security events
- JSON format for analysis

### 4. **Performance Metrics** (in-memory)
- Request counts and response times
- Endpoint-specific metrics
- System resource usage
- Slow request tracking

## 🎯 Monitoring Dashboard

Access the real-time monitoring dashboard at:
```
http://localhost:3002/monitoring
```

Features:
- System health status
- Request/response metrics
- Error tracking
- Performance monitoring
- Resource usage (CPU/Memory)
- Endpoint statistics

## 🛠️ Advanced Usage

### Custom Logging

```javascript
const { logger, loggers, PerformanceTracker } = require('./lib/logger');

// Different log levels
logger.error('Critical error', { code: 'DB_CONNECTION_FAILED' });
logger.warn('High memory usage detected');
logger.info('User registered', { userId: user.id });
logger.debug('Cache hit for key:', key);

// Performance tracking
const tracker = new PerformanceTracker('complex-operation');
// ... do work ...
tracker.checkpoint('database-query');
// ... more work ...
tracker.checkpoint('processing');
// ... finish ...
tracker.end({ itemsProcessed: 100 });
```

### Log Filtering

Set log level via environment variable:
```bash
LOG_LEVEL=debug npm start  # Show all logs
LOG_LEVEL=error npm start  # Only errors
LOG_LEVEL=info npm start   # Default
```

### Log Analysis

View logs with helpful commands:
```bash
# View recent errors
tail -f logs/error.log

# Search for specific user
grep "userId: 123" logs/audit.log

# View today's logs
grep "$(date +%Y-%m-%d)" logs/combined.log

# Count errors by type
grep "Error occurred" logs/error.log | awk '{print $6}' | sort | uniq -c
```

## 📈 Monitoring Endpoints

### Health Check
```bash
curl http://localhost:3002/api/monitoring/health
```

Response:
```json
{
  "status": "healthy",
  "issues": [],
  "timestamp": "2025-01-01T12:00:00.000Z",
  "metrics": {
    "errorRate": "0.5%",
    "avgResponseTime": "245ms",
    "memoryUsage": "45%",
    "cpuUsage": "23%",
    "uptime": "24.5 hours"
  }
}
```

### Metrics API
```bash
curl http://localhost:3002/api/monitoring/metrics
```

Returns comprehensive metrics including:
- Request statistics
- Audit performance
- Error details
- System resources
- Performance data

## 🚨 Alerting Integration

The monitoring system can be extended with alerting:

```javascript
// Example: Alert on high error rate
setInterval(() => {
    const health = monitoring.getHealthStatus();
    if (health.status !== 'healthy') {
        // Send alert via email, Slack, etc.
        sendAlert('System degraded', health.issues);
    }
}, 60000); // Check every minute
```

## 📝 Best Practices

1. **Use Request IDs**: Every log entry includes a request ID for tracing
2. **Log Levels**: Use appropriate levels (error, warn, info, debug)
3. **Structured Logging**: Pass objects for better searchability
4. **No Sensitive Data**: Never log passwords, tokens, or credit cards
5. **Monitor Disk Space**: Logs rotate but can still fill disk

## 🔧 Configuration

### Log Rotation
Logs automatically rotate when they reach 10MB:
- `error.log` → keeps 5 files
- `combined.log` → keeps 10 files  
- `audit.log` → keeps 30 files

### Performance Thresholds
- Slow request: > 2000ms
- Slow audit: > 90 seconds
- High memory: > 90%
- High CPU: > 80%

## 🎉 Benefits

1. **Visibility**: See what's happening in production
2. **Debugging**: Trace issues with request IDs
3. **Performance**: Identify slow endpoints
4. **Security**: Track user actions and access
5. **Compliance**: Audit trail for regulations
6. **Proactive**: Fix issues before users complain

---

*Your Auto Audit Pro application now has professional-grade monitoring and logging!*