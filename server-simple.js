/*
 * Simple Server for Railway Deployment
 * This is a minimal version that doesn't require Selenium for basic operations
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        mode: 'cheerio-only',
        features: ['basic HTML analysis', 'no browser rendering']
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.send('Auto Audit Pro Server is running in lightweight mode!');
});

// Basic audit endpoint (Cheerio only)
app.post('/api/audit-simple', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    try {
        // Fetch HTML using axios
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        
        // Basic analysis
        const results = {
            url,
            timestamp: new Date().toISOString(),
            title: $('title').text() || 'No title found',
            description: $('meta[name="description"]').attr('content') || 'No description found',
            h1Count: $('h1').length,
            imageCount: $('img').length,
            hasViewport: $('meta[name="viewport"]').length > 0,
            mode: 'cheerio-only'
        };
        
        res.json(results);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to analyze URL', 
            details: error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Auto Audit Pro Simple Server running on port ${PORT}`);
    console.log('Mode: Cheerio-only (no Selenium/Chrome required)');
});