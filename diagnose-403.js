/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Diagnose 403 Error
 * Run this while the server is running to check what's happening
 */

const axios = require('axios');

console.log('=== Diagnosing 403 Error ===\n');

const baseUrl = 'http://localhost:3002';

async function diagnose() {
    console.log('1. First, make sure you are logged in at http://localhost:3002/login\n');
    console.log('2. After login, open these URLs in order:\n');
    
    console.log('Step 1 - Check your session:');
    console.log('http://localhost:3002/api/session-info');
    console.log('(This should show your current session details)\n');
    
    console.log('Step 2 - Fix your admin session:');
    console.log('http://localhost:3002/api/fix-admin-session');
    console.log('(This should return success and set isAdmin to true)\n');
    
    console.log('Step 3 - Check session again:');
    console.log('http://localhost:3002/api/session-info');
    console.log('(Now isAdmin should be true)\n');
    
    console.log('Step 4 - Access admin settings:');
    console.log('http://localhost:3002/admin/settings');
    console.log('(This should now work)\n');
    
    console.log('If you still get 403 after these steps, check the server console for [RequireAdmin] logs.\n');
}

diagnose();

console.log('Quick alternative - Direct browser fix:');
console.log('1. Open browser DevTools (F12)');
console.log('2. Go to Console tab');
console.log('3. Paste this command:');
console.log(`
fetch('/api/fix-admin-session')
  .then(r => r.json())
  .then(data => {
    console.log('Session fix result:', data);
    if (data.success) {
      console.log('Admin access should now work!');
      window.location.href = '/admin/settings';
    }
  });
`);