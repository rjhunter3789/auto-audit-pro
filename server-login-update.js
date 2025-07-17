// This file contains the updated login route for multi-user support
// Copy this into server.js, replacing the existing app.post('/api/login') route

// First, add this near the top of server.js after other requires:
const { authenticateUser } = require('./lib/user-manager');

// Then replace the entire app.post('/api/login') route with:
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log('[Login] Attempting login for:', username);
    
    // Authenticate user using the new system
    const user = authenticateUser(username, password);
    
    if (user) {
        // Check if subscription expired
        if (user.subscriptionExpired) {
            console.log('[Login] Subscription expired for:', username);
            return res.redirect('/subscription-expired');
        }
        
        // Set session
        req.session.authenticated = true;
        req.session.username = user.username;
        req.session.userId = user.id;
        req.session.dealership = user.dealership;
        req.session.role = user.role;
        req.session.isAdmin = user.role === 'admin';
        req.session.subscriptionTier = user.subscriptionTier;
        
        // Force session save before redirect
        req.session.save((err) => {
            if (err) {
                console.error('[Login] Session save error:', err);
            } else {
                console.log('[Login] Session saved successfully:', {
                    username: req.session.username,
                    dealership: req.session.dealership,
                    role: req.session.role,
                    isAdmin: req.session.isAdmin
                });
            }
            
            clearFailedAttempts(ip);
            
            // Log successful login
            logSecurityEvent({
                type: 'LOGIN_SUCCESS',
                ip: ip,
                path: '/api/login',
                details: `User: ${username} (${user.dealership})`
            });
            
            res.redirect('/');
        });
    } else {
        trackFailedLogin(ip);
        
        // Log failed login
        logSecurityEvent({
            type: 'LOGIN_FAILED',
            ip: ip,
            path: '/api/login',
            details: `Username: ${username}`
        });
        
        res.redirect('/login?error=1');
    }
});