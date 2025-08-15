/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Test script to verify ScrapingDog integration in monitoring
 */

require('dotenv').config();
const MonitoringEngine = require('./lib/monitoring-engine');

async function testMonitoring() {
    console.log('=== Testing ScrapingDog in Monitoring Engine ===\n');
    
    // Check environment
    console.log('SCRAPINGDOG_API_KEY:', process.env.SCRAPINGDOG_API_KEY ? '✓ Set' : '✗ Missing');
    console.log('API Key value:', process.env.SCRAPINGDOG_API_KEY?.substring(0, 10) + '...\n');
    
    // Create engine
    const engine = new MonitoringEngine();
    
    // Test profile
    const testProfile = {
        id: 'test-1',
        dealer_name: 'Test Dealer',
        website_url: 'https://www.cloudflare.com',
        monitoring_enabled: true,
        check_frequency: 60,
        alert_preferences: {
            email_enabled: false,
            sms_enabled: false
        }
    };
    
    console.log('Running monitoring check on:', testProfile.website_url);
    console.log('(This site typically requires ScrapingDog due to Cloudflare protection)\n');
    
    try {
        // Run full monitoring check
        const results = await engine.runFullCheck(testProfile);
        
        console.log('✅ Monitoring check completed!\n');
        console.log('Results:');
        console.log('- Overall Status:', results.overall_status);
        console.log('- Is Reachable:', results.is_reachable);
        console.log('- Response Time:', results.response_time_ms, 'ms');
        console.log('- SSL Valid:', results.ssl_valid);
        console.log('- Forms Working:', results.forms_working);
        console.log('- Scraping Method:', results.scraping_method || 'Not specified');
        console.log('- Issues Found:', results.issues_found?.length || 0);
        
        // Get monitoring stats
        const stats = engine.getMonitoringStats();
        console.log('\nMonitoring Stats:');
        console.log('- ScrapingDog Requests:', stats.scrapingDogRequests);
        console.log('- ScrapingDog Success:', stats.scrapingDogSuccess);
        console.log('- ScrapingDog Usage Rate:', stats.scrapingDogUsageRate);
        
        // Check if stats were saved
        const savedStats = engine.loadStats();
        console.log('\nPersisted Stats:');
        console.log('- ScrapingDog Requests:', savedStats?.scrapingDogRequests || 0);
        console.log('- ScrapingDog Success:', savedStats?.scrapingDogSuccess || 0);
        
    } catch (error) {
        console.error('❌ Error during monitoring check:', error.message);
    }
}

// Run the test
testMonitoring().then(() => {
    console.log('\nTest complete!');
    process.exit(0);
}).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});