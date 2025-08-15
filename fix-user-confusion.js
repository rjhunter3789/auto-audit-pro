/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Fix user confusion between admin and dealer
 * This removes the multi-user system temporarily to fix access issues
 */

const fs = require('fs');
const path = require('path');

// Backup current users.json
const usersPath = path.join(__dirname, 'data', 'users.json');
const backupPath = path.join(__dirname, 'data', 'users.json.backup-' + Date.now());

if (fs.existsSync(usersPath)) {
    fs.copyFileSync(usersPath, backupPath);
    console.log(`✓ Backed up users.json to ${backupPath}`);
}

// Option 1: Remove users.json entirely (system will use env admin only)
// fs.unlinkSync(usersPath);
// console.log('✓ Removed users.json - system will now use environment admin only');

// Option 2: Create a minimal users.json without conflicting admin
const minimalUsers = [];  // Empty array - no users in JSON, only env admin

fs.writeFileSync(usersPath, JSON.stringify(minimalUsers, null, 2));
console.log('✓ Created empty users.json - only environment admin will work');

// Now update the login route to prioritize environment admin
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Find the login route
const loginRouteStart = serverContent.indexOf("app.post('/api/login'");
const loginRouteEnd = serverContent.indexOf('});', loginRouteStart) + 3;
const oldLoginRoute = serverContent.substring(loginRouteStart, loginRouteEnd);

// Create new login route that prioritizes env admin
const newLoginRoute = `app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log('[Login Debug] Attempting login:', { username, passwordLength: password ? password.length : 0 });
    
    // PRIORITY 1: Check environment admin FIRST
    const { ADMIN_USERNAME, ADMIN_PASSWORD } = require('./middleware/auth');
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        console.log('[Login] Authenticated as environment admin');
        req.session.authenticated = true;
        req.session.username = username;
        req.session.role = 'admin';
        req.session.isAdmin = true;
        req.session.dealership = 'Admin';
        
        req.session.save((err) => {
            if (err) {
                console.error('[Login] Session save error:', err);
                return res.status(500).json({ error: 'Session error' });
            }
            console.log('[Login] Admin session saved successfully');
            res.redirect('/');
        });
        return;
    }
    
    // PRIORITY 2: Check users.json if exists (for future dealer accounts)
    const usersFile = path.join(__dirname, 'data', 'users.json');
    if (fs.existsSync(usersFile)) {
        try {
            const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
            const user = users.find(u => 
                (u.username === username || u.email === username) && 
                u.password === password
            );
            
            if (user) {
                console.log('[Login] Authenticated from users.json:', user.username);
                req.session.authenticated = true;
                req.session.username = user.username;
                req.session.role = user.role || 'dealer';
                req.session.isAdmin = user.isAdmin || false;
                req.session.dealership = user.dealership || user.username;
                
                req.session.save((err) => {
                    if (err) {
                        console.error('[Login] Session save error:', err);
                        return res.status(500).json({ error: 'Session error' });
                    }
                    console.log('[Login] User session saved successfully');
                    res.redirect('/');
                });
                return;
            }
        } catch (error) {
            console.error('[Login] Error reading users.json:', error);
        }
    }
    
    // No valid login found
    console.log('[Login] Authentication failed for:', username);
    res.status(401).send(\`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Login Failed</title>
            <meta http-equiv="refresh" content="2;url=/login">
        </head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">Login Failed</h2>
            <p>Invalid username or password</p>
            <p>Redirecting to login page...</p>
        </body>
        </html>
    \`);
});`;

// Replace the login route
serverContent = serverContent.substring(0, loginRouteStart) + newLoginRoute + serverContent.substring(loginRouteEnd);

// Write back to server.js
fs.writeFileSync(serverPath, serverContent);

console.log('\n✓ Updated login route to prioritize environment admin');
console.log('\n✨ FIXES APPLIED:');
console.log('1. Cleared users.json - no more user conflicts');
console.log('2. Environment admin now has priority in login');
console.log('3. Admin will always get proper isAdmin flag');
console.log('\n📝 Login credentials:');
console.log('   Username: admin');
console.log('   Password: AutoAudit2025!');
console.log('\n⚠️  Restart the server for changes to take effect!');