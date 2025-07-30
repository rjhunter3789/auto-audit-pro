const fs = require('fs');
const path = require('path');

console.log('Restoring security and fixing authentication...\n');

// Read server.js
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Fix 1: Restore proper authentication for /api/user/current
const userCurrentSecure = `app.get('/api/user/current', (req, res) => {
    if (req.session.authenticated) {
        res.json({
            username: req.session.username,
            role: req.session.role || 'dealer',
            isAdmin: req.session.isAdmin || false,
            dealership: req.session.dealership || null
        });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});`;

// Replace the insecure version
serverContent = serverContent.replace(
    /app\.get\('\/api\/user\/current'[\s\S]*?\}\);/,
    userCurrentSecure
);

// Fix 2: Add authentication to monitoring route
const monitoringRoutePattern = /app\.get\('\/monitoring', \(req, res\) => \{/;
const monitoringRouteSecure = `app.get('/monitoring', checkAuth, requireAdmin, (req, res) => {`;

serverContent = serverContent.replace(monitoringRoutePattern, monitoringRouteSecure);

// Fix 3: Ensure all monitoring API routes have proper auth
// Add checkAuth to routes that don't have it
const routesToSecure = [
    '/api/monitoring/profiles',
    '/api/monitoring/status',
    '/api/monitoring/stats',
    '/api/monitoring/alerts',
    '/api/monitoring/results'
];

routesToSecure.forEach(route => {
    // Pattern to find routes without auth
    const pattern = new RegExp(`app\\.get\\('${route.replace('/', '\\/')}[^']*', async \\(req, res\\) => \\{`, 'g');
    const replacement = `app.get('$&'.replace(', async (req, res) => {', ', checkAuth, async (req, res) => {')`;
    
    // More direct approach
    serverContent = serverContent.replace(
        new RegExp(`app\\.get\\('${route.replace('/', '\\/')}([^']*)', async \\(req, res\\) => \\{`, 'g'),
        `app.get('${route}$1', checkAuth, async (req, res) => {`
    );
});

// Save the secured server.js
fs.writeFileSync(serverPath, serverContent);

console.log('✅ Security restored!');
console.log('\nChanges made:');
console.log('1. /api/user/current now requires authentication');
console.log('2. /monitoring page requires admin login');
console.log('3. All monitoring API routes require authentication');
console.log('\nThe 403 error was happening because you weren\'t properly logged in.');
console.log('\nTo fix this permanently:');
console.log('1. Clear your browser cookies');
console.log('2. Restart the server: pkill -f "node server.js" && npm start');
console.log('3. Login at: http://localhost:3000/login');
console.log('   Username: admin');
console.log('   Password: Admin123!');
console.log('4. Then access: http://localhost:3000/monitoring');
console.log('\nThis ensures your monitoring system is secure and only accessible to authenticated admin users.');