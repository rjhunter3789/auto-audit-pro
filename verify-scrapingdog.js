/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Quick verification script for ScrapingDog configuration
 */

console.log('=== ScrapingDog Configuration Check ===\n');

// 1. Check environment variable
require('dotenv').config();
const apiKey = process.env.SCRAPINGDOG_API_KEY;
console.log('1. Environment Variable Check:');
console.log('   SCRAPINGDOG_API_KEY:', apiKey ? `✓ Set (${apiKey.substring(0,10)}...)` : '✗ Missing');

// 2. Check ScrapingDog wrapper
const ScrapingDogWrapper = require('./lib/scrapingdog-wrapper');
const wrapper = new ScrapingDogWrapper();
console.log('\n2. ScrapingDog Wrapper Check:');
console.log('   Has API Key:', wrapper.hasApiKey() ? '✓ Yes' : '✗ No');
console.log('   API Key value:', wrapper.apiKey ? `${wrapper.apiKey.substring(0,10)}...` : 'None');

// 3. Check monitoring engine configuration
const MonitoringEngine = require('./lib/monitoring-engine');
const engine = new MonitoringEngine();
console.log('\n3. Monitoring Engine Check:');
console.log('   Stats loaded:', engine.monitoringStats);

// 4. Check recent results for scraping method
const fs = require('fs');
const resultsPath = './data/monitoring/results.json';
if (fs.existsSync(resultsPath)) {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const recentResults = results.slice(-5);
    console.log('\n4. Recent Results Check:');
    recentResults.forEach(r => {
        console.log(`   ${new Date(r.check_timestamp).toLocaleString()} - Method: ${r.scraping_method || 'unknown'}`);
    });
}

// 5. Check if code has ScrapingDog enabled by default
const engineCode = fs.readFileSync('./lib/monitoring-engine.js', 'utf8');
const hasDefaultEnabled = engineCode.includes('useScrapingDogByDefault = true');
console.log('\n5. Code Configuration:');
console.log('   ScrapingDog enabled by default:', hasDefaultEnabled ? '✓ Yes' : '✗ No');

console.log('\n=== Summary ===');
if (apiKey && wrapper.hasApiKey() && hasDefaultEnabled) {
    console.log('✅ ScrapingDog is properly configured and should be working!');
    console.log('   If not seeing usage, the production server needs to be restarted/redeployed.');
} else {
    console.log('❌ ScrapingDog configuration issues found!');
    if (!apiKey) console.log('   - Missing SCRAPINGDOG_API_KEY environment variable');
    if (!wrapper.hasApiKey()) console.log('   - Wrapper cannot access API key');
    if (!hasDefaultEnabled) console.log('   - ScrapingDog not enabled by default in code');
}