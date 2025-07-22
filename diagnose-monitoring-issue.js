#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function diagnoseMonitoring() {
    const dataDir = path.join(__dirname, 'data', 'monitoring');
    
    console.log('=== Monitoring System Diagnosis ===\n');
    
    try {
        // 1. Check profiles
        const profilesData = await fs.readFile(path.join(dataDir, 'profiles.json'), 'utf8');
        const profiles = JSON.parse(profilesData);
        console.log(`Profiles found: ${profiles.length}`);
        if (profiles.length > 0) {
            profiles.forEach(p => {
                console.log(`  - ID: ${p.id}, Name: ${p.dealer_name}, URL: ${p.website_url}`);
            });
        } else {
            console.log('  WARNING: No profiles found in profiles.json!');
        }
        
        // 2. Check alerts
        console.log('\nAlerts Analysis:');
        const alertsData = await fs.readFile(path.join(dataDir, 'alerts.json'), 'utf8');
        const alerts = JSON.parse(alertsData);
        console.log(`Total alerts: ${alerts.length}`);
        
        // Group alerts by profile ID
        const alertsByProfile = {};
        alerts.forEach(alert => {
            if (!alertsByProfile[alert.profile_id]) {
                alertsByProfile[alert.profile_id] = [];
            }
            alertsByProfile[alert.profile_id].push(alert);
        });
        
        console.log('\nAlerts by Profile ID:');
        Object.entries(alertsByProfile).forEach(([profileId, profileAlerts]) => {
            const criticalCount = profileAlerts.filter(a => a.alert_level === 'RED' && !a.resolved).length;
            const warningCount = profileAlerts.filter(a => a.alert_level === 'YELLOW' && !a.resolved).length;
            console.log(`  Profile ID ${profileId}: ${criticalCount} critical, ${warningCount} warnings`);
            
            // Show specific alerts
            profileAlerts.forEach(alert => {
                if (!alert.resolved) {
                    console.log(`    - [${alert.alert_level}] ${alert.alert_message}`);
                }
            });
        });
        
        // 3. Check results to infer profile information
        console.log('\nResults Analysis:');
        const resultsData = await fs.readFile(path.join(dataDir, 'results.json'), 'utf8');
        const results = JSON.parse(resultsData);
        
        // Get unique profile IDs from results
        const profileIdsFromResults = [...new Set(results.map(r => r.profile_id))];
        console.log(`Unique profile IDs found in results: ${profileIdsFromResults.length}`);
        profileIdsFromResults.forEach(id => {
            console.log(`  - Profile ID: ${id}`);
        });
        
        // 4. Cross-reference
        console.log('\nCross-Reference Analysis:');
        console.log('Profile IDs with alerts but no profile data:');
        Object.keys(alertsByProfile).forEach(profileId => {
            const profileExists = profiles.some(p => p.id == profileId);
            if (!profileExists) {
                console.log(`  - Profile ID ${profileId} has alerts but no profile entry!`);
            }
        });
        
        // 5. Recommendations
        console.log('\n=== Recommendations ===');
        if (profiles.length === 0 && Object.keys(alertsByProfile).length > 0) {
            console.log('CRITICAL: Profile data is missing but alerts exist!');
            console.log('This explains why the dashboard shows RED status but no alerts.');
            console.log('\nPossible solutions:');
            console.log('1. Restore profiles.json from a backup');
            console.log('2. Recreate the profile entries based on alert data');
            console.log('3. Clear alerts.json and start fresh');
            
            // Try to infer profile information
            console.log('\nBased on the alerts, here are the missing profiles:');
            if (alertsByProfile['1753052736904']) {
                console.log('  - Profile ID 1753052736904: Has SSL certificate issues');
            }
            if (alertsByProfile['1753052736903']) {
                console.log('  - Profile ID 1753052736903: Has load time issues (possibly Mullinax Ford)');
            }
        }
        
    } catch (error) {
        console.error('Error during diagnosis:', error);
    }
}

// Run diagnosis
diagnoseMonitoring().catch(console.error);