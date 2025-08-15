/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

#!/usr/bin/env node

/**
 * Completely remove a dealer from monitoring system
 * This removes the profile, all alerts, and all results
 */

const fs = require('fs').promises;
const path = require('path');

async function removeDealer(dealerName) {
    const dataDir = path.join(__dirname, 'data', 'monitoring');
    
    try {
        // Read all data files
        const profiles = JSON.parse(await fs.readFile(path.join(dataDir, 'profiles.json'), 'utf8'));
        const alerts = JSON.parse(await fs.readFile(path.join(dataDir, 'alerts.json'), 'utf8'));
        const results = JSON.parse(await fs.readFile(path.join(dataDir, 'results.json'), 'utf8'));
        
        // Find the profile to remove
        const profileToRemove = profiles.find(p => 
            p.dealer_name.toLowerCase().includes(dealerName.toLowerCase())
        );
        
        if (!profileToRemove) {
            console.log(`No profile found for dealer: ${dealerName}`);
            return;
        }
        
        console.log(`Found profile for ${profileToRemove.dealer_name} (ID: ${profileToRemove.id})`);
        
        // Remove profile
        const updatedProfiles = profiles.filter(p => p.id !== profileToRemove.id);
        console.log(`Removing profile...`);
        
        // Remove all alerts for this profile
        const alertsBefore = alerts.length;
        const updatedAlerts = alerts.filter(a => a.profile_id !== profileToRemove.id);
        const alertsRemoved = alertsBefore - updatedAlerts.length;
        console.log(`Removing ${alertsRemoved} alerts...`);
        
        // Remove all results for this profile
        const resultsBefore = results.length;
        const updatedResults = results.filter(r => r.profile_id !== profileToRemove.id);
        const resultsRemoved = resultsBefore - updatedResults.length;
        console.log(`Removing ${resultsRemoved} results...`);
        
        // Write back all files
        await fs.writeFile(path.join(dataDir, 'profiles.json'), JSON.stringify(updatedProfiles, null, 2));
        await fs.writeFile(path.join(dataDir, 'alerts.json'), JSON.stringify(updatedAlerts, null, 2));
        await fs.writeFile(path.join(dataDir, 'results.json'), JSON.stringify(updatedResults, null, 2));
        
        console.log(`\n✅ Successfully removed ${profileToRemove.dealer_name} from monitoring!`);
        console.log(`   - 1 profile removed`);
        console.log(`   - ${alertsRemoved} alerts removed`);
        console.log(`   - ${resultsRemoved} results removed`);
        
    } catch (error) {
        console.error('Error removing dealer:', error);
    }
}

// Get dealer name from command line
const dealerName = process.argv[2];

if (!dealerName) {
    console.log('Usage: node remove-dealer-completely.js "Dealer Name"');
    console.log('Example: node remove-dealer-completely.js "Fugate"');
    process.exit(1);
}

console.log(`Removing all data for dealer containing: "${dealerName}"`);
removeDealer(dealerName);