/**
 * Comprehensive ScrapingDog Integration Test
 * Tests the full integration with monitoring engine
 */

require('dotenv').config();
const MonitoringEngine = require('./lib/monitoring-engine');
const ScrapingDogWrapper = require('./lib/scrapingdog-wrapper');

// Test sites that might trigger anti-bot protection
const testSites = [
    {
        dealer_name: 'Test Dealer - Simple Site',
        website_url: 'https://example.com',
        description: 'Simple site that should work with regular axios'
    },
    {
        dealer_name: 'Test Dealer - Cloudflare Site',
        website_url: 'https://www.cloudflare.com',
        description: 'Site protected by Cloudflare'
    },
    {
        dealer_name: 'Test Dealer - Auto Site',
        website_url: 'https://www.cars.com',
        description: 'Automotive site that might have protection'
    }
];

async function testIntegration() {
    console.log('=== ScrapingDog Integration Test ===\n');
    
    // Create monitoring engine instance (no DB for testing)
    const monitor = new MonitoringEngine(null);
    
    console.log('API Key Status:', monitor.scrapingDog.apiKey ? '✅ Configured' : '❌ Not configured');
    console.log('\n');
    
    for (const site of testSites) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Testing: ${site.dealer_name}`);
        console.log(`URL: ${site.website_url}`);
        console.log(`${'-'.repeat(60)}`);
        
        try {
            // First, analyze the site
            console.log('\n1. Analyzing site protection...');
            const analysis = await monitor.analyzeSite(site.website_url);
            console.log('Protection Analysis:');
            console.log(`- Needs Premium: ${analysis.needsPremium ? 'Yes' : 'No'}`);
            console.log(`- Protection Level: ${analysis.protectionLevel}`);
            console.log(`- Recommendation: ${analysis.recommendation}`);
            
            // Test connectivity check (which includes fallback logic)
            console.log('\n2. Testing connectivity check...');
            const connectivityResult = await monitor.checkConnectivity(site.website_url);
            console.log('Connectivity Result:');
            console.log(`- Reachable: ${connectivityResult.is_reachable ? 'Yes' : 'No'}`);
            console.log(`- Response Time: ${connectivityResult.response_time_ms}ms`);
            console.log(`- Status Code: ${connectivityResult.http_status_code}`);
            console.log(`- Method Used: ${connectivityResult.method || 'axios'}`);
            
            // Test content check if site is reachable
            if (connectivityResult.is_reachable) {
                console.log('\n3. Testing content check...');
                const contentResult = await monitor.checkContent(site.website_url);
                console.log('Content Analysis:');
                console.log(`- Forms Found: ${contentResult.forms_working ? 'Yes' : 'No'}`);
                console.log(`- Phone Numbers: ${contentResult.phone_numbers_valid ? 'Yes' : 'No'}`);
                console.log(`- Scraping Method: ${contentResult.scraping_method || 'axios'}`);
                
                if (contentResult.issues_found && contentResult.issues_found.length > 0) {
                    console.log(`- Issues Found: ${contentResult.issues_found.length}`);
                    contentResult.issues_found.forEach(issue => {
                        console.log(`  - ${issue.type}: ${issue.message}`);
                    });
                }
            }
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        }
    }
    
    // Display monitoring statistics
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('MONITORING STATISTICS');
    console.log('='.repeat(60));
    
    const stats = monitor.getMonitoringStats();
    console.log('\nRequest Statistics:');
    console.log(`- Selenium Requests: ${stats.seleniumRequests}`);
    console.log(`- ScrapingDog Requests: ${stats.scrapingDogRequests}`);
    console.log(`- Selenium Success: ${stats.seleniumSuccess}`);
    console.log(`- ScrapingDog Success: ${stats.scrapingDogSuccess}`);
    
    console.log('\nPerformance Metrics:');
    console.log(`- Selenium Success Rate: ${stats.seleniumSuccessRate}`);
    console.log(`- ScrapingDog Usage Rate: ${stats.scrapingDogUsageRate}`);
    
    console.log('\nScrapingDog API Stats:');
    console.log(`- Total Requests: ${stats.scrapingDogStats.totalRequests}`);
    console.log(`- Successful: ${stats.scrapingDogStats.successfulRequests}`);
    console.log(`- Failed: ${stats.scrapingDogStats.failedRequests}`);
    console.log(`- Success Rate: ${stats.scrapingDogStats.successRate}`);
    console.log(`- Total Cost: $${stats.scrapingDogStats.totalCost.toFixed(4)}`);
    console.log(`- Average Cost: ${stats.scrapingDogStats.averageCost}`);
    
    // Test the monitoring stats API endpoint
    console.log('\n\nTesting API Stats Endpoint...');
    try {
        const axios = require('axios');
        // Note: This will only work if server is running
        const response = await axios.get('http://localhost:3000/api/monitoring/stats');
        console.log('✅ API endpoint is accessible');
        console.log('Response includes:', Object.keys(response.data));
    } catch (error) {
        console.log('⚠️  API endpoint test skipped (server not running)');
    }
}

// Run the test
console.log('Starting comprehensive integration test...\n');
testIntegration().then(() => {
    console.log('\n\n✅ Integration test complete!');
    console.log('\nNext steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Visit http://localhost:3000/monitoring');
    console.log('3. Add a website that might need ScrapingDog (e.g., cloudflare.com)');
    console.log('4. Check the monitoring dashboard for API usage stats');
    process.exit(0);
}).catch(error => {
    console.error('\n\n❌ Integration test failed:', error);
    process.exit(1);
});