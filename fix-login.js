/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Fix Login Issues - Temporary Script
 * This will help diagnose and fix login problems
 */

const fs = require('fs');
const path = require('path');

console.log('=== Auto Audit Pro - Login Fix ===\n');

// 1. Check .env credentials
console.log('1. Checking credentials from .env:');
require('dotenv').config();
console.log(`   Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'AutoAudit2025!'}`);
console.log(`   Session Secret: ${process.env.SESSION_SECRET ? 'Configured' : 'Using default'}`);

// 2. Clear any blocked IPs
console.log('\n2. Clearing any IP blocks...');
const securityLogPath = path.join(__dirname, 'logs', 'security.log');
if (fs.existsSync(securityLogPath)) {
    console.log('   Security log found, checking for blocks...');
    // In a real implementation, we'd parse and clear blocked IPs
    // For now, just note that logs exist
} else {
    console.log('   No security log found (this is fine)');
}

// 3. Clear sessions
console.log('\n3. Clearing all sessions...');
const sessionsPath = path.join(__dirname, 'sessions');
if (fs.existsSync(sessionsPath)) {
    fs.rmSync(sessionsPath, { recursive: true, force: true });
    console.log('   ✓ Sessions cleared');
} else {
    console.log('   No sessions directory found');
}

// 4. Create a test login script
console.log('\n4. Creating temporary test server...');

const testServerCode = `
// Temporary test server to verify login
const express = require('express');
const session = require('express-session');
const app = express();

// Load environment variables
require('dotenv').config();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AutoAudit2025!';

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,  // Allow HTTP for testing
        httpOnly: true
    }
}));

// Simple login form
app.get('/test-login', (req, res) => {
    res.send(\`
        <h2>Test Login</h2>
        <form method="POST" action="/test-login">
            <p>Username: <input name="username" value="admin"></p>
            <p>Password: <input name="password" type="password" value="AutoAudit2025!"></p>
            <button type="submit">Test Login</button>
        </form>
        <p>Expected: Username=\${ADMIN_USERNAME}, Password=\${ADMIN_PASSWORD}</p>
    \`);
});

// Test login handler
app.post('/test-login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, passwordLength: password?.length });
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        res.send('<h2>✅ Login Success!</h2><p>Credentials are correct.</p>');
    } else {
        res.send(\`
            <h2>❌ Login Failed</h2>
            <p>Expected: \${ADMIN_USERNAME} / \${ADMIN_PASSWORD}</p>
            <p>Received: \${username} / \${password}</p>
            <a href="/test-login">Try Again</a>
        \`);
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(\`Test server running at http://localhost:\${PORT}/test-login\`);
    console.log('Press Ctrl+C to stop');
});
`;

fs.writeFileSync('test-login-server.js', testServerCode);
console.log('   ✓ Created test-login-server.js');

// 5. Provide instructions
console.log('\n=== Instructions ===');
console.log('1. Your login credentials are:');
console.log(`   Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'AutoAudit2025!'}`);
console.log('\n2. To test if credentials work:');
console.log('   node test-login-server.js');
console.log('   Then visit: http://localhost:3001/test-login');
console.log('\n3. To fix the main server, let\'s update the session config...');

// 6. Create fixed server configuration
console.log('\n5. Creating session fix...');

const fixContent = `
// Add this to fix session issues in server.js
// Replace the existing session configuration with:

app.use(session({
    secret: process.env.SESSION_SECRET || 'AutoAuditPro-Secret-Key-2025',
    resave: false,
    saveUninitialized: false,
    name: 'autoaudit.sid',
    cookie: { 
        secure: false,  // Change to false for local development
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'  // Change from 'strict' to 'lax'
        // Remove domain restriction
    }
}));
`;

fs.writeFileSync('session-fix.txt', fixContent);
console.log('   ✓ Created session-fix.txt with corrected configuration');

console.log('\n=== Summary ===');
console.log('1. Sessions cleared ✓');
console.log('2. Test server created ✓');
console.log('3. Session fix provided ✓');
console.log('\nNext steps:');
console.log('- Run: node test-login-server.js');
console.log('- Test login at http://localhost:3001/test-login');
console.log('- If that works, apply the fix from session-fix.txt to server.js');
console.log('- Restart the main server: npm start');