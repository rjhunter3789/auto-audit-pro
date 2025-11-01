/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

// Simple authentication middleware for immediate lockdown
// CHANGE THESE IMMEDIATELY!
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AutoAudit2025!'; // CHANGE THIS NOW!

function checkAuth(req, res, next) {
    console.log(`[AUTH] Checking auth for path: ${req.path}`);
    console.log(`[AUTH] Session:`, {
        exists: !!req.session,
        authenticated: req.session?.authenticated,
        username: req.session?.username,
        role: req.session?.role,
        isAdmin: req.session?.isAdmin
    });
    
    // Allow access to login page, logout, lead gate routes, and homepage
    const publicPaths = [
        '/',  // Public homepage
        '/login', 
        '/api/login', 
        '/logout',
        '/request-access',
        '/api/lead-gate'
    ];
    
    if (publicPaths.includes(req.path)) {
        console.log('[AUTH] Allowing access to public path:', req.path);
        return next();
    }
    
    // Check if user is authenticated
    if (!req.session || !req.session.authenticated) {
        console.log('[AUTH] User not authenticated');
        
        // For suite access pages, redirect to lead gate
        if (req.path === '/suite-access' || req.path.startsWith('/website-audit') || req.path.startsWith('/lead-analysis')) {
            console.log('[AUTH] Redirecting to lead gate for suite access');
            return res.redirect('/request-access');
        }
        
        // API request - return 401
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        // All other web requests - redirect to login
        console.log('[AUTH] Redirecting to login');
        return res.redirect('/login');
    }
    
    console.log(`[AUTH] User authenticated as: ${req.session.username}`);
    next();
}

module.exports = { checkAuth, ADMIN_USERNAME, ADMIN_PASSWORD };