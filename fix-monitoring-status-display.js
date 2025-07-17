/**
 * Fix for monitoring status display
 * Updates the /api/monitoring/status endpoint to use JSON storage
 */

const fs = require('fs');
const path = require('path');

// Read the current server.js file
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Find the /api/monitoring/status endpoint and replace it
const oldEndpoint = `// Get current status for all profiles
app.get('/api/monitoring/status', async (req, res) => {
    try {
        const query = \`
            SELECT 
                p.*,
                r.overall_status,
                r.check_timestamp,
                r.response_time_ms,
                r.issues_found
            FROM monitoring_profiles p
            LEFT JOIN LATERAL (
                SELECT * FROM monitoring_results 
                WHERE profile_id = p.id 
                ORDER BY check_timestamp DESC 
                LIMIT 1
            ) r ON true
            ORDER BY p.dealer_name\`;
        
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching monitoring status:', error);
        res.status(500).json({ error: 'Failed to fetch monitoring status' });
    }
});`;

const newEndpoint = `// Get current status for all profiles
app.get('/api/monitoring/status', async (req, res) => {
    try {
        // Use JSON storage instead of database
        const JSONStorage = require('./lib/json-storage');
        const jsonStorage = new JSONStorage();
        
        // Get all profiles
        const profiles = await jsonStorage.getProfiles();
        
        // Get latest result for each profile
        const profilesWithStatus = await Promise.all(profiles.map(async (profile) => {
            const latestResult = await jsonStorage.getLatestResult(profile.id);
            
            return {
                ...profile,
                overall_status: latestResult ? latestResult.overall_status : 'PENDING',
                check_timestamp: latestResult ? latestResult.check_timestamp : null,
                response_time_ms: latestResult ? latestResult.response_time_ms : null,
                issues_found: latestResult ? latestResult.issues_found : []
            };
        }));
        
        // Sort by dealer name
        profilesWithStatus.sort((a, b) => (a.dealer_name || '').localeCompare(b.dealer_name || ''));
        
        res.json(profilesWithStatus);
    } catch (error) {
        console.error('Error fetching monitoring status:', error);
        res.status(500).json({ error: 'Failed to fetch monitoring status' });
    }
});`;

// Check if the old endpoint exists
if (serverContent.includes(oldEndpoint)) {
    // Replace the old endpoint with the new one
    serverContent = serverContent.replace(oldEndpoint, newEndpoint);
    
    // Write the updated content back
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Successfully updated /api/monitoring/status endpoint to use JSON storage');
} else {
    console.log('⚠️  Could not find the exact endpoint to replace. Searching for a partial match...');
    
    // Try to find and replace a partial match
    const statusEndpointRegex = /\/\/ Get current status for all profiles[\s\S]*?app\.get\('\/api\/monitoring\/status'[\s\S]*?\}\);/;
    
    if (statusEndpointRegex.test(serverContent)) {
        serverContent = serverContent.replace(statusEndpointRegex, newEndpoint);
        fs.writeFileSync(serverPath, serverContent);
        console.log('✅ Successfully updated /api/monitoring/status endpoint using regex match');
    } else {
        console.log('❌ Could not find the monitoring status endpoint. Please update manually.');
    }
}

console.log('\n📝 Next steps:');
console.log('1. Restart the server to apply changes');
console.log('2. The monitoring dashboard should now show the correct last check times');
console.log('3. Check data/monitoring/results.json to verify monitoring is running');