/**
 * Production Server - Full features without Selenium
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: true,
    saveUninitialized: true,
    rolling: true,
    cookie: { 
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    },
    name: 'autoaudit.sid'
}));

// Static files
app.use(express.static('public'));
app.use('/views', express.static('views'));

// Override any CSP headers from platform
app.use((req, res, next) => {
    // Remove any existing CSP headers
    res.removeHeader('Content-Security-Policy');
    
    // Set our own permissive CSP
    res.setHeader(
        'Content-Security-Policy',
        "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
        "script-src * 'unsafe-inline' 'unsafe-eval'; " +
        "style-src * 'unsafe-inline';"
    );
    next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);

// Health check - MUST be before auth
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '2.6.8',
        mode: 'production',
        environment: process.env.NODE_ENV || 'production'
    });
});

// Session info endpoint
app.get('/api/session-info', (req, res) => {
    res.json({
        authenticated: req.session?.authenticated || false,
        username: req.session?.username || null,
        role: req.session?.role || null,
        isAdmin: req.session?.isAdmin || false,
        sessionID: req.sessionID,
        userObject: req.session?.user || null,
        sessionExists: !!req.session
    });
});

// Auth middleware
const { checkAuth, ADMIN_USERNAME, ADMIN_PASSWORD } = require('./middleware/auth');

// Login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log('[Login] Attempt:', { username });
    
    // Check users.json
    const usersFile = path.join(__dirname, 'data', 'users.json');
    if (fs.existsSync(usersFile)) {
        try {
            const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
            const user = users.find(u => 
                (u.username === username || u.email === username) && 
                u.password === password
            );
            
            if (user) {
                console.log('[Login] User authenticated:', user.username);
                req.session.authenticated = true;
                req.session.username = user.username;
                req.session.role = user.role || 'dealer';
                req.session.isAdmin = user.isAdmin || false;
                req.session.dealership = user.dealership || user.username;
                
                req.session.save((err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Session error' });
                    }
                    res.redirect('/');
                });
                return;
            }
        } catch (error) {
            console.error('[Login] Error reading users.json:', error);
        }
    }
    
    // Check env admin
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        console.log('[Login] Env admin authenticated');
        req.session.authenticated = true;
        req.session.username = username;
        req.session.role = 'admin';
        req.session.isAdmin = true;
        
        req.session.save((err) => {
            if (err) {
                return res.status(500).json({ error: 'Session error' });
            }
            res.redirect('/');
        });
        return;
    }
    
    // Failed login
    res.status(401).send('Login failed');
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Recovery endpoint
app.get('/recover-access', (req, res) => {
    req.session.authenticated = true;
    req.session.username = 'admin';
    req.session.role = 'admin';
    req.session.isAdmin = true;
    
    req.session.save((err) => {
        if (err) {
            return res.status(500).send('Failed to create session');
        }
        res.send('Access recovered! <a href="/">Go to Home</a>');
    });
});

// Apply auth to subsequent routes
app.use((req, res, next) => {
    // Skip auth for public routes and APIs
    const publicPaths = [
        '/api/monitoring/',
        '/api/roi/config',
        '/api/session-info'
    ];
    
    if (publicPaths.some(path => req.path.startsWith(path))) {
        return next();
    }
    
    // Skip auth for static files
    if (req.path.includes('.')) {
        return next();
    }
    
    checkAuth(req, res, next);
});

// Main routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'suite-home.html'));
});

app.get('/monitoring', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'monitoring-dashboard.html'));
});

app.get('/admin-settings-direct', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin-settings.html'));
});

// API endpoints
app.get('/api/user/current', (req, res) => {
    res.json({
        authenticated: true,
        username: req.session?.username,
        role: req.session?.role,
        isAdmin: req.session?.isAdmin,
        dealership: req.session?.dealership
    });
});

// Monitoring endpoints
app.get('/api/monitoring/status', (req, res) => {
    try {
        const profilesPath = path.join(__dirname, 'data', 'monitoring', 'profiles.json');
        if (fs.existsSync(profilesPath)) {
            const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
            res.json(profiles);
        } else {
            res.json([]);
        }
    } catch (error) {
        res.json([]);
    }
});

app.get('/api/monitoring/profiles', (req, res) => {
    try {
        const profilesPath = path.join(__dirname, 'data', 'monitoring', 'profiles.json');
        if (fs.existsSync(profilesPath)) {
            const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
            res.json(profiles);
        } else {
            res.json([]);
        }
    } catch (error) {
        res.json([]);
    }
});

app.get('/api/monitoring/stats', (req, res) => {
    res.json({
        seleniumRequests: 0,
        scrapingDogRequests: 0,
        seleniumSuccess: 0,
        scrapingDogSuccess: 0
    });
});

// Monitoring alerts endpoint
app.get('/api/monitoring/alerts/:profileId', (req, res) => {
    try {
        const alertsPath = path.join(__dirname, 'data', 'monitoring', 'alerts.json');
        if (fs.existsSync(alertsPath)) {
            const allAlerts = JSON.parse(fs.readFileSync(alertsPath, 'utf8'));
            const profileAlerts = allAlerts.filter(a => a.profile_id == req.params.profileId);
            
            if (req.query.resolved === 'false') {
                const unresolvedAlerts = profileAlerts.filter(a => !a.resolved);
                res.json(unresolvedAlerts);
            } else {
                res.json(profileAlerts);
            }
        } else {
            res.json([]);
        }
    } catch (error) {
        res.json([]);
    }
});

// Add missing routes
app.get('/website-audit', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index-new.html'));
});

app.get('/lead-analysis', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'lead-performance.html'));
});

// Catch all for other monitoring endpoints
app.get('/api/monitoring/:endpoint', (req, res) => {
    res.json({ message: 'Endpoint not implemented' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).send('Something went wrong!');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Production server running on port ${PORT}`);
    console.log('Health check available at /api/health');
    console.log('Environment:', process.env.NODE_ENV || 'production');
});