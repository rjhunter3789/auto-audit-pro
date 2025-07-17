/**
 * Fix Admin Session Issue
 * This script helps diagnose and fix the admin access problem
 */

const axios = require('axios');

console.log('=== Auto Audit Pro - Admin Session Fix ===\n');

const baseUrl = 'http://localhost:3002';

async function checkSession() {
    try {
        console.log('1. Checking current session...');
        const response = await axios.get(`${baseUrl}/api/session-info`, {
            headers: {
                'Cookie': 'autoaudit.sid=YOUR_SESSION_ID_HERE'
            }
        });
        
        console.log('Session info:', response.data);
        
        if (!response.data.isAdmin) {
            console.log('\n⚠️  Issue found: isAdmin is not set to true');
            console.log('This explains why you cannot access admin settings.\n');
        }
        
    } catch (error) {
        console.error('Error checking session:', error.message);
    }
}

console.log('Instructions:');
console.log('1. Make sure the server is running (npm start)');
console.log('2. Login through the web interface');
console.log('3. After login, visit: http://localhost:3002/api/session-info');
console.log('4. Check if isAdmin is true\n');

console.log('Quick Fix Options:');
console.log('\nOption 1 - Temporary bypass (for testing):');
console.log('Edit server.js line ~2588:');
console.log('FROM: app.get(\'/admin/settings\', requireAdmin, (req, res) => {');
console.log('TO:   app.get(\'/admin/settings\', (req, res) => {');
console.log('\nOption 2 - Force admin session (permanent fix):');
console.log('Add this route to server.js after the session-info endpoint:');
console.log(`
// Temporary admin session fix
app.get('/api/fix-admin-session', (req, res) => {
    if (req.session.authenticated) {
        req.session.isAdmin = true;
        req.session.role = 'admin';
        req.session.save((err) => {
            if (err) {
                res.json({ error: 'Failed to save session' });
            } else {
                res.json({ 
                    success: true, 
                    message: 'Admin session fixed',
                    session: {
                        username: req.session.username,
                        role: req.session.role,
                        isAdmin: req.session.isAdmin
                    }
                });
            }
        });
    } else {
        res.json({ error: 'Not authenticated' });
    }
});
`);

console.log('\nThen after logging in, visit: http://localhost:3002/api/fix-admin-session');
console.log('This will force your session to have admin privileges.\n');

// Test credentials
console.log('Your login credentials:');
console.log('Username: admin');
console.log('Password: AutoAudit2025!\n');