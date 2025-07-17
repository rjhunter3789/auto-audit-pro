
// Temporary test server to verify login
const express = require('express');
const session = require('express-session');
const app = express();

// Load environment variables
require('dotenv').config();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AutoAudit2025!';

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,  // Allow HTTP for testing
        httpOnly: true
    }
}));

// Simple login form
app.get('/test-login', (req, res) => {
    res.send(`
        <h2>Test Login</h2>
        <form method="POST" action="/test-login">
            <p>Username: <input name="username" value="admin"></p>
            <p>Password: <input name="password" type="password" value="AutoAudit2025!"></p>
            <button type="submit">Test Login</button>
        </form>
        <p>Expected: Username=${ADMIN_USERNAME}, Password=${ADMIN_PASSWORD}</p>
    `);
});

// Test login handler
app.post('/test-login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, passwordLength: password?.length });
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        res.send('<h2>✅ Login Success!</h2><p>Credentials are correct.</p>');
    } else {
        res.send(`
            <h2>❌ Login Failed</h2>
            <p>Expected: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}</p>
            <p>Received: ${username} / ${password}</p>
            <a href="/test-login">Try Again</a>
        `);
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Test server running at http://localhost:${PORT}/test-login`);
    console.log('Press Ctrl+C to stop');
});
