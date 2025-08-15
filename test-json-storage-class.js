/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Test JSON Storage class construction
 */

console.log('Testing JSON Storage...\n');

try {
    // Test 1: Check if json-storage module exists
    const jsonStorageModule = require('./lib/json-storage');
    console.log('✅ json-storage module loaded');
    console.log('Module exports:', Object.keys(jsonStorageModule));
    
    // Test 2: Check if we can access storage
    const { storage } = jsonStorageModule;
    if (storage) {
        console.log('✅ storage object exists');
        
        // Test 3: Try to get profiles
        storage.getProfiles().then(profiles => {
            console.log(`✅ getProfiles() works - found ${profiles.length} profiles`);
        }).catch(err => {
            console.log('❌ getProfiles() error:', err.message);
        });
    } else {
        console.log('❌ storage object not found in exports');
    }
    
    // Test 4: Check if JSONStorage is a class
    if (jsonStorageModule.JSONStorage) {
        console.log('✅ JSONStorage class exists');
        try {
            const instance = new jsonStorageModule.JSONStorage();
            console.log('✅ Can create JSONStorage instance');
        } catch (err) {
            console.log('❌ Cannot create JSONStorage instance:', err.message);
        }
    } else {
        console.log('❌ JSONStorage class not exported');
    }
    
} catch (error) {
    console.error('❌ Error loading json-storage:', error);
}

console.log('\n💡 The issue is likely that JSONStorage is not exported as a class.');
console.log('The module exports a pre-created "storage" instance instead.');