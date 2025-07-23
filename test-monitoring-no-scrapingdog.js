/**
 * Test monitoring engine without ScrapingDog
 */

const MonitoringEngine = require('./lib/monitoring-engine');

async function testMonitoring() {
    console.log('Testing monitoring engine without ScrapingDog...\n');
    
    const engine = new MonitoringEngine();
    
    // Test URL
    const testUrl = 'https://www.example.com';
    
    console.log(`Testing connectivity for ${testUrl}:`);
    
    try {
        // Test connectivity check
        const connectivityResult = await engine.checkConnectivity(testUrl);
        console.log('Connectivity Result:', connectivityResult);
        
        // Test SSL check
        const sslResult = await engine.checkSSLCertificate(testUrl);
        console.log('SSL Result:', sslResult);
        
        // Test content check
        const contentResult = await engine.checkContent(testUrl);
        console.log('Content Check Result:', {
            has_forms: contentResult.has_forms,
            has_phone_numbers: contentResult.has_phone_numbers,
            form_count: contentResult.form_count,
            issues: contentResult.issues
        });
        
        console.log('\n✅ Monitoring engine working without ScrapingDog!');
        
    } catch (error) {
        console.error('❌ Error during monitoring test:', error.message);
    }
}

// Run the test
testMonitoring();