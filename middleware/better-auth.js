
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
