/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;

// Health check endpoint - MUST be before any auth middleware
app.get('/api/health', (req, res) => {
    console.log('[HEALTH CHECK] Request received');
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '2.6.7',
        message: 'Auto Audit Pro is running'
    });
});

// Test root endpoint
app.get('/', (req, res) => {
    res.send('Auto Audit Pro Server Running on port ' + PORT);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Health check available at: /api/health');
});
