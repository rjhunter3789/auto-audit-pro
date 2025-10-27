#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function removeMonitoringSite() {
    try {
        console.log('\n🗑️  Auto Audit Pro - Website Monitoring Removal Tool\n');
        
        // Load monitoring profiles - check multiple possible locations
        let profilesPath = path.join(__dirname, 'data', 'monitoring', 'profiles.json');
        let profiles = [];
        
        // Try alternative path if first doesn't exist
        try {
            await fs.access(profilesPath);
        } catch {
            profilesPath = path.join(__dirname, 'data', 'monitoring-profiles.json');
        }
        
        try {
            const profilesData = await fs.readFile(profilesPath, 'utf8');
            profiles = JSON.parse(profilesData);
        } catch (error) {
            console.log('❌ No monitoring profiles found or error reading file.');
            return;
        }
        
        if (profiles.length === 0) {
            console.log('📭 No websites are currently being monitored.');
            return;
        }
        
        // Display all monitored websites
        console.log('📋 Currently Monitored Websites:\n');
        console.log('#'.padEnd(5) + 'Dealership'.padEnd(30) + 'URL'.padEnd(40) + 'Status');
        console.log('-'.repeat(85));
        
        profiles.forEach((profile, index) => {
            console.log(
                `${index + 1}`.padEnd(5) +
                (profile.dealerName || 'Unknown').padEnd(30) +
                (profile.url || 'No URL').padEnd(40) +
                (profile.isActive ? '✅ Active' : '⏸️  Paused')
            );
        });
        
        console.log('\n');
        const choice = await question('Enter the number of the website to remove (or "q" to quit): ');
        
        if (choice.toLowerCase() === 'q') {
            console.log('👋 Exiting without changes.');
            rl.close();
            return;
        }
        
        const index = parseInt(choice) - 1;
        
        if (isNaN(index) || index < 0 || index >= profiles.length) {
            console.log('❌ Invalid selection.');
            rl.close();
            return;
        }
        
        const selectedProfile = profiles[index];
        console.log(`\n⚠️  You are about to remove: ${selectedProfile.dealerName} (${selectedProfile.url})`);
        
        const confirm = await question('Are you sure? This will delete all monitoring history. (yes/no): ');
        
        if (confirm.toLowerCase() === 'yes') {
            // Create backup first
            const backupPath = profilesPath + '.backup-' + Date.now();
            await fs.writeFile(backupPath, JSON.stringify(profiles, null, 2));
            console.log(`📦 Backup created: ${path.basename(backupPath)}`);
            
            // Remove the profile
            const removedProfile = profiles.splice(index, 1)[0];
            
            // Save updated profiles
            await fs.writeFile(profilesPath, JSON.stringify(profiles, null, 2));
            
            // Also remove associated data
            const historyPath = path.join(__dirname, 'data', 'monitoring-history.json');
            const alertsPath = path.join(__dirname, 'data', 'monitoring-alerts.json');
            
            try {
                // Remove history entries
                const historyData = await fs.readFile(historyPath, 'utf8');
                let history = JSON.parse(historyData);
                history = history.filter(h => h.profileId !== removedProfile.id);
                await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
                
                // Remove alert entries
                const alertsData = await fs.readFile(alertsPath, 'utf8');
                let alerts = JSON.parse(alertsData);
                alerts = alerts.filter(a => a.profileId !== removedProfile.id);
                await fs.writeFile(alertsPath, JSON.stringify(alerts, null, 2));
                
            } catch (error) {
                console.log('⚠️  Warning: Could not clean up all associated data:', error.message);
            }
            
            console.log(`\n✅ Successfully removed ${selectedProfile.dealerName} from monitoring!`);
            console.log('📊 Remaining monitored websites:', profiles.length);
            
        } else {
            console.log('❌ Removal cancelled.');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        rl.close();
    }
}

removeMonitoringSite();