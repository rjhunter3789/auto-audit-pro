// Simple authentication middleware for immediate lockdown
// CHANGE THESE IMMEDIATELY!
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AutoAudit2025!'; // CHANGE THIS NOW!

function checkAuth(req, res, next) {
    console.log(`[AUTH] Checking auth for path: ${req.path}`);
    
    // Allow access to login page and logout
    if (req.path === '/login' || req.path === '/api/login' || req.path === '/logout') {
        console.log('[AUTH] Allowing access to login/logout path');
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
    
    console.log(`[AUTH] User authenticated as: ${req.session.username}`);
    next();
}

module.exports = { checkAuth, ADMIN_USERNAME, ADMIN_PASSWORD };