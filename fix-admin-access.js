/**
 * Temporary fix to grant admin access
 * Run this while the server is stopped
 */

const fs = require('fs');
const path = require('path');

console.log('=== Fixing Admin Access ===\n');

// Create a temporary server file with admin bypass
const tempServerFix = `
// Temporary fix: Comment out requireAdmin on line ~2540
// Find this line:
// app.get('/admin/settings', requireAdmin, (req, res) => {

// Change it to:
// app.get('/admin/settings', (req, res) => {

// This will temporarily allow access to admin settings
`;

console.log('To fix admin access temporarily:\n');
console.log('1. Stop the server (Ctrl+C)');
console.log('2. Edit server.js');
console.log('3. Find line ~2540 that says:');
console.log('   app.get(\'/admin/settings\', requireAdmin, (req, res) => {');
console.log('4. Change it to:');
console.log('   app.get(\'/admin/settings\', (req, res) => {');
console.log('5. Save and restart the server\n');

console.log('OR for a permanent fix, we need to ensure your session has admin role.\n');

// Create a session fix
console.log('Creating session inspector...');

const sessionInspector = `
// Add this temporarily to server.js after line 134 to debug sessions
app.get('/api/session-info', (req, res) => {
    res.json({
        authenticated: req.session.authenticated,
        username: req.session.username,
        role: req.session.role,
        isAdmin: req.session.isAdmin,
        sessionID: req.sessionID
    });
});
`;

fs.writeFileSync('session-inspector.txt', sessionInspector);
console.log('Created session-inspector.txt\n');

console.log('To check your current session:');
console.log('1. Add the code from session-inspector.txt to server.js');
console.log('2. Restart the server');
console.log('3. Visit: http://localhost:3002/api/session-info');
console.log('4. This will show your current session status\n');

console.log('Quick workaround:');
console.log('After logging in, visit: http://localhost:3002/api/user/current');
console.log('This will show if you have admin role.');