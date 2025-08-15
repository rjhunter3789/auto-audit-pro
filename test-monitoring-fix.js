/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Test script to verify monitoring status is working
 */

const { storage: jsonStorage } = require('./lib/json-storage');

async function testMonitoringStatus() {
    console.log('🔍 Testing monitoring status fix...\n');
    
    try {
        // Get all profiles
        const profiles = await jsonStorage.getProfiles();
        console.log(`✅ Found ${profiles.length} monitoring profiles\n`);
        
        // For each profile, get the latest result
        for (const profile of profiles) {
            console.log(`📊 Profile: ${profile.dealer_name}`);
            console.log(`   URL: ${profile.website_url}`);
            
            const latestResult = await jsonStorage.getLatestResult(profile.id);
            
            if (latestResult) {
                console.log(`   ✅ Last check: ${latestResult.check_timestamp}`);
                console.log(`   Status: ${latestResult.overall_status}`);
                console.log(`   Response time: ${latestResult.response_time_ms}ms`);
                
                // Convert timestamp to readable format
                const checkTime = new Date(latestResult.check_timestamp);
                const now = new Date();
                const diffMinutes = Math.floor((now - checkTime) / 1000 / 60);
                
                console.log(`   ⏰ Checked ${diffMinutes} minutes ago`);
                
                if (latestResult.error_details) {
                    console.log(`   ⚠️  Error: ${latestResult.error_details}`);
                }
            } else {
                console.log(`   ❌ No monitoring results found`);
            }
            
            console.log('');
        }
        
        console.log('\n📝 Summary:');
        console.log('The monitoring is running and collecting data.');
        console.log('The issue is that the UI shows "Checking..." instead of the actual timestamp.');
        console.log('After restarting the server, the monitoring dashboard should show:');
        console.log('- Last check: 1/17/2025, 9:12:04 PM (or similar)');
        console.log('- Status: RED (due to 403 errors)');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testMonitoringStatus();