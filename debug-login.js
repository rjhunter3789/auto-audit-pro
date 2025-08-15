/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Add debug logging to login route
 */

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Find the login authentication part and add more logging
const oldAuth = `        // Check against users.json
        authenticatedUser = users.find(u => 
            (u.username === username || u.email === username) && 
            u.password === password
        );`;

const newAuth = `        // Check against users.json
        console.log('[Login Debug] Users loaded:', users.length);
        console.log('[Login Debug] Looking for user:', username);
        
        authenticatedUser = users.find(u => {
            const usernameMatch = u.username === username || u.email === username;
            const passwordMatch = u.password === password;
            console.log('[Login Debug] Checking user:', u.username, 'Username match:', usernameMatch, 'Password match:', passwordMatch);
            return usernameMatch && passwordMatch;
        });
        
        console.log('[Login Debug] Authenticated user:', authenticatedUser ? authenticatedUser.username : 'none');`;

if (serverContent.includes(oldAuth)) {
    serverContent = serverContent.replace(oldAuth, newAuth);
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Added debug logging to login route');
    console.log('\nRestart the server and try the dealer login again.');
    console.log('Check the server console for detailed debug output.');
} else {
    console.log('⚠️  Could not find the exact code to update');
}