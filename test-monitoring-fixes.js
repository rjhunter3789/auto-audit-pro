/**
 * Test script to verify monitoring fixes
 */

const MonitoringEngine = require('./lib/monitoring-engine');
const axios = require('axios');

async function testMonitoringFixes() {
    console.log('=== Testing Monitoring Fixes ===\n');

    // Test 1: Check ScrapingDog stats are being tracked
    console.log('1. Testing ScrapingDog stats tracking...');
    const engine = new MonitoringEngine();
    const stats = engine.getMonitoringStats();
    console.log('Current stats:', JSON.stringify(stats, null, 2));

    // Test 2: Check /api/monitoring/stats endpoint
    console.log('\n2. Testing /api/monitoring/stats endpoint...');
    try {
        const response = await axios.get('http://localhost:3002/api/monitoring/stats');
        console.log('API Stats Response:', JSON.stringify(response.data, null, 2));
        
        if (response.data.scrapingDogStats) {
            console.log('✓ ScrapingDog stats are available in API');
        } else {
            console.log('✗ ScrapingDog stats missing from API response');
        }
    } catch (error) {
        console.log('✗ Failed to fetch stats from API:', error.message);
    }

    // Test 3: Test SSL detection with known sites
    console.log('\n3. Testing SSL detection...');
    const testSites = [
        'https://www.pierrefordofprosser.com/',
        'https://www.google.com/',
        'https://expired.badssl.com/' // Known expired cert for testing
    ];

    for (const site of testSites) {
        console.log(`\nChecking SSL for ${site}...`);
        try {
            const sslResult = await engine.checkSSLCertificate(site);
            console.log(`- SSL Valid: ${sslResult.ssl_valid}`);
            console.log(`- Expiry Days: ${sslResult.ssl_expiry_days}`);
            console.log(`- CDN Protected: ${sslResult.cdn_protected || false}`);
            if (sslResult.ssl_error) {
                console.log(`- Error: ${sslResult.ssl_error}`);
            }
        } catch (error) {
            console.log(`✗ SSL check failed: ${error.message}`);
        }
    }

    // Test 4: Test inventory detection
    console.log('\n4. Testing inventory detection...');
    const inventoryTestSite = 'https://www.pierrefordofprosser.com/';
    
    try {
        console.log(`\nChecking inventory for ${inventoryTestSite}...`);
        const contentResult = await engine.checkContent(inventoryTestSite);
        console.log(`- Inventory Count: ${contentResult.inventory_count}`);
        console.log(`- Forms Working: ${contentResult.forms_working}`);
        console.log(`- Phone Numbers Valid: ${contentResult.phone_numbers_valid}`);
        console.log(`- Scraping Method: ${contentResult.scraping_method}`);
        
        if (contentResult.issues_found && contentResult.issues_found.length > 0) {
            console.log('- Issues Found:');
            contentResult.issues_found.forEach(issue => {
                console.log(`  * [${issue.severity}] ${issue.type}: ${issue.message}`);
            });
        } else {
            console.log('- No issues found');
        }
    } catch (error) {
        console.log(`✗ Content check failed: ${error.message}`);
    }

    // Test 5: Run a full check on Pierre Ford
    console.log('\n5. Running full monitoring check on Pierre Ford...');
    const pierreFordProfile = {
        id: '1753052736905',
        dealer_name: 'Pierre Ford of Prosser',
        website_url: 'https://www.pierrefordofprosser.com/'
    };

    try {
        const fullCheckResult = await engine.runFullCheck(pierreFordProfile);
        console.log('\nFull Check Results:');
        console.log(`- Overall Status: ${fullCheckResult.overall_status}`);
        console.log(`- SSL Valid: ${fullCheckResult.ssl_valid}`);
        console.log(`- Inventory Count: ${fullCheckResult.inventory_count}`);
        console.log(`- Forms Working: ${fullCheckResult.forms_working}`);
        console.log(`- Response Time: ${fullCheckResult.response_time_ms}ms`);
        
        if (fullCheckResult.issues_found && fullCheckResult.issues_found.length > 0) {
            console.log('\nIssues Found:');
            fullCheckResult.issues_found.forEach(issue => {
                console.log(`  * [${issue.severity}] ${issue.type}: ${issue.message}`);
            });
        }
    } catch (error) {
        console.log(`✗ Full check failed: ${error.message}`);
    }

    console.log('\n=== Test Complete ===');
}

// Run tests
testMonitoringFixes().catch(console.error);