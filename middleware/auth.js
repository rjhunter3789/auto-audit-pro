// Simple authentication middleware for immediate lockdown
// CHANGE THESE IMMEDIATELY!
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AutoAudit2025!'; // CHANGE THIS NOW!

function checkAuth(req, res, next) {
    // Allow access to login page and logout
    if (req.path === '/login' || req.path === '/api/login' || req.path === '/logout') {
        return next();
    }
    
    // Check if user is authenticated
    if (!req.session || !req.session.authenticated) {
        // API request - return 401
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        // Web request - redirect to login
        return res.redirect('/login');
    }
    
    next();
}

module.exports = { checkAuth, ADMIN_USERNAME, ADMIN_PASSWORD };