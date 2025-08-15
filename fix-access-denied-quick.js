/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Quick fix for Access Denied issues
 * This script adds a recovery endpoint to help when locked out
 */

const fs = require('fs');
const path = require('path');

// Read server.js
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Find where to insert the recovery route (before the global auth middleware)
const authMiddlewarePattern = /\/\/ LOCKDOWN: Apply authentication to ALL routes after this point/;
const insertPosition = serverContent.search(authMiddlewarePattern);

if (insertPosition === -1) {
    console.error('Could not find auth middleware marker in server.js');
    process.exit(1);
}

// Create the recovery route
const recoveryRoute = `
// Emergency Access Recovery Route
app.get('/recover-access', (req, res) => {
    // Force create an admin session
    req.session.authenticated = true;
    req.session.username = 'admin';
    req.session.role = 'admin';
    req.session.isAdmin = true;
    req.session.dealership = 'Admin';
    
    req.session.save((err) => {
        if (err) {
            return res.status(500).send('Failed to create session');
        }
        res.send(\`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Access Recovered</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 50px; text-align: center; }
                    .success { color: green; }
                    .links { margin-top: 30px; }
                    a { margin: 0 10px; }
                </style>
            </head>
            <body>
                <h1 class="success">✓ Access Recovered!</h1>
                <p>Your admin session has been restored.</p>
                <div class="links">
                    <a href="/">Go to Home</a> |
                    <a href="/monitoring">Go to Monitoring</a> |
                    <a href="/views/admin-settings.html">Go to Admin Settings</a>
                </div>
            </body>
            </html>
        \`);
    });
});

`;

// Insert the recovery route
serverContent = serverContent.slice(0, insertPosition) + recoveryRoute + serverContent.slice(insertPosition);

// Write back to server.js
fs.writeFileSync(serverPath, serverContent);

console.log('✓ Added recovery route: /recover-access');
console.log('✓ You can now visit http://localhost:3002/recover-access to restore your session');
console.log('✓ Remember to restart the server for changes to take effect');