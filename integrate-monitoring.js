#!/usr/bin/env node

/*
 * Automatic Integration Helper for Monitoring & Rate Limiting
 * This script helps integrate the new features into server.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Auto Audit Pro - Monitoring Integration Helper\n');

// Check if server.js exists
const serverPath = path.join(__dirname, 'server.js');
if (!fs.existsSync(serverPath)) {
    console.error('❌ server.js not found!');
    process.exit(1);
}

// Read server.js
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Check if already integrated
if (serverContent.includes('middleware/rate-limiter') || serverContent.includes('lib/logger')) {
    console.log('✅ Monitoring/Rate Limiting already appears to be integrated!');
    console.log('   If you need to re-integrate, please do so manually.');
    process.exit(0);
}

console.log('📝 Adding monitoring and rate limiting to server.js...\n');

// 1. Add imports after existing requires
const importAddition = `
// Monitoring and Logging
const { logger, loggers } = require('./lib/logger');
const { requestLogger, errorLogger, auditLogger, performanceMonitor } = require('./middleware/logging');
const { getMonitoring } = require('./lib/monitoring-system');
const rateLimiter = require('./middleware/rate-limiter');

// Initialize monitoring system
const monitoring = getMonitoring();
`;

// Find a good place to insert (after other requires)
const requireRegex = /const\s+\w+\s*=\s*require\([^)]+\);[\s\S]*?(?=\n\n|\nconst\s+app\s*=)/;
const match = serverContent.match(requireRegex);
if (match) {
    const insertPos = match.index + match[0].length;
    serverContent = serverContent.slice(0, insertPos) + importAddition + serverContent.slice(insertPos);
    console.log('✅ Added imports and monitoring initialization');
}

// 2. Add request logger after session middleware
const requestLoggerAddition = `
// Request logging and monitoring
app.use(requestLogger);

// Apply rate limiting
rateLimiter.applyToApp(app);

// Track requests in monitoring system
app.use((req, res, next) => {
    res.on('finish', () => {
        monitoring.trackRequest(req, res, Date.now() - req.startTime);
    });
    next();
});
`;

// Find position after session middleware
const sessionRegex = /app\.use\(session\([^)]+\)\);/;
const sessionMatch = serverContent.match(sessionRegex);
if (sessionMatch) {
    const insertPos = sessionMatch.index + sessionMatch[0].length;
    serverContent = serverContent.slice(0, insertPos) + requestLoggerAddition + serverContent.slice(insertPos);
    console.log('✅ Added request logging and rate limiting middleware');
}

// 3. Add monitoring endpoints before catch-all routes
const monitoringEndpoints = `
// Monitoring endpoints
app.get('/api/monitoring/metrics', (req, res) => {
    res.json(monitoring.getMetricsReport());
});

app.get('/api/monitoring/health', (req, res) => {
    const health = monitoring.getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
});

app.get('/monitoring', (req, res) => {
    if (!req.session || !req.session.isAdmin) {
        return res.status(403).send('Access denied. Admin only.');
    }
    res.sendFile(path.join(__dirname, 'views', 'system-monitoring.html'));
});
`;

// Find a good place before the error handler or near the end
const errorHandlerRegex = /app\.use\(\(err,\s*req,\s*res,\s*next\)/;
const errorMatch = serverContent.match(errorHandlerRegex);
if (errorMatch) {
    serverContent = serverContent.slice(0, errorMatch.index) + monitoringEndpoints + '\n' + serverContent.slice(errorMatch.index);
    console.log('✅ Added monitoring endpoints');
}

// 4. Add error logger at the very end
if (!serverContent.includes('app.use(errorLogger)')) {
    const lastAppUse = serverContent.lastIndexOf('app.use(');
    if (lastAppUse !== -1) {
        const endOfLastAppUse = serverContent.indexOf('\n', lastAppUse);
        serverContent = serverContent.slice(0, endOfLastAppUse) + '\n\n// Error logging (must be last)\napp.use(errorLogger);\n' + serverContent.slice(endOfLastAppUse);
        console.log('✅ Added error logging middleware');
    }
}

// 5. Replace console.log with logger in a few key places
serverContent = serverContent.replace(
    /console\.log\(`Server running on port \$\{PORT\}`\)/,
    `logger.info('Server running on port ' + PORT)`
);

serverContent = serverContent.replace(
    /console\.log\('\[Dotenv Debug\]'/g,
    `logger.debug('[Dotenv Debug]'`
);

console.log('✅ Updated console.log statements to use logger');

// 6. Add audit logging to sensitive endpoints
// Find login endpoint
const loginRegex = /app\.post\(['"]\/login['"]/;
if (loginRegex.test(serverContent)) {
    serverContent = serverContent.replace(
        loginRegex,
        `app.post('/login', auditLogger('user-login')`
    );
    console.log('✅ Added audit logging to login endpoint');
}

// Save the modified server.js
const backupPath = path.join(__dirname, 'server.js.backup-' + Date.now());
fs.copyFileSync(serverPath, backupPath);
console.log(`\n📦 Created backup: ${backupPath}`);

fs.writeFileSync(serverPath, serverContent);
console.log('✅ Updated server.js successfully!\n');

// Final instructions
console.log('📋 Final Steps:');
console.log('1. Review the changes in server.js');
console.log('2. Test the server: npm start');
console.log('3. Visit http://localhost:3002/monitoring (as admin)');
console.log('4. Run rate limit tests: node test-rate-limits.js');
console.log('\nIf there are any issues, restore from backup:');
console.log(`   cp ${backupPath} server.js`);

console.log('\n✨ Integration complete! Remember to test before deploying.');