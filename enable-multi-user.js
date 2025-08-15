/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Enable multi-user system with dealer login
 */

const fs = require('fs');
const path = require('path');

// Create users.json with admin and dealer accounts
const users = [
    {
        id: "1",
        username: "admin",
        email: "admin@autoauditpro.com",
        password: "AutoAudit2025!", // In production, this would be hashed
        role: "admin",
        isAdmin: true,
        created_at: new Date().toISOString()
    },
    {
        id: "2",
        username: "dealer",
        email: "dealer@priceford.com",
        password: "dealer123", // In production, this would be hashed
        role: "dealer",
        dealership: "Price Ford",
        isAdmin: false,
        created_at: new Date().toISOString(),
        subscription: {
            plan: "professional",
            status: "active",
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
    }
];

// Save users file
const usersPath = path.join(__dirname, 'data', 'users.json');
fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
console.log('✅ Created data/users.json with admin and dealer accounts');

// Now update the server.js login route
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Find the login route
const oldLoginRoute = `app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        req.session.authenticated = true;
        req.session.username = username;
        req.session.role = 'admin'; // Set admin role
        
        console.log('[Login] Session after login:', {
            id: req.session.id,
            authenticated: req.session.authenticated,
            username: req.session.username,
            role: req.session.role
        });
        
        res.json({ 
            success: true,
            redirect: req.session.returnTo || '/'
        });
        delete req.session.returnTo;
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
        });
    }
});`;

const newLoginRoute = `app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Try to load users from users.json first
    let users = [];
    try {
        const usersData = fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8');
        users = JSON.parse(usersData);
    } catch (error) {
        console.log('[Login] No users.json found, falling back to .env');
    }
    
    // Check against users.json
    const user = users.find(u => 
        (u.username === username || u.email === username) && 
        u.password === password
    );
    
    if (user) {
        req.session.authenticated = true;
        req.session.username = user.username;
        req.session.role = user.role;
        req.session.userId = user.id;
        req.session.dealership = user.dealership;
        req.session.isAdmin = user.isAdmin || false;
        
        console.log('[Login] User logged in from users.json:', {
            username: user.username,
            role: user.role,
            isAdmin: user.isAdmin
        });
        
        res.json({ 
            success: true,
            redirect: req.session.returnTo || '/'
        });
        delete req.session.returnTo;
    } 
    // Fall back to .env if no user found
    else if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        req.session.authenticated = true;
        req.session.username = username;
        req.session.role = 'admin';
        req.session.isAdmin = true;
        
        console.log('[Login] Admin logged in from .env');
        
        res.json({ 
            success: true,
            redirect: req.session.returnTo || '/'
        });
        delete req.session.returnTo;
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
        });
    }
});`;

// Replace the login route
if (serverContent.includes(oldLoginRoute)) {
    serverContent = serverContent.replace(oldLoginRoute, newLoginRoute);
    console.log('✅ Updated login route to support multi-user');
} else {
    console.log('⚠️  Could not find exact login route, trying alternative approach...');
    
    // Try regex replacement
    const loginRegex = /app\.post\(['"]\/login['"],\s*\(req,\s*res\)\s*=>\s*{[\s\S]*?^\}\);/m;
    if (loginRegex.test(serverContent)) {
        serverContent = serverContent.replace(loginRegex, newLoginRoute);
        console.log('✅ Updated login route using regex');
    } else {
        console.log('❌ Could not update login route automatically');
    }
}

// Also need to update the /api/user/current endpoint
const currentUserEndpoint = `// Get current user info
app.get('/api/user/current', requireAuth, (req, res) => {
    res.json({
        username: req.session.username,
        role: req.session.role,
        isAdmin: req.session.isAdmin || req.session.role === 'admin',
        dealership: req.session.dealership
    });
});`;

// Find where to add this endpoint if it doesn't exist
if (!serverContent.includes('/api/user/current')) {
    // Add after the login route
    const insertPosition = serverContent.indexOf('app.post(\'/login\'');
    if (insertPosition !== -1) {
        const endOfLogin = serverContent.indexOf('});', insertPosition) + 3;
        serverContent = serverContent.slice(0, endOfLogin) + '\n\n' + currentUserEndpoint + serverContent.slice(endOfLogin);
        console.log('✅ Added /api/user/current endpoint');
    }
}

// Write the updated server file
fs.writeFileSync(serverPath, serverContent);

console.log('\n📝 Multi-user system enabled!');
console.log('\n🔐 Login credentials:');
console.log('\nAdmin account:');
console.log('  Username: admin');
console.log('  Password: AutoAudit2025!');
console.log('\nDealer account:');
console.log('  Username: dealer');
console.log('  Password: dealer123');
console.log('\n🎯 Features by role:');
console.log('\nAdmin sees:');
console.log('  - Red "Admin" badge');
console.log('  - Admin Settings button');
console.log('  - Can change monitoring frequency');
console.log('\nDealer sees:');
console.log('  - No admin badge');
console.log('  - No admin settings');
console.log('  - Cannot change monitoring frequency');
console.log('\n⚠️  Restart the server to apply changes!');