/**
 * Recovery script to recreate missing monitoring profiles from existing alerts
 */

const fs = require('fs').promises;
const path = require('path');

async function recoverProfiles() {
    const profilesPath = path.join(__dirname, 'data/monitoring/profiles.json');
    const alertsPath = path.join(__dirname, 'data/monitoring/alerts.json');
    const resultsPath = path.join(__dirname, 'data/monitoring/results.json');
    
    try {
        // Read existing data
        const profiles = JSON.parse(await fs.readFile(profilesPath, 'utf8'));
        const alerts = JSON.parse(await fs.readFile(alertsPath, 'utf8'));
        const results = JSON.parse(await fs.readFile(resultsPath, 'utf8'));
        
        console.log('Current state:');
        console.log('- Profiles:', profiles.length);
        console.log('- Alerts:', alerts.length);
        console.log('- Results:', results.length);
        
        // Find unique profile IDs from alerts
        const profileIdsFromAlerts = [...new Set(alerts.map(a => a.profile_id))];
        console.log('\nProfile IDs found in alerts:', profileIdsFromAlerts);
        
        // Find missing profiles
        const existingProfileIds = profiles.map(p => p.id);
        const missingProfileIds = profileIdsFromAlerts.filter(id => !existingProfileIds.includes(id));
        
        if (missingProfileIds.length === 0) {
            console.log('\nNo missing profiles found!');
            return;
        }
        
        console.log('\nMissing profile IDs:', missingProfileIds);
        
        // Try to recover profile info from results
        const recoveredProfiles = [];
        
        for (const profileId of missingProfileIds) {
            // Find the most recent result for this profile
            const profileResults = results
                .filter(r => r.profile_id === profileId)
                .sort((a, b) => new Date(b.check_timestamp) - new Date(a.check_timestamp));
            
            if (profileResults.length > 0) {
                const latestResult = profileResults[0];
                
                // Try to guess dealer name from URL
                let dealerName = 'Unknown Dealer';
                if (profileId === 1753052736903) {
                    dealerName = 'Mullinax Ford'; // Based on screenshot
                } else if (profileId === 1753052736904) {
                    dealerName = 'Fugate Ford'; // Based on previous data
                } else if (profileId === 1753052736905) {
                    dealerName = 'Pierre Ford of Prosser'; // Based on previous data
                }
                
                // Try to find URL from any result that has a response
                let websiteUrl = '';
                for (const result of profileResults) {
                    if (result.http_status_code && result.http_status_code !== 403) {
                        // This result likely has the URL in its data
                        break;
                    }
                }
                
                // Based on the profile IDs and previous patterns
                if (profileId === 1753052736903) {
                    websiteUrl = 'https://www.mullinaxfordolympia.com/';
                } else if (profileId === 1753052736904) {
                    websiteUrl = 'https://www.fugateford.net/';
                } else if (profileId === 1753052736905) {
                    websiteUrl = 'https://www.pierrefordofprosser.com/';
                }
                
                const recoveredProfile = {
                    id: profileId,
                    dealer_id: profileId.toString(),
                    dealer_name: dealerName,
                    website_url: websiteUrl,
                    contact_email: 'nakapaahu@gmail.com', // Default from previous data
                    alert_email: 'nakapaahu@gmail.com',
                    alert_phone: null,
                    alert_preferences: {
                        email: true,
                        sms: false
                    },
                    check_frequency: 59,
                    monitoring_enabled: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    last_check: latestResult.check_timestamp
                };
                
                recoveredProfiles.push(recoveredProfile);
                console.log(`\nRecovered profile for ${dealerName}:`, recoveredProfile);
            }
        }
        
        if (process.argv.includes('--execute')) {
            // Add recovered profiles to existing profiles
            const updatedProfiles = [...profiles, ...recoveredProfiles];
            
            // Save updated profiles
            await fs.writeFile(profilesPath, JSON.stringify(updatedProfiles, null, 2));
            console.log(`\n✅ Successfully recovered ${recoveredProfiles.length} profiles!`);
            console.log('The monitoring dashboard should now display the alerts correctly.');
        } else {
            console.log('\n⚠️  DRY RUN - No changes made');
            console.log('Run with --execute flag to actually recover the profiles:');
            console.log('  node recover-profiles.js --execute');
        }
        
    } catch (error) {
        console.error('Error recovering profiles:', error);
    }
}

// Run the recovery
recoverProfiles();