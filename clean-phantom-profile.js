/**
 * Clean up phantom Price Ford profile that shouldn't exist
 * Run this to remove any monitoring profiles that were supposed to be deleted
 */

const fs = require('fs').promises;
const path = require('path');

async function cleanPhantomProfile() {
    try {
        // Check if profiles.json exists and has phantom entries
        const profilesPath = path.join(__dirname, 'data', 'monitoring', 'profiles.json');
        const profilesData = await fs.readFile(profilesPath, 'utf8');
        const profiles = JSON.parse(profilesData);
        
        console.log(`Found ${profiles.length} profiles before cleanup`);
        
        if (profiles.length > 0) {
            // Save backup first
            await fs.writeFile(profilesPath + '.backup', profilesData);
            console.log('Created backup at profiles.json.backup');
            
            // Clear all profiles (since user deleted all from UI)
            await fs.writeFile(profilesPath, '[]');
            console.log('Cleared all phantom profiles');
            
            // Also clean up orphaned results and alerts
            const resultsPath = path.join(__dirname, 'data', 'monitoring', 'results.json');
            const alertsPath = path.join(__dirname, 'data', 'monitoring', 'alerts.json');
            
            // Clear results and alerts too
            await fs.writeFile(resultsPath, '[]');
            await fs.writeFile(alertsPath, '[]');
            
            console.log('Cleaned up all monitoring data');
            console.log('✅ Phantom profiles removed successfully');
        } else {
            console.log('No profiles found - already clean');
        }
        
    } catch (error) {
        console.error('Error cleaning phantom profile:', error);
    }
}

// Run the cleanup
cleanPhantomProfile();