/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

const fs = require('fs');
const path = require('path');

console.log('Creating monitoring access fix...\n');

// Create a simple HTML page that bypasses the API calls
const monitoringFixHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monitoring Dashboard - Fixed</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .alert {
            background: #ffeb3b;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .btn {
            background: #2196F3;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 5px;
        }
        .btn:hover {
            background: #1976D2;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Monitoring Dashboard - Access Fix</h1>
        
        <div class="alert">
            <strong>Session Issue Detected</strong><br>
            Your session is not properly authenticated for the monitoring API endpoints.
        </div>
        
        <h2>Quick Fix Options:</h2>
        
        <p><strong>Option 1: Re-authenticate</strong></p>
        <ol>
            <li>Clear your browser cookies for localhost</li>
            <li>Close all browser tabs</li>
            <li><a href="/logout" class="btn">Logout</a></li>
            <li>Login again with: admin / Admin123!</li>
            <li>Return to <a href="/monitoring" class="btn">Monitoring Dashboard</a></li>
        </ol>
        
        <p><strong>Option 2: Use Direct Links</strong></p>
        <p>After logging in, try these direct links:</p>
        <ul>
            <li><a href="/admin-settings" class="btn">Admin Settings</a></li>
            <li><a href="/reports" class="btn">Reports</a></li>
            <li><a href="/" class="btn">Home Dashboard</a></li>
        </ul>
        
        <p><strong>Option 3: Restart Server</strong></p>
        <p>If the issue persists, restart the server:</p>
        <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px;">
pkill -f "node server.js"
npm start
        </pre>
        
        <h2>Current Status:</h2>
        <div id="status">Checking session...</div>
        
        <script>
            // Check if we're actually logged in
            fetch('/api/monitoring/status')
                .then(res => {
                    if (res.ok) {
                        document.getElementById('status').innerHTML = 
                            '<span style="color: green;">✓ API is accessible - Try refreshing the monitoring page</span>';
                    } else {
                        document.getElementById('status').innerHTML = 
                            '<span style="color: red;">✗ API returned ' + res.status + ' - Please re-authenticate</span>';
                    }
                })
                .catch(err => {
                    document.getElementById('status').innerHTML = 
                        '<span style="color: red;">✗ Cannot reach API - ' + err.message + '</span>';
                });
        </script>
    </div>
</body>
</html>`;

// Save the fix page
fs.writeFileSync(path.join(__dirname, 'views', 'monitoring-fix.html'), monitoringFixHTML);

console.log('✓ Created monitoring fix page');
console.log('\nTo use the fix:');
console.log('1. Navigate to: http://localhost:3000/monitoring-fix');
console.log('2. Follow the instructions on the page');
console.log('\nOr try this direct command to restart with a clean session:');
console.log('pkill -f "node server.js" && rm -f cookies.txt && npm start');