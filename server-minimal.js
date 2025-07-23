/**
 * Minimal production server - guaranteed to deploy
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3002;

// Basic JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static('public'));
app.use('/views', express.static('views'));

// Health check - MUST work for deployment
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: 'minimal'
    });
});

// Root route
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Auto Audit Pro</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { background: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Auto Audit Pro - Production</h1>
        <div class="status">
            <h2>✅ Server is Running!</h2>
            <p>Deployment successful at ${new Date().toISOString()}</p>
        </div>
        <h3>Available Routes:</h3>
        <ul>
            <li><a href="/api/health">Health Check</a></li>
            <li><a href="/monitoring">Monitoring Dashboard</a></li>
        </ul>
    </div>
</body>
</html>
    `);
});

// Monitoring route
app.get('/monitoring', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'monitoring-dashboard.html'));
});

// Basic monitoring API
app.get('/api/monitoring/status', (req, res) => {
    res.json([]);  // Empty array for now
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Minimal server running on port ${PORT}`);
});