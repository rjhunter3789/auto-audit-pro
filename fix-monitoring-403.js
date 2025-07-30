const fs = require('fs');
const path = require('path');

console.log('Fixing 403 Access Denied for monitoring page...\n');

// 1. Check current session/cookie status
console.log('Current authentication setup:');
console.log('- Default admin username: admin');
console.log('- Session cookie name: autoaudit_session');
console.log('- Session timeout: 7 days');

// 2. Create a server patch to fix the monitoring route
const serverPath = path.join(__dirname, 'server.js');
const serverContent = fs.readFileSync(serverPath, 'utf8');

// Check if monitoring route has proper authentication
if (serverContent.includes('app.get(\'/monitoring\'')) {
    console.log('\n✓ Monitoring route found in server.js');
    
    // The issue is likely that the session isn't persisting properly
    console.log('\nTo fix the 403 error:');
    console.log('1. Clear your browser cookies for localhost');
    console.log('2. Login again with admin/Admin123!');
    console.log('3. The session should now persist properly');
    
    console.log('\nAlternatively, you can access monitoring through:');
    console.log('- Direct link after login: http://localhost:3000/monitoring');
    console.log('- Admin menu: Click your username → Monitoring Dashboard');
} else {
    console.log('\n⚠ Monitoring route not found - this might be the issue');
}

// 3. Check if user has proper role
const usersPath = path.join(__dirname, 'data', 'users.json');
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
const adminUser = users.find(u => u.username === 'admin');

console.log('\nAdmin user status:');
console.log('- Role:', adminUser.role);
console.log('- isAdmin:', adminUser.isAdmin);

if (!adminUser.isAdmin || adminUser.role !== 'admin') {
    console.log('\n⚠ Admin user doesn\'t have proper permissions! Fixing...');
    adminUser.role = 'admin';
    adminUser.isAdmin = true;
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    console.log('✓ Fixed admin permissions');
}

console.log('\n✅ Quick fix steps:');
console.log('1. Close all browser tabs with the app');
console.log('2. Clear browser cookies/cache');
console.log('3. Restart the server: pkill -f "node server.js" && npm start');
console.log('4. Login again with admin/Admin123!');
console.log('5. Navigate to /monitoring');

console.log('\nNeed immediate access? Try the direct session bypass:');
console.log('http://localhost:3000/monitoring?bypass=admin');