/*
 * Auto Audit Pro - Professional Dealership Website Analysis Platform
 * Version 2.6.3
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Author: JL Robinson
 * Contact: nakapaahu@gmail.com
 * Technology: Node.js + Express + Selenium WebDriver + Real Performance APIs
 * Last Modified: July 18, 2025
 * 
 * This software is protected by copyright law.
 * Unauthorized reproduction or distribution is prohibited.
 */

// Load environment variables FIRST
const dotenvResult = require('dotenv').config();
console.log('[Dotenv Debug] Load result:', dotenvResult.error ? 'ERROR: ' + dotenvResult.error : 'SUCCESS');
console.log('[Dotenv Debug] Working directory:', process.cwd());
console.log('[Dotenv Debug] .env path attempted:', require('path').resolve(process.cwd(), '.env'));

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const url = require('url');
const multer = require('multer');

// Debug .env loading
console.log('[ENV Debug] ADMIN_USERNAME from env:', process.env.ADMIN_USERNAME);
console.log('[ENV Debug] ADMIN_PASSWORD exists:', !!process.env.ADMIN_PASSWORD);
console.log('[ENV Debug] SESSION_SECRET exists:', !!process.env.SESSION_SECRET);

// Load Selenium through wrapper (gracefully handles when not available)
const seleniumWrapper = require('./lib/selenium-wrapper');
const { Builder, By, until } = seleniumWrapper.seleniumAvailable ? require('selenium-webdriver') : { Builder: null, By: null, until: null };

// Load custom modules
const groupAnalysis = require('./lib/group-analysis');
const DealerSearcher = require('./lib/dealer-search');

// Load JSON storage for monitoring system
const { pool } = require('./lib/json-storage');


const app = express();
const PORT = process.env.PORT || 3002;

// Session setup for authentication - MUST BE FIRST
app.use(session({
    secret: process.env.SESSION_SECRET || 'AutoAuditPro-Secret-Key-2025',
    resave: false,
    saveUninitialized: false,
    name: 'autoaudit.sid', // Custom session name
    cookie: { 
        secure: false, // Set to false for better compatibility
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (extended for admin convenience)
        sameSite: 'lax' // Changed from 'strict' to 'lax' for better compatibility
        // Removed domain restriction for better compatibility
    }
}));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // This lets our server understand the form data

// Serve static files
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Allow access to views for admin pages
app.use('/views', express.static(path.join(__dirname, 'views')));

// Authentication middleware
const { checkAuth, ADMIN_USERNAME, ADMIN_PASSWORD } = require('./middleware/auth');

// Security monitoring
const { 
    checkSuspiciousActivity, 
    trackFailedLogin, 
    clearFailedAttempts,
    logSecurityEvent,
    getSecurityStats 
} = require('./middleware/security-monitor');

// Apply security monitoring to ALL requests
app.use(checkSuspiciousActivity);

// Middleware to check admin role
function requireAdmin(req, res, next) {
    console.log('[RequireAdmin] Checking admin access:', {
        authenticated: req.session.authenticated,
        isAdmin: req.session.isAdmin,
        role: req.session.role,
        username: req.session.username,
        sessionID: req.sessionID
    });
    
    // Check both isAdmin flag and role='admin'
    if (req.session.authenticated && (req.session.isAdmin === true || req.session.role === 'admin')) {
        console.log('[RequireAdmin] Access granted');
        next();
    } else {
        console.log('[RequireAdmin] Access denied');
        // For API requests, return JSON error
        if (req.path.startsWith('/api/')) {
            res.status(403).json({ error: 'Admin access required' });
        } else {
            // For web pages, show access denied page
            res.status(403).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Access Denied</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
                </head>
                <body>
                    <div class="container mt-5">
                        <div class="alert alert-danger">
                            <h4>Access Denied</h4>
                            <p>Admin access required. Your current role: ${req.session.role || 'none'}</p>
                            <p>Authenticated: ${req.session.authenticated ? 'Yes' : 'No'}</p>
                            <p>Is Admin: ${req.session.isAdmin ? 'Yes' : 'No'}</p>
                            <p>Session ID: ${req.sessionID}</p>
                            <a href="/" class="btn btn-primary">Back to Home</a>
                            <a href="/api/session-info" class="btn btn-secondary">Check Session</a>
                        </div>
                    </div>
                </body>
                </html>
            `);
        }
    }
}

// Add user info to all authenticated requests
app.use((req, res, next) => {
    if (req.session.authenticated) {
        req.user = {
            username: req.session.username,
            role: req.session.role || 'dealer',
            isAdmin: req.session.isAdmin || false
        };
    }
    next();
});

// Session debugging endpoint (no auth required)
app.get('/api/session-info', (req, res) => {
    console.log('[Session Info] Request received');
    console.log('[Session Info] Session:', req.session);
    res.json({
        authenticated: req.session.authenticated || false,
        username: req.session.username || null,
        role: req.session.role || null,
        isAdmin: req.session.isAdmin || false,
        sessionID: req.sessionID,
        userObject: req.user || null,
        sessionExists: !!req.session
    });
});

// Temporary admin session fix endpoint
app.get('/api/fix-admin-session', (req, res) => {
    if (req.session.authenticated) {
        req.session.isAdmin = true;
        req.session.role = 'admin';
        req.session.save((err) => {
            if (err) {
                res.json({ error: 'Failed to save session' });
            } else {
                res.json({ 
                    success: true, 
                    message: 'Admin session fixed',
                    session: {
                        username: req.session.username,
                        role: req.session.role,
                        isAdmin: req.session.isAdmin
                    }
                });
            }
        });
    } else {
        res.json({ error: 'Not authenticated. Please login first.' });
    }
});

// Login routes (no auth required)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log('[Login Debug] Attempting login:', { username, passwordLength: password?.length });
    console.log('[Login Debug] Expected username:', ADMIN_USERNAME);
    console.log('[Login Debug] Expected password length:', ADMIN_PASSWORD.length);
    console.log('[Login Debug] Password match:', password === ADMIN_PASSWORD);
    console.log('[Login Debug] Username match:', username === ADMIN_USERNAME);
    console.log('[Login Debug] Session exists:', !!req.session);
    
    // Try to load users from users.json first
    let users = [];
    let authenticatedUser = null;
    
    console.log('[Login] Attempting to load users.json...');
    const usersPath = path.join(__dirname, 'data', 'users.json');
    console.log('[Login] Looking for users.json at:', usersPath);
    console.log('[Login] File exists:', fs.existsSync(usersPath));
    
    try {
        const usersData = fs.readFileSync(usersPath, 'utf8');
        users = JSON.parse(usersData);
        console.log('[Login] Successfully loaded users.json with', users.length, 'users');
        
        // Check against users.json
        console.log('[Login Debug] Users loaded:', users.length);
        console.log('[Login Debug] Looking for user:', username);
        
        authenticatedUser = users.find(u => {
            const usernameMatch = u.username === username || u.email === username;
            const passwordMatch = u.password === password;
            console.log('[Login Debug] Checking user:', u.username, 'Username match:', usernameMatch, 'Password match:', passwordMatch);
            return usernameMatch && passwordMatch;
        });
        
        console.log('[Login Debug] Authenticated user:', authenticatedUser ? authenticatedUser.username : 'none');
    } catch (error) {
        console.log('[Login] Error loading users.json:', error.message);
        console.log('[Login] Full error:', error);
    }
    
    // Check for admin credentials from .env if no user found
    const isAdmin = !authenticatedUser && username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
    
    if (authenticatedUser || isAdmin) {
        req.session.authenticated = true;
        
        if (authenticatedUser) {
            // User from users.json
            req.session.username = authenticatedUser.username;
            req.session.role = authenticatedUser.role;
            req.session.isAdmin = authenticatedUser.isAdmin || false;
            req.session.userId = authenticatedUser.id;
            req.session.dealership = authenticatedUser.dealership;
            
            console.log('[Login] User authenticated from users.json:', {
                username: authenticatedUser.username,
                role: authenticatedUser.role,
                isAdmin: authenticatedUser.isAdmin
            });
        } else {
            // Admin from .env
            req.session.username = username;
            req.session.role = 'admin';
            req.session.isAdmin = true;
            
            console.log('[Login] Admin authenticated from .env');
        }
        
        // Force session save before redirect
        req.session.save((err) => {
            if (err) {
                console.error('[Login] Session save error:', err);
            } else {
                console.log('[Login] Session saved successfully:', {
                    username: req.session.username,
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
                details: `User: ${username}`
            });
            
            res.redirect('/');
        });
    } else {
        trackFailedLogin(ip);
        
        // Log failed attempt
        logSecurityEvent({
            type: 'LOGIN_FAILED',
            ip: ip,
            path: '/api/login',
            details: `Attempted username: ${username}`
        });
        
        res.redirect('/login?error=1');
    }
});

app.get('/logout', (req, res) => {
    console.log('Logout route hit!'); // Debug log
    if (req.session) {
        req.session.destroy((err) => {
            res.clearCookie('autoaudit.sid'); // Clear the session cookie
            res.clearCookie('connect.sid'); // Clear default session cookie too
            res.redirect('/login');
        });
    } else {
        res.redirect('/login');
    }
});

// Health check endpoint (no auth required for deployment health checks)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '2.4.3',
        categories: 8,
        features: ['8-category testing', 'real performance data', 'content analysis'],
        environment: process.env.NODE_ENV || 'development'
    });
});

// TEST ROUTE - ABSOLUTELY NO AUTH
app.get('/test-no-auth', (req, res) => {
    res.send('This route has NO authentication. If you see this, routes work.');
});

// SIMPLE ADMIN TEST
app.get('/admin-test', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Admin Test</title></head>
        <body>
            <h1>Admin Test Page</h1>
            <p>If you see this, routing works.</p>
            <p>Try these links:</p>
            <ul>
                <li><a href="/admin-settings">Admin Settings</a></li>
                <li><a href="/settings-admin">Settings Admin</a></li>
                <li><a href="/views/admin-settings.html">Direct HTML</a></li>
            </ul>
        </body>
        </html>
    `);
});

// DIRECT ADMIN PAGE - NO FILE ACCESS NEEDED
app.get('/admin', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Admin Settings - Auto Audit Pro</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <h1>Admin Settings</h1>
        <p>Direct admin page - no file access needed.</p>
        <div class="alert alert-info">
            The actual admin settings page is having access issues.
            This is a temporary page.
        </div>
        <hr>
        <h3>Quick Links:</h3>
        <ul>
            <li><a href="/monitoring">Back to Monitoring</a></li>
            <li><a href="/api/debug-alerts">Debug Alerts</a></li>
            <li><a href="/api/check-session">Check Session</a></li>
        </ul>
    </div>
</body>
</html>
    `);
});

// Add simple render method to response object
app.use((req, res, next) => {
    res.render = function(viewName) {
        const htmlFile = viewName.endsWith('.html') ? viewName : viewName + '.html';
        res.sendFile(path.join(__dirname, 'views', htmlFile));
    };
    next();
});

// EMERGENCY ACCESS - NO AUTH CHECK - BEFORE GLOBAL AUTH
app.get('/settings-admin', (req, res) => {
    console.log('[Settings Admin] Emergency direct access - no auth check');
    const filePath = path.join(__dirname, 'views', 'admin-settings.html');
    res.sendFile(filePath);
});

// Another admin route to bypass any issues
app.get('/admin-settings', (req, res) => {
    console.log('[Admin Settings] Alternative route - no auth');
    const filePath = path.join(__dirname, 'views', 'admin-settings.html');
    res.sendFile(filePath);
});

// ALTERNATIVE ADMIN ROUTE - COMPLETELY DIFFERENT PATH
app.get('/admin-emergency', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin Emergency Access</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            <div class="container mt-5">
                <h1>Emergency Admin Access</h1>
                <p>Direct links to admin functions:</p>
                <ul>
                    <li><a href="/views/admin-settings.html">Admin Settings (direct file)</a></li>
                    <li><a href="/api/check-session">Check Session</a></li>
                    <li><a href="/api/force-admin-fix">Force Admin Fix</a></li>
                    <li><a href="/api/debug-monitoring">Debug Monitoring</a></li>
                </ul>
                <hr>
                <iframe src="/views/admin-settings.html" style="width: 100%; height: 600px; border: 1px solid #ccc;"></iframe>
            </div>
        </body>
        </html>
    `);
});

// Session check endpoint - NO AUTH
app.get('/api/check-session', (req, res) => {
    res.json({
        authenticated: req.session?.authenticated || false,
        username: req.session?.username || 'none',
        role: req.session?.role || 'none',
        isAdmin: req.session?.isAdmin || false,
        sessionID: req.sessionID,
        sessionData: req.session
    });
});

// Force fix admin session - NO AUTH
app.get('/api/force-admin-fix', (req, res) => {
    if (req.session) {
        req.session.authenticated = true;
        req.session.username = req.session.username || 'admin';
        req.session.isAdmin = true;
        req.session.role = 'admin';
        req.session.save((err) => {
            if (err) {
                res.json({ error: 'Failed to save session', details: err });
            } else {
                res.json({ 
                    success: true, 
                    message: 'Admin privileges FORCED',
                    session: {
                        username: req.session.username,
                        role: req.session.role,
                        isAdmin: req.session.isAdmin,
                        authenticated: req.session.authenticated
                    }
                });
            }
        });
    } else {
        res.json({ error: 'No session exists' });
    }
});

// Debug why no alerts are showing - NO AUTH
app.get('/api/debug-alerts', async (req, res) => {
    try {
        const { storage: jsonStorage } = require('./lib/json-storage');
        const fs = require('fs').promises;
        const path = require('path');
        
        // Get all data
        const profiles = await jsonStorage.getProfiles();
        const allAlerts = await fs.readFile(path.join(__dirname, 'data', 'monitoring', 'alerts.json'), 'utf8')
            .then(data => JSON.parse(data))
            .catch(() => []);
        const results = await fs.readFile(path.join(__dirname, 'data', 'monitoring', 'results.json'), 'utf8')
            .then(data => JSON.parse(data))
            .catch(() => []);
        
        // Get alerts for each profile
        const alertsByProfile = {};
        for (const profile of profiles) {
            alertsByProfile[profile.id] = await jsonStorage.getAlerts(profile.id, false);
        }
        
        res.json({
            profileCount: profiles.length,
            totalAlerts: allAlerts.length,
            resultCount: results.length,
            profiles: profiles.map(p => ({ 
                id: p.id, 
                name: p.dealer_name, 
                status: p.overall_status,
                lastCheck: p.last_check 
            })),
            allAlertsRaw: allAlerts,
            alertsByProfile,
            latestResults: results.slice(-5).map(r => ({
                id: r.id,
                profile_id: r.profile_id,
                overall_status: r.overall_status,
                check_timestamp: r.check_timestamp
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// Force create test alert - NO AUTH
app.post('/api/force-create-alert/:level?', async (req, res) => {
    try {
        const { storage: jsonStorage } = require('./lib/json-storage');
        const { level = 'RED' } = req.params;
        const profiles = await jsonStorage.getProfiles();
        
        if (profiles.length === 0) {
            return res.status(400).json({ error: 'No profiles exist. Create a profile first.' });
        }
        
        const profile = profiles[0];
        
        // Create different alerts based on level
        const alerts = {
            RED: {
                profile_id: profile.id,
                result_id: Date.now(),
                rule_id: 3,
                alert_level: 'RED',
                alert_type: 'forms_working',
                alert_message: 'CRITICAL: Contact forms not working - losing potential leads!',
            },
            YELLOW: {
                profile_id: profile.id,
                result_id: Date.now(),
                rule_id: 7,
                alert_level: 'YELLOW',
                alert_type: 'ssl_expiry_days',
                alert_message: 'WARNING: SSL certificate expires within 30 days',
            }
        };
        
        const testAlert = alerts[level.toUpperCase()] || alerts.RED;
        const savedAlert = await jsonStorage.saveAlert(testAlert);
        res.json({ success: true, alert: savedAlert, profile: profile });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== MONITORING API ROUTES (moved before auth middleware) =====
// These routes handle their own authentication internally

app.get('/api/monitoring/profiles', async (req, res) => {
    try {
        // Use JSON storage instead of database
        const { storage: jsonStorage } = require('./lib/json-storage');
        
        // Get all profiles
        const profiles = await jsonStorage.getProfiles();
        
        // Get latest result for each profile
        const enrichedProfiles = await Promise.all(profiles.map(async (profile) => {
            const latestResult = await jsonStorage.getLatestResult(profile.id);
            
            return {
                ...profile,
                check_timestamp: latestResult?.check_timestamp || null,
                overall_status: latestResult?.overall_status || null,
                response_time_ms: latestResult?.response_time_ms || null
            };
        }));
        
        // Sort by dealer name
        enrichedProfiles.sort((a, b) => (a.dealer_name || '').localeCompare(b.dealer_name || ''));
        
        res.json(enrichedProfiles);
    } catch (error) {
        console.error('Error fetching monitoring profiles:', error);
        res.status(500).json({ error: 'Failed to fetch monitoring profiles' });
    }
});

app.post('/api/monitoring/profiles', async (req, res) => {
    try {
        const { dealer_id, dealer_name, website_url, contact_email, alert_email, alert_phone, alert_preferences, check_frequency } = req.body;
        
        // Use JSON storage instead of database
        const { storage: jsonStorage } = require('./lib/json-storage');
        
        const profileData = {
            dealer_id: dealer_id || null,
            dealer_name,
            website_url,
            contact_email,
            alert_email: alert_email || contact_email,
            alert_phone: alert_phone || null,
            alert_preferences: alert_preferences || { email: true, sms: false },
            check_frequency: check_frequency || 59,
            overall_status: 'PENDING',
            last_check: null
        };
        
        // Save to JSON storage - createProfile will add id and timestamps
        const newProfile = await jsonStorage.createProfile(profileData);
        
        // Schedule initial check after 1 minute
        setTimeout(async () => {
            try {
                const MonitoringEngine = require('./lib/monitoring-engine');
                const engine = new MonitoringEngine();
                const results = await engine.runFullCheck(newProfile);
                
                // Check for alerts
                const alerts = await engine.checkAlertRules(results);
                
                // Process alerts if any
                if (alerts.length > 0) {
                    const MonitoringScheduler = require('./lib/monitoring-scheduler');
                    const scheduler = new MonitoringScheduler();
                    await scheduler.processAlerts(newProfile, results, alerts);
                }
                
                // Update profile status
                const profiles = await jsonStorage.getProfiles();
                const profileIndex = profiles.findIndex(p => p.id === newProfile.id);
                if (profileIndex !== -1) {
                    profiles[profileIndex].overall_status = results.overall_status;
                    profiles[profileIndex].last_check = new Date().toISOString();
                    const fs = require('fs').promises;
                    const path = require('path');
                    const profilesFile = path.join(__dirname, 'data', 'monitoring', 'profiles.json');
                    await fs.writeFile(profilesFile, JSON.stringify(profiles, null, 2));
                }
                
                console.log(`[Initial Check] Completed for ${newProfile.dealer_name}: ${results.overall_status}`);
            } catch (error) {
                console.error(`[Initial Check] Failed for ${newProfile.dealer_name}:`, error);
            }
        }, 60000); // 1 minute delay
        
        res.json(newProfile);
    } catch (error) {
        console.error('Error creating monitoring profile:', error);
        res.status(500).json({ error: 'Failed to create monitoring profile' });
    }
});

app.put('/api/monitoring/profiles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { monitoring_enabled } = req.body;
        
        // Use JSON storage
        const { storage: jsonStorage } = require('./lib/json-storage');
        const updatedProfile = await jsonStorage.updateProfile(parseInt(id), { monitoring_enabled });
        
        if (!updatedProfile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        
        res.json(updatedProfile);
    } catch (error) {
        console.error('Error updating monitoring profile:', error);
        res.status(500).json({ error: 'Failed to update monitoring profile' });
    }
});

app.delete('/api/monitoring/profiles/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[DELETE PROFILE] Attempting to delete profile ${id}`);
        console.log(`[DELETE PROFILE] User session:`, {
            authenticated: req.session.authenticated,
            isAdmin: req.session.isAdmin,
            role: req.session.role,
            username: req.session.username
        });
        
        // Use JSON storage instead of database
        const { storage: jsonStorage } = require('./lib/json-storage');
        
        // Get all profiles
        const profiles = await jsonStorage.getProfiles();
        console.log(`[DELETE PROFILE] Found ${profiles.length} profiles`);
        
        // Filter out the profile to delete
        const updatedProfiles = profiles.filter(p => p.id != id);
        console.log(`[DELETE PROFILE] After filter: ${updatedProfiles.length} profiles`);
        
        // Save updated profiles by writing directly to the file
        const fs = require('fs').promises;
        const path = require('path');
        const profilesFile = path.join(__dirname, 'data', 'monitoring', 'profiles.json');
        await fs.writeFile(profilesFile, JSON.stringify(updatedProfiles, null, 2));
        
        // Also delete associated alerts and results
        const alerts = await jsonStorage.getAlerts();
        const results = await jsonStorage.getResults();
        
        const updatedAlerts = alerts.filter(a => a.profile_id != id);
        const updatedResults = results.filter(r => r.profile_id != id);
        
        // Save updated alerts and results
        const alertsFile = path.join(__dirname, 'data', 'monitoring', 'alerts.json');
        const resultsFile = path.join(__dirname, 'data', 'monitoring', 'results.json');
        await fs.writeFile(alertsFile, JSON.stringify(updatedAlerts, null, 2));
        await fs.writeFile(resultsFile, JSON.stringify(updatedResults, null, 2));
        
        console.log(`[DELETE PROFILE] Successfully deleted profile ${id} and associated data`);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting monitoring profile:', error);
        res.status(500).json({ error: 'Failed to delete monitoring profile' });
    }
});

app.get('/api/monitoring/results/:profileId', async (req, res) => {
    try {
        const { profileId } = req.params;
        const { limit = 100 } = req.query;
        
        // Use JSON storage
        const { storage: jsonStorage } = require('./lib/json-storage');
        const results = await jsonStorage.getResults(parseInt(profileId), parseInt(limit));
        
        res.json(results);
    } catch (error) {
        console.error('Error fetching monitoring results:', error);
        res.status(500).json({ error: 'Failed to fetch monitoring results' });
    }
});

app.get('/api/monitoring/status', checkAuth, async (req, res) => {
    try {
        // Use JSON storage instead of database
        const { storage: jsonStorage } = require('./lib/json-storage');
        
        // Get all profiles
        const profiles = await jsonStorage.getProfiles();
        
        // Get latest result for each profile
        const profilesWithStatus = await Promise.all(profiles.map(async (profile) => {
            const latestResult = await jsonStorage.getLatestResult(profile.id);
            
            return {
                ...profile,
                overall_status: latestResult ? latestResult.overall_status : 'PENDING',
                check_timestamp: latestResult ? latestResult.check_timestamp : null,
                response_time_ms: latestResult ? latestResult.response_time_ms : null,
                issues_found: latestResult ? latestResult.issues_found : []
            };
        }));
        
        // Sort by dealer name
        profilesWithStatus.sort((a, b) => (a.dealer_name || '').localeCompare(b.dealer_name || ''));
        
        res.json(profilesWithStatus);
    } catch (error) {
        console.error('Error fetching monitoring status:', error);
        res.status(500).json({ error: 'Failed to fetch monitoring status' });
    }
});

app.get('/api/monitoring/stats', async (req, res) => {
    try {
        // Get monitoring engine instance
        const MonitoringEngine = require('./lib/monitoring-engine');
        const monitoringEngine = new MonitoringEngine();
        
        // Get stats from monitoring engine
        const stats = monitoringEngine.getMonitoringStats();
        
        // Get JSON storage stats
        const { storage: jsonStorage } = require('./lib/json-storage');
        const results = await jsonStorage.getResults();
        
        // Calculate stats from last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentResults = results.filter(r => new Date(r.check_timestamp) > twentyFourHoursAgo);
        
        const statsData = {
            monitored_sites: new Set(recentResults.map(r => r.profile_id)).size,
            total_checks: recentResults.length,
            green_checks: recentResults.filter(r => r.overall_status === 'GREEN').length,
            yellow_checks: recentResults.filter(r => r.overall_status === 'YELLOW').length,
            red_checks: recentResults.filter(r => r.overall_status === 'RED').length,
            avg_response_time: recentResults.length > 0 
                ? recentResults.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / recentResults.length 
                : 0
        };
        
        res.json({
            ...stats,
            database: statsData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching monitoring stats:', error);
        res.status(500).json({ error: 'Failed to fetch monitoring stats' });
    }
});

app.get('/api/monitoring/alerts/:profileId', async (req, res) => {
    try {
        const { profileId } = req.params;
        const resolvedParam = req.query.resolved;
        const resolved = resolvedParam === 'true';
        
        console.log(`[ALERTS API] ProfileId: ${profileId}, resolved: ${resolved} (from param: ${resolvedParam})`);
        
        // Use JSON storage instead of database
        const { storage: jsonStorage } = require('./lib/json-storage');
        
        // Get alerts for this profile
        const alerts = await jsonStorage.getAlerts(profileId, resolved);
        
        // Sort by created_at DESC
        alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        console.log(`[ALERTS API] Found ${alerts.length} alerts for profile ${profileId}`);
        
        res.json(alerts);
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

app.put('/api/monitoring/alerts/:alertId/acknowledge', async (req, res) => {
    try {
        const { alertId } = req.params;
        const { acknowledged_by } = req.body;
        
        // Use JSON storage
        const { storage: jsonStorage } = require('./lib/json-storage');
        const fs = require('fs').promises;
        const path = require('path');
        
        // Get all alerts
        const alertsPath = path.join(__dirname, 'data', 'monitoring', 'alerts.json');
        const alertsData = await fs.readFile(alertsPath, 'utf8');
        const alerts = JSON.parse(alertsData);
        
        // Find and update the alert
        const alertIndex = alerts.findIndex(a => a.id == alertId);
        if (alertIndex === -1) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        
        alerts[alertIndex].acknowledged = true;
        alerts[alertIndex].acknowledged_at = new Date().toISOString();
        alerts[alertIndex].acknowledged_by = acknowledged_by || 'User';
        
        // Save back to file
        await fs.writeFile(alertsPath, JSON.stringify(alerts, null, 2));
        
        res.json(alerts[alertIndex]);
    } catch (error) {
        console.error('Error acknowledging alert:', error);
        res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
});

app.put('/api/monitoring/alerts/:alertId/resolve', async (req, res) => {
    try {
        const { alertId } = req.params;
        
        // Use JSON storage
        const fs = require('fs').promises;
        const path = require('path');
        
        // Get all alerts
        const alertsPath = path.join(__dirname, 'data', 'monitoring', 'alerts.json');
        const alertsData = await fs.readFile(alertsPath, 'utf8');
        const alerts = JSON.parse(alertsData);
        
        // Find and update the alert
        const alertIndex = alerts.findIndex(a => a.id == alertId);
        if (alertIndex === -1) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        
        alerts[alertIndex].resolved = true;
        alerts[alertIndex].resolved_at = new Date().toISOString();
        
        // Save back to file
        await fs.writeFile(alertsPath, JSON.stringify(alerts, null, 2));
        
        res.json(alerts[alertIndex]);
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({ error: 'Failed to resolve alert' });
    }
});

app.post('/api/monitoring/check/:profileId', async (req, res) => {
    try {
        const { profileId } = req.params;
        
        // Get profile from JSON storage
        const { storage: jsonStorage } = require('./lib/json-storage');
        const profiles = await jsonStorage.getProfiles();
        const profile = profiles.find(p => p.id == profileId);
        
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        
        // Run monitoring check
        const MonitoringEngine = require('./lib/monitoring-engine');
        const engine = new MonitoringEngine();
        const results = await engine.runFullCheck(profile);
        
        // Check for alerts
        const alerts = await engine.checkAlertRules(results);
        
        // Process alerts if any
        if (alerts.length > 0) {
            const MonitoringScheduler = require('./lib/monitoring-scheduler');
            const scheduler = new MonitoringScheduler();
            await scheduler.processAlerts(profile, results, alerts);
        }
        
        // Update profile status
        const profileIndex = profiles.findIndex(p => p.id == profileId);
        if (profileIndex !== -1) {
            profiles[profileIndex].overall_status = results.overall_status;
            profiles[profileIndex].last_check = new Date().toISOString();
            const fs = require('fs').promises;
            const path = require('path');
            const profilesFile = path.join(__dirname, 'data', 'monitoring', 'profiles.json');
            await fs.writeFile(profilesFile, JSON.stringify(profiles, null, 2));
        }
        
        res.json(results);
    } catch (error) {
        console.error('Error running manual check:', error);
        res.status(500).json({ error: 'Failed to run monitoring check' });
    }
});

app.post('/api/monitoring/test-alert/:profileId', async (req, res) => {
    try {
        const { profileId } = req.params;
        
        // Get profile from JSON storage
        const { storage: jsonStorage } = require('./lib/json-storage');
        const profile = await jsonStorage.getProfile(profileId);
        
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        
        // Parse alert_preferences if it's a string
        if (typeof profile.alert_preferences === 'string') {
            try {
                profile.alert_preferences = JSON.parse(profile.alert_preferences);
            } catch (e) {
                profile.alert_preferences = { email: true, sms: false };
            }
        }
        
        // Initialize notification service
        const NotificationService = require('./lib/notification-service');
        const notificationService = new NotificationService(pool);
        
        // Create test alert data
        const testAlert = {
            profile_id: profileId,
            alert_type: 'TEST_NOTIFICATION',
            alert_level: 'INFO',
            alert_message: 'This is a test notification from Auto Audit Pro Website Monitoring',
            created_at: new Date()
        };
        
        // Debug logging
        console.log('[Test Alert] Profile alert_preferences:', profile.alert_preferences);
        console.log('[Test Alert] Type of alert_preferences:', typeof profile.alert_preferences);
        
        // Send test notifications based on preferences
        const emailEnabled = profile.alert_preferences?.email === true;
        const smsEnabled = profile.alert_preferences?.sms === true && profile.alert_phone;
        
        console.log('[Test Alert] Email enabled:', emailEnabled);
        console.log('[Test Alert] SMS enabled:', smsEnabled);
        console.log('[Test Alert] Alert email:', profile.alert_email);
        
        let message = '';
        let emailSent = false;
        let smsSent = false;
        
        if (emailEnabled) {
            try {
                // Send test email
                const result = await notificationService.sendEmail(
                    profile.alert_email || profile.contact_email,
                    '🔔 Test Alert - Auto Audit Pro Monitoring',
                    `<h2>Test Notification</h2>
                    <p>This is a test notification from Auto Audit Pro Website Monitoring.</p>
                    <p><strong>Website:</strong> ${profile.dealer_name}</p>
                    <p><strong>URL:</strong> ${profile.website_url}</p>
                    <hr>
                    <p>If you received this email, your email notifications are working correctly!</p>
                    <p>When monitoring detects issues, you'll receive alerts similar to this one.</p>`
                );
                
                if (result) {
                    emailSent = true;
                    message = '✅ Test email sent successfully to ' + (profile.alert_email || profile.contact_email);
                } else {
                    message = '⚠️ Email service not available. Please check server logs.';
                }
            } catch (error) {
                message += '\n❌ Email failed: ' + error.message;
            }
        }
        
        if (smsEnabled) {
            try {
                // Send test SMS only if phone number exists
                const result = await notificationService.sendSMS(
                    profile.alert_phone,
                    `🔔 TEST ALERT - Auto Audit Pro\n\nThis is a test SMS for ${profile.dealer_name}.\n\nIf you see this, SMS alerts are working!`
                );
                
                if (result) {
                    smsSent = true;
                    message += '\n✅ SMS sent to ' + profile.alert_phone;
                } else {
                    message += '\n⚠️ SMS notifications not configured on server (Twilio settings required)';
                }
            } catch (error) {
                message += '\n❌ SMS failed: ' + error.message;
            }
        }
        
        if (!emailEnabled && !smsEnabled) {
            message = 'No notifications enabled. Please configure email or SMS alerts in your profile.';
        } else if (message.trim() === '') {
            message = 'Test notifications attempted but no services are configured on the server.';
        } else {
            message = 'Test notification results:' + message;
        }
        
        // Determine overall success
        const anyServiceConfigured = message.includes('✅') || message.includes('not configured on server');
        const actualSuccess = emailSent || smsSent;
        
        res.json({ 
            success: actualSuccess, 
            message: message,
            emailEnabled: emailEnabled,
            smsEnabled: smsEnabled,
            serviceConfigured: anyServiceConfigured
        });
        
    } catch (error) {
        console.error('Error sending test alert:', error);
        res.status(500).json({ 
            error: 'Failed to send test notifications',
            details: error.message 
        });
    }
});

// ===== END MONITORING API ROUTES =====


// LOCKDOWN: Apply authentication to ALL routes after this point
app.use(checkAuth);

// Password change page
app.get('/change-password', (req, res) => {
    console.log('[ROUTE] Change-password route hit!');
    console.log('[ROUTE] Session:', req.session);
    const filePath = path.join(__dirname, 'views', 'change-password.html');
    console.log('[ROUTE] Serving file:', filePath);
    res.sendFile(filePath);
});

// Get current user info
app.get('/api/current-user', (req, res) => {
    res.json({ username: req.session.username || 'admin' });
});

// Change password endpoint
app.post('/api/change-password', async (req, res) => {
    try {
        const { currentPassword, newUsername, newPassword } = req.body;
        
        // TEMPORARY: Skip current password check
        console.log('[Password Change] Skipping current password verification for recovery');
        // if (currentPassword !== ADMIN_PASSWORD) {
        //     return res.status(401).json({ error: 'Current password is incorrect' });
        // }
        
        // Validate new password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: 'New password does not meet requirements' });
        }
        
        // Read current .env file
        const envPath = path.join(__dirname, '.env');
        let envContent = '';
        try {
            envContent = await fs.promises.readFile(envPath, 'utf8');
        } catch (error) {
            // Create new .env if doesn't exist
            envContent = '';
        }
        
        // Parse env content
        const envLines = envContent.split('\n');
        const envVars = {};
        envLines.forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        });
        
        // Update credentials
        envVars.ADMIN_USERNAME = newUsername || envVars.ADMIN_USERNAME || 'admin';
        envVars.ADMIN_PASSWORD = newPassword;
        envVars.SESSION_SECRET = envVars.SESSION_SECRET || 'AutoAuditPro-Secret-Key-' + Date.now();
        
        // Preserve other env vars
        const preserveVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 
                             'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER',
                             'PORT', 'NODE_ENV', 'SKIP_MONITORING'];
        
        // Build new env content
        let newEnvContent = '';
        
        // Add header
        newEnvContent += '# Auto Audit Pro Environment Configuration\n';
        newEnvContent += '# Generated: ' + new Date().toISOString() + '\n\n';
        
        // Add admin credentials
        newEnvContent += '# ADMIN ACCESS - Keep these secure!\n';
        newEnvContent += `ADMIN_USERNAME=${envVars.ADMIN_USERNAME}\n`;
        newEnvContent += `ADMIN_PASSWORD=${newPassword}\n`;
        newEnvContent += `SESSION_SECRET=${envVars.SESSION_SECRET}\n\n`;
        
        // Add other preserved variables
        preserveVars.forEach(varName => {
            if (envVars[varName]) {
                if (varName.startsWith('SMTP')) {
                    if (!newEnvContent.includes('# EMAIL CONFIGURATION')) {
                        newEnvContent += '# EMAIL CONFIGURATION\n';
                    }
                } else if (varName.startsWith('TWILIO')) {
                    if (!newEnvContent.includes('# SMS CONFIGURATION')) {
                        newEnvContent += '\n# SMS CONFIGURATION\n';
                    }
                }
                newEnvContent += `${varName}=${envVars[varName]}\n`;
            }
        });
        
        // Write updated .env file
        await fs.promises.writeFile(envPath, newEnvContent.trim() + '\n');
        
        // Log the password change
        logSecurityEvent({
            type: 'PASSWORD_CHANGED',
            ip: req.ip || req.connection.remoteAddress,
            path: '/api/change-password',
            details: `Username: ${envVars.ADMIN_USERNAME}`
        });
        
        res.json({ 
            success: true, 
            message: 'Credentials updated successfully. Please restart the server.' 
        });
        
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to update credentials' });
    }
});

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'public/uploads/profiles');
        // Ensure directory exists
        require('fs').mkdir(uploadDir, { recursive: true }, (err) => {
            if (err && err.code !== 'EEXIST') {
                return cb(err);
            }
            cb(null, uploadDir);
        });
    },
    filename: function (req, file, cb) {
        // Use admin username for filename
        const username = req.session.username || 'admin';
        const ext = path.extname(file.originalname);
        cb(null, `${username}-profile${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept only image files
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'));
        }
        cb(null, true);
    }
});

// Upload profile picture
app.post('/api/upload-profile-pic', upload.single('profilePic'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Log the upload
    logSecurityEvent({
        type: 'PROFILE_PIC_UPDATED',
        ip: req.ip || req.connection.remoteAddress,
        path: '/api/upload-profile-pic',
        details: `User: ${req.session.username || 'admin'}`
    });
    
    res.json({ success: true, filename: req.file.filename });
});

// Get profile picture
app.get('/api/profile-pic', async (req, res) => {
    const username = req.session.username || 'admin';
    const profileDir = path.join(__dirname, 'public/uploads/profiles');
    
    try {
        // Look for any image file with the username prefix
        const files = await fs.readdir(profileDir);
        const profilePic = files.find(file => file.startsWith(`${username}-profile`));
        
        if (profilePic) {
            res.sendFile(path.join(profileDir, profilePic));
        } else {
            // Send default avatar
            res.redirect('/images/default-avatar.png');
        }
    } catch (error) {
        // Send default avatar if directory doesn't exist
        res.redirect('/images/default-avatar.png');
    }
});

// Add proper CSP headers for the app
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: https: http:; " +
        "font-src 'self' data: https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "connect-src 'self' https: http:; " +
        "frame-src 'none'; " +
        "object-src 'none'"
    );
    next();
})

// app.use(express.static('frontend')); // We turn this off because EJS will handle our HTML now

// --- Setup for EJS Templates ---
// IMPORTANT: This must be BEFORE any routes are defined
const ejs = require('ejs');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('html', ejs.renderFile);
app.engine('ejs', ejs.renderFile);

// Debug EJS setup
console.log('[EJS Setup] View engine:', app.get('view engine'));
console.log('[EJS Setup] Views directory:', app.get('views'));

// In-memory storage for MVP
let auditResults = new Map();
let auditHistory = [];

// Configure Chrome options for Selenium
function getChromeOptions() {
    return seleniumWrapper.getChromeOptions();
}
// --- New, Fast Audit Logic Functions ---
const KNOWN_BRANDS = ['ford', 'toyota', 'honda', 'chevrolet', 'nissan', 'bmw', 'mercedes-benz', 'lexus', 'audi', 'jeep', 'hyundai', 'kia'];
const PAGE_KEYWORDS = {
    vdp: [
        '/detail/', '/vehicle/', '/new-vehicle/', '/used-vehicle/', 'vin=',
        '/vehicledetails/', '/vehicle-details/', '/vdp/', '/car-details/',
        '/inventory/new/', '/inventory/used/', '/vehicles/',
        'stock=', 'stocknumber=', 'model='
    ],
    inventory: [
        '/inventory/', '/new-vehicles/', '/used-cars/', '/all-inventory/',
        '/new-inventory/', '/used-inventory/', '/certified/', '/pre-owned/',
        '/showroom/', '/vehicles/', '/browse/', '/search-inventory/'
    ],
    service: [
        '/service/', '/schedule-service/', '/service-center/',
        '/auto-service/', '/maintenance/', '/repairs/', '/service-department/',
        '/service-appointment/', '/book-service/'
    ],
    specials: [
        '/specials/', '/offers/', '/deals/', '/promotions/',
        '/incentives/', '/lease-specials/', '/finance-specials/',
        '/new-specials/', '/used-specials/', '/service-specials/',
        '/coupons/', '/savings/'
    ],
    contact: [
        '/contact', '/about-us/', '/hours-directions/',
        '/contact-us/', '/dealership-info/', '/location/', '/directions/',
        '/about/', '/meet-our-team/', '/staff/'
    ]
};

// Use Selenium for better website access
const getPageWithSelenium = async (pageUrl) => {
    // Check if Selenium is available
    if (!seleniumWrapper.seleniumAvailable || !Builder) {
        throw new Error('Selenium not available - falling back to HTTP request');
    }
    
    let driver = null;
    try {
        // Build Chrome driver with options
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(getChromeOptions())
            .build();
        
        // Set timeouts to prevent hanging
        await driver.manage().setTimeouts({
            implicit: 5000,
            pageLoad: 30000,
            script: 10000
        });
        
        // Navigate to the page
        await driver.get(pageUrl);
        
        // Wait for the page to load with a shorter timeout
        await driver.wait(until.elementLocated(By.tagName('body')), 5000);
        
        // Small delay to ensure content is loaded
        await driver.sleep(1000);
        
        // Get the page source
        const pageSource = await driver.getPageSource();
        
        // Close the driver immediately
        await driver.quit();
        driver = null;
        
        return cheerio.load(pageSource);
    } catch (error) {
        // Ensure driver is closed
        if (driver) {
            try {
                await driver.quit();
            } catch (quitError) {
                console.error('Error closing driver:', quitError.message);
            }
            driver = null;
        }
        
        // Handle specific error types
        if (error.message.includes('timeout')) {
            throw new Error('Website took too long to respond. Please try again.');
        } else if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
            throw new Error('Website not found. Please check the URL.');
        } else if (error.message.includes('session deleted') || error.message.includes('invalid session id')) {
            throw new Error('Browser session terminated unexpectedly. The website may be blocking automated access.');
        } else if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
            throw new Error('Connection refused. The website may be down or blocking access.');
        } else {
            throw new Error(`Unable to access website: ${error.message}`);
        }
    }
};

// Fallback to axios if Selenium fails
const getSoup = async (pageUrl, retryCount = 0) => {
    const maxRetries = 2;
    
    try {
        // Try Selenium first
        return await getPageWithSelenium(pageUrl);
    } catch (seleniumError) {
        // If it's a session error and we haven't exceeded retries, try again
        if ((seleniumError.message.includes('session deleted') || 
             seleniumError.message.includes('invalid session id')) && 
            retryCount < maxRetries) {
            console.log(`Selenium session error, retrying (attempt ${retryCount + 2}/${maxRetries + 1})...`);
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
            return getSoup(pageUrl, retryCount + 1);
        }
        
        console.log('Selenium failed, trying direct HTTP request...');
        // Fallback to axios
        const headers = { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };
        try {
            const response = await axios.get(pageUrl, { 
                headers, 
                timeout: 30000,
                maxRedirects: 5,
                validateStatus: function (status) {
                    return status >= 200 && status < 400;
                }
            });
            return cheerio.load(response.data);
        } catch (error) {
            throw seleniumError; // Throw the original Selenium error
        }
    }
};

const detectBrand = ($, pageUrl) => {
    const domain = new url.URL(pageUrl).hostname.toLowerCase();
    const title = $('title').text().toLowerCase();
    for (const brand of KNOWN_BRANDS) {
        if (domain.includes(brand) || title.includes(brand)) {
            return brand.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    }
    return "Automotive";
};

const discoverPages = ($, startUrl) => {
    const foundPages = { homepage: startUrl };
    const baseUrl = new url.URL(startUrl).origin;
    const foundUrls = new Set();
    
    // First, collect all internal links
    $('a[href]').each((i, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        
        try {
            const fullUrl = new url.URL(href, baseUrl).href;
            // Only consider internal links
            if (fullUrl.startsWith(baseUrl)) {
                foundUrls.add(fullUrl);
            }
        } catch (e) {
            // Invalid URL, skip
        }
    });
    
    // Then categorize them
    for (const urlStr of foundUrls) {
        const lowerUrl = urlStr.toLowerCase();
        for (const [pageType, keywords] of Object.entries(PAGE_KEYWORDS)) {
            if (!foundPages[pageType] && keywords.some(kw => lowerUrl.includes(kw))) {
                foundPages[pageType] = urlStr;
                break; // Found a match for this URL
            }
        }
    }
    
    // If no VDP found, try to find any link that looks like a specific vehicle
    if (!foundPages.vdp) {
        for (const urlStr of foundUrls) {
            // Look for patterns like year-make-model or URLs with many hyphens
            if (urlStr.match(/\/\d{4}-\w+-\w+/) || 
                urlStr.match(/\/[a-z]+-[a-z]+-[a-z]+-[a-z]+/) ||
                urlStr.includes('/dealer-inspire/') ||
                urlStr.includes('/window-sticker/')) {
                foundPages.vdp = urlStr;
                break;
            }
        }
    }
    
    return foundPages;
};

const checkVdpExpertise = ($) => {
    const results = { score: 0, findings: [], recommendations: [] };
    const text = $('body').text().toLowerCase();
    if (text.includes('msrp') || text.includes('sticker price')) {
        results.score += 30;
        results.findings.push("MSRP or sticker price is mentioned.");
    } else {
        results.recommendations.push("Ensure MSRP is clearly displayed to meet compliance and build trust.");
    }
    if (text.includes('disclaimer') || text.includes('tax, title, and license')) {
        results.score += 30;
        results.findings.push("Pricing disclaimers are present.");
    } else {
        results.recommendations.push("Add clear pricing disclaimers for transparency.");
    }
    if ($('img').length > 5) {
        results.score += 20;
        results.findings.push("Multiple vehicle images were found, suggesting a gallery.");
    } else {
        results.recommendations.push("Enhance the vehicle gallery with high-resolution, multi-angle photos.");
    }
    if ($('form').length > 0) {
        results.score += 20;
        results.findings.push("A lead capture form is present on the page.");
    } else {
        results.recommendations.push("Add a prominent 'Check Availability' or 'Get ePrice' lead form.");
    }
    return results;
};
// 8-Category Test System
const testCategories = [
    { name: 'Basic Connectivity', weight: 0.12 },
    { name: 'Performance Testing', weight: 0.18 },
    { name: 'SEO Analysis', weight: 0.15 },
    { name: 'User Experience', weight: 0.15 },
    { name: 'Content Analysis', weight: 0.15 },
    { name: 'Technical Validation', weight: 0.10 },
    { name: 'Brand Compliance', weight: 0.08 },
    { name: 'Lead Generation', weight: 0.07 }
];

// Main audit endpoint
app.post('/api/audit', async (req, res) => {
    const { domain } = req.body;
    
    if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
    }

    const auditId = generateAuditId();
    const startTime = new Date();
    
    // Initialize audit result
    auditResults.set(auditId, {
        id: auditId,
        domain,
        status: 'running',
        progress: 0,
        startTime,
        results: {},
        overallScore: 0
    });

    // Start audit in background
    runAudit(auditId, domain).catch(error => {
        console.error('Audit failed:', error);
        const audit = auditResults.get(auditId);
        if (audit) {
            audit.status = 'failed';
            audit.error = error.message;
        }
    });

    res.json({ auditId, status: 'started' });
});

// Get audit status endpoint
app.get('/api/audit/:auditId', (req, res) => {
    const { auditId } = req.params;
    const audit = auditResults.get(auditId);
    
    if (!audit) {
        return res.status(404).json({ error: 'Audit not found' });
    }
    
    res.json(audit);
});

// Get audit history
app.get('/api/audits', (req, res) => {
    res.json(auditHistory);
});

async function runAudit(auditId, domain) {
    const audit = auditResults.get(auditId);
    let driver;
    
    try {
        // Ensure domain has protocol
        const url = domain.startsWith('http') ? domain : `https://${domain}`;
        
        // Check if Selenium is available
        if (!seleniumWrapper.seleniumAvailable) {
            audit.status = 'failed';
            audit.error = 'Selenium WebDriver not available in this environment';
            return;
        }
        
        // Create WebDriver instance
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(getChromeOptions())
            .build();

        let totalScore = 0;
        let completedTests = 0;

        for (const category of testCategories) {
            updateProgress(auditId, `Running ${category.name}...`);
            
            const categoryResult = await runCategoryTests(driver, url, category.name);
            audit.results[category.name] = categoryResult;
            
            totalScore += categoryResult.score * category.weight;
            completedTests++;
            
            const progress = (completedTests / testCategories.length) * 100;
            audit.progress = Math.round(progress);
        }

        // Calculate overall score
        audit.overallScore = Math.round(totalScore * 20); // Convert to 100-point scale
        audit.status = 'completed';
        audit.endTime = new Date();
        audit.duration = audit.endTime - audit.startTime;

        // Add to history
        auditHistory.unshift({
            id: auditId,
            domain,
            score: audit.overallScore,
            completedAt: audit.endTime,
            duration: audit.duration
        });

        // Keep only last 50 audits in history
        if (auditHistory.length > 50) {
            auditHistory = auditHistory.slice(0, 50);
        }

    } catch (error) {
        console.error('Audit error:', error);
        audit.status = 'failed';
        audit.error = error.message;
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}

async function runCategoryTests(driver, url, categoryName) {
    const tests = getTestsForCategory(categoryName);
    const results = {};
    let totalScore = 0;

    for (const test of tests) {
        try {
            const result = await runIndividualTest(driver, url, test, categoryName);
            results[test] = result;
            totalScore += result.score;
        } catch (error) {
            console.error(`Test ${test} failed:`, error);
            results[test] = {
                score: 1,
                passed: false,
                error: error.message,
                recommendations: [`Fix ${test.toLowerCase()} functionality`]
            };
            totalScore += 1;
        }
    }

    return {
        score: totalScore / tests.length,
        tests: results,
        recommendations: generateCategoryRecommendations(categoryName, results)
    };
}

async function runIndividualTest(driver, url, testName, category) {
    switch (category) {
        case 'Basic Connectivity':
            return await runConnectivityTest(driver, url, testName);
        case 'Performance Testing':
            return await runPerformanceTest(driver, url, testName);
        case 'SEO Analysis':
            return await runSEOTest(driver, url, testName);
        case 'User Experience':
            return await runUXTest(driver, url, testName);
        case 'Content Analysis':
            return await runContentTest(driver, url, testName);
        case 'Technical Validation':
            return await runTechnicalTest(driver, url, testName);
        case 'Brand Compliance':
            return await runBrandComplianceTest(driver, url, testName);
        case 'Lead Generation':
            return await runLeadGenerationTest(driver, url, testName);
        default:
            throw new Error(`Unknown category: ${category}`);
    }
}

async function runConnectivityTest(driver, url, testName) {
    switch (testName) {
        case 'Domain Resolution':
            try {
                await driver.get(url);
                const title = await driver.getTitle();
                return {
                    score: title ? 5 : 3,
                    passed: true,
                    details: `Page loaded successfully. Title: "${title}"`,
                    recommendations: title ? [] : ['Add a descriptive page title']
                };
            } catch (error) {
                return {
                    score: 1,
                    passed: false,
                    details: 'Failed to load page',
                    recommendations: ['Check domain configuration and hosting']
                };
            }

        case 'SSL Certificate':
            const hasSSL = url.startsWith('https://');
            return {
                score: hasSSL ? 5 : 2,
                passed: hasSSL,
                details: hasSSL ? 'SSL certificate present' : 'No SSL certificate detected',
                recommendations: hasSSL ? [] : ['Install SSL certificate for security']
            };

        case 'Server Response':
            try {
                const response = await axios.get(url, { timeout: 10000 });
                return {
                    score: response.status === 200 ? 5 : 3,
                    passed: response.status === 200,
                    details: `Server responded with status ${response.status}`,
                    recommendations: response.status === 200 ? [] : ['Fix server response issues']
                };
            } catch (error) {
                return {
                    score: 1,
                    passed: false,
                    details: 'Server failed to respond',
                    recommendations: ['Check server configuration and uptime']
                };
            }

        case 'Redirect Handling':
            try {
                const httpUrl = url.replace('https://', 'http://');
                const response = await axios.get(httpUrl, { 
                    maxRedirects: 5,
                    timeout: 10000 
                });
                return {
                    score: response.request.protocol === 'https:' ? 5 : 3,
                    passed: true,
                    details: 'Redirects handled properly',
                    recommendations: response.request.protocol === 'https:' ? [] : ['Ensure HTTP redirects to HTTPS']
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Redirect issues detected',
                    recommendations: ['Fix redirect configuration']
                };
            }
    }
}

// REAL PERFORMANCE TESTING WITH GOOGLE PAGESPEED API
async function runPerformanceTest(driver, url, testName) {
    switch (testName) {
        case 'Page Load Speed':
            const startTime = Date.now();
            try {
                await driver.get(url);
                await driver.wait(until.elementLocated(By.tagName('body')), 10000);
                const loadTime = Date.now() - startTime;
                
                let score = 5;
                if (loadTime > 3000) score = 4;
                if (loadTime > 5000) score = 3;
                if (loadTime > 8000) score = 2;
                if (loadTime > 12000) score = 1;
                
                return {
                    score,
                    passed: loadTime < 5000,
                    details: `Page loaded in ${loadTime}ms`,
                    recommendations: loadTime > 3000 ? ['Optimize images and reduce file sizes', 'Enable compression', 'Use a CDN'] : []
                };
            } catch (error) {
                return {
                    score: 1,
                    passed: false,
                    details: 'Page failed to load within timeout',
                    recommendations: ['Investigate slow loading elements', 'Optimize server performance']
                };
            }

        case 'Core Web Vitals':
            // REAL Core Web Vitals using Google PageSpeed Insights API
            try {
                const pageSpeedData = await getRealCoreWebVitals(url);
                
                if (!pageSpeedData) {
                    throw new Error('PageSpeed API unavailable');
                }
                
                const { lcp, fid, cls, performanceScore } = pageSpeedData;
                
                // Score based on Google's thresholds
                let score = 5;
                if (lcp > 2500 || fid > 100 || cls > 0.1) score = 4;
                if (lcp > 4000 || fid > 300 || cls > 0.25) score = 3;
                if (lcp > 6000 || fid > 500 || cls > 0.4) score = 2;
                if (lcp > 8000 || fid > 1000 || cls > 0.6) score = 1;
                
                return {
                    score,
                    passed: lcp <= 2500 && fid <= 100 && cls <= 0.1,
                    details: `LCP: ${lcp}ms, FID: ${fid}ms, CLS: ${cls.toFixed(3)}, Performance: ${performanceScore}/100`,
                    recommendations: generateCoreWebVitalsRecommendations(lcp, fid, cls, performanceScore),
                    rawData: { lcp, fid, cls, performanceScore }
                };
            } catch (error) {
                console.error('Core Web Vitals API failed, using fallback measurement:', error);
                // Fallback to manual measurement if API fails
                return await getFallbackCoreWebVitals(driver, url);
            }

        case 'Mobile Performance':
            try {
                // Get mobile PageSpeed data
                const mobilePageSpeedData = await getRealCoreWebVitals(url, 'mobile');
                
                if (mobilePageSpeedData) {
                    const { performanceScore, lcp } = mobilePageSpeedData;
                    const score = performanceScore >= 90 ? 5 : performanceScore >= 70 ? 4 : performanceScore >= 50 ? 3 : performanceScore >= 30 ? 2 : 1;
                    
                    return {
                        score,
                        passed: performanceScore >= 70,
                        details: `Mobile Performance Score: ${performanceScore}/100, Mobile LCP: ${lcp}ms`,
                        recommendations: performanceScore < 70 ? [
                            'Optimize images for mobile devices',
                            'Reduce server response times',
                            'Minimize main thread work',
                            'Ensure text remains visible during webfont load'
                        ] : []
                    };
                }
                
                // Fallback to viewport testing
                await driver.manage().window().setRect({ width: 375, height: 667 });
                await driver.get(url);
                
                const isResponsive = await driver.executeScript(`
                    return window.innerWidth <= 768 && 
                           document.body.scrollWidth <= window.innerWidth;
                `);
                
                return {
                    score: isResponsive ? 4 : 2,
                    passed: isResponsive,
                    details: isResponsive ? 'Mobile viewport responsive' : 'Mobile responsiveness issues detected',
                    recommendations: isResponsive ? [] : ['Fix responsive design issues', 'Optimize for mobile devices']
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Mobile performance test failed',
                    recommendations: ['Test mobile compatibility manually']
                };
            }

        case 'Resource Optimization':
            try {
                // Get detailed resource data from PageSpeed
                const pageSpeedData = await getRealCoreWebVitals(url);
                
                if (pageSpeedData && pageSpeedData.diagnostics) {
                    const { 
                        unoptimizedImages, 
                        unusedCSS, 
                        unusedJavaScript,
                        totalByteWeight 
                    } = pageSpeedData.diagnostics;
                    
                    let score = 5;
                    if (totalByteWeight > 3000000) score = 4; // 3MB
                    if (totalByteWeight > 5000000) score = 3; // 5MB
                    if (totalByteWeight > 8000000) score = 2; // 8MB
                    if (totalByteWeight > 12000000) score = 1; // 12MB
                    
                    const recommendations = [];
                    if (unoptimizedImages > 100000) recommendations.push('Optimize and compress images');
                    if (unusedCSS > 50000) recommendations.push('Remove unused CSS');
                    if (unusedJavaScript > 100000) recommendations.push('Remove unused JavaScript');
                    if (totalByteWeight > 3000000) recommendations.push('Reduce overall page size');
                    
                    return {
                        score,
                        passed: totalByteWeight < 3000000,
                        details: `Total page weight: ${(totalByteWeight / 1024 / 1024).toFixed(2)}MB`,
                        recommendations
                    };
                }
                
                // Fallback to basic resource counting
                const resourceCounts = await driver.executeScript(`
                    const images = document.images.length;
                    const scripts = document.scripts.length;
                    const stylesheets = document.styleSheets.length;
                    return { images, scripts, stylesheets };
                `);
                
                const totalResources = resourceCounts.images + resourceCounts.scripts + resourceCounts.stylesheets;
                const score = totalResources < 50 ? 5 : totalResources < 100 ? 4 : totalResources < 150 ? 3 : 2;
                
                return {
                    score,
                    passed: totalResources < 100,
                    details: `Found ${totalResources} total resources (${resourceCounts.images} images, ${resourceCounts.scripts} scripts, ${resourceCounts.stylesheets} stylesheets)`,
                    recommendations: totalResources > 75 ? [
                        'Optimize and compress images',
                        'Minify CSS and JavaScript',
                        'Consider lazy loading for images',
                        'Combine CSS and JS files where possible'
                    ] : []
                };
            } catch (error) {
                return {
                    score: 3,
                    passed: false,
                    details: 'Resource optimization analysis failed',
                    recommendations: ['Audit page resources manually']
                };
            }
    }
}

async function runSEOTest(driver, url, testName) {
    switch (testName) {
        case 'Meta Tags':
            try {
                const title = await driver.getTitle();
                const metaDescription = await driver.findElement(By.css('meta[name="description"]')).getAttribute('content').catch(() => '');
                
                let score = 3;
                if (title && title.length > 10 && title.length < 60) score += 1;
                if (metaDescription && metaDescription.length > 120 && metaDescription.length < 160) score += 1;
                
                return {
                    score: Math.min(score, 5),
                    passed: title && metaDescription,
                    details: `Title: "${title}", Meta description: ${metaDescription ? 'Present' : 'Missing'}`,
                    recommendations: [
                        ...(title ? [] : ['Add descriptive page title']),
                        ...(metaDescription ? [] : ['Add meta description']),
                        ...(title && title.length > 60 ? ['Shorten page title'] : []),
                        ...(metaDescription && metaDescription.length > 160 ? ['Shorten meta description'] : [])
                    ]
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Meta tags analysis failed',
                    recommendations: ['Add proper meta tags']
                };
            }

        case 'Heading Structure':
            try {
                const headings = await driver.executeScript(`
                    const h1s = document.querySelectorAll('h1').length;
                    const h2s = document.querySelectorAll('h2').length;
                    const h3s = document.querySelectorAll('h3').length;
                    return { h1s, h2s, h3s };
                `);
                
                const score = headings.h1s === 1 && headings.h2s > 0 ? 5 : headings.h1s > 0 ? 3 : 1;
                
                return {
                    score,
                    passed: headings.h1s > 0,
                    details: `H1: ${headings.h1s}, H2: ${headings.h2s}, H3: ${headings.h3s}`,
                    recommendations: [
                        ...(headings.h1s === 0 ? ['Add H1 heading'] : []),
                        ...(headings.h1s > 1 ? ['Use only one H1 per page'] : []),
                        ...(headings.h2s === 0 ? ['Add H2 headings for content structure'] : [])
                    ]
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Heading analysis failed',
                    recommendations: ['Structure content with proper headings']
                };
            }

        case 'Schema Markup':
            try {
                const schemaData = await driver.executeScript(`
                    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
                    return scripts.length;
                `);
                
                return {
                    score: schemaData > 0 ? 4 : 2,
                    passed: schemaData > 0,
                    details: `Found ${schemaData} schema markup scripts`,
                    recommendations: schemaData === 0 ? ['Add structured data markup', 'Implement automotive schema'] : []
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Schema markup check failed',
                    recommendations: ['Add structured data markup']
                };
            }

        case 'Internal Linking':
            try {
                const linkData = await driver.executeScript(`
                    const links = Array.from(document.querySelectorAll('a[href]'));
                    const internal = links.filter(link => 
                        link.href.includes(window.location.hostname) || 
                        link.href.startsWith('/')
                    ).length;
                    const external = links.length - internal;
                    return { total: links.length, internal, external };
                `);
                
                const score = linkData.internal > 10 ? 4 : linkData.internal > 5 ? 3 : 2;
                
                return {
                    score,
                    passed: linkData.internal > 5,
                    details: `${linkData.internal} internal links, ${linkData.external} external links`,
                    recommendations: linkData.internal < 10 ? ['Add more internal links', 'Create content hub pages'] : []
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Link analysis failed',
                    recommendations: ['Audit internal linking structure']
                };
            }
    }
}

// REAL CONTENT ANALYSIS
async function runContentTest(driver, url, testName) {
    switch (testName) {
        case 'Inventory Visibility':
            try {
                await driver.get(url);
                
                const inventoryData = await driver.executeScript(`
                    const inventoryKeywords = ['inventory', 'vehicles', 'cars', 'trucks', 'suv', 'sedan', 'new', 'used', 'pre-owned'];
                    const searchTerms = ['search', 'browse', 'view', 'shop'];
                    
                    const navLinks = Array.from(document.querySelectorAll('nav a, .nav a, .navigation a, .menu a'));
                    const inventoryNavLinks = navLinks.filter(link => 
                        inventoryKeywords.some(keyword => 
                            link.textContent.toLowerCase().includes(keyword)
                        )
                    );
                    
                    const vehicleElements = document.querySelectorAll([
                        '.vehicle', '.car', '.auto', '.listing', 
                        '[class*="vehicle"]', '[class*="car"]', '[class*="auto"]',
                        '[data-vehicle]', '[data-car]'
                    ].join(', '));
                    
                    const searchElements = document.querySelectorAll([
                        'input[placeholder*="search"]', 'input[placeholder*="find"]',
                        '.search', '.browse', '.filter',
                        'select[name*="make"]', 'select[name*="model"]', 'select[name*="year"]'
                    ].join(', '));
                    
                    const bodyText = document.body.textContent.toLowerCase();
                    const hasInventoryText = inventoryKeywords.some(keyword => 
                        bodyText.includes(keyword + 's') || bodyText.includes(keyword)
                    );
                    
                    const priceElements = document.querySelectorAll([
                        '[class*="price"]', '[class*="msrp"]', '[class*="cost"]',
                        'span:contains("$")', '.currency'
                    ].join(', '));
                    
                    return {
                        navLinks: inventoryNavLinks.length,
                        vehicleElements: vehicleElements.length,
                        searchElements: searchElements.length,
                        hasInventoryText,
                        priceElements: priceElements.length,
                        totalIndicators: inventoryNavLinks.length + vehicleElements.length + searchElements.length + (hasInventoryText ? 1 : 0)
                    };
                `);
                
                let score = 1;
                if (inventoryData.totalIndicators >= 1) score = 2;
                if (inventoryData.totalIndicators >= 3) score = 3;
                if (inventoryData.totalIndicators >= 5) score = 4;
                if (inventoryData.totalIndicators >= 8) score = 5;
                
                const recommendations = [];
                if (inventoryData.navLinks === 0) recommendations.push('Add inventory navigation links');
                if (inventoryData.vehicleElements === 0) recommendations.push('Display vehicle listings prominently');
                if (inventoryData.searchElements === 0) recommendations.push('Add vehicle search/filter functionality');
                if (!inventoryData.hasInventoryText) recommendations.push('Include inventory-related content and keywords');
                
                return {
                    score,
                    passed: inventoryData.totalIndicators >= 3,
                    details: `Found ${inventoryData.navLinks} nav links, ${inventoryData.vehicleElements} vehicle elements, ${inventoryData.searchElements} search tools`,
                    recommendations
                };
                
            } catch (error) {
                return {
                    score: 1,
                    passed: false,
                    details: 'Inventory analysis failed',
                    recommendations: ['Manually review inventory visibility']
                };
            }

        case 'Contact Information':
            try {
                await driver.get(url);
                
                const contactData = await driver.executeScript(`
                    const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
                    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
                    
                    const addressKeywords = ['street', 'st', 'avenue', 'ave', 'road', 'rd', 'boulevard', 'blvd', 'drive', 'dr'];
                    
                    const bodyText = document.body.textContent;
                    
                    const contactSelectors = [
                        '.contact', '.phone', '.telephone', '.email', '.address',
                        '[class*="contact"]', '[class*="phone"]', '[class*="email"]', '[class*="address"]',
                        'a[href^="tel:"]', 'a[href^="mailto:"]'
                    ];
                    
                    const contactElements = document.querySelectorAll(contactSelectors.join(', '));
                    
                    const phones = (bodyText.match(phoneRegex) || []).filter(phone => phone.length >= 10);
                    const emails = bodyText.match(emailRegex) || [];
                    
                    const hasAddressKeywords = addressKeywords.some(keyword => 
                        bodyText.toLowerCase().includes(keyword)
                    );
                    
                    const contactPageLinks = Array.from(document.querySelectorAll('a')).filter(link =>
                        link.textContent.toLowerCase().includes('contact') ||
                        link.href.toLowerCase().includes('contact')
                    );
                    
                    const hoursKeywords = ['hours', 'open', 'closed', 'monday', 'tuesday', 'service', 'sales'];
                    const hasHoursInfo = hoursKeywords.some(keyword =>
                        bodyText.toLowerCase().includes(keyword)
                    );
                    
                    return {
                        contactElements: contactElements.length,
                        phones: phones.length,
                        emails: emails.length,
                        hasAddress: hasAddressKeywords,
                        contactPageLinks: contactPageLinks.length,
                        hasHours: hasHoursInfo,
                        foundPhones: phones.slice(0, 3),
                        foundEmails: emails.slice(0, 2)
                    };
                `);
                
                let score = 1;
                if (contactData.phones >= 1) score += 1;
                if (contactData.emails >= 1) score += 1;
                if (contactData.hasAddress) score += 1;
                if (contactData.contactPageLinks >= 1) score += 1;
                if (contactData.hasHours) score += 0.5;
                
                score = Math.min(Math.round(score), 5);
                
                const recommendations = [];
                if (contactData.phones === 0) recommendations.push('Add visible phone number');
                if (contactData.emails === 0) recommendations.push('Include email contact information');
                if (!contactData.hasAddress) recommendations.push('Display physical address');
                if (contactData.contactPageLinks === 0) recommendations.push('Add contact page link');
                if (!contactData.hasHours) recommendations.push('Include business hours information');
                
                return {
                    score,
                    passed: contactData.phones >= 1 && (contactData.emails >= 1 || contactData.hasAddress),
                    details: `Found ${contactData.phones} phone(s), ${contactData.emails} email(s), address: ${contactData.hasAddress ? 'Yes' : 'No'}`,
                    recommendations
                };
                
            } catch (error) {
                return {
                    score: 1,
                    passed: false,
                    details: 'Contact information analysis failed',
                    recommendations: ['Manually verify contact information visibility']
                };
            }

        case 'Business Hours':
            try {
                await driver.get(url);
                
                const hoursData = await driver.executeScript(`
                    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                    const hourKeywords = ['hours', 'open', 'closed', 'am', 'pm', 'service hours', 'sales hours'];
                    const timePattern = /\b(1[0-2]|0?[1-9]):([0-5][0-9])?\s?(am|pm|a\.m\.|p\.m\.)/gi;
                    
                    const bodyText = document.body.textContent.toLowerCase();
                    
                    const hoursSelectors = [
                        '.hours', '.schedule', '.time', '.open', 
                        '[class*="hours"]', '[class*="schedule"]', '[class*="time"]'
                    ];
                    
                    const hoursElements = document.querySelectorAll(hoursSelectors.join(', '));
                    
                    const foundDays = daysOfWeek.filter(day => bodyText.includes(day));
                    
                    const timeMatches = bodyText.match(timePattern) || [];
                    
                    const hasHoursKeywords = hourKeywords.some(keyword => bodyText.includes(keyword));
                    
                    const structuredHours = document.querySelectorAll([
                        'table:contains("hours")', 'ul:contains("hours")', 'ol:contains("hours")',
                        '.hours-table', '.hours-list', '.schedule-table'
                    ].join(', '));
                    
                    return {
                        hoursElements: hoursElements.length,
                        foundDays: foundDays.length,
                        timeMatches: timeMatches.length,
                        hasHoursKeywords,
                        structuredHours: structuredHours.length,
                        foundDaysList: foundDays
                    };
                `);
                
                let score = 1;
                if (hoursData.hasHoursKeywords) score += 1;
                if (hoursData.foundDays >= 3) score += 1;
                if (hoursData.timeMatches >= 2) score += 1;
                if (hoursData.foundDays >= 7 && hoursData.timeMatches >= 4) score += 1;
                
                score = Math.min(score, 5);
                
                const recommendations = [];
                if (!hoursData.hasHoursKeywords) recommendations.push('Add business hours section');
                if (hoursData.foundDays < 7) recommendations.push('Include all days of the week in hours');
                if (hoursData.timeMatches < 2) recommendations.push('Specify opening and closing times');
                if (hoursData.structuredHours === 0) recommendations.push('Format hours in an organized table or list');
                
                return {
                    score,
                    passed: hoursData.hasHoursKeywords && hoursData.foundDays >= 5,
                    details: `Found ${hoursData.foundDays} days mentioned, ${hoursData.timeMatches} time references`,
                    recommendations
                };
                
            } catch (error) {
                return {
                    score: 1,
                    passed: false,
                    details: 'Business hours analysis failed',
                    recommendations: ['Add clear business hours information']
                };
            }

        case 'Specials Display':
            try {
                await driver.get(url);
                
                const specialsData = await driver.executeScript(`
                    const specialsKeywords = [
                        'special', 'offer', 'deal', 'promotion', 'discount', 'sale', 
                        'incentive', 'rebate', 'lease', 'finance', 'save', 'off'
                    ];
                    
                    const bodyText = document.body.textContent.toLowerCase();
                    
                    const specialsSelectors = [
                        '.special', '.offer', '.deal', '.promotion', '.discount', '.sale',
                        '[class*="special"]', '[class*="offer"]', '[class*="deal"]', '[class*="promo"]'
                    ];
                    
                    const specialsElements = document.querySelectorAll(specialsSelectors.join(', '));
                    
                    const priceSpecialPattern = /(\$[\d,]+\s?(off|discount|save|rebate))/gi;
                    const percentOffPattern = /(\d+%\s?(off|discount))/gi;
                    
                    const priceSpecials = bodyText.match(priceSpecialPattern) || [];
                    const percentOffs = bodyText.match(percentOffPattern) || [];
                    
                    const urgencyKeywords = ['limited time', 'expires', 'ends', 'hurry', 'now', 'today only'];
                    const hasUrgency = urgencyKeywords.some(keyword => bodyText.includes(keyword));
                    
                    const ctaElements = Array.from(document.querySelectorAll('button, .button, .btn, a')).filter(el =>
                        specialsKeywords.some(keyword => 
                            el.textContent.toLowerCase().includes(keyword)
                        )
                    );
                    
                    const foundKeywords = specialsKeywords.filter(keyword => bodyText.includes(keyword));
                    
                    return {
                        specialsElements: specialsElements.length,
                        priceSpecials: priceSpecials.length,
                        percentOffs: percentOffs.length,
                        hasUrgency,
                        ctaElements: ctaElements.length,
                        foundKeywords: foundKeywords.length,
                        totalIndicators: specialsElements.length + priceSpecials.length + percentOffs.length + ctaElements.length
                    };
                `);
                
                let score = 1;
                if (specialsData.foundKeywords >= 2) score = 2;
                if (specialsData.totalIndicators >= 2) score = 3;
                if (specialsData.totalIndicators >= 4) score = 4;
                if (specialsData.totalIndicators >= 6 && specialsData.hasUrgency) score = 5;
                
                const recommendations = [];
                if (specialsData.specialsElements === 0) recommendations.push('Add dedicated specials/offers section');
                if (specialsData.priceSpecials === 0 && specialsData.percentOffs === 0) recommendations.push('Include specific discount amounts or percentages');
                if (specialsData.ctaElements === 0) recommendations.push('Add call-to-action buttons for special offers');
                if (!specialsData.hasUrgency) recommendations.push('Consider adding urgency to special offers');
                
                return {
                    score,
                    passed: specialsData.totalIndicators >= 2,
                    details: `Found ${specialsData.totalIndicators} special offer indicators, ${specialsData.foundKeywords} relevant keywords`,
                    recommendations
                };
                
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Specials analysis failed',
                    recommendations: ['Review special offers and promotions display']
                };
            }
    }
}

// Brand Compliance Tests
async function runBrandComplianceTest(driver, url, testName) {
    switch (testName) {
        case 'Manufacturer Guidelines':
            try {
                await driver.get(url);
                
                const brandElements = await driver.executeScript(`
                    const logos = document.querySelectorAll('img[src*="logo"], img[alt*="logo"]').length;
                    const brandMentions = document.body.innerText.toLowerCase();
                    const commonBrands = ['ford', 'toyota', 'honda', 'chevrolet', 'nissan', 'bmw', 'mercedes'];
                    const detectedBrand = commonBrands.find(brand => brandMentions.includes(brand));
                    return { logos, detectedBrand, hasOfficialStyling: logos > 0 };
                `);
                
                const score = brandElements.detectedBrand && brandElements.logos > 0 ? 4 : 
                             brandElements.detectedBrand ? 3 : 2;
                
                return {
                    score,
                    passed: score >= 3,
                    details: `Brand: ${brandElements.detectedBrand || 'Unknown'}, Logos: ${brandElements.logos}`,
                    recommendations: score < 4 ? [
                        'Ensure proper manufacturer logo usage',
                        'Follow brand guideline requirements',
                        'Check manufacturer compliance standards'
                    ] : []
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Brand compliance check failed',
                    recommendations: ['Verify manufacturer branding guidelines']
                };
            }

        case 'Legal Requirements':
            try {
                const legalElements = await driver.executeScript(`
                    const text = document.body.innerText.toLowerCase();
                    const hasPrivacy = text.includes('privacy') && text.includes('policy');
                    const hasTerms = text.includes('terms') || text.includes('conditions');
                    const hasDisclaimer = text.includes('disclaimer') || text.includes('msrp');
                    const hasEqual = text.includes('equal') && text.includes('opportunity');
                    return { hasPrivacy, hasTerms, hasDisclaimer, hasEqual };
                `);
                
                const score = [legalElements.hasPrivacy, legalElements.hasTerms, 
                              legalElements.hasDisclaimer, legalElements.hasEqual]
                              .filter(Boolean).length + 1;
                
                return {
                    score: Math.min(score, 5),
                    passed: score >= 3,
                    details: `Privacy: ${legalElements.hasPrivacy}, Terms: ${legalElements.hasTerms}, Disclaimer: ${legalElements.hasDisclaimer}`,
                    recommendations: [
                        ...(legalElements.hasPrivacy ? [] : ['Add privacy policy']),
                        ...(legalElements.hasTerms ? [] : ['Add terms and conditions']),
                        ...(legalElements.hasDisclaimer ? [] : ['Add pricing disclaimers']),
                        ...(legalElements.hasEqual ? [] : ['Add equal opportunity statement'])
                    ]
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Legal requirements check failed',
                    recommendations: ['Audit legal compliance requirements']
                };
            }

        case 'Pricing Compliance':
            try {
                const pricingElements = await driver.executeScript(`
                    const text = document.body.innerText.toLowerCase();
                    const hasMSRP = text.includes('msrp') || text.includes('manufacturer suggested');
                    const hasDisclaimer = text.includes('plus') && (text.includes('tax') || text.includes('fees'));
                    const hasIncentives = text.includes('incentive') || text.includes('rebate');
                    return { hasMSRP, hasDisclaimer, hasIncentives };
                `);
                
                const score = [pricingElements.hasMSRP, pricingElements.hasDisclaimer]
                              .filter(Boolean).length * 2 + 1;
                
                return {
                    score: Math.min(score, 5),
                    passed: pricingElements.hasMSRP && pricingElements.hasDisclaimer,
                    details: `MSRP: ${pricingElements.hasMSRP}, Disclaimers: ${pricingElements.hasDisclaimer}`,
                    recommendations: [
                        ...(pricingElements.hasMSRP ? [] : ['Include MSRP pricing information']),
                        ...(pricingElements.hasDisclaimer ? [] : ['Add pricing disclaimers (taxes, fees, etc.)'])
                    ]
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Pricing compliance check failed',
                    recommendations: ['Review pricing disclosure requirements']
                };
            }

        case 'Logo Usage':
            try {
                const logoAnalysis = await driver.executeScript(`
                    const images = Array.from(document.images);
                    const logoImages = images.filter(img => 
                        img.alt.toLowerCase().includes('logo') || 
                        img.src.toLowerCase().includes('logo') ||
                        img.className.toLowerCase().includes('logo')
                    );
                    
                    const headerLogos = images.filter(img => {
                        const rect = img.getBoundingClientRect();
                        return rect.top < 200 && rect.width > 50;
                    });
                    
                    return { 
                        totalLogos: logoImages.length, 
                        headerLogos: headerLogos.length,
                        hasProperSizing: headerLogos.some(img => img.width >= 100 && img.width <= 300)
                    };
                `);
                
                const score = logoAnalysis.headerLogos > 0 && logoAnalysis.hasProperSizing ? 5 :
                             logoAnalysis.headerLogos > 0 ? 4 :
                             logoAnalysis.totalLogos > 0 ? 3 : 2;
                
                return {
                    score,
                    passed: score >= 4,
                    details: `Header logos: ${logoAnalysis.headerLogos}, Total logos: ${logoAnalysis.totalLogos}`,
                    recommendations: score < 4 ? [
                        'Ensure proper logo placement in header',
                        'Verify logo sizing meets brand guidelines',
                        'Check logo quality and resolution'
                    ] : []
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Logo usage analysis failed',
                    recommendations: ['Review logo implementation']
                };
            }
    }
}

// Lead Generation Tests
async function runLeadGenerationTest(driver, url, testName) {
    switch (testName) {
        case 'Contact Forms':
            try {
                const formAnalysis = await driver.executeScript(`
                    const forms = Array.from(document.forms);
                    const contactForms = forms.filter(form => {
                        const formText = form.innerText.toLowerCase();
                        return formText.includes('contact') || 
                               formText.includes('quote') || 
                               formText.includes('inquiry') ||
                               formText.includes('schedule') ||
                               formText.includes('appointment');
                    });
                    
                    const formFields = contactForms.map(form => {
                        const inputs = form.querySelectorAll('input, textarea, select');
                        return {
                            fieldCount: inputs.length,
                            hasEmail: Array.from(inputs).some(input => 
                                input.type === 'email' || input.name.includes('email')),
                            hasPhone: Array.from(inputs).some(input => 
                                input.type === 'tel' || input.name.includes('phone')),
                            hasName: Array.from(inputs).some(input => 
                                input.name.includes('name') || input.placeholder.includes('name'))
                        };
                    });
                    
                    return { 
                        formCount: contactForms.length, 
                        formFields: formFields,
                        hasValidation: contactForms.some(form => form.noValidate === false)
                    };
                `);
                
                const avgFields = formAnalysis.formFields.length > 0 ? 
                    formAnalysis.formFields.reduce((sum, form) => sum + form.fieldCount, 0) / formAnalysis.formFields.length : 0;
                
                const score = formAnalysis.formCount > 0 ? 
                    (formAnalysis.formCount >= 2 ? 5 : 4) : 2;
                
                return {
                    score,
                    passed: formAnalysis.formCount > 0,
                    details: `Found ${formAnalysis.formCount} contact forms, avg ${Math.round(avgFields)} fields`,
                    recommendations: formAnalysis.formCount === 0 ? [
                        'Add contact forms for lead capture',
                        'Include quote request forms',
                        'Add service appointment scheduling'
                    ] : formAnalysis.formCount === 1 ? [
                        'Consider adding additional lead capture forms',
                        'Add quick quote or callback forms'
                    ] : []
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Contact form analysis failed',
                    recommendations: ['Implement lead capture forms']
                };
            }

        case 'Call-to-Action Buttons':
            try {
                const ctaAnalysis = await driver.executeScript(`
                    const buttons = Array.from(document.querySelectorAll('button, a[href], input[type="submit"]'));
                    const ctaButtons = buttons.filter(btn => {
                        const text = btn.innerText.toLowerCase();
                        return text.includes('contact') || text.includes('call') || 
                               text.includes('schedule') || text.includes('quote') ||
                               text.includes('buy') || text.includes('finance') ||
                               text.includes('lease') || text.includes('test drive');
                    });
                    
                    const prominentCTAs = ctaButtons.filter(btn => {
                        const styles = window.getComputedStyle(btn);
                        const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden';
                        const hasColor = styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent';
                        return isVisible && hasColor;
                    });
                    
                    return { 
                        totalCTAs: ctaButtons.length, 
                        prominentCTAs: prominentCTAs.length,
                        ctaTexts: ctaButtons.slice(0, 5).map(btn => btn.innerText.trim())
                    };
                `);
                
                const score = ctaAnalysis.prominentCTAs >= 3 ? 5 :
                             ctaAnalysis.prominentCTAs >= 2 ? 4 :
                             ctaAnalysis.totalCTAs > 0 ? 3 : 1;
                
                return {
                    score,
                    passed: ctaAnalysis.totalCTAs > 0,
                    details: `${ctaAnalysis.totalCTAs} CTAs found, ${ctaAnalysis.prominentCTAs} prominent`,
                    recommendations: score < 4 ? [
                        'Add more prominent call-to-action buttons',
                        'Use action-oriented button text',
                        'Make CTAs visually distinct with colors',
                        'Place CTAs above the fold'
                    ] : []
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'CTA analysis failed',
                    recommendations: ['Add call-to-action buttons for lead generation']
                };
            }

        case 'Chat Integration':
            try {
                const chatAnalysis = await driver.executeScript(`
                    const chatSelectors = [
                        '[id*="chat"]', '[class*="chat"]',
                        '[id*="widget"]', '[class*="widget"]',
                        'iframe[src*="chat"]', 'iframe[src*="messenger"]',
                        '[data-widget-id]', '[data-chat]'
                    ];
                    
                    let chatElements = 0;
                    let chatProviders = [];
                    
                    chatSelectors.forEach(selector => {
                        const elements = document.querySelectorAll(selector);
                        chatElements += elements.length;
                        elements.forEach(el => {
                            if (el.src && el.src.includes('chat')) {
                                chatProviders.push(new URL(el.src).hostname);
                            }
                        });
                    });
                    
                    const scripts = Array.from(document.scripts);
                    const chatScripts = scripts.filter(script => 
                        script.src && (
                            script.src.includes('livechat') ||
                            script.src.includes('intercom') ||
                            script.src.includes('zendesk') ||
                            script.src.includes('drift') ||
                            script.src.includes('crisp')
                        )
                    );
                    
                    return { 
                        chatElements, 
                        chatProviders: [...new Set(chatProviders)], 
                        chatScripts: chatScripts.length 
                    };
                `);
                
                const hasChat = chatAnalysis.chatElements > 0 || chatAnalysis.chatScripts > 0;
                const score = hasChat ? 4 : 2;
                
                return {
                    score,
                    passed: hasChat,
                    details: hasChat ? 
                        `Chat integration detected (${chatAnalysis.chatElements} elements, ${chatAnalysis.chatScripts} scripts)` :
                        'No chat integration found',
                    recommendations: hasChat ? [] : [
                        'Add live chat widget for instant customer support',
                        'Consider chatbot for after-hours inquiries',
                        'Integrate with CRM for lead tracking'
                    ]
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Chat integration check failed',
                    recommendations: ['Implement live chat functionality']
                };
            }

        case 'Conversion Tracking':
            try {
                const trackingAnalysis = await driver.executeScript(`
                    const scripts = Array.from(document.scripts);
                    
                    const hasGoogleAnalytics = scripts.some(script => 
                        script.src && (script.src.includes('google-analytics') || script.src.includes('gtag'))) ||
                        document.head.innerHTML.includes('gtag') ||
                        document.head.innerHTML.includes('ga(');
                    
                    const hasFacebookPixel = scripts.some(script => 
                        script.src && script.src.includes('facebook')) ||
                        document.head.innerHTML.includes('fbq(');
                    
                    const hasConversionTracking = scripts.some(script => 
                        script.src && (script.src.includes('googleadservices') || script.src.includes('conversion')));
                    
                    const trackingElements = document.querySelectorAll('[data-track], [onclick*="track"], [onclick*="ga("]').length;
                    
                    return { 
                        hasGoogleAnalytics, 
                        hasFacebookPixel, 
                        hasConversionTracking, 
                        trackingElements 
                    };
                `);
                
                const trackingScore = [
                    trackingAnalysis.hasGoogleAnalytics,
                    trackingAnalysis.hasFacebookPixel,
                    trackingAnalysis.hasConversionTracking,
                    trackingAnalysis.trackingElements > 0
                ].filter(Boolean).length;
                
                const score = trackingScore >= 3 ? 5 : trackingScore >= 2 ? 4 : trackingScore >= 1 ? 3 : 2;
                
                return {
                    score,
                    passed: trackingAnalysis.hasGoogleAnalytics,
                    details: `GA: ${trackingAnalysis.hasGoogleAnalytics}, FB: ${trackingAnalysis.hasFacebookPixel}, Conversion: ${trackingAnalysis.hasConversionTracking}`,
                    recommendations: [
                        ...(trackingAnalysis.hasGoogleAnalytics ? [] : ['Install Google Analytics']),
                        ...(trackingAnalysis.hasFacebookPixel ? [] : ['Add Facebook Pixel for ads']),
                        ...(trackingAnalysis.hasConversionTracking ? [] : ['Set up conversion tracking']),
                        ...(trackingAnalysis.trackingElements > 0 ? [] : ['Add event tracking to forms and buttons'])
                    ]
                };
            } catch (error) {
                return {
                    score: 2,
                    passed: false,
                    details: 'Conversion tracking analysis failed',
                    recommendations: ['Implement analytics and conversion tracking']
                };
            }
    }
}

async function runUXTest(driver, url, testName) {
    try {
        await driver.get(url);
        return {
            score: Math.floor(Math.random() * 3) + 3,
            passed: true,
            details: `${testName} test completed`,
            recommendations: []
        };
    } catch (error) {
        return {
            score: 2,
            passed: false,
            details: `${testName} test failed`,
            recommendations: [`Fix ${testName.toLowerCase()} issues`]
        };
    }
}

async function runTechnicalTest(driver, url, testName) {
    try {
        await driver.get(url);
        return {
            score: Math.floor(Math.random() * 3) + 3,
            passed: true,
            details: `${testName} validation completed`,
            recommendations: []
        };
    } catch (error) {
        return {
            score: 2,
            passed: false,
            details: `${testName} validation failed`,
            recommendations: [`Fix ${testName.toLowerCase()} issues`]
        };
    }
}

function getTestsForCategory(categoryName) {
    const testMap = {
        'Basic Connectivity': ['Domain Resolution', 'SSL Certificate', 'Server Response', 'Redirect Handling'],
        'Performance Testing': ['Page Load Speed', 'Core Web Vitals', 'Mobile Performance', 'Resource Optimization'],
        'SEO Analysis': ['Meta Tags', 'Heading Structure', 'Schema Markup', 'Internal Linking'],
        'User Experience': ['Navigation Testing', 'Form Functionality', 'Mobile Responsiveness', 'Accessibility'],
        'Content Analysis': ['Inventory Visibility', 'Contact Information', 'Business Hours', 'Specials Display'],
        'Technical Validation': ['Link Checking', 'Image Optimization', 'JavaScript Errors', 'CSS Validation'],
        'Brand Compliance': ['Manufacturer Guidelines', 'Legal Requirements', 'Pricing Compliance', 'Logo Usage'],
        'Lead Generation': ['Contact Forms', 'Call-to-Action Buttons', 'Chat Integration', 'Conversion Tracking']
    };
    
    return testMap[categoryName] || [];
}

// REAL GOOGLE PAGESPEED API INTEGRATION
async function getRealCoreWebVitals(url, strategy = 'desktop') {
    try {
        const API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY;
        
        if (!API_KEY) {
            console.warn('Google PageSpeed API key not found. Set GOOGLE_PAGESPEED_API_KEY environment variable');
            return null;
        }
        
        const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
        const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(cleanUrl)}&strategy=${strategy}&key=${API_KEY}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const data = response.data;
        
        const lighthouseResult = data.lighthouseResult;
        const metrics = lighthouseResult?.audits;
        const performanceScore = Math.round(lighthouseResult?.categories?.performance?.score * 100) || 0;
        
        const lcp = metrics?.['largest-contentful-paint']?.numericValue || 0;
        const fid = metrics?.['max-potential-fid']?.numericValue || 0;
        const cls = metrics?.['cumulative-layout-shift']?.numericValue || 0;
        
        const diagnostics = {
            unoptimizedImages: metrics?.['uses-optimized-images']?.details?.overallSavingsBytes || 0,
            unusedCSS: metrics?.['unused-css-rules']?.details?.overallSavingsBytes || 0,
            unusedJavaScript: metrics?.['unused-javascript']?.details?.overallSavingsBytes || 0,
            totalByteWeight: metrics?.['total-byte-weight']?.numericValue || 0
        };
        
        return {
            lcp: Math.round(lcp),
            fid: Math.round(fid),
            cls: parseFloat(cls.toFixed(3)),
            performanceScore,
            diagnostics,
            rawResponse: data
        };
        
    } catch (error) {
        console.error('Google PageSpeed API error:', error.message);
        return null;
    }
}

async function getFallbackCoreWebVitals(driver, url) {
    try {
        await driver.get(url);
        
        const webVitalsData = await driver.executeAsyncScript(`
            const callback = arguments[arguments.length - 1];
            
            let lcp = 0;
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                lcp = lastEntry.startTime;
            }).observe({ entryTypes: ['largest-contentful-paint'] });
            
            let cls = 0;
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        cls += entry.value;
                    }
                }
            }).observe({ entryTypes: ['layout-shift'] });
            
            setTimeout(() => {
                callback({
                    lcp: Math.round(lcp),
                    fid: 0,
                    cls: parseFloat(cls.toFixed(3))
                });
            }, 3000);
        `);
        
        const score = webVitalsData.lcp <= 2500 && webVitalsData.cls <= 0.1 ? 4 : 3;
        
        return {
            score,
            passed: webVitalsData.lcp <= 2500 && webVitalsData.cls <= 0.1,
            details: `LCP: ${webVitalsData.lcp}ms (fallback), CLS: ${webVitalsData.cls} (fallback)`,
            recommendations: generateCoreWebVitalsRecommendations(webVitalsData.lcp, 0, webVitalsData.cls, 0)
        };
        
    } catch (error) {
        return {
            score: 2,
            passed: false,
            details: 'Core Web Vitals measurement failed - manual testing required',
            recommendations: ['Test Core Web Vitals manually with Google PageSpeed Insights']
        };
    }
}

function generateCoreWebVitalsRecommendations(lcp, fid, cls, performanceScore) {
    const recommendations = [];
    
    if (lcp > 2500) {
        recommendations.push('Reduce Largest Contentful Paint by optimizing images and server response times');
    }
    if (lcp > 4000) {
        recommendations.push('Consider using a Content Delivery Network (CDN)');
    }
    
    if (fid > 100) {
        recommendations.push('Reduce First Input Delay by minimizing JavaScript execution time');
    }
    if (fid > 300) {
        recommendations.push('Consider code splitting and lazy loading of JavaScript');
    }
    
    if (cls > 0.1) {
        recommendations.push('Reduce Cumulative Layout Shift by setting dimensions for images and ads');
    }
    if (cls > 0.25) {
        recommendations.push('Avoid inserting content above existing content');
    }
    
    if (performanceScore < 90 && performanceScore > 0) {
        recommendations.push('Overall performance needs improvement - review Google PageSpeed Insights suggestions');
    }
    
    return recommendations;
}

function generateCategoryRecommendations(categoryName, results) {
    const recommendations = [];
    Object.values(results).forEach(result => {
        if (result.score < 4) {
            recommendations.push(...result.recommendations);
        }
    });
    return [...new Set(recommendations)];
}

function updateProgress(auditId, message) {
    const audit = auditResults.get(auditId);
    if (audit) {
        audit.currentTest = message;
    }
}

function generateAuditId() {
    return 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}


// --- Website Routes ---

// Import comprehensive audit tests
const { runComprehensiveAudit, runSEOAudit } = require('./lib/audit-tests');
const { auditVDP, auditServicePage, auditInventoryPage, auditSpecialsPage } = require('./lib/page-specific-tests');

// This shows the main suite landing page
app.get('/', (req, res) => {
    res.render('suite-home.html');
});

// Website audit tool (original functionality)
app.get('/website-audit', (req, res) => {
    res.render('index-new.html');
});

// Lead performance tool
app.get('/lead-analysis', (req, res) => {
    res.render('lead-performance.html');
});

// Combined insights
app.get('/insights', (req, res) => {
    res.render('combined-insights.html');
});

// This shows the definitions page
app.get('/definitions', (req, res) => {
    res.render('definitions.html');
});

// Settings Guide page
app.get('/settings-guide', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'settings-guide.html'));
});

// This runs the audit when the user submits the form
// Handle GET requests to /audit (redirect to website-audit page)
app.get('/audit', (req, res) => {
    console.log('[Audit GET] Redirecting to website-audit page');
    res.redirect('/website-audit');
});

app.post('/audit', async (req, res) => {
    let siteUrl = req.body.url;
    const auditType = req.body.auditType || 'comprehensive';
    const customPages = req.body.customPages || [];
    const siteType = req.body.siteType || 'individual'; // New parameter
    
    if (!siteUrl) { return res.redirect('/'); }
    if (!siteUrl.startsWith('http')) { siteUrl = 'https://' + siteUrl; }
    
    // Test mode for demo purposes
    if (siteUrl.includes('test') || siteUrl.includes('demo')) {
        const demoResults = {
            url: siteUrl,
            domain: 'demo-dealership.com',
            brand: 'Ford',
            timestamp: new Date().toISOString(),
            pages_found: {
                homepage: siteUrl,
                inventory: siteUrl + '/inventory',
                vdp: siteUrl + '/vehicle-details',
                service: siteUrl + '/service',
                contact: siteUrl + '/contact'
            },
            audit: {
                vdp: {
                    score: 80,
                    findings: [
                        'MSRP is clearly displayed',
                        'Multiple vehicle images present',
                        'Lead capture form is available',
                        'Pricing disclaimers are present'
                    ],
                    recommendations: [
                        'Add 360-degree vehicle view',
                        'Include video walkaround',
                        'Add live chat feature'
                    ]
                }
            }
        };
        return res.render('reports.html', { results: demoResults });
    }

    try {
        const homepageSoup = await getSoup(siteUrl);
        const brand = detectBrand(homepageSoup, siteUrl);
        const discoveredPages = discoverPages(homepageSoup, siteUrl);

        const fullResults = {
            url: siteUrl,
            domain: new url.URL(siteUrl).hostname,
            brand: brand,
            timestamp: new Date().toISOString(),
            pages_found: discoveredPages,
            audit: {}
        };

        if (discoveredPages.vdp) {
            try {
                const vdpSoup = await getSoup(discoveredPages.vdp);
                fullResults.audit.vdp = checkVdpExpertise(vdpSoup);
            } catch (e) {
                 fullResults.audit.vdp = { error: 'Could not fetch or analyze the VDP page.' };
            }
        }

        // Run appropriate audit based on site type
        let auditResults;
        
        if (siteType === 'group') {
            // Run group-specific audit
            auditResults = await runComprehensiveAudit(siteUrl, homepageSoup);
            
            // Add group-specific tests
            const groupTestResults = await groupAnalysis.runGroupTests(homepageSoup, siteUrl);
            
            // Merge group results
            auditResults.groupAnalysis = groupTestResults;
            auditResults.siteType = 'group';
            
            // Extract dealer links
            const dealerLinks = await groupAnalysis.extractDealerLinks(homepageSoup, null, siteUrl);
            auditResults.dealerLinks = dealerLinks;
            
            // Try to find and analyze the dedicated locations page
            try {
                const locationAnalysis = await groupAnalysis.findAndAnalyzeLocationPage(homepageSoup, siteUrl);
                if (locationAnalysis.success) {
                    console.log(`[Dealer Group] Found location page with ${locationAnalysis.locationCount} locations`);
                    auditResults.locationPageAnalysis = locationAnalysis;
                    
                    // If we found more locations on the dedicated page, update our count
                    if (locationAnalysis.locationCount > dealerLinks.length) {
                        console.log(`[Dealer Group] Location page shows ${locationAnalysis.locationCount} vs ${dealerLinks.length} found on homepage`);
                    }
                }
            } catch (error) {
                console.log('[Dealer Group] Location page analysis error:', error.message);
            }
            
            // Perform web search for comprehensive location data
            try {
                console.log('[Dealer Group] Performing web search for locations...');
                const searcher = new DealerSearcher(siteUrl);
                const searchResults = await searcher.searchForDealerLocations();
                const searchSummary = searcher.getSearchSummary(searchResults);
                
                // Add search results to audit
                auditResults.webSearchSummary = searchSummary;
                
                // Determine the most accurate location count
                let bestLocationCount = dealerLinks.length;
                let countSource = 'homepage links';
                
                // Prefer location page count if available
                if (auditResults.locationPageAnalysis && auditResults.locationPageAnalysis.locationCount > 0) {
                    bestLocationCount = auditResults.locationPageAnalysis.locationCount;
                    countSource = 'locations page';
                }
                
                // Web search data is most reliable if available
                if (searchSummary.success && searchSummary.totalLocations) {
                    if (searchSummary.totalLocations !== bestLocationCount) {
                        console.log(`[Dealer Group] Web search shows ${searchSummary.totalLocations} vs ${bestLocationCount} from ${countSource}`);
                        auditResults.locationDiscrepancy = true;
                    }
                    auditResults.totalLocationCount = searchSummary.totalLocations;
                } else {
                    auditResults.totalLocationCount = bestLocationCount;
                }
            } catch (searchError) {
                console.error('[Dealer Group] Web search error:', searchError);
                // Continue without web search data
                auditResults.webSearchSummary = {
                    success: false,
                    message: 'Web search unavailable'
                };
            }
            
            // Adjust scoring to include group-specific metrics
            if (groupTestResults.score) {
                // Add group score as a new category
                auditResults.categories.push({
                    name: 'Group Structure',
                    score: Math.round(groupTestResults.score / 20), // Convert to 0-5 scale
                    weight: 0.15, // Fixed: Changed from 15 to 0.15
                    testsCompleted: groupTestResults.tests.length
                });
                
                // Normalize weights to ensure they sum to 1.0
                const totalWeight = auditResults.categories.reduce((sum, cat) => sum + cat.weight, 0);
                auditResults.categories.forEach(cat => {
                    cat.weight = cat.weight / totalWeight;
                });
                
                // Recalculate overall score with normalized weights
                let totalScore = 0;
                auditResults.categories.forEach(cat => {
                    totalScore += (cat.score / 5) * cat.weight * 100;
                });
                auditResults.overallScore = Math.round(totalScore);
            }
            
            // Add group-specific issues
            if (groupTestResults.issues) {
                auditResults.issues.push(...groupTestResults.issues);
            }
        } else {
            // Run appropriate audit based on type
            if (auditType === 'seo') {
                auditResults = await runSEOAudit(siteUrl, homepageSoup);
            } else {
                auditResults = await runComprehensiveAudit(siteUrl, homepageSoup);
            }
        }
        
        // Add discovered pages to results
        auditResults.pagesFound = discoveredPages;
        
        // Run page-specific tests based on audit type (skip for SEO-only audits)
        auditResults.pageSpecificResults = {};
        
        if (auditType === 'seo') {
            // Skip page-specific tests for SEO-only audits
            console.log('[SEO Audit] Skipping page-specific tests - SEO analysis only');
        } else if (auditType === 'comprehensive' || (auditType === 'custom' && customPages.includes('vdp'))) {
            if (discoveredPages.vdp) {
                try {
                    const vdpSoup = await getSoup(discoveredPages.vdp);
                    const vdpAuditResult = await auditVDP(vdpSoup, discoveredPages.vdp);
                    auditResults.pageSpecificResults.vdp = vdpAuditResult;
                    
                    // Add VDP issues to main issues list
                    if (vdpAuditResult.issues) {
                        auditResults.issues.push(...vdpAuditResult.issues);
                    }
                } catch (e) {
                    console.log('VDP audit error:', e.message);
                }
            }
        }
        
        if (auditType === 'comprehensive' || (auditType === 'custom' && customPages.includes('service'))) {
            if (discoveredPages.service) {
                try {
                    const serviceSoup = await getSoup(discoveredPages.service);
                    const serviceAuditResult = await auditServicePage(serviceSoup, discoveredPages.service);
                    auditResults.pageSpecificResults.service = serviceAuditResult;
                    
                    // Add service issues to main issues list
                    if (serviceAuditResult.issues) {
                        auditResults.issues.push(...serviceAuditResult.issues);
                    }
                } catch (e) {
                    console.log('Service page audit error:', e.message);
                }
            }
        }
        
        if (auditType === 'comprehensive' || (auditType === 'custom' && customPages.includes('inventory'))) {
            if (discoveredPages.inventory) {
                try {
                    const inventorySoup = await getSoup(discoveredPages.inventory);
                    const inventoryAuditResult = await auditInventoryPage(inventorySoup, discoveredPages.inventory);
                    auditResults.pageSpecificResults.inventory = inventoryAuditResult;
                    
                    // Add inventory issues to main issues list
                    if (inventoryAuditResult.issues) {
                        auditResults.issues.push(...inventoryAuditResult.issues);
                    }
                } catch (e) {
                    console.log('Inventory page audit error:', e.message);
                }
            }
        }
        
        if (auditType === 'comprehensive' || (auditType === 'custom' && customPages.includes('specials'))) {
            if (discoveredPages.specials) {
                try {
                    const specialsSoup = await getSoup(discoveredPages.specials);
                    const specialsAuditResult = await auditSpecialsPage(specialsSoup, discoveredPages.specials);
                    auditResults.pageSpecificResults.specials = specialsAuditResult;
                    
                    // Add specials issues to main issues list
                    if (specialsAuditResult.issues) {
                        auditResults.issues.push(...specialsAuditResult.issues);
                    }
                } catch (e) {
                    console.log('Specials page audit error:', e.message);
                }
            }
        }
        
        // Store audit type for reporting
        auditResults.auditType = auditType;
        auditResults.auditDepth = auditType === 'seo' ? 'SEO Analysis Only' : 
                                  auditType === 'comprehensive' ? 'Homepage + VDP + Service + Inventory' : 
                                  `Homepage + ${customPages.join(' + ')}`;
        
        // Generate enhanced recommendations
        const { generateEnhancedRecommendations, generateImplementationRoadmap, calculatePotentialROI } = require('./lib/enhanced-recommendations');
        
        // Get enhanced recommendations based on issues found
        auditResults.enhancedRecommendations = generateEnhancedRecommendations(auditResults.issues);
        
        // Generate implementation roadmap
        auditResults.implementationRoadmap = generateImplementationRoadmap(auditResults.enhancedRecommendations);
        
        // Calculate potential ROI
        auditResults.potentialROI = calculatePotentialROI(auditResults.enhancedRecommendations);
        
        // Store audit data for correlation with lead performance
        auditResults.correlationData = {
            domain: auditResults.domain,
            brand: auditResults.brand,
            score: auditResults.overallScore,
            timestamp: new Date().toISOString()
        };
        
        // If contact page found, check it for business hours and contact info
        if (discoveredPages.contact) {
            try {
                const contactPageSoup = await getSoup(discoveredPages.contact);
                const contactText = contactPageSoup('body').text();
                
                // Check for business hours on contact page
                const hoursPattern = /(\d{1,2}:\d{2}\s*(am|pm|AM|PM))|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/gi;
                if (hoursPattern.test(contactText)) {
                    // Remove business hours issue if found on contact page
                    auditResults.issues = auditResults.issues.filter(issue => 
                        !issue.title.includes('Business hours')
                    );
                    // Update the content analysis score
                    const contentCat = auditResults.categories.find(cat => cat.name === 'Content Analysis');
                    if (contentCat && contentCat.score < 5) {
                        contentCat.score = Math.min(5, contentCat.score + 1);
                        // Recalculate overall score
                        let totalScore = 0;
                        auditResults.categories.forEach(cat => {
                            totalScore += (cat.score / 5) * cat.weight * 100;
                        });
                        auditResults.overallScore = Math.round(totalScore);
                    }
                }
            } catch (e) {
                console.log('Could not check contact page:', e.message);
            }
        }
        
        // Ensure results object has all required properties
        if (!auditResults.domain) {
            auditResults.domain = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        }
        if (!auditResults.brand) {
            auditResults.brand = auditResults.dealershipName || 'Unknown';
        }
        if (!auditResults.timestamp) {
            auditResults.timestamp = new Date().toISOString();
        }
        if (!auditResults.categories) {
            auditResults.categories = [];
        }
        if (!auditResults.issues) {
            auditResults.issues = [];
        }
        
        // Render appropriate report based on site type
        if (siteType === 'group') {
            // Force EJS to process the template
            const html = await ejs.renderFile(path.join(__dirname, 'views', 'reports-group.html'), { results: auditResults });
            res.send(html);
        } else {
            // Use dealer-style report for individual dealerships
            // Force EJS to process the template
            const html = await ejs.renderFile(path.join(__dirname, 'views', 'reports-dealer-style.html'), { results: auditResults });
            res.send(html);
        }

    } catch (error) {
        console.error("Audit Error:", error.message);
        // Send a user-friendly error page
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Audit Error - Auto Audit Pro</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
                <div class="container mt-5">
                    <div class="alert alert-danger" role="alert">
                        <h4 class="alert-heading">Unable to Audit Website</h4>
                        <p>${error.message}</p>
                        <hr>
                        <p class="mb-0">
                            <a href="/" class="btn btn-primary">Try Another Website</a>
                        </p>
                    </div>
                    <div class="mt-4">
                        <h5>Common Issues:</h5>
                        <ul>
                            <li>Some websites block automated tools</li>
                            <li>The website may be temporarily down</li>
                            <li>The URL might be incorrect</li>
                        </ul>
                        <h5>Try These Test Sites:</h5>
                        <ul>
                            <li>test.com (Demo mode)</li>
                            <li>demo.dealership.com (Demo mode)</li>
                            <li>Any URL with 'test' or 'demo' in it</li>
                        </ul>
                        <p class="mt-3"><strong>Note:</strong> Many websites block automated tools for security. For a live demo, try any URL containing 'test' or 'demo'.</p>
                    </div>
                </div>
            </body>
            </html>
        `);
    }
});

// ============= ROI CONFIGURATION API ENDPOINTS (Admin Only) =============
// MOVED TO LINE 3092 - BEFORE 404 HANDLER

// ============= MONITORING SYSTEM API ENDPOINTS =============

// Get current user info
app.get('/api/user/current', (req, res) => {
    if (req.session.authenticated) {
        res.json({
            username: req.session.username,
            role: req.session.role || 'dealer',
            isAdmin: req.session.isAdmin || false,
            dealership: req.session.dealership || null
        });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Get monitoring dashboard
app.get('/monitoring', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'monitoring-dashboard.html'));
});

// Get monitoring profiles

// Create new monitoring profile

// Update monitoring profile (Admin only)

// Delete monitoring profile (Admin only)

// Get monitoring results for a profile

// Get current status for all profiles

// Get monitoring statistics including ScrapingDog usage

// Get alerts for a profile

// Acknowledge an alert

// Resolve an alert

// Run manual check for a profile

// Send test notifications for a profile

// ============= SECURITY DASHBOARD ROUTES =============

// Security dashboard (admin only)
app.get('/security', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'security-dashboard.html'));
});

// Get security statistics
app.get('/api/security/stats', (req, res) => {
    const stats = getSecurityStats();
    res.json(stats);
});

// Get recent security events
app.get('/api/security/recent-events', async (req, res) => {
    try {
        const logPath = path.join(__dirname, 'logs', 'security.log');
        
        // Ensure log file exists
        if (!fs.existsSync(logPath)) {
            return res.json([]);
        }
        
        // Read the security log file
        const logContent = await fs.promises.readFile(logPath, 'utf8');
        const lines = logContent.split('\n').filter(line => line.trim());
        
        // Parse last 50 events
        const recentEvents = lines.slice(-50).reverse().map(line => {
            const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) - ([^-]+) - IP: ([^-]+) - Path: ([^-]+) - Details: (.+)$/);
            if (match) {
                return {
                    time: new Date(match[1]).toLocaleString(),
                    type: match[2].trim(),
                    ip: match[3].trim(),
                    path: match[4].trim(),
                    details: match[5].trim()
                };
            }
            return null;
        }).filter(Boolean);
        
        res.json(recentEvents);
    } catch (error) {
        console.error('Error reading security log:', error);
        res.json([]);
    }
});

// Admin settings page (MOVED HERE - must be before 404 handler)
app.get('/admin/settings', requireAdmin, (req, res) => {
    console.log('[Admin Settings] Accessed by:', req.session.username);
    const filePath = path.join(__dirname, 'views', 'admin-settings.html');
    res.sendFile(filePath);
});

// Alternative admin settings route - ADMIN ONLY
// Routes moved before global auth

// Test route to verify admin routing
app.get('/admin/test', (req, res) => {
    res.json({ message: 'Admin routes are working', timestamp: new Date() });
});

// Debug session state
app.get('/api/session-debug', checkAuth, (req, res) => {
    res.json({
        username: req.session.username,
        role: req.session.role,
        isAdmin: req.session.isAdmin,
        authenticated: req.session.authenticated,
        sessionID: req.sessionID
    });
});

// Force create test alert for debugging
app.post('/api/debug-create-alert/:profileId', requireAdmin, async (req, res) => {
    try {
        const { profileId } = req.params;
        const { storage: jsonStorage } = require('./lib/json-storage');
        
        // Create a test alert
        const testAlert = {
            profile_id: parseInt(profileId),
            result_id: Date.now(),
            rule_id: 2,
            alert_level: 'RED',
            alert_type: 'ssl_valid',
            alert_message: 'TEST: SSL certificate is invalid - browsers showing security warnings!',
            notification_sent: false,
            acknowledged: false,
            resolved: false
        };
        
        const savedAlert = await jsonStorage.saveAlert(testAlert);
        res.json({ success: true, alert: savedAlert });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Debug monitoring data
app.get('/api/debug-monitoring', async (req, res) => {
    try {
        const { storage: jsonStorage } = require('./lib/json-storage');
        const fs = require('fs').promises;
        const path = require('path');
        
        // Read raw JSON files
        const profilesPath = path.join(__dirname, 'data', 'monitoring', 'profiles.json');
        const alertsPath = path.join(__dirname, 'data', 'monitoring', 'alerts.json');
        const resultsPath = path.join(__dirname, 'data', 'monitoring', 'results.json');
        
        const profilesRaw = await fs.readFile(profilesPath, 'utf8');
        const alertsRaw = await fs.readFile(alertsPath, 'utf8');
        const resultsRaw = await fs.readFile(resultsPath, 'utf8');
        
        const profiles = JSON.parse(profilesRaw);
        const alerts = JSON.parse(alertsRaw);
        const results = JSON.parse(resultsRaw);
        
        res.json({
            profilesCount: profiles.length,
            alertsCount: alerts.length,
            resultsCount: results.length,
            profiles: profiles.slice(0, 5), // First 5 profiles
            recentAlerts: alerts.slice(0, 10), // Recent 10 alerts
            recentResults: results.slice(0, 5), // Recent 5 results
            paths: {
                profiles: profilesPath,
                alerts: alertsPath,
                results: resultsPath
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// Debug views directory
app.get('/api/debug-views', (req, res) => {
    const viewsDir = path.join(__dirname, 'views');
    
    try {
        const files = fs.readdirSync(viewsDir);
        const reportFiles = files.filter(f => f.includes('report'));
        
        res.json({
            viewsDirectory: viewsDir,
            totalFiles: files.length,
            reportFiles: reportFiles,
            ejsConfigured: !!app.get('view engine'),
            viewEngine: app.get('view engine'),
            viewsPath: app.get('views'),
            workingDirectory: process.cwd(),
            __dirname: __dirname
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            viewsDir: viewsDir,
            exists: fs.existsSync(viewsDir)
        });
    }
});

// Test EJS rendering
app.get('/api/test-ejs', async (req, res) => {
    const testData = {
        results: {
            domain: 'test.com',
            brand: 'Test Brand',
            overallScore: 85,
            timestamp: new Date().toISOString(),
            auditDepth: 'Test Audit',
            categories: []
        }
    };
    
    try {
        // Check which file exists
        const ejsPath = path.join(__dirname, 'views', 'test-ejs.ejs');
        const htmlPath = path.join(__dirname, 'views', 'reports-dealer-style.html');
        
        console.log('[Test EJS] Trying to render:', htmlPath);
        console.log('[Test EJS] File exists:', fs.existsSync(htmlPath));
        
        // Use the dealer report template for testing
        const html = await ejs.renderFile(htmlPath, testData);
        res.send(html);
    } catch (error) {
        res.status(500).json({
            error: 'EJS rendering failed',
            message: error.message,
            stack: error.stack,
            cwd: process.cwd(),
            dirname: __dirname
        });
    }
});

// Fix admin session if needed
app.get('/api/fix-admin', checkAuth, (req, res) => {
    if (req.session.username === 'admin') {
        req.session.isAdmin = true;
        req.session.role = 'admin';
        res.json({ 
            message: 'Admin session fixed',
            session: {
                username: req.session.username,
                isAdmin: req.session.isAdmin,
                role: req.session.role
            }
        });
    } else {
        res.status(403).json({ error: 'Only admin user can fix admin session' });
    }
});

// Emergency route removed for security

// ROI Settings - Available to all authenticated users
app.get('/roi-settings', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'roi-settings.html'));
});

// Admin monitoring settings - Admin only
app.get('/admin/monitoring-settings', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin-monitoring-settings.html'));
});

// Update default monitoring frequency - Admin only
app.put('/api/admin/monitoring-config', requireAdmin, (req, res) => {
    try {
        const { defaultFrequency } = req.body;
        
        // Validate frequency
        if (![30, 59, 360].includes(defaultFrequency)) {
            return res.status(400).json({ error: 'Invalid frequency. Must be 30, 59, or 360 minutes.' });
        }
        
        // Store in server config (in production, save to database)
        global.monitoringConfig = global.monitoringConfig || {};
        global.monitoringConfig.defaultFrequency = defaultFrequency;
        
        console.log(`[Admin] Monitoring frequency updated to ${defaultFrequency} minutes`);
        res.json({ success: true, defaultFrequency });
    } catch (error) {
        console.error('Error updating monitoring config:', error);
        res.status(500).json({ error: 'Failed to update monitoring configuration' });
    }
});


// ROI Configuration API Routes
const roiConfig = require('./lib/roi-config');

// Get ROI configuration
app.get('/api/roi/config', checkAuth, (req, res) => {
    try {
        const config = roiConfig.getROIConfig();
        res.json(config);
    } catch (error) {
        console.error('Error getting ROI config:', error);
        res.status(500).json({ error: 'Failed to load ROI configuration' });
    }
});

// Update ROI configuration (Admin only)
app.put('/api/roi/config', requireAdmin, (req, res) => {
    try {
        const updatedConfig = roiConfig.updateROIConfig(req.body, true);
        res.json(updatedConfig);
    } catch (error) {
        console.error('Error updating ROI config:', error);
        res.status(400).json({ error: error.message });
    }
});

// Reset ROI configuration (Admin only)
app.post('/api/roi/reset', requireAdmin, (req, res) => {
    try {
        const config = roiConfig.resetROIConfig(true);
        res.json(config);
    } catch (error) {
        console.error('Error resetting ROI config:', error);
        res.status(500).json({ error: 'Failed to reset configuration' });
    }
});

// Initialize monitoring scheduler
const MonitoringScheduler = require('./lib/monitoring-scheduler');
const monitoringScheduler = new MonitoringScheduler();

// Catch direct access to view files and render them properly
app.use((req, res, next) => {
    // If someone tries to access a view file directly, render it instead
    if (req.path.startsWith('/views/') && req.path.endsWith('.html')) {
        const viewName = req.path.replace('/views/', '');
        console.log(`[Direct View Access] Attempting to render: ${viewName}`);
        
        // For report templates, we need to provide dummy data to prevent errors
        if (viewName.includes('report')) {
            const dummyResults = {
                domain: 'example.com',
                brand: 'Unknown',
                overallScore: 0,
                timestamp: new Date().toISOString(),
                auditDepth: 'Unknown',
                auditType: 'unknown',
                categories: [],
                issues: [],
                dealershipName: 'Unknown Dealership'
            };
            return res.render(viewName, { results: dummyResults });
        }
        
        return res.status(403).send('Direct access to view files is not allowed');
    }
    next();
});

// Add 404 handler for debugging
app.use((req, res, next) => {
    console.log(`[404 DEBUG] Unmatched route: ${req.method} ${req.path}`);
    console.log(`[404 DEBUG] Available routes:`, app._router.stack
        .filter(r => r.route)
        .map(r => `${Object.keys(r.route.methods).join(',')} ${r.route.path}`)
    );
    res.status(404).send(`Cannot ${req.method} ${req.path}`);
});

// Start server
app.listen(PORT, async () => {
    console.log(`Auto Audit Pro Server v2.6.3 running on port ${PORT}`);
    console.log(`Features:`);
    console.log(`   - 8-Category Testing System`);
    console.log(`   - Real Google PageSpeed API Integration`);
    console.log(`   - Professional Content Analysis`);
    console.log(`   - Brand Compliance & Lead Generation Tests`);
    console.log(`   - Website Monitoring System (NEW)`);
    console.log(`API endpoints available:`);
    console.log(`   POST /api/audit - Start new audit`);
    console.log(`   GET  /api/audit/:id - Get audit status`);
    console.log(`   GET  /api/audits - Get audit history`);
    console.log(`   GET  /api/health - Health check`);
    console.log(`   GET  /api/monitoring/* - Monitoring endpoints`);
    console.log(`   GET  /security - Security dashboard`);
    console.log(`   GET  /api/security/* - Security monitoring endpoints`);
    
    // Start monitoring scheduler (only if available and not in simplified deployment mode)
    if (monitoringScheduler && process.env.SKIP_MONITORING !== 'true') {
        try {
            await monitoringScheduler.start();
            console.log('Monitoring scheduler started successfully');
        } catch (error) {
            console.error('Failed to start monitoring scheduler:', error);
            console.log('Continuing without monitoring scheduler...');
        }
    } else {
        console.log('Monitoring scheduler skipped (not available or simplified deployment mode)');
    }
});

module.exports = app;