/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

// This script will fix the authentication issues once and for all

const fs = require('fs');
const path = require('path');

console.log('Fixing authentication permanently...\n');

// Create a new middleware file that properly handles sessions
const betterAuth = `
// Better authentication middleware that actually works
function checkAuth(req, res, next) {
    console.log('[AUTH] Path:', req.path);
    
    // Public routes that don't need auth
    const publicRoutes = ['/login', '/api/login', '/logout', '/api/health'];
    if (publicRoutes.includes(req.path)) {
        return next();
    }
    
    // Check if user is logged in
    if (!req.session || !req.session.authenticated) {
        // For API routes, return 401
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        // For pages, redirect to login
        return res.redirect('/login');
    }
    
    // User is logged in - continue
    console.log('[AUTH] User authenticated:', req.session.username);
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session || !req.session.authenticated) {
        return res.status(403).send('Access Denied - Not logged in');
    }
    
    if (req.session.role !== 'admin' && !req.session.isAdmin) {
        return res.status(403).send('Access Denied - Admin only');
    }
    
    next();
}

module.exports = { checkAuth, requireAdmin };
`;

// Save the new auth middleware
fs.writeFileSync(
    path.join(__dirname, 'middleware', 'better-auth.js'),
    betterAuth
);

console.log('✅ Created better authentication middleware');

// Create a simple test to verify permissions
const testPermissions = `
// Test page to verify permissions are working
<!DOCTYPE html>
<html>
<head>
    <title>Permission Test</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <h1>Permission Test Page</h1>
        <div id="results" class="mt-4">
            <h3>Testing your permissions...</h3>
        </div>
    </div>
    
    <script>
        async function testPermissions() {
            const results = document.getElementById('results');
            let html = '<h3>Your Current Permissions:</h3>';
            
            // Test 1: Check session
            try {
                const session = await fetch('/api/session-info');
                const data = await session.json();
                html += '<div class="alert alert-info">';
                html += '<strong>Session Info:</strong><br>';
                html += 'Username: ' + (data.username || 'Not logged in') + '<br>';
                html += 'Role: ' + (data.role || 'None') + '<br>';
                html += 'Is Admin: ' + (data.isAdmin ? 'Yes' : 'No') + '<br>';
                html += '</div>';
            } catch (e) {
                html += '<div class="alert alert-danger">Could not check session</div>';
            }
            
            // Test 2: Check monitoring access
            try {
                const monitoring = await fetch('/api/monitoring/status');
                if (monitoring.ok) {
                    html += '<div class="alert alert-success">✓ Can access monitoring</div>';
                } else {
                    html += '<div class="alert alert-warning">✗ Cannot access monitoring (Status: ' + monitoring.status + ')</div>';
                }
            } catch (e) {
                html += '<div class="alert alert-danger">✗ Monitoring API error</div>';
            }
            
            // Test 3: Check admin access
            try {
                const admin = await fetch('/api/roi/config');
                if (admin.ok) {
                    html += '<div class="alert alert-success">✓ Can access admin features</div>';
                } else {
                    html += '<div class="alert alert-warning">✗ Cannot access admin features (Status: ' + admin.status + ')</div>';
                }
            } catch (e) {
                html += '<div class="alert alert-danger">✗ Admin API error</div>';
            }
            
            html += '<hr><h4>What you should be able to access:</h4>';
            html += '<a href="/monitoring" class="btn btn-primary">Monitoring Dashboard</a> ';
            html += '<a href="/admin-settings" class="btn btn-secondary">Admin Settings</a> ';
            html += '<a href="/login" class="btn btn-warning">Re-login</a>';
            
            results.innerHTML = html;
        }
        
        // Run test on load
        testPermissions();
    </script>
</body>
</html>
`;

fs.writeFileSync(
    path.join(__dirname, 'views', 'test-permissions.html'),
    testPermissions
);

console.log('✅ Created permission test page');
console.log('\nTo use:');
console.log('1. Restart your server');
console.log('2. Login at http://localhost:3002/login');
console.log('3. Visit http://localhost:3002/test-permissions');
console.log('4. This will show you exactly what permissions you have');
console.log('\nThis will help us figure out why admin access isn\'t working properly.');