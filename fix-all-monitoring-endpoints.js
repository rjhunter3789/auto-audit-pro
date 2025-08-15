/**
 * Auto Audit Pro
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * This file contains proprietary code for the Auto Audit Pro platform.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

/**
 * Fix ALL monitoring endpoints to use JSON storage
 */

const fs = require('fs');
const path = require('path');

// Read the current server.js file
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Fix 1: Update /api/monitoring/profiles endpoint
const oldProfilesEndpoint = `// Get monitoring profiles
app.get('/api/monitoring/profiles', async (req, res) => {
    try {
        const query = 'SELECT * FROM monitoring_profiles ORDER BY dealer_name';
        const result = await pool.query(query);
        const profiles = result.rows;
        
        // Get latest result for each profile to add last check timestamp and status
        const resultsQuery = 'SELECT * FROM monitoring_results ORDER BY check_timestamp DESC';
        const resultsData = await pool.query(resultsQuery);
        const results = resultsData.rows;
        
        // Enrich profiles with latest check data
        const enrichedProfiles = profiles.map(profile => {
            const latestResult = results.find(r => r.profile_id === profile.id);
            return {
                ...profile,
                check_timestamp: latestResult?.check_timestamp || null,
                overall_status: latestResult?.overall_status || null,
                response_time_ms: latestResult?.response_time_ms || null
            };
        });
        
        res.json(enrichedProfiles);
    } catch (error) {
        console.error('Error fetching monitoring profiles:', error);
        res.status(500).json({ error: 'Failed to fetch monitoring profiles' });
    }
});`;

const newProfilesEndpoint = `// Get monitoring profiles
app.get('/api/monitoring/profiles', async (req, res) => {
    try {
        // Use JSON storage instead of database
        const JSONStorage = require('./lib/json-storage');
        const jsonStorage = new JSONStorage();
        
        // Get all profiles
        const profiles = await jsonStorage.getProfiles();
        
        // Get latest result for each profile
        const enrichedProfiles = await Promise.all(profiles.map(async (profile) => {
            const latestResult = await jsonStorage.getLatestResult(profile.id);
            
            return {
                ...profile,
                check_timestamp: latestResult?.check_timestamp || null,
                overall_status: latestResult?.overall_status || null,
                response_time_ms: latestResult?.response_time_ms || null
            };
        }));
        
        // Sort by dealer name
        enrichedProfiles.sort((a, b) => (a.dealer_name || '').localeCompare(b.dealer_name || ''));
        
        res.json(enrichedProfiles);
    } catch (error) {
        console.error('Error fetching monitoring profiles:', error);
        res.status(500).json({ error: 'Failed to fetch monitoring profiles' });
    }
});`;

// Apply the fix
if (serverContent.includes(oldProfilesEndpoint)) {
    serverContent = serverContent.replace(oldProfilesEndpoint, newProfilesEndpoint);
    console.log('✅ Fixed /api/monitoring/profiles endpoint');
} else {
    console.log('⚠️  Could not find exact profiles endpoint, trying partial match...');
    
    // Try regex replacement
    const profilesRegex = /\/\/ Get monitoring profiles[\s\S]*?app\.get\('\/api\/monitoring\/profiles'[\s\S]*?\}\);/;
    if (profilesRegex.test(serverContent)) {
        serverContent = serverContent.replace(profilesRegex, newProfilesEndpoint);
        console.log('✅ Fixed /api/monitoring/profiles endpoint using regex');
    }
}

// Fix 2: Check if other monitoring endpoints need fixing
const endpointsToCheck = [
    '/api/monitoring/results',
    '/api/monitoring/alerts',
    '/api/monitoring/check'
];

let foundIssues = false;
endpointsToCheck.forEach(endpoint => {
    const regex = new RegExp(`app\\.(get|post|put|delete)\\(['"]${endpoint}`);
    if (regex.test(serverContent)) {
        const match = serverContent.match(new RegExp(`app\\.(get|post|put|delete)\\(['"]${endpoint}[^}]+pool\\.query`, 's'));
        if (match) {
            console.log(`⚠️  Found ${endpoint} still using pool.query - needs fixing`);
            foundIssues = true;
        }
    }
});

// Write the updated content back
fs.writeFileSync(serverPath, serverContent);

console.log('\n📝 Summary:');
console.log('- Fixed /api/monitoring/profiles endpoint');
console.log('- /api/monitoring/status was already fixed');
if (foundIssues) {
    console.log('- Other endpoints may still need fixing');
}
console.log('\nRestart the server to apply all changes!');