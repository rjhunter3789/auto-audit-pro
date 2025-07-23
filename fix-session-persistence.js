/**
 * Fix session persistence issues causing Access Denied
 */

const fs = require('fs');
const path = require('path');

// Read server.js
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Find the session configuration
const sessionConfigPattern = /app\.use\(session\({[\s\S]*?}\)\);/;
const sessionMatch = serverContent.match(sessionConfigPattern);

if (!sessionMatch) {
    console.error('Could not find session configuration');
    process.exit(1);
}

// Replace the session configuration with improved settings
const newSessionConfig = `app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: true,  // Changed from false to true - forces session to be saved even if unmodified
    saveUninitialized: true,  // Changed from false to true - saves new sessions
    rolling: true,  // Reset expiry on activity
    cookie: { 
        maxAge: 7 * 24 * 60 * 60 * 1000,  // Extended to 7 days instead of 24 hours
        httpOnly: true,
        secure: false,  // Set to true in production with HTTPS
        sameSite: 'lax'
    },
    name: 'autoaudit.sid'  // Custom session name
}));`;

serverContent = serverContent.replace(sessionConfigPattern, newSessionConfig);

// Also update the checkAuth middleware to be more forgiving
const checkAuthPattern = /function checkAuth\(req, res, next\) {[\s\S]*?^}/m;
const checkAuthMatch = serverContent.match(checkAuthPattern);

if (checkAuthMatch) {
    const newCheckAuth = `function checkAuth(req, res, next) {
    console.log(\`[AUTH] Checking auth for path: \${req.path}\`);
    console.log(\`[AUTH] Session:\`, {
        exists: !!req.session,
        authenticated: req.session?.authenticated,
        username: req.session?.username,
        role: req.session?.role,
        isAdmin: req.session?.isAdmin
    });
    
    // Allow access to login page, logout, and recovery routes
    const publicRoutes = ['/login', '/api/login', '/logout', '/recover-access', '/api/fix-admin-session'];
    if (publicRoutes.includes(req.path)) {
        console.log('[AUTH] Allowing access to public path');
        return next();
    }
    
    // Check if user is authenticated
    if (!req.session || !req.session.authenticated) {
        console.log('[AUTH] User not authenticated, redirecting to login');
        // API request - return 401
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        // Web request - redirect to login
        return res.redirect('/login');
    }
    
    // Ensure session has all required fields
    if (req.session.authenticated && !req.session.isAdmin && req.session.role === 'admin') {
        req.session.isAdmin = true;
        console.log('[AUTH] Fixed missing isAdmin flag for admin user');
    }
    
    console.log(\`[AUTH] User authenticated as: \${req.session.username}\`);
    next();
}`;
    
    serverContent = serverContent.replace(checkAuthPattern, newCheckAuth);
}

// Write the updated content
fs.writeFileSync(serverPath, serverContent);

console.log('✓ Updated session configuration:');
console.log('  - Extended session timeout to 7 days');
console.log('  - Enabled session resaving and initialization');
console.log('  - Added rolling sessions (reset on activity)');
console.log('  - Updated checkAuth to fix missing isAdmin flag');
console.log('');
console.log('✓ Please restart the server for changes to take effect');