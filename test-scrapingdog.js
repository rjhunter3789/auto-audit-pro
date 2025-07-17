/**
 * Test ScrapingDog Integration
 * Run this to verify ScrapingDog API is working correctly
 */

require('dotenv').config();
const ScrapingDogWrapper = require('./lib/scrapingdog-wrapper');

async function testScrapingDog() {
    console.log('=== Testing ScrapingDog Integration ===\n');
    
    const scrapingDog = new ScrapingDogWrapper();
    
    // Test sites - mix of easy and potentially protected sites
    const testSites = [
        {
            name: 'Simple Test',
            url: 'https://httpbin.org/html',
            description: 'Basic HTML page (should work with regular axios)'
        },
        {
            name: 'JavaScript Test',
            url: 'https://example.com',
            description: 'Simple site that might need JS rendering'
        },
        {
            name: 'Protected Site Test',
            url: 'https://www.autotrader.com',
            description: 'Site that likely has anti-bot protection'
        }
    ];

    console.log(`API Key configured: ${scrapingDog.apiKey ? 'Yes' : 'No'}\n`);

    for (const site of testSites) {
        console.log(`\n--- Testing: ${site.name} ---`);
        console.log(`URL: ${site.url}`);
        console.log(`Description: ${site.description}`);
        
        try {
            // First, analyze the site
            console.log('\n1. Analyzing site protection...');
            const analysis = await scrapingDog.analyzeSiteProtection(site.url);
            console.log('Protection Analysis:', JSON.stringify(analysis, null, 2));
            
            // If protection detected, test ScrapingDog
            if (analysis.needsPremium) {
                console.log('\n2. Site needs premium scraping. Testing ScrapingDog...');
                const result = await scrapingDog.getContent(site.url, {
                    javascript: true,
                    wait: 3000
                });
                
                if (result.success) {
                    console.log('✅ ScrapingDog Success!');
                    console.log(`- Response time: ${result.responseTime.toFixed(0)}ms`);
                    console.log(`- Content length: ${result.data.length} characters`);
                    console.log(`- Method used: ${result.method}`);
                    console.log(`- Estimated cost: $${result.cost || 'N/A'}`);
                    
                    // Check if we got real content
                    const hasTitle = result.data.includes('<title>');
                    const hasBody = result.data.includes('<body');
                    console.log(`- Has <title>: ${hasTitle}`);
                    console.log(`- Has <body>: ${hasBody}`);
                } else {
                    console.log('❌ ScrapingDog Failed');
                    console.log(`- Error: ${result.error}`);
                }
            } else {
                console.log('\n2. Site doesn\'t need premium scraping (can use regular axios)');
            }
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        }
    }
    
    // Display usage statistics
    console.log('\n\n=== ScrapingDog Usage Statistics ===');
    const stats = scrapingDog.getUsageStats();
    console.log(JSON.stringify(stats, null, 2));
    
    // Test monitoring engine integration
    console.log('\n\n=== Testing Monitoring Engine Integration ===');
    try {
        const MonitoringEngine = require('./lib/monitoring-engine');
        const monitor = new MonitoringEngine(null); // No DB for this test
        
        // Test connectivity check with a protected site
        const testUrl = 'https://www.cars.com';
        console.log(`\nTesting connectivity check for: ${testUrl}`);
        
        const connectivityResult = await monitor.checkConnectivity(testUrl);
        console.log('Connectivity Result:', JSON.stringify(connectivityResult, null, 2));
        
        // Get monitoring stats
        console.log('\nMonitoring Statistics:');
        const monitorStats = monitor.getMonitoringStats();
        console.log(JSON.stringify(monitorStats, null, 2));
        
    } catch (error) {
        console.error('Error testing monitoring engine:', error.message);
    }
}

// Run the test
testScrapingDog().then(() => {
    console.log('\n\n=== Test Complete ===');
    process.exit(0);
}).catch(error => {
    console.error('\n\nTest failed:', error);
    process.exit(1);
});