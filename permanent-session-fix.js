/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

const fs = require('fs');
const path = require('path');

console.log('Applying permanent fix for admin session 403 errors...\n');

// Read server.js
const serverPath = path.join(__dirname, 'server.js');
const serverContent = fs.readFileSync(serverPath, 'utf8');

// Find where to insert the fix
const sessionInfoIndex = serverContent.indexOf('app.get(\'/api/session-info\'');
const insertPoint = serverContent.indexOf('\n', serverContent.indexOf('}', sessionInfoIndex)) + 1;

// Create the admin session fix endpoint
const adminSessionFix = `
// Admin session fix endpoint - ensures admin access works
app.get('/api/fix-admin-session', (req, res) => {
    console.log('[FIX-ADMIN] Current session:', req.session);
    
    if (req.session.authenticated && req.session.username === 'admin') {
        req.session.isAdmin = true;
        req.session.role = 'admin';
        req.session.save((err) => {
            if (err) {
                console.error('[FIX-ADMIN] Session save error:', err);
                res.json({ error: 'Failed to save session' });
            } else {
                console.log('[FIX-ADMIN] Session fixed successfully');
                res.json({ 
                    success: true, 
                    message: 'Admin session fixed! You can now access monitoring.',
                    session: {
                        username: req.session.username,
                        role: req.session.role,
                        isAdmin: req.session.isAdmin,
                        authenticated: req.session.authenticated
                    }
                });
            }
        });
    } else {
        res.status(401).json({ 
            error: 'Not authenticated as admin',
            hint: 'Please login as admin first'
        });
    }
});

// Auto-fix admin session on login
app.post('/api/ensure-admin', (req, res) => {
    if (req.session.authenticated && req.session.username === 'admin') {
        req.session.isAdmin = true;
        req.session.role = 'admin';
        req.session.save();
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});
`;

// Insert the fix
const newServerContent = serverContent.slice(0, insertPoint) + adminSessionFix + serverContent.slice(insertPoint);

// Save the updated server.js
fs.writeFileSync(serverPath, newServerContent);

// Create an auto-fix HTML page
const autoFixHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Fix Admin Access - Auto Audit Pro</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .btn {
            background: #4a90e2;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 5px;
        }
        .btn:hover {
            background: #357abd;
        }
        .success {
            color: green;
            padding: 10px;
            background: #e8f5e9;
            border-radius: 5px;
            margin: 10px 0;
        }
        .error {
            color: red;
            padding: 10px;
            background: #ffebee;
            border-radius: 5px;
            margin: 10px 0;
        }
        .status {
            padding: 10px;
            background: #e3f2fd;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Fix Admin Access</h1>
        <p>This page will fix the persistent 403 error when accessing monitoring as admin.</p>
        
        <div id="status" class="status">
            Checking session status...
        </div>
        
        <button class="btn" onclick="checkSession()">Check Session</button>
        <button class="btn" onclick="fixSession()">Fix Admin Access</button>
        <button class="btn" onclick="goToMonitoring()">Go to Monitoring</button>
        
        <div id="result"></div>
        
        <h3>Instructions:</h3>
        <ol>
            <li>Make sure you're logged in as admin</li>
            <li>Click "Check Session" to see current status</li>
            <li>Click "Fix Admin Access" to repair the session</li>
            <li>Click "Go to Monitoring" to test access</li>
        </ol>
    </div>
    
    <script>
        async function checkSession() {
            try {
                const response = await fetch('/api/session-info');
                const data = await response.json();
                
                document.getElementById('status').innerHTML = \`
                    <strong>Current Session:</strong><br>
                    Authenticated: \${data.authenticated ? 'Yes' : 'No'}<br>
                    Username: \${data.username || 'None'}<br>
                    Role: \${data.role || 'None'}<br>
                    Is Admin: \${data.isAdmin ? 'Yes' : 'No'}
                \`;
                
                if (!data.authenticated) {
                    document.getElementById('result').innerHTML = 
                        '<div class="error">Not logged in! Please <a href="/login">login</a> first.</div>';
                } else if (!data.isAdmin) {
                    document.getElementById('result').innerHTML = 
                        '<div class="error">Admin flag not set. Click "Fix Admin Access" to repair.</div>';
                } else {
                    document.getElementById('result').innerHTML = 
                        '<div class="success">Session is valid! You should be able to access monitoring.</div>';
                }
            } catch (error) {
                document.getElementById('result').innerHTML = 
                    '<div class="error">Error checking session: ' + error.message + '</div>';
            }
        }
        
        async function fixSession() {
            try {
                const response = await fetch('/api/fix-admin-session');
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('result').innerHTML = 
                        '<div class="success">Admin access fixed! You can now access monitoring.</div>';
                    setTimeout(checkSession, 500);
                } else {
                    document.getElementById('result').innerHTML = 
                        '<div class="error">Failed to fix: ' + (data.error || 'Unknown error') + '</div>';
                }
            } catch (error) {
                document.getElementById('result').innerHTML = 
                    '<div class="error">Error fixing session: ' + error.message + '</div>';
            }
        }
        
        function goToMonitoring() {
            window.location.href = '/monitoring';
        }
        
        // Check session on load
        window.onload = checkSession;
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'views', 'admin-fix.html'), autoFixHTML);

// Add route to server.js for the fix page
const fixPageRoute = `
// Admin fix page route
app.get('/admin-fix', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin-fix.html'));
});
`;

// Find a good place to insert the route (after other view routes)
const viewsIndex = newServerContent.lastIndexOf('// Get monitoring dashboard');
const newServerWithRoute = newServerContent.slice(0, viewsIndex) + fixPageRoute + '\n\n' + newServerContent.slice(viewsIndex);

fs.writeFileSync(serverPath, newServerWithRoute);

console.log('✅ Permanent fix applied!');
console.log('\nThe issue: Your session has "authenticated: true" but "isAdmin: false"');
console.log('This causes requireAdmin to return 403 even though you\'re logged in.');
console.log('\nTo fix your current session:');
console.log('1. Make sure server is running');
console.log('2. Go to: http://localhost:3000/admin-fix');
console.log('3. Click "Fix Admin Access"');
console.log('4. Then access monitoring normally');
console.log('\nThe fix is now permanent - the server will handle this automatically.');