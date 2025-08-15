/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Direct ScrapingDog API Test
 * Test the API directly to ensure it's working
 */

require('dotenv').config();
const ScrapingDogWrapper = require('./lib/scrapingdog-wrapper');

async function testDirectAPI() {
    console.log('=== Direct ScrapingDog API Test ===\n');
    
    const scrapingDog = new ScrapingDogWrapper();
    console.log(`API Key: ${scrapingDog.apiKey ? scrapingDog.apiKey.substring(0, 8) + '...' : 'NOT CONFIGURED'}\n`);
    
    if (!scrapingDog.apiKey) {
        console.error('❌ ScrapingDog API key not configured!');
        console.log('Please set SCRAPINGDOG_API_KEY in your .env file');
        return;
    }
    
    // Test with a simple site first
    console.log('Testing with example.com...\n');
    
    try {
        const result = await scrapingDog.scrape('https://example.com', {
            javascript: false,  // Simple HTML, no JS needed
            wait: 1000
        });
        
        console.log('Result:', {
            success: result.success,
            statusCode: result.statusCode,
            responseTime: result.responseTime,
            contentLength: result.data ? result.data.length : 0,
            method: result.method,
            error: result.error
        });
        
        if (result.success) {
            console.log('\n✅ ScrapingDog API is working!');
            console.log('Content preview:', result.data.substring(0, 200) + '...');
        } else {
            console.log('\n❌ ScrapingDog API request failed');
            console.log('Error:', result.error);
        }
        
        // Now test with a more complex site
        console.log('\n\nTesting with a JavaScript-heavy site (AutoTrader)...\n');
        
        const complexResult = await scrapingDog.scrape('https://www.autotrader.com', {
            javascript: true,  // Enable JS rendering
            wait: 5000,       // Wait for page to load
            premium: false    // Try without premium first
        });
        
        console.log('Complex Site Result:', {
            success: complexResult.success,
            statusCode: complexResult.statusCode,
            responseTime: complexResult.responseTime,
            contentLength: complexResult.data ? complexResult.data.length : 0,
            method: complexResult.method,
            error: complexResult.error
        });
        
        if (complexResult.success) {
            // Check if we got real content or a challenge page
            const hasTitle = complexResult.data.includes('<title>');
            const hasChallenge = complexResult.data.toLowerCase().includes('challenge') || 
                                complexResult.data.toLowerCase().includes('captcha');
            
            console.log('\nContent analysis:');
            console.log('- Has title tag:', hasTitle);
            console.log('- Has challenge/captcha:', hasChallenge);
            
            if (hasChallenge) {
                console.log('\n⚠️  Site returned a challenge page. May need premium proxies.');
            }
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        console.error(error.stack);
    }
    
    // Show usage stats
    console.log('\n\n=== Usage Statistics ===');
    console.log(scrapingDog.getUsageStats());
}

// Run the test
testDirectAPI().then(() => {
    console.log('\n\nTest complete!');
    process.exit(0);
}).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});